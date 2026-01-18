import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Migrator } from './migrator.js';
import { migrations } from './migrations/index.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DatabaseConfig {
  filename: string;
  inMemory?: boolean;
}

let db: Database.Database | null = null;
let testDb: Database.Database | null = null;

export function setTestDatabase(database: Database.Database | null): void {
  testDb = database;
}

/**
 * Get the database filename based on NODE_ENV.
 * - test: lifting.test.db (isolated for E2E tests)
 * - production: lifting.prod.db (or DB_PATH env var)
 * - development (default): lifting.db
 */
export function getDatabaseFilename(): string {
  const env = process.env['NODE_ENV'] ?? 'development';

  switch (env) {
    case 'test':
      return 'lifting.test.db';
    case 'production':
      return 'lifting.prod.db';
    default:
      return 'lifting.db';
  }
}

export function getDefaultDatabasePath(): string {
  // Explicit DB_PATH always takes precedence
  if (process.env['DB_PATH']) {
    return process.env['DB_PATH'];
  }

  const filename = getDatabaseFilename();
  return path.join(__dirname, '../../data', filename);
}

export function createDatabase(config: DatabaseConfig): Database.Database {
  const filename = config.inMemory === true ? ':memory:' : config.filename;

  // Ensure data directory exists for file-based databases
  if (config.inMemory !== true) {
    const dataDir = path.dirname(filename);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  const database = new Database(filename);

  // Enable foreign keys
  database.pragma('foreign_keys = ON');

  // WAL mode for better concurrency (only for file-based databases)
  if (config.inMemory !== true) {
    database.pragma('journal_mode = WAL');
  }

  return database;
}

export function getDatabase(): Database.Database {
  // Use test database if set (for testing)
  if (testDb !== null) {
    return testDb;
  }

  if (db === null) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return db;
}

export function initializeDatabase(): Database.Database {
  const dbPath = getDefaultDatabasePath();
  db = createDatabase({ filename: dbPath });

  // Run migrations
  const migrator = new Migrator(db, migrations);
  migrator.up();

  // Seed default data
  seedDatabase(db);

  console.log(`Database initialized at ${dbPath}`);

  return db;
}

export function closeDatabase(): void {
  if (db !== null) {
    db.close();
    db = null;
  }
}

export { Migrator } from './migrator.js';
export { migrations } from './migrations/index.js';
export { seedDatabase, seedDefaultExercises, DEFAULT_EXERCISES } from './seed.js';
