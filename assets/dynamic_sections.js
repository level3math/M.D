import { broadcastNewItem } from "./notifications.js";
import { sb, say, el } from "./core.js";
import { state, courseName } from "./state.js";
import { field } from "./ui.js";

// أنواع الحقول المدعومة في محرر المحتوى الحر
export const FIELD_TYPES = [
  { type: "title",   name: "العنوان الرئيسي",        icon: "🏷️", desc: "نص بارز للعنوان" },
  { type: "text",    name: "شرح أو نص طويل",        icon: "📝", desc: "مساحة لكتابة نصوص وتفاصيل وملاحظات" },
  { type: "file",    name: "ملف أو PDF",            icon: "📄", desc: "ملف للتحميل أو المشاهدة" },
  { type: "image",   name: "صورة توضيحية",          icon: "🖼️", desc: "صورة مدمجة داخل الكارت" },
  { type: "video",   name: "فيديو أو يوتيوب",       icon: "🎬", desc: "رابط فيديو يوتيوب أو مصدر مرئي" },
  { type: "link",    name: "رابط خارجي أو درايف",    icon: "🔗", desc: "رابط لموقع، درايف، أو مصدر" },
  { type: "formula", name: "معادلة رياضية أو كود",  icon: "📐", desc: "معادلة بخط رياضي منسق أو كود" },
  { type: "date",    name: "تاريخ أو موعد",         icon: "📅", desc: "موعد أو تاريخ محدد" },
  { type: "course",  name: "المادة الدراسية",       icon: "📚", desc: "ربط المحتوى بمادة من المواد" }
];

// الحقول الافتراضية لأي قسم جديد
export const DEFAULT_FIELDS = [
  { id: "f_title", type: "title", label: "العنوان الرئيسي", required: true },
  { id: "f_text",  type: "text",  label: "الشرح والتفاصيل", required: false },
  { id: "f_file",  type: "file",  label: "ملف PDF / مرفق", required: false },
  { id: "f_link",  type: "link",  label: "رابط إضافي",     required: false }
];

// جلب حقول القسم من الكاش أو سوبابيز أو الافتراضي
export function getSectionFields(sec) {
  if (!sec) return [...DEFAULT_FIELDS];
  
  // 1. لو موجود في كائن القسم نفسه
  if (Array.isArray(sec.fields_config) && sec.fields_config.length) {
    return sec.fields_config;
  }

  // 2. فحص الـ localStorage
  try {
    const raw = localStorage.getItem("sec_schema_" + sec.id);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {}

  return [...DEFAULT_FIELDS];
}

// حفظ تركيبة حقول القسم
export async function saveSectionFields(sec, fields) {
  try {
    localStorage.setItem("sec_schema_" + sec.id, JSON.stringify(fields));
    sec.fields_config = fields;

    // 1. محاولة الحفظ المباشر في عمود fields_config بجدول sections
    const r1 = await sb.from("sections").update({ fields_config: fields }).eq("id", sec.id);
    
    // 2. الحفظ الاحتياطي في site_theme لضمان التزامن حتى لو لم يتم إضافة العمود
    await sb.from("site_theme").upsert({
      key: "sec_fields_" + sec.id,
      value: JSON.stringify(fields)
    });

    return true;
  } catch (err) {
    console.warn("Error saving section schema:", err);
    return false;
  }
}

// نافذة محرر تركيبة الحقول (Schema Builder) للأدمن
export function openSectionSchemaBuilder(sec, onSaveCallback) {
  const existing = document.getElementById("schema-builder-modal");
  if (existing) existing.remove();

  let fields = [...getSectionFields(sec)];

  const backdrop = el("div");
  backdrop.id = "schema-builder-modal";
  backdrop.style.position = "fixed";
  backdrop.style.inset = "0";
  backdrop.style.background = "rgba(0, 0, 0, 0.7)";
  backdrop.style.backdropFilter = "blur(5px)";
  backdrop.style.webkitBackdropFilter = "blur(5px)";
  backdrop.style.zIndex = "99999";
  backdrop.style.display = "flex";
  backdrop.style.alignItems = "center";
  backdrop.style.justifyContent = "center";
  backdrop.style.padding = "16px";
  backdrop.style.boxSizing = "border-box";

  const modal = el("div", "card");
  modal.style.maxWidth = "560px";
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
  head.style.marginBottom = "12px";

  const h3 = el("h3", "", "⚙️ تصميم حقول: " + sec.title);
  h3.style.margin = "0";
  head.appendChild(h3);

  const closeBtn = el("button", "small", "✕");
  closeBtn.addEventListener("click", () => backdrop.remove());
  head.appendChild(closeBtn);
  modal.appendChild(head);

  modal.appendChild(el("p", "meta", "حدّد الحقول التي تظهر عند إضافة محتوى في هذا القسم وترتيبها وطريقة ظهورها للطلاب."));

  // قائمة الحقول الحالية
  const fieldsContainer = el("div");
  fieldsContainer.style.display = "flex";
  fieldsContainer.style.flexDirection = "column";
  fieldsContainer.style.gap = "8px";
  fieldsContainer.style.margin = "14px 0";

  function renderFieldList() {
    fieldsContainer.replaceChildren();

    if (!fields.length) {
      fieldsContainer.appendChild(el("p", "meta center", "لا توجد حقول حتى الآن. أضف حقلاً من الأسفل."));
      return;
    }

    fields.forEach((f, idx) => {
      const typeDef = FIELD_TYPES.find((t) => t.type === f.type) || { icon: "📌", name: f.type };
      
      const itemRow = el("div", "card");
      itemRow.style.margin = "0";
      itemRow.style.padding = "10px 12px";
      itemRow.style.background = "var(--paper)";
      itemRow.style.border = "1px solid var(--line)";
      itemRow.style.borderRadius = "10px";
      itemRow.style.display = "flex";
      itemRow.style.justifyContent = "space-between";
      itemRow.style.alignItems = "center";
      itemRow.style.gap = "8px";

      const leftInfo = el("div");
      leftInfo.style.display = "flex";
      leftInfo.style.alignItems = "center";
      leftInfo.style.gap = "8px";

      const iconSpan = el("span", "", typeDef.icon);
      iconSpan.style.fontSize = "18px";
      leftInfo.appendChild(iconSpan);

      const textWrap = el("div");
      const nameEl = el("strong", "", f.label || typeDef.name);
      nameEl.style.fontSize = "13.5px";
      nameEl.style.display = "block";
      textWrap.appendChild(nameEl);

      const typeTag = el("span", "meta", typeDef.name + (f.required ? " (مطلوب)" : " (اختياري)"));
      typeTag.style.fontSize = "11.5px";
      textWrap.appendChild(typeTag);
      leftInfo.appendChild(textWrap);
      itemRow.appendChild(leftInfo);

      // أزرار التحكم: لأعلى ولأسفل وحذف
      const acts = el("div", "row");
      acts.style.gap = "4px";

      const upBtn = el("button", "small", "↑");
      upBtn.disabled = idx === 0;
      upBtn.title = "تحريك لأعلى";
      upBtn.addEventListener("click", () => {
        const tmp = fields[idx - 1];
        fields[idx - 1] = fields[idx];
        fields[idx] = tmp;
        renderFieldList();
      });
      acts.appendChild(upBtn);

      const downBtn = el("button", "small", "↓");
      downBtn.disabled = idx === fields.length - 1;
      downBtn.title = "تحريك لأسفل";
      downBtn.addEventListener("click", () => {
        const tmp = fields[idx + 1];
        fields[idx + 1] = fields[idx];
        fields[idx] = tmp;
        renderFieldList();
      });
      acts.appendChild(downBtn);

      const delBtn = el("button", "small danger", "🗑️");
      delBtn.title = "حذف الحقل";
      delBtn.addEventListener("click", () => {
        fields.splice(idx, 1);
        renderFieldList();
      });
      acts.appendChild(delBtn);

      itemRow.appendChild(acts);
      fieldsContainer.appendChild(itemRow);
    });
  }

  renderFieldList();
  modal.appendChild(fieldsContainer);

  // صندوق إضافة حقل جديد
  const addBox = el("div", "card");
  addBox.style.background = "var(--paper)";
  addBox.style.border = "1.5px dashed var(--accent)";
  addBox.style.padding = "12px 14px";
  addBox.style.borderRadius = "12px";
  addBox.style.marginTop = "14px";

  addBox.appendChild(el("h4", "", "➕ إضافة حقل جديد للقسم:"));

  const typeSelect = el("select");
  FIELD_TYPES.forEach((ft) => {
    const opt = el("option", "", ft.icon + " " + ft.name);
    opt.value = ft.type;
    typeSelect.appendChild(opt);
  });
  addBox.appendChild(field("نوع الحقل", typeSelect));

  const labelInput = el("input");
  labelInput.type = "text";
  labelInput.placeholder = "مثال: ملف الشرح، معادلة النظرية، رابط التسجيل...";
  addBox.appendChild(field("اسم الحقل (تسمية تظهر للمستخدم)", labelInput));

  const reqCheck = document.createElement("input");
  reqCheck.type = "checkbox";
  reqCheck.id = "schema-req-check";
  reqCheck.style.margin = "0 8px 0 0";
  const reqLabel = el("label");
  reqLabel.style.display = "flex";
  reqLabel.style.alignItems = "center";
  reqLabel.style.fontSize = "13px";
  reqLabel.style.cursor = "pointer";
  reqLabel.style.marginTop = "6px";
  reqLabel.appendChild(reqCheck);
  reqLabel.appendChild(document.createTextNode("حقل مطلوب (إجباري)"));
  addBox.appendChild(reqLabel);

  const addFieldBtn = el("button", "small btn-primary", "إضافة هذا الحقل ＋");
  addFieldBtn.style.marginTop = "10px";
  addFieldBtn.addEventListener("click", () => {
    const chosenType = typeSelect.value;
    const typeObj = FIELD_TYPES.find((t) => t.type === chosenType);
    const customLabel = labelInput.value.trim() || typeObj.name;
    const isRequired = reqCheck.checked;

    const newF = {
      id: "f_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      type: chosenType,
      label: customLabel,
      required: isRequired
    };

    fields.push(newF);
    labelInput.value = "";
    reqCheck.checked = false;
    renderFieldList();
  });
  addBox.appendChild(addFieldBtn);
  modal.appendChild(addBox);

  // أزرار الحفظ والإغلاق
  const footerRow = el("div", "row");
  footerRow.style.marginTop = "18px";
  footerRow.style.justifyContent = "flex-end";
  footerRow.style.gap = "8px";

  const saveBtn = el("button", "btn-primary", "حفظ تركيبة الحقول 💾");
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "جاري الحفظ...";
    const ok = await saveSectionFields(sec, fields);
    saveBtn.disabled = false;
    if (ok) {
      say("تم حفظ تركيبة حقول القسم بنجاح!");
      if (onSaveCallback) onSaveCallback(fields);
      backdrop.remove();
    } else {
      say("تعذّر الحفظ");
    }
  });
  footerRow.appendChild(saveBtn);

  const cancelBtn = el("button", "", "إلغاء");
  cancelBtn.addEventListener("click", () => backdrop.remove());
  footerRow.appendChild(cancelBtn);

  modal.appendChild(footerRow);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

// دالة فك تشفير محتوى الـ body المخصص
export function parseCustomBody(body) {
  if (!body) return null;
  if (typeof body === "object") return body;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {}
  return null;
}

// دالة توليد نموذج إدخال المحتوى الديناميكي للقسم المخصص
export function buildDynamicContentForm(sec, item, onSave, onCancel) {
  const fields = getSectionFields(sec);
  const isEdit = Boolean(item);
  const customData = isEdit ? (parseCustomBody(item.body) || {}) : {};

  const f = el("form", "card");
  f.appendChild(el("h3", "", isEdit ? "تعديل محتوى" : "إضافة محتوى جديد في: " + sec.title));

  const inputs = {};

  fields.forEach((fld) => {
    const val = customData[fld.id] || (fld.type === "title" && item ? item.title : "");

    if (fld.type === "title") {
      const inp = el("input");
      inp.type = "text";
      inp.value = val || "";
      inp.required = fld.required;
      inp.placeholder = fld.label;
      f.appendChild(field(fld.label, inp));
      inputs[fld.id] = () => inp.value.trim();
    } else if (fld.type === "text") {
      const ta = el("textarea");
      ta.rows = 4;
      ta.value = val || "";
      ta.placeholder = "اكتب " + fld.label + "...";
      f.appendChild(field(fld.label, ta));
      inputs[fld.id] = () => ta.value.trim();
    } else if (fld.type === "link" || fld.type === "video") {
      const inp = el("input");
      inp.type = "url";
      inp.value = val || "";
      inp.placeholder = "https://...";
      f.appendChild(field(fld.label, inp));
      inputs[fld.id] = () => inp.value.trim();
    } else if (fld.type === "formula") {
      const ta = el("textarea");
      ta.rows = 2;
      ta.value = val || "";
      ta.style.fontFamily = "monospace";
      ta.placeholder = "مثال: f(x) = ∫ x^2 dx أو صيغة رياضية...";
      f.appendChild(field(fld.label, ta));
      inputs[fld.id] = () => ta.value.trim();
    } else if (fld.type === "date") {
      const inp = el("input");
      inp.type = "datetime-local";
      inp.value = val ? val.slice(0, 16) : "";
      f.appendChild(field(fld.label, inp));
      inputs[fld.id] = () => inp.value;
    } else if (fld.type === "course") {
      const sel = el("select");
      sel.appendChild(el("option", "", "— بدون تحديد مادة —"));
      (state.courses || []).forEach((c) => {
        const opt = el("option", "", c.name);
        opt.value = c.id;
        if (String(c.id) === String(val || (item && item.course_id))) opt.selected = true;
        sel.appendChild(opt);
      });
      f.appendChild(field(fld.label, sel));
      inputs[fld.id] = () => (sel.value && sel.value !== "— بدون تحديد مادة —" ? Number(sel.value) : null);
    } else if (fld.type === "file" || fld.type === "image") {
      const wrap = el("div");
      const urlInp = el("input");
      urlInp.type = "url";
      urlInp.value = (typeof val === "object" ? val.url : val) || (fld.type === "file" && item ? item.attachment_url : "") || "";
      urlInp.placeholder = "رابط " + fld.label + " المباشر (أو ارفع ملف)...";
      wrap.appendChild(urlInp);

      const fileInp = el("input");
      fileInp.type = "file";
      fileInp.style.marginTop = "6px";
      fileInp.style.fontSize = "12px";
      if (fld.type === "image") fileInp.accept = "image/*";
      wrap.appendChild(fileInp);

      f.appendChild(field(fld.label, wrap));

      inputs[fld.id] = async () => {
        if (fileInp.files && fileInp.files[0]) {
          const fl = fileInp.files[0];
          const ext = fl.name.split(".").pop();
          const path = "custom/" + Date.now() + "_" + Math.random().toString(36).slice(2, 6) + "." + ext;
          const upRes = await sb.storage.from("attachments").upload(path, fl, { upsert: true });
          if (!upRes.error) {
            const { data: pub } = sb.storage.from("attachments").getPublicUrl(path);
            return {
              url: pub.publicUrl,
              name: fl.name,
              size: (fl.size / 1024 / 1024).toFixed(1) + " MB"
            };
          }
        }
        const u = urlInp.value.trim();
        return u ? { url: u, name: fld.label } : null;
      };
    }
  });

  const acts = el("div", "row");
  acts.style.marginTop = "14px";

  const saveBtn = el("button", "btn-primary", isEdit ? "تحديث المحتوى" : "نشر المحتوى");
  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.textContent = "جاري الحفظ...";

    try {
      const payloadData = { _custom: true };
      let primaryTitle = "";
      let primaryCourseId = null;
      let primaryAttachmentUrl = null;
      let primaryAttachmentKind = null;

      for (const fld of fields) {
        if (inputs[fld.id]) {
          const res = await inputs[fld.id]();
          payloadData[fld.id] = res;

          if (fld.type === "title" && res) primaryTitle = res;
          if (fld.type === "course" && res) primaryCourseId = res;
          if ((fld.type === "file" || fld.type === "image") && res && res.url) {
            primaryAttachmentUrl = res.url;
            primaryAttachmentKind = fld.type === "image" ? "file" : "link";
          }
        }
      }

      if (!primaryTitle) {
        // لو لم يحدد عنوان، نستخدم أول نص متاح أو اسم افتراضي
        primaryTitle = sec.title + " - محتوى جديد";
      }

      const itemPayload = {
        section_id: sec.id,
        course_id: primaryCourseId,
        title: primaryTitle,
        body: JSON.stringify(payloadData),
        attachment_url: primaryAttachmentUrl,
        attachment_kind: primaryAttachmentKind
      };

      let error = null;
      if (isEdit) {
        const res = await sb.from("items").update(itemPayload).eq("id", item.id);
        error = res.error;
      } else {
        const res = await sb.from("items").insert([itemPayload]);
        error = res.error;
      }

      if (error) {
        say("تعذّر الحفظ: " + error.message);
      } else {
        say(isEdit ? "تم تحديث المحتوى بنجاح!" : "تمت إضافة المحتوى بنجاح!");
        if (!isEdit) broadcastNewItem(primaryTitle, primaryCourseId);
        if (onSave) onSave();
      }
    } catch (err) {
      say("خطأ أثناء الحفظ: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? "تحديث المحتوى" : "نشر المحتوى";
    }
  });
  acts.appendChild(saveBtn);

  const cancelBtn = el("button", "", "إلغاء");
  cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (onCancel) onCancel();
  });
  acts.appendChild(cancelBtn);

  f.appendChild(acts);
  return f;
}

// دالة عرض الكارت الديناميكي للطلاب والمتصفحين
export function renderDynamicCard(sec, item, isAdminUser, onEdit, onDelete) {
  const fields = getSectionFields(sec);
  const customData = parseCustomBody(item.body);

  // لو العنصر قديم عادي مش مبني بالمحرر الجديد، يتم إرجاع كارت قياسي
  if (!customData || !customData._custom) {
    return null; // سيتم استخدام الكارت القديم كـ Fallback
  }

  const c = el("div", "card dynamic-content-card");
  c.style.position = "relative";
  c.style.padding = "16px";
  c.style.border = "1.5px solid var(--line)";
  c.style.borderRadius = "14px";
  c.style.background = "var(--card)";
  c.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";

  // شريط الرأس: العنوان والمادة الدراسية
  const headRow = el("div", "row");
  headRow.style.justifyContent = "space-between";
  headRow.style.alignItems = "flex-start";
  headRow.style.gap = "8px";

  const titleWrap = el("div");
  const h4 = el("h3", "", item.title || "محتوى");
  h4.style.margin = "0 0 4px 0";
  h4.style.fontSize = "16.5px";
  h4.style.color = "var(--ink)";
  titleWrap.appendChild(h4);

  if (item.course_id) {
    const cname = courseName(item.course_id);
    if (cname) {
      const badge = el("span", "meta", "📚 " + cname);
      badge.style.fontSize = "12px";
      badge.style.display = "inline-block";
      badge.style.color = "var(--accent)";
      badge.style.fontWeight = "bold";
      titleWrap.appendChild(badge);
    }
  }
  headRow.appendChild(titleWrap);

  // أزرار الأدمن للتعديل والحذف
  if (isAdminUser) {
    const actRow = el("div", "row");
    actRow.style.gap = "4px";

    const editBtn = el("button", "small", "تعديل");
    editBtn.addEventListener("click", () => onEdit(item));
    actRow.appendChild(editBtn);

    const delBtn = el("button", "small danger", "حذف");
    delBtn.addEventListener("click", () => onDelete(item));
    actRow.appendChild(delBtn);

    headRow.appendChild(actRow);
  }
  c.appendChild(headRow);

  // رسم الحقول المكونة للكارت بالترتيب المصمم
  const bodyWrap = el("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.gap = "10px";
  bodyWrap.style.marginTop = "12px";

  fields.forEach((fld) => {
    // العنوان تم عرضه في الرأس بالفعل
    if (fld.type === "title" || fld.type === "course") return;

    const val = customData[fld.id];
    if (val == null || val === "") return;

    if (fld.type === "text") {
      const p = el("div");
      p.style.fontSize = "14px";
      p.style.lineHeight = "1.65";
      p.style.whiteSpace = "pre-wrap";
      p.style.color = "var(--ink)";
      p.textContent = val;
      bodyWrap.appendChild(p);
    } else if (fld.type === "formula") {
      const formBox = el("div", "card");
      formBox.style.background = "var(--paper)";
      formBox.style.border = "1px solid var(--accent)";
      formBox.style.borderRadius = "8px";
      formBox.style.padding = "10px 14px";
      formBox.style.fontFamily = "monospace";
      formBox.style.fontSize = "14px";
      formBox.style.lineHeight = "1.6";
      formBox.style.direction = "ltr";
      formBox.style.textAlign = "left";
      formBox.style.overflowX = "auto";
      formBox.textContent = val;
      bodyWrap.appendChild(formBox);
    } else if (fld.type === "image") {
      const imgUrl = typeof val === "object" ? val.url : val;
      if (imgUrl) {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = fld.label;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "360px";
        img.style.borderRadius = "10px";
        img.style.objectFit = "cover";
        img.style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => window.open(imgUrl, "_blank"));
        bodyWrap.appendChild(img);
      }
    } else if (fld.type === "video") {
      const vidUrl = String(val);
      const ytMatch = vidUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch) {
        const iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube.com/embed/" + ytMatch[1];
        iframe.style.width = "100%";
        iframe.style.height = "240px";
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        bodyWrap.appendChild(iframe);
      } else {
        const vidBtn = el("a", "btn btn-primary", "🎬 مشاهدة الفيديو: " + fld.label);
        vidBtn.href = vidUrl;
        vidBtn.target = "_blank";
        vidBtn.rel = "noopener noreferrer";
        bodyWrap.appendChild(vidBtn);
      }
    } else if (fld.type === "file") {
      const fileObj = typeof val === "object" ? val : { url: val, name: fld.label };
      if (fileObj.url) {
        const fileCard = el("a", "card");
        fileCard.href = fileObj.url;
        fileCard.target = "_blank";
        fileCard.rel = "noopener noreferrer";
        fileCard.style.display = "flex";
        fileCard.style.alignItems = "center";
        fileCard.style.gap = "10px";
        fileCard.style.padding = "10px 14px";
        fileCard.style.background = "var(--paper)";
        fileCard.style.border = "1px solid var(--line)";
        fileCard.style.borderRadius = "10px";
        fileCard.style.textDecoration = "none";
        fileCard.style.color = "var(--ink)";
        
        fileCard.innerHTML = `
          <span style="font-size:22px;">📄</span>
          <div style="flex:1; min-width:0;">
            <strong style="font-size:13.5px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${fileObj.name || fld.label}</strong>
            <span style="font-size:11.5px; opacity:0.8;">${fileObj.size ? fileObj.size + " • " : ""}انقر للفتح والتحميل 📥</span>
          </div>
        `;
        bodyWrap.appendChild(fileCard);
      }
    } else if (fld.type === "link") {
      const linkUrl = typeof val === "object" ? val.url : val;
      if (linkUrl) {
        const linkBtn = el("a", "btn", "🔗 " + fld.label);
        linkBtn.href = linkUrl;
        linkBtn.target = "_blank";
        linkBtn.rel = "noopener noreferrer";
        linkBtn.style.display = "inline-flex";
        linkBtn.style.alignItems = "center";
        linkBtn.style.gap = "6px";
        linkBtn.style.width = "fit-content";
        bodyWrap.appendChild(linkBtn);
      }
    } else if (fld.type === "date") {
      const dateBadge = el("span", "meta", "📅 " + fld.label + ": " + new Date(val).toLocaleString("ar-EG"));
      dateBadge.style.fontSize = "12px";
      bodyWrap.appendChild(dateBadge);
    }
  });

  c.appendChild(bodyWrap);

  // التاريخ وتوقيت النشر
  if (item.created_at) {
    const metaFoot = el("div", "meta");
    metaFoot.style.marginTop = "12px";
    metaFoot.style.fontSize = "11.5px";
    metaFoot.style.opacity = "0.75";
    metaFoot.textContent = "نُشر في: " + new Date(item.created_at).toLocaleDateString("ar-EG");
    c.appendChild(metaFoot);
  }

  return c;
}
