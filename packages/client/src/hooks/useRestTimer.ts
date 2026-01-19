import { useState, useCallback, useEffect, useRef } from 'react';

interface UseRestTimerOptions {
  targetSeconds: number;
  initialElapsed?: number;
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

/**
 * Hook for managing a rest timer that counts up to a target time.
 * Uses timestamp-based calculation to handle browser backgrounding correctly.
 *
 * @param options - Timer configuration
 * @param options.targetSeconds - The target rest time in seconds
 * @param options.initialElapsed - Optional initial elapsed time (for restoring state)
 * @param options.onComplete - Callback fired when timer reaches target
 * @returns Timer state and control functions
 */
export function useRestTimer({
  targetSeconds,
  initialElapsed = 0,
  onComplete,
}: UseRestTimerOptions): UseRestTimerReturn {
  // Handle case where initial elapsed is >= target
  const clampedInitial = Math.min(initialElapsed, targetSeconds);
  const isInitiallyComplete = initialElapsed >= targetSeconds;

  const [elapsedSeconds, setElapsedSeconds] = useState(clampedInitial);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(isInitiallyComplete);
  const [isDismissed, setIsDismissed] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteCalledRef = useRef(isInitiallyComplete);
  // Store the timestamp when the timer was started (adjusted for any initial elapsed)
  const startedAtRef = useRef<number | null>(null);
  // Store elapsed time when paused (to calculate new startedAt on resume)
  const pausedElapsedRef = useRef(clampedInitial);

  const clearTimer = useCallback((): void => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Calculate elapsed seconds from the start timestamp.
   * This is the key fix for background timer behavior - instead of incrementing,
   * we always calculate from the real start time.
   */
  const calculateElapsed = useCallback((): number => {
    if (startedAtRef.current === null) {
      return pausedElapsedRef.current;
    }
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    return Math.max(0, Math.min(elapsed, targetSeconds));
  }, [targetSeconds]);

  const start = useCallback((): void => {
    if (isDismissed || isComplete) return;

    // Calculate startedAt to account for any already elapsed time
    // If pausedElapsedRef.current is 5, we set startedAt to 5 seconds ago
    startedAtRef.current = Date.now() - pausedElapsedRef.current * 1000;
    setIsRunning(true);
  }, [isDismissed, isComplete]);

  const pause = useCallback((): void => {
    // Store current elapsed before clearing
    pausedElapsedRef.current = calculateElapsed();
    startedAtRef.current = null;
    setIsRunning(false);
    clearTimer();
  }, [clearTimer, calculateElapsed]);

  const reset = useCallback((): void => {
    clearTimer();
    startedAtRef.current = null;
    pausedElapsedRef.current = 0;
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsComplete(false);
    setIsDismissed(false);
    onCompleteCalledRef.current = false;
  }, [clearTimer]);

  const dismiss = useCallback((): void => {
    clearTimer();
    startedAtRef.current = null;
    setIsRunning(false);
    setIsDismissed(true);
  }, [clearTimer]);

  // Main timer effect - calculates elapsed from timestamp on each tick
  useEffect(() => {
    if (isRunning && !isComplete) {
      intervalRef.current = setInterval(() => {
        const elapsed = calculateElapsed();
        setElapsedSeconds(elapsed);

        if (elapsed >= targetSeconds) {
          setIsComplete(true);
          setIsRunning(false);
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            onComplete?.();
          }
        }
      }, 1000);
    }

    return clearTimer;
  }, [isRunning, isComplete, targetSeconds, onComplete, clearTimer, calculateElapsed]);

  // Visibility change listener - recalculate elapsed immediately when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible' && isRunning && !isComplete) {
        const elapsed = calculateElapsed();
        setElapsedSeconds(elapsed);

        if (elapsed >= targetSeconds) {
          setIsComplete(true);
          setIsRunning(false);
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            onComplete?.();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return (): void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, isComplete, targetSeconds, onComplete, calculateElapsed]);

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
