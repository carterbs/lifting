# brad-os

A personal operating system for tracking wellness and fitness. Built as a learning project that I actually use daily. Currently focused on workouts, stretching, and meditation—will expand as needed.

## Features

- **Workout Plans**: Build custom plans with exercises, sets, reps, and rest periods
- **Progressive Overload**: Automatic weight/rep progression across 6-week mesocycles
- **Stretch Routines**: Guided stretching sessions by body region
- **Meditation Timer**: Simple meditation with configurable duration
- **Activity Calendar**: Track all activities with visual history

## Architecture

- **iOS App**: Native SwiftUI app at `ios/BradOS/`
- **API Server**: Express + SQLite backend at `packages/server/`
- **Shared Types**: Common schemas/types at `packages/shared/`

## Development

```bash
npm install              # Install dependencies
npm run dev              # Start API server (port 3001)
npm run build            # Build all packages
npm run typecheck        # TypeScript compilation
npm run lint             # ESLint checks
npm run test             # Unit tests
```

## iOS App

```bash
# Build for simulator
xcodebuild -workspace ios/BradOS/BradOS.xcworkspace \
  -scheme BradOS \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  build
```

## Deployment

```bash
./scripts/deploy.sh      # Build + deploy API to remote server
```
