import { readTelegramReturn, onTelegramAuth, showProfile } from "./app.js";
import { initTheme } from "./theme.js";

initTheme();
window.onTelegramAuth = onTelegramAuth;
var tgReturn = readTelegramReturn();
if (tgReturn) onTelegramAuth(tgReturn); else showProfile();
