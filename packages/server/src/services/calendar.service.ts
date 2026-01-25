import type { Database } from 'better-sqlite3';
import type {
  CalendarActivity,
  CalendarDayData,
  CalendarDataResponse,
  WorkoutActivitySummary,
  StretchActivitySummary,
} from '@lifting/shared';
import {
  WorkoutRepository,
  WorkoutSetRepository,
  PlanDayRepository,
  StretchSessionRepository,
} from '../repositories/index.js';

export class CalendarService {
  private workoutRepo: WorkoutRepository;
  private workoutSetRepo: WorkoutSetRepository;
  private planDayRepo: PlanDayRepository;
  private stretchSessionRepo: StretchSessionRepository;

  constructor(db: Database) {
    this.workoutRepo = new WorkoutRepository(db);
    this.workoutSetRepo = new WorkoutSetRepository(db);
    this.planDayRepo = new PlanDayRepository(db);
    this.stretchSessionRepo = new StretchSessionRepository(db);
  }

  /**
   * Convert a UTC ISO timestamp to local date string (YYYY-MM-DD) using timezone offset.
   * @param isoTimestamp - UTC ISO 8601 timestamp (e.g., "2024-01-26T03:00:00.000Z")
   * @param timezoneOffsetMinutes - Timezone offset in minutes (from JS getTimezoneOffset())
   *                                Positive = west of UTC (e.g., EST = 300)
   *                                Negative = east of UTC (e.g., UTC+2 = -120)
   * @returns Local date string in YYYY-MM-DD format
   */
  private utcToLocalDate(isoTimestamp: string, timezoneOffsetMinutes: number): string {
    const utcDate = new Date(isoTimestamp);
    // Subtract offset to convert UTC to local time
    // (getTimezoneOffset returns minutes behind UTC, so we subtract)
    const localTime = utcDate.getTime() - timezoneOffsetMinutes * 60 * 1000;
    const localDate = new Date(localTime);

    // Format as YYYY-MM-DD using UTC methods (since we already adjusted for timezone)
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get calendar data for a specific month.
   * @param year - The year (e.g., 2024)
   * @param month - The month (1-12)
   * @param timezoneOffsetMinutes - Timezone offset in minutes (from JS getTimezoneOffset())
   *                                Defaults to 0 (UTC) if not provided
   * @returns CalendarDataResponse with activities grouped by date
   */
  getMonthData(year: number, month: number, timezoneOffsetMinutes: number = 0): CalendarDataResponse {
    const { startDate, endDate } = this.getMonthBoundaries(year, month, timezoneOffsetMinutes);

    // Query completed workouts and stretch sessions for the date range
    const workouts = this.workoutRepo.findCompletedInDateRange(startDate, endDate, timezoneOffsetMinutes);
    const stretchSessions = this.stretchSessionRepo.findInDateRange(startDate, endDate, timezoneOffsetMinutes);

    // Transform to CalendarActivity[]
    const activities: CalendarActivity[] = [];

    // Transform workouts
    for (const workout of workouts) {
      const planDay = this.planDayRepo.findById(workout.plan_day_id);
      const sets = this.workoutSetRepo.findByWorkoutId(workout.id);

      // Count unique exercises
      const uniqueExerciseIds = new Set(sets.map((s) => s.exercise_id));

      // Count completed sets
      const completedSets = sets.filter((s) => s.status === 'completed').length;

      // Extract date from completed_at, converting UTC to local timezone
      const completedAt = workout.completed_at;
      const date =
        completedAt !== null && completedAt !== ''
          ? this.utcToLocalDate(completedAt, timezoneOffsetMinutes)
          : workout.scheduled_date;

      const summary: WorkoutActivitySummary = {
        dayName: planDay?.name ?? 'Unknown',
        exerciseCount: uniqueExerciseIds.size,
        setsCompleted: completedSets,
        totalSets: sets.length,
        weekNumber: workout.week_number,
        isDeload: workout.week_number === 7,
      };

      activities.push({
        id: `workout-${workout.id}`,
        type: 'workout',
        date,
        completedAt: workout.completed_at,
        summary,
      });
    }

    // Transform stretch sessions
    for (const session of stretchSessions) {
      // Extract date from completedAt, converting UTC to local timezone
      const date = this.utcToLocalDate(session.completedAt, timezoneOffsetMinutes);

      const summary: StretchActivitySummary = {
        totalDurationSeconds: session.totalDurationSeconds,
        regionsCompleted: session.regionsCompleted,
        regionsSkipped: session.regionsSkipped,
      };

      activities.push({
        id: `stretch-${session.id}`,
        type: 'stretch',
        date,
        completedAt: session.completedAt,
        summary,
      });
    }

    // Group activities by date
    const days: Record<string, CalendarDayData> = {};

    for (const activity of activities) {
      const existingDay = days[activity.date];
      const dayData: CalendarDayData = existingDay ?? {
        date: activity.date,
        activities: [],
        summary: {
          totalActivities: 0,
          completedActivities: 0,
          hasWorkout: false,
          hasStretch: false,
          hasMeditation: false,
        },
      };

      if (!existingDay) {
        days[activity.date] = dayData;
      }

      dayData.activities.push(activity);
      dayData.summary.totalActivities++;
      dayData.summary.completedActivities++;

      if (activity.type === 'workout') {
        dayData.summary.hasWorkout = true;
      } else if (activity.type === 'stretch') {
        dayData.summary.hasStretch = true;
      } else if (activity.type === 'meditation') {
        dayData.summary.hasMeditation = true;
      }
    }

    // Sort activities within each day by completion time
    for (const dayData of Object.values(days)) {
      dayData.activities.sort((a, b) => {
        const timeA = a.completedAt ?? '';
        const timeB = b.completedAt ?? '';
        return timeA.localeCompare(timeB);
      });
    }

    return {
      startDate,
      endDate,
      days,
    };
  }

  /**
   * Calculate the start and end dates for a given month.
   * @param year - The year
   * @param month - The month (1-12)
   * @param _timezoneOffsetMinutes - Timezone offset (unused here, boundaries are local dates)
   * @returns Object with startDate and endDate in YYYY-MM-DD format
   */
  private getMonthBoundaries(
    year: number,
    month: number,
    _timezoneOffsetMinutes: number = 0
  ): { startDate: string; endDate: string } {
    // Start date is the first day of the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

    // End date is the last day of the month
    // Create a date for the first day of the next month, then go back one day
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const lastDay = new Date(nextYear, nextMonth - 1, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
  }
}
