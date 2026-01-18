import { AlertDialog, Button, Flex, Text, Box } from '@radix-ui/themes';

interface ActivePlanWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  affectedWorkoutCount?: number;
}

export function ActivePlanWarningDialog({
  open,
  onConfirm,
  onCancel,
  affectedWorkoutCount,
}: ActivePlanWarningDialogProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  const workoutText =
    affectedWorkoutCount === 1 ? 'future workout' : 'future workout(s)';

  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Content maxWidth="450px" data-testid="active-plan-warning-dialog">
        <AlertDialog.Title>Edit Active Plan</AlertDialog.Title>

        <AlertDialog.Description>
          <Box>
            <Text color="gray" as="p" mb="3">
              This plan has an active mesocycle. Any changes you make will
              only apply to <strong>future workouts</strong>.
            </Text>

            <Box
              mb="3"
              style={{
                paddingLeft: 'var(--space-4)',
                listStyle: 'disc',
              }}
              asChild
            >
              <ul>
              <li>
                <Text size="2" color="gray">
                  Past workouts will remain unchanged
                </Text>
              </li>
              <li>
                <Text size="2" color="gray">
                  Your current in-progress workout will not be affected
                </Text>
              </li>
              <li>
                <Text size="2" color="gray">
                  Any logged sets will be preserved
                </Text>
              </li>
              </ul>
            </Box>

            {affectedWorkoutCount !== undefined && (
              <Text as="p" size="2" mb="3">
                This change will affect approximately{' '}
                <strong>
                  {affectedWorkoutCount} {workoutText}
                </strong>
                .
              </Text>
            )}
          </Box>
        </AlertDialog.Description>

        <Flex gap="3" justify="end" mt="4">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" onClick={onCancel}>
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button onClick={onConfirm}>Continue Editing</Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
