# PWA Client Features Overview

A shallow pass of all features in the PWA client (`packages/client/`) for native iOS port reference.

## Navigation Structure

### Global Navigation (Bottom Nav)
- **Today** (`/`) - Main dashboard
- **Activities** (`/activities`) - Activity selection hub
- **History** (`/history`) - Activity history view
- **Profile** (`/profile`) - User profile

### Lifting Navigation
- **Back** - Return to activities
- **Meso** (`/lifting`) - Mesocycle dashboard
- **Plans** (`/lifting/plans`) - Workout plans
- **Exercises** (`/lifting/exercises`) - Exercise library

### Activity Navigation
- Dynamic back button with activity label

---

## Feature Areas

### 1. Workout Tracking (Lifting)

**Pages:**
- `/lifting` - Mesocycle management
- `/lifting/plans` - Plan list
- `/lifting/plans/new` - Create plan
- `/lifting/plans/:id` - Plan details
- `/lifting/plans/:id/edit` - Edit plan
- `/lifting/exercises` - Exercise library
- `/lifting/exercises/:id/history` - Exercise history
- `/lifting/workouts/:id` - Active workout session
- `/lifting/today` - Today's workout

**Core Features:**
- Create/edit workout plans with exercises
- Configure exercises (sets, reps, weight, rest time)
- Day-of-week scheduling for plans
- Start 6-week mesocycles from plans
- Progressive overload (odd weeks +1 rep, even weeks +weight)
- Deload week (week 7, 50% volume)
- Log sets with weight/reps during workouts
- Skip individual sets
- Add/remove sets dynamically
- Rest timer between sets (with notifications)
- Exercise history with weight progression charts

**Components:**
- `WorkoutView` - Main tracking interface
- `ExerciseCard` - Exercise display during workout
- `SetRow` - Individual set input (weight/reps)
- `PlanForm` - Create/edit plans
- `PlanCard` - Plan summary card
- `MesocycleStatusCard` - Current meso status
- `WeekCard` - Week display in mesocycle
- `StartMesocycleForm` - Begin new mesocycle
- `ProgressionIndicator` - Shows rep/weight changes
- `DeloadBadge` - Deload week indicator
- `NextWeekPreview` - Preview next week's targets
- `WeightProgressionChart` - Historical weight graph
- `SetHistoryTable` - Exercise set history

---

### 2. Meditation

**Page:** `/meditation`

**Core Features:**
- Configurable session duration
- Breathing circle animation (visual guide)
- Session timer with progress display
- Audio cues
- Session completion screen
- History tracking (stats, recent sessions)

**Components:**
- `MeditationSetup` - Duration selection
- `MeditationSession` - Active session UI
- `MeditationComplete` - Completion screen
- `BreathingCircle` - Animated breathing visualization

**State Management:**
- `useMeditationSession` - Session state (local)
- `useMeditationHistory` - Server-fetched history
- `meditationStorage.ts` - LocalStorage persistence

---

### 3. Stretching

**Page:** `/stretch`

**Core Features:**
- Body region selection (back, calves, glutes, hamstrings, hip flexors, neck, quads, shoulders)
- Per-region stretches with:
  - Audio instructions (`*-begin.wav`)
  - Visual demonstrations (PNG images)
- Session timer
- Session recovery (resume interrupted sessions)
- Completion screen
- History tracking

**Stretches by Region:**
| Region | Stretches |
|--------|-----------|
| Back | cat-cow, knees-to-chest, cobra |
| Calves | standing-calf, wall-push-up, bent-knee, single-leg |
| Glutes | seated-figure-four, standing, cross-body, supine-figure-four |
| Hamstrings | standing, supine, standing-one-leg |
| Hip Flexors | kneeling, standing-lunge, pigeon-pose, high-knee, reverse-lunge |
| Neck | upper-trapezius, levator-scapulae |
| Quads | standing, lunge, side-lying, reverse-lunge, prone |
| Shoulders | cross-body, overhead, arm-behind-the-back |

**Components:**
- `StretchSetup` - Region selection
- `StretchSession` - Active session
- `StretchComplete` - Completion screen
- `RegionItem` - Body region selector
- `SessionRecoveryPrompt` - Resume interrupted session

---

### 4. Calendar & History

**Pages:**
- `/history` - Activity history (filterable)
- Calendar embedded in various views

**Core Features:**
- Month calendar view (react-calendar)
- Activity dots on calendar days (workout, stretch, meditation)
- Day detail dialog showing all activities
- Activity type filtering
- Historical data for all activity types

**Components:**
- `MonthCalendar` - Calendar grid with activity indicators
- `ActivityItem` - Activity display in calendar
- `DayDetailDialog` - Modal showing day's activities
- `ActivityFilter` - Filter by activity type

---

### 5. Dashboard (Today)

**Page:** `/` (TodayDashboard)

**Core Features:**
- Daily overview cards for each activity type
- Quick access to scheduled workout
- Meditation and stretch status/launch

**Components:**
- `WorkoutCard` - Today's workout summary
- `MeditationCard` - Meditation quick-start
- `StretchCard` - Stretch quick-start

---

### 6. Exercise Library

**Page:** `/lifting/exercises`

**Core Features:**
- Browse all exercises
- Create new exercises
- Edit exercise details (name, weight increment)
- Delete exercises
- View exercise history/progression

**Components:**
- `ExerciseList` - Exercise listing
- `ExerciseListItem` - Individual exercise row
- `AddExerciseForm` - Create exercise form
- `EditExerciseDialog` - Edit exercise modal
- `DeleteExerciseDialog` - Delete confirmation

---

### 7. Profile & Settings

**Page:** `/profile`

**Components:**
- `NotificationSettings` - Push notification preferences
- `NotificationPrompt` - Permission request UI
- `NotificationError` - Error display

---

## Technical Infrastructure

### Data Fetching (React Query)
- `useWorkout`, `useTodaysWorkout` - Workout data
- `useExercises`, `useExercise` - Exercise data
- `usePlans`, `usePlan` - Plan data
- `useMesocycles`, `useActiveMesocycle` - Mesocycle data
- `useCalendarMonth` - Calendar activity data
- `useMeditationHistory`, `useStretchHistory` - Session history

### Local Storage
- `useLocalStorage` - Generic localStorage hook
- `timerStorage.ts` - Rest timer state
- `meditationStorage.ts` - Meditation session state
- `stretchStorage.ts` - Stretch session state
- Workout-in-progress survives browser crash

### Notifications
- Push notification support via service worker
- Timer completion notifications
- `useNotificationPermission` - Permission state
- `timerNotifications.ts` - Notification logic

### Audio
- `audio.ts` - General audio utilities
- `meditationAudio.ts` - Meditation audio
- `stretchAudio.ts` - Stretch audio/instructions

### PWA Features
- `usePwaInstallStatus` - Installation detection
- Service worker (`sw.js`) - Offline support, notifications
- Installable as standalone app

---

## UI Framework

### Design System
- **Radix UI** primitives (Dialog, Select, Checkbox, etc.)
- **CSS Modules** for complex animations (timers, breathing circle)
- **react-calendar** for calendar views
- No custom UI primitive abstraction layer

### Layout Structure
```
GlobalLayout
├── TodayDashboard
├── ActivitiesPage
├── HistoryPage
└── ProfilePage

LiftingLayout
├── MesoPage
├── PlansPage
├── CreatePlanPage
├── PlanDetailPage
├── EditPlanPage
├── ExerciseLibraryPage
├── ExerciseHistoryPage
├── WorkoutPage
└── TodayPage

ActivityLayout
├── MeditationPage
└── StretchPage
```

---

## API Endpoints Used

### Exercises
- `GET /api/exercises` - List all
- `GET /api/exercises/:id` - Get one
- `POST /api/exercises` - Create
- `PUT /api/exercises/:id` - Update
- `DELETE /api/exercises/:id` - Delete
- `GET /api/exercises/:id/history` - History

### Plans
- CRUD operations for plans
- CRUD for plan days
- CRUD for plan day exercises

### Mesocycles
- `POST /api/mesocycles` - Create
- `GET /api/mesocycles/active` - Get active
- `PUT /api/mesocycles/:id/complete` - Complete
- `PUT /api/mesocycles/:id/cancel` - Cancel

### Workouts
- `GET /api/workouts/today` - Today's workout
- `PUT /api/workouts/:id/start` - Start
- `PUT /api/workouts/:id/complete` - Complete
- `PUT /api/workouts/:id/skip` - Skip
- `PUT /api/workout-sets/:id/log` - Log set
- `PUT /api/workout-sets/:id/skip` - Skip set

### Calendar
- `GET /api/calendar/:year/:month` - Month activities

### Meditation/Stretch
- Session save/fetch endpoints
