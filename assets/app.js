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
import { loadCourses, fetchData, loadData } from "./data.js";
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
  box.appendChild(el("p", "", "اختيار المواد المسجَّل فيها. تظهر التكاليف الخاصة بها فقط، ويمكن تغيير الاختيار في أي وقت."));
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
    c.appendChild(field("معاد التسليم", dl));
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
    if (it.deadline) c.appendChild(el("p", "meta", "معاد التسليم: " + fmtDeadline(it)));
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
/* تبييض المحاضرات: فولدر درايف ثابت لكل مادة */
function renderLinks(sec) {
  $("chips").replaceChildren();
  const list = $("list");
  list.replaceChildren();
  const courses = state.courses.filter((c) => c.is_active || (isAdmin() && c.drive_url));
  if (!courses.length) {
    list.appendChild(el("p", "center", "لا توجد مواد بعد"));
    return;
  }
  courses.forEach((c) => {
    const card = el("div", "card");
    card.appendChild(el("h3", "", c.name + (c.is_active ? "" : " (متوقفة)")));
    if (c.drive_url) {
      const a = el("a", "btn", "📁 فتح فولدر المحاضرات");
      a.href = c.drive_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      card.appendChild(a);
    } else {
      card.appendChild(el("p", "meta", "الرابط لسه مش متاح"));
    }
    if (isAdmin()) {
      const row = el("div", "row");
      const edit = el("button", "small", c.drive_url ? "تعديل الرابط" : "إضافة رابط");
      edit.addEventListener("click", async () => {
        const url = (prompt("رابط فولدر Drive بتاع " + c.name, c.drive_url || "") || "").trim();
        if (url === "") return;
        const u = safeUrl(url);
        if (!u) { say("الرابط غير صالح"); return; }
        const { error } = await sb.from("courses").update({ drive_url: u }).eq("id", c.id);
        if (error) { say("تعذّر الحفظ"); return; }
        say("تم الحفظ");
        await loadCourses();
        render();
      });
      row.appendChild(edit);
      if (c.drive_url) {
        const rm = el("button", "small danger", "حذف الرابط");
        rm.addEventListener("click", async () => {
          if (!confirm("حذف رابط الفولدر لمادة " + c.name + "؟")) return;
          const { error } = await sb.from("courses").update({ drive_url: null }).eq("id", c.id);
          if (error) { say("تعذّر الحذف"); return; }
          say("تم الحذف");
          await loadCourses();
          render();
        });
        row.appendChild(rm);
      }
      card.appendChild(row);
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
  box.appendChild(el("p", "meta", "أقسام جديدة تظهر للطلاب تلقائيًا بدون تعديل كود. القسم الجديد فيه عنوان وتفاصيل ومرفق."));

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
    say("تم إنشاء القسم"); render();
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
      if (n) { say("القسم فيه عناصر. احذفي أو انقلي العناصر أولًا."); return; }
      if (!confirm("حذف قسم «" + sec.title + "» نهائيًا؟")) return;
      const { data: gone, error } = await sb.from("sections").delete().eq("id", sec.id).select("id");
      if (error || !gone || !gone.length) { say("تعذّر حذف القسم (تأكدي من صلاحية الحذف في Supabase)", true); return; }
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
  const headText = el("div");
  headText.appendChild(el("h2", "dash-title", "الرئيسية"));
  headText.appendChild(el("p", "dash-sub", "كل ما تحتاجه في مكان واحد."));
  head.appendChild(headText);
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

  const shortcuts = el("section", "dash-card dash-full");
  const r = el("div", "dash-actions");
  const shortcutList = [["📝 التكاليف", "tasks"], ["📰 النشرة الأسبوعية", "newsletter"], ["📬 المنشورات", "posts"], ["❓ الأسئلة", "qa"], ["📁 تبييض المحاضرات", "links"], ["📣 الأخبار", "news"]];
  shortcutList.forEach(([label, kind]) => {
    if (kind !== "posts" && !findSectionByKind(kind)) return;
    const b = el("button", "small", label);
    b.addEventListener("click", () => openSection(kind));
    r.appendChild(b);
  });
  state.sections.filter((x) => x.kind === "custom" && x.is_active !== false).forEach((sec) => {
    const b = el("button", "small", "📁 " + sec.title);
    b.addEventListener("click", () => openSectionById(sec.id));
    r.appendChild(b);
  });
  shortcuts.appendChild(r);
  grid.appendChild(shortcuts);

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
  const live = inSec.filter((x) => !x.deleted_at && visible(sec, x));
  const isTasks = sec.kind === "tasks";
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
  }
  if (bar.children.length) list.appendChild(bar);
  if (state.form) {
    const it = state.form.id ? state.items.find((x) => x.id === state.form.id) : null;
    list.appendChild(buildForm(sec, it));
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
  entries.forEach((e) => list.appendChild(e.k === "c" ? card(sec, e.it) : personalCard(e.p)));
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
  let name = "";
  try { name = localStorage.getItem("tg_login_name") || ""; } catch (e) {}
  $("login-label").textContent = name ? "Login as " + name : "الدخول بتيليجرام";
  $("login-label").hidden = false;
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
$("backup-btn").addEventListener("click", downloadBackup);
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
