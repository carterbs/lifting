import type { Database } from 'better-sqlite3';
import type { WorkoutSet, LogWorkoutSetInput } from '@lifting/shared';
import { WorkoutSetRepository, WorkoutRepository } from '../repositories/index.js';

export class WorkoutSetService {
  private workoutSetRepo: WorkoutSetRepository;
  private workoutRepo: WorkoutRepository;

  constructor(db: Database) {
    this.workoutSetRepo = new WorkoutSetRepository(db);
    this.workoutRepo = new WorkoutRepository(db);
  }

  /**
   * Get a workout set by ID
   */
  getById(id: number): WorkoutSet | null {
    return this.workoutSetRepo.findById(id);
  }

  /**
   * Log actual reps and weight for a set
   * Auto-starts the workout if not already started
   */
  log(id: number, data: LogWorkoutSetInput): WorkoutSet {
    const workoutSet = this.workoutSetRepo.findById(id);
    if (!workoutSet) {
      throw new Error(`WorkoutSet with id ${id} not found`);
    }

    // Validate input
    if (data.actual_reps < 0) {
      throw new Error('Reps must be a non-negative number');
    }

    if (data.actual_weight < 0) {
      throw new Error('Weight must be a non-negative number');
    }

    // Check workout status
    const workout = this.workoutRepo.findById(workoutSet.workout_id);
    if (!workout) {
      throw new Error(`Workout with id ${workoutSet.workout_id} not found`);
    }

    if (workout.status === 'completed') {
      throw new Error('Cannot log sets for a completed workout');
    }

    if (workout.status === 'skipped') {
      throw new Error('Cannot log sets for a skipped workout');
    }

    // Auto-start workout if pending
    if (workout.status === 'pending') {
      this.workoutRepo.update(workout.id, {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });
    }

    // Update the set
    const updated = this.workoutSetRepo.update(id, {
      actual_reps: data.actual_reps,
      actual_weight: data.actual_weight,
      status: 'completed',
    });

    if (!updated) {
      throw new Error(`Failed to update WorkoutSet with id ${id}`);
    }

    return updated;
  }

  /**
   * Skip a set
   * Auto-starts the workout if not already started
   * Clears any previously logged values
   */
  skip(id: number): WorkoutSet {
    const workoutSet = this.workoutSetRepo.findById(id);
    if (!workoutSet) {
      throw new Error(`WorkoutSet with id ${id} not found`);
    }

    // Check workout status
    const workout = this.workoutRepo.findById(workoutSet.workout_id);
    if (!workout) {
      throw new Error(`Workout with id ${workoutSet.workout_id} not found`);
    }

    if (workout.status === 'completed') {
      throw new Error('Cannot skip sets for a completed workout');
    }

    if (workout.status === 'skipped') {
      throw new Error('Cannot skip sets for a skipped workout');
    }

    // Auto-start workout if pending
    if (workout.status === 'pending') {
      this.workoutRepo.update(workout.id, {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });
    }

    // Update the set - clear actual values and set status to skipped
    const updated = this.workoutSetRepo.update(id, {
      actual_reps: null,
      actual_weight: null,
      status: 'skipped',
    });

    if (!updated) {
      throw new Error(`Failed to update WorkoutSet with id ${id}`);
    }

    return updated;
  }
}
