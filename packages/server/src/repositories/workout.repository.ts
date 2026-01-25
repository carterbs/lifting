import type { Database } from 'better-sqlite3';
import type {
  Workout,
  CreateWorkoutDTO,
  UpdateWorkoutDTO,
  WorkoutStatus,
} from '@lifting/shared';
import { BaseRepository } from './base.repository.js';

interface WorkoutRow {
  id: number;
  mesocycle_id: number;
  plan_day_id: number;
  week_number: number;
  scheduled_date: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

export class WorkoutRepository extends BaseRepository<
  Workout,
  CreateWorkoutDTO,
  UpdateWorkoutDTO
> {
  constructor(db: Database) {
    super(db, 'workouts');
  }

  private rowToWorkout(row: WorkoutRow): Workout {
    return {
      id: row.id,
      mesocycle_id: row.mesocycle_id,
      plan_day_id: row.plan_day_id,
      week_number: row.week_number,
      scheduled_date: row.scheduled_date,
      status: row.status as WorkoutStatus,
      started_at: row.started_at,
      completed_at: row.completed_at,
    };
  }

  create(data: CreateWorkoutDTO): Workout {
    const stmt = this.db.prepare(`
      INSERT INTO workouts (mesocycle_id, plan_day_id, week_number, scheduled_date)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.mesocycle_id,
      data.plan_day_id,
      data.week_number,
      data.scheduled_date
    );

    const workout = this.findById(result.lastInsertRowid as number);
    if (!workout) {
      throw new Error('Failed to retrieve newly created workout');
    }
    return workout;
  }

  findById(id: number): Workout | null {
    const stmt = this.db.prepare('SELECT * FROM workouts WHERE id = ?');
    const row = stmt.get(id) as WorkoutRow | undefined;
    return row ? this.rowToWorkout(row) : null;
  }

  findByMesocycleId(mesocycleId: number): Workout[] {
    const stmt = this.db.prepare(
      'SELECT * FROM workouts WHERE mesocycle_id = ? ORDER BY scheduled_date'
    );
    const rows = stmt.all(mesocycleId) as WorkoutRow[];
    return rows.map((row) => this.rowToWorkout(row));
  }

  findByStatus(status: WorkoutStatus): Workout[] {
    const stmt = this.db.prepare(
      'SELECT * FROM workouts WHERE status = ? ORDER BY scheduled_date'
    );
    const rows = stmt.all(status) as WorkoutRow[];
    return rows.map((row) => this.rowToWorkout(row));
  }

  findByDate(date: string): Workout[] {
    const stmt = this.db.prepare(
      'SELECT * FROM workouts WHERE scheduled_date = ?'
    );
    const rows = stmt.all(date) as WorkoutRow[];
    return rows.map((row) => this.rowToWorkout(row));
  }

  /**
   * Find the previous week's workout for the same plan day within the same mesocycle
   */
  findPreviousWeekWorkout(
    mesocycleId: number,
    planDayId: number,
    currentWeekNumber: number
  ): Workout | null {
    if (currentWeekNumber <= 1) {
      return null;
    }

    const stmt = this.db.prepare(`
      SELECT * FROM workouts
      WHERE mesocycle_id = ?
        AND plan_day_id = ?
        AND week_number = ?
    `);
    const row = stmt.get(
      mesocycleId,
      planDayId,
      currentWeekNumber - 1
    ) as WorkoutRow | undefined;
    return row ? this.rowToWorkout(row) : null;
  }

  /**
   * Find the next upcoming workout (pending or in_progress) ordered by scheduled date.
   * Returns the first pending/in_progress workout regardless of whether its
   * scheduled_date is in the past, so users who miss a day still see their next workout.
   */
  findNextPending(): Workout | null {
    const stmt = this.db.prepare(`
      SELECT * FROM workouts
      WHERE status IN ('pending', 'in_progress')
      ORDER BY scheduled_date ASC, id ASC
      LIMIT 1
    `);
    const row = stmt.get() as WorkoutRow | undefined;
    return row ? this.rowToWorkout(row) : null;
  }

  findAll(): Workout[] {
    const stmt = this.db.prepare(
      'SELECT * FROM workouts ORDER BY scheduled_date DESC'
    );
    const rows = stmt.all() as WorkoutRow[];
    return rows.map((row) => this.rowToWorkout(row));
  }

  /**
   * Convert local date boundaries to UTC timestamp boundaries.
   * @param localDate - Local date in YYYY-MM-DD format
   * @param isEndOfDay - Whether this is end of day (23:59:59.999) or start (00:00:00.000)
   * @param timezoneOffsetMinutes - Timezone offset from JS getTimezoneOffset()
   * @returns UTC ISO timestamp
   */
  private localDateToUtcBoundary(
    localDate: string,
    isEndOfDay: boolean,
    timezoneOffsetMinutes: number
  ): string {
    // Parse the local date
    const parts = localDate.split('-').map(Number);
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 1;
    const day = parts[2] ?? 1;

    // Create local time boundary (start or end of day)
    const localTime = isEndOfDay
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);

    // Convert to UTC by adding the timezone offset
    // (getTimezoneOffset returns minutes behind UTC, so we add to get UTC)
    const utcTime = new Date(localTime.getTime() + timezoneOffsetMinutes * 60 * 1000);

    return utcTime.toISOString();
  }

  /**
   * Find completed workouts where completed_at falls within the date range.
   * Date range is inclusive of both start and end dates in the user's local timezone.
   * @param startDate - Start date in YYYY-MM-DD format (local timezone)
   * @param endDate - End date in YYYY-MM-DD format (local timezone)
   * @param timezoneOffsetMinutes - Timezone offset from JS getTimezoneOffset() (default 0 = UTC)
   */
  findCompletedInDateRange(
    startDate: string,
    endDate: string,
    timezoneOffsetMinutes: number = 0
  ): Workout[] {
    const stmt = this.db.prepare(`
      SELECT * FROM workouts
      WHERE status = 'completed'
        AND completed_at >= ?
        AND completed_at <= ?
      ORDER BY completed_at ASC
    `);
    // Convert local date boundaries to UTC timestamps
    const startTimestamp = this.localDateToUtcBoundary(startDate, false, timezoneOffsetMinutes);
    const endTimestamp = this.localDateToUtcBoundary(endDate, true, timezoneOffsetMinutes);
    const rows = stmt.all(startTimestamp, endTimestamp) as WorkoutRow[];
    return rows.map((row) => this.rowToWorkout(row));
  }

  update(id: number, data: UpdateWorkoutDTO): Workout | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (data.started_at !== undefined) {
      updates.push('started_at = ?');
      values.push(data.started_at);
    }

    if (data.completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(data.completed_at);
    }

    if (updates.length === 0) return existing;

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE workouts SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM workouts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
