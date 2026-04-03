(() => {
  const DOG_IMAGES = {
    standing: "./assets/dog/java_standing.png",
    runningA: "./assets/dog/java_running_1.png",
    runningB: "./assets/dog/java_running_2.png",
    runningC: "./assets/dog/java_running_3.png",
    sitting: "./assets/dog/java_sitting.png",
    dragging: "./assets/dog/java_sitting.png"
  };

  const RAINBOW_COLORS = ["#ff6b6b", "#ff9f43", "#ffe66d", "#66d28f", "#5ec8ff", "#7b8cff", "#d183ff"];
  const COLORIZE_SELECTOR = "h1, h2, h3, p, a, code, button";
  const DOG_STATE_KEY = "personal-site-dog-state-v1";
  const TOY_STATE_KEY = "personal-site-dog-toys-v1";
  const BASE_BOOST_RESPAWN_MS = 34000;
  const BOOST_SPAWN_RATE_SCALE = 0.3;
  const BOOST_RESPAWN_MS = Math.round(BASE_BOOST_RESPAWN_MS / BOOST_SPAWN_RATE_SCALE);
  const POWERUP_IMAGES = {
    "boost-rainbow": "./assets/powerups/rainbow.png",
    "boost-mega": "./assets/powerups/mega.png"
  };

  const dog = document.createElement("div");
  dog.className = "dog";
  dog.innerHTML = `<img alt="Animated German Shorthaired Pointer" src="${DOG_IMAGES.standing}">`;
  document.body.appendChild(dog);

  const trailLayer = document.createElement("div");
  trailLayer.className = "dog-trail-layer";
  document.body.appendChild(trailLayer);

  const toyLayer = document.createElement("div");
  toyLayer.className = "dog-toy-layer";
  document.body.appendChild(toyLayer);

  const toys = [];
  const dogImg = dog.querySelector("img");
  const drag = {
    active: false,
    pointerId: null,
    offsetRatioX: 0.5,
    offsetRatioY: 0.5
  };

  const state = {
    x: Math.max(20, window.innerWidth * 0.25),
    y: Math.max(100, window.innerHeight * 0.6),
    targetX: window.innerWidth * 0.75,
    targetY: window.innerHeight * 0.72,
    speed: 2.3,
    mode: "walk",
    sitUntil: 0,
    runFrameTimer: 0,
    runFrameIndex: 0,
    stateTimer: 0,
    lastTime: performance.now(),
    colorCheckTimer: 0,
    dustTimer: 0,
    scale: 1,
    rainbowUntil: 0,
    megaUntil: 0,
    initializedFromSaved: false,
    saveTickAt: 0
  };

  const margin = 12;

  function readSavedDogState(now) {
    try {
      const raw = sessionStorage.getItem(DOG_STATE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
        return null;
      }
      if (typeof parsed.savedAt !== "number" || now - parsed.savedAt > 60_000) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function applySavedDogState(nowWall, nowPerf) {
    const saved = readSavedDogState(nowWall);
    if (!saved) {
      return;
    }

    state.x = saved.x;
    state.y = saved.y;
    state.targetX = typeof saved.targetX === "number" ? saved.targetX : state.targetX;
    state.targetY = typeof saved.targetY === "number" ? saved.targetY : state.targetY;
    state.mode = typeof saved.mode === "string" ? saved.mode : state.mode;
    if (typeof saved.runFrameIndex === "number") {
      state.runFrameIndex = saved.runFrameIndex % 3;
    } else {
      state.runFrameIndex = saved.runFrameFlip ? 1 : 0;
    }
    state.scale = typeof saved.scale === "number" ? saved.scale : state.scale;
    state.rainbowUntil = nowPerf + Math.max(0, Number(saved.rainbowRemainingMs || 0));
    state.megaUntil = nowPerf + Math.max(0, Number(saved.megaRemainingMs || 0));
    state.sitUntil = nowPerf + Math.max(0, Number(saved.sitRemainingMs || 0));
    state.initializedFromSaved = true;
  }

  function saveDogState(nowWall, nowPerf) {
    const payload = {
      x: state.x,
      y: state.y,
      targetX: state.targetX,
      targetY: state.targetY,
      mode: state.mode === "drag" ? "walk" : state.mode,
      runFrameIndex: state.runFrameIndex,
      scale: state.scale,
      rainbowRemainingMs: Math.max(0, state.rainbowUntil - nowPerf),
      megaRemainingMs: Math.max(0, state.megaUntil - nowPerf),
      sitRemainingMs: Math.max(0, state.sitUntil - nowPerf),
      savedAt: nowWall
    };
    try {
      sessionStorage.setItem(DOG_STATE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures so movement is never blocked.
    }
  }

  function readSavedToyState(nowPerf) {
    try {
      const raw = sessionStorage.getItem(TOY_STATE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return null;
      }
      return parsed.map((item) => ({
        type: item.type,
        active: !!item.active,
        x: Number(item.x || 0),
        y: Number(item.y || 0),
        nextSpawnAt: nowPerf + Math.max(0, Number(item.nextSpawnRemainingMs || 0))
      }));
    } catch {
      return null;
    }
  }

  function saveToyState(nowPerf) {
    const payload = toys.map((toy) => ({
      type: toy.type,
      active: toy.active,
      x: toy.x,
      y: toy.y,
      nextSpawnRemainingMs: Math.max(0, toy.nextSpawnAt - nowPerf)
    }));
    try {
      sessionStorage.setItem(TOY_STATE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures so movement is never blocked.
    }
  }

  function randomRainbowColor() {
    return RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
  }

  function intersects(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function getNoGoRects() {
    return Array.from(document.querySelectorAll(".dog-no-go")).map((el) => el.getBoundingClientRect());
  }

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function getDogVisualBounds() {
    const scale = Math.max(1, state.scale);
    const visualWidth = dog.offsetWidth * scale;
    const visualHeight = dog.offsetHeight * scale;
    const left = state.x - (visualWidth - dog.offsetWidth) / 2;
    const top = state.y - (visualHeight - dog.offsetHeight) / 2;
    return {
      left,
      top,
      right: left + visualWidth,
      bottom: top + visualHeight
    };
  }

  function repelFromNoGoZones() {
    const rects = getNoGoRects();
    if (rects.length === 0) {
      return;
    }

    let bounds = getDogVisualBounds();
    rects.forEach((zone) => {
      if (!intersects(bounds, zone)) {
        return;
      }

      const overlapLeft = bounds.right - zone.left;
      const overlapRight = zone.right - bounds.left;
      const overlapTop = bounds.bottom - zone.top;
      const overlapBottom = zone.bottom - bounds.top;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) {
        state.x -= overlapLeft + 2;
      } else if (minOverlap === overlapRight) {
        state.x += overlapRight + 2;
      } else if (minOverlap === overlapTop) {
        state.y -= overlapTop + 2;
      } else {
        state.y += overlapBottom + 2;
      }

      clampTarget();
      bounds = getDogVisualBounds();
    });
  }

  function makeToy(type, label, fallbackText) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `dog-toy dog-${type}`;
    el.dataset.toyType = type;
    el.setAttribute("aria-label", label);
    const imagePath = POWERUP_IMAGES[type];
    if (imagePath) {
      const img = document.createElement("img");
      img.className = "dog-toy-image";
      img.alt = label;
      img.src = imagePath;
      img.addEventListener("error", () => {
        img.remove();
        const span = document.createElement("span");
        span.className = "dog-toy-fallback";
        span.textContent = fallbackText;
        el.appendChild(span);
      });
      el.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "dog-toy-fallback";
      span.textContent = fallbackText;
      el.appendChild(span);
    }
    toyLayer.appendChild(el);

    const toy = {
      type,
      el,
      active: true,
      x: 0,
      y: 0,
      nextSpawnAt: 0
    };
    toys.push(toy);
    placeToy(toy);
  }

  function placeToy(toy) {
    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;
    toy.x = 24 + Math.random() * Math.max(100, maxX - 36);
    toy.y = 110 + Math.random() * Math.max(100, maxY - 140);
    toy.el.style.left = `${toy.x}px`;
    toy.el.style.top = `${toy.y}px`;
  }

  function setupToys() {
    const savedToys = readSavedToyState(performance.now());
    makeToy("boost-rainbow", "Rainbow boost", "R+");
    makeToy("boost-mega", "Mega mushroom boost", "M+");

    if (!savedToys) {
      return;
    }

    toys.forEach((toy) => {
      const saved = savedToys.find((entry) => entry.type === toy.type);
      if (!saved) {
        return;
      }
      toy.active = saved.active;
      toy.nextSpawnAt = saved.nextSpawnAt;
      toy.x = saved.x;
      toy.y = saved.y;
      toy.el.style.left = `${toy.x}px`;
      toy.el.style.top = `${toy.y}px`;
      if (!toy.active) {
        toy.el.classList.add("consumed");
      } else {
        toy.el.classList.remove("consumed");
      }
    });
  }

  function wrapElementText(el) {
    if (!el || el.dataset.dogColorized === "true") {
      return;
    }
    if (el.classList && el.classList.contains("text-char")) {
      return;
    }
    if (el.closest(".dog, .dog-trail-layer, .dog-toy-layer")) {
      return;
    }

    let hasChanges = false;
    const nodes = Array.from(el.childNodes);
    nodes.forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent || !/\S/.test(node.textContent)) {
        return;
      }

      const frag = document.createDocumentFragment();
      for (const ch of node.textContent) {
        if (ch === " ") {
          frag.appendChild(document.createTextNode(ch));
        } else {
          const span = document.createElement("span");
          span.className = "text-char";
          span.textContent = ch;
          frag.appendChild(span);
        }
      }

      node.replaceWith(frag);
      hasChanges = true;
    });

    if (hasChanges) {
      el.dataset.dogColorized = "true";
    }
  }

  function wrapTextForColoring(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if (root.classList && root.classList.contains("text-char")) {
      return;
    }
    if (root.matches(COLORIZE_SELECTOR)) {
      wrapElementText(root);
    }
    root.querySelectorAll(COLORIZE_SELECTOR).forEach(wrapElementText);
  }

  function setupDynamicTextColorization() {
    wrapTextForColoring(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            wrapTextForColoring(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function checkTextTouches(now) {
    if (now < state.colorCheckTimer) {
      return;
    }
    state.colorCheckTimer = now + 120;

    const dogRect = dog.getBoundingClientRect();
    const noseArea = {
      left: dogRect.left + 22,
      right: dogRect.right - 22,
      top: dogRect.top + 15,
      bottom: dogRect.bottom - 10
    };

    document.querySelectorAll(".text-char").forEach((char) => {
      const rect = char.getBoundingClientRect();
      if (!intersects(noseArea, rect)) {
        return;
      }

      const nextAllowed = Number(char.dataset.nextColorTime || "0");
      if (now < nextAllowed) {
        return;
      }

      if (!char.dataset.baseColor) {
        char.dataset.baseColor = getComputedStyle(char).color;
      }
      char.style.color = randomRainbowColor();
      char.style.textShadow = "0 0 0.2rem rgba(255, 255, 255, 0.55)";
      char.dataset.nextColorTime = String(now + 250);
      if (char._dogColorResetTimer) {
        clearTimeout(char._dogColorResetTimer);
      }
      char._dogColorResetTimer = setTimeout(() => {
        char.style.color = char.dataset.baseColor || "";
        char.style.textShadow = "";
      }, 5000);
    });
  }

  function activatePowerUp(type, now) {
    if (type === "boost-rainbow") {
      state.rainbowUntil = now + 30000;
      dog.classList.add("dog-rainbow");
      return;
    }

    if (type === "boost-mega") {
      state.megaUntil = now + 30000;
      state.scale = 4;
      dog.classList.add("dog-mega");
    }
  }

  function hasActivePowerUp(now) {
    return state.rainbowUntil > now || state.megaUntil > now;
  }

  function checkToyTouches(now) {
    const dogRect = dog.getBoundingClientRect();
    const stepArea = {
      left: dogRect.left + 16,
      right: dogRect.right - 16,
      top: dogRect.top + 18,
      bottom: dogRect.bottom - 10
    };

    toys.forEach((toy) => {
      if (!toy.active) {
        if (now >= toy.nextSpawnAt) {
          toy.active = true;
          toy.el.classList.remove("consumed");
          placeToy(toy);
        }
        return;
      }

      const rect = toy.el.getBoundingClientRect();
      if (!intersects(stepArea, rect)) {
        return;
      }

      toy.el.classList.add("hit");
      setTimeout(() => toy.el.classList.remove("hit"), 280);

      if (toy.type.startsWith("boost-")) {
        if (hasActivePowerUp(now)) {
          return;
        }
        activatePowerUp(toy.type, now);
        toy.active = false;
        toy.nextSpawnAt = now + BOOST_RESPAWN_MS;
        toy.el.classList.add("consumed");
        return;
      }

      placeToy(toy);
    });
  }

  function updatePowerState(now) {
    if (state.rainbowUntil > now) {
      dog.classList.add("dog-rainbow");
    } else {
      dog.classList.remove("dog-rainbow");
    }

    if (state.megaUntil > now) {
      state.scale = 4;
      dog.classList.add("dog-mega");
    } else {
      state.scale += (1 - state.scale) * 0.08;
      dog.classList.remove("dog-mega");
    }
  }

  function spawnDust(now, facingLeft) {
    if (state.mode !== "walk" || now < state.dustTimer) {
      return;
    }
    state.dustTimer = now + 85 + Math.random() * 30;

    const particle = document.createElement("span");
    particle.className = "dog-dust";
    if (state.rainbowUntil > now) {
      particle.classList.add("rainbow");
      particle.style.background = randomRainbowColor();
    }

    const scale = Math.max(1, state.scale);
    const visualWidth = dog.offsetWidth * scale;
    const visualHeight = dog.offsetHeight * scale;
    const visualLeft = state.x - (visualWidth - dog.offsetWidth) / 2;
    const visualTop = state.y - (visualHeight - dog.offsetHeight) / 2;
    const size = (5 + Math.random() * 7) * Math.min(2.5, 0.9 + scale * 0.35);
    const offsetX = facingLeft ? visualWidth - 18 : 18;
    const baseX = visualLeft + offsetX + (Math.random() * 14 - 7);
    const baseY = visualTop + visualHeight - 24 + (Math.random() * 10 - 5);
    const driftX = (facingLeft ? 1 : -1) * (8 + Math.random() * 10);
    const driftY = -(5 + Math.random() * 9);

    particle.style.left = `${baseX}px`;
    particle.style.top = `${baseY}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.setProperty("--drift-x", `${driftX}px`);
    particle.style.setProperty("--drift-y", `${driftY}px`);

    trailLayer.appendChild(particle);
    setTimeout(() => particle.remove(), 720);
  }

  function clampTarget() {
    const maxX = window.innerWidth - dog.offsetWidth - margin;
    const maxY = window.innerHeight - dog.offsetHeight - margin;
    state.x = Math.min(Math.max(margin, state.x), Math.max(margin, maxX));
    state.y = Math.min(Math.max(margin, state.y), Math.max(margin, maxY));
  }

  function chooseNewTarget() {
    const w = window.innerWidth - dog.offsetWidth - margin;
    const h = window.innerHeight - dog.offsetHeight - margin;
    const zones = getNoGoRects();
    for (let i = 0; i < 20; i += 1) {
      const candidateX = margin + Math.random() * Math.max(60, w - margin);
      const candidateY = Math.max(80, margin + Math.random() * Math.max(80, h - margin));
      const inNoGo = zones.some((zone) => pointInRect(candidateX, candidateY, zone));
      if (!inNoGo) {
        state.targetX = candidateX;
        state.targetY = candidateY;
        return;
      }
    }
    state.targetX = margin + Math.random() * Math.max(60, w - margin);
    state.targetY = Math.max(80, margin + Math.random() * Math.max(80, h - margin));
  }

  function setImageForState() {
    if (state.mode === "drag") {
      dogImg.src = DOG_IMAGES.dragging || DOG_IMAGES.standing;
      return;
    }
    if (state.mode === "sit") {
      dogImg.src = DOG_IMAGES.sitting;
      return;
    }
    if (state.mode === "idle") {
      dogImg.src = DOG_IMAGES.standing;
      return;
    }
    const runFrames = [DOG_IMAGES.runningA, DOG_IMAGES.runningB, DOG_IMAGES.runningC || DOG_IMAGES.runningB];
    dogImg.src = runFrames[state.runFrameIndex] || DOG_IMAGES.runningA;
  }

  function startDrag(event) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const rect = dog.getBoundingClientRect();
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.offsetRatioX = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
    drag.offsetRatioY = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    drag.offsetRatioX = Math.min(Math.max(drag.offsetRatioX, 0), 1);
    drag.offsetRatioY = Math.min(Math.max(drag.offsetRatioY, 0), 1);
    state.mode = "drag";
    dog.classList.add("dog-dragging");
    if (typeof dog.setPointerCapture === "function") {
      try {
        dog.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture failures.
      }
    }
  }

  function moveDrag(event) {
    if (!drag.active || event.pointerId !== drag.pointerId) {
      return;
    }

    const scale = Math.max(1, state.scale);
    const visualWidth = dog.offsetWidth * scale;
    const visualHeight = dog.offsetHeight * scale;
    const extraX = (visualWidth - dog.offsetWidth) / 2;
    const extraY = (visualHeight - dog.offsetHeight) / 2;
    const visualLeft = event.clientX - drag.offsetRatioX * visualWidth;
    const visualTop = event.clientY - drag.offsetRatioY * visualHeight;
    state.x = visualLeft + extraX;
    state.y = visualTop + extraY;

    const minX = margin + extraX;
    const maxX = window.innerWidth - dog.offsetWidth - margin - extraX;
    const minY = margin + extraY;
    const maxY = window.innerHeight - dog.offsetHeight - margin - extraY;
    state.x = Math.min(Math.max(minX, state.x), Math.max(minX, maxX));
    state.y = Math.min(Math.max(minY, state.y), Math.max(minY, maxY));

    state.targetX = state.x + (event.movementX < 0 ? -40 : 40);
    state.targetY = state.y;
    repelFromNoGoZones();
  }

  function endDrag(event) {
    if (!drag.active || event.pointerId !== drag.pointerId) {
      return;
    }

    drag.active = false;
    drag.pointerId = null;
    dog.classList.remove("dog-dragging");
    state.mode = "walk";
    chooseNewTarget();
  }

  function update(now) {
    const dt = Math.min(40, now - state.lastTime);
    state.lastTime = now;
    state.stateTimer += dt;
    let movedThisFrame = false;

    if (state.mode === "drag") {
      movedThisFrame = false;
    } else if (state.mode === "sit") {
      if (now >= state.sitUntil) {
        state.mode = "walk";
        chooseNewTarget();
      }
    } else if (state.mode === "idle") {
      if (state.stateTimer > 1200 + Math.random() * 1200) {
        state.mode = "walk";
        state.stateTimer = 0;
        chooseNewTarget();
      }
    } else {
      const dx = state.targetX - state.x;
      const dy = state.targetY - state.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8) {
        const r = Math.random();
        if (r < 0.42) {
          state.mode = "sit";
          state.sitUntil = now + 1500 + Math.random() * 2200;
        } else if (r < 0.75) {
          state.mode = "idle";
          state.stateTimer = 0;
        } else {
          chooseNewTarget();
        }
      } else {
        const move = state.speed * (dt / 10);
        state.x += (dx / dist) * move;
        state.y += (dy / dist) * move;
        movedThisFrame = true;

        state.runFrameTimer += dt;
        if (state.runFrameTimer > 190) {
          state.runFrameTimer = 0;
          state.runFrameIndex = (state.runFrameIndex + 1) % 3;
        }
      }
    }

    updatePowerState(now);
    setImageForState();
    clampTarget();
    repelFromNoGoZones();

    const facingLeft = state.targetX < state.x ? -1 : 1;
    dog.style.left = `${state.x}px`;
    dog.style.top = `${state.y}px`;
    dog.style.setProperty("--dog-facing", `${facingLeft}`);
    dog.style.setProperty("--dog-scale", `${state.scale}`);
    dog.classList.toggle("dog-sitting", state.mode === "sit");

    if (movedThisFrame) {
      spawnDust(now, facingLeft < 0);
    }
    checkTextTouches(now);
    checkToyTouches(now);

    if (now >= state.saveTickAt) {
      saveDogState(Date.now(), now);
      saveToyState(now);
      state.saveTickAt = now + 220;
    }

    requestAnimationFrame(update);
  }

  applySavedDogState(Date.now(), performance.now());
  setupToys();
  setupDynamicTextColorization();
  window.addEventListener("resize", () => {
    clampTarget();
    toys.forEach((toy) => {
      if (toy.active) {
        placeToy(toy);
      }
    });
  });
  window.addEventListener("pagehide", () => {
    const nowWall = Date.now();
    const nowPerf = performance.now();
    saveDogState(nowWall, nowPerf);
    saveToyState(nowPerf);
  });
  dog.addEventListener("pointerdown", startDrag);
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  if (!state.initializedFromSaved) {
    chooseNewTarget();
  }
  requestAnimationFrame(update);
})();
