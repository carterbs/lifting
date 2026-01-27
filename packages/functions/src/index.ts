import { onRequest, type HttpsOptions } from 'firebase-functions/v2/https';
import { initializeFirebase } from './firebase.js';

// Initialize Firebase at cold start
initializeFirebase();

// Import handler apps
import { healthApp } from './handlers/health.js';
import { exercisesApp } from './handlers/exercises.js';
import { stretchSessionsApp } from './handlers/stretchSessions.js';
import { meditationSessionsApp } from './handlers/meditationSessions.js';

// Common options
const defaultOptions: HttpsOptions = {
  region: 'us-central1',
  cors: true,
};

// Export functions - Phase 3: Simple Functions
export const health = onRequest(defaultOptions, healthApp);
export const exercises = onRequest(defaultOptions, exercisesApp);
export const stretchSessions = onRequest(defaultOptions, stretchSessionsApp);
export const meditationSessions = onRequest(defaultOptions, meditationSessionsApp);
