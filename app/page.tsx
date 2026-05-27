"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fridgeItemOrder } from "../components/fridgeData";
import type { FridgeItem } from "../components/fridgeData";

const FrostCanvas = dynamic(() => import("../components/FrostCanvas"), {
  ssr: false,
});

const fridgeEase = [0.25, 0.1, 0.25, 1] as const;
const fridgeAnimationMs = 1450;

const fridgeItems: FridgeItem[] = fridgeItemOrder.map((id) => ({ id }));

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isClosing) return;

    const timeout = window.setTimeout(
      () => setIsClosing(false),
      fridgeAnimationMs,
    );

    return () => window.clearTimeout(timeout);
  }, [isClosing]);

  const openFridge = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const closeFridge = () => {
    setIsClosing(true);
    setIsOpen(false);
  };

  const toggleFridge = () => {
    if (isClosing) return;
    if (isOpen) {
      closeFridge();
      return;
    }

    openFridge();
  };

  const showFridgeContents = isOpen || isClosing;
  const stageClassName = [
    "site-stage",
    isOpen ? "is-open" : "",
    isClosing ? "is-closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const fridgePose = {
    scale: isOpen ? 1.16 : 0.82,
    x: 0,
    y: isOpen ? 54 : 16,
  };

  return (
    <main className={stageClassName}>
      <section
        className="kitchen-scene"
        aria-label="Ominous kitchen with a clickable fridge"
      >
        <motion.div
          className="fridge-wrap"
          initial={false}
          animate={fridgePose}
          transition={{
            scale: { duration: 1.45, ease: fridgeEase },
            x: { duration: 1.45, ease: fridgeEase },
            y: { duration: 1.45, ease: fridgeEase },
          }}
        >
          <div className="fridge-body">
            <div className="fridge-interior" aria-hidden={!showFridgeContents}>
              <FrostCanvas active={showFridgeContents} items={fridgeItems} />
            </div>

            <div
              className="fridge-door"
              role={isOpen || isClosing ? undefined : "button"}
              tabIndex={isOpen || isClosing ? -1 : 0}
              aria-label={isOpen || isClosing ? undefined : "Open the fridge"}
              onClick={toggleFridge}
              onKeyDown={(event) => {
                if (isOpen || isClosing) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFridge();
                }
              }}
            >
              <span className="handle" />
            </div>
            {isOpen && (
              <button
                className="fridge-close-hotspot"
                type="button"
                aria-label="Close the fridge"
                onClick={closeFridge}
              />
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
