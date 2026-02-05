import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ==============================================================
// ENVIRONMENT CONFIGURATION
// ==============================================================
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ==============================================================
// CORS CONFIGURATION (Development Only)
// In production, frontend and API are same-origin, no CORS needed
// ==============================================================
if (!isProduction) {
    const corsOptions = {
        origin: ['http://localhost:3000', 'http://localhost:4411', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
    };
    app.use(cors(corsOptions));
    console.log('🔧 CORS enabled for development');
}

// Request body parsing with size limit for image payloads
app.use(express.json({ limit: '15mb' }));

// ==============================================================
// FIREBASE ADMIN INITIALIZATION (ENV-ONLY, FAIL-FAST)
// Server will NOT start without valid FIREBASE_SERVICE_ACCOUNT
// ==============================================================
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ FATAL: FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    console.error('   Server cannot start without Firebase credentials');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (parseError) {
    console.error('❌ FATAL: Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError.message);
    console.error('   Ensure the JSON is valid and on a single line');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
    console.log('✅ Firebase Admin initialized via ENV');
}

// Middleware to verify Firebase Auth token
async function verifyAdmin(req, res, next) {
    console.log('=== VERIFY ADMIN MIDDLEWARE ===');
    console.log('Request URL:', req.url);
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('AUTH FAIL: No authorization token provided');
        return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token length:', token?.length || 0);

    try {
        console.log('Verifying token with Firebase Admin...');
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Token verified, UID:', decodedToken.uid);

        // Check admin role in Firestore
        console.log('Checking admin role in Firestore...');
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            console.error('AUTH FAIL: User is not admin. Exists:', userDoc.exists, 'Role:', userDoc.data()?.role);
            return res.status(403).json({ error: 'Admin access required' });
        }

        console.log('AUTH SUCCESS: Admin verified');
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('AUTH EXCEPTION:', error.message);
        console.error('Full error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * OpenRouter Nano Banana Flash Proxy Endpoint
 * 
 * This endpoint securely proxies requests to OpenRouter's image generation API
 * The OpenRouter API key is NEVER exposed to the client
 * 
 * Model: google/gemini-2.5-flash-image (hardcoded, image-capable)
 * Uses response_modalities: ['IMAGE'] to force image output
 */

// Hardcoded image-capable model for Nano Banana
const NANO_BANANA_MODEL = 'google/gemini-2.5-flash-image';

app.post('/api/openrouter/nanobanana', verifyAdmin, async (req, res) => {
    const { imageUrl, base64Image, prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!imageUrl && !base64Image) {
        return res.status(400).json({ error: 'Image URL or base64 image is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        console.error('OpenRouter API key not configured');
        return res.status(500).json({ error: 'AI service not configured' });
    }

    try {
        // Prepare the image content as base64 data URI
        let imageContent;

        if (base64Image) {
            // Already have base64 data
            imageContent = base64Image;
        } else if (imageUrl) {
            // Fetch the image and convert to base64
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString('base64');
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            imageContent = `data:${contentType};base64,${base64}`;
        }

        // DEBUG: Log before OpenRouter call
        console.log('=== NANO BANANA DEBUG ===');
        console.log('Model:', NANO_BANANA_MODEL);
        console.log('Prompt:', prompt);
        console.log('Image content length:', imageContent?.length || 0);
        console.log('Image content prefix:', imageContent?.substring(0, 50) || 'NONE');
        console.log('Calling OpenRouter API...');

        // Call OpenRouter API with image-capable model and response_modalities
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://i-catching.nl',
                'X-Title': 'I-Catching CMS - Nano Banana',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: NANO_BANANA_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageContent
                                }
                            },
                            {
                                type: 'text',
                                text: `Edit this image with the following changes: ${prompt}`
                            }
                        ]
                    }
                ],
                extra_body: {
                    response_modalities: ['IMAGE'],
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                }
            })
        });

        // DEBUG: Log OpenRouter response status
        console.log('OpenRouter response status:', openrouterResponse.status);
        console.log('OpenRouter response ok:', openrouterResponse.ok);

        if (!openrouterResponse.ok) {
            const errorData = await openrouterResponse.text();
            console.error('=== OPENROUTER ERROR ===');
            console.error('Status:', openrouterResponse.status);
            console.error('Error body:', errorData);
            return res.status(500).json({
                success: false,
                error: 'AI generation failed',
                details: errorData
            });
        }

        const data = await openrouterResponse.json();
        console.log('Nano Banana response received, extracting image...');

        // =====================================================
        // ROBUST MULTI-FORMAT IMAGE EXTRACTION (Paco Generator Pattern)
        // =====================================================
        let generatedImage = null;

        if (data.choices && data.choices.length > 0) {
            const message = data.choices[0].message;

            // Format 1: OpenAI-style images array
            if (message.images && message.images.length > 0) {
                const imageData = message.images[0];
                console.log('Found image in images array');

                if (imageData.image_url?.url) {
                    generatedImage = imageData.image_url.url;
                } else if (imageData.url) {
                    generatedImage = imageData.url;
                }
            }

            // Format 2: Google Gemini parts array
            if (!generatedImage && message.parts && Array.isArray(message.parts)) {
                for (const part of message.parts) {
                    // Google inline_data format
                    const inlineData = part.inline_data || part.inlineData;
                    if (inlineData && inlineData.data) {
                        const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
                        console.log('Found image in parts.inline_data');
                        generatedImage = `data:${mimeType};base64,${inlineData.data}`;
                        break;
                    }

                    // Alternative: base64 directly in part.image
                    if (part.image) {
                        console.log('Found image in part.image');
                        if (typeof part.image === 'string') {
                            generatedImage = part.image.startsWith('data:')
                                ? part.image
                                : `data:image/png;base64,${part.image}`;
                            break;
                        }
                    }
                }
            }

            // Format 3: Nested content.parts structure
            if (!generatedImage && message.content && typeof message.content === 'object' && message.content.parts) {
                for (const part of message.content.parts) {
                    const inlineData = part.inline_data || part.inlineData;
                    if (inlineData && inlineData.data) {
                        const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
                        console.log('Found image in content.parts.inline_data');
                        generatedImage = `data:${mimeType};base64,${inlineData.data}`;
                        break;
                    }
                }
            }

            // Format 4: Base64 data URI in content string (regex)
            if (!generatedImage && typeof message.content === 'string') {
                const base64Match = message.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
                if (base64Match) {
                    console.log('Found base64 image in content text');
                    generatedImage = base64Match[0];
                }
            }
        }

        // Format 5: Google candidates array (native format)
        if (!generatedImage && data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    const inlineData = part.inline_data || part.inlineData;
                    if (inlineData && inlineData.data) {
                        const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
                        console.log('Found image in candidates.content.parts');
                        generatedImage = `data:${mimeType};base64,${inlineData.data}`;
                        break;
                    }
                }
            }
        }

        // =====================================================
        // NO-IMAGE FALLBACK (Graceful)
        // =====================================================
        if (!generatedImage) {
            console.error('No image found in OpenRouter response. Full response:', JSON.stringify(data, null, 2));
            return res.status(200).json({
                success: false,
                error: 'Geen afbeelding in response'
            });
        }

        // Success - return the generated image
        console.log('Nano Banana image generation successful');
        return res.json({
            success: true,
            generatedImage
        });

    } catch (error) {
        console.error('Error processing Nano Banana request:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process AI request',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'production' : 'development'
    });
});

// ==============================================================
// PRODUCTION: Static File Serving + SPA Fallback
// Route order is CRITICAL: API routes above, static/SPA below
// ==============================================================
if (isProduction) {
    const distPath = path.resolve(__dirname, '../dist');

    // Serve static files from Vite build output
    app.use(express.static(distPath));
    console.log(`📁 Static files served from: ${distPath}`);

    // SPA Fallback: All non-API routes return index.html for React Router
    // Express 5 requires named splat parameter syntax
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('🔄 SPA fallback enabled for client-side routing');
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 I-Catching API server running on port ${PORT}`);
    console.log(`   Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`   OpenRouter model: ${process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'}`);
});
