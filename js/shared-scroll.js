(() => {
  const body = document.body;
  if (!body.classList.contains("page-shell")) return;

  const shell = document.querySelector("[data-shell]");
  const homeStage = document.querySelector("[data-home-stage]");
  const project = document.querySelector("[data-project]");
  const slotHome = document.querySelector("[data-slot-home]");
  const slotProject = document.querySelector("[data-slot-project]");
  const shared = document.querySelector("[data-shared-visual]");
  if (!shell || !homeStage || !project || !slotHome || !slotProject || !shared) return;

  if (shared.parentElement !== body) body.appendChild(shared);
  shared.classList.remove("is-docked");
  shared.style.top = "0px";
  shared.style.left = "0px";
  shared.style.right = "auto";
  shared.style.bottom = "auto";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HASH = "#sfera";
  const FOLLOW = 0.22;

  let progress = 0;
  let display = 0;
  let intent = 0;
  let intentTimer = 0;
  let raf = 0;
  let inProject = false;
  let leftProjectTop = false;

  // Geometry locked for the whole ride — never remeasure at the end (that was the jump).
  let fromBox = null;
  let toBox = null;
  let pinned = false;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const almost = (a, b) => Math.abs(a - b) < 0.0005;
  const mapRange = (value, inMin, inMax) => {
    if (inMax === inMin) return 0;
    return clamp((value - inMin) / (inMax - inMin), 0, 1);
  };

  const readRect = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  };

  const applySharedBox = (next) => {
    // Round to device pixels to avoid subpixel shimmer at rest.
    const dpr = window.devicePixelRatio || 1;
    const snap = (v) => Math.round(v * dpr) / dpr;
    shared.style.width = snap(next.width) + "px";
    shared.style.height = snap(next.height) + "px";
    shared.style.transform =
      "translate3d(" + snap(next.left) + "px, " + snap(next.top) + "px, 0)";
  };

  const lerpBox = (a, b, t) => ({
    top: a.top + (b.top - a.top) * t,
    left: a.left + (b.left - a.left) * t,
    width: a.width + (b.width - a.width) * t,
    height: a.height + (b.height - a.height) * t,
  });

  const lockRide = () => {
    fromBox = readRect(slotHome);
    toBox = readRect(slotProject);
    pinned = true;
  };

  const unlockRide = () => {
    pinned = false;
    fromBox = null;
    toBox = null;
  };

  const paintShared = (p) => {
    // While riding, only use locked endpoints — one continuous path.
    const from = pinned && fromBox ? fromBox : readRect(slotHome);
    const to = pinned && toBox ? toBox : readRect(slotProject);
    if (!from.width || !to.width) return;
    applySharedBox(lerpBox(from, to, easeOut(clamp(p, 0, 1))));
  };

  const syncHistory = (on) => {
    if (!history.replaceState) return;
    const next = on ? location.pathname + location.search + HASH : location.pathname + location.search;
    if (location.pathname + location.search + location.hash !== next) {
      history.replaceState(null, "", next);
    }
  };

  const setProjectMode = (on) => {
    if (inProject === on) return;
    inProject = on;
    body.classList.toggle("is-mode-home", !on);
    body.classList.toggle("is-mode-project", on);
    homeStage.setAttribute("aria-hidden", on ? "true" : "false");
    project.setAttribute("aria-hidden", on ? "false" : "true");
    leftProjectTop = false;
    intent = 0;
    if (!on) project.scrollTop = 0;
    syncHistory(on);
  };

  const paintChrome = (p) => {
    shell.style.setProperty("--leave-up", easeOut(mapRange(p, 0, 0.55)).toFixed(4));
    shell.style.setProperty("--leave-social", easeOut(mapRange(p, 0.04, 0.6)).toFixed(4));
    shell.style.setProperty("--arrive-head", easeOut(mapRange(p, 0.48, 0.88)).toFixed(4));
    shell.style.setProperty("--arrive-rest", easeOut(mapRange(p, 0.78, 1)).toFixed(4));
  };

  const settleProject = () => {
    // Final frame stays on locked toBox — do not remeasure.
    display = 1;
    progress = 1;
    paintChrome(1);
    if (toBox) applySharedBox(toBox);
    else paintShared(1);
    setProjectMode(true);
    // Keep toBox as the resting pin at scrollTop=0; unlock only after user scrolls.
  };

  const settleHome = () => {
    display = 0;
    progress = 0;
    paintChrome(0);
    if (fromBox) applySharedBox(fromBox);
    else paintShared(0);
    setProjectMode(false);
    unlockRide();
  };

  const paint = () => {
    display += (progress - display) * FOLLOW;
    if (almost(display, progress)) display = progress;

    paintChrome(display);
    paintShared(display);

    if (display >= 1) {
      settleProject();
      raf = 0;
      return;
    }
    if (display <= 0 && progress <= 0) {
      settleHome();
      raf = 0;
      return;
    }

    if (!almost(display, progress)) {
      raf = requestAnimationFrame(paint);
    } else {
      raf = 0;
      if (progress >= 1) settleProject();
      else if (progress <= 0) settleHome();
    }
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(paint);
  };

  const setProgress = (next) => {
    const prev = progress;
    progress = clamp(next, 0, 1);

    if (prev < 0.001 && progress > 0.001) lockRide();
    if (prev > 0.999 && progress < 0.999) {
      project.scrollTop = 0;
      setProjectMode(false);
      lockRide();
    }
    if (!pinned && progress > 0 && progress < 1) lockRide();

    body.classList.toggle("is-transitioning", progress > 0.01 && progress < 0.99);

    if (window.SiteHeader) {
      if (progress <= 0.02) window.SiteHeader.show();
      else if (progress > prev + 0.01) window.SiteHeader.hide();
      else if (progress < prev - 0.01) window.SiteHeader.show();
    }

    kick();
  };

  const goProject = () => {
    if (!pinned) lockRide();
    setProgress(1);
  };

  const goHome = () => {
    project.scrollTop = 0;
    if (!pinned) lockRide();
    setProgress(0);
  };

  const TOP_EPS = 2;
  const atProjectTop = () => (project.scrollTop || 0) <= TOP_EPS;

  const beginExitToHome = (step) => {
    if (!atProjectTop()) return false;

    if (leftProjectTop) {
      intent += 1;
      window.clearTimeout(intentTimer);
      intentTimer = window.setTimeout(() => {
        intent = 0;
      }, 420);
      if (intent < 3) return false;
      leftProjectTop = false;
      intent = 0;
    }

    setProgress(progress - step);
    if (progress <= 0.02) goHome();
    return true;
  };

  const onWheel = (event) => {
    if (reduceMotion) {
      if (progress < 1 && event.deltaY > 0) {
        event.preventDefault();
        goProject();
      } else if (inProject && event.deltaY < 0 && atProjectTop() && !leftProjectTop) {
        event.preventDefault();
        goHome();
      }
      return;
    }

    if (inProject && progress >= 1 && display >= 1) {
      const delta = event.deltaY;
      if (delta > 0) {
        if (!atProjectTop() || project.scrollTop + delta > TOP_EPS) leftProjectTop = true;
        return;
      }
      if (!atProjectTop()) {
        leftProjectTop = true;
        return;
      }
      event.preventDefault();
      beginExitToHome(delta < -80 ? 0.1 : 0.055);
      return;
    }

    event.preventDefault();
    const delta = event.deltaY;
    if (delta > 0) {
      intent += 1;
      window.clearTimeout(intentTimer);
      intentTimer = window.setTimeout(() => {
        intent = 0;
      }, 380);
      const step = delta > 80 ? 0.085 : 0.05;
      setProgress(progress + step * (intent >= 3 ? 1.15 : 1));
      if (progress >= 0.997) goProject();
      return;
    }

    intent = Math.max(0, intent - 1);
    setProgress(progress - 0.045);
    if (progress <= 0.02) goHome();
  };

  const onKey = (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      if (progress < 1 && !inProject) {
        event.preventDefault();
        setProgress(progress + 0.12);
        if (progress >= 0.997) goProject();
      }
    }
    if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Home") {
      if (inProject) {
        if (!atProjectTop()) return;
        event.preventDefault();
        if (leftProjectTop) {
          leftProjectTop = false;
          return;
        }
        goHome();
      } else if (progress > 0 && progress < 1) {
        event.preventDefault();
        setProgress(progress - 0.12);
      }
    }
  };

  let touchY = null;
  const onTouchStart = (event) => {
    touchY = event.touches[0].clientY;
  };
  const onTouchMove = (event) => {
    if (touchY == null) return;
    const y = event.touches[0].clientY;
    const dy = touchY - y;
    touchY = y;
    if (Math.abs(dy) < 2) return;

    if (inProject && progress >= 1 && display >= 1) {
      if (dy > 0) {
        leftProjectTop = true;
        return;
      }
      if (!atProjectTop()) {
        leftProjectTop = true;
        return;
      }
      event.preventDefault();
      beginExitToHome(Math.abs(dy) * 0.0018);
      return;
    }

    event.preventDefault();
    setProgress(progress + dy * 0.0018);
    if (progress >= 0.997) goProject();
    if (progress <= 0.02) goHome();
  };

  let lastProjectY = 0;
  const onProjectScroll = () => {
    const y = project.scrollTop || 0;
    if (y > TOP_EPS) {
      leftProjectTop = true;
      // Follow the slot only after the user actually scrolls content.
      if (inProject) {
        unlockRide();
        const live = readRect(slotProject);
        if (live.width) applySharedBox(live);
      }
    } else if (inProject && toBox) {
      // Back at top — restore the same resting frame we arrived on (no snap to a new measure).
      pinned = true;
      applySharedBox(toBox);
    }

    if (window.SiteHeader && inProject) {
      const delta = y - lastProjectY;
      if (y <= 8) window.SiteHeader.show();
      else if (delta > 6) window.SiteHeader.hide();
      else if (delta < -6) window.SiteHeader.show();
    }
    lastProjectY = y;
  };

  const onResize = () => {
    if (progress > 0 && progress < 1) {
      lockRide();
      paintShared(display);
      return;
    }
    if (inProject) {
      toBox = readRect(slotProject);
      fromBox = readRect(slotHome);
      pinned = true;
      if ((project.scrollTop || 0) <= TOP_EPS && toBox) applySharedBox(toBox);
      else applySharedBox(readRect(slotProject));
      return;
    }
    unlockRide();
    paintShared(0);
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("resize", onResize);
  project.addEventListener("scroll", onProjectScroll, { passive: true });

  const startInProject =
    location.hash === HASH ||
    /(?:^\?|&)project=sfera(?:&|$)/.test(location.search);

  if (startInProject) {
    progress = 1;
    display = 1;
    lockRide();
    paintChrome(1);
    if (toBox) applySharedBox(toBox);
    setProjectMode(true);
  } else {
    progress = 0;
    display = 0;
    setProjectMode(false);
    paintChrome(0);
    paintShared(0);
  }

  window.PortfolioShell = {
    goHome,
    goProject,
  };
})();
