import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 4,
  name: 'create_plan_day_exercises',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE plan_day_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_day_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        sets INTEGER NOT NULL DEFAULT 2,
        reps INTEGER NOT NULL DEFAULT 8,
        weight REAL NOT NULL DEFAULT 30.0,
        rest_seconds INTEGER NOT NULL DEFAULT 60,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
      );

      CREATE INDEX idx_plan_day_exercises_plan_day_id ON plan_day_exercises(plan_day_id);
      CREATE INDEX idx_plan_day_exercises_exercise_id ON plan_day_exercises(exercise_id);
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS plan_day_exercises');
  },
};
