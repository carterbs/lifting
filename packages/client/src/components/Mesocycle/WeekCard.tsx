import { Box, Flex, Text, Heading, Badge } from '@radix-ui/themes';
import type { WeekSummary, WorkoutStatus } from '@lifting/shared';

interface WeekCardProps {
  week: WeekSummary;
  isCurrentWeek?: boolean;
  onWorkoutClick?: (workoutId: number) => void;
}

function getStatusColor(
  status: WorkoutStatus
): 'gray' | 'blue' | 'green' | 'orange' {
  switch (status) {
    case 'pending':
      return 'gray';
    case 'in_progress':
      return 'blue';
    case 'completed':
      return 'green';
    case 'skipped':
      return 'orange';
  }
}

function formatDate(dateString: string): string {
  // Append T00:00:00 to parse as local time, not UTC (avoids off-by-one day in negative UTC timezones)
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatCompletedAt(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WeekCard({
  week,
  isCurrentWeek = false,
  onWorkoutClick,
}: WeekCardProps): JSX.Element {
  return (
    <Box
      p="4"
      style={{
        backgroundColor: isCurrentWeek ? 'var(--blue-2)' : 'var(--gray-2)',
        borderRadius: 'var(--radius-3)',
        border: isCurrentWeek
          ? '1px solid var(--blue-6)'
          : '1px solid var(--gray-5)',
      }}
      data-testid={`week-card-${week.week_number}`}
    >
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Flex gap="2" align="center">
            <Heading size="3">Week {week.week_number}</Heading>
            {week.is_deload && (
              <Badge color="purple" variant="soft" size="1" data-testid="deload-badge">
                Deload
              </Badge>
            )}
            {isCurrentWeek && (
              <Badge color="blue" variant="solid" size="1" data-testid="current-week-badge">
                Current
              </Badge>
            )}
          </Flex>

          <Text size="1" color="gray" data-testid="workout-summary">
            {week.completed_workouts} / {week.total_workouts} completed
          </Text>
        </Flex>

        {week.workouts.length > 0 ? (
          <Flex direction="column" gap="2">
            {week.workouts.map((workout) => (
              <Box
                key={workout.id}
                p="3"
                style={{
                  backgroundColor: 'var(--gray-1)',
                  borderRadius: 'var(--radius-2)',
                  border: '1px solid var(--gray-4)',
                  cursor: onWorkoutClick ? 'pointer' : 'default',
                }}
                onClick={() => onWorkoutClick?.(workout.id)}
                data-testid={`workout-item-${workout.id}`}
              >
                <Flex justify="between" align="center" gap="2">
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      {workout.plan_day_name}
                    </Text>
                    {workout.status === 'completed' && workout.completed_at !== null ? (
                      <Text size="1" color="gray">
                        Completed {formatCompletedAt(workout.completed_at)}
                      </Text>
                    ) : (
                      <Text size="1" color="gray">
                        {formatDate(workout.scheduled_date)}
                      </Text>
                    )}
                  </Flex>

                  <Flex gap="2" align="center">
                    <Text size="1" color="gray">
                      {workout.completed_set_count} / {workout.set_count} sets
                    </Text>
                    <Badge
                      color={getStatusColor(workout.status)}
                      variant="soft"
                      size="1"
                    >
                      {workout.status === 'in_progress'
                        ? 'In Progress'
                        : workout.status.charAt(0).toUpperCase() +
                          workout.status.slice(1)}
                    </Badge>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Flex>
        ) : (
          <Text size="2" color="gray">
            No workouts this week
          </Text>
        )}
      </Flex>
    </Box>
  );
}
