(() => {
  const stage = document.getElementById("guitar-stage");
  const label = document.getElementById("guitar-label");

  if (!stage || !label) {
    return;
  }

  const slides = Array.from(stage.querySelectorAll(".guitar-slide"));
  const videos = slides.map((slide) => slide.querySelector("video"));
  const total = slides.length;

  if (total === 0) {
    return;
  }

  const state = {
    index: 0,
    dragging: false,
    pointerId: null,
    startX: 0,
    dragX: 0
  };

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function shortestRelative(i, active, length) {
    let rel = mod(i - active, length);
    if (rel > length / 2) {
      rel -= length;
    }
    return rel;
  }

  function getStepDistance() {
    return Math.max(280, Math.round(stage.clientWidth * 0.55));
  }

  function pauseAll() {
    videos.forEach((video) => {
      if (!video) {
        return;
      }
      video.pause();
    });
  }

  function syncPlayback() {
    videos.forEach((video, idx) => {
      if (!video) {
        return;
      }
      if (idx === state.index) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
      }
    });
  }

  function render(withTransition) {
    const step = getStepDistance();
    const dragRatio = state.dragX / step;

    slides.forEach((slide, idx) => {
      const rel = shortestRelative(idx, state.index, total) + dragRatio;
      const absRel = Math.abs(rel);
      const isCenter = absRel < 0.5;
      const x = rel * step;
      const scale = Math.max(0.7, 1 - absRel * 0.18);
      const opacity = Math.max(0.32, 1 - absRel * 0.24);
      const z = 100 - Math.round(absRel * 12);

      slide.classList.toggle("is-center", isCenter);
      slide.style.transition = withTransition ? "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 420ms ease" : "none";
      slide.style.transform = `translate(calc(-50% + ${x}px), -50%) scale(${scale})`;
      slide.style.opacity = `${opacity}`;
      slide.style.zIndex = `${z}`;
    });

    const title = slides[state.index]?.dataset.title || "Guitar Video";
    label.textContent = title;
  }

  function snapFromDrag() {
    const step = getStepDistance();
    const threshold = Math.min(180, step * 0.18);
    const delta = state.dragX;
    let shift = 0;

    if (Math.abs(delta) > threshold) {
      shift = Math.round(-delta / step);
      if (shift === 0) {
        shift = delta < 0 ? 1 : -1;
      }
    }

    state.index = mod(state.index + shift, total);
    state.dragX = 0;
    render(true);
    setTimeout(syncPlayback, 430);
  }

  function onPointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.dragX = 0;
    stage.classList.add("is-dragging");
    pauseAll();
    if (typeof stage.setPointerCapture === "function") {
      try {
        stage.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture issues.
      }
    }
  }

  function onPointerMove(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) {
      return;
    }
    state.dragX = event.clientX - state.startX;
    render(false);
  }

  function onPointerUp(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) {
      return;
    }
    state.dragging = false;
    state.pointerId = null;
    stage.classList.remove("is-dragging");
    snapFromDrag();
  }

  stage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", () => render(false));

  render(false);
  syncPlayback();
})();
