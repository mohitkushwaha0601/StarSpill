/**
 * StarSpill - Frontend App
 * Integrated voice + form mode
 */

const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const voiceScreen = document.getElementById('voiceScreen');
const formScreen = document.getElementById('formScreen');
const loadingScreen = document.getElementById('loadingScreen');
const resultScreen = document.getElementById('resultScreen');
const errorScreen = document.getElementById('errorScreen');

const modeVoiceBtn = document.getElementById('modeVoice');
const modeFormBtn = document.getElementById('modeForm');

const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const voiceQuestion = document.getElementById('voiceQuestion');
const voiceQuestionText = document.getElementById('voiceQuestionText');
const voiceAnswerText = document.getElementById('voiceAnswerText');
const voiceIconIdle = document.getElementById('voiceIconIdle');
const voiceIconListening = document.getElementById('voiceIconListening');
const voiceIconLoading = document.getElementById('voiceIconLoading');

const roastForm = document.getElementById('roastForm');
const loadingText = document.getElementById('loadingText');

const zodiacSymbol = document.getElementById('zodiacSymbol');
const zodiacName = document.getElementById('zodiacName');
const userName = document.getElementById('userName');
const roastContent = document.getElementById('roastContent');
const verdictContent = document.getElementById('verdictContent');

const roastAgainBtn = document.getElementById('roastAgainBtn');
const copyRoastBtn = document.getElementById('copyRoastBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const errorMessage = document.getElementById('errorMessage');

let currentMode = 'voice';
let voiceFlow = null;
let cosmicInstance = null;
let waveInstance = null;

// Initialize cosmic field
function initCosmic() {
    const canvas = document.getElementById('cosmicCanvas');
    if (canvas && window.CosmicField) {
        cosmicInstance = window.CosmicField.init(canvas, 1);
    }
}

// Initialize voice wave
function initWave() {
    const canvas = document.getElementById('voiceWaveCanvas');
    if (canvas && window.VoiceWave) {
        waveInstance = window.VoiceWave.init(canvas, { active: false });
    }
}

// Mode switching
function switchMode(mode) {
    currentMode = mode;
    modeVoiceBtn.classList.toggle('active', mode === 'voice');
    modeFormBtn.classList.toggle('active', mode === 'form');
    showScreen(mode === 'voice' ? voiceScreen : formScreen);
}

modeVoiceBtn.addEventListener('click', () => switchMode('voice'));
modeFormBtn.addEventListener('click', () => switchMode('form'));

// Screen management
function showScreen(screen) {
    [voiceScreen, formScreen, loadingScreen, resultScreen, errorScreen].forEach(s => {
        s.classList.remove('active');
    });
    screen.classList.add('active');
}

// Voice icon management
function setVoiceIcon(state) {
    voiceIconIdle.style.display = state === 'idle' ? '' : 'none';
    voiceIconListening.style.display = state === 'listening' ? '' : 'none';
    voiceIconLoading.style.display = state === 'loading' ? '' : 'none';

    voiceBtn.classList.remove('listening', 'speaking', 'loading');
    if (state === 'listening') voiceBtn.classList.add('listening');
    else if (state === 'speaking') voiceBtn.classList.add('speaking');
    else if (state === 'loading') voiceBtn.classList.add('loading');
}

// Voice flow
function initVoiceFlowController() {
    if (!window.VoiceFlow) return;

    voiceFlow = window.VoiceFlow.initVoiceFlow({
        onPhaseChange: (phase, data) => {
            if (phase === 'idle') {
                setVoiceIcon('idle');
                voiceStatus.textContent = data?.text || 'Tap to begin your cosmic reading';
                voiceQuestion.style.display = 'none';
                if (waveInstance) waveInstance.setActive(false);
            } else if (phase === 'intro') {
                setVoiceIcon('speaking');
                voiceStatus.textContent = 'Speaking...';
                if (waveInstance) waveInstance.setActive(true);
            } else if (phase.startsWith('asking')) {
                setVoiceIcon('speaking');
                voiceStatus.textContent = 'Speaking...';
                voiceQuestion.style.display = 'block';
                voiceQuestionText.textContent = data?.question || '';
                voiceAnswerText.textContent = '';
                if (waveInstance) waveInstance.setActive(true);
            } else if (phase.startsWith('listening')) {
                setVoiceIcon('listening');
                voiceStatus.textContent = 'Speak now...';
                voiceAnswerText.textContent = 'Listening...';
                if (waveInstance) waveInstance.setActive(true);
            } else if (phase === 'loading') {
                setVoiceIcon('loading');
                voiceStatus.textContent = data?.text || 'Loading...';
                if (waveInstance) waveInstance.setActive(false);
            } else if (phase === 'done') {
                setVoiceIcon('idle');
                voiceStatus.textContent = 'Loading your roast...';
                if (waveInstance) waveInstance.setActive(false);
            }
        },
        onComplete: (data) => {
            showResult(data);
        },
        onAnswer: (answers) => {
            if (answers.name) voiceAnswerText.textContent = `Name: ${answers.name}`;
            if (answers.dob) voiceAnswerText.textContent = `DOB: ${answers.dob}`;
            if (answers.obsession) voiceAnswerText.textContent = `Obsession: ${answers.obsession}`;
            if (answers.intensity) voiceAnswerText.textContent = `Intensity: ${answers.intensity}`;
        },
        onFallback: (collected) => {
            // Voice failed — switch to form and pre-fill what we have
            console.log('[App] Voice fallback, pre-filling form:', collected);
            switchMode('form');

            if (collected.name) {
                document.getElementById('name').value = collected.name;
            }
            if (collected.dob) {
                // Parse "YYYY-MM-DD" back to DD/MM/YYYY fields
                const parts = collected.dob.split('-');
                if (parts.length === 3) {
                    document.getElementById('dobYear').value = parts[0];
                    document.getElementById('dobMonth').value = parts[1];
                    document.getElementById('dobDay').value = parts[2];
                }
            }
            if (collected.obsession) {
                document.getElementById('obsession').value = collected.obsession;
            }
            if (collected.intensity) {
                const radioValue = INTENSITY_MAP_VOICE[collected.intensity] || 'savage';
                const radio = document.querySelector(`input[name="intensity"][value="${radioValue}"]`);
                if (radio) radio.checked = true;
            }
        },
    });
}

// Map voice intensity keys to form radio values
const INTENSITY_MAP_VOICE = {
    low: 'mild',
    mid: 'savage',
    no_mercy: 'nuclear',
};

voiceBtn.addEventListener('click', () => {
    if (!window.VoiceFlow || !window.VoiceFlow.hasSpeechRecognition()) {
        voiceStatus.textContent = 'Voice not supported — use Form mode';
        voiceStatus.style.color = 'var(--destructive)';
        setTimeout(() => {
            voiceStatus.style.color = '';
            switchMode('form');
        }, 1500);
        return;
    }
    if (voiceFlow) voiceFlow.start();
});

// Loading messages for form mode
const loadingMessages = [
    "✦ Consulting the stars...",
    "☄️ Finding your zodiac...",
    "📜 Reading your horoscope...",
    "🤖 Asking the AI...",
    "🔥 Preparing your roast..."
];

let loadingInterval;

function startLoading(message) {
    showScreen(loadingScreen);
    loadingText.textContent = message || loadingMessages[0];

    let messageIndex = 0;
    loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        loadingText.textContent = loadingMessages[messageIndex];
    }, 2000);
}

function stopLoading() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}

// Form submission (existing functionality)
roastForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const dobDay = document.getElementById('dobDay').value.padStart(2, '0');
    const dobMonth = document.getElementById('dobMonth').value.padStart(2, '0');
    const dobYear = document.getElementById('dobYear').value;
    const dob = `${dobDay}-${dobMonth}-${dobYear}`;
    const obsession = document.getElementById('obsession').value.trim();
    const intensity = document.querySelector('input[name="intensity"]:checked').value;

    if (!name || !dobDay || !dobMonth || !dobYear || !obsession) {
        showError("Please fill in all fields.");
        return;
    }

    startLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/api/roast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, dob, obsession, roast_intensity: intensity })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to generate roast');
        }

        stopLoading();
        showResult(data);

    } catch (error) {
        console.error('Error:', error);
        stopLoading();
        showError(error.message || "Something went wrong. Try again.");
    }
});

// Show result
function showResult(data) {
    zodiacSymbol.textContent = data.zodiac_symbol;
    zodiacName.textContent = data.zodiac.toUpperCase();
    userName.textContent = `${data.name}'s Roast`;
    roastContent.textContent = data.roast;
    verdictContent.textContent = data.astro_verdict;

    showScreen(resultScreen);
}

// Show error
function showError(message) {
    errorMessage.innerHTML = message.replace(/\n/g, '<br>');
    showScreen(errorScreen);
}

// Roast again
roastAgainBtn.addEventListener('click', () => {
    roastForm.reset();
    document.querySelector('input[name="intensity"][value="mild"]').checked = true;
    switchMode(currentMode);
});

// Try again
tryAgainBtn.addEventListener('click', () => {
    switchMode(currentMode);
});

// Copy roast
copyRoastBtn.addEventListener('click', async () => {
    const roastText = `${zodiacName.textContent}\n\n${roastContent.textContent}\n\n✦ ASTRO VERDICT\n${verdictContent.textContent}`;

    try {
        await navigator.clipboard.writeText(roastText);
        const originalText = copyRoastBtn.textContent;
        copyRoastBtn.textContent = '✓ COPIED!';
        setTimeout(() => {
            copyRoastBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy. Please try manually selecting and copying the text.');
    }
});

// Check API health on load
window.addEventListener('load', async () => {
    initCosmic();
    initWave();
    initVoiceFlowController();

    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        console.log('API Status:', data);
    } catch (error) {
        console.warn('Backend API not available. Make sure to start the backend server.');
    }
});
