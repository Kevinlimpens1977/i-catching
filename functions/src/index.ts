import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";

// Set global options for all functions
setGlobalOptions({
    region: "europe-west1",
    maxInstances: 5,
    memory: "256MiB",
    timeoutSeconds: 60
});

// Health check endpoint
export const health = onRequest((req, res) => {
    logger.info("Health check", { path: req.path });
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
