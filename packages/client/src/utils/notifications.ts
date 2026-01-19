/**
 * Notification utilities for managing browser notification permissions
 * and push subscriptions.
 */

/**
 * Represents the current state of notification permissions.
 */
export type NotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

/**
 * Gets the current notification permission state.
 *
 * @returns The current permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests notification permission from the user.
 *
 * @returns Promise resolving to the permission state after user response
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return getNotificationPermission();
  }
}

/**
 * Subscribes to push notifications using the provided VAPID public key.
 *
 * @param vapidPublicKey - The VAPID public key from the server
 * @returns Promise resolving to the push subscription, or null if failed
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

/**
 * Converts a URL-safe base64 string to a Uint8Array.
 * This is required for VAPID key conversion.
 *
 * @param base64String - The base64 VAPID public key
 * @returns Uint8Array representation of the key
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
