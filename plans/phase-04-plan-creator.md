# Phase 4: Plan Creator Implementation Plan

## Overview

This phase implements the Plan Creator feature, which allows users to create, view, edit, and delete workout plans. Each plan consists of a name, duration in weeks, selected workout days, and exercises assigned to each day with configurable parameters.

**Approach**: Test-Driven Development (TDD) - write tests first, then implement to make tests pass.

---

## Prerequisites

Before starting Phase 4, ensure the following are complete:

- Phase 1: Project setup (monorepo structure, TypeScript, linting, testing infrastructure)
- Phase 2: Database setup (SQLite, migrations, models for exercises)
- Phase 3: Exercise library (GET /api/exercises endpoint, seeded exercise data)

---

## Database Schema

### Tables Required

```sql
-- plans table
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 6,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- plan_days table (which days of week are active in a plan)
CREATE TABLE plan_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  UNIQUE(plan_id, day_of_week)
);

-- plan_day_exercises table (exercises assigned to each plan day)
CREATE TABLE plan_day_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 2,
  reps INTEGER NOT NULL DEFAULT 8,
  weight INTEGER NOT NULL DEFAULT 30,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL DEFAULT 0,
  weight_increment INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Index for performance
CREATE INDEX idx_plan_days_plan_id ON plan_days(plan_id);
CREATE INDEX idx_plan_day_exercises_plan_day_id ON plan_day_exercises(plan_day_id);
```

---

## Part 1: Backend Implementation (TDD)

### 1.1 Type Definitions

**File**: `packages/server/src/types/plan.ts`

```typescript
export interface Plan {
  id: number;
  name: string;
  durationWeeks: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDay {
  id: number;
  planId: number;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  sortOrder: number;
  createdAt: string;
}

export interface PlanDayExercise {
  id: number;
  planDayId: number;
  exerciseId: number;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  sortOrder: number;
  weightIncrement: number;
  createdAt: string;
}

// API request/response types
export interface CreatePlanRequest {
  name: string;
  durationWeeks?: number;
  days: CreatePlanDayRequest[];
}

export interface CreatePlanDayRequest {
  dayOfWeek: number;
  exercises: CreatePlanDayExerciseRequest[];
}

export interface CreatePlanDayExerciseRequest {
  exerciseId: number;
  sets?: number;
  reps?: number;
  weight?: number;
  restSeconds?: number;
  weightIncrement?: number;
}

export interface UpdatePlanRequest {
  name?: string;
  durationWeeks?: number;
  days?: UpdatePlanDayRequest[];
}

export interface UpdatePlanDayRequest {
  id?: number; // existing day to update, omit for new day
  dayOfWeek: number;
  exercises: UpdatePlanDayExerciseRequest[];
}

export interface UpdatePlanDayExerciseRequest {
  id?: number; // existing exercise to update, omit for new
  exerciseId: number;
  sets?: number;
  reps?: number;
  weight?: number;
  restSeconds?: number;
  weightIncrement?: number;
}

// Full plan with nested relations for GET responses
export interface PlanWithDays extends Plan {
  days: PlanDayWithExercises[];
}

export interface PlanDayWithExercises extends PlanDay {
  exercises: PlanDayExerciseWithDetails[];
}

export interface PlanDayExerciseWithDetails extends PlanDayExercise {
  exercise: {
    id: number;
    name: string;
  };
}
```

### 1.2 Test Files Structure

```
packages/server/src/
  routes/
    plans.ts
    plans.test.ts
  services/
    planService.ts
    planService.test.ts
  repositories/
    planRepository.ts
    planRepository.test.ts
```

### 1.3 Repository Layer Tests & Implementation

**File**: `packages/server/src/repositories/planRepository.test.ts`

Write tests for:

1. `findAll()` - returns empty array when no plans exist
2. `findAll()` - returns all plans ordered by createdAt desc
3. `findById(id)` - returns null when plan doesn't exist
4. `findById(id)` - returns plan with days and exercises when exists
5. `create(data)` - creates plan with default durationWeeks (6)
6. `create(data)` - creates plan with custom durationWeeks
7. `create(data)` - creates plan with days and exercises
8. `create(data)` - applies default values for exercise config (sets=2, reps=8, weight=30, rest=60)
9. `update(id, data)` - updates plan name
10. `update(id, data)` - updates plan durationWeeks
11. `update(id, data)` - adds new days to existing plan
12. `update(id, data)` - removes days from existing plan
13. `update(id, data)` - updates exercises on existing days
14. `update(id, data)` - returns null for non-existent plan
15. `delete(id)` - deletes plan and cascades to days and exercises
16. `delete(id)` - returns false for non-existent plan
17. `hasActiveMesocycle(id)` - returns false when no mesocycles exist
18. `hasActiveMesocycle(id)` - returns true when active mesocycle exists

**File**: `packages/server/src/repositories/planRepository.ts`

Implement:

```typescript
export class PlanRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Plan[]>;
  async findById(id: number): Promise<PlanWithDays | null>;
  async create(data: CreatePlanRequest): Promise<PlanWithDays>;
  async update(
    id: number,
    data: UpdatePlanRequest
  ): Promise<PlanWithDays | null>;
  async delete(id: number): Promise<boolean>;
  async hasActiveMesocycle(planId: number): Promise<boolean>;
}
```

### 1.4 Service Layer Tests & Implementation

**File**: `packages/server/src/services/planService.test.ts`

Write tests for:

1. `listPlans()` - returns all plans from repository
2. `getPlan(id)` - returns plan when found
3. `getPlan(id)` - throws NotFoundError when plan doesn't exist
4. `createPlan(data)` - validates name is not empty
5. `createPlan(data)` - validates durationWeeks is between 1 and 52
6. `createPlan(data)` - validates dayOfWeek values are 0-6
7. `createPlan(data)` - validates no duplicate days
8. `createPlan(data)` - validates exerciseId exists
9. `createPlan(data)` - validates sets is 1-10
10. `createPlan(data)` - validates reps is 1-20
11. `createPlan(data)` - validates weight is 5-300 and divisible by 5
12. `createPlan(data)` - validates restSeconds is 30-300 and divisible by 30
13. `createPlan(data)` - creates plan through repository on valid data
14. `updatePlan(id, data)` - validates all fields same as create
15. `updatePlan(id, data)` - throws NotFoundError when plan doesn't exist
16. `updatePlan(id, data)` - updates plan through repository on valid data
17. `deletePlan(id)` - throws NotFoundError when plan doesn't exist
18. `deletePlan(id)` - throws ConflictError when plan has active mesocycle
19. `deletePlan(id)` - deletes plan through repository when allowed

**File**: `packages/server/src/services/planService.ts`

Implement:

```typescript
export class PlanService {
  constructor(
    private planRepository: PlanRepository,
    private exerciseRepository: ExerciseRepository
  ) {}

  async listPlans(): Promise<Plan[]>;
  async getPlan(id: number): Promise<PlanWithDays>;
  async createPlan(data: CreatePlanRequest): Promise<PlanWithDays>;
  async updatePlan(id: number, data: UpdatePlanRequest): Promise<PlanWithDays>;
  async deletePlan(id: number): Promise<void>;
}
```

### 1.5 Route Layer Tests & Implementation

**File**: `packages/server/src/routes/plans.test.ts`

Write integration tests for:

#### GET /api/plans

1. Returns 200 with empty array when no plans
2. Returns 200 with list of plans (name, durationWeeks, id, timestamps)
3. Plans are ordered by createdAt descending

#### GET /api/plans/:id

1. Returns 200 with full plan including days and exercises
2. Returns 404 when plan doesn't exist
3. Exercises include exercise name from exercises table

#### POST /api/plans

1. Returns 201 with created plan on valid data
2. Returns 400 when name is empty
3. Returns 400 when name is missing
4. Returns 400 when durationWeeks is invalid
5. Returns 400 when dayOfWeek is invalid (not 0-6)
6. Returns 400 when duplicate days provided
7. Returns 400 when exerciseId doesn't exist
8. Returns 400 when sets is out of range
9. Returns 400 when reps is out of range
10. Returns 400 when weight is out of range or not divisible by 5
11. Returns 400 when restSeconds is out of range or not divisible by 30
12. Applies default values when optional fields omitted
13. Creates plan with multiple days and exercises

#### PUT /api/plans/:id

1. Returns 200 with updated plan on valid data
2. Returns 404 when plan doesn't exist
3. Returns 400 on validation errors (same as POST)
4. Partial update - only updates provided fields
5. Can add/remove/modify days and exercises

#### DELETE /api/plans/:id

1. Returns 204 on successful deletion
2. Returns 404 when plan doesn't exist
3. Returns 409 when plan has active mesocycle

**File**: `packages/server/src/routes/plans.ts`

Implement Express router:

```typescript
import { Router } from 'express';
import { PlanService } from '../services/planService';

export function createPlanRouter(planService: PlanService): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    /* ... */
  });
  router.get('/:id', async (req, res, next) => {
    /* ... */
  });
  router.post('/', async (req, res, next) => {
    /* ... */
  });
  router.put('/:id', async (req, res, next) => {
    /* ... */
  });
  router.delete('/:id', async (req, res, next) => {
    /* ... */
  });

  return router;
}
```

### 1.6 Validation Schema (Zod)

**File**: `packages/server/src/validation/planSchemas.ts`

```typescript
import { z } from 'zod';

const exerciseConfigSchema = z.object({
  exerciseId: z.number().int().positive(),
  sets: z.number().int().min(1).max(10).default(2),
  reps: z.number().int().min(1).max(20).default(8),
  weight: z
    .number()
    .int()
    .min(5)
    .max(300)
    .refine((val) => val % 5 === 0, {
      message: 'Weight must be divisible by 5',
    })
    .default(30),
  restSeconds: z
    .number()
    .int()
    .min(30)
    .max(300)
    .refine((val) => val % 30 === 0, {
      message: 'Rest time must be divisible by 30',
    })
    .default(60),
  weightIncrement: z
    .number()
    .int()
    .min(5)
    .max(20)
    .refine((val) => val % 5 === 0, {
      message: 'Weight increment must be divisible by 5',
    })
    .default(5),
});

const planDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  exercises: z.array(exerciseConfigSchema).min(0),
});

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  durationWeeks: z.number().int().min(1).max(52).default(6),
  days: z.array(planDaySchema).refine(
    (days) => {
      const dayNumbers = days.map((d) => d.dayOfWeek);
      return new Set(dayNumbers).size === dayNumbers.length;
    },
    { message: 'Duplicate days are not allowed' }
  ),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  days: z
    .array(
      planDaySchema.extend({
        id: z.number().int().positive().optional(),
      })
    )
    .refine(
      (days) => {
        const dayNumbers = days.map((d) => d.dayOfWeek);
        return new Set(dayNumbers).size === dayNumbers.length;
      },
      { message: 'Duplicate days are not allowed' }
    )
    .optional(),
});
```

---

## Part 2: Frontend Implementation

### 2.1 Type Definitions

**File**: `packages/client/src/types/plan.ts`

Mirror the server types plus add UI-specific types:

```typescript
// Re-export or duplicate server types for API responses

export interface PlanFormState {
  name: string;
  durationWeeks: number;
  days: PlanDayFormState[];
}

export interface PlanDayFormState {
  dayOfWeek: number;
  isSelected: boolean;
  exercises: PlanExerciseFormState[];
}

export interface PlanExerciseFormState {
  tempId: string; // for React key before saved
  exerciseId: number | null;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  weightIncrement: number;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DEFAULT_EXERCISE_CONFIG = {
  sets: 2,
  reps: 8,
  weight: 30,
  restSeconds: 60,
  weightIncrement: 5,
} as const;
```

### 2.2 API Client Functions

**File**: `packages/client/src/api/plans.ts`

```typescript
import { api } from './client';
import type {
  Plan,
  PlanWithDays,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '../types/plan';

export async function fetchPlans(): Promise<Plan[]> {
  const response = await api.get('/plans');
  return response.data;
}

export async function fetchPlan(id: number): Promise<PlanWithDays> {
  const response = await api.get(`/plans/${id}`);
  return response.data;
}

export async function createPlan(
  data: CreatePlanRequest
): Promise<PlanWithDays> {
  const response = await api.post('/plans', data);
  return response.data;
}

export async function updatePlan(
  id: number,
  data: UpdatePlanRequest
): Promise<PlanWithDays> {
  const response = await api.put(`/plans/${id}`, data);
  return response.data;
}

export async function deletePlan(id: number): Promise<void> {
  await api.delete(`/plans/${id}`);
}
```

### 2.3 React Query Hooks

**File**: `packages/client/src/hooks/usePlans.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as plansApi from '../api/plans';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.fetchPlans,
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => plansApi.fetchPlan(id),
    enabled: id > 0,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanRequest }) =>
      plansApi.updatePlan(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', id] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
```

### 2.4 Component Structure

```
packages/client/src/
  pages/
    PlansPage.tsx           # Plan list view
    PlanDetailPage.tsx      # View/edit existing plan
    CreatePlanPage.tsx      # Create new plan wizard
  components/
    plans/
      PlanList.tsx          # List of plan cards
      PlanCard.tsx          # Single plan summary card
      PlanForm.tsx          # Shared form for create/edit
      DaySelector.tsx       # Checkboxes for Sun-Sat
      DayExerciseList.tsx   # Exercises for a single day
      ExerciseConfigRow.tsx # Single exercise with config
      DeletePlanDialog.tsx  # Confirmation dialog
```

### 2.5 Component Specifications

#### PlanList Component

**File**: `packages/client/src/components/plans/PlanList.tsx`

- Displays grid/list of PlanCard components
- Shows loading skeleton while fetching
- Shows empty state with CTA to create first plan
- Links to plan detail page on card click

#### PlanCard Component

**File**: `packages/client/src/components/plans/PlanCard.tsx`

- Shows plan name, duration weeks, number of days, total exercises
- Shows created date
- Click navigates to detail page
- Has overflow menu with Edit and Delete options

#### DaySelector Component

**File**: `packages/client/src/components/plans/DaySelector.tsx`

```typescript
interface DaySelectorProps {
  selectedDays: number[]; // array of dayOfWeek values
  onChange: (days: number[]) => void;
  disabled?: boolean;
}
```

- 7 checkboxes in a row (Sun-Sat)
- Each checkbox uses Radix UI Checkbox
- Styled with day abbreviations (S, M, T, W, T, F, S)
- Full day name shown on hover/focus

#### DayExerciseList Component

**File**: `packages/client/src/components/plans/DayExerciseList.tsx`

```typescript
interface DayExerciseListProps {
  dayOfWeek: number;
  exercises: PlanExerciseFormState[];
  availableExercises: Exercise[];
  onChange: (exercises: PlanExerciseFormState[]) => void;
  disabled?: boolean;
}
```

- Shows day name as header
- Lists ExerciseConfigRow for each exercise
- "Add Exercise" button at bottom
- Drag handle for reordering (future enhancement, not in MVP)

#### ExerciseConfigRow Component

**File**: `packages/client/src/components/plans/ExerciseConfigRow.tsx`

```typescript
interface ExerciseConfigRowProps {
  exercise: PlanExerciseFormState;
  availableExercises: Exercise[];
  onChange: (exercise: PlanExerciseFormState) => void;
  onRemove: () => void;
  disabled?: boolean;
}
```

- Exercise dropdown (Radix Select)
- Sets dropdown: 1-10, default 2
- Reps dropdown: 1-20, default 8
- Weight dropdown: 5-300 in 5lb steps, default 30
- Rest time dropdown: 30-300 seconds in 30s steps, default 60
- Remove button (X icon)

#### Radix UI Select Options

```typescript
// Sets options
const SETS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i === 0 ? 'set' : 'sets'}`,
}));

// Reps options
const REPS_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i === 0 ? 'rep' : 'reps'}`,
}));

// Weight options (5-300 in 5lb increments)
const WEIGHT_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String((i + 1) * 5),
  label: `${(i + 1) * 5} lbs`,
}));

// Rest time options (30-300 in 30s increments)
const REST_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String((i + 1) * 30),
  label: `${(i + 1) * 30}s`,
}));
```

#### PlanForm Component

**File**: `packages/client/src/components/plans/PlanForm.tsx`

```typescript
interface PlanFormProps {
  initialData?: PlanWithDays;
  onSubmit: (data: CreatePlanRequest | UpdatePlanRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}
```

- Step 1: Name input + duration weeks dropdown
- Step 2: DaySelector for choosing workout days
- Step 3: For each selected day, DayExerciseList
- Navigation: Back/Next buttons, step indicator
- Submit button on final step
- Cancel button throughout

#### DeletePlanDialog Component

**File**: `packages/client/src/components/plans/DeletePlanDialog.tsx`

```typescript
interface DeletePlanDialogProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  hasActiveMesocycle?: boolean;
}
```

- Uses Radix Dialog
- Warning message about deletion
- If hasActiveMesocycle, show error and disable confirm
- Cancel and Delete buttons

### 2.6 Page Components

#### PlansPage

**File**: `packages/client/src/pages/PlansPage.tsx`

```typescript
export function PlansPage() {
  const { data: plans, isLoading, error } = usePlans();
  const navigate = useNavigate();

  return (
    <div className="plans-page">
      <header>
        <h1>My Plans</h1>
        <Button onClick={() => navigate('/plans/new')}>
          Create Plan
        </Button>
      </header>

      {isLoading && <PlanListSkeleton />}
      {error && <ErrorMessage error={error} />}
      {plans && <PlanList plans={plans} />}
    </div>
  );
}
```

#### CreatePlanPage

**File**: `packages/client/src/pages/CreatePlanPage.tsx`

```typescript
export function CreatePlanPage() {
  const navigate = useNavigate();
  const createPlan = useCreatePlan();
  const { data: exercises } = useExercises();

  const handleSubmit = async (data: CreatePlanRequest) => {
    const plan = await createPlan.mutateAsync(data);
    navigate(`/plans/${plan.id}`);
  };

  return (
    <div className="create-plan-page">
      <h1>Create New Plan</h1>
      <PlanForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/plans')}
        isSubmitting={createPlan.isPending}
        availableExercises={exercises ?? []}
      />
    </div>
  );
}
```

#### PlanDetailPage

**File**: `packages/client/src/pages/PlanDetailPage.tsx`

```typescript
export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlan(Number(id));
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // View mode: display plan details
  // Edit mode: show PlanForm with initial data
  // Delete dialog for confirmation
}
```

### 2.7 Routing

Add to router configuration:

```typescript
{
  path: '/plans',
  element: <PlansPage />,
},
{
  path: '/plans/new',
  element: <CreatePlanPage />,
},
{
  path: '/plans/:id',
  element: <PlanDetailPage />,
},
```

### 2.8 Frontend Unit Tests

**Test files to create**:

- `packages/client/src/components/plans/DaySelector.test.tsx`
- `packages/client/src/components/plans/ExerciseConfigRow.test.tsx`
- `packages/client/src/components/plans/PlanForm.test.tsx`
- `packages/client/src/hooks/usePlans.test.ts`

**DaySelector tests**:

1. Renders all 7 days
2. Shows correct days as checked based on selectedDays prop
3. Calls onChange with updated array when checkbox toggled
4. Respects disabled prop

**ExerciseConfigRow tests**:

1. Renders exercise dropdown with available exercises
2. Renders sets dropdown with correct default
3. Renders reps dropdown with correct default
4. Renders weight dropdown with correct default
5. Renders rest dropdown with correct default
6. Calls onChange when any field changes
7. Calls onRemove when remove button clicked

**PlanForm tests**:

1. Shows step 1 (name/duration) initially
2. Validates name is not empty before proceeding
3. Shows step 2 (day selection) after step 1
4. Shows step 3 (exercises) only for selected days
5. Can navigate back and forth between steps
6. Calls onSubmit with correct data structure
7. Calls onCancel when cancel clicked
8. Shows loading state when isSubmitting

---

## Part 3: E2E Tests

### 3.1 Test Setup

**File**: `packages/e2e/tests/plans.spec.ts`

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { seedDatabase, clearDatabase } from '../helpers/database';

describe('Plan Creator', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedDatabase(); // seeds exercises
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });
});
```

### 3.2 E2E Test Cases

#### Test 1: Create a new plan with multiple days and exercises

```typescript
test('should create a new plan with multiple days and exercises', async () => {
  // Navigate to plans page
  await page.goto('http://localhost:3000/plans');

  // Click create plan button
  await page.click('[data-testid="create-plan-button"]');

  // Step 1: Enter plan name and duration
  await page.fill('[data-testid="plan-name-input"]', 'Push Pull Legs');
  await page.click('[data-testid="duration-select"]');
  await page.click('[data-testid="duration-option-8"]'); // 8 weeks
  await page.click('[data-testid="next-button"]');

  // Step 2: Select workout days (Mon, Wed, Fri)
  await page.click('[data-testid="day-checkbox-1"]'); // Monday
  await page.click('[data-testid="day-checkbox-3"]'); // Wednesday
  await page.click('[data-testid="day-checkbox-5"]'); // Friday
  await page.click('[data-testid="next-button"]');

  // Step 3: Add exercises to Monday
  await page.click('[data-testid="add-exercise-day-1"]');
  await page.click('[data-testid="exercise-select-0"]');
  await page.click('[data-testid="exercise-option-1"]'); // First exercise
  await page.click('[data-testid="sets-select-0"]');
  await page.click('[data-testid="sets-option-3"]'); // 3 sets

  // Add another exercise to Monday
  await page.click('[data-testid="add-exercise-day-1"]');
  await page.click('[data-testid="exercise-select-1"]');
  await page.click('[data-testid="exercise-option-2"]'); // Second exercise

  // Add exercise to Wednesday
  await page.click('[data-testid="day-tab-3"]');
  await page.click('[data-testid="add-exercise-day-3"]');
  await page.click('[data-testid="exercise-select-0"]');
  await page.click('[data-testid="exercise-option-3"]'); // Third exercise

  // Submit the form
  await page.click('[data-testid="submit-button"]');

  // Verify redirect to plan detail page
  await page.waitForSelector('[data-testid="plan-detail"]');
  expect(await page.textContent('[data-testid="plan-name"]')).toBe(
    'Push Pull Legs'
  );
  expect(await page.textContent('[data-testid="plan-duration"]')).toBe(
    '8 weeks'
  );

  // Verify exercises are shown
  expect(await page.$$('[data-testid^="day-section"]')).toHaveLength(3);
});
```

#### Test 2: Edit an existing plan

```typescript
test('should edit an existing plan', async () => {
  // Seed a plan first
  await seedPlan({
    name: 'Original Plan',
    durationWeeks: 6,
    days: [
      {
        dayOfWeek: 1,
        exercises: [
          { exerciseId: 1, sets: 2, reps: 8, weight: 30, restSeconds: 60 },
        ],
      },
    ],
  });

  // Navigate to plan detail
  await page.goto('http://localhost:3000/plans/1');

  // Click edit button
  await page.click('[data-testid="edit-plan-button"]');

  // Change plan name
  await page.fill('[data-testid="plan-name-input"]', 'Updated Plan Name');

  // Add a new day
  await page.click('[data-testid="day-checkbox-3"]'); // Wednesday

  // Navigate to exercises step
  await page.click('[data-testid="next-button"]');
  await page.click('[data-testid="next-button"]');

  // Modify existing exercise sets
  await page.click('[data-testid="sets-select-0"]');
  await page.click('[data-testid="sets-option-4"]'); // 4 sets

  // Save changes
  await page.click('[data-testid="submit-button"]');

  // Verify changes persisted
  await page.waitForSelector('[data-testid="plan-detail"]');
  expect(await page.textContent('[data-testid="plan-name"]')).toBe(
    'Updated Plan Name'
  );
});
```

#### Test 3: Delete a plan

```typescript
test('should delete a plan', async () => {
  // Seed a plan
  await seedPlan({
    name: 'Plan to Delete',
    durationWeeks: 6,
    days: [],
  });

  // Navigate to plans page
  await page.goto('http://localhost:3000/plans');

  // Verify plan exists
  expect(await page.textContent('[data-testid="plan-card-1"]')).toContain(
    'Plan to Delete'
  );

  // Open plan menu and click delete
  await page.click('[data-testid="plan-menu-1"]');
  await page.click('[data-testid="delete-plan-1"]');

  // Confirm deletion in dialog
  await page.waitForSelector('[data-testid="delete-confirm-dialog"]');
  await page.click('[data-testid="confirm-delete-button"]');

  // Verify plan is removed
  await page.waitForSelector('[data-testid="empty-plans-message"]');
  expect(await page.$('[data-testid="plan-card-1"]')).toBeNull();
});
```

#### Test 4: Cannot delete plan with active mesocycle

```typescript
test('should prevent deleting plan with active mesocycle', async () => {
  // Seed a plan with active mesocycle
  await seedPlanWithActiveMesocycle({
    name: 'Active Plan',
    durationWeeks: 6,
    days: [{ dayOfWeek: 1, exercises: [] }],
  });

  // Navigate to plans page
  await page.goto('http://localhost:3000/plans');

  // Try to delete
  await page.click('[data-testid="plan-menu-1"]');
  await page.click('[data-testid="delete-plan-1"]');

  // Verify error message in dialog
  await page.waitForSelector('[data-testid="delete-confirm-dialog"]');
  expect(await page.textContent('[data-testid="delete-error"]')).toContain(
    'active mesocycle'
  );

  // Confirm button should be disabled
  expect(await page.isDisabled('[data-testid="confirm-delete-button"]')).toBe(
    true
  );
});
```

---

## Implementation Order

### Week 1: Backend TDD

1. **Day 1**: Database migration for plans tables
2. **Day 1**: Type definitions
3. **Day 2**: Repository tests (all 18 test cases)
4. **Day 2-3**: Repository implementation
5. **Day 3**: Service tests (all 19 test cases)
6. **Day 3-4**: Service implementation with validation
7. **Day 4**: Route tests (all integration tests)
8. **Day 4-5**: Route implementation
9. **Day 5**: Integration testing and bug fixes

### Week 2: Frontend + E2E

1. **Day 1**: API client and React Query hooks
2. **Day 1**: Type definitions
3. **Day 2**: DaySelector component + tests
4. **Day 2**: ExerciseConfigRow component + tests
5. **Day 3**: PlanForm component + tests
6. **Day 3**: PlanList and PlanCard components
7. **Day 4**: Page components (PlansPage, CreatePlanPage, PlanDetailPage)
8. **Day 4**: DeletePlanDialog component
9. **Day 5**: E2E tests setup and implementation
10. **Day 5**: Final integration testing

---

## Success Criteria

### Backend

- [ ] All 18 repository tests pass
- [ ] All 19 service tests pass
- [ ] All route integration tests pass (approximately 20 tests)
- [ ] 100% code coverage on new backend code
- [ ] No TypeScript errors (`any` is forbidden)
- [ ] All linting rules pass

### Frontend

- [ ] DaySelector component tests pass
- [ ] ExerciseConfigRow component tests pass
- [ ] PlanForm component tests pass
- [ ] React Query hook tests pass
- [ ] No TypeScript errors
- [ ] All Radix UI components properly accessible

### E2E

- [ ] Create new plan test passes
- [ ] Edit existing plan test passes
- [ ] Delete plan test passes
- [ ] Delete prevention (active mesocycle) test passes

### Functionality

- [ ] Can list all plans on /plans page
- [ ] Can create a new plan with:
  - Name (required)
  - Duration weeks (default 6, range 1-52)
  - Selected days (0-7 days, checkboxes for Sun-Sat)
  - Exercises per day with configurable sets/reps/weight/rest
- [ ] All exercise config defaults apply correctly:
  - Sets: default 2, range 1-10
  - Reps: default 8, range 1-20
  - Weight: default 30, range 5-300, step 5
  - Rest: default 60, range 30-300, step 30
- [ ] Can view plan detail with all days and exercises
- [ ] Can edit existing plan (name, duration, days, exercises)
- [ ] Can delete plan (with confirmation dialog)
- [ ] Cannot delete plan with active mesocycle (shows error)
- [ ] Form validation works for all fields
- [ ] Loading states show during API calls
- [ ] Error states display meaningful messages

---

## Commit Message

```
feat(plans): implement Plan Creator with full TDD approach

Backend:
- Add database migration for plans, plan_days, plan_day_exercises tables
- Implement PlanRepository with CRUD operations and cascade deletes
- Implement PlanService with comprehensive validation
- Add REST endpoints: GET/POST/PUT/DELETE /api/plans
- Add Zod schemas for request validation
- Prevent plan deletion when active mesocycle exists
- 100% test coverage with 57+ unit/integration tests

Frontend:
- Add React Query hooks for plan CRUD operations
- Implement DaySelector with Radix Checkbox for day selection
- Implement ExerciseConfigRow with Radix Select dropdowns
- Implement multi-step PlanForm wizard
- Add PlansPage with plan list and create button
- Add CreatePlanPage with full form flow
- Add PlanDetailPage with view/edit modes
- Add DeletePlanDialog with Radix Dialog
- Apply default values: sets=2, reps=8, weight=30, rest=60

E2E:
- Add test for creating plan with multiple days and exercises
- Add test for editing existing plan
- Add test for deleting plan
- Add test for delete prevention with active mesocycle

Closes #[issue-number]
```

---

## Notes

### Constraints Reference

- **Sets**: 1-10, default 2
- **Reps**: 1-20, default 8
- **Weight**: 5-300 lbs in 5lb steps, default 30
- **Rest time**: 30-300 seconds in 30s steps, default 60
- **Duration weeks**: 1-52, default 6
- **Days of week**: 0 (Sunday) through 6 (Saturday)

### Radix UI Components to Use

- `@radix-ui/react-checkbox` - Day selection
- `@radix-ui/react-select` - All dropdowns (exercise, sets, reps, weight, rest)
- `@radix-ui/react-dialog` - Delete confirmation, potentially form steps
- `@radix-ui/react-separator` - Visual separation between days/exercises

### Data Flow

1. User creates plan via multi-step form
2. Form state managed with useState/useReducer
3. On submit, data transformed to CreatePlanRequest
4. React Query mutation sends POST to /api/plans
5. Server validates with Zod, creates via repository
6. Response includes full plan with nested relations
7. Client redirects to plan detail page

### Future Considerations

- Drag-and-drop reordering of exercises (not in MVP)
- Plan templates/duplication
- Import/export plans
- Plan sharing between users (if multi-user added later)
