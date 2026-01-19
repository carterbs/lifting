import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the dependent modules before importing the module under test
vi.mock('../notifications', () => ({
  subscribeToPush: vi.fn(),
  getNotificationPermission: vi.fn(),
}));

vi.mock('../subscriptionStorage', () => ({
  saveSubscription: vi.fn(),
  getSubscription: vi.fn(),
}));

import {
  initializeNotifications,
  scheduleTimerNotification,
  cancelTimerNotification,
  getInitializationError,
  resetTimerNotifications,
} from '../timerNotifications';
import { subscribeToPush, getNotificationPermission } from '../notifications';
import { saveSubscription, getSubscription } from '../subscriptionStorage';

describe('timerNotifications', () => {
  const mockSubscription: PushSubscriptionJSON = {
    endpoint: 'https://push.example.com/123',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  };

  const mockPushSubscription = {
    endpoint: 'https://push.example.com/123',
    toJSON: () => mockSubscription,
  } as unknown as PushSubscription;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state
    resetTimerNotifications();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeNotifications', () => {
    it('should subscribe to push and save subscription', async () => {
      vi.mocked(subscribeToPush).mockResolvedValue(mockPushSubscription);

      await initializeNotifications('test-vapid-key');

      expect(subscribeToPush).toHaveBeenCalledWith('test-vapid-key');
      expect(saveSubscription).toHaveBeenCalledWith(mockSubscription);
    });

    it('should throw error when subscription fails', async () => {
      vi.mocked(subscribeToPush).mockResolvedValue(null);

      await expect(initializeNotifications('test-vapid-key')).rejects.toThrow(
        'Failed to create push subscription'
      );
    });

    it('should set initialization error on failure', async () => {
      vi.mocked(subscribeToPush).mockRejectedValue(new Error('Network error'));

      await expect(initializeNotifications('test-vapid-key')).rejects.toThrow();

      expect(getInitializationError()).toBe('Network error');
    });

    it('should clear initialization error on success', async () => {
      // First, cause an error
      vi.mocked(subscribeToPush).mockRejectedValue(new Error('Network error'));
      await expect(initializeNotifications('test-vapid-key')).rejects.toThrow();
      expect(getInitializationError()).toBe('Network error');

      // Then succeed
      vi.mocked(subscribeToPush).mockResolvedValue(mockPushSubscription);
      await initializeNotifications('test-vapid-key');

      expect(getInitializationError()).toBeNull();
    });
  });

  describe('scheduleTimerNotification', () => {
    it('should throw error if permission not granted', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('default');

      await expect(
        scheduleTimerNotification(60000, 'Bench Press', 1)
      ).rejects.toThrow('Notification permission not granted: default');
    });

    it('should throw error if no subscription available', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('granted');
      vi.mocked(getSubscription).mockReturnValue(null);

      await expect(
        scheduleTimerNotification(60000, 'Bench Press', 1)
      ).rejects.toThrow('No push subscription available');
    });

    it('should call schedule API with correct payload when initialized', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('granted');
      vi.mocked(getSubscription).mockReturnValue(mockSubscription);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await scheduleTimerNotification(90000, 'Squat', 3);

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: mockSubscription.endpoint,
            keys: {
              p256dh: mockSubscription.keys?.['p256dh'],
              auth: mockSubscription.keys?.['auth'],
            },
          },
          delayMs: 90000,
          title: 'Rest Complete',
          body: 'Time for Squat - Set 3',
          tag: 'rest-timer',
        }),
      });
    });

    it('should surface fetch errors (not swallow them)', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('granted');
      vi.mocked(getSubscription).mockReturnValue(mockSubscription);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve('Service unavailable'),
      } as Response);

      await expect(
        scheduleTimerNotification(60000, 'Bench Press', 1)
      ).rejects.toThrow('Failed to schedule notification: 503 Service unavailable');
    });

    it('should surface network errors', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('granted');
      vi.mocked(getSubscription).mockReturnValue(mockSubscription);
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        scheduleTimerNotification(60000, 'Bench Press', 1)
      ).rejects.toThrow('Network error');
    });

    it('should load subscription from localStorage if not in memory', async () => {
      vi.mocked(getNotificationPermission).mockReturnValue('granted');
      vi.mocked(getSubscription).mockReturnValue(mockSubscription);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await scheduleTimerNotification(60000, 'Bench Press', 1);

      expect(getSubscription).toHaveBeenCalled();
    });
  });

  describe('cancelTimerNotification', () => {
    it('should call cancel API with rest-timer tag', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await cancelTimerNotification();

      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag: 'rest-timer',
        }),
      });
    });

    it('should surface errors on cancel failure', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      } as Response);

      await expect(cancelTimerNotification()).rejects.toThrow(
        'Failed to cancel notification: 500 Internal server error'
      );
    });
  });

  describe('getInitializationError', () => {
    it('should return null initially', async () => {
      // After a successful init, error should be null
      vi.mocked(subscribeToPush).mockResolvedValue(mockPushSubscription);
      await initializeNotifications('test-vapid-key');

      expect(getInitializationError()).toBeNull();
    });

    it('should return error message after failure', async () => {
      vi.mocked(subscribeToPush).mockRejectedValue(new Error('Test error message'));

      await expect(initializeNotifications('test-vapid-key')).rejects.toThrow();

      expect(getInitializationError()).toBe('Test error message');
    });
  });
});
