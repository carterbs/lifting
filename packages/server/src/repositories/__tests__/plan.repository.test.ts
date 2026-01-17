import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { PlanRepository } from '../plan.repository.js';
import { Migrator } from '../../db/migrator.js';
import { migrations } from '../../db/migrations/index.js';

describe('PlanRepository', () => {
  let db: Database.Database;
  let repository: PlanRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const migrator = new Migrator(db, migrations);
    migrator.up();

    repository = new PlanRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a plan with all fields', () => {
      const plan = repository.create({
        name: 'Push/Pull/Legs',
        duration_weeks: 8,
      });

      expect(plan).toMatchObject({
        name: 'Push/Pull/Legs',
        duration_weeks: 8,
      });
      expect(plan.id).toBeDefined();
      expect(plan.created_at).toBeDefined();
      expect(plan.updated_at).toBeDefined();
    });

    it('should create a plan with default duration_weeks', () => {
      const plan = repository.create({ name: 'Upper/Lower' });
      expect(plan.duration_weeks).toBe(6);
    });
  });

  describe('findById', () => {
    it('should return plan when found', () => {
      const created = repository.create({ name: 'Push/Pull/Legs' });
      const found = repository.findById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null when not found', () => {
      const found = repository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all plans ordered by name', () => {
      repository.create({ name: 'Zzz Last Plan' });
      repository.create({ name: 'Aaa First Plan' });

      const plans = repository.findAll();
      expect(plans).toHaveLength(2);
      expect(plans[0].name).toBe('Aaa First Plan');
      expect(plans[1].name).toBe('Zzz Last Plan');
    });

    it('should return empty array when none exist', () => {
      const plans = repository.findAll();
      expect(plans).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update plan name', () => {
      const created = repository.create({ name: 'Old Name' });
      const updated = repository.update(created.id, { name: 'New Name' });

      expect(updated?.name).toBe('New Name');
      expect(updated?.updated_at).not.toBe(created.updated_at);
    });

    it('should update duration_weeks', () => {
      const created = repository.create({ name: 'Test Plan' });
      const updated = repository.update(created.id, { duration_weeks: 8 });

      expect(updated?.duration_weeks).toBe(8);
    });

    it('should update multiple fields', () => {
      const created = repository.create({ name: 'Old Name' });
      const updated = repository.update(created.id, {
        name: 'New Name',
        duration_weeks: 10,
      });

      expect(updated?.name).toBe('New Name');
      expect(updated?.duration_weeks).toBe(10);
    });

    it('should return null for non-existent id', () => {
      const updated = repository.update(999, { name: 'New Name' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing plan', () => {
      const created = repository.create({ name: 'Test Plan' });
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
    it('should return false when plan is not used in mesocycles', () => {
      const created = repository.create({ name: 'Test Plan' });
      expect(repository.isInUse(created.id)).toBe(false);
    });
  });
});
