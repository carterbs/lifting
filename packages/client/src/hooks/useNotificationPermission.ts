import { useState, useCallback, useEffect } from 'react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../utils/notifications';

interface UseNotificationPermissionReturn {
  /** Current notification permission state */
  permission: NotificationPermissionState;
  /** Whether notifications are supported in this browser */
  isSupported: boolean;
  /** Whether permission has been granted */
  isGranted: boolean;
  /** Whether permission can be requested (state is 'default') */
  canRequest: boolean;
  /** Whether permission has been denied */
  isDenied: boolean;
  /** Request notification permission from the user */
  requestPermission: () => Promise<void>;
}

/**
 * Hook for managing notification permission state and requests.
 *
 * @returns Notification permission state and control functions
 */
export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    getNotificationPermission()
  );

  const isSupported = permission !== 'unsupported';
  const isGranted = permission === 'granted';
  const canRequest = permission === 'default';
  const isDenied = permission === 'denied';

  const requestPermission = useCallback(async (): Promise<void> => {
    const result = await requestNotificationPermission();
    setPermission(result);
  }, []);

  // Listen for permission changes (e.g., user grants/denies from browser settings)
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const handlePermissionChange = (): void => {
      setPermission(getNotificationPermission());
    };

    // Check for permission changes when window regains focus
    window.addEventListener('focus', handlePermissionChange);

    return (): void => {
      window.removeEventListener('focus', handlePermissionChange);
    };
  }, [isSupported]);

  return {
    permission,
    isSupported,
    isGranted,
    canRequest,
    isDenied,
    requestPermission,
  };
}
