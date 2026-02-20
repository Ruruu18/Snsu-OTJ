document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
const textarea = document.getElementById('user-input');
textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Initialize History
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    history.forEach(msg => appendMessage(msg.text, msg.sender, false));

    const chosenLang = sessionStorage.getItem('preferredLang');
    if (chosenLang) {
        setVoiceLanguage(chosenLang);
        showQuickActions(true);
    }

    if (history.length === 0) {
        showQuickActions(false);

        // Show language selection FIRST — no greeting yet
        setTimeout(() => {
            showLanguageSelection();
        }, 500);
    }
}

function showLanguageSelection() {
    const chatBox = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot');
    msgDiv.id = 'lang-selection';

    msgDiv.innerHTML = `
        <div class="bubble lang-picker-bubble">
            <p style="margin-bottom:12px;font-weight:500;">Piliin po ang inyong wika / Choose your language:</p>
            <div class="lang-picker">
                <button class="lang-choice" onclick="selectLanguage('tl')">
                    🇵🇭 Tagalog
                </button>
                <button class="lang-choice" onclick="selectLanguage('en')">
                    🇺🇸 English
                </button>
            </div>
        </div>
    `;

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Disable input until language is chosen
    document.getElementById('user-input').disabled = true;
    document.getElementById('user-input').placeholder = 'Please choose a language first...';
    document.getElementById('send-btn').style.opacity = '0.3';
    document.getElementById('send-btn').style.pointerEvents = 'none';
}

function selectLanguage(lang) {
    sessionStorage.setItem('preferredLang', lang);
    setVoiceLanguage(lang);
    updateLangBadge(lang);

    // Remove the selection buttons
    const picker = document.getElementById('lang-selection');
    if (picker) picker.remove();

    // Time-based greeting in chosen language
    const hour = new Date().getHours();
    let greeting;
    if (lang === 'tl') {
        let greet;
        if (hour < 12) greet = 'Magandang Umaga';
        else if (hour < 18) greet = 'Magandang Hapon';
        else greet = 'Magandang Gabi';
        greeting = `${greet} po! 👋 Ako si **Tala**, ang inyong digital assistant ng Surigao City LGU Office. Ano po ang maitutulong ko sa inyo?`;
    } else {
        let greet;
        if (hour < 12) greet = 'Good Morning';
        else if (hour < 18) greet = 'Good Afternoon';
        else greet = 'Good Evening';
        greeting = `${greet}! 👋 I'm **Tala**, your digital assistant for Surigao City LGU Office. How can I help you today?`;
    }
    appendMessage(greeting, 'bot');
    speak(greeting);

    // Re-enable input and show quick actions
    document.getElementById('user-input').disabled = false;
    document.getElementById('user-input').placeholder = 'Ask anything...';
    document.getElementById('send-btn').style.opacity = '';
    document.getElementById('send-btn').style.pointerEvents = '';
    document.getElementById('user-input').focus();
    showQuickActions(true);
}

function showQuickActions(visible) {
    const carousel = document.querySelector('.quick-actions-carousel');
    if (carousel) {
        carousel.style.display = visible ? '' : 'none';
    }
}

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

function sendMessage() {
    // Block input while bot is speaking
    if (window.isBotSpeaking) return;

    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    if (message === '') return;

    // Add user message to UI
    appendMessage(message, 'user');
    inputField.value = '';
    inputField.style.height = 'auto'; // Reset height

    // Show typing
    showTyping();
    updateSphereState('listening'); // Visually indicate processing

    // Call API
    let payload = { message: message };
    const lat = sessionStorage.getItem('userLat');
    const lon = sessionStorage.getItem('userLon');
    if (lat && lon) {
        payload.latitude = lat;
        payload.longitude = lon;
    }

    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then(data => {
            // Remove typing
            hideTyping();

            // Handle weather theme
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
                chatContainer.classList.remove('theme-clear', 'theme-rain', 'theme-night', 'theme-cloudy');
                if (data.context && data.context.weather_theme) {
                    chatContainer.classList.add(`theme-${data.context.weather_theme}`);
                }
            }

            // Add bot response
            appendMessage(data.response, 'bot');

            // Update language badge
            updateLangBadge(data.language);

            // Set voice language then speak
            setVoiceLanguage(data.language);
            speak(data.response);

            updateSphereState('speaking');
        })
        .catch((error) => {
            console.error('Error:', error);
            hideTyping();
            appendMessage('**Error**: Unable to reach the server. Please check your connection.', 'bot');
            updateSphereState('idle');
        });
}

function sendQuickMessage(text) {
    document.getElementById('user-input').value = text;
    sendMessage();
}

function appendMessage(text, sender, save = true) {
    const chatBox = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    // Markdown Parsing
    let formattedText = marked.parse(text);

    messageDiv.innerHTML = `
        <div class="bubble">${formattedText}</div>
        <div class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save) {
        saveToHistory({ text, sender, timestamp: Date.now() });
    }
}

function saveToHistory(msgObj) {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    history.push(msgObj);
    // Keep last 50 messages
    if (history.length > 50) history.shift();
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

// Custom Modal Helper
function showCustomModal(title, body, onConfirm, showCancel = true, confirmText = 'Confirm', confirmClass = '') {
    const overlay = document.getElementById('custom-modal-overlay');
    const titleEl = document.getElementById('custom-modal-title');
    const bodyEl = document.getElementById('custom-modal-body');
    const cancelBtn = document.getElementById('custom-modal-cancel');
    const confirmBtn = document.getElementById('custom-modal-confirm');

    if (!overlay) return;

    titleEl.textContent = title;
    bodyEl.textContent = body;
    cancelBtn.style.display = showCancel ? 'block' : 'none';
    confirmBtn.textContent = confirmText;
    confirmBtn.className = 'modal-btn confirm ' + confirmClass; // Apply custom class

    // Remove old listeners to prevent multiple fires by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
        overlay.classList.remove('visible');
        if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        overlay.classList.remove('visible');
    });

    overlay.classList.add('visible');
}

document.getElementById('clear-history').addEventListener('click', () => {
    if (window.isBotSpeaking) {
        showCustomModal(
            "Bot is Speaking",
            "Do you wish to stop the bot from speaking?",
            () => {
                if (typeof stopSpeaking === 'function') {
                    stopSpeaking();
                }
            },
            true, // Show cancel button
            "Stop Immediately", // Custom confirm button text
            "danger" // Custom class for danger action
        );
        return;
    }

    showCustomModal(
        "Clear History",
        "Are you sure you want to clear the chat history? This cannot be undone.",
        () => {
            localStorage.removeItem('chatHistory');
            document.getElementById('chat-messages').innerHTML = '';
            loadHistory(); // Re-trigger greeting
        },
        true,
        "Confirm"
    );
});

function showTyping() {
    const chatBox = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.classList.add('message', 'bot');
    typingDiv.innerHTML = `
        <div class="bubble typing-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Language badge
const LANG_NAMES = { en: 'EN', tl: 'TL', ceb: 'CEB', sgd: 'SGD' };
function updateLangBadge(langCode) {
    const badge = document.getElementById('lang-badge');
    if (badge && langCode) {
        badge.textContent = LANG_NAMES[langCode] || langCode.toUpperCase();
    }
}

/* ═══════════════════════════════════════════════════════════════ */
/* Mobile UX Management System */
/* ═══════════════════════════════════════════════════════════════ */

const MobileUX = {
    isMobile: false,
    elements: {
        drawer: null,
        fab: null,
        overlay: null,
        layout: null,
        input: null
    },

    /**
     * Initialize mobile UX system
     */
    init() {
        this.detectMobile();
        this.cacheElements();
        this.setupEventListeners();
        if (this.isMobile) {
            this.initializeMobileState();
        }
    },

    /**
     * Detect if device is mobile
     */
    detectMobile() {
        this.isMobile = window.innerWidth <= 768;
    },

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements.drawer = document.getElementById('chat-drawer');
        this.elements.fab = document.getElementById('drawer-fab');
        this.elements.overlay = document.getElementById('drawer-overlay');
        this.elements.layout = document.querySelector('.main-layout');
        this.elements.input = document.getElementById('user-input');
    },

    /**
     * Setup event listeners for mobile responsiveness
     */
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.detectMobile();
            if (wasMobile !== this.isMobile) {
                this.cacheElements();
                if (this.isMobile) {
                    this.initializeMobileState();
                }
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
        });
    },

    /**
     * Initialize mobile state on load
     * Drawer starts hidden, only sphere visible
     */
    initializeMobileState() {
        if (!this.elements.drawer) this.cacheElements();
        
        this.elements.drawer.classList.remove('open');
        this.elements.fab.classList.remove('hidden');
        this.elements.overlay.classList.remove('visible');
        this.elements.layout.classList.add('drawer-closed');
    },

    /**
     * Check if drawer is currently open
     */
    isDrawerOpen() {
        return this.elements.drawer.classList.contains('open');
    },

    /**
     * Open chat drawer
     * - Shows chat panel
     * - Hides FAB button
     * - Shows overlay
     * - Removes drawer-closed state
     * - Auto-focuses input
     */
    openDrawer() {
        if (this.isDrawerOpen()) return;

        this.elements.drawer.classList.add('open');
        this.elements.fab.classList.add('hidden');
        this.elements.overlay.classList.add('visible');
        this.elements.layout.classList.remove('drawer-closed');

        // Auto-focus input after animation
        setTimeout(() => {
            if (this.elements.input) this.elements.input.focus();
        }, 400);

        // Trigger resize for sphere centering
        setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
    },

    /**
     * Close chat drawer
     * - Hides chat panel
     * - Shows FAB button
     * - Hides overlay
     * - Shows sphere as main focus
     */
    closeDrawer() {
        if (!this.isDrawerOpen()) return;

        this.elements.drawer.classList.remove('open');
        this.elements.fab.classList.remove('hidden');
        this.elements.overlay.classList.remove('visible');
        this.elements.layout.classList.add('drawer-closed');

        // Trigger resize for sphere centering
        setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
    },

    /**
     * Toggle drawer state
     */
    toggle() {
        if (this.isDrawerOpen()) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }
};
=======
// Request location for weather API
function requestLocation() {
    if ("geolocation" in navigator && !sessionStorage.getItem('userLat')) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                sessionStorage.setItem('userLat', position.coords.latitude);
                sessionStorage.setItem('userLon', position.coords.longitude);
            },
            (error) => {
                console.log("Location denied, defaulting to Surigao");
                sessionStorage.setItem('userLat', '9.7500');
                sessionStorage.setItem('userLon', '125.5000');
            },
            { timeout: 5000 }
        );
    }
}
};

// Request location for weather API
function requestLocation() {
    if ("geolocation" in navigator && !sessionStorage.getItem('userLat')) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                sessionStorage.setItem('userLat', position.coords.latitude);
                sessionStorage.setItem('userLon', position.coords.longitude);
            },
            (error) => {
                console.log("Location denied, defaulting to Surigao");
                sessionStorage.setItem('userLat', '9.7500');
                sessionStorage.setItem('userLon', '125.5000');
            },
            { timeout: 5000 }
        );
    }
}

// Load history and initialize drawer state
window.addEventListener('load', () => {
    loadHistory();
    MobileUX.init();
    requestLocation();
});

/* ─── Drawer Logic ─── */
function toggleDrawer() {
    MobileUX.toggle();
}

/* ─── Mobile Drag to Close ─── */
const drawer = document.getElementById('chat-drawer');
const handle = document.getElementById('drawer-handle');
let startY = 0;
let currentY = 0;
let isDragging = false;

if (handle) {
    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        drawer.style.transition = 'none'; // Disable transition for direct follow
    }, { passive: true });

    handle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow dragging down
        if (deltaY > 0) {
            drawer.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });

    handle.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        drawer.style.transition = ''; // Restore transition

        const deltaY = currentY - startY;
        // If dragged down more than 100px, close it
        if (deltaY > 100) {
            toggleDrawer(); // This will close it since it's open
            setTimeout(() => {
                drawer.style.transform = ''; // Reset inline transform after close anim
            }, 300);
        } else {
            // Bounce back
            drawer.style.transform = '';
        }
    });
}
