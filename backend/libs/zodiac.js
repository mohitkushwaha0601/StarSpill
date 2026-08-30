/**
 * Calculate Western zodiac sign from date of birth
 * @param {string} dateOfBirth - Format: DD-MM-YYYY
 * @returns {string} zodiac sign in lowercase
 */
function getZodiacSign(dateOfBirth) {
    const parts = dateOfBirth.split("-");

    if (parts.length !== 3) {
        throw new Error("DOB must be in DD-MM-YYYY format");
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (
        isNaN(day) ||
        isNaN(month) ||
        isNaN(year) ||
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12
    ) {
        throw new Error("Invalid date of birth");
    }

    // Zodiac boundaries
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
        return "aries";
    }

    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
        return "taurus";
    }

    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
        return "gemini";
    }

    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
        return "cancer";
    }

    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
        return "leo";
    }

    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
        return "virgo";
    }

    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
        return "libra";
    }

    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
        return "scorpio";
    }

    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
        return "sagittarius";
    }

    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return "capricorn";
    }

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
        return "aquarius";
    }

    return "pisces";
}

/**
 * Get zodiac symbol emoji
 */
function getZodiacSymbol(zodiac) {
    const symbols = {
        aries: "♈",
        taurus: "♉",
        gemini: "♊",
        cancer: "♋",
        leo: "♌",
        virgo: "♍",
        libra: "♎",
        scorpio: "♏",
        sagittarius: "♐",
        capricorn: "♑",
        aquarius: "♒",
        pisces: "♓"
    };
    return symbols[zodiac] || "🔮";
}

module.exports = {
    getZodiacSign,
    getZodiacSymbol
};
