// Voice Module — ElevenLabs Premium TTS
// With stop control and input locking during speech

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let isListening = false;
let currentLang = 'en';
let audioPlayer = null;

// Audio Context for beat visualization
window.audioContext = null;
window.audioAnalyser = null;
window.audioSource = null;

// Global speaking state — used by app.js to lock/unlock input
window.isBotSpeaking = false;

function setupAudioAnalysis() {
    if (window.audioContext) {
        // Resume if suspended (browser policy)
        if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
        return;
    }

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        window.audioContext = new AudioContext();
        window.audioAnalyser = window.audioContext.createAnalyser();
        window.audioAnalyser.fftSize = 256;
        window.audioAnalyser.smoothingTimeConstant = 0.85; // Much smoother (prevents buzzing)

        if (audioPlayer) {
            // Create source only once
            window.audioSource = window.audioContext.createMediaElementSource(audioPlayer);
            window.audioSource.connect(window.audioAnalyser);
            window.audioAnalyser.connect(window.audioContext.destination);
        }
    } catch (e) {
        console.error("Audio Context setup failed:", e);
    }
}

function initVoice() {
    // Create reusable audio element
    audioPlayer = new Audio();

    audioPlayer.addEventListener('play', () => {
        window.isBotSpeaking = true;
        if (window.updateSphereState) window.updateSphereState('speaking');
        updateVoiceUI('speaking');
        lockInput(true);
    });

    audioPlayer.addEventListener('ended', () => {
        window.isBotSpeaking = false;
        if (window.updateSphereState) window.updateSphereState('idle');
        updateVoiceUI('idle');
        lockInput(false);
    });

    audioPlayer.addEventListener('error', () => {
        window.isBotSpeaking = false;
        if (window.updateSphereState) window.updateSphereState('idle');
        updateVoiceUI('idle');
        lockInput(false);
    });

    // Speech Recognition
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            if (window.updateSphereState) window.updateSphereState('listening');
            updateVoiceUI('listening');
        };

        recognition.onend = () => {
            isListening = false;
            if (window.updateSphereState) window.updateSphereState('idle');
            updateVoiceUI('idle');
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('user-input').value = text;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            updateVoiceUI('error');
            setTimeout(() => updateVoiceUI('idle'), 2000);
        };
    } else {
        const btn = document.getElementById('voice-toggle');
        if (btn) btn.style.display = 'none';
    }

    // Toggle button
    const toggleBtn = document.getElementById('voice-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            setupAudioAnalysis(); // Ensure context is ready/resumed
            if (!recognition) return;
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    }
}

function setVoiceLanguage(lang) {
    currentLang = lang || 'en';
}

/**
 * Speak text using ElevenLabs TTS.
 */
function speak(text) {
    setupAudioAnalysis(); // Initialize or resume context

    if (!text || text.length === 0) return;

    // Stop any current audio
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    // Lock input and show speaking state
    window.isBotSpeaking = true;
    if (window.updateSphereState) window.updateSphereState('speaking');
    updateVoiceUI('speaking');
    lockInput(true);

    // Call backend TTS proxy
    fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, language: currentLang })
    })
        .then(response => {
            if (!response.ok) throw new Error('TTS failed');
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            audioPlayer.src = url;
            audioPlayer.play().catch(err => {
                console.error('Playback error:', err);
                window.isBotSpeaking = false;
                lockInput(false);
                if (window.updateSphereState) window.updateSphereState('idle');
                updateVoiceUI('idle');
            });
        })
        .catch(err => {
            console.error('TTS error:', err);
            window.isBotSpeaking = false;
            lockInput(false);
            if (window.updateSphereState) window.updateSphereState('idle');
            updateVoiceUI('idle');
        });
}

/**
 * Stop speech — called by the stop button.
 */
function stopSpeaking() {
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }
    window.isBotSpeaking = false;
    if (window.updateSphereState) window.updateSphereState('idle');
    updateVoiceUI('idle');
    lockInput(false);
}

/**
 * Lock or unlock the input area.
 * When locked: textarea disabled, send hidden, stop shown, chips disabled.
 * When unlocked: everything back to normal.
 */
function lockInput(locked) {
    const textarea = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const chips = document.querySelectorAll('.chip');
    const inputArea = document.getElementById('input-area');

    if (locked) {
        textarea.disabled = true;
        textarea.placeholder = 'Bot is speaking...';
        sendBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'flex';
        chips.forEach(c => {
            c.disabled = true;
            c.style.opacity = '0.3';
            c.style.pointerEvents = 'none';
        });
        if (inputArea) inputArea.classList.add('locked');
    } else {
        textarea.disabled = false;
        textarea.placeholder = 'Ask anything...';
        sendBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
        chips.forEach(c => {
            c.disabled = false;
            c.style.opacity = '';
            c.style.pointerEvents = '';
        });
        if (inputArea) inputArea.classList.remove('locked');
        textarea.focus();
    }
}

function updateVoiceUI(state) {
    const statusEl = document.querySelector('.voice-status');
    const toggleBtn = document.getElementById('voice-toggle');

    switch (state) {
        case 'listening':
            if (statusEl) statusEl.textContent = 'Listening...';
            if (toggleBtn) toggleBtn.classList.add('active');
            break;
        case 'speaking':
            if (statusEl) statusEl.textContent = 'Speaking...';
            break;
        case 'error':
            if (statusEl) statusEl.textContent = 'Voice error. Try again.';
            break;
        default:
            if (statusEl) statusEl.textContent = 'Tap mic to speak';
            if (toggleBtn) toggleBtn.classList.remove('active');
    }
}

window.addEventListener('load', initVoice);
