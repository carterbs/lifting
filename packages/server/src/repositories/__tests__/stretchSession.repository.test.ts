import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { StretchSessionRepository } from '../stretchSession.repository.js';
import { Migrator } from '../../db/migrator.js';
import { migrations } from '../../db/migrations/index.js';

describe('StretchSessionRepository', () => {
  let db: Database.Database;
  let repository: StretchSessionRepository;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const migrator = new Migrator(db, migrations);
    migrator.up();

    repository = new StretchSessionRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('findInDateRange', () => {
    it('should return sessions within date range', () => {
      const session = repository.create({
        completedAt: '2024-01-15T10:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [
          {
            region: 'neck',
            stretchName: 'Neck Tilt',
            side: 'left',
            durationSeconds: 30,
            skipped: false,
          },
        ],
      });

      const results = repository.findInDateRange('2024-01-01', '2024-01-31');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(session.id);
    });

    it('should be inclusive of start date', () => {
      const session = repository.create({
        completedAt: '2024-01-15T00:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const results = repository.findInDateRange('2024-01-15', '2024-01-31');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(session.id);
    });

    it('should be inclusive of end date', () => {
      const session = repository.create({
        completedAt: '2024-01-31T23:59:59.999Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const results = repository.findInDateRange('2024-01-01', '2024-01-31');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(session.id);
    });

    it('should exclude sessions before start date', () => {
      repository.create({
        completedAt: '2024-01-14T23:59:59.999Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const results = repository.findInDateRange('2024-01-15', '2024-01-31');
      expect(results).toHaveLength(0);
    });

    it('should exclude sessions after end date', () => {
      repository.create({
        completedAt: '2024-02-01T00:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const results = repository.findInDateRange('2024-01-01', '2024-01-31');
      expect(results).toHaveLength(0);
    });

    it('should return empty array when no sessions in range', () => {
      const results = repository.findInDateRange('2024-01-01', '2024-01-31');
      expect(results).toEqual([]);
    });

    it('should return multiple sessions ordered by completedAt', () => {
      // Create sessions out of order
      const session1 = repository.create({
        completedAt: '2024-01-20T10:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const session2 = repository.create({
        completedAt: '2024-01-10T10:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const session3 = repository.create({
        completedAt: '2024-01-15T10:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const results = repository.findInDateRange('2024-01-01', '2024-01-31');
      expect(results).toHaveLength(3);
      // Should be ordered by completedAt ascending
      expect(results[0].id).toBe(session2.id);
      expect(results[1].id).toBe(session3.id);
      expect(results[2].id).toBe(session1.id);
    });

    it('should work with single-day range', () => {
      // Session at start of day
      const session1 = repository.create({
        completedAt: '2024-01-15T00:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      // Session at end of day
      const session2 = repository.create({
        completedAt: '2024-01-15T23:59:59.999Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      // Session on different day
      repository.create({
        completedAt: '2024-01-16T10:00:00.000Z',
        totalDurationSeconds: 300,
        regionsCompleted: 3,
        regionsSkipped: 0,
        stretches: [],
      });

      const results = repository.findInDateRange('2024-01-15', '2024-01-15');
      expect(results).toHaveLength(2);
      expect(results.map((s) => s.id)).toContain(session1.id);
      expect(results.map((s) => s.id)).toContain(session2.id);
    });

    describe('timezone-aware date range queries', () => {
      it('should include sessions at 10 PM EST when querying for that local date', () => {
        // Session at 10 PM EST on Jan 25 = 3 AM UTC on Jan 26
        const session = repository.create({
          completedAt: '2024-01-26T03:00:00.000Z',
          totalDurationSeconds: 300,
          regionsCompleted: 3,
          regionsSkipped: 0,
          stretches: [],
        });

        // Query for Jan 25 with EST offset (300 minutes)
        // Local Jan 25 00:00 EST = Jan 25 05:00 UTC
        // Local Jan 25 23:59 EST = Jan 26 04:59 UTC
        const results = repository.findInDateRange('2024-01-25', '2024-01-25', 300);

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(session.id);
      });

      it('should exclude sessions outside local date range when using timezone', () => {
        // Session at 3 AM EST on Jan 26 = 8 AM UTC on Jan 26
        repository.create({
          completedAt: '2024-01-26T08:00:00.000Z',
          totalDurationSeconds: 300,
          regionsCompleted: 3,
          regionsSkipped: 0,
          stretches: [],
        });

        // Query for Jan 25 with EST offset (300 minutes)
        // This session at 3 AM EST Jan 26 should NOT be included
        const results = repository.findInDateRange('2024-01-25', '2024-01-25', 300);

        expect(results).toHaveLength(0);
      });

      it('should handle UTC+2 timezone correctly', () => {
        // Session at 1 AM UTC+2 on Jan 26 = 11 PM UTC on Jan 25
        const session = repository.create({
          completedAt: '2024-01-25T23:00:00.000Z',
          totalDurationSeconds: 300,
          regionsCompleted: 3,
          regionsSkipped: 0,
          stretches: [],
        });

        // Query for Jan 26 with UTC+2 offset (-120 minutes)
        // Local Jan 26 00:00 UTC+2 = Jan 25 22:00 UTC
        // Local Jan 26 23:59 UTC+2 = Jan 26 21:59 UTC
        const results = repository.findInDateRange('2024-01-26', '2024-01-26', -120);

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(session.id);
      });

      it('should default to UTC when no timezone offset provided', () => {
        // Session at 3 AM UTC on Jan 26
        repository.create({
          completedAt: '2024-01-26T03:00:00.000Z',
          totalDurationSeconds: 300,
          regionsCompleted: 3,
          regionsSkipped: 0,
          stretches: [],
        });

        // Query for Jan 25 without timezone offset (defaults to UTC)
        const results = repository.findInDateRange('2024-01-25', '2024-01-25');

        // Should NOT include the session since it's on Jan 26 UTC
        expect(results).toHaveLength(0);
      });
    });
  });
});
