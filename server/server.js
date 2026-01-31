import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - Only allow requests from the frontend
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://i-catching.nl'],
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Initialize Firebase Admin (for verifying auth tokens)
// Note: In production, use a service account key file
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'i-catching'
    });
}

// Middleware to verify Firebase Auth token
async function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check admin role in Firestore
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth verification error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * OpenRouter Nano Banana Flash Proxy Endpoint
 * 
 * This endpoint securely proxies requests to OpenRouter's image generation API
 * The OpenRouter API key is NEVER exposed to the client
 */
app.post('/api/openrouter/nanobanana', verifyAdmin, async (req, res) => {
    const { imageUrl, base64Image, prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!imageUrl && !base64Image) {
        return res.status(400).json({ error: 'Image URL or base64 image is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

    if (!OPENROUTER_API_KEY) {
        console.error('OpenRouter API key not configured');
        return res.status(500).json({ error: 'AI service not configured' });
    }

    try {
        // Prepare the image content
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

        // Call OpenRouter API
        // Note: The exact API format depends on the model. This is a general structure.
        // For image editing models, you may need to adjust the request format.
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://i-catching.nl',
                'X-Title': 'I-Catching CMS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
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
                                text: `Edit this image with the following changes: ${prompt}. Return the modified image.`
                            }
                        ]
                    }
                ],
                max_tokens: 4096
            })
        });

        if (!openrouterResponse.ok) {
            const errorData = await openrouterResponse.text();
            console.error('OpenRouter API error:', errorData);
            return res.status(500).json({
                error: 'AI generation failed',
                details: errorData
            });
        }

        const result = await openrouterResponse.json();

        // Extract the generated image from the response
        // The exact structure depends on the model's response format
        let generatedImage = null;

        if (result.choices && result.choices[0]) {
            const content = result.choices[0].message?.content;

            // Check if content is an image (base64 or URL)
            if (typeof content === 'string') {
                if (content.startsWith('data:image') || content.startsWith('http')) {
                    generatedImage = content;
                }
            }

            // Some models return images in a different structure
            if (result.choices[0].message?.images) {
                generatedImage = result.choices[0].message.images[0];
            }
        }

        if (!generatedImage) {
            // For models that don't support direct image editing,
            // we return a placeholder or the original with a note
            return res.status(200).json({
                success: false,
                message: 'Image generation not available for this model',
                originalImage: imageUrl || base64Image
            });
        }

        return res.json({
            success: true,
            generatedImage
        });

    } catch (error) {
        console.error('Error processing AI request:', error);
        return res.status(500).json({
            error: 'Failed to process AI request',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 I-Catching API server running on port ${PORT}`);
    console.log(`   OpenRouter model: ${process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'}`);
});
