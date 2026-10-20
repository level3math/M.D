import { broadcastNewPost } from "./notifications.js";
import { sb, $, say, el, fmt, MAX_ATTACH } from "./core.js";
import { state, isFull } from "./state.js";
import { loadData } from "./data.js";
import { field, getPostIdFromLocation } from "./ui.js";
import { render } from "./state.js";

function postStoragePath(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const marker = "/storage/v1/object/public/attachments/";
    const i = u.pathname.indexOf(marker);
    return i === -1 ? null : decodeURIComponent(u.pathname.slice(i + marker.length));
  } catch (e) {
    return null;
  }
}
async function uploadPostImage(file) {
  if (!file || !file.type.startsWith("image/")) return { error: { message: "image_only" } };
  if (file.size > MAX_ATTACH) return { error: { message: "too_large" } };
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = "posts/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "_" + safeName;
  const { error } = await sb.storage.from("attachments").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error };
  const { data } = sb.storage.from("attachments").getPublicUrl(path);
  return { data: { image_url: data.publicUrl, image_path: path } };
}
async function notifyNewPost(postId) {
  try {
    const { error } = await sb.rpc("notify_new_post", { p_post_id: postId });
    if (error) console.warn("notify_new_post:", error.message);
  } catch (e) {
    console.warn("notify_new_post:", e);
  }
}
function renderPostForm(post) {
  const c = el("div", "card");
  const isEdit = !!post;
  c.appendChild(el("h3", "", isEdit ? "تعديل المنشور" : "منشور جديد"));

  const body = el("textarea");
  body.rows = 6;
  body.placeholder = "اكتب المنشور (اختياري إذا أضفت صورة)";
  body.value = post && post.content ? post.content : "";
  c.appendChild(field("النص", body));

  const fi = el("input");
  fi.type = "file";
  fi.accept = "image/*";
  let selectedFile = null;
  fi.addEventListener("change", () => {
    selectedFile = fi.files[0] || null;
  });
  c.appendChild(field("الصورة (اختياري)", fi));

  if (post && post.image_url) {
    const current = el("div", "meta", post._removeImage ? "سيتم إزالة الصورة الحالية عند الحفظ." : "توجد صورة حالية. اختيار صورة جديدة سيستبدلها.");
    c.appendChild(current);
    const remove = el("button", post._removeImage ? "small" : "small danger", post._removeImage ? "إلغاء إزالة الصورة" : "إزالة الصورة الحالية");
    remove.addEventListener("click", () => {
      post._removeImage = !post._removeImage;
      render();
    });
    c.appendChild(remove);
  }

  const row = el("div", "row");
  const save = el("button", "", isEdit ? "حفظ التعديل" : "نشر");
  const cancel = el("button", "small", "إلغاء");
  save.addEventListener("click", async () => {
    const content = body.value.trim();
    if (!content && !selectedFile && !(post && post.image_url && !post._removeImage)) {
      say("اكتب المنشور أو اختر صورة");
      return;
    }
    if (selectedFile && selectedFile.size > MAX_ATTACH) {
      say("الصورة أكبر من 10 ميجا");
      return;
    }
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      say("الملف يجب أن يكون صورة");
      return;
    }
    save.disabled = true;
    let uploaded = null;
    if (selectedFile) {
      uploaded = await uploadPostImage(selectedFile);
      if (uploaded.error) {
        save.disabled = false;
        say(uploaded.error.message === "too_large" ? "الصورة أكبر من 10 ميجا" : "تعذّر رفع الصورة");
        return;
      }
    }

    let error = null;
    let newId = post ? post.id : null;
    if (isEdit) {
      const payload = {
        content: content || null,
        image_url: uploaded ? uploaded.data.image_url : (post._removeImage ? null : post.image_url),
      };
      ({ error } = await sb.from("posts").update(payload).eq("id", post.id));
      if (!error && (uploaded || post._removeImage) && post.image_url) {
        const oldPath = postStoragePath(post.image_url);
        if (oldPath) await sb.storage.from("attachments").remove([oldPath]);
      }
    } else {
      const ins = await sb.from("posts").insert({
        content: content || null,
        image_url: uploaded ? uploaded.data.image_url : null,
      }).select("id").single();
      error = ins.error;
      newId = ins.data && ins.data.id;
    }

    if (error) {
      if (uploaded && uploaded.data.image_path) {
        await sb.storage.from("attachments").remove([uploaded.data.image_path]);
      }
      save.disabled = false;
      say("تعذّر حفظ المنشور: " + error.message, true);
      return;
    }

    state.postForm = null;
    state.postFocus = newId;
    say(isEdit ? "تم تعديل المنشور" : "تم نشر المنشور");
    if (!isEdit && newId) notifyNewPost(newId);
    await loadData();
  });
  cancel.addEventListener("click", () => {
    state.postForm = null;
    render();
  });
  row.appendChild(save);
  row.appendChild(cancel);
  c.appendChild(row);
  return c;
}
async function setPostDeleted(id, deleted) {
  const { error } = await sb.from("posts").update({ deleted_at: deleted ? new Date().toISOString() : null }).eq("id", id);
  if (error) { say(deleted ? "تعذّر حذف المنشور" : "تعذّر استرجاع المنشور"); return; }
  state.postFocus = null;
  await loadData();
}
async function purgePost(post) {
  if (!confirm("حذف المنشور نهائيًا؟")) return;
  const { error } = await sb.from("posts").delete().eq("id", post.id).not("deleted_at", "is", null);
  if (error) { say("تعذّر الحذف النهائي: " + error.message, true); return; }
  const path = postStoragePath(post.image_url);
  if (path) await sb.storage.from("attachments").remove([path]);
  state.postFocus = null;
  await loadData();
}
async function emptyPostsTrash(posts) {
  if (!posts.length || !confirm("تفريغ سلة منشورات المحذوفة نهائيًا؟")) return;
  for (const post of posts) {
  const { error } = await sb.from("posts").delete().eq("id", post.id).not("deleted_at", "is", null);

  if (error) {
    say("تعذّر تفريغ السلة: " + error.message, true);
    return;
  }

  const path = postStoragePath(post.image_url);
  if (path) await sb.storage.from("attachments").remove([path]);
  }
  state.postFocus = null;
  await loadData();
}
function appendPostContent(parent, content) {
  const text = String(content || "");
  const re = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
    let raw = m[0];
    let trailing = "";
    while (/[.,!?;:)]$/.test(raw)) {
      trailing = raw.slice(-1) + trailing;
      raw = raw.slice(0, -1);
    }
    const a = document.createElement("a");
    a.href = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = raw;
    a.style.overflowWrap = "anywhere";
    a.style.wordBreak = "break-word";
    parent.appendChild(a);
    if (trailing) parent.appendChild(document.createTextNode(trailing));
    last = m.index + m[0].length;
  }
  if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
}

function renderPosts() {
  const list = $("list");
  list.replaceChildren();

  const all = state.posts || [];
  const dead = all.filter((p) => p.deleted_at);
  const visiblePosts = state.trash && isFull()
    ? dead
    : all.filter((p) => !p.deleted_at);

  const bar = el("div", "row");
  if (isFull()) {
    const add = el("button", "", "+ منشور جديد");
    add.addEventListener("click", () => {
      state.postForm = {};
      state.postFocus = null;
      state.trash = false;
      render();
    });
    bar.appendChild(add);

    const tr = el("button", "", state.trash ? "رجوع" : "سلة المنشورات (" + dead.length + ")");
    tr.addEventListener("click", () => {
      state.trash = !state.trash;
      state.postForm = null;
      state.postFocus = null;
      render();
    });
    bar.appendChild(tr);

    if (state.trash && dead.length) {
      const et = el("button", "danger", "تفريغ السلة");
      et.addEventListener("click", () => emptyPostsTrash(dead));
      bar.appendChild(et);
    }
  }
  if (bar.children.length) list.appendChild(bar);

  if (state.postForm) {
    const editing = state.postForm.id ? all.find((p) => p.id === state.postForm.id) : null;
    list.appendChild(renderPostForm(editing || null));
  }

  if (!visiblePosts.length) {
    list.appendChild(el("p", "center", state.trash ? "سلة المنشورات فارغة" : "لا توجد منشورات حتى الآن"));
    return;
  }

  let posts = visiblePosts;
  if (state.postFocus != null) {
    const focused = visiblePosts.find((p) => String(p.id) === String(state.postFocus));
    if (focused) posts = [focused];
  }

  posts.forEach((post) => {
    const card = el("div", "card");
    if (post.content) {
      const body = el("p", "body");
      appendPostContent(body, post.content);
      card.appendChild(body);
    }

    if (post.image_url) {
      const wrap = el("div", "post-image-wrap");
      const img = document.createElement("img");
      img.className = "post-image";
      img.src = post.image_url;
      img.alt = "صورة المنشور";
      wrap.appendChild(img);
      const dl = el("a", "btn small", "⬇️ تحميل الصورة");
      dl.href = post.image_url + (post.image_url.includes("?") ? "&" : "?") + "download=" + encodeURIComponent("post-" + post.id);
      dl.rel = "noopener noreferrer";
      wrap.appendChild(dl);
      card.appendChild(wrap);
    }

    card.appendChild(el("p", "meta", fmt(post.created_at)));

    if (isFull()) {
      const row = el("div", "row");
      if (post.deleted_at) {
        const restore = el("button", "small", "استرجاع");
        restore.addEventListener("click", () => setPostDeleted(post.id, false));
        row.appendChild(restore);
        const purge = el("button", "small danger", "حذف نهائي");
        purge.addEventListener("click", () => purgePost(post));
        row.appendChild(purge);
      } else {
        const edit = el("button", "small", "تعديل");
        edit.addEventListener("click", () => {
          state.postForm = { id: post.id };
          state.postFocus = post.id;
          state.trash = false;
          render();
        });
        const del = el("button", "small danger", "حذف");
        del.addEventListener("click", () => setPostDeleted(post.id, true));
        row.appendChild(edit);
        row.appendChild(del);
      }
  
      card.appendChild(row);
    }

    list.appendChild(card);
  });
}


export { renderPosts };
