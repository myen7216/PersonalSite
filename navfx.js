(() => {
  const current = document.body?.dataset?.page || "";
  let dockLinks = Array.from(document.querySelectorAll(".site-dock a[href]"));
  const KEY = "personal-site-nav-transition";

  const LABELS = {
    home: "michael yen",
    guitar: "michael's guitar videos",
    projects: "michael's pinterest board"
  };

  function pageFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      const file = url.pathname.split("/").pop() || "";
      if (file === "index.html" || file === "") {
        return "home";
      }
      if (file === "guitar.html") {
        return "guitar";
      }
      if (file === "projects.html") {
        return "projects";
      }
      return "";
    } catch {
      return "";
    }
  }

  function centerActiveDockLink() {
    const dock = document.querySelector(".site-dock");
    if (!dock) {
      return;
    }

    const links = Array.from(dock.querySelectorAll("a[href]"));
    if (links.length < 3) {
      return;
    }

    const active = links.find((link) => link.classList.contains("active"));
    if (!active) {
      return;
    }

    const targetIndex = Math.floor(links.length / 2);
    const activeIndex = links.indexOf(active);
    if (activeIndex === targetIndex) {
      return;
    }

    active.remove();
    const currentLinks = Array.from(dock.querySelectorAll("a[href]"));
    if (targetIndex >= currentLinks.length) {
      dock.appendChild(active);
      return;
    }
    dock.insertBefore(active, currentLinks[targetIndex]);
  }

  function randomChar() {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    return chars[Math.floor(Math.random() * chars.length)];
  }

  async function scrambleToText(el, text, totalMs) {
    const finalChars = Array.from(text);
    const stepMs = Math.max(32, Math.floor(totalMs / Math.max(1, finalChars.length + 7)));
    const finalTime = stepMs * finalChars.length + 260;

    const scrambleSeed = finalChars.map((ch) => (/[a-z]/i.test(ch) ? randomChar() : ch));
    el.textContent = scrambleSeed.join("");

    await new Promise((resolve) => {
      const start = performance.now();

      function render(now) {
        const elapsed = now - start;
        const next = finalChars.map((ch, idx) => {
          if (!/[a-z]/i.test(ch)) {
            return ch;
          }

          const revealAt = idx * stepMs;
          if (elapsed >= revealAt) {
            return ch;
          }

          return randomChar();
        });

        el.textContent = next.join("");

        if (elapsed < finalTime) {
          requestAnimationFrame(render);
          return;
        }

        el.textContent = text;
        resolve();
      }

      requestAnimationFrame(render);
    });
  }

  async function runFx(from, to) {
    if (!from || !to || to === "home") {
      return;
    }

    const titleRoot = document.getElementById("page-corner-title");
    const textEl = titleRoot?.querySelector(".page-corner-title-text");
    if (!titleRoot || !textEl) {
      return;
    }

    const toLabel = LABELS[to] || titleRoot.dataset.pageTitle || "";

    if (to === "guitar" || to === "projects") {
      await scrambleToText(textEl, toLabel, 1400);
      return;
    }

    textEl.textContent = toLabel;
  }

  centerActiveDockLink();
  dockLinks = Array.from(document.querySelectorAll(".site-dock a[href]"));

  dockLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const to = pageFromHref(link.getAttribute("href") || "");
      if (!to || to === current) {
        return;
      }
      const payload = {
        from: current,
        to,
        ts: Date.now()
      };
      sessionStorage.setItem(KEY, JSON.stringify(payload));
    });
  });

  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return;
    }

    const payload = JSON.parse(raw);
    sessionStorage.removeItem(KEY);
    if (
      payload &&
      payload.to === current &&
      typeof payload.ts === "number" &&
      Date.now() - payload.ts < 12000
    ) {
      runFx(payload.from, payload.to);
    }
  } catch {
    // Ignore invalid transition payloads.
  }
})();
