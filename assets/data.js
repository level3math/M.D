import { sb, say } from "./core.js";
import { state, isAdmin, render } from "./state.js";
import { getPostIdFromLocation } from "./ui.js";

async function loadCourses() {
  const [c, u] = await Promise.all([
    sb.from("courses").select("id,name,sort_order,is_active,drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name"),
    sb.from("user_courses").select("course_id"),
  ]);
  if (c.error || u.error) { say("تعذّر تحميل المواد", true); return false; }
  state.courses = c.data;
  state.mine = new Set(u.data.map((r) => r.course_id));
  return true;
}
async function fetchData() {
  const [s, i, p, pi, q, a] = await Promise.all([
    sb.from("sections").select("id,title,kind,sort_order,is_active").order("sort_order"),
    sb.from("items").select("id,section_id,course_id,title,body,url,deadline,deadline_has_time,created_at,deleted_at,attachment_kind,attachment_url,attachment_path,attachment_name,attachment_mime,attachment_size"),
    sb.from("progress").select("item_id,done,submitted"),
    sb.from("personal_items").select("id,title,body,deadline,done,created_at"),
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
  return true;
}
async function loadData() {
  if (await fetchData()) render();
}

export { loadCourses, fetchData, loadData };
