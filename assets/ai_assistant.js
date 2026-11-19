/* =========================================================================
   Math 3 - Math & Pedagogy AI Assistant Module
   المساعد الذكي المتخصص في الرياضيات المتقدمة وطرق التدريس والمجال التربوي
   - يدعم إرسال مرفقات متعددة (صور، PDF، مستندات) بحد أقصى مجمع 10 ميجابايت
   - إمكانية تعديل الرسائل المرسلة وإعادة إرسالها
   - إمكانية البحث بالويب وتوثيق المصادر
   - تصدير الردود والملخصات كـ PDF جاهز للطباعة والمذاكرة
   - مساحة مريحة تناسب المذاكرة والتخطيط الأكاديمي
   ========================================================================= */

import { el, $, sb } from "./core.js";

const STORAGE_KEY = "math3_ai_chat_v4";
const MAX_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024; // 10 ميجابايت كحد أقصى مجمع
const MAX_ATTACHMENTS_B64_LEN = 14 * 1024 * 1024;

const FALLBACK_SUPABASE_URL = "https://xwnjimsoframcqstdjfo.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bmppbXNvZnJhbWNxc3RkamZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTAwODgsImV4cCI6MjEwNTQyNjA4OH0.JhyVa4l8qhK3_ZklbvJsK8fYvPyyWuCGeGzvZR6qu7c";

const DEFAULT_WELCOME_MSG = {
  role: "model",
  text: `أهلاً بكم في **المعلّم الذكي** لدُفعة Math 3 🧠✨

يمكنكم السؤال في أي موضوع، وليس الرياضيات والتربية فقط:

- **حل الأسئلة من الصور و PDF:** يمكن إرفاق صورة أو شيت أو ملف PDF لقراءة كل الأسئلة وحلّها بالترتيب خطوة بخطوة.
- **الرياضيات والتربية:** براهين، تحليل، معادلات تفاضلية، خطط دروس 5Es، أهداف سلوكية، وغيرها.
- **أي موضوع آخر:** شرح، كتابة، برمجة، ترجمة، نصائح، وأي سؤال عام.
- **بحث ومصادر:** تتوفر إمكانية البحث في الويب وتوثيق المصادر بروابط حقيقية عند الطلب.

📎 يمكن إرفاق صور وملفات PDF ونصوص، وتعديل أي رسالة سابقة، وطلب مذكرة PDF أو رسم توضيحي.`
};

export function getAiChatHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter(m => !m.text?.includes("Failed to fetch") && !m.text?.includes("تعذر"));
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch (e) {}
  return [DEFAULT_WELCOME_MSG];
}

export function saveAiChatHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30)));
  } catch (e) {}
}

export function clearAiChatHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

// دالة تنسيق الماركداون والرياضيات
export function formatAiMarkdown(text) {
  if (!text) return "";
  let html = text;

  // الحماية من XSS الأساسي مع الحفاظ على علامات SVG إذا تم إنتاجها
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // دعم استرجاع وسوم SVG إذا تم توليد رسم بياني
  html = html.replace(/&lt;(\/?(svg|path|circle|rect|line|polyline|polygon|text|g))((?:\s+[\w\-:]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?)&gt;/gi, '<$1$3>');

  // دعم صور الماركداون ![alt](url)
  html = html.replace(/!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g, (_m, alt, url) => {
    return `<div class="ai-image-container"><img src="${url}" alt="${alt || 'صورة توضيحية'}" class="ai-inline-image" loading="lazy" />${alt ? `<div class="ai-image-caption">🖼️ ${alt}</div>` : ''}</div>`;
  });

  // معالجة كتل الأكواد أو الرياضيات ``` ... ```
  html = html.replace(/```([\s\S]*?)```/g, (_m, p1) => {
    return `<pre class="ai-code-block"><code>${p1.trim()}</code></pre>`;
  });

  // معالجة المعادلات المستقلة $$ ... $$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_m, p1) => {
    return `<div class="ai-math-display" data-expr="${encodeURIComponent(p1)}">$$${p1}$$</div>`;
  });

  // معالجة المعادلات داخل السطر $ ... $
  html = html.replace(/\$([^\$\n]+?)\$/g, (_m, p1) => {
    return `<span class="ai-math-inline" data-expr="${encodeURIComponent(p1)}">$${p1}$</span>`;
  });

  // العناوين
  html = html.replace(/^### (.*$)/gim, '<h4 class="ai-heading-3">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="ai-heading-2">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="ai-heading-1">$1</h2>');

  // الخط العريض والمائل
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // الاقتباسات
  html = html.replace(/^> (.*$)/gim, '<blockquote class="ai-quote">$1</blockquote>');

  // القوائم المنقطة
  html = html.replace(/^\s*[-•]\s+(.*$)/gim, '<li class="ai-list-item">$1</li>');

  // تجميع الـ <li> المتتالية داخل <ul>
  html = html.replace(/(<li class="ai-list-item">[\s\S]*?<\/li>)+/g, (match) => {
    return `<ul class="ai-bullet-list">${match}</ul>`;
  });

  // الأرقام الترتيبية 1. 2. 3.
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="ai-ordered-step"><span class="ai-step-badge">$1</span><span class="ai-step-text">$2</span></div>');

  // تحويل الفواصل إلى فقرات نظيفة
  const lines = html.split("\n\n");
  html = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<pre") || trimmed.startsWith("<ul") || trimmed.startsWith("<blockquote") || trimmed.startsWith("<div class=\"ai-math") || trimmed.startsWith("<div class=\"ai-ordered-step") || trimmed.startsWith("<svg")) {
      return trimmed;
    }
    return `<p class="ai-paragraph">${trimmed.replace(/\n/g, "<br>")}</p>`;
  }).join("");

  return html;
}

// تطبيق KaTeX على العنصر إن وُجد
export function triggerKaTeXRendering(container) {
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn("KaTeX rendering warning:", e);
    }
  }
}

// دالة تصدير وطباعة الرد كـ PDF
export function exportResponseAsPdf(title, text) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("يُرجى السماح بفتح النوافذ المنبثقة لتحميل وطباعة ملف PDF.");
    return;
  }

  const renderedContent = formatAiMarkdown(text);

  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>${title || "ملخص Math 3 الأكاديمي"}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
      <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
      <style>
        body {
          font-family: 'Alexandria', 'Cairo', Arial, sans-serif;
          padding: 30px;
          color: #111827;
          line-height: 1.8;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid #10b981;
          padding-bottom: 12px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand { font-size: 18px; font-weight: bold; color: #10b981; }
        .meta { font-size: 12px; color: #6b7280; }
        h1, h2, h3, h4 { color: #047857; margin-top: 18px; }
        .ai-math-display {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          direction: ltr;
          text-align: center;
          margin: 14px 0;
        }
        .ai-math-inline {
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          direction: ltr;
        }
        .ai-ordered-step {
          margin: 8px 0;
          padding: 8px 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .ai-step-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          width: 20px;
          height: 20px;
          text-align: center;
          border-radius: 50%;
          font-size: 11px;
          margin-left: 8px;
        }
        pre { background: #1f2937; color: white; padding: 12px; border-radius: 8px; direction: ltr; }
        @media print {
          body { padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">منصة Math 3 الأكاديمية · المعلّم الذكي</div>
        <div class="meta">${new Date().toLocaleDateString("ar-EG")}</div>
      </div>
      <div class="no-print" style="margin-bottom:20px; text-align:left;">
        <button onclick="window.print()" style="background:#10b981; color:white; border:none; padding:8px 18px; border-radius:8px; font-weight:bold; cursor:pointer;">
          🖨️ طباعة / حفظ كـ PDF
        </button>
      </div>
      <div id="content">${renderedContent}</div>
      <script>
        window.addEventListener('load', () => {
          if (window.renderMathInElement) {
            window.renderMathInElement(document.getElementById('content'), {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
              ],
              throwOnError: false
            });
          }
          setTimeout(() => { window.print(); }, 600);
        });
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// تقديم شاشة المساعد الذكي
export function renderAiAssistantView(container, onBack) {
  container.replaceChildren();

  let isSending = false;
  let pendingAttachments = []; // قائمة المرفقات المعلقة: { name, size, type, data }

  const wrapper = el("div", "ai-view-container");

  // رأس الصفحة مع زر الرجوع وزر مسح المحادثة
  const topBar = el("div", "ai-top-bar");

  const backBtn = el("button", "modern-back-btn");
  backBtn.innerHTML = `<span>←</span> <span>رجوع للمنصة</span>`;
  backBtn.addEventListener("click", () => {
    if (onBack) onBack();
  });
  topBar.appendChild(backBtn);

  const clearChatBtn = el("button", "ai-clear-btn", "مسح المحادثة 🗑️");
  clearChatBtn.title = "بدء محادثة جديدة وحذف السجل القديم";
  let clearTimer = null;
  clearChatBtn.addEventListener("click", () => {
    if (clearChatBtn.dataset.confirming !== "true") {
      clearChatBtn.dataset.confirming = "true";
      clearChatBtn.textContent = "تأكيد المسح؟ 🗑️";
      clearChatBtn.style.background = "rgba(239, 68, 68, 0.35)";
      clearChatBtn.style.borderColor = "rgba(239, 68, 68, 0.8)";
      clearTimer = setTimeout(() => {
        clearChatBtn.dataset.confirming = "false";
        clearChatBtn.textContent = "مسح المحادثة 🗑️";
        clearChatBtn.style.background = "";
        clearChatBtn.style.borderColor = "";
      }, 4000);
      return;
    }

    if (clearTimer) clearTimeout(clearTimer);
    clearChatBtn.dataset.confirming = "false";
    clearAiChatHistory();
    history.length = 0;
    history.push(DEFAULT_WELCOME_MSG);
    pendingAttachments = [];
    renderAttachmentsTray();
    chatMessagesBox.replaceChildren();
    appendMessageToUI(DEFAULT_WELCOME_MSG);
    clearChatBtn.textContent = "تم المسح بنجاح ✨";
    clearChatBtn.style.background = "rgba(16, 185, 129, 0.25)";
    clearChatBtn.style.borderColor = "rgba(16, 185, 129, 0.6)";
    clearChatBtn.style.color = "#34d399";
    setTimeout(() => {
      clearChatBtn.textContent = "مسح المحادثة 🗑️";
      clearChatBtn.style.background = "";
      clearChatBtn.style.borderColor = "";
      clearChatBtn.style.color = "";
    }, 2000);
  });
  topBar.appendChild(clearChatBtn);

  wrapper.appendChild(topBar);

  // صندوق الرسائل
  const chatMessagesBox = el("div", "ai-chat-messages");
  chatMessagesBox.id = "ai-chat-messages";

  function scrollChatToBottom() {
    setTimeout(() => {
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }, 50);
  }

  function appendMessageToUI(msg, animate = false) {
    const isModel = msg.role === "model";
    const bubbleWrap = el("div", `ai-message-row ${isModel ? "from-model" : "from-user"}`);

    if (isModel) {
      const avatar = el("div", "ai-avatar");
      avatar.innerHTML = `<span style="font-size:16px;">🧠</span>`;
      bubbleWrap.appendChild(avatar);
    }

    const contentBox = el("div", `ai-bubble ${isModel ? "model-bubble" : "user-bubble"}`);

    const headerRow = el("div", "ai-bubble-header");
    if (isModel) {
      headerRow.innerHTML = `
        <span class="ai-speaker-name">المعلّم والأكاديمي الذكي</span>
        <div class="ai-bubble-actions">
          <button type="button" class="ai-action-btn ai-copy-btn" title="نسخ الرد">
            📋 نسخ
          </button>
        </div>
      `;
      const copyBtn = headerRow.querySelector(".ai-copy-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const cleanCopyText = (msg.text || "").replace(/\[PDF_DOCUMENT:[^\]]+\]/g, "").trim();
          navigator.clipboard.writeText(cleanCopyText).then(() => {
            copyBtn.textContent = "✅ تم النسخ";
            setTimeout(() => { copyBtn.textContent = "📋 نسخ"; }, 2000);
          });
        });
      }
    } else {
      headerRow.innerHTML = `
        <span class="ai-speaker-name" style="color:var(--text-white); opacity:0.8;">أنت (عضو Math 3)</span>
        <button type="button" class="ai-action-btn ai-edit-btn" title="تعديل هذه الرسالة">
          ✏️ تعديل الرسالة
        </button>
      `;
      const editBtn = headerRow.querySelector(".ai-edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          const input = $("ai-user-input");
          if (input) {
            input.value = msg.text || "";
            input.focus();
            input.style.height = "auto";
            input.style.height = Math.min(input.scrollHeight, 180) + "px";
            input.scrollIntoView({ behavior: "smooth" });
          }
          const banner = $("ai-edit-banner");
          if (banner) {
            banner.style.display = "flex";
          }
        });
      }
    }
    contentBox.appendChild(headerRow);

    if (msg.attachments && msg.attachments.length) {
      const attWrap = el("div", "ai-bubble-attachments-preview");
      msg.attachments.forEach(att => {
        const item = el("div", "ai-bubble-att-item");
        const isImg = att.type && att.type.startsWith("image/");
        item.innerHTML = `
          <span class="ai-att-icon">${isImg ? "🖼️" : "📄"}</span>
          <span class="ai-att-name" title="${att.name}">${att.name}</span>
          <span class="ai-att-size">${formatBytes(att.size || 0)}</span>
        `;
        attWrap.appendChild(item);
      });
      contentBox.appendChild(attWrap);
    }

    const cleanDisplayContent = (msg.text || "").replace(/\[PDF_DOCUMENT:[^\]]+\]/g, "").trim();
    const bodyDiv = el("div", "ai-bubble-body");
    bodyDiv.innerHTML = formatAiMarkdown(cleanDisplayContent);

    bodyDiv.querySelectorAll("svg").forEach((svgEl) => {
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svgEl.style.maxWidth = "100%";
      svgEl.style.height = "auto";
      if (!svgEl.closest(".ai-svg-diagram-card")) {
        const wrap = el("div", "ai-svg-diagram-card");
        const cardHeader = el("div", "ai-svg-card-header");
        cardHeader.innerHTML = `
          <span class="ai-svg-card-title">📐 رسم بياني وشكل هندسي دقيق</span>
          <button type="button" class="ai-svg-download-btn" title="حفظ هذا الرسم كصورة">
            📥 حفظ الصورة (SVG)
          </button>
        `;
        const downloadBtn = cardHeader.querySelector(".ai-svg-download-btn");
        downloadBtn.addEventListener("click", () => {
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          const svgUrl = URL.createObjectURL(svgBlob);
          const dl = document.createElement("a");
          dl.href = svgUrl;
          dl.download = `Math3_Diagram_${Date.now()}.svg`;
          document.body.appendChild(dl);
          dl.click();
          document.body.removeChild(dl);
          URL.revokeObjectURL(svgUrl);
        });

        svgEl.parentNode.insertBefore(wrap, svgEl);
        wrap.appendChild(cardHeader);
        wrap.appendChild(svgEl);
      }
    });

    contentBox.appendChild(bodyDiv);

    const isExplicitPdfRequest = isModel && Boolean(
      msg.isPdf ||
      (msg.text && (msg.text.includes("[PDF_DOCUMENT:") || /ملف pdf جاهز للتحميل/i.test(msg.text)))
    );

    if (isExplicitPdfRequest) {
      let docTitle = "مذكرة_Math3_الأكاديمية";
      const docMatch = (msg.text || "").match(/\[PDF_DOCUMENT:\s*([^\]]+)\]/);
      if (docMatch && docMatch[1]) {
        docTitle = docMatch[1].trim();
      }

      const pdfCard = el("div", "ai-pdf-download-card");
      pdfCard.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px; background:rgba(14,165,233,0.12); border:1.5px solid rgba(14,165,233,0.35); border-radius:14px; padding:12px 16px; margin-top:14px;";
      pdfCard.innerHTML = `
        <div class="ai-pdf-card-info" style="display:flex; align-items:center; gap:10px;">
          <span class="ai-pdf-card-icon" style="font-size:26px;">📄</span>
          <div>
            <div class="ai-pdf-card-title" style="font-weight:bold; font-size:14px; color:#38bdf8;">ملف PDF جاهز: ${docTitle}.pdf</div>
            <div class="ai-pdf-card-subtitle" style="font-size:12px; opacity:0.8; color:var(--text-muted);">تم إعداد المستند الأكاديمي للتحميل والطباعة المباشرة</div>
          </div>
        </div>
        <button type="button" class="ai-pdf-card-btn" style="background:#0284c7; color:white; border:none; padding:8px 16px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; white-space:nowrap;">
          📥 تنزيل ملف الـ PDF
        </button>
      `;
      pdfCard.querySelector(".ai-pdf-card-btn").addEventListener("click", () => {
        exportResponseAsPdf(docTitle, cleanDisplayContent);
      });
      contentBox.appendChild(pdfCard);
    }

    if (msg.sources && msg.sources.length) {
      const sourcesBox = el("div", "ai-sources-card");
      sourcesBox.innerHTML = `
        <div class="ai-sources-title">
          <span>🔍</span>
          <span>المصادر والمراجع المعتمدة المستند إليها (${msg.sources.length}):</span>
        </div>
        <div class="ai-sources-list">
          ${msg.sources.map(s => `
            <a href="${s.uri}" target="_blank" rel="noopener noreferrer" class="ai-source-link">
              <span class="ai-source-globe">🌐</span>
              <span class="ai-source-name">${s.title || s.uri}</span>
              <span class="ai-source-arrow">↗</span>
            </a>
          `).join("")}
        </div>
      `;
      contentBox.appendChild(sourcesBox);
    }

    triggerKaTeXRendering(bodyDiv);

    bubbleWrap.appendChild(contentBox);
    chatMessagesBox.appendChild(bubbleWrap);

    if (animate) {
      bubbleWrap.style.opacity = "0";
      bubbleWrap.style.transform = "translateY(10px)";
      bubbleWrap.style.transition = "all 0.3s ease";
      requestAnimationFrame(() => {
        bubbleWrap.style.opacity = "1";
        bubbleWrap.style.transform = "translateY(0)";
      });
    }

    scrollChatToBottom();
  }

  const history = getAiChatHistory();
  history.forEach(msg => appendMessageToUI(msg));

  wrapper.appendChild(chatMessagesBox);

  const attachmentsPreviewArea = el("div", "ai-attachments-tray");
  attachmentsPreviewArea.id = "ai-attachments-tray";
  attachmentsPreviewArea.style.display = "none";

  function renderAttachmentsTray() {
    attachmentsPreviewArea.replaceChildren();
    if (!pendingAttachments.length) {
      attachmentsPreviewArea.style.display = "none";
      return;
    }

    attachmentsPreviewArea.style.display = "flex";

    const totalBytes = pendingAttachments.reduce((s, a) => s + (a.size || 0), 0);

    const infoLabel = el("div", "ai-tray-info");
    infoLabel.innerHTML = `<span>📎 المرفقات (${pendingAttachments.length})</span> · <span style="color:${totalBytes > MAX_ATTACHMENTS_TOTAL_BYTES ? '#ef4444' : 'var(--mint-primary)'}">${formatBytes(totalBytes)} / 10 MB</span>`;
    attachmentsPreviewArea.appendChild(infoLabel);

    const chipsRow = el("div", "ai-tray-chips-row");
    pendingAttachments.forEach((att, index) => {
      const chip = el("div", "ai-tray-chip");
      const isImg = att.type && att.type.startsWith("image/");
      chip.innerHTML = `
        <span class="ai-tray-chip-icon">${isImg ? "🖼️" : "📄"}</span>
        <span class="ai-tray-chip-name" title="${att.name}">${att.name}</span>
        <span class="ai-tray-chip-size">(${formatBytes(att.size)})</span>
        <button type="button" class="ai-tray-remove-btn" title="إزالة">✕</button>
      `;
      chip.querySelector(".ai-tray-remove-btn").addEventListener("click", () => {
        pendingAttachments.splice(index, 1);
        renderAttachmentsTray();
      });
      chipsRow.appendChild(chip);
    });
    attachmentsPreviewArea.appendChild(chipsRow);
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.id = "ai-file-picker";
  fileInput.style.display = "none";
  fileInput.accept = "image/*,.pdf,.txt,.md,.tex,.csv,.json";

  function compressAndReadAttachment(f) {
    return new Promise((resolve) => {
      if (f.type && f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 2000;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
            resolve({
              name: f.name,
              size: Math.round(compressedDataUrl.length * 0.75),
              type: "image/jpeg",
              data: compressedDataUrl
            });
          };
          img.onerror = () => {
            resolve({ name: f.name, size: f.size, type: f.type, data: e.target.result });
          };
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(f);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve({
          name: f.name,
          size: f.size,
          type: f.type || (f.name.endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
          data: reader.result
        });
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(f);
      }
    });
  }

  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const f of files) {
      const att = await compressAndReadAttachment(f);
      if (att && att.data) {
        pendingAttachments.push(att);
      }
    }

    fileInput.value = "";
    renderAttachmentsTray();
  });

  const inputContainer = el("div", "ai-input-container");

  const editBanner = el("div", "ai-edit-banner");
  editBanner.id = "ai-edit-banner";
  editBanner.style.display = "none";
  editBanner.innerHTML = `
    <span class="ai-edit-banner-text">✏️ وضع تعديل السؤال: يُرجى تعديل نص السؤال أو المرفقات ثم الضغط على إرسال.</span>
    <button type="button" class="ai-cancel-edit-btn">✕ إلغاء التعديل</button>
  `;
  editBanner.querySelector(".ai-cancel-edit-btn").addEventListener("click", () => {
    editBanner.style.display = "none";
    textarea.value = "";
    textarea.style.height = "auto";
  });
  inputContainer.appendChild(editBanner);

  inputContainer.appendChild(attachmentsPreviewArea);

  const form = el("form", "ai-input-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSend();
  });

  const attachBtn = el("button", "ai-attach-btn");
  attachBtn.type = "button";
  attachBtn.title = "إرفاق ملفات أو صور أو مستندات PDF (حتى 10 ميجابايت مجمعة)";
  attachBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
    <span class="ai-attach-label">مرفقات</span>
  `;
  attachBtn.addEventListener("click", () => fileInput.click());

  const textarea = el("textarea", "ai-textarea");
  textarea.id = "ai-user-input";
  textarea.placeholder = "يمكن طرح أي سؤال هنا، أو إرفاق صور وملفات PDF...";
  textarea.rows = 1;
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
  });
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  const sendBtn = el("button", "ai-send-btn");
  sendBtn.type = "submit";
  sendBtn.innerHTML = `
    <span>إرسال</span>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(180deg);">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  `;

  form.appendChild(textarea);

  const actionsBar = el("div", "ai-input-actions-bar");
  actionsBar.appendChild(attachBtn);
  actionsBar.appendChild(sendBtn);
  form.appendChild(actionsBar);

  form.appendChild(fileInput);
  inputContainer.appendChild(form);

  wrapper.appendChild(inputContainer);
  container.appendChild(wrapper);

  function createThinkingIndicator() {
    const row = el("div", "ai-message-row from-model ai-thinking-row");
    row.id = "ai-thinking-indicator";
    row.innerHTML = `
      <div class="ai-avatar"><span style="font-size:16px;">🧠</span></div>
      <div class="ai-bubble model-bubble ai-thinking-bubble">
        <div class="ai-thinking-header">
          <span class="ai-pulse-dot"></span>
          <span>جاري التحميل...</span>
        </div>
        <div class="ai-thinking-bars">
          <div class="ai-bar bar-1"></div>
          <div class="ai-bar bar-2"></div>
          <div class="ai-bar bar-3"></div>
        </div>
      </div>
    `;
    return row;
  }

  async function handleSend() {
    const text = textarea.value.trim();
    const hasAttachments = pendingAttachments.length > 0;
    if ((!text && !hasAttachments) || isSending) return;

    const totalB64Len = pendingAttachments.reduce((n, a) => n + String(a.data || "").length, 0);
    if (totalB64Len > MAX_ATTACHMENTS_B64_LEN) {
      appendMessageToUI({
        role: "model",
        text: "⚠️ حجم المرفقات كبير (الحد الأقصى حوالي 10 ميجابايت). يُرجى تقسيمها على أكثر من رسالة.",
        sources: []
      }, true);
      return;
    }

    isSending = true;
    sendBtn.disabled = true;
    attachBtn.disabled = true;
    textarea.value = "";
    textarea.style.height = "auto";

    const banner = $("ai-edit-banner");
    if (banner) banner.style.display = "none";

    const sentAttachments = [...pendingAttachments];
    pendingAttachments = [];
    renderAttachmentsTray();

    const userMsg = {
      role: "user",
      text: text || "اقرأ المرفقات وحلّ كل الأسئلة الموجودة فيها بالتفصيل.",
      attachments: sentAttachments.map(a => ({ name: a.name, size: a.size, type: a.type }))
    };
    history.push(userMsg);
    saveAiChatHistory(history);
    appendMessageToUI(userMsg, true);

    const indicator = createThinkingIndicator();
    chatMessagesBox.appendChild(indicator);
    scrollChatToBottom();

    let replyText = "";
    let replySources = [];
    let errorText = "";

    try {
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw { isUserMsg: true, message: "يجب تسجيل الدخول أولاً لاستخدام المعلّم الذكي." };
      }

      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), 170000);

      const priorHistory = history.slice(0, -1).slice(-24).map(m => ({ role: m.role, text: m.text }));
      const baseUrl = String(sb.supabaseUrl || FALLBACK_SUPABASE_URL).replace(/\/+$/, "");
      const anonKey = String(sb.supabaseKey || FALLBACK_SUPABASE_ANON_KEY);

      const res = await fetch(`${baseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: text,
          history: priorHistory,
          attachments: sentAttachments,
        }),
        signal: controller.signal
      });
      clearTimeout(fetchTimer);

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        replyText = data.reply;
        replySources = data.sources || [];
      } else {
        errorText = data.error || `تعذّر الاتصال بالخادم (كود ${res.status}).`;
      }
    } catch (err) {
      console.warn("AI request failed:", err);
      if (err && err.isUserMsg) {
        errorText = err.message;
      } else if (err && err.name === "AbortError") {
        errorText = "استغرق الرد وقتاً أطول من المسموح. يُرجى تقليل عدد أو حجم المرفقات والمحاولة مرة أخرى.";
      } else {
        errorText = "تعذّر الوصول للخادم. يُرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.";
      }
    }

    const ind = $("ai-thinking-indicator");
    if (ind) ind.remove();

    if (!replyText) {
      appendMessageToUI({
        role: "model",
        text: `⚠️ ${errorText}\n\nالرسالة لا تزال موجودة، يُرجى الضغط على إرسال للمحاولة مرة أخرى.`,
        sources: []
      }, true);
      history.pop();
      saveAiChatHistory(history);
      textarea.value = text;
      if (sentAttachments.length) {
        pendingAttachments = sentAttachments;
        renderAttachmentsTray();
      }
      isSending = false;
      sendBtn.disabled = false;
      attachBtn.disabled = false;
      return;
    }

    const modelMsg = {
      role: "model",
      text: replyText,
      sources: replySources
    };
    history.push(modelMsg);
    saveAiChatHistory(history);
    appendMessageToUI(modelMsg, true);

    isSending = false;
    sendBtn.disabled = false;
    attachBtn.disabled = false;
    textarea.focus();
  }

  scrollChatToBottom();
           }
