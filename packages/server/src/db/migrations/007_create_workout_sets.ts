import type { Database } from 'better-sqlite3';
import type { Migration } from '../migrator.js';

export const migration: Migration = {
  version: 7,
  name: 'create_workout_sets',

  up(db: Database): void {
    db.exec(`
      CREATE TABLE workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        target_reps INTEGER NOT NULL,
        target_weight REAL NOT NULL,
        actual_reps INTEGER,
        actual_weight REAL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT,
        UNIQUE (workout_id, exercise_id, set_number)
      );

      CREATE INDEX idx_workout_sets_workout_id ON workout_sets(workout_id);
      CREATE INDEX idx_workout_sets_exercise_id ON workout_sets(exercise_id);
      CREATE INDEX idx_workout_sets_status ON workout_sets(status);
    `);
  },

  down(db: Database): void {
    db.exec('DROP TABLE IF EXISTS workout_sets');
  },
};
