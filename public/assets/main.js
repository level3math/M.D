import { registerServiceWorker, startRealtimeNotifications } from "./notifications.js";
import { readTelegramReturn, onTelegramAuth, showProfile } from "./app.js";
import { initTheme, loadThemeFromDb } from "./theme.js";

// تطبيق المظهر المعتمد فوراً من الكاش والمحلي
initTheme();

window.onTelegramAuth = onTelegramAuth;
var tgReturn = readTelegramReturn();
if (tgReturn) onTelegramAuth(tgReturn); else showProfile();

registerServiceWorker();
startRealtimeNotifications();
