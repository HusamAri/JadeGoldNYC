"use client";

import { useEffect } from "react";

/**
 * Ürün eğimi köprüsü — `.jg-tilt-scene` yüzeylerinde imlecin konumunu CSS'e
 * bildirir: `--tx`/`--ty` (derece, eğim) ve `--gx`/`--gy` (%, speküler ışığın
 * merkezi). Geri kalan her şeyi CSS yapar (bkz. globals A5b).
 *
 * Neden TEK delege dinleyici: her fotoğraf kartını `"use client"` yapmak
 * ızgaradaki 20+ kartı ayrı client adasına çevirirdi. Burada tüm uygulama
 * için tek `pointermove` var ve o da YALNIZ imleç bir sahnenin üzerindeyken
 * iş yapıyor — sahne dışında ilk `closest()` çağrısında düşüyor.
 *
 * Bütçe: rAF ile kare başına EN FAZLA bir yazma (pointermove saniyede yüzlerce
 * kez tetiklenir; kısıtlanmazsa aynı karede defalarca style yazılır). Yazılan
 * şey yalnız custom property → layout/paint tetiklemez, dönüşü CSS transition
 * yürütür. Hareket kısıtlıysa (veya kaba işaretçi) hiç kurulmaz.
 *
 * Kullanım: kök panel layout'unda bir kez `<TiltListener />`.
 */

/** Maksimum eğim (derece). Bütçe md.6: <=6deg. */
const MAX_DEG = 5;

export function TiltListener() {
  useEffect(() => {
    // Dokunmatik cihazda ve hareket kısıtlıyken hiç bağlanma: eğim yalnız
    // ince işaretçide anlamlı, CSS de o durumda zaten düz bırakıyor.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let current: HTMLElement | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      pending = null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Merkeze göre -0.5..0.5 → eğim. Y ekseni ters: imleç YUKARIDAYSA
      // kartın üst kenarı geriye yatar (nesneyi öne eğmiş gibi).
      const px = (x - r.left) / r.width - 0.5;
      const py = (y - r.top) / r.height - 0.5;
      el.style.setProperty("--ty", `${(px * MAX_DEG * 2).toFixed(2)}deg`);
      el.style.setProperty("--tx", `${(-py * MAX_DEG * 2).toFixed(2)}deg`);
      // Speküler ışık imlecin altında; yüzde cinsinden kutu-lokal konum.
      el.style.setProperty("--gx", `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    const reset = (el: HTMLElement) => {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>(".jg-tilt-scene");
      if (el !== current) {
        // Sahneden çıkıldı: eskisini düzleştir (aksi halde son açıda donar).
        if (current) reset(current);
        current = el;
      }
      if (!el) return;
      pending = { el, x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    // Sayfa/scroll değişiminde imleç sahneden "sessizce" çıkabilir.
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      if (current) reset(current);
    };
  }, []);
  return null;
}
