# Implementation Guidance: Parallelization Strategy

This document provides guidance for coding agents implementing the lifting app, identifying opportunities to parallelize work both across phases and within each phase.

---

## Cross-Phase Dependencies

The phases form a mostly sequential dependency chain:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → [7 || 8] → Phase 9 → Phase 10
```

| Phase | Name | Hard Dependency |
|-------|------|-----------------|
| 1 | Scaffolding | None (foundation) |
| 2 | Database & Backend | Phase 1 - needs monorepo structure |
| 3 | Exercise Library | Phase 2 - needs DB schema + repository patterns |
| 4 | Plan Creator | Phase 3 - needs exercise library API |
| 5 | Mesocycle | Phase 4 - needs plans/plan_days tables |
| 6 | Workout Tracking | Phase 5 - needs mesocycle + scheduled_workouts |
| 7 | Rest Timer | Phase 6 - needs workout logging |
| 8 | Progressive Overload | Phase 6 - needs workout logging |
| 9 | Plan Modification | **Phase 8** - calls progression calculation logic |
| 10 | Polish & Deployment | Phases 1-9 - applies to all features |

### Cross-Phase Parallelization

**Only Phases 7 and 8 can run in parallel with each other.**

```
Phase 6 completes
        ↓
   ┌────┴────┐
   ↓         ↓
Phase 7   Phase 8
(Timer)   (Progression)
   └────┬────┘
        ↓
    Phase 9
```

- **Phase 7 (Rest Timer)** is a standalone UI enhancement - starts timer after logging a set
- **Phase 8 (Progressive Overload)** is core business logic for weight/rep calculations
- **Phase 9 has a hard dependency on Phase 8** - must recalculate progression when exercises are modified

---

## Within-Phase Parallelization

### Phase 1: Scaffolding

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A** | Root `package.json`, `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc` | None |
| **B** | `packages/shared/` - types, utilities | Track A |
| **C1** | `packages/server/` | Tracks A & B |
| **C2** | `packages/client/` | Tracks A & B |
| **D** | Docker files, E2E package | Track C |

**Parallel opportunity:** Tracks C1 and C2 can run simultaneously once shared package is complete.

---

### Phase 2: Database & Backend Foundation

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | Migration system implementation | None |
| **A2** | Shared type definitions (`packages/shared/src/types/`) | None |
| **A3** | All middleware (error handler, logger, validation) | None |
| **B1** | ExerciseRepository + tests | Migrations complete |
| **B2** | PlanRepository + tests | Migrations complete |
| **C1** | PlanDayRepository + tests | Track B2 |
| **C2** | MesocycleRepository + tests | Track B2 |
| **D1** | PlanDayExerciseRepository + tests | Track C1 |
| **D2** | WorkoutRepository + tests | Track C2 |
| **E** | WorkoutSetRepository + tests | Track D2 |
| **F1** | Exercise routes | All repositories |
| **F2** | Plan routes | All repositories |
| **F3** | Mesocycle routes | All repositories |
| **F4** | Workout routes | All repositories |

**Parallel opportunities:**
- Tracks A1, A2, A3 can all run simultaneously
- Tracks B1, B2 can run simultaneously
- Tracks C1, C2 can run simultaneously
- Tracks D1, D2 can run simultaneously
- Tracks F1-F4 can all run simultaneously

---

### Phase 3: Exercise Library

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | Seed data tests + implementation | None |
| **A2** | Validation schema tests + implementation | None |
| **B1** | Service layer tests + implementation | Repository exists (can use mocks) |
| **B2** | Controller/Route tests + implementation | Repository exists (can use mocks) |
| **C1** | `useExercises` hook | API contracts defined |
| **C2** | `useExercise` hook | API contracts defined |
| **C3** | `useCreateExercise` hook | API contracts defined |
| **C4** | `useUpdateExercise` hook | API contracts defined |
| **C5** | `useDeleteExercise` hook | API contracts defined |
| **D1** | `ExerciseListItem` component | Hooks exist |
| **D2** | `AddExerciseForm` component | Hooks exist |
| **D3** | `EditExerciseDialog` component | Hooks exist |
| **D4** | `DeleteExerciseDialog` component | Hooks exist |
| **E** | `ExerciseList` → `ExerciseLibraryPage` → Navigation | Track D complete |

**Parallel opportunities:**
- Tracks A1, A2 can run simultaneously
- Tracks B1, B2 can run simultaneously (with mocks)
- Tracks C1-C5 can all run simultaneously
- Tracks D1-D4 can all run simultaneously

---

### Phase 4: Plan Creator

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | Database migration | None |
| **A2** | Type definitions | None |
| **A3** | Repository layer + tests | Track A1 |
| **B1** | Validation schemas (Zod) | Track A2 |
| **B2** | Service layer + tests | Track A3 |
| **B3** | Route layer + tests | Track B2 |
| **C1** | Frontend type definitions | None |
| **C2** | API client functions | Track C1 |
| **C3** | React Query hooks | Track C2 |
| **D1** | `DaySelector` component | Track C3 |
| **D2** | `ExerciseConfigRow` component | Track C3 |
| **D3** | `PlanCard` + `DeletePlanDialog` | Track C3 |
| **D4** | `PlanList` component | Track C3 |
| **D5** | `PlanForm` (multi-step wizard) | Track C3 |
| **E** | `PlansPage`, `CreatePlanPage`, `PlanDetailPage` | Track D complete |

**Parallel opportunities:**
- Tracks A1, A2, C1 can run simultaneously
- Tracks D1-D5 can all run simultaneously

---

### Phase 5: Mesocycle Management

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | Database migration | None |
| **A2** | Type definitions | None |
| **B1** | `MesocycleService` + tests | Track A |
| **B2** | Progressive overload calculation logic | Track A |
| **C** | Route tests + implementation | Track A (can parallel with B using mocks) |
| **D1** | API client | API contracts defined |
| **D2** | React Query hooks + tests | Track D1 |
| **E1** | `StartMesocycleForm` component | Track D2 |
| **E2** | `WeekCard` component | Track D2 |
| **E3** | `MesocycleStatusCard` component | Track D2 |
| **F** | `MesoTab` implementation | Track E complete |

**Parallel opportunities:**
- Tracks A1, A2 can run simultaneously
- Tracks B1, B2, C can run simultaneously (C with mocks)
- Tracks E1, E2, E3 can all run simultaneously

---

### Phase 6: Workout Tracking

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | `WorkoutSetService` tests + implementation | None |
| **A2** | `PUT /api/workout-sets/:id/log` | Track A1 |
| **A3** | `PUT /api/workout-sets/:id/skip` | Track A1 |
| **B1** | `WorkoutService` tests + implementation | None |
| **B2** | `GET /api/workouts/:id` | Track B1 |
| **B3** | `PUT /api/workouts/:id/start` | Track B1 |
| **B4** | `PUT /api/workouts/:id/complete` | Track B1 |
| **B5** | `PUT /api/workouts/:id/skip` | Track B1 |
| **C1** | API client | API contracts defined |
| **C2** | `useLocalStorage` hook + tests | None |
| **D** | `useWorkout` hook + tests | Tracks C1, C2 |
| **E1** | `LogSetModal` component | Track D |
| **E2** | `SetRow` component | Track D |
| **E3** | `ExerciseCard` component | Track D |
| **E4** | `WorkoutView` component | Track D |
| **F** | `TodayPage` | Track E complete |

**Parallel opportunities:**
- Tracks A1 and B1 can run simultaneously (separate API domains)
- Tracks A2, A3 can run simultaneously
- Tracks B2-B5 can all run simultaneously
- Tracks C1, C2 can run simultaneously
- Tracks E1-E4 can all run simultaneously

---

### Phase 7: Rest Timer

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | `src/utils/audio.ts` (beep sound) | None |
| **A2** | `src/hooks/useRestTimer.ts` (core timer logic) | None |
| **A3** | `src/utils/timerStorage.ts` (localStorage persistence) | None |
| **B** | `RestTimer` component + tests | Track A complete |
| **C** | Integration with workout tracking flow | Track B |

**Parallel opportunities:**
- Tracks A1, A2, A3 can all run simultaneously

---

### Phase 8: Progressive Overload & Deload

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A** | Type definitions for progression rules | None |
| **B1** | `ProgressionService` + tests | Track A |
| **B2** | `DeloadService` + tests | Track A |
| **C** | Route/endpoint tests + implementation | Track A (can parallel with B using mocks) |
| **D1** | `ProgressionIndicator` component | API contracts defined |
| **D2** | `DeloadBadge` component | API contracts defined |
| **D3** | `NextWeekPreview` component | API contracts defined |
| **E** | Integration with workout/mesocycle views | Tracks B, C, D complete |

**Parallel opportunities:**
- Tracks B1, B2, C can run simultaneously
- Tracks D1, D2, D3 can all run simultaneously

---

### Phase 9: Plan Modification

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A** | `planModificationService` diffing logic | None |
| **B1** | `addExerciseToFutureWorkouts` | Track A |
| **B2** | `removeExerciseFromFutureWorkouts` | Track A |
| **B3** | `updateExerciseTargetsForFutureWorkouts` | Track A |
| **B4** | `addWorkoutDayToFutureWeeks` | Track A |
| **B5** | `removeWorkoutDayFromFutureWeeks` | Track A |
| **C1** | Warning dialog component | None |
| **C2** | API client methods | None |
| **D** | Integration with plan editing flow | Tracks B, C complete |

**Parallel opportunities:**
- Tracks B1-B5 can all run simultaneously
- Tracks C1, C2 can run simultaneously (and parallel with Track B)

---

### Phase 10: Polish & Deployment

| Track | Work Items | Dependencies |
|-------|------------|--------------|
| **A1** | `colors.ts` | None |
| **A2** | `typography.ts` | None |
| **A3** | `spacing.ts` | None |
| **A4** | `theme/index.ts` | Tracks A1-A3 |
| **B1** | `BottomNav` component | None |
| **B2** | Page routes setup | None |
| **C1** | Loading components (`Spinner`, `PageLoader`, `ButtonLoader`, skeletons) | None |
| **C2** | `ErrorState` component | None |
| **C3** | `EmptyState` variants | None |
| **D** | Apply theme + states to all existing components | Tracks A, B, C complete |
| **E1** | `Dockerfile.prod` | None |
| **E2** | `docker-compose.prod.yml` | Track E1 |
| **F1** | Health check endpoint | None |
| **F2** | Security middleware (helmet) | None |
| **F3** | Static file serving | None |
| **G1** | README.md | None |
| **G2** | E2E test suite execution | Track D complete |
| **G3** | Manual testing checklist | Track D complete |

**Parallel opportunities:**
- Tracks A1-A3 can run simultaneously
- Tracks B1, B2 can run simultaneously
- Tracks C1, C2, C3 can run simultaneously
- Tracks E1, F1, F2, F3, G1 can run simultaneously
- Tracks A, B, C, E, F can all run in parallel (before integration)

---

## Summary: Maximum Parallel Agents Per Phase

| Phase | Description | Max Parallel Tracks | Key Parallel Work |
|-------|-------------|---------------------|-------------------|
| 1 | Scaffolding | 2 | server + client packages |
| 2 | Database | 4 | repositories by entity |
| 3 | Exercise Library | 5 | hooks (5) + components (4) |
| 4 | Plan Creator | 5 | components (5) |
| 5 | Mesocycle | 4 | service + routes + components (3) |
| 6 | Workout Tracking | 6 | backend APIs (2) + components (4) |
| 7 | Rest Timer | 3 | utilities (3) |
| 8 | Progressive Overload | 5 | services (2) + components (3) |
| 9 | Plan Modification | 6 | operations (5) + frontend (2) |
| 10 | Polish | 6 | theme + nav + states + docker + server + docs |

---

## Recommended Agent Assignment Strategy

For optimal parallelization with multiple coding agents:

### Single Agent
Execute tracks sequentially within each phase, prioritizing:
1. Types/schemas first
2. Backend implementation
3. Frontend implementation
4. Integration and E2E tests

### Two Agents
- **Agent 1:** Backend (migrations → repositories → services → routes)
- **Agent 2:** Frontend (types → API client → hooks → components → pages)

Agent 2 can begin once API contracts are defined (after Agent 1 completes routes).

### Three+ Agents
- **Agent 1:** Backend data layer (migrations, repositories)
- **Agent 2:** Backend API layer (services, routes, middleware)
- **Agent 3:** Frontend (all frontend work)

For phases with many parallel components (3, 4, 6, 9, 10), additional agents can each take a component track.

---

## Critical Path

The minimum sequential path through each phase:

```
Types/Schema → Repository → Service → Routes → API Client → Hooks → Components → Pages → E2E
```

Work that falls outside this critical path can be parallelized without blocking progress.
