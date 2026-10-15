const roleLabels = { student: "Student", admin: "Admin", full_admin: "Owner" };
const roleRank = { full_admin: 0, admin: 1, student: 2 };
function rpcMsg(error) {
  const m = (error && error.message) || "";
  if (m.includes("last_full_admin")) return "لا يمكن ذلك: هذا آخر أدمن كامل";
  if (m.includes("cannot_self")) return "لا يمكن تنفيذ ذلك على الحساب الشخصي";
  if (m.includes("not_allowed")) return "غير مسموح";
  return "تعذّر التنفيذ";
}
const state = { userId: null, role: null, sections: [], items: [], progress: {},
  personal: [], courses: [], mine: new Set(), chosen: false,
  people: [], peopleQuery: "", peopleLimit: 50,
  questions: [], answers: [], qaNames: {}, qform: null, answerForm: {},
posts: [], postForm: null, postFocus: null,
  active: null, filter: "all", trash: false, form: null, pform: null, logLimit: 100, botOk: null };
const isAdmin = () => state.role === "admin" || state.role === "full_admin";
const isFull = () => state.role === "full_admin";
const courseName = (id) => (state.courses.find((c) => c.id === id) || {}).name || "";

let _render = function () {};
function setRender(fn) { _render = fn; }
function render() { return _render.apply(null, arguments); }

export { roleLabels, roleRank, state, isAdmin, isFull, courseName, rpcMsg, render, setRender };
