"use client";

import { useEffect } from "react";

/**
 * Soft ambient light — pointer position → CSS vars on :root.
 * Glass cards sample `--pointer-x/y` for a quiet highlight (natural window light,
 * not a hard spotlight). Throttled to rAF; disabled on reduced-motion / coarse pointer.
 */
export function AmbientPointer() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    const root = document.documentElement;
    let raf = 0;
    let px = 50;
    let py = 20;

    const flush = () => {
      raf = 0;
      root.style.setProperty("--pointer-x", `${px.toFixed(1)}%`);
      root.style.setProperty("--pointer-y", `${py.toFixed(1)}%`);
    };

    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      px = (e.clientX / w) * 100;
      py = (e.clientY / h) * 100;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    flush();
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty("--pointer-x");
      root.style.removeProperty("--pointer-y");
    };
  }, []);

  return null;
}
