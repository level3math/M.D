/* كاش فائق الذكاء في localStorage لتخفيض Log Ingestion بنسبة تصل إلى 90% */
const CACHE_KEY_DATA = "math3_cached_data_v2";
const CACHE_KEY_COURSES = "math3_cached_courses_v2";
const CACHE_KEY_TIME = "math3_cached_time_v2";
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 دقائق كاش ثابت يمنع استهلاك طلبات وسجلات Supabase

function getStoredCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setStoredCache(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

function invalidateCache() {
  try {
    localStorage.removeItem(CACHE_KEY_DATA);
    localStorage.removeItem(CACHE_KEY_COURSES);
    localStorage.removeItem(CACHE_KEY_TIME);
  } catch (e) {}
}

import { sb, say } from "./core.js";
import { state, isAdmin, render } from "./state.js";
import { getPostIdFromLocation } from "./ui.js";

async function loadCourses(force = false) {
  const cachedTime = Number(localStorage.getItem(CACHE_KEY_TIME)) || 0;
  const cachedCourses = getStoredCache(CACHE_KEY_COURSES);
  const now = Date.now();

  if (!force && cachedCourses && (now - cachedTime < CACHE_LIFETIME)) {
    state.courses = cachedCourses;
    if (state.role === "guest") state.mine = new Set(cachedCourses.map((r) => r.id));
    return true;
  }

  const isGuest = state.role === "guest";
  let c = await sb.from("courses").select("id,name,sort_order,is_active,drive_url,assignment_drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name");
  if (c.error && (c.error.code === "42703" || (c.error.message && c.error.message.includes("assignment_drive_url")))) {
    c = await sb.from("courses").select("id,name,sort_order,is_active,drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name");
  }
  if (c.error || !c.data) { say("تعذّر تحميل المواد", true); return false; }

  setStoredCache(CACHE_KEY_COURSES, c.data);
  localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));
  state.courses = c.data;

  if (isGuest) {
    try {
      const storedAnon = localStorage.getItem("anon_mine_courses");
      if (storedAnon) {
        state.mine = new Set(JSON.parse(storedAnon));
        return true;
      }
    } catch (err) {}
    state.mine = new Set(c.data.map((r) => r.id));
    return true;
  }

  const u = await sb.from("user_courses").select("course_id");
  state.mine = new Set(((u && u.data) || []).map((r) => r.course_id));
  return true;
}

async function fetchData(force = false) {
  const cachedTime = Number(localStorage.getItem(CACHE_KEY_TIME)) || 0;
  const cachedData = getStoredCache(CACHE_KEY_DATA);
  const now = Date.now();

  if (!force && cachedData && (now - cachedTime < CACHE_LIFETIME)) {
    state.sections = cachedData.sections;
    state.items = cachedData.items;
    state.personal = cachedData.personal || [];
    state.questions = cachedData.questions || [];
    state.answers = cachedData.answers || [];
    state.posts = cachedData.posts || [];
    state.progress = cachedData.progress || {};
    state.schedule = cachedData.schedule || [];
    return true;
  }

  const isGuest = state.role === "guest";
  const schedPromise = sb.from("schedule").select("id,day_of_week,course_id,title,time_slot,location,instructor,notes,sort_order").order("sort_order").order("id");

  const [s, i, p, pi, q, a, schedRes, postsRes] = await Promise.all([
    sb.from("sections").select("id,title,kind,sort_order,is_active").order("sort_order"),
    sb.from("items").select("id,section_id,course_id,title,body,url,deadline,deadline_has_time,created_at,deleted_at,attachment_kind,attachment_url,attachment_path,attachment_name,attachment_mime,attachment_size"),
    isGuest ? Promise.resolve({ data: [] }) : sb.from("progress").select("item_id,done,submitted"),
    isGuest ? Promise.resolve({ data: [] }) : sb.from("personal_items").select("id,title,body,deadline,done,created_at"),
    sb.rpc("get_questions"),
    sb.rpc("get_answers"),
    schedPromise,
    sb.from("posts").select("id,content,image_url,created_at,deleted_at").order("created_at", { ascending: false }).order("id", { ascending: false })
  ]);

  if (s.error || i.error || p.error || pi.error || q.error || a.error) {
    say("تعذّر تحميل البيانات", true);
    return false;
  }

  state.sections = s.data.filter((x) => x.is_active !== false || (x.kind === "custom" && isAdmin()));
  state.items = i.data;
  state.personal = pi.data || [];
  state.questions = q.data || [];
  state.answers = a.data || [];
  state.schedule = (schedRes && schedRes.data) || [];
  state.posts = (postsRes && postsRes.data) || [];

  state.progress = {};
  (p.data || []).forEach((r) => { state.progress[r.item_id] = r; });

  state.qaNames = {};
  if (isAdmin()) {
    const ids = Array.from(new Set([
      ...state.questions.map((x) => x.asker_id),
      ...state.answers.map((x) => x.author_id),
    ]));
    if (ids.length) {
      const np = await sb.from("profiles").select("id,first_name,username").in("id", ids);
      if (!np.error) {
        np.data.forEach((x) => { state.qaNames[x.id] = x.first_name || (x.username ? "@" + x.username : "مستخدم"); });
      }
    }
  }

  if (state.active !== "__posts__" && state.active !== "__sections_admin__" && !state.sections.find((x) => x.id === state.active)) {
    state.active = null;
  }

  const requestedPostId = getPostIdFromLocation();
  if (requestedPostId != null && state.posts.some((x) => String(x.id) === String(requestedPostId))) {
    state.active = "__posts__";
    state.postFocus = requestedPostId;
    state.deepLinkPending = true;
  }

  setStoredCache(CACHE_KEY_DATA, {
    sections: state.sections,
    items: state.items,
    personal: state.personal,
    questions: state.questions,
    answers: state.answers,
    posts: state.posts,
    progress: state.progress,
    schedule: state.schedule
  });
  localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));

  return true;
}

async function loadData() {
  if (await fetchData()) render();
}

export { loadCourses, fetchData, loadData, invalidateCache };
