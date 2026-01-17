import type { Database } from 'better-sqlite3';
import { getDatabase } from '../db/index.js';
import { MesocycleService } from './mesocycle.service.js';
import { WorkoutSetService } from './workout-set.service.js';
import { WorkoutService } from './workout.service.js';

export { MesocycleService } from './mesocycle.service.js';
export { WorkoutSetService } from './workout-set.service.js';
export { WorkoutService } from './workout.service.js';
export type {
  WorkoutWithExercises,
  WorkoutExerciseWithSets,
} from './workout.service.js';

// Singleton instances for use with the default database
let mesocycleService: MesocycleService | null = null;
let workoutSetService: WorkoutSetService | null = null;
let workoutService: WorkoutService | null = null;

// Reset all service singletons (for testing)
export function resetServices(): void {
  mesocycleService = null;
  workoutSetService = null;
  workoutService = null;
}

export function getMesocycleService(): MesocycleService {
  if (!mesocycleService) {
    mesocycleService = new MesocycleService(getDatabase());
  }
  return mesocycleService;
}

export function getWorkoutSetService(): WorkoutSetService {
  if (!workoutSetService) {
    workoutSetService = new WorkoutSetService(getDatabase());
  }
  return workoutSetService;
}

export function getWorkoutService(): WorkoutService {
  if (!workoutService) {
    workoutService = new WorkoutService(getDatabase());
  }
  return workoutService;
}

// Helper to create services with a custom database (useful for testing)
export function createServices(db: Database): {
  mesocycle: MesocycleService;
  workoutSet: WorkoutSetService;
  workout: WorkoutService;
} {
  return {
    mesocycle: new MesocycleService(db),
    workoutSet: new WorkoutSetService(db),
    workout: new WorkoutService(db),
  };
}
