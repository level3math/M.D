/* Math 3 Service Worker - True Web Push Notifications & Background Wakeup */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

const CACHE_NAME = 'math3-v5-push';
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

// استقبال الرسائل المباشرة من التطبيق عندما يكون مفتوحاً
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const d = event.data;
    if (d.is_reminder || d.type === 'reminder' || (d.title && (d.title.includes('تذكير') || d.title.includes('ريمندر')))) {
      return;
    }
    const appIcon = new URL(d.icon || 'assets/icon.png', self.registration.scope).href;
    const badgeIcon = new URL(d.badge || 'assets/badge-96.png', self.registration.scope).href;
    self.registration.showNotification(d.title || 'Math 3 🔔', {
      body: d.body || '',
      icon: appIcon,
      badge: badgeIcon,
      data: { url: d.url || './' },
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      tag: d.tag || ('math3-' + Date.now()),
      renotify: true
    });
  }
});

// استقبال الـ Web Push الحقيقي من السيرفر - يعمل والجهاز مقفول والتطبيق خارج الرام تماماً
self.addEventListener('push', (event) => {
  let data = {
    title: 'Math 3 🔔',
    body: 'يوجد تحديث أو إشعار جديد في المنصة',
    url: './',
    icon: 'assets/icon.png',
    badge: 'assets/badge-96.png'
  };

  try {
    if (event.data) {
      const json = event.data.json();
      data = Object.assign(data, json);
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  // استثناء وحظر الريمايندرز وتذكيرات المواعيد لتظل حصرية لتيليجرام فقط 100%
  if (data.is_reminder || data.type === 'reminder' || (data.title && (data.title.includes('تذكير') || data.title.includes('ريمندر')))) {
    return;
  }

  const appIcon = new URL(data.icon || 'assets/icon.png', self.registration.scope).href;
  const badgeIcon = new URL(data.badge || 'assets/badge-96.png', self.registration.scope).href;

  const options = {
    body: data.body,
    icon: appIcon,
    badge: badgeIcon,
    data: { url: data.url || './' },
    dir: 'rtl',
    lang: 'ar',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || ('math3-push-' + Date.now()),
    renotify: true,
    requireInteraction: false
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
