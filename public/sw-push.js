// Push notification handler for the Service Worker
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Fitness Tracker', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/fitness-app/icon-192.png',
    badge: '/fitness-app/icon-192.png',
    tag: data.tag || 'fitness-reminder',
    data: { url: data.url || '/fitness-app/' },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Fitness Tracker', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/fitness-app/';
  event.waitUntil(clients.openWindow(url));
});
