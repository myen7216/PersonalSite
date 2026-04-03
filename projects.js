(() => {
  const embeds = document.getElementById("pinterest-embeds");
  const status = document.getElementById("pinterest-status");

  if (!embeds) {
    return;
  }

  const PINTEREST_USERNAME = "myen7216";

  function ensurePinterestScript() {
    const existing = document.querySelector("script[data-pinterest-loader='true']");
    if (existing) {
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.dataset.pinterestLoader = "true";
    document.body.appendChild(script);
  }

  function rebuildEmbeds() {
    if (window.PinUtils && typeof window.PinUtils.build === "function") {
      window.PinUtils.build();
    }
  }

  function render() {
    const username = (PINTEREST_USERNAME || "").trim().replace(/^@/, "");
    embeds.innerHTML = "";
    ensurePinterestScript();

    if (!username) {
      if (status) {
        status.textContent = "Set your Pinterest username in projects.js.";
      }
      return;
    }

    if (status) {
      status.textContent = "";
    }
    const userAnchor = document.createElement("a");
    userAnchor.dataset.pinDo = "embedUser";
    userAnchor.dataset.pinScaleWidth = String(Math.max(1550, Math.floor(window.innerWidth - 24)));
    userAnchor.dataset.pinScaleHeight = "1650";
    userAnchor.href = `https://www.pinterest.com/${username}/`;
    userAnchor.textContent = `@${username} on Pinterest`;
    embeds.appendChild(userAnchor);

    setTimeout(rebuildEmbeds, 250);
  }

  render();
  window.addEventListener("resize", () => {
    clearTimeout(window.__pinterestResizeDebounce);
    window.__pinterestResizeDebounce = setTimeout(render, 180);
  });
})();
