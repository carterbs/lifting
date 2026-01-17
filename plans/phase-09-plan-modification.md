# Phase 9: Plan Modification During Active Mesocycle (TDD)

## Overview

This phase enables users to edit workout plans while a mesocycle is actively in progress. Changes apply only to future workouts, preserving the integrity of historical data and any already-logged sets.

## Requirements Summary

- User can add/remove exercises from plan days
- User can change sets/reps/weight/rest for exercises
- User can add/remove workout days
- Changes apply to FUTURE workouts only (not past or current)

---

## Backend Implementation

### Database Considerations

Before implementing the API changes, consider the data model implications:

1. **Plan vs Mesocycle relationship**: Plans are templates; mesocycles are instances with concrete workout_sets
2. **Workout state tracking**: Need to identify which workouts are:
   - Past (completed or skipped)
   - Current (in progress, may have some logged sets)
   - Future (not yet started)

### API Endpoint: PUT /api/plans/:id

#### Test File: `server/src/routes/__tests__/plans.update-active.test.ts`

```typescript
// Tests to implement (write BEFORE implementation)

describe('PUT /api/plans/:id with active mesocycle', () => {
  describe('validation', () => {
    it('should return 404 for non-existent plan');
    it('should return 400 for invalid plan structure');
    it('should return 200 when plan has no active mesocycle (standard update)');
  });

  describe('detecting affected workouts', () => {
    it('should identify future workouts only');
    it('should not modify past workouts');
    it('should not modify current in-progress workout');
    it('should correctly handle timezone differences');
  });

  describe('adding exercises', () => {
    it('should add exercise to all future workout days matching the plan day');
    it('should create workout_sets for the new exercise with correct targets');
    it('should respect progressive overload for the remaining weeks');
    it('should handle adding exercise mid-week (some days past, some future)');
  });

  describe('removing exercises', () => {
    it('should remove exercise from future workouts only');
    it('should preserve logged sets for removed exercise in current workout');
    it('should not affect past workouts with that exercise');
    it(
      'should handle exercise that exists in current workout with logged sets'
    );
  });

  describe('updating exercise parameters', () => {
    it('should update sets count for future workouts');
    it('should update target reps for future workouts');
    it('should update target weight for future workouts');
    it('should update rest time for future workouts');
    it('should recalculate progressive overload from change point');
  });

  describe('adding workout days', () => {
    it('should create new workouts for remaining weeks');
    it('should assign correct week numbers to new workouts');
    it('should create workout_sets for new day exercises');
  });

  describe('removing workout days', () => {
    it('should remove future workouts for that day');
    it('should preserve past workouts for removed day');
    it('should handle day with in-progress workout (should not delete)');
  });

  describe('response format', () => {
    it('should return updated plan');
    it('should include count of affected workouts');
    it('should include warning if current workout was preserved');
  });
});
```

#### Implementation: `server/src/routes/plans.ts`

Add to existing plans router:

```typescript
// PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedPlan = req.body;

  // 1. Validate plan exists
  const existingPlan = await planService.getById(id);
  if (!existingPlan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // 2. Validate plan structure
  const validation = validatePlanStructure(updatedPlan);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // 3. Check for active mesocycle
  const activeMeso = await mesocycleService.getActiveByPlanId(id);

  if (!activeMeso) {
    // Standard update - no active mesocycle
    const result = await planService.update(id, updatedPlan);
    return res.json({ plan: result, affectedWorkouts: 0 });
  }

  // 4. Active mesocycle exists - apply changes to future workouts only
  const result = await planModificationService.applyChangesToActiveMesocycle(
    existingPlan,
    updatedPlan,
    activeMeso
  );

  return res.json({
    plan: result.plan,
    affectedWorkouts: result.affectedWorkoutCount,
    warnings: result.warnings,
  });
});
```

### Service: Plan Modification Service

#### Test File: `server/src/services/__tests__/planModificationService.test.ts`

```typescript
describe('PlanModificationService', () => {
  describe('diffPlanChanges', () => {
    it('should detect added exercises');
    it('should detect removed exercises');
    it('should detect modified exercise parameters');
    it('should detect added workout days');
    it('should detect removed workout days');
    it('should detect reordered exercises (no-op for workouts)');
    it('should handle multiple changes in single update');
  });

  describe('getFutureWorkouts', () => {
    it('should return workouts with start date after now');
    it('should exclude completed workouts');
    it('should exclude in-progress workouts');
    it('should include not-started workouts for today');
  });

  describe('addExerciseToFutureWorkouts', () => {
    it('should create workout_sets for matching plan days');
    it('should calculate correct targets based on week number');
    it('should apply progressive overload rules');
    it('should not create sets for non-matching days');
    it('should handle exercise added to multiple days');
  });

  describe('removeExerciseFromFutureWorkouts', () => {
    it('should delete workout_sets for future workouts');
    it('should preserve workout_sets with logged data');
    it('should update workout exercise count');
    it('should handle exercise on multiple days');
  });

  describe('updateExerciseTargetsForFutureWorkouts', () => {
    it('should update target_reps for all matching sets');
    it('should update target_weight for all matching sets');
    it('should update set_count (add/remove sets)');
    it('should update rest_seconds');
    it('should recalculate progressive overload from new base');
  });

  describe('addWorkoutDayToFutureWeeks', () => {
    it('should create workout for each remaining week');
    it('should create all workout_sets for the day');
    it('should assign correct day_of_week');
    it('should maintain week numbering');
  });

  describe('removeWorkoutDayFromFutureWeeks', () => {
    it('should delete future workouts for that day');
    it('should preserve workouts with any logged sets');
    it('should return warning for preserved workouts');
  });

  describe('applyChangesToActiveMesocycle', () => {
    it('should process all detected changes');
    it('should maintain data consistency');
    it('should return summary of changes');
    it('should rollback on error');
  });
});
```

#### Implementation: `server/src/services/planModificationService.ts`

```typescript
import {
  Plan,
  Mesocycle,
  Workout,
  WorkoutSet,
  PlanDay,
  Exercise,
} from '../types';
import { workoutRepository } from '../repositories/workoutRepository';
import { workoutSetRepository } from '../repositories/workoutSetRepository';
import { planRepository } from '../repositories/planRepository';

interface PlanDiff {
  addedExercises: Array<{ dayIndex: number; exercise: Exercise }>;
  removedExercises: Array<{ dayIndex: number; exerciseId: string }>;
  modifiedExercises: Array<{
    dayIndex: number;
    exerciseId: string;
    changes: Partial<Exercise>;
  }>;
  addedDays: PlanDay[];
  removedDays: number[]; // day indices
}

interface ModificationResult {
  plan: Plan;
  affectedWorkoutCount: number;
  warnings: string[];
}

export const planModificationService = {
  /**
   * Compare old and new plan to determine what changed
   */
  diffPlanChanges(oldPlan: Plan, newPlan: Plan): PlanDiff {
    const diff: PlanDiff = {
      addedExercises: [],
      removedExercises: [],
      modifiedExercises: [],
      addedDays: [],
      removedDays: [],
    };

    // Compare days
    const oldDayCount = oldPlan.days.length;
    const newDayCount = newPlan.days.length;

    // Detect added days
    if (newDayCount > oldDayCount) {
      for (let i = oldDayCount; i < newDayCount; i++) {
        diff.addedDays.push(newPlan.days[i]);
      }
    }

    // Detect removed days
    if (newDayCount < oldDayCount) {
      for (let i = newDayCount; i < oldDayCount; i++) {
        diff.removedDays.push(i);
      }
    }

    // Compare exercises within existing days
    const comparableDays = Math.min(oldDayCount, newDayCount);
    for (let dayIndex = 0; dayIndex < comparableDays; dayIndex++) {
      const oldDay = oldPlan.days[dayIndex];
      const newDay = newPlan.days[dayIndex];

      const oldExerciseIds = new Set(oldDay.exercises.map((e) => e.id));
      const newExerciseIds = new Set(newDay.exercises.map((e) => e.id));

      // Added exercises
      for (const exercise of newDay.exercises) {
        if (!oldExerciseIds.has(exercise.id)) {
          diff.addedExercises.push({ dayIndex, exercise });
        }
      }

      // Removed exercises
      for (const exercise of oldDay.exercises) {
        if (!newExerciseIds.has(exercise.id)) {
          diff.removedExercises.push({ dayIndex, exerciseId: exercise.id });
        }
      }

      // Modified exercises
      for (const newExercise of newDay.exercises) {
        if (oldExerciseIds.has(newExercise.id)) {
          const oldExercise = oldDay.exercises.find(
            (e) => e.id === newExercise.id
          )!;
          const changes = this.getExerciseChanges(oldExercise, newExercise);
          if (Object.keys(changes).length > 0) {
            diff.modifiedExercises.push({
              dayIndex,
              exerciseId: newExercise.id,
              changes,
            });
          }
        }
      }
    }

    return diff;
  },

  /**
   * Get changed fields between two exercise configurations
   */
  getExerciseChanges(
    oldExercise: Exercise,
    newExercise: Exercise
  ): Partial<Exercise> {
    const changes: Partial<Exercise> = {};

    if (oldExercise.sets !== newExercise.sets) changes.sets = newExercise.sets;
    if (oldExercise.reps !== newExercise.reps) changes.reps = newExercise.reps;
    if (oldExercise.weight !== newExercise.weight)
      changes.weight = newExercise.weight;
    if (oldExercise.restSeconds !== newExercise.restSeconds)
      changes.restSeconds = newExercise.restSeconds;

    return changes;
  },

  /**
   * Get all future workouts for a mesocycle
   */
  async getFutureWorkouts(mesocycleId: string): Promise<Workout[]> {
    const allWorkouts = await workoutRepository.getByMesocycleId(mesocycleId);
    const now = new Date();

    return allWorkouts.filter((workout) => {
      // Exclude completed workouts
      if (workout.status === 'completed' || workout.status === 'skipped') {
        return false;
      }

      // Exclude in-progress workouts
      if (workout.status === 'in_progress') {
        return false;
      }

      // Include if scheduled for future
      const workoutDate = new Date(workout.scheduledDate);
      return (
        workoutDate > now ||
        (workoutDate.toDateString() === now.toDateString() &&
          workout.status === 'not_started')
      );
    });
  },

  /**
   * Add a new exercise to all future workouts matching the plan day
   */
  async addExerciseToFutureWorkouts(
    mesocycleId: string,
    dayIndex: number,
    exercise: Exercise,
    mesocycle: Mesocycle
  ): Promise<number> {
    const futureWorkouts = await this.getFutureWorkouts(mesocycleId);
    const matchingWorkouts = futureWorkouts.filter(
      (w) => w.planDayIndex === dayIndex
    );

    let affectedCount = 0;

    for (const workout of matchingWorkouts) {
      // Calculate progressive overload based on week number
      const weekNumber = workout.weekNumber;
      const { targetReps, targetWeight } = this.calculateProgressiveTargets(
        exercise.reps,
        exercise.weight,
        weekNumber
      );

      // Create workout_sets for this exercise
      for (let setNum = 1; setNum <= exercise.sets; setNum++) {
        await workoutSetRepository.create({
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          setNumber: setNum,
          targetReps,
          targetWeight,
          restSeconds: exercise.restSeconds,
          status: 'pending',
        });
      }

      affectedCount++;
    }

    return affectedCount;
  },

  /**
   * Remove an exercise from all future workouts
   */
  async removeExerciseFromFutureWorkouts(
    mesocycleId: string,
    dayIndex: number,
    exerciseId: string
  ): Promise<{ removed: number; preserved: number }> {
    const futureWorkouts = await this.getFutureWorkouts(mesocycleId);
    const matchingWorkouts = futureWorkouts.filter(
      (w) => w.planDayIndex === dayIndex
    );

    let removed = 0;
    let preserved = 0;

    for (const workout of matchingWorkouts) {
      const sets = await workoutSetRepository.getByWorkoutAndExercise(
        workout.id,
        exerciseId
      );

      // Check if any sets have logged data
      const hasLoggedData = sets.some(
        (s) => s.status === 'completed' || s.actualReps !== null
      );

      if (hasLoggedData) {
        // Preserve sets with logged data
        preserved++;
      } else {
        // Delete all sets for this exercise in this workout
        await workoutSetRepository.deleteByWorkoutAndExercise(
          workout.id,
          exerciseId
        );
        removed++;
      }
    }

    return { removed, preserved };
  },

  /**
   * Update exercise parameters (sets, reps, weight, rest) for future workouts
   */
  async updateExerciseTargetsForFutureWorkouts(
    mesocycleId: string,
    dayIndex: number,
    exerciseId: string,
    changes: Partial<Exercise>,
    mesocycle: Mesocycle
  ): Promise<number> {
    const futureWorkouts = await this.getFutureWorkouts(mesocycleId);
    const matchingWorkouts = futureWorkouts.filter(
      (w) => w.planDayIndex === dayIndex
    );

    let affectedCount = 0;

    for (const workout of matchingWorkouts) {
      const existingSets = await workoutSetRepository.getByWorkoutAndExercise(
        workout.id,
        exerciseId
      );

      if (existingSets.length === 0) continue;

      // Handle set count changes
      if (changes.sets !== undefined) {
        const currentSetCount = existingSets.length;

        if (changes.sets > currentSetCount) {
          // Add sets
          const baseSet = existingSets[0];
          for (let i = currentSetCount + 1; i <= changes.sets; i++) {
            await workoutSetRepository.create({
              workoutId: workout.id,
              exerciseId,
              setNumber: i,
              targetReps: baseSet.targetReps,
              targetWeight: baseSet.targetWeight,
              restSeconds: changes.restSeconds ?? baseSet.restSeconds,
              status: 'pending',
            });
          }
        } else if (changes.sets < currentSetCount) {
          // Remove sets (from the end, only pending ones)
          const setsToRemove = existingSets
            .filter((s) => s.setNumber > changes.sets && s.status === 'pending')
            .map((s) => s.id);

          for (const setId of setsToRemove) {
            await workoutSetRepository.delete(setId);
          }
        }
      }

      // Update targets for remaining sets
      const updatedSets = await workoutSetRepository.getByWorkoutAndExercise(
        workout.id,
        exerciseId
      );

      for (const set of updatedSets) {
        if (set.status !== 'pending') continue; // Don't modify logged sets

        const updates: Partial<WorkoutSet> = {};

        if (changes.reps !== undefined) {
          const { targetReps } = this.calculateProgressiveTargets(
            changes.reps,
            set.targetWeight,
            workout.weekNumber
          );
          updates.targetReps = targetReps;
        }

        if (changes.weight !== undefined) {
          const { targetWeight } = this.calculateProgressiveTargets(
            set.targetReps,
            changes.weight,
            workout.weekNumber
          );
          updates.targetWeight = targetWeight;
        }

        if (changes.restSeconds !== undefined) {
          updates.restSeconds = changes.restSeconds;
        }

        if (Object.keys(updates).length > 0) {
          await workoutSetRepository.update(set.id, updates);
        }
      }

      affectedCount++;
    }

    return affectedCount;
  },

  /**
   * Add a new workout day to all remaining weeks
   */
  async addWorkoutDayToFutureWeeks(
    mesocycleId: string,
    planDay: PlanDay,
    dayIndex: number,
    mesocycle: Mesocycle
  ): Promise<number> {
    // Determine remaining weeks
    const currentWeek = this.getCurrentWeek(mesocycle);
    const totalWeeks = mesocycle.durationWeeks;

    let created = 0;

    for (let week = currentWeek; week <= totalWeeks; week++) {
      // Calculate the date for this day in this week
      const workoutDate = this.calculateWorkoutDate(
        mesocycle.startDate,
        week,
        planDay.dayOfWeek
      );

      // Skip if date is in the past
      if (workoutDate < new Date()) continue;

      // Create the workout
      const workout = await workoutRepository.create({
        mesocycleId,
        planDayIndex: dayIndex,
        weekNumber: week,
        scheduledDate: workoutDate,
        dayOfWeek: planDay.dayOfWeek,
        status: 'not_started',
      });

      // Create workout_sets for each exercise
      for (const exercise of planDay.exercises) {
        const { targetReps, targetWeight } = this.calculateProgressiveTargets(
          exercise.reps,
          exercise.weight,
          week
        );

        for (let setNum = 1; setNum <= exercise.sets; setNum++) {
          await workoutSetRepository.create({
            workoutId: workout.id,
            exerciseId: exercise.exerciseId,
            setNumber: setNum,
            targetReps,
            targetWeight,
            restSeconds: exercise.restSeconds,
            status: 'pending',
          });
        }
      }

      created++;
    }

    return created;
  },

  /**
   * Remove a workout day from future weeks
   */
  async removeWorkoutDayFromFutureWeeks(
    mesocycleId: string,
    dayIndex: number
  ): Promise<{ removed: number; preserved: number; warnings: string[] }> {
    const futureWorkouts = await this.getFutureWorkouts(mesocycleId);
    const matchingWorkouts = futureWorkouts.filter(
      (w) => w.planDayIndex === dayIndex
    );

    let removed = 0;
    let preserved = 0;
    const warnings: string[] = [];

    for (const workout of matchingWorkouts) {
      const sets = await workoutSetRepository.getByWorkoutId(workout.id);
      const hasLoggedData = sets.some(
        (s) => s.status === 'completed' || s.actualReps !== null
      );

      if (hasLoggedData) {
        preserved++;
        warnings.push(
          `Workout on ${workout.scheduledDate} preserved due to logged data`
        );
      } else {
        // Delete all sets then the workout
        await workoutSetRepository.deleteByWorkoutId(workout.id);
        await workoutRepository.delete(workout.id);
        removed++;
      }
    }

    return { removed, preserved, warnings };
  },

  /**
   * Calculate progressive overload targets based on week number
   * Week 0: base values
   * Week 1: +1 rep
   * Week 2: +5 lbs weight
   * Week 3: +1 rep
   * Week 4: +5 lbs weight
   * etc.
   */
  calculateProgressiveTargets(
    baseReps: number,
    baseWeight: number,
    weekNumber: number
  ): { targetReps: number; targetWeight: number } {
    let targetReps = baseReps;
    let targetWeight = baseWeight;

    for (let week = 1; week <= weekNumber; week++) {
      if (week % 2 === 1) {
        // Odd weeks: add rep
        targetReps += 1;
      } else {
        // Even weeks: add weight
        targetWeight += 5;
      }
    }

    return { targetReps, targetWeight };
  },

  /**
   * Get current week number of mesocycle
   */
  getCurrentWeek(mesocycle: Mesocycle): number {
    const start = new Date(mesocycle.startDate);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.floor(diffDays / 7);
  },

  /**
   * Calculate workout date for a given week and day of week
   */
  calculateWorkoutDate(
    startDate: Date | string,
    weekNumber: number,
    dayOfWeek: number
  ): Date {
    const start = new Date(startDate);
    const startDayOfWeek = start.getDay();

    // Calculate days to add
    let daysToAdd = weekNumber * 7 + (dayOfWeek - startDayOfWeek);
    if (dayOfWeek < startDayOfWeek) {
      daysToAdd += 7;
    }

    const result = new Date(start);
    result.setDate(result.getDate() + daysToAdd);
    return result;
  },

  /**
   * Main entry point: Apply all changes from plan update to active mesocycle
   */
  async applyChangesToActiveMesocycle(
    oldPlan: Plan,
    newPlan: Plan,
    mesocycle: Mesocycle
  ): Promise<ModificationResult> {
    const warnings: string[] = [];
    let totalAffected = 0;

    // Start transaction for data consistency
    await db.transaction(async (trx) => {
      // Get the diff
      const diff = this.diffPlanChanges(oldPlan, newPlan);

      // Process removed days first
      for (const dayIndex of diff.removedDays) {
        const result = await this.removeWorkoutDayFromFutureWeeks(
          mesocycle.id,
          dayIndex
        );
        totalAffected += result.removed;
        warnings.push(...result.warnings);
      }

      // Process removed exercises
      for (const { dayIndex, exerciseId } of diff.removedExercises) {
        const result = await this.removeExerciseFromFutureWorkouts(
          mesocycle.id,
          dayIndex,
          exerciseId
        );
        totalAffected += result.removed;
        if (result.preserved > 0) {
          warnings.push(
            `${result.preserved} workout(s) preserved logged data for removed exercise`
          );
        }
      }

      // Process added exercises
      for (const { dayIndex, exercise } of diff.addedExercises) {
        const count = await this.addExerciseToFutureWorkouts(
          mesocycle.id,
          dayIndex,
          exercise,
          mesocycle
        );
        totalAffected += count;
      }

      // Process modified exercises
      for (const { dayIndex, exerciseId, changes } of diff.modifiedExercises) {
        const count = await this.updateExerciseTargetsForFutureWorkouts(
          mesocycle.id,
          dayIndex,
          exerciseId,
          changes,
          mesocycle
        );
        totalAffected += count;
      }

      // Process added days
      for (let i = 0; i < diff.addedDays.length; i++) {
        const dayIndex = oldPlan.days.length + i;
        const count = await this.addWorkoutDayToFutureWeeks(
          mesocycle.id,
          diff.addedDays[i],
          dayIndex,
          mesocycle
        );
        totalAffected += count;
      }

      // Update the plan itself
      await planRepository.update(newPlan.id, newPlan);
    });

    return {
      plan: newPlan,
      affectedWorkoutCount: totalAffected,
      warnings,
    };
  },
};
```

### Repository Methods to Add

#### `workoutSetRepository.ts` additions:

```typescript
async getByWorkoutAndExercise(workoutId: string, exerciseId: string): Promise<WorkoutSet[]> {
  return db('workout_sets')
    .where({ workout_id: workoutId, exercise_id: exerciseId })
    .orderBy('set_number');
}

async deleteByWorkoutAndExercise(workoutId: string, exerciseId: string): Promise<void> {
  await db('workout_sets')
    .where({ workout_id: workoutId, exercise_id: exerciseId })
    .delete();
}

async deleteByWorkoutId(workoutId: string): Promise<void> {
  await db('workout_sets')
    .where({ workout_id: workoutId })
    .delete();
}
```

---

## Frontend Implementation

### Components to Modify/Create

#### 1. Edit Plan Button (Meso Tab)

**File:** `client/src/components/MesoTab/MesoHeader.tsx`

Add edit button when mesocycle is active:

```tsx
interface MesoHeaderProps {
  mesocycle: Mesocycle;
  plan: Plan;
  onEditPlan: () => void;
}

export function MesoHeader({ mesocycle, plan, onEditPlan }: MesoHeaderProps) {
  return (
    <div className="meso-header">
      <h2>{plan.name}</h2>
      <p>
        Week {mesocycle.currentWeek} of {mesocycle.durationWeeks}
      </p>
      {mesocycle.status === 'active' && (
        <Button variant="outline" onClick={onEditPlan}>
          Edit Plan
        </Button>
      )}
    </div>
  );
}
```

#### 2. Warning Dialog Component

**File:** `client/src/components/PlanEditor/ActivePlanWarningDialog.tsx`

```tsx
import * as Dialog from '@radix-ui/react-dialog';

interface ActivePlanWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  affectedWorkoutCount?: number;
}

export function ActivePlanWarningDialog({
  open,
  onConfirm,
  onCancel,
  affectedWorkoutCount,
}: ActivePlanWarningDialogProps) {
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Edit Active Plan</Dialog.Title>
          <Dialog.Description>
            <p>
              This plan has an active mesocycle. Any changes you make will only
              apply to <strong>future workouts</strong>.
            </p>
            <ul>
              <li>Past workouts will remain unchanged</li>
              <li>Your current in-progress workout will not be affected</li>
              <li>Any logged sets will be preserved</li>
            </ul>
            {affectedWorkoutCount !== undefined && (
              <p>
                This change will affect approximately{' '}
                <strong>{affectedWorkoutCount} future workout(s)</strong>.
              </p>
            )}
          </Dialog.Description>
          <div className="dialog-actions">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              Continue Editing
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

#### 3. Integration with Plan Editor (Phase 4)

**File:** `client/src/pages/EditPlanPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlanEditor } from '../components/PlanEditor/PlanEditor';
import { ActivePlanWarningDialog } from '../components/PlanEditor/ActivePlanWarningDialog';
import { usePlan } from '../hooks/usePlan';
import { useActiveMesocycle } from '../hooks/useActiveMesocycle';
import { planApi } from '../api/planApi';

export function EditPlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plan, loading: planLoading } = usePlan(planId!);
  const { mesocycle, loading: mesoLoading } = useActiveMesocycle(planId!);

  const [showWarning, setShowWarning] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show warning on initial load if mesocycle is active
  useEffect(() => {
    if (mesocycle && mesocycle.status === 'active' && !warningAcknowledged) {
      setShowWarning(true);
    }
  }, [mesocycle, warningAcknowledged]);

  const handleWarningConfirm = () => {
    setWarningAcknowledged(true);
    setShowWarning(false);
  };

  const handleWarningCancel = () => {
    navigate(-1); // Go back
  };

  const handleSave = async (updatedPlan: Plan) => {
    setSaving(true);
    setError(null);

    try {
      const result = await planApi.update(planId!, updatedPlan);

      if (result.warnings && result.warnings.length > 0) {
        // Show warnings to user
        console.warn('Plan update warnings:', result.warnings);
      }

      navigate(`/meso/${mesocycle?.id || ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  if (planLoading || mesoLoading) {
    return <LoadingSpinner />;
  }

  if (!plan) {
    return <ErrorMessage>Plan not found</ErrorMessage>;
  }

  return (
    <div className="edit-plan-page">
      <ActivePlanWarningDialog
        open={showWarning}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />

      {warningAcknowledged && mesocycle?.status === 'active' && (
        <div className="warning-banner">
          Editing active plan. Changes apply to future workouts only.
        </div>
      )}

      <PlanEditor
        initialPlan={plan}
        onSave={handleSave}
        onCancel={() => navigate(-1)}
        saving={saving}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
```

#### 4. API Client Update

**File:** `client/src/api/planApi.ts`

```typescript
interface UpdatePlanResponse {
  plan: Plan;
  affectedWorkouts: number;
  warnings?: string[];
}

export const planApi = {
  // ... existing methods

  async update(planId: string, plan: Plan): Promise<UpdatePlanResponse> {
    const response = await fetch(`/api/plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update plan');
    }

    return response.json();
  },
};
```

### Frontend Tests

**File:** `client/src/__tests__/EditPlanPage.test.tsx`

```tsx
describe('EditPlanPage', () => {
  describe('without active mesocycle', () => {
    it('should not show warning dialog');
    it('should render plan editor immediately');
    it('should save plan without warnings');
  });

  describe('with active mesocycle', () => {
    it('should show warning dialog on load');
    it('should navigate back if warning cancelled');
    it('should show warning banner after acknowledgment');
    it('should allow editing after acknowledging warning');
    it('should display affected workout count after save');
    it('should display any warnings returned from API');
  });

  describe('plan editor integration', () => {
    it('should load existing plan data');
    it('should call API with updated plan on save');
    it('should handle API errors gracefully');
    it('should navigate after successful save');
  });
});
```

---

## E2E Tests

**File:** `e2e/tests/plan-modification-active-meso.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { seedActiveMesocycle, seedPlan, getWorkouts } from '../helpers/db';

test.describe('Plan Modification During Active Mesocycle', () => {
  test.beforeEach(async ({ page }) => {
    // Seed a plan with active mesocycle in week 2
    await seedPlan({
      id: 'test-plan',
      name: 'Test Plan',
      days: [
        {
          dayOfWeek: 1, // Monday
          exercises: [
            {
              exerciseId: 'bench-press',
              sets: 3,
              reps: 8,
              weight: 100,
              restSeconds: 60,
            },
          ],
        },
      ],
    });

    await seedActiveMesocycle({
      planId: 'test-plan',
      currentWeek: 2,
      durationWeeks: 6,
    });
  });

  test('should show warning when editing active plan', async ({ page }) => {
    await page.goto('/meso');
    await page.click('button:has-text("Edit Plan")');

    await expect(page.locator('.dialog-content')).toBeVisible();
    await expect(page.locator('.dialog-content')).toContainText(
      'future workouts'
    );
  });

  test('should add exercise and verify in future workouts', async ({
    page,
  }) => {
    await page.goto('/meso');
    await page.click('button:has-text("Edit Plan")');
    await page.click('button:has-text("Continue Editing")');

    // Add exercise to Monday
    await page.click('[data-day="monday"] button:has-text("Add Exercise")');
    await page.selectOption('[data-testid="exercise-select"]', 'cable-curl');
    await page.fill('[data-testid="sets-input"]', '3');
    await page.fill('[data-testid="reps-input"]', '10');
    await page.click('button:has-text("Save")');

    // Navigate to future Monday workout (week 3)
    await page.goto('/meso');
    await page.click('[data-week="3"] [data-day="monday"]');

    // Verify new exercise appears
    await expect(page.locator('[data-exercise="cable-curl"]')).toBeVisible();
    await expect(
      page.locator('[data-exercise="cable-curl"] .sets')
    ).toContainText('3 sets');
  });

  test('should verify past workouts remain unchanged', async ({ page }) => {
    // First, check what week 1 Monday looks like
    await page.goto('/meso');
    const week1Monday = await page.locator(
      '[data-week="1"] [data-day="monday"]'
    );
    await week1Monday.click();

    const originalExercises = await page.locator('[data-exercise]').count();
    expect(originalExercises).toBe(1); // Only bench press

    // Go back and edit the plan
    await page.goto('/meso');
    await page.click('button:has-text("Edit Plan")');
    await page.click('button:has-text("Continue Editing")');

    // Add exercise
    await page.click('[data-day="monday"] button:has-text("Add Exercise")');
    await page.selectOption('[data-testid="exercise-select"]', 'cable-curl');
    await page.click('button:has-text("Save")');

    // Check week 1 again - should still have only 1 exercise
    await page.goto('/meso');
    await page.click('[data-week="1"] [data-day="monday"]');

    const exercisesAfterEdit = await page.locator('[data-exercise]').count();
    expect(exercisesAfterEdit).toBe(1); // Still only bench press
  });

  test('should change rest time and verify future workouts updated', async ({
    page,
  }) => {
    await page.goto('/meso');
    await page.click('button:has-text("Edit Plan")');
    await page.click('button:has-text("Continue Editing")');

    // Change rest time for bench press
    await page.click('[data-day="monday"] [data-exercise="bench-press"]');
    await page.fill('[data-testid="rest-input"]', '90');
    await page.click('button:has-text("Save")');

    // Check future workout
    await page.goto('/meso');
    await page.click('[data-week="4"] [data-day="monday"]');

    // Start the exercise to see rest timer configuration
    await page.click('[data-exercise="bench-press"]');
    await expect(page.locator('[data-testid="rest-timer"]')).toContainText(
      '90'
    );
  });

  test('should add new workout day', async ({ page }) => {
    await page.goto('/meso');
    await page.click('button:has-text("Edit Plan")');
    await page.click('button:has-text("Continue Editing")');

    // Add Wednesday workout
    await page.click('button:has-text("Add Day")');
    await page.selectOption('[data-testid="day-select"]', 'wednesday');
    await page.click('[data-day="wednesday"] button:has-text("Add Exercise")');
    await page.selectOption('[data-testid="exercise-select"]', 'leg-extension');
    await page.click('button:has-text("Save")');

    // Verify Wednesday appears in future weeks
    await page.goto('/meso');
    await expect(
      page.locator('[data-week="3"] [data-day="wednesday"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-week="4"] [data-day="wednesday"]')
    ).toBeVisible();

    // Past weeks should not have Wednesday
    await expect(
      page.locator('[data-week="1"] [data-day="wednesday"]')
    ).not.toBeVisible();
  });

  test('should remove exercise with logged sets in current workout', async ({
    page,
  }) => {
    // First log a set in current workout
    await page.goto('/today');
    await page.click('[data-exercise="bench-press"] [data-set="1"]');
    await page.click('button:has-text("Log Set")');

    // Now try to edit the plan and remove bench press
    await page.goto('/meso');
    await page.click('button:has-text("Edit Plan")');
    await page.click('button:has-text("Continue Editing")');

    await page.click(
      '[data-day="monday"] [data-exercise="bench-press"] button:has-text("Remove")'
    );
    await page.click('button:has-text("Save")');

    // Current workout should still have bench press (preserved logged data)
    await page.goto('/today');
    await expect(page.locator('[data-exercise="bench-press"]')).toBeVisible();

    // Future workouts should not have bench press
    await page.goto('/meso');
    await page.click('[data-week="4"] [data-day="monday"]');
    await expect(
      page.locator('[data-exercise="bench-press"]')
    ).not.toBeVisible();
  });
});
```

---

## Edge Cases and Their Handling

### 1. Adding Exercise Mid-Week

**Scenario:** User adds exercise on Wednesday. Monday's workout (past) and Tuesday's (current) should not be affected.

**Handling:**

- `getFutureWorkouts()` filters by date and status
- Only workouts that are `not_started` and scheduled for the future receive new exercises

### 2. Removing Exercise with Logged Sets

**Scenario:** User removes an exercise, but some sets for that exercise have already been logged in the current workout.

**Handling:**

- `removeExerciseFromFutureWorkouts()` checks for logged data before deletion
- Sets with `status === 'completed'` or `actualReps !== null` are preserved
- Returns count of preserved workouts for warning message

### 3. Changing Rest Time

**Scenario:** User changes rest time from 60s to 90s.

**Handling:**

- `updateExerciseTargetsForFutureWorkouts()` updates `restSeconds` on all future `workout_sets`
- Past and current workouts retain original rest time

### 4. Adding New Workout Day

**Scenario:** User adds a new Wednesday workout to a 3-day plan.

**Handling:**

- `addWorkoutDayToFutureWeeks()` creates workouts for all remaining weeks
- Calculates correct dates based on mesocycle start and week number
- Creates all `workout_sets` with progressive overload calculated

### 5. Concurrent Edits

**Scenario:** User opens edit page, another process modifies data.

**Handling:**

- Use database transactions for atomicity
- Consider adding optimistic locking (version field) if needed

### 6. Timezone Edge Cases

**Scenario:** Server and user in different timezones; "today" differs.

**Handling:**

- Store dates in UTC
- Use user's timezone when determining "current" workout
- Consider adding `timezone` field to mesocycle

---

## Success Criteria

### Functional Requirements

- [ ] User can access "Edit Plan" button from Meso tab when mesocycle is active
- [ ] Warning dialog is displayed explaining future-only changes
- [ ] Adding exercise creates workout_sets in all future matching workouts
- [ ] Removing exercise removes workout_sets from future workouts only
- [ ] Removing exercise preserves logged data in current workout
- [ ] Changing sets/reps/weight/rest updates future workouts
- [ ] Adding workout day creates workouts for remaining weeks
- [ ] Removing workout day removes future workouts only
- [ ] Past workouts are never modified
- [ ] In-progress workouts are never modified
- [ ] Progressive overload is correctly applied to new/modified exercises

### Test Coverage

- [ ] All unit tests pass for `planModificationService`
- [ ] All unit tests pass for `PUT /api/plans/:id` route
- [ ] All frontend component tests pass
- [ ] All E2E tests pass
- [ ] Code coverage >= 100% for new backend code
- [ ] Code coverage >= 100% for new frontend code

### Non-Functional Requirements

- [ ] Plan update completes within 2 seconds for typical mesocycle
- [ ] No data loss or corruption during modification
- [ ] Proper error handling with user-friendly messages
- [ ] Database transactions ensure consistency

---

## Implementation Order

1. **Backend Tests First (TDD)**
   - Write `planModificationService.test.ts`
   - Write `plans.update-active.test.ts`

2. **Backend Implementation**
   - Implement repository methods
   - Implement `planModificationService`
   - Implement `PUT /api/plans/:id` route

3. **Frontend Tests**
   - Write `EditPlanPage.test.tsx`
   - Write `ActivePlanWarningDialog.test.tsx`

4. **Frontend Implementation**
   - Create `ActivePlanWarningDialog` component
   - Update `EditPlanPage` to handle active mesocycle
   - Add edit button to Meso tab

5. **E2E Tests**
   - Write and run `plan-modification-active-meso.spec.ts`

6. **Integration Testing**
   - Full workflow testing
   - Edge case verification

---

## Commit Message

```
feat(plans): allow plan modification during active mesocycle

Add ability to edit workout plans while a mesocycle is in progress.
Changes apply only to future workouts, preserving historical data
and any already-logged sets.

Backend:
- Add PUT /api/plans/:id endpoint with active mesocycle support
- Implement planModificationService with:
  - diffPlanChanges() to detect modifications
  - addExerciseToFutureWorkouts()
  - removeExerciseFromFutureWorkouts()
  - updateExerciseTargetsForFutureWorkouts()
  - addWorkoutDayToFutureWeeks()
  - removeWorkoutDayFromFutureWeeks()
- Add repository methods for workout_sets manipulation
- Handle edge cases: mid-week changes, logged data preservation

Frontend:
- Add Edit Plan button to Meso tab (when active)
- Create ActivePlanWarningDialog component
- Integrate with existing PlanEditor from Phase 4
- Display affected workout count and warnings

Testing:
- 100% unit test coverage for new service and route
- Component tests for warning dialog and edit page
- E2E tests for full modification workflows

Closes #ISSUE_NUMBER

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Files to Create/Modify

### New Files

- `server/src/services/planModificationService.ts`
- `server/src/services/__tests__/planModificationService.test.ts`
- `server/src/routes/__tests__/plans.update-active.test.ts`
- `client/src/components/PlanEditor/ActivePlanWarningDialog.tsx`
- `client/src/__tests__/ActivePlanWarningDialog.test.tsx`
- `e2e/tests/plan-modification-active-meso.spec.ts`

### Modified Files

- `server/src/routes/plans.ts` - Add PUT handler with active mesocycle logic
- `server/src/repositories/workoutSetRepository.ts` - Add new query methods
- `client/src/components/MesoTab/MesoHeader.tsx` - Add edit button
- `client/src/pages/EditPlanPage.tsx` - Handle active mesocycle warning
- `client/src/api/planApi.ts` - Add update method
