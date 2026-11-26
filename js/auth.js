(function () {
  var cfg = window.PORTFOLIO_AUTH;
  if (!cfg) return;

  function isLoginPage() {
    return /\/login\.html?$/.test(location.pathname) || location.pathname.endsWith("/login");
  }

  function isAuthed() {
    try {
      return sessionStorage.getItem(cfg.storageKey) === cfg.hash;
    } catch (e) {
      return false;
    }
  }

  function setAuthed() {
    try {
      sessionStorage.setItem(cfg.storageKey, cfg.hash);
    } catch (e) {}
  }

  function hex(buffer) {
    var bytes = new Uint8Array(buffer);
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  function sha256(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", data).then(hex);
  }

  function reveal() {
    document.documentElement.classList.remove("auth-pending");
  }

  function requireAuth() {
    if (isLoginPage()) {
      reveal();
      return;
    }
    if (isAuthed()) {
      reveal();
      return;
    }
    var next = location.pathname + location.search + location.hash;
    var target = "login.html";
    if (next && next !== "/" && !/login\.html/.test(next)) {
      target += "?next=" + encodeURIComponent(next);
    }
    location.replace(target);
  }

  window.PortfolioAuth = {
    isAuthed: isAuthed,
    setAuthed: setAuthed,
    sha256: sha256,
    requireAuth: requireAuth,
    expectedHash: cfg.hash,
  };

  requireAuth();
})();
