import { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, Flex } from '@radix-ui/themes';
import { APP_VERSION, type HealthCheckResponse } from '@lifting/shared';

interface HealthStatus {
  loading: boolean;
  data: HealthCheckResponse | null;
  error: string | null;
}

export function App(): JSX.Element {
  const [health, setHealth] = useState<HealthStatus>({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    const fetchHealth = async (): Promise<void> => {
      try {
        const response = await fetch('/api/health');
        const result = (await response.json()) as {
          success: boolean;
          data?: HealthCheckResponse;
          error?: string;
        };

        if (result.success && result.data !== undefined) {
          setHealth({ loading: false, data: result.data, error: null });
        } else {
          setHealth({
            loading: false,
            data: null,
            error: result.error ?? 'Unknown error',
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch health status';
        setHealth({ loading: false, data: null, error: errorMessage });
      }
    };

    void fetchHealth();
  }, []);

  return (
    <Container size="2" p="4">
      <Flex direction="column" gap="4">
        <Heading size="8" align="center">
          Lifting
        </Heading>
        <Text align="center" color="gray">
          Workout Tracker v{APP_VERSION}
        </Text>

        <Box
          p="4"
          style={{
            backgroundColor: 'var(--gray-2)',
            borderRadius: 'var(--radius-3)',
          }}
        >
          <Heading size="4" mb="2">
            Server Status
          </Heading>
          {health.loading && <Text>Checking server connection...</Text>}
          {health.error !== null && (
            <Text color="red">Error: {health.error}</Text>
          )}
          {health.data !== null && (
            <Flex direction="column" gap="1">
              <Text>
                Status:{' '}
                <Text color="green" weight="bold">
                  {health.data.status}
                </Text>
              </Text>
              <Text>Version: {health.data.version}</Text>
              <Text>Last checked: {health.data.timestamp}</Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
}
