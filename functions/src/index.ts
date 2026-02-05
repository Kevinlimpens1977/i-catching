import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// ==============================================================
// FIREBASE ADMIN INITIALIZATION
// ==============================================================
if (!admin.apps.length) {
    admin.initializeApp();
}

// ==============================================================
// SECRETS CONFIGURATION
// ==============================================================
const openrouterApiKey = defineSecret("OPENROUTER_API_KEY");

// ==============================================================
// GLOBAL FUNCTION OPTIONS
// ==============================================================
setGlobalOptions({
    region: "europe-west1",
    maxInstances: 10,
    memory: "512MiB",
    timeoutSeconds: 120
});

// ==============================================================
// CORS HEADERS (for browser requests)
// ==============================================================
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ==============================================================
// HELPER: Verify Admin Token
// ==============================================================
interface DecodedToken {
    uid: string;
}

async function verifyAdminToken(authHeader: string | undefined): Promise<{ success: true; uid: string } | { success: false; error: string; status: number }> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.error("AUTH FAIL: No authorization token provided");
        return { success: false, error: "No authorization token provided", status: 401 };
    }

    const token = authHeader.split("Bearer ")[1];
    logger.info("Token length:", token?.length || 0);

    try {
        logger.info("Verifying token with Firebase Admin...");
        const decodedToken: DecodedToken = await admin.auth().verifyIdToken(token);
        logger.info("Token verified, UID:", decodedToken.uid);

        // Check admin role in Firestore
        logger.info("Checking admin role in Firestore...");
        const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();

        if (!userDoc.exists || userDoc.data()?.role !== "admin") {
            logger.error("AUTH FAIL: User is not admin. Exists:", userDoc.exists, "Role:", userDoc.data()?.role);
            return { success: false, error: "Admin access required", status: 403 };
        }

        logger.info("AUTH SUCCESS: Admin verified");
        return { success: true, uid: decodedToken.uid };
    } catch (error) {
        logger.error("AUTH EXCEPTION:", error);
        return { success: false, error: "Invalid or expired token", status: 401 };
    }
}

// ==============================================================
// HELPER: Extract Image from OpenRouter Response
// Using 'any' for flexibility with varying OpenRouter response formats
// ==============================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
interface OpenRouterResponse {
    choices?: Array<{
        message: {
            images?: any[];
            parts?: any[];
            content?: any;
        };
    }>;
    candidates?: Array<{
        content?: {
            parts?: any[];
        };
    }>;
}

function extractImageFromResponse(data: OpenRouterResponse): string | null {
    let generatedImage: string | null = null;

    if (data.choices && data.choices.length > 0) {
        const message = data.choices[0].message;

        // Format 1: OpenAI-style images array
        if (message.images && message.images.length > 0) {
            const imageData = message.images[0];
            logger.info("Found image in images array");
            if (imageData.image_url?.url) {
                generatedImage = imageData.image_url.url;
            } else if (imageData.url) {
                generatedImage = imageData.url;
            }
        }

        // Format 2: Google Gemini parts array
        if (!generatedImage && message.parts && Array.isArray(message.parts)) {
            for (const part of message.parts) {
                const inlineData = part.inline_data || part.inlineData;
                if (inlineData && inlineData.data) {
                    const mimeType = inlineData.mime_type || inlineData.mimeType || "image/png";
                    logger.info("Found image in parts.inline_data");
                    generatedImage = `data:${mimeType};base64,${inlineData.data}`;
                    break;
                }
                if (part.image && typeof part.image === "string") {
                    logger.info("Found image in part.image");
                    generatedImage = part.image.startsWith("data:")
                        ? part.image
                        : `data:image/png;base64,${part.image}`;
                    break;
                }
            }
        }

        // Format 3: Nested content.parts structure
        if (!generatedImage && message.content && typeof message.content === "object" && "parts" in message.content) {
            const contentObj = message.content as { parts: any[] };
            for (const part of contentObj.parts) {
                const inlineData = part.inline_data || part.inlineData;
                if (inlineData && inlineData.data) {
                    const mimeType = inlineData.mime_type || inlineData.mimeType || "image/png";
                    logger.info("Found image in content.parts.inline_data");
                    generatedImage = `data:${mimeType};base64,${inlineData.data}`;
                    break;
                }
            }
        }

        // Format 4: Base64 data URI in content string
        if (!generatedImage && typeof message.content === "string") {
            const base64Match = message.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
            if (base64Match) {
                logger.info("Found base64 image in content text");
                generatedImage = base64Match[0];
            }
        }
    }

    // Format 5: Google candidates array
    if (!generatedImage && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
                const inlineData = part.inline_data || part.inlineData;
                if (inlineData && inlineData.data) {
                    const mimeType = inlineData.mime_type || inlineData.mimeType || "image/png";
                    logger.info("Found image in candidates.content.parts");
                    generatedImage = `data:${mimeType};base64,${inlineData.data}`;
                    break;
                }
            }
        }
    }

    return generatedImage;
}

// ==============================================================
// FUNCTION: health
// ==============================================================
export const health = onRequest((req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.set(CORS_HEADERS);
        res.status(204).send("");
        return;
    }

    res.set(CORS_HEADERS);
    logger.info("Health check", { path: req.path });
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "production"
    });
});

// ==============================================================
// FUNCTION: nanobanana
// Hardcoded image-capable model
// ==============================================================
const NANO_BANANA_MODEL = "google/gemini-2.5-flash-image";

export const nanobanana = onRequest(
    { secrets: [openrouterApiKey] },
    async (req, res) => {
        // Handle CORS preflight
        if (req.method === "OPTIONS") {
            res.set(CORS_HEADERS);
            res.status(204).send("");
            return;
        }

        res.set(CORS_HEADERS);

        // Only allow POST
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        // ==== AUTH CHECK ====
        const authResult = await verifyAdminToken(req.headers.authorization);
        if (!authResult.success) {
            res.status(authResult.status).json({ error: authResult.error });
            return;
        }

        // ==== INPUT VALIDATION ====
        const { imageUrl, base64Image, prompt } = req.body;

        if (!prompt) {
            res.status(400).json({ error: "Prompt is required" });
            return;
        }

        if (!imageUrl && !base64Image) {
            res.status(400).json({ error: "Image URL or base64 image is required" });
            return;
        }

        // ==== SECRET CHECK ====
        const apiKey = openrouterApiKey.value();
        if (!apiKey) {
            logger.error("OpenRouter API key not configured");
            res.status(500).json({ error: "AI service not configured" });
            return;
        }

        try {
            // ==== PREPARE IMAGE CONTENT ====
            let imageContent: string;

            if (base64Image) {
                imageContent = base64Image;
            } else if (imageUrl) {
                const imageResponse = await fetch(imageUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64 = Buffer.from(imageBuffer).toString("base64");
                const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
                imageContent = `data:${contentType};base64,${base64}`;
            } else {
                res.status(400).json({ error: "No image provided" });
                return;
            }

            // ==== DEBUG LOGGING ====
            logger.info("=== NANO BANANA DEBUG ===");
            logger.info("Model:", NANO_BANANA_MODEL);
            logger.info("Prompt:", prompt);
            logger.info("Image content length:", imageContent.length);
            logger.info("Calling OpenRouter API...");

            // ==== OPENROUTER API CALL ====
            const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://i-catching.nl",
                    "X-Title": "I-Catching CMS - Nano Banana",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: NANO_BANANA_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: { url: imageContent }
                                },
                                {
                                    type: "text",
                                    text: `Edit this image with the following changes: ${prompt}`
                                }
                            ]
                        }
                    ],
                    extra_body: {
                        response_modalities: ["IMAGE"],
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    }
                })
            });

            logger.info("OpenRouter response status:", openrouterResponse.status);

            if (!openrouterResponse.ok) {
                const errorData = await openrouterResponse.text();
                logger.error("=== OPENROUTER ERROR ===");
                logger.error("Status:", openrouterResponse.status);
                logger.error("Error body:", errorData);
                res.status(500).json({
                    success: false,
                    error: "AI generation failed",
                    details: errorData
                });
                return;
            }

            const data: OpenRouterResponse = await openrouterResponse.json();
            logger.info("Nano Banana response received, extracting image...");

            // ==== EXTRACT IMAGE ====
            const generatedImage = extractImageFromResponse(data);

            if (!generatedImage) {
                logger.error("No image found in OpenRouter response. Full response:", JSON.stringify(data, null, 2));
                res.status(200).json({
                    success: false,
                    error: "Geen afbeelding in response"
                });
                return;
            }

            // ==== SUCCESS ====
            logger.info("Nano Banana image generation successful");
            res.json({
                success: true,
                generatedImage
            });

        } catch (error) {
            logger.error("Error processing Nano Banana request:", error);
            res.status(500).json({
                success: false,
                error: "Failed to process AI request",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
);
