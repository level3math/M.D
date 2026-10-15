import { el } from "./core.js";

function check(text, val, onChange) {
  const l = el("label", "chk");
  const i = document.createElement("input");
  i.type = "checkbox";
  i.checked = val;
  i.addEventListener("change", () => onChange(i.checked));
  l.appendChild(i);
  l.appendChild(document.createTextNode(text));
  return l;
}
function field(text, node) {
  const w = el("div", "field");
  w.appendChild(el("label", "", text));
  w.appendChild(node);
  return w;
}

function getPostIdFromLocation() {
  const m = location.pathname.match(/\/posts\/(\d+)\/?$/);
  if (m) return Number(m[1]);
  try {
    const q = new URLSearchParams(location.search);
    const id = q.get("post");
    return id && /^\d+$/.test(id) ? Number(id) : null;
  } catch (e) {
    return null;
  }
}

export { check, field, getPostIdFromLocation };
