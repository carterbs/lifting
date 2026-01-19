import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePwaInstallStatus } from '../usePwaInstallStatus';

describe('usePwaInstallStatus', () => {
  let mockMediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('isInstalled detection', () => {
    it('should detect standalone mode via matchMedia', () => {
      mockMediaQueryList.matches = true;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isInstalled).toBe(true);
    });

    it('should detect standalone mode via navigator.standalone (iOS Safari)', () => {
      mockMediaQueryList.matches = false;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        standalone: true,
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isInstalled).toBe(true);
    });

    it('should return false when not in standalone mode', () => {
      mockMediaQueryList.matches = false;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isInstalled).toBe(false);
    });
  });

  describe('isIos detection', () => {
    it('should detect iPhone', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isIos).toBe(true);
    });

    it('should detect iPad', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isIos).toBe(true);
    });

    it('should detect iPod', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isIos).toBe(true);
    });

    it('should return false for non-iOS devices', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isIos).toBe(false);
    });

    it('should return false for desktop browsers', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isIos).toBe(false);
    });
  });

  describe('canInstall computation', () => {
    it('should return true when iOS Safari and not installed', () => {
      mockMediaQueryList.matches = false;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.canInstall).toBe(true);
    });

    it('should return false when iOS but already installed', () => {
      mockMediaQueryList.matches = true;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.canInstall).toBe(false);
    });

    it('should return false when not iOS', () => {
      mockMediaQueryList.matches = false;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.canInstall).toBe(false);
    });
  });

  describe('display mode change listener', () => {
    it('should update isInstalled when display mode changes', () => {
      mockMediaQueryList.matches = false;
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQueryList));
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      });

      const { result } = renderHook(() => usePwaInstallStatus());

      expect(result.current.isInstalled).toBe(false);

      // Get the change handler that was registered
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls.find(
        (call) => call[0] === 'change'
      )?.[1] as ((e: MediaQueryListEvent) => void) | undefined;

      expect(changeHandler).toBeDefined();

      // Simulate display mode change to standalone
      act(() => {
        changeHandler?.({ matches: true } as MediaQueryListEvent);
      });

      expect(result.current.isInstalled).toBe(true);
    });

    it('should clean up listener on unmount', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      });

      const { unmount } = renderHook(() => usePwaInstallStatus());

      unmount();

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });
});
