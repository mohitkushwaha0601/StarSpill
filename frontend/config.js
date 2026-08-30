/**
 * Frontend Configuration
 * This file manages environment-specific settings
 */

// Get API URL from environment or use default
const getApiUrl = () => {
  // Check if we're running in production (deployed on Vercel)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // In production, use the Railway API URL from the global config
    return window.ENV?.API_URL || 'https://your-railway-app.railway.app';
  }
  // In development, use localhost
  return 'http://localhost:8000';
};

window.APP_CONFIG = {
  API_BASE_URL: getApiUrl()
};
