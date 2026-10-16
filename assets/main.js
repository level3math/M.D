import { readTelegramReturn, onTelegramAuth, showProfile } from "./app.js";
import { initTheme, loadThemeFromDb } from "./theme.js";

// تطبيق المظهر المعتمد فوراً من الكاش والمحلي
initTheme();

// سحب المظهر الرسمي المنشور من Supabase فوراً للجميع (زوار، مجهولين، أو مسجلين)
loadThemeFromDb();

window.onTelegramAuth = onTelegramAuth;
var tgReturn = readTelegramReturn();
if (tgReturn) onTelegramAuth(tgReturn); else showProfile();
