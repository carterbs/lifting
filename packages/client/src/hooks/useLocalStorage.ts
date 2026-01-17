import { useState, useEffect, useCallback, useRef } from 'react';

const WORKOUT_STORAGE_KEY = 'lifting-app-workout-state';

/**
 * Stored state for an in-progress workout
 */
export interface StoredWorkoutState {
  workoutId: number;
  sets: Record<
    number,
    { actual_reps: number; actual_weight: number; status: 'completed' | 'skipped' }
  >;
  lastUpdated: string;
}

/**
 * Hook for managing localStorage state
 * Provides type-safe get/set operations with automatic JSON serialization
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Use ref for initial value to avoid unnecessary re-renders
  const initialValueRef = useRef(initialValue);

  // Get stored value (defined inline to avoid dependency issues)
  const getStoredValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Set value in localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValueRef.current);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  // Handle storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValueRef.current);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return (): void => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Specialized hook for workout state localStorage management
 */
export function useWorkoutStorage(): {
  storedState: StoredWorkoutState | null;
  saveState: (state: StoredWorkoutState) => void;
  clearState: () => void;
  updateSet: (
    workoutId: number,
    setId: number,
    data: { actual_reps: number; actual_weight: number; status: 'completed' | 'skipped' }
  ) => void;
  getStoredStateForWorkout: (workoutId: number) => StoredWorkoutState | null;
} {
  const [storedState, setStoredState, clearStoredState] =
    useLocalStorage<StoredWorkoutState | null>(WORKOUT_STORAGE_KEY, null);

  const saveState = useCallback(
    (state: StoredWorkoutState) => {
      setStoredState(state);
    },
    [setStoredState]
  );

  const clearState = useCallback(() => {
    clearStoredState();
  }, [clearStoredState]);

  const updateSet = useCallback(
    (
      workoutId: number,
      setId: number,
      data: { actual_reps: number; actual_weight: number; status: 'completed' | 'skipped' }
    ) => {
      setStoredState((prev) => {
        if (!prev || prev.workoutId !== workoutId) {
          // Create new state for this workout
          return {
            workoutId,
            sets: {
              [setId]: data,
            },
            lastUpdated: new Date().toISOString(),
          };
        }

        // Update existing state
        return {
          ...prev,
          sets: {
            ...prev.sets,
            [setId]: data,
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    [setStoredState]
  );

  const getStoredStateForWorkout = useCallback(
    (workoutId: number): StoredWorkoutState | null => {
      if (storedState && storedState.workoutId === workoutId) {
        return storedState;
      }
      return null;
    },
    [storedState]
  );

  return {
    storedState,
    saveState,
    clearState,
    updateSet,
    getStoredStateForWorkout,
  };
}
