import type { Database } from 'better-sqlite3';
import type {
  Workout,
  WorkoutSet,
  WorkoutExercise,
} from '@lifting/shared';
import {
  WorkoutRepository,
  WorkoutSetRepository,
  PlanDayRepository,
  PlanDayExerciseRepository,
  ExerciseRepository,
} from '../repositories/index.js';

/**
 * Extended workout type with all sets grouped by exercise
 */
export interface WorkoutWithExercises extends Workout {
  plan_day_name: string;
  exercises: WorkoutExerciseWithSets[];
}

export interface WorkoutExerciseWithSets extends WorkoutExercise {
  rest_seconds: number;
}

export class WorkoutService {
  private workoutRepo: WorkoutRepository;
  private workoutSetRepo: WorkoutSetRepository;
  private planDayRepo: PlanDayRepository;
  private planDayExerciseRepo: PlanDayExerciseRepository;
  private exerciseRepo: ExerciseRepository;

  constructor(db: Database) {
    this.workoutRepo = new WorkoutRepository(db);
    this.workoutSetRepo = new WorkoutSetRepository(db);
    this.planDayRepo = new PlanDayRepository(db);
    this.planDayExerciseRepo = new PlanDayExerciseRepository(db);
    this.exerciseRepo = new ExerciseRepository(db);
  }

  /**
   * Get a workout by ID with all sets grouped by exercise
   */
  getById(id: number): WorkoutWithExercises | null {
    const workout = this.workoutRepo.findById(id);
    if (!workout) {
      return null;
    }

    return this.buildWorkoutWithExercises(workout);
  }

  /**
   * Get today's workout that is pending or in_progress
   * Returns null if no workout scheduled or if workout is already completed/skipped
   */
  getTodaysWorkout(): WorkoutWithExercises | null {
    const todayParts = new Date().toISOString().split('T');
    const today = todayParts[0] ?? '';
    const workouts = this.workoutRepo.findByDate(today);

    // Find a workout that is pending or in_progress
    const activeWorkout = workouts.find(
      (w) => w.status === 'pending' || w.status === 'in_progress'
    );

    if (!activeWorkout) {
      return null;
    }

    return this.buildWorkoutWithExercises(activeWorkout);
  }

  /**
   * Start a workout (mark as in_progress)
   */
  start(id: number): Workout {
    const workout = this.workoutRepo.findById(id);
    if (!workout) {
      throw new Error(`Workout with id ${id} not found`);
    }

    if (workout.status === 'in_progress') {
      throw new Error('Workout is already in progress');
    }

    if (workout.status === 'completed') {
      throw new Error('Cannot start a completed workout');
    }

    if (workout.status === 'skipped') {
      throw new Error('Cannot start a skipped workout');
    }

    const updated = this.workoutRepo.update(id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error(`Failed to update workout with id ${id}`);
    }

    return updated;
  }

  /**
   * Complete a workout
   */
  complete(id: number): Workout {
    const workout = this.workoutRepo.findById(id);
    if (!workout) {
      throw new Error(`Workout with id ${id} not found`);
    }

    if (workout.status === 'pending') {
      throw new Error('Cannot complete a workout that has not been started');
    }

    if (workout.status === 'completed') {
      throw new Error('Workout is already completed');
    }

    if (workout.status === 'skipped') {
      throw new Error('Cannot complete a skipped workout');
    }

    const updated = this.workoutRepo.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error(`Failed to update workout with id ${id}`);
    }

    return updated;
  }

  /**
   * Skip a workout
   * Also marks all pending sets as skipped (preserves logged sets)
   */
  skip(id: number): Workout {
    const workout = this.workoutRepo.findById(id);
    if (!workout) {
      throw new Error(`Workout with id ${id} not found`);
    }

    if (workout.status === 'completed') {
      throw new Error('Cannot skip a completed workout');
    }

    if (workout.status === 'skipped') {
      throw new Error('Workout is already skipped');
    }

    // Mark all pending sets as skipped
    const sets = this.workoutSetRepo.findByWorkoutId(id);
    for (const set of sets) {
      if (set.status === 'pending') {
        this.workoutSetRepo.update(set.id, { status: 'skipped' });
      }
    }

    const updated = this.workoutRepo.update(id, { status: 'skipped' });

    if (!updated) {
      throw new Error(`Failed to update workout with id ${id}`);
    }

    return updated;
  }

  /**
   * Build a workout with exercises grouped
   */
  private buildWorkoutWithExercises(workout: Workout): WorkoutWithExercises {
    const planDay = this.planDayRepo.findById(workout.plan_day_id);
    const planDayExercises = this.planDayExerciseRepo.findByPlanDayId(
      workout.plan_day_id
    );
    const sets = this.workoutSetRepo.findByWorkoutId(workout.id);

    // Group sets by exercise
    const setsByExercise = new Map<number, WorkoutSet[]>();
    for (const set of sets) {
      const existing = setsByExercise.get(set.exercise_id) ?? [];
      existing.push(set);
      setsByExercise.set(set.exercise_id, existing);
    }

    // Build exercises array in plan order
    const exercises: WorkoutExerciseWithSets[] = [];

    // Sort plan day exercises by sort_order
    const sortedPlanDayExercises = [...planDayExercises].sort(
      (a, b) => a.sort_order - b.sort_order
    );

    for (const pde of sortedPlanDayExercises) {
      const exercise = this.exerciseRepo.findById(pde.exercise_id);
      if (!exercise) continue;

      const exerciseSets = setsByExercise.get(pde.exercise_id) ?? [];
      // Sort sets by set_number
      exerciseSets.sort((a, b) => a.set_number - b.set_number);

      const completedSets = exerciseSets.filter(
        (s) => s.status === 'completed'
      ).length;

      exercises.push({
        exercise_id: pde.exercise_id,
        exercise_name: exercise.name,
        sets: exerciseSets,
        total_sets: exerciseSets.length,
        completed_sets: completedSets,
        rest_seconds: pde.rest_seconds,
      });
    }

    return {
      ...workout,
      plan_day_name: planDay?.name ?? 'Unknown',
      exercises,
    };
  }
}
