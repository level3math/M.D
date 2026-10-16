/* Math 3 — محرر الهوية البصرية (للأونر) + تطبيقها على الموقع كله
   - النهار والليل ثيمين منفصلين، والوضع نفسه تلقائي حسب جهاز المستخدم.
   - التعديلات معاينة محلية، ولا تصل للطلاب إلا بزرار "حفظ للجميع".
   - الافتراضي مطابق تمامًا لشكل الموقع الحالي. */
import { sb, el, say, safeUrl } from "./core.js";
import { isFull } from "./state.js";
import { field } from "./ui.js";

const CACHE_KEY = "math3_theme_v1";
const HEX = /^#[0-9a-f]{6}$/i;
const COLOR_KEYS = ["accent", "paper", "card", "ink", "line", "patternColor",
  "darkAccent", "darkPaper", "darkCard", "darkInk", "darkLine", "darkPatternColor"];

const DEFAULTS = {
  accent: "#0f766e", paper: "#f3f9f7", card: "#ffffff", ink: "#163d39", line: "#afd2ce", patternColor: "#0f766e",
  darkAccent: "#4fd1c5", darkPaper: "#0b1f1d", darkCard: "#12312e", darkInk: "#e7f2fb", darkLine: "#235d58", darkPatternColor: "#4fd1c5",
  bgType: "image",
  pattern: "grid",
  bgImage: "https://thumbs.dreamstime.com/b/math-vector-seamless-background-formulas-plots-equations-handwritten-white-grid-copybook-paper-scientific-endless-145507710.jpg",
  bgOpacity: 0.16,
  radius: 12, fontSize: 18, width: 720
};

const PATTERNS = {
  grid: { label: "شبكة رياضية", img: "linear-gradient(var(--pattern-color) 1px,transparent 1px),linear-gradient(90deg,var(--pattern-color) 1px,transparent 1px)", size: "32px 32px" },
  dots: { label: "نقاط", img: "radial-gradient(circle,var(--pattern-color) 1.2px,transparent 1.7px)", size: "22px 22px" },
  waves: { label: "موجات", img: "repeating-radial-gradient(ellipse at 0 0,transparent 0 12px,var(--pattern-color) 13px 14px,transparent 15px 28px)", size: "180px 180px" },
  triangles: { label: "مثلثات", img: "linear-gradient(135deg,var(--pattern-color) 10%,transparent 10% 50%,var(--pattern-color) 50% 60%,transparent 60%)", size: "48px 48px" }
};

/* ألوان جاهزة: [اسم، accent، paper، card، ink، darkAccent، darkPaper، darkCard] */
const PRESETS = [
  ["classic", "الحالي", "#2b6f9f", "#f8fbff", "#ffffff", "#1e2b3a", "#72b6df", "#101820", "#18232d"],
  ["mint", "نعناع", "#0f766e", "#f3f9f7", "#ffffff", "#163d39", "#4fd1c5", "#0b1f1d", "#12312e"],
  ["violet", "بنفسجي", "#6d3fd4", "#f8f6fc", "#ffffff", "#2f2650", "#a78bfa", "#171126", "#261b3b"],
  ["amber", "كهرماني", "#b45309", "#fbf8f1", "#ffffff", "#49351e", "#fbbf24", "#21180b", "#33230d"],
  ["rose", "وردي", "#be123c", "#fff7f9", "#ffffff", "#4d2630", "#fb7185", "#241016", "#3a1720"],
  ["night", "ليلي", "#3f7fb0", "#eef4fa", "#ffffff", "#1c3044", "#6fc5ff", "#0b1118", "#151f2a"]
];

/* ---------- ألوان: دوال مساعدة ---------- */
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r) { return "#" + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function mix(a, b, t) { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v * t + y[i] * (1 - t))); }
function lum(h) {
  const c = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

/* ---------- التنظيف (أي قيمة جاية من الجهاز أو القاعدة) ---------- */
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
function sanitize(raw) {
  const o = { ...DEFAULTS };
  if (!raw || typeof raw !== "object") return o;
  COLOR_KEYS.forEach((k) => { if (typeof raw[k] === "string" && HEX.test(raw[k])) o[k] = raw[k].toLowerCase(); });
  if (["wallpaper", "pattern", "image", "none"].includes(raw.bgType)) o.bgType = raw.bgType;
  if (PATTERNS[raw.pattern]) o.pattern = raw.pattern;
  if (typeof raw.bgImage === "string" && raw.bgImage.length <= 600) o.bgImage = raw.bgImage;
  o.bgOpacity = raw.bgOpacity == null ? null : num(raw.bgOpacity, 0, 0.3, null);
  o.radius = num(raw.radius, 8, 28, DEFAULTS.radius);
  o.fontSize = num(raw.fontSize, 15, 22, DEFAULTS.fontSize);
  o.width = num(raw.width, 560, 1100, DEFAULTS.width);
  return o;
}

/* ---------- التطبيق على الصفحة ---------- */
let saved = { ...DEFAULTS };   /* النسخة المنشورة للجميع */
let draft = null;              /* تعديلات الأونر قيد المعاينة */
const isDark = () => !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

function applyTheme(t) {
  const r = document.documentElement;
  const dark = isDark();
  const set = (k, v) => r.style.setProperty(k, v);
  set("--accent", dark ? t.darkAccent : t.accent);
  set("--paper", dark ? t.darkPaper : t.paper);
  set("--card", dark ? t.darkCard : t.card);
  set("--ink", dark ? t.darkInk : t.ink);
  set("--line", dark ? t.darkLine : t.line);
  set("--pattern-color", dark ? t.darkPatternColor : t.patternColor);
  set("--radius", t.radius + "px");
  set("--base-font-size", t.fontSize + "px");
  set("--content-width", t.width + "px");
  r.setAttribute("data-theme", dark ? "dark" : "light");

  const defOpacity = dark ? 0.13 : 0.11;
  set("--wallpaper-opacity", String(t.bgOpacity == null ? defOpacity : t.bgOpacity));
  if (t.bgType === "wallpaper") {
    /* نفس الخلفية الحالية: نرجّع كل المتغيرات لقيم الـ CSS */
    ["--site-bg-image", "--site-bg-size", "--site-bg-position"].forEach((k) => r.style.removeProperty(k));
    set("--wallpaper-filter", dark ? "invert(1)" : "none");
    set("--wallpaper-blend", dark ? "screen" : "multiply");
    return;
  }
  set("--wallpaper-filter", "none");
  set("--wallpaper-blend", "normal");
  if (t.bgType === "none") {
    set("--site-bg-image", "none");
  } else if (t.bgType === "pattern") {
    const p = PATTERNS[t.pattern] || PATTERNS.grid;
    set("--site-bg-image", p.img);
    set("--site-bg-size", p.size);
    set("--site-bg-position", "0 0");
  } else {
    const u = safeUrl((t.bgImage || "").trim());
    if (u) {
      set("--site-bg-image", 'url("' + u.replace(/["\\()\s]/g, encodeURIComponent) + '")');
      set("--site-bg-size", "cover");
      set("--site-bg-position", "center");
    } else {
      set("--site-bg-image", "none");
    }
  }
}
const current = () => draft || saved;
const reapply = () => applyTheme(current());

function cacheSaved() { try { localStorage.setItem(CACHE_KEY, JSON.stringify(saved)); } catch (e) {} }
function initTheme() {
  try { const raw = localStorage.getItem(CACHE_KEY); if (raw) saved = sanitize(JSON.parse(raw)); } catch (e) {}
  applyTheme(saved);
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => reapply();
    try { mq.addEventListener("change", fn); } catch (e) { try { mq.addListener(fn); } catch (_) {} }
  }
  // جلب أحدث ثيم منشور من قاعدة البيانات فور فتح الصفحة حتى للمتصفح المتخفي
  loadThemeFromDb();
}
/* بعد الدخول: هات الهوية المنشورة للجميع (من غير ما نوقف الصفحة) */
async function loadThemeFromDb() {
  try {
    const { data, error } = await sb.from("site_theme").select("value").eq("key", "theme");
    if (error || !Array.isArray(data) || !data.length) return false;
    saved = sanitize(JSON.parse(data[0].value));
    cacheSaved();
    if (!draft) applyTheme(saved);
    return true;
  } catch (e) {
    return false;
  }
}
async function saveThemeToDb(t) {
  const { error } = await sb.from("site_theme").upsert({ key: "theme", value: JSON.stringify(t) }, { onConflict: "key" });
  if (error) throw error;
}
/* لو الأونر خرج من الشاشة من غير حفظ: نرجّع المنشور */
function discardThemeDraft() {
  if (!draft) return;
  draft = null;
  applyTheme(saved);
}

/* ---------- واجهة المحرر ---------- */
/* المحرر نفسه بيفضل بألوان الثيم المنشور (مش المسودة) عشان يفضل مقروء مهما اخترتي */
function lockEditorColors(box) {
  const d = isDark(), s = saved;
  const set = (k, v) => box.style.setProperty(k, v);
  set("--paper", d ? s.darkPaper : s.paper);
  set("--card", d ? s.darkCard : s.card);
  set("--ink", d ? s.darkInk : s.ink);
  set("--line", d ? s.darkLine : s.line);
  set("--accent", d ? s.darkAccent : s.accent);
  set("--radius", s.radius + "px");
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function renderThemeEditor(box, onBack) {
  box.replaceChildren();
  if (!isFull()) { box.appendChild(el("p", "meta", "المظهر متاح للمالك فقط.")); return; }
  lockEditorColors(box);
  if (!draft) draft = { ...saved };
  const dirty = () => !same(draft, saved);

  const top = el("div", "card");
  const head = el("div", "row");
  head.appendChild(el("h2", "", "🎨 المظهر"));
  const back = el("button", "small", "← الرئيسية");
  back.addEventListener("click", () => {
    if (dirty() && !confirm("فيه تعديلات لسه ما اتحفظتش. الرجوع هيلغيها. متأكدة؟")) return;
    discardThemeDraft();
    onBack();
  });
  head.appendChild(back);
  top.appendChild(head);
  const status = el("p", "meta", "");
  top.appendChild(status);
  top.appendChild(el("p", "meta theme-note", "الوضع (فاتح/داكن) بيتحدد تلقائيًا من جهاز كل مستخدم. هنا بتظبطي شكل الاتنين. التعديلات معاينة عندك بس لحد ما تدوسي «حفظ للجميع»."));
  box.appendChild(top);

  const updateStatus = () => { status.textContent = dirty() ? "● تعديلات غير محفوظة" : "✓ مطابق للمنشور حاليًا"; };
  const previews = [];
  const refresh = () => { reapply(); previews.forEach((f) => f()); warnFns.forEach((f) => f()); updateStatus(); };
  const warnFns = [];
  const change = (k, v) => { draft[k] = v; refresh(); };

  /* معاينة النهار والليل جنب بعض */
  const pv = el("div", "card");
  pv.appendChild(el("h3", "", "المعاينة"));
  const pvGrid = el("div", "theme-prev-grid");
  const mkPrev = (title, dark) => {
    const w = el("div", "theme-prev");
    w.innerHTML = '<strong class="t"></strong><div class="c"><b>عنوان تجريبي</b><p>نص الكارت بالألوان المختارة.</p><span class="b">زر</span></div>';
    w.querySelector(".t").textContent = title;
    const upd = () => {
      const p = dark ? draft.darkPaper : draft.paper, c = dark ? draft.darkCard : draft.card;
      const a = dark ? draft.darkAccent : draft.accent, i = dark ? draft.darkInk : draft.ink, l = dark ? draft.darkLine : draft.line;
      w.style.setProperty("--p", p); w.style.setProperty("--c", c); w.style.setProperty("--a", a);
      w.style.setProperty("--i", i); w.style.setProperty("--l", l); w.style.setProperty("--r", draft.radius + "px");
    };
    previews.push(upd); upd();
    return w;
  };
  pvGrid.append(mkPrev("☀️ نهار", false), mkPrev("🌙 ليل", true));
  pv.appendChild(pvGrid);
  box.appendChild(pv);

  /* ألوان جاهزة */
  const pr = el("div", "card");
  pr.appendChild(el("h3", "", "ألوان جاهزة"));
  const prRow = el("div", "theme-presets");
  PRESETS.forEach((x) => {
    const b = el("button", "theme-preset", x[1]);
    b.type = "button";
    b.style.setProperty("--preset", x[2]);
    b.addEventListener("click", () => {
      const [, , accent, paper, card, ink, dAccent, dPaper, dCard] = x;
      Object.assign(draft, {
        accent, paper, card, ink, line: mix(accent, paper, 0.3), patternColor: accent,
        darkAccent: dAccent, darkPaper: dPaper, darkCard: dCard, darkInk: "#e7f2fb",
        darkLine: mix(dAccent, dPaper, 0.35), darkPatternColor: dAccent
      });
      reapply(); renderThemeEditor(box, onBack);
    });
    prRow.appendChild(b);
  });
  pr.appendChild(prRow);
  box.appendChild(pr);

  /* ألوان النهار والليل */
  const panel = (title, keys, paperK, inkK) => {
    const c = el("div", "card");
    c.appendChild(el("h3", "", title));
    keys.forEach(([k, label]) => {
      const row = el("div", "theme-color-row");
      row.appendChild(el("span", "", label));
      const inp = el("input"); inp.type = "color"; inp.value = draft[k];
      inp.addEventListener("input", () => change(k, inp.value));
      row.appendChild(inp);
      c.appendChild(row);
    });
    const warn = el("p", "meta theme-warn", "");
    const w = () => {
      const ratio = contrast(draft[paperK], draft[inkK]);
      warn.textContent = ratio < 4.5 ? "⚠️ التباين بين النص والخلفية ضعيف (" + ratio.toFixed(1) + ":1) والقراءة هتبقى صعبة." : "";
    };
    warnFns.push(w); w();
    c.appendChild(warn);
    return c;
  };
  box.appendChild(panel("☀️ ثيم النهار", [["accent", "اللون الرئيسي"], ["paper", "خلفية الصفحة"], ["card", "الكروت"], ["ink", "النص"], ["line", "الحدود"], ["patternColor", "لون النقشة"]], "paper", "ink"));
  box.appendChild(panel("🌙 ثيم الليل", [["darkAccent", "اللون الرئيسي"], ["darkPaper", "خلفية الصفحة"], ["darkCard", "الكروت"], ["darkInk", "النص"], ["darkLine", "الحدود"], ["darkPatternColor", "لون النقشة"]], "darkPaper", "darkInk"));

  /* الخلفية */
  const bg = el("div", "card");
  bg.appendChild(el("h3", "", "🖼️ الخلفية"));
  const type = el("select");
  [["wallpaper", "رسومات المعادلات (الحالية)"], ["pattern", "نقشة جاهزة"], ["image", "صورة من رابط"], ["none", "بدون خلفية"]]
    .forEach(([v, l]) => { const o = el("option", "", l); o.value = v; type.appendChild(o); });
  type.value = draft.bgType;
  type.addEventListener("change", () => { draft.bgType = type.value; reapply(); renderThemeEditor(box, onBack); });
  bg.appendChild(field("نوع الخلفية", type));
  if (draft.bgType === "pattern") {
    const ps = el("select");
    Object.entries(PATTERNS).forEach(([v, p]) => { const o = el("option", "", p.label); o.value = v; ps.appendChild(o); });
    ps.value = draft.pattern;
    ps.addEventListener("change", () => change("pattern", ps.value));
    bg.appendChild(field("النقشة", ps));
  }
  if (draft.bgType === "image") {
    const u = el("input"); u.type = "url"; u.dir = "ltr"; u.placeholder = "https://.../background.jpg"; u.value = draft.bgImage;
    u.addEventListener("change", () => {
      const v = u.value.trim();
      if (v && !safeUrl(v)) { say("الرابط غير صالح"); return; }
      change("bgImage", v);
    });
    bg.appendChild(field("رابط الصورة", u));
  }
  if (draft.bgType !== "none") {
    const base = isDark() ? 0.13 : 0.11;
    const row = el("div", "theme-range-row");
    const lab = el("label", "", "");
    const r = el("input"); r.type = "range"; r.min = "0"; r.max = "0.3"; r.step = "0.01";
    r.value = String(draft.bgOpacity == null ? base : draft.bgOpacity);
    const setLab = () => { lab.textContent = "قوة ظهور الخلفية: " + Math.round(Number(r.value) * 100) + "%"; };
    setLab();
    r.addEventListener("input", () => { setLab(); change("bgOpacity", Number(r.value)); });
    row.append(lab, r); bg.appendChild(row);
  }
  box.appendChild(bg);

  /* الأشكال */
  const shape = el("div", "card");
  shape.appendChild(el("h3", "", "📐 الأشكال"));
  const range = (label, key, min, max, step, unit) => {
    const row = el("div", "theme-range-row");
    const lab = el("label", "", "");
    const r = el("input"); r.type = "range"; r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(draft[key]);
    const setLab = () => { lab.textContent = label + ": " + r.value + unit; };
    setLab();
    r.addEventListener("input", () => { setLab(); change(key, Number(r.value)); });
    row.append(lab, r); shape.appendChild(row);
  };
  range("استدارة الكروت", "radius", 8, 28, 1, "px");
  range("حجم الخط", "fontSize", 15, 22, 1, "px");
  range("عرض المحتوى (على الشاشات الكبيرة)", "width", 560, 1100, 20, "px");
  box.appendChild(shape);

  /* أزرار الحفظ */
  const acts = el("div", "card");
  const row = el("div", "row");
  const saveBtn = el("button", "", "حفظ للجميع");
  saveBtn.addEventListener("click", async () => {
    if (!isFull()) return;
    saveBtn.disabled = true;
    try {
      const clean = sanitize(draft);
      if (contrast(clean.paper, clean.ink) < 3 || contrast(clean.darkPaper, clean.darkInk) < 3) {
        say("التباين بين النص والخلفية ضعيف جدًا. عدّلي الألوان قبل الحفظ.", true);
        saveBtn.disabled = false;
        return;
      }
      await saveThemeToDb(clean);
      saved = clean; draft = { ...saved }; cacheSaved(); reapply();
      say("تم حفظ المظهر للجميع ✅"); updateStatus();
    } catch (e) {
      say("تعذّر الحفظ: " + ((e && e.message) || "") + " — تأكدي إنك شغّلتي ملف SQL الخاص بالمظهر", true);
    }
    saveBtn.disabled = false;
  });
  const undo = el("button", "", "تراجع عن التعديلات");
  undo.addEventListener("click", () => { draft = { ...saved }; reapply(); renderThemeEditor(box, onBack); });
  const reset = el("button", "danger", "الافتراضي");
  reset.addEventListener("click", () => {
    if (!confirm("إرجاع الألوان والأشكال للافتراضي (معاينة، ولسه محتاج حفظ)؟")) return;
    draft = { ...DEFAULTS }; reapply(); renderThemeEditor(box, onBack);
  });
  row.append(saveBtn, undo, reset);
  acts.appendChild(row);
  box.appendChild(acts);
  updateStatus();
}

export { initTheme, loadThemeFromDb, discardThemeDraft, renderThemeEditor };
