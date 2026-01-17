import type { Database } from 'better-sqlite3';
import { ExerciseRepository } from '../repositories/exercise.repository.js';

export const DEFAULT_EXERCISES = [
  { name: 'Dumbbell Press (flat)', weight_increment: 5.0 },
  { name: 'Seated Cable Row', weight_increment: 5.0 },
  { name: 'Leg Extension', weight_increment: 5.0 },
  { name: 'Machine Triceps Extension', weight_increment: 5.0 },
  { name: 'Seated Dumbbell Lateral Raises', weight_increment: 2.5 },
  { name: 'Pulldowns (narrow grip)', weight_increment: 5.0 },
  { name: 'Pec Dec Flye', weight_increment: 5.0 },
  { name: 'Machine Reverse Fly', weight_increment: 5.0 },
  { name: 'Cable Triceps Pushdown', weight_increment: 5.0 },
  { name: 'Cable Curl', weight_increment: 5.0 },
  { name: 'Single Leg Curl', weight_increment: 5.0 },
  { name: 'Machine Preacher Curl', weight_increment: 5.0 },
] as const;

export function seedDefaultExercises(db: Database): void {
  const repository = new ExerciseRepository(db);

  for (const exercise of DEFAULT_EXERCISES) {
    const existing = repository.findByName(exercise.name);
    if (!existing) {
      repository.create({
        name: exercise.name,
        weight_increment: exercise.weight_increment,
        is_custom: false,
      });
    }
  }
}

export function seedDatabase(db: Database): void {
  seedDefaultExercises(db);
}
