(() => {
  if (document.body?.dataset?.page !== "home") {
    return;
  }

  const tiles = Array.from(document.querySelectorAll(".home-photo-collage .collage-tile"));
  if (!tiles.length) {
    return;
  }

  const lightbox = document.createElement("div");
  lightbox.className = "home-lightbox";
  lightbox.innerHTML = `
    <button class="home-lightbox-close" type="button" aria-label="Close viewer">x</button>
    <div class="home-lightbox-content" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <figure class="home-lightbox-frame">
        <img class="home-lightbox-image" alt="" />
      </figure>
      <aside class="home-lightbox-panel">
        <h2 class="home-lightbox-title"></h2>
        <p class="home-lightbox-desc"></p>
      </aside>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector(".home-lightbox-image");
  const lightboxTitle = lightbox.querySelector(".home-lightbox-title");
  const lightboxDesc = lightbox.querySelector(".home-lightbox-desc");
  const closeBtn = lightbox.querySelector(".home-lightbox-close");
  const frame = lightbox.querySelector(".home-lightbox-frame");
  const panel = lightbox.querySelector(".home-lightbox-panel");
  const content = lightbox.querySelector(".home-lightbox-content");

  function finishClose() {
    lightbox.classList.remove("closing");
  }

  function closeLightbox() {
    if (!lightbox.classList.contains("open")) {
      return;
    }

    // Release page blur immediately so it eases out in parallel with the modal fade.
    document.body.classList.remove("home-lightbox-open");
    lightbox.classList.remove("open");
    lightbox.classList.add("closing");
  }

  function alignPanelToImage() {
    if (!frame || !panel || !lightboxImg || !content) {
      return;
    }

    const frameRect = frame.getBoundingClientRect();
    const imgRect = lightboxImg.getBoundingClientRect();
    if (!imgRect.width || !imgRect.height) {
      return;
    }

    const offsetLeft = Math.max(0, imgRect.left - frameRect.left + 40);
    const imgWidth = Math.max(120, imgRect.width);
    panel.style.marginLeft = `${offsetLeft}px`;
    panel.style.width = `${imgWidth}px`;
    content.style.setProperty("--lightbox-image-left", `${offsetLeft}px`);
    content.style.setProperty("--lightbox-image-width", `${imgWidth}px`);
  }

  function openFromTile(tile) {
    const img = tile.querySelector("img");
    if (!img || !lightboxImg || !lightboxTitle || !lightboxDesc) {
      return;
    }

    let fullSrc = img.currentSrc || img.src;
    try {
      const url = new URL(fullSrc, window.location.href);
      if (url.hostname.includes("unsplash.com")) {
        url.searchParams.set("auto", "format");
        url.searchParams.set("fit", "max");
        url.searchParams.set("w", "2200");
        url.searchParams.set("q", "90");
        fullSrc = url.toString();
      }
    } catch {
      // Keep source as-is if URL parsing fails.
    }

    lightboxImg.src = fullSrc;
    lightboxImg.alt = img.alt || "";
    lightboxTitle.textContent = tile.dataset.photoTitle || img.alt || "Photo";
    lightboxDesc.textContent = tile.dataset.photoDesc || "A photo from this collage set.";

    lightbox.classList.remove("closing");
    document.body.classList.add("home-lightbox-open");
    lightbox.classList.add("open");
    requestAnimationFrame(alignPanelToImage);
  }

  tiles.forEach((tile) => {
    tile.tabIndex = 0;
    tile.setAttribute("role", "button");
    tile.setAttribute("aria-label", "Open photo");

    tile.addEventListener("click", () => openFromTile(tile));
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFromTile(tile);
      }
    });
  });

  closeBtn?.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", closeLightbox);
  lightboxImg?.addEventListener("click", (event) => event.stopPropagation());
  lightboxImg?.addEventListener("load", alignPanelToImage);
  lightbox.addEventListener("transitionend", (event) => {
    if (
      event.target === lightbox &&
      event.propertyName === "opacity" &&
      !lightbox.classList.contains("open")
    ) {
      finishClose();
    }
  });
  window.addEventListener("resize", () => {
    if (lightbox.classList.contains("open")) {
      requestAnimationFrame(alignPanelToImage);
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("open")) {
      closeLightbox();
    }
  });
})();
