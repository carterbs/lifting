---
date: 2026-01-24
researcher: claude
git_commit: f08af3b
branch: main
topic: Meditation Feature - Architecture & Script Research
tags: [meditation, tts, audio, timer, feature-planning]
status: complete
---

# Research Question

How can we add a basic guided meditation feature (10 minutes of breathing) using the existing TTS and timing infrastructure from the stretching feature? What architectural patterns can be reused, and what scripts would create a natural, human-feel experience?

# Summary

The stretching feature provides an excellent foundation for meditation. It uses **Kokoro TTS** with the `af_heart` voice to generate natural-sounding narration at build time, a **timestamp-based timer system** that survives background tabs and page refreshes, and an **HTMLAudioElement** playback architecture that maintains audio sessions on mobile devices.

For meditation, we can reuse approximately 80% of the infrastructure:
- **TTS generation pipeline** - Same Python script pattern, same voice, same build integration
- **Audio playback system** - Same keepalive pattern, same MediaSession integration
- **Timer mechanics** - Same timestamp-based approach with 100ms polling
- **Storage patterns** - Same localStorage persistence and recovery

The key differences:
- **Segment structure** - Meditation uses a sequence of timed phases (intro, breathing cycles, outro) rather than two equal halves
- **Narration density** - More frequent audio cues (every breath cycle) vs. stretching's sparse cues (begin, halfway, switch)
- **No images** - Meditation is eyes-closed; no visual assets needed
- **Different pacing** - Longer pauses, gentler transitions

I've developed **12 complete meditation scripts** designed to feel like a real person guiding you, with natural phrasing, varied sentence structure, and appropriate pauses marked for TTS generation.

# Detailed Findings

## 1. Stretching Architecture Analysis

### TTS Generation Pipeline

**Entry point:** `scripts/generate-tts.py`

The pipeline:
1. Parses markdown files from `thoughts/shared/plans/stretching/*.md`
2. Extracts name/description pairs split by `----` delimiter
3. Generates WAV files using Kokoro TTS with `af_heart` voice at 1.0x speed
4. Outputs `stretches.json` manifest mapping stretches to audio files

**Key configuration:**
```python
VOICE = "af_heart"  # American female voice
SPEED = 1.0         # Normal playback speed
SAMPLE_RATE = 24000 # Hz
```

**For meditation:** We'd create a parallel `generate-meditation-tts.py` or extend the existing script with a meditation mode.

### Audio Playback Architecture

**File:** `packages/client/src/utils/stretchAudio.ts`

Key patterns:
- **Dual HTMLAudioElement architecture** - One for narration, one for keepalive
- **Keepalive loop** - Plays silent 1s audio on loop at 0.01 volume to maintain mobile audio session
- **MediaSession integration** - Lock screen controls and metadata display
- **Promise-wrapped playback** - Async/await friendly for sequencing

```typescript
// Singleton audio elements
let narrationAudio: HTMLAudioElement | null = null;
let keepaliveAudio: HTMLAudioElement | null = null;

// Keepalive runs continuously, paused during narration
export async function playNarration(clipPath: string): Promise<void> {
  pauseKeepalive();
  // ... play clip ...
  resumeKeepalive();
}
```

**For meditation:** Same architecture works perfectly. We'd create `meditationAudio.ts` with identical patterns but different metadata labels.

### Timer System

**File:** `packages/client/src/hooks/useStretchSession.ts`

Timestamp-based timing (not interval accumulation):
```typescript
const calculateRemaining = (): number => {
  const elapsed = Math.floor((Date.now() - state.segmentStartedAt) / 1000);
  return Math.max(0, segmentDuration - elapsed);
};
```

This survives:
- Background tab throttling
- Device sleep
- Page refresh (via localStorage recovery)

**For meditation:** Same approach, but with variable-duration phases instead of equal segments.

### Session State Machine

States: `'idle' | 'active' | 'paused' | 'complete'`

Transitions:
- `idle → active` on start (plays first narration)
- `active → paused` on pause (saves elapsed time)
- `paused → active` on resume (recalculates start timestamp)
- `active → complete` when all segments done (plays completion audio)

**For meditation:** Same state machine, different phase structure within `active`.

## 2. Meditation Feature Architecture

### Proposed Data Model

```typescript
// packages/shared/src/types/meditation.ts

type MeditationPhase = {
  type: 'intro' | 'breathing' | 'body-scan' | 'closing';
  durationSeconds: number;
  narrationCues: NarrationCue[];
};

type NarrationCue = {
  atSeconds: number;  // When to trigger (from phase start)
  audioFile: string;  // Relative path to WAV
};

type MeditationSession = {
  id: string;
  name: string;
  description: string;
  totalDurationSeconds: number;
  phases: MeditationPhase[];
};
```

### Proposed Phase Structure (10-minute session)

```
Phase 1: Introduction (60 seconds)
  - 0s: Welcome and setup instructions
  - 30s: Posture guidance

Phase 2: Breathing Cycles (480 seconds = 8 minutes)
  - Each cycle: ~20 seconds (4s inhale, 4s hold, 6s exhale, 6s pause)
  - 24 complete cycles
  - Periodic narration: every 4-6 cycles

Phase 3: Closing (60 seconds)
  - 0s: Transition cue
  - 30s: Gratitude/closing
```

### File Structure

```
packages/client/public/audio/meditation/
├── sessions/
│   └── basic-breathing/
│       ├── intro-welcome.wav
│       ├── intro-posture.wav
│       ├── breathing-settle.wav
│       ├── breathing-rhythm.wav
│       ├── breathing-reminder-1.wav
│       ├── breathing-reminder-2.wav
│       ├── breathing-reminder-3.wav
│       ├── closing-transition.wav
│       └── closing-gratitude.wav
├── shared/
│   ├── bell-start.wav
│   ├── bell-end.wav
│   └── silence-1s.wav
└── meditation.json
```

### Component Structure

```
packages/client/src/
├── pages/
│   └── MeditationPage.tsx
├── components/
│   └── Meditation/
│       ├── MeditationSetup.tsx
│       ├── MeditationSession.tsx
│       ├── MeditationComplete.tsx
│       └── MeditationSession.module.css
├── hooks/
│   ├── useMeditationSession.ts
│   └── useMeditationHistory.ts
└── utils/
    ├── meditationAudio.ts
    ├── meditationData.ts
    └── meditationStorage.ts
```

## 3. Meditation Scripts (12 Complete Scripts)

These scripts are designed for the `af_heart` voice with natural phrasing. Commas indicate slight pauses; periods indicate longer pauses. Text in `[brackets]` indicates timing notes.

### Script 1: Welcome & Setup

**File:** `intro-welcome.wav`
**Duration:** ~15 seconds

```
Welcome to your meditation practice. Find a comfortable position, either sitting or lying down. You can close your eyes whenever you're ready.
```

### Script 2: Posture Guidance

**File:** `intro-posture.wav`
**Duration:** ~20 seconds

```
Let your shoulders drop away from your ears. Rest your hands gently in your lap, or by your sides. There's nothing you need to do right now, except be here.
```

### Script 3: Initial Settling

**File:** `breathing-settle.wav`
**Duration:** ~25 seconds

```
Take a moment to notice how your body feels. You might feel the weight of your body against the surface beneath you. Let yourself settle into this moment. There's nowhere else you need to be.
```

### Script 4: Breathing Introduction

**File:** `breathing-rhythm.wav`
**Duration:** ~20 seconds

```
Now, gently bring your attention to your breath. Don't try to change it. Just notice the natural rhythm of breathing in, and breathing out.
```

### Script 5: Breathing Reminder (Variation 1)

**File:** `breathing-reminder-1.wav`
**Duration:** ~12 seconds

```
If your mind has wandered, that's completely normal. Gently guide your attention back to your breath.
```

### Script 6: Breathing Reminder (Variation 2)

**File:** `breathing-reminder-2.wav`
**Duration:** ~15 seconds

```
Notice the cool air as you breathe in, and the warm air as you breathe out. Each breath is an anchor to this present moment.
```

### Script 7: Breathing Reminder (Variation 3)

**File:** `breathing-reminder-3.wav`
**Duration:** ~12 seconds

```
Let each exhale carry away any tension you're holding. There's nothing to figure out right now.
```

### Script 8: Midpoint Check-in

**File:** `breathing-midpoint.wav`
**Duration:** ~18 seconds

```
You're doing beautifully. Continue following your breath, letting thoughts come and go like clouds passing through the sky.
```

### Script 9: Deepening Practice

**File:** `breathing-deepen.wav`
**Duration:** ~20 seconds

```
With each breath, allow yourself to sink a little deeper into relaxation. Your body knows how to rest. Trust it.
```

### Script 10: Pre-Closing Transition

**File:** `closing-transition.wav`
**Duration:** ~15 seconds

```
Begin to let go of focusing on your breath. Allow your awareness to gently expand outward.
```

### Script 11: Awakening

**File:** `closing-awakening.wav`
**Duration:** ~20 seconds

```
Start to bring gentle movement back to your body. Maybe wiggle your fingers or toes. Take your time. There's no rush.
```

### Script 12: Gratitude & Closing

**File:** `closing-gratitude.wav`
**Duration:** ~20 seconds

```
When you're ready, you can open your eyes. Thank you for taking this time for yourself. Carry this sense of calm with you as you continue your day.
```

## 4. Alternative Script Themes

For variety, we could generate multiple session types:

### Morning Energy Session
- Focus on energizing breath (shorter exhales)
- Language: "waking up", "preparing for the day", "bringing alertness"

### Evening Wind-Down Session
- Focus on relaxation breath (longer exhales)
- Language: "releasing the day", "letting go", "preparing for rest"

### Stress Relief Session
- Focus on deep breathing with extended holds
- Language: "tension melting", "finding your center", "calm within"

### Focus Session
- Shorter pauses, more frequent cues
- Language: "sharpening awareness", "present moment", "clarity"

## 5. Technical Implementation Details

### TTS Script Generation

Add to `scripts/generate-tts.py` or create `scripts/generate-meditation-tts.py`:

```python
MEDITATION_SCRIPTS = {
    "basic-breathing": {
        "intro-welcome": "Welcome to your meditation practice...",
        "intro-posture": "Let your shoulders drop away from your ears...",
        # ... rest of scripts
    }
}

def generate_meditation_audio():
    for session_id, scripts in MEDITATION_SCRIPTS.items():
        output_dir = OUTPUT_DIR / "sessions" / session_id
        output_dir.mkdir(parents=True, exist_ok=True)

        for script_name, text in scripts.items():
            output_path = output_dir / f"{script_name}.wav"
            generate_tts_clip(text, output_path)
```

### Session Hook Structure

```typescript
// hooks/useMeditationSession.ts

interface MeditationState {
  status: 'idle' | 'active' | 'paused' | 'complete';
  currentPhaseIndex: number;
  phaseStartedAt: number | null;
  pausedAt: number | null;
  pausedElapsed: number;
  nextCueIndex: number;
}

function useMeditationSession(session: MeditationSession) {
  const [state, setState] = useState<MeditationState>(initialState);

  // Timer effect - check for cue triggers
  useEffect(() => {
    if (state.status !== 'active') return;

    const interval = setInterval(() => {
      const elapsed = calculateElapsed();
      const currentPhase = session.phases[state.currentPhaseIndex];

      // Check for narration cue
      const cue = currentPhase.narrationCues[state.nextCueIndex];
      if (cue && elapsed >= cue.atSeconds) {
        playNarration(cue.audioFile);
        setState(prev => ({ ...prev, nextCueIndex: prev.nextCueIndex + 1 }));
      }

      // Check for phase completion
      if (elapsed >= currentPhase.durationSeconds) {
        advancePhase();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state.status, state.currentPhaseIndex, state.nextCueIndex]);
}
```

### UI Differences from Stretching

| Aspect | Stretching | Meditation |
|--------|-----------|------------|
| Visual focus | Stretch image, description | Minimal - just timer or nothing |
| Controls | Skip segment, skip stretch | Just pause/stop |
| Progress indicator | Progress bar per segment | Subtle phase indicator or none |
| Timer display | Countdown (30, 29, 28...) | Optional - some prefer no timer |
| Color scheme | Active, bright | Calm, muted, dark mode preferred |

### Suggested Meditation UI

```tsx
// MeditationSession.tsx

<div className={styles.container}>
  {/* Optional: very subtle phase indicator */}
  <div className={styles.phaseIndicator}>
    {phases.map((_, i) => (
      <div
        key={i}
        className={i <= currentPhaseIndex ? styles.filled : styles.empty}
      />
    ))}
  </div>

  {/* Optional: minimalist timer */}
  {showTimer && (
    <div className={styles.timer}>
      {formatTime(remaining)}
    </div>
  )}

  {/* Simple controls */}
  <div className={styles.controls}>
    <button onClick={isPaused ? resume : pause}>
      {isPaused ? 'Resume' : 'Pause'}
    </button>
    <button onClick={end}>End</button>
  </div>
</div>
```

## 6. Shared Infrastructure Reuse

### Components to Reuse (copy and adapt)
- `stretchAudio.ts` → `meditationAudio.ts` (minimal changes)
- `stretchStorage.ts` → `meditationStorage.ts` (same pattern)
- `SessionRecoveryPrompt.tsx` → Reuse directly or generalize
- Timer calculation logic from `useStretchSession.ts`

### Components to Create Fresh
- `MeditationPage.tsx` - Different setup flow
- `MeditationSession.tsx` - Different visual design
- `useMeditationSession.ts` - Different phase/cue structure
- Meditation scripts and TTS generation

### Build Pipeline Changes
- Extend `ensure-tts.sh` to check for both `stretches.json` and `meditation.json`
- Add meditation generation to `generate-tts.py` or create parallel script
- Update service worker to cache meditation audio

# Code References

| File | Lines | Description |
|------|-------|-------------|
| `scripts/generate-tts.py` | 27-29 | Voice configuration (`af_heart`, speed 1.0) |
| `scripts/generate-tts.py` | 170-217 | TTS clip generation function |
| `packages/client/src/utils/stretchAudio.ts` | 45-76 | Audio initialization pattern |
| `packages/client/src/utils/stretchAudio.ts` | 109-169 | Narration playback with Promise wrapping |
| `packages/client/src/utils/stretchAudio.ts` | 175-218 | Keepalive loop for mobile |
| `packages/client/src/hooks/useStretchSession.ts` | 128-138 | Timestamp-based timer calculation |
| `packages/client/src/hooks/useStretchSession.ts` | 557-571 | 100ms timer polling loop |
| `packages/client/src/utils/stretchStorage.ts` | 26-32 | State persistence pattern |
| `packages/shared/src/types/stretching.ts` | 62-70 | Session state interface |

# Architecture Insights

## Why HTMLAudioElement over Web Audio API
The stretching feature explicitly chose `HTMLAudioElement` because:
1. Web Audio API's `AudioContext` gets suspended on mobile when app backgrounds
2. `<audio>` elements integrate with OS media session
3. Enables lock screen controls via MediaSession API
4. Simpler API for sequential clip playback

This same choice applies to meditation - background audio during eyes-closed meditation is critical.

## Keepalive Pattern
The silent audio loop at 0.01 volume is a clever hack to maintain the audio session on iOS. Without it, the PWA would be killed after ~30 seconds of "silence" (between narration clips). Meditation has longer silent gaps, making this even more important.

## Timestamp-based Timing
Using `Date.now()` rather than accumulated intervals ensures accuracy across browser throttling, device sleep, and page refresh. For meditation, this means users can lock their phone and the session continues accurately.

## Build-time TTS Generation
Pre-generating audio at build time rather than runtime offers:
- No API costs or latency during user sessions
- Works offline
- Consistent quality
- No external dependencies at runtime

# Design Decisions

## Resolved Questions

1. **Bell sounds** - Use real recorded meditation bells from Freesound.org (CC0 license). See Bell Sound Options below.

2. **Breathing animation** - YES. Show expanding/contracting circle synced to breathing rhythm when screen is on.

3. **Timer visibility** - Show timer when screen is on. Timer provides useful feedback without causing anxiety in this context.

4. **Session durations** - Support 5, 10, and 20 minute variants. Each has different interjection density.

5. **Haptic feedback** - NO. Keep it simple, avoid platform-specific complexity.

6. **Random interjection timing** - YES. Phase 2 interjections should be randomly timed within windows to make each session feel different.

## Bell Sound Options (CC0 - No Attribution Required)

All from Freesound.org, public domain:

| Sound | Duration | Quality | URL |
|-------|----------|---------|-----|
| Singing Bowl Strike (inoshirodesign) | 6.3s | Excellent, stereo | https://freesound.org/people/inoshirodesign/sounds/271370/ |
| Bell Meditation (fauxpress) | 30.5s (trim to 3-5s) | Very good, 10k downloads | https://freesound.org/people/fauxpress/sounds/42095/ |
| Singing Bowl (zambolino) | 35.6s (trim to 3-5s) | Excellent, 24-bit stereo | https://freesound.org/people/zambolino/sounds/439235/ |

**Recommendation:** Download zambolino's Singing Bowl, trim to first 3-4 seconds for clean strike + initial resonance. Use for both start and end bells (or pitch-shift end bell slightly lower for variety).

## Data Tracking Requirements

For the parallel tracking feature, meditation sessions must capture:

```typescript
interface MeditationSessionRecord {
  id: string;                    // Server-generated UUID
  completedAt: string;           // ISO 8601 timestamp
  plannedDurationSeconds: number; // 300, 600, or 1200
  actualDurationSeconds: number;  // Wall-clock time from start to end
  sessionType: string;           // 'basic-breathing' etc.
  completedFully: boolean;       // Did they finish or end early?
}
```

This mirrors the stretching session tracking pattern in `packages/shared/src/types/stretching.ts:106-113`.

# Random Interjection System

## Design

Phase 2 interjections should NOT be at fixed times. Instead, define "windows" where an interjection can occur, and randomize within each window at session start.

```typescript
interface InterjectionWindow {
  earliestSeconds: number;  // Earliest this can trigger
  latestSeconds: number;    // Latest this can trigger
  audioFiles: string[];     // Pool to randomly select from
}

// Example for 10-minute session (480s breathing phase):
const windows: InterjectionWindow[] = [
  { earliestSeconds: 60, latestSeconds: 90, audioFiles: ['breathing-settle.wav'] },
  { earliestSeconds: 120, latestSeconds: 160, audioFiles: ['breathing-reminder-1.wav', 'breathing-reminder-2.wav', 'breathing-reminder-3.wav'] },
  { earliestSeconds: 200, latestSeconds: 250, audioFiles: ['breathing-midpoint.wav'] },
  { earliestSeconds: 300, latestSeconds: 360, audioFiles: ['breathing-reminder-1.wav', 'breathing-reminder-2.wav', 'breathing-reminder-3.wav'] },
  { earliestSeconds: 400, latestSeconds: 440, audioFiles: ['breathing-deepen.wav'] },
];
```

At session start, for each window:
1. Pick random time: `Math.random() * (latest - earliest) + earliest`
2. Pick random audio file from pool
3. Store as concrete `NarrationCue[]` for this session

This means:
- Same 10-minute session plays differently each time
- Interjections feel natural, not robotic
- Some variety in which reminder variation plays

## Duration Variants

| Duration | Intro | Breathing | Closing | Interjection Windows |
|----------|-------|-----------|---------|---------------------|
| 5 min    | 30s   | 240s (4m) | 30s     | 2 windows |
| 10 min   | 60s   | 480s (8m) | 60s     | 5 windows |
| 20 min   | 60s   | 1080s (18m) | 60s   | 8-10 windows |

Longer sessions get more interjections but still maintain randomness within windows.

# Open Questions

1. **Background audio** - Should we support playing user's own music/ambient sounds alongside narration? This adds significant complexity. (Defer to future version)

2. **Session variety** - Start with one session type ("Basic Breathing"). Add Morning/Evening/Focus variants later based on user feedback.
