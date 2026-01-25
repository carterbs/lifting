# Handoff: Guided Meditation Feature

**Date**: 2026-01-24
**Status**: In Progress - 50% complete (Phases 1-5 of 10 done)
**Branch**: `meditation-feature` (worktree at `../lifting-worktrees/meditation-feature`)
**Owner**: Transferred

---

## 1. Overview

### Primary Goal
Add a guided breathing meditation feature with 5/10/20-minute sessions, TTS narration, breathing animation, randomly-timed interjections, and session tracking.

### What Success Looks Like
- User navigates to `/meditation`, selects duration (5/10/20 min)
- Bell sounds, breathing animation begins, intro narration plays
- Timer counts down, interjections play at random times within predefined windows
- Session completes with closing narration, final bell, and session saved to history

---

## 2. Context & Decisions

### Problem Statement
The app has a stretching feature with TTS narration. Users want a calm, guided meditation feature with similar audio guidance but a different UX (continuous breathing, not segment-based like stretching).

### Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Separate TTS script | Created `generate-tts-meditation.py` | Cleaner than mixing meditation and stretching in one script |
| Synthesized bell sound | Generate via numpy instead of downloading | Avoids external dependency, simpler asset pipeline |
| No "skip" controls | Meditation only has pause/end | Meditation should be uninterrupted; different from stretching UX |
| Random interjection windows | Cues randomized at session start | Each session feels different; variety improves UX |
| Breathing animation via CSS | Pure CSS `@keyframes` | Smooth performance, works during background |

### Implementation Plan
Full plan: `/Users/bradcarter/Documents/Dev/lifting/thoughts/shared/plans/2026-01-24-guided-meditation.md`

---

## 3. Current State

### Completed (Phases 1-5)

| Phase | Status | Key Files |
|-------|--------|-----------|
| 1. TTS Generation | ✅ Done | `scripts/generate-tts-meditation.py`, `thoughts/shared/plans/meditation/basic-breathing.md` |
| 2. Types & Schemas | ✅ Done | `packages/shared/src/types/meditation.ts`, `packages/shared/src/schemas/meditation.schema.ts` |
| 3. Data Loader | ✅ Done | `packages/client/src/utils/meditationData.ts` |
| 4. Audio Engine | ✅ Done | `packages/client/src/utils/meditationAudio.ts` |
| 5. Session Hook | ✅ Done | `packages/client/src/hooks/useMeditationSession.ts`, `packages/client/src/utils/meditationStorage.ts` |

### In-Progress (Phases 6-8) - **INTERRUPTED HERE**

| Phase | Status | Notes |
|-------|--------|-------|
| 6. Setup Screen UI | 🔄 Not started | Duration selector component needed |
| 7. Session UI | 🔄 Not started | Timer, controls, phase display |
| 8. Breathing Animation | 🔄 Not started | CSS-animated circle component |

### Remaining (Phases 9-10)

| Phase | Status | Notes |
|-------|--------|-------|
| 9. Routing & Navigation | ⏳ Pending | `/meditation` route, page component |
| 10. History Persistence | ⏳ Pending | DB migration, API, React Query hooks |

### Commits Made
```
ba05f1b Add meditation session hook and storage utilities
b88e2b4 Add meditation data loader and audio playback engine
b12376c Add meditation types and TTS generation infrastructure
```

---

## 4. Technical Details

### File Locations (all in worktree)

**Shared Package:**
- Types: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/shared/src/types/meditation.ts`
- Schema: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/shared/src/schemas/meditation.schema.ts`

**Client Package:**
- Data loader: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/utils/meditationData.ts`
- Audio engine: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/utils/meditationAudio.ts`
- Storage: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/utils/meditationStorage.ts`
- Session hook: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/hooks/useMeditationSession.ts`

**Scripts:**
- TTS generation: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/scripts/generate-tts-meditation.py`
- TTS check: `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/scripts/ensure-tts.sh` (updated)

**Tests:**
- `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/utils/__tests__/meditationData.test.ts`
- `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/utils/__tests__/meditationAudio.test.ts`
- `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/utils/__tests__/meditationStorage.test.ts`
- `/Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature/packages/client/src/hooks/__tests__/useMeditationSession.test.tsx`

### Architecture Patterns

1. **Follow stretching feature patterns** - The meditation feature mirrors the stretching feature structure
2. **Timestamp-based timer** - Uses `Date.now()` for background tab support (like stretching)
3. **MediaSession integration** - Lock screen controls work via `mediaSession` API
4. **Cue scheduling** - Fixed cues + randomized interjection windows generate `ScheduledCue[]` at session start

### Key Type: `MeditationSessionState`
```typescript
interface MeditationSessionState {
  status: 'idle' | 'active' | 'paused' | 'complete';
  sessionType: string;           // 'basic-breathing'
  durationMinutes: 5 | 10 | 20;
  sessionStartedAt: number | null;
  pausedAt: number | null;
  pausedElapsed: number;
  scheduledCues: ScheduledCue[]; // Pre-randomized at start
  currentPhaseIndex: number;
}
```

### Testing
- All tests pass: `npm run typecheck && npm test -- --run packages/client/src/utils/__tests__/meditation*.test.ts packages/client/src/hooks/__tests__/useMeditationSession.test.tsx`
- 35 tests for data loader, 17 for audio engine, 12 for storage, 17 for session hook

---

## 5. Next Steps

### Immediate Actions (in order)

- [ ] **Phase 6: Create MeditationSetup.tsx** - Duration selector with 5/10/20 min buttons
  - Follow pattern from `StretchSetup.tsx` but simpler (no drag-drop, no regions)
  - Create `packages/client/src/components/Meditation/MeditationSetup.tsx`
  - Create matching `.module.css` file

- [ ] **Phase 8: Create BreathingCircle.tsx** - CSS animated breathing circle
  - Pure CSS `@keyframes` animation: 4s inhale, 2s hold, 6s exhale, 2s rest (14s total)
  - `isPaused` prop pauses animation via `animation-play-state: paused`
  - See plan lines 726-803 for exact CSS

- [ ] **Phase 7: Create MeditationSession.tsx** - Active session view
  - Timer countdown (MM:SS format)
  - BreathingCircle component
  - Pause/End buttons only (no skip controls)
  - Follow pattern from `StretchSession.tsx`

- [ ] **Phase 7: Create MeditationComplete.tsx** - Completion screen
  - Show duration completed, planned duration
  - "Done" button returns to setup

- [ ] **Phase 9: Add routing** - Wire up `/meditation` route
  - Create `MeditationPage.tsx` that switches between Setup/Session/Complete
  - Add route to `App.tsx`
  - Update navigation (bottom nav or menu)

- [ ] **Phase 10: Add history persistence** - DB + API
  - Migration: `CREATE TABLE meditation_sessions`
  - Repository: `meditationSession.repository.ts`
  - Routes: `POST /api/meditation-sessions`, `GET /api/meditation-sessions/latest`
  - React Query hooks

### Validation Gates
After each phase, run: `npm run typecheck && npm test`
After all phases: `npm run validate`

---

## 6. Gotchas & Non-Obvious Details

1. **Worktree workflow** - All changes must be in the worktree (`../lifting-worktrees/meditation-feature`), not main. See `CLAUDE.md` for merge instructions.

2. **TTS not generated yet** - The `generate-tts-meditation.py` script exists but hasn't been run (requires Python dependencies). The manifest will be generated on first build via `ensure-tts.sh`.

3. **Bell sound is synthesized** - The TTS script generates a sine-wave bell sound, not a downloaded sample.

4. **Breathing animation timing** - 14-second cycle (4s inhale + 2s hold + 6s exhale + 2s rest). Plan has exact CSS keyframe percentages.

5. **No skip controls** - Unlike stretching, meditation has no segment/stretch skip. Only pause and end.

6. **Test warnings** - The hook tests have some React `act()` warnings that are non-fatal.

---

## 7. References

- **Implementation Plan**: `/Users/bradcarter/Documents/Dev/lifting/thoughts/shared/plans/2026-01-24-guided-meditation.md` (full spec with manifest structure, phase details)
- **Research**: `/Users/bradcarter/Documents/Dev/lifting/thoughts/shared/research/2026-01-24-meditation-feature-research.md`
- **Stretching feature (pattern reference)**: `packages/client/src/components/Stretching/`
- **CLAUDE.md**: `/Users/bradcarter/Documents/Dev/lifting/CLAUDE.md` (worktree workflow, validation commands)

---

## Quick Resume Command

```bash
cd /Users/bradcarter/Documents/Dev/lifting-worktrees/meditation-feature
npm run typecheck  # Verify clean state
# Continue with Phase 6: MeditationSetup.tsx
```
