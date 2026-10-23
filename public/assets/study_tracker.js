/* =========================================================================
   Math 3 - تراك المذاكرة والإنجاز وبومودورو (Study Tracker & Custom Pomodoro)
   متوافق بالكامل مع ثيمات المنصة، الهواتف، والـ PWA - خالي من أي prompt() معطل
   ========================================================================= */

import { state } from "./state.js";
import { el, $, say } from "./core.js";

const TRACKER_STORAGE_KEY = "math3_study_tracker_v2";

// صوت تنبيه ناعم عند انتهاء جلسة البومودورو
function playPomodoroChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {}
}

// استرجاع وحفظ البيانات محلياً مع العزل التام لكل حساب وجهاز
export function getTrackerData() {
  try {
    const k = state.userId ? `${TRACKER_STORAGE_KEY}_${state.userId}` : `${TRACKER_STORAGE_KEY}_device`;
    const raw = localStorage.getItem(k);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return initDefaultTrackerData();
}

export function saveTrackerData(data) {
  try {
    const k = state.userId ? `${TRACKER_STORAGE_KEY}_${state.userId}` : `${TRACKER_STORAGE_KEY}_device`;
    localStorage.setItem(k, JSON.stringify(data));
  } catch (e) {}
}

function initDefaultTrackerData() {
  return {
    courses: {},
    sessions: [],
    streak: 0,
    lastActiveDate: null
  };
}

// حساب نسبة الإنجاز لمعين حسب معادلة الإتقان:
// مذاكرة (%30) + مراجعة (%25) + حل تمارين (%30) + إتقان وتثبيت الصعوبات (%15)
export function calculateCourseReadiness(courseData) {
  const items = (courseData && courseData.items) || [];
  if (!items.length) {
    return { overall: 0, studyPct: 0, revisePct: 0, solvePct: 0, closedMistakesPct: 0, weakestTitle: "لا توجد عناصر بعد", count: 0 };
  }

  let studyCount = 0, reviseCount = 0, solveCount = 0, mistakesCount = 0;
  let minScore = 999;
  let weakestTitle = items[0].title;

  items.forEach((l) => {
    let s = 0;
    if (l.study) { studyCount++; s += 30; }
    if (l.revise) { reviseCount++; s += 25; }
    if (l.solve) { solveCount++; s += 30; }
    if (l.closedMistakes) { mistakesCount++; s += 15; }
    if (s < minScore) {
      minScore = s;
      weakestTitle = l.title;
    }
  });

  const total = items.length;
  const studyPct = Math.round((studyCount / total) * 100);
  const revisePct = Math.round((reviseCount / total) * 100);
  const solvePct = Math.round((solveCount / total) * 100);
  const closedMistakesPct = Math.round((mistakesCount / total) * 100);

  const overall = Math.round(
    (studyPct * 0.30) + (revisePct * 0.25) + (solvePct * 0.30) + (closedMistakesPct * 0.15)
  );

  return { overall, studyPct, revisePct, solvePct, closedMistakesPct, weakestTitle, minScore, count: total };
}

// حساب الاستريك الحقيقي بدقة (الأيام المتتالية الفعلية)
export function calculateRealStreak(data) {
  const sessions = (data && data.sessions) || [];
  const uniqueDays = new Set();
  sessions.forEach((s) => {
    if (s.date && s.minutes > 0) {
      const d = String(s.date).split("T")[0];
      uniqueDays.add(d);
    }
  });

  if (!uniqueDays.size) {
    return { count: 0, isActiveToday: false, isAlive: false };
  }

  const getDayStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today = new Date();
  const todayStr = getDayStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDayStr(yesterday);

  const studiedToday = uniqueDays.has(todayStr);
  const studiedYesterday = uniqueDays.has(yesterdayStr);

  // إذا لم يذاكر اليوم ولا أمس، ينطفئ الاستريك فوراً (0) واللاين يختفي
  if (!studiedToday && !studiedYesterday) {
    return { count: 0, isActiveToday: false, isAlive: false };
  }

  // عد الأيام المتتالية إلى الوراء
  let count = 0;
  let check = new Date(studiedToday ? today : yesterday);

  while (true) {
    const s = getDayStr(check);
    if (uniqueDays.has(s)) {
      count++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    count,
    isActiveToday: studiedToday,
    isAlive: count > 0
  };
}

function ensureCourseData(courseData) {
  if (!courseData) courseData = {};
  if (!courseData.items) courseData.items = [];
  return courseData;
}

// حالة مؤقت البومودورو في الذاكرة
let pomodoroState = {
  running: false,
  timerId: null,
  focusMinutes: 25,
  totalSeconds: 25 * 60,
  secondsLeft: 25 * 60,
  selectedCourse: "",
  selectedItemTitle: "محاضرة 1",
  checkedStudy: true,
  checkedRevise: false,
  checkedSolve: false,
  notes: ""
};

// الشاشة الرئيسية لمتابع المذاكرة والإنجاز
export function renderStudyTracker(container, onBack, initialTab = "readiness") {
  container.replaceChildren();

  const data = getTrackerData();

  // جلب المواد المسجلة للطالب
  const studentCourses = (state.courses || []).filter((c) => {
    if (!state.mine || !state.mine.size) return c.is_active;
    return state.mine.has(c.id);
  });

  const courseList = studentCourses.length ? studentCourses : (state.courses || []);

  courseList.forEach((c) => {
    if (!data.courses[c.name]) {
      data.courses[c.name] = ensureCourseData({});
    } else {
      ensureCourseData(data.courses[c.name]);
    }
  });
  saveTrackerData(data);

  if (!pomodoroState.selectedCourse && courseList.length) {
    pomodoroState.selectedCourse = courseList[0].name;
  }

  let currentTab = initialTab || "readiness";
  let deepDiveCourseName = null;

  const wrap = el("div", "tracker-wrap");
  wrap.style.maxWidth = "520px";
  wrap.style.margin = "0 auto";
  wrap.style.padding = "10px 14px 40px 14px";
  wrap.style.boxSizing = "border-box";
  wrap.style.color = "var(--ink)";

  // الشريط العلوي مع زر الرئيسية وزر التصفير النظيف
  const topNav = el("div");
  topNav.style.display = "flex";
  topNav.style.alignItems = "center";
  topNav.style.justifyContent = "space-between";
  topNav.style.marginBottom = "14px";

  const backBtn = el("button", "small", "← الرئيسية");
  backBtn.addEventListener("click", () => {
    if (onBack) onBack();
  });
  topNav.appendChild(backBtn);

  const breadcrumb = { textContent: "" };

  const resetBtn = el("button", "small", "تصفير للبداية 🔄");
  resetBtn.style.opacity = "0.75";
  resetBtn.style.fontSize = "11.5px";
  resetBtn.title = "تصفير جلسات وإنجاز هذا الحساب للبدء من الصفر";
  resetBtn.addEventListener("click", () => {
    openConfirmModal("تصفير التراك للصفر", "هل تريد مسح كل جلسات المذاكرة ونسب الإنجاز لهذا الحساب والبدء من الصفر تماماً؟", () => {
      const fresh = initDefaultTrackerData();
      saveTrackerData(fresh);
      say("تم تصفير التراك بنجاح! جاهز لبدء رحلة المذاكرة من الصفر 🚀");
      renderActiveTab();
    });
  });
  topNav.appendChild(resetBtn);

  wrap.appendChild(topNav);

  // أزرار التبويبات الثلاثة الرئيسية
  const tabRow = el("div");
  tabRow.style.display = "grid";
  tabRow.style.gridTemplateColumns = "1fr 1fr 1fr";
  tabRow.style.gap = "6px";
  tabRow.style.padding = "4px";
  tabRow.style.background = "var(--paper)";
  tabRow.style.borderRadius = "12px";
  tabRow.style.border = "1px solid var(--line)";
  tabRow.style.marginBottom = "18px";

  const tabs = [
    { id: "readiness", label: "إنجاز المواد", icon: "🎯" },
    { id: "heatmap", label: "خريطة إنجازك", icon: "🗺️" },
    { id: "pomodoro", label: "مؤقت بومودورو", icon: "⏱️" }
  ];

  const tabButtons = {};

  tabs.forEach((t) => {
    const btn = el("button", "", `${t.icon} ${t.label}`);
    btn.style.padding = "9px 4px";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "bold";
    btn.style.borderRadius = "8px";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.transition = "all 0.15s ease";
    btn.addEventListener("click", () => {
      currentTab = t.id;
      deepDiveCourseName = null;
      renderActiveTab();
    });
    tabButtons[t.id] = btn;
    tabRow.appendChild(btn);
  });
  wrap.appendChild(tabRow);

  const contentArea = el("div");
  wrap.appendChild(contentArea);
  container.appendChild(wrap);

  function updateTabButtonsUI() {
    tabs.forEach((t) => {
      const b = tabButtons[t.id];
      if (currentTab === t.id && !deepDiveCourseName) {
        b.style.background = "var(--accent)";
        b.style.color = "#fff";
      } else {
        b.style.background = "transparent";
        b.style.color = "var(--ink)";
        b.style.opacity = "0.75";
      }
    });
  }

  function renderActiveTab() {
    updateTabButtonsUI();
    contentArea.replaceChildren();

    if (deepDiveCourseName) {
      renderDeepDiveView(contentArea, deepDiveCourseName);
    } else if (currentTab === "readiness") {
      renderReadinessDashboard(contentArea);
    } else if (currentTab === "heatmap") {
      renderHeatmapView(contentArea);
    } else if (currentTab === "pomodoro") {
      renderPomodoroView(contentArea);
    }
  }

  // =========================================================================
  // 1. شاشة إنجاز المواد والمذاكرة (Readiness Dashboard)
  // =========================================================================
  function renderReadinessDashboard(box) {
    const freshData = getTrackerData();
    const streakInfo = calculateRealStreak(freshData);

    const header = el("div");
    header.style.marginBottom = "14px";
    const h = el("h2", "", "إنجاز المواد والمذاكرة 🎯");
    h.style.margin = "0 0 6px 0";
    h.style.fontSize = "22px";
    header.appendChild(h);

    const sub = el("p");
    sub.style.margin = "0";
    sub.style.fontSize = "13px";
    sub.style.opacity = "0.75";
    sub.textContent = "متابعة حية لنسب إنجازك في كل مادة واستمرارية الاستريك اليومي.";
    header.appendChild(sub);
    box.appendChild(header);

    let totalScore = 0;
    const coursesStats = [];

    courseList.forEach((c) => {
      const cData = freshData.courses[c.name] || ensureCourseData({});
      const st = calculateCourseReadiness(cData);
      totalScore += st.overall;
      coursesStats.push({
        course: c,
        name: c.name,
        stats: st
      });
    });

    const avgOverall = coursesStats.length ? Math.round(totalScore / coursesStats.length) : 0;

    const statsGrid = el("div");
    statsGrid.style.display = "grid";
    statsGrid.style.gridTemplateColumns = "1fr 1fr";
    statsGrid.style.gap = "10px";
    statsGrid.style.marginBottom = "16px";

    const cardPct = el("div", "card");
    cardPct.style.margin = "0";
    cardPct.style.padding = "16px 14px";
    cardPct.style.textAlign = "center";
    cardPct.style.background = "var(--card)";
    cardPct.style.border = "1.5px solid var(--line)";
    cardPct.style.borderRadius = "14px";
    cardPct.innerHTML = `<div style="font-size:32px; font-weight:bold; color:var(--accent);">${avgOverall}%</div>
      <div style="font-size:12px; opacity:0.8; margin-top:4px;">إجمالي نسبة إنجازك</div>`;
    statsGrid.appendChild(cardPct);

    const cardStreak = el("div", "card");
    cardStreak.style.margin = "0";
    cardStreak.style.padding = "14px 12px";
    cardStreak.style.textAlign = "center";
    cardStreak.style.background = "var(--card)";
    cardStreak.style.border = `1.5px solid ${streakInfo.isAlive ? "rgba(245, 158, 11, 0.5)" : "var(--line)"}`;
    cardStreak.style.borderRadius = "14px";

    let streakLineHtml = "";
    let streakCountHtml = "";
    let streakDesc = "";

    if (streakInfo.isAlive) {
      streakCountHtml = `<div style="font-size:30px; font-weight:bold; color:#f59e0b; display:flex; align-items:center; justify-content:center; gap:6px;">
        <span>${streakInfo.count}</span> <span style="font-size:24px;">🔥</span>
      </div>`;
      // اللاين المضيء يظهر فقط عندما يكون الاستريك شغالاً
      streakLineHtml = `<div style="width:100%; height:4px; background:linear-gradient(90deg, #f59e0b, #ea580c); border-radius:4px; margin:8px 0 6px 0; box-shadow:0 0 10px rgba(245,158,11,0.5);"></div>`;
      streakDesc = streakInfo.isActiveToday 
        ? "ستريك مشتعل! ذاكرت اليوم ✅" 
        : "الستريك حيّ · ذاكر اليوم للحفاظ عليه ⏳";
    } else {
      streakCountHtml = `<div style="font-size:30px; font-weight:bold; color:var(--ink); opacity:0.35; display:flex; align-items:center; justify-content:center; gap:6px;">
        <span>0</span> <span style="font-size:20px;">💤</span>
      </div>`;
      // اللاين ميبقاش موجود تماماً
      streakLineHtml = "";
      streakDesc = "الستريك مطفأ · ابدأ جلسة لإشعاله ⚡";
    }

    cardStreak.innerHTML = `
      ${streakCountHtml}
      ${streakLineHtml}
      <div style="font-size:12px; font-weight:bold; color:var(--ink); margin-top:${streakInfo.isAlive ? '0' : '8px'};">ستريك المذاكرة</div>
      <div style="font-size:10.5px; opacity:0.75; margin-top:2px;">${streakDesc}</div>
    `;
    statsGrid.appendChild(cardStreak);

    box.appendChild(statsGrid);

    // ترتيب المواد حسب الأقل إنجازاً لتظهر المواد المحتاجة تركيز في المقدمة
    coursesStats.sort((a, b) => a.stats.overall - b.stats.overall);

    const list = el("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";

    coursesStats.forEach((item) => {
      const cCard = el("div", "card");
      cCard.style.margin = "0";
      cCard.style.padding = "14px 16px";
      cCard.style.background = "var(--card)";
      cCard.style.borderRadius = "14px";
      cCard.style.cursor = "pointer";
      cCard.style.transition = "transform 0.15s ease, border-color 0.15s ease";

      let borderCol = "var(--line)";
      if (item.stats.overall < 50 && item.stats.count > 0) borderCol = "#f87171";
      else if (item.stats.overall < 70 && item.stats.count > 0) borderCol = "#fbbf24";
      else if (item.stats.overall >= 70) borderCol = "var(--accent)";

      cCard.style.border = `1.5px solid ${borderCol}`;

      const row1 = el("div");
      row1.style.display = "flex";
      row1.style.justifyContent = "space-between";
      row1.style.alignItems = "center";
      row1.style.marginBottom = "8px";
      row1.innerHTML = `<div style="font-size:16px; font-weight:bold;">${item.name}</div>
        <div style="font-size:16px; font-weight:bold; color:${borderCol};">${item.stats.overall}%</div>`;
      cCard.appendChild(row1);

      const barTrack = el("div");
      barTrack.style.width = "100%";
      barTrack.style.height = "6px";
      barTrack.style.background = "rgba(128, 128, 128, 0.2)";
      barTrack.style.borderRadius = "4px";
      barTrack.style.overflow = "hidden";
      barTrack.style.marginBottom = "8px";

      const barFill = el("div");
      barFill.style.width = `${item.stats.overall}%`;
      barFill.style.height = "100%";
      barFill.style.background = borderCol;
      barFill.style.borderRadius = "4px";
      barTrack.appendChild(barFill);
      cCard.appendChild(barTrack);

      const row2 = el("div");
      row2.style.display = "flex";
      row2.style.justifyContent = "space-between";
      row2.style.fontSize = "12px";
      row2.style.opacity = "0.75";

      const countText = el("span", "", item.stats.count > 0 ? `${item.stats.count} عنصر / محاضرة` : "لا توجد عناصر بعد");
      row2.appendChild(countText);

      const weakText = el("span", "", item.stats.count > 0 ? `محتاجة تركيز: ${item.stats.weakestTitle}` : `(اضغط لإضافة المحاضرات)`);
      weakText.style.color = item.stats.overall < 60 && item.stats.count > 0 ? "#f87171" : "inherit";
      row2.appendChild(weakText);
      cCard.appendChild(row2);

      cCard.addEventListener("click", () => {
        deepDiveCourseName = item.name;
        renderActiveTab();
      });

      list.appendChild(cCard);
    });

    box.appendChild(list);
  }

  // =========================================================================
  // 2. تفاصيل المادة وقائمة المحاضرات والسكاشن المرنة (Subject Deep Dive)
  // =========================================================================
  function renderDeepDiveView(box, courseName) {
    const freshData = getTrackerData();
    breadcrumb.textContent = `math 3 · إنجاز المواد · ${courseName}`;

    const cData = freshData.courses[courseName] || ensureCourseData({});
    const stats = calculateCourseReadiness(cData);

    const backBar = el("div");
    backBar.style.display = "flex";
    backBar.style.justifyContent = "space-between";
    backBar.style.alignItems = "center";
    backBar.style.marginBottom = "14px";

    const returnBtn = el("button", "small", "← عودة لقائمة المواد");
    returnBtn.addEventListener("click", () => {
      deepDiveCourseName = null;
      renderActiveTab();
    });
    backBar.appendChild(returnBtn);
    box.appendChild(backBar);

    const h = el("h2", "", courseName);
    h.style.margin = "0 0 14px 0";
    h.style.fontSize = "26px";
    box.appendChild(h);

    // دائرة الإنجاز الكبرى والتشخيص
    const ringCard = el("div", "card");
    ringCard.style.margin = "0 0 14px 0";
    ringCard.style.padding = "18px";
    ringCard.style.display = "flex";
    ringCard.style.alignItems = "center";
    ringCard.style.justifyContent = "space-between";
    ringCard.style.gap = "16px";
    ringCard.style.background = "var(--card)";
    ringCard.style.border = "1.5px solid var(--line)";
    ringCard.style.borderRadius = "16px";

    const diagText = el("div");
    diagText.style.flex = "1";
    diagText.style.fontSize = "13px";
    diagText.style.lineHeight = "1.6";
    if (stats.count === 0) {
      diagText.innerHTML = `لم تقم بإضافة أي محاضرات أو سكاشن بعد.<br><strong>أضف أول محاضرة أو سكشن بالأسفل!</strong>`;
    } else {
      diagText.innerHTML = `نسبة إنجازك الحالية <strong>${stats.overall}%</strong>.<br><span style="color:#f87171; font-weight:bold;">نقطة بحاجة لمراجعة: ${stats.weakestTitle}</span>.`;
    }
    ringCard.appendChild(diagText);

    const circleBox = el("div");
    circleBox.style.width = "78px";
    circleBox.style.height = "78px";
    circleBox.style.borderRadius = "50%";
    circleBox.style.border = "6px solid var(--accent)";
    circleBox.style.display = "flex";
    circleBox.style.alignItems = "center";
    circleBox.style.justifyContent = "center";
    circleBox.style.fontSize = "20px";
    circleBox.style.fontWeight = "bold";
    circleBox.style.color = "var(--accent)";
    circleBox.textContent = `${stats.overall}%`;
    ringCard.appendChild(circleBox);

    box.appendChild(ringCard);

    // تفكيك أركان الإتقان الأربعة بالمصطلحات الجديدة
    const pillarsCard = el("div", "card");
    pillarsCard.style.margin = "0 0 14px 0";
    pillarsCard.style.padding = "16px";
    pillarsCard.style.background = "var(--card)";
    pillarsCard.style.border = "1.5px solid var(--line)";
    pillarsCard.style.borderRadius = "16px";

    const pillars = [
      { label: "مذاكرة (%30)", pct: stats.studyPct },
      { label: "مراجعة (%25)", pct: stats.revisePct },
      { label: "حل تمارين (%30)", pct: stats.solvePct },
      { label: "تثبيت الصعوبات (%15)", pct: stats.closedMistakesPct }
    ];

    pillars.forEach((p, idx) => {
      const pRow = el("div");
      pRow.style.marginBottom = idx === pillars.length - 1 ? "0" : "12px";

      const pHeader = el("div");
      pHeader.style.display = "flex";
      pHeader.style.justifyContent = "space-between";
      pHeader.style.fontSize = "13px";
      pHeader.style.marginBottom = "4px";
      pHeader.appendChild(el("span", "", p.label));
      pHeader.appendChild(el("span", "", `${p.pct}%`));
      pRow.appendChild(pHeader);

      const pTrack = el("div");
      pTrack.style.width = "100%";
      pTrack.style.height = "6px";
      pTrack.style.background = "rgba(128,128,128,0.2)";
      pTrack.style.borderRadius = "3px";
      pTrack.style.overflow = "hidden";

      const pFill = el("div");
      pFill.style.width = `${p.pct}%`;
      pFill.style.height = "100%";
      pFill.style.background = "var(--accent)";
      pTrack.appendChild(pFill);
      pRow.appendChild(pTrack);

      pillarsCard.appendChild(pRow);
    });
    box.appendChild(pillarsCard);

    // قائمة المحاضرات والسكاشن المرنة التفاعلية
    const itemsCard = el("div", "card");
    itemsCard.style.margin = "0 0 14px 0";
    itemsCard.style.padding = "16px";
    itemsCard.style.background = "var(--card)";
    itemsCard.style.border = "1.5px solid var(--line)";
    itemsCard.style.borderRadius = "16px";

    const itemsHead = el("div");
    itemsHead.style.display = "flex";
    itemsHead.style.justifyContent = "space-between";
    itemsHead.style.alignItems = "center";
    itemsHead.style.marginBottom = "12px";

    const headTitle = el("div", "", `المحاضرات والسكاشن (${(cData.items || []).length})`);
    headTitle.style.fontWeight = "bold";
    headTitle.style.fontSize = "14px";
    itemsHead.appendChild(headTitle);
    itemsCard.appendChild(itemsHead);

    const itemsList = el("div");
    itemsList.style.display = "flex";
    itemsList.style.flexDirection = "column";
    itemsList.style.gap = "8px";

    if (!cData.items || !cData.items.length) {
      const emptyNotice = el("div");
      emptyNotice.style.padding = "18px";
      emptyNotice.style.textAlign = "center";
      emptyNotice.style.opacity = "0.75";
      emptyNotice.style.fontSize = "13px";
      emptyNotice.innerHTML = "لم تضف أي محاضرات أو سكاشن لهذه المادة بعد.<br>أضف محاضراتك الآن بالزر بالأسفل!";
      itemsList.appendChild(emptyNotice);
    } else {
      cData.items.forEach((it, index) => {
        let score = 0;
        if (it.study) score += 30;
        if (it.revise) score += 25;
        if (it.solve) score += 30;
        if (it.closedMistakes) score += 15;

        let badgeBg = "rgba(128,128,128,0.2)";
        if (score >= 70) badgeBg = "var(--accent)";
        else if (score >= 40) badgeBg = "#fbbf24";
        else if (score > 0) badgeBg = "#f87171";

        const row = el("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.padding = "10px 12px";
        row.style.background = "var(--paper)";
        row.style.borderRadius = "10px";
        row.style.border = "1px solid var(--line)";

        const left = el("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "8px";

        const badge = el("span", "", `${score}%`);
        badge.style.padding = "2px 6px";
        badge.style.fontSize = "11px";
        badge.style.fontWeight = "bold";
        badge.style.borderRadius = "6px";
        badge.style.background = badgeBg;
        badge.style.color = score >= 40 && score < 70 ? "#000" : "#fff";
        left.appendChild(badge);

        const titleText = el("span", "", it.title);
        titleText.style.fontWeight = "bold";
        titleText.style.fontSize = "13.5px";
        left.appendChild(titleText);
        row.appendChild(left);

        const actions = el("div");
        actions.style.display = "flex";
        actions.style.gap = "6px";

        const checkBtn = el("button", "small", "تسجيل إنجاز ✓");
        checkBtn.addEventListener("click", () => {
          openItemEditorModal(courseName, it, () => renderActiveTab());
        });
        actions.appendChild(checkBtn);

        const pomoStart = el("button", "small btn-primary", "⏱️");
        pomoStart.title = "بدء بومودورو لهذه المحاضرة";
        pomoStart.addEventListener("click", () => {
          pomodoroState.selectedCourse = courseName;
          pomodoroState.selectedItemTitle = it.title;
          currentTab = "pomodoro";
          deepDiveCourseName = null;
          renderActiveTab();
        });
        actions.appendChild(pomoStart);

        const delBtn = el("button", "small", "✕");
        delBtn.style.color = "#f87171";
        delBtn.style.padding = "4px 8px";
        delBtn.title = "حذف هذا العنصر";
        delBtn.addEventListener("click", () => {
          openConfirmModal("حذف العنصر", `هل تريد حذف "${it.title}"؟`, () => {
            const d = getTrackerData();
            if (d.courses[courseName] && d.courses[courseName].items) {
              d.courses[courseName].items.splice(index, 1);
              saveTrackerData(d);
              renderActiveTab();
            }
          });
        });
        actions.appendChild(delBtn);

        row.appendChild(actions);
        itemsList.appendChild(row);
      });
    }

    itemsCard.appendChild(itemsList);

    // إضافة سريعة أو مخصصة بدون أي prompt معطل
    const addRow = el("div");
    addRow.style.display = "grid";
    addRow.style.gridTemplateColumns = "1fr 1fr";
    addRow.style.gap = "8px";
    addRow.style.marginTop = "14px";

    const addCustomBtn = el("button", "btn-primary", "＋ إضافة محاضرة / سكشن");
    addCustomBtn.style.fontSize = "12.5px";
    addCustomBtn.addEventListener("click", () => {
      openPromptModal("إضافة جديدة", "أدخل اسم المحاضرة أو السكشن أو الموضوع:", `محاضرة ${(cData.items || []).length + 1}`, (name) => {
        if (name && name.trim()) {
          const d = getTrackerData();
          if (!d.courses[courseName]) d.courses[courseName] = ensureCourseData({});
          d.courses[courseName].items.push({
            id: "it-" + Date.now(),
            title: name.trim(),
            study: false,
            revise: false,
            solve: false,
            closedMistakes: false,
            notes: ""
          });
          saveTrackerData(d);
          renderActiveTab();
        }
      });
    });
    addRow.appendChild(addCustomBtn);

    const autoFillBtn = el("button", "small", "توليد سريع (1-10)");
    autoFillBtn.style.fontSize = "12px";
    autoFillBtn.addEventListener("click", () => {
      const d = getTrackerData();
      if (!d.courses[courseName]) d.courses[courseName] = ensureCourseData({});
      const startNum = (d.courses[courseName].items || []).length + 1;
      for (let i = startNum; i < startNum + 10; i++) {
        d.courses[courseName].items.push({
          id: "it-" + Date.now() + "-" + i,
          title: `محاضرة ${i}`,
          study: false,
          revise: false,
          solve: false,
          closedMistakes: false,
          notes: ""
        });
      }
      saveTrackerData(d);
      renderActiveTab();
    });
    addRow.appendChild(autoFillBtn);

    itemsCard.appendChild(addRow);
    box.appendChild(itemsCard);
  }

  // =========================================================================
  // 3. خريطة إنجازك والـ Heatmap
  // =========================================================================
  function renderHeatmapView(box) {
    const freshData = getTrackerData();
    breadcrumb.textContent = "math 3 · خريطة إنجازك";

    const header = el("div");
    header.style.marginBottom = "14px";
    const h = el("h2", "", "خريطة إنجازك 🗺️");
    h.style.margin = "0 0 6px 0";
    h.style.fontSize = "22px";
    header.appendChild(h);
    box.appendChild(header);

    const sessions = freshData.sessions || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthMinutes = 0;
    let weekSessionsCount = 0;
    const oneWeekAgo = Date.now() - 7 * 86400000;

    sessions.forEach((s) => {
      const sDate = new Date(s.date);
      if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
        monthMinutes += s.minutes || 0;
      }
      if (sDate.getTime() >= oneWeekAgo) {
        weekSessionsCount++;
      }
    });

    const monthHours = Math.round(monthMinutes / 60);
    const realStreak = calculateRealStreak(freshData);

    const statsRow = el("div");
    statsRow.style.display = "grid";
    statsRow.style.gridTemplateColumns = "1fr 1fr 1fr";
    statsRow.style.gap = "8px";
    statsRow.style.marginBottom = "16px";

    statsRow.innerHTML = `
      <div class="card" style="margin:0; padding:14px 8px; text-align:center; background:var(--card); border-radius:12px; border:1px solid ${realStreak.isAlive ? '#f59e0b' : 'var(--line)'};">
        <div style="font-size:24px; font-weight:bold; color:${realStreak.isAlive ? '#f59e0b' : 'var(--ink)'}; opacity:${realStreak.isAlive ? '1' : '0.4'};">
          ${realStreak.count} ${realStreak.isAlive ? '🔥' : '💤'}
        </div>
        <div style="font-size:11px; opacity:0.8; margin-top:2px;">${realStreak.isAlive ? 'أيام متتالية' : 'الستريك مطفأ'}</div>
      </div>
      <div class="card" style="margin:0; padding:14px 8px; text-align:center; background:var(--card); border-radius:12px; border:1px solid var(--line);">
        <div style="font-size:24px; font-weight:bold; color:var(--ink);">${weekSessionsCount}</div>
        <div style="font-size:11px; opacity:0.8; margin-top:2px;">جلسات الأسبوع</div>
      </div>
      <div class="card" style="margin:0; padding:14px 8px; text-align:center; background:var(--card); border-radius:12px; border:1px solid var(--line);">
        <div style="font-size:24px; font-weight:bold; color:var(--accent);">${monthHours} س</div>
        <div style="font-size:11px; opacity:0.8; margin-top:2px;">هذا الشهر</div>
      </div>`;
    box.appendChild(statsRow);

    // شبكة الـ Heatmap التفاعلية لآخر 12 أسبوع
    const heatmapCard = el("div", "card");
    heatmapCard.style.margin = "0 0 16px 0";
    heatmapCard.style.padding = "16px";
    heatmapCard.style.background = "var(--card)";
    heatmapCard.style.border = "1.5px solid var(--line)";
    heatmapCard.style.borderRadius = "16px";

    const daysLabels = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
    const dayMap = {};
    sessions.forEach((s) => {
      dayMap[s.date] = (dayMap[s.date] || 0) + (s.minutes || 0);
    });

    const gridContainer = el("div");
    gridContainer.style.display = "flex";
    gridContainer.style.gap = "6px";
    gridContainer.style.alignItems = "center";
    gridContainer.style.justifyContent = "center";
    gridContainer.style.overflowX = "auto";
    gridContainer.style.paddingBottom = "8px";

    const weeksCol = el("div");
    weeksCol.style.display = "flex";
    weeksCol.style.gap = "4px";

    for (let w = 11; w >= 0; w--) {
      const col = el("div");
      col.style.display = "flex";
      col.style.flexDirection = "column";
      col.style.gap = "4px";

      for (let d = 0; d < 7; d++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - (w * 7 + (6 - d)));
        const iso = targetDate.toISOString().split("T")[0];
        const mins = dayMap[iso] || 0;

        let bg = "rgba(128, 128, 128, 0.15)";
        if (mins > 60) bg = "var(--accent)";
        else if (mins > 30) bg = "rgba(15, 118, 110, 0.75)";
        else if (mins > 0) bg = "rgba(15, 118, 110, 0.4)";

        const sq = el("div");
        sq.style.width = "18px";
        sq.style.height = "18px";
        sq.style.borderRadius = "4px";
        sq.style.background = bg;
        sq.style.cursor = "pointer";
        sq.title = `${iso}: ${mins} دقيقة مذاكرة`;
        sq.addEventListener("click", () => say(`${iso}: أنجزت ${mins} دقيقة مذاكرة 📚`));
        col.appendChild(sq);
      }
      weeksCol.appendChild(col);
    }
    gridContainer.appendChild(weeksCol);

    const labelsCol = el("div");
    labelsCol.style.display = "flex";
    labelsCol.style.flexDirection = "column";
    labelsCol.style.gap = "4px";
    labelsCol.style.fontSize = "11px";
    labelsCol.style.fontWeight = "bold";
    labelsCol.style.opacity = "0.7";
    labelsCol.style.textAlign = "center";
    daysLabels.forEach((dl) => {
      const item = el("div", "", dl);
      item.style.height = "18px";
      item.style.lineHeight = "18px";
      labelsCol.appendChild(item);
    });
    gridContainer.appendChild(labelsCol);

    heatmapCard.appendChild(gridContainer);
    box.appendChild(heatmapCard);

    // سجل الجلسات المنجزة
    const recentsCard = el("div", "card");
    recentsCard.style.margin = "0 0 16px 0";
    recentsCard.style.padding = "16px";
    recentsCard.style.background = "var(--card)";
    recentsCard.style.border = "1.5px solid var(--line)";
    recentsCard.style.borderRadius = "16px";

    recentsCard.appendChild(el("div", "", "الجلسات المسجلة حديثاً 📝"));
    if (!sessions.length) {
      recentsCard.appendChild(el("p", "meta", "لا توجد جلسات بعد. ابدأ جلستك الأولى الآن!"));
    } else {
      const recentList = [...sessions].reverse().slice(0, 5);
      recentList.forEach((s) => {
        const item = el("div");
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.padding = "8px 0";
        item.style.borderBottom = "1px solid var(--line)";
        item.style.fontSize = "13px";
        item.innerHTML = `<div><strong>${s.courseName}</strong> ˙ ${s.lectureTitle || `محاضرة 1`}</div>
          <div style="opacity:0.8; font-weight:bold; color:var(--accent);">${s.minutes} دقيقة</div>`;
        recentsCard.appendChild(item);
      });
    }
    box.appendChild(recentsCard);

    const startBtn = el("button", "btn-primary", "ابدأ جلسة جديدة ⏱️");
    startBtn.style.width = "100%";
    startBtn.style.padding = "14px";
    startBtn.style.fontSize = "16px";
    startBtn.style.fontWeight = "bold";
    startBtn.style.borderRadius = "12px";
    startBtn.addEventListener("click", () => {
      currentTab = "pomodoro";
      renderActiveTab();
    });
    box.appendChild(startBtn);
  }

  // =========================================================================
  // 4. مؤقت بومودورو مع حرية تحديد الوقت وتحديث الأزرار
  // =========================================================================
  function renderPomodoroView(box) {
    breadcrumb.textContent = "math 3 · مؤقت بومودورو";

    const header = el("div");
    header.style.marginBottom = "14px";
    const title = el("h2", "", "مؤقت بومودورو ⏱️");
    title.style.margin = "0 0 4px 0";
    title.style.fontSize = "22px";
    header.appendChild(title);

    const desc = el("p");
    desc.style.margin = "0";
    desc.style.fontSize = "12.5px";
    desc.style.opacity = "0.75";
    desc.textContent = "اختر مدة الجلسة الجاهزة (25 و 5) أو حدد دقائقك الخاصة براحتك تماماً.";
    header.appendChild(desc);
    box.appendChild(header);

    const presetRow = el("div");
    presetRow.style.display = "grid";
    presetRow.style.gridTemplateColumns = "1fr 1fr 1fr 1fr";
    presetRow.style.gap = "6px";
    presetRow.style.marginBottom = "10px";

    const presets = [
      { label: "25 د (بومودورو)", mins: 25 },
      { label: "50 د (عميق)", mins: 50 },
      { label: "استراحة 5 د", mins: 5 },
      { label: "وقت مخصص ✏️", mins: "custom" }
    ];

    let customInputWrap = el("div");
    customInputWrap.style.display = "none";
    customInputWrap.style.margin = "0 0 14px 0";

    presets.forEach((pr) => {
      const b = el("button", "small", pr.label);
      b.style.fontSize = "11px";
      b.style.padding = "8px 2px";
      b.style.fontWeight = "bold";
      b.addEventListener("click", () => {
        if (pr.mins === "custom") {
          customInputWrap.style.display = "flex";
        } else {
          customInputWrap.style.display = "none";
          setPomodoroDuration(pr.mins);
        }
      });
      presetRow.appendChild(b);
    });
    box.appendChild(presetRow);

    customInputWrap.style.alignItems = "center";
    customInputWrap.style.gap = "8px";
    customInputWrap.style.padding = "8px 12px";
    customInputWrap.style.background = "var(--paper)";
    customInputWrap.style.borderRadius = "10px";
    customInputWrap.style.border = "1px solid var(--line)";

    const cLabel = el("span", "", "حدد المدة:");
    cLabel.style.fontSize = "13px";
    customInputWrap.appendChild(cLabel);

    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.min = "1";
    numInput.max = "180";
    numInput.value = String(pomodoroState.focusMinutes || 30);
    numInput.style.width = "70px";
    numInput.style.padding = "6px 8px";
    numInput.style.borderRadius = "6px";
    numInput.style.border = "1px solid var(--line)";
    numInput.style.background = "var(--card)";
    numInput.style.color = "var(--ink)";
    numInput.style.fontWeight = "bold";
    customInputWrap.appendChild(numInput);

    const applyCustomBtn = el("button", "small btn-primary", "تطبيق المدة");
    applyCustomBtn.addEventListener("click", () => {
      const val = Number(numInput.value);
      if (val > 0) {
        setPomodoroDuration(val);
        say(`تم ضبط المؤقت على ${val} دقيقة!`);
      }
    });
    customInputWrap.appendChild(applyCustomBtn);
    box.appendChild(customInputWrap);

    function setPomodoroDuration(mins) {
      pomodoroState.focusMinutes = mins;
      pomodoroState.totalSeconds = mins * 60;
      pomodoroState.secondsLeft = mins * 60;
      if (pomodoroState.running) pauseTimer();
      updateTimerUI();
    }

    const selectCard = el("div", "card");
    selectCard.style.margin = "0 0 16px 0";
    selectCard.style.padding = "12px 14px";
    selectCard.style.background = "var(--card)";
    selectCard.style.border = "1.5px solid var(--line)";
    selectCard.style.borderRadius = "14px";
    selectCard.style.display = "flex";
    selectCard.style.flexDirection = "column";
    selectCard.style.gap = "8px";

    const selRow = el("div");
    selRow.style.display = "flex";
    selRow.style.alignItems = "center";
    selRow.style.gap = "10px";

    const cLabelText = el("span", "", "المادة:");
    cLabelText.style.fontSize = "13px";
    cLabelText.style.fontWeight = "bold";
    selRow.appendChild(cLabelText);

    const cSelect = el("select");
    cSelect.style.flex = "1";
    cSelect.style.padding = "8px 10px";
    cSelect.style.background = "var(--paper)";
    cSelect.style.color = "var(--ink)";
    cSelect.style.border = "1px solid var(--line)";
    cSelect.style.borderRadius = "8px";
    cSelect.style.fontWeight = "bold";

    courseList.forEach((c) => {
      const o = el("option", "", c.name);
      o.value = c.name;
      if (c.name === pomodoroState.selectedCourse) o.selected = true;
      cSelect.appendChild(o);
    });

    selRow.appendChild(cSelect);
    selectCard.appendChild(selRow);

    const itemRow = el("div");
    itemRow.style.display = "flex";
    itemRow.style.alignItems = "center";
    itemRow.style.gap = "10px";

    const iLabelText = el("span", "", "الموضوع:");
    iLabelText.style.fontSize = "13px";
    iLabelText.style.fontWeight = "bold";
    itemRow.appendChild(iLabelText);

    const itemInput = document.createElement("input");
    itemInput.type = "text";
    itemInput.placeholder = "مثال: محاضرة 3 أو سكشن 2 أو مراجعة...";
    itemInput.value = pomodoroState.selectedItemTitle || "محاضرة 1";
    itemInput.style.flex = "1";
    itemInput.style.padding = "8px 10px";
    itemInput.style.background = "var(--paper)";
    itemInput.style.color = "var(--ink)";
    itemInput.style.border = "1px solid var(--line)";
    itemInput.style.borderRadius = "8px";
    itemInput.addEventListener("input", (e) => {
      pomodoroState.selectedItemTitle = e.target.value;
    });

    itemRow.appendChild(itemInput);
    selectCard.appendChild(itemRow);

    cSelect.addEventListener("change", (e) => {
      pomodoroState.selectedCourse = e.target.value;
    });

    box.appendChild(selectCard);

    // المؤقت الدائري
    const dialWrap = el("div");
    dialWrap.style.display = "flex";
    dialWrap.style.flexDirection = "column";
    dialWrap.style.alignItems = "center";
    dialWrap.style.justifyContent = "center";
    dialWrap.style.margin = "16px 0";

    const svgSize = 220;
    const strokeWidth = 14;
    const radius = (svgSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const dialSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    dialSvg.setAttribute("width", String(svgSize));
    dialSvg.setAttribute("height", String(svgSize));
    dialSvg.style.transform = "rotate(-90deg)";

    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("cx", String(svgSize / 2));
    bgCircle.setAttribute("cy", String(svgSize / 2));
    bgCircle.setAttribute("r", String(radius));
    bgCircle.setAttribute("fill", "transparent");
    bgCircle.setAttribute("stroke", "rgba(128, 128, 128, 0.2)");
    bgCircle.setAttribute("stroke-width", String(strokeWidth));
    dialSvg.appendChild(bgCircle);

    const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progressCircle.setAttribute("cx", String(svgSize / 2));
    progressCircle.setAttribute("cy", String(svgSize / 2));
    progressCircle.setAttribute("r", String(radius));
    progressCircle.setAttribute("fill", "transparent");
    progressCircle.setAttribute("stroke", "var(--accent)");
    progressCircle.setAttribute("stroke-width", String(strokeWidth));
    progressCircle.setAttribute("stroke-dasharray", String(circumference));
    progressCircle.setAttribute("stroke-linecap", "round");
    progressCircle.style.transition = "stroke-dashoffset 0.5s linear";
    dialSvg.appendChild(progressCircle);

    const timerText = el("div");
    timerText.style.position = "absolute";
    timerText.style.fontSize = "44px";
    timerText.style.fontWeight = "bold";
    timerText.style.color = "var(--ink)";

    const dialHolder = el("div");
    dialHolder.style.position = "relative";
    dialHolder.style.display = "flex";
    dialHolder.style.alignItems = "center";
    dialHolder.style.justifyContent = "center";
    dialHolder.appendChild(dialSvg);
    dialHolder.appendChild(timerText);

    dialWrap.appendChild(dialHolder);
    box.appendChild(dialWrap);

    function updateTimerUI() {
      const mins = Math.floor(pomodoroState.secondsLeft / 60);
      const secs = pomodoroState.secondsLeft % 60;
      timerText.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      const progress = pomodoroState.secondsLeft / pomodoroState.totalSeconds;
      const offset = circumference * (1 - progress);
      progressCircle.setAttribute("stroke-dashoffset", String(offset));
    }

    function startTimer() {
      if (pomodoroState.running) return;
      pomodoroState.running = true;
      toggleBtn.textContent = "إيقاف مؤقت";
      toggleBtn.style.background = "var(--card)";
      toggleBtn.style.border = "1.5px solid var(--line)";
      toggleBtn.style.color = "var(--ink)";

      pomodoroState.timerId = setInterval(() => {
        if (pomodoroState.secondsLeft > 0) {
          pomodoroState.secondsLeft--;
          updateTimerUI();
        } else {
          finishSession(true);
        }
      }, 1000);
    }

    function pauseTimer() {
      pomodoroState.running = false;
      clearInterval(pomodoroState.timerId);
      pomodoroState.timerId = null;
      toggleBtn.textContent = "استئناف الجلسة";
      toggleBtn.style.background = "var(--accent)";
      toggleBtn.style.border = "none";
      toggleBtn.style.color = "#fff";
    }

    const ctlRow = el("div");
    ctlRow.style.display = "grid";
    ctlRow.style.gridTemplateColumns = "1fr 1fr";
    ctlRow.style.gap = "10px";
    ctlRow.style.marginBottom = "20px";

    const finishBtn = el("button", "btn-primary", "إنهاء وتسجيل");
    finishBtn.style.padding = "14px";
    finishBtn.style.fontSize = "15px";
    finishBtn.style.fontWeight = "bold";
    finishBtn.style.borderRadius = "12px";
    finishBtn.addEventListener("click", () => finishSession(false));
    ctlRow.appendChild(finishBtn);

    const toggleBtn = el("button", "", pomodoroState.running ? "إيقاف مؤقت" : "بدء الجلسة");
    toggleBtn.style.padding = "14px";
    toggleBtn.style.fontSize = "15px";
    toggleBtn.style.fontWeight = "bold";
    toggleBtn.style.borderRadius = "12px";
    toggleBtn.style.background = pomodoroState.running ? "var(--card)" : "var(--accent)";
    toggleBtn.style.color = pomodoroState.running ? "var(--ink)" : "#fff";
    toggleBtn.style.border = pomodoroState.running ? "1.5px solid var(--line)" : "none";
    toggleBtn.style.cursor = "pointer";

    toggleBtn.addEventListener("click", () => {
      if (pomodoroState.running) pauseTimer();
      else startTimer();
    });
    ctlRow.appendChild(toggleBtn);

    box.appendChild(ctlRow);

    const checklistCard = el("div", "card");
    checklistCard.style.margin = "0 0 14px 0";
    checklistCard.style.padding = "16px";
    checklistCard.style.background = "var(--card)";
    checklistCard.style.border = "1.5px solid var(--line)";
    checklistCard.style.borderRadius = "16px";

    const chTitle = el("div", "", "عند الإنهاء: سجّل اللي أنجزته في الجلسة");
    chTitle.style.fontSize = "14px";
    chTitle.style.fontWeight = "bold";
    chTitle.style.marginBottom = "12px";
    checklistCard.appendChild(chTitle);

    const items = [
      { key: "checkedStudy", label: "مذاكرة وفهم الشرح" },
      { key: "checkedRevise", label: "مراجعة وتثبيت" },
      { key: "checkedSolve", label: "حل تمارين وتطبيقات" }
    ];

    items.forEach((it) => {
      const row = el("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "10px";
      row.style.fontSize = "13.5px";
      row.style.marginBottom = "8px";
      row.style.cursor = "pointer";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = pomodoroState[it.key];
      cb.style.width = "18px";
      cb.style.height = "18px";
      cb.style.accentColor = "var(--accent)";
      cb.addEventListener("change", (e) => {
        pomodoroState[it.key] = e.target.checked;
      });

      row.appendChild(cb);
      row.appendChild(el("span", "", it.label));
      checklistCard.appendChild(row);
    });

    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "ملاحظة سريعة على الجلسة (اختياري)...";
    noteInput.value = pomodoroState.notes;
    noteInput.style.width = "100%";
    noteInput.style.marginTop = "8px";
    noteInput.style.padding = "10px 12px";
    noteInput.style.background = "var(--paper)";
    noteInput.style.border = "1px solid var(--line)";
    noteInput.style.borderRadius = "8px";
    noteInput.style.color = "var(--ink)";
    noteInput.style.boxSizing = "border-box";
    noteInput.addEventListener("input", (e) => {
      pomodoroState.notes = e.target.value;
    });
    checklistCard.appendChild(noteInput);

    box.appendChild(checklistCard);

    updateTimerUI();

    function finishSession(isNaturalEnd) {
      if (pomodoroState.running) pauseTimer();

      const elapsedSecs = pomodoroState.totalSeconds - pomodoroState.secondsLeft;
      const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60));

      if (isNaturalEnd) playPomodoroChime();

      const tData = getTrackerData();
      const todayIso = new Date().toISOString().split("T")[0];

      tData.sessions.push({
        id: "sess-" + Date.now(),
        date: todayIso,
        courseName: pomodoroState.selectedCourse,
        lectureTitle: pomodoroState.selectedItemTitle || "محاضرة 1",
        minutes: elapsedMins,
        study: pomodoroState.checkedStudy,
        revise: pomodoroState.checkedRevise,
        solve: pomodoroState.checkedSolve,
        notes: pomodoroState.notes
      });

      const crs = tData.courses[pomodoroState.selectedCourse];
      if (crs) {
        if (!crs.items) crs.items = [];
        let targetItem = crs.items.find((l) => l.title === pomodoroState.selectedItemTitle);
        if (!targetItem) {
          targetItem = {
            id: "it-" + Date.now(),
            title: pomodoroState.selectedItemTitle || "محاضرة 1",
            study: pomodoroState.checkedStudy,
            revise: pomodoroState.checkedRevise,
            solve: pomodoroState.checkedSolve,
            closedMistakes: false,
            notes: pomodoroState.notes
          };
          crs.items.push(targetItem);
        } else {
          if (pomodoroState.checkedStudy) targetItem.study = true;
          if (pomodoroState.checkedRevise) targetItem.revise = true;
          if (pomodoroState.checkedSolve) targetItem.solve = true;
          if (pomodoroState.notes) targetItem.notes = pomodoroState.notes;
        }
      }

      tData.lastActiveDate = todayIso;
      tData.streak = calculateRealStreak(tData).count;

      saveTrackerData(tData);

      pomodoroState.secondsLeft = pomodoroState.totalSeconds;
      pomodoroState.notes = "";

      say(`عاش! سجلت ${elapsedMins} دقيقة مذاكرة بنجاح في ${pomodoroState.selectedCourse} 👏`);
      currentTab = "readiness";
      renderActiveTab();
    }
  }

  // =========================================================================
  // نوافذ تفاعلية حديثة داخل الـ DOM (بدون prompt/confirm المعطلة على الموبايل)
  // =========================================================================

  // نافذة تسجيل الإنجاز بدقة
  function openItemEditorModal(courseName, item, onSave) {
    const existing = document.getElementById("item-editor-modal");
    if (existing) existing.remove();

    const backdrop = el("div");
    backdrop.id = "item-editor-modal";
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(0,0,0,0.72)";
    backdrop.style.backdropFilter = "blur(4px)";
    backdrop.style.zIndex = "99999";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.padding = "16px";

    const modal = el("div", "card");
    modal.style.maxWidth = "400px";
    modal.style.width = "100%";
    modal.style.background = "var(--card)";
    modal.style.border = "1.5px solid var(--accent)";
    modal.style.borderRadius = "16px";
    modal.style.padding = "20px";

    const mHead = el("h3", "", `${courseName} ˙ ${item.title}`);
    mHead.style.margin = "0 0 14px 0";
    modal.appendChild(mHead);

    const toggles = [
      { key: "study", label: "مذاكرة وفهم الشرح (%30)" },
      { key: "revise", label: "مراجعة وتثبيت (%25)" },
      { key: "solve", label: "حل تمارين وشيتات (%30)" },
      { key: "closedMistakes", label: "إتقان وتثبيت الصعوبات (%15)" }
    ];

    const vals = { ...item };

    toggles.forEach((t) => {
      const row = el("label");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "10px";
      row.style.fontSize = "13.5px";
      row.style.marginBottom = "10px";
      row.style.cursor = "pointer";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = Boolean(vals[t.key]);
      cb.style.width = "18px";
      cb.style.height = "18px";
      cb.style.accentColor = "var(--accent)";
      cb.addEventListener("change", (e) => {
        vals[t.key] = e.target.checked;
      });

      row.appendChild(cb);
      row.appendChild(el("span", "", t.label));
      modal.appendChild(row);
    });

    const noteInp = document.createElement("input");
    noteInp.type = "text";
    noteInp.placeholder = "ملاحظات على هذه المحاضرة / السكشن...";
    noteInp.value = vals.notes || "";
    noteInp.style.width = "100%";
    noteInp.style.margin = "8px 0 16px 0";
    noteInp.style.padding = "10px 12px";
    noteInp.style.background = "var(--paper)";
    noteInp.style.border = "1px solid var(--line)";
    noteInp.style.borderRadius = "8px";
    noteInp.style.color = "var(--ink)";
    noteInp.style.boxSizing = "border-box";
    modal.appendChild(noteInp);

    const mBtns = el("div");
    mBtns.style.display = "flex";
    mBtns.style.gap = "10px";

    const saveBtn = el("button", "btn-primary", "حفظ الإنجاز");
    saveBtn.style.flex = "1";
    saveBtn.addEventListener("click", () => {
      // تعديل الحفظ ليحدث مباشرة على كائن التخزين الفعلي دون فقدان
      const d = getTrackerData();
      if (d.courses[courseName] && d.courses[courseName].items) {
        const target = d.courses[courseName].items.find(x => x.id === item.id || x.title === item.title);
        if (target) {
          target.study = vals.study;
          target.revise = vals.revise;
          target.solve = vals.solve;
          target.closedMistakes = vals.closedMistakes;
          target.notes = noteInp.value;
        }
      }
      saveTrackerData(d);
      backdrop.remove();
      if (onSave) onSave();
    });
    mBtns.appendChild(saveBtn);

    const cancelBtn = el("button", "small", "إلغاء");
    cancelBtn.addEventListener("click", () => backdrop.remove());
    mBtns.appendChild(cancelBtn);

    modal.appendChild(mBtns);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  }

  // نافذة إدخال نصوص مخصصة (بديل لـ prompt)
  function openPromptModal(title, message, defaultVal, onConfirm) {
    const backdrop = el("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(0,0,0,0.72)";
    backdrop.style.backdropFilter = "blur(4px)";
    backdrop.style.zIndex = "99999";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.padding = "16px";

    const modal = el("div", "card");
    modal.style.maxWidth = "380px";
    modal.style.width = "100%";
    modal.style.background = "var(--card)";
    modal.style.border = "1.5px solid var(--accent)";
    modal.style.borderRadius = "16px";
    modal.style.padding = "20px";

    const h = el("h3", "", title);
    h.style.margin = "0 0 8px 0";
    modal.appendChild(h);

    const p = el("p", "", message);
    p.style.margin = "0 0 12px 0";
    p.style.fontSize = "13px";
    p.style.opacity = "0.8";
    modal.appendChild(p);

    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = defaultVal || "";
    inp.style.width = "100%";
    inp.style.padding = "10px 12px";
    inp.style.background = "var(--paper)";
    inp.style.border = "1px solid var(--line)";
    inp.style.borderRadius = "8px";
    inp.style.color = "var(--ink)";
    inp.style.boxSizing = "border-box";
    inp.style.marginBottom = "16px";
    modal.appendChild(inp);

    const row = el("div");
    row.style.display = "flex";
    row.style.gap = "8px";

    const okBtn = el("button", "btn-primary", "تأكيد");
    okBtn.style.flex = "1";
    okBtn.addEventListener("click", () => {
      const v = inp.value.trim();
      backdrop.remove();
      if (onConfirm) onConfirm(v);
    });
    row.appendChild(okBtn);

    const closeBtn = el("button", "small", "إلغاء");
    closeBtn.addEventListener("click", () => backdrop.remove());
    row.appendChild(closeBtn);

    modal.appendChild(row);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    setTimeout(() => inp.focus(), 100);
  }

  // نافذة تأكيد (بديل لـ confirm)
  function openConfirmModal(title, message, onYes) {
    const backdrop = el("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(0,0,0,0.72)";
    backdrop.style.backdropFilter = "blur(4px)";
    backdrop.style.zIndex = "99999";
    backdrop.style.display = "flex";
    backdrop.style.alignItems = "center";
    backdrop.style.justifyContent = "center";
    backdrop.style.padding = "16px";

    const modal = el("div", "card");
    modal.style.maxWidth = "360px";
    modal.style.width = "100%";
    modal.style.background = "var(--card)";
    modal.style.border = "1.5px solid var(--accent)";
    modal.style.borderRadius = "16px";
    modal.style.padding = "20px";

    const h = el("h3", "", title);
    h.style.margin = "0 0 8px 0";
    modal.appendChild(h);

    const p = el("p", "", message);
    p.style.margin = "0 0 16px 0";
    p.style.fontSize = "13.5px";
    p.style.opacity = "0.85";
    p.style.lineHeight = "1.5";
    modal.appendChild(p);

    const row = el("div");
    row.style.display = "flex";
    row.style.gap = "8px";

    const yesBtn = el("button", "btn-primary", "نعم، متأكد");
    yesBtn.style.flex = "1";
    yesBtn.addEventListener("click", () => {
      backdrop.remove();
      if (onYes) onYes();
    });
    row.appendChild(yesBtn);

    const noBtn = el("button", "small", "تراجع");
    noBtn.addEventListener("click", () => backdrop.remove());
    row.appendChild(noBtn);

    modal.appendChild(row);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  }

  renderActiveTab();
}
