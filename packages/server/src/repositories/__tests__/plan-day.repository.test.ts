import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { PlanDayRepository } from '../plan-day.repository.js';
import { PlanRepository } from '../plan.repository.js';
import { Migrator } from '../../db/migrator.js';
import { migrations } from '../../db/migrations/index.js';

describe('PlanDayRepository', () => {
  let db: Database.Database;
  let repository: PlanDayRepository;
  let planRepository: PlanRepository;
  let testPlanId: number;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const migrator = new Migrator(db, migrations);
    migrator.up();

    repository = new PlanDayRepository(db);
    planRepository = new PlanRepository(db);

    // Create a test plan
    const plan = planRepository.create({ name: 'Test Plan' });
    testPlanId = plan.id;
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a plan day with all fields', () => {
      const planDay = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Push Day',
        sort_order: 0,
      });

      expect(planDay).toMatchObject({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Push Day',
        sort_order: 0,
      });
      expect(planDay.id).toBeDefined();
    });

    it('should reject invalid day_of_week', () => {
      expect(() =>
        repository.create({
          plan_id: testPlanId,
          day_of_week: 7 as 0,
          name: 'Invalid Day',
          sort_order: 0,
        })
      ).toThrow();
    });

    it('should reject duplicate day_of_week for same plan', () => {
      repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Monday Workout',
        sort_order: 0,
      });

      expect(() =>
        repository.create({
          plan_id: testPlanId,
          day_of_week: 1,
          name: 'Another Monday',
          sort_order: 1,
        })
      ).toThrow();
    });

    it('should allow same day_of_week for different plans', () => {
      repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Push Day Plan 1',
        sort_order: 0,
      });

      const plan2 = planRepository.create({ name: 'Another Plan' });

      const planDay = repository.create({
        plan_id: plan2.id,
        day_of_week: 1,
        name: 'Push Day Plan 2',
        sort_order: 0,
      });

      expect(planDay.day_of_week).toBe(1);
    });

    it('should reject non-existent plan_id', () => {
      expect(() =>
        repository.create({
          plan_id: 999,
          day_of_week: 1,
          name: 'Orphan Day',
          sort_order: 0,
        })
      ).toThrow();
    });
  });

  describe('findById', () => {
    it('should return plan day when found', () => {
      const created = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Push Day',
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

  describe('findByPlanId', () => {
    it('should return all plan days for a plan ordered by sort_order', () => {
      repository.create({
        plan_id: testPlanId,
        day_of_week: 3,
        name: 'Legs',
        sort_order: 2,
      });
      repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Push',
        sort_order: 0,
      });
      repository.create({
        plan_id: testPlanId,
        day_of_week: 2,
        name: 'Pull',
        sort_order: 1,
      });

      const planDays = repository.findByPlanId(testPlanId);
      expect(planDays).toHaveLength(3);
      expect(planDays[0].name).toBe('Push');
      expect(planDays[1].name).toBe('Pull');
      expect(planDays[2].name).toBe('Legs');
    });

    it('should return empty array for plan with no days', () => {
      const planDays = repository.findByPlanId(testPlanId);
      expect(planDays).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all plan days', () => {
      repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Push Day',
        sort_order: 0,
      });
      repository.create({
        plan_id: testPlanId,
        day_of_week: 2,
        name: 'Pull Day',
        sort_order: 1,
      });

      const planDays = repository.findAll();
      expect(planDays).toHaveLength(2);
    });

    it('should return empty array when none exist', () => {
      const planDays = repository.findAll();
      expect(planDays).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update plan day name', () => {
      const created = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Old Name',
        sort_order: 0,
      });
      const updated = repository.update(created.id, { name: 'New Name' });

      expect(updated?.name).toBe('New Name');
    });

    it('should update day_of_week', () => {
      const created = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Test Day',
        sort_order: 0,
      });
      const updated = repository.update(created.id, { day_of_week: 2 });

      expect(updated?.day_of_week).toBe(2);
    });

    it('should update sort_order', () => {
      const created = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Test Day',
        sort_order: 0,
      });
      const updated = repository.update(created.id, { sort_order: 5 });

      expect(updated?.sort_order).toBe(5);
    });

    it('should return null for non-existent id', () => {
      const updated = repository.update(999, { name: 'New Name' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing plan day', () => {
      const created = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Test Day',
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

    it('should cascade delete when plan is deleted', () => {
      const planDay = repository.create({
        plan_id: testPlanId,
        day_of_week: 1,
        name: 'Test Day',
        sort_order: 0,
      });

      planRepository.delete(testPlanId);

      expect(repository.findById(planDay.id)).toBeNull();
    });
  });
});
