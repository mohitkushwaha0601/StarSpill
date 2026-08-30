/**
 * Astro Roast - Frontend App
 */

const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const formScreen = document.getElementById('formScreen');
const loadingScreen = document.getElementById('loadingScreen');
const resultScreen = document.getElementById('resultScreen');
const errorScreen = document.getElementById('errorScreen');

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

// Loading messages
const loadingMessages = [
    "🔮 Consulting the stars...",
    "☄️ Finding your zodiac...",
    "📜 Reading your horoscope...",
    "🤖 Asking the AI...",
    "🔥 Preparing your roast..."
];

let loadingInterval;

// Screen management
function showScreen(screen) {
    [formScreen, loadingScreen, resultScreen, errorScreen].forEach(s => {
        s.classList.remove('active');
    });
    screen.classList.add('active');
}

// Loading state management
function startLoading() {
    showScreen(loadingScreen);
    
    let messageIndex = 0;
    loadingText.textContent = loadingMessages[messageIndex];
    
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

// Form submission
roastForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const dobDay = document.getElementById('dobDay').value.padStart(2, '0');
    const dobMonth = document.getElementById('dobMonth').value.padStart(2, '0');
    const dobYear = document.getElementById('dobYear').value;
    const dob = `${dobDay}-${dobMonth}-${dobYear}`;
    const obsession = document.getElementById('obsession').value.trim();
    const intensity = document.querySelector('input[name="intensity"]:checked').value;
    
    // Validate
    if (!name || !dobDay || !dobMonth || !dobYear || !obsession) {
        showError("Please fill in all fields.");
        return;
    }
    
    // Start loading
    startLoading();
    
    try {
        // Call API
        const response = await fetch(`${API_BASE_URL}/api/roast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                dob,
                obsession,
                roast_intensity: intensity
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to generate roast');
        }
        
        // Stop loading
        stopLoading();
        
        // Show result
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

// Roast again button
roastAgainBtn.addEventListener('click', () => {
    // Reset form
    roastForm.reset();
    document.querySelector('input[name="intensity"][value="mild"]').checked = true;
    
    // Show form
    showScreen(formScreen);
});

// Try again button
tryAgainBtn.addEventListener('click', () => {
    showScreen(formScreen);
});

// Copy roast button
copyRoastBtn.addEventListener('click', async () => {
    const roastText = `${zodiacName.textContent}\n\n${roastContent.textContent}\n\n🔮 ASTRO VERDICT\n${verdictContent.textContent}`;
    
    try {
        await navigator.clipboard.writeText(roastText);
        
        // Show feedback
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
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        console.log('API Status:', data);
    } catch (error) {
        console.warn('Backend API not available. Make sure to start the backend server.');
    }
});
