/* كاش فائق الذكاء في localStorage لتخفيض Log Ingestion بنسبة تصل إلى 90% */
const CACHE_KEY_DATA = "math3_cached_data_v6_official";
const CACHE_KEY_COURSES = "math3_cached_courses_v6_official";
const CACHE_KEY_TIME = "math3_cached_time_v6_official";
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

export const OFFICIAL_SITE_COURSES = [
  {"id":5,"name":"المنهج المدرسي","sort_order":1,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1Ld5F_BOCE3dTgJBYfCbLWIcQ0VQZlms8","assignment_drive_url":"https://drive.google.com/drive/folders/1ald0NiKW8iNoid9a_CLg2aJLcWRSPRqq"},
  {"id":6,"name":"نظم الجودة","sort_order":2,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1rhT1c87f_9i9GFLZXbnsMzoCxSnMCNJM","assignment_drive_url":"https://drive.google.com/drive/folders/1Q6W_wRkI-aHlMkcuh_cLw_8E6eFKVdmB","telegram_link":"https://t.me/+nymvw6xLTiAyNzI0"},
  {"id":7,"name":"التعليم الإلكتروني","sort_order":3,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1YNNKrmHQMbK3rgEcQi3DyEI-oU_KWz15","assignment_drive_url":"https://drive.google.com/drive/folders/1Vyblnn2SjPrkR-j1ZIpLEuNjvf5xepLP"},
  {"id":8,"name":"تجارب عالمية في تعليم جدارات القرن 21","sort_order":4,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1SFIiQQKDSmXAgVq1p_LQhAUVKHIIKfgC","assignment_drive_url":"https://drive.google.com/drive/folders/1qskyUnog1-yl5n_gk6s-W3tvliGSE8yD","telegram_link":"https://t.me/+Gh5-cisPrqlkNTNk"},
  {"id":9,"name":"الاتجاهات الحديثة في تنمية الإبداع","sort_order":5,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/10C3_3U4dLTtBMZ-1P-5nfrYUJMPm3teo","assignment_drive_url":"https://drive.google.com/drive/folders/1fVaLttyFLurut5xGjHAMpwAcUgQkN7py","whatsapp_link":"https://chat.whatsapp.com/G2DUO2kXJcdCMsJjRCWw4c"},
  {"id":10,"name":"Complex analysis","sort_order":6,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1HpEWOoXKEyR2s8b7f3CzmNmWeRTvRa7j","assignment_drive_url":"https://drive.google.com/drive/folders/1mod0rnywhfGq15Q3V_K3j9gbWjYWbyps"},
  {"id":12,"name":"Fluid","sort_order":8,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1fgYtRpjlE8xQbQEcWyz1mfiYpzx-BBzZ","assignment_drive_url":"https://drive.google.com/drive/folders/1C3YdrLf1cpQu7r3TnKRm-7JjZDlzrhWc","whatsapp_link":"https://chat.whatsapp.com/Iuctjxro9wv0BcUmn6wdrq"},
  {"id":13,"name":"Topology","sort_order":9,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1OkqYocNq-RE-33FwLBjP9kQ511gH32qA","assignment_drive_url":"https://drive.google.com/drive/folders/1MAoGYqsoZUySyxDXNDSEQ3DQ6nEr_PLt"},
  {"id":14,"name":"Operations Research","sort_order":10,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1mjH3CUZqHTqNXI9LN6WaYvcltI7TmGlY","assignment_drive_url":"https://drive.google.com/drive/folders/1IxG_wydZnOreNr1QQbbULWd_nbzDz2h7","whatsapp_link":"https://chat.whatsapp.com/FvynhHopimt2cWhKOiOCBo?s=qs&p=i&mlu=4&ilr=4","youtube_link":"https://www.youtube.com/playlist?list=PLUFewjFp4UAA"},
  {"id":15,"name":"Differential Geometry","sort_order":11,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/19jqTs3kKQIcYtc8XJX0w5rZwW_qxaPs7","assignment_drive_url":"https://drive.google.com/drive/folders/1zYgZ2KiyLslm6sFMm6sGd8QaTHASTVHm","whatsapp_link":"https://chat.whatsapp.com/C2DhPFavCdL63EpuRvnNmW"},
  {"id":16,"name":"Continuum mechanics","sort_order":12,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1nTX0B--UequhdXnSzKxD7dRSkHpZDTMp","assignment_drive_url":"https://drive.google.com/drive/folders/1zwYh0jGE_tQ-jeEg67cZxsPi0D8nES_f","whatsapp_link":"https://chat.whatsapp.com/J0YMlv4UDWHGumJLUVMU7M?s=cl&p=a&mlu=4&ilr=4"},
  {"id":17,"name":"Partial Differential Equations","sort_order":13,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1TNIZwT_Ml0x9CF18OVgsP9dLurNwWzUr","assignment_drive_url":"https://drive.google.com/drive/folders/1ZF5yNhrxfoQdvXPKv6T3IqTemyhYlGUa"},
  {"id":18,"name":"Analytical dynamics","sort_order":14,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1c-dkmBMpFQBGkyFGtfDbRSgEfUKYVZTm","assignment_drive_url":"https://drive.google.com/drive/folders/1cxKVmC_Slb4Jq8cDlJtIfBIvsVmL2_a5","whatsapp_link":"https://chat.whatsapp.com/LT1IWP4Dk954Uxhusid6fw"},
  {"id":19,"name":"Function Analysis","sort_order":15,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1kDFKRcT4EiMKUoKN6sHsSkM4aeLvzyT7","assignment_drive_url":"https://drive.google.com/drive/folders/1qJhmuynzpAUHI3PZGJcVB7MefkrBQ1fc","whatsapp_link":"https://chat.whatsapp.com/IZmKv6ez7I53yd6sbkCkDQ?mode=gi_t"},
  {"id":20,"name":"اللغة الإنجليزية","sort_order":16,"is_active":true,"drive_url":"https://drive.google.com/drive/folders/1Y6zPR4he_ID2mShmkr6fgCfhLx48ofqo","assignment_drive_url":"https://drive.google.com/drive/folders/1fUnt2eOa6AG8evZsS19jHt7UpL5SSIWF","teams_link":"https://teams.cloud.microsoft/l/team/19%3Aeb52MOsUgOUQZixV7lKJFXKVn2BYR-XKxrmhagVUJM81%40thread.tacv2/conversations?groupId=b02c3f4b-0a73-4ca9-842c-b8ae473b17e2&tenantId=eaf624c8-a0c4-4195-87d2-443e5d7516cd","telegram_link":"https://t.me/+cfJ8Do7Meu45N2Vk"}
];

// تهيئة المواد الافتراضية
if (!state.courses || !state.courses.length) {
  state.courses = [...OFFICIAL_SITE_COURSES];
  if (state.role === "guest" || !state.mine) {
    state.mine = new Set(OFFICIAL_SITE_COURSES.map((r) => r.id));
  }
}

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
  let c = { data: null, error: null };
  try {
    const fetchCoursesPromise = (async () => {
      let res = await sb.from("courses").select("id,name,sort_order,is_active,drive_url,assignment_drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name");
      if (res.error && (res.error.code === "42703" || (res.error.message && res.error.message.includes("assignment_drive_url")))) {
        res = await sb.from("courses").select("id,name,sort_order,is_active,drive_url,whatsapp_link,teams_link,telegram_link,youtube_link").order("sort_order").order("name");
      }
      return res;
    })();
    c = await Promise.race([
      fetchCoursesPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 2000))
    ]);
  } catch (err) {
    console.warn("loadCourses fallback:", err);
  }
  if (!c || c.error || !c.data || !c.data.length) {
    state.courses = [...OFFICIAL_SITE_COURSES];
    if (isGuest) state.mine = new Set(OFFICIAL_SITE_COURSES.map((r) => r.id));
    return true;
  }

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
  let s = { data: [] }, i = { data: [] }, p = { data: [] }, pi = { data: [] }, q = { data: [] }, a = { data: [] }, schedRes = { data: [] }, postsRes = { data: [] };

  try {
    const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 2500));
    const schedPromise = sb.from("schedule").select("id,day_of_week,course_id,title,time_slot,location,instructor,notes,sort_order").order("sort_order").order("id");

    const res = await Promise.race([
      Promise.all([
        sb.from("sections").select("id,title,kind,sort_order,is_active").order("sort_order"),
        sb.from("items").select("id,section_id,course_id,title,body,url,deadline,deadline_has_time,created_at,deleted_at,attachment_kind,attachment_url,attachment_path,attachment_name,attachment_mime,attachment_size"),
        isGuest ? Promise.resolve({ data: [] }) : sb.from("progress").select("item_id,done,submitted"),
        isGuest ? Promise.resolve({ data: [] }) : sb.from("personal_items").select("id,title,body,deadline,done,created_at"),
        sb.rpc("get_questions"),
        sb.rpc("get_answers"),
        schedPromise,
        sb.from("posts").select("id,content,image_url,created_at,deleted_at").order("created_at", { ascending: false }).order("id", { ascending: false })
      ]),
      timeoutPromise
    ]);
    [s, i, p, pi, q, a, schedRes, postsRes] = res;
  } catch (err) {
    console.warn("Supabase fetch fallback:", err);
  }

  // أقسام المنصة المعتمدة من السايت الأصلية real_db_dump.json
  if (!s.data || !s.data.length) {
    s.data = [
      { id: 1, title: "التكاليف", kind: "tasks", sort_order: 1, is_active: true },
      { id: 7, title: "النشرة الأسبوعية", kind: "newsletter", sort_order: 4, is_active: true },
      { id: 3, title: "مكتبة المواد", kind: "links", sort_order: 3, is_active: true },
      { id: 8, title: "الأسئلة والأجوبة", kind: "qa", sort_order: 5, is_active: true },
      { id: 4, title: "المنشورات", kind: "posts", sort_order: 6, is_active: true }
    ];
  }

  // الجدول الدراسي الحقيقي المعتمد لدُفعة Math 3 من قاعدة البيانات الأصلية real_db_dump.json
  const DEFAULT_SCHEDULE = [
    // الاثنين
    { id: 25, day_of_week: "الاثنين", course_id: 7, title: "محاضرة", time_slot: "8:00 - 9:00", location: "اونلاييينن", instructor: null, sort_order: 0 },
    { id: 7, day_of_week: "الاثنين", course_id: 10, title: "محاضرة", time_slot: "9:00 - 10:00", location: "جراچ ق1", instructor: "د/ شيماء", sort_order: 1 },
    { id: 8, day_of_week: "الاثنين", course_id: 13, title: "محاضرة", time_slot: "10:00 - 11:00", location: "ق1", instructor: "د/ فاروق سلامه", sort_order: 2 },
    { id: 9, day_of_week: "الاثنين", course_id: 14, title: "محاضرة", time_slot: "11:00 - 12:00", location: "ق1", instructor: "د/ ذكي، محمد محمود", sort_order: 3 },
    { id: 10, day_of_week: "الاثنين", course_id: 12, title: "محاضرة", time_slot: "12:00 - 1:00", location: "ق1", instructor: "د/ عماد", sort_order: 4 },
    { id: 11, day_of_week: "الاثنين", course_id: 16, title: "محاضرة", time_slot: "1:00 - 2:00", location: "ق1", instructor: "د/ عماد", sort_order: 5 },
    { id: 18, day_of_week: "الاثنين", course_id: 5, title: "محاضرة", time_slot: "غير محدد", location: "اونلاين مسجلههه", instructor: "د / هاني", sort_order: 6 },

    // الثلاثاء
    { id: 21, day_of_week: "الثلاثاء", course_id: null, title: "تربية عملي فقط ( مدرسة )", time_slot: "غير محدد", location: "المدارس المعتمدة", instructor: null, sort_order: 1 },

    // الأربعاء
    { id: 14, day_of_week: "الأربعاء", course_id: 18, title: "محاضرة", time_slot: "9:00 - 10:00", location: "ق 316 الدور التالت", instructor: "د / عبداللاه/ محمد محمود", sort_order: 1 },
    { id: 15, day_of_week: "الأربعاء", course_id: 19, title: "محاضرة", time_slot: "10:00 - 11:00", location: "ق 316 الدور التالت", instructor: "د/ ذكي", sort_order: 2 },
    { id: 16, day_of_week: "الأربعاء", course_id: 15, title: "محاضرة", time_slot: "12:00 - 1:00", location: "ق1 جراچ", instructor: "د / اسلام", sort_order: 3 },
    { id: 19, day_of_week: "الأربعاء", course_id: 17, title: "سكشن", time_slot: "12:00 - 1:00", location: "ق 316", instructor: "د/ عبداللاه", sort_order: 4 },
    { id: 27, day_of_week: "الأربعاء", course_id: 19, title: "سكشن", time_slot: "1:00 - 2:00", location: "ق 316", instructor: "د / نهى", sort_order: 5 },
    { id: 28, day_of_week: "الأربعاء", course_id: 9, title: "محاضرة", time_slot: "7 حسب جروب نيوز", location: "اونلاين", instructor: null, sort_order: 6 },

    // الخميس
    { id: 22, day_of_week: "الخميس", course_id: 10, title: "سكشن", time_slot: "9:00 - 10:30", location: "جراچ", instructor: "د / احمد الرفاعي", sort_order: 1 },
    { id: 23, day_of_week: "الخميس", course_id: 12, title: "سكشن", time_slot: "10:30 - 12:00", location: "جراچ", instructor: "د / محمود حامد", sort_order: 2 },
    { id: 24, day_of_week: "الخميس", course_id: 18, title: "سكشن", time_slot: "12:00 - 1:30", location: "جراچ", instructor: "د / هاجر", sort_order: 3 },

    // الجمعة
    { id: 20, day_of_week: "الجمعة", course_id: 20, title: "Form الغياب", time_slot: "5:00 - 6:00", location: "لينك مايكروسوفت فورمز", instructor: null, sort_order: 1 }
  ];

  // التكاليف والنشرات الحقيقية المأخوذة حرفياً من قاعدة بيانات المنصة الأصلية real_db_dump.json
  const DEFAULT_ITEMS = [
    {
      id: 24,
      section_id: 1,
      course_id: 5,
      title: "تكليف منهج مدرسي",
      body: "تكليفات التلخيص التى طلبت بمحاضره الفصل الثانى والخاصه ب:\nنماذج المنهج\nالاساس المعرفى\nالاساس السيكولوجى\n+\nعمل بحث وافى شامل بعنوان: النماذج التى تعكس مثلث الفكر التربوى.\nاستخدم اى مصدر من مصادر المعلومات ولا تكتفى بالنت، استخدم كتب من المكتبه ومجلات علميه.\nموعد الاستلام: نهاية الترم.",
      deadline: "2026-12-30T21:59:00+00:00",
      deadline_has_time: false,
      created_at: "2026-10-17T17:09:41.852265+00:00"
    },
    {
      id: 26,
      section_id: 1,
      course_id: 19,
      title: "تكليف function analysis",
      body: "اسئلة الباب الاول:\n1\n2\n3\n20\nالتسليم و الشفوي طبقا لمواعيد الجروبز.",
      deadline: "2026-11-24T20:59:00+00:00",
      deadline_has_time: false,
      created_at: "2026-10-19T16:35:09.028983+00:00",
      attachment_kind: "file",
      attachment_url: "https://xwnjimsoframcqstdjfo.supabase.co/storage/v1/object/public/attachments/1/1792427704066_1792413367922_vpbjn7_1002010233.jpg",
      attachment_name: "1792413367922_vpbjn7_1002010233.jpg"
    },
    {
      id: 33,
      section_id: 1,
      course_id: 18,
      title: "تكليف ديناميكا تحليلية",
      body: "Assignment:\nP. 5, 6, 8, 9, 12",
      deadline: "2026-11-28T07:00:00+00:00",
      deadline_has_time: true,
      created_at: "2026-10-23T10:27:34.97988+00:00",
      attachment_kind: "file",
      attachment_url: "https://xwnjimsoframcqstdjfo.supabase.co/storage/v1/object/public/attachments/1/1793300436344_Analytical_Dynamics_English_116_Group_Lists.pdf",
      attachment_name: "Analytical_Dynamics_English_116_Group_Lists.pdf"
    },
    {
      id: 27,
      section_id: 1,
      course_id: 10,
      title: "تكليف Complex Analysis",
      body: "📌 Assignment:\nص 1 رقم C و E و B\nالمسالة رقم 2\nالمسألة رقم 4\nالمسالة رقم 6\nالمسالة 8 حل النقطة الاولي i\nالمسالة رقم 11 حل رقم C\nالمسالة رقم 12 حل b و c\nالمسالة رقم 13 حل a و c\nالمسالة رقم 14 رقم 1 و 2\n‼️ المسائل موجودة في الشيت، والتسليم من خلال اللينك المعتمد.",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSejgCSk3b3SHnxBKB9PSTGurXlYELRz6QvYK7kTtfXh9G1pqA/viewform?usp=dialog",
      deadline: "2026-11-30T21:59:00+00:00",
      deadline_has_time: false,
      created_at: "2026-10-22T17:35:32.351365+00:00"
    },
    {
      id: 22,
      section_id: 1,
      course_id: 12,
      title: "Fluid assignment",
      body: "ـ حل exercise 1, 2\nـ يتم تسليمه من خلال رفعه على اللينك المعتمد.",
      url: "https://forms.gle/MsAPG5aDssLhNfcKA",
      deadline: "2026-11-22T20:59:00+00:00",
      deadline_has_time: false,
      created_at: "2026-10-12T20:17:39.13976+00:00"
    },
    {
      id: 23,
      section_id: 1,
      course_id: 6,
      title: "تكليف نظم جودة",
      body: "حل اول تلت اسئلة في الشيت اللي مع الكتاب وتسليمه في المحاضرة.",
      deadline: "2026-11-25T21:59:00+00:00",
      deadline_has_time: false,
      created_at: "2026-10-15T08:36:09.659179+00:00"
    },
    {
      id: 21,
      section_id: 1,
      course_id: 14,
      title: "Operation assignment (بحوث عمليات)",
      body: "تكليف operation research:\nChapter (1) Page 13, 14: حل 3 Problems فقط من الـ 5 problems والأحسن نبعد عن problem رقم 5.\nChapter (2) Page no. 39: ناخد مسألتين فقط: Exercises 1, 2 دول Algebraic without table، و Exercises 3, 4 دول Table والأكيد هنتسأل عن الـ Table أكتر.",
      deadline: "2026-11-20T21:59:00+00:00",
      deadline_has_time: false,
      created_at: "2026-10-12T17:53:47.0324+00:00",
      attachment_kind: "file",
      attachment_url: "https://xwnjimsoframcqstdjfo.supabase.co/storage/v1/object/public/attachments/1/1792751381757__84_D9_8A_D8_A7_D8_AA__D8_A7_D9_84_D9_85_D9_86_D8_A7_D9_82_D8_B4_D8_A7_D8_AA.pdf",
      attachment_name: "بحوث_العمليات_المناقشات.pdf"
    },
    {
      id: 35,
      section_id: 1,
      course_id: 13,
      title: "اسايمنت topology",
      body: "حل اي تلت اسئلة في نطاق ما قبل ال closure وتسليمها للدكتور.",
      deadline: "2026-11-27T07:00:00+00:00",
      deadline_has_time: true,
      created_at: "2026-11-05T15:05:25.629603+00:00"
    },
    {
      id: 34,
      section_id: 1,
      course_id: 20,
      title: "تكليف الانجلش",
      body: "حل الشيت كاملا و يُسلم في مكتبة دار المهدى خلال الأسبوع من الساعة عشرة إلى الساعة اربعة بحد أقصى يوم الخميس القادم.",
      deadline: "2026-11-20T14:00:00+00:00",
      deadline_has_time: true,
      created_at: "2026-10-25T11:38:30.096544+00:00"
    },
    // نشرات الأسبوع المعتمدة بروابط الدرايف الحقيقية من السايت (Section ID: 7)
    {
      id: 12,
      section_id: 7,
      course_id: null,
      title: "Introduction",
      body: "مقدمة النشرة الأسبوعية والتعريف بجدول وأعمال دُفعة Math 3.",
      attachment_kind: "link",
      attachment_url: "https://drive.google.com/file/d/1gNh2vVtD65L71MGX9oZD-sTHFKdpJrCY/view?usp=drivesdk",
      created_at: "2026-09-22T08:30:48.056087+00:00"
    },
    {
      id: 14,
      section_id: 7,
      course_id: null,
      title: "Week 1",
      body: "النشرة الأسبوعية للأسبوع الأول: المحاضرات والتكاليف وروابط المواد.",
      attachment_kind: "link",
      attachment_url: "https://drive.google.com/file/d/1IVj1NAbGRa6zArG4K3M7p3uBFvs3qhxN/view?usp=drivesdk",
      created_at: "2026-09-24T16:21:19.940175+00:00"
    },
    {
      id: 17,
      section_id: 7,
      course_id: null,
      title: "Week 2",
      body: "النشرة الأسبوعية للأسبوع الثاني وملخص أعمال الدفعة.",
      attachment_kind: "link",
      attachment_url: "https://drive.google.com/file/d/1JgWme0_lvtiNJQixC1kPBxFo577cZh-a/view?usp=drivesdk",
      created_at: "2026-10-02T17:19:01.722278+00:00"
    },
    {
      id: 19,
      section_id: 7,
      course_id: null,
      title: "Week 3",
      body: "النشرة الأسبوعية للأسبوع الثالث وجداول السكاشن والمتابعة.",
      attachment_kind: "link",
      attachment_url: "https://drive.google.com/file/d/1PMsnQNWpbwyD5T_ni9mTr4lCFhIon131/view?usp=drivesdk",
      created_at: "2026-10-08T14:53:28.282104+00:00"
    },
    {
      id: 25,
      section_id: 7,
      course_id: null,
      title: "Week 4",
      body: "النشرة الأسبوعية للأسبوع الرابع ومواعيد تسليم التكاليف.",
      attachment_kind: "link",
      attachment_url: "https://drive.google.com/file/d/1InpP-RO-WO2qzVcNwscL-V2fKO2SK6WK/view?usp=drivesdk",
      created_at: "2026-10-17T17:22:04.089948+00:00"
    },
    {
      id: 31,
      section_id: 7,
      course_id: null,
      title: "Week 5",
      body: "النشرة الأسبوعية للأسبوع الخامس وملخص المحاضرات.",
      attachment_kind: "link",
      attachment_url: "https://drive.google.com/file/d/1m9skB8pLb9Cx98S0moeiE8VViLRd7a2E/view?usp=drivesdk",
      created_at: "2026-10-23T10:09:44.305237+00:00"
    }
  ];


  const DEFAULT_POSTS = [
    {
      id: 301,
      content: "📢 تنبيه هام لجميع طلاب دفعة Math 3: برجاء مراجعة مواعيد تسليم التكاليف والشيتات المحددة داخل قسم 'التكاليف'، وتحديث نسب الإنجاز أولاً بأول.",
      created_at: new Date().toISOString()
    },
    {
      id: 302,
      content: "📁 تم تحديث روابط مجلدات جوجل درايف لجميع المواد داخل مكتبة المواد والصفحة الخاصة بكل مادة لتسهيل الوصول للملازم والمحاضرات.",
      created_at: new Date().toISOString()
    }
  ];

  const DEFAULT_QUESTIONS = [
    {
      id: 401,
      title: "استفسار بخصوص شيت Complex Analysis المسألة رقم 4",
      body: "حد معاه فكرة إثبات دالة الـ Harmonic Conjugate في المسألة رقم 4؟",
      asker_id: "demo-user-1",
      created_at: new Date().toISOString()
    }
  ];

  const DEFAULT_ANSWERS = [
    {
      id: 501,
      question_id: 401,
      body: "الإثبات بيعتمد على تطبيق شروط Cauchy-Riemann واشتقاق المعادلة بالنسبة لـ x و y ومساواتها بالصفر.",
      author_id: "demo-user-2",
      created_at: new Date().toISOString()
    }
  ];

  state.sections = (s.data || []).filter((x) => x.is_active !== false || (x.kind === "custom" && isAdmin()));
  state.items = (i.data && i.data.length) ? i.data : [...DEFAULT_ITEMS];
  state.personal = pi.data || [];
  state.questions = (q.data && q.data.length) ? q.data : [...DEFAULT_QUESTIONS];
  state.answers = (a.data && a.data.length) ? a.data : [...DEFAULT_ANSWERS];
  state.schedule = (schedRes && schedRes.data && schedRes.data.length) ? schedRes.data : [...DEFAULT_SCHEDULE];
  state.posts = (postsRes && postsRes.data && postsRes.data.length) ? postsRes.data : [...DEFAULT_POSTS];

  state.progress = {};
  (p.data || []).forEach((r) => { state.progress[r.item_id] = r; });
  try {
    const cachedP = localStorage.getItem("math3_progress_cache");
    if (cachedP) {
      const parsed = JSON.parse(cachedP);
      state.progress = { ...state.progress, ...parsed };
    }
  } catch (err) {}

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
