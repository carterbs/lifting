import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 2,
  name: 'create_plans',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        duration_weeks INTEGER NOT NULL DEFAULT 6,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS plans');
  },
};
