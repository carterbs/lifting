# Phase 8: Progressive Overload & Deload (TDD)

## Overview

This phase implements the core progression system that drives the 6-week mesocycle structure. The system calculates target weights and reps for each week based on progressive overload principles, handles incomplete workout scenarios, and implements deload week logic.

## Progression Rules

### Weekly Progression Pattern

| Week | Weight Change                   | Rep Change          | Notes                  |
| ---- | ------------------------------- | ------------------- | ---------------------- |
| 0    | Starting weight                 | Starting reps       | User-defined baseline  |
| 1    | Same                            | +1 rep              | First progression      |
| 2    | +weightIncrement (default 5lbs) | Reset to base       | Weight increase        |
| 3    | Same                            | +1 rep              | Rep progression        |
| 4    | +weightIncrement                | Reset to base       | Second weight increase |
| 5    | Same                            | +1 rep              | Final rep progression  |
| 6    | 85% of week 5 weight            | Same reps, 50% sets | Deload week            |

### Incomplete Set Rule

**Critical Rule**: If a user does NOT complete all prescribed sets for an exercise in a given week, that exercise does NOT progress the following week. The exercise retains the same weight and rep targets until successfully completed.

### Deload Week Specifics

- **Volume**: 50% of sets (round up if odd number)
- **Intensity**: 85% of working weight (round to nearest 2.5 lbs)
- **Reps**: Same as previous week

---

## Backend Implementation

### File Structure

```
packages/backend/src/
├── services/
│   └── progression/
│       ├── progression.service.ts
│       ├── progression.service.test.ts
│       ├── deload.service.ts
│       └── deload.service.test.ts
├── routes/
│   └── mesocycles/
│       └── next-week.ts (add to existing mesocycles routes)
```

### Step 1: Define Types

**File**: `packages/backend/src/types/progression.ts`

```typescript
export interface ExerciseProgression {
  exerciseId: string;
  planExerciseId: string;
  baseWeight: number; // Starting weight from plan
  baseReps: number; // Starting reps from plan
  baseSets: number; // Starting sets from plan
  weightIncrement: number; // Weight to add each progression (default 5)
}

export interface WeekTargets {
  exerciseId: string;
  planExerciseId: string;
  targetWeight: number;
  targetReps: number;
  targetSets: number;
  weekNumber: number;
  isDeload: boolean;
}

export interface CompletionStatus {
  exerciseId: string;
  weekNumber: number;
  allSetsCompleted: boolean;
  completedSets: number;
  prescribedSets: number;
}
```

### Step 2: Progression Service Tests (Write First)

**File**: `packages/backend/src/services/progression/progression.service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressionService } from './progression.service';
import { ExerciseProgression, CompletionStatus } from '../../types/progression';

describe('ProgressionService', () => {
  let service: ProgressionService;

  const baseExercise: ExerciseProgression = {
    exerciseId: 'exercise-1',
    planExerciseId: 'plan-exercise-1',
    baseWeight: 30,
    baseReps: 8,
    baseSets: 3,
    weightIncrement: 5,
  };

  beforeEach(() => {
    service = new ProgressionService();
  });

  describe('calculateTargetsForWeek', () => {
    describe('Week 0 - Baseline', () => {
      it('should return starting weight and reps from plan', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 0, true);

        expect(result.targetWeight).toBe(30);
        expect(result.targetReps).toBe(8);
        expect(result.targetSets).toBe(3);
        expect(result.isDeload).toBe(false);
      });

      it('should work regardless of previous completion status for week 0', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 0, false);

        expect(result.targetWeight).toBe(30);
        expect(result.targetReps).toBe(8);
      });
    });

    describe('Week 1 - Add 1 rep', () => {
      it('should add 1 rep when previous week completed', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 1, true);

        expect(result.targetWeight).toBe(30);
        expect(result.targetReps).toBe(9);
        expect(result.targetSets).toBe(3);
      });

      it('should NOT add rep when previous week incomplete', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 1, false);

        expect(result.targetWeight).toBe(30);
        expect(result.targetReps).toBe(8); // Same as week 0
        expect(result.targetSets).toBe(3);
      });
    });

    describe('Week 2 - Add weight, reset reps', () => {
      it('should add weight and reset reps when previous week completed', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 2, true);

        expect(result.targetWeight).toBe(35); // 30 + 5
        expect(result.targetReps).toBe(8); // Reset to base
        expect(result.targetSets).toBe(3);
      });

      it('should NOT add weight when previous week incomplete', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 2, false);

        // Should stay at week 1 targets (assuming week 0 was completed)
        expect(result.targetWeight).toBe(30);
        expect(result.targetReps).toBe(9);
      });

      it('should use custom weight increment', () => {
        const exercise = { ...baseExercise, weightIncrement: 2.5 };
        const result = service.calculateTargetsForWeek(exercise, 2, true);

        expect(result.targetWeight).toBe(32.5);
      });
    });

    describe('Week 3 - Add 1 rep', () => {
      it('should add 1 rep to week 2 weight when completed', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 3, true);

        expect(result.targetWeight).toBe(35);
        expect(result.targetReps).toBe(9);
      });

      it('should NOT progress when previous week incomplete', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 3, false);

        expect(result.targetWeight).toBe(35);
        expect(result.targetReps).toBe(8); // Same as week 2
      });
    });

    describe('Week 4 - Add weight, reset reps', () => {
      it('should add weight again and reset reps when completed', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 4, true);

        expect(result.targetWeight).toBe(40); // 30 + 5 + 5
        expect(result.targetReps).toBe(8);
      });

      it('should NOT add weight when previous week incomplete', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 4, false);

        expect(result.targetWeight).toBe(35);
        expect(result.targetReps).toBe(9); // Same as week 3
      });
    });

    describe('Week 5 - Add 1 rep', () => {
      it('should add 1 rep to week 4 weight when completed', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 5, true);

        expect(result.targetWeight).toBe(40);
        expect(result.targetReps).toBe(9);
      });

      it('should NOT progress when previous week incomplete', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 5, false);

        expect(result.targetWeight).toBe(40);
        expect(result.targetReps).toBe(8);
      });
    });

    describe('Week 6 - Deload', () => {
      it('should apply 85% weight and 50% sets', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 6, true);

        expect(result.targetWeight).toBe(34); // 40 * 0.85 = 34
        expect(result.targetReps).toBe(9); // Same as week 5
        expect(result.targetSets).toBe(2); // 3 * 0.5 = 1.5, round up = 2
        expect(result.isDeload).toBe(true);
      });

      it('should round weight to nearest 2.5 lbs', () => {
        const exercise = { ...baseExercise, baseWeight: 45 };
        // Week 5 weight would be 55 (45 + 5 + 5)
        // 55 * 0.85 = 46.75 -> round to 47.5
        const result = service.calculateTargetsForWeek(exercise, 6, true);

        expect(result.targetWeight).toBe(47.5);
      });

      it('should round sets up when odd number', () => {
        const exercise = { ...baseExercise, baseSets: 5 };
        const result = service.calculateTargetsForWeek(exercise, 6, true);

        expect(result.targetSets).toBe(3); // 5 * 0.5 = 2.5, round up = 3
      });

      it('should still apply deload even if previous week incomplete', () => {
        const result = service.calculateTargetsForWeek(baseExercise, 6, false);

        // Deload is based on week 4 targets since week 5 wasn't completed
        expect(result.targetWeight).toBe(34); // 40 * 0.85 = 34
        expect(result.targetReps).toBe(8); // Week 4 reps
        expect(result.isDeload).toBe(true);
      });
    });
  });

  describe('calculateProgressionHistory', () => {
    it('should calculate all weeks based on completion history', () => {
      const completionHistory: CompletionStatus[] = [
        {
          exerciseId: 'exercise-1',
          weekNumber: 0,
          allSetsCompleted: true,
          completedSets: 3,
          prescribedSets: 3,
        },
        {
          exerciseId: 'exercise-1',
          weekNumber: 1,
          allSetsCompleted: true,
          completedSets: 3,
          prescribedSets: 3,
        },
        {
          exerciseId: 'exercise-1',
          weekNumber: 2,
          allSetsCompleted: false,
          completedSets: 2,
          prescribedSets: 3,
        }, // Incomplete!
      ];

      const result = service.calculateProgressionHistory(
        baseExercise,
        completionHistory
      );

      expect(result[0].targetWeight).toBe(30);
      expect(result[1].targetWeight).toBe(30);
      expect(result[2].targetWeight).toBe(35);
      expect(result[3].targetWeight).toBe(35); // No progression - week 2 incomplete
      expect(result[3].targetReps).toBe(8); // Stays at week 2 values
    });
  });

  describe('edge cases', () => {
    it('should handle minimum 1 set for deload', () => {
      const exercise = { ...baseExercise, baseSets: 1 };
      const result = service.calculateTargetsForWeek(exercise, 6, true);

      expect(result.targetSets).toBe(1); // 1 * 0.5 = 0.5, round up = 1
    });

    it('should handle very light weights correctly', () => {
      const exercise = { ...baseExercise, baseWeight: 5 };
      const result = service.calculateTargetsForWeek(exercise, 6, true);

      // Week 5 weight: 5 + 5 + 5 = 15, deload = 15 * 0.85 = 12.75 -> 12.5
      expect(result.targetWeight).toBe(12.5);
    });

    it('should handle 0 as a valid starting weight', () => {
      const exercise = { ...baseExercise, baseWeight: 0 };
      const result = service.calculateTargetsForWeek(exercise, 0, true);

      expect(result.targetWeight).toBe(0);
    });
  });
});
```

### Step 3: Progression Service Implementation

**File**: `packages/backend/src/services/progression/progression.service.ts`

```typescript
import {
  ExerciseProgression,
  WeekTargets,
  CompletionStatus,
} from '../../types/progression';

export class ProgressionService {
  private readonly DELOAD_WEIGHT_FACTOR = 0.85;
  private readonly DELOAD_VOLUME_FACTOR = 0.5;
  private readonly WEIGHT_ROUNDING_INCREMENT = 2.5;

  /**
   * Calculate target weight, reps, and sets for a given week.
   *
   * @param exercise - The exercise with base values and weight increment
   * @param weekNumber - The week number (0-6)
   * @param previousWeekCompleted - Whether all sets were completed in the previous week
   * @returns WeekTargets with calculated values
   */
  calculateTargetsForWeek(
    exercise: ExerciseProgression,
    weekNumber: number,
    previousWeekCompleted: boolean
  ): WeekTargets {
    // Week 0 is always the baseline
    if (weekNumber === 0) {
      return this.createWeekTargets(
        exercise,
        exercise.baseWeight,
        exercise.baseReps,
        exercise.baseSets,
        0,
        false
      );
    }

    // Calculate what the targets WOULD be if all previous weeks were completed
    const idealTargets = this.calculateIdealTargetsForWeek(
      exercise,
      weekNumber
    );

    // If previous week was not completed, don't progress
    if (!previousWeekCompleted && weekNumber !== 6) {
      const previousIdealTargets = this.calculateIdealTargetsForWeek(
        exercise,
        weekNumber - 1
      );
      return this.createWeekTargets(
        exercise,
        previousIdealTargets.weight,
        previousIdealTargets.reps,
        previousIdealTargets.sets,
        weekNumber,
        false
      );
    }

    // Week 6 is always deload, even if previous week incomplete
    if (weekNumber === 6) {
      const week5Targets = previousWeekCompleted
        ? this.calculateIdealTargetsForWeek(exercise, 5)
        : this.calculateIdealTargetsForWeek(exercise, 4);

      const deloadWeight = this.roundToNearest(
        week5Targets.weight * this.DELOAD_WEIGHT_FACTOR,
        this.WEIGHT_ROUNDING_INCREMENT
      );
      const deloadSets = Math.max(
        1,
        Math.ceil(exercise.baseSets * this.DELOAD_VOLUME_FACTOR)
      );

      return this.createWeekTargets(
        exercise,
        deloadWeight,
        previousWeekCompleted
          ? week5Targets.reps
          : this.calculateIdealTargetsForWeek(exercise, 4).reps,
        deloadSets,
        weekNumber,
        true
      );
    }

    return this.createWeekTargets(
      exercise,
      idealTargets.weight,
      idealTargets.reps,
      idealTargets.sets,
      weekNumber,
      false
    );
  }

  /**
   * Calculate progression history based on actual completion data.
   */
  calculateProgressionHistory(
    exercise: ExerciseProgression,
    completionHistory: CompletionStatus[]
  ): WeekTargets[] {
    const targets: WeekTargets[] = [];

    for (let week = 0; week <= 6; week++) {
      const previousWeek = completionHistory.find(
        (c) => c.weekNumber === week - 1
      );
      const previousCompleted =
        week === 0 ? true : (previousWeek?.allSetsCompleted ?? true);

      targets.push(
        this.calculateTargetsForWeek(exercise, week, previousCompleted)
      );
    }

    return targets;
  }

  /**
   * Calculate ideal targets assuming all previous weeks were completed.
   */
  private calculateIdealTargetsForWeek(
    exercise: ExerciseProgression,
    weekNumber: number
  ): { weight: number; reps: number; sets: number } {
    const { baseWeight, baseReps, baseSets, weightIncrement } = exercise;

    switch (weekNumber) {
      case 0:
        return { weight: baseWeight, reps: baseReps, sets: baseSets };
      case 1:
        return { weight: baseWeight, reps: baseReps + 1, sets: baseSets };
      case 2:
        return {
          weight: baseWeight + weightIncrement,
          reps: baseReps,
          sets: baseSets,
        };
      case 3:
        return {
          weight: baseWeight + weightIncrement,
          reps: baseReps + 1,
          sets: baseSets,
        };
      case 4:
        return {
          weight: baseWeight + weightIncrement * 2,
          reps: baseReps,
          sets: baseSets,
        };
      case 5:
        return {
          weight: baseWeight + weightIncrement * 2,
          reps: baseReps + 1,
          sets: baseSets,
        };
      default:
        // Week 6+ returns week 5 values (deload is calculated separately)
        return {
          weight: baseWeight + weightIncrement * 2,
          reps: baseReps + 1,
          sets: baseSets,
        };
    }
  }

  private createWeekTargets(
    exercise: ExerciseProgression,
    weight: number,
    reps: number,
    sets: number,
    weekNumber: number,
    isDeload: boolean
  ): WeekTargets {
    return {
      exerciseId: exercise.exerciseId,
      planExerciseId: exercise.planExerciseId,
      targetWeight: weight,
      targetReps: reps,
      targetSets: sets,
      weekNumber,
      isDeload,
    };
  }

  private roundToNearest(value: number, increment: number): number {
    return Math.round(value / increment) * increment;
  }
}
```

### Step 4: Deload Service Tests (Write First)

**File**: `packages/backend/src/services/progression/deload.service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { DeloadService } from './deload.service';
import { ExerciseProgression } from '../../types/progression';

describe('DeloadService', () => {
  let service: DeloadService;

  const baseExercise: ExerciseProgression = {
    exerciseId: 'exercise-1',
    planExerciseId: 'plan-exercise-1',
    baseWeight: 30,
    baseReps: 8,
    baseSets: 3,
    weightIncrement: 5,
  };

  beforeEach(() => {
    service = new DeloadService();
  });

  describe('calculateDeloadTargets', () => {
    it('should calculate 50% sets (rounded up)', () => {
      const result = service.calculateDeloadTargets(baseExercise, 40, 9);

      expect(result.targetSets).toBe(2); // 3 * 0.5 = 1.5 -> 2
    });

    it('should calculate 85% weight (rounded to 2.5)', () => {
      const result = service.calculateDeloadTargets(baseExercise, 40, 9);

      expect(result.targetWeight).toBe(34); // 40 * 0.85 = 34
    });

    it('should preserve reps from current week', () => {
      const result = service.calculateDeloadTargets(baseExercise, 40, 9);

      expect(result.targetReps).toBe(9);
    });

    it('should round weight correctly for edge cases', () => {
      // 45 * 0.85 = 38.25 -> 37.5
      const result = service.calculateDeloadTargets(baseExercise, 45, 8);

      expect(result.targetWeight).toBe(37.5);
    });

    it('should ensure minimum of 1 set', () => {
      const exercise = { ...baseExercise, baseSets: 1 };
      const result = service.calculateDeloadTargets(exercise, 40, 9);

      expect(result.targetSets).toBe(1);
    });

    it('should handle 4 sets correctly', () => {
      const exercise = { ...baseExercise, baseSets: 4 };
      const result = service.calculateDeloadTargets(exercise, 40, 9);

      expect(result.targetSets).toBe(2); // 4 * 0.5 = 2
    });

    it('should handle 5 sets correctly', () => {
      const exercise = { ...baseExercise, baseSets: 5 };
      const result = service.calculateDeloadTargets(exercise, 40, 9);

      expect(result.targetSets).toBe(3); // 5 * 0.5 = 2.5 -> 3
    });
  });

  describe('isDeloadWeek', () => {
    it('should return true for week 6', () => {
      expect(service.isDeloadWeek(6)).toBe(true);
    });

    it('should return false for weeks 0-5', () => {
      for (let week = 0; week <= 5; week++) {
        expect(service.isDeloadWeek(week)).toBe(false);
      }
    });

    it('should return false for weeks beyond 6', () => {
      expect(service.isDeloadWeek(7)).toBe(false);
      expect(service.isDeloadWeek(13)).toBe(false);
    });
  });
});
```

### Step 5: Deload Service Implementation

**File**: `packages/backend/src/services/progression/deload.service.ts`

```typescript
import { ExerciseProgression, WeekTargets } from '../../types/progression';

export class DeloadService {
  private readonly DELOAD_WEIGHT_FACTOR = 0.85;
  private readonly DELOAD_VOLUME_FACTOR = 0.5;
  private readonly WEIGHT_ROUNDING_INCREMENT = 2.5;
  private readonly DELOAD_WEEK = 6;

  /**
   * Calculate deload targets based on current working weight and reps.
   */
  calculateDeloadTargets(
    exercise: ExerciseProgression,
    currentWeight: number,
    currentReps: number
  ): WeekTargets {
    const deloadWeight = this.roundToNearest(
      currentWeight * this.DELOAD_WEIGHT_FACTOR,
      this.WEIGHT_ROUNDING_INCREMENT
    );

    const deloadSets = Math.max(
      1,
      Math.ceil(exercise.baseSets * this.DELOAD_VOLUME_FACTOR)
    );

    return {
      exerciseId: exercise.exerciseId,
      planExerciseId: exercise.planExerciseId,
      targetWeight: deloadWeight,
      targetReps: currentReps,
      targetSets: deloadSets,
      weekNumber: this.DELOAD_WEEK,
      isDeload: true,
    };
  }

  /**
   * Check if a given week number is a deload week.
   */
  isDeloadWeek(weekNumber: number): boolean {
    return weekNumber === this.DELOAD_WEEK;
  }

  private roundToNearest(value: number, increment: number): number {
    return Math.round(value / increment) * increment;
  }
}
```

### Step 6: Next Week API Endpoint Tests

**File**: `packages/backend/src/routes/mesocycles/next-week.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { db } from '../../db';
import {
  setupTestDatabase,
  teardownTestDatabase,
  seedMesocycleWithWorkouts,
} from '../../test/helpers';

describe('GET /api/mesocycles/:id/next-week', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it('should return projected progression for next week', async () => {
    const mesocycleId = await seedMesocycleWithWorkouts({
      currentWeek: 1,
      exercises: [
        {
          id: 'ex1',
          name: 'Bench Press',
          weight: 100,
          reps: 8,
          sets: 3,
          completed: true,
        },
      ],
    });

    const response = await request(app)
      .get(`/api/mesocycles/${mesocycleId}/next-week`)
      .expect(200);

    expect(response.body.weekNumber).toBe(2);
    expect(response.body.exercises).toHaveLength(1);
    expect(response.body.exercises[0].targetWeight).toBe(105); // +5lbs
    expect(response.body.exercises[0].targetReps).toBe(8); // Reset to base
  });

  it('should not progress incomplete exercises', async () => {
    const mesocycleId = await seedMesocycleWithWorkouts({
      currentWeek: 1,
      exercises: [
        {
          id: 'ex1',
          name: 'Bench Press',
          weight: 100,
          reps: 9,
          sets: 3,
          completedSets: 2,
        }, // Incomplete
      ],
    });

    const response = await request(app)
      .get(`/api/mesocycles/${mesocycleId}/next-week`)
      .expect(200);

    expect(response.body.exercises[0].targetWeight).toBe(100); // No change
    expect(response.body.exercises[0].targetReps).toBe(9); // No change
    expect(response.body.exercises[0].willProgress).toBe(false);
  });

  it('should indicate deload week', async () => {
    const mesocycleId = await seedMesocycleWithWorkouts({
      currentWeek: 5,
      exercises: [
        {
          id: 'ex1',
          name: 'Bench Press',
          weight: 110,
          reps: 9,
          sets: 3,
          completed: true,
        },
      ],
    });

    const response = await request(app)
      .get(`/api/mesocycles/${mesocycleId}/next-week`)
      .expect(200);

    expect(response.body.weekNumber).toBe(6);
    expect(response.body.isDeload).toBe(true);
    expect(response.body.exercises[0].targetWeight).toBe(93.5); // 110 * 0.85 = 93.5
    expect(response.body.exercises[0].targetSets).toBe(2); // 3 * 0.5 = 1.5 -> 2
  });

  it('should return 404 for non-existent mesocycle', async () => {
    await request(app)
      .get('/api/mesocycles/non-existent-id/next-week')
      .expect(404);
  });

  it('should return 400 if mesocycle already completed', async () => {
    const mesocycleId = await seedMesocycleWithWorkouts({
      currentWeek: 6,
      completed: true,
      exercises: [],
    });

    const response = await request(app)
      .get(`/api/mesocycles/${mesocycleId}/next-week`)
      .expect(400);

    expect(response.body.error).toBe('Mesocycle already completed');
  });
});
```

### Step 7: Next Week API Endpoint Implementation

**File**: `packages/backend/src/routes/mesocycles/next-week.ts`

```typescript
import { Router, Request, Response } from 'express';
import { ProgressionService } from '../../services/progression/progression.service';
import { DeloadService } from '../../services/progression/deload.service';
import { MesocycleRepository } from '../../repositories/mesocycle.repository';
import { WorkoutRepository } from '../../repositories/workout.repository';
import { ExerciseProgression, CompletionStatus } from '../../types/progression';

const router = Router();
const progressionService = new ProgressionService();
const deloadService = new DeloadService();
const mesocycleRepo = new MesocycleRepository();
const workoutRepo = new WorkoutRepository();

interface NextWeekExercise {
  exerciseId: string;
  exerciseName: string;
  targetWeight: number;
  targetReps: number;
  targetSets: number;
  willProgress: boolean;
  previousWeekCompleted: boolean;
}

interface NextWeekResponse {
  mesocycleId: string;
  weekNumber: number;
  isDeload: boolean;
  exercises: NextWeekExercise[];
}

router.get('/:id/next-week', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const mesocycle = await mesocycleRepo.findById(id);

    if (!mesocycle) {
      return res.status(404).json({ error: 'Mesocycle not found' });
    }

    if (mesocycle.completed) {
      return res.status(400).json({ error: 'Mesocycle already completed' });
    }

    const currentWeek = mesocycle.currentWeek;
    const nextWeek = currentWeek + 1;
    const isDeload = deloadService.isDeloadWeek(nextWeek);

    // Get all exercises for this mesocycle's plan
    const planExercises = await mesocycleRepo.getPlanExercises(
      mesocycle.planId
    );

    // Get completion status for current week
    const currentWeekWorkouts = await workoutRepo.getWeekWorkouts(
      id,
      currentWeek
    );
    const completionStatuses = calculateCompletionStatuses(currentWeekWorkouts);

    const exercises: NextWeekExercise[] = planExercises.map((planExercise) => {
      const exerciseProgression: ExerciseProgression = {
        exerciseId: planExercise.exerciseId,
        planExerciseId: planExercise.id,
        baseWeight: planExercise.startingWeight,
        baseReps: planExercise.startingReps,
        baseSets: planExercise.sets,
        weightIncrement: planExercise.weightIncrement ?? 5,
      };

      const completionStatus = completionStatuses.find(
        (cs) => cs.exerciseId === planExercise.exerciseId
      );
      const previousWeekCompleted = completionStatus?.allSetsCompleted ?? true;

      const targets = progressionService.calculateTargetsForWeek(
        exerciseProgression,
        nextWeek,
        previousWeekCompleted
      );

      return {
        exerciseId: planExercise.exerciseId,
        exerciseName: planExercise.exercise.name,
        targetWeight: targets.targetWeight,
        targetReps: targets.targetReps,
        targetSets: targets.targetSets,
        willProgress: previousWeekCompleted,
        previousWeekCompleted,
      };
    });

    const response: NextWeekResponse = {
      mesocycleId: id,
      weekNumber: nextWeek,
      isDeload,
      exercises,
    };

    return res.json(response);
  } catch (error) {
    console.error('Error calculating next week progression:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateCompletionStatuses(workouts: Workout[]): CompletionStatus[] {
  // Group sets by exercise and check completion
  const exerciseMap = new Map<
    string,
    { completed: number; prescribed: number }
  >();

  workouts.forEach((workout) => {
    workout.sets.forEach((set) => {
      const current = exerciseMap.get(set.exerciseId) ?? {
        completed: 0,
        prescribed: 0,
      };
      current.prescribed += 1;
      if (set.completed) {
        current.completed += 1;
      }
      exerciseMap.set(set.exerciseId, current);
    });
  });

  return Array.from(exerciseMap.entries()).map(([exerciseId, data]) => ({
    exerciseId,
    weekNumber: workouts[0]?.weekNumber ?? 0,
    allSetsCompleted: data.completed === data.prescribed,
    completedSets: data.completed,
    prescribedSets: data.prescribed,
  }));
}

export default router;
```

### Step 8: Integration with Workout Generation

**File**: `packages/backend/src/services/workout-generator.service.ts` (additions)

```typescript
import { ProgressionService } from './progression/progression.service';
import { DeloadService } from './progression/deload.service';

export class WorkoutGeneratorService {
  private progressionService: ProgressionService;
  private deloadService: DeloadService;

  constructor() {
    this.progressionService = new ProgressionService();
    this.deloadService = new DeloadService();
  }

  /**
   * Generate workout targets for a specific week of a mesocycle.
   */
  async generateWorkoutForWeek(
    mesocycleId: string,
    dayOfWeek: number,
    weekNumber: number
  ): Promise<GeneratedWorkout> {
    const mesocycle = await this.mesocycleRepo.findById(mesocycleId);
    const planDay = await this.planRepo.getDayExercises(
      mesocycle.planId,
      dayOfWeek
    );
    const completionHistory = await this.getCompletionHistory(
      mesocycleId,
      weekNumber - 1
    );

    const exercises = planDay.exercises.map((planExercise) => {
      const exerciseProgression: ExerciseProgression = {
        exerciseId: planExercise.exerciseId,
        planExerciseId: planExercise.id,
        baseWeight: planExercise.startingWeight,
        baseReps: planExercise.startingReps,
        baseSets: planExercise.sets,
        weightIncrement: planExercise.weightIncrement ?? 5,
      };

      const previousWeekStatus = completionHistory.find(
        (ch) => ch.exerciseId === planExercise.exerciseId
      );
      const previousCompleted = previousWeekStatus?.allSetsCompleted ?? true;

      const targets = this.progressionService.calculateTargetsForWeek(
        exerciseProgression,
        weekNumber,
        previousCompleted
      );

      return {
        exerciseId: planExercise.exerciseId,
        exerciseName: planExercise.exercise.name,
        targetWeight: targets.targetWeight,
        targetReps: targets.targetReps,
        targetSets: targets.targetSets,
        restTime: planExercise.restTime,
        isDeload: targets.isDeload,
      };
    });

    return {
      mesocycleId,
      weekNumber,
      dayOfWeek,
      isDeload: this.deloadService.isDeloadWeek(weekNumber),
      exercises,
    };
  }

  private async getCompletionHistory(
    mesocycleId: string,
    upToWeek: number
  ): Promise<CompletionStatus[]> {
    // Query completed workouts and calculate completion status
    const workouts = await this.workoutRepo.getWorkoutsUpToWeek(
      mesocycleId,
      upToWeek
    );
    return this.calculateCompletionStatuses(workouts);
  }
}
```

---

## Frontend Implementation

### File Structure

```
packages/frontend/src/
├── components/
│   └── progression/
│       ├── ProgressionIndicator.tsx
│       ├── ProgressionIndicator.test.tsx
│       ├── DeloadBadge.tsx
│       ├── DeloadBadge.test.tsx
│       ├── NextWeekPreview.tsx
│       └── NextWeekPreview.test.tsx
├── hooks/
│   └── useNextWeekProgression.ts
```

### Step 1: Progression Indicator Component Tests

**File**: `packages/frontend/src/components/progression/ProgressionIndicator.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressionIndicator } from './ProgressionIndicator';

describe('ProgressionIndicator', () => {
  it('should show green checkmark when exercise will progress', () => {
    render(<ProgressionIndicator willProgress={true} />);

    expect(screen.getByTestId('progression-will-progress')).toBeInTheDocument();
    expect(screen.getByText('Will progress next week')).toBeInTheDocument();
  });

  it('should show warning when exercise will not progress', () => {
    render(<ProgressionIndicator willProgress={false} />);

    expect(screen.getByTestId('progression-will-not-progress')).toBeInTheDocument();
    expect(screen.getByText('Incomplete - no progression')).toBeInTheDocument();
  });

  it('should show tooltip with explanation', async () => {
    render(<ProgressionIndicator willProgress={false} />);

    const indicator = screen.getByTestId('progression-will-not-progress');
    // Hover interaction tested in E2E
    expect(indicator).toHaveAttribute('title');
  });
});
```

### Step 2: Progression Indicator Component

**File**: `packages/frontend/src/components/progression/ProgressionIndicator.tsx`

```typescript
import * as React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ProgressionIndicatorProps {
  willProgress: boolean;
}

export function ProgressionIndicator({ willProgress }: ProgressionIndicatorProps): React.ReactElement {
  if (willProgress) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            data-testid="progression-will-progress"
            className="flex items-center gap-1 text-green-600"
            title="All sets completed - exercise will progress next week"
          >
            <CheckCircle size={16} />
            <span className="text-sm">Will progress next week</span>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded text-sm">
            All sets completed - weight or reps will increase next week
            <Tooltip.Arrow className="fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div
          data-testid="progression-will-not-progress"
          className="flex items-center gap-1 text-amber-600"
          title="Not all sets completed - exercise will not progress"
        >
          <AlertCircle size={16} />
          <span className="text-sm">Incomplete - no progression</span>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded text-sm">
          Complete all sets to progress this exercise next week
          <Tooltip.Arrow className="fill-gray-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
```

### Step 3: Deload Badge Component Tests

**File**: `packages/frontend/src/components/progression/DeloadBadge.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DeloadBadge } from './DeloadBadge';

describe('DeloadBadge', () => {
  it('should render deload label', () => {
    render(<DeloadBadge />);

    expect(screen.getByText('Deload Week')).toBeInTheDocument();
  });

  it('should have appropriate styling', () => {
    render(<DeloadBadge />);

    const badge = screen.getByTestId('deload-badge');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should show deload info in tooltip', () => {
    render(<DeloadBadge showDetails />);

    expect(screen.getByText(/50% volume/)).toBeInTheDocument();
    expect(screen.getByText(/85% weight/)).toBeInTheDocument();
  });
});
```

### Step 4: Deload Badge Component

**File**: `packages/frontend/src/components/progression/DeloadBadge.tsx`

```typescript
import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Leaf } from 'lucide-react';

interface DeloadBadgeProps {
  showDetails?: boolean;
}

export function DeloadBadge({ showDetails = false }: DeloadBadgeProps): React.ReactElement {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div
          data-testid="deload-badge"
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
        >
          <Leaf size={14} />
          <span>Deload Week</span>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded text-sm max-w-xs">
          <p className="font-medium mb-1">Recovery Week</p>
          <ul className="list-disc list-inside space-y-1">
            <li>50% volume (reduced sets)</li>
            <li>85% weight (lighter loads)</li>
            <li>Same reps as previous week</li>
          </ul>
          <Tooltip.Arrow className="fill-gray-800" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
```

### Step 5: Next Week Preview Component Tests

**File**: `packages/frontend/src/components/progression/NextWeekPreview.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextWeekPreview } from './NextWeekPreview';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNextWeekData = {
  mesocycleId: 'meso-1',
  weekNumber: 2,
  isDeload: false,
  exercises: [
    {
      exerciseId: 'ex-1',
      exerciseName: 'Bench Press',
      targetWeight: 105,
      targetReps: 8,
      targetSets: 3,
      willProgress: true,
      previousWeekCompleted: true,
    },
    {
      exerciseId: 'ex-2',
      exerciseName: 'Squat',
      targetWeight: 135,
      targetReps: 9,
      targetSets: 3,
      willProgress: false,
      previousWeekCompleted: false,
    },
  ],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NextWeekPreview', () => {
  it('should display week number', () => {
    render(<NextWeekPreview data={mockNextWeekData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Week 2 Preview')).toBeInTheDocument();
  });

  it('should list all exercises with targets', () => {
    render(<NextWeekPreview data={mockNextWeekData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('105 lbs')).toBeInTheDocument();
    expect(screen.getByText('8 reps')).toBeInTheDocument();
    expect(screen.getByText('3 sets')).toBeInTheDocument();

    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(screen.getByText('135 lbs')).toBeInTheDocument();
  });

  it('should show progression indicator for each exercise', () => {
    render(<NextWeekPreview data={mockNextWeekData} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('progression-will-progress')).toBeInTheDocument();
    expect(screen.getByTestId('progression-will-not-progress')).toBeInTheDocument();
  });

  it('should show deload badge when isDeload is true', () => {
    const deloadData = { ...mockNextWeekData, weekNumber: 6, isDeload: true };
    render(<NextWeekPreview data={deloadData} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('deload-badge')).toBeInTheDocument();
  });

  it('should not show deload badge for regular weeks', () => {
    render(<NextWeekPreview data={mockNextWeekData} />, { wrapper: createWrapper() });

    expect(screen.queryByTestId('deload-badge')).not.toBeInTheDocument();
  });
});
```

### Step 6: Next Week Preview Component

**File**: `packages/frontend/src/components/progression/NextWeekPreview.tsx`

```typescript
import * as React from 'react';
import { ProgressionIndicator } from './ProgressionIndicator';
import { DeloadBadge } from './DeloadBadge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface NextWeekExercise {
  exerciseId: string;
  exerciseName: string;
  targetWeight: number;
  targetReps: number;
  targetSets: number;
  willProgress: boolean;
  previousWeekCompleted: boolean;
}

interface NextWeekData {
  mesocycleId: string;
  weekNumber: number;
  isDeload: boolean;
  exercises: NextWeekExercise[];
}

interface NextWeekPreviewProps {
  data: NextWeekData;
}

export function NextWeekPreview({ data }: NextWeekPreviewProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Week {data.weekNumber} Preview</CardTitle>
        {data.isDeload && <DeloadBadge showDetails />}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.exercises.map((exercise) => (
            <div
              key={exercise.exerciseId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{exercise.exerciseName}</h4>
                <div className="flex gap-3 text-sm text-gray-600 mt-1">
                  <span>{exercise.targetWeight} lbs</span>
                  <span>{exercise.targetReps} reps</span>
                  <span>{exercise.targetSets} sets</span>
                </div>
              </div>
              <ProgressionIndicator willProgress={exercise.willProgress} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 7: Hook for Fetching Next Week Data

**File**: `packages/frontend/src/hooks/useNextWeekProgression.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface NextWeekExercise {
  exerciseId: string;
  exerciseName: string;
  targetWeight: number;
  targetReps: number;
  targetSets: number;
  willProgress: boolean;
  previousWeekCompleted: boolean;
}

interface NextWeekResponse {
  mesocycleId: string;
  weekNumber: number;
  isDeload: boolean;
  exercises: NextWeekExercise[];
}

export function useNextWeekProgression(mesocycleId: string | undefined) {
  return useQuery<NextWeekResponse>({
    queryKey: ['mesocycle', mesocycleId, 'next-week'],
    queryFn: async () => {
      const response = await api.get(`/mesocycles/${mesocycleId}/next-week`);
      return response.data;
    },
    enabled: !!mesocycleId,
    staleTime: 30000, // 30 seconds
  });
}
```

### Step 8: Integration into Mesocycle View

**File**: `packages/frontend/src/pages/MesocycleView.tsx` (additions)

```typescript
import { NextWeekPreview } from '../components/progression/NextWeekPreview';
import { useNextWeekProgression } from '../hooks/useNextWeekProgression';

// Inside the MesocycleView component:
export function MesocycleView(): React.ReactElement {
  const { mesocycleId } = useParams<{ mesocycleId: string }>();
  const { data: nextWeekData, isLoading: nextWeekLoading } = useNextWeekProgression(mesocycleId);

  return (
    <div className="space-y-6">
      {/* Existing mesocycle content */}

      {/* Next Week Preview Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Coming Up Next</h2>
        {nextWeekLoading ? (
          <div className="animate-pulse bg-gray-100 rounded-lg h-48" />
        ) : nextWeekData ? (
          <NextWeekPreview data={nextWeekData} />
        ) : null}
      </section>
    </div>
  );
}
```

---

## E2E Tests

### File: `packages/e2e/tests/progression.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { seedDatabase, clearDatabase } from './helpers/db';
import { loginAndNavigate } from './helpers/navigation';

test.describe('Progressive Overload', () => {
  test.beforeEach(async () => {
    await clearDatabase();
  });

  test('should show correct progression after completing a workout', async ({
    page,
  }) => {
    // Seed a mesocycle in week 0 with exercises
    await seedDatabase({
      mesocycle: {
        id: 'meso-1',
        currentWeek: 0,
        plan: {
          exercises: [
            { id: 'ex-1', name: 'Bench Press', weight: 100, reps: 8, sets: 3 },
          ],
        },
      },
    });

    await loginAndNavigate(page, '/mesocycles/meso-1');

    // Complete all sets for the workout
    await page.click('[data-testid="start-workout"]');

    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="log-set-button"]');
      await page.waitForTimeout(500); // Wait for UI update
    }

    await page.click('[data-testid="complete-workout"]');

    // Navigate to mesocycle view to see next week preview
    await page.click('[data-testid="nav-meso"]');

    // Verify next week shows progression
    const nextWeekPreview = page.locator('[data-testid="next-week-preview"]');
    await expect(nextWeekPreview).toBeVisible();

    // Week 1 should show +1 rep (9 reps instead of 8)
    await expect(nextWeekPreview).toContainText('Week 1 Preview');
    await expect(nextWeekPreview).toContainText('9 reps');
    await expect(nextWeekPreview).toContainText('100 lbs'); // Same weight

    // Should show progression indicator
    await expect(
      page.locator('[data-testid="progression-will-progress"]')
    ).toBeVisible();
  });

  test('should not progress when workout is incomplete', async ({ page }) => {
    // Seed a mesocycle in week 0
    await seedDatabase({
      mesocycle: {
        id: 'meso-1',
        currentWeek: 0,
        plan: {
          exercises: [
            { id: 'ex-1', name: 'Bench Press', weight: 100, reps: 8, sets: 3 },
          ],
        },
      },
    });

    await loginAndNavigate(page, '/mesocycles/meso-1');

    // Start workout but only complete 2 of 3 sets
    await page.click('[data-testid="start-workout"]');

    await page.click('[data-testid="log-set-button"]');
    await page.click('[data-testid="log-set-button"]');
    // Skip the third set
    await page.click('[data-testid="skip-set-button"]');

    await page.click('[data-testid="complete-workout"]');

    // Navigate to mesocycle view
    await page.click('[data-testid="nav-meso"]');

    // Verify next week does NOT show progression
    const nextWeekPreview = page.locator('[data-testid="next-week-preview"]');
    await expect(nextWeekPreview).toBeVisible();

    // Week 1 should show same weight and reps (no progression)
    await expect(nextWeekPreview).toContainText('8 reps'); // Same reps, not 9
    await expect(nextWeekPreview).toContainText('100 lbs');

    // Should show no-progression indicator
    await expect(
      page.locator('[data-testid="progression-will-not-progress"]')
    ).toBeVisible();
    await expect(nextWeekPreview).toContainText('Incomplete - no progression');
  });

  test('should display deload week correctly', async ({ page }) => {
    // Seed a mesocycle in week 5 (next week is deload)
    await seedDatabase({
      mesocycle: {
        id: 'meso-1',
        currentWeek: 5,
        completedWeeks: [0, 1, 2, 3, 4, 5],
        plan: {
          exercises: [
            { id: 'ex-1', name: 'Bench Press', weight: 100, reps: 8, sets: 4 },
          ],
        },
      },
    });

    await loginAndNavigate(page, '/mesocycles/meso-1');

    // View next week preview
    const nextWeekPreview = page.locator('[data-testid="next-week-preview"]');
    await expect(nextWeekPreview).toBeVisible();

    // Should show deload badge
    await expect(page.locator('[data-testid="deload-badge"]')).toBeVisible();
    await expect(nextWeekPreview).toContainText('Deload Week');

    // Week 5 would have weight 110 (100 + 5 + 5), deload = 110 * 0.85 = 93.5
    // Sets: 4 * 0.5 = 2
    await expect(nextWeekPreview).toContainText('93.5 lbs');
    await expect(nextWeekPreview).toContainText('2 sets');
  });

  test('should track progression across multiple weeks', async ({ page }) => {
    // Seed a fresh mesocycle
    await seedDatabase({
      mesocycle: {
        id: 'meso-1',
        currentWeek: 0,
        plan: {
          exercises: [
            {
              id: 'ex-1',
              name: 'Squat',
              weight: 135,
              reps: 8,
              sets: 3,
              weightIncrement: 10,
            },
          ],
        },
      },
    });

    await loginAndNavigate(page, '/mesocycles/meso-1');

    // Complete week 0
    await page.click('[data-testid="start-workout"]');
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="log-set-button"]');
    }
    await page.click('[data-testid="complete-workout"]');

    // Week 1: expect 9 reps, same weight
    await page.click('[data-testid="nav-meso"]');
    let preview = page.locator('[data-testid="next-week-preview"]');
    await expect(preview).toContainText('9 reps');
    await expect(preview).toContainText('135 lbs');

    // Advance to week 1 and complete
    await page.click('[data-testid="advance-week"]');
    await page.click('[data-testid="start-workout"]');
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="log-set-button"]');
    }
    await page.click('[data-testid="complete-workout"]');

    // Week 2: expect base reps (8), increased weight (145)
    await page.click('[data-testid="nav-meso"]');
    preview = page.locator('[data-testid="next-week-preview"]');
    await expect(preview).toContainText('8 reps');
    await expect(preview).toContainText('145 lbs');
  });
});
```

---

## Success Criteria

### Backend

- [ ] All unit tests for `ProgressionService` pass
- [ ] All unit tests for `DeloadService` pass
- [ ] All integration tests for `/api/mesocycles/:id/next-week` pass
- [ ] Progression calculation correctly handles all 7 weeks (0-6)
- [ ] Incomplete workout detection prevents progression
- [ ] Deload calculations use 85% weight and 50% sets
- [ ] Weight rounding to nearest 2.5 lbs works correctly
- [ ] Set count rounds up (minimum 1 set for deload)

### Frontend

- [ ] All unit tests for `ProgressionIndicator` pass
- [ ] All unit tests for `DeloadBadge` pass
- [ ] All unit tests for `NextWeekPreview` pass
- [ ] Next week preview displays in mesocycle view
- [ ] Progression status clearly indicated per exercise
- [ ] Deload week clearly labeled with badge
- [ ] Tooltip explanations work correctly

### E2E

- [ ] Complete workout shows correct next week progression
- [ ] Incomplete workout prevents progression
- [ ] Deload week displays correctly
- [ ] Multi-week progression tracking works end-to-end

### Code Quality

- [ ] No use of `any` type anywhere
- [ ] All functions have proper TypeScript types
- [ ] 100% test coverage for progression logic
- [ ] ESLint passes with no warnings
- [ ] All exports properly typed

---

## Commit Message

```
feat(progression): implement progressive overload and deload system

Add TDD-developed progression system for 6-week mesocycles:

- ProgressionService calculates weekly targets based on progressive
  overload rules (alternating rep/weight increases)
- DeloadService handles week 6 recovery (85% weight, 50% volume)
- Incomplete set detection prevents exercise progression
- GET /api/mesocycles/:id/next-week endpoint for progression preview
- Frontend components show progression status and deload indicators
- Full E2E test coverage for progression scenarios

Progression pattern:
- Week 0: Base weight/reps
- Week 1: +1 rep
- Week 2: +weight, reset reps
- Week 3: +1 rep
- Week 4: +weight, reset reps
- Week 5: +1 rep
- Week 6: Deload (85% weight, 50% sets)

Critical rule: exercises only progress if all sets completed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Implementation Order

1. **Types first** - Define all TypeScript interfaces
2. **ProgressionService tests** - Write all test cases
3. **ProgressionService implementation** - Make tests pass
4. **DeloadService tests** - Write deload-specific tests
5. **DeloadService implementation** - Make tests pass
6. **API endpoint tests** - Integration tests
7. **API endpoint implementation** - Connect services
8. **Frontend component tests** - Unit tests for each component
9. **Frontend components** - Implement UI
10. **Integration** - Wire up to mesocycle view
11. **E2E tests** - Full flow verification
12. **Review and refactor** - Clean up, ensure 100% coverage
