import express from "express";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as webpush from "web-push";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS: يسمح لواجهة GitHub Pages باستدعاء هذا السيرفر (حدد النطاق في ALLOWED_ORIGINS مفصولاً بفواصل)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((o) => o.trim()).filter(Boolean);
app.use("/api", (req: Request, res: Response, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes("*") ? "*" : origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});


// إعداد مفاتيح VAPID لإشعارات الويب الحقيقية
const VAPID_KEYS_FILE = path.resolve(process.cwd(), ".vapid.json");
const PUSH_SUBS_FILE = path.resolve(process.cwd(), "push_subscriptions.json");

let vapidKeys: { publicKey: string; privateKey: string };
try {
  if (fs.existsSync(VAPID_KEYS_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEYS_FILE, "utf-8"));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEYS_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
  }
} catch {
  vapidKeys = webpush.generateVAPIDKeys();
}

try {
  webpush.setVapidDetails(
    "mailto:salmamostafa7367@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (e) {
  console.warn("VAPID setup warning:", e);
}

// تخزين اشتراكات الـ Push
let pushSubscriptions: Array<{ endpoint: string; keys?: { p256dh: string; auth: string }; userAgent?: string }> = [];
try {
  if (fs.existsSync(PUSH_SUBS_FILE)) {
    pushSubscriptions = JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, "utf-8"));
  }
} catch {}

function saveSubscriptions() {
  try {
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(pushSubscriptions, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist push subscriptions:", err);
  }
}

// ذاكرة مؤقتة لمنع إرسال نفس الإشعار مرتين (Server-side deduplication)
const lastPushes = new Map<string, number>();

// مسار فحص عمل الخادم
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "math3-server", timestamp: new Date().toISOString() });
});

app.post("/api/test", (req: Request, res: Response) => {
  res.json({ ok: true, body: req.body });
});

// مفتاح VAPID العام
app.get("/api/vapid-public-key", (_req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// تسجيل اشتراك Web Push
app.post("/api/push-subscribe", (req: Request, res: Response) => {
  try {
    const { subscription, userAgent } = req.body || {};
    if (subscription && subscription.endpoint) {
      const idx = pushSubscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
      const subEntry = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: userAgent || "unknown",
      };
      if (idx >= 0) {
        pushSubscriptions[idx] = subEntry;
      } else {
        pushSubscriptions.push(subEntry);
      }
      saveSubscriptions();
    }
    res.json({ ok: true, count: pushSubscriptions.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to subscribe" });
  }
});

// إلغاء اشتراك Web Push
app.post("/api/push-unsubscribe", (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body || {};
    if (endpoint) {
      pushSubscriptions = pushSubscriptions.filter((s) => s.endpoint !== endpoint);
      saveSubscriptions();
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to unsubscribe" });
  }
});

// إرسال Web Push مع منع التكرار تماماً (Deduplicated Single-delivery)
app.post("/api/send-push", async (req: Request, res: Response) => {
  try {
    const { title, body, url, tag, delaySeconds } = req.body || {};
    const notifTitle = (title || "Math 3 🔔").trim();
    const notifBody = (body || "").trim();

    if (!notifBody) {
      res.status(400).json({ error: "Notification body is required" });
      return;
    }

    const pushHash = `${notifTitle}:::${notifBody}`;
    const now = Date.now();
    const lastTime = lastPushes.get(pushHash) || 0;

    // حظر تام لإرسال نفس الإشعار مرتين خلال 25 ثانية
    if (now - lastTime < 25000) {
      res.json({ ok: true, skippedDuplicate: true, message: "تم تجاهل الإرسال المكرر بنجاح" });
      return;
    }
    lastPushes.set(pushHash, now);

    // تنظيف الذاكرة القديمة
    for (const [k, time] of lastPushes.entries()) {
      if (now - time > 60000) lastPushes.delete(k);
    }

    const payload = JSON.stringify({
      title: notifTitle,
      body: notifBody,
      url: url || "./",
      tag: tag || `math3-alert-${Date.now()}`,
      icon: "assets/icon.png",
      badge: "assets/badge-96.png",
      timestamp: now,
    });

    const sendFn = async () => {
      const deadEndpoints: string[] = [];
      await Promise.all(
        pushSubscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as any,
              },
              payload,
              { TTL: 86400 }
            );
          } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              deadEndpoints.push(sub.endpoint);
            }
          }
        })
      );

      if (deadEndpoints.length > 0) {
        pushSubscriptions = pushSubscriptions.filter((s) => !deadEndpoints.includes(s.endpoint));
        saveSubscriptions();
      }
    };

    if (Number(delaySeconds) > 0) {
      setTimeout(sendFn, Number(delaySeconds) * 1000);
      res.json({ ok: true, scheduled: true, delaySeconds });
    } else {
      await sendFn();
      res.json({ ok: true, sentTo: pushSubscriptions.length });
    }
  } catch (err: any) {
    console.error("send-push error:", err);
    res.status(500).json({ error: err?.message || "Failed to send push" });
  }
});

// تحميل ملف التحديث deploy.zip المباشر
app.get("/deploy.zip", (_req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), "deploy.zip");
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, "deploy.zip");
  } else {
    res.status(404).send("deploy.zip not found");
  }
});

app.get("/download", (_req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), "deploy.zip");
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, "math3_updated_deploy.zip");
  } else {
    res.status(404).send("deploy.zip not found");
  }
});

const SYSTEM_INSTRUCTION = `أنت "المعلّم الذكي" — مساعد ذكاء اصطناعي عام وقوي جداً داخل منصة دفعة Math 3 (كلية التربية - قسم الرياضيات). 
مستخدموك طلاب وأعضاء هيئة تدريس، لكنك لست محصوراً في الرياضيات أو التربية: أجب عن أي سؤال في أي مجال (برمجة، علوم، لغات، كتابة، حياة يومية، أخبار، نصائح، ترجمة...) كما يفعل مساعد عام من الطراز الأول.

القواعد:
1. اللغة: ردّ بنفس لغة المستخدم (عربي مصري/فصحى أو إنجليزي). لا تحوّل اللغة من نفسك.
2. الطول المناسب: السؤال البسيط يأخذ إجابة قصيرة ومباشرة. المسائل والامتحانات تأخذ حلاً مرتباً خطوة بخطوة. لا حشو ولا محاضرات لم تُطلب.
3. الرياضيات: كن صارماً ودقيقاً. اذكر التعريفات والفرضيات، وبرر كل انتقال. استخدم LaTeX: $...$ داخل السطر و $$...$$ للمعادلات المنفصلة. أطّر الناتج النهائي بـ \\boxed{...}. راجع الحل مرة أخرى قبل الإرسال، وإن وجدت خطأ فصححه.
4. الصور و PDF: اقرأ كل صفحة وكل صورة بعناية، حتى لو كان المرفقات كثيرة. انقل نص كل سؤال كما هو أولاً ثم حلّه، وحافظ على ترقيم الأسئلة. إذا كان جزء غير مقروء أو غير واضح فقل ذلك صراحة بدل أن تخمّن. لا تتجاهل أي سؤال، وإن كثرت الأسئلة فاحلّها كلها بالترتيب.
5. التربية وطرق التدريس: عند الطلب استخدم نماذج مثل 5Es وCPA وتصنيف بلوم المعدّل، وشخّص المفاهيم البديلة.
6. البحث والمصادر: لديك أداة بحث في الويب. استخدمها لأي معلومة حديثة أو قابلة للتغير أو غير مؤكدة، وعندما يطلب المستخدم مصدراً أو مرجعاً أو رابطاً (أو "سورس") فابحث وأعطه المصادر الفعلية. لا تخترع روابط أو مراجع أبداً.
7. الأمانة: لا تدّعِ معرفة ما لا تعرفه. إذا لم تكن متأكداً فاذكر درجة تأكدك.
8. الرسم: إذا طُلب رسم أو شكل هندسي أو منحنى فأخرج كود <svg ...>...</svg> كاملاً ومستقلاً داخل الرد.
9. ملفات PDF: إذا طلب المستخدم مستنداً أو مذكرة للتحميل كـ PDF، اكتب محتواه منسقاً بالكامل ثم أنهِ ردك بسطر مستقل بهذا الشكل بالضبط: [PDF_DOCUMENT: عنوان المستند]`;

type AiSource = { title: string; uri: string };
type AiResult = { reply: string; sources: AiSource[]; provider: string; model: string };

function addSource(list: AiSource[], title: any, uri: any) {
  if (typeof uri !== "string" || !/^https?:\/\//i.test(uri)) return;
  if (list.some((s) => s.uri === uri)) return;
  list.push({ title: String(title || uri), uri });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

function isValidKey(k: string | undefined) {
  return !!k && k.length > 8 && !/MY_(GEMINI|ANTHROPIC)_API_KEY/.test(k);
}

// ملاحظة: يُرسل كل المحتوى (حتى المرفقات القديمة) للموديل الذي يدعم الصور وPDF
function normalizeAttachments(attachments: any[]) {
  const out: Array<{ name: string; mime: string; data: string }> = [];
  for (const att of attachments) {
    if (!att || typeof att.data !== "string") continue;
    const m = att.data.match(/^data:([^;]+);base64,/);
    const data = att.data.replace(/^data:[^;]+;base64,/, "");
    const name = String(att.name || "file");
    let mime = String(att.type || (m && m[1]) || "").toLowerCase();
    if (!mime || mime === "application/octet-stream") {
      const n = name.toLowerCase();
      if (n.endsWith(".pdf")) mime = "application/pdf";
      else if (n.endsWith(".png")) mime = "image/png";
      else if (n.endsWith(".webp")) mime = "image/webp";
      else if (n.endsWith(".gif")) mime = "image/gif";
      else if (/\.(jpe?g)$/.test(n)) mime = "image/jpeg";
      else if (/\.(txt|md|csv|json|tex)$/.test(n)) mime = "text/plain";
    }
    out.push({ name, mime, data });
  }
  return out;
}

function cleanHistory(history: any, currentText: string) {
  const items: Array<{ role: "user" | "assistant"; text: string }> = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-24)) {
      if (!h || typeof h.text !== "string" || !h.text.trim()) continue;
      if (h.role !== "user" && h.role !== "model" && h.role !== "assistant") continue;
      items.push({ role: h.role === "user" ? "user" : "assistant", text: h.text.slice(0, 12000) });
    }
  }
  // العميل قد يرسل الرسالة الحالية ضمن التاريخ؛ نحذف التكرار
  const last = items[items.length - 1];
  if (last && last.role === "user" && last.text.trim() === currentText.trim()) items.pop();
  while (items.length && items[0].role !== "user") items.shift();
  return items;
}

async function callClaude(
  apiKey: string,
  userPrompt: string,
  files: ReturnType<typeof normalizeAttachments>,
  history: ReturnType<typeof cleanHistory>,
  allowSearch: boolean
): Promise<AiResult> {
  const model = process.env.CLAUDE_MODEL || "claude-opus-5-5";
  const messages: any[] = history.map((h) => ({ role: h.role, content: h.text }));

  const userContent: any[] = [];
  for (const f of files) {
    if (f.mime === "application/pdf") {
      userContent.push({ type: "text", text: `[ملف: ${f.name}]` });
      userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } });
    } else if (/^image\/(jpeg|png|gif|webp)$/.test(f.mime)) {
      userContent.push({ type: "text", text: `[صورة: ${f.name}]` });
      userContent.push({ type: "image", source: { type: "base64", media_type: f.mime, data: f.data } });
    } else if (f.mime.startsWith("text/") || f.mime === "application/json") {
      const txt = Buffer.from(f.data, "base64").toString("utf-8").slice(0, 200000);
      userContent.push({ type: "text", text: `[محتوى الملف ${f.name}]\n${txt}` });
    } else {
      userContent.push({ type: "text", text: `[تعذّر قراءة الملف ${f.name} لأن نوعه (${f.mime || "غير معروف"}) غير مدعوم. المدعوم: صور وPDF وملفات نصية.]` });
    }
  }
  userContent.push({
    type: "text",
    text:
      userPrompt ||
      "اقرأ كل المرفقات بعناية، وانقل نص كل سؤال فيها، ثم احلّ كل الأسئلة بالترتيب خطوة بخطوة.",
  });
  messages.push({ role: "user", content: userContent });

  const body: any = {
    model,
    max_tokens: Number(process.env.CLAUDE_MAX_TOKENS) || 12000,
    system: SYSTEM_INSTRUCTION,
    messages,
  };
  const budget = Number(process.env.CLAUDE_THINKING_BUDGET) || 0;
  if (budget >= 1024) body.thinking = { type: "enabled", budget_tokens: budget };
  if (allowSearch) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];

  const sources: AiSource[] = [];
  let text = "";

  // حلقة لمعالجة pause_turn الخاصة بأداة البحث
  for (let round = 0; round < 4; round++) {
    const resp = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      }),
      150000
    );
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(`Anthropic ${resp.status}: ${data?.error?.message || "unknown error"}`);
    }
    const blocks: any[] = Array.isArray(data.content) ? data.content : [];
    for (const b of blocks) {
      if (b.type === "text") {
        text += b.text;
        if (Array.isArray(b.citations)) for (const c of b.citations) addSource(sources, c.title, c.url);
      } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content) addSource(sources, r.title, r.url);
      }
    }
    if (data.stop_reason === "pause_turn") {
      body.messages = [...body.messages, { role: "assistant", content: blocks }];
      continue;
    }
    break;
  }
  if (!text.trim()) throw new Error("Empty reply from Claude");
  return { reply: text.trim(), sources, provider: "claude", model };
}

async function callGemini(
  apiKey: string,
  userPrompt: string,
  files: ReturnType<typeof normalizeAttachments>,
  history: ReturnType<typeof cleanHistory>,
  allowSearch: boolean,
  model: string
): Promise<AiResult> {
  const client = new GoogleGenAI({ apiKey });
  const contents: Array<{ role: "user" | "model"; parts: any[] }> = history.map((h) => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.text }],
  }));
  const parts: any[] = [];
  for (const f of files) {
    if (f.mime === "application/pdf" || /^image\//.test(f.mime)) {
      parts.push({ text: `[${f.name}]` });
      parts.push({ inlineData: { mimeType: f.mime, data: f.data } });
    } else if (f.mime.startsWith("text/") || f.mime === "application/json") {
      parts.push({ text: `[محتوى الملف ${f.name}]\n${Buffer.from(f.data, "base64").toString("utf-8").slice(0, 200000)}` });
    } else {
      parts.push({ text: `[تعذّر قراءة الملف ${f.name}: نوع غير مدعوم]` });
    }
  }
  parts.push({
    text: userPrompt || "اقرأ كل المرفقات بعناية، وانقل نص كل سؤال فيها، ثم احلّ كل الأسئلة بالترتيب خطوة بخطوة.",
  });
  contents.push({ role: "user", parts });

  const response: any = await withTimeout(
    client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        ...(allowSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    }),
    150000
  );
  const text = response?.text;
  if (!text) throw new Error("Empty reply from Gemini");
  const sources: AiSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) for (const c of chunks) addSource(sources, c?.web?.title, c?.web?.uri);
  return { reply: text, sources, provider: "gemini", model };
}

// مسار الذكاء الاصطناعي: Claude أولاً (إن وُجد المفتاح)، ثم Gemini احتياطياً
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, attachments } = req.body || {};
    const userPrompt = String(message || "").trim();
    const files = Array.isArray(attachments) ? normalizeAttachments(attachments) : [];

    if (!userPrompt && files.length === 0) {
      res.status(400).json({ error: "الرسالة أو المرفقات مطلوبة." });
      return;
    }

    const totalB64 = files.reduce((n, f) => n + f.data.length, 0);
    if (totalB64 > 30 * 1024 * 1024) {
      res.status(413).json({ error: "حجم المرفقات كبير جداً (الحد حوالي 22 ميجابايت). قسّمها على رسالتين." });
      return;
    }

    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hist = cleanHistory(history, userPrompt);
    const errors: string[] = [];

    // البحث متاح دائماً والموديل يقرر متى يستخدمه
    if (isValidKey(claudeKey)) {
      try {
        res.json(await callClaude(claudeKey!, userPrompt, files, hist, true));
        return;
      } catch (e: any) {
        console.warn("Claude call failed:", e?.message || e);
        errors.push(String(e?.message || e));
      }
    }
    if (isValidKey(geminiKey)) {
      // سلسلة موديلات: الأقوى أولاً، وإن فشل (حد الاستخدام المجاني مثلاً) ننزل للتالي تلقائياً
      const geminiModels = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite")
        .split(",").map((m) => m.trim()).filter(Boolean);
      for (const gm of geminiModels) {
        try {
          res.json(await callGemini(geminiKey!, userPrompt, files, hist, true, gm));
          return;
        } catch (e: any) {
          console.warn(`Gemini (${gm}) failed:`, e?.message || e);
          errors.push(`${gm}: ${String(e?.message || e)}`);
        }
      }
    }

    const noKeys = !isValidKey(claudeKey) && !isValidKey(geminiKey);
    res.status(noKeys ? 503 : 502).json({
      error: noKeys
        ? "لم يتم ضبط مفتاح الذكاء الاصطناعي في السيرفر (ANTHROPIC_API_KEY أو GEMINI_API_KEY)."
        : "تعذّر الحصول على رد من الذكاء الاصطناعي الآن. حاول مرة أخرى بعد قليل.",
      details: errors,
    });
  } catch (error: any) {
    console.error("Handler error:", error);
    res.status(500).json({ error: "حدث خطأ غير متوقع في السيرفر." });
  }
});

async function startServer() {
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || hasDist;

  if (!isProduction) {
    // vite يُحمَّل فقط في وضع التطوير (غير موجود عند npm install --omit=dev)
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    const assetsPath = path.resolve(process.cwd(), "assets");
    if (fs.existsSync(assetsPath)) {
      app.use("/assets", express.static(assetsPath));
    }
    app.get("*", (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, "index.html");
      if (fs.existsSync(indexFile)) res.sendFile(indexFile);
      else res.status(200).send("Math 3 AI server is running ✅ (واجهة الموقع مستضافة على GitHub Pages)");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Math 3 Server running on http://0.0.0.0:${PORT} (mode: ${isProduction ? "production" : "development"})`);
  });
}

startServer();
