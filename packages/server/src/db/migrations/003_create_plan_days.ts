import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 3,
  name: 'create_plan_days',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE plan_days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
        UNIQUE (plan_id, day_of_week)
      );

      CREATE INDEX idx_plan_days_plan_id ON plan_days(plan_id);
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS plan_days');
  },
};
