import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the notifications module
vi.mock('../../utils/notifications', () => ({
  getNotificationPermission: vi.fn(),
  requestNotificationPermission: vi.fn(),
}));

import { useNotificationPermission } from '../useNotificationPermission';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../../utils/notifications';

describe('useNotificationPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return correct initial state when permission is default', () => {
      vi.mocked(getNotificationPermission).mockReturnValue('default');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('default');
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isGranted).toBe(false);
      expect(result.current.canRequest).toBe(true);
      expect(result.current.isDenied).toBe(false);
    });

    it('should return correct state when permission is granted', () => {
      vi.mocked(getNotificationPermission).mockReturnValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('granted');
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isGranted).toBe(true);
      expect(result.current.canRequest).toBe(false);
      expect(result.current.isDenied).toBe(false);
    });

    it('should return correct state when permission is denied', () => {
      vi.mocked(getNotificationPermission).mockReturnValue('denied');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('denied');
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isGranted).toBe(false);
      expect(result.current.canRequest).toBe(false);
      expect(result.current.isDenied).toBe(true);
    });

    it('should correctly indicate unsupported when Notification API is missing', () => {
      vi.mocked(getNotificationPermission).mockReturnValue('unsupported');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('unsupported');
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isGranted).toBe(false);
      expect(result.current.canRequest).toBe(false);
      expect(result.current.isDenied).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should update permission state after request', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('default');
      vi.mocked(requestNotificationPermission).mockResolvedValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('default');

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('granted');
      expect(result.current.isGranted).toBe(true);
    });

    it('should update to denied state when user denies', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('default');
      vi.mocked(requestNotificationPermission).mockResolvedValue('denied');

      const { result } = renderHook(() => useNotificationPermission());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('denied');
      expect(result.current.isDenied).toBe(true);
    });

    it('should call requestNotificationPermission from utils', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('default');
      vi.mocked(requestNotificationPermission).mockResolvedValue('granted');

      const { result } = renderHook(() => useNotificationPermission());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(requestNotificationPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe('permission change on focus', () => {
    it('should update permission when window regains focus', () => {
      // Start with default permission
      vi.mocked(getNotificationPermission).mockReturnValue('default');

      const { result } = renderHook(() => useNotificationPermission());

      expect(result.current.permission).toBe('default');

      // Simulate permission change (e.g., user enabled from browser settings)
      vi.mocked(getNotificationPermission).mockReturnValue('granted');

      // Simulate window focus event
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });

      expect(result.current.permission).toBe('granted');
      expect(result.current.isGranted).toBe(true);
    });

    it('should not add focus listener when unsupported', () => {
      vi.mocked(getNotificationPermission).mockReturnValue('unsupported');

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useNotificationPermission());

      // Should not add focus listener when unsupported
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
    });

    it('should clean up focus listener on unmount', () => {
      vi.mocked(getNotificationPermission).mockReturnValue('default');

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNotificationPermission());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
    });
  });
});
