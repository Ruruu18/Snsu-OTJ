# Language Detection Module
# Detects: English and Tagalog only
# Uses keyword scoring — no external APIs, 100% local

class LanguageDetector:
    """
    Detects whether a user message is in English or Tagalog.
    Uses weighted keyword frequency scoring.
    """

    LANGUAGES = {
        'en': {
            'name': 'English',
            'markers': [
                'the', 'is', 'are', 'what', 'how', 'where', 'when', 'who',
                'need', 'want', 'can', 'get', 'my', 'your', 'please', 'help',
                'do', 'does', 'will', 'would', 'have', 'has', 'for', 'with',
                'this', 'that', 'there', 'here', 'from', 'about', 'permit',
                'certificate', 'tax', 'office', 'requirements', 'schedule',
                'hello', 'hi', 'thanks', 'thank', 'good', 'morning', 'afternoon'
            ],
            'strong_markers': [
                'requirements', 'certificate', 'schedule', 'application',
                'please', 'would', 'could', 'should'
            ]
        },
        'tl': {
            'name': 'Tagalog',
            'markers': [
                'ang', 'ng', 'mga', 'ko', 'mo', 'sa', 'po', 'opo', 'naman',
                'paano', 'saan', 'ano', 'sino', 'kailan', 'bakit', 'magkano',
                'gusto', 'kailangan', 'puwede', 'pwede', 'kumuha', 'bayad',
                'opisina', 'tanong', 'tulungan', 'mabuhay', 'salamat',
                'magandang', 'umaga', 'hapon', 'gabi', 'araw', 'oras',
                'ako', 'ikaw', 'siya', 'kami', 'tayo', 'sila',
                'dito', 'doon', 'nito', 'niyan', 'noon', 'yung', 'yong',
                'hindi', 'oo', 'wala', 'may', 'meron', 'din', 'rin',
                'lang', 'lamang', 'ba', 'na', 'pa', 'pala', 'nang'
            ],
            'strong_markers': [
                'po', 'opo', 'paano', 'magkano', 'kailangan', 'puwede',
                'magandang', 'salamat', 'mabuhay', 'kumuha', 'bayaran'
            ]
        }
    }

    @classmethod
    def detect(cls, text):
        """
        Detect language from text. Returns 'en' or 'tl'.
        """
        text_lower = text.lower()
        words = set(text_lower.replace(',', ' ').replace('.', ' ').replace('?', ' ').replace('!', ' ').split())

        scores = {}
        for lang_code, lang_data in cls.LANGUAGES.items():
            score = 0
            for marker in lang_data['markers']:
                if marker in words:
                    score += 1
                elif len(marker) > 3 and marker in text_lower:
                    score += 0.5

            for marker in lang_data['strong_markers']:
                if marker in words:
                    score += 2
                elif len(marker) > 3 and marker in text_lower:
                    score += 1

            scores[lang_code] = score

        if max(scores.values()) == 0:
            return 'en'

        # Prefer Tagalog on tie (local user base)
        if scores['tl'] >= scores['en']:
            return 'tl'
        return 'en'

    @classmethod
    def get_language_name(cls, code):
        return cls.LANGUAGES.get(code, {}).get('name', 'English')
