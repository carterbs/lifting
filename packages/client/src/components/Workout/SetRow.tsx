import { Box, Button, Flex, Text, Badge } from '@radix-ui/themes';
import type { WorkoutSet, WorkoutStatus, LogWorkoutSetInput } from '@lifting/shared';

interface SetRowProps {
  set: WorkoutSet;
  workoutStatus: WorkoutStatus;
  onLog: (data: LogWorkoutSetInput) => void;
  onSkip: () => void;
  onClick: () => void;
}

export function SetRow({
  set,
  workoutStatus,
  onSkip,
  onClick,
}: SetRowProps): JSX.Element {
  const isDisabled = workoutStatus === 'completed' || workoutStatus === 'skipped';
  const isLogged = set.status === 'completed';
  const isSkipped = set.status === 'skipped';

  const getStatusBadge = (): JSX.Element | null => {
    if (isLogged) {
      return <Badge color="green">Logged</Badge>;
    }
    if (isSkipped) {
      return <Badge color="gray">Skipped</Badge>;
    }
    return null;
  };

  const getStatusClass = (): string => {
    if (isLogged) return 'logged';
    if (isSkipped) return 'skipped';
    return 'pending';
  };

  return (
    <Flex
      data-testid={`set-row-${set.id}`}
      className={getStatusClass()}
      align="center"
      gap="3"
      p="3"
      style={{
        backgroundColor: isLogged
          ? 'var(--green-2)'
          : isSkipped
            ? 'var(--gray-3)'
            : 'var(--gray-2)',
        borderRadius: 'var(--radius-2)',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isSkipped ? 0.7 : 1,
      }}
      onClick={isDisabled ? undefined : onClick}
    >
      {/* Set number */}
      <Box style={{ minWidth: '40px' }}>
        <Text size="2" weight="medium" color="gray">
          Set {set.set_number}
        </Text>
      </Box>

      {/* Target values */}
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" color="gray">
          Target: {set.target_reps} reps @ {set.target_weight} lbs
        </Text>
        {isLogged && set.actual_reps !== null && set.actual_weight !== null && (
          <Flex gap="2" align="center">
            <Text size="3" weight="medium" data-testid="actual-reps">
              {set.actual_reps}
            </Text>
            <Text size="3" color="gray">
              reps @
            </Text>
            <Text size="3" weight="medium" data-testid="actual-weight">
              {set.actual_weight}
            </Text>
            <Text size="3" color="gray">
              lbs
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Status badge */}
      <Box style={{ minWidth: '60px', textAlign: 'right' }}>
        {getStatusBadge()}
      </Box>

      {/* Skip button */}
      {!isDisabled && !isSkipped && (
        <Button
          variant="ghost"
          color="gray"
          size="1"
          data-testid="skip-set-button"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
        >
          Skip
        </Button>
      )}
    </Flex>
  );
}
