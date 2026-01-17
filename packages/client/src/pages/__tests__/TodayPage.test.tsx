import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import { TodayPage } from '../TodayPage';
import { workoutApi, type WorkoutWithExercises } from '../../api/workoutApi';

// Mock the API
vi.mock('../../api/workoutApi', () => ({
  workoutApi: {
    getTodaysWorkout: vi.fn(),
    getWorkout: vi.fn(),
    startWorkout: vi.fn(),
    completeWorkout: vi.fn(),
    skipWorkout: vi.fn(),
    logSet: vi.fn(),
    skipSet: vi.fn(),
  },
  NotFoundError: class extends Error {},
  ValidationError: class extends Error {},
  ApiClientError: class extends Error {},
}));

// Mock localStorage hook
vi.mock('../../hooks/useLocalStorage', () => ({
  useWorkoutStorage: () => ({
    storedState: null,
    saveState: vi.fn(),
    clearState: vi.fn(),
    updateSet: vi.fn(),
    getStoredStateForWorkout: vi.fn(),
  }),
}));

const mockWorkout: WorkoutWithExercises = {
  id: 1,
  mesocycle_id: 1,
  plan_day_id: 1,
  week_number: 1,
  scheduled_date: '2024-01-15',
  status: 'pending',
  started_at: null,
  completed_at: null,
  plan_day_name: 'Push Day',
  exercises: [
    {
      exercise_id: 1,
      exercise_name: 'Bench Press',
      sets: [
        {
          id: 1,
          workout_id: 1,
          exercise_id: 1,
          set_number: 1,
          target_reps: 10,
          target_weight: 135,
          actual_reps: null,
          actual_weight: null,
          status: 'pending',
        },
      ],
      total_sets: 1,
      completed_sets: 0,
      rest_seconds: 90,
    },
  ],
};

const createWrapper = (): {
  wrapper: ({ children }: { children: ReactNode }) => JSX.Element;
  queryClient: QueryClient;
} => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <Theme>{children}</Theme>
    </QueryClientProvider>
  );

  return { wrapper, queryClient };
};

describe('TodayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    vi.mocked(workoutApi.getTodaysWorkout).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { wrapper } = createWrapper();
    render(<TodayPage />, { wrapper });

    expect(screen.getByText('Loading workout...')).toBeInTheDocument();
  });

  it('should show "No workout scheduled" when no workout for today', async () => {
    vi.mocked(workoutApi.getTodaysWorkout).mockResolvedValueOnce(null);

    const { wrapper } = createWrapper();
    render(<TodayPage />, { wrapper });

    // Wait for query to complete
    const message = await screen.findByTestId('no-workout-message');
    expect(message).toHaveTextContent('No workout scheduled for today.');
  });

  it('should render WorkoutView when workout exists', async () => {
    vi.mocked(workoutApi.getTodaysWorkout).mockResolvedValueOnce(mockWorkout);

    const { wrapper } = createWrapper();
    render(<TodayPage />, { wrapper });

    // Wait for query to complete
    const planDayName = await screen.findByText('Push Day');
    expect(planDayName).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('should handle fetch error gracefully', async () => {
    vi.mocked(workoutApi.getTodaysWorkout).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { wrapper } = createWrapper();
    render(<TodayPage />, { wrapper });

    // Wait for error to appear
    const errorMessage = await screen.findByText(/Error loading workout/);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should display page heading', async () => {
    vi.mocked(workoutApi.getTodaysWorkout).mockResolvedValueOnce(null);

    const { wrapper } = createWrapper();
    render(<TodayPage />, { wrapper });

    // Wait for query to complete before checking heading
    const heading = await screen.findByRole('heading', { name: 'Today' });
    expect(heading).toBeInTheDocument();
  });

  it('should show start button for scheduled workout', async () => {
    vi.mocked(workoutApi.getTodaysWorkout).mockResolvedValueOnce(mockWorkout);

    const { wrapper } = createWrapper();
    render(<TodayPage />, { wrapper });

    const startButton = await screen.findByTestId('start-workout');
    expect(startButton).toBeInTheDocument();
  });
});
