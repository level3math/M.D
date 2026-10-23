# توثيق النسخة المرجعية المستقرة (Math 3 Stable Baseline v1.0.0)

## 1. التعريف والبيانات الأساسية
- **المشروع:** Math 3 (M.D - BATCH BOARD)
- **الإصدار المعتمد:** `v1.0.0-stable`
- **حزمة النشر (Deploy Package):** `deploy.zip`
- **المستودع المرجعي:** `level3math/M.D`
- **قاعدة بيانات Supabase:** `https://xwnjimsoframcqstdjfo.supabase.co`
- **حساب البوت:** `@MATHDEPARTMENT_BOT`

---

## 2. جدول البصمات الرقمية للملفات (SHA-256 Checksums)

| الملف | مسار الملف | بصمة SHA-256 |
|---|---|---|
| صفحة البداية | `index.html` | `a1fb2641fe81c2c36ba639dea292690ebf76a36018f1e37b478b39c046bf1496` |
| المنطق الرئيسي | `assets/app.js` | `b254dc12405d5f3d2f0077ff86c49663ce9c187b8e1d72bdd1cf84ef3d8515f9` |
| إعدادات Supabase | `assets/core.js` | `0f0266c1d239e7707105cb620521dda2594d18b8369bf9f4fc8e1ad713c9b03d` |
| جلب البيانات | `assets/data.js` | `c8a5dde445807488e23f9598feb2ee57ff83c3f2b4fae352e1e85ee78cfcfbd7` |
| توافق iOS | `assets/ios-compat.js` | `f3d1876ea35a5db19aeac109d5bf53b2c52f7f482fee5407e774a05dba03465a` |
| نقطة الدخول | `assets/main.js` | `5deb3fc30f7f8e1e77490c8c7f65f1707f3f28ecfa63dcc385a949b8adaf318f` |
| التنسيقات والخطوط | `assets/math3.css` | `40a00581cd26b1eb8a371e0bff96e7bab449bd3c7d6f95b90a25220d26693776` |
| المنشورات | `assets/posts.js` | `081c12af59e5391b6c06c2acee367c43296f32c68b4e91649763f48ecb508fc7` |
| إدارة الحالة | `assets/state.js` | `4149867a85cdb74a1db449470cfda700fb9d565f6710d327753f3f80c2005bbf` |
| المظهر الداكن/الفاتح | `assets/theme.js` | `65dc7726c3ea36249a5f034bba5f58601dd69e399d2446e435f001628b170c4e` |
| عناصر الواجهة | `assets/ui.js` | `d29f97e57e151d15489739d45ace38b97fcc4fb110e5d29a1ba9470a3b2d4580` |

---

## 3. خطة الرجوع الفوري (Rollback Plan)

إذا حدث أي خطأ أثناء تجربة التحديثات اللاحقة:
1. **استعادة ملفات الواجهة (Frontend Rollback):**
   - يوجد نسخة احتياطية محفوظة ومختومة داخل المجلد `.backups/stable_v1.0.0/`.
   - يمكن إعادة بناء `deploy.zip` فوراً باسترجاع تلك الملفات بدون أي مخاطرة.
2. **استعادة على GitHub:**
   - رفع ملف `deploy.zip` المحفوظ في المجلد المرجعي إلى المستودع ليعود الموقع لحالته المستقرة الحالية في أقل من دقيقة.

---

## 4. استعادة ونسخ قاعدة البيانات (Database Backup Strategy)

1. **النسخ الآلي من Supabase:**
   - توفر منصة Supabase نسخاً احتياطياً يومياً تلقائياً تحت:  
     `Project Settings -> Database -> Backups`.
2. **النسخ اليدوي للبيانات والجداول (Manual SQL Export):**
   - من لوحة تحكم Supabase ⬅️ **SQL Editor** ⬅️ تشغيل استعلام تصدير البيانات أو استخدام أداة التنزيل من شاشة **Table Editor**.
3. **النسخ الاحتياطي السريع من داخل الموقع:**
   - الموقع يحتوي على دالة مدمجة للأدمن الكامل (`downloadBackup` في `assets/app.js`) تقوم بتصدير نسخة JSON لكافة محتويات المواد والتكليفات والأقسام باسم `math3-backup-YYYY-MM-DD.json`.
