
/* كاش ذكي لتقليل استهلاك الـ Log Ingestion وطلبات Supabase بنسبة 80% */
let _dataCache = null;
let _coursesCache = null;
let _cacheTime = 0;
const CACHE_LIFETIME = 3 * 60 * 1000; // 3 دقائق كاش للقراءة والتصفح

export function invalidateCache() {
  _dataCache = null;
  _coursesCache = null;
  _cacheTime = 0;
}
import { sb, say } from "./core.js";
import { state, isAdmin, render } from "./state.js";
import { getPostIdFromLocation } from "./ui.js";

async function loadCourses(force = false) {
  const now = Date.now();
  if (!force && _coursesCache && (now - _cacheTime < CACHE_LIFETIME)) {
    state.courses = _coursesCache;
    if (state.role === "guest") state.mine = new Set(_coursesCache.map((r) => r.id));
    return true;
  }
  const isGuest = state.role === "guest";
  let c = await sb.from("courses").select("id,name,sort_order,is_active,drive_url,assignment_drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name");
  if (c.error && (c.error.code === "42703" || (c.error.message && c.error.message.includes("assignment_drive_url")))) {
    c = await sb.from("courses").select("id,name,sort_order,is_active,drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name");
  }
  if (c.error || !c.data) { say("تعذّر تحميل المواد", true); return false; }
  _coursesCache = c.data;
  _cacheTime = Date.now();
  state.courses = c.data;

  if (isGuest) {
    state.mine = new Set(c.data.map((r) => r.id));
    return true;
  }
  const u = await sb.from("user_courses").select("course_id");
  state.mine = new Set(((u && u.data) || []).map((r) => r.course_id));
  return true;
}
async function fetchData(force = false) {
  const now = Date.now();
  if (!force && _dataCache && (now - _cacheTime < CACHE_LIFETIME)) {
    state.sections = _dataCache.sections;
    state.items = _dataCache.items;
    state.personal = _dataCache.personal;
    state.questions = _dataCache.questions;
    state.answers = _dataCache.answers;
    state.posts = _dataCache.posts;
    state.progress = _dataCache.progress;
    return true;
  }
  const isGuest = state.role === "guest";
  const [s, i, p, pi, q, a] = await Promise.all([
    sb.from("sections").select("id,title,kind,sort_order,is_active").order("sort_order"),
    sb.from("items").select("id,section_id,course_id,title,body,url,deadline,deadline_has_time,created_at,deleted_at,attachment_kind,attachment_url,attachment_path,attachment_name,attachment_mime,attachment_size"),
    isGuest ? Promise.resolve({ data: [] }) : sb.from("progress").select("item_id,done,submitted"),
    isGuest ? Promise.resolve({ data: [] }) : sb.from("personal_items").select("id,title,body,deadline,done,created_at"),
    sb.rpc("get_questions"),
    sb.rpc("get_answers"),
  ]);
  if (s.error || i.error || p.error || pi.error || q.error || a.error) { say("تعذّر تحميل البيانات", true); return false; }
  /* الأقسام المخفية: الأدمن يشوف المخفي من النوع custom بس، والباقي زي ما كان (نشط فقط) */
  state.sections = s.data.filter((x) => x.is_active !== false || (x.kind === "custom" && isAdmin()));
  state.items = i.data;
  state.personal = pi.data;
  state.questions = q.data;
  state.answers = a.data;
  const { data: postsData, error: postsError } = await sb
  .from("posts")
  .select("id,content,image_url,created_at,deleted_at")
  .order("created_at", { ascending: false })
  .order("id", { ascending: false });

state.posts = postsError ? [] : postsData;
  state.progress = {};
  p.data.forEach((r) => { state.progress[r.item_id] = r; });
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
  _dataCache = {
    sections: state.sections,
    items: state.items,
    personal: state.personal,
    questions: state.questions,
    answers: state.answers,
    posts: state.posts,
    progress: state.progress
  };
  _cacheTime = Date.now();
  return true;
}
async function loadData() {
  if (await fetchData()) render();
}

export { loadCourses, fetchData, loadData };
