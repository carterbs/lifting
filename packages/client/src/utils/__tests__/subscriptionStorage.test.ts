import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveSubscription,
  getSubscription,
  clearSubscription,
} from '../subscriptionStorage';

describe('subscriptionStorage', () => {
  const STORAGE_KEY = 'push-subscription';

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveSubscription', () => {
    it('should save subscription to localStorage', () => {
      const subscription: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/123',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      };

      saveSubscription(subscription);

      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? '')).toEqual(subscription);
    });

    it('should overwrite existing subscription', () => {
      const subscription1: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key1', auth: 'auth1' },
      };

      const subscription2: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/456',
        keys: { p256dh: 'key2', auth: 'auth2' },
      };

      saveSubscription(subscription1);
      saveSubscription(subscription2);

      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(stored ?? '')).toEqual(subscription2);
    });

    it('should handle localStorage errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      const subscription: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key', auth: 'auth' },
      };

      // Should not throw
      expect(() => saveSubscription(subscription)).not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to save push subscription:',
        expect.any(Error)
      );
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription from localStorage', () => {
      const subscription: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key', auth: 'auth' },
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));

      const loaded = getSubscription();

      expect(loaded).toEqual(subscription);
    });

    it('should return null when no subscription exists', () => {
      const loaded = getSubscription();
      expect(loaded).toBeNull();
    });

    it('should return null for empty string', () => {
      window.localStorage.setItem(STORAGE_KEY, '');

      const loaded = getSubscription();
      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const loaded = getSubscription();

      expect(loaded).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to load push subscription:',
        expect.any(Error)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const loaded = getSubscription();

      expect(loaded).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('clearSubscription', () => {
    it('should remove subscription from localStorage', () => {
      const subscription: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key', auth: 'auth' },
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));

      clearSubscription();

      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not throw when no subscription exists', () => {
      expect(() => clearSubscription()).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => clearSubscription()).not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to clear push subscription:',
        expect.any(Error)
      );
    });
  });
});
