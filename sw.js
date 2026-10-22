/* Math 3 Service Worker - Web Push Notifications & Background Sync */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

const CACHE_NAME = 'math3-v4-new-icon';
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const d = event.data;
    // حظر الريمايندرز وتذكيرات المواعيد نهائياً من إشعارات الويب
    if (d.is_reminder || d.type === 'reminder' || (d.title && d.title.includes('تذكير'))) {
      return;
    }
    const appIcon = new URL('assets/icon.png', self.registration.scope).href;
    const badgeIcon = new URL('assets/badge-96.png', self.registration.scope).href;
    self.registration.showNotification(d.title || 'Math 3 🔔', {
      body: d.body || '',
      icon: appIcon,
      badge: badgeIcon,
      data: { url: d.url || './' },
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

  // حظر الريمايندرز وتذكيرات المواعيد نهائياً من إشعارات الويب لتظل حصرية لتيليجرام فقط 100%
  if (data.is_reminder || data.type === 'reminder' || (data.title && data.title.includes('تذكير'))) {
    return;
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
