import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 1,
  name: 'create_exercises',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        weight_increment REAL NOT NULL DEFAULT 5.0,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_exercises_is_custom ON exercises(is_custom);
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS exercises');
  },
};
