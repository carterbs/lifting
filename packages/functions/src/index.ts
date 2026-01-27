import { onRequest, type HttpsOptions } from 'firebase-functions/v2/https';
import { initializeFirebase } from './firebase.js';

// Initialize Firebase at cold start
initializeFirebase();

// Placeholder - handlers will be added in subsequent phases
const defaultOptions: HttpsOptions = {
  region: 'us-central1',
  cors: true,
};

// Health check function (placeholder)
export const health = onRequest(defaultOptions, (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'cloud-functions',
    },
  });
});
