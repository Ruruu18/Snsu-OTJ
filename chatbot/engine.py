import difflib
import json
import urllib.request
import urllib.parse
import urllib.error
from .knowledge import KNOWLEDGE_BASE, RESPONSES
from .languages import LanguageDetector

# Prefer the 'requests' package if available, otherwise provide a minimal compatible fallback
try:
    import requests  # type: ignore
    from requests.exceptions import RequestException as RequestsRequestException  # type: ignore
    _HAS_REQUESTS = True
except Exception:
    requests = None
    class RequestsRequestException(Exception):
        pass
    _HAS_REQUESTS = False

def _requests_get(url, timeout=6):
    if _HAS_REQUESTS:
        return requests.get(url, timeout=timeout)
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.getcode()
            body = resp.read().decode('utf-8')
            class Resp:
                status_code = status
                _text = body
                def json(self):
                    return json.loads(self._text)
                @property
                def text(self):
                    return self._text
            return Resp()
    except urllib.error.URLError as e:
        raise RequestsRequestException(e)

def _requests_post(url, json=None, timeout=8):
    if _HAS_REQUESTS:
        return requests.post(url, json=json, timeout=timeout)
    import json as _json
    data = _json.dumps(json).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.getcode()
            body = resp.read().decode('utf-8')
            class Resp:
                status_code = status
                _text = body
                def json(self):
                    return _json.loads(self._text)
                @property
                def text(self):
                    return self._text
            return Resp()
    except urllib.error.URLError as e:
        raise RequestsRequestException(e)


class ChatbotEngine:
    """
    Multilingual LGU Chatbot Engine
    - Detects language (EN, TL, CEB, SGD)
    - Matches intent via keyword + fuzzy scoring
    - Responds in the user's detected language
    - Tracks language preference per session
    """

    def __init__(self):
        self.knowledge = KNOWLEDGE_BASE
        self.responses = RESPONSES
        self.threshold = 0.55

    def get_live_weather(self, lat, lon):
        """Fetch current exact weather using wttr.in which pulls from local airport/terminal data"""
        try:
            # Default to Surigao if coords match or if location was denied
            location_query = f"{lat},{lon}"
            if str(lat).startswith("9.7") and str(lon).startswith("125.5"):
                location_query = "Surigao"
                
            url = f"https://wttr.in/{location_query}?format=j1"
            resp = _requests_get(url, timeout=6)
            
            if resp.status_code == 200:
                data = resp.json()
                curr = data["current_condition"][0]
                
                temp = curr["temp_C"]
                desc = curr["weatherDesc"][0]["value"]
                precip = curr["precipMM"]
                
                location_name = location_query if location_query == "Surigao" else "your exact location"
                
                return f"Current LIVE Weather in {location_name}: {temp}°C, {desc}. Precipitation: {precip}mm."
        except Exception as e:
            print(f"Weather API failed: {e}")
        return "Weather unavailable at the moment."

    def process_message(self, message, context=None, history=None):
        """
        Process a user message and return (response_text, new_context).
        context = { 'lang': 'en'|'tl'|'ceb'|'sgd', 'category': str|None }
        history = list of previous messages [{'role':'user', 'content':'...'}, ...]
        """
        if context is None:
            context = {}
        if history is None:
            history = [{"role": "user", "content": message}]

        message_lower = message.lower().strip()

        # 1. Detect language
        detected_lang = LanguageDetector.detect(message)

        # Use session language if detection is ambiguous (short messages)
        if len(message_lower.split()) <= 2 and 'lang' in context:
            detected_lang = context['lang']

        context['lang'] = detected_lang
        lang = detected_lang

        # 2. Check greetings
        greeting_words = {
            'en': ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
            'tl': ['kumusta', 'mabuhay', 'magandang', 'kamusta'],
            'ceb': ['kumusta', 'maayong', 'maayo', 'hello'],
            'sgd': ['kumusta', 'maupay', 'hello', 'maupay nga']
        }
        for greet_lang, words in greeting_words.items():
            if any(w in message_lower for w in words):
                lang = greet_lang if greet_lang != 'en' else detected_lang
                context['lang'] = lang
                return self.responses['greeting'].get(lang, self.responses['greeting']['en']), context

        # 3. Check thanks
        thanks_words = ['thanks', 'thank you', 'salamat', 'daghang salamat']
        if any(w in message_lower for w in thanks_words):
            return self.responses['thanks'].get(lang, self.responses['thanks']['en']), context

        # Try Local AI (Ollama) first
        # Extract lat/lon from context, default to Surigao City coords (9.7500, 125.5000)
        user_lat = context.get('lat', '9.7500')
        user_lon = context.get('lon', '125.5000')
        ollama_response = self._ask_ollama(history, lang, user_lat, user_lon)
        if ollama_response:
            return ollama_response, context

        # 4. Intent matching (Fallback if Ollama is down)
        best_match = None
        best_score = 0
        matched_category = None

        for category, data in self.knowledge.items():
            score = 0

            # Keyword exact match (strongest signal)
            for keyword in data['keywords']:
                if keyword in message_lower:
                    score += 3

            # Topic fuzzy match
            for topic in data['topics']:
                ratio = difflib.SequenceMatcher(None, message_lower, topic).ratio()
                if ratio > 0.6:
                    score += ratio * 2

            if score > best_score:
                best_score = score
                best_match = data['responses'].get(lang, data['responses']['en'])
                matched_category = category

        if best_score >= 1.0:
            context['category'] = matched_category
            return best_match, context

        # 5. Fallback
        return self.responses['fallback'].get(lang, self.responses['fallback']['en']), context

    def _ask_ollama(self, history, lang, lat, lon):
        """
        Send the message history to local Ollama instance using the /api/chat endpoint.
        """
        url = "http://192.168.43.92:11434/api/chat"
        
        # Get live weather dynamically
        live_weather = self.get_live_weather(lat, lon)
        
        # Build a strict system prompt using our KNOWLEDGE_BASE
        system_prompt = (
            "You are the LGU Prime Assistant, an official Philippine government chatbot. "
            f"Please respond in this language code: '{lang}' (e.g. 'en' for English, 'tl' for Tagalog/Filipino). "
            f"{live_weather} "
            "Use the following knowledge base to answer the user's question accurately. "
            "Do NOT make up any requirements, steps, or fees. Keep your answer brief and conversational. "
            "If the answer is not in the knowledge base, just say you don't have that information.\n\n"
            "KNOWLEDGE BASE:\n"
        )
        
        for category, data in self.knowledge.items():
            info = data['responses']['en']
            system_prompt += f"--- {category.upper()} ---\n{info}\n\n"
            
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
            
        payload = {
            "model": "qwen2.5:3b",  # Small, fast model
            "messages": messages,
            "stream": False
        }
        
        try:
            # Short timeout so it falls back to keyword matching quickly if Ollama isn't running
            response = _requests_post(url, json=payload, timeout=8)
            if response.status_code == 200:
                result = response.json()
                return result.get("message", {}).get("content", "").strip()
        except RequestsRequestException as e:
            print(f"[Ollama] Connection bypassed (Ollama not running or model loading): {e}")
            
        return None
