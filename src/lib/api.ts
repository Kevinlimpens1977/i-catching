// ==============================================================
// API CONFIGURATION
// Centralized API endpoints for Firebase Cloud Functions
// ==============================================================

// Firebase Function URLs (europe-west1 region)
const FUNCTIONS_BASE = 'https://europe-west1-i-catching.cloudfunctions.net';

/**
 * Health check endpoint
 * Returns: { status: 'ok', timestamp: string, environment: string }
 */
export const HEALTH_URL = `${FUNCTIONS_BASE}/health`;

/**
 * Nano Banana AI Image Generation endpoint
 * Requires: Bearer token (Firebase Auth)
 * Body: { base64Image?: string, imageUrl?: string, prompt: string }
 * Returns: { success: boolean, generatedImage?: string, error?: string }
 */
export const NANO_BANANA_URL = `${FUNCTIONS_BASE}/nanobanana`;
