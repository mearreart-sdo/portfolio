(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  const finishClean = () => {
    body.classList.remove("is-page-pending");
    body.classList.add("is-page-ready", "is-page-entered");
  };

  if (reduceMotion) {
    finishClean();
    return;
  }

  // Shell page: animate home stage once; shared visual fades with CSS.
  if (body.classList.contains("page-shell")) {
    const stage = document.querySelector("[data-home-stage]");
    if (stage && !location.hash) {
      stage.classList.add("page-enter-item");
      stage.style.setProperty("--enter-delay", "0ms");
    }

    body.classList.add("is-page-pending");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.remove("is-page-pending");
        body.classList.add("is-page-ready");

        window.setTimeout(() => {
          if (stage) {
            stage.classList.remove("page-enter-item");
            stage.style.removeProperty("--enter-delay");
          }
          body.classList.add("is-page-entered");
        }, 560);
      });
    });
    return;
  }

  // Standalone pages (login / kit / legacy sfera)
  const collect = () => {
    const items = [];
    const project = document.querySelector(".page-project .project");
    if (project) {
      Array.from(project.children).forEach((el) => items.push(el));
    }
    const login = document.querySelector(".login-body .login");
    if (login) {
      Array.from(login.children).forEach((el) => items.push(el));
    }
    return items;
  };

  const items = collect();
  if (!items.length) {
    finishClean();
    return;
  }

  items.forEach((el, index) => {
    el.classList.add("page-enter-item");
    el.style.setProperty("--enter-delay", Math.min(index * 45, 360) + "ms");
  });

  body.classList.add("is-page-pending");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.remove("is-page-pending");
      body.classList.add("is-page-ready");

      window.setTimeout(() => {
        items.forEach((el) => {
          el.classList.remove("page-enter-item");
          el.style.removeProperty("--enter-delay");
        });
        body.classList.add("is-page-entered");
      }, 500 + 360 + 40);
    });
  });
})();
