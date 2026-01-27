import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let db: Firestore | null = null;

/**
 * Initialize Firebase at cold start.
 * In Cloud Functions, credentials are automatic - no config needed.
 */
export function initializeFirebase(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
    return app;
  }

  // In Cloud Functions, default credentials are automatic
  app = initializeApp();
  return app;
}

/**
 * Get the Firestore database instance.
 */
export function getFirestoreDb(): Firestore {
  if (db) return db;
  if (!app) initializeFirebase();
  db = getFirestore();
  return db;
}

/**
 * Get the prefixed collection name based on environment.
 * Cloud Functions run in production - no prefix needed.
 * For staging/dev environments, use different Firebase projects.
 */
export function getCollectionName(baseName: string): string {
  return baseName;
}

export { type Firestore };
