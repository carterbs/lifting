import { Box, Button, Flex, Text, Badge } from '@radix-ui/themes';
import type { WorkoutSet, WorkoutStatus, LogWorkoutSetInput } from '@lifting/shared';

function CheckIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
      {/* Set number with check icon */}
      <Flex align="center" gap="2" style={{ minWidth: '60px' }}>
        {isLogged && (
          <Box style={{ color: 'var(--green-9)' }}>
            <CheckIcon />
          </Box>
        )}
        <Text size="2" weight="medium" color={isLogged ? undefined : 'gray'}>
          Set {set.set_number}
        </Text>
      </Flex>

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
