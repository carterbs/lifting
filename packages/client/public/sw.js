/**
 * Service Worker for Push Notifications
 *
 * Handles:
 * - push: Receive push notification from server and display it
 * - notificationclick: User taps notification to focus/open app
 */

// Push event: receive notification data and display it
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push event received but no data');
    return;
  }

  let notification;
  try {
    notification = event.data.json();
  } catch (error) {
    console.error('Failed to parse push notification data:', error);
    return;
  }

  const { title, body, tag } = notification;

  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: tag || 'rest-timer',
    vibrate: [200, 100, 200],
    // Additional options for better UX
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Lifting Tracker', options)
  );
});

// Notification click: focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      // No existing window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
