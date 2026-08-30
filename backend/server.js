/**
 * Astro Roast - Backend API Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getZodiacSign, getZodiacSymbol } = require('./libs/zodiac');
const { getDailyHoroscope } = require('./services/astrology_service');
const { generateRoast } = require('./services/roast_service');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : '*', // Allow all origins in development if not set
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        service: "Astro Roast API",
        status: "running",
        version: "1.0.0"
    });
});

// Main roast endpoint
app.post('/api/roast', async (req, res) => {
    try {
        console.log('\n[API] New roast request received');
        
        // Validate input
        const { name, dob, obsession, roast_intensity } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: "Name is required"
            });
        }

        if (!dob || !dob.trim()) {
            return res.status(400).json({
                success: false,
                error: "Date of birth is required"
            });
        }

        if (!obsession || !obsession.trim()) {
            return res.status(400).json({
                success: false,
                error: "Obsession is required"
            });
        }

        if (!roast_intensity || !roast_intensity.trim()) {
            return res.status(400).json({
                success: false,
                error: "Roast intensity is required"
            });
        }

        // Validate roast intensity
        const validIntensities = ['mild', 'savage', 'nuclear'];
        const intensity = roast_intensity.toLowerCase();
        
        if (!validIntensities.includes(intensity)) {
            return res.status(400).json({
                success: false,
                error: `Roast intensity must be one of: ${validIntensities.join(', ')}`
            });
        }

        console.log(`[API] Processing request for ${name}`);

        // Step 1: Calculate zodiac sign
        console.log(`[API] Calculating zodiac from DOB: ${dob}`);
        const zodiac = getZodiacSign(dob);
        const zodiacSymbol = getZodiacSymbol(zodiac);
        console.log(`[API] Zodiac: ${zodiac} ${zodiacSymbol}`);

        // Step 2: Fetch horoscope from AstrologyAPI
        const astrologyApiKey = process.env.ASTROLOGY_API_KEY;
        if (!astrologyApiKey) {
            throw new Error("ASTROLOGY_API_KEY not configured");
        }

        const horoscope = await getDailyHoroscope(zodiac, astrologyApiKey);

        // Step 3: Generate roast using AI
        const sarvamApiKey = process.env.SARVAM_API_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!sarvamApiKey && !openaiApiKey) {
            throw new Error("No AI API key configured (SARVAM_API_KEY or OPENAI_API_KEY)");
        }

        console.log(`[API] Generating roast with intensity: ${intensity}`);
        const roastResult = await generateRoast(
            {
                name: name.trim(),
                zodiac,
                obsession: obsession.trim(),
                roastIntensity: intensity,
                horoscope
            },
            sarvamApiKey,
            openaiApiKey
        );

        // Step 4: Return response
        const response = {
            success: true,
            name: name.trim(),
            zodiac,
            zodiac_symbol: zodiacSymbol,
            roast: roastResult.roast,
            astro_verdict: roastResult.astroVerdict
        };

        console.log(`[API] Roast generated successfully for ${name}`);
        res.json(response);

    } catch (error) {
        console.error('[API] Error:', error);
        
        // Send user-friendly error
        res.status(500).json({
            success: false,
            error: error.message || "Failed to generate roast"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🔮 Astro Roast API running on http://localhost:${PORT}`);
    console.log(`\nAPI Keys configured:`);
    console.log(`- AstrologyAPI: ${process.env.ASTROLOGY_API_KEY ? '✓' : '✗'}`);
    console.log(`- Sarvam: ${process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY !== 'your_sarvam_api_key_here' ? '✓' : '✗'}`);
    console.log(`- OpenAI: ${process.env.OPENAI_API_KEY ? '✓' : '✗'}`);
    console.log('');
});
