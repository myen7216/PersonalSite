(() => {
  const page = document.body?.dataset?.page;
  if (page !== "home") {
    return;
  }

  const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

  function setupVisionCursor() {
    if (!supportsFinePointer) {
      return;
    }

    if (!document.getElementById("vision-cursor-filter-svg")) {
      const filterSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      filterSvg.id = "vision-cursor-filter-svg";
      filterSvg.setAttribute("aria-hidden", "true");
      filterSvg.innerHTML = `
        <defs>
          <filter id="vision-cursor-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="1" seed="8" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      `;
      document.body.appendChild(filterSvg);
    }

    const cursor = document.createElement("div");
    cursor.className = "vision-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="vision-cursor-core"></span>';
    document.body.appendChild(cursor);

    const interactiveSelector = [
      "a",
      "button",
      "input",
      "textarea",
      "select",
      ".collage-tile",
      ".dog",
      "[role='button']"
    ].join(", ");

    let isVisible = false;

    function moveCursor(x, y) {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }

    function setInteractiveState(event) {
      const interactive = event.target instanceof Element
        ? event.target.closest(interactiveSelector)
        : null;
      document.body.classList.toggle("vision-cursor-interactive", !!interactive);
    }

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") {
        return;
      }

      moveCursor(event.clientX, event.clientY);
      setInteractiveState(event);

      if (!isVisible) {
        isVisible = true;
        document.body.classList.add("vision-cursor-active");
      }
    });

    window.addEventListener("pointerdown", () => {
      document.body.classList.add("vision-cursor-pressed");
    });

    window.addEventListener("pointerup", () => {
      document.body.classList.remove("vision-cursor-pressed");
    });

    document.addEventListener("pointerleave", () => {
      document.body.classList.remove("vision-cursor-active", "vision-cursor-interactive");
      isVisible = false;
    });

    document.addEventListener("pointerover", setInteractiveState);
    moveCursor(window.innerWidth / 2, window.innerHeight / 2);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setupVisionCursor();

  if (prefersReducedMotion) {
    return;
  }

  const DURATION_MS = 1400;
  const HOLD_MS = 0;
  const RANDOM_SET = "abcdefghijklmnopqrstuvwxyz";
  const RANDOM_UPDATE_EVERY_MS = 55;

  const targets = Array.from(document.querySelectorAll(".clean-name, .clean-blurb"));

  if (!targets.length) {
    return;
  }

  const targetStates = targets.map((node) => ({
    node,
    text: node.textContent || ""
  }));
  const animatedStates = [];

  const charRefs = [];

  function splitTextIntoChars(node) {
    if (node.querySelector("img, svg, video, canvas")) {
      return [];
    }

    const text = node.textContent || "";
    if (!text.trim()) {
      return [];
    }

    const frag = document.createDocumentFragment();
    const chars = [];

    for (const char of text) {
      if (char === " ") {
        frag.appendChild(document.createTextNode(" "));
        continue;
      }

      const span = document.createElement("span");
      span.className = "text-char";
      span.textContent = char;
      span.dataset.finalChar = char;
      frag.appendChild(span);
      chars.push(span);
    }

    if (!chars.length) {
      return [];
    }

    node.textContent = "";
    node.appendChild(frag);
    return chars;
  }

  function randomChar() {
    const idx = Math.floor(Math.random() * RANDOM_SET.length);
    return RANDOM_SET[idx];
  }

  for (const state of targetStates) {
    const chars = splitTextIntoChars(state.node);
    if (chars.length) {
      charRefs.push(...chars);
      animatedStates.push(state);
    }
  }

  const total = charRefs.length;
  if (!total) {
    return;
  }

  const revealWindow = Math.max(700, DURATION_MS - HOLD_MS);
  const lastSwapAt = new WeakMap();

  for (const span of charRefs) {
    const finalChar = span.dataset.finalChar || "";
    if (/[a-z]/i.test(finalChar)) {
      span.textContent = randomChar();
    } else {
      span.textContent = finalChar;
    }
  }

  function frame(now) {
    const elapsed = Math.min(DURATION_MS, now - startTime);

    for (let i = 0; i < total; i += 1) {
      const span = charRefs[i];
      const finalChar = span.dataset.finalChar || "";
      const shouldScramble = /[a-z]/i.test(finalChar);

      if (!shouldScramble) {
        span.textContent = finalChar;
        continue;
      }

      if (elapsed <= HOLD_MS) {
        continue;
      }

      const revealTime = elapsed - HOLD_MS;
      const revealAt = (i / total) * (revealWindow * 0.75);
      const revealProgress = (revealTime - revealAt) / 320;

      if (revealProgress >= 1) {
        span.textContent = finalChar;
      } else {
        const last = lastSwapAt.get(span) || 0;
        if (elapsed - last >= RANDOM_UPDATE_EVERY_MS) {
          span.textContent = randomChar();
          lastSwapAt.set(span, elapsed);
        }
      }
    }

    if (elapsed < DURATION_MS) {
      requestAnimationFrame(frame);
      return;
    }

    for (const state of animatedStates) {
      state.node.textContent = state.text;
    }
  }

  const startTime = performance.now();
  requestAnimationFrame(frame);
})();
