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
    const cleanBody = (d.body || '').trim();
    const cleanTitle = (d.title || '').trim();
    if (!cleanBody || 
        cleanBody === 'يوجد تحديث أو إشعار جديد في المنصة' || 
        cleanBody === 'تحديث جديد في المنصة' || 
        cleanBody.includes('تحديث حصل في البيدج') ||
        cleanBody.includes('تحديث حصل') ||
        cleanBody.includes('تحديث في المنصة') ||
        (cleanTitle.includes('تنبيه') && cleanBody.includes('تحديث'))) {
      return;
    }

    const appIcon = new URL(d.icon || 'assets/icon.png', self.registration.scope).href;
    const badgeIcon = new URL(d.badge || 'assets/badge-96.png', self.registration.scope).href;
    const tag = d.tag || ('math3-' + cleanTitle.replace(/[^\w\u0600-\u06FF]/g, '-'));
    self.registration.showNotification(d.title || 'Math 3 🔔', {
      body: cleanBody,
      icon: appIcon,
      badge: badgeIcon,
      data: { url: d.url || './' },
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      tag,
      renotify: true
    });
  }
});

let _swLastPushKey = '';
let _swLastPushTime = 0;

// استقبال الـ Web Push الحقيقي من السيرفر - يعمل والجهاز مقفول والتطبيق خارج الرام تماماً
self.addEventListener('push', (event) => {
  let data = {
    title: 'Math 3 🔔',
    body: '',
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

  const cleanTitle = (data.title || '').trim();
  const cleanBody = (data.body || '').trim();

  // تجاهل وحظر تام لأي إشعار تحديث عام مبهم مثل "تحديث جديد" أو "تحديث حصل في البيدج"
  const isGeneric = !cleanBody || 
                    cleanBody === 'يوجد تحديث أو إشعار جديد في المنصة' || 
                    cleanBody === 'تحديث جديد في المنصة' || 
                    cleanBody.includes('تحديث حصل في البيدج') ||
                    cleanBody.includes('تحديث حصل') ||
                    cleanBody.includes('تحديث في المنصة') ||
                    (cleanTitle.includes('تنبيه') && cleanBody.includes('تحديث'));
  if (isGeneric) {
    return;
  }

  const now = Date.now();
  const pushKey = `${cleanTitle}::${cleanBody}`;

  // منع التكرار خلال 8 ثوانٍ
  if (pushKey === _swLastPushKey && (now - _swLastPushTime < 8000)) {
    return;
  }

  _swLastPushKey = pushKey;
  _swLastPushTime = now;

  const appIcon = new URL(data.icon || 'assets/icon.png', self.registration.scope).href;
  const badgeIcon = new URL(data.badge || 'assets/badge-96.png', self.registration.scope).href;

  const tag = data.tag || ('math3-push-' + (data.title || '').replace(/[^\w\u0600-\u06FF]/g, '-'));
  const options = {
    body: data.body,
    icon: appIcon,
    badge: badgeIcon,
    data: { url: data.url || './' },
    dir: 'rtl',
    lang: 'ar',
    vibrate: [250, 100, 250, 100, 250],
    tag,
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
