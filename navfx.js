(() => {
  const current = document.body?.dataset?.page || "";
  const dockLinks = Array.from(document.querySelectorAll(".site-dock a[href]"));
  const KEY = "personal-site-nav-transition";

  const LABELS = {
    home: "michael. y",
    guitar: "michael. y's guitar videos",
    projects: "michael. y's pinterest board"
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeText(el, text, stepMs) {
    el.textContent = "";
    for (const ch of text) {
      el.textContent += ch;
      // eslint-disable-next-line no-await-in-loop
      await sleep(stepMs);
    }
  }

  async function deleteThenType(el, fromText, toText, totalMs) {
    el.textContent = fromText;
    const deleteMs = Math.max(26, Math.floor(totalMs * 0.45 / Math.max(1, fromText.length)));
    const typeMs = Math.max(26, Math.floor(totalMs * 0.45 / Math.max(1, toText.length)));

    while (el.textContent.length > 0) {
      el.textContent = el.textContent.slice(0, -1);
      // eslint-disable-next-line no-await-in-loop
      await sleep(deleteMs);
    }

    await sleep(160);
    await typeText(el, toText, typeMs);
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
    const fromLabel = LABELS[from] || "";

    if (from === "home") {
      textEl.textContent = toLabel;
      return;
    }

    if (
      (from === "guitar" && to === "projects") ||
      (from === "projects" && to === "guitar")
    ) {
      titleRoot.classList.add("is-typing");
      await deleteThenType(textEl, fromLabel, toLabel, 2600);
      titleRoot.classList.remove("is-typing");
      return;
    }

    textEl.textContent = toLabel;
  }

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
