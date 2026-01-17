import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { WorkoutSetRepository } from '../workout-set.repository.js';
import { WorkoutRepository } from '../workout.repository.js';
import { MesocycleRepository } from '../mesocycle.repository.js';
import { PlanRepository } from '../plan.repository.js';
import { PlanDayRepository } from '../plan-day.repository.js';
import { ExerciseRepository } from '../exercise.repository.js';
import { Migrator } from '../../db/migrator.js';
import { migrations } from '../../db/migrations/index.js';

describe('WorkoutSetRepository', () => {
  let db: Database.Database;
  let repository: WorkoutSetRepository;
  let workoutRepository: WorkoutRepository;
  let exerciseRepository: ExerciseRepository;
  let testWorkoutId: number;
  let testExerciseId: number;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const migrator = new Migrator(db, migrations);
    migrator.up();

    repository = new WorkoutSetRepository(db);
    workoutRepository = new WorkoutRepository(db);
    exerciseRepository = new ExerciseRepository(db);

    // Create test data
    const planRepository = new PlanRepository(db);
    const planDayRepository = new PlanDayRepository(db);
    const mesocycleRepository = new MesocycleRepository(db);

    const plan = planRepository.create({ name: 'Test Plan' });
    const planDay = planDayRepository.create({
      plan_id: plan.id,
      day_of_week: 1,
      name: 'Push Day',
      sort_order: 0,
    });
    const mesocycle = mesocycleRepository.create({
      plan_id: plan.id,
      start_date: '2024-01-01',
    });
    const workout = workoutRepository.create({
      mesocycle_id: mesocycle.id,
      plan_day_id: planDay.id,
      week_number: 1,
      scheduled_date: '2024-01-01',
    });
    const exercise = exerciseRepository.create({ name: 'Bench Press' });

    testWorkoutId = workout.id;
    testExerciseId = exercise.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a workout set with all fields', () => {
      const workoutSet = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });

      expect(workoutSet).toMatchObject({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
        actual_reps: null,
        actual_weight: null,
        status: 'pending',
      });
      expect(workoutSet.id).toBeDefined();
    });

    it('should reject duplicate set_number for same workout/exercise', () => {
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });

      expect(() =>
        repository.create({
          workout_id: testWorkoutId,
          exercise_id: testExerciseId,
          set_number: 1,
          target_reps: 10,
          target_weight: 135,
        })
      ).toThrow();
    });

    it('should allow same set_number for different exercises', () => {
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });

      const exercise2 = exerciseRepository.create({ name: 'Squat' });

      const workoutSet = repository.create({
        workout_id: testWorkoutId,
        exercise_id: exercise2.id,
        set_number: 1,
        target_reps: 8,
        target_weight: 225,
      });

      expect(workoutSet.set_number).toBe(1);
    });

    it('should reject non-existent workout_id', () => {
      expect(() =>
        repository.create({
          workout_id: 999,
          exercise_id: testExerciseId,
          set_number: 1,
          target_reps: 10,
          target_weight: 135,
        })
      ).toThrow();
    });

    it('should reject non-existent exercise_id', () => {
      expect(() =>
        repository.create({
          workout_id: testWorkoutId,
          exercise_id: 999,
          set_number: 1,
          target_reps: 10,
          target_weight: 135,
        })
      ).toThrow();
    });
  });

  describe('findById', () => {
    it('should return workout set when found', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const found = repository.findById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null when not found', () => {
      const found = repository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByWorkoutId', () => {
    it('should return all sets for a workout ordered by exercise and set_number', () => {
      const exercise2 = exerciseRepository.create({ name: 'Squat' });

      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 2,
        target_reps: 10,
        target_weight: 135,
      });
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: exercise2.id,
        set_number: 1,
        target_reps: 8,
        target_weight: 225,
      });

      const sets = repository.findByWorkoutId(testWorkoutId);
      expect(sets).toHaveLength(3);
    });

    it('should return empty array for workout with no sets', () => {
      const sets = repository.findByWorkoutId(testWorkoutId);
      expect(sets).toEqual([]);
    });
  });

  describe('findByWorkoutAndExercise', () => {
    it('should return all sets for a specific workout/exercise ordered by set_number', () => {
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 2,
        target_reps: 10,
        target_weight: 135,
      });
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });

      const sets = repository.findByWorkoutAndExercise(
        testWorkoutId,
        testExerciseId
      );
      expect(sets).toHaveLength(2);
      expect(sets[0].set_number).toBe(1);
      expect(sets[1].set_number).toBe(2);
    });
  });

  describe('findByStatus', () => {
    it('should return only sets with matching status', () => {
      const pending = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const completed = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 2,
        target_reps: 10,
        target_weight: 135,
      });
      repository.update(completed.id, {
        status: 'completed',
        actual_reps: 10,
        actual_weight: 135,
      });

      const pendingSets = repository.findByStatus('pending');
      expect(pendingSets).toHaveLength(1);
      expect(pendingSets[0].id).toBe(pending.id);

      const completedSets = repository.findByStatus('completed');
      expect(completedSets).toHaveLength(1);
      expect(completedSets[0].id).toBe(completed.id);
    });
  });

  describe('findAll', () => {
    it('should return all workout sets', () => {
      repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });

      const sets = repository.findAll();
      expect(sets).toHaveLength(1);
    });

    it('should return empty array when none exist', () => {
      const sets = repository.findAll();
      expect(sets).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update actual_reps', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const updated = repository.update(created.id, { actual_reps: 8 });

      expect(updated?.actual_reps).toBe(8);
    });

    it('should update actual_weight', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const updated = repository.update(created.id, { actual_weight: 140 });

      expect(updated?.actual_weight).toBe(140);
    });

    it('should update status to completed', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const updated = repository.update(created.id, { status: 'completed' });

      expect(updated?.status).toBe('completed');
    });

    it('should update status to skipped', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const updated = repository.update(created.id, { status: 'skipped' });

      expect(updated?.status).toBe('skipped');
    });

    it('should update multiple fields', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const updated = repository.update(created.id, {
        actual_reps: 10,
        actual_weight: 135,
        status: 'completed',
      });

      expect(updated?.actual_reps).toBe(10);
      expect(updated?.actual_weight).toBe(135);
      expect(updated?.status).toBe('completed');
    });

    it('should allow setting actual_reps to null', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      repository.update(created.id, { actual_reps: 8 });
      const updated = repository.update(created.id, { actual_reps: null });

      expect(updated?.actual_reps).toBeNull();
    });

    it('should return null for non-existent id', () => {
      const updated = repository.update(999, { actual_reps: 10 });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing workout set', () => {
      const created = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });
      const deleted = repository.delete(created.id);

      expect(deleted).toBe(true);
      expect(repository.findById(created.id)).toBeNull();
    });

    it('should return false for non-existent id', () => {
      const deleted = repository.delete(999);
      expect(deleted).toBe(false);
    });

    it('should cascade delete when workout is deleted', () => {
      const workoutSet = repository.create({
        workout_id: testWorkoutId,
        exercise_id: testExerciseId,
        set_number: 1,
        target_reps: 10,
        target_weight: 135,
      });

      workoutRepository.delete(testWorkoutId);

      expect(repository.findById(workoutSet.id)).toBeNull();
    });
  });
});
