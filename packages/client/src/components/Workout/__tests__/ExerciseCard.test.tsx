import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@radix-ui/themes';
import { ExerciseCard } from '../ExerciseCard';
import type { WorkoutExerciseWithSets } from '../../../api/workoutApi';
import type { WorkoutSet } from '@lifting/shared';

const createMockSets = (count: number, completedCount: number = 0): WorkoutSet[] => {
  const sets: WorkoutSet[] = [];
  for (let i = 0; i < count; i++) {
    sets.push({
      id: i + 1,
      workout_id: 1,
      exercise_id: 1,
      set_number: i + 1,
      target_reps: 10,
      target_weight: 135,
      actual_reps: i < completedCount ? 10 : null,
      actual_weight: i < completedCount ? 135 : null,
      status: i < completedCount ? 'completed' : 'pending',
    });
  }
  return sets;
};

const mockExercise: WorkoutExerciseWithSets = {
  exercise_id: 1,
  exercise_name: 'Bench Press',
  sets: createMockSets(3),
  total_sets: 3,
  completed_sets: 0,
  rest_seconds: 90,
};

const renderWithTheme = (ui: React.ReactElement): ReturnType<typeof render> => {
  return render(<Theme>{ui}</Theme>);
};

describe('ExerciseCard', () => {
  const mockOnSetLogged = vi.fn();
  const mockOnSetSkipped = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display exercise name', () => {
    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('should display rest time in human-readable format', () => {
    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByText('Rest: 1m 30s')).toBeInTheDocument();
  });

  it('should display rest time as minutes only when even', () => {
    const exerciseWith60sRest: WorkoutExerciseWithSets = {
      ...mockExercise,
      rest_seconds: 60,
    };

    renderWithTheme(
      <ExerciseCard
        exercise={exerciseWith60sRest}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByText('Rest: 1m')).toBeInTheDocument();
  });

  it('should display rest time as seconds when less than 60', () => {
    const exerciseWith45sRest: WorkoutExerciseWithSets = {
      ...mockExercise,
      rest_seconds: 45,
    };

    renderWithTheme(
      <ExerciseCard
        exercise={exerciseWith45sRest}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByText('Rest: 45s')).toBeInTheDocument();
  });

  it('should render all sets', () => {
    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByTestId('set-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('set-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('set-row-3')).toBeInTheDocument();
  });

  it('should show progress count', () => {
    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByTestId('progress-badge')).toHaveTextContent('0/3 sets');
  });

  it('should update progress when sets are completed', () => {
    const exerciseWithCompletedSets: WorkoutExerciseWithSets = {
      ...mockExercise,
      sets: createMockSets(3, 2),
      completed_sets: 2,
    };

    renderWithTheme(
      <ExerciseCard
        exercise={exerciseWithCompletedSets}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByTestId('progress-badge')).toHaveTextContent('2/3 sets');
  });

  it('should indicate when all sets complete', () => {
    const exerciseAllComplete: WorkoutExerciseWithSets = {
      ...mockExercise,
      sets: createMockSets(3, 3),
      completed_sets: 3,
    };

    renderWithTheme(
      <ExerciseCard
        exercise={exerciseAllComplete}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    expect(screen.getByTestId('progress-badge')).toHaveTextContent('3/3 sets');
  });

  it('should open modal when set is clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    const setRow = screen.getByTestId('set-row-1');
    await user.click(setRow);

    expect(screen.getByTestId('log-set-modal')).toBeInTheDocument();
  });

  it('should call onSetSkipped when skip button is clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    // Get the first set's skip button
    const skipButtons = screen.getAllByTestId('skip-set-button');
    await user.click(skipButtons[0]!);

    expect(mockOnSetSkipped).toHaveBeenCalledWith(1);
  });

  it('should call onSetLogged when modal is saved', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ExerciseCard
        exercise={mockExercise}
        workoutStatus="in_progress"
        onSetLogged={mockOnSetLogged}
        onSetSkipped={mockOnSetSkipped}
      />
    );

    // Click on a set to open modal
    const setRow = screen.getByTestId('set-row-1');
    await user.click(setRow);

    // Click save button
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    expect(mockOnSetLogged).toHaveBeenCalledWith(1, {
      actual_reps: 10,
      actual_weight: 135,
    });
  });
});
