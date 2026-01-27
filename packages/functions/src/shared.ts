/**
 * Shared types and utilities for the Brad OS app.
 */

// Export all types
export * from './types/index.js';

// Export all schemas
export * from './schemas/index.js';

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

// App version constant
export const APP_VERSION = '0.0.1';

// Import types for use in utility functions
import type { ApiResponse, ApiError } from './types/api.js';

// Utility function to create a typed API response
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
