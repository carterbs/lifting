# Brad OS - iOS App

Native iOS app for the Brad OS workout tracker, built with SwiftUI.

## Requirements

- iOS 17.0+
- Xcode 15.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (for generating the Xcode project)

## Setup

1. Install XcodeGen if you haven't already:
   ```bash
   brew install xcodegen
   ```

2. Generate the Xcode project:
   ```bash
   cd ios/BradOS
   xcodegen generate
   ```

3. Open the generated project:
   ```bash
   open BradOS.xcodeproj
   ```

4. Select your development team in Xcode's Signing & Capabilities.

5. Build and run on your device or simulator.

## Project Structure

```
BradOS/
├── App/
│   └── BradOSApp.swift          # App entry point
├── Views/
│   ├── ContentView.swift        # Main content router
│   ├── MainTabView.swift        # Global tab navigation
│   ├── Today/
│   │   └── TodayDashboardView.swift
│   ├── Activities/
│   │   └── ActivitiesView.swift
│   ├── History/
│   │   └── HistoryView.swift
│   ├── Profile/
│   │   └── ProfileView.swift
│   ├── Lifting/
│   │   ├── LiftingTabView.swift
│   │   ├── MesoView.swift
│   │   ├── PlansView.swift
│   │   ├── ExercisesView.swift
│   │   └── WorkoutView.swift
│   ├── Stretch/
│   │   └── StretchView.swift
│   └── Meditation/
│       └── MeditationView.swift
├── Models/
│   ├── Exercise.swift
│   ├── Plan.swift
│   ├── Mesocycle.swift
│   ├── Workout.swift
│   ├── StretchSession.swift
│   ├── MeditationSession.swift
│   └── CalendarActivity.swift
├── Components/
│   ├── StatusBadge.swift
│   ├── ActivityCard.swift
│   ├── SectionHeader.swift
│   ├── EmptyStateView.swift
│   └── LoadingView.swift
├── Theme/
│   └── Theme.swift              # Colors, spacing, styling
├── Services/
│   └── (API services - to be implemented)
└── Assets.xcassets/
```

## Features

### Currently Implemented (Placeholder UI)

- **Today Dashboard**: Overview of today's scheduled workout and quick access to activities
- **Activities**: Grid view of available activity types (Lifting, Stretch, Meditation)
- **History**: Calendar view with activity indicators and day detail sheets
- **Profile**: Statistics and settings

### Lifting Module
- **Mesocycle**: View active mesocycle, progress, and completed history
- **Plans**: Workout plan library with detail views
- **Exercises**: Exercise library with search and history
- **Workout**: Full workout tracking with sets, reps, weights, and rest timer

### Stretch Module
- Session setup with region selection
- Active stretching with timer and progress
- Session completion summary

### Meditation Module
- Duration selection (5, 10, 20 minutes)
- Breathing animation with inhale/hold/exhale phases
- Session completion tracking

## Theming

The app uses a dark blue-gray color palette matching the web app:

- Background: `#2c363d`
- Accent: `#6366f1` (Indigo)
- Activity Colors:
  - Lifting: Indigo
  - Stretch: Teal
  - Meditation: Purple

## Next Steps

1. **API Integration**: Connect to the backend API for data persistence
2. **Local Storage**: Implement UserDefaults/CoreData for offline support
3. **Push Notifications**: Rest timer and workout reminders
4. **Widgets**: iOS widgets for quick workout access
5. **Watch App**: Apple Watch companion for workout tracking
6. **App Icon**: Custom app icon design
