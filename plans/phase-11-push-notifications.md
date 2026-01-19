# Phase 11: Rest Timer Push Notifications

## Overview

Enable rest timer alerts that work when the iPhone screen is locked. User logs a set → locks phone → hears notification when rest is complete.

**Target Platform:** iPhone (iOS Safari PWA)

**iOS Constraints:**
- App must be installed via "Add to Home Screen" (PWA)
- User must grant notification permission
- Server-side push required (iOS kills service workers after ~30 seconds)

---

## Dependency Graph

```
Phase 1: PWA Foundation ─────────────────────────────────┐
  ├── 1.1 manifest.json                                  │
  ├── 1.2 App icons                                      │
  └── 1.3 HTML head updates                              │
                                                         │
Phase 2: Service Worker ─────────────────────────────────┤
  ├── 2.1 sw.js                                          │
  ├── 2.2 Registration utility                           │
  └── 2.3 Register on app start                          │
                                                         │
              ┌──────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│ Phase 3: Client Utilities   │     │ Phase 4: Server Push        │
│  (can run in parallel)      │     │  (can run in parallel)      │
├─────────────────────────────┤     ├─────────────────────────────┤
│ 3.1 notifications.ts        │     │ 4.1 Install web-push        │
│ 3.2 useNotificationPerm     │     │ 4.2 Generate VAPID keys     │
│ 3.3 Subscription persist    │     │ 4.3 Shared types            │
│ 3.4 PWA install detection   │     │ 4.4 Shared schemas          │
└─────────────┬───────────────┘     │ 4.5 Notification service    │
              │                     │ 4.6 Notification routes     │
              │                     │ 4.7 Register routes         │
              │                     │ 4.8 Export service          │
              │                     └─────────────┬───────────────┘
              │                                   │
              └─────────────┬─────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Phase 5: Timer Integration  │
              ├─────────────────────────────┤
              │ 5.1 timerNotifications.ts   │
              │ 5.2 NotificationPrompt      │
              │ 5.3 WorkoutView integration │
              │ 5.4 Error boundary          │
              │ 5.5 Settings UI             │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Phase 6: Testing            │
              │  (throughout all phases)    │
              └─────────────────────────────┘
```

**Parallelization opportunities:**
- Phase 3 and Phase 4 can be implemented in parallel after Phase 2
- Tests can be written alongside each phase

---

## Notification Content Specification

When a rest timer completes, the notification displays:

**Title:** `Rest Complete`

**Body:** `Time for {exerciseName} - Set {setNumber}`

**Example:** `Time for Bench Press - Set 3`

**Visual elements:**
- `icon`: `/icons/icon-192.png` (app icon)
- `badge`: `/icons/icon-192.png` (small monochrome badge on iOS)
- `tag`: `rest-timer` (constant - ensures only one notification at a time)
- `vibrate`: `[200, 100, 200]` (vibrate-pause-vibrate pattern)

**Behavior:**
- Only ONE rest timer notification can exist at a time
- Scheduling a new notification automatically cancels any pending one
- The `tag` is always `rest-timer` - this is intentional to prevent notification pile-up

---

## Phase 1: PWA Foundation

### 1.1 Create Web App Manifest

**File:** `packages/client/public/manifest.json`

**Key decisions:**
- `display: "standalone"` - Required for PWA behavior
- Use teal theme color (`#14b8a6`) to match app branding
- Background color should be dark (`#111113`) to match app theme

**Required manifest fields:**
- `name`, `short_name`, `description`
- `start_url: "/"`
- `display: "standalone"`
- `background_color`, `theme_color`
- `icons` array with 192x192 and 512x512 PNG icons

### 1.2 Create App Icons

**Files:**
- `packages/client/public/icons/icon-192.png`
- `packages/client/public/icons/icon-512.png`

**Design guidance:**
- Simple dumbbell/weight icon on dark background
- Match the teal accent color from the app
- Must be PNG format

### 1.3 Update HTML Head

**File:** `packages/client/index.html`

**Add to `<head>`:**
- Link to manifest.json
- `theme-color` meta tag
- Apple-specific PWA meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- Apple touch icon link

---

## Phase 2: Service Worker

### 2.1 Create Service Worker

**File:** `packages/client/public/sw.js`

**Must handle these events:**
- `push` - Receive push notification from server → display notification
- `notificationclick` - User taps notification → focus/open app

**Notification options to include:**
- `title`, `body`, `icon`, `badge`, `tag`
- `vibrate: [200, 100, 200]` for tactile feedback

### 2.2 Service Worker Registration Utility

**File:** `packages/client/src/utils/serviceWorker.ts`

**Pattern:** Follow `audio.ts` style (singleton, pure functions)

**Exports:**
- `registerServiceWorker()` - Returns `ServiceWorkerRegistration | null`
- `getServiceWorkerRegistration()` - Get cached registration

**Handle gracefully:** Browser doesn't support service workers

### 2.3 Register on App Start

**File:** `packages/client/src/main.tsx`

Register service worker at app startup (void the promise, don't block rendering).

---

## Phase 3: Notification Utilities

### 3.1 Core Notification Utilities

**File:** `packages/client/src/utils/notifications.ts`

**Pattern:** Follow `timerStorage.ts` style

**Type definition:**
```typescript
type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';
```

**Exports:**
- `getNotificationPermission()` - Get current permission state
- `requestNotificationPermission()` - Request permission from user
- `subscribeToPush(vapidPublicKey)` - Create push subscription

**Helper needed:** `urlBase64ToUint8Array()` for VAPID key conversion

### 3.2 Notification Permission Hook

**File:** `packages/client/src/hooks/useNotificationPermission.ts`

**Pattern:** Follow `useRestTimer.ts` style

**Return interface:**
- `permission` - Current permission state
- `isSupported` - Boolean for browser support
- `isGranted` - Boolean shorthand
- `canRequest` - Boolean (permission === 'default')
- `isDenied` - Boolean (permission === 'denied')
- `requestPermission()` - Async function to request

### 3.3 Subscription Persistence

**File:** `packages/client/src/utils/subscriptionStorage.ts`

**Pattern:** Follow `timerStorage.ts` style

**localStorage key:** `push-subscription`

**Exports:**
- `saveSubscription(subscription: PushSubscriptionJSON)` - Save to localStorage
- `getSubscription()` - Retrieve from localStorage
- `clearSubscription()` - Remove from localStorage

**Why:** Subscription survives page refresh without re-subscribing to push service.

### 3.4 PWA Install Detection

**File:** `packages/client/src/hooks/usePwaInstallStatus.ts`

**Exports:**
- `isInstalled` - Boolean, true if running in standalone mode
- `isIos` - Boolean, true if running on iOS
- `canInstall` - Boolean, true if iOS Safari but not installed

**Detection method:**
```typescript
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone === true;
```

**Use case:** Show install instructions banner when `canInstall` is true.

---

## Phase 4: Server-Side Push Notifications

### 4.1 Install Dependencies

Add `web-push` package to `packages/server`.

### 4.2 Generate VAPID Keys

Run `npx web-push generate-vapid-keys` and store in `.env`:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (mailto: URL, e.g., `mailto:brad@example.com`)

### 4.3 Shared Types

**File:** `packages/shared/src/types/notification.ts`

**Types needed:**
- `PushSubscriptionData` - endpoint, keys (p256dh, auth)
- `ScheduleNotificationInput` - subscription, delayMs, title, body, tag

### 4.4 Shared Schemas

**File:** `packages/shared/src/schemas/notification.schema.ts`

**Zod schemas:**
- `pushSubscriptionSchema` - Validate subscription structure
- `scheduleNotificationSchema` - Validate schedule input (max 10 min delay)
- `cancelNotificationSchema` - Validate cancel input (tag only)

### 4.5 Notification Service

**File:** `packages/server/src/services/notification.service.ts`

**Pattern:** Follow `workout.service.ts` style

**Architecture decision:** Use in-memory `Map<string, NodeJS.Timeout>` for pending notifications. This is fine for single-user app - no database persistence needed.

**Methods:**
- `constructor()` - Initialize web-push with VAPID details
- `getVapidPublicKey()` - Return public key from env
- `schedule(input)` - Set timeout, store by tag
- `cancel(tag)` - Clear timeout, remove from map
- `send(subscription, payload)` - Private, called when timeout fires

**Key behavior:** Scheduling with same tag cancels previous notification. There is only ever ONE pending rest timer notification.

### 4.6 Notification Routes

**File:** `packages/server/src/routes/notification.routes.ts`

**Pattern:** Follow `exercise.routes.ts` style

**Endpoints:**
- `GET /api/notifications/vapid-key` - Return public key (or 503 if not configured)
- `POST /api/notifications/schedule` - Schedule a notification
- `POST /api/notifications/cancel` - Cancel by tag

### 4.7 Register Routes

**File:** `packages/server/src/routes/index.ts`

Add notification router to API routes.

### 4.8 Export Service

**File:** `packages/server/src/services/index.ts`

Add lazy-initialized singleton getter for `NotificationService`.

---

## Phase 5: Timer Integration

### 5.1 Timer Notification Service

**File:** `packages/client/src/utils/timerNotifications.ts`

**Module state:**
- `currentSubscription: PushSubscription | null` (loaded from localStorage on init)

**Exports:**
- `initializeNotifications(vapidPublicKey)` - Subscribe to push, save to localStorage
- `scheduleTimerNotification(delayMs, exerciseName, setNumber)` - Call server
- `cancelTimerNotification()` - Call server to cancel `rest-timer` tag
- `getInitializationError()` - Returns last error message if init failed

**Tag:** Always use `rest-timer` as the tag. Only one notification at a time.

**Helper needed:** `arrayBufferToBase64()` for key encoding

### 5.2 Notification Permission Prompt Component

**File:** `packages/client/src/components/NotificationPrompt/NotificationPrompt.tsx`

**Pattern:** Use `AlertDialog` from Radix UI Themes (like delete confirmation dialogs)

**Props:**
- `open: boolean`
- `onClose: () => void`

**Behavior:**
- Fetch VAPID key on mount
- If `canRequest` and key available, show dialog
- "Enable" button requests permission, then initializes notifications
- "Not Now" just closes

### 5.3 Permission Denied Recovery UI

When permission is `denied`, show a help message explaining how to re-enable:

**File:** Add to Settings page (see 5.5)

**Message content:**
```
Notifications are blocked. To enable:
1. Open iOS Settings
2. Scroll down and tap "Lifting" (or your app name)
3. Tap "Notifications"
4. Toggle "Allow Notifications" on
```

### 5.4 Update WorkoutView Integration

**File:** `packages/client/src/components/Workout/WorkoutView.tsx`

**State additions:**
- `showNotificationPrompt: boolean`
- `hasAskedForNotificationsRef: React.MutableRefObject<boolean>`
- `notificationError: string | null`

**Integration points:**

1. **In `handleSetLogged`** (after `saveTimerState`):
   - Call `scheduleTimerNotification()` with rest duration
   - On first set, if permission is 'default', show prompt
   - If scheduling fails, set `notificationError`

2. **In `handleTimerDismiss`**:
   - Call `cancelTimerNotification()`

3. **When workout becomes disabled/ends**:
   - Call `cancelTimerNotification()`

4. **In render**:
   - Include `<NotificationPrompt />` component
   - Include `<NotificationErrorBoundary />` wrapper

### 5.5 Error Boundary & Error Display

**File:** `packages/client/src/components/NotificationError/NotificationError.tsx`

**Purpose:** Catch and display notification-related errors prominently.

**Error display style:**
- Red background, white text
- Fixed position at top of screen
- Shows raw error message (user is only user, wants to know why it broke)
- Dismissable with X button
- Auto-dismisses after 10 seconds

**Example error messages to display:**
- `"Push subscription failed: NotAllowedError"`
- `"Failed to schedule notification: 503 Service Unavailable"`
- `"Network error scheduling notification: Failed to fetch"`

**Do NOT silently swallow errors.** Make them obvious.

### 5.6 Settings UI

**File:** `packages/client/src/components/Settings/NotificationSettings.tsx`

**Location:** Add to existing Settings page/modal

**UI elements:**
- **Status indicator:** Shows current notification state
  - ✅ "Notifications enabled" (permission granted + subscription active)
  - ⚠️ "Not installed as app" (not running as PWA)
  - ❌ "Notifications blocked" (permission denied) + how-to-fix instructions
  - ⏸️ "Notifications not set up" (permission default) + Enable button
- **Enable button:** Visible when `canRequest` is true
- **Test button:** Sends a test notification (5 second delay) when enabled
- **PWA install banner:** Shows instructions when `canInstall` is true

**PWA Install Instructions (iOS):**
```
To enable lock-screen notifications:
1. Tap the Share button (□↑) in Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"
4. Open the app from your home screen
```

---

## Phase 6: Testing Strategy

### 6.1 Client Unit Tests

**Service Worker Registration** (`utils/__tests__/serviceWorker.test.ts`):
- Returns null if SW not supported
- Registers and returns registration
- Handles registration failure gracefully
- Caches registration for later retrieval

**Notification Utilities** (`utils/__tests__/notifications.test.ts`):
- Returns 'unsupported' when Notification API missing
- Returns correct permission state
- Only requests permission when state is 'default'
- Handles requestPermission rejection

**Subscription Storage** (`utils/__tests__/subscriptionStorage.test.ts`):
- Saves subscription to localStorage
- Retrieves subscription from localStorage
- Clears subscription from localStorage
- Handles missing/corrupt data gracefully

**Timer Notifications** (`utils/__tests__/timerNotifications.test.ts`):
- Doesn't schedule if permission not granted
- Doesn't schedule if no subscription
- Calls schedule API with correct payload when initialized
- Surfaces fetch errors (doesn't swallow them)
- Cancels with correct tag (`rest-timer`)
- Loads subscription from localStorage on init

**Permission Hook** (`hooks/__tests__/useNotificationPermission.test.tsx`):
- Returns correct initial state
- Correctly indicates supported/unsupported
- Updates permission after request
- Correctly reports `isDenied` state

**PWA Install Hook** (`hooks/__tests__/usePwaInstallStatus.test.tsx`):
- Detects standalone mode
- Detects iOS Safari
- Correctly computes `canInstall`

### 6.2 Server Unit Tests

**Notification Service** (`services/__tests__/notification.service.test.ts`):
- Sets VAPID details on construction
- Returns public key from env
- Sends notification after delay
- Cancels previous notification with same tag
- Handles send errors gracefully
- Cancel prevents scheduled notification

**Notification Routes** (`routes/__tests__/notification.routes.test.ts`):
- GET vapid-key returns key when configured
- GET vapid-key returns 503 when not configured
- POST schedule validates payload
- POST schedule rejects invalid delay
- POST cancel validates tag

### 6.3 E2E Tests

**File:** `e2e/tests/notifications.spec.ts`

**Test cases:**
- Service worker registers successfully
- Manifest loads correctly
- VAPID key endpoint available
- Schedule API called when set is logged (via request interception)
- Cancel API called when timer dismissed
- Error displays when schedule API fails

### 6.4 Pre-Flight Verification Script

**File:** `scripts/verify-notifications.ts`

Check all required files exist and contain expected content:
- manifest.json exists with `display: standalone`
- sw.js exists with push handler
- Icons exist
- index.html has required meta tags
- All service/route/utility files exist
- web-push in server dependencies
- Shared types/schemas exist

---

## File Summary

### New Files (18)
```
packages/client/
  public/
    manifest.json
    sw.js
    icons/icon-192.png
    icons/icon-512.png
  src/
    utils/serviceWorker.ts
    utils/notifications.ts
    utils/timerNotifications.ts
    utils/subscriptionStorage.ts
    hooks/useNotificationPermission.ts
    hooks/usePwaInstallStatus.ts
    components/NotificationPrompt/NotificationPrompt.tsx
    components/NotificationPrompt/index.ts
    components/NotificationError/NotificationError.tsx
    components/NotificationError/index.ts
    components/Settings/NotificationSettings.tsx

packages/server/
  src/
    services/notification.service.ts
    routes/notification.routes.ts

packages/shared/
  src/
    types/notification.ts
    schemas/notification.schema.ts
```

### Modified Files (7)
```
packages/client/
  index.html                              # Add PWA meta tags
  src/main.tsx                            # Register service worker
  src/components/Workout/WorkoutView.tsx  # Timer integration + error display
  src/components/Settings/Settings.tsx    # Add notification settings section

packages/server/
  src/services/index.ts                   # Export notification service
  src/routes/index.ts                     # Register notification routes
  package.json                            # Add web-push dependency

packages/shared/
  src/index.ts                            # Export notification types/schemas
```

---

## Verification Checklist

### PWA Setup
- [ ] App installable via "Add to Home Screen"
- [ ] App runs in standalone mode (no browser chrome)
- [ ] Service worker registers successfully
- [ ] Manifest loads without errors
- [ ] PWA install banner shows when running in Safari (not installed)

### Notification Flow
- [ ] VAPID keys generated and saved in .env
- [ ] Permission prompt appears on first set logged
- [ ] Permission can be granted
- [ ] Schedule API called when set is logged
- [ ] Cancel API called when timer is dismissed
- [ ] Notification appears when phone is locked (after rest complete)
- [ ] New set logged cancels previous pending notification

### Error Handling
- [ ] Errors display prominently (red banner at top)
- [ ] Error messages show raw details (not generic "something went wrong")
- [ ] Server handles missing VAPID config (503 response)
- [ ] Client displays network errors on schedule/cancel

### Settings UI
- [ ] Settings shows current notification status
- [ ] Enable button works when permission is 'default'
- [ ] Denied state shows iOS Settings instructions
- [ ] PWA install instructions show when not installed
- [ ] Test notification button works

---

## Known Limitations

- **iOS Silent Mode:** Notification may vibrate but not play sound
- **Focus Mode:** Notifications may be suppressed
- **PWA Required:** Browser tab won't receive push notifications
- **Server Must Be Running:** Push comes from server when timer expires

---

## Implementation Order

1. Phase 1: PWA Foundation (manifest, icons, HTML)
2. Phase 2: Service Worker (sw.js, registration utility)
3. Phase 3 & 4: Run in parallel
   - Phase 3: Client notification utilities
   - Phase 4: Server-side push
4. Phase 5: Timer Integration (depends on 3 & 4)
5. Phase 6: Testing (throughout)
