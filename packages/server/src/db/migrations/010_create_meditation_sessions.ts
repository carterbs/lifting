import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 10,
  name: 'create_meditation_sessions',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE meditation_sessions (
        id TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL,
        session_type TEXT NOT NULL,
        planned_duration_seconds INTEGER NOT NULL,
        actual_duration_seconds INTEGER NOT NULL,
        completed_fully INTEGER NOT NULL
      );

      CREATE INDEX idx_meditation_sessions_completed_at ON meditation_sessions(completed_at DESC);
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS meditation_sessions');
  },
};
