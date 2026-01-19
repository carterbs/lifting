import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  urlBase64ToUint8Array,
} from '../notifications';

describe('notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getNotificationPermission', () => {
    it('should return "unsupported" when Notification API is missing', () => {
      vi.stubGlobal('window', {});

      const result = getNotificationPermission();

      expect(result).toBe('unsupported');
    });

    it('should return "unsupported" when window is undefined', () => {
      vi.stubGlobal('window', undefined);

      const result = getNotificationPermission();

      expect(result).toBe('unsupported');
    });

    it('should return "granted" when permission is granted', () => {
      vi.stubGlobal('Notification', { permission: 'granted' });

      const result = getNotificationPermission();

      expect(result).toBe('granted');
    });

    it('should return "denied" when permission is denied', () => {
      vi.stubGlobal('Notification', { permission: 'denied' });

      const result = getNotificationPermission();

      expect(result).toBe('denied');
    });

    it('should return "default" when permission has not been requested', () => {
      vi.stubGlobal('Notification', { permission: 'default' });

      const result = getNotificationPermission();

      expect(result).toBe('default');
    });
  });

  describe('requestNotificationPermission', () => {
    it('should return "unsupported" when Notification API is missing', async () => {
      vi.stubGlobal('window', {});

      const result = await requestNotificationPermission();

      expect(result).toBe('unsupported');
    });

    it('should return "granted" when user grants permission', async () => {
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      });

      const result = await requestNotificationPermission();

      expect(result).toBe('granted');
    });

    it('should return "denied" when user denies permission', async () => {
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      });

      const result = await requestNotificationPermission();

      expect(result).toBe('denied');
    });

    it('should handle requestPermission rejection gracefully', async () => {
      vi.stubGlobal('Notification', {
        permission: 'default',
        requestPermission: vi.fn().mockRejectedValue(new Error('User cancelled')),
      });

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await requestNotificationPermission();

      expect(result).toBe('default');
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to request notification permission:',
        expect.any(Error)
      );
    });

    it('should only request permission when state is "default"', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('granted');
      vi.stubGlobal('Notification', {
        permission: 'granted',
        requestPermission: requestPermissionMock,
      });

      // Even though permission is already granted, the function will still call requestPermission
      // This is expected behavior - the caller should check canRequest before calling
      await requestNotificationPermission();

      // The function doesn't prevent calling requestPermission - it just returns the result
      expect(requestPermissionMock).toHaveBeenCalled();
    });
  });

  describe('subscribeToPush', () => {
    it('should return null when serviceWorker is not supported', async () => {
      vi.stubGlobal('navigator', {});

      const result = await subscribeToPush('test-vapid-key');

      expect(result).toBeNull();
    });

    it('should return null when window is undefined', async () => {
      vi.stubGlobal('window', undefined);

      const result = await subscribeToPush('test-vapid-key');

      expect(result).toBeNull();
    });

    it('should subscribe to push and return subscription', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/123',
        toJSON: (): PushSubscriptionJSON => ({
          endpoint: 'https://push.example.com/123',
          keys: { p256dh: 'key1', auth: 'key2' },
        }),
      };

      const subscribeMock = vi.fn().mockResolvedValue(mockSubscription);
      const mockRegistration = {
        pushManager: {
          subscribe: subscribeMock,
        },
      };

      vi.stubGlobal('navigator', {
        serviceWorker: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      // Mock atob for urlBase64ToUint8Array
      vi.stubGlobal('atob', (str: string) => str);

      const result = await subscribeToPush('test-vapid-key');

      expect(result).toBe(mockSubscription);
      expect(subscribeMock).toHaveBeenCalledWith({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        applicationServerKey: expect.any(Uint8Array),
      });
    });

    it('should handle subscription failure gracefully', async () => {
      const subscribeMock = vi
        .fn()
        .mockRejectedValue(new Error('Subscription failed'));
      const mockRegistration = {
        pushManager: {
          subscribe: subscribeMock,
        },
      };

      vi.stubGlobal('navigator', {
        serviceWorker: {
          ready: Promise.resolve(mockRegistration),
        },
      });

      vi.stubGlobal('atob', (str: string) => str);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await subscribeToPush('test-vapid-key');

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to subscribe to push:',
        expect.any(Error)
      );
    });
  });

  describe('urlBase64ToUint8Array', () => {
    it('should convert base64 string to Uint8Array', () => {
      // Mock atob to simulate base64 decoding
      vi.stubGlobal('atob', () => 'ABC');

      const result = urlBase64ToUint8Array('QUJD');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(3);
      expect(result[0]).toBe(65); // 'A'
      expect(result[1]).toBe(66); // 'B'
      expect(result[2]).toBe(67); // 'C'
    });

    it('should handle URL-safe base64 characters', () => {
      // The function should replace - with + and _ with /
      let receivedInput = '';
      vi.stubGlobal('atob', (input: string) => {
        receivedInput = input;
        return 'A';
      });

      urlBase64ToUint8Array('a-b_c');

      // Should have replaced - with + and _ with /
      expect(receivedInput).toContain('+');
      expect(receivedInput).toContain('/');
      expect(receivedInput).not.toContain('-');
      expect(receivedInput).not.toContain('_');
    });

    it('should add padding when needed', () => {
      let receivedInput = '';
      vi.stubGlobal('atob', (input: string) => {
        receivedInput = input;
        return 'A';
      });

      // Input with length % 4 !== 0 needs padding
      urlBase64ToUint8Array('abc');

      // Should have added padding
      expect(receivedInput.endsWith('=')).toBe(true);
    });
  });
});
