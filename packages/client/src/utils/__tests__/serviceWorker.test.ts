import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerServiceWorker,
  getServiceWorkerRegistration,
  resetServiceWorkerRegistration,
} from '../serviceWorker';

describe('serviceWorker', () => {
  let mockRegistration: ServiceWorkerRegistration;

  beforeEach(() => {
    resetServiceWorkerRegistration();

    mockRegistration = {
      scope: '/',
      active: null,
      installing: null,
      waiting: null,
      pushManager: {} as PushManager,
      navigationPreload: {} as NavigationPreloadManager,
      updateViaCache: 'imports',
      onupdatefound: null,
      getNotifications: vi.fn(),
      showNotification: vi.fn(),
      unregister: vi.fn(),
      update: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as ServiceWorkerRegistration;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetServiceWorkerRegistration();
  });

  describe('registerServiceWorker', () => {
    it('should return null if serviceWorker is not supported', async () => {
      // Remove serviceWorker from navigator
      vi.stubGlobal('navigator', {});

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await registerServiceWorker();

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Service Workers are not supported in this browser'
      );
    });

    it('should register and return registration', async () => {
      const registerMock = vi.fn().mockResolvedValue(mockRegistration);
      vi.stubGlobal('navigator', {
        serviceWorker: {
          register: registerMock,
        },
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await registerServiceWorker();

      expect(result).toBe(mockRegistration);
      expect(registerMock).toHaveBeenCalledWith('/sw.js', { scope: '/' });
      expect(logSpy).toHaveBeenCalledWith(
        'Service Worker registered successfully:',
        '/'
      );
    });

    it('should handle registration failure gracefully', async () => {
      const registerMock = vi
        .fn()
        .mockRejectedValue(new Error('Registration failed'));
      vi.stubGlobal('navigator', {
        serviceWorker: {
          register: registerMock,
        },
      });

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await registerServiceWorker();

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Service Worker registration failed:',
        expect.any(Error)
      );
    });

    it('should cache registration for later retrieval', async () => {
      const registerMock = vi.fn().mockResolvedValue(mockRegistration);
      vi.stubGlobal('navigator', {
        serviceWorker: {
          register: registerMock,
        },
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await registerServiceWorker();

      // Second call should return cached registration
      const result = await registerServiceWorker();

      expect(result).toBe(mockRegistration);
      // Should only register once
      expect(registerMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServiceWorkerRegistration', () => {
    it('should return null if service worker has not been registered', () => {
      const result = getServiceWorkerRegistration();
      expect(result).toBeNull();
    });

    it('should return cached registration after registration', async () => {
      const registerMock = vi.fn().mockResolvedValue(mockRegistration);
      vi.stubGlobal('navigator', {
        serviceWorker: {
          register: registerMock,
        },
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await registerServiceWorker();

      const result = getServiceWorkerRegistration();

      expect(result).toBe(mockRegistration);
    });
  });

  describe('resetServiceWorkerRegistration', () => {
    it('should clear the cached registration', async () => {
      const registerMock = vi.fn().mockResolvedValue(mockRegistration);
      vi.stubGlobal('navigator', {
        serviceWorker: {
          register: registerMock,
        },
      });
      vi.spyOn(console, 'log').mockImplementation(() => {});

      await registerServiceWorker();
      expect(getServiceWorkerRegistration()).toBe(mockRegistration);

      resetServiceWorkerRegistration();

      expect(getServiceWorkerRegistration()).toBeNull();
    });
  });
});
