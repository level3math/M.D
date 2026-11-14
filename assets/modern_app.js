/* =========================================================================
   Math 3 - Modern Application Engine v2
   تكامل كامل لجميع ميزات المنصة مع التصميم المستوحى:
   - الطالب يضيف ويلغي ويعدل محاضراته بنفسه بدون أي بيانات وهمية
   - قسم النشرة الأسبوعية مدمج في الرئيسية وقائمة المزيد
   - تنوع واسع للثيمات وخيارات التخصيص
   - عدم تراكم الصفحات: كل قسم يفتح في مكانه مع زر رجوع واضح
   - الزر العائم واللوج إن مضبوطين 100%
   ========================================================================= */

import { state, isAdmin, isFull, courseName } from "./state.js";
import { el, $, say, fmt } from "./core.js";
import { getTrackerData, saveTrackerData, calculateCourseReadiness, calculateRealStreak, renderStudyTracker, pomodoroState } from "./study_tracker.js";
import { showNotificationModal } from "./notifications.js";
import { renderAiAssistantView } from "./ai_assistant.js";

// متغيرات حالة التنقل الحديثة
let currentTab = "home"; // "home" | "courses" | "tracker" | "schedule" | "more" | "ai" | "section"
let selectedCourseId = null; // لمشاهدة صفحة المادة
let courseDetailActiveTab = "lectures"; // "lectures" | "tasks" | "files" | "qa"
let activeScheduleDay = "";
let searchKeyword = "";
let currentOpenSectionId = null;
let isThemesDrawerOpen = false; // درج الثيمات القابل للفتح والإغلاق

// إعدادات الرموز المائية والألوان لمواد السايت الرسمية الـ 15
const COURSE_STYLING = [
  { match: ["منهج", "curriculum"], name: "المنهج المدرسي", color: "#f6d365", watermark: "C", defaultDays: 40 },
  { match: ["جودة", "quality"], name: "نظم الجودة", color: "#48c6ef", watermark: "Q", defaultDays: 35 },
  { match: ["إلكتروني", "الكتروني", "e-learning"], name: "التعليم الإلكتروني", color: "#00c6ff", watermark: "E", defaultDays: 28 },
  { match: ["تجارب", "جدارات", "قرن 21", "competenc"], name: "تجارب عالمية (جدارات القرن 21)", color: "#a8ff78", watermark: "21", defaultDays: 32 },
  { match: ["إبداع", "ابداع", "اتجاهات", "creativity"], name: "الاتجاهات الحديثة في تنمية الإبداع", color: "#f093fb", watermark: "💡", defaultDays: 30 },
  { match: ["complex", "مركبة", "تحليل مركب"], name: "Complex Analysis", color: "#52b6ff", watermark: "∫", defaultDays: 25 },
  { match: ["fluid", "فلويد", "سوائل", "موائع"], name: "Fluid", color: "#ff8fa3", watermark: "Δ", defaultDays: 9 },
  { match: ["topol", "توبولوجي"], name: "Topology", color: "#4ee3c1", watermark: "π", defaultDays: 12 },
  { match: ["operat", "بحوث عمليات"], name: "Operations Research", color: "#b59aff", watermark: "∑", defaultDays: 20 },
  { match: ["geometry", "تفاضلية", "هندسة تفاضلية"], name: "Differential Geometry", color: "#38ef7d", watermark: "∇", defaultDays: 18 },
  { match: ["continuum", "اتصال", "وسط متصل"], name: "Continuum Mechanics", color: "#a18cd1", watermark: "Ω", defaultDays: 15 },
  { match: ["partial", "جزئية", "pde"], name: "Partial Differential Equations", color: "#fbc2eb", watermark: "∂", defaultDays: 22 },
  { match: ["dynam", "ديناميكا", "تحليلية"], name: "Analytical Dynamics", color: "#bde85b", watermark: "θ", defaultDays: 33 },
  { match: ["function", "دالي", "تحليل دالي"], name: "Function Analysis", color: "#ffb067", watermark: "f", defaultDays: 30 },
  { match: ["إنجليزي", "انجليزي", "english", "لغة"], name: "اللغة الإنجليزية", color: "#38bdf8", watermark: "EN", defaultDays: 26 }
];

export function getCourseStyle(course) {
  if (!course) return { color: "#3de3ba", watermark: "λ", displayName: "Course", days: 14 };
  const raw = ((course.name || "") + " " + (course.code || "")).toLowerCase();
  for (const s of COURSE_STYLING) {
    if (s.match.some((m) => raw.includes(m))) {
      return {
        color: s.color,
        watermark: s.watermark,
        displayName: course.name || s.name,
        days: s.defaultDays
      };
    }
  }
  const fallbacks = ["λ", "Ω", "μ", "σ", "β", "α", "φ", "∞"];
  const charCode = (course.name || "").charCodeAt(0) || 0;
  return {
    color: "#3de3ba",
    watermark: fallbacks[charCode % fallbacks.length],
    displayName: course.name || "مادة دراسية",
    days: 15 + (charCode % 20)
  };
}

/* =========================================================================
   إعدادات سطر موعد أقرب امتحان (الظهور/الإخفاء وتعديل الأيام للأدمن والأونر فقط)
   ========================================================================= */
const EXAM_LINE_CONFIG_KEY = "math3_exam_line_config_v1";

export function getExamLineConfig() {
  try {
    const raw = localStorage.getItem(EXAM_LINE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { showExamLine: true, customDays: {}, courseVisibility: {} };
}

export function saveExamLineConfig(cfg) {
  try {
    localStorage.setItem(EXAM_LINE_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {}
}

export function isSubjectExamVisible(courseName) {
  const cfg = getExamLineConfig();
  if (cfg.showExamLine === false) return false;
  if (cfg.courseVisibility && cfg.courseVisibility[courseName] === false) return false;
  return true;
}

export function getCourseExamDays(courseName, fallbackDays = 30) {
  const cfg = getExamLineConfig();
  if (cfg.customDays && cfg.customDays[courseName] !== undefined) {
    return Number(cfg.customDays[courseName]);
  }
  return fallbackDays;
}

export function showExamConfigModal(onSaved, targetCourseName = null) {
  // خاص بالأدمن والأونر فقط - غير متاح للطلاب أو الزوار
  if (!isAdmin()) {
    say("تعديل سطر موعد الامتحان متاح للأدمن والأونر فقط 🔒");
    return;
  }

  const existing = $("exam-config-modal-backdrop");
  if (existing) existing.remove();

  const cfg = getExamLineConfig();
  let currentShowGlobal = cfg.showExamLine !== false;
  const currentCustomDays = { ...(cfg.customDays || {}) };
  const currentCourseVisibility = { ...(cfg.courseVisibility || {}) };

  const backdrop = el("div");
  backdrop.id = "exam-config-modal-backdrop";
  backdrop.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.72); backdrop-filter:blur(6px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;";

  const modal = el("div");
  modal.style.cssText = "background:var(--card-dark, #0d1a26); border:1.5px solid var(--card-border-active, #38bdf8); border-radius:20px; max-width:480px; width:100%; padding:22px; box-shadow:0 12px 36px rgba(0,0,0,0.6); color:var(--text-white, #fff); direction:rtl; font-family:inherit;";

  const roleTitle = isFull() ? "👑 أونر" : "⚙️ أدمن";

  modal.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08);">
      <div>
        <h3 style="margin:0; font-size:17px; font-weight:800; color:#38bdf8;">📅 إعدادات سطر موعد أقرب امتحان</h3>
        <p style="margin:4px 0 0; font-size:11.5px; color:var(--text-muted, #94a3b8);">${roleTitle} · تحكم كامل في إظهار أو إلغاء السطر وضبط الأيام</p>
      </div>
      <button type="button" id="close-exam-modal-btn" style="background:transparent; border:none; color:var(--text-muted, #94a3b8); font-size:18px; cursor:pointer;">✕</button>
    </div>

    <div style="display:flex; flex-direction:column; gap:14px;">
      <!-- مفتاح تفعيل أو إخفاء السطر العام -->
      <label style="display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.04); padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); cursor:pointer;">
        <input type="checkbox" id="exam-toggle-global-checkbox" ${currentShowGlobal ? "checked" : ""} style="width:20px; height:20px; accent-color:#38bdf8; cursor:pointer;" />
        <div>
          <strong style="font-size:13.5px; display:block;">تفعيل سطر موعد الامتحان عامة في المنصة</strong>
          <span style="font-size:11.5px; color:var(--text-muted, #94a3b8); display:block; margin-top:2px;">(عند إلغائه يختفي سطر "أقرب امتحان بعد X يوم" نهائياً من كافة المواد)</span>
        </div>
      </label>

      <!-- اختيار المادة وتعديل الأيام وحالة الظهور الخاصة بها -->
      <div id="exam-course-section" style="${currentShowGlobal ? 'display:block;' : 'display:none;'} background:rgba(255,255,255,0.03); padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
        <label style="font-size:12.5px; font-weight:bold; color:#a7f3d0; display:block; margin-bottom:6px;">اختر المادة لتخصيص إعداداتها:</label>
        <select id="exam-course-select" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.18); color:white; padding:8px 10px; border-radius:8px; font-size:13px; margin-bottom:12px;">
          ${(state.courses || []).map(c => `<option value="${c.name}" ${targetCourseName === c.name ? "selected" : ""}>${c.name}</option>`).join("")}
        </select>

        <label style="display:flex; align-items:center; gap:10px; margin-bottom:12px; cursor:pointer;">
          <input type="checkbox" id="exam-toggle-course-checkbox" checked style="width:18px; height:18px; accent-color:#38bdf8; cursor:pointer;" />
          <span style="font-size:12.5px; font-weight:600; color:var(--text-white, #fff);">إظهار سطر موعد الامتحان لهذه المادة المحددة</span>
        </label>

        <div id="course-days-wrap">
          <label style="font-size:12.5px; font-weight:bold; color:var(--text-white, #fff); display:block; margin-bottom:6px;">عدد الأيام المتبقية للامتحان:</label>
          <div style="display:flex; align-items:center; gap:8px;">
            <input type="number" id="exam-days-input" min="0" max="365" style="width:110px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.25); color:#38bdf8; font-weight:bold; font-size:16px; padding:6px 10px; border-radius:8px; text-align:center;" />
            <span style="font-size:13px; color:var(--text-muted, #94a3b8);">يوم</span>
          </div>
          <p style="font-size:11px; color:var(--text-muted, #94a3b8); margin-top:6px;">يظهر في كرت المادة بصيغة: "أقرب امتحان بعد [X] يوم"</p>
        </div>
      </div>

      <!-- أزرار الإجراءات -->
      <div style="display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-top:8px;">
        <button type="button" id="cancel-exam-modal-btn" class="small btn-secondary" style="padding:8px 16px; border-radius:10px; font-size:12.5px; cursor:pointer;">إلغاء</button>
        <button type="button" id="save-exam-modal-btn" class="small btn-primary" style="padding:8px 18px; border-radius:10px; font-size:12.5px; font-weight:bold; background:#0284c7; color:white; cursor:pointer;">حفظ التعديلات ✓</button>
      </div>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const toggleGlobalCheckbox = modal.querySelector("#exam-toggle-global-checkbox");
  const courseSection = modal.querySelector("#exam-course-section");
  const courseSelect = modal.querySelector("#exam-course-select");
  const toggleCourseCheckbox = modal.querySelector("#exam-toggle-course-checkbox");
  const courseDaysWrap = modal.querySelector("#course-days-wrap");
  const daysInput = modal.querySelector("#exam-days-input");

  function syncSelectedCourse() {
    if (!courseSelect) return;
    const selectedName = courseSelect.value;
    const c = (state.courses || []).find(x => x.name === selectedName);
    const style = getCourseStyle(c);
    const currentVal = getCourseExamDays(selectedName, style.days);
    if (daysInput) daysInput.value = currentVal;

    const isCourseVis = currentCourseVisibility[selectedName] !== false;
    if (toggleCourseCheckbox) {
      toggleCourseCheckbox.checked = isCourseVis;
      if (courseDaysWrap) courseDaysWrap.style.display = isCourseVis ? "block" : "none";
    }
  }

  syncSelectedCourse();
  if (courseSelect) courseSelect.addEventListener("change", syncSelectedCourse);

  if (toggleCourseCheckbox) {
    toggleCourseCheckbox.addEventListener("change", () => {
      if (!courseSelect) return;
      currentCourseVisibility[courseSelect.value] = toggleCourseCheckbox.checked;
      if (courseDaysWrap) courseDaysWrap.style.display = toggleCourseCheckbox.checked ? "block" : "none";
    });
  }

  if (toggleGlobalCheckbox) {
    toggleGlobalCheckbox.addEventListener("change", () => {
      if (courseSection) courseSection.style.display = toggleGlobalCheckbox.checked ? "block" : "none";
    });
  }

  modal.querySelector("#close-exam-modal-btn").addEventListener("click", () => backdrop.remove());
  modal.querySelector("#cancel-exam-modal-btn").addEventListener("click", () => backdrop.remove());

  modal.querySelector("#save-exam-modal-btn").addEventListener("click", () => {
    const isShowingGlobal = toggleGlobalCheckbox.checked;
    const selectedName = courseSelect ? courseSelect.value : "";
    const newDays = daysInput ? parseInt(daysInput.value, 10) : 30;

    if (selectedName && !isNaN(newDays) && newDays >= 0) {
      currentCustomDays[selectedName] = newDays;
    }

    if (selectedName && toggleCourseCheckbox) {
      currentCourseVisibility[selectedName] = toggleCourseCheckbox.checked;
    }

    saveExamLineConfig({
      showExamLine: isShowingGlobal,
      customDays: currentCustomDays,
      courseVisibility: currentCourseVisibility
    });

    say(isShowingGlobal ? `تم حفظ وضبط سطر الامتحان بنجاح ✅` : `تم إخفاء سطر الامتحان من الكروت بنجاح ✅`);
    backdrop.remove();
    if (onSaved) onSaved();
  });
}

// دالة التاريخ العربي
function getArabicDateStr(d = new Date()) {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function getTodayDayName() {
  const map = { 0: "الأحد", 1: "الاثنين", 2: "الثلاثاء", 3: "الأربعاء", 4: "الخميس", 5: "الجمعة", 6: "السبت" };
  return map[new Date().getDay()] || "الأحد";
}

function getUserInitial() {
  const name = (localStorage.getItem("tg_login_name") || "").trim();
  if (name) return name.charAt(0);
  if (state.role === "guest") return "ز";
  return "س";
}

function getUserDisplayName() {
  const name = (localStorage.getItem("tg_login_name") || "").trim();
  if (name) return name;
  if (state.role === "guest") return "زائر المنصة";
  return "سلمى";
}

// استخراج أقرب تكليف قادم
function getNextUpcomingItem() {
  const taskSec = (state.sections || []).find((s) => s.kind === "tasks");
  const secId = taskSec ? taskSec.id : null;
  const items = (state.items || []).filter((it) => !it.deleted_at && (secId ? it.section_id === secId : it.deadline));
  
  const now = Date.now();
  const upcoming = items
    .filter((it) => it.deadline && new Date(it.deadline).getTime() >= now - 60000)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  
  if (upcoming.length) return upcoming[0];
  if (items.length) return items[0];
  
  return null;
}

function formatDeadlineCountdown(iso) {
  if (!iso) return "موعد التسليم غير محدد";
  try {
    const diff = new Date(iso).getTime() - Date.now();
    const d = new Date(iso);
    const timeStr = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    if (diff < 0) return `انتهى التسليم · ${timeStr}`;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return `التسليم اليوم · الساعة ${timeStr}`;
    if (days === 1) return `التسليم غداً · الساعة ${timeStr}`;
    if (days === 2) return `التسليم بعد يومين · الساعة ${timeStr}`;
    return `التسليم بعد ${days} أيام · الساعة ${timeStr}`;
  } catch (e) {
    return "التسليم قريباً";
  }
}

/* =========================================================================
   مودال بومودورو
   ========================================================================= */
let pomodoroTimerId = null;
let pomodoroSecondsLeft = 25 * 60;
let pomodoroIsRunning = false;
let pomodoroCurrentSubject = "";

export function openPomodoroModal(subject = "") {
  if (subject) {
    pomodoroState.selectedCourse = subject;
  }
  switchModernTab("tracker");
  const root = $("modern-content-root");
  if (root) {
    renderStudyTracker(root, () => switchModernTab("home"), "pomodoro");
  }
}


/* =========================================================================
   الواجهة الرئيسية (Screen 1: الرئيسية - Home)
   ========================================================================= */
function renderModernHomeView(container) {
  container.replaceChildren();

  // الهيدر
  const header = el("div", "modern-header");
  const userWrap = el("div", "modern-header-user");
  userWrap.appendChild(el("div", "modern-header-date", getArabicDateStr()));
  userWrap.appendChild(el("h1", "modern-header-greeting", `أهلًا، ${getUserDisplayName()}`));
  header.appendChild(userWrap);

  const actionsWrap = el("div");
  actionsWrap.style.display = "flex";
  actionsWrap.style.alignItems = "center";
  actionsWrap.style.gap = "8px";

  const aiHeaderBtn = el("button", "modern-avatar-btn", "🧠");
  aiHeaderBtn.title = "المعلّم والأكاديمي الذكي (AI)";
  aiHeaderBtn.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(56, 189, 248, 0.25))";
  aiHeaderBtn.style.border = "1px solid var(--mint-primary)";
  aiHeaderBtn.addEventListener("click", () => switchModernTab("ai"));
  actionsWrap.appendChild(aiHeaderBtn);

  const avatar = el("button", "modern-avatar-btn", getUserInitial());
  avatar.title = "خيارات الحساب";
  avatar.addEventListener("click", () => switchModernTab("more"));
  actionsWrap.appendChild(avatar);
  header.appendChild(actionsWrap);
  container.appendChild(header);

  // كارت المعلّم والأكاديمي الذكي (Math & Pedagogy AI)
  const aiHero = el("div", "ai-home-hero-card");
  aiHero.innerHTML = `
    <div class="ai-home-hero-badge">✨ المعلّم والأكاديمي الذكي · AI</div>
    <h3 class="ai-home-hero-title">اسأله في أي حاجة، وارفع صور وPDF ليحلها</h3>
    <p class="ai-home-hero-desc">يقرأ الأسئلة من الصور وملفات PDF، يحلها خطوة بخطوة، يبحث في الويب ويجيب لك المصادر.</p>
    <button class="ai-home-hero-btn" type="button">اسأل المعلّم الذكي الآن 🧠 ←</button>
  `;
  aiHero.addEventListener("click", () => switchModernTab("ai"));
  container.appendChild(aiHero);

  // كارت ستريك المذاكرة الحقيقي (قاعدة اليومين الصارمة)
  const tData = getTrackerData();
  const streakInfo = calculateRealStreak(tData);

  const streakCard = el("div", "hero-next-card");
  streakCard.style.cursor = "pointer";
  streakCard.style.border = streakInfo.isAlive ? "1.5px solid rgba(245, 158, 11, 0.6)" : "1px solid var(--line)";
  streakCard.style.boxShadow = streakInfo.isAlive ? "0 0 16px rgba(245, 158, 11, 0.25)" : "none";
  streakCard.style.marginBottom = "14px";
  streakCard.addEventListener("click", () => switchModernTab("tracker"));

  let streakLineHtml = "";
  let streakHeaderHtml = "";
  if (streakInfo.isAlive) {
    streakHeaderHtml = `<div style="font-size:26px; font-weight:bold; color:#f59e0b; display:flex; align-items:center; gap:8px;">
      <span>${streakInfo.count}</span> <span style="font-size:22px;">🔥</span> <span style="font-size:13px; font-weight:normal; color:var(--text-white); opacity:0.85;">أيام متتالية مشتعلة</span>
    </div>`;
    streakLineHtml = `<div style="width:100%; height:4px; background:linear-gradient(90deg, #f59e0b, #ea580c); border-radius:4px; margin:6px 0 8px 0; box-shadow:0 0 10px rgba(245,158,11,0.5);"></div>`;
  } else if (streakInfo.consecutiveDays === 1) {
    streakHeaderHtml = `<div style="font-size:22px; font-weight:bold; color:var(--mint-primary); display:flex; align-items:center; gap:8px;">
      <span>1 / 2</span> <span style="font-size:18px;">⚡</span> <span style="font-size:13px; font-weight:normal; color:var(--text-white); opacity:0.85;">مرحلة الإعداد والتجهيز</span>
    </div>`;
    streakLineHtml = `<div style="width:50%; height:3px; background:var(--mint-primary); border-radius:3px; margin:6px 0 8px 0; opacity:0.8;"></div>`;
  } else {
    streakHeaderHtml = `<div style="font-size:22px; font-weight:bold; color:var(--text-muted); opacity:0.6; display:flex; align-items:center; gap:8px;">
      <span>0</span> <span>💤</span> <span style="font-size:13px; font-weight:normal; color:var(--text-white); opacity:0.7;">الستريك مطفأ</span>
    </div>`;
  }

  streakCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
      <div style="font-size:11px; font-weight:bold; color:var(--mint-primary); text-transform:uppercase; letter-spacing:1px;">ستريك المذاكرة اليومي</div>
      <div style="font-size:11px; color:var(--text-muted);">فتح تراك المذاكرة ←</div>
    </div>
    ${streakHeaderHtml}
    ${streakLineHtml}
    <div style="font-size:12px; color:var(--text-muted);">${streakInfo.statusText}</div>
  `;
  container.appendChild(streakCard);

  // كارت "التالي عليك"
  const nextItem = getNextUpcomingItem();
  if (nextItem) {
    const hero = el("div", "hero-next-card");
    hero.appendChild(el("div", "hero-next-label", "التالي عليك"));
    hero.appendChild(el("h2", "hero-next-title", nextItem.title));
    hero.appendChild(el("div", "hero-next-meta", formatDeadlineCountdown(nextItem.deadline)));

    const heroBtn = el("button", "hero-next-btn", "افتح التكليف");
    heroBtn.addEventListener("click", () => {
      openSectionInModernView("tasks");
    });
    hero.appendChild(heroBtn);
    container.appendChild(hero);
  }

  // كارت النشرة الأسبوعية إذا كانت متاحة
  const newsletterSec = (state.sections || []).find((s) => s.kind === "newsletter");
  if (newsletterSec) {
    const nlItems = (state.items || []).filter((x) => x.section_id === newsletterSec.id && !x.deleted_at);
    if (nlItems.length) {
      const latestNl = nlItems[nlItems.length - 1];
      const nlCard = el("div", "newsletter-hero-card");
      nlCard.appendChild(el("span", "newsletter-hero-tag", "📰 النشرة الأسبوعية للدفعة"));
      nlCard.appendChild(el("h3", "newsletter-hero-title", latestNl.title));
      if (latestNl.body) {
        nlCard.appendChild(el("p", "newsletter-hero-body", latestNl.body));
      }
      const nlBtn = el("button", "hero-next-btn", "اقرأ النشرة كاملة 📖");
      nlBtn.style.padding = "8px 18px";
      nlBtn.style.fontSize = "13px";
      nlBtn.addEventListener("click", () => {
        openSectionInModernView(newsletterSec.id);
      });
      nlCard.appendChild(nlBtn);
      container.appendChild(nlCard);
    }
  }

  // سكشن "النهاردة"
  const schedHeader = el("div", "section-header-row");
  schedHeader.appendChild(el("h3", "section-header-title", "النهاردة"));
  const schedLink = el("button", "section-header-link", "الجدول كله");
  schedLink.addEventListener("click", () => switchModernTab("schedule"));
  schedHeader.appendChild(schedLink);
  container.appendChild(schedHeader);

  const todaySchedCard = el("div", "today-sched-card");
  const todayName = getTodayDayName();
  const todayItems = (state.schedule || [])
    .filter((x) => x.day_of_week === todayName)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);

  if (todayItems.length) {
    todayItems.slice(0, 3).forEach((item) => {
      const c = (state.courses || []).find((x) => x.id === item.course_id);
      const cName = c ? c.name : "";
      const row = el("div", "today-sched-item");
      row.appendChild(el("span", "today-sched-name", `${item.title} ${cName}`.trim()));
      row.appendChild(el("span", "today-sched-time", item.time_slot || "09:00"));
      todaySchedCard.appendChild(row);
    });
  } else {
    const row = el("div", "today-sched-item");
    row.appendChild(el("span", "today-sched-name", "لا توجد محاضرات مجدولة اليوم ☕"));
    row.appendChild(el("span", "today-sched-time", "وقت رائع للمراجعة"));
    todaySchedCard.appendChild(row);
  }
  container.appendChild(todaySchedCard);

  // سكشن "كمّل من وقفت"
  const resumeCard = el("div", "resume-card");
  resumeCard.appendChild(el("div", "resume-label", "كمّل من وقفت"));

  const resumeRow = el("div", "resume-row");
  const resumeInfo = el("div");
  resumeInfo.style.flex = "1";

  let lastTopicTitle = "ابدأ أول جلسة مذاكرة ✨";
  let lastTopicProgress = 0;
  if (tData.sessions && tData.sessions.length) {
    const lastS = tData.sessions[tData.sessions.length - 1];
    if (lastS.subject) lastTopicTitle = lastS.subject;
    lastTopicProgress = 100;
  }

  resumeInfo.appendChild(el("h4", "resume-title", lastTopicTitle));
  const track = el("div", "resume-progress-track");
  const fill = el("div", "resume-progress-fill");
  fill.style.width = `${lastTopicProgress}%`;
  track.appendChild(fill);
  resumeInfo.appendChild(track);
  resumeRow.appendChild(resumeInfo);

  const circlePlay = el("button", "resume-circle-btn", "←");
  circlePlay.title = "متابعة المذاكرة";
  circlePlay.addEventListener("click", () => openPomodoroModal(lastTopicTitle));
  resumeRow.appendChild(circlePlay);
  resumeCard.appendChild(resumeRow);
  container.appendChild(resumeCard);
}

/* =========================================================================
   صفحة المواد (Screen 2: المواد - Courses)
   ========================================================================= */
function renderModernCoursesView(container) {
  container.replaceChildren();

  if (selectedCourseId) {
    renderCourseDetailView(container, selectedCourseId);
    return;
  }

  const head = el("div", "courses-page-header");
  head.appendChild(el("h1", "courses-title amiri-title", "المواد"));
  head.appendChild(el("p", "courses-subtitle", "اختار مادة وادخل صفحتها"));

  // شريط التحكم بسطر موعد الامتحان (متاح للأدمن والأونر فقط)
  if (isAdmin()) {
    const adminBar = el("div", "courses-admin-bar");
    adminBar.style.cssText = "display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:10px; margin-bottom:12px; padding:10px 14px; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:14px;";
    
    const roleBadge = isFull() ? "👑 أونر" : "⚙️ أدمن";
    const cfg = getExamLineConfig();
    const statusText = cfg.showExamLine !== false ? "مفعّل (ظاهر)" : "معطّل (مخفي)";

    adminBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-white);">
        <span>${roleBadge}</span> · 
        <span style="color:var(--text-muted);">سطر أقرب امتحان:</span>
        <strong style="color:${cfg.showExamLine !== false ? 'var(--mint-primary)' : '#f87171'};">${statusText}</strong>
      </div>
      <button type="button" class="small btn-secondary" style="font-size:11.5px; padding:5px 12px; border-radius:8px; cursor:pointer; font-weight:bold;">
        ⚙️ ضبط سطر ومواعيد الامتحانات
      </button>
    `;
    adminBar.querySelector("button").addEventListener("click", () => {
      showExamConfigModal(() => renderModernCoursesView(container));
    });
    head.appendChild(adminBar);
  }

  container.appendChild(head);

  if (!state.courses || !state.courses.length) {
    const loadingCard = el("div", "resume-card center");
    loadingCard.innerHTML = `
      <div style="font-size:30px; margin-bottom:8px;">⏳</div>
      <p style="margin:0 0 4px 0; font-size:15px; font-weight:700; color:var(--text-white);">جاري تحميل المواد المعتمدة...</p>
      <p style="margin:0; font-size:12.5px; color:var(--text-muted);">تأكد من اتصالك بالإنترنت</p>
    `;
    container.appendChild(loadingCard);
    return;
  }

  const grid = el("div", "courses-grid");
  const tData = getTrackerData();

  // فقط المواد الحقيقية المسجلة في قاعدة البيانات والمفعلة
  const coursesList = state.courses.filter((c) => c.is_active !== false);

  if (!coursesList.length) {
    const emptyCard = el("div", "resume-card center");
    emptyCard.innerHTML = `<p style="margin:0; font-size:14px; color:var(--text-muted);">لا توجد مواد مسجلة حالياً</p>`;
    container.appendChild(emptyCard);
    return;
  }

  coursesList.forEach((c) => {
    const style = getCourseStyle(c);
    const card = el("div", "course-card");
    card.addEventListener("click", () => {
      selectedCourseId = c.id;
      courseDetailActiveTab = "lectures";
      renderModernCoursesView(container);
    });

    const watermark = el("div", "course-watermark", style.watermark);
    card.appendChild(watermark);

    const content = el("div", "course-card-content");
    const title = el("h3", "course-card-title", style.displayName);
    title.style.color = style.color;
    content.appendChild(title);
    card.appendChild(content);

    const bottom = el("div", "course-card-bottom");
    bottom.style.position = "relative";
    bottom.style.zIndex = "1";

    const cd = (tData.courses && tData.courses[c.name]) || {};
    const readiness = calculateCourseReadiness(cd);
    const pct = readiness.overall > 0 ? readiness.overall : 0;

    const track = el("div", "course-progress-track");
    const bar = el("div", "course-progress-bar");
    bar.style.width = `${pct}%`;
    bar.style.backgroundColor = style.color;
    track.appendChild(bar);
    bottom.appendChild(track);

    // سطر أقرب امتحان خاضع لضبط الأونر والأدمن (يظهر أو يختفي تماماً حسب الضبط)
    const examVisible = isSubjectExamVisible(c.name);
    const examDays = getCourseExamDays(c.name, style.days);

    const statusRow = el("div", "course-status-row");
    statusRow.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:4px;";

    const statusText = examVisible
      ? `${pct}% · أقرب امتحان بعد ${examDays} يوم`
      : `${pct}% جاهزية المادة`;

    const statusP = el("p", "course-status-text", statusText);
    statusP.style.margin = "0";
    statusRow.appendChild(statusP);

    // زر الضبط السريع للأونر والأدمن فقط
    if (isAdmin()) {
      const editExamBtn = el("button", "course-exam-quick-edit-btn", "⚙️");
      editExamBtn.type = "button";
      editExamBtn.title = "ضبط إظهار/إخفاء سطر الامتحان وتعديل الأيام (للأونر والأدمن)";
      editExamBtn.style.cssText = "background:transparent; border:none; cursor:pointer; font-size:12px; opacity:0.8; padding:2px 4px; border-radius:4px; color:#38bdf8;";
      editExamBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showExamConfigModal(() => renderModernCoursesView(container), c.name);
      });
      statusRow.appendChild(editExamBtn);
    }

    bottom.appendChild(statusRow);
    card.appendChild(bottom);

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/* =========================================================================
   صفحة تفاصيل المادة (مع إمكانية إضافة وإلغاء المحاضرات بواسطة الطالب)
   ========================================================================= */
function renderCourseDetailView(container, cId) {
  const c = (state.courses || []).find((x) => x.id === cId) || { id: cId, name: "المادة" };
  const style = getCourseStyle(c);
  const tData = getTrackerData();
  const cd = (tData.courses && tData.courses[c.name]) || {};
  const readiness = calculateCourseReadiness(cd);
  const pct = readiness.overall > 0 ? readiness.overall : 0;

  const topNav = el("div", "course-detail-header");
  const backBtn = el("button", "back-circle-btn", "→");
  backBtn.title = "رجوع لقائمة المواد";
  backBtn.addEventListener("click", () => {
    selectedCourseId = null;
    renderModernCoursesView(container);
  });
  topNav.appendChild(backBtn);

  const badge = el("div", "readiness-badge", `${pct}% جاهزية`);
  topNav.appendChild(badge);
  container.appendChild(topNav);

  const title = el("h1", "course-detail-title amiri-title", style.displayName);
  title.style.color = style.color;
  container.appendChild(title);

  const studentItems = (cd && cd.items) || [];
  const examVisible = isSubjectExamVisible(c.name);
  const examDays = getCourseExamDays(c.name, style.days);
  const subtitleText = examVisible
    ? `${studentItems.length} محاضرة مضافة · أقرب امتحان بعد ${examDays} يوم`
    : `${studentItems.length} محاضرة مضافة`;

  const subWrap = el("div", "course-detail-subtitle-wrap");
  subWrap.style.cssText = "display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:12px;";
  subWrap.appendChild(el("p", "course-detail-subtitle", subtitleText));

  // زر تعديل موعد الامتحان للأدمن والأونر فقط داخل صفحة المادة
  if (isAdmin()) {
    const editBtn = el("button", "small btn-ghost", "⚙️ تعديل موعد الامتحان");
    editBtn.style.cssText = "font-size:11.5px; padding:3px 10px; border-radius:8px; border:1px solid var(--line); color:#38bdf8; cursor:pointer; background:rgba(56,189,248,0.08); font-weight:600;";
    editBtn.addEventListener("click", () => {
      showExamConfigModal(() => renderCourseDetailView(container, cId), c.name);
    });
    subWrap.appendChild(editBtn);
  }
  container.appendChild(subWrap);

  const pills = el("div", "segmented-pills");
  [
    { key: "lectures", label: "محاضرات" },
    { key: "tasks", label: "تكاليف" },
    { key: "files", label: "ملفات وروابط" },
    { key: "qa", label: "أسئلة" }
  ].forEach((t) => {
    const btn = el("button", `seg-pill-btn ${courseDetailActiveTab === t.key ? "active" : ""}`, t.label);
    btn.addEventListener("click", () => {
      courseDetailActiveTab = t.key;
      renderModernCoursesView(container);
    });
    pills.appendChild(btn);
  });
  container.appendChild(pills);

  const contentWrap = el("div");
  if (courseDetailActiveTab === "lectures") {
    renderStudentLecturesManager(contentWrap, c, container);
  } else if (courseDetailActiveTab === "tasks") {
    renderCourseTasksList(contentWrap, c);
  } else if (courseDetailActiveTab === "files") {
    renderCourseFilesList(contentWrap, c);
  } else if (courseDetailActiveTab === "qa") {
    renderCourseQAList(contentWrap, c);
  }
  container.appendChild(contentWrap);

  const stickyAction = el("div", "sticky-study-action");
  const studyBtn = el("button", "study-session-btn", "⏱️ ابدأ جلسة 25 دقيقة");
  studyBtn.addEventListener("click", () => {
    openPomodoroModal(`${style.displayName} - جلسة تركيز`);
  });
  stickyAction.appendChild(studyBtn);
  container.appendChild(stickyAction);
}

// إضافة وإلغاء وتعديل المحاضرات بواسطة الطالب نفسه
function renderStudentLecturesManager(wrap, course, parentContainer) {
  wrap.replaceChildren();

  const tData = getTrackerData();
  if (!tData.courses[course.name]) {
    tData.courses[course.name] = { items: [] };
  }
  const items = tData.courses[course.name].items || [];

  // نموذج إضافة محاضرة جديدة
  const addCard = el("div", "add-lecture-card");
  const input = el("input", "add-lecture-input");
  input.type = "text";
  input.placeholder = "اكتب اسم أو رقم المحاضرة الجديدة...";
  
  const addBtn = el("button", "add-lecture-btn", "+ إضافة محاضرة");
  addBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) {
      say("برجاء كتابة عنوان للمحاضرة أولاً");
      return;
    }
    items.push({
      id: Date.now(),
      title: val,
      study: false,
      revise: false,
      solve: false,
      closedMistakes: false
    });
    saveTrackerData(tData);
    say(`تمت إضافة: ${val} بنجاح ⭐`);
    renderCourseDetailView(parentContainer, course.id);
  });
  addCard.appendChild(input);
  addCard.appendChild(addBtn);
  wrap.appendChild(addCard);

  if (!items.length) {
    const emptyNotice = el("div", "resume-card center");
    emptyNotice.innerHTML = `
      <p style="margin:0 0 10px 0; font-size:14px; color:var(--text-muted);">
        لم تقم بإضافة أي محاضرات لهذه المادة بعد.
      </p>
      <p style="margin:0; font-size:12.5px; opacity:0.8;">
        اكتب اسم المحاضرة أعلاه واضغط "+ إضافة محاضرة" لتسجيل تقدمك بنقاط الإتقان (مذاكرة · مراجعة · تمارين).
      </p>
    `;
    wrap.appendChild(emptyNotice);
    return;
  }

  const list = el("div", "lectures-list");
  items.forEach((lec, idx) => {
    const card = el("div", "lecture-card");

    // زر الحذف والإلغاء
    const delBtn = el("button", "delete-lecture-btn", "🗑️");
    delBtn.title = "حذف / إلغاء هذه المحاضرة";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`هل تريد حذف "${lec.title}" من متابعتك؟`)) {
        items.splice(idx, 1);
        saveTrackerData(tData);
        say("تم حذف المحاضرة وتحديث الجاهزية");
        renderCourseDetailView(parentContainer, course.id);
      }
    });
    card.appendChild(delBtn);

    // عنوان المحاضرة
    const info = el("div", "lecture-info");
    info.appendChild(el("h4", "lecture-title", lec.title));
    card.appendChild(info);

    // نقاط الإتقان الثلاث التفاعلية (مذاكرة · مراجعة · تمارين)
    const dotsWrap = el("div", "mastery-dots");

    const dot1 = el("button", `mastery-dot-btn ${lec.study ? "filled" : "empty"}`);
    dot1.type = "button";
    dot1.title = lec.study ? "مذاكرة: مكتملة (اضغط للإلغاء)" : "مذاكرة: لم تكتمل (اضغط للتأكيد)";
    dot1.addEventListener("click", (e) => {
      e.stopPropagation();
      lec.study = !lec.study;
      saveTrackerData(tData);
      renderCourseDetailView(parentContainer, course.id);
    });

    const dot2 = el("button", `mastery-dot-btn ${lec.revise ? "filled" : "empty"}`);
    dot2.type = "button";
    dot2.title = lec.revise ? "مراجعة: مكتملة (اضغط للإلغاء)" : "مراجعة: لم تكتمل (اضغط للتأكيد)";
    dot2.addEventListener("click", (e) => {
      e.stopPropagation();
      lec.revise = !lec.revise;
      saveTrackerData(tData);
      renderCourseDetailView(parentContainer, course.id);
    });

    const dot3 = el("button", `mastery-dot-btn ${lec.solve ? "filled" : "empty"}`);
    dot3.type = "button";
    dot3.title = lec.solve ? "تمارين وشيتات: مكتملة (اضغط للإلغاء)" : "تمارين وشيتات: لم تكتمل (اضغط للتأكيد)";
    dot3.addEventListener("click", (e) => {
      e.stopPropagation();
      lec.solve = !lec.solve;
      saveTrackerData(tData);
      renderCourseDetailView(parentContainer, course.id);
    });

    dotsWrap.appendChild(dot1);
    dotsWrap.appendChild(dot2);
    dotsWrap.appendChild(dot3);
    card.appendChild(dotsWrap);

    list.appendChild(card);
  });

  wrap.appendChild(list);
}

function renderCourseTasksList(wrap, course) {
  wrap.replaceChildren();
  const tasks = (state.items || []).filter((x) => x.course_id === course.id && !x.deleted_at);

  if (!tasks.length) {
    const emptyP = el("div", "resume-card center");
    emptyP.innerHTML = `<p style="margin:0; font-size:14px; color:var(--text-muted);">لا توجد تكاليف مطلوبة حالياً لهذه المادة 🎉</p>`;
    wrap.appendChild(emptyP);
    return;
  }

  const list = el("div", "lectures-list");
  tasks.forEach((t) => {
    const card = el("div", "lecture-card");
    const info = el("div", "lecture-info");
    info.appendChild(el("h4", "lecture-title", t.title));
    if (t.deadline) {
      info.appendChild(el("p", "course-status-text", formatDeadlineCountdown(t.deadline)));
    }
    card.appendChild(info);
    list.appendChild(card);
  });
  wrap.appendChild(list);
}

function renderCourseFilesList(wrap, course) {
  wrap.replaceChildren();
  const box = el("div", "more-group-card");

  const links = [
    { label: "مجلد جوجل درايف للمادة 📁", url: course.drive_url },
    { label: "فايل الشيتات 📄", url: course.assignment_drive_url },
    { label: "جروب الواتساب 💬", url: course.whatsapp_link },
    { label: "جروب التيليجرام 📱", url: course.telegram_link },
    { label: "فيديوهات اليوتيوب 🎬", url: course.youtube_link }
  ];

  links.forEach((l) => {
    if (l.url) {
      const a = el("a", "more-menu-item");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `
        <div class="more-menu-right">
          <div class="more-item-title">${l.label}</div>
        </div>
        <span class="more-menu-arrow">↗</span>
      `;
      box.appendChild(a);
    }
  });

  if (!box.children.length) {
    const p = el("p", "center", "لا توجد روابط أو ملفات مسجلة لهذه المادة بعد.");
    p.style.padding = "16px";
    p.style.color = "var(--text-muted)";
    box.appendChild(p);
  }
  wrap.appendChild(box);
}

function renderCourseQAList(wrap, course) {
  wrap.replaceChildren();
  const qList = (state.questions || []).filter((q) => q.course_id === course.id);
  if (!qList.length) {
    const emptyP = el("div", "resume-card center");
    emptyP.innerHTML = `<p style="margin:0; font-size:14px; color:var(--text-muted);">لم يتم طرح أسئلة حول هذه المادة بعد.</p>`;
    wrap.appendChild(emptyP);
    return;
  }
  const list = el("div", "lectures-list");
  qList.forEach((q) => {
    const card = el("div", "lecture-card");
    const info = el("div", "lecture-info");
    info.appendChild(el("h4", "lecture-title", q.title || q.body));
    card.appendChild(info);
    list.appendChild(card);
  });
  wrap.appendChild(list);
}

/* =========================================================================
   صفحة المتتبع (Screen 3: المتتبع - Tracker)
   ========================================================================= */
function renderModernTrackerView(container) {
  container.replaceChildren();

  const head = el("div", "tracker-header");
  head.appendChild(el("h1", "tracker-title amiri-title", "المتتبع"));
  head.appendChild(el("p", "tracker-subtitle", "جاهزيتك الإجمالية"));
  container.appendChild(head);

  const tData = getTrackerData();
  const activeC = (state.courses || []).filter((c) => c.is_active !== false);
  let totalScore = 0;
  let weakest = { title: "لا توجد محاضرات مضافة بعد", score: 999 };

  activeC.forEach((c) => {
    const cd = (tData.courses && tData.courses[c.name]) || {};
    const readiness = calculateCourseReadiness(cd);
    totalScore += readiness.overall;
    if (readiness.minScore < weakest.score && readiness.weakestTitle && readiness.weakestTitle !== "لا توجد عناصر بعد") {
      weakest = { title: `${c.name} · ${readiness.weakestTitle}`, score: readiness.minScore };
    }
  });

  const avgPct = activeC.length ? Math.round(totalScore / activeC.length) : 0;
  const streak = calculateRealStreak(tData);

  const ringWrap = el("div", "readiness-ring-wrap");
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (avgPct / 100) * circumference;

  ringWrap.innerHTML = `
    <svg class="readiness-ring-svg" viewBox="0 0 160 160">
      <circle class="readiness-ring-bg" cx="80" cy="80" r="${radius}"></circle>
      <circle class="readiness-ring-fg" cx="80" cy="80" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
    </svg>
    <div class="readiness-ring-number">${avgPct}%</div>
  `;
  container.appendChild(ringWrap);

  const weakestCard = el("div", "weakest-point-card");
  const wInfo = el("div");
  wInfo.appendChild(el("div", "weakest-point-label", "أضعف نقطة"));
  wInfo.appendChild(el("h4", "weakest-point-title", weakest.title));
  weakestCard.appendChild(wInfo);

  const studyNowBtn = el("button", "weakest-study-btn", "ذاكر");
  studyNowBtn.addEventListener("click", () => openPomodoroModal(weakest.title));
  weakestCard.appendChild(studyNowBtn);
  container.appendChild(weakestCard);

  const heatmapCard = el("div", "heatmap-card");
  const grid = el("div", "heatmap-grid");

  const totalCells = 60;
  const sessions = tData.sessions || [];
  const dayBuckets = {};
  const todayMs = new Date().setHours(0, 0, 0, 0);

  sessions.forEach((s) => {
    try {
      const d = new Date(s.date).setHours(0, 0, 0, 0);
      const diffDays = Math.floor((todayMs - d) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < totalCells) {
        dayBuckets[diffDays] = (dayBuckets[diffDays] || 0) + 1;
      }
    } catch (e) {}
  });

  for (let i = totalCells - 1; i >= 0; i--) {
    const cell = el("div", "heatmap-cell");
    const count = dayBuckets[i] || 0;
    if (count >= 4) cell.classList.add("level-4");
    else if (count === 3) cell.classList.add("level-3");
    else if (count === 2) cell.classList.add("level-2");
    else if (count === 1) cell.classList.add("level-1");
    grid.appendChild(cell);
  }
  heatmapCard.appendChild(grid);

  const streakDays = streak.count > 0 ? streak.count : 0;
  const todaySessions = dayBuckets[0] || 0;
  heatmapCard.appendChild(el("p", "heatmap-status-text", `${streakDays} أيام متتالية · ${todaySessions} من 5 جلسات اليوم`));
  container.appendChild(heatmapCard);
}

/* =========================================================================
   صفحة الجدول الدراسي (Screen 4: الجدول - Schedule)
   ========================================================================= */
function renderModernScheduleView(container) {
  container.replaceChildren();

  const head = el("div", "courses-page-header");
  head.appendChild(el("h1", "courses-title amiri-title", "الجدول"));
  head.appendChild(el("p", "courses-subtitle", "محاضرات وسكاشن الأسبوع"));
  container.appendChild(head);

  const daysList = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  if (!activeScheduleDay) activeScheduleDay = getTodayDayName();

  const bar = el("div", "schedule-days-bar");
  daysList.forEach((d) => {
    const btn = el("button", `sched-day-pill ${activeScheduleDay === d ? "active" : ""}`, d);
    btn.addEventListener("click", () => {
      activeScheduleDay = d;
      renderModernScheduleView(container);
    });
    bar.appendChild(btn);
  });
  container.appendChild(bar);

  const dayItems = (state.schedule || [])
    .filter((x) => x.day_of_week === activeScheduleDay)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);

  if (!dayItems.length) {
    const emptyCard = el("div", "resume-card center");
    emptyCard.innerHTML = `<p style="margin:0; font-size:14px; color:var(--text-muted);">لا توجد محاضرات أو سكاشن مسجلة ليوم ${activeScheduleDay} ☕</p>`;
    container.appendChild(emptyCard);
    return;
  }

  const list = el("div", "lectures-list");
  dayItems.forEach((it) => {
    const c = (state.courses || []).find((x) => x.id === it.course_id);
    const card = el("div", "sched-slot-card");

    const info = el("div");
    info.appendChild(el("h3", "sched-slot-title", `${it.title} ${c ? c.name : ""}`.trim()));

    const metaParts = [];
    if (it.location) metaParts.push(`المكان: ${it.location}`);
    if (it.instructor) metaParts.push(`المحاضر: ${it.instructor}`);
    if (metaParts.length) {
      info.appendChild(el("p", "sched-slot-meta", metaParts.join(" · ")));
    }
    card.appendChild(info);

    card.appendChild(el("div", "sched-slot-time-badge", it.time_slot || "09:00"));
    list.appendChild(card);
  });
  container.appendChild(list);
}

/* =========================================================================
   صفحة المزيد والخيارات الشاملة (Screen 5: المزيد - More)
   ========================================================================= */
function renderModernMoreView(container) {
  container.replaceChildren();

  const head = el("div", "more-page-header");
  head.appendChild(el("h1", "more-title amiri-title", "المزيد"));
  head.appendChild(el("p", "more-subtitle", "الأقسام، الثيمات، والبحث الشامل"));
  container.appendChild(head);

  // شريط البحث اللحظي مع إيموجي العدسة فقط في البداية وكتابة متراصفة بجانبها
  const searchWrap = el("div", "more-search-wrap");
  const searchIcon = el("span", "more-search-icon", "🔍");
  const input = el("input", "more-search-input");
  input.type = "text";
  input.placeholder = "";
  input.value = searchKeyword;

  searchWrap.appendChild(searchIcon);
  searchWrap.appendChild(input);
  container.appendChild(searchWrap);

  const resultsBox = el("div");
  container.appendChild(resultsBox);

  input.addEventListener("input", (e) => {
    searchKeyword = e.target.value.trim().toLowerCase();
    renderSearchResults(resultsBox, searchKeyword);
  });

  // درج مغير الثيمات الـ 12 المتميزة كلياً (يفتح ويغلق مثل الدرج لتوفير المساحة)
  const currentThemeKey = localStorage.getItem("math3_modern_theme") || "default";
  const themePresets = [
    { key: "default", name: "🌿 واحة الزمرد الملكية", color: "#10b981", tag: "Emerald" },
    { key: "cyberpunk", name: "⚡ سديم نيون المستقبلي", color: "#00f0ff", tag: "Cyberpunk" },
    { key: "sapphire", name: "🌊 عمق المحيط الهادر", color: "#38bdf8", tag: "Oceanic" },
    { key: "amethyst", name: "🔮 الجمشت المخملي الملكي", color: "#c084fc", tag: "Amethyst" },
    { key: "sahara", name: "🏜️ شفق الصحراء والتراكوتا", color: "#f97316", tag: "Sahara" },
    { key: "academia", name: "📜 حبر الأكاديميا العريق", color: "#60a5fa", tag: "Academia" },
    { key: "rose", name: "🍬 كاندي باستيل الاسكندنافي", color: "#f472b6", tag: "Pastel" },
    { key: "oled", name: "📐 حجر المونوكروم البريوتالي", color: "#fafafa", tag: "Monolith" },
    { key: "ruby", name: "🔥 نار الشفق البركاني", color: "#f43f5e", tag: "Crimson" },
    { key: "forest", name: "🌲 غابة الصنوبر والهدوء", color: "#4ade80", tag: "Pine Moss" },
    { key: "gold", name: "☀️ شمس الكهرمان الذهبية", color: "#fbbf24", tag: "Amber" },
    { key: "aurora", name: "🌌 أورورا الشفق القطبي", color: "#2dd4bf", tag: "Aurora" }
  ];
  const activePreset = themePresets.find((p) => p.key === currentThemeKey) || themePresets[0];

  const drawerCard = el("div", "themes-drawer-card");
  drawerCard.title = "اضغط لفتح أو إغلاق درج الثيمات";

  const drawerHeader = el("div", "themes-drawer-header");
  const titleWrap = el("div", "themes-drawer-title-wrap");
  titleWrap.appendChild(el("h3", "themes-drawer-title", `🎨 درج مظهر المنصة والثيمات`));
  titleWrap.appendChild(el("p", "themes-drawer-subtitle", `المظهر النشط حالياً: ${activePreset.name}`));
  drawerHeader.appendChild(titleWrap);

  const toggleBadge = el("div", "themes-drawer-badge", isThemesDrawerOpen ? "▲ إغلاق الدرج" : "▼ فتح الدرج (12 ثيم)");
  drawerHeader.appendChild(toggleBadge);
  drawerCard.appendChild(drawerHeader);

  if (isThemesDrawerOpen) {
    const drawerContent = el("div", "themes-drawer-content");
    const grid = el("div", "themes-grid-picker");
    themePresets.forEach((th) => {
      const isActive = th.key === currentThemeKey;
      const btn = el("button", `theme-pill-btn ${isActive ? "active" : ""}`);
      btn.innerHTML = `
        <div class="theme-pill-left">
          <span class="theme-dot-preview" style="background:${th.color}; color:${th.color}; box-shadow:0 0 10px ${th.color}40;"></span>
          <span class="theme-pill-name" title="${th.name}">${th.name}</span>
        </div>
        <div class="theme-pill-right">
          <span class="theme-pill-tag">${th.tag}</span>
          ${isActive ? '<span class="theme-active-tag">✓ نشط</span>' : ''}
        </div>
      `;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (th.key === "default") {
          document.body.removeAttribute("data-modern-theme");
          document.documentElement.removeAttribute("data-modern-theme");
        } else {
          document.body.setAttribute("data-modern-theme", th.key);
          document.documentElement.setAttribute("data-modern-theme", th.key);
        }
        localStorage.setItem("math3_modern_theme", th.key);
        say(`تم تفعيل مظهر: ${th.name} ✨`);
        renderModernMoreView(container);
      });
      grid.appendChild(btn);
    });
    drawerContent.appendChild(grid);

    const closeRow = el("div", "themes-drawer-close-row");
    const closeBtn = el("button", "themes-drawer-close-btn", "✕ إغلاق درج الثيمات");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isThemesDrawerOpen = false;
      renderModernMoreView(container);
    });
    closeRow.appendChild(closeBtn);
    drawerContent.appendChild(closeRow);

    drawerCard.appendChild(drawerContent);
  }

  drawerCard.addEventListener("click", () => {
    isThemesDrawerOpen = !isThemesDrawerOpen;
    renderModernMoreView(container);
  });

  // درج الثيمات يظهر لكل المستخدمين مباشرة تحت عنصر المعلّم الذكي (الثيم تفضيل محلي على جهاز المستخدم)
  drawerCard.style.margin = "6px 12px 10px";

  // قائمة الأقسام والخدمات الكاملة بدون أي نقصان
  const group = el("div", "more-group-card");

  const items = [
    {
      title: "المعلّم الذكي (AI)",
      desc: "اسأله في أي حاجة، وارفع صور وPDF وهو يحل ويبحث لك",
      icon: "🧠",
      action: () => switchModernTab("ai")
    },
    {
      title: "النشرة الأسبوعية",
      desc: "أعداد النشرة وتلخيص أحداث وتنبيهات الأسبوع",
      icon: "📰",
      action: () => openSectionInModernView("newsletter")
    },
    {
      title: "التكاليف والتسليمات",
      desc: "متابعة التكاليف والمهام الشخصية وتاريخ التسليم",
      icon: "📝",
      action: () => openSectionInModernView("tasks")
    },
    {
      title: "المنشورات والأخبار",
      desc: "منشورات الدفعة والإعلانات الرسمية الهامة",
      icon: "📬",
      action: () => openSectionInModernView("posts")
    },
    {
      title: "الأسئلة والأجوبة",
      desc: "اطرح سؤالك وتناقش مع زملائك في المواد",
      icon: "❓",
      action: () => openSectionInModernView("qa")
    },
    {
      title: "موادّي المسجلة",
      desc: "تحديد المواد المسجلة للظهور في جدولك وتتبعك",
      icon: "📖",
      action: () => {
        const cb = $("courses-btn");
        if (cb) cb.click();
      }
    },
    {
      title: "إشعارات الويب",
      desc: "تفعيل وضبط التنبيهات الفورية للتكاليف والجدول",
      icon: "🔔",
      action: () => showNotificationModal()
    }
  ];

  // أزرار وصلاحيات الإدارة (للأدمن والأونر)
  if (isAdmin()) {
    items.push({
      title: "إعدادات موعد أقرب امتحان",
      desc: "إظهار أو إلغاء سطر الامتحان وضبط عدد الأيام المتبقية لكل مادة",
      icon: "📅",
      action: () => {
        showExamConfigModal(() => renderModernMoreView(container));
      }
    });

    items.push({
      title: "إدارة المواد والروابط",
      desc: "إضافة وتعديل روابط الدرايف والمواد للدفعة",
      icon: "🗂️",
      action: () => {
        const mb = $("manage-btn");
        if (mb) mb.click();
      }
    });

    items.push({
      title: "تخصيص وبناء الأقسام",
      desc: "إنشاء أقسام وتصنيفات ديناميكية جديدة للمنصة",
      icon: "📑",
      action: () => {
        const sb = $("sections-btn");
        if (sb) sb.click();
      }
    });

    items.push({
      title: "سجل النشاطات",
      desc: "متابعة سجل العمليات والتعديلات المنفذة",
      icon: "📜",
      action: () => {
        const lb = $("log-btn");
        if (lb) lb.click();
      }
    });
  }

  // صلاحيات الأونر فقط (Owner Only)
  if (isFull()) {
    items.push({
      title: "استوديو تخصيص المظهر (للأونر فقط)",
      desc: "تعديل ألوان الخلفية، الأيقونات، وخامات الورق المخصصة للمنصة",
      icon: "🎨",
      action: () => {
        const tb = $("theme-btn");
        if (tb) tb.click();
        else say("خيارات تخصيص المظهر متوفرة للأونر فقط");
      }
    });

    items.push({
      title: "المستخدمين والصلاحيات",
      desc: "ترقية الطلاب، الإدارة، وصلاحيات الحسابات",
      icon: "👥",
      action: () => {
        const pb = $("people-btn");
        if (pb) pb.click();
      }
    });

    items.push({
      title: "نسخة احتياطية واستعادة",
      desc: "تصدير نسخة كاملة من بيانات المنصة أو استرجاعها",
      icon: "💾",
      action: () => {
        const bb = $("backup-btn");
        if (bb) bb.click();
      }
    });
  }

  // يظهر ملف deploy.zip للأدمن وفي بيئة المعاينة والتطوير فقط (وليس في الموقع الأصلي على GitHub)
  const isPreviewEnv = typeof window !== "undefined" && (
    window.location.hostname.includes("run.app") || 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1"
  );

  if (isPreviewEnv && isAdmin()) {
    items.push({
      title: "تحميل ملف التحديث (deploy.zip)",
      desc: "نسخة المشروع المحدثة الجاهزة للتشغيل (بيئة التطوير والمعاينة)",
      icon: "📦",
      action: () => {
        window.location.href = "/deploy.zip";
      }
    });
  }

  items.push({
    title: "تسجيل الخروج / تبديل الحساب",
    desc: state.role === "guest" ? "تسجيل الدخول بالتيليجرام" : "الخروج من الحساب الحالي",
    icon: "🚪",
    action: () => {
      const lo = $("logout");
      if (lo) lo.click();
      else {
        sessionStorage.removeItem("auth_mode");
        window.location.reload();
      }
    }
  });

  items.forEach((it, idx) => {
    const btn = el("button", "more-menu-item");
    btn.innerHTML = `
      <div class="more-menu-right">
        <div class="more-item-icon-wrap">${it.icon}</div>
        <div>
          <h4 class="more-item-title">${it.title}</h4>
          <p class="more-item-desc">${it.desc}</p>
        </div>
      </div>
      <span class="more-menu-arrow">←</span>
    `;
    btn.addEventListener("click", it.action);
    group.appendChild(btn);
    // العنصر الأول هو المعلّم الذكي: ندرج درج الثيمات تحته مباشرة
    if (idx === 0) group.appendChild(drawerCard);
  });

  container.appendChild(group);

  // =========================================================================
  // تخصيص خط المنصة (Font Switcher) متاح للأدمن والأونر فقط (Admin Only)
  // =========================================================================
  if (isAdmin()) {
    const fontCard = el("div", "more-group-card");
    fontCard.style.cssText = "margin-top:14px; padding:0; overflow:hidden;";
    const activeFontKey = localStorage.getItem("math3_font_family") || "alexandria";

    const fontHeader = el("div");
    fontHeader.style.cssText = "padding:12px 16px 8px; border-bottom:1px solid rgba(255,255,255,0.06);";
    fontHeader.innerHTML = `
      <h4 style="margin:0; font-size:14px; font-weight:800; color:var(--mint-primary); display:flex; align-items:center; gap:8px;">
        <span>🔤</span>
        <span>تخصيص خط المنصة (خاص بالأدمن)</span>
      </h4>
      <p style="margin:4px 0 0; font-size:11.5px; color:var(--text-muted);">تحكم في الخط الأكاديمي المطبق على عناوين وقوائم المنصة</p>
    `;
    fontCard.appendChild(fontHeader);

    const fontGrid = el("div");
    fontGrid.style.cssText = "display:grid; grid-template-columns:repeat(auto-fill, minmax(135px, 1fr)); gap:8px; padding:12px 14px;";

    const fontOptions = [
      { key: "alexandria", name: "الإسكندرية (Alexandria)", tag: "عصري وهندسي", family: "'Alexandria', 'Cairo', sans-serif" },
      { key: "cairo", name: "القاهرة (Cairo)", tag: "أكاديمي جامعي", family: "'Cairo', 'Alexandria', sans-serif" },
      { key: "tajawal", name: "تجوال (Tajawal)", tag: "انسيابي وبارز", family: "'Tajawal', 'Cairo', sans-serif" },
      { key: "readex", name: "ريدكس (Readex Pro)", tag: "تقني هادئ", family: "'Readex Pro', 'Alexandria', sans-serif" },
      { key: "amiri", name: "الأميري (Amiri)", tag: "كلاسيكي تراثي", family: "'Amiri', serif" },
      { key: "mono", name: "مونو (JetBrains Mono)", tag: "رموز ورياضيات", family: "'JetBrains Mono', monospace" }
    ];

    fontOptions.forEach((fo) => {
      const isAct = fo.key === activeFontKey;
      const fBtn = el("button");
      fBtn.type = "button";
      fBtn.style.cssText = `
        background:${isAct ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.03)"};
        border:1.5px solid ${isAct ? "var(--mint-primary)" : "rgba(255, 255, 255, 0.08)"};
        border-radius:12px;
        padding:8px 10px;
        text-align:right;
        cursor:pointer;
        font-family:${fo.family};
        color:${isAct ? "var(--mint-primary)" : "var(--text-white)"};
        box-shadow:${isAct ? "0 0 12px rgba(16, 185, 129, 0.25)" : "none"};
        transition:all 0.2s ease;
      `;
      fBtn.innerHTML = `
        <div style="font-size:12.5px; font-weight:700; margin-bottom:2px;">${fo.name} ${isAct ? "✓" : ""}</div>
        <div style="font-size:10px; color:var(--text-muted); opacity:0.85;">${fo.tag}</div>
      `;
      fBtn.addEventListener("click", () => {
        localStorage.setItem("math3_font_family", fo.key);
        document.documentElement.setAttribute("data-font", fo.key);
        document.body.setAttribute("data-font", fo.key);
        document.documentElement.style.setProperty("--user-chosen-font", fo.family);
        say(`تم تطبيق خط: ${fo.name} بنجاح ✨`);
        renderModernMoreView(container);
      });
      fontGrid.appendChild(fBtn);
    });
    fontCard.appendChild(fontGrid);
    container.appendChild(fontCard);
  }

  // =========================================================================
  // زر المزامنة الفورية وإلغاء الكاش (يظهر فقط في بيئة المعاينة والتطوير وليس بالسايت الأساسي)
  // =========================================================================
  if (isPreviewEnv) {
    const syncCard = el("div", "more-group-card");
    syncCard.style.cssText = "margin-top:14px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;";
    syncCard.innerHTML = `
      <div>
        <div style="font-size:13px; font-weight:700; color:var(--text-white);">مزامنة بيانات المعاينة التجريبية</div>
        <div style="font-size:11px; color:var(--text-muted);">تحديث فوري لجميع المقررات، التكاليف، والجدول من السايت</div>
      </div>
    `;
    const syncBtn = el("button", "small btn-primary");
    syncBtn.style.cssText = "padding:7px 14px; font-size:12px; font-weight:bold; background:var(--card-dark-hover); border:1px solid var(--mint-primary); color:var(--mint-primary); border-radius:10px; cursor:pointer;";
    syncBtn.innerText = "تحديث البيانات الآن 🔄";
    syncBtn.addEventListener("click", () => {
      localStorage.removeItem("math3_cached_data_v4");
      localStorage.removeItem("math3_cached_courses_v4");
      localStorage.removeItem("math3_cached_time_v4");
      localStorage.removeItem("math3_cached_data_v5_official");
      localStorage.removeItem("math3_cached_data_v6_official");
      say("جاري مزامنة بيانات السايت الأصلية...");
      setTimeout(() => {
        window.location.reload();
      }, 400);
    });
    syncCard.appendChild(syncBtn);
    container.appendChild(syncCard);
  }

  // فاصل سفلي لضمان ظهور كافة الخيارات بارتفاع مريح فوق شريط التنقل السفلي
  const moreBottomSpacer = el("div", "more-bottom-spacer");
  moreBottomSpacer.style.cssText = "height: calc(130px + env(safe-area-inset-bottom, 24px)); min-height: 110px; width: 100%; pointer-events: none;";
  container.appendChild(moreBottomSpacer);
}

function renderSearchResults(box, kw) {
  box.replaceChildren();
  if (!kw) return;

  const matches = [];
  (state.courses || []).forEach((c) => {
    if ((c.name || "").toLowerCase().includes(kw)) {
      matches.push({ type: "مادة", title: c.name, id: c.id, kind: "course" });
    }
  });

  (state.items || []).forEach((it) => {
    if (!it.deleted_at && ((it.title || "").toLowerCase().includes(kw) || (it.body || "").toLowerCase().includes(kw))) {
      matches.push({ type: "تكليف / عنصر", title: it.title, item: it, kind: "item" });
    }
  });

  (state.posts || []).forEach((p) => {
    if (!p.deleted_at && ((p.title || "").toLowerCase().includes(kw) || (p.body || "").toLowerCase().includes(kw))) {
      matches.push({ type: "منشور", title: p.title || p.body.slice(0, 30), post: p, kind: "post" });
    }
  });

  if (!matches.length) {
    const emptyP = el("div", "resume-card center");
    emptyP.innerHTML = `<p style="margin:0; font-size:13px; color:var(--text-muted);">لم يتم العثور على نتائج تطابق "${kw}"</p>`;
    box.appendChild(emptyP);
    return;
  }

  const group = el("div", "more-group-card");
  matches.slice(0, 8).forEach((m) => {
    const row = el("button", "more-menu-item");
    row.innerHTML = `
      <div class="more-menu-right">
        <div>
          <h4 class="more-item-title">${m.title}</h4>
          <p class="more-item-desc">${m.type}</p>
        </div>
      </div>
      <span class="more-menu-arrow">←</span>
    `;
    row.addEventListener("click", () => {
      if (m.kind === "course") {
        selectedCourseId = m.id;
        switchModernTab("courses");
      } else if (m.kind === "item") {
        if (m.item.course_id) {
          selectedCourseId = m.item.course_id;
          switchModernTab("courses");
        } else {
          openSectionInModernView("tasks");
        }
      } else if (m.kind === "post") {
        openSectionInModernView("posts");
      }
    });
    group.appendChild(row);
  });
  box.appendChild(group);
}

/* =========================================================================
   فتح وعرض أي قسم أصلي داخل الواجهة الحديثة مع زر الرجوع
   ========================================================================= */
export function openSectionInModernView(kindOrId) {
  // إلغاء شاشة روابط المواد القديمة والتحويل المباشر لشاشة المواد العصرية المعتمدة
  if (kindOrId === "links") {
    switchModernTab("courses");
    return;
  }

  currentTab = "section";
  
  if (kindOrId === "posts") {
    state.active = "__posts__";
  } else {
    const sec = (state.sections || []).find((s) => s.kind === kindOrId || String(s.id) === String(kindOrId));
    if (sec) state.active = sec.id;
  }

  // إخفاء الـ modern-app-shell تماماً لمنع أي فراغ علوي فارغ
  const shell = $("modern-app-shell");
  if (shell) shell.style.display = "none";
  const root = $("modern-content-root");
  if (root) root.style.display = "none";

  const appEl = $("app");
  if (appEl) {
    appEl.hidden = false;
    appEl.style.display = "block";
    appEl.style.marginTop = "0px";
    appEl.style.paddingTop = "0px";
    appEl.style.paddingBottom = "calc(140px + env(safe-area-inset-bottom, 24px))";
    appEl.style.boxSizing = "border-box";
    $("dashboard").hidden = true;
    $("tabs").hidden = true;
    const isFilterable = kindOrId === "tasks";
    $("chips").hidden = !isFilterable;
    $("list").hidden = false;
    $("list").style.paddingBottom = "calc(140px + env(safe-area-inset-bottom, 24px))";

    // إخفاء أي عناصر قديمة قد تسبب مسافات فارغة فوق المحتوى
    const hello = $("hello");
    if (hello) hello.style.display = "none";
    const anonBanner = $("anon-banner");
    if (anonBanner) anonBanner.style.display = "none";

    // إضافة شريط الرجوع العصري فوق الأقسام
    let topBar = $("modern-section-top-bar");
    if (!topBar) {
      topBar = el("div", "section-nav-top");
      topBar.id = "modern-section-top-bar";
      appEl.insertBefore(topBar, appEl.firstChild);
    }
    topBar.replaceChildren();

    const backBtn = el("button", "section-back-btn", "← رجوع للمنصة");
    backBtn.addEventListener("click", () => {
      state.active = null;
      if (topBar) topBar.remove();
      if (shell) shell.style.display = "block";
      switchModernTab("more");
    });
    topBar.appendChild(backBtn);

    const titleSec = (state.sections || []).find((s) => s.id === state.active);
    const secTitleStr = state.active === "__posts__" ? "المنشورات والأخبار" : (titleSec ? titleSec.title : "القسم");
    const h2 = el("h3", "section-nav-title", secTitleStr);
    topBar.appendChild(h2);

    // إضافة فاصل سفلي داخل المحتوى لمنع تغطية النصوص بزر التنقل السفلي
    let bottomSpacer = $("modern-section-bottom-spacer");
    if (!bottomSpacer) {
      bottomSpacer = el("div");
      bottomSpacer.id = "modern-section-bottom-spacer";
      bottomSpacer.style.cssText = "height: calc(140px + env(safe-area-inset-bottom, 24px)); min-height: 120px; width: 100%; pointer-events: none; clear: both;";
      appEl.appendChild(bottomSpacer);
    } else {
      appEl.appendChild(bottomSpacer);
    }

    try { document.body.classList.add("section-open"); } catch (e) {}
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // إعادة الرندر للأقسام
  if (window._renderLegacyApp) window._renderLegacyApp();
}

/* =========================================================================
   التبديل بين التابات
   ========================================================================= */
export function switchModernTab(tabKey) {
  try { window.switchModernTab = switchModernTab; } catch(e) {}
  currentTab = tabKey;
  state.active = null;
  try { document.body.classList.remove("section-open"); } catch (e) {}

  // إزالة شريط القسم المفتوح
  const topBar = $("modern-section-top-bar");
  if (topBar) topBar.remove();

  // إخفاء عناصر القسم القديم
  const appEl = $("app");
  if (appEl) {
    $("tabs").hidden = true;
    $("dashboard").hidden = true;
    $("chips").hidden = true;
    $("list").hidden = true;
  }

  // إظهار المحتوى الحديث
  const root = $("modern-content-root");
  if (root) {
    root.style.display = "block";
    if (tabKey === "home") renderModernHomeView(root);
    else if (tabKey === "courses") renderModernCoursesView(root);
    else if (tabKey === "tracker") renderStudyTracker(root, () => switchModernTab("home"));
    else if (tabKey === "schedule") renderModernScheduleView(root);
    else if (tabKey === "more") renderModernMoreView(root);
    else if (tabKey === "ai") renderAiAssistantView(root, () => switchModernTab("home"));
  }

  window.switchModernTab = switchModernTab;

  // تحديث تمييز الشريط السفلي
  const nav = $("modern-bottom-nav");
  if (nav) {
    nav.style.display = "flex";
    const btns = nav.querySelectorAll(".nav-tab-btn");
    btns.forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tab") === tabKey);
    });
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function mountLoginThemeSelector() {
  const loginBox = $("login-box");
  if (!loginBox) return;

  let wrap = $("login-quick-themes");
  if (!wrap) {
    wrap = el("div", "login-quick-themes");
    wrap.id = "login-quick-themes";
    loginBox.appendChild(wrap);
  }
  wrap.innerHTML = "";

  const currentTheme = localStorage.getItem("math3_modern_theme") || "default";

  const dotsRow = el("div", "login-themes-dots-row");
  const presets = [
    { key: "default", name: "واحة الزمرد", color: "#10b981" },
    { key: "cyberpunk", name: "سديم نيون", color: "#00f0ff" },
    { key: "sapphire", name: "عمق المحيط", color: "#38bdf8" },
    { key: "amethyst", name: "الجمشت المخملي", color: "#c084fc" },
    { key: "sahara", name: "شفق الصحراء", color: "#f97316" },
    { key: "academia", name: "حبر الأكاديميا", color: "#60a5fa" },
    { key: "rose", name: "كاندي باستيل", color: "#f472b6" },
    { key: "oled", name: "حجر المونوكروم", color: "#fafafa" },
    { key: "ruby", name: "نار الشفق", color: "#f43f5e" },
    { key: "forest", name: "غابة الصنوبر", color: "#4ade80" },
    { key: "gold", name: "شمس الكهرمان", color: "#fbbf24" },
    { key: "aurora", name: "أورورا الشفق", color: "#2dd4bf" }
  ];

  presets.forEach((th) => {
    const dot = el("button", `login-theme-dot ${th.key === currentTheme ? "active" : ""}`);
    dot.type = "button";
    dot.title = th.name;
    dot.style.background = th.color;
    dot.style.color = th.color;
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      if (th.key === "default") {
        document.body.removeAttribute("data-modern-theme");
        document.documentElement.removeAttribute("data-modern-theme");
      } else {
        document.body.setAttribute("data-modern-theme", th.key);
        document.documentElement.setAttribute("data-modern-theme", th.key);
      }
      localStorage.setItem("math3_modern_theme", th.key);
      mountLoginThemeSelector();
    });
    dotsRow.appendChild(dot);
  });

  wrap.appendChild(dotsRow);
}
window.mountLoginThemeSelector = mountLoginThemeSelector;

export function mountModernUI() {
  // تفعيل الثيم المحفوظ
  try {
    const savedTh = localStorage.getItem("math3_modern_theme");
    if (savedTh && savedTh !== "default") {
      document.body.setAttribute("data-modern-theme", savedTh);
      document.documentElement.setAttribute("data-modern-theme", savedTh);
    }
  } catch (e) {}

  let shell = $("modern-app-shell");
  if (!shell) {
    shell = el("div", "modern-app-shell");
    shell.id = "modern-app-shell";

    const contentRoot = el("div");
    contentRoot.id = "modern-content-root";
    shell.appendChild(contentRoot);

    const nav = el("nav", "modern-bottom-nav");
    nav.id = "modern-bottom-nav";

    const tabsConfig = [
      {
        key: "home",
        label: "الرئيسية",
        icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>`
      },
      {
        key: "courses",
        label: "المواد",
        icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>`
      },
      {
        key: "tracker",
        label: "المتتبع",
        icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`
      },
      {
        key: "schedule",
        label: "الجدول",
        icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`
      },
      {
        key: "more",
        label: "المزيد",
        icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>`
      }
    ];

    tabsConfig.forEach((t) => {
      const btn = el("button", `nav-tab-btn ${currentTab === t.key ? "active" : ""}`);
      btn.setAttribute("data-tab", t.key);
      btn.innerHTML = `${t.icon}<span>${t.label}</span>`;
      btn.addEventListener("click", () => switchModernTab(t.key));
      nav.appendChild(btn);
    });

    document.body.appendChild(nav);

    const wrap = document.querySelector(".wrap") || document.body;
    if (wrap && wrap.firstChild) {
      wrap.insertBefore(shell, wrap.firstChild);
    } else if (wrap) {
      wrap.appendChild(shell);
    } else {
      document.body.appendChild(shell);
    }
  }

  // إذا لم يسجل الطالب دخوله بعد، نعرض صفحة تسجيل الدخول أولاً ونخفي الواجهة
  const loginBox = $("login-box");
  const isAnon = sessionStorage.getItem("auth_mode") === "anonymous";
  const hasUser = !!state.userId || isAnon;
  const bNav = $("modern-bottom-nav");

  if (loginBox && !loginBox.hidden && !hasUser) {
    shell.style.display = "none";
    if (bNav) bNav.style.display = "none";
    mountLoginThemeSelector();
    return;
  }

  // إظهار الواجهة الحديثة والشريط السفلي بعد تسجيل الدخول
  shell.style.display = "block";
  if (bNav) bNav.style.display = "flex";

  // إذا كان هناك قسم نشط مفتوح نتركه يظهر داخل العرض
  if (state.active) {
    const root = $("modern-content-root");
    if (root) root.style.display = "none";
    if ($("app")) $("app").hidden = false;
  } else {
    switchModernTab(currentTab);
  }
}
