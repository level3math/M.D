import { registerServiceWorker, startRealtimeNotifications } from "./notifications.js";
import { readTelegramReturn, onTelegramAuth, showProfile } from "./app.js";
import { initTheme, loadThemeFromDb } from "./theme.js";
import { mountLoginThemeSelector } from "./modern_app.js";

// تطبيق المظهر المعتمد فوراً من الكاش والمحلي
initTheme();
try {
  mountLoginThemeSelector();
} catch (e) {}

window.onTelegramAuth = onTelegramAuth;
var tgReturn = readTelegramReturn();
if (tgReturn) onTelegramAuth(tgReturn); else showProfile();

registerServiceWorker();
startRealtimeNotifications();
