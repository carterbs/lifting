import { useState, useEffect } from 'react';

interface UsePwaInstallStatusReturn {
  /** Whether the app is running in standalone (installed) mode */
  isInstalled: boolean;
  /** Whether the device is running iOS */
  isIos: boolean;
  /** Whether the app can be installed (iOS Safari but not installed) */
  canInstall: boolean;
}

/**
 * Hook for detecting PWA installation status and platform.
 *
 * @returns PWA installation state and platform detection
 */
export function usePwaInstallStatus(): UsePwaInstallStatusReturn {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
    setIsInstalled(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIos(ios);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent): void => {
      setIsInstalled(e.matches || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true));
    };

    mediaQuery.addEventListener('change', handleChange);

    return (): void => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const canInstall = isIos && !isInstalled;

  return {
    isInstalled,
    isIos,
    canInstall,
  };
}
