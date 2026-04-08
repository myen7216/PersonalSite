(() => {
  const stage = document.getElementById("guitar-stage");
  const label = document.getElementById("guitar-label");
  const audioStatus = document.getElementById("guitar-audio-status");

  if (!stage || !label || !audioStatus) {
    return;
  }

  const slides = Array.from(stage.querySelectorAll(".guitar-slide"));
  const videos = slides.map((slide) => slide.querySelector("video"));
  const total = slides.length;
  const ONE_EIGHTH_INCH_PX = 12;

  if (total === 0) {
    return;
  }

  videos.forEach((video) => {
    if (!video) {
      return;
    }
    video.muted = true;
    video.controls = false;
  });

  slides.forEach((slide, idx) => {
    const video = videos[idx];
    const title = slide.dataset.title || "video";
    const placeholder = document.createElement("div");
    placeholder.className = "guitar-video-placeholder";
    placeholder.textContent = title;
    slide.appendChild(placeholder);

    if (!video) {
      return;
    }

    const markReady = () => {
      slide.classList.add("video-ready");
    };

    const markError = () => {
      slide.classList.remove("video-ready");
      slide.classList.add("video-error");
    };

    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("error", markError);
  });

  const state = {
    index: 0,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startAt: 0,
    dragX: 0,
    audioMuted: false
  };

  let badgeTimer = null;
  let badgeTrackRaf = null;
  let badgeTrackUntil = 0;
  let labelTrackRaf = null;
  let labelTrackUntil = 0;

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
    const firstSlide = slides[0];
    if (!firstSlide) {
      return 320;
    }
    const slideWidth = firstSlide.getBoundingClientRect().width || 320;
    return slideWidth + ONE_EIGHTH_INCH_PX;
  }

  function pauseAll() {
    videos.forEach((video) => {
      if (!video) {
        return;
      }
      video.pause();
    });
  }

  function updateAudioStatus() {
    const icon = state.audioMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
    const text = state.audioMuted ? "muted" : "sound on";
    audioStatus.textContent = icon;
    audioStatus.setAttribute("aria-label", text);
    audioStatus.title = text;
  }

  function positionLabel() {
    const activeSlide = slides[state.index];
    if (!activeSlide) {
      return;
    }

    const carousel = stage.closest(".guitar-carousel");
    if (!carousel) {
      return;
    }

    const carouselRect = carousel.getBoundingClientRect();
    const slideRect = activeSlide.getBoundingClientRect();
    const centerX = slideRect.left - carouselRect.left + slideRect.width / 2;
    const topY = slideRect.bottom - carouselRect.top + 10;
    const title = activeSlide.dataset.title || "Guitar Video";

    label.textContent = title;
    label.style.left = `${centerX}px`;
    label.style.top = `${topY}px`;
  }

  function positionAudioStatus() {
    const activeSlide = slides[state.index];
    if (!activeSlide) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const slideRect = activeSlide.getBoundingClientRect();
    const inset = 14;
    const x = slideRect.right - stageRect.left - audioStatus.offsetWidth - inset;
    const y = slideRect.bottom - stageRect.top - audioStatus.offsetHeight - inset;
    const maxX = stage.clientWidth - audioStatus.offsetWidth - inset;
    const maxY = stage.clientHeight - audioStatus.offsetHeight - inset;
    const clampedX = Math.min(Math.max(inset, x), Math.max(inset, maxX));
    const clampedY = Math.min(Math.max(inset, y), Math.max(inset, maxY));

    audioStatus.style.left = `${clampedX}px`;
    audioStatus.style.top = `${clampedY}px`;
  }

  function stopBadgeTracking() {
    if (badgeTrackRaf) {
      cancelAnimationFrame(badgeTrackRaf);
      badgeTrackRaf = null;
    }
  }

  function stopLabelTracking() {
    if (labelTrackRaf) {
      cancelAnimationFrame(labelTrackRaf);
      labelTrackRaf = null;
    }
  }

  function trackLabelPosition(now) {
    positionLabel();
    if (state.dragging || now < labelTrackUntil) {
      labelTrackRaf = requestAnimationFrame(trackLabelPosition);
      return;
    }
    labelTrackRaf = null;
  }

  function startLabelTracking(durationMs = 650) {
    labelTrackUntil = performance.now() + durationMs;
    if (!labelTrackRaf) {
      labelTrackRaf = requestAnimationFrame(trackLabelPosition);
    }
  }

  function trackBadgePosition(now) {
    positionAudioStatus();
    if (now < badgeTrackUntil && audioStatus.style.opacity !== "0") {
      badgeTrackRaf = requestAnimationFrame(trackBadgePosition);
      return;
    }
    badgeTrackRaf = null;
  }

  function startBadgeTracking(durationMs = 820) {
    badgeTrackUntil = performance.now() + durationMs;
    if (!badgeTrackRaf) {
      badgeTrackRaf = requestAnimationFrame(trackBadgePosition);
    }
  }

  function hideAudioStatus() {
    audioStatus.style.opacity = "0";
    stopBadgeTracking();
  }

  function showAudioStatus() {
    audioStatus.style.opacity = "1";
    positionAudioStatus();
    startBadgeTracking(900);
  }

  function scheduleBadgeLockShow(delayMs) {
    if (badgeTimer) {
      clearTimeout(badgeTimer);
    }
    badgeTimer = setTimeout(() => {
      showAudioStatus();
      badgeTimer = null;
    }, delayMs);
  }

  function syncPlayback() {
    videos.forEach((video, idx) => {
      if (!video) {
        return;
      }
      if (idx === state.index) {
        video.muted = state.audioMuted;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
      }
    });
    updateAudioStatus();
  }

  function toggleActiveAudio() {
    const video = videos[state.index];
    if (!video) {
      return;
    }
    state.audioMuted = !state.audioMuted;
    video.muted = state.audioMuted;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
    updateAudioStatus();
  }

  function render(withTransition) {
    const step = getStepDistance();
    const dragRatio = state.dragX / step;

    slides.forEach((slide, idx) => {
      const rel = shortestRelative(idx, state.index, total) + dragRatio;
      const absRel = Math.abs(rel);
      const isCenter = absRel < 0.5;
      const x = rel * step;
      const z = 100 - Math.round(absRel * 10);

      slide.classList.toggle("is-center", isCenter);
      slide.style.transition = withTransition
        ? "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 420ms ease"
        : "none";
      slide.style.transform = `translate(calc(-50% + ${x}px), -50%)`;
      slide.style.opacity = "1";
      slide.style.zIndex = `${z}`;
    });

    positionLabel();
    startLabelTracking(withTransition ? 700 : 200);

    if (!state.dragging) {
      requestAnimationFrame(positionAudioStatus);
    }
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
    hideAudioStatus();
    render(true);
    scheduleBadgeLockShow(430);
    setTimeout(syncPlayback, 430);
  }

  function onPointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startAt = performance.now();
    state.dragX = 0;
    stage.classList.add("is-dragging");
    hideAudioStatus();
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

    const isTap =
      Math.abs(state.dragX) < 12 &&
      Math.abs(event.clientY - state.startY) < 12 &&
      performance.now() - state.startAt < 320;

    state.dragging = false;
    state.pointerId = null;
    stage.classList.remove("is-dragging");

    if (isTap) {
      state.dragX = 0;
      render(true);
      toggleActiveAudio();
      showAudioStatus();
      return;
    }

    snapFromDrag();
  }

  stage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", () => {
    render(false);
    startLabelTracking(700);
    requestAnimationFrame(showAudioStatus);
  });

  render(false);
  syncPlayback();
  updateAudioStatus();
  requestAnimationFrame(showAudioStatus);
})();
