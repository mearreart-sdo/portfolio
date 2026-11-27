(() => {
  const body = document.body;
  if (!body.classList.contains("page-home")) return;

  const home = document.querySelector("[data-home]");
  const layer = document.querySelector("[data-product-layer]");
  const card = document.querySelector(".product-card");
  const visual = home && home.querySelector(".visual");
  if (!home || !layer || !card || !visual) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TARGET = "sfera.html?from=home";
  const DURATION = 500;
  const HERO_SRC = new URL("assets/sfera-hero.png", location.href).href;
  const FLIP_KEY = "portfolio_hero_flip";

  let progress = 0;
  let intent = 0;
  let intentTimer = 0;
  let navigating = false;
  let prefetched = false;
  let raf = 0;
  const smooth = 0.22;

  const current = { up: 0, social: 0, visual: 0 };
  const target = { up: 0, social: 0, visual: 0 };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const almost = (a, b) => Math.abs(a - b) < 0.002;

  const mapRange = (value, inMin, inMax) => {
    if (inMax === inMin) return 0;
    return clamp((value - inMin) / (inMax - inMin), 0, 1);
  };

  const prefetch = () => {
    if (prefetched) return;
    prefetched = true;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = TARGET;
    document.head.appendChild(link);

    const img = new Image();
    img.src = HERO_SRC;
  };

  const syncTargets = (p) => {
    target.up = ease(mapRange(p, 0, 0.7));
    target.social = ease(mapRange(p, 0.06, 0.75));
    target.visual = ease(mapRange(p, 0.05, 1));
    if (p > 0.1) prefetch();
  };

  const paint = () => {
    const k = navigating ? 0.35 : smooth;
    current.up += (target.up - current.up) * k;
    current.social += (target.social - current.social) * k;
    current.visual += (target.visual - current.visual) * k;

    if (almost(current.up, target.up)) current.up = target.up;
    if (almost(current.social, target.social)) current.social = target.social;
    if (almost(current.visual, target.visual)) current.visual = target.visual;

    home.style.setProperty("--leave-up", current.up.toFixed(4));
    home.style.setProperty("--leave-social", current.social.toFixed(4));
    home.style.setProperty("--leave-visual", current.visual.toFixed(4));

    const moving =
      current.up !== target.up ||
      current.social !== target.social ||
      current.visual !== target.visual;

    if (moving) {
      raf = requestAnimationFrame(paint);
    } else {
      raf = 0;
    }
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(paint);
  };

  const setProgress = (next) => {
    progress = clamp(next, 0, 1);
    syncTargets(progress);
    kick();
  };

  const saveFlipAndGo = () => {
    const rect = visual.getBoundingClientRect();
    try {
      sessionStorage.setItem(
        FLIP_KEY,
        JSON.stringify({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          src: HERO_SRC,
        })
      );
    } catch (e) {}

    location.replace(TARGET);
  };

  const ac = new AbortController();

  const goToProduct = () => {
    if (navigating) return;
    navigating = true;
    ac.abort();
    card.style.pointerEvents = "none";
    prefetch();

    progress = 1;
    syncTargets(1);
    body.classList.add("is-transitioning", "is-leaving-home");
    kick();

    if (reduceMotion) {
      saveFlipAndGo();
      return;
    }

    // Let copy leave a beat, then hand the same hero frame to the project page.
    const started = performance.now();
    const finishWhenReady = (now) => {
      kick();
      const moved = current.visual >= 0.92;
      const timedOut = now - started >= DURATION;
      if (moved || timedOut) {
        saveFlipAndGo();
        return;
      }
      requestAnimationFrame(finishWhenReady);
    };
    requestAnimationFrame(finishWhenReady);
  };

  const onWheel = (event) => {
    if (navigating) {
      event.preventDefault();
      return;
    }

    if (reduceMotion) {
      if (event.deltaY > 0) goToProduct();
      return;
    }

    event.preventDefault();

    const delta = event.deltaY;
    if (delta > 0) {
      intent += 1;
      window.clearTimeout(intentTimer);
      intentTimer = window.setTimeout(() => {
        intent = 0;
      }, 400);

      const step = delta > 80 ? 0.11 : 0.07;
      const boost = intent >= 3 ? 1.25 : 1;
      setProgress(progress + step * boost);

      if (progress >= 0.98) {
        goToProduct();
      }
      return;
    }

    intent = Math.max(0, intent - 1);
    setProgress(progress - 0.05);
  };

  const onKey = (event) => {
    if (navigating) return;
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      setProgress(progress + 0.16);
      if (progress >= 0.98) goToProduct();
    }
    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      setProgress(progress - 0.14);
    }
  };

  const onCardClick = (event) => {
    event.preventDefault();
    goToProduct();
  };

  let touchY = null;
  const onTouchStart = (event) => {
    touchY = event.touches[0].clientY;
  };
  const onTouchMove = (event) => {
    if (touchY == null || navigating) return;
    const y = event.touches[0].clientY;
    const dy = touchY - y;
    touchY = y;
    if (Math.abs(dy) < 2) return;
    event.preventDefault();
    setProgress(progress + dy * 0.0022);
    if (progress >= 0.98) goToProduct();
  };

  const signal = ac.signal;
  card.addEventListener("click", onCardClick, { signal });
  window.addEventListener("wheel", onWheel, { passive: false, signal });
  window.addEventListener("keydown", onKey, { signal });
  window.addEventListener("touchstart", onTouchStart, { passive: true, signal });
  window.addEventListener("touchmove", onTouchMove, { passive: false, signal });

  syncTargets(0);
  kick();
})();
