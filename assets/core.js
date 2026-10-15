
const SUPABASE_URL = "https://xwnjimsoframcqstdjfo.supabase.co";
const SUPABASE_KEY = "sb_publishable_GxJNb-tD7jTgxskyPpgVLQ_ZNJZ9mm3";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
/* الرسائل تختفي بعد 5 ثواني (إلا لو keep) */
let sayTimer = null;
function say(t, keep) {
  $("msg").textContent = t;
  clearTimeout(sayTimer);
  if (t) sayTimer = setTimeout(() => { $("msg").textContent = ""; }, 5000);
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function showLoading(on) { $("loading").hidden = !on; }
/* المظهر */
// المظهر تلقائي دائمًا: يتبع إعداد مظهر الجهاز (Light / Dark).
// لا يوجد اختيار يدوي للمظهر.
const theme = "auto";
try { localStorage.removeItem("theme"); } catch (e) {}
document.documentElement.removeAttribute("data-theme");
/* التوقيت (توقيت مصر) */
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo", dateStyle: "full", timeStyle: "short",
});
const dateOnlyFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo", dateStyle: "full",
});
const logFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short",
});
function fmt(iso) { return dateFmt.format(new Date(iso)); }
function fmtDeadline(it) { return it.deadline_has_time === false ? dateOnlyFmt.format(new Date(it.deadline)) : fmt(it.deadline); }
function tzOffset(ms) {
  const p = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", hourCycle: "h23", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
    - Math.floor(ms / 1000) * 1000;
}
function localToISO(v) {
  const [d, t] = v.split("T");
  const [y, m, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const base = Date.UTC(y, m - 1, da, h, mi);
  let ms = base - tzOffset(base);
  ms = base - tzOffset(ms);
  return new Date(ms).toISOString();
}
function toLocalInput(iso) {
  const ms = new Date(iso).getTime();
  return new Date(ms + tzOffset(ms)).toISOString().slice(0, 16);
}
function safeUrl(u) {
  try {
    const x = new URL(u);
    return (x.protocol === "https:" || x.protocol === "http:") ? x.href : null;
  } catch (e) { return null; }
}
/* المرفقات */
const MAX_ATTACH = 10 * 1024 * 1024;
const WARN_ATTACH = 5 * 1024 * 1024;
const SHRINK_IMAGES = true; // تصغير الصور تلقائيًا قبل الرفع (اجعلها false لإيقافه)
async function shrinkImage(file) {
  const okTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!SHRINK_IMAGES || !okTypes.includes(file.type) || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 1600;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const cx = cv.getContext("2d");
    cx.fillStyle = "#fff";
    cx.fillRect(0, 0, w, h);
    cx.drawImage(bmp, 0, 0, w, h);
    if (bmp.close) bmp.close();
    const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch (e) { return file; }
}
function humanSize(n) {
  if (n == null) return "";
  if (n < 1024 * 1024) return Math.round(n / 1024) + " ك.ب";
  return (n / (1024 * 1024)).toFixed(1) + " م.ب";
}
async function uploadAttachment(sectionId, file) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = sectionId + "/" + Date.now() + "_" + safeName;
  const { error } = await sb.storage.from("attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) return { error };
  const { data } = sb.storage.from("attachments").getPublicUrl(path);
  return {
    data: {
      attachment_kind: "file", attachment_path: path, attachment_url: data.publicUrl,
      attachment_name: file.name, attachment_mime: file.type || "application/octet-stream",
      attachment_size: file.size,
    },
  };
}
async function removeAttachmentFiles(paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return;
  try { await sb.storage.from("attachments").remove(list); } catch (e) {}
}
async function uploadQAAttachment(file) {
  file = await shrinkImage(file);
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = "qa/" + Date.now() + "_" + safeName;
  const { error } = await sb.storage.from("attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) return { error };
  const { data } = sb.storage.from("attachments").getPublicUrl(path);
  return {
    data: {
      attachment_url: data.publicUrl, attachment_path: path,
      attachment_name: file.name, attachment_mime: file.type || "application/octet-stream",
      attachment_size: file.size,
    },
  };
}
function renderQAAttachment(obj) {
  if (!obj.attachment_url) return null;
  const wrap = el("div");
  const mime = obj.attachment_mime || "";
  if (mime.startsWith("image/")) {
    const img = el("img");
    img.src = obj.attachment_url;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    wrap.appendChild(img);
  } else if (mime.startsWith("video/")) {
    const v = el("video");
    v.src = obj.attachment_url;
    v.controls = true;
    v.style.maxWidth = "100%";
    wrap.appendChild(v);
  } else if (mime === "application/pdf") {
    const f = el("iframe");
    f.src = obj.attachment_url;
    f.style.width = "100%";
    f.style.height = "60vh";
    f.style.border = "2px solid var(--line)";
    f.style.borderRadius = "8px";
    wrap.appendChild(f);
  }
  const box = el("div", "row");
  const open = el("a", "btn", "↗️ فتح في نافذة جديدة");
  open.href = obj.attachment_url;
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  box.appendChild(open);
  const dl = el("a", "btn", "⬇️ تحميل" + (obj.attachment_size ? " (" + humanSize(obj.attachment_size) + ")" : ""));
  dl.href = obj.attachment_url + (obj.attachment_url.includes("?") ? "&" : "?")
    + "download=" + encodeURIComponent(obj.attachment_name || "");
  dl.rel = "noopener noreferrer";
  box.appendChild(dl);
  wrap.appendChild(box);
  return wrap;
}

export {
  sb, $, say, el, showLoading, fmt, fmtDeadline, logFmt, tzOffset, localToISO, toLocalInput, safeUrl,
  MAX_ATTACH, WARN_ATTACH, SHRINK_IMAGES, shrinkImage, humanSize,
  uploadAttachment, removeAttachmentFiles, uploadQAAttachment, renderQAAttachment
};
function getPostIdFromLocation() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('post')) {
        return urlParams.get('post');
    }
    const hash = window.location.hash.replace('#', '');
    return hash ? hash : null;
}
