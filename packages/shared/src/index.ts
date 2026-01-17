/**
 * Shared types and utilities for the Lifting app.
 * This package contains code shared between client and server.
 */

// API response wrapper type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

// App version constant
export const APP_VERSION = '0.0.1';

// Utility function to create a typed API response
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}
