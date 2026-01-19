/**
 * Service Worker registration utilities.
 *
 * Pattern: Singleton service worker registration with pure functions.
 * Follows the style of audio.ts for consistent codebase patterns.
 */

// Cached service worker registration
let cachedRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers the service worker for push notifications.
 * Safe to call multiple times - subsequent calls return the cached registration.
 *
 * @returns The ServiceWorkerRegistration or null if not supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Return cached registration if available
  if (cachedRegistration !== null) {
    return cachedRegistration;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Cache the registration for future calls
    cachedRegistration = registration;

    console.log('Service Worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Gets the cached service worker registration synchronously.
 * Returns null if service worker hasn't been registered yet.
 *
 * @returns The cached ServiceWorkerRegistration or null
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return cachedRegistration;
}

/**
 * Resets the cached service worker registration.
 * Primarily for testing purposes.
 */
export function resetServiceWorkerRegistration(): void {
  cachedRegistration = null;
}
