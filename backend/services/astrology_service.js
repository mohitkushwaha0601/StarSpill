/**
 * AstrologyAPI Integration
 */

const fetch = require('node-fetch');
const https = require('https');

const ASTROLOGY_API_BASE = "https://json.astrologyapi.com/v1";
const TIMEZONE = 5.5; // India timezone

// For development: disable SSL verification (DO NOT USE IN PRODUCTION)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Fetch daily consolidated horoscope from AstrologyAPI
 * @param {string} zodiacSign - lowercase zodiac sign
 * @param {string} apiKey - AstrologyAPI key
 * @returns {Promise<object>} horoscope data
 */
async function getDailyHoroscope(zodiacSign, apiKey) {
    const url = `${ASTROLOGY_API_BASE}/sun_sign_consolidated/daily/${zodiacSign}`;

    console.log(`[AstrologyAPI] Fetching horoscope for ${zodiacSign}...`);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-astrologyapi-key": apiKey
        },
        body: JSON.stringify({
            timezone: TIMEZONE
        }),
        agent: httpsAgent
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `AstrologyAPI error ${response.status}: ${errorText}`
        );
    }

    const data = await response.json();
    console.log(`[AstrologyAPI] Success for ${zodiacSign}`);
    
    return data;
}

module.exports = {
    getDailyHoroscope
};
