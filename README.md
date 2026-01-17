# Lifting - Workout Tracker

A single-user weight training workout tracker with progressive overload.

## Development

```bash
npm install              # Install dependencies
npm run dev              # Start client (3000) + server (3001)
npm run test             # Run unit tests
npm run lint             # Run ESLint
npm run typecheck        # TypeScript check
npm run build            # Build all packages
```

## Docker

```bash
npm run docker:dev       # Development environment
npm run docker:down      # Stop containers
```

## Structure

- `packages/shared` - Shared types/utilities
- `packages/server` - Express API + SQLite
- `packages/client` - React + Radix UI
- `e2e` - Puppeteer tests
