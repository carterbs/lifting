import { useEffect } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';

interface NotificationErrorProps {
  error: string | null;
  onDismiss: () => void;
}

export function NotificationError({
  error,
  onDismiss,
}: NotificationErrorProps): JSX.Element | null {
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (error !== null && error !== '') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 10000);

      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [error, onDismiss]);

  if (error === null || error === '') {
    return null;
  }

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '12px 16px',
        zIndex: 9999,
      }}
      data-testid="notification-error"
    >
      <Flex justify="between" align="center" gap="3">
        <Text size="2" weight="medium">
          {error}
        </Text>
        <Button
          size="1"
          variant="ghost"
          color="gray"
          onClick={onDismiss}
          data-testid="dismiss-error-button"
          style={{ color: 'white', minWidth: '24px' }}
        >
          ✕
        </Button>
      </Flex>
    </Box>
  );
}
