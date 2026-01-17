import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { PlanDayExerciseRepository } from '../plan-day-exercise.repository.js';
import { PlanRepository } from '../plan.repository.js';
import { PlanDayRepository } from '../plan-day.repository.js';
import { ExerciseRepository } from '../exercise.repository.js';
import { Migrator } from '../../db/migrator.js';
import { migrations } from '../../db/migrations/index.js';

describe('PlanDayExerciseRepository', () => {
  let db: Database.Database;
  let repository: PlanDayExerciseRepository;
  let planRepository: PlanRepository;
  let planDayRepository: PlanDayRepository;
  let exerciseRepository: ExerciseRepository;
  let testPlanDayId: number;
  let testExerciseId: number;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const migrator = new Migrator(db, migrations);
    migrator.up();

    repository = new PlanDayExerciseRepository(db);
    planRepository = new PlanRepository(db);
    planDayRepository = new PlanDayRepository(db);
    exerciseRepository = new ExerciseRepository(db);

    // Create test data
    const plan = planRepository.create({ name: 'Test Plan' });
    const planDay = planDayRepository.create({
      plan_id: plan.id,
      day_of_week: 1,
      name: 'Push Day',
      sort_order: 0,
    });
    const exercise = exerciseRepository.create({ name: 'Bench Press' });

    testPlanDayId = planDay.id;
    testExerciseId = exercise.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a plan day exercise with all fields', () => {
      const pde = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sets: 3,
        reps: 10,
        weight: 135,
        rest_seconds: 90,
        sort_order: 0,
      });

      expect(pde).toMatchObject({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sets: 3,
        reps: 10,
        weight: 135,
        rest_seconds: 90,
        sort_order: 0,
      });
      expect(pde.id).toBeDefined();
    });

    it('should create with default values', () => {
      const pde = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });

      expect(pde.sets).toBe(2);
      expect(pde.reps).toBe(8);
      expect(pde.weight).toBe(30.0);
      expect(pde.rest_seconds).toBe(60);
    });

    it('should reject non-existent plan_day_id', () => {
      expect(() =>
        repository.create({
          plan_day_id: 999,
          exercise_id: testExerciseId,
          sort_order: 0,
        })
      ).toThrow();
    });

    it('should reject non-existent exercise_id', () => {
      expect(() =>
        repository.create({
          plan_day_id: testPlanDayId,
          exercise_id: 999,
          sort_order: 0,
        })
      ).toThrow();
    });
  });

  describe('findById', () => {
    it('should return plan day exercise when found', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const found = repository.findById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null when not found', () => {
      const found = repository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByPlanDayId', () => {
    it('should return all exercises for a plan day ordered by sort_order', () => {
      const exercise2 = exerciseRepository.create({ name: 'Squat' });

      repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: exercise2.id,
        sort_order: 1,
      });
      repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });

      const exercises = repository.findByPlanDayId(testPlanDayId);
      expect(exercises).toHaveLength(2);
      expect(exercises[0].exercise_id).toBe(testExerciseId);
      expect(exercises[1].exercise_id).toBe(exercise2.id);
    });

    it('should return empty array for plan day with no exercises', () => {
      const exercises = repository.findByPlanDayId(testPlanDayId);
      expect(exercises).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all plan day exercises', () => {
      repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });

      const exercises = repository.findAll();
      expect(exercises).toHaveLength(1);
    });

    it('should return empty array when none exist', () => {
      const exercises = repository.findAll();
      expect(exercises).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update sets', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const updated = repository.update(created.id, { sets: 5 });

      expect(updated?.sets).toBe(5);
    });

    it('should update reps', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const updated = repository.update(created.id, { reps: 12 });

      expect(updated?.reps).toBe(12);
    });

    it('should update weight', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const updated = repository.update(created.id, { weight: 200 });

      expect(updated?.weight).toBe(200);
    });

    it('should update rest_seconds', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const updated = repository.update(created.id, { rest_seconds: 120 });

      expect(updated?.rest_seconds).toBe(120);
    });

    it('should update multiple fields', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const updated = repository.update(created.id, {
        sets: 4,
        reps: 8,
        weight: 185,
        rest_seconds: 90,
      });

      expect(updated?.sets).toBe(4);
      expect(updated?.reps).toBe(8);
      expect(updated?.weight).toBe(185);
      expect(updated?.rest_seconds).toBe(90);
    });

    it('should return null for non-existent id', () => {
      const updated = repository.update(999, { sets: 5 });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing plan day exercise', () => {
      const created = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });
      const deleted = repository.delete(created.id);

      expect(deleted).toBe(true);
      expect(repository.findById(created.id)).toBeNull();
    });

    it('should return false for non-existent id', () => {
      const deleted = repository.delete(999);
      expect(deleted).toBe(false);
    });

    it('should cascade delete when plan day is deleted', () => {
      const pde = repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });

      planDayRepository.delete(testPlanDayId);

      expect(repository.findById(pde.id)).toBeNull();
    });

    it('should prevent deletion of exercise that is in use', () => {
      repository.create({
        plan_day_id: testPlanDayId,
        exercise_id: testExerciseId,
        sort_order: 0,
      });

      expect(() => exerciseRepository.delete(testExerciseId)).toThrow();
    });
  });
});
