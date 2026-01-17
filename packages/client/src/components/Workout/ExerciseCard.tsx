import { useState } from 'react';
import { Box, Card, Flex, Text, Badge } from '@radix-ui/themes';
import type { WorkoutStatus, LogWorkoutSetInput } from '@lifting/shared';
import type { WorkoutExerciseWithSets } from '../../api/workoutApi';
import { SetRow } from './SetRow';
import { LogSetModal } from './LogSetModal';

interface ExerciseCardProps {
  exercise: WorkoutExerciseWithSets;
  workoutStatus: WorkoutStatus;
  onSetLogged: (setId: number, data: LogWorkoutSetInput) => void;
  onSetSkipped: (setId: number) => void;
}

function formatRestTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export function ExerciseCard({
  exercise,
  workoutStatus,
  onSetLogged,
  onSetSkipped,
}: ExerciseCardProps): JSX.Element {
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

  const completedSets = exercise.sets.filter(
    (s) => s.status === 'completed'
  ).length;
  const totalSets = exercise.sets.length;
  const allComplete = completedSets === totalSets;

  const selectedSet = exercise.sets.find((s) => s.id === selectedSetId) ?? null;

  const handleSetClick = (setId: number): void => {
    setSelectedSetId(setId);
  };

  const handleLogSet = (data: LogWorkoutSetInput): void => {
    if (selectedSetId !== null) {
      onSetLogged(selectedSetId, data);
    }
  };

  const handleCloseModal = (): void => {
    setSelectedSetId(null);
  };

  return (
    <>
      <Card data-testid={`exercise-card-${exercise.exercise_id}`}>
        {/* Exercise header */}
        <Flex justify="between" align="center" mb="3">
          <Box>
            <Text size="4" weight="bold">
              {exercise.exercise_name}
            </Text>
            <Text size="2" color="gray" as="p">
              Rest: {formatRestTime(exercise.rest_seconds)}
            </Text>
          </Box>
          <Badge
            color={allComplete ? 'green' : 'gray'}
            size="2"
            data-testid="progress-badge"
          >
            {completedSets}/{totalSets} sets
          </Badge>
        </Flex>

        {/* Sets list */}
        <Flex direction="column" gap="2">
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              workoutStatus={workoutStatus}
              onLog={(data) => onSetLogged(set.id, data)}
              onSkip={() => onSetSkipped(set.id)}
              onClick={() => handleSetClick(set.id)}
            />
          ))}
        </Flex>
      </Card>

      {/* Log set modal */}
      <LogSetModal
        open={selectedSetId !== null}
        set={selectedSet}
        onSave={handleLogSet}
        onClose={handleCloseModal}
      />
    </>
  );
}
