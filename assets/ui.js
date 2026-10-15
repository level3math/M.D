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

export { check, field };
