# Phase 3: Exercise Library (TDD)

## Overview

Build the Exercise Library feature using a strict Test-Driven Development (TDD) approach. This phase establishes the foundation for exercise management, including built-in exercises that ship with the app and custom exercises that users can create.

## Prerequisites

- Phase 1 (Project Setup) completed: monorepo structure, linting, TypeScript configuration
- Phase 2 (Database & API Foundation) completed: SQLite setup, Express server, basic API structure

---

## Backend Implementation (Tests First)

### 3.1 Database Schema for Exercises

#### 3.1.1 Write Migration Tests

**File:** `packages/backend/src/db/__tests__/migrations.test.ts`

```typescript
describe('Exercise table migration', () => {
  it('should create exercises table with required columns', async () => {
    // Verify table exists with columns: id, name, weightIncrement, isBuiltIn, createdAt, updatedAt
  });

  it('should have unique constraint on exercise name', async () => {
    // Verify duplicate names are rejected
  });

  it('should seed built-in exercises on first run', async () => {
    // Verify all 12 default exercises are present
  });
});
```

#### 3.1.2 Create Migration

**File:** `packages/backend/src/db/migrations/003_create_exercises.ts`

```typescript
interface Exercise {
  id: number;
  name: string;
  weightIncrement: number; // in lbs, default 5
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### 3.1.3 Seed Data

Create seed file with the following built-in exercises:

| Exercise Name                  | Weight Increment |
| ------------------------------ | ---------------- |
| Dumbbell Press (flat)          | 5 lbs            |
| Seated Cable Row               | 5 lbs            |
| Leg Extension                  | 5 lbs            |
| Machine Triceps Extension      | 5 lbs            |
| Seated Dumbbell Lateral Raises | 5 lbs            |
| Pulldowns (narrow grip)        | 5 lbs            |
| Pec Dec Flye                   | 5 lbs            |
| Machine Reverse Fly            | 5 lbs            |
| Cable Triceps Pushdown         | 5 lbs            |
| Cable Curl                     | 5 lbs            |
| Single Leg Curl                | 5 lbs            |
| Machine Preacher Curl          | 5 lbs            |

---

### 3.2 Exercise Repository Layer

#### 3.2.1 Write Repository Tests

**File:** `packages/backend/src/repositories/__tests__/exerciseRepository.test.ts`

```typescript
describe('ExerciseRepository', () => {
  describe('findAll', () => {
    it('should return all exercises sorted alphabetically by name', async () => {});
    it('should include both built-in and custom exercises', async () => {});
  });

  describe('findById', () => {
    it('should return exercise when found', async () => {});
    it('should return null when exercise does not exist', async () => {});
  });

  describe('create', () => {
    it('should create a custom exercise with provided name and weightIncrement', async () => {});
    it('should default weightIncrement to 5 if not provided', async () => {});
    it('should set isBuiltIn to false for new exercises', async () => {});
    it('should throw error when name already exists', async () => {});
    it('should trim whitespace from exercise name', async () => {});
  });

  describe('update', () => {
    it('should update exercise name', async () => {});
    it('should update weightIncrement', async () => {});
    it('should update updatedAt timestamp', async () => {});
    it('should throw error when exercise does not exist', async () => {});
    it('should throw error when updating to a name that already exists', async () => {});
  });

  describe('delete', () => {
    it('should delete custom exercise', async () => {});
    it('should throw error when attempting to delete built-in exercise', async () => {});
    it('should throw error when exercise does not exist', async () => {});
  });
});
```

#### 3.2.2 Implement Repository

**File:** `packages/backend/src/repositories/exerciseRepository.ts`

```typescript
export interface CreateExerciseInput {
  name: string;
  weightIncrement?: number;
}

export interface UpdateExerciseInput {
  name?: string;
  weightIncrement?: number;
}

export class ExerciseRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Exercise[]> {}
  async findById(id: number): Promise<Exercise | null> {}
  async create(input: CreateExerciseInput): Promise<Exercise> {}
  async update(id: number, input: UpdateExerciseInput): Promise<Exercise> {}
  async delete(id: number): Promise<void> {}
}
```

---

### 3.3 Exercise Service Layer

#### 3.3.1 Write Service Tests

**File:** `packages/backend/src/services/__tests__/exerciseService.test.ts`

```typescript
describe('ExerciseService', () => {
  describe('getAllExercises', () => {
    it('should return all exercises from repository', async () => {});
  });

  describe('getExerciseById', () => {
    it('should return exercise when found', async () => {});
    it('should throw NotFoundError when exercise does not exist', async () => {});
  });

  describe('createExercise', () => {
    it('should validate name is not empty', async () => {});
    it('should validate name is not too long (max 100 chars)', async () => {});
    it('should validate weightIncrement is positive', async () => {});
    it('should validate weightIncrement is not greater than 100', async () => {});
    it('should call repository create with sanitized input', async () => {});
  });

  describe('updateExercise', () => {
    it('should validate exercise exists', async () => {});
    it('should validate name if provided', async () => {});
    it('should validate weightIncrement if provided', async () => {});
    it('should call repository update', async () => {});
  });

  describe('deleteExercise', () => {
    it('should validate exercise exists', async () => {});
    it('should throw ForbiddenError when deleting built-in exercise', async () => {});
    it('should call repository delete for custom exercises', async () => {});
  });
});
```

#### 3.3.2 Implement Service

**File:** `packages/backend/src/services/exerciseService.ts`

```typescript
export class ExerciseService {
  constructor(private repository: ExerciseRepository) {}

  async getAllExercises(): Promise<Exercise[]> {}
  async getExerciseById(id: number): Promise<Exercise> {}
  async createExercise(input: CreateExerciseInput): Promise<Exercise> {}
  async updateExercise(
    id: number,
    input: UpdateExerciseInput
  ): Promise<Exercise> {}
  async deleteExercise(id: number): Promise<void> {}
}
```

---

### 3.4 API Routes

#### 3.4.1 Write Route/Controller Tests

**File:** `packages/backend/src/routes/__tests__/exercises.test.ts`

```typescript
describe('Exercise Routes', () => {
  describe('GET /api/exercises', () => {
    it('should return 200 with array of exercises', async () => {});
    it('should return exercises in alphabetical order', async () => {});
  });

  describe('GET /api/exercises/:id', () => {
    it('should return 200 with exercise when found', async () => {});
    it('should return 404 when exercise not found', async () => {});
    it('should return 400 for invalid id format', async () => {});
  });

  describe('POST /api/exercises', () => {
    it('should return 201 with created exercise', async () => {});
    it('should return 400 when name is missing', async () => {});
    it('should return 400 when name is empty', async () => {});
    it('should return 400 when weightIncrement is negative', async () => {});
    it('should return 409 when exercise name already exists', async () => {});
    it('should use default weightIncrement of 5 when not provided', async () => {});
  });

  describe('PUT /api/exercises/:id', () => {
    it('should return 200 with updated exercise', async () => {});
    it('should return 404 when exercise not found', async () => {});
    it('should return 400 for invalid id format', async () => {});
    it('should return 400 when name is empty string', async () => {});
    it('should return 409 when updating to existing name', async () => {});
  });

  describe('DELETE /api/exercises/:id', () => {
    it('should return 204 on successful deletion', async () => {});
    it('should return 404 when exercise not found', async () => {});
    it('should return 403 when attempting to delete built-in exercise', async () => {});
    it('should return 400 for invalid id format', async () => {});
  });
});
```

#### 3.4.2 Implement Routes

**File:** `packages/backend/src/routes/exercises.ts`

```typescript
import { Router } from 'express';
import { ExerciseController } from '../controllers/exerciseController';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
```

#### 3.4.3 Implement Controller

**File:** `packages/backend/src/controllers/exerciseController.ts`

```typescript
export class ExerciseController {
  constructor(private service: ExerciseService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {};
  getById = async (req: Request, res: Response, next: NextFunction) => {};
  create = async (req: Request, res: Response, next: NextFunction) => {};
  update = async (req: Request, res: Response, next: NextFunction) => {};
  delete = async (req: Request, res: Response, next: NextFunction) => {};
}
```

---

### 3.5 Input Validation

#### 3.5.1 Write Validation Tests

**File:** `packages/backend/src/validation/__tests__/exerciseValidation.test.ts`

```typescript
describe('Exercise Validation', () => {
  describe('createExerciseSchema', () => {
    it('should pass with valid name', () => {});
    it('should pass with valid name and weightIncrement', () => {});
    it('should fail when name is missing', () => {});
    it('should fail when name is empty', () => {});
    it('should fail when name exceeds 100 characters', () => {});
    it('should fail when weightIncrement is negative', () => {});
    it('should fail when weightIncrement is zero', () => {});
    it('should fail when weightIncrement exceeds 100', () => {});
  });

  describe('updateExerciseSchema', () => {
    it('should pass with valid name only', () => {});
    it('should pass with valid weightIncrement only', () => {});
    it('should pass with both name and weightIncrement', () => {});
    it('should pass with empty object (no updates)', () => {});
    it('should fail when name is empty string', () => {});
    it('should fail when weightIncrement is invalid', () => {});
  });

  describe('idParamSchema', () => {
    it('should pass with valid numeric id', () => {});
    it('should fail with non-numeric id', () => {});
    it('should fail with negative id', () => {});
  });
});
```

#### 3.5.2 Implement Validation Schemas

**File:** `packages/backend/src/validation/exerciseValidation.ts`

Use Zod for schema validation:

```typescript
import { z } from 'zod';

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  weightIncrement: z.number().positive().max(100).optional().default(5),
});

export const updateExerciseSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  weightIncrement: z.number().positive().max(100).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});
```

---

## Frontend Implementation

### 3.6 API Client

#### 3.6.1 Write API Client Tests

**File:** `packages/frontend/src/api/__tests__/exerciseApi.test.ts`

```typescript
describe('Exercise API Client', () => {
  describe('getExercises', () => {
    it('should fetch all exercises', async () => {});
    it('should handle network errors', async () => {});
  });

  describe('getExercise', () => {
    it('should fetch single exercise by id', async () => {});
    it('should throw NotFoundError for 404 response', async () => {});
  });

  describe('createExercise', () => {
    it('should create exercise and return created data', async () => {});
    it('should handle validation errors', async () => {});
  });

  describe('updateExercise', () => {
    it('should update exercise and return updated data', async () => {});
  });

  describe('deleteExercise', () => {
    it('should delete exercise successfully', async () => {});
    it('should throw ForbiddenError for built-in exercises', async () => {});
  });
});
```

#### 3.6.2 Implement API Client

**File:** `packages/frontend/src/api/exerciseApi.ts`

```typescript
export interface Exercise {
  id: number;
  name: string;
  weightIncrement: number;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export const exerciseApi = {
  getExercises: async (): Promise<Exercise[]> => {},
  getExercise: async (id: number): Promise<Exercise> => {},
  createExercise: async (data: CreateExerciseInput): Promise<Exercise> => {},
  updateExercise: async (
    id: number,
    data: UpdateExerciseInput
  ): Promise<Exercise> => {},
  deleteExercise: async (id: number): Promise<void> => {},
};
```

---

### 3.7 React Query Hooks

#### 3.7.1 Write Hook Tests

**File:** `packages/frontend/src/hooks/__tests__/useExercises.test.tsx`

```typescript
describe('useExercises', () => {
  it('should fetch and return exercises', async () => {});
  it('should set loading state while fetching', async () => {});
  it('should handle errors', async () => {});
});

describe('useExercise', () => {
  it('should fetch single exercise by id', async () => {});
});

describe('useCreateExercise', () => {
  it('should create exercise and invalidate cache', async () => {});
  it('should handle validation errors', async () => {});
});

describe('useUpdateExercise', () => {
  it('should update exercise and invalidate cache', async () => {});
});

describe('useDeleteExercise', () => {
  it('should delete exercise and invalidate cache', async () => {});
});
```

#### 3.7.2 Implement Hooks

**File:** `packages/frontend/src/hooks/useExercises.ts`

```typescript
export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: exerciseApi.getExercises,
  });
}

export function useExercise(id: number) {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: () => exerciseApi.getExercise(id),
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exerciseApi.createExercise,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => exerciseApi.updateExercise(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exerciseApi.deleteExercise,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}
```

---

### 3.8 UI Components

#### 3.8.1 ExerciseList Component

**File:** `packages/frontend/src/components/ExerciseLibrary/__tests__/ExerciseList.test.tsx`

```typescript
describe('ExerciseList', () => {
  it('should render list of exercises', () => {});
  it('should show loading spinner while fetching', () => {});
  it('should show error message on fetch failure', () => {});
  it('should show empty state when no exercises', () => {});
  it('should visually distinguish built-in from custom exercises', () => {});
  it('should show edit/delete buttons only for custom exercises', () => {});
  it('should sort exercises alphabetically', () => {});
});
```

**File:** `packages/frontend/src/components/ExerciseLibrary/ExerciseList.tsx`

```typescript
export function ExerciseList() {
  const { data: exercises, isLoading, error } = useExercises();
  // Render using Radix UI components
  // - Use Badge to distinguish built-in vs custom
  // - Use Card for each exercise item
  // - Show weight increment info
}
```

#### 3.8.2 ExerciseListItem Component

**File:** `packages/frontend/src/components/ExerciseLibrary/__tests__/ExerciseListItem.test.tsx`

```typescript
describe('ExerciseListItem', () => {
  it('should display exercise name', () => {});
  it('should display weight increment', () => {});
  it('should show "Built-in" badge for built-in exercises', () => {});
  it('should show "Custom" badge for custom exercises', () => {});
  it('should show edit button for custom exercises', () => {});
  it('should show delete button for custom exercises', () => {});
  it('should not show edit/delete for built-in exercises', () => {});
  it('should call onEdit when edit button clicked', () => {});
  it('should call onDelete when delete button clicked', () => {});
});
```

**File:** `packages/frontend/src/components/ExerciseLibrary/ExerciseListItem.tsx`

Use Radix UI:

- `Card` for container
- `Badge` for built-in/custom indicator
- `IconButton` for edit/delete actions

#### 3.8.3 AddExerciseForm Component

**File:** `packages/frontend/src/components/ExerciseLibrary/__tests__/AddExerciseForm.test.tsx`

```typescript
describe('AddExerciseForm', () => {
  it('should render name input field', () => {});
  it('should render weight increment input with default value of 5', () => {});
  it('should render submit button', () => {});
  it('should disable submit when name is empty', () => {});
  it('should show validation error for empty name on blur', () => {});
  it('should show validation error for invalid weight increment', () => {});
  it('should call onSubmit with form data', () => {});
  it('should reset form after successful submission', () => {});
  it('should show loading state during submission', () => {});
  it('should show error message on submission failure', () => {});
});
```

**File:** `packages/frontend/src/components/ExerciseLibrary/AddExerciseForm.tsx`

Use Radix UI:

- `TextField` for name input
- `TextField` with type="number" for weight increment
- `Button` for submit
- `Label` for field labels

#### 3.8.4 EditExerciseDialog Component

**File:** `packages/frontend/src/components/ExerciseLibrary/__tests__/EditExerciseDialog.test.tsx`

```typescript
describe('EditExerciseDialog', () => {
  it('should render dialog with exercise data pre-filled', () => {});
  it('should close dialog on cancel', () => {});
  it('should call onSave with updated data', () => {});
  it('should validate inputs before submission', () => {});
  it('should show loading state during save', () => {});
});
```

**File:** `packages/frontend/src/components/ExerciseLibrary/EditExerciseDialog.tsx`

Use Radix UI:

- `Dialog` for modal
- `TextField` for inputs
- `Button` for actions

#### 3.8.5 DeleteExerciseDialog Component

**File:** `packages/frontend/src/components/ExerciseLibrary/__tests__/DeleteExerciseDialog.test.tsx`

```typescript
describe('DeleteExerciseDialog', () => {
  it('should render confirmation message with exercise name', () => {});
  it('should close dialog on cancel', () => {});
  it('should call onConfirm when delete confirmed', () => {});
  it('should show loading state during deletion', () => {});
});
```

**File:** `packages/frontend/src/components/ExerciseLibrary/DeleteExerciseDialog.tsx`

Use Radix UI:

- `AlertDialog` for confirmation dialog
- `Button` with destructive variant for delete action

---

### 3.9 Exercise Library Page

#### 3.9.1 Write Page Tests

**File:** `packages/frontend/src/pages/__tests__/ExerciseLibraryPage.test.tsx`

```typescript
describe('ExerciseLibraryPage', () => {
  it('should render page title', () => {});
  it('should render add exercise form', () => {});
  it('should render exercise list', () => {});
  it('should open edit dialog when edit clicked', () => {});
  it('should open delete dialog when delete clicked', () => {});
  it('should update list after adding exercise', () => {});
  it('should update list after editing exercise', () => {});
  it('should update list after deleting exercise', () => {});
});
```

#### 3.9.2 Implement Page

**File:** `packages/frontend/src/pages/ExerciseLibraryPage.tsx`

```typescript
export function ExerciseLibraryPage() {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  return (
    <div className="exercise-library-page">
      <h1>Exercise Library</h1>
      <AddExerciseForm />
      <ExerciseList
        onEdit={setEditingExercise}
        onDelete={setDeletingExercise}
      />
      <EditExerciseDialog
        exercise={editingExercise}
        onClose={() => setEditingExercise(null)}
      />
      <DeleteExerciseDialog
        exercise={deletingExercise}
        onClose={() => setDeletingExercise(null)}
      />
    </div>
  );
}
```

---

### 3.10 Bottom Navigation Update

#### 3.10.1 Write Navigation Tests

**File:** `packages/frontend/src/components/Navigation/__tests__/BottomNav.test.tsx`

```typescript
describe('BottomNav', () => {
  it('should render Today tab', () => {});
  it('should render Meso tab', () => {});
  it('should render Exercise Library tab', () => {});
  it('should highlight active tab', () => {});
  it('should navigate to correct routes', () => {});
});
```

#### 3.10.2 Implement/Update Navigation

**File:** `packages/frontend/src/components/Navigation/BottomNav.tsx`

```typescript
const navItems = [
  { path: '/', label: 'Today', icon: CalendarIcon },
  { path: '/meso', label: 'Meso', icon: ListIcon },
  { path: '/exercises', label: 'Exercises', icon: DumbbellIcon },
];
```

---

## E2E Tests

### 3.11 Puppeteer E2E Tests

**File:** `packages/e2e/tests/exerciseLibrary.test.ts`

```typescript
describe('Exercise Library E2E', () => {
  beforeEach(async () => {
    // Reset database to known state with only built-in exercises
    // Navigate to Exercise Library page
  });

  describe('View exercise list', () => {
    it('should display all built-in exercises', async () => {
      // Navigate to /exercises
      // Verify all 12 built-in exercises are visible
      // Verify each shows "Built-in" badge
      // Verify no edit/delete buttons on built-in exercises
    });

    it('should display exercises in alphabetical order', async () => {
      // Verify order: Cable Curl, Cable Triceps Pushdown, ...
    });
  });

  describe('Add custom exercise', () => {
    it('should add a new custom exercise', async () => {
      // Fill in name: "Barbell Squat"
      // Set weight increment: 10
      // Click submit
      // Verify new exercise appears in list
      // Verify it shows "Custom" badge
      // Verify edit/delete buttons are visible
    });

    it('should use default weight increment of 5', async () => {
      // Fill in name only
      // Submit
      // Verify weight increment shows as 5
    });

    it('should show validation error for empty name', async () => {
      // Leave name empty
      // Try to submit
      // Verify error message displayed
    });

    it('should show error for duplicate name', async () => {
      // Try to add "Leg Extension" (already exists)
      // Verify error message about duplicate
    });
  });

  describe('Edit custom exercise', () => {
    beforeEach(async () => {
      // Add a custom exercise first
    });

    it('should edit custom exercise name', async () => {
      // Click edit on custom exercise
      // Change name
      // Save
      // Verify name updated in list
    });

    it('should edit custom exercise weight increment', async () => {
      // Click edit
      // Change weight increment
      // Save
      // Verify increment updated
    });

    it('should cancel edit without saving', async () => {
      // Click edit
      // Make changes
      // Click cancel
      // Verify original values preserved
    });
  });

  describe('Delete custom exercise', () => {
    beforeEach(async () => {
      // Add a custom exercise first
    });

    it('should delete custom exercise after confirmation', async () => {
      // Click delete on custom exercise
      // Confirm deletion
      // Verify exercise removed from list
    });

    it('should cancel deletion', async () => {
      // Click delete
      // Click cancel
      // Verify exercise still in list
    });

    it('should not allow deleting built-in exercises', async () => {
      // Verify no delete button on built-in exercises
    });
  });
});
```

---

## File Structure Summary

```
packages/
  backend/
    src/
      db/
        migrations/
          003_create_exercises.ts
        seeds/
          exercises.ts
        __tests__/
          migrations.test.ts
      repositories/
        exerciseRepository.ts
        __tests__/
          exerciseRepository.test.ts
      services/
        exerciseService.ts
        __tests__/
          exerciseService.test.ts
      controllers/
        exerciseController.ts
      routes/
        exercises.ts
        __tests__/
          exercises.test.ts
      validation/
        exerciseValidation.ts
        __tests__/
          exerciseValidation.test.ts
  frontend/
    src/
      api/
        exerciseApi.ts
        __tests__/
          exerciseApi.test.ts
      hooks/
        useExercises.ts
        __tests__/
          useExercises.test.tsx
      components/
        ExerciseLibrary/
          ExerciseList.tsx
          ExerciseListItem.tsx
          AddExerciseForm.tsx
          EditExerciseDialog.tsx
          DeleteExerciseDialog.tsx
          __tests__/
            ExerciseList.test.tsx
            ExerciseListItem.test.tsx
            AddExerciseForm.test.tsx
            EditExerciseDialog.test.tsx
            DeleteExerciseDialog.test.tsx
        Navigation/
          BottomNav.tsx
          __tests__/
            BottomNav.test.tsx
      pages/
        ExerciseLibraryPage.tsx
        __tests__/
          ExerciseLibraryPage.test.tsx
  e2e/
    tests/
      exerciseLibrary.test.ts
```

---

## Implementation Order

Follow this sequence to maintain TDD discipline:

1. **Backend Database Layer**
   - Write migration tests
   - Implement migration
   - Write seed tests
   - Implement seed data

2. **Backend Repository Layer**
   - Write repository tests
   - Implement repository

3. **Backend Service Layer**
   - Write service tests
   - Implement service

4. **Backend Validation**
   - Write validation tests
   - Implement validation schemas

5. **Backend Routes/Controllers**
   - Write route tests
   - Implement controller and routes
   - Register routes in Express app

6. **Frontend API Client**
   - Write API client tests
   - Implement API client

7. **Frontend Hooks**
   - Write hook tests
   - Implement React Query hooks

8. **Frontend Components**
   - Write component tests (one at a time)
   - Implement components (one at a time)
   - Order: ExerciseListItem, ExerciseList, AddExerciseForm, EditExerciseDialog, DeleteExerciseDialog

9. **Frontend Page**
   - Write page tests
   - Implement page
   - Add route to router

10. **Navigation**
    - Write navigation tests
    - Update bottom navigation

11. **E2E Tests**
    - Write and run all E2E tests
    - Fix any integration issues discovered

---

## Success Criteria

### Backend

- [ ] All 12 built-in exercises are seeded in the database
- [ ] `GET /api/exercises` returns all exercises sorted alphabetically
- [ ] `GET /api/exercises/:id` returns single exercise or 404
- [ ] `POST /api/exercises` creates custom exercise with validation
- [ ] `PUT /api/exercises/:id` updates exercise with validation
- [ ] `DELETE /api/exercises/:id` deletes custom exercises only
- [ ] Deleting built-in exercises returns 403 Forbidden
- [ ] All backend unit tests pass (100% coverage for new code)

### Frontend

- [ ] Exercise Library tab appears in bottom navigation
- [ ] Exercise list displays all exercises alphabetically
- [ ] Built-in exercises show "Built-in" badge (e.g., gray)
- [ ] Custom exercises show "Custom" badge (e.g., blue)
- [ ] Built-in exercises do NOT show edit/delete buttons
- [ ] Custom exercises show edit/delete buttons
- [ ] Add exercise form works with name and weight increment (default 5)
- [ ] Edit dialog pre-fills current values and saves changes
- [ ] Delete dialog shows confirmation and removes exercise
- [ ] All frontend unit tests pass (100% coverage for new code)

### E2E

- [ ] Can view full exercise list with proper badges
- [ ] Can add new custom exercise
- [ ] Can edit custom exercise
- [ ] Can delete custom exercise
- [ ] Cannot delete built-in exercises
- [ ] All E2E tests pass

### Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No use of `any` type
- [ ] All new code follows existing project patterns

---

## Commit Message

```
feat(exercise-library): add exercise library with CRUD for custom exercises

- Add exercises table with migration and seed data for 12 built-in exercises
- Implement full CRUD API endpoints for exercises (GET, POST, PUT, DELETE)
- Prevent deletion of built-in exercises (403 response)
- Add Exercise Library page with Radix UI components
- Display exercises with visual distinction (Built-in vs Custom badges)
- Add/edit custom exercises with configurable weight increment (default 5 lbs)
- Add bottom navigation tab for Exercise Library
- Include comprehensive unit tests (repository, service, routes, components)
- Include E2E tests for all exercise library user flows

Built-in exercises seeded:
- Dumbbell Press (flat), Seated Cable Row, Leg Extension
- Machine Triceps Extension, Seated Dumbbell Lateral Raises
- Pulldowns (narrow grip), Pec Dec Flye, Machine Reverse Fly
- Cable Triceps Pushdown, Cable Curl, Single Leg Curl, Machine Preacher Curl
```

---

## Notes

- Weight increment is per-exercise to support different progression rates (e.g., 2.5 lbs for isolation exercises)
- Built-in exercises cannot be deleted to maintain data integrity for plans that reference them
- Exercise names must be unique to prevent confusion in dropdowns
- All timestamps use ISO 8601 format for consistency
