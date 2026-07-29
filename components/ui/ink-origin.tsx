"use client";

import { useEffect } from "react";

/**
 * Temas ışığı köprüsü — `.jg-ink-origin` yüzeylerinde basışın NEREDE olduğunu
 * CSS'e bildirir: pointerdown anında öğeye `--mx`/`--my` (öğe-lokal px) yazar,
 * `.jg-ink-origin::after` haleyi tam parmağın altından açar.
 *
 * Neden TEK delege dinleyici: aynı işi Button'ın kendisinde yapmak button.tsx'i
 * `"use client"` yapardı ve ekrandaki 109 düğmenin her biri ayrı bir client
 * adası olurdu. Burada tüm uygulama için TEK passive dinleyici var; Button
 * sunucu bileşeni olarak kalır. Dinleyici mount EDİLMEZSE hale yine çalışır,
 * yalnız merkezden açılır (`.jg-ink-origin` varsayılanı 50%/50%).
 *
 * Bütçe: rAF yok, ölçüm yalnız basış anında (frame başına değil); yazılan şey
 * iki custom property — layout/paint tetiklemez, ::after zaten transform+opacity
 * ile animasyonlanır. Hareket kısıtlıysa hiç kurulmaz (CSS de haleyi söndürür).
 *
 * Kullanım: kök panel layout'unda bir kez `<InkOriginListener />`.
 */
export function InkOriginListener() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>(".jg-ink-origin");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(1)}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(1)}px`);
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return null;
}
