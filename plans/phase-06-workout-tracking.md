# Phase 6: Workout Tracking Core (TDD)

## Overview

This phase implements the core workout tracking feature using a strict Test-Driven Development approach. The workout tracking system allows users to log their sets during a workout session, with the flexibility to complete exercises in any order based on equipment availability.

## Key Design Decisions

### 1. Out-of-Order Set Logging
Users can log sets for any exercise in any order. This reflects real gym conditions where equipment availability varies. The UI presents all exercises at once, and users tap to log whichever set they're ready to complete.

### 2. Hybrid Persistence Strategy
- **Intra-workout**: State saved to localStorage on every change (resilient to browser crashes, page refreshes)
- **Workout completion**: Full state persisted to SQLite database
- **Sync strategy**: On app load, check localStorage for in-progress workout; restore state if found

### 3. Flexible Completion Rules
- Workouts can be completed even with pending (unlogged) sets
- Sets can be skipped individually
- Entire workouts can be skipped (counts as a workout day for mesocycle tracking)

---

## Database Schema Changes

### WorkoutSet Table Updates

Ensure the `workout_sets` table supports the following fields (may already exist from earlier phases):

```sql
-- workout_sets table should have:
id              INTEGER PRIMARY KEY
workout_id      INTEGER NOT NULL REFERENCES workouts(id)
exercise_id     INTEGER NOT NULL REFERENCES exercises(id)
set_number      INTEGER NOT NULL
target_reps     INTEGER NOT NULL
target_weight   REAL NOT NULL
actual_reps     INTEGER          -- NULL until logged
actual_weight   REAL             -- NULL until logged
status          TEXT NOT NULL DEFAULT 'pending'  -- 'pending', 'logged', 'skipped'
logged_at       DATETIME         -- timestamp when logged
```

### Workout Table Updates

```sql
-- workouts table should have:
id              INTEGER PRIMARY KEY
mesocycle_id    INTEGER NOT NULL REFERENCES mesocycles(id)
plan_day_id     INTEGER NOT NULL REFERENCES plan_days(id)
scheduled_date  DATE NOT NULL
status          TEXT NOT NULL DEFAULT 'scheduled'  -- 'scheduled', 'in_progress', 'completed', 'skipped'
started_at      DATETIME
completed_at    DATETIME
```

---

## Backend Implementation (Tests First)

### File Structure

```
packages/api/
  src/
    routes/
      workouts.ts         # Workout routes
      workout-sets.ts     # Individual set routes
    services/
      workout.service.ts
      workout-set.service.ts
    types/
      workout.types.ts
  tests/
    routes/
      workouts.test.ts
      workout-sets.test.ts
    services/
      workout.service.test.ts
      workout-set.service.test.ts
```

### API Endpoints

#### 1. GET /api/workouts/:id

**Purpose**: Retrieve a workout with all its sets, organized by exercise.

**Test Cases** (write these first):
```typescript
describe('GET /api/workouts/:id', () => {
  it('should return 404 for non-existent workout', async () => {
    const response = await request(app).get('/api/workouts/9999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Workout not found');
  });

  it('should return workout with all sets grouped by exercise', async () => {
    // Setup: Create workout with multiple exercises and sets
    const response = await request(app).get('/api/workouts/1');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      status: 'scheduled',
      scheduledDate: expect.any(String),
      exercises: expect.arrayContaining([
        expect.objectContaining({
          exerciseId: expect.any(Number),
          exerciseName: expect.any(String),
          sets: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              setNumber: expect.any(Number),
              targetReps: expect.any(Number),
              targetWeight: expect.any(Number),
              actualReps: null,
              actualWeight: null,
              status: 'pending'
            })
          ])
        })
      ])
    });
  });

  it('should include logged set data when available', async () => {
    // Setup: Create workout with some logged sets
    const response = await request(app).get('/api/workouts/1');

    const loggedSet = response.body.exercises[0].sets.find(
      (s: WorkoutSet) => s.status === 'logged'
    );
    expect(loggedSet.actualReps).toBe(8);
    expect(loggedSet.actualWeight).toBe(30);
  });

  it('should preserve exercise order from plan', async () => {
    const response = await request(app).get('/api/workouts/1');

    // Exercises should be ordered by their position in the plan
    const exerciseIds = response.body.exercises.map((e: Exercise) => e.exerciseId);
    expect(exerciseIds).toEqual([1, 2, 3]); // In plan order
  });
});
```

**Response Shape**:
```typescript
interface GetWorkoutResponse {
  id: number;
  mesocycleId: number;
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    restTimeSeconds: number;
    sets: Array<{
      id: number;
      setNumber: number;
      targetReps: number;
      targetWeight: number;
      actualReps: number | null;
      actualWeight: number | null;
      status: 'pending' | 'logged' | 'skipped';
      loggedAt: string | null;
    }>;
  }>;
}
```

#### 2. PUT /api/workouts/:id/start

**Purpose**: Mark a workout as in-progress (started).

**Test Cases**:
```typescript
describe('PUT /api/workouts/:id/start', () => {
  it('should return 404 for non-existent workout', async () => {
    const response = await request(app).put('/api/workouts/9999/start');
    expect(response.status).toBe(404);
  });

  it('should mark scheduled workout as in_progress', async () => {
    const response = await request(app).put('/api/workouts/1/start');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('in_progress');
    expect(response.body.startedAt).toBeTruthy();
  });

  it('should return 400 when starting already in-progress workout', async () => {
    await request(app).put('/api/workouts/1/start');
    const response = await request(app).put('/api/workouts/1/start');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Workout is already in progress');
  });

  it('should return 400 when starting completed workout', async () => {
    // Setup: Complete a workout first
    const response = await request(app).put('/api/workouts/1/start');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot start a completed workout');
  });

  it('should return 400 when starting skipped workout', async () => {
    // Setup: Skip a workout first
    const response = await request(app).put('/api/workouts/1/start');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot start a skipped workout');
  });
});
```

#### 3. PUT /api/workouts/:id/complete

**Purpose**: Mark a workout as completed.

**Test Cases**:
```typescript
describe('PUT /api/workouts/:id/complete', () => {
  it('should return 404 for non-existent workout', async () => {
    const response = await request(app).put('/api/workouts/9999/complete');
    expect(response.status).toBe(404);
  });

  it('should complete an in-progress workout', async () => {
    await request(app).put('/api/workouts/1/start');
    const response = await request(app).put('/api/workouts/1/complete');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('completed');
    expect(response.body.completedAt).toBeTruthy();
  });

  it('should complete workout even with pending sets', async () => {
    // Setup: Start workout, log only some sets
    await request(app).put('/api/workouts/1/start');
    await request(app).put('/api/workout-sets/1/log').send({
      actualReps: 8,
      actualWeight: 30
    });
    // Leave other sets as pending

    const response = await request(app).put('/api/workouts/1/complete');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('completed');
  });

  it('should complete workout with all sets logged', async () => {
    // Setup: Log all sets
    const response = await request(app).put('/api/workouts/1/complete');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('completed');
  });

  it('should return 400 when completing scheduled (not started) workout', async () => {
    const response = await request(app).put('/api/workouts/1/complete');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot complete a workout that has not been started');
  });

  it('should return 400 when completing already completed workout', async () => {
    // Complete once
    await request(app).put('/api/workouts/1/start');
    await request(app).put('/api/workouts/1/complete');

    // Try to complete again
    const response = await request(app).put('/api/workouts/1/complete');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Workout is already completed');
  });

  it('should auto-start workout if completing from scheduled state', async () => {
    // Alternative design: auto-start when completing
    // Decide on behavior and test accordingly
  });
});
```

#### 4. PUT /api/workouts/:id/skip

**Purpose**: Skip an entire workout.

**Test Cases**:
```typescript
describe('PUT /api/workouts/:id/skip', () => {
  it('should return 404 for non-existent workout', async () => {
    const response = await request(app).put('/api/workouts/9999/skip');
    expect(response.status).toBe(404);
  });

  it('should skip a scheduled workout', async () => {
    const response = await request(app).put('/api/workouts/1/skip');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('skipped');
  });

  it('should skip an in-progress workout', async () => {
    await request(app).put('/api/workouts/1/start');
    const response = await request(app).put('/api/workouts/1/skip');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('skipped');
  });

  it('should return 400 when skipping completed workout', async () => {
    // Complete the workout first
    await request(app).put('/api/workouts/1/start');
    await request(app).put('/api/workouts/1/complete');

    const response = await request(app).put('/api/workouts/1/skip');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot skip a completed workout');
  });

  it('should return 400 when skipping already skipped workout', async () => {
    await request(app).put('/api/workouts/1/skip');
    const response = await request(app).put('/api/workouts/1/skip');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Workout is already skipped');
  });

  it('should mark all pending sets as skipped when skipping workout', async () => {
    await request(app).put('/api/workouts/1/skip');

    // Verify all sets are skipped
    const workout = await request(app).get('/api/workouts/1');
    const allSetsSkipped = workout.body.exercises.every(
      (e: Exercise) => e.sets.every((s: WorkoutSet) => s.status === 'skipped')
    );
    expect(allSetsSkipped).toBe(true);
  });
});
```

#### 5. PUT /api/workout-sets/:id/log

**Purpose**: Log actual reps and weight for a single set.

**Test Cases**:
```typescript
describe('PUT /api/workout-sets/:id/log', () => {
  it('should return 404 for non-existent set', async () => {
    const response = await request(app)
      .put('/api/workout-sets/9999/log')
      .send({ actualReps: 8, actualWeight: 30 });
    expect(response.status).toBe(404);
  });

  it('should log a pending set with actual values', async () => {
    // Start the workout first
    await request(app).put('/api/workouts/1/start');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 30 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      actualReps: 8,
      actualWeight: 30,
      status: 'logged',
      loggedAt: expect.any(String)
    });
  });

  it('should allow logging set with different values than target', async () => {
    await request(app).put('/api/workouts/1/start');

    // Target is 8 reps @ 30 lbs, log 10 reps @ 35 lbs
    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 10, actualWeight: 35 });

    expect(response.status).toBe(200);
    expect(response.body.actualReps).toBe(10);
    expect(response.body.actualWeight).toBe(35);
  });

  it('should allow re-logging an already logged set (corrections)', async () => {
    await request(app).put('/api/workouts/1/start');

    // First log
    await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 30 });

    // Correction
    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 9, actualWeight: 30 });

    expect(response.status).toBe(200);
    expect(response.body.actualReps).toBe(9);
  });

  it('should return 400 for invalid reps (negative)', async () => {
    await request(app).put('/api/workouts/1/start');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: -1, actualWeight: 30 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Reps must be a positive number');
  });

  it('should return 400 for invalid weight (negative)', async () => {
    await request(app).put('/api/workouts/1/start');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: -5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Weight must be a non-negative number');
  });

  it('should allow zero weight (bodyweight exercises)', async () => {
    await request(app).put('/api/workouts/1/start');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 0 });

    expect(response.status).toBe(200);
    expect(response.body.actualWeight).toBe(0);
  });

  it('should return 400 when logging set for non-started workout', async () => {
    // Don't start the workout
    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 30 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot log sets for a workout that has not been started');
  });

  it('should return 400 when logging set for completed workout', async () => {
    await request(app).put('/api/workouts/1/start');
    await request(app).put('/api/workouts/1/complete');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 30 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot log sets for a completed workout');
  });

  it('should auto-start workout when logging first set', async () => {
    // Design decision: auto-start on first log
    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 30 });

    expect(response.status).toBe(200);

    const workout = await request(app).get('/api/workouts/1');
    expect(workout.body.status).toBe('in_progress');
  });

  it('should return 400 when missing actualReps', async () => {
    await request(app).put('/api/workouts/1/start');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualWeight: 30 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('actualReps is required');
  });

  it('should return 400 when missing actualWeight', async () => {
    await request(app).put('/api/workouts/1/start');

    const response = await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('actualWeight is required');
  });
});
```

#### 6. PUT /api/workout-sets/:id/skip

**Purpose**: Skip a single set.

**Test Cases**:
```typescript
describe('PUT /api/workout-sets/:id/skip', () => {
  it('should return 404 for non-existent set', async () => {
    const response = await request(app).put('/api/workout-sets/9999/skip');
    expect(response.status).toBe(404);
  });

  it('should skip a pending set', async () => {
    await request(app).put('/api/workouts/1/start');

    const response = await request(app).put('/api/workout-sets/1/skip');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('skipped');
  });

  it('should skip a logged set (user changed mind)', async () => {
    await request(app).put('/api/workouts/1/start');
    await request(app)
      .put('/api/workout-sets/1/log')
      .send({ actualReps: 8, actualWeight: 30 });

    const response = await request(app).put('/api/workout-sets/1/skip');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('skipped');
    expect(response.body.actualReps).toBeNull();
    expect(response.body.actualWeight).toBeNull();
  });

  it('should return 400 when skipping set for non-started workout', async () => {
    const response = await request(app).put('/api/workout-sets/1/skip');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot skip sets for a workout that has not been started');
  });

  it('should return 400 when skipping set for completed workout', async () => {
    await request(app).put('/api/workouts/1/start');
    await request(app).put('/api/workouts/1/complete');

    const response = await request(app).put('/api/workout-sets/1/skip');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot skip sets for a completed workout');
  });
});
```

### Service Layer

#### workout.service.ts

```typescript
interface WorkoutService {
  getById(id: number): Promise<WorkoutWithSets | null>;
  getTodaysWorkout(): Promise<WorkoutWithSets | null>;
  start(id: number): Promise<Workout>;
  complete(id: number): Promise<Workout>;
  skip(id: number): Promise<Workout>;
}
```

**Service Tests**:
```typescript
describe('WorkoutService', () => {
  describe('getById', () => {
    it('should return null for non-existent workout');
    it('should return workout with sets grouped by exercise');
    it('should order exercises by plan order');
    it('should order sets by set number within each exercise');
  });

  describe('getTodaysWorkout', () => {
    it('should return null when no workout scheduled for today');
    it('should return the scheduled workout for today');
    it('should return in-progress workout if one exists for today');
    it('should not return completed workout for today');
    it('should not return skipped workout for today');
  });

  describe('start', () => {
    it('should set status to in_progress');
    it('should set startedAt timestamp');
    it('should throw when workout not found');
    it('should throw when workout already started');
    it('should throw when workout completed');
    it('should throw when workout skipped');
  });

  describe('complete', () => {
    it('should set status to completed');
    it('should set completedAt timestamp');
    it('should throw when workout not started');
    it('should throw when workout already completed');
  });

  describe('skip', () => {
    it('should set status to skipped');
    it('should mark all pending sets as skipped');
    it('should preserve logged set data');
    it('should throw when workout completed');
    it('should throw when workout already skipped');
  });
});
```

#### workout-set.service.ts

```typescript
interface WorkoutSetService {
  getById(id: number): Promise<WorkoutSet | null>;
  log(id: number, data: LogSetInput): Promise<WorkoutSet>;
  skip(id: number): Promise<WorkoutSet>;
}

interface LogSetInput {
  actualReps: number;
  actualWeight: number;
}
```

**Service Tests**:
```typescript
describe('WorkoutSetService', () => {
  describe('getById', () => {
    it('should return null for non-existent set');
    it('should return set with all fields');
  });

  describe('log', () => {
    it('should update actualReps and actualWeight');
    it('should set status to logged');
    it('should set loggedAt timestamp');
    it('should auto-start workout if not started');
    it('should throw for completed workout');
    it('should throw for skipped workout');
    it('should throw for negative reps');
    it('should throw for negative weight');
    it('should allow re-logging');
  });

  describe('skip', () => {
    it('should set status to skipped');
    it('should clear actual values if previously logged');
    it('should auto-start workout if not started');
    it('should throw for completed workout');
    it('should throw for skipped workout');
  });
});
```

---

## Frontend Implementation (Today Tab)

### File Structure

```
packages/web/
  src/
    pages/
      TodayPage.tsx
    components/
      workout/
        WorkoutView.tsx
        ExerciseCard.tsx
        SetRow.tsx
        LogSetModal.tsx
        CompleteWorkoutModal.tsx
    hooks/
      useWorkout.ts
      useLocalStorage.ts
    services/
      workout.api.ts
    types/
      workout.types.ts
    __tests__/
      pages/
        TodayPage.test.tsx
      components/
        workout/
          WorkoutView.test.tsx
          ExerciseCard.test.tsx
          SetRow.test.tsx
          LogSetModal.test.tsx
      hooks/
        useWorkout.test.ts
        useLocalStorage.test.ts
```

### Component Specifications

#### TodayPage.tsx

**Responsibilities**:
- Fetch today's workout on mount
- Display "No workout scheduled" when appropriate
- Render WorkoutView when workout exists

**Test Cases**:
```typescript
describe('TodayPage', () => {
  it('should show loading state initially');
  it('should show "No workout scheduled" when no workout for today');
  it('should render WorkoutView when workout exists');
  it('should handle fetch error gracefully');
  it('should refresh workout data on pull-to-refresh (mobile)');
});
```

#### WorkoutView.tsx

**Responsibilities**:
- Display workout header (date, status)
- List all exercises with their sets
- Provide "Start Workout" button if scheduled
- Provide "Complete Workout" button
- Provide "Skip Workout" button
- Sync state to localStorage on every change

**Props**:
```typescript
interface WorkoutViewProps {
  workout: WorkoutWithSets;
  onSetLogged: (setId: number, data: LogSetInput) => void;
  onSetSkipped: (setId: number) => void;
  onWorkoutStarted: () => void;
  onWorkoutCompleted: () => void;
  onWorkoutSkipped: () => void;
}
```

**Test Cases**:
```typescript
describe('WorkoutView', () => {
  it('should display workout date');
  it('should display workout status badge');
  it('should render all exercises');
  it('should show "Start Workout" button when scheduled');
  it('should hide "Start Workout" when in_progress');
  it('should show "Complete Workout" button when in_progress');
  it('should show "Skip Workout" button when scheduled or in_progress');
  it('should disable buttons when completed');
  it('should call onWorkoutStarted when start clicked');
  it('should call onWorkoutCompleted when complete clicked');
  it('should show confirmation dialog before completing with pending sets');
});
```

#### ExerciseCard.tsx

**Responsibilities**:
- Display exercise name
- Display rest time
- Render all sets for the exercise
- Show progress indicator (e.g., "2/3 sets completed")

**Props**:
```typescript
interface ExerciseCardProps {
  exercise: ExerciseWithSets;
  workoutStatus: WorkoutStatus;
  onSetLogged: (setId: number, data: LogSetInput) => void;
  onSetSkipped: (setId: number) => void;
}
```

**Test Cases**:
```typescript
describe('ExerciseCard', () => {
  it('should display exercise name');
  it('should display rest time in human-readable format');
  it('should render all sets');
  it('should show progress count');
  it('should indicate when all sets complete');
});
```

#### SetRow.tsx

**Responsibilities**:
- Display set number, target reps, target weight
- Display actual values when logged
- Provide tap-to-log functionality
- Show skip button
- Visual distinction for logged, pending, and skipped states

**Props**:
```typescript
interface SetRowProps {
  set: WorkoutSet;
  workoutStatus: WorkoutStatus;
  onLog: (data: LogSetInput) => void;
  onSkip: () => void;
}
```

**Test Cases**:
```typescript
describe('SetRow', () => {
  it('should display set number');
  it('should display target reps and weight');
  it('should show "pending" styling for pending sets');
  it('should show "logged" styling with actual values for logged sets');
  it('should show "skipped" styling for skipped sets');
  it('should open LogSetModal when tapped (pending set)');
  it('should allow re-logging when tapped (logged set)');
  it('should show skip button for pending sets');
  it('should show skip button for logged sets');
  it('should disable interactions when workout completed');
  it('should disable interactions when workout skipped');
});
```

#### LogSetModal.tsx

**Responsibilities**:
- Modal dialog for logging set details
- Pre-fill with target values (or actual values if re-logging)
- Number inputs for reps and weight
- Save and Cancel buttons
- Input validation

**Props**:
```typescript
interface LogSetModalProps {
  open: boolean;
  set: WorkoutSet;
  onSave: (data: LogSetInput) => void;
  onClose: () => void;
}
```

**Test Cases**:
```typescript
describe('LogSetModal', () => {
  it('should display set number in title');
  it('should pre-fill reps with target value for new log');
  it('should pre-fill weight with target value for new log');
  it('should pre-fill with actual values when re-logging');
  it('should allow editing reps');
  it('should allow editing weight');
  it('should validate reps is positive');
  it('should validate weight is non-negative');
  it('should call onSave with values when saved');
  it('should call onClose when cancelled');
  it('should close on backdrop click');
  it('should support keyboard navigation (Enter to save)');
});
```

### LocalStorage Sync

#### useLocalStorage.ts Hook

```typescript
const WORKOUT_STORAGE_KEY = 'lifting-app-workout-state';

interface StoredWorkoutState {
  workoutId: number;
  sets: Map<number, { actualReps: number; actualWeight: number; status: SetStatus }>;
  lastUpdated: string;
}

function useLocalStorageWorkout(workoutId: number) {
  // Load from localStorage on mount
  // Save to localStorage on every change
  // Clear localStorage when workout completes
}
```

**Test Cases**:
```typescript
describe('useLocalStorageWorkout', () => {
  it('should return null when no stored state');
  it('should load stored state for matching workout ID');
  it('should ignore stored state for different workout ID');
  it('should save state on every update');
  it('should merge stored state with fresh server data');
  it('should clear storage when workout completes');
  it('should handle corrupted storage data gracefully');
  it('should handle storage quota exceeded');
});
```

#### Recovery Flow

When loading the Today page:
1. Fetch today's workout from API
2. Check localStorage for stored workout state
3. If stored state exists for same workout ID:
   - Merge stored optimistic updates with server state
   - Display merged state to user
   - Sync any unsynced changes to server
4. If stored state is stale/different workout:
   - Clear localStorage
   - Display fresh server state

### useWorkout.ts Hook

**Responsibilities**:
- Fetch workout data
- Manage optimistic updates
- Sync with localStorage
- Handle API calls for logging/skipping

```typescript
interface UseWorkoutReturn {
  workout: WorkoutWithSets | null;
  loading: boolean;
  error: Error | null;
  logSet: (setId: number, data: LogSetInput) => Promise<void>;
  skipSet: (setId: number) => Promise<void>;
  startWorkout: () => Promise<void>;
  completeWorkout: () => Promise<void>;
  skipWorkout: () => Promise<void>;
}

function useWorkout(): UseWorkoutReturn {
  // Implementation with optimistic updates and localStorage sync
}
```

**Test Cases**:
```typescript
describe('useWorkout', () => {
  it('should fetch today\'s workout on mount');
  it('should set loading state during fetch');
  it('should handle fetch errors');

  describe('logSet', () => {
    it('should optimistically update UI');
    it('should save to localStorage immediately');
    it('should call API');
    it('should revert on API error');
    it('should auto-start workout if needed');
  });

  describe('skipSet', () => {
    it('should optimistically update UI');
    it('should save to localStorage immediately');
    it('should call API');
    it('should revert on API error');
  });

  describe('startWorkout', () => {
    it('should call API');
    it('should update local state');
  });

  describe('completeWorkout', () => {
    it('should call API');
    it('should clear localStorage');
    it('should update local state');
  });

  describe('skipWorkout', () => {
    it('should call API');
    it('should clear localStorage');
    it('should update local state');
  });
});
```

---

## E2E Tests

### File: e2e/workout-tracking.spec.ts

```typescript
import { test, expect } from '@playwright/test';
import { seedWorkoutInProgress, seedScheduledWorkout } from './fixtures';

test.describe('Workout Tracking', () => {
  test.describe('Logging a set', () => {
    test.beforeEach(async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');
    });

    test('should log a set with target values', async ({ page }) => {
      // Start workout
      await page.click('[data-testid="start-workout"]');

      // Click first pending set
      await page.click('[data-testid="set-row-1"]');

      // Modal should open with pre-filled values
      const modal = page.locator('[data-testid="log-set-modal"]');
      await expect(modal).toBeVisible();

      const repsInput = modal.locator('[data-testid="reps-input"]');
      const weightInput = modal.locator('[data-testid="weight-input"]');

      // Should be pre-filled with targets
      await expect(repsInput).toHaveValue('8');
      await expect(weightInput).toHaveValue('30');

      // Save without changes
      await modal.locator('[data-testid="save-button"]').click();

      // Set should now show as logged
      const setRow = page.locator('[data-testid="set-row-1"]');
      await expect(setRow).toHaveClass(/logged/);
      await expect(setRow.locator('[data-testid="actual-reps"]')).toHaveText('8');
      await expect(setRow.locator('[data-testid="actual-weight"]')).toHaveText('30');
    });

    test('should log a set with custom values', async ({ page }) => {
      await page.click('[data-testid="start-workout"]');
      await page.click('[data-testid="set-row-1"]');

      const modal = page.locator('[data-testid="log-set-modal"]');

      // Change values
      await modal.locator('[data-testid="reps-input"]').fill('10');
      await modal.locator('[data-testid="weight-input"]').fill('35');
      await modal.locator('[data-testid="save-button"]').click();

      // Verify custom values displayed
      const setRow = page.locator('[data-testid="set-row-1"]');
      await expect(setRow.locator('[data-testid="actual-reps"]')).toHaveText('10');
      await expect(setRow.locator('[data-testid="actual-weight"]')).toHaveText('35');
    });
  });

  test.describe('Skipping a set', () => {
    test.beforeEach(async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');
      await page.click('[data-testid="start-workout"]');
    });

    test('should skip a pending set', async ({ page }) => {
      const setRow = page.locator('[data-testid="set-row-1"]');
      await setRow.locator('[data-testid="skip-set-button"]').click();

      await expect(setRow).toHaveClass(/skipped/);
    });

    test('should skip a logged set', async ({ page }) => {
      // First log the set
      await page.click('[data-testid="set-row-1"]');
      await page.locator('[data-testid="save-button"]').click();

      // Then skip it
      const setRow = page.locator('[data-testid="set-row-1"]');
      await setRow.locator('[data-testid="skip-set-button"]').click();

      await expect(setRow).toHaveClass(/skipped/);
    });
  });

  test.describe('Changing weight and reps', () => {
    test.beforeEach(async ({ page }) => {
      await seedWorkoutInProgress();
      await page.goto('/today');
    });

    test('should allow re-logging a set with different values', async ({ page }) => {
      // Set is already logged with 8 reps @ 30 lbs
      const setRow = page.locator('[data-testid="set-row-1"]');
      await expect(setRow.locator('[data-testid="actual-reps"]')).toHaveText('8');

      // Click to re-log
      await setRow.click();

      const modal = page.locator('[data-testid="log-set-modal"]');

      // Should show current logged values
      await expect(modal.locator('[data-testid="reps-input"]')).toHaveValue('8');
      await expect(modal.locator('[data-testid="weight-input"]')).toHaveValue('30');

      // Change values
      await modal.locator('[data-testid="reps-input"]').fill('12');
      await modal.locator('[data-testid="weight-input"]')).fill('25');
      await modal.locator('[data-testid="save-button"]').click();

      // Verify updated values
      await expect(setRow.locator('[data-testid="actual-reps"]')).toHaveText('12');
      await expect(setRow.locator('[data-testid="actual-weight"]')).toHaveText('25');
    });
  });

  test.describe('Complete workout flow', () => {
    test('should complete workout with all sets logged', async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');

      // Start workout
      await page.click('[data-testid="start-workout"]');

      // Log all sets (assume 3 sets)
      for (let i = 1; i <= 3; i++) {
        await page.click(`[data-testid="set-row-${i}"]`);
        await page.locator('[data-testid="save-button"]').click();
      }

      // Complete workout
      await page.click('[data-testid="complete-workout"]');

      // Should show completion state
      await expect(page.locator('[data-testid="workout-status"]')).toHaveText('Completed');

      // All interactions should be disabled
      await expect(page.locator('[data-testid="set-row-1"]')).toBeDisabled();
    });

    test('should complete workout with pending sets (confirmation)', async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');

      await page.click('[data-testid="start-workout"]');

      // Log only first set
      await page.click('[data-testid="set-row-1"]');
      await page.locator('[data-testid="save-button"]').click();

      // Try to complete
      await page.click('[data-testid="complete-workout"]');

      // Confirmation dialog should appear
      const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText('2 sets not logged');

      // Confirm
      await confirmDialog.locator('[data-testid="confirm-button"]').click();

      // Should be completed
      await expect(page.locator('[data-testid="workout-status"]')).toHaveText('Completed');
    });

    test('should skip entire workout', async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');

      await page.click('[data-testid="skip-workout"]');

      // Confirmation dialog
      const confirmDialog = page.locator('[data-testid="confirm-dialog"]');
      await expect(confirmDialog).toBeVisible();
      await confirmDialog.locator('[data-testid="confirm-button"]').click();

      // Should show skipped state
      await expect(page.locator('[data-testid="workout-status"]')).toHaveText('Skipped');
    });

    test('should persist state across page refresh', async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');

      await page.click('[data-testid="start-workout"]');

      // Log a set
      await page.click('[data-testid="set-row-1"]');
      await page.locator('[data-testid="save-button"]').click();

      // Refresh page
      await page.reload();

      // State should be preserved
      await expect(page.locator('[data-testid="workout-status"]')).toHaveText('In Progress');
      await expect(page.locator('[data-testid="set-row-1"]')).toHaveClass(/logged/);
    });
  });

  test.describe('No workout scheduled', () => {
    test('should show empty state when no workout today', async ({ page }) => {
      // No seeding - no workout for today
      await page.goto('/today');

      await expect(page.locator('[data-testid="no-workout-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-workout-message"]')).toHaveText(
        'No workout scheduled for today'
      );
    });
  });

  test.describe('Out-of-order set logging', () => {
    test('should allow logging sets in any order', async ({ page }) => {
      await seedScheduledWorkout();
      await page.goto('/today');
      await page.click('[data-testid="start-workout"]');

      // Log set 3 first
      await page.click('[data-testid="set-row-3"]');
      await page.locator('[data-testid="save-button"]').click();

      // Then log set 1
      await page.click('[data-testid="set-row-1"]');
      await page.locator('[data-testid="save-button"]').click();

      // Both should be logged
      await expect(page.locator('[data-testid="set-row-1"]')).toHaveClass(/logged/);
      await expect(page.locator('[data-testid="set-row-3"]')).toHaveClass(/logged/);

      // Set 2 should still be pending
      await expect(page.locator('[data-testid="set-row-2"]')).toHaveClass(/pending/);
    });

    test('should allow logging exercises in any order', async ({ page }) => {
      await seedScheduledWorkout(); // Assume multiple exercises
      await page.goto('/today');
      await page.click('[data-testid="start-workout"]');

      // Log set from second exercise first
      await page.click('[data-testid="exercise-2-set-1"]');
      await page.locator('[data-testid="save-button"]').click();

      // Then log set from first exercise
      await page.click('[data-testid="exercise-1-set-1"]');
      await page.locator('[data-testid="save-button"]').click();

      // Both should be logged
      await expect(page.locator('[data-testid="exercise-2-set-1"]')).toHaveClass(/logged/);
      await expect(page.locator('[data-testid="exercise-1-set-1"]')).toHaveClass(/logged/);
    });
  });
});
```

### E2E Test Fixtures

```typescript
// e2e/fixtures/workout.ts

export async function seedScheduledWorkout() {
  // Insert test data into database
  // - Create a mesocycle
  // - Create a plan with exercises
  // - Create a workout for today with status 'scheduled'
  // - Create workout_sets for each exercise
}

export async function seedWorkoutInProgress() {
  // Same as above but:
  // - Workout status is 'in_progress'
  // - Some sets have actual values logged
}

export async function clearWorkouts() {
  // Clean up test data
}
```

---

## Implementation Order

### Week 1: Backend (TDD)

1. **Day 1-2: Database & Types**
   - Add/verify database migrations for workout status fields
   - Define TypeScript types for all entities
   - Write type tests (compile-time checks)

2. **Day 2-3: WorkoutSet Service & Routes**
   - Write tests for workout-set.service.ts
   - Implement workout-set.service.ts
   - Write tests for PUT /api/workout-sets/:id/log
   - Write tests for PUT /api/workout-sets/:id/skip
   - Implement routes

3. **Day 4-5: Workout Service & Routes**
   - Write tests for workout.service.ts
   - Implement workout.service.ts
   - Write tests for GET /api/workouts/:id
   - Write tests for PUT /api/workouts/:id/start
   - Write tests for PUT /api/workouts/:id/complete
   - Write tests for PUT /api/workouts/:id/skip
   - Implement routes

### Week 2: Frontend (TDD)

4. **Day 6-7: Hooks & API Layer**
   - Write tests for useLocalStorage.ts
   - Implement useLocalStorage.ts
   - Write tests for workout.api.ts
   - Implement workout.api.ts
   - Write tests for useWorkout.ts
   - Implement useWorkout.ts

5. **Day 8-9: Components**
   - Write tests for LogSetModal.tsx
   - Implement LogSetModal.tsx
   - Write tests for SetRow.tsx
   - Implement SetRow.tsx
   - Write tests for ExerciseCard.tsx
   - Implement ExerciseCard.tsx
   - Write tests for WorkoutView.tsx
   - Implement WorkoutView.tsx

6. **Day 10: Today Page**
   - Write tests for TodayPage.tsx
   - Implement TodayPage.tsx
   - Integration testing

### Week 3: E2E & Polish

7. **Day 11-12: E2E Tests**
   - Set up E2E test fixtures
   - Implement logging set E2E tests
   - Implement skipping set E2E tests
   - Implement changing values E2E tests
   - Implement complete flow E2E tests

8. **Day 13-14: Polish & Edge Cases**
   - Error handling improvements
   - Loading states
   - Empty states
   - Accessibility review
   - Mobile responsiveness
   - Performance optimization

---

## Success Criteria

### Functionality
- [ ] User can view today's scheduled workout on the Today tab
- [ ] User can start a workout (changes status to in_progress)
- [ ] User can log any set in any order with actual reps and weight
- [ ] User can skip any individual set
- [ ] User can re-log a set with different values
- [ ] User can complete a workout (even with pending sets)
- [ ] User can skip an entire workout
- [ ] Workout state survives page refresh via localStorage
- [ ] Completed workout data persists to database
- [ ] "No workout scheduled" message shows when appropriate

### Testing
- [ ] 100% unit test coverage for backend services
- [ ] 100% unit test coverage for backend routes
- [ ] 100% unit test coverage for frontend hooks
- [ ] 100% unit test coverage for frontend components
- [ ] All E2E tests passing:
  - [ ] Logging a set
  - [ ] Skipping a set
  - [ ] Changing weight and reps
  - [ ] Complete workout flow
  - [ ] Out-of-order logging
  - [ ] Page refresh persistence

### Code Quality
- [ ] No TypeScript `any` types
- [ ] All linting rules passing
- [ ] Code review completed
- [ ] No console errors or warnings

### Performance
- [ ] Today page loads in under 1 second
- [ ] Set logging feels instant (optimistic updates)
- [ ] localStorage operations do not block UI

---

## Commit Message

```
feat(workout-tracking): implement core workout tracking with TDD

Add complete workout tracking functionality for the Today tab:

Backend:
- GET /api/workouts/:id - fetch workout with all sets grouped by exercise
- PUT /api/workouts/:id/start - mark workout as in_progress
- PUT /api/workouts/:id/complete - mark workout as completed
- PUT /api/workouts/:id/skip - skip entire workout
- PUT /api/workout-sets/:id/log - log actual reps and weight for a set
- PUT /api/workout-sets/:id/skip - skip individual set

Frontend:
- TodayPage showing current workout or "No workout scheduled"
- WorkoutView with exercise cards and set rows
- LogSetModal for entering/editing set data
- Full localStorage sync for in-progress workout state
- Optimistic updates for responsive UX

Features:
- Log sets in any order (equipment availability)
- Skip individual sets or entire workouts
- Complete workout even with pending sets
- Re-log sets to correct mistakes
- State persists across page refresh

Testing:
- 100% unit test coverage (services, routes, hooks, components)
- E2E tests for all user flows
- Test fixtures for seeding workout state

Closes #XX
```

---

## Dependencies

This phase depends on:
- Phase 1: Project setup (monorepo, TypeScript, linting)
- Phase 2: Database setup (SQLite, migrations)
- Phase 3: Exercise library (exercises table)
- Phase 4: Plan creation (plans, plan_days, plan_exercises tables)
- Phase 5: Mesocycle generation (mesocycles, workouts, workout_sets tables)

This phase enables:
- Phase 7: Rest timer
- Phase 8: Progressive overload automation
- Phase 9: Workout history view

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| localStorage quota exceeded | Implement cleanup strategy; only store essential data |
| Offline state conflicts | Clear localStorage on workout completion; server is source of truth |
| Race conditions in optimistic updates | Use React Query or similar for cache management |
| Large workout data | Paginate or lazy-load if >50 sets (unlikely) |
| Mobile keyboard UX | Use `inputmode="numeric"` for number inputs |

---

## Notes for Implementation

1. **Auto-start decision**: The plan allows for either explicit start button or auto-start on first set log. Recommend auto-start for simpler UX - document the final decision.

2. **Confirmation dialogs**: Use Radix Dialog component for modals. Keep confirmation text clear and actionable.

3. **Data-testid attributes**: All interactive elements must have `data-testid` for E2E tests. Follow naming convention: `{component}-{element}-{index}`.

4. **TypeScript strictness**: Ensure all API responses have proper types. Use Zod for runtime validation at API boundaries.

5. **Error boundaries**: Wrap WorkoutView in error boundary to prevent crashes from affecting entire app.
