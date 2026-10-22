import express, { Request, Response } from 'express';
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// VAPID keys for Web Push Notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BNngc09Q2an6fPp6f_emVxzsNZ-zfmyz1JqB0qE3X0IY9IrWcjPLCRC1bLkIhuHdrVrSCqJq2YdxBtPX5M8hGcg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'R8NkdTiw3b8RsemmO55YBbC4zfFmWgbmTulDKLGIND0';
const VAPID_SUBJECT = 'mailto:salmanader888@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const DATA_DIR = path.join(__dirname, 'data');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
  lastUsedAt?: string;
}

function loadSubscriptions(): StoredSubscription[] {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      const content = fs.readFileSync(SUBS_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (e) {
    console.error('Error loading subscriptions:', e);
  }
  return [];
}

function saveSubscriptions(subs: StoredSubscription[]): void {
  try {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving subscriptions:', e);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Enable CORS for cross-domain static deployments (Netlify, Vercel, etc.)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // 1. Get VAPID Public Key
  app.get('/api/vapid-public-key', (req: Request, res: Response) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // 2. Subscribe to Web Push
  app.post('/api/push-subscribe', (req: Request, res: Response) => {
    const { subscription, userAgent } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ error: 'Invalid push subscription payload' });
      return;
    }

    const subs = loadSubscriptions();
    const existingIndex = subs.findIndex(s => s.endpoint === subscription.endpoint);
    const item: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent: userAgent || req.headers['user-agent'] || '',
      createdAt: existingIndex >= 0 ? subs[existingIndex].createdAt : new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      subs[existingIndex] = item;
    } else {
      subs.push(item);
    }

    saveSubscriptions(subs);
    console.log(`[WebPush] Subscription saved. Total active subscribers: ${subs.length}`);
    res.json({ success: true, total: subs.length });
  });

  // 3. Unsubscribe
  app.post('/api/push-unsubscribe', (req: Request, res: Response) => {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint required' });
      return;
    }

    let subs = loadSubscriptions();
    const beforeCount = subs.length;
    subs = subs.filter(s => s.endpoint !== endpoint);
    saveSubscriptions(subs);
    console.log(`[WebPush] Unsubscribed: ${beforeCount - subs.length} removed.`);
    res.json({ success: true, total: subs.length });
  });

  // 4. Send Web Push Notification to all subscribed devices
  app.post('/api/send-push', async (req: Request, res: Response) => {
    const { title, body, url, tag, delaySeconds, is_reminder, type } = req.body;

    // استثناء وحظر الريمايندرز وتذكيرات المواعيد لتظل حصرية لتيليجرام فقط
    if (is_reminder || type === 'reminder' || (title && (title.includes('تذكير') || title.includes('ريمندر')))) {
      res.json({ success: true, skipped: true, reason: 'Reminders are exclusive to Telegram' });
      return;
    }

    const payload = JSON.stringify({
      title: title || 'Math 3 🔔',
      body: body || 'تنبيه جديد من منصة Math 3',
      url: url || './',
      tag: tag || ('math3-' + Date.now()),
      icon: 'assets/icon.png',
      badge: 'assets/badge-96.png',
      timestamp: Date.now()
    });

    const sendFn = async () => {
      const subs = loadSubscriptions();
      if (!subs.length) {
        console.log('[WebPush] No subscribers registered yet.');
        return { sent: 0, failed: 0 };
      }

      console.log(`[WebPush] Broadcasting to ${subs.length} device(s): "${title}"`);
      const invalidEndpoints: string[] = [];
      let successCount = 0;

      await Promise.all(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys
              },
              payload,
              {
                TTL: 60 * 60 * 24, // 24 hours
                urgency: 'high'
              }
            );
            successCount++;
          } catch (err: any) {
            console.warn(`[WebPush] Failed delivering to endpoint: ${err?.statusCode || err?.message}`);
            // If subscription expired or unsubscribed, prune it
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              invalidEndpoints.push(sub.endpoint);
            }
          }
        })
      );

      if (invalidEndpoints.length > 0) {
        const remaining = subs.filter(s => !invalidEndpoints.includes(s.endpoint));
        saveSubscriptions(remaining);
        console.log(`[WebPush] Cleaned up ${invalidEndpoints.length} expired subscription(s).`);
      }

      return { sent: successCount, failed: subs.length - successCount };
    };

    if (delaySeconds && Number(delaySeconds) > 0) {
      const delayMs = Math.min(60, Number(delaySeconds)) * 1000;
      setTimeout(sendFn, delayMs);
      res.json({
        success: true,
        scheduled: true,
        delaySeconds,
        message: `تم جدولة الإشعار ليرسل بعد ${delaySeconds} ثوانٍ (يمكنك قفل الشاشة لتجربته الآن 🔒)`
      });
      return;
    }

    const result = await sendFn();
    res.json({
      success: true,
      deliveredCount: result.sent,
      failedCount: result.failed
    });
  });

  // 5. Subscriber stats
  app.get('/api/push-stats', (req: Request, res: Response) => {
    const subs = loadSubscriptions();
    res.json({ count: subs.length });
  });

  // 6. Direct zip download endpoint
  const downloadHandler = (req: Request, res: Response) => {
    let zipPath = path.join(__dirname, 'public', 'deploy.zip');
    if (!fs.existsSync(zipPath)) {
      zipPath = path.join(__dirname, 'public', 'math3_updated_deploy.zip');
    }
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'deploy.zip');
    } else {
      res.status(404).send('Deploy file not found');
    }
  };
  app.get('/download', downloadHandler);
  app.get('/download-zip', downloadHandler);
  app.get('/deploy.zip', downloadHandler);
  app.get('/math3_updated_deploy.zip', downloadHandler);

  // Setup Vite in middleware mode for hot development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.use(express.static(__dirname));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Math 3 Server with Web Push listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
