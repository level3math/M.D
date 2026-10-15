
(function () {
  var ua = navigator.userAgent || "";
  window.IS_IOS = /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  window.__showError = function (msg) {
    var b = document.getElementById("errbox");
    if (!b) {
      b = document.createElement("div");
      b.id = "errbox";
      b.setAttribute("style", "position:fixed;top:0;left:0;right:0;z-index:99999;padding:10px 12px;background:#7a1f12;color:#fff;font:14px/1.5 -apple-system,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;white-space:pre-wrap;word-break:break-word");
      b.onclick = function () { if (b.parentNode) b.parentNode.removeChild(b); };
      (document.body || document.documentElement).appendChild(b);
    }
    var base = "حدثت مشكلة في تشغيل الصفحة. برجاء المحاولة مرة أخرى بعد قليل.";
    b.textContent = /[?&]debug/.test(location.search) ? base + "\n" + msg : base;
  };
  window.addEventListener("error", function (e) {
    var t = e && e.target;
    if (t && t !== window) {
      if (t.tagName === "SCRIPT") window.__showError("failed to load: " + (t.src || ""));
      return;
    }
    var m = (e && e.message) ? e.message : "unknown error";
    var w = (e && e.filename) ? " @" + String(e.filename).split("/").pop() + ":" + e.lineno : "";
    window.__showError(m + w);
  }, true);
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    window.__showError("rejected: " + (r && r.message ? r.message : String(r)));
  });
  setTimeout(function () {
    var l = document.getElementById("loading");
    if (l && !l.hidden) window.__showError("slow load (20s). check the connection and try again");
  }, 20000);
})();
