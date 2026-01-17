import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { setupTestApp, teardownTestApp, type TestContext } from '../../test/test-app.js';
import { ExerciseRepository } from '../../repositories/exercise.repository.js';

describe('Exercise Routes', () => {
  let ctx: TestContext;
  let app: Express;
  let db: Database.Database;
  let repository: ExerciseRepository;

  beforeEach(() => {
    ctx = setupTestApp(true); // with seeds
    app = ctx.app;
    db = ctx.db;
    repository = new ExerciseRepository(db);
  });

  afterEach(() => {
    teardownTestApp(ctx);
  });

  describe('GET /api/exercises', () => {
    it('should return 200 with array of exercises', async () => {
      const response = await request(app).get('/api/exercises');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return exercises in alphabetical order', async () => {
      const response = await request(app).get('/api/exercises');

      expect(response.status).toBe(200);
      const names = response.body.data.map((e: { name: string }) => e.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should include all seeded built-in exercises', async () => {
      const response = await request(app).get('/api/exercises');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(12);

      // Check for specific exercises
      const names = response.body.data.map((e: { name: string }) => e.name);
      expect(names).toContain('Dumbbell Press (flat)');
      expect(names).toContain('Seated Cable Row');
      expect(names).toContain('Leg Extension');
    });

    it('should include both built-in and custom exercises', async () => {
      // Add a custom exercise
      repository.create({ name: 'Custom Squat', is_custom: true });

      const response = await request(app).get('/api/exercises');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(13);

      const customExercise = response.body.data.find(
        (e: { name: string }) => e.name === 'Custom Squat'
      );
      expect(customExercise).toBeDefined();
      expect(customExercise.is_custom).toBe(true);
    });
  });

  describe('GET /api/exercises/:id', () => {
    it('should return 200 with exercise when found', async () => {
      const exercise = repository.findByName('Leg Extension');
      expect(exercise).not.toBeNull();

      const response = await request(app).get(`/api/exercises/${exercise!.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Leg Extension');
      expect(response.body.data.id).toBe(exercise!.id);
    });

    it('should return 404 when exercise not found', async () => {
      const response = await request(app).get('/api/exercises/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for invalid id format', async () => {
      const response = await request(app).get('/api/exercises/invalid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/exercises', () => {
    it('should return 201 with created exercise', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: 'Barbell Squat', weight_increment: 10 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Barbell Squat');
      expect(response.body.data.weight_increment).toBe(10);
      expect(response.body.data.is_custom).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should use default weight_increment of 5 when not provided', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: 'Barbell Deadlift' });

      expect(response.status).toBe(201);
      expect(response.body.data.weight_increment).toBe(5);
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ weight_increment: 5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when name is empty', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when name exceeds 100 characters', async () => {
      const longName = 'A'.repeat(101);
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: longName });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when weight_increment is negative', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: 'Test Exercise', weight_increment: -5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when weight_increment is zero', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: 'Test Exercise', weight_increment: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 when exercise name already exists', async () => {
      const response = await request(app)
        .post('/api/exercises')
        .send({ name: 'Leg Extension' }); // Already exists as built-in

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PUT /api/exercises/:id', () => {
    let customExercise: { id: number; name: string };

    beforeEach(() => {
      customExercise = repository.create({
        name: 'Custom Press',
        weight_increment: 5,
        is_custom: true,
      });
    });

    it('should return 200 with updated exercise', async () => {
      const response = await request(app)
        .put(`/api/exercises/${customExercise.id}`)
        .send({ name: 'Updated Custom Press' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Custom Press');
    });

    it('should update weight_increment', async () => {
      const response = await request(app)
        .put(`/api/exercises/${customExercise.id}`)
        .send({ weight_increment: 2.5 });

      expect(response.status).toBe(200);
      expect(response.body.data.weight_increment).toBe(2.5);
    });

    it('should update multiple fields', async () => {
      const response = await request(app)
        .put(`/api/exercises/${customExercise.id}`)
        .send({ name: 'New Name', weight_increment: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.weight_increment).toBe(10);
    });

    it('should return 404 when exercise not found', async () => {
      const response = await request(app)
        .put('/api/exercises/99999')
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for invalid id format', async () => {
      const response = await request(app)
        .put('/api/exercises/invalid')
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when name is empty string', async () => {
      const response = await request(app)
        .put(`/api/exercises/${customExercise.id}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 when updating to existing name', async () => {
      const response = await request(app)
        .put(`/api/exercises/${customExercise.id}`)
        .send({ name: 'Leg Extension' }); // Already exists

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should allow updating built-in exercises', async () => {
      const builtIn = repository.findByName('Leg Extension');
      expect(builtIn).not.toBeNull();

      const response = await request(app)
        .put(`/api/exercises/${builtIn!.id}`)
        .send({ weight_increment: 2.5 });

      expect(response.status).toBe(200);
      expect(response.body.data.weight_increment).toBe(2.5);
    });
  });

  describe('DELETE /api/exercises/:id', () => {
    it('should return 204 on successful deletion of custom exercise', async () => {
      const customExercise = repository.create({
        name: 'Custom Exercise',
        is_custom: true,
      });

      const response = await request(app).delete(
        `/api/exercises/${customExercise.id}`
      );

      expect(response.status).toBe(204);

      // Verify exercise is deleted
      const found = repository.findById(customExercise.id);
      expect(found).toBeNull();
    });

    it('should return 404 when exercise not found', async () => {
      const response = await request(app).delete('/api/exercises/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 when attempting to delete built-in exercise', async () => {
      const builtIn = repository.findByName('Leg Extension');
      expect(builtIn).not.toBeNull();
      expect(builtIn!.is_custom).toBe(false);

      const response = await request(app).delete(
        `/api/exercises/${builtIn!.id}`
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBe('Cannot delete built-in exercises');

      // Verify exercise still exists
      const stillExists = repository.findById(builtIn!.id);
      expect(stillExists).not.toBeNull();
    });

    it('should return 404 for invalid id format', async () => {
      const response = await request(app).delete('/api/exercises/invalid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 when exercise is used in a plan', async () => {
      // Create a plan and day to link an exercise
      const planStmt = db.prepare(
        'INSERT INTO plans (name, duration_weeks) VALUES (?, ?)'
      );
      const planResult = planStmt.run('Test Plan', 6);
      const planId = planResult.lastInsertRowid;

      const dayStmt = db.prepare(
        'INSERT INTO plan_days (plan_id, day_of_week, name, sort_order) VALUES (?, ?, ?, ?)'
      );
      const dayResult = dayStmt.run(planId, 1, 'Day 1', 0);
      const dayId = dayResult.lastInsertRowid;

      // Create a custom exercise and link it
      const customExercise = repository.create({
        name: 'Linked Exercise',
        is_custom: true,
      });

      const linkStmt = db.prepare(
        'INSERT INTO plan_day_exercises (plan_day_id, exercise_id, sets, reps, weight, rest_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      linkStmt.run(dayId, customExercise.id, 3, 8, 100, 60, 0);

      const response = await request(app).delete(
        `/api/exercises/${customExercise.id}`
      );

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });
});
