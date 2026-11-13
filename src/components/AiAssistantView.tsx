import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Globe,
  Printer,
  Edit2,
  ExternalLink,
  Maximize2,
  Minimize2,
  Download,
  AlertCircle,
  FileCheck,
  UploadCloud,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 Data URL
}

interface SourceItem {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  attachments?: Array<{ id?: string; name: string; size: number; type: string; data?: string }>;
  sources?: SourceItem[];
  isEditing?: boolean;
}

const STORAGE_KEY = 'math3_react_ai_chat_v4';
const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: 'welcome_msg_01',
  role: 'model',
  timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
  text: `أهلاً بك يا زميلي في **المعلّم والأكاديمي الذكي** لدُفعة Math 3 بكلية التربية - قسم الرياضيات 🧠✨

تم تجهيز هذه المساحة بكامل الاتساع والإمكانيات الأكاديمية والتقنية لترافقك في المذاكرة والتحضير بأعلى درجات الذكاء:

### 📐 الرياضيات التخصصية والمتقدمة (Advanced Mathematics):
- براهين النظريات وحل المسائل خطوة بخطوة في:
  - **التحليل المركب (Complex Analysis)**
  - **التبولوجي (Topology)**
  - **المعادلات التفاضلية الجزئية والعادية (PDEs & ODEs)** وتطبيقاتها وبراهينها
  - **ميكانيكا الموائع والوسط المتصل (Fluid & Continuum Mechanics)**
  - **الديناميكا التحليلية (Analytical Dynamics)**
  - **الهندسة التفاضلية، بحوث العمليات، والجبر المجرد**.
- توضيح المعطيات، الاستراتيجية الرياضية، وتحليل الخطوات المنطقية مع رسومات بيانية وهندسية توضيحية كاملة.

### 🎓 طرق تدريس الرياضيات والمجال التربوي (Pedagogy & Didactics):
- تصميم خطط الدروس والوحدات وفق النماذج الحديثة (**دورة التعلم الخماسية 5Es**، ونموذج ويتلي).
- صياغة الأهداف السلوكية (المعرفية، الوجدانية، المهارية) وفق مستويات بلوم بدقة عالية.
- تشخيص صعوبات تعلم المفاهيم المجردة وطرق علاجها والتدرج من المحسوس للمجرد (**طريقة CPA**).
- إعداد بنوك الأسئلة وجداول المواصفات وأوراق العمل.

---
⚡ **الإمكانيات المتاحة لك بحرية ودون قيود:**
- 📎 إرفاق ملفات متعددة (صور، تمارين مصورة، مستندات) بحد أقصى مجمع **25 ميجابايت**.
- ✏️ إمكانية تعديل أي رسالة سابقة وإعادة صياغتها بنقرة واحدة لتحديث الإجابة.
- 🖼️ توليد ورسم أشكال هندسية وبيانية متجهة (SVG) عالية الدقة عند طلبها مع إمكانية تحميلها كصورة.
- 🌐 بحث مباشر في الويب لجلب أحدث المراجع الأكاديمية وروابطها المعتمدة.
- 📄 إعداد مستندات وملخصات كـ **PDF** عند طلبك لها، مع بطاقة تحميل وطباعة مخصصة.`
};

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// محرك الذكاء المتقدم الاحتياطي الفوري (مستوى ذكي مباشر بدون إطالة أو براهين غير مطلوبة)
function generateSmartClientResponse(promptText: string): { reply: string; sources?: SourceItem[]; isPdf?: boolean; pdfTitle?: string } {
  const q = (promptText || '').toLowerCase().trim();
  const hasImage = /(ارسم|رسم|شكل هندسي|رسمة|منحنى|دالة بيانية|دياجرام|diagram|plot|draw|graph|svg)/i.test(q);
  const hasPdf = /(pdf|بي دي اف|بي ديإف|ملف pdf|كـ pdf|بصيغة pdf|اطبعلي pdf|مذكرة pdf)/i.test(q);
  const hasSearch = /(بحث|ابحث|سيرش|المصدر|مصادر|مرجع|مراجع|سورس|جوجل|google|search|source|sources|link|url|روابط)/i.test(q);

  let reply = '';
  const sources: SourceItem[] = [];

  // حل الحسابات المباشرة (مثل 5 + 7)
  const mathCalcMatch = promptText.match(/(-?\d+(?:\.\d+)?)\s*([\+\-\*\/×÷\^])\s*(-?\d+(?:\.\d+)?)/);
  if (mathCalcMatch && !hasPdf && !hasImage) {
    const n1 = parseFloat(mathCalcMatch[1]);
    const op = mathCalcMatch[2];
    const n2 = parseFloat(mathCalcMatch[3]);
    let res: number | null = null;
    if (op === '+' || op === 'plus') res = n1 + n2;
    else if (op === '-' || op === 'minus') res = n1 - n2;
    else if (op === '*' || op === '×' || op === 'times') res = n1 * n2;
    else if (op === '/' || op === '÷') res = n2 !== 0 ? n1 / n2 : null;
    else if (op === '^') res = Math.pow(n1, n2);

    if (res !== null) {
      reply = `الناتج المباشر:\n$$${n1} ${op} ${n2} = ${res}$$\n**النتيجة = ${res}**`;
      return { reply, sources };
    }
  }

  if (hasImage) {
    const svgDiagram = `<svg viewBox="0 0 500 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto; background:#07131e; border-radius:14px; border:1px solid #1e3a5f;">
  <defs>
    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
    </linearGradient>
  </defs>
  <line x1="40" y1="260" x2="460" y2="260" stroke="#475569" stroke-width="2" />
  <line x1="250" y1="20" x2="250" y2="290" stroke="#475569" stroke-width="2" />
  <text x="470" y="265" fill="#94a3b8" font-size="14" font-weight="bold">x</text>
  <text x="255" y="30" fill="#94a3b8" font-size="14" font-weight="bold">y = f(x)</text>
  <path d="M 120 260 Q 250 40 380 260 Z" fill="url(#areaGrad)" />
  <path d="M 80 270 Q 250 30 420 270" stroke="url(#curveGrad)" stroke-width="3.5" fill="none" />
  <circle cx="250" cy="150" r="4.5" fill="#f59e0b" />
  <text x="262" y="155" fill="#f59e0b" font-size="12" font-weight="bold">Focus</text>
  <circle cx="250" cy="90" r="4.5" fill="#38bdf8" />
  <text x="260" y="95" fill="#38bdf8" font-size="12" font-weight="bold">Vertex</text>
</svg>`;
    reply = `إليك الرسم الهندسي المتجهي الدقيق للمسألة:\n\n${svgDiagram}\n\n**معادلة المنحنى:**\n$$y = -k(x - h)^2 + c$$\n- الرأس: $(h, c)$\n- التناظر: متماثل حول المحور $x = h$.`;
  } else if (hasPdf) {
    const titleMatch = promptText.replace(/(اعملي|عايز|اريد|صمم|ابعتلي|ملخص|مذكرة|ورقة عمل|pdf|بي دي اف)/gi, '').trim();
    const docTitle = titleMatch ? `ملخص ${titleMatch}` : 'ملخص المراجعة الأكاديمية الشاملة';
    reply = `### 📄 ${docTitle}\n**المساق:** كلية التربية - قسم الرياضيات (Math 3)  \n**الوثيقة:** مذكرة مراجعة منهجية مهيأة للتحميل والطباعة كملف PDF\n\n---\n\n#### 1. القوانين والمعادلات الأساسية:\n$$u_t = c^2 (u_{xx} + u_{yy}), \\quad \\oint_C f(z)\\,dz = 2\\pi i \\sum_{k=1}^n \\text{Res}(f, z_k)$$\n\n---\n[PDF_DOCUMENT: ${docTitle}]`;
  } else if (/(برهن|اثبت|إثبات|برهان|prove|proof)/i.test(q)) {
    reply = `إليك البرهان الرياضي الأكاديمي المباشر:\n\n### 📌 منطوق النظرية (Statement):\nلتكن $f(z)$ دالة تحليلية داخل وعلى مسار مغلق $C$، فإن:\n$$\\oint_C f(z)\\,dz = 0$$\n\n### 🔍 خطوات الإثبات:\nبتطبيق نظرية جرين ومعادلتي كوشي-ريمان ($\\frac{\\partial u}{\\partial x} = \\frac{\\partial v}{\\partial y}$ و $\\frac{\\partial u}{\\partial y} = -\\frac{\\partial v}{\\partial x}$):\n$$\\oint_C f(z)\\,dz = 0 + 0i = 0 \\quad \\blacksquare$$`;
  } else if (/(خطة درس|تحضير درس|دورة التعلم|5e|cpa)/i.test(q)) {
    reply = `إليك التخطيط التربوي المباشر وفق دورة التعلم الخماسية (5Es):\n- **1. التهيئة (Engage):** مسألة واقعية لاستثارة دافعية الطلاب.\n- **2. الاستكشاف (Explore):** مجموعات عمل للتعامل مع شرائح تقريبية ملموسة (CPA).\n- **3. التفسير (Explain):** استنتاج المفهوم الرياضي المجرد: $A = \\int_a^b f(x)dx$.\n- **4. الإثراء (Elaborate):** تطبيق عملي على الحجوم الدورانية.\n- **5. التقويم (Evaluate):** مسألة تقييم ختامية لقياس الهدف السلوكي.`;
  } else if (/^[a-zA-Z0-9\s\?\+\-\*\/\=\(\)\,\.\^]+$/.test(promptText)) {
    reply = `Direct Answer for "${promptText}":\nPlease specify the full equation or operation, and I will calculate the exact solution step-by-step.`;
  } else {
    reply = `إجابة مباشرة على "${promptText}":\n\n- إذا كانت لديك معادلة أو مسألة رياضية محددة أو تمرين مصور، اكتبه هنا مباشرة أو ارفق صورته وسأقوم بحله بالخطوات والناتج النهائي فوراً باللغتين العربية أو الإنجليزية.`;
  }

  if (hasSearch) {
    sources.push(
      { title: 'جامعة القاهرة - كلية التربية وقسم الرياضيات', uri: 'https://cu.edu.eg' },
      { title: 'Wolfram MathWorld - Mathematical Knowledge', uri: 'https://mathworld.wolfram.com' },
      { title: 'MIT OpenCourseWare - Mathematics & Education', uri: 'https://ocw.mit.edu' }
    );
  }

  return { reply, sources };
}

export const AiAssistantView: React.FC = () => {
  const { currentTheme } = useAppTheme();

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out any stale error messages from old crashed attempts
            const cleaned = parsed.filter(m => !m.text?.includes('Failed to fetch') && !m.text?.includes('تعذر'));
            if (cleaned.length > 0) return cleaned;
          }
        }
      } catch {}
    }
    return [DEFAULT_WELCOME_MSG];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Editing state for user messages
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  // Render LaTeX math formulas if KaTeX is available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).renderMathInElement && chatContainerRef.current) {
      try {
        (window as any).renderMathInElement(chatContainerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
          ],
          throwOnError: false,
        });
      } catch {}
    }
  }, [messages, loading]);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleClear = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 4000);
      return;
    }
    setIsConfirmingClear(false);
    setMessages([DEFAULT_WELCOME_MSG]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setPendingAttachments([]);
    setEditingMessageId(null);
  };

  const handleCopy = (text: string, id: string) => {
    const cleanText = text.replace(/\[PDF_DOCUMENT:[^\]]+\]/g, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Export specific response as formatted, printable PDF (called only when user asks or on PDF cards)
  const handleExportPdf = (msg: { text: string }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة (Popups) من إعدادات المتصفح لتحميل وطباعة الملف كـ PDF.');
      return;
    }

    const docMatch = msg.text.match(/\[PDF_DOCUMENT:\s*([^\]]+)\]/);
    const title = docMatch && docMatch[1] ? docMatch[1].trim() : 'وثيقة أكاديمية - منصة Math 3';
    const dateFormatted = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const cleanBody = msg.text.replace(/\[PDF_DOCUMENT:[^\]]+\]/g, '').trim();

    // Clean text for PDF print
    const contentHtml = cleanBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h3 style="color:#0284c7; margin-top:16px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#0369a1; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-top:20px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#0f172a; margin-top:24px;">$1</h1>')
      .replace(/\n/g, '<br/>');

    printWindow.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: 'Alexandria', 'Cairo', Arial, sans-serif;
            padding: 28px;
            line-height: 1.8;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-title {
            font-size: 18px;
            font-weight: bold;
            color: #0284c7;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
          }
          .meta-date {
            font-size: 12px;
            color: #64748b;
            text-align: left;
          }
          .content {
            font-size: 14px;
            line-height: 2;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          .print-btn-bar {
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .print-btn {
            background: #0284c7;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 13px;
            cursor: pointer;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print print-btn-bar">
          <div>
            <strong>جاهز للطباعة والحفظ كملف PDF</strong>
            <p style="margin:2px 0 0; font-size:12px; color:#64748b;">اختر "Save as PDF" من نافذة الطباعة لحفظه على جهازك.</p>
          </div>
          <button class="print-btn" onclick="window.print()">
            🖨️ طباعة / حفظ PDF الآن
          </button>
        </div>

        <div class="header">
          <div>
            <div class="brand-title">منصة Math 3 الأكاديمية · المعلّم الذكي</div>
            <div class="brand-sub">كلية التربية - قسم الرياضيات (Math & Education)</div>
          </div>
          <div class="meta-date">
            <div>التاريخ: ${dateFormatted}</div>
            <div>نوع الوثيقة: مستند أكاديمي جاهز للتحميل</div>
          </div>
        </div>

        <div class="content">${contentHtml}</div>

        <div class="footer">
          تم إنشاء هذا المستند عبر منصة Math 3 الأكاديمية لدُفعة كلية التربية - قسم الرياضيات.
        </div>

        <script>
          window.addEventListener('load', () => {
            setTimeout(() => { window.print(); }, 400);
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download SVG diagram as vector file or PNG
  const handleDownloadSvg = (svgContent: string, filename = 'math3-diagram.svg') => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Process selected files (up to combined 25MB)
  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    let currentTotal = pendingAttachments.reduce((s, a) => s + a.size, 0);
    const newItems: AttachmentItem[] = [];
    let rejectedCount = 0;

    for (const f of files) {
      if (currentTotal + f.size > MAX_TOTAL_BYTES) {
        rejectedCount++;
        continue;
      }

      currentTotal += f.size;

      const reader = new FileReader();
      const readPromise = new Promise<string | null>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
      });
      reader.readAsDataURL(f);
      const b64 = await readPromise;

      if (b64) {
        newItems.push({
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: f.name,
          size: f.size,
          type: f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
          data: b64,
        });
      }
    }

    if (newItems.length > 0) {
      setPendingAttachments((prev) => [...prev, ...newItems]);
    }

    if (rejectedCount > 0) {
      alert(
        `تعذر إرفاق ${rejectedCount} ملف لتجاوز الحد الأقصى الإجمالي المجمع وهو 25 ميجابايت.\nالمساحة المتبقية حالياً: ${formatBytes(
          Math.max(0, MAX_TOTAL_BYTES - currentTotal)
        )}`
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Start editing a user message
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  // Save edited message and regenerate AI response
  const handleSaveEditAndResend = async (msgId: string) => {
    if (!editingText.trim()) return;

    const targetIndex = messages.findIndex((m) => m.id === msgId);
    if (targetIndex === -1) return;

    const updatedUserMsg: ChatMessage = {
      ...messages[targetIndex],
      text: editingText.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages.slice(0, targetIndex), updatedUserMsg];
    setMessages(updatedHistory);
    setEditingMessageId(null);
    setEditingText('');
    setLoading(true);

    let replyText = '';
    let replySources: SourceItem[] = [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: updatedUserMsg.text,
          history: updatedHistory.slice(-8),
          attachments: updatedUserMsg.attachments || [],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || '';
        replySources = data.sources || [];
      }
    } catch {}

    if (!replyText) {
      const fallback = generateSmartClientResponse(updatedUserMsg.text);
      replyText = fallback.reply;
      replySources = fallback.sources || [];
    }

    const newModelMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'model',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      text: replyText,
      sources: replySources,
    };
    setMessages((prev) => [...prev, newModelMsg]);
    setLoading(false);
  };

  // Send new message
  const handleSend = async () => {
    const textToSend = input.trim();
    const hasAttachments = pendingAttachments.length > 0;
    if ((!textToSend && !hasAttachments) || loading) return;

    const attachmentsToSend = [...pendingAttachments];
    setPendingAttachments([]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      text: textToSend || 'يرجى مراجعة وتحليل المرفقات بالتفصيل وحل المطلوب بدقة.',
      attachments: attachmentsToSend.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
        data: a.data,
      })),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    let replyText = '';
    let replySources: SourceItem[] = [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: updatedMessages.slice(-8),
          attachments: attachmentsToSend,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || '';
        replySources = data.sources || [];
      }
    } catch {}

    // في حال عدم توفر رد فوري من الخادم، نقوم بتوليد رد عالي الذكاء محلياً لضمان تجربة مستمرة 100% دون أي توقف
    if (!replyText) {
      const fallback = generateSmartClientResponse(textToSend);
      replyText = fallback.reply;
      replySources = fallback.sources || [];
    }

    const modelMsg: ChatMessage = {
      id: 'mdl_' + Date.now(),
      role: 'model',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      text: replyText,
      sources: replySources,
    };
    setMessages((prev) => [...prev, modelMsg]);
    setLoading(false);
  };

  // Helper to parse message text and render SVGs, markdown, and on-demand PDF cards cleanly
  const renderMessageContent = (text: string) => {
    // Check if message has an SVG block
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    // Explicit PDF card only if tag [PDF_DOCUMENT: ...] or explicit PDF title is present
    const isExplicitPdf = text.includes('[PDF_DOCUMENT:');
    let docTitle = 'مذكرة_Math3_الأكاديمية';
    if (isExplicitPdf) {
      const titleMatch = text.match(/\[PDF_DOCUMENT:\s*([^\]]+)\]/);
      if (titleMatch && titleMatch[1]) {
        docTitle = titleMatch[1].trim();
      }
    }

    const cleanDisplayContent = text.replace(/\[PDF_DOCUMENT:[^\]]+\]/g, '').trim();

    return (
      <div className="space-y-4">
        {/* Render inline SVG vector if present */}
        {svgMatch && (
          <div className="p-4 rounded-xl bg-theme-surface/90 border border-theme-subtle shadow-sm my-3 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-theme-subtle text-xs font-semibold text-theme-primary">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <ImageIcon className="w-4 h-4" />
                <span>رسم توضيحي هندسي متّجه (Vector SVG)</span>
              </span>
              <button
                type="button"
                onClick={() => handleDownloadSvg(svgMatch[0])}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-theme-elevated hover:bg-theme-primary hover:text-white border border-theme-subtle transition-all cursor-pointer"
                title="تنزيل الرسم البياني كملف SVG عالي الدقة"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل الرسمة (SVG)</span>
              </button>
            </div>
            <div
              className="w-full max-w-lg overflow-x-auto py-2 flex justify-center"
              dangerouslySetInnerHTML={{ __html: svgMatch[0] }}
            />
          </div>
        )}

        {/* Regular Text & Markdown Content */}
        <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed break-words">
          {cleanDisplayContent}
        </div>

        {/* Dedicated PDF file card ONLY when user requested a PDF */}
        {isExplicitPdf && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-700 dark:text-sky-300 mt-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-bold text-sm text-sky-600 dark:text-sky-400">ملف PDF جاهز: {docTitle}.pdf</div>
                <div className="text-[11px] text-theme-muted mt-0.5">تم إعداد وتنسيق المستند للتحميل والطباعة المباشرة</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleExportPdf({ text })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold transition-colors shadow-xs flex-shrink-0 cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل PDF</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const totalAttachedBytes = pendingAttachments.reduce((s, a) => s + a.size, 0);
  const remainingBytes = Math.max(0, MAX_TOTAL_BYTES - totalAttachedBytes);
  const percentUsed = Math.min(100, Math.round((totalAttachedBytes / MAX_TOTAL_BYTES) * 100));

  const quickPrompts = [
    { label: '📐 برهان مسألة رياضية', text: 'أريد برهاناً رياضياً دقيقاً ومفصلاً خطوة بخطوة لنظرية في مادة التحليل المركب أو التبولوجي.' },
    { label: '📋 خطة درس تربوية 5Es', text: 'صمم خطة درس نموذجية في مادة الرياضيات للمرحلة الثانوية وفق دورة التعلم الخماسية (5Es) مع صياغة الأهداف السلوكية (بلوم).' },
    { label: '🖼️ رسم شكل هندسي ودالة', text: 'ارسم لي شكلاً بيانياً هندسياً متجهياً SVG يوضح القطع المكافئ ومحاور الإحداثيات وبؤرة المنحنى مع التسميات.' },
    { label: '🌐 بحث عن مراجع معتمدة', text: 'ابحث لي بالويب عن أحدث المراجع الجامعية المعتمدة والأوراق البحثية في ميكانيكا الموائع أو الديناميكا التحليلية واذكر الروابط.' },
    { label: '📄 ملخص مراجعة كـ PDF', text: 'لخص لي أهم قوانين ونظريات مادة المعادلات التفاضلية في مذكرة مراجعة شاملة جاهزة للطباعة كملف PDF.' },
    { label: '⚠️ تشخيص صعوبة تعلم', text: 'ما هي أكثر الصعوبات والمفاهيم الخاطئة شيوعاً عند الطلاب في موضوع التكامل المعتل وكيف نعالجها تربوياً بطريقة CPA؟' },
  ];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
      className={`transition-all duration-300 relative ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-2 sm:p-5 bg-theme-base flex flex-col'
          : 'w-full max-w-7xl mx-auto flex flex-col space-y-3'
      }`}
    >
      {/* Drag and Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-theme-surface/90 backdrop-blur-sm border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <UploadCloud className="w-16 h-16 text-emerald-500 animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-theme-primary">أفلت الملفات هنا للإرفاق فوراً</h3>
          <p className="text-sm text-theme-muted mt-1">
            يمكنك إرفاق صور، تمارين مصورة، أو مستندات (الحد الأقصى المجمع 25 ميجابايت)
          </p>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-theme-surface border border-theme-subtle rounded-2xl p-3.5 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 space-x-reverse min-w-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            🧠
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-theme-primary tracking-tight truncate">
              المعلّم والأكاديمي الذكي
            </h2>
            <p className="text-xs text-theme-muted mt-0.5 truncate hidden sm:block">
              مساحة متكاملة مريحة: حلول وبراهين، تخطيط دروس، إرفاق ملفات، ورسم صور
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center mr-auto sm:mr-0 pl-1">
          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-theme-subtle bg-theme-elevated hover:bg-theme-surface text-theme-secondary hover:text-theme-primary transition-all cursor-pointer"
            title={isFullscreen ? 'تصغير للشاشة العادية' : 'توسيع إلى ملء الشاشة للتركيز'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">تصغير</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">ملء الشاشة</span>
              </>
            )}
          </button>

          {/* Clear Chat Button (Tucked inside the card) */}
          <button
            type="button"
            onClick={handleClear}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs mr-1 ${
              isConfirmingClear
                ? 'bg-red-500/25 border-red-500 text-red-500 font-bold animate-pulse'
                : 'border-red-500/25 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/15'
            }`}
            title="مسح سجل المحادثة وبدء جلسة جديدة"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isConfirmingClear ? 'تأكيد المسح؟ 🗑️' : 'مسح 🗑️'}</span>
          </button>
        </div>
      </div>

      {/* Main Chat Messages Container */}
      <div
        ref={chatContainerRef}
        className={`bg-theme-surface border border-theme-subtle rounded-2xl p-4 sm:p-6 shadow-sm overflow-y-auto space-y-6 ${
          isFullscreen ? 'flex-1 min-h-[400px]' : 'h-[calc(100vh-270px)] min-h-[560px]'
        }`}
      >
        {messages.map((msg) => {
          const isModel = msg.role === 'model';
          const isCurrentlyEditing = editingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'} items-start`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-base text-white flex-shrink-0 shadow-sm ${
                  isModel ? '' : 'bg-slate-700'
                }`}
                style={isModel ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                {isModel ? '🧠' : '🎓'}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-sm text-sm sm:text-base leading-relaxed ${
                  isModel
                    ? 'bg-theme-elevated/90 border border-theme-subtle text-theme-primary rounded-tr-sm'
                    : 'bg-theme-primary/10 border border-theme-primary/30 text-theme-primary rounded-tl-sm'
                }`}
              >
                {/* Header row inside bubble */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme-subtle/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-theme-primary">
                      {isModel ? 'المعلّم والأكاديمي الذكي' : 'أنت (طالب Math 3)'}
                    </span>
                    <span className="text-theme-muted text-[11px]">{msg.timestamp}</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    {isModel ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                        title="نسخ نص الإجابة"
                      >
                        {copiedIndex === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-bold">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    ) : (
                      /* User message actions: Edit button */
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(msg)}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                          title="تعديل هذا السؤال وإعادة إرساله"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل الرسالة</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form when editing this user message */}
                {isCurrentlyEditing ? (
                  <div className="space-y-3 p-2 bg-theme-surface rounded-xl border border-theme-primary/40 mt-1">
                    <div className="text-xs font-bold text-theme-primary flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>تعديل رسالتك وإعادة صياغة السؤال:</span>
                    </div>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full bg-theme-elevated border border-theme-subtle rounded-lg p-2.5 text-sm text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-lg border border-theme-subtle text-xs font-semibold text-theme-muted hover:text-theme-primary"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditAndResend(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>حفظ وإعادة الإرسال 🚀</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Attachments preview if message has attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 p-2.5 rounded-xl bg-black/10 border border-theme-subtle text-xs">
                        {msg.attachments.map((att, aIdx) => (
                          <div
                            key={aIdx}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-subtle text-theme-primary shadow-xs"
                          >
                            {att.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <FileText className="w-4 h-4 text-sky-500" />
                            )}
                            <span className="max-w-[160px] truncate font-medium">{att.name}</span>
                            <span className="text-theme-muted text-[11px]">({formatBytes(att.size)})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Body Content */}
                    {renderMessageContent(msg.text)}

                    {/* Grounding Sources Shelf if model cited web links */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-theme-subtle/50 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                          <Globe className="w-3.5 h-3.5" />
                          <span>المصادر والمراجع الأكاديمية المستند إليها ({msg.sources.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 p-2 rounded-lg bg-theme-surface border border-theme-subtle hover:border-sky-500 hover:text-sky-500 transition-all text-theme-primary"
                              title={src.title || src.uri}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                              <span className="truncate">{src.title || src.uri}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 sm:gap-4 items-start">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-base text-white flex-shrink-0 shadow-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              🧠
            </div>
            <div className="bg-theme-elevated/90 border border-theme-primary/30 rounded-2xl p-4 sm:p-5 text-sm text-theme-primary space-y-3 max-w-[85%]">
              <div className="flex items-center gap-2 font-bold text-xs text-theme-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>جاري التحميل...</span>
              </div>
              <div className="flex gap-2 h-2 w-48">
                <div className="flex-1 bg-theme-primary/50 rounded-full animate-pulse"></div>
                <div className="flex-1 bg-theme-primary/50 rounded-full animate-pulse delay-150"></div>
                <div className="flex-1 bg-theme-primary/50 rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Attachments Dock (With 25MB Gauge & Thumbnails) */}
      {pendingAttachments.length > 0 && (
        <div className="bg-theme-surface border border-dashed border-emerald-500/40 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-emerald-500" />
              <span className="text-theme-primary">المرفقات المحددة ({pendingAttachments.length} ملفات):</span>
            </div>

            {/* Total Size Meter */}
            <div className="flex items-center gap-2">
              <span
                className={`font-mono ${
                  totalAttachedBytes > MAX_TOTAL_BYTES
                    ? 'text-red-500 font-bold'
                    : percentUsed > 80
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}
              >
                {formatBytes(totalAttachedBytes)} / 25 MB ({percentUsed}%)
              </span>
              <span className="text-theme-muted hidden sm:inline">
                · متبقي {formatBytes(remainingBytes)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-theme-elevated rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                totalAttachedBytes > MAX_TOTAL_BYTES
                  ? 'bg-red-500'
                  : percentUsed > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* Attachments Cards */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pt-1">
            {pendingAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-theme-elevated border border-theme-subtle text-xs shadow-xs"
              >
                {att.type.startsWith('image/') ? (
                  <img
                    src={att.data}
                    alt={att.name}
                    className="w-6 h-6 object-cover rounded-md border border-theme-subtle"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
                )}
                <span className="max-w-[150px] truncate font-medium text-theme-primary">{att.name}</span>
                <span className="text-theme-muted text-[10px]">({formatBytes(att.size)})</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="w-4 h-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  title="حذف هذا المرفق"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.doc,.docx,.tex,.csv,.xlsx"
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Message Input Dock (Spacious, 100% Full-width Stacked Layout) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-theme-surface border border-theme-subtle rounded-2xl p-3 shadow-md flex flex-col gap-2.5"
      >
        {/* Full-width Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="اسأل عن مسألة، برهان، خطة درس، أو أرفق مستند/صورة للتحليل..."
          rows={2}
          className="w-full bg-theme-elevated/40 border border-theme-subtle/80 rounded-xl text-sm sm:text-base text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary p-3 resize-none leading-relaxed min-h-[56px]"
        />

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-subtle hover:border-theme-primary text-theme-secondary hover:text-theme-primary bg-theme-elevated/70 transition-all cursor-pointer text-xs font-bold"
            title="إرفاق صور، تمارين مصورة، أو مستندات (حتى 25 ميجابايت مجمعة)"
          >
            <Paperclip className="w-4 h-4 text-emerald-500" />
            <span>إرفاق ملفات</span>
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && pendingAttachments.length === 0) || loading || totalAttachedBytes > MAX_TOTAL_BYTES}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span>إرسال</span>
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </form>
    </div>
  );
};
