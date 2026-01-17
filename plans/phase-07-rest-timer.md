# Phase 7: Rest Timer (TDD)

## Overview

Build a rest timer feature that automatically starts after logging a set, counts up to the configured rest period, and plays a beep sound when complete. This phase follows a strict Test-Driven Development (TDD) approach.

## Requirements Summary

- After logging a set, timer automatically starts
- Timer counts UP to the configured rest period
- When timer reaches rest period, play a beep sound once
- Timer is visible during workout
- User can dismiss/reset timer
- Timer state persists in localStorage with workout state
- Timer uses `rest_seconds` from the exercise configuration

---

## Implementation Plan

### Step 1: Create Timer Hook with Unit Tests

**File:** `src/hooks/useRestTimer.ts`
**Test File:** `src/hooks/useRestTimer.test.ts`

#### 1.1 Write Tests First (RED)

```typescript
// src/hooks/useRestTimer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useRestTimer } from './useRestTimer';

describe('useRestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should start at 0 elapsed seconds', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));
      expect(result.current.elapsedSeconds).toBe(0);
    });

    it('should not be running initially', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));
      expect(result.current.isRunning).toBe(false);
    });

    it('should not be complete initially', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('timer counting', () => {
    it('should count up correctly when started', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.elapsedSeconds).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.elapsedSeconds).toBe(1);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(6);
    });

    it('should stop counting when target is reached', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 3 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(3);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('completion callback', () => {
    it('should fire onComplete callback when target is reached', () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() =>
        useRestTimer({ targetSeconds: 2, onComplete })
      );

      act(() => {
        result.current.start();
      });

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should not fire onComplete callback multiple times', () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() =>
        useRestTimer({ targetSeconds: 2, onComplete })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset functionality', () => {
    it('should reset elapsed time to 0', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.elapsedSeconds).toBe(10);

      act(() => {
        result.current.reset();
      });

      expect(result.current.elapsedSeconds).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('dismiss functionality', () => {
    it('should stop timer and mark as dismissed', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isDismissed).toBe(true);
    });

    it('should not continue counting after dismiss', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const elapsedAtDismiss = result.current.elapsedSeconds;

      act(() => {
        result.current.dismiss();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(elapsedAtDismiss);
    });
  });

  describe('pause and resume', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.elapsedSeconds).toBe(5);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedSeconds).toBe(5);
    });

    it('should resume the timer from paused state', () => {
      const { result } = renderHook(() => useRestTimer({ targetSeconds: 60 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.elapsedSeconds).toBe(8);
    });
  });
});
```

#### 1.2 Implement Hook (GREEN)

```typescript
// src/hooks/useRestTimer.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseRestTimerOptions {
  targetSeconds: number;
  onComplete?: () => void;
}

interface UseRestTimerReturn {
  elapsedSeconds: number;
  targetSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
  isDismissed: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  dismiss: () => void;
}

export function useRestTimer({
  targetSeconds,
  onComplete,
}: UseRestTimerOptions): UseRestTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteCalledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isDismissed || isComplete) return;
    setIsRunning(true);
  }, [isDismissed, isComplete]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsComplete(false);
    setIsDismissed(false);
    onCompleteCalledRef.current = false;
  }, [clearTimer]);

  const dismiss = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsDismissed(true);
  }, [clearTimer]);

  useEffect(() => {
    if (isRunning && !isComplete) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= targetSeconds) {
            setIsComplete(true);
            setIsRunning(false);
            if (!onCompleteCalledRef.current) {
              onCompleteCalledRef.current = true;
              onComplete?.();
            }
            return targetSeconds;
          }
          return next;
        });
      }, 1000);
    }

    return clearTimer;
  }, [isRunning, isComplete, targetSeconds, onComplete, clearTimer]);

  return {
    elapsedSeconds,
    targetSeconds,
    isRunning,
    isComplete,
    isDismissed,
    start,
    pause,
    reset,
    dismiss,
  };
}
```

#### 1.3 Refactor (REFACTOR)

- Extract timer state interface to a shared types file
- Ensure all edge cases are handled
- Add JSDoc comments for public API

---

### Step 2: Create Audio Utility with Unit Tests

**File:** `src/utils/audio.ts`
**Test File:** `src/utils/audio.test.ts`

#### 2.1 Write Tests First (RED)

```typescript
// src/utils/audio.test.ts
import { playBeep, createBeepSound } from './audio';

describe('audio utilities', () => {
  let mockAudioContext: {
    createOscillator: jest.Mock;
    createGain: jest.Mock;
    destination: object;
    currentTime: number;
  };
  let mockOscillator: {
    connect: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
    frequency: { setValueAtTime: jest.Mock };
    type: string;
  };
  let mockGainNode: {
    connect: jest.Mock;
    gain: {
      setValueAtTime: jest.Mock;
      exponentialRampToValueAtTime: jest.Mock;
    };
  };

  beforeEach(() => {
    mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { setValueAtTime: jest.fn() },
      type: 'sine',
    };

    mockGainNode = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockAudioContext = {
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGainNode),
      destination: {},
      currentTime: 0,
    };

    // Mock the AudioContext constructor
    global.AudioContext = jest.fn(
      () => mockAudioContext
    ) as unknown as typeof AudioContext;
    global.webkitAudioContext = jest.fn(
      () => mockAudioContext
    ) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createBeepSound', () => {
    it('should create an AudioContext', () => {
      createBeepSound();
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('should create an oscillator with correct frequency', () => {
      createBeepSound({ frequency: 880 });
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        880,
        0
      );
    });

    it('should use default frequency of 440Hz', () => {
      createBeepSound();
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        440,
        0
      );
    });

    it('should set oscillator type to sine by default', () => {
      createBeepSound();
      expect(mockOscillator.type).toBe('sine');
    });
  });

  describe('playBeep', () => {
    it('should start and stop the oscillator', async () => {
      await playBeep();
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('should connect oscillator to gain node', async () => {
      await playBeep();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
    });

    it('should connect gain node to destination', async () => {
      await playBeep();
      expect(mockGainNode.connect).toHaveBeenCalledWith(
        mockAudioContext.destination
      );
    });

    it('should handle missing AudioContext gracefully', async () => {
      // @ts-expect-error - Testing missing AudioContext
      delete global.AudioContext;
      // @ts-expect-error - Testing missing webkitAudioContext
      delete global.webkitAudioContext;

      // Should not throw
      await expect(playBeep()).resolves.not.toThrow();
    });
  });
});
```

#### 2.2 Implement Audio Utility (GREEN)

```typescript
// src/utils/audio.ts

interface BeepOptions {
  frequency?: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
}

const DEFAULT_OPTIONS: Required<BeepOptions> = {
  frequency: 440, // A4 note
  duration: 200, // milliseconds
  volume: 0.5,
  type: 'sine',
};

export function createBeepSound(
  options: BeepOptions = {}
): AudioContext | null {
  const AudioContextClass =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof webkitAudioContext !== 'undefined'
        ? webkitAudioContext
        : null;

  if (!AudioContextClass) {
    console.warn('Web Audio API is not supported in this browser');
    return null;
  }

  const audioContext = new AudioContextClass();
  const { frequency } = { ...DEFAULT_OPTIONS, ...options };

  const oscillator = audioContext.createOscillator();
  oscillator.type = options.type ?? DEFAULT_OPTIONS.type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  return audioContext;
}

export async function playBeep(options: BeepOptions = {}): Promise<void> {
  const AudioContextClass =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof webkitAudioContext !== 'undefined'
        ? webkitAudioContext
        : null;

  if (!AudioContextClass) {
    console.warn('Web Audio API is not supported in this browser');
    return;
  }

  const { frequency, duration, volume, type } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const audioContext = new AudioContextClass();

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration / 1000
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Dual-tone beep for more pleasant sound
export async function playRestCompleteBeep(): Promise<void> {
  await playBeep({ frequency: 523.25, duration: 150, volume: 0.4 }); // C5
  await new Promise((resolve) => setTimeout(resolve, 100));
  await playBeep({ frequency: 659.25, duration: 200, volume: 0.4 }); // E5
}
```

---

### Step 3: Create RestTimer Component with Unit Tests

**File:** `src/components/RestTimer/RestTimer.tsx`
**Test File:** `src/components/RestTimer/RestTimer.test.tsx`

#### 3.1 Write Tests First (RED)

```typescript
// src/components/RestTimer/RestTimer.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RestTimer } from './RestTimer';

// Mock the audio module
jest.mock('../../utils/audio', () => ({
  playRestCompleteBeep: jest.fn(),
}));

describe('RestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('display', () => {
    it('should display elapsed time in MM:SS format', () => {
      render(<RestTimer targetSeconds={60} isActive={true} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should display target rest time', () => {
      render(<RestTimer targetSeconds={90} isActive={true} />);
      expect(screen.getByText(/1:30/)).toBeInTheDocument();
    });

    it('should update elapsed time as timer runs', () => {
      render(<RestTimer targetSeconds={60} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('00:05')).toBeInTheDocument();
    });

    it('should show minutes and seconds correctly', () => {
      render(<RestTimer targetSeconds={120} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(75000);
      });

      expect(screen.getByText('01:15')).toBeInTheDocument();
    });
  });

  describe('completion state', () => {
    it('should show visual indicator when rest is complete', () => {
      render(<RestTimer targetSeconds={5} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId('rest-complete-indicator')).toBeInTheDocument();
    });

    it('should display "Rest Complete" text when timer finishes', () => {
      render(<RestTimer targetSeconds={5} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/rest complete/i)).toBeInTheDocument();
    });
  });

  describe('dismiss button', () => {
    it('should render dismiss button', () => {
      render(<RestTimer targetSeconds={60} isActive={true} />);
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      render(<RestTimer targetSeconds={60} isActive={true} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should stop timer when dismissed', () => {
      render(<RestTimer targetSeconds={60} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Timer should still show 5 seconds, not 10
      expect(screen.getByText('00:05')).toBeInTheDocument();
    });
  });

  describe('reset functionality', () => {
    it('should render reset button when timer is running', () => {
      render(<RestTimer targetSeconds={60} isActive={true} showReset={true} />);
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should reset timer to 0 when reset button is clicked', () => {
      render(<RestTimer targetSeconds={60} isActive={true} showReset={true} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText('00:10')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /reset/i }));

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('inactive state', () => {
    it('should not render when isActive is false', () => {
      const { container } = render(<RestTimer targetSeconds={60} isActive={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('audio', () => {
    it('should play beep sound when timer completes', async () => {
      const { playRestCompleteBeep } = await import('../../utils/audio');

      render(<RestTimer targetSeconds={3} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(playRestCompleteBeep).toHaveBeenCalledTimes(1);
    });

    it('should not play beep sound if muted', async () => {
      const { playRestCompleteBeep } = await import('../../utils/audio');

      render(<RestTimer targetSeconds={3} isActive={true} muted={true} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(playRestCompleteBeep).not.toHaveBeenCalled();
    });
  });

  describe('progress indicator', () => {
    it('should show progress bar', () => {
      render(<RestTimer targetSeconds={60} isActive={true} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should update progress as timer runs', () => {
      render(<RestTimer targetSeconds={100} isActive={true} />);

      act(() => {
        jest.advanceTimersByTime(50000);
      });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });
  });
});
```

#### 3.2 Implement RestTimer Component (GREEN)

```typescript
// src/components/RestTimer/RestTimer.tsx
import { useCallback } from 'react';
import { useRestTimer } from '../../hooks/useRestTimer';
import { playRestCompleteBeep } from '../../utils/audio';
import styles from './RestTimer.module.css';

interface RestTimerProps {
  targetSeconds: number;
  isActive: boolean;
  muted?: boolean;
  showReset?: boolean;
  onDismiss?: () => void;
  onComplete?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTargetTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return secs === 0 ? `${mins}:00` : `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RestTimer({
  targetSeconds,
  isActive,
  muted = false,
  showReset = false,
  onDismiss,
  onComplete,
}: RestTimerProps): JSX.Element | null {
  const handleComplete = useCallback(() => {
    if (!muted) {
      playRestCompleteBeep();
    }
    onComplete?.();
  }, [muted, onComplete]);

  const {
    elapsedSeconds,
    isRunning,
    isComplete,
    isDismissed,
    start,
    reset,
    dismiss,
  } = useRestTimer({
    targetSeconds,
    onComplete: handleComplete,
  });

  // Auto-start when active
  if (isActive && !isRunning && !isComplete && !isDismissed) {
    start();
  }

  if (!isActive) {
    return null;
  }

  const progress = Math.min((elapsedSeconds / targetSeconds) * 100, 100);

  const handleDismiss = () => {
    dismiss();
    onDismiss?.();
  };

  const handleReset = () => {
    reset();
    start();
  };

  return (
    <div
      className={`${styles.container} ${isComplete ? styles.complete : ''}`}
      role="timer"
      aria-label="Rest timer"
    >
      <div className={styles.timeDisplay}>
        <span className={styles.elapsed}>{formatTime(elapsedSeconds)}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.target}>{formatTargetTime(targetSeconds)}</span>
      </div>

      <div
        className={styles.progressContainer}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${styles.progressBar} ${isComplete ? styles.progressComplete : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isComplete && (
        <div
          className={styles.completeIndicator}
          data-testid="rest-complete-indicator"
        >
          Rest Complete
        </div>
      )}

      <div className={styles.controls}>
        {showReset && (
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
            aria-label="Reset timer"
          >
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className={styles.dismissButton}
          aria-label="Dismiss timer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
```

#### 3.3 Create Styles

```css
/* src/components/RestTimer/RestTimer.module.css */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background-color: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.container.complete {
  background-color: var(--color-success-light);
}

.timeDisplay {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.elapsed {
  font-size: 2rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.separator {
  font-size: 1.5rem;
  color: var(--color-text-secondary);
}

.target {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
}

.progressContainer {
  width: 100%;
  height: 8px;
  background-color: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progressBar {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 1s linear;
}

.progressComplete {
  background-color: var(--color-success);
}

.completeIndicator {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-success);
  margin-bottom: 12px;
}

.controls {
  display: flex;
  gap: 8px;
}

.resetButton,
.dismissButton {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.resetButton {
  background-color: var(--color-surface-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.resetButton:hover {
  background-color: var(--color-surface-hover);
}

.dismissButton {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.dismissButton:hover {
  background-color: var(--color-primary-dark);
}
```

---

### Step 4: Create Timer State Persistence with Unit Tests

**File:** `src/utils/timerStorage.ts`
**Test File:** `src/utils/timerStorage.test.ts`

#### 4.1 Write Tests First (RED)

```typescript
// src/utils/timerStorage.test.ts
import {
  saveTimerState,
  loadTimerState,
  clearTimerState,
  TimerState,
} from './timerStorage';

describe('timerStorage', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key) => mockStorage[key] || null);
    jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key, value) => {
        mockStorage[key] = value;
      });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockStorage[key];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveTimerState', () => {
    it('should save timer state to localStorage', () => {
      const state: TimerState = {
        startedAt: Date.now(),
        targetSeconds: 60,
        exerciseId: 'exercise-123',
        setIndex: 2,
      };

      saveTimerState(state);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'rest-timer-state',
        JSON.stringify(state)
      );
    });
  });

  describe('loadTimerState', () => {
    it('should load timer state from localStorage', () => {
      const state: TimerState = {
        startedAt: Date.now(),
        targetSeconds: 60,
        exerciseId: 'exercise-123',
        setIndex: 2,
      };

      mockStorage['rest-timer-state'] = JSON.stringify(state);

      const loaded = loadTimerState();

      expect(loaded).toEqual(state);
    });

    it('should return null when no state exists', () => {
      const loaded = loadTimerState();
      expect(loaded).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      mockStorage['rest-timer-state'] = 'invalid-json';

      const loaded = loadTimerState();

      expect(loaded).toBeNull();
    });

    it('should calculate elapsed time from startedAt', () => {
      const startedAt = Date.now() - 30000; // 30 seconds ago
      const state: TimerState = {
        startedAt,
        targetSeconds: 60,
        exerciseId: 'exercise-123',
        setIndex: 2,
      };

      mockStorage['rest-timer-state'] = JSON.stringify(state);

      const loaded = loadTimerState();

      expect(loaded).not.toBeNull();
      // The elapsed time should be approximately 30 seconds
      const elapsed = Math.floor((Date.now() - loaded!.startedAt) / 1000);
      expect(elapsed).toBeGreaterThanOrEqual(29);
      expect(elapsed).toBeLessThanOrEqual(31);
    });
  });

  describe('clearTimerState', () => {
    it('should remove timer state from localStorage', () => {
      mockStorage['rest-timer-state'] = JSON.stringify({
        startedAt: Date.now(),
        targetSeconds: 60,
        exerciseId: 'exercise-123',
        setIndex: 2,
      });

      clearTimerState();

      expect(localStorage.removeItem).toHaveBeenCalledWith('rest-timer-state');
    });
  });
});
```

#### 4.2 Implement Timer Storage (GREEN)

```typescript
// src/utils/timerStorage.ts
const STORAGE_KEY = 'rest-timer-state';

export interface TimerState {
  startedAt: number;
  targetSeconds: number;
  exerciseId: string;
  setIndex: number;
}

export function saveTimerState(state: TimerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save timer state:', error);
  }
}

export function loadTimerState(): TimerState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as TimerState;
  } catch (error) {
    console.error('Failed to load timer state:', error);
    return null;
  }
}

export function clearTimerState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear timer state:', error);
  }
}

export function calculateElapsedSeconds(startedAt: number): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}
```

---

### Step 5: Integrate Timer with Workout Tracking

**File:** `src/components/WorkoutTracker/WorkoutTracker.tsx` (modifications)
**Test File:** `src/components/WorkoutTracker/WorkoutTracker.test.tsx` (additions)

#### 5.1 Add Integration Tests

```typescript
// Add to WorkoutTracker.test.tsx
describe('RestTimer integration', () => {
  it('should start rest timer after logging a set', async () => {
    render(<WorkoutTracker workout={mockWorkout} />);

    // Find and click the log set button
    const logSetButton = screen.getAllByRole('button', { name: /log set/i })[0];
    fireEvent.click(logSetButton);

    // Verify timer appears
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('should use rest_seconds from exercise configuration', async () => {
    const workoutWithCustomRest = {
      ...mockWorkout,
      exercises: [
        {
          ...mockWorkout.exercises[0],
          rest_seconds: 90,
        },
      ],
    };

    render(<WorkoutTracker workout={workoutWithCustomRest} />);

    const logSetButton = screen.getAllByRole('button', { name: /log set/i })[0];
    fireEvent.click(logSetButton);

    // Verify timer shows correct target time
    expect(screen.getByText(/1:30/)).toBeInTheDocument();
  });

  it('should dismiss timer when user clicks dismiss', async () => {
    render(<WorkoutTracker workout={mockWorkout} />);

    const logSetButton = screen.getAllByRole('button', { name: /log set/i })[0];
    fireEvent.click(logSetButton);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('should persist timer state to localStorage', async () => {
    render(<WorkoutTracker workout={mockWorkout} />);

    const logSetButton = screen.getAllByRole('button', { name: /log set/i })[0];
    fireEvent.click(logSetButton);

    // Verify localStorage was called
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'rest-timer-state',
      expect.any(String)
    );
  });

  it('should restore timer from localStorage on mount', async () => {
    const savedState = {
      startedAt: Date.now() - 10000, // 10 seconds ago
      targetSeconds: 60,
      exerciseId: mockWorkout.exercises[0].id,
      setIndex: 0,
    };

    mockStorage['rest-timer-state'] = JSON.stringify(savedState);

    render(<WorkoutTracker workout={mockWorkout} />);

    // Timer should be visible with ~10 seconds elapsed
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByText(/00:1\d/)).toBeInTheDocument(); // 10-19 seconds
  });
});
```

#### 5.2 Implement Integration

```typescript
// WorkoutTracker.tsx modifications
import { RestTimer } from '../RestTimer/RestTimer';
import {
  saveTimerState,
  loadTimerState,
  clearTimerState,
  calculateElapsedSeconds,
} from '../../utils/timerStorage';

// Inside WorkoutTracker component:
const [activeTimer, setActiveTimer] = useState<{
  exerciseId: string;
  setIndex: number;
  targetSeconds: number;
  initialElapsed: number;
} | null>(null);

// On mount, restore timer state
useEffect(() => {
  const savedState = loadTimerState();
  if (savedState) {
    const elapsed = calculateElapsedSeconds(savedState.startedAt);
    if (elapsed < savedState.targetSeconds) {
      setActiveTimer({
        exerciseId: savedState.exerciseId,
        setIndex: savedState.setIndex,
        targetSeconds: savedState.targetSeconds,
        initialElapsed: elapsed,
      });
    } else {
      clearTimerState();
    }
  }
}, []);

// When logging a set:
const handleLogSet = (exerciseId: string, setIndex: number) => {
  // ... existing set logging logic ...

  const exercise = workout.exercises.find((e) => e.id === exerciseId);
  if (exercise) {
    const timerState = {
      startedAt: Date.now(),
      targetSeconds: exercise.rest_seconds,
      exerciseId,
      setIndex,
    };
    saveTimerState(timerState);
    setActiveTimer({
      ...timerState,
      initialElapsed: 0,
    });
  }
};

// Timer dismiss handler:
const handleTimerDismiss = () => {
  clearTimerState();
  setActiveTimer(null);
};

// In render:
{activeTimer && (
  <RestTimer
    targetSeconds={activeTimer.targetSeconds}
    initialElapsed={activeTimer.initialElapsed}
    isActive={true}
    onDismiss={handleTimerDismiss}
  />
)}
```

---

### Step 6: E2E Tests

**File:** `e2e/rest-timer.spec.ts`

```typescript
// e2e/rest-timer.spec.ts
import { test, expect } from '@playwright/test';
import { setupWorkoutInProgress } from './helpers/workout-setup';

test.describe('Rest Timer', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a workout in progress
    await setupWorkoutInProgress(page, {
      exercises: [
        {
          id: 'bench-press',
          name: 'Bench Press',
          sets: 3,
          reps: 8,
          weight: 135,
          rest_seconds: 60,
        },
      ],
    });
  });

  test('should start timer after logging a set', async ({ page }) => {
    // Find the first set's log button
    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    // Verify timer appears
    const timer = page.getByRole('timer');
    await expect(timer).toBeVisible();

    // Verify timer shows 00:00 initially
    await expect(page.getByText('00:00')).toBeVisible();
  });

  test('should count up to target time', async ({ page }) => {
    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    // Wait a few seconds
    await page.waitForTimeout(3000);

    // Verify timer has counted up
    await expect(page.getByText('00:03')).toBeVisible();
  });

  test('should show completion state when timer reaches target', async ({
    page,
  }) => {
    // Use a short rest time for faster test
    await setupWorkoutInProgress(page, {
      exercises: [
        {
          id: 'quick-exercise',
          name: 'Quick Exercise',
          sets: 1,
          reps: 10,
          weight: 50,
          rest_seconds: 3, // 3 second rest for testing
        },
      ],
    });

    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    // Wait for timer to complete
    await page.waitForTimeout(4000);

    // Verify completion indicator
    await expect(page.getByTestId('rest-complete-indicator')).toBeVisible();
    await expect(page.getByText(/rest complete/i)).toBeVisible();
  });

  test('should dismiss timer when dismiss button is clicked', async ({
    page,
  }) => {
    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    await expect(page.getByRole('timer')).toBeVisible();

    const dismissButton = page.getByRole('button', { name: /dismiss/i });
    await dismissButton.click();

    await expect(page.getByRole('timer')).not.toBeVisible();
  });

  test('should persist timer across page reload', async ({ page }) => {
    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    // Wait a bit
    await page.waitForTimeout(2000);

    // Reload the page
    await page.reload();

    // Timer should still be visible with approximately the right time
    const timer = page.getByRole('timer');
    await expect(timer).toBeVisible();

    // The elapsed time should be around 2-3 seconds
    // (allowing for some timing variance)
    const timerText = await page.getByText(/00:0[2-5]/).first();
    await expect(timerText).toBeVisible();
  });

  test('should use rest_seconds from exercise configuration', async ({
    page,
  }) => {
    await setupWorkoutInProgress(page, {
      exercises: [
        {
          id: 'long-rest-exercise',
          name: 'Heavy Squats',
          sets: 3,
          reps: 5,
          weight: 225,
          rest_seconds: 180, // 3 minutes
        },
      ],
    });

    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    // Verify timer shows correct target (3:00)
    await expect(page.getByText(/3:00/)).toBeVisible();
  });

  test('should play audio on timer completion (verify no errors)', async ({
    page,
  }) => {
    // Note: We can't easily verify audio played, but we can verify no errors occur
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await setupWorkoutInProgress(page, {
      exercises: [
        {
          id: 'audio-test',
          name: 'Audio Test Exercise',
          sets: 1,
          reps: 1,
          weight: 10,
          rest_seconds: 2,
        },
      ],
    });

    const logSetButton = page.getByRole('button', { name: /log set/i }).first();
    await logSetButton.click();

    // Wait for timer to complete
    await page.waitForTimeout(3000);

    // Verify no JavaScript errors related to audio
    const audioErrors = errors.filter(
      (e) => e.includes('Audio') || e.includes('audio')
    );
    expect(audioErrors).toHaveLength(0);
  });
});
```

---

## File Structure

```
src/
├── components/
│   └── RestTimer/
│       ├── RestTimer.tsx
│       ├── RestTimer.test.tsx
│       ├── RestTimer.module.css
│       └── index.ts
├── hooks/
│   ├── useRestTimer.ts
│   └── useRestTimer.test.ts
├── utils/
│   ├── audio.ts
│   ├── audio.test.ts
│   ├── timerStorage.ts
│   └── timerStorage.test.ts
e2e/
└── rest-timer.spec.ts
```

---

## Success Criteria

### Unit Tests (must pass before integration)

- [ ] `useRestTimer` hook starts at 0 elapsed seconds
- [ ] `useRestTimer` hook counts up correctly (1 second per second)
- [ ] `useRestTimer` hook fires `onComplete` callback exactly once when target is reached
- [ ] `useRestTimer` hook stops counting at target (does not overflow)
- [ ] `useRestTimer` hook can be reset (elapsed returns to 0, isComplete resets)
- [ ] `useRestTimer` hook can be dismissed (stops running, marked as dismissed)
- [ ] `useRestTimer` hook can be paused and resumed
- [ ] `playBeep` creates audio context and plays sound
- [ ] `playBeep` handles missing AudioContext gracefully
- [ ] `saveTimerState` persists to localStorage
- [ ] `loadTimerState` retrieves from localStorage
- [ ] `loadTimerState` returns null for invalid/missing data
- [ ] `clearTimerState` removes from localStorage
- [ ] `RestTimer` component displays elapsed time in MM:SS format
- [ ] `RestTimer` component displays target rest time
- [ ] `RestTimer` component shows completion indicator when done
- [ ] `RestTimer` component dismiss button works
- [ ] `RestTimer` component reset button works
- [ ] `RestTimer` component plays beep on completion (unless muted)
- [ ] `RestTimer` component shows progress bar with correct percentage

### Integration Tests

- [ ] Timer starts automatically after logging a set
- [ ] Timer uses `rest_seconds` from exercise configuration
- [ ] Timer state persists to localStorage
- [ ] Timer state restores on page reload (during same workout)
- [ ] Timer clears when dismissed

### E2E Tests

- [ ] Log a set and verify timer appears
- [ ] Timer counts up correctly over time
- [ ] Timer shows completion state when target reached
- [ ] Dismiss button hides timer
- [ ] Timer persists across page reload
- [ ] Exercise-specific rest times are respected
- [ ] No audio-related JavaScript errors on completion

### Functional Requirements

- [ ] Timer is visible during workout (positioned appropriately in UI)
- [ ] Timer counts UP (not down)
- [ ] Beep plays exactly once when timer reaches target
- [ ] User can dismiss timer at any time
- [ ] User can reset timer to start over
- [ ] Timer auto-starts after logging any set
- [ ] Timer uses exercise-specific rest period configuration

---

## Commit Message

```
feat(rest-timer): add rest timer with TDD implementation

Implement rest timer feature that automatically starts after logging
a set, counts up to the configured rest period, and plays a beep
sound when complete.

Features:
- useRestTimer hook with start, pause, reset, dismiss controls
- RestTimer component with progress bar and completion state
- Web Audio API integration for completion beep sound
- localStorage persistence for timer state across page reloads
- Integration with workout tracker to auto-start on set log

TDD approach with comprehensive unit tests for:
- Timer counting and state management
- Audio playback utilities
- localStorage persistence
- Component rendering and interactions

E2E tests verify timer behavior in realistic workout scenarios.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Implementation Order

1. **Write `useRestTimer` tests** -> Implement hook -> Verify tests pass
2. **Write audio utility tests** -> Implement audio functions -> Verify tests pass
3. **Write timer storage tests** -> Implement storage functions -> Verify tests pass
4. **Write `RestTimer` component tests** -> Implement component -> Verify tests pass
5. **Write integration tests** -> Integrate with WorkoutTracker -> Verify tests pass
6. **Write E2E tests** -> Run full E2E suite -> Verify all pass
7. **Manual testing** -> Verify UX is acceptable
8. **Code review** -> Address any feedback
9. **Commit and merge**

---

## Notes

- Browser audio policies require user interaction before playing sounds. The timer will attempt to play audio on completion, but if the browser blocks it, the visual completion indicator serves as a fallback.
- The `webkitAudioContext` fallback is included for older Safari versions.
- Timer state in localStorage includes `startedAt` timestamp to correctly calculate elapsed time on page reload.
- The progress bar uses CSS transitions for smooth animation.
- All times are displayed in MM:SS format for consistency, even for times under 1 minute.
