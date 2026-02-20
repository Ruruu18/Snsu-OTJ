# Snsu-OTJ — LGU Prime Assistant

A multilingual chatbot for Philippine Local Government Units (LGU), powered by a local AI model (Ollama/llama3.2) with a keyword/fuzzy-matching fallback. Supports **English** and **Tagalog** with text-to-speech output.

---

## Features

- 🤖 **AI-Powered Responses** — Uses a locally running [Ollama](https://ollama.com) (`llama3.2`) model as the primary response engine
- 🔁 **Fallback Engine** — Falls back to keyword + fuzzy matching if Ollama is unavailable
- 🌐 **Multilingual** — Detects and responds in English (`en`) or Tagalog (`tl`), with session-based language persistence
- 🔊 **Text-to-Speech** — Free neural TTS via Microsoft Edge TTS (`edge-tts`); uses Philippine-accented voices
- 🌤️ **Live Weather** — Fetches real-time weather via `wttr.in` based on the user's geolocation
- 📚 **Government Knowledge Base** — Covers: Business Permits, Civil Registry, Real Property Tax, Health Services, Social Welfare, and Barangay Services

---

## Project Structure

```
Snsu-OTJ/
├── app.py                  # Flask app — routes, TTS endpoint, session handling
├── requirements.txt        # Python dependencies
├── chatbot/
│   ├── engine.py           # ChatbotEngine — language detection, intent matching, Ollama integration
│   ├── knowledge.py        # KNOWLEDGE_BASE and canned RESPONSES (EN/TL)
│   └── languages.py        # LanguageDetector — keyword-frequency scoring (no external API)
├── static/                 # CSS, JS, and other static assets
└── templates/
    └── index.html          # Chat UI
```

---

## Requirements

- **Python** 3.8 or newer
- **pip**
- _(Optional)_ **[Ollama](https://ollama.com)** running locally with the `llama3.2` model — the chatbot works without it but uses rule-based fallback responses

### Install Dependencies

```bash
pip install -r requirements.txt
```

Or manually:

```bash
pip install flask>=3.0.0 edge-tts requests>=2.31.0
```

### (Optional) Set Up Ollama

```bash
# Install Ollama from https://ollama.com, then pull the model:
ollama pull llama3.2
```

---

## Running the App

```bash
python app.py
```

Then open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

---

## How It Works

1. **Language Detection** — `LanguageDetector` scores the user's message against marker word lists for EN/TL and returns the dominant language. For short messages, the session's last detected language is reused.
2. **Ollama (Primary)** — The full conversation history and the entire knowledge base are packaged into a system prompt and sent to the local `llama3.2` model. Live weather data is injected into the prompt automatically.
3. **Keyword/Fuzzy Fallback** — If Ollama is unreachable, `ChatbotEngine` scores each knowledge base category using exact keyword matches and fuzzy topic similarity (`difflib`), then returns the best-matching response.
4. **TTS** — The `/api/tts` endpoint strips Markdown/HTML from the response, selects the appropriate Philippine neural voice, and streams audio via `edge-tts`.

---

## API Endpoints

| Method | Route       | Description                                                                     |
| ------ | ----------- | ------------------------------------------------------------------------------- |
| `GET`  | `/`         | Serves the chat UI                                                              |
| `POST` | `/api/chat` | Accepts `{ message, latitude, lon }`, returns `{ response, context, language }` |
| `POST` | `/api/tts`  | Accepts `{ text, language }`, returns `audio/mpeg` stream                       |
