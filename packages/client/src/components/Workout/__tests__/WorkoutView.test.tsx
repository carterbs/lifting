import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@radix-ui/themes';
import { WorkoutView } from '../WorkoutView';
import type { WorkoutWithExercises } from '../../../api/workoutApi';

const createMockWorkout = (
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
): WorkoutWithExercises => ({
  id: 1,
  mesocycle_id: 1,
  plan_day_id: 1,
  week_number: 1,
  scheduled_date: '2024-01-15',
  status,
  started_at: status === 'pending' ? null : '2024-01-15T10:00:00Z',
  completed_at: status === 'completed' ? '2024-01-15T11:00:00Z' : null,
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
        {
          id: 2,
          workout_id: 1,
          exercise_id: 1,
          set_number: 2,
          target_reps: 10,
          target_weight: 135,
          actual_reps: null,
          actual_weight: null,
          status: 'pending',
        },
      ],
      total_sets: 2,
      completed_sets: 0,
      rest_seconds: 90,
    },
  ],
});

const renderWithTheme = (ui: React.ReactElement): ReturnType<typeof render> => {
  return render(<Theme>{ui}</Theme>);
};

describe('WorkoutView', () => {
  const mockOnSetLogged = vi.fn();
  const mockOnSetSkipped = vi.fn();
  const mockOnWorkoutStarted = vi.fn();
  const mockOnWorkoutCompleted = vi.fn();
  const mockOnWorkoutSkipped = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display workout date', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    // Date format: Monday, Jan 15
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
  });

  it('should display workout status badge', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('workout-status')).toHaveTextContent('Scheduled');
  });

  it('should display plan day name', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByText('Push Day')).toBeInTheDocument();
  });

  it('should render all exercises', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('should show "Start Workout" button when scheduled', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('start-workout')).toBeInTheDocument();
  });

  it('should hide "Start Workout" when in_progress', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('in_progress')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.queryByTestId('start-workout')).not.toBeInTheDocument();
  });

  it('should show "Complete Workout" button when in_progress', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('in_progress')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('complete-workout')).toBeInTheDocument();
  });

  it('should show "Skip Workout" button when scheduled or in_progress', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('skip-workout')).toBeInTheDocument();
  });

  it('should disable buttons when completed', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('completed')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.queryByTestId('start-workout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('complete-workout')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skip-workout')).not.toBeInTheDocument();
  });

  it('should call onWorkoutStarted when start clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    await user.click(screen.getByTestId('start-workout'));

    expect(mockOnWorkoutStarted).toHaveBeenCalled();
  });

  it('should show confirmation dialog before completing with pending sets', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('in_progress')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    await user.click(screen.getByTestId('complete-workout'));

    // Confirmation dialog should appear
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/2 sets not logged/)).toBeInTheDocument();
  });

  it('should call onWorkoutCompleted when confirmed', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('in_progress')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    await user.click(screen.getByTestId('complete-workout'));

    // Click confirm button in dialog
    const dialog = screen.getByTestId('confirm-dialog');
    await user.click(within(dialog).getByTestId('confirm-button'));

    expect(mockOnWorkoutCompleted).toHaveBeenCalled();
  });

  it('should show skip confirmation dialog', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    await user.click(screen.getByTestId('skip-workout'));

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Skip Workout\?/)).toBeInTheDocument();
  });

  it('should call onWorkoutSkipped when skip confirmed', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    await user.click(screen.getByTestId('skip-workout'));

    const dialog = screen.getByTestId('confirm-dialog');
    await user.click(within(dialog).getByTestId('confirm-button'));

    expect(mockOnWorkoutSkipped).toHaveBeenCalled();
  });

  it('should display In Progress status badge', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('in_progress')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('workout-status')).toHaveTextContent('In Progress');
  });

  it('should display Completed status badge', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('completed')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('workout-status')).toHaveTextContent('Completed');
  });

  it('should display Skipped status badge', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('skipped')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
      />
    );

    expect(screen.getByTestId('workout-status')).toHaveTextContent('Skipped');
  });

  it('should show loading state when starting', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
        isStarting={true}
      />
    );

    expect(screen.getByTestId('start-workout')).toHaveTextContent('Starting...');
  });

  it('should show loading state when completing', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('in_progress')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
        isCompleting={true}
      />
    );

    expect(screen.getByTestId('complete-workout')).toHaveTextContent('Completing...');
  });

  it('should show loading state when skipping', () => {
    renderWithTheme(
      <WorkoutView
        workout={createMockWorkout('pending')}
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
        onWorkoutStarted={mockOnWorkoutStarted}
        onWorkoutCompleted={mockOnWorkoutCompleted}
        onWorkoutSkipped={mockOnWorkoutSkipped}
        isSkipping={true}
      />
    );

    expect(screen.getByTestId('skip-workout')).toHaveTextContent('Skipping...');
  });
});
