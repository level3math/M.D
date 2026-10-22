const VAPID_PUBLIC_KEY = "BMNfM_QGnTIokAHFYR76cXduilrsVHe_90uzFbnkqEQkf0nVXoEekyhdsZSgssd2K__882GKh4-2XeLQ9tSdrfI";

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


// إرسال تنبيه محلي وبث فوري لكافة الأجهزة عند رفع مادة أو محاضرة أو تكليف
export function broadcastNewItem(title, courseId) {
  try {
    triggerLocalNotification("محتوى / محاضرة جديدة 📁", title || "تم إضافة عنصر جديد للمنصة");
    try {
      sb.functions.invoke("send-push", {
        body: { title: "محتوى / محاضرة جديدة 📁", body: title || "تم إضافة عنصر جديد للمنصة", url: "./" }
      }).catch(() => {});
    } catch(e) {}
    const ch = sb.channel("public-changes");
    ch.send({
      type: "broadcast",
      event: "new_item",
      payload: { title, course_id: courseId }
    });
  } catch (e) {
    console.warn("broadcast error:", e);
  }
}

// إرسال تنبيه محلي وبث فوري لكافة الأجهزة عند نشر بوست جديد
export function broadcastNewPost(content) {
  try {
    triggerLocalNotification("منشور جديد 📬", content ? content.slice(0, 80) : "يوجد منشور جديد في المنصة");
    try {
      sb.functions.invoke("send-push", {
        body: { title: "منشور جديد 📬", body: content ? content.slice(0, 80) : "يوجد منشور جديد في المنصة", url: "./" }
      }).catch(() => {});
    } catch(e) {}
    const ch = sb.channel("public-changes");
    ch.send({
      type: "broadcast",
      event: "new_post",
      payload: { content }
    });
  } catch (e) {
    console.warn("broadcast error:", e);
  }
}

import { sb, say, el, $ } from "./core.js";

const STORAGE_KEY = "math3_web_push";
let _realtimeChannel = null;

export function isPushSupported() {
  return ("Notification" in window) && ("serviceWorker" in navigator);
}

export function isPushEnabled() {
  return localStorage.getItem(STORAGE_KEY) === "1" && Notification.permission === "granted";
}

export async function requestPushPermission() {
  if (!isPushSupported()) {
    say("المتصفح لا يدعم إشعارات الويب.");
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem(STORAGE_KEY, "1");
      const reg = await registerServiceWorker();
      startRealtimeNotifications();

      // اشتراك الـ Web Push الحقيقي عبر PushManager ومفتاح VAPID مجاني 100%
      try {
        if (reg && "pushManager" in reg) {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
            });
          }
          if (sub) {
            const sj = sub.toJSON();
            // حفظ الاشتراك في Supabase لتلقي الإشعارات حتى والتطبيق مقفول تماماً
            await sb.from("push_subscriptions").upsert({
              endpoint: sub.endpoint,
              p256dh: sj.keys ? sj.keys.p256dh : "",
              auth: sj.keys ? sj.keys.auth : "",
              user_agent: navigator.userAgent
            }, { onConflict: "endpoint" }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("Push subscription fallback:", err);
      }

      triggerLocalNotification("Math 3 🔔", "تم تفعيل إشعارات الويب بنجاح!");
      return true;
    } else {
      localStorage.setItem(STORAGE_KEY, "0");
      say("تم رفض إذن الإشعارات من المتصفح.");
      return false;
    }
  } catch (e) {
    say("تعذّر تفعيل الإشعارات: " + (e.message || ""));
    return false;
  }
}

export function disablePushNotifications() {
  localStorage.setItem(STORAGE_KEY, "0");
  if (_realtimeChannel) {
    try { sb.removeChannel(_realtimeChannel); } catch (e) {}
    _realtimeChannel = null;
  }
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("./sw.js");
    return reg;
  } catch (e) {
    return null;
  }
}

export async function triggerLocalNotification(title, body, url = "./") {
  if (!isPushEnabled()) return;
  try {
    const iconUrl = new URL("assets/icon.png", location.href).href;
    const badgeUrl = new URL("assets/badge-96.png", location.href).href;
    const notifOptions = {
      body,
      icon: iconUrl,
      badge: badgeUrl,
      data: { url: url || "./" },
      dir: "rtl",
      lang: "ar",
      vibrate: [200, 100, 200],
      tag: "math3-" + Date.now(),
      renotify: true
    };

    // المحاولة 1: عبر ServiceWorker المباشر
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    }

    // المحاولة 2: عبر جاهزية ServiceWorker (مع Timeout ثانية واحدة عشان ميعلقش)
    if ("serviceWorker" in navigator) {
      const regReady = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 1000))
      ]);
      if (regReady && regReady.showNotification) {
        await regReady.showNotification(title, notifOptions);
        return;
      }
      if (regReady && regReady.active) {
        regReady.active.postMessage({ type: "SHOW_NOTIFICATION", title, body, url });
        return;
      }
    }

    // المحاولة 3 (Fallback فوري لنظام أندرويد والمتصفح):
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, notifOptions);
    }
  } catch (e) {
    console.error("Local notification error:", e);
    try {
      new Notification(title, { body });
    } catch (err) {}
  }
}

export function startRealtimeNotifications() {
  if (!isPushEnabled() || _realtimeChannel) return;
  try {
    _realtimeChannel = sb.channel("public-changes", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "new_item" }, (payload) => {
        const it = (payload && payload.payload) || {};
        triggerLocalNotification("محتوى / محاضرة جديدة 📁", it.title || "تم إضافة عنصر جديد للمنصة");
      })
      .on("broadcast", { event: "new_post" }, (payload) => {
        const p = (payload && payload.payload) || {};
        triggerLocalNotification("منشور جديد 📬", p.content ? p.content.slice(0, 80) : "يوجد منشور جديد في المنصة");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const p = payload.new;
        if (p && !p.deleted_at) {
          triggerLocalNotification("منشور جديد 📬", p.content ? p.content.slice(0, 80) : "يوجد منشور جديد في المنصة");
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, (payload) => {
        const it = payload.new;
        if (it && !it.deleted_at) {
          triggerLocalNotification("تكليف / مادة جديدة 📝", it.title || "تم إضافة عنصر جديد للمواد");
        }
      })
      .on("broadcast", { event: "drive_file" }, (payload) => {
        const d = payload.payload || {};
        const title = "ملف درايف جديد 📁";
        const body = (d.course ? d.course + ": " : "") + (d.folder ? "[" + d.folder + "] " : "") + (d.file || "تم رفع ملف جديد على درايف");
        triggerLocalNotification(title, body, d.url || "./");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const n = payload.new;
        // استثناء الريمايندرز وتذكيرات المواعيد لتظل حصرية على تيليجرام 100%
        if (n) {
          const isRem = Boolean(n.is_reminder || n.type === "reminder" || (n.title && n.title.includes("تذكير")));
          // حظر الريمايندرز نهائياً من إشعارات الويب لتظل حصرية لتليجرام
          if (!isRem) {
            triggerLocalNotification(n.title || "تنبيه جديد 🔔", n.body || n.message || "تحديث جديد في المنصة");
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "drive_seen_files" }, (payload) => {
        const f = payload.new;
        if (f) {
          const fname = f.file_name || f.name || f.title || "تم رفع ملف جديد في مجلدات درايف";
          triggerLocalNotification("ملف درايف جديد 📁", fname);
        }
      })
      
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "schedule" }, (payload) => {
        const sc = payload.new;
        if (sc) {
          triggerLocalNotification("تحديث في الجدول الدراسي 📅", "تمت إضافة حصة/محاضرة ليوم " + (sc.day_of_week || ""));
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Realtime notification subscription error:", e);
  }
}

export function showNotificationModal() {
  const existingBackdrop = $("notif-backdrop");
  if (existingBackdrop) { existingBackdrop.remove(); return; }

  const supported = isPushSupported();
  const enabled = supported && isPushEnabled();

  // خلفية معتمة تغطي الشاشة بالكامل في أي مكان بالموقع
  const backdrop = el("div");
  backdrop.id = "notif-backdrop";
  backdrop.style.position = "fixed";
  backdrop.style.inset = "0";
  backdrop.style.background = "rgba(0, 0, 0, 0.65)";
  backdrop.style.backdropFilter = "blur(5px)";
  backdrop.style.webkitBackdropFilter = "blur(5px)";
  backdrop.style.zIndex = "99999";
  backdrop.style.display = "flex";
  backdrop.style.alignItems = "center";
  backdrop.style.justifyContent = "center";
  backdrop.style.padding = "16px";
  backdrop.style.boxSizing = "border-box";

  // نافذة الإشعارات العائمة
  const modal = el("div", "card");
  modal.id = "notif-modal";
  modal.style.position = "relative";
  modal.style.maxWidth = "480px";
  modal.style.width = "100%";
  modal.style.maxHeight = "90vh";
  modal.style.overflowY = "auto";
  modal.style.background = "var(--card)";
  modal.style.border = "2px solid var(--line)";
  modal.style.borderRadius = "16px";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0 20px 40px rgba(0,0,0,0.45)";
  modal.style.margin = "0";

  // إغلاق عند الضغط خارج النافذة
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  const head = el("div", "row");
  head.style.justifyContent = "space-between";
  head.style.alignItems = "center";
  head.style.marginBottom = "14px";
  head.appendChild(el("h3", "", "إشعارات الويب 🔔"));
  
  const closeBtn = el("button", "small", "✕");
  closeBtn.style.padding = "4px 10px";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.borderRadius = "8px";
  closeBtn.addEventListener("click", () => backdrop.remove());
  head.appendChild(closeBtn);
  modal.appendChild(head);

  let statusText = "الحالة الحالية: " + (enabled ? "مفعّلة ✅" : "معطلة 🔕");
  if (!supported) statusText = "الحالة: غير مدعوم على هذا الإصدار ⚠️";
  const statusP = el("p", "meta", statusText);
  statusP.style.fontSize = "14px";
  statusP.style.fontWeight = "bold";
  statusP.style.color = enabled ? "var(--accent)" : "inherit";
  statusP.style.marginBottom = "12px";
  modal.appendChild(statusP);

  const notice = el("div", "card");
  notice.style.background = "var(--paper)";
  notice.style.border = "1px solid var(--line)";
  notice.style.padding = "12px";
  notice.style.fontSize = "13px";
  notice.style.lineHeight = "1.6";
  notice.innerHTML = `
    <strong>⚠️ ملاحظة هامة:</strong><br>
    في حال تفعيل إشعارات الويب وكان هذا الجهاز متصلاً أيضاً ببوت التيليجرام، قد تصلك الإشعارات العادية مكررة (على المتصفح وتيليجرام معاً).<br>
    <span style="color:var(--accent); font-weight:700;">📌 تنبيه: تذكيرات المواعيد والتسليم (الريمندرز) ستظل حصرية على تيليجرام فقط ولن تتكرر.</span>
  `;
  modal.appendChild(notice);

  // نوت مخصصة لآيفون فقط مع خطوات التفعيل الواضحة
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const iosBox = el("div", "card");
    iosBox.style.background = "var(--paper)";
    iosBox.style.border = "1.5px solid var(--accent)";
    iosBox.style.borderRadius = "12px";
    iosBox.style.padding = "12px 14px";
    iosBox.style.marginTop = "10px";
    iosBox.style.fontSize = "13px";
    iosBox.style.lineHeight = "1.7";
    
    if (!isStandalone) {
      iosBox.innerHTML = `
        <div style="font-weight:bold; color:var(--accent); margin-bottom:6px; font-size:14px; display:flex; align-items:center; gap:6px;">
          <span>🍎</span>
          <span>خطوات تفعيل الإشعارات لمستخدمي آيفون (iPhone):</span>
        </div>
        <div style="font-size:12px; opacity:0.9; margin-bottom:6px;">
          تشترط شركة آبل إضافة المنصة إلى الشاشة الرئيسية أولاً لتتمكن من استقبال إشعارات الويب:
        </div>
        <ol style="margin:0; padding-right:20px; font-size:12.5px;">
          <li>اضغط على زر المشاركة بالأسفل في متصفح سفاري (<strong>⬆️ Share</strong>).</li>
          <li>اختر من القائمة <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.</li>
          <li>افتح المنصة من أيقونة الشاشة، ثم اضغط على الجرس <strong>🔔</strong> للتفعيل فوراً.</li>
        </ol>
      `;
    } else {
      iosBox.innerHTML = `
        <div style="font-weight:bold; color:var(--accent); font-size:13.5px; display:flex; align-items:center; gap:6px;">
          <span>🍏</span>
          <span>أنت الآن تستخدم تطبيق الشاشة الرئيسية - يمكنك تفعيل الإشعارات بضغطة واحدة أدناه!</span>
        </div>
      `;
    }
    modal.appendChild(iosBox);
  }

  const actions = el("div", "row");
  actions.style.marginTop = "14px";
  actions.style.gap = "8px";

  if (!supported) {
    const tgFallbackBox = el("div", "card");
    tgFallbackBox.style.background = "var(--paper)";
    tgFallbackBox.style.border = "1px solid var(--line)";
    tgFallbackBox.style.padding = "10px 12px";
    tgFallbackBox.style.fontSize = "13px";
    tgFallbackBox.style.lineHeight = "1.6";
    tgFallbackBox.innerHTML = `
      <strong>💡 بديل ممتاز لجهازك:</strong><br>
      إصدار هذا الجهاز لا يدعم إشعارات الويب المباشرة. يمكنك تفعيل واستقبال كافة التنبيهات والإشعارات فورياً عبر <strong>بوت التيليجرام</strong>.
    `;
    modal.appendChild(tgFallbackBox);

    const tgBtn = el("a", "btn btn-primary", "فتح بوت التيليجرام ✈️");
    tgBtn.href = "https://t.me/MATHDEPARTMENT_BOT";
    tgBtn.target = "_blank";
    tgBtn.rel = "noopener noreferrer";
    actions.appendChild(tgBtn);
  } else if (!enabled) {
    const enableBtn = el("button", "btn-primary", "تفعيل إشعارات الويب");
    enableBtn.addEventListener("click", async () => {
      enableBtn.disabled = true;
      const ok = await requestPushPermission();
      enableBtn.disabled = false;
      if (ok) {
        say("تم التفعيل بنجاح!");
        backdrop.remove();
      }
    });
    actions.appendChild(enableBtn);
  } else {
    const testBtn = el("button", "", "تجربة إشعار الآن");
    testBtn.addEventListener("click", () => {
      triggerLocalNotification("Math 3 - إشعار تجريبي 🧪", "إشعارات الويب تعمل بنجاح وبشكل متناغم مع جهازك!");
      say("تم إرسال إشعار تجريبي للجهاز");
    });
    actions.appendChild(testBtn);

    const disableBtn = el("button", "danger", "إيقاف الإشعارات");
    disableBtn.addEventListener("click", () => {
      disablePushNotifications();
      say("تم إيقاف إشعارات الويب.");
      backdrop.remove();
    });
    actions.appendChild(disableBtn);
  }

  modal.appendChild(actions);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}