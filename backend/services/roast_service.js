/**
 * AI Roast Generation Service
 * Uses Sarvam LLM (or OpenAI as fallback)
 */

const fetch = require('node-fetch');
const https = require('https');

// For development: disable SSL verification (DO NOT USE IN PRODUCTION)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Generate personalized roast using AI
 * @param {object} params - { name, zodiac, obsession, roastIntensity, horoscope }
 * @param {string} sarvamApiKey - Sarvam API key
 * @param {string} openaiApiKey - OpenAI API key (fallback)
 * @returns {Promise<object>} { roast, astroVerdict }
 */
async function generateRoast(params, sarvamApiKey, openaiApiKey) {
    const { name, zodiac, obsession, roastIntensity, horoscope } = params;

    // Build the system prompt
    const systemPrompt = buildSystemPrompt();

    // Build the user message
    const userMessage = buildUserMessage(name, zodiac, obsession, roastIntensity, horoscope);

    // Try Sarvam first, fallback to OpenAI
    try {
        if (sarvamApiKey && sarvamApiKey !== "your_sarvam_api_key_here") {
            console.log("[Roast] Attempting Sarvam LLM...");
            return await callSarvam(systemPrompt, userMessage, sarvamApiKey);
        }
    } catch (error) {
        console.log("[Roast] Sarvam failed, falling back to OpenAI:", error.message);
    }

    // Fallback to OpenAI
    console.log("[Roast] Using OpenAI...");
    return await callOpenAI(systemPrompt, userMessage, openaiApiKey);
}

/**
 * Build the AstroRoast system prompt
 */
function buildSystemPrompt() {
    return `You are AstroRoast, a funny, sarcastic Indian AI astrologer.

Your job is to take a user's horoscope and turn it into a highly personalized comedic roast.

Rules:
1. Make the roast personalized.
2. Use the user's obsession as a recurring comedic hook.
3. Connect the horoscope predictions to the user's obsession.
4. Look for contradictions, generic predictions and absurdity.
5. Do not simply repeat the horoscope.
6. Be witty and conversational.
7. Indian/Hinglish references are allowed where they feel natural.
8. Do not invent personal facts.
9. Roast the situation, habits or horoscope.
10. Do not target protected characteristics.
11. Do not make harmful or serious claims about health, death, financial ruin, etc.
12. Keep it entertaining rather than genuinely insulting.
13. Respect the requested roast intensity.

Intensity guidelines:
- MILD: Playful teasing. Friendly and light.
- SAVAGE: Strong sarcasm, sharper observations and more aggressive jokes.
- NUCLEAR: Maximum comedic aggression. Brutal, absurd and highly sarcastic, but still playful and within appropriate boundaries.

Output format:

🔥 ASTRO ROAST

<main personalized roast - 3-5 paragraphs>

🔮 ASTRO VERDICT

<one short, memorable final roast line>

Return clean text suitable for direct rendering.`;
}

/**
 * Build the user message with context
 */
function buildUserMessage(name, zodiac, obsession, roastIntensity, horoscope) {
    // Extract key horoscope fields
    const horoscopeText = formatHoroscope(horoscope);

    return `Name: ${name}
Zodiac: ${zodiac.toUpperCase()}
Obsession: ${obsession}
Roast Intensity: ${roastIntensity.toUpperCase()}

Daily Horoscope:
${horoscopeText}

Generate a personalized roast based on this information.`;
}

/**
 * Format horoscope data into readable text
 */
function formatHoroscope(horoscope) {
    if (!horoscope) {
        return "No horoscope data available.";
    }

    let text = "";

    // Add main prediction
    if (horoscope.prediction) {
        text += `Prediction: ${horoscope.prediction}\n\n`;
    }

    // Add specific areas
    const areas = ['personal_life', 'health', 'profession', 'emotions', 'travel', 'luck'];
    
    for (const area of areas) {
        if (horoscope[area]) {
            const areaName = area.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            text += `${areaName}: ${horoscope[area]}\n`;
        }
    }

    return text.trim() || "No detailed horoscope available.";
}

/**
 * Call Sarvam LLM API
 */
async function callSarvam(systemPrompt, userMessage, apiKey) {
    // Sarvam API endpoint (update with actual endpoint)
    const url = "https://api.sarvam.ai/v1/chat/completions";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "sarvam-105b", // Sarvam model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.8,
            max_tokens: 1000
        }),
        agent: httpsAgent
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const roastText = data.choices[0].message.content;

    return parseRoastResponse(roastText);
}

/**
 * Call OpenAI API (fallback)
 */
async function callOpenAI(systemPrompt, userMessage, apiKey) {
    const url = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.8,
            max_tokens: 1000
        }),
        agent: httpsAgent
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const roastText = data.choices[0].message.content;

    return parseRoastResponse(roastText);
}

/**
 * Parse roast response into roast and verdict
 */
function parseRoastResponse(text) {
    // Split by the verdict marker
    const verdictMarker = "🔮 ASTRO VERDICT";
    const parts = text.split(verdictMarker);

    let roast = text;
    let astroVerdict = "";

    if (parts.length === 2) {
        roast = parts[0].trim();
        astroVerdict = parts[1].trim();
        
        // Remove the roast marker if present
        roast = roast.replace("🔥 ASTRO ROAST", "").trim();
    }

    return {
        roast,
        astroVerdict
    };
}

module.exports = {
    generateRoast
};
