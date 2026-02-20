from flask import Flask, render_template, request, jsonify, session, Response
import secrets
import asyncio
import io
import re
import edge_tts
from chatbot.engine import ChatbotEngine

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
bot = ChatbotEngine()

# ─── Edge-TTS Voice Configuration (FREE — no API key needed) ───
# Filipino voices:  fil-PH-BlessicaNeural (female), fil-PH-AngeloNeural (male)
# English PH:       en-PH-RosaNeural (female), en-PH-JamesNeural (male)
TTS_VOICES = {
    'en': 'en-PH-RosaNeural',     # English — warm Filipino female
    'tl': 'fil-PH-BlessicaNeural'  # Filipino/Tagalog — female
}


@app.route('/favicon.ico')
def favicon():
    return '', 204


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    lat = request.json.get('latitude')
    lon = request.json.get('longitude')
    user_context = session.get('context', {})
    
    if lat and lon:
        user_context['lat'] = lat
        user_context['lon'] = lon
        
    chat_history = session.get('history', [])

    # Append user's new message to history
    chat_history.append({"role": "user", "content": user_message})
    
    # Keep history to last 10 messages to prevent token bloat
    if len(chat_history) > 10:
        chat_history = chat_history[-10:]

    response, new_context = bot.process_message(user_message, user_context, chat_history)
    
    # Append bot's response to history
    chat_history.append({"role": "assistant", "content": response})
    
    session['context'] = new_context
    session['history'] = chat_history

    return jsonify({
        'response': response,
        'context': new_context,
        'language': new_context.get('lang', 'en')
    })


@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    TTS endpoint using Microsoft Edge Neural Voices (FREE).
    Accepts { text, language } and returns audio/mpeg stream.
    Supports English and Filipino with high-quality neural voices.
    """
    text = request.json.get('text', '')
    lang = request.json.get('language', 'en')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Clean markdown/HTML for speech
    clean = text
    clean = re.sub(r'\*\*(.*?)\*\*', r'\1', clean)   # bold
    clean = re.sub(r'\*(.*?)\*', r'\1', clean)        # italic
    clean = re.sub(r'#{1,6}\s?', '', clean)           # headings
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)  # links
    clean = re.sub(r'<[^>]*>', '', clean)             # HTML
    clean = clean.replace('₱', ' pesos ')
    clean = clean.strip()

    if not clean:
        return jsonify({'error': 'Empty text after cleaning'}), 400

    # Select voice based on language
    voice = TTS_VOICES.get(lang, TTS_VOICES['en'])

    try:
        # Generate speech using edge-tts
        audio_data = asyncio.run(_generate_speech(clean, voice))

        return Response(
            audio_data,
            content_type='audio/mpeg',
            headers={
                'Cache-Control': 'no-cache',
                'Content-Disposition': 'inline'
            }
        )

    except Exception as e:
        print(f'[TTS] Error: {e}')
        return jsonify({'error': str(e)}), 500


async def _generate_speech(text, voice):
    """Generate speech audio bytes using edge-tts."""
    communicate = edge_tts.Communicate(text, voice, rate='+5%', pitch='+0Hz')
    buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk['type'] == 'audio':
            buffer.write(chunk['data'])

    buffer.seek(0)
    return buffer.read()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
