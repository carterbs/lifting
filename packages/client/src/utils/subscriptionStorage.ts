/**
 * Push subscription persistence utilities.
 * Stores and retrieves push subscription data from localStorage.
 */

const STORAGE_KEY = 'push-subscription';

/**
 * Saves push subscription to localStorage.
 *
 * @param subscription - The push subscription to persist
 */
export function saveSubscription(subscription: PushSubscriptionJSON): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  } catch (error) {
    console.error('Failed to save push subscription:', error);
  }
}

/**
 * Loads push subscription from localStorage.
 *
 * @returns The stored subscription, or null if not found or invalid
 */
export function getSubscription(): PushSubscriptionJSON | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null || stored === '') {
      return null;
    }
    return JSON.parse(stored) as PushSubscriptionJSON;
  } catch (error) {
    console.error('Failed to load push subscription:', error);
    return null;
  }
}

/**
 * Removes push subscription from localStorage.
 */
export function clearSubscription(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear push subscription:', error);
  }
}
