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
      await registerServiceWorker();
      startRealtimeNotifications();
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
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: "icon.svg",
          badge: "icon.svg",
          data: { url },
          dir: "rtl",
          lang: "ar"
        });
        return;
      }
    }
    new Notification(title, { body, icon: "icon.svg" });
  } catch (e) {
    console.error("Local notification error:", e);
  }
}

export function startRealtimeNotifications() {
  if (!isPushEnabled() || _realtimeChannel) return;
  try {
    _realtimeChannel = sb.channel("public-changes")
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
        if (n && !n.is_reminder) {
          triggerLocalNotification(n.title || "تنبيه جديد 🔔", n.body || n.message || "تحديث جديد في درايف");
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "drive_seen_files" }, (payload) => {
        const f = payload.new;
        if (f) {
          const fname = f.file_name || f.name || f.title || "تم رفع ملف جديد في مجلدات درايف";
          triggerLocalNotification("ملف درايف جديد 📁", fname);
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Realtime notification subscription error:", e);
  }
}

export function showNotificationModal() {
  const existing = $("notif-modal");
  if (existing) existing.remove();

  const enabled = isPushEnabled();
  const modal = el("div", "card", "");
  modal.id = "notif-modal";
  modal.style.border = "2px solid var(--line)";
  modal.style.padding = "16px";
  modal.style.marginTop = "12px";

  const head = el("div", "row");
  head.style.justifyContent = "space-between";
  head.appendChild(el("h3", "", "إشعارات الويب 🔔"));
  const closeBtn = el("button", "small", "✕");
  closeBtn.addEventListener("click", () => modal.remove());
  head.appendChild(closeBtn);
  modal.appendChild(head);

  const statusP = el("p", "meta", "الحالة الحالية: " + (enabled ? "مفعّلة ✅" : "معطلة 🔕"));
  statusP.style.fontSize = "14px";
  statusP.style.fontWeight = "bold";
  statusP.style.color = enabled ? "var(--accent)" : "inherit";
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

  const actions = el("div", "row");
  actions.style.marginTop = "12px";
  actions.style.gap = "8px";

  if (!enabled) {
    const enableBtn = el("button", "btn-primary", "تفعيل إشعارات الويب");
    enableBtn.addEventListener("click", async () => {
      enableBtn.disabled = true;
      const ok = await requestPushPermission();
      enableBtn.disabled = false;
      if (ok) {
        say("تم التفعيل بنجاح!");
        modal.remove();
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
      modal.remove();
    });
    actions.appendChild(disableBtn);
  }

  modal.appendChild(actions);

  const box = $("dashboard") || $("list") || $("app");
  if (box) box.prepend(modal);
}
