(() => {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const body = document.body;
  const project = document.querySelector("[data-project]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let lastY = 0;
  let hidden = false;
  let lockedVisible = false;

  const setHidden = (next) => {
    if (lockedVisible) next = false;
    if (hidden === next) return;
    hidden = next;
    body.classList.toggle("is-header-hidden", next);
  };

  const show = () => setHidden(false);
  const hide = () => setHidden(true);

  // Expose for shared-scroll transition cues.
  window.SiteHeader = {
    show,
    hide,
    lockVisible(on) {
      lockedVisible = !!on;
      if (on) show();
    },
  };

  const onProjectScroll = () => {
    if (!body.classList.contains("is-mode-project")) {
      show();
      lastY = 0;
      return;
    }
    const y = project ? project.scrollTop || 0 : 0;
    const delta = y - lastY;
    if (y <= 8) {
      show();
    } else if (delta > 6) {
      hide();
    } else if (delta < -6) {
      show();
    }
    lastY = y;
  };

  if (project) {
    project.addEventListener("scroll", onProjectScroll, { passive: true });
  }

  // Mode changes: always reveal when returning home.
  const modeObserver = new MutationObserver(() => {
    if (body.classList.contains("is-mode-home")) {
      show();
      lastY = 0;
    }
  });
  modeObserver.observe(body, { attributes: true, attributeFilter: ["class"] });

  const homeLink = header.querySelector("[data-nav-home]");
  const projectsLink = header.querySelector("[data-nav-projects]");
  const menuBtn = header.querySelector("[data-site-menu]");

  const goProjects = () => {
    show();
    if (typeof window.PortfolioShell?.goProject === "function") {
      window.PortfolioShell.goProject();
    } else {
      location.hash = "#sfera";
    }
  };

  if (homeLink) {
    homeLink.addEventListener("click", (event) => {
      if (location.pathname.endsWith("index.html") || location.pathname.endsWith("/")) {
        event.preventDefault();
        show();
        if (typeof window.PortfolioShell?.goHome === "function") {
          window.PortfolioShell.goHome();
        } else {
          location.hash = "";
          window.scrollTo(0, 0);
        }
      }
    });
  }

  if (projectsLink) {
    projectsLink.addEventListener("click", (event) => {
      event.preventDefault();
      goProjects();
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      goProjects();
    });
  }

  if (reduceMotion) {
    body.classList.add("is-header-static");
  }

  show();
})();
