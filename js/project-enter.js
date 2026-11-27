(() => {
  if (!document.body.classList.contains("page-project")) return;

  const params = new URLSearchParams(location.search);
  const fromHome = params.get("from") === "home";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HOME = "index.html?from=project";
  const DURATION = 500;

  let leaving = false;
  let upIntent = 0;
  let upTimer = 0;

  const goHome = () => {
    if (leaving) return;
    leaving = true;
    document.body.classList.add("is-leaving");

    const navigate = () => {
      location.replace(HOME);
    };

    if (reduceMotion) {
      navigate();
      return;
    }

    window.setTimeout(navigate, DURATION);
  };

  const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 2;

  const onWheel = (event) => {
    if (leaving) {
      event.preventDefault();
      return;
    }

    if (event.deltaY >= 0 || !atTop()) {
      upIntent = 0;
      return;
    }

    event.preventDefault();
    upIntent += 1;
    window.clearTimeout(upTimer);
    upTimer = window.setTimeout(() => {
      upIntent = 0;
    }, 400);

    if (reduceMotion || upIntent >= 2 || event.deltaY < -40) {
      goHome();
    }
  };

  const onKey = (event) => {
    if (leaving) return;
    if (!atTop()) return;
    if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Home") {
      event.preventDefault();
      goHome();
    }
  };

  let touchY = null;
  const onTouchStart = (event) => {
    touchY = event.touches[0].clientY;
  };
  const onTouchMove = (event) => {
    if (leaving || touchY == null) return;
    const y = event.touches[0].clientY;
    const dy = y - touchY;
    touchY = y;
    if (!atTop() || dy < 8) return;
    event.preventDefault();
    goHome();
  };

  if (fromHome && history.replaceState) {
    history.replaceState(null, "", location.pathname + location.hash);
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
})();
