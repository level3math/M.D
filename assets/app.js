
/* نافذة تنبيه طلب الحذف والإضافة */
let _dropAddModalOpen = false;

export function checkDropAddNotice() {
  try {
    // 1. فحص خيار "متفكرنيش تاني" للجهاز أو الحساب
    if (localStorage.getItem("drop_add_never_show") === "1") return;
    if (state.userId && localStorage.getItem("drop_add_never_show_" + state.userId) === "1") return;

    // 2. فحص إذا كانت أُغلقت مؤقتاً في هذه الجلسة
    if (sessionStorage.getItem("drop_add_dismissed_session") === "1") return;

    // 3. منع التكرار إذا كانت النافذة مفتوحة بالفعل
    if (_dropAddModalOpen || document.getElementById("drop-add-modal")) return;

    showDropAddModal();
  } catch (e) {
    console.warn("Notice check error:", e);
  }
}

function showDropAddModal() {
  const existing = document.getElementById("drop-add-modal");
  if (existing) existing.remove();

  _dropAddModalOpen = true;

  const backdrop = el("div");
  backdrop.id = "drop-add-modal";
  backdrop.style.position = "fixed";
  backdrop.style.inset = "0";
  backdrop.style.background = "rgba(0, 0, 0, 0.72)";
  backdrop.style.backdropFilter = "blur(6px)";
  backdrop.style.webkitBackdropFilter = "blur(6px)";
  backdrop.style.zIndex = "99999";
  backdrop.style.display = "flex";
  backdrop.style.alignItems = "center";
  backdrop.style.justifyContent = "center";
  backdrop.style.padding = "16px";
  backdrop.style.boxSizing = "border-box";

  const modal = el("div", "card");
  modal.style.maxWidth = "440px";
  modal.style.width = "100%";
  modal.style.background = "var(--card)";
  modal.style.border = "2px solid var(--accent)";
  modal.style.borderRadius = "20px";
  modal.style.padding = "24px 20px";
  modal.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.65)";
  modal.style.textAlign = "center";
  modal.style.position = "relative";

  // أيقونة بارزة في المنتصف
  const iconWrap = el("div");
  iconWrap.style.width = "64px";
  iconWrap.style.height = "64px";
  iconWrap.style.borderRadius = "50%";
  iconWrap.style.background = "rgba(15, 118, 110, 0.15)";
  iconWrap.style.display = "flex";
  iconWrap.style.alignItems = "center";
  iconWrap.style.justifyContent = "center";
  iconWrap.style.fontSize = "32px";
  iconWrap.style.margin = "0 auto 14px auto";
  iconWrap.textContent = "📝";
  modal.appendChild(iconWrap);

  // العنوان
  const title = el("h3");
  title.style.margin = "0 0 10px 0";
  title.style.fontSize = "19px";
  title.style.fontWeight = "bold";
  title.style.color = "var(--ink)";
  title.textContent = "تنبيه هام 📢";
  modal.appendChild(title);

  // التيكست المطلوب
  const text = el("p");
  text.style.margin = "0 0 18px 0";
  text.style.fontSize = "16px";
  text.style.lineHeight = "1.6";
  text.style.fontWeight = "600";
  text.style.color = "var(--ink)";
  text.textContent = "متنساش تقدم طلب الحذف و الإضافة";
  modal.appendChild(text);

  // بطاقة الرابط التفاعلية القابلة للنقر المباشر (تفتح الصفحة في تبويب جديد)
  const linkBox = el("a");
  linkBox.href = "https://forms.cloud.microsoft/r/8ghZLxwQQd";
  linkBox.target = "_blank";
  linkBox.rel = "noopener noreferrer";
  linkBox.style.display = "flex";
  linkBox.style.alignItems = "center";
  linkBox.style.justifyContent = "center";
  linkBox.style.gap = "8px";
  linkBox.style.padding = "14px 16px";
  linkBox.style.background = "var(--paper)";
  linkBox.style.border = "1.5px solid var(--accent)";
  linkBox.style.borderRadius = "12px";
  linkBox.style.color = "var(--accent)";
  linkBox.style.textDecoration = "none";
  linkBox.style.fontWeight = "bold";
  linkBox.style.fontSize = "14.5px";
  linkBox.style.marginBottom = "20px";
  linkBox.style.wordBreak = "break-all";
  linkBox.style.transition = "transform 0.15s ease, background 0.15s ease";

  const linkIcon = el("span", "", "📋");
  linkIcon.style.fontSize = "18px";
  linkBox.appendChild(linkIcon);

  const linkText = el("span", "", "لينك طلب الحذف و الإضافة ↗");
  linkBox.appendChild(linkText);

  linkBox.addEventListener("mouseenter", () => {
    linkBox.style.transform = "translateY(-2px)";
  });
  linkBox.addEventListener("mouseleave", () => {
    linkBox.style.transform = "translateY(0)";
  });
  modal.appendChild(linkBox);

  // شريط الأزرار (زر تمام، وزر تمام متفكرنيش تاني) - بدون علامة X
  const btnRow = el("div");
  btnRow.style.display = "flex";
  btnRow.style.flexDirection = "column";
  btnRow.style.gap = "10px";

  // 1. زر "تمام" (يغلق الآن ويظهر كل مرة يفتح الموقع ويظهر الهوم)
  const okBtn = el("button", "btn-primary", "تمام");
  okBtn.style.width = "100%";
  okBtn.style.padding = "12px";
  okBtn.style.fontSize = "15px";
  okBtn.style.fontWeight = "bold";
  okBtn.style.cursor = "pointer";
  okBtn.addEventListener("click", () => {
    sessionStorage.setItem("drop_add_dismissed_session", "1");
    _dropAddModalOpen = false;
    backdrop.remove();
  });
  btnRow.appendChild(okBtn);

  // 2. زر "تمام متفكرنيش تاني" (يغلق ولا يظهر للجهاز أو الحساب مجدداً)
  const neverBtn = el("button", "small", "تمام متفكرنيش تاني");
  neverBtn.style.width = "100%";
  neverBtn.style.padding = "10px";
  neverBtn.style.fontSize = "13.5px";
  neverBtn.style.opacity = "0.85";
  neverBtn.style.background = "transparent";
  neverBtn.style.border = "1px solid var(--line)";
  neverBtn.style.cursor = "pointer";
  neverBtn.addEventListener("click", () => {
    localStorage.setItem("drop_add_never_show", "1");
    if (state.userId) {
      localStorage.setItem("drop_add_never_show_" + state.userId, "1");
    }
    _dropAddModalOpen = false;
    backdrop.remove();
  });
  btnRow.appendChild(neverBtn);

  modal.appendChild(btnRow);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

import { broadcastNewItem } from "./notifications.js";
import { openSectionSchemaBuilder, buildDynamicContentForm, renderDynamicCard } from "./dynamic_sections.js";
import { showNotificationModal } from "./notifications.js";

/* نظام الجدول الدراسي الأسبوعي المتناغم مع الثيم والمتجاوب مع الموبايل */
const ALL_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
let _activeSchedDay = "";

function getTodayDayName() {
  const map = { 0: "الأحد", 1: "الاثنين", 2: "الثلاثاء", 3: "الأربعاء", 4: "الخميس", 5: "الجمعة", 6: "السبت" };
  return map[new Date().getDay()] || "السبت";
}

let _schedFilterMine = false;

function renderScheduleCard() {
  const todayName = getTodayDayName();
  if (!_activeSchedDay) {
    _activeSchedDay = todayName;
  }

  const card = el("section", "sched-card dash-full");
  card.style.marginBottom = "24px";
  
  const head = el("div", "sched-head");
  head.style.display = "flex";
  head.style.flexWrap = "wrap";
  head.style.justifyContent = "space-between";
  head.style.alignItems = "center";
  head.style.gap = "8px";

  const titleWrap = el("div");
  const h3 = el("h3", "sched-title", "الجدول الدراسي");
  h3.style.margin = "0";
  titleWrap.appendChild(h3);
  head.appendChild(titleWrap);

  const actHead = el("div", "row");
  actHead.style.gap = "6px";

  // فلتر موادي للطالب
  if (state.mine && state.mine.size > 0 && state.courses && state.courses.length > state.mine.size) {
    const filterBtn = el("button", "small", _schedFilterMine ? "كل المواد 🌐" : "موادي فقط ⭐");
    filterBtn.style.fontSize = "12px";
    filterBtn.addEventListener("click", () => {
      _schedFilterMine = !_schedFilterMine;
      render();
    });
    actHead.appendChild(filterBtn);
  }

  if (isAdmin()) {
    const addBtn = el("button", "small btn-primary", "+ إضافة حصة");
    addBtn.addEventListener("click", () => showScheduleModal(null));
    actHead.appendChild(addBtn);
  }
  head.appendChild(actHead);
  card.appendChild(head);

  // شريط الأيام المطور للموبايل مع عدد الحصص وتمييز اليوم الحالي
  const nav = el("div", "sched-days-nav");
  nav.style.display = "flex";
  nav.style.gap = "6px";
  nav.style.overflowX = "auto";
  nav.style.paddingBottom = "6px";
  nav.style.webkitOverflowScrolling = "touch";

  ALL_DAYS.forEach((d) => {
    const isToday = d === todayName;
    const isSelected = _activeSchedDay === d;
    const label = d;
    const btn = el("button", "sched-day-btn" + (isSelected ? " active" : ""), label);
    btn.style.whiteSpace = "nowrap";
    btn.style.position = "relative";
    
    if (isToday) {
      btn.style.border = "1.5px solid var(--accent)";
      if (!isSelected) {
        btn.style.fontWeight = "bold";
        btn.style.color = "var(--accent)";
      }
    }

    btn.addEventListener("click", () => {
      _activeSchedDay = d;
      render();
    });
    nav.appendChild(btn);
  });
  card.appendChild(nav);

  // قائمة الحصص لليوم المختار مع الفلترة
  let dayItems = (state.schedule || [])
    .filter((x) => x.day_of_week === _activeSchedDay)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);

  if (_schedFilterMine && state.mine && state.mine.size > 0) {
    dayItems = dayItems.filter((x) => !x.course_id || state.mine.has(x.course_id));
  }

  if (!dayItems.length) {
    const emptyP = el("p", "sched-empty", "لا توجد محاضرات أو سكاشن مسجلة ليوم " + _activeSchedDay + (_schedFilterMine ? " لموادك المختارة" : ""));
    card.appendChild(emptyP);
    return card;
  }

  const list = el("div", "sched-list");
  dayItems.forEach((item, idx) => {
    const slot = el("div", "sched-slot");
    slot.style.transition = "transform 0.15s ease";

    const timeCol = el("div", "sched-slot-time");
    timeCol.textContent = item.time_slot || "غير محدد";
    timeCol.style.fontWeight = "700";
    timeCol.style.fontSize = "13px";
    slot.appendChild(timeCol);

    const info = el("div", "sched-slot-info");
    const cn = item.course_id ? courseName(item.course_id) : "";
    const name = cn ? cn + (item.title ? " — " + item.title : "") : (item.title || "حصة دراسية");
    
    const nameEl = el("div", "sched-slot-name", name);
    nameEl.style.fontSize = "14.5px";
    nameEl.style.fontWeight = "bold";
    nameEl.style.color = "var(--ink)";
    info.appendChild(nameEl);

    const metaParts = [];
    if (item.location) metaParts.push("📍 " + item.location);
    if (item.instructor) metaParts.push("👤 " + item.instructor);
    if (item.notes) metaParts.push("📝 " + item.notes);
    if (metaParts.length) {
      const metaEl = el("div", "sched-slot-meta", metaParts.join(" • "));
      metaEl.style.fontSize = "12.5px";
      metaEl.style.marginTop = "4px";
      metaEl.style.opacity = "0.85";
      info.appendChild(metaEl);
    }
    slot.appendChild(info);

    if (isAdmin()) {
      const act = el("div", "sched-slot-actions");
      const editBtn = el("button", "small", "تعديل");
      editBtn.addEventListener("click", () => showScheduleModal(item));
      act.appendChild(editBtn);

      const delBtn = el("button", "small danger", "حذف");
      delBtn.addEventListener("click", async () => {
        if (!confirm("حذف هذه الحصة من جدول يوم " + _activeSchedDay + "؟")) return;
        const { error } = await sb.from("schedule").delete().eq("id", item.id);
        if (error) { say("تعذّر الحذف"); return; }
        say("تم الحذف بنجاح");
        invalidateCache();
        await fetchData(true);
        render();
      });
      act.appendChild(delBtn);
      slot.appendChild(act);
    }
    list.appendChild(slot);
  });
  card.appendChild(list);
  return card;
}

function showScheduleModal(item) {
  const isEdit = Boolean(item);
  const modal = el("div", "card");
  modal.style.marginTop = "12px";
  modal.style.border = "2px solid var(--line)";
  modal.style.padding = "14px";

  modal.appendChild(el("h3", "", isEdit ? "تعديل حصة" : "إضافة حصة للجدول"));

  const daySel = el("select");
  ALL_DAYS.forEach((d) => {
    const o = el("option", "", d);
    o.value = d;
    if (item ? item.day_of_week === d : _activeSchedDay === d) o.selected = true;
    daySel.appendChild(o);
  });
  modal.appendChild(field("اليوم", daySel));

  const courseSel = el("select");
  const optGeneral = el("option", "", "— عام / مشترك —");
  optGeneral.value = "";
  courseSel.appendChild(optGeneral);
  state.courses.filter((c) => c.is_active).forEach((c) => {
    const o = el("option", "", c.name);
    o.value = String(c.id);
    if (item && item.course_id === c.id) o.selected = true;
    courseSel.appendChild(o);
  });
  modal.appendChild(field("المادة", courseSel));

  const titleInp = el("input");
  titleInp.placeholder = "محاضرة / سكشن";
  titleInp.value = item ? item.title : "محاضرة";
  modal.appendChild(field("نوع الحصة", titleInp));

  const timeInp = el("input");
  timeInp.placeholder = "09:00 - 11:00";
  timeInp.value = item ? item.time_slot : "";
  modal.appendChild(field("الوقت", timeInp));

  const locInp = el("input");
  locInp.placeholder = "مدرج 1 / معمل";
  locInp.value = item && item.location ? item.location : "";
  modal.appendChild(field("المكان / القاعة", locInp));

  const instInp = el("input");
  instInp.placeholder = "د. فلان / م. فلان";
  instInp.value = item && item.instructor ? item.instructor : "";
  modal.appendChild(field("المحاضر (اختياري)", instInp));

  const notesInp = el("input");
  notesInp.placeholder = "أسبوع وأسبوع / ملاحظات";
  notesInp.value = item && item.notes ? item.notes : "";
  modal.appendChild(field("ملاحظات (اختياري)", notesInp));

  const row = el("div", "row");
  row.style.gap = "8px";
  row.style.marginTop = "10px";

  const ok = el("button", "btn-primary", isEdit ? "تحديث" : "حفظ");
  ok.addEventListener("click", async () => {
    const payload = {
      day_of_week: daySel.value,
      course_id: courseSel.value ? Number(courseSel.value) : null,
      title: titleInp.value.trim() || "محاضرة",
      time_slot: timeInp.value.trim() || "غير محدد",
      location: locInp.value.trim() || null,
      instructor: instInp.value.trim() || null,
      notes: notesInp.value.trim() || null
    };
    ok.disabled = true;
    const { error } = isEdit
      ? await sb.from("schedule").update(payload).eq("id", item.id)
      : await sb.from("schedule").insert(payload);
    ok.disabled = false;
    if (error) { say("تعذّر الحفظ"); return; }
    say("تم الحفظ بنجاح");
    _activeSchedDay = daySel.value;
    invalidateCache();
    await fetchData(true);
    modal.remove();
    render();
  });
  row.appendChild(ok);

  const cancel = el("button", "", "إلغاء");
  cancel.addEventListener("click", () => modal.remove());
  row.appendChild(cancel);

  modal.appendChild(row);
  const box = $("dashboard") || $("list");
  if (box) box.prepend(modal);
}

function truncatePostText(str, maxLen = 85) {
  if (!str) return "منشور بصورة";
  let clean = String(str).replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  let cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 25) {
    cut = cut.slice(0, lastSpace);
  }
  cut = cut.replace(/[\s،,.\-_:؛]+$/, "").trim();
  const words = cut.split(" ");
  if (words.length > 1 && words[words.length - 1].length <= 1) {
    words.pop();
    cut = words.join(" ").replace(/[\s،,.\-_:؛]+$/, "").trim();
  }
  return cut + "...";
}
import {
  sb, $, say, el, showLoading, fmt, fmtDeadline, logFmt, localToISO, toLocalInput, safeUrl,
  MAX_ATTACH, WARN_ATTACH, shrinkImage, humanSize,
  uploadAttachment, removeAttachmentFiles, uploadQAAttachment, renderQAAttachment
} from "./core.js";
import { roleLabels, roleRank, state, isAdmin, isFull, courseName, rpcMsg, setRender } from "./state.js";
import { loadCourses, fetchData, loadData, invalidateCache } from "./data.js";
import { check, field } from "./ui.js";
import { renderPosts } from "./posts.js";
import { loadThemeFromDb, discardThemeDraft, renderThemeEditor } from "./theme.js";

setRender(function () { return render.apply(null, arguments); });

function goHome() {
  state.active = null; state.form = null; state.pform = null; state.postForm = null; state.postFocus = null;
  state.trash = false; state.filter = "all"; state.qform = null; state.answerForm = {};
  render();
}
function setView(v) {
  $("app").hidden = v !== "app";
  $("picker-box").hidden = v !== "picker";
  $("courses-box").hidden = v !== "courses";
  $("people-box").hidden = v !== "people";
  $("log-box").hidden = v !== "log";
  $("theme-box").hidden = v !== "theme";
  if (v !== "theme") discardThemeDraft();
  if (v === "theme") renderThemeEditor($("theme-box"), () => setView("app"));
  if (v === "picker") renderPicker();
  if (v === "courses") renderCourses();
  if (v === "people") renderPeople(true);
  if (v === "log") renderLog();
  if (v === "app") {
    if (state.deepLinkPending) { state.deepLinkPending = false; render(); }
    else goHome();
  }
}
/* الدوس على الخلفية (أي حاجة مش زرار/كارت/تاب) يرجّع للهوم */
document.addEventListener("click", (e) => {
  if ($("app").hidden || !state.active) return;
  if (e.target.closest("button, a, input, textarea, select, .card")) return;
  goHome();
});
/* اختيار المواد */
function renderPicker() {
  const box = $("picker-box");
  box.replaceChildren();
  box.appendChild(el("h3", "", "اختيار المواد"));
  box.appendChild(el("p", "", state.role === "guest"
    ? "اختاري المواد التي تريدين ظهورها للزائر. يُحفظ الاختيار على هذا الجهاز فقط، ويمكن تغييره في أي وقت."
    : "اختيار المواد المسجَّل فيها. تظهر التكاليف الخاصة بها فقط، ويمكن تغيير الاختيار في أي وقت."));
  const sel = new Set(state.mine);
  const act = state.courses.filter((c) => c.is_active);
  if (!act.length) box.appendChild(el("p", "meta", "لا توجد مواد بعد"));
  act.forEach((c) => {
    const row = el("div");
    row.appendChild(check(c.name, sel.has(c.id), (v) => { if (v) sel.add(c.id); else sel.delete(c.id); }));
    box.appendChild(row);
  });
  const row = el("div", "row");
  const ok = el("button", "", "حفظ");
  ok.addEventListener("click", async () => {
    ok.disabled = true;

    // Anonymous visitors are read-only in Supabase. Save their course selection locally.
    if (state.role === "guest") {
      try {
        const selectedIds = [...sel];
        localStorage.setItem("anon_mine_courses", JSON.stringify(selectedIds));
        state.mine = new Set(selectedIds);
        state.chosen = true;
        state.filter = "all";
        ok.disabled = false;
        say("تم حفظ اختيار المواد على هذا الجهاز");
        await loadData();
        setView("app");
      } catch (err) {
        ok.disabled = false;
        say("تعذّر الحفظ على هذا الجهاز");
      }
      return;
    }

    let e = (await sb.from("user_courses").delete().eq("user_id", state.userId)).error;
    if (!e && sel.size) {
      e = (await sb.from("user_courses").insert(
        [...sel].map((id) => ({ user_id: state.userId, course_id: id }))
      )).error;
    }
    if (!e) e = (await sb.from("profiles").update({ courses_chosen: true }).eq("id", state.userId)).error;
    ok.disabled = false;
    if (e) { say("تعذّر الحفظ"); return; }
    state.chosen = true;
    state.mine = new Set(sel);
    state.filter = "all";
    say("تم الحفظ");
    await loadData();
    setView("app");
  });
  row.appendChild(ok);
  if (state.chosen) {
    const cancel = el("button", "", "إلغاء");
    cancel.addEventListener("click", () => setView("app"));
    row.appendChild(cancel);
  }
  box.appendChild(row);
}
/* إدارة المواد (للأدمنز) */
function renderCourses() {
  const box = $("courses-box");
  box.replaceChildren();
  const top = el("div", "row");
  top.appendChild(el("h3", "", "إدارة المواد"));
  const back = el("button", "small", "رجوع");
  back.addEventListener("click", () => setView("app"));
  top.appendChild(back);
  box.appendChild(top);
  const add = el("div", "card");
  const inp = el("input");
  inp.type = "text";
  inp.placeholder = "اسم المادة";
  add.appendChild(inp);
  const b = el("button", "", "إضافة مادة");
  b.style.marginTop = "8px";
  b.addEventListener("click", async () => {
    const name = inp.value.trim();
    if (!name) { say("اسم المادة مطلوب"); return; }
    const next = state.courses.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
    const { error } = await sb.from("courses").insert({ name, sort_order: next });
    if (error) { say(error.code === "23505" ? "المادة موجودة بالفعل" : "تعذّر الحفظ"); return; }
    say("تمت الإضافة");
    await loadCourses();
    renderCourses();
  });
  add.appendChild(b);
  box.appendChild(add);
  state.courses.forEach((c) => {
    const card = el("div", "card");
    card.appendChild(el("h3", "", c.name + (c.is_active ? "" : " (متوقفة)")));
    const row = el("div", "row");
    const rn = el("button", "small", "تعديل الاسم");
    rn.addEventListener("click", async () => {
      const name = (prompt("الاسم الجديد", c.name) || "").trim();
      if (!name || name === c.name) return;
      const { error } = await sb.from("courses").update({ name }).eq("id", c.id);
      if (error) { say(error.code === "23505" ? "الاسم مستخدم بالفعل" : "تعذّر الحفظ"); return; }
      say("");
      await loadCourses();
      renderCourses();
    });
    const tg = el("button", "small", c.is_active ? "إيقاف" : "تفعيل");
    tg.addEventListener("click", async () => {
      const { error } = await sb.from("courses").update({ is_active: !c.is_active }).eq("id", c.id);
      if (error) { say("تعذّر الحفظ"); return; }
      say("");
      await loadCourses();
      renderCourses();
    });
    row.appendChild(rn);
    row.appendChild(tg);
    [
      { key: "whatsapp_link", label: "واتساب" },
      { key: "teams_link", label: "تيمز" },
      { key: "telegram_link", label: "تيليجرام" },
      { key: "youtube_link", label: "يوتيوب" },
    ].forEach((k) => {
      const lb = el("button", "small", (c[k.key] ? "تعديل لينك " : "إضافة لينك ") + k.label);
      lb.addEventListener("click", async () => {
        const raw = prompt("رابط " + k.label + " بتاع " + c.name, c[k.key] || "");
        if (raw === null) return;
        const url = raw.trim();
        const u = url || null;
        if (u === (c[k.key] || null)) return;
        const { error } = await sb.from("courses").update({ [k.key]: u }).eq("id", c.id);
        if (error) { say("تعذّر الحفظ"); return; }
        say("");
        await loadCourses();
        renderCourses();
      });
      row.appendChild(lb);
    });
    if (isFull()) {
      const del = el("button", "small danger", "حذف");
      del.addEventListener("click", async () => {
        if (!confirm("حذف المادة نهائيًا؟ سيتم إلغاء تسجيل الناس فيها ولا يمكن التراجع.")) return;
        const { data, error } = await sb.from("courses").delete().eq("id", c.id).select("id");
        if (error) {
          say(error.code === "23503"
            ? "المادة مرتبطة بعناصر (حتى الموجودة في السلة). الأفضل إيقافها، أو حذف عناصرها أولًا."
            : "تعذّر الحذف");
          return;
        }
        if (!data || !data.length) { say("تعذّر الحذف"); return; }
        say("تم الحذف");
        await loadCourses();
        renderCourses();
      });
      row.appendChild(del);
    }
    card.appendChild(row);
    box.appendChild(card);
  });
}
/* users (للأدمن الكامل) */
async function changeRole(p, role, sel) {
  if (role === p.role) return;
  if (!confirm("تغيير دور " + (p.first_name || "هذا الحساب") + " إلى " + roleLabels[role] + "؟")) {
    sel.value = p.role;
    return;
  }
  const { error } = await sb.rpc("set_role", { target: p.id, new_role: role });
  if (error) { sel.value = p.role; say(rpcMsg(error)); return; }
  p.role = role;
  say("تم تغيير الدور");
  renderPeople(false);
}
async function toggleBlock(p) {
  const block = p.approved;
  const q = block
    ? "إيقاف هذا الحساب؟ لن يرى أي محتوى حتى يتم تفعيله."
    : "تفعيل هذا الحساب؟";
  if (!confirm(q)) return;
  const { error } = await sb.rpc("set_blocked", { target: p.id, blocked: block });
  if (error) { say(rpcMsg(error)); return; }
  p.approved = !block;
  say(block ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
  renderPeople(false);
}
async function deletePerson(p) {
  if (!confirm("حذف " + (p.first_name || "هذا الحساب") + " من الـ users؟\nهيقدر يرجع يظهر تاني لو عمل تسجيل دخول بتيليجرام من جديد.")) return;
  const { error } = await sb.rpc("delete_profile", { target: p.id });
  if (error) { say(rpcMsg(error)); return; }
  state.people = state.people.filter((x) => x.id !== p.id);
  say("تم الحذف");
  renderPeople(false);
}
function personCard(p) {
  const c = el("div", "card");
  c.appendChild(el("h3", "", p.first_name || "—"));
  const who = (p.username ? "@" + p.username : "بدون يوزر") + " · " + (roleLabels[p.role] || p.role)
    + (p.approved ? "" : " · موقوف")
    + (p.bot_ok === false ? " · الإشعارات متوقفة" : "");
  c.appendChild(el("p", "meta", who));
  if (p.id === state.userId) {
    c.appendChild(el("p", "meta", "هذا هو الحساب الحالي"));
    return c;
  }
  const row = el("div", "row");
  const sel = el("select");
  sel.style.width = "auto";
  ["student", "admin", "full_admin"].forEach((r) => {
    const o = el("option", "", roleLabels[r]);
    o.value = r;
    sel.appendChild(o);
  });
  sel.value = p.role;
  sel.addEventListener("change", () => changeRole(p, sel.value, sel));
  row.appendChild(sel);
  const bl = el("button", "small" + (p.approved ? " danger" : ""), p.approved ? "إيقاف الحساب" : "تفعيل الحساب");
  bl.addEventListener("click", () => toggleBlock(p));
  row.appendChild(bl);
  if (isFull()) {
    const del = el("button", "small danger", "حذف");
    del.addEventListener("click", () => deletePerson(p));
    row.appendChild(del);
  }
  c.appendChild(row);
  return c;
}
async function renderPeople(reload) {
  const box = $("people-box");
  if (reload) {
    showLoading(true);
    const { data, error } = await sb.from("profiles")
      .select("id,first_name,username,role,approved,created_at,bot_ok")
      .order("created_at", { ascending: false });
    showLoading(false);
    if (error) { say("تعذّر تحميل الحسابات", true); return; }
    state.people = data;
    state.peopleQuery = "";
    state.peopleLimit = 50;
  }
  box.replaceChildren();
  const top = el("div", "row");
  top.appendChild(el("h3", "", "users"));
  const back = el("button", "small", "رجوع");
  back.addEventListener("click", () => setView("app"));
  top.appendChild(back);
  box.appendChild(top);
  const q = el("input");
  q.type = "text";
  q.placeholder = "بحث بالاسم أو اليوزر";
  q.value = state.peopleQuery;
  box.appendChild(q);
  const info = el("p", "meta");
  box.appendChild(info);
  const res = el("div");
  box.appendChild(res);
  const paint = () => {
    res.replaceChildren();
    const s = state.peopleQuery.trim().toLowerCase().replace(/^@/, "");
    const all = state.people.filter((p) => !s
      || (p.first_name || "").toLowerCase().includes(s)
      || (p.username || "").toLowerCase().includes(s));
    all.sort((a, b) => (roleRank[a.role] != null ? roleRank[a.role] : 3) - (roleRank[b.role] != null ? roleRank[b.role] : 3));
    const shown = all.slice(0, state.peopleLimit);
    info.textContent = "الحسابات: " + state.people.length + (s ? " · النتائج: " + all.length : "")
      + " · الإشعارات متوقفة عند: " + state.people.filter((p) => p.bot_ok === false).length;
    shown.forEach((p) => res.appendChild(personCard(p)));
    if (all.length > shown.length) {
      const more = el("button", "", "عرض المزيد");
      more.addEventListener("click", () => { state.peopleLimit += 50; paint(); });
      res.appendChild(more);
    }
  };
  q.addEventListener("input", () => { state.peopleQuery = q.value; state.peopleLimit = 50; paint(); });
  paint();
}
/* السجل (للأدمنز) */
const actLabels = {
  add: "إضافة", edit: "تعديل", delete: "حذف (إلى السلة)",
  restore: "استرجاع", purge: "حذف نهائي",
  role: "تغيير الدور", block: "إيقاف حساب", unblock: "تفعيل حساب",
  clear_log: "مسح السجل",
};
async function renderLog() {
  const box = $("log-box");
  box.replaceChildren();
  showLoading(true);
  const [l, p] = await Promise.all([
    sb.from("audit_log").select("id,actor,action,details,created_at")
      .order("created_at", { ascending: false }).limit(state.logLimit),
    sb.from("profiles").select("id,first_name,username"),
  ]);
  showLoading(false);
  if (l.error || p.error) { say("تعذّر تحميل السجل", true); return; }
  const names = {};
  p.data.forEach((x) => { names[x.id] = x.first_name || (x.username ? "@" + x.username : "—"); });
  const top = el("div", "row");
  top.appendChild(el("h3", "", "السجل"));
  const back = el("button", "small", "رجوع");
  back.addEventListener("click", () => setView("app"));
  top.appendChild(back);
  if (isFull() && l.data.length) {
    const clr = el("button", "small danger", "مسح السجل");
    clr.addEventListener("click", async () => {
      if (!confirm("مسح كل السجل؟ لا يمكن التراجع، وسيبقى سطر واحد يوضح من قام بالمسح.")) return;
      const { error } = await sb.rpc("clear_audit_log");
      if (error) { say(rpcMsg(error)); return; }
      say("تم مسح السجل");
      renderLog();
    });
    top.appendChild(clr);
  }
  box.appendChild(top);
  if (!l.data.length) box.appendChild(el("p", "center", "لا توجد سجلات بعد"));
  l.data.forEach((r) => {
    const c = el("div", "card");
    c.appendChild(el("h3", "", (r.details && r.details.title) || "—"));
    const who = r.actor ? (names[r.actor] || "—") : "النظام";
    const to = r.details && r.details.to ? " → " + (roleLabels[r.details.to] || r.details.to) : "";
    c.appendChild(el("p", "meta", (actLabels[r.action] || r.action) + to + " · " + who));
    c.appendChild(el("p", "meta", logFmt.format(new Date(r.created_at))));
    box.appendChild(c);
  });
  if (l.data.length >= state.logLimit) {
    const more = el("button", "", "عرض المزيد");
    more.addEventListener("click", () => { state.logLimit += 100; renderLog(); });
    box.appendChild(more);
  }
}
/* التقدّم والحذف */
async function save(itemId, done, submitted) {
  const { error } = await sb.from("progress").upsert(
    { user_id: state.userId, item_id: itemId, done, submitted, updated_at: new Date().toISOString() },
    { onConflict: "user_id,item_id" }
  );
  if (error) { say("تعذّر الحفظ"); return; }
  state.progress[itemId] = { item_id: itemId, done, submitted };
  say("");
  render();
}
async function setDeleted(id, val) {
  if (val && !confirm("تأكيد الحذف؟ يمكن استرجاعه من سلة المحذوفات.")) return;
  const { error } = await sb.from("items")
    .update({ deleted_at: val ? new Date().toISOString() : null }).eq("id", id);
  if (error) { say("تعذّر التنفيذ"); return; }
  say(val ? "تم الحذف" : "تم الاسترجاع");
  await loadData();
}
async function purge(id) {
  if (!confirm("حذف نهائي؟ لا يمكن التراجع، وستُمسح علامات الإنجاز الخاصة بهذا العنصر عند الجميع.")) return;
  const it = state.items.find((x) => x.id === id);
  const { data, error } = await sb.from("items").delete().eq("id", id).select("id");
  if (error || !data || !data.length) { say("تعذّر الحذف النهائي"); return; }
  if (it && it.attachment_path) await removeAttachmentFiles([it.attachment_path]);
  say("تم الحذف النهائي");
  await loadData();
}
async function emptyTrash(ids) {
  if (!ids.length) return;
  if (!confirm("تفريغ السلة؟ سيتم حذف " + ids.length + " عنصر نهائيًا ولا يمكن التراجع.")) return;
  const paths = state.items.filter((x) => ids.includes(x.id) && x.attachment_path).map((x) => x.attachment_path);
  const { data, error } = await sb.from("items").delete().in("id", ids).select("id");
  if (error || !data) { say("تعذّر تفريغ السلة"); return; }
  if (paths.length) await removeAttachmentFiles(paths);
  say("تم حذف " + data.length + " عنصر نهائيًا");
  await loadData();
}
/* العناصر الشخصية */
async function setPersonalDone(p, v) {
  const { error } = await sb.from("personal_items")
    .update({ done: v, updated_at: new Date().toISOString() }).eq("id", p.id);
  if (error) { say("تعذّر الحفظ"); render(); return; }
  p.done = v;
  say("");
  render();
}
async function deletePersonal(p) {
  if (!confirm("حذف هذا العنصر الشخصي نهائيًا؟")) return;
  const { error } = await sb.from("personal_items").delete().eq("id", p.id);
  if (error) { say("تعذّر الحذف"); return; }
  say("تم الحذف");
  await loadData();
}
function buildPersonalForm(p) {
  const c = el("div", "card");
  c.appendChild(el("h3", "", p ? "تعديل عنصر شخصي" : "عنصر شخصي جديد"));
  const title = el("input");
  title.type = "text";
  title.maxLength = 200;
  title.value = p ? p.title : "";
  c.appendChild(field("العنوان", title));
  const body = el("textarea");
  body.rows = 3;
  body.maxLength = 2000;
  body.value = p && p.body ? p.body : "";
  c.appendChild(field("التفاصيل", body));
  const dl = el("input");
  dl.type = "datetime-local";
  dl.value = p && p.deadline ? toLocalInput(p.deadline) : "";
  c.appendChild(field("معاد التسليم (اختياري)", dl));
  const row = el("div", "row");
  const ok = el("button", "", "حفظ");
  const cancel = el("button", "", "إلغاء");
  cancel.addEventListener("click", () => { state.pform = null; say(""); render(); });
  ok.addEventListener("click", async () => {
    const data = {
      title: title.value.trim(),
      body: body.value.trim() || null,
      deadline: dl.value ? localToISO(dl.value) : null,
    };
    if (!data.title) { say("العنوان مطلوب"); return; }
    ok.disabled = true;
    const { error } = p
      ? await sb.from("personal_items").update({ ...data, updated_at: new Date().toISOString() }).eq("id", p.id)
      : await sb.from("personal_items").insert({ ...data, user_id: state.userId });
    ok.disabled = false;
    if (error) { say("تعذّر الحفظ"); return; }
    state.pform = null;
    say("تم الحفظ");
    await loadData();
  });
  row.appendChild(ok);
  row.appendChild(cancel);
  c.appendChild(row);
  return c;
}
function personalCard(p) {
  const c = el("div", "card" + (p.done ? " doneitem" : ""));
  c.appendChild(el("h3", "", p.title));
  c.appendChild(el("p", "meta", "شخصي"));
  if (p.body) c.appendChild(el("p", "body", p.body));
  if (p.deadline) c.appendChild(el("p", "meta", "معاد التسليم: " + fmt(p.deadline)));
  const row = el("div");
  row.appendChild(check("خلّصت", p.done, (v) => setPersonalDone(p, v)));
  c.appendChild(row);
  const act = el("div", "row");
  const e = el("button", "small", "تعديل");
  e.addEventListener("click", () => { state.pform = { id: p.id }; state.form = null; say(""); render(); });
  const d = el("button", "small danger", "حذف");
  d.addEventListener("click", () => deletePersonal(p));
  act.appendChild(e);
  act.appendChild(d);
  c.appendChild(act);
  return c;
}
/* نموذج الإضافة والتعديل */
function buildForm(sec, it) {
  const c = el("div", "card");
  c.appendChild(el("h3", "", it ? "تعديل" : "إضافة"));
  const title = el("input");
  title.type = "text";
  title.value = it ? it.title : "";
  c.appendChild(field("العنوان", title));
  const body = el("textarea");
  body.rows = 4;
  body.value = it && it.body ? it.body : "";
  c.appendChild(field("التفاصيل", body));
  let csel = null;
  if (sec.kind !== "newsletter" && sec.kind !== "custom") {
    csel = el("select");
    const first = el("option", "", sec.kind === "news" ? "أخبار عامة" : "— اختيار المادة —");
    first.value = "";
    csel.appendChild(first);
    state.courses
      .filter((x) => x.is_active || (it && it.course_id === x.id))
      .forEach((x) => {
        const o = el("option", "", x.name);
        o.value = String(x.id);
        csel.appendChild(o);
      });
    csel.value = it && it.course_id != null ? String(it.course_id) : "";
    c.appendChild(field(sec.kind === "news" ? "التصنيف" : "المادة", csel));
  }
  let url = null, dl = null, hasTime = true;
  if (sec.kind === "links") {
    url = el("input");
    url.type = "url";
    url.dir = "ltr";
    url.value = it && it.url ? it.url : "";
    c.appendChild(field("الرابط", url));
  }
  if (sec.kind === "tasks") {
    hasTime = it ? it.deadline_has_time !== false : true;
    dl = el("input");
    dl.type = hasTime ? "datetime-local" : "date";
    if (it && it.deadline) {
      dl.value = hasTime ? toLocalInput(it.deadline) : toLocalInput(it.deadline).slice(0, 10);
    }
    c.appendChild(field("معاد التسليم (اختياري - اتركه فارغاً إذا لم يحدد موعد)", dl));
    c.appendChild(check("تحديد ساعة معاد التسليم", hasTime, (v) => {
      hasTime = v;
      const cur = dl.value;
      dl.type = hasTime ? "datetime-local" : "date";
      dl.value = cur ? (hasTime ? (cur.length === 10 ? cur + "T23:59" : cur) : cur.slice(0, 10)) : "";
    }));
  }
  let attFile = null, removeAtt = false;
  if (sec.kind !== "links") {
    if (it && it.attachment_kind) {
      const cur = el("div", "row");
      cur.appendChild(el("span", "meta", it.attachment_kind === "file"
        ? "مرفق حالي: " + (it.attachment_name || "ملف") + (it.attachment_size ? " (" + humanSize(it.attachment_size) + ")" : "")
        : "مرفق حالي: رابط خارجي"));
      const rm = el("button", "small danger", "إزالة المرفق");
      rm.addEventListener("click", () => { removeAtt = true; rm.disabled = true; cur.appendChild(el("span", "meta", " — هتتشال عند الحفظ")); });
      cur.appendChild(rm);
      c.appendChild(cur);
    }
    const fi = el("input");
    fi.type = "file";
    c.appendChild(field("إرفاق ملف (صورة / فيديو / PDF / أي نوع). يُفضَّل أقل من 5 ميجا، والحد الأقصى 10 ميجا", fi));
    fi.addEventListener("change", () => { attFile = fi.files[0] || null; });
    const alink = el("input");
    alink.type = "url";
    alink.dir = "ltr";
    alink.placeholder = "https://drive.google.com/...";
    c.appendChild(field("أو رابط خارجي (للملفات الكبيرة، مثل Drive)", alink));
    var attLinkInput = alink;
  }
  const row = el("div", "row");
  const ok = el("button", "", "حفظ");
  const cancel = el("button", "", "إلغاء");
  cancel.addEventListener("click", () => { state.form = null; say(""); render(); });
  ok.addEventListener("click", async () => {
    const data = { title: title.value.trim(), body: body.value.trim() || null };
    if (!data.title) { say("العنوان مطلوب"); return; }
    if (sec.kind !== "news" && sec.kind !== "newsletter" && sec.kind !== "custom" && !csel.value) { say("المادة مطلوبة"); return; }
    if (csel) data.course_id = csel.value ? Number(csel.value) : null;
    if (dl) {
      data.deadline = dl.value
        ? localToISO(hasTime ? dl.value : dl.value + "T23:59")
        : null;
      data.deadline_has_time = hasTime;
    }
    if (url) {
      const u = safeUrl(url.value.trim());
      if (!u) { say("الرابط غير صالح"); return; }
      data.url = u;
    }
    const linkVal = attLinkInput ? attLinkInput.value.trim() : "";
    if (attFile && linkVal) { say("الاختيار: رفع ملف أو رابط خارجي، وليس الاثنين معًا"); return; }
    let oldPath = it && it.attachment_path ? it.attachment_path : null;
    ok.disabled = true;
    if (attFile) attFile = await shrinkImage(attFile);
    if (attFile && attFile.size > MAX_ATTACH) { ok.disabled = false; say("الملف أكبر من 10 ميجا، يُرجى استخدام رابط خارجي"); return; }
    if (attFile && attFile.size > WARN_ATTACH
        && !confirm("حجم الملف " + humanSize(attFile.size) + ". الملفات الكبيرة تستهلك من حصة الموقع المجانية عند كل فتح. الأفضل استخدام رابط خارجي (Drive). المتابعة بالرفع؟")) {
      ok.disabled = false;
      return;
    }
    if (attFile) {
      const up = await uploadAttachment(sec.id, attFile);
      if (up.error) { ok.disabled = false; say("تعذّر رفع الملف"); return; }
      Object.assign(data, up.data);
    } else if (linkVal) {
      const u = safeUrl(linkVal);
      if (!u) { ok.disabled = false; say("رابط المرفق غير صالح"); return; }
      data.attachment_kind = "link"; data.attachment_url = u; data.attachment_path = null;
      data.attachment_name = null; data.attachment_mime = null; data.attachment_size = null;
    } else if (removeAtt) {
      data.attachment_kind = null; data.attachment_url = null; data.attachment_path = null;
      data.attachment_name = null; data.attachment_mime = null; data.attachment_size = null;
    } else {
      oldPath = null; // مفيش تغيير، ما نمسحش حاجة
    }
    const { error } = it
      ? await sb.from("items").update(data).eq("id", it.id)
      : await sb.from("items").insert({ ...data, section_id: sec.id });
    ok.disabled = false;
    if (error) { say("تعذّر الحفظ"); return; }
    if (oldPath && (attFile || linkVal || removeAtt)) await removeAttachmentFiles([oldPath]);
    state.form = null;
    say("تم الحفظ");
    await loadData();
  });
  row.appendChild(ok);
  row.appendChild(cancel);
  c.appendChild(row);
  return c;
}
/* العرض */
const isDone = (it) => { const p = state.progress[it.id]; return !!(p && p.done && p.submitted); };
function visible(sec, it) {
  if (sec.kind === "tasks" && !isAdmin() && !state.mine.has(it.course_id)) return false;
  if (sec.kind === "custom") return true;
  if (state.filter === "all") return true;
  if (state.filter === "general") return it.course_id == null;
  return it.course_id === state.filter;
}
function card(sec, it) {
  const c = el("div", "card" + (sec.kind === "tasks" && !it.deleted_at && isDone(it) ? " doneitem" : ""));
  c.appendChild(el("h3", "", it.title));
  const cn = (sec.kind === "newsletter" || sec.kind === "custom") ? "" : (it.course_id != null ? courseName(it.course_id) : (sec.kind === "news" ? "أخبار عامة" : ""));
  if (cn) c.appendChild(el("p", "meta", cn));
  if (it.body) c.appendChild(el("p", "body", it.body));
  if (sec.kind === "tasks") {
    c.appendChild(el("p", "meta", it.deadline ? "معاد التسليم: " + fmtDeadline(it) : "معاد التسليم: لم يُحدد بعد"));
  }
  if (sec.kind !== "links" && it.attachment_kind) {
    const wrap = el("div");
    const mime = it.attachment_mime || "";
    if (it.attachment_kind === "file" && mime.startsWith("image/")) {
      const img = el("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = it.attachment_url;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      wrap.appendChild(img);
    } else if (it.attachment_kind === "file" && mime.startsWith("video/")) {
      const v = el("video");
      v.preload = "none";
      v.setAttribute("playsinline", "");
      v.src = it.attachment_url;
      v.controls = true;
      v.style.maxWidth = "100%";
      wrap.appendChild(v);
    } else if (it.attachment_kind === "file" && mime === "application/pdf") {
      const show = el("button", "", "📄 عرض الملف هنا");
      show.style.marginBottom = "8px";
      show.addEventListener("click", () => {
        const f = el("iframe");
        f.src = it.attachment_url;
        f.style.width = "100%";
        f.style.height = "70vh";
        f.style.border = "2px solid var(--line)";
        f.style.borderRadius = "8px";
        show.replaceWith(f);
      });
      wrap.appendChild(show);
    }
    const box = el("div", "row");
    if (it.attachment_kind === "link") {
      const a = el("a", "btn", "🔗 فتح المرفق (رابط خارجي)");
      a.href = it.attachment_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      box.appendChild(a);
    } else {
      const open = el("a", "btn", "↗️ فتح في نافذة جديدة");
      open.href = it.attachment_url;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      box.appendChild(open);
      const dl = el("a", "btn", "⬇️ تحميل" + (it.attachment_size ? " (" + humanSize(it.attachment_size) + ")" : ""));
      dl.href = it.attachment_url + (it.attachment_url.includes("?") ? "&" : "?")
        + "download=" + encodeURIComponent(it.attachment_name || "");
      dl.rel = "noopener noreferrer";
      box.appendChild(dl);
    }
    wrap.appendChild(box);
    c.appendChild(wrap);
  }
  if (sec.kind === "links") {
    const u = it.url ? safeUrl(it.url) : null;
    if (u) {
      const a = el("a", "btn", "فتح الرابط");
      a.href = u;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      c.appendChild(a);
    }
  }
  if (isAdmin()) {
    const row = el("div", "row");
    if (it.deleted_at) {
      const r = el("button", "small", "استرجاع");
      r.addEventListener("click", () => setDeleted(it.id, false));
      row.appendChild(r);
      if (isFull()) {
        const pg = el("button", "small danger", "حذف نهائي");
        pg.addEventListener("click", () => purge(it.id));
        row.appendChild(pg);
      }
    } else {
      const e = el("button", "small", "تعديل");
      e.addEventListener("click", () => { state.form = { id: it.id }; state.pform = null; say(""); render(); });
      const d = el("button", "small danger", "حذف");
      d.addEventListener("click", () => setDeleted(it.id, true));
      row.appendChild(e);
      row.appendChild(d);
    }
    c.appendChild(row);
  }
  return c;
}
function renderChips(sec) {
  const chips = $("chips");
  chips.replaceChildren();
  if (sec.kind === "newsletter" || sec.kind === "custom") return;
  if (sec.kind === "tasks") { chips.style.overflow = "visible"; renderSectionsMenu(sec); return; }
  chips.style.overflow = "";
  const add = (label, val) => {
    const b = el("button", "chip" + (state.filter === val ? " active" : ""), label);
    b.addEventListener("click", () => { state.filter = val; render(); });
    chips.appendChild(b);
  };
  add("الكل", "all");
  if (sec.kind === "news") add("أخبار عامة", "general");
  const list = state.courses.filter((c) => c.is_active);
  list.forEach((c) => add(c.name, c.id));
}
/* قسم التكاليف: زرار (☰ الأقسام) يفتح قائمة بدل صف الأزرار الأفقي */
function renderSectionsMenu(sec) {
  const chips = $("chips");
  const items = [{ label: "الكل", val: "all" }, { label: "شخصي", val: "personal" }];
  const courseList = isAdmin()
    ? state.courses.filter((c) => c.is_active)
    : state.courses.filter((c) => c.is_active && state.mine.has(c.id));
  courseList.forEach((c) => items.push({ label: c.name, val: c.id }));
  if (!items.find((x) => x.val === state.filter)) state.filter = "all";
  const current = items.find((x) => x.val === state.filter) || items[0];
  const wrap = el("div", "menu-wrap");
  const btn = el("button", "small", "☰ الأقسام: " + current.label);
  const dd = el("div", "dropdown");
  dd.hidden = true;
  const addItem = (label, val) => {
    const b = el("button", "chip" + (state.filter === val ? " active" : ""), label);
    b.addEventListener("click", () => { state.filter = val; dd.hidden = true; render(); });
    dd.appendChild(b);
  };
  addItem("الكل", "all");
  addItem("شخصي", "personal");
  courseList.forEach((c) => addItem(c.name, c.id));
  btn.addEventListener("click", (e) => { e.stopPropagation(); dd.hidden = !dd.hidden; });
  wrap.appendChild(btn);
  wrap.appendChild(dd);
  chips.appendChild(wrap);
}
document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu-wrap")) {
    document.querySelectorAll(".menu-wrap .dropdown").forEach((d) => { d.hidden = true; });
  }
});
/* نسخة احتياطية (للمالك) */

/* نظام النسخ الاحتياطي والاستعادة المتقدم الشامل */
async function showBackupRestoreModal() {
  const existing = $("backup-restore-modal");
  if (existing) existing.remove();

  const backdrop = el("div");
  backdrop.id = "backup-restore-modal";
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

  const modal = el("div", "card");
  modal.style.position = "relative";
  modal.style.maxWidth = "520px";
  modal.style.width = "100%";
  modal.style.maxHeight = "90vh";
  modal.style.overflowY = "auto";
  modal.style.background = "var(--card)";
  modal.style.border = "2px solid var(--line)";
  modal.style.borderRadius = "16px";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0 20px 40px rgba(0,0,0,0.5)";

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  const head = el("div", "row");
  head.style.justifyContent = "space-between";
  head.style.alignItems = "center";
  head.style.marginBottom = "16px";
  head.appendChild(el("h3", "", "النسخ الاحتياطي والاستعادة المتقدمة 💾"));
  
  const closeBtn = el("button", "small", "✕");
  closeBtn.addEventListener("click", () => backdrop.remove());
  head.appendChild(closeBtn);
  modal.appendChild(head);

  // القسم الأول: تصدير نسخة احتياطية كاملة
  const exportCard = el("div", "card");
  exportCard.style.background = "var(--paper)";
  exportCard.style.border = "1px solid var(--line)";
  exportCard.style.padding = "14px";
  exportCard.style.marginBottom = "14px";
  
  exportCard.innerHTML = `
    <h4 style="margin:0 0 6px; font-size:15px; color:var(--accent);">📥 1. تصدير نسخة احتياطية كاملة (Full Backup):</h4>
    <p style="margin:0 0 10px; font-size:12.5px; opacity:0.85; line-height:1.5;">
      يقوم بإنشاء ملف JSON شامل لجميع محتويات المنصة (المواد، التكاليف، الجدول الدراسي، المنشورات، والأقسام).
    </p>
  `;

  const exportBtn = el("button", "btn-primary", "تنزيل النسخة الاحتياطية الكاملة");
  exportBtn.addEventListener("click", async () => {
    exportBtn.disabled = true;
    exportBtn.textContent = "جاري تجهيز النسخة...";
    try {
      const backupData = {
        version: "2.0.0",
        platform: "Math 3 Batch Board",
        exported_at: new Date().toISOString(),
        courses: state.courses || [],
        sections: state.sections || [],
        items: state.items || [],
        schedule: state.schedule || [],
        posts: state.posts || []
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "math3-full-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      say("تم تنزيل النسخة الكاملة بنجاح! يُرجى حفظ الملف في مكان آمن.");
    } catch (e) {
      say("تعذّر التصدير: " + e.message);
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = "تنزيل النسخة الاحتياطية الكاملة";
    }
  });
  exportCard.appendChild(exportBtn);
  modal.appendChild(exportCard);

  // القسم الثاني: استيراد واستعادة البيانات
  const importCard = el("div", "card");
  importCard.style.background = "var(--paper)";
  importCard.style.border = "1.5px dashed var(--accent)";
  importCard.style.padding = "14px";
  
  importCard.innerHTML = `
    <h4 style="margin:0 0 6px; font-size:15px; color:var(--accent);">📤 2. استيراد واستعادة البيانات (Restore from File):</h4>
    <p style="margin:0 0 10px; font-size:12.5px; opacity:0.85; line-height:1.5;">
      في حال ضياع أي بيانات أو رغبتك في استرجاع حالة سابقة، يتم اختيار ملف النسخة الاحتياطية (.json) ثم الضغط على زر الاستعادة:
    </p>
  `;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.style.display = "block";
  fileInput.style.marginBottom = "10px";
  fileInput.style.fontSize = "13px";
  importCard.appendChild(fileInput);

  const previewBox = el("div");
  previewBox.style.fontSize = "12.5px";
  previewBox.style.padding = "8px";
  previewBox.style.background = "var(--card)";
  previewBox.style.borderRadius = "8px";
  previewBox.style.marginBottom = "10px";
  previewBox.style.display = "none";
  importCard.appendChild(previewBox);

  const restoreBtn = el("button", "btn-primary", "استعادة البيانات من الملف 🔄");
  restoreBtn.style.display = "none";

  let loadedBackup = null;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      previewBox.style.display = "none";
      restoreBtn.style.display = "none";
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        loadedBackup = json;
        const cCount = (json.courses && json.courses.length) || 0;
        const sCount = (json.sections && json.sections.length) || 0;
        const iCount = (json.items && json.items.length) || 0;
        const scCount = (json.schedule && json.schedule.length) || 0;
        const pCount = (json.posts && json.posts.length) || 0;

        previewBox.innerHTML = `
          <strong>✅ تم فحص الملف بنجاح:</strong><br>
          • تاريخ النسخة: ${json.exported_at ? new Date(json.exported_at).toLocaleString("ar-EG") : "غير محدد"}<br>
          • المواد: ${cCount} | الأقسام: ${sCount}<br>
          • العناصر والتكاليف: ${iCount}<br>
          • حصص الجدول: ${scCount} | المنشورات: ${pCount}
        `;
        previewBox.style.display = "block";
        restoreBtn.style.display = "block";
      } catch (err) {
        alert("الملف غير صالح أو تالف: " + err.message);
        fileInput.value = "";
        previewBox.style.display = "none";
        restoreBtn.style.display = "none";
      }
    };
    reader.readAsText(file);
  });

  restoreBtn.addEventListener("click", async () => {
    if (!loadedBackup) return;
    if (!confirm("تأكيد استعادة كافة بيانات هذه النسخة؟ سيتم دمج وإعادة إدراج المواد والتكاليف والجدول.")) return;

    restoreBtn.disabled = true;
    restoreBtn.textContent = "جاري استعادة البيانات في سوبابيز...";
    showLoading(true);

    try {
      // 1. استعادة المواد
      if (loadedBackup.courses && loadedBackup.courses.length) {
        await sb.from("courses").upsert(loadedBackup.courses);
      }
      // 2. استعادة الأقسام
      if (loadedBackup.sections && loadedBackup.sections.length) {
        await sb.from("sections").upsert(loadedBackup.sections);
      }
      // 3. استعادة العناصر والتكاليف
      if (loadedBackup.items && loadedBackup.items.length) {
        await sb.from("items").upsert(loadedBackup.items);
      }
      // 4. استعادة الجدول الدراسي
      if (loadedBackup.schedule && loadedBackup.schedule.length) {
        await sb.from("schedule").upsert(loadedBackup.schedule);
      }
      // 5. استعادة المنشورات
      if (loadedBackup.posts && loadedBackup.posts.length) {
        await sb.from("posts").upsert(loadedBackup.posts);
      }

      say("تمت استعادة كافة البيانات بنجاح! تم تحديث المنصة.");
      if (typeof invalidateCache === "function") invalidateCache();
      await Promise.all([loadCourses(true), fetchData(true)]);
      render();
      backdrop.remove();
    } catch (err) {
      say("حدث خطأ أثناء الاستعادة: " + err.message);
    } finally {
      showLoading(false);
      restoreBtn.disabled = false;
      restoreBtn.textContent = "استعادة البيانات من الملف 🔄";
    }
  });

  importCard.appendChild(restoreBtn);
  modal.appendChild(importCard);

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

async function downloadBackup() {
  showLoading(true);
  const { data, error } = await sb.rpc("export_backup");
  showLoading(false);
  if (error || !data) { say("تعذّر إنشاء النسخة الاحتياطية"); return; }
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "math3-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  say("تم تنزيل النسخة. يُرجى حفظها في مكان خاص (Drive أو الرسائل المحفوظة)");
}
/* تنبيه الإشعارات المتوقفة */
function renderBotBanner() {
  const b = $("bot-banner");
  b.replaceChildren();
  if (state.botOk !== false) { b.hidden = true; return; }
  b.hidden = false;
  b.appendChild(el("h3", "", "الإشعارات على تيليجرام متوقفة"));
  b.appendChild(el("p", "", "لا يمكن للبوت إرسال رسائل لهذا الحساب حاليًا، لذلك لن تصل إشعارات التكاليف والأخبار. الحل: فتح البوت والضغط على Start، ثم الضغط على «إعادة المحاولة»."));
  const row = el("div", "row");
  const open = el("a", "btn", "فتح البوت");
  open.href = "https://t.me/MATHDEPARTMENT_BOT";
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  const retry = el("button", "", "إعادة المحاولة");
  retry.addEventListener("click", retryBot);
  row.appendChild(open);
  row.appendChild(retry);
  b.appendChild(row);
}
async function refreshBotStatus() {
  const { data } = await sb.from("profiles").select("bot_ok").eq("id", state.userId).single();
  if (data) { state.botOk = data.bot_ok; renderBotBanner(); }
}
async function retryBot() {
  const { error } = await sb.rpc("resend_welcome");
  if (error) {
    say((error.message || "").includes("too_soon") ? "تمت المحاولة للتو، يُرجى الانتظار دقيقتين" : "تعذّر التنفيذ");
    return;
  }
  say("تم إرسال رسالة اختبار. عند وصولها على تيليجرام سيختفي هذا التنبيه بعد قليل");
  setTimeout(refreshBotStatus, 75000);
  setTimeout(refreshBotStatus, 150000);
}
/* مكتبة المواد: فولدرات درايف لكل مادة (المحاضرات + الاسايمنتات) */
function renderLinks(sec) {
  $("chips").replaceChildren();
  const list = $("list");
  list.replaceChildren();
  const courses = state.courses.filter((c) => c.is_active || (isAdmin() && (c.drive_url || c.assignment_drive_url)));
  if (!courses.length) {
    list.appendChild(el("p", "center", "لا توجد مواد بعد"));
    return;
  }
  courses.forEach((c) => {
    const card = el("div", "card");
    card.appendChild(el("h3", "", c.name + (c.is_active ? "" : " (متوقفة)")));
    
    const linksRow = el("div", "row");
    linksRow.style.gap = "8px";
    linksRow.style.flexWrap = "wrap";
    linksRow.style.marginBottom = "8px";

    if (c.drive_url) {
      const aLect = el("a", "btn", "📁 فولدر المحاضرات");
      aLect.href = c.drive_url;
      aLect.target = "_blank";
      aLect.rel = "noopener noreferrer";
      linksRow.appendChild(aLect);
    } else {
      const noLect = el("span", "meta", "المحاضرات: غير متوفر");
      linksRow.appendChild(noLect);
    }

    if (c.assignment_drive_url) {
      const aAssign = el("a", "btn btn-primary", "📝 فولدر التكاليف");
      aAssign.href = c.assignment_drive_url;
      aAssign.target = "_blank";
      aAssign.rel = "noopener noreferrer";
      linksRow.appendChild(aAssign);
    } else {
      const noAssign = el("span", "meta", "التكاليف: غير متوفر");
      linksRow.appendChild(noAssign);
    }
    card.appendChild(linksRow);

    if (isAdmin()) {
      const adminRow = el("div", "row");
      adminRow.style.gap = "8px";
      adminRow.style.marginTop = "10px";
      adminRow.style.paddingTop = "10px";
      adminRow.style.borderTop = "1px dashed var(--line)";

      const editLect = el("button", "small", c.drive_url ? "تعديل درايف المحاضرات" : "إضافة درايف محاضرات");
      editLect.addEventListener("click", async () => {
        const url = (prompt("رابط درايف المحاضرات لمادة " + c.name, c.drive_url || "") || "").trim();
        if (url === "") return;
        const u = safeUrl(url);
        if (!u) { say("الرابط غير صالح"); return; }
        const { error } = await sb.from("courses").update({ drive_url: u }).eq("id", c.id);
        if (error) { say("تعذّر الحفظ"); return; }
        say("تم حفظ رابط المحاضرات");
        if (typeof invalidateCache === "function") invalidateCache();
        await loadCourses(true);
        render();
      });
      adminRow.appendChild(editLect);

      const editAssign = el("button", "small", c.assignment_drive_url ? "تعديل درايف التكاليف" : "إضافة درايف تكاليف");
      editAssign.addEventListener("click", async () => {
        const url = (prompt("رابط درايف التكاليف لمادة " + c.name, c.assignment_drive_url || "") || "").trim();
        if (url === "") return;
        const u = safeUrl(url);
        if (!u) { say("الرابط غير صالح"); return; }
        const { error } = await sb.from("courses").update({ assignment_drive_url: u }).eq("id", c.id);
        if (error) { say("تعذّر الحفظ"); return; }
        say("تم حفظ رابط درايف التكاليف");
        if (typeof invalidateCache === "function") invalidateCache();
        await loadCourses(true);
        render();
      });
      adminRow.appendChild(editAssign);

      card.appendChild(adminRow);
    }

    list.appendChild(card);
  });
}
/* قسم الأسئلة */
function displayName(uid) { return state.qaNames[uid] || "مستخدم"; }
function myPendingAnswer(qid) {
  return state.answers.find((a) => a.question_id === qid && a.status === "pending" && a.author_id === state.userId);
}
function approvedAnswers(qid) { return state.answers.filter((a) => a.question_id === qid && a.status === "approved"); }
function pendingAnswers(qid) { return state.answers.filter((a) => a.question_id === qid && a.status === "pending"); }
function renderQA(sec) {
  $("chips").replaceChildren();
  const list = $("list");
  list.replaceChildren();
  const bar = el("div", "row");
  const add = el("button", "", state.qform ? "إلغاء السؤال" : "+ اسأل سؤال");
  add.addEventListener("click", () => { state.qform = state.qform ? null : {}; render(); });
  bar.appendChild(add);
  list.appendChild(bar);
  if (state.qform) {
    const c = el("div", "card");
    const t = el("input");
    t.placeholder = "عنوان السؤال";
    const b = el("textarea");
    b.rows = 3;
    b.placeholder = "تفاصيل إضافية (اختياري)";
    c.appendChild(field("السؤال", t));
    c.appendChild(field("تفاصيل", b));
    const fi = el("input");
    fi.type = "file";
    let qFile = null;
    fi.addEventListener("change", () => { qFile = fi.files[0] || null; });
    c.appendChild(field("إرفاق ملف (اختياري، حتى 10 ميجا)", fi));
    const row = el("div", "row");
    const ok = el("button", "", "إرسال");
    const cancel = el("button", "", "إلغاء");
    cancel.addEventListener("click", () => { state.qform = null; render(); });
    ok.addEventListener("click", async () => {
      if (!t.value.trim()) { say("اكتب السؤال"); return; }
      if (qFile && qFile.size > MAX_ATTACH) { say("الملف أكبر من 10 ميجا"); return; }
      ok.disabled = true;
      let att = {};
      if (qFile) {
        const up = await uploadQAAttachment(qFile);
        if (up.error) { ok.disabled = false; say("تعذّر رفع الملف"); return; }
        att = {
          p_attachment_url: up.data.attachment_url, p_attachment_path: up.data.attachment_path,
          p_attachment_name: up.data.attachment_name, p_attachment_mime: up.data.attachment_mime,
          p_attachment_size: up.data.attachment_size,
        };
      }
      const { error } = await sb.rpc("ask_question", { p_title: t.value.trim(), p_body: b.value.trim() || null, ...att });
      ok.disabled = false;
      if (error) { say("تعذّر إرسال السؤال"); return; }
      state.qform = null;
      say("تم إرسال السؤال");
      await loadData();
    });
    row.appendChild(ok);
    row.appendChild(cancel);
    c.appendChild(row);
    list.appendChild(c);
  }
  if (!state.questions.length) {
    list.appendChild(el("p", "center", "لا يوجد أسئلة حتى الآن"));
    return;
  }
  state.questions.forEach((q) => {
    const c = el("div", "card");
    c.appendChild(el("h3", "", q.title));
    if (q.body) c.appendChild(el("p", "", q.body));
    if (isAdmin()) c.appendChild(el("div", "meta", displayName(q.asker_id)));
    const qAtt = renderQAAttachment(q);
    if (qAtt) c.appendChild(qAtt);
    const approved = approvedAnswers(q.id);
    const pending = pendingAnswers(q.id);
    approved.forEach((a) => {
      const ac = el("div", "row");
      ac.appendChild(el("span", "", "💬 " + a.body + (isAdmin() ? " — " + displayName(a.author_id) : "")));
      if (isAdmin()) {
        const del = el("button", "small danger", "حذف");
        del.addEventListener("click", async () => {
          if (!confirm("حذف الإجابة؟")) return;
          const { data, error } = await sb.rpc("delete_answer", { p_id: a.id });
          if (error) { say("تعذّر الحذف"); return; }
          if (data) {
            await sb.storage.from("attachments").remove([data]);
          }
          await loadData();
        });
        ac.appendChild(del);
      }
      c.appendChild(ac);
      const aAtt = renderQAAttachment(a);
      if (aAtt) c.appendChild(aAtt);
    });
    if (isAdmin()) {
      pending.forEach((a) => {
        const pc = el("div", "row");
        pc.appendChild(el("span", "", "⏳ " + a.body + " — " + displayName(a.author_id)));
        const okb = el("button", "small", "قبول");
        okb.addEventListener("click", async () => {
          const { error } = await sb.rpc("review_answer", { p_answer: a.id, p_approve: true });
          if (error) { say("تعذّر القبول"); return; }
          await loadData();
        });
        const nob = el("button", "small danger", "رفض");
        nob.addEventListener("click", async () => {
          const { error } = await sb.rpc("review_answer", { p_answer: a.id, p_approve: false });
          if (error) { say("تعذّر الرفض"); return; }
          await loadData();
        });
        pc.appendChild(okb);
        pc.appendChild(nob);
        c.appendChild(pc);
        const pAtt = renderQAAttachment(a);
        if (pAtt) c.appendChild(pAtt);
      });
    } else if (myPendingAnswer(q.id)) {
      c.appendChild(el("div", "meta", "إجابتك قيد المراجعة"));
    }
    const canAnswer = isAdmin() || (!approved.length && !myPendingAnswer(q.id));
    if (canAnswer) {
      if (state.answerForm[q.id]) {
        const ab = el("textarea");
        ab.rows = 2;
        ab.placeholder = "اكتب إجابتك";
        c.appendChild(ab);
        const afi = el("input");
        afi.type = "file";
        let aFile = null;
        afi.addEventListener("change", () => { aFile = afi.files[0] || null; });
        c.appendChild(field("إرفاق ملف (اختياري، حتى 10 ميجا)", afi));
        const arow = el("div", "row");
        const asend = el("button", "small", "إرسال الإجابة");
        const acancel = el("button", "small", "إلغاء");
        acancel.addEventListener("click", () => { delete state.answerForm[q.id]; render(); });
        asend.addEventListener("click", async () => {
          if (!ab.value.trim()) { say("اكتب الإجابة"); return; }
          if (aFile && aFile.size > MAX_ATTACH) { say("الملف أكبر من 10 ميجا"); return; }
          asend.disabled = true;
          let att = {};
          if (aFile) {
            const up = await uploadQAAttachment(aFile);
            if (up.error) { asend.disabled = false; say("تعذّر رفع الملف"); return; }
            att = {
              p_attachment_url: up.data.attachment_url, p_attachment_path: up.data.attachment_path,
              p_attachment_name: up.data.attachment_name, p_attachment_mime: up.data.attachment_mime,
              p_attachment_size: up.data.attachment_size,
            };
          }
          const { error } = await sb.rpc("answer_question", { p_question: q.id, p_body: ab.value.trim(), ...att });
          asend.disabled = false;
          if (error) { say("تعذّر إرسال الإجابة"); return; }
          delete state.answerForm[q.id];
          say("تم إرسال الإجابة");
          await loadData();
        });
        arow.appendChild(asend);
        arow.appendChild(acancel);
        c.appendChild(arow);
      } else {
        const ansBtn = el("button", "small", "أجب على السؤال");
        ansBtn.addEventListener("click", () => { state.answerForm[q.id] = true; render(); });
        c.appendChild(ansBtn);
      }
    }
    const canDeleteQ = isAdmin() || (q.asker_id === state.userId && !approved.length);
    if (canDeleteQ) {
      const delq = el("button", "small danger", "حذف السؤال");
      delq.addEventListener("click", async () => {
        if (!confirm("حذف السؤال؟")) return;
        const { data, error } = await sb.rpc("delete_question", { p_id: q.id });
        if (error) { say(/[?&]debug/.test(location.search) ? "تعذّر الحذف: " + error.message : "تعذّر الحذف"); return; }
        if (Array.isArray(data) && data.length) {
          await sb.storage.from("attachments").remove(data);
        }
        await loadData();
      });
      c.appendChild(delq);
    }
    list.appendChild(c);
  });
}
function findSectionByKind(kind) {
  return state.sections.find((s) => s.kind === kind) || null;
}
function openSection(kind) {
  if (kind === "posts") { state.active = "__posts__"; render(); return; }
  const sec = findSectionByKind(kind);
  if (!sec) return;
  state.active = sec.id; state.form = null; state.pform = null; state.postForm = null; state.postFocus = null;
  state.trash = false; state.filter = "all"; state.qform = null; state.answerForm = {};
  render();
}
function openSectionById(id) {
  const sec = state.sections.find((x) => String(x.id) === String(id));
  if (!sec) return;
  state.active = sec.id; state.form = null; state.pform = null; state.postForm = null; state.postFocus = null;
  state.trash = false; state.filter = "all"; state.qform = null; state.answerForm = {};
  render();
}
/* إدارة الأقسام الديناميكية (قالب بسيط: عنوان + تفاصيل + مرفق) */
function openSectionsAdmin() {
  if (!isAdmin()) return;
  ["picker-box", "courses-box", "people-box", "log-box", "theme-box"].forEach((id) => { $(id).hidden = true; });
  $("app").hidden = false;
  state.active = "__sections_admin__";
  state.form = null; state.pform = null; state.postForm = null; state.postFocus = null;
  state.trash = false; state.filter = "all"; state.qform = null; state.answerForm = {};
  render();
}
const sortSections = () => state.sections.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
function renderSectionsAdmin() {
  const box = $("dashboard");
  if (!box) return;
  box.replaceChildren();
  const head = el("div", "row");
  head.appendChild(el("h2", "", "إدارة الأقسام"));
  const back = el("button", "small", "← الرئيسية");
  back.addEventListener("click", goHome);
  head.appendChild(back);
  box.appendChild(head);
  box.appendChild(el("p", "meta", "نظام بناء المحتوى الحر: أنشئ أقساماً جديدة وصمّم حقولها (نصوص، ملفات PDF، صور، فيديوهات، معادلات، وروابط) بحرية تامة دون تعديل كود."));

  const create = el("div", "card");
  create.appendChild(el("h3", "", "قسم جديد"));
  const title = el("input"); title.type = "text"; title.maxLength = 120; title.placeholder = "مثال: المراجعات";
  const order = el("input"); order.type = "number"; order.min = "0"; order.step = "1";
  const nextOrder = () => String(state.sections.reduce((m, x) => Math.max(m, Number(x.sort_order) || 0), 0) + 1);
  order.value = nextOrder();
  create.appendChild(field("اسم القسم", title));
  create.appendChild(field("الترتيب", order));
  const add = el("button", "", "＋ إنشاء القسم");
  add.addEventListener("click", async () => {
    if (!isAdmin()) return;
    const name = title.value.trim();
    if (!name) { say("اسم القسم مطلوب"); return; }
    const n = Number(order.value);
    add.disabled = true;
    const { data, error } = await sb.from("sections")
      .insert({ title: name, kind: "custom", sort_order: Number.isFinite(n) ? n : 0, is_active: true })
      .select("id,title,kind,sort_order,is_active").single();
    add.disabled = false;
    if (error) { say("تعذّر إنشاء القسم: " + (error.message || ""), true); return; }
    state.sections.push(data); sortSections();
    say("تم إنشاء القسم بنجاح! يتم الآن فتح محرر تصميم الحقول...");
    render();
    setTimeout(() => {
      openSectionSchemaBuilder(data, () => render());
    }, 200);
  });
  create.appendChild(add);
  box.appendChild(create);

  const customs = state.sections.filter((x) => x.kind === "custom");
  const listCard = el("div", "card");
  listCard.appendChild(el("h3", "", "الأقسام الحالية"));
  if (!customs.length) listCard.appendChild(el("p", "meta", "لسه مفيش أقسام مضافة."));
  customs.forEach((sec, idx) => {
    const row = el("div", "card");
    const count = state.items.filter((x) => String(x.section_id) === String(sec.id) && !x.deleted_at).length;
    row.appendChild(el("h3", "", "📁 " + sec.title));
    row.appendChild(el("p", "meta", "الترتيب: " + (Number(sec.sort_order) || 0) + " · " + count + " عنصر · " + (sec.is_active === false ? "مخفي" : "ظاهر")));
    const act = el("div", "row");
    const move = async (dir) => {
      const other = customs[idx + dir];
      if (!other) return;
      const a = Number(sec.sort_order) || 0, b = Number(other.sort_order) || 0;
      const r1 = await sb.from("sections").update({ sort_order: b }).eq("id", sec.id);
      if (r1.error) { say("تعذّر تغيير الترتيب"); return; }
      const r2 = await sb.from("sections").update({ sort_order: a }).eq("id", other.id);
      if (r2.error) { await sb.from("sections").update({ sort_order: a }).eq("id", sec.id); say("تعذّر تغيير الترتيب"); return; }
      sec.sort_order = b; other.sort_order = a; sortSections(); render();
    };
    const up = el("button", "small", "↑"); up.disabled = idx === 0; up.addEventListener("click", () => move(-1));
    const down = el("button", "small", "↓"); down.disabled = idx === customs.length - 1; down.addEventListener("click", () => move(1));
    const open = el("button", "small", "فتح"); open.addEventListener("click", () => openSectionById(sec.id));
    const schemaBtn = el("button", "small btn-primary", "⚙️ تصميم الحقول");
    schemaBtn.title = "تعديل حقول هذا القسم وترتيبها";
    schemaBtn.addEventListener("click", () => {
      openSectionSchemaBuilder(sec, () => render());
    });
    act.appendChild(schemaBtn);
    const edit = el("button", "small", "تعديل");
    edit.addEventListener("click", async () => {
      const name = prompt("اسم القسم", sec.title);
      if (name === null) return;
      const clean = name.trim();
      if (!clean) { say("اسم القسم مطلوب"); return; }
      const { error } = await sb.from("sections").update({ title: clean }).eq("id", sec.id);
      if (error) { say("تعذّر التعديل"); return; }
      sec.title = clean; say("تم التعديل"); render();
    });
    const toggle = el("button", "small", sec.is_active === false ? "إظهار" : "إخفاء");
    toggle.addEventListener("click", async () => {
      const next = sec.is_active === false;
      const { error } = await sb.from("sections").update({ is_active: next }).eq("id", sec.id);
      if (error) { say("تعذّر تغيير الحالة"); return; }
      sec.is_active = next; say(next ? "تم إظهار القسم" : "تم إخفاء القسم"); render();
    });
    const del = el("button", "small danger", "حذف");
    del.addEventListener("click", async () => {
      const n = state.items.filter((x) => String(x.section_id) === String(sec.id)).length;
      if (n) { say("القسم يحتوي على عناصر. يُرجى حذفها أو نقلها أولاً."); return; }
      if (!confirm("حذف قسم «" + sec.title + "» نهائيًا؟")) return;
      const { data: gone, error } = await sb.from("sections").delete().eq("id", sec.id).select("id");
      if (error || !gone || !gone.length) { say("تعذّر حذف القسم (يُرجى التحقق من صلاحية الحذف في Supabase)", true); return; }
      state.sections = state.sections.filter((x) => x.id !== sec.id); say("تم حذف القسم"); render();
    });
    act.append(up, down, open, edit, toggle, del);
    row.appendChild(act);
    listCard.appendChild(row);
  });
  box.appendChild(listCard);
}
function renderDashboard() {
  const box = $("dashboard");
  if (!box) return;
  box.replaceChildren();

  const activeCourses = state.courses.filter((c) => c.is_active);
  const taskSec = findSectionByKind("tasks");
  const taskItems = taskSec ? state.items.filter((x) => x.section_id === taskSec.id && !x.deleted_at && visible(taskSec, x)) : [];
  const upcoming = taskItems.filter((x) => x.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 4);
  const allPosts = (state.posts || []).filter((p) => !p.deleted_at).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const posts = allPosts.slice(0, 3);
  const newsletterSec = findSectionByKind("newsletter");
  const newsletters = newsletterSec
    ? state.items.filter((x) => x.section_id === newsletterSec.id && !x.deleted_at).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 2)
    : [];

  const head = el("div", "dash-head");
  head.style.display = "flex";
  head.style.justifyContent = "space-between";
  head.style.alignItems = "center";
  head.style.marginBottom = "10px";

  const headText = el("div");
  headText.appendChild(el("h2", "dash-title", "الرئيسية"));
  headText.appendChild(el("p", "dash-sub", "كل ما تحتاجه في مكان واحد."));
  head.appendChild(headText);

  // زر الأقسام الأنيق فوق كارت المنشورات المتاحة مباشرة
  const menuBtn = el("button", "dash-menu-pill", "");
  menuBtn.innerHTML = '<span>📑 تصفح الأقسام</span> <span class="arrow">‹</span>';
  menuBtn.addEventListener("click", openSideDrawer);
  head.appendChild(menuBtn);

  box.appendChild(head);

  const stats = el("div", "dash-stats");
  [[activeCourses.length, "مادة متاحة"], [taskItems.length, "تكليف منشور"], [allPosts.length, "منشور متاح"]]
    .forEach(([n, label]) => {
      const c = el("div", "dash-card dash-stat");
      c.appendChild(el("div", "dash-count", String(n)));
      c.appendChild(el("div", "dash-stat-label", label));
      stats.appendChild(c);
    });
  box.appendChild(stats);
  box.appendChild(renderScheduleCard());

  const grid = el("div", "dash-grid");

  const tasksCard = el("section", "dash-card dash-wide");
  tasksCard.appendChild(el("h3", "", "📌 التكاليف القادمة"));
  const taskList = el("div", "dash-list");
  if (!upcoming.length) taskList.appendChild(el("p", "dash-empty", "لا توجد تكاليف بموعد محدد حاليًا."));
  upcoming.forEach((it) => {
    const row = el("div", "dash-item");
    const main = el("div", "dash-item-main");
    main.appendChild(el("div", "dash-item-title", it.title));
    main.appendChild(el("div", "dash-meta", (it.course_id != null ? courseName(it.course_id) : "تكليف عام")));
    main.appendChild(el("div", "dash-meta", fmtDeadline(it)));
    row.appendChild(main);
    const b = el("button", "small", "فتح");
    b.addEventListener("click", () => openSection("tasks"));
    row.appendChild(b);
    taskList.appendChild(row);
  });
  tasksCard.appendChild(taskList);
  grid.appendChild(tasksCard);

  if (newsletterSec) {
    const newsCard = el("section", "dash-card dash-side");
    newsCard.appendChild(el("h3", "", "📰 النشرة الأسبوعية"));
    const nl = el("div", "dash-list");
    if (!newsletters.length) nl.appendChild(el("p", "dash-empty", "لا توجد نشرة أسبوعية منشورة حاليًا."));
    newsletters.forEach((it) => {
      const row = el("div", "dash-item");
      const main = el("div", "dash-item-main");
      main.appendChild(el("div", "dash-item-title", it.title));
      row.appendChild(main);
      if (it.url) { const a = el("a", "small", "فتح"); a.href = it.url; a.target = "_blank"; a.rel = "noopener noreferrer"; row.appendChild(a); }
      nl.appendChild(row);
    });
    newsCard.appendChild(nl);
    grid.appendChild(newsCard);
  }

  const postsCard = el("section", "dash-card dash-wide");
  postsCard.appendChild(el("h3", "", "📬 أحدث المنشورات"));
  const pl = el("div", "dash-list");
  if (!posts.length) pl.appendChild(el("p", "dash-empty", "لا توجد منشورات حتى الآن."));
  posts.forEach((p) => {
    const row = el("div", "dash-item");
    const main = el("div", "dash-item-main");
    main.appendChild(el("div", "dash-item-title", truncatePostText(p.content, 85)));
    row.appendChild(main);
    const b = el("button", "small", "فتح");
    b.addEventListener("click", () => openSection("posts"));
    row.appendChild(b);
    pl.appendChild(row);
  });
  postsCard.appendChild(pl);
  grid.appendChild(postsCard);

  /* تم حذف الصندوق المربع بالكامل */

  box.appendChild(grid);
}
function render() {
  renderBotBanner();
  const tabs = $("tabs");
  tabs.replaceChildren();

  const postsBtn = el("button", "tab" + (state.active === "__posts__" ? " active" : ""), "المنشورات");
  postsBtn.addEventListener("click", () => {
    state.active = "__posts__";
    state.form = null;
    state.pform = null;
    state.postForm = null;
    state.postFocus = null;
    state.trash = false;
    state.filter = "all";
    state.qform = null;
    state.answerForm = {};
    render();
  });
  tabs.appendChild(postsBtn);
  
  state.sections.filter((x) => x.is_active !== false).forEach((sec) => {
    const b = el("button", "tab" + (sec.id === state.active ? " active" : ""), sec.title);
    b.addEventListener("click", () => {
      state.active = sec.id; state.form = null; state.pform = null; state.postForm = null; state.postFocus = null;
      state.trash = false; state.filter = "all"; state.qform = null; state.answerForm = {};
      render();
    });
    tabs.appendChild(b);
  });
  const list = $("list");
  list.replaceChildren();

  if (state.active === "__sections_admin__") {
    $("chips").replaceChildren();
    $("chips").hidden = true; $("list").hidden = true;
    tabs.hidden = true;
    $("dashboard").hidden = false;
    renderSectionsAdmin();
    return;
  }

  if (state.active === "__posts__") {
    tabs.hidden = false;
    $("dashboard").hidden = true;
    $("chips").hidden = false; $("list").hidden = false;
    $("chips").replaceChildren();
    renderPosts();
    return;
  }

  const sec = state.sections.find((x) => x.id === state.active);
  if (!sec) {
    $("chips").replaceChildren();
    $("chips").hidden = true; $("list").hidden = true;
    tabs.hidden = true;
    $("dashboard").hidden = false;
    renderDashboard();
    setTimeout(checkDropAddNotice, 350);
    return;
  }
  tabs.hidden = false;
  $("dashboard").hidden = true;
  $("chips").hidden = false; $("list").hidden = false;
  if (sec.kind === "qa") { renderQA(sec); return; }
  if (sec.kind === "links") { renderLinks(sec); return; }
  renderChips(sec);
  const inSec = state.items.filter((x) => x.section_id === sec.id);
  const dead = inSec.filter((x) => x.deleted_at);
  const liveAll = inSec.filter((x) => !x.deleted_at && visible(sec, x));
  const isTasks = sec.kind === "tasks";

  // إخفاء التكاليف المنتهية تلقائياً بمجرد انتهاء موعد التسليم
  const nowTs = Date.now();
  const isExpired = (item) => Boolean(item.deadline && new Date(item.deadline).getTime() < nowTs);
  const expiredCount = isTasks ? liveAll.filter(isExpired).length : 0;
  const live = (isTasks && !state.showExpiredTasks) ? liveAll.filter((it) => !isExpired(it)) : liveAll;
  const bar = el("div", "row");
  if (isAdmin()) {
    const add = el("button", "", "+ إضافة");
    add.addEventListener("click", () => { state.form = { id: null }; state.pform = null; state.trash = false; say(""); render(); });
    const tr = el("button", "", state.trash ? "رجوع" : "سلة المحذوفات (" + dead.length + ")");
    tr.addEventListener("click", () => { state.trash = !state.trash; state.form = null; state.pform = null; render(); });
    bar.appendChild(add);
    bar.appendChild(tr);
  }
  if (isFull() && state.trash && dead.length) {
    const et = el("button", "danger", "تفريغ السلة");
    et.addEventListener("click", () => emptyTrash(dead.map((x) => x.id)));
    bar.appendChild(et);
  }
  if (isTasks && !state.trash) {
    const pa = el("button", "", "+ عنصر شخصي");
    pa.addEventListener("click", () => { state.pform = { id: null }; state.form = null; say(""); render(); });
    bar.appendChild(pa);

    if (expiredCount > 0) {
      const expBtn = el("button", "small", state.showExpiredTasks ? "إخفاء المنتهية" : "التكاليف السابقة المنتهية (" + expiredCount + ")");
      expBtn.style.fontSize = "12px";
      expBtn.addEventListener("click", () => {
        state.showExpiredTasks = !state.showExpiredTasks;
        render();
      });
      bar.appendChild(expBtn);
    }
  }
  if (bar.children.length) list.appendChild(bar);
  if (state.form) {
    const it = state.form.id ? state.items.find((x) => x.id === state.form.id) : null;
    if (sec.kind === "custom") {
      list.appendChild(buildDynamicContentForm(sec, it, async () => {
        state.form = null;
        if (typeof invalidateCache === "function") invalidateCache();
        await fetchData(true);
        render();
      }, () => {
        state.form = null;
        render();
      }));
    } else {
      if (sec.kind === "custom") {
      list.appendChild(buildDynamicContentForm(sec, it, async () => {
        state.form = null;
        if (typeof invalidateCache === "function") invalidateCache();
        await fetchData(true);
        render();
      }, () => {
        state.form = null;
        render();
      }));
    } else {
      list.appendChild(buildForm(sec, it));
    }
    }
  }
  if (state.pform && isTasks && !state.trash) {
    const p = state.pform.id ? state.personal.find((x) => x.id === state.pform.id) : null;
    list.appendChild(buildPersonalForm(p));
  }
  let entries;
  if (state.trash) {
    entries = dead.map((it) => ({ k: "c", it }));
  } else {
    entries = live.map((it) => ({ k: "c", it }));
    if (isTasks && (state.filter === "all" || state.filter === "personal")) {
      state.personal.forEach((p) => entries.push({ k: "p", p }));
    }
  }
  const dlOf = (e) => {
    const d = e.k === "c" ? e.it.deadline : e.p.deadline;
    return d ? new Date(d).getTime() : Infinity;
  };
  const doneOf = (e) => (e.k === "c" ? isDone(e.it) : e.p.done) ? 1 : 0;
  const createdOf = (e) => new Date(e.k === "c" ? e.it.created_at : e.p.created_at).getTime();
  if (isTasks) {
    entries.sort((a, b) => {
      if (doneOf(a) !== doneOf(b)) return doneOf(a) - doneOf(b);
      if (dlOf(a) !== dlOf(b)) return dlOf(a) < dlOf(b) ? -1 : 1;
      return createdOf(a) - createdOf(b);
    });
  } else {
    entries.sort((a, b) => createdOf(b) - createdOf(a));
  }
  if (!entries.length) {
    list.appendChild(el("p", "center", state.trash ? "السلة فارغة" : "لا يوجد شيء هنا حتى الآن"));
  }
  entries.forEach((e) => {
    if (e.k === "p") {
      list.appendChild(personalCard(e.p));
    } else if (sec.kind === "custom") {
      const dynCard = renderDynamicCard(sec, e.it, isAdmin(), (item) => {
        state.form = { id: item.id };
        render();
      }, async (item) => {
        if (!confirm("حذف هذا المحتوى؟")) return;
        const { error } = await sb.from("items").update({ deleted_at: new Date().toISOString() }).eq("id", item.id);
        if (error) { say("تعذّر الحذف"); return; }
        say("تم الحذف بنجاح");
        if (typeof invalidateCache === "function") invalidateCache();
        await fetchData(true);
        render();
      });
      list.appendChild(dynCard || card(sec, e.it));
    } else {
      list.appendChild(card(sec, e.it));
    }
  });
}
/* الدخول والحساب */
function hideAll() {
  $("app").hidden = true;
  $("picker-box").hidden = true;
  $("courses-box").hidden = true;
  $("people-box").hidden = true;
  $("log-box").hidden = true;
  $("theme-box").hidden = true;
  $("theme-btn").hidden = true;
  $("courses-btn").hidden = true;
  // notif-btn remains visible across the entire site
  $("manage-btn").hidden = true;
  $("sections-btn").hidden = true;
  $("people-btn").hidden = true;
  $("log-btn").hidden = true;
  $("backup-btn").hidden = true;
  $("links-fab").hidden = true;
  $("links-panel").hidden = true;
  
}
function renderSavedAccounts() {
  const box = $("saved-accounts");
  if (!box) return;
  box.replaceChildren();
  // Don't show "Login as SALMA" header - keep only the Telegram widget!
  const lbl = $("login-label");
  if (lbl) lbl.hidden = true;
  $("tg-slot").hidden = false;
}

async function showProfile() {
  showLoading(true);
  hideAll();
  $("login-box").hidden = true;
  $("pending-box").hidden = true;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    showLoading(false);
    $("logout").hidden = true;
    $("login-box").hidden = false;
    renderSavedAccounts();
    mountTelegramRedirectButton();
    return;
  }
  state.userId = session.user.id;
  $("logout").hidden = false;
  const { data, error } = await sb.from("profiles")
    .select("first_name, role, approved, courses_chosen, bot_ok").eq("id", state.userId).single();
  if (error || !data) { showLoading(false); say("تعذّر تحميل الحساب", true); return; }
  try { localStorage.setItem("tg_login_name", data.first_name || ""); } catch (e) {}
  state.role = data.role;
  state.chosen = !!data.courses_chosen;
  state.botOk = data.bot_ok;
  if (!data.approved) {
    showLoading(false);
    $("welcome").textContent = "أهلًا " + (data.first_name || "");
    $("pending-box").hidden = false;
    return;
  }
  $("hello").textContent = "WELCOME " + (data.first_name || "") + " / " + (roleLabels[data.role] || data.role);
  say("");
  loadThemeFromDb();
  const [okC, okD] = await Promise.all([loadCourses(), fetchData()]);
  showLoading(false);
  if (!okC || !okD) return;
  $("courses-btn").hidden = false;
  const nb = $("notif-btn"); if (nb) nb.hidden = false;
  $("links-fab").hidden = false;
  
  $("manage-btn").hidden = !isAdmin();
  $("sections-btn").hidden = !isAdmin();
  $("theme-btn").hidden = !isFull();
  $("log-btn").hidden = !isAdmin();
  $("people-btn").hidden = !isFull();
  $("backup-btn").hidden = true;
  if (isFull()) {
    sb.rpc("can_backup").then(({ data }) => { $("backup-btn").hidden = data !== true; });
  }
  if (!state.chosen && state.courses.some((c) => c.is_active)) setView("picker");
  else setView("app");
}
async function onTelegramAuth(user) {
  $("login-box").hidden = true;
  showLoading(true);
  say("");
  const fail = (m) => { showLoading(false); $("login-box").hidden = false; renderSavedAccounts(); mountTelegramRedirectButton(); say(m); };
  const { data, error } = await sb.functions.invoke("telegram-auth", { body: user });
  if (error || !data || !data.token_hash) { fail("فشل الدخول، برجاء إعادة المحاولة"); return; }
  const { error: e2 } = await sb.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" });
  if (e2) { fail("فشل إكمال الدخول"); return; }
  await showProfile();
}
/* البتاعة العائمة: جروبات التواصل بتاعة كل مادة */
function renderLinksPanel() {
  const panel = $("links-panel");
  panel.replaceChildren();
  const kinds = [
    { key: "whatsapp_link", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#fff" d="M12 5.5a6.5 6.5 0 00-5.6 9.8L5.5 18.5l3.3-.9A6.5 6.5 0 1012 5.5zm3.8 9.3c-.2.5-1 .9-1.4 1-.4.1-.8.1-1.3-.1-.3-.1-.7-.2-1.2-.5-2.1-1-3.5-3-3.6-3.2-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.9.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.6 1.5c.1.1.1.3 0 .4l-.3.4c-.1.1-.2.3-.1.5.2.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.3.6c.2.1.3.1.4.2.1.2.1.7-.1 1.2z"/></svg>' },
    { key: "teams_link", icon: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#5059C9"/><text x="12" y="17" font-size="14" font-family="Arial,sans-serif" font-weight="700" fill="#fff" text-anchor="middle">T</text></svg>' },
    { key: "telegram_link", icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#229ED9"/><path fill="#fff" d="M17.5 7.2l-2.1 10.1c-.2.7-.6.9-1.2.6l-3.3-2.4-1.6 1.5c-.2.2-.3.3-.6.3l.2-3.3 6-5.4c.3-.2-.1-.4-.4-.2l-7.4 4.7-3.2-1c-.7-.2-.7-.7.1-1l12.5-4.8c.5-.2 1 .1.8 1z"/></svg>' },
    { key: "youtube_link", icon: '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="4" fill="#FF0000"/><path fill="#fff" d="M10 8l6 4-6 4z"/></svg>' },
  ];
  const list = state.courses
    .filter((c) => c.is_active)
    .map((c) => ({ c, n: kinds.reduce((s, k) => s + (c[k.key] ? 1 : 0), 0) }))
    .sort((a, b) => b.n - a.n);
  if (!list.length) { panel.appendChild(el("p", "center", "لا توجد مواد بعد")); return; }
  list.forEach(({ c }) => {
    const row = el("div", "links-row");
    row.appendChild(el("span", "name", c.name));
    const icons = el("div", "icons");
    kinds.forEach((k) => {
      if (c[k.key]) {
        const a = document.createElement("a");
        a.href = c[k.key]; a.target = "_blank"; a.rel = "noopener";
        a.innerHTML = k.icon;
        icons.appendChild(a);
      } else {
        const s = el("span", "dim");
        s.innerHTML = k.icon;
        icons.appendChild(s);
      }
    });
    row.appendChild(icons);
    panel.appendChild(row);
  });
}
$("links-fab").addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = $("links-panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) renderLinksPanel();
});
document.addEventListener("click", (e) => {
  if (e.target.closest("#links-fab, #links-panel")) return;
  $("links-panel").hidden = true;
});
$("courses-btn").addEventListener("click", () => setView("picker"));
$("manage-btn").addEventListener("click", () => setView("courses"));
$("sections-btn").addEventListener("click", openSectionsAdmin);
$("theme-btn").addEventListener("click", () => setView("theme"));
$("people-btn").addEventListener("click", () => setView("people"));
$("log-btn").addEventListener("click", () => { state.logLimit = 100; setView("log"); });
$("backup-btn").addEventListener("click", showBackupRestoreModal);
$("logout").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });
/* دخول تيليجرام على الآيفون: بيرجع للصفحة برابط فيه بيانات الدخول */
function mountTelegramRedirectButton() {
  if (!window.IS_IOS) return;
  var slot = $("tg-slot");
  if (!slot || slot.firstChild) return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://telegram.org/js/telegram-widget.js?22";
  s.setAttribute("data-telegram-login", "MATHDEPARTMENT_BOT");
  s.setAttribute("data-size", "large");
  s.setAttribute("data-request-access", "write");
  s.setAttribute("data-auth-url", location.origin + location.pathname.replace(/index\.html$/, ""));
  slot.appendChild(s);
}
function readTelegramReturn() {
  try {
    var q = new URLSearchParams(location.search);
    if (!q.get("hash") || !q.get("id") || !q.get("auth_date")) return null;
    var keys = ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"];
    var u = {};
    keys.forEach(function (k) { if (q.has(k)) u[k] = q.get(k); });
    history.replaceState(null, "", location.pathname);
    return u;
  } catch (e) { return null; }
}

export { readTelegramReturn, onTelegramAuth, showProfile };

/* تسجيل الدخول المجهول (Anonymous Login) للقراءة فقط */
async function loginAsAnonymous() {
  showLoading(true);
  hideAll();
  $("login-box").hidden = true;
  $("pending-box").hidden = true;
  
  state.userId = "anon-guest";
  state.role = "guest";
  state.chosen = true;
  state.botOk = true;

  try {
    sessionStorage.setItem("auth_mode", "anonymous");
  } catch (e) {}

  await Promise.allSettled([loadCourses(), fetchData(), loadThemeFromDb()]);
  
  showLoading(false);
  $("hello").textContent = "LOGGED IN AS ANONYMOUS";
  $("logout").hidden = false;
  $("courses-btn").hidden = false;
  const nb = $("notif-btn"); if (nb) nb.hidden = false;
  $("links-fab").hidden = false;
  
  
  // حجب صلاحيات وأزرار الإدارة تماماً للزائر المجهول
  $("manage-btn").hidden = true;
  $("sections-btn").hidden = true;
  $("theme-btn").hidden = true;
  $("people-btn").hidden = true;
  $("log-btn").hidden = true;
  $("backup-btn").hidden = true;

  const anonBanner = $("anon-banner");
  if (anonBanner) anonBanner.hidden = false;

  setView("app");
}

const anonBtn = $("anon-login-btn");
if (anonBtn) {
  anonBtn.addEventListener("click", loginAsAnonymous);
}

const switchTgBtn = $("switch-to-telegram-btn");
if (switchTgBtn) {
  switchTgBtn.addEventListener("click", async () => {
    try { sessionStorage.removeItem("auth_mode"); } catch (e) {}
    hideAll();
    const ab = $("anon-banner");
    if (ab) ab.hidden = true;
    $("login-box").hidden = false;
    $("logout").hidden = true;
    renderSavedAccounts();
    mountTelegramRedirectButton();
  });
}



/* دوال فتح وغلق درج الأقسام الجانبي */
function openSideDrawer() {
  const dr = $("side-drawer");
  const bd = $("drawer-backdrop");
  if (!dr || !bd) return;
  dr.style.display = "flex";
  bd.style.display = "block";
  requestAnimationFrame(() => {
    dr.classList.add("active");
    bd.classList.add("active");
  });
}

function closeSideDrawer() {
  const dr = $("side-drawer");
  const bd = $("drawer-backdrop");
  if (!dr || !bd) return;
  dr.classList.remove("active");
  bd.classList.remove("active");
  setTimeout(() => {
    if (!dr.classList.contains("active")) {
      dr.style.display = "none";
      bd.style.display = "none";
    }
  }, 250);
}

function initSideDrawer() {
  const dr = $("side-drawer");
  const bd = $("drawer-backdrop");
  const closeBtn = $("drawer-close");

  if (closeBtn) closeBtn.addEventListener("click", closeSideDrawer);
  if (bd) bd.addEventListener("click", closeSideDrawer);

  if (dr) {
    const items = dr.querySelectorAll(".side-drawer-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const kind = item.getAttribute("data-kind");
        items.forEach((b) => b.classList.remove("active"));
        item.classList.add("active");
        closeSideDrawer();

        if (kind === "__home__") {
          goHome();
        } else {
          openSection(kind);
        }
      });
    });
  }
}
initSideDrawer();

// ربط زر إعدادات إشعارات الويب
const nb1 = $("notif-btn");
if (nb1) nb1.addEventListener("click", showNotificationModal);


