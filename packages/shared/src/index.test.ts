import { describe, it, expect } from 'vitest';
import {
  APP_VERSION,
  createSuccessResponse,
  createErrorResponse,
} from './index.js';

describe('shared utilities', () => {
  describe('APP_VERSION', () => {
    it('should be a valid semver string', () => {
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { foo: 'bar' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with code and message', () => {
      const response = createErrorResponse('ERROR_CODE', 'Something went wrong');

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('ERROR_CODE');
      expect(response.error.message).toBe('Something went wrong');
    });

    it('should create an error response with details', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const response = createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input',
        details
      );

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Invalid input');
      expect(response.error.details).toEqual(details);
    });
  });
});
