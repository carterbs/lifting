import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 6,
  name: 'create_workouts',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mesocycle_id INTEGER NOT NULL,
        plan_day_id INTEGER NOT NULL,
        week_number INTEGER NOT NULL,
        scheduled_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (mesocycle_id) REFERENCES mesocycles(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE RESTRICT,
        UNIQUE (mesocycle_id, plan_day_id, week_number)
      );

      CREATE INDEX idx_workouts_mesocycle_id ON workouts(mesocycle_id);
      CREATE INDEX idx_workouts_status ON workouts(status);
      CREATE INDEX idx_workouts_scheduled_date ON workouts(scheduled_date);
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS workouts');
  },
};
