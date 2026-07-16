"use client";

import { useEffect } from "react";

/**
 * Scroll-parallax derinlik runtime'ı — sayfa katmanlarına derinlik hissi.
 *
 * İçerik tam hızda akarken arka plandaki holo blob katmanları daha yavaş
 * süzülür (globals.css: .holo-drift::before %14, ::after %26 — iki ayrı
 * derinlik). İsteyen sayfa öğesi de `data-parallax="0.85"` ile kendi hızını
 * bildirebilir: 1'den KÜÇÜK değer içerikten yavaş (uzak), 1'den BÜYÜK değer
 * hızlı (yakın) akar; öğeye `translate3d(0, scrollY*(1-hız), 0)` uygulanır.
 * Yalnız DEKORATİF (pointer-events-none) katmanlarda kullanın — etkileşimli
 * içeriğin hizasını kaydırmak tıklama hedeflerini bozar.
 *
 * Performans sözleşmesi (bkz. globals.css holo-drift PERF notu):
 * - Idle'da sıfır iş: yalnız scroll olayında tek rAF planlanır (çakışan
 *   olaylar tek frame'e katlanır), yazılan tek şey `--par-y` + transform.
 * - translate3d compositor'da uygulanır; blur/backdrop yeniden rasterize olmaz.
 * - `prefers-reduced-motion: reduce` ve kaba işaretçi (dokunmatik) cihazlarda
 *   runtime hiç bağlanmaz — katmanlar statik ambiyans olarak kalır.
 *
 * Derinlik kayması asimptotiktir: shift = MAX * (1 - e^(-scrollY/TAU)).
 * Uzun sayfada blob'lar kadraj dışına kaçmaz (inset -%30 payının içinde
 * doyuma ulaşır); türev sürekli olduğundan "duvara çarpma" hissi olmaz.
 */
const MAX_SHIFT_PX = 600; // --par-y üst sınırı (0.26 katsayıyla ≤156px gerçek kayma)
const TAU_PX = 900; // doyum hızı — ilk ~2 viewport'ta derinlik en belirgin

export function ParallaxDrift() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    )
      return;

    const root = document.documentElement;
    const layers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    ).map((el) => ({
      el,
      speed: parseFloat(el.dataset.parallax || "1") || 1,
    }));

    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      const parY = MAX_SHIFT_PX * (1 - Math.exp(-y / TAU_PX));
      root.style.setProperty("--par-y", `${parY.toFixed(1)}px`);
      for (const { el, speed } of layers) {
        // hız<1: içerikten geri kalır (uzak); hız>1: öne geçer (yakın).
        el.style.transform = `translate3d(0, ${(y * (1 - speed)).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply(); // sayfa scroll ortasında hydrate olursa (bfcache/anchor) hizala
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty("--par-y");
      for (const { el } of layers) el.style.transform = "";
    };
  }, []);

  return null;
}
