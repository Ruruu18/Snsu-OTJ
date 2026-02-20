import difflib
import requests
import json
from .knowledge import KNOWLEDGE_BASE, RESPONSES
from .languages import LanguageDetector


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
        """Fetch current weather using open-meteo API for real-time local data"""
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation,weather_code"
            resp = requests.get(url, timeout=6)
            
            if resp.status_code == 200:
                data = resp.json()
                curr = data["current"]
                
                temp = curr["temperature_2m"]
                precip = curr["precipitation"]
                code = curr["weather_code"]
                
                location_name = "Surigao" if str(lat).startswith("9.7") else "your exact location"
                
                # WMO Weather Codes mapping
                if code in [0, 1]:
                    desc = "Clear sky"
                    theme = "clear"
                elif code in [2, 3, 45, 48]:
                    desc = "Cloudy and overcast"
                    theme = "cloudy"
                elif code in [51, 53, 55, 56, 57]:
                    desc = "Drizzle"
                    theme = "rain"
                elif code in [61, 63, 65, 66, 67, 80, 81, 82]:
                    desc = "Rain showers"
                    theme = "rain"
                elif code in [95, 96, 99]:
                    desc = "Thunderstorms"
                    theme = "rain"
                else:
                    desc = "Variable"
                    theme = "cloudy"

                from datetime import datetime
                hour = datetime.now().hour
                if (hour < 6 or hour >= 18) and theme == "clear":
                    theme = "night"
                
                return f"Current LIVE Weather in {location_name}: {temp}°C, {desc}. Precipitation: {precip}mm.", theme
        except Exception as e:
            print(f"Weather API failed: {e}")
        return "Weather unavailable at the moment.", "clear"

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

        live_weather_str, current_theme = self.get_live_weather(user_lat, user_lon)
        
        weather_keywords = ['weather', 'rain', 'sun', 'temperature', 'panahon', 'ulan', 'init', 'bagyo', 'forecast']
        if any(w in message_lower for w in weather_keywords):
            context['weather_theme'] = current_theme
        else:
            context.pop('weather_theme', None)

        ollama_response = self._ask_ollama(history, lang, live_weather_str)
        if ollama_response:
            return ollama_response, context

        if any(w in message_lower for w in weather_keywords):
            return live_weather_str, context

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

    def _ask_ollama(self, history, lang, live_weather):
        """
        Send the message history to local Ollama instance using the /api/chat endpoint.
        """
        url = "http://localhost:11434/api/chat"
        
        # Build a strict system prompt using our KNOWLEDGE_BASE
        system_prompt = (
            "You are the LGU Prime Assistant, an official Philippine government chatbot. "
            f"Please respond in this language code: '{lang}' (e.g. 'en' for English, 'tl' for Tagalog/Filipino). "
            "CRITICAL INSTRUCTION: You already have the REAL-TIME LIVE WEATHER DATA provided below. "
            "You MUST use this provided data to answer any weather questions. "
            "NEVER apologize or say you cannot access servers, because the data is already given to you here: \n"
            f"[LIVE WEATHER DATA]: {live_weather}\n\n"
            "Use the following knowledge base to answer other questions. "
            "Do NOT make up any requirements. Keep your answer brief, warm, and conversational. "
            "If the answer is not in the knowledge base or weather data, just say you don't have that information.\n\n"
            "KNOWLEDGE BASE:\n"
        )
        
        for category, data in self.knowledge.items():
            info = data['responses']['en']
            system_prompt += f"--- {category.upper()} ---\n{info}\n\n"
            
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
            
        payload = {
            "model": "llama3.2",  # Small, fast model
            "messages": messages,
            "stream": False
        }
        
        try:
            # Short timeout so it falls back to keyword matching quickly if Ollama isn't running
            response = requests.post(url, json=payload, timeout=8)
            if response.status_code == 200:
                result = response.json()
                return result.get("message", {}).get("content", "").strip()
        except requests.exceptions.RequestException as e:
            print(f"[Ollama] Connection bypassed (Ollama not running or model loading): {e}")
            
        return None
