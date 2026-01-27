import type { Firestore } from 'firebase-admin/firestore';
import {
  initializeFirestore,
  getFirestoreDb,
  resetFirebase,
  setTestFirestore,
  getCollectionPrefix,
} from '../firebase/index.js';
import { seedDatabase } from './seed.js';

export interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Get the environment name for logging purposes.
 */
export function getEnvironmentName(): string {
  const env = process.env['NODE_ENV'] ?? 'development';
  const prefix = getCollectionPrefix();

  switch (env) {
    case 'test':
      return `test (prefix: ${prefix})`;
    case 'production':
      return 'production';
    default:
      return `development (prefix: ${prefix})`;
  }
}

/**
 * Initialize the Firestore database and seed default data.
 */
export async function initializeDatabase(
  config?: FirebaseConfig
): Promise<Firestore> {
  const db = initializeFirestore(config);

  // Seed default data
  await seedDatabase(db);

  const envName = getEnvironmentName();
  console.log(`Firestore database initialized for ${envName}`);

  return db;
}

/**
 * Get the Firestore database instance.
 */
export function getDatabase(): Firestore {
  return getFirestoreDb();
}

/**
 * Reset Firebase state (for testing).
 */
export function closeDatabase(): void {
  resetFirebase();
}

/**
 * Set a custom Firestore instance for testing.
 */
export function setTestDatabase(db: Firestore | null): void {
  if (db) {
    setTestFirestore(db);
  } else {
    resetFirebase();
  }
}

// Re-export seed functions
export { seedDatabase, seedDefaultExercises, DEFAULT_EXERCISES } from './seed.js';
