import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { ExerciseRepository } from '../exercise.repository.js';
import { Migrator } from '../../db/migrator.js';
import { migrations } from '../../db/migrations/index.js';

describe('ExerciseRepository', () => {
  let db: Database.Database;
  let repository: ExerciseRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const migrator = new Migrator(db, migrations);
    migrator.up();

    repository = new ExerciseRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create an exercise with all fields', () => {
      const exercise = repository.create({
        name: 'Bench Press',
        weight_increment: 2.5,
        is_custom: true,
      });

      expect(exercise).toMatchObject({
        name: 'Bench Press',
        weight_increment: 2.5,
        is_custom: true,
      });
      expect(exercise.id).toBeDefined();
      expect(exercise.created_at).toBeDefined();
      expect(exercise.updated_at).toBeDefined();
    });

    it('should create an exercise with default weight_increment', () => {
      const exercise = repository.create({ name: 'Squat' });
      expect(exercise.weight_increment).toBe(5.0);
    });

    it('should create an exercise with is_custom defaulting to false', () => {
      const exercise = repository.create({ name: 'Deadlift' });
      expect(exercise.is_custom).toBe(false);
    });

    it('should reject duplicate exercise names', () => {
      repository.create({ name: 'Bench Press' });
      expect(() => repository.create({ name: 'Bench Press' })).toThrow();
    });
  });

  describe('findById', () => {
    it('should return exercise when found', () => {
      const created = repository.create({ name: 'Bench Press' });
      const found = repository.findById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null when not found', () => {
      const found = repository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find exercise by exact name', () => {
      const created = repository.create({ name: 'Bench Press' });
      const found = repository.findByName('Bench Press');
      expect(found).toEqual(created);
    });

    it('should return null for non-existent name', () => {
      const found = repository.findByName('Non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all exercises ordered by name', () => {
      repository.create({ name: 'Squat' });
      repository.create({ name: 'Bench Press' });
      repository.create({ name: 'Deadlift' });

      const exercises = repository.findAll();
      expect(exercises).toHaveLength(3);
      expect(exercises[0].name).toBe('Bench Press');
      expect(exercises[1].name).toBe('Deadlift');
      expect(exercises[2].name).toBe('Squat');
    });

    it('should return empty array when none exist', () => {
      const exercises = repository.findAll();
      expect(exercises).toEqual([]);
    });
  });

  describe('findDefaultExercises', () => {
    it('should return only default exercises', () => {
      repository.create({ name: 'Default Exercise', is_custom: false });
      repository.create({ name: 'Custom Exercise', is_custom: true });

      const defaultExercises = repository.findDefaultExercises();
      expect(defaultExercises).toHaveLength(1);
      expect(defaultExercises[0].name).toBe('Default Exercise');
      expect(defaultExercises[0].is_custom).toBe(false);
    });
  });

  describe('findCustomExercises', () => {
    it('should return only custom exercises', () => {
      repository.create({ name: 'Default Exercise', is_custom: false });
      repository.create({ name: 'Custom Exercise', is_custom: true });

      const customExercises = repository.findCustomExercises();
      expect(customExercises).toHaveLength(1);
      expect(customExercises[0].name).toBe('Custom Exercise');
      expect(customExercises[0].is_custom).toBe(true);
    });
  });

  describe('update', () => {
    it('should update exercise name', () => {
      const created = repository.create({ name: 'Bench Press' });
      const updated = repository.update(created.id, {
        name: 'Incline Bench Press',
      });

      expect(updated?.name).toBe('Incline Bench Press');
      expect(updated?.updated_at).not.toBe(created.updated_at);
    });

    it('should update weight_increment', () => {
      const created = repository.create({ name: 'Bench Press' });
      const updated = repository.update(created.id, { weight_increment: 2.5 });

      expect(updated?.weight_increment).toBe(2.5);
    });

    it('should update multiple fields', () => {
      const created = repository.create({ name: 'Bench Press' });
      const updated = repository.update(created.id, {
        name: 'Incline Bench Press',
        weight_increment: 2.5,
      });

      expect(updated?.name).toBe('Incline Bench Press');
      expect(updated?.weight_increment).toBe(2.5);
    });

    it('should return null for non-existent id', () => {
      const updated = repository.update(999, { name: 'New Name' });
      expect(updated).toBeNull();
    });

    it('should reject duplicate name on update', () => {
      repository.create({ name: 'Bench Press' });
      const second = repository.create({ name: 'Squat' });

      expect(() =>
        repository.update(second.id, { name: 'Bench Press' })
      ).toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing exercise', () => {
      const created = repository.create({ name: 'Bench Press' });
      const deleted = repository.delete(created.id);

      expect(deleted).toBe(true);
      expect(repository.findById(created.id)).toBeNull();
    });

    it('should return false for non-existent id', () => {
      const deleted = repository.delete(999);
      expect(deleted).toBe(false);
    });
  });

  describe('isInUse', () => {
    it('should return false when exercise is not used', () => {
      const created = repository.create({ name: 'Bench Press' });
      expect(repository.isInUse(created.id)).toBe(false);
    });

    // Note: Testing isInUse returning true requires plan_day_exercises data,
    // which will be tested in integration tests
  });
});
