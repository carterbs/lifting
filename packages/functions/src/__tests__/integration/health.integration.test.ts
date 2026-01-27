/**
 * Integration Tests for Health API
 *
 * Basic smoke test to verify the emulator is running correctly.
 */

import { describe, it, expect } from 'vitest';

// Functions emulator runs at port 5001
const HEALTH_URL = 'http://127.0.0.1:5001/brad-os/us-central1/devHealth';

interface HealthResponse {
  success: boolean;
  data: {
    status: string;
    timestamp: string;
    environment: string;
  };
}

describe('Health API (Integration)', () => {
  it('should return healthy status', async () => {
    const response = await fetch(HEALTH_URL);
    expect(response.status).toBe(200);

    const result = (await response.json()) as HealthResponse;
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('healthy');
    // In emulator, environment is 'cloud-functions' not 'dev'
    expect(result.data.environment).toBe('cloud-functions');
    expect(result.data.timestamp).toBeDefined();
  });
});
