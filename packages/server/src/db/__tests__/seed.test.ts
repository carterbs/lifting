import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { Migrator } from '../migrator.js';
import { migrations } from '../migrations/index.js';
import { seedDefaultExercises, DEFAULT_EXERCISES } from '../seed.js';
import { ExerciseRepository } from '../../repositories/exercise.repository.js';

describe('seedDefaultExercises', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const migrator = new Migrator(db, migrations);
    migrator.up();
  });

  afterEach(() => {
    db.close();
  });

  it('should seed all 12 default exercises', () => {
    seedDefaultExercises(db);

    const repository = new ExerciseRepository(db);
    const exercises = repository.findAll();

    expect(exercises).toHaveLength(12);
  });

  it('should mark all seeded exercises as non-custom', () => {
    seedDefaultExercises(db);

    const repository = new ExerciseRepository(db);
    const exercises = repository.findAll();

    for (const exercise of exercises) {
      expect(exercise.is_custom).toBe(false);
    }
  });

  it('should be idempotent (safe to run multiple times)', () => {
    seedDefaultExercises(db);
    seedDefaultExercises(db);

    const repository = new ExerciseRepository(db);
    const exercises = repository.findAll();

    expect(exercises).toHaveLength(12);
  });

  it('should include all exercises from requirements', () => {
    seedDefaultExercises(db);

    const repository = new ExerciseRepository(db);

    for (const expected of DEFAULT_EXERCISES) {
      const found = repository.findByName(expected.name);
      expect(found).not.toBeNull();
      expect(found?.weight_increment).toBe(expected.weight_increment);
    }
  });

  it('should set correct weight_increment for each exercise', () => {
    seedDefaultExercises(db);

    const repository = new ExerciseRepository(db);

    // Check specific exercises with non-default weight increments
    const lateralRaises = repository.findByName(
      'Dumbbell Lateral Raise (Super ROM)'
    );
    expect(lateralRaises?.weight_increment).toBe(2.5);

    const benchPress = repository.findByName('Dumbbell Press (Flat)');
    expect(benchPress?.weight_increment).toBe(5.0);
  });
});
