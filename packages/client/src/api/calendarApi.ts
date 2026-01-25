import type { CalendarDataResponse, ApiResponse, ApiError } from '@lifting/shared';
import {
  ApiClientError,
  NotFoundError,
  ValidationError,
} from './exerciseApi';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T> | ApiError;

  if (!response.ok || !result.success) {
    const errorResult = result as ApiError;
    const message = errorResult.error?.message ?? 'An error occurred';
    const code = errorResult.error?.code ?? 'UNKNOWN_ERROR';

    switch (response.status) {
      case 404:
        throw new NotFoundError(message);
      case 400:
        throw new ValidationError(message);
      default:
        throw new ApiClientError(message, response.status, code);
    }
  }

  return result.data;
}

export const calendarApi = {
  /**
   * Get calendar data for a specific month
   * @param year - The year (e.g., 2024)
   * @param month - The month (1-12)
   * @returns Calendar data response with activities grouped by day
   */
  getMonthData: async (year: number, month: number): Promise<CalendarDataResponse> => {
    // Pass timezone offset so server can convert UTC timestamps to local dates
    // getTimezoneOffset() returns minutes behind UTC (e.g., EST is +300, UTC+2 is -120)
    const timezoneOffset = new Date().getTimezoneOffset();
    const response = await fetch(
      `${API_BASE}/calendar/${year}/${month}?tz=${timezoneOffset}`
    );
    return handleResponse<CalendarDataResponse>(response);
  },
};
