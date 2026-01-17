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
      expect(response.error).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with message', () => {
      const errorMessage = 'Something went wrong';
      const response = createErrorResponse(errorMessage);

      expect(response.success).toBe(false);
      expect(response.error).toBe(errorMessage);
      expect(response.data).toBeUndefined();
    });
  });
});
