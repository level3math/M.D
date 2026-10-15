import { readTelegramReturn, onTelegramAuth, showProfile } from "./app.js";

var tgReturn = readTelegramReturn();
if (tgReturn) onTelegramAuth(tgReturn); else showProfile();
