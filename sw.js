/* Math 3 Service Worker - Web Push Notifications & Background Sync */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const appIcon = new URL('assets/icon.png', self.registration.scope).href;
    const badgeIcon = new URL('assets/badge-96.png', self.registration.scope).href;
    self.registration.showNotification(event.data.title || 'Math 3 🔔', {
      body: event.data.body || '',
      icon: appIcon,
      badge: badgeIcon,
      data: { url: event.data.url || './' },
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      tag: 'math3-' + Date.now(),
      renotify: true
    });
  }
});

self.addEventListener('push', (event) => {
  let data = { title: 'Math 3 - تنبيه جديد', body: 'يوجد تحديث جديد في المنصة', url: './' };
  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const appIcon = new URL('assets/icon.png', self.registration.scope).href;
  const badgeIcon = new URL('assets/badge-96.png', self.registration.scope).href;
  const options = {
    body: data.body,
    icon: appIcon,
    badge: badgeIcon,
    data: { url: data.url || './' },
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    tag: 'math3-' + Date.now(),
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
