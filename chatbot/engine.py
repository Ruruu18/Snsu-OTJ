import difflib
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

    def process_message(self, message, context=None):
        """
        Process a user message and return (response_text, new_context).
        context = { 'lang': 'en'|'tl'|'ceb'|'sgd', 'category': str|None }
        """
        if context is None:
            context = {}

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

        # 4. Intent matching
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
