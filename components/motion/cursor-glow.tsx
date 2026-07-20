"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Cursor-reactive spotlight — Amuletta "pencere ışığı" dili.
 *
 * Pointer koordinatlarını kart-lokal `--mx`/`--my` CSS değişkenlerine yazar
 * (rAF-throttled); ışık katmanı `.cursor-glow::after` bu değişkenlerden
 * beslenir. Sert spotlight değil: geniş, çok düşük opaklıklı radyal —
 * cam yüzeyde doğal ışık yansıması gibi okunur.
 *
 * Compositor dostu: yalnız CSS var yazımı; gradient katmanı tek paint
 * bölgesidir, backdrop-filter'a dokunmaz. Reduced-motion tercihinde ve
 * coarse pointer'da (dokunmatik) dinleyici kurulmaz — ışık kapalı kalır.
 */
export function useCursorGlow<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const raf = useRef(0);
  const pos = useRef({ x: 0, y: 0 });
  const live = useRef(false);

  useEffect(() => {
    live.current =
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !window.matchMedia("(pointer: coarse)").matches;
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !live.current) return;
    const r = el.getBoundingClientRect();
    pos.current.x = e.clientX - r.left;
    pos.current.y = e.clientY - r.top;
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        el.style.setProperty("--mx", `${pos.current.x.toFixed(1)}px`);
        el.style.setProperty("--my", `${pos.current.y.toFixed(1)}px`);
      });
    }
  }, []);

  return { ref, onPointerMove };
}
