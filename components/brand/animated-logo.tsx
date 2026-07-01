"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Gerçek marka logosu (SVG dosyası). İki katmanlı çalışır:
 *
 * 1. TEMEL (SSR, anında, JS'siz): dosya bir `<svg viewBox=kırpılmış>` içinde
 *    `<image>` olarak gösterilir — kaynak dosyalar 2048×2048 tuvalde dar bir
 *    bantta durduğundan `viewBox` prop'u içeriğin gerçek sınırlarına kırpar.
 *    Fetch'e/JS'e bağımlılık yok; logo her koşulda derhal görünür.
 * 2. GELİŞTİRME (yalnız `animate` açıkken, istemcide): dosya fetch ile satır
 *    içine alınır, glifler bbox.x'e göre soldan sağa sıralanıp kademeli bir
 *    girişle gelir (saydam+aşağıdan → görünür, marka easing'i). Fetch
 *    başarısız olursa temel katman olduğu gibi kalır.
 *
 * `prefers-reduced-motion`: animasyonsuz, temel katman.
 */
export function AnimatedLogo({
  src,
  viewBox,
  canvasSize = 2048,
  animate = false,
  alt,
  className,
}: {
  src: string;
  /** İçeriğin gerçek sınırları, örn. "150 772 1744 507". */
  viewBox: string;
  /** Kaynak dosyanın tuval boyutu (viewBox genişliği/yüksekliği). */
  canvasSize?: number;
  animate?: boolean;
  alt: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [inlined, setInlined] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (
      !host ||
      !animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok || cancelled) return;
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        const source = doc.documentElement;
        if (source.nodeName !== "svg" || cancelled) return;

        const svg = document.adoptNode(source) as unknown as SVGSVGElement;
        svg.removeAttribute("style");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("viewBox", viewBox);
        svg.setAttribute("class", "block h-full w-auto");
        svg.setAttribute("aria-hidden", "true");

        // Glifleri soldan sağa sırala (dosya sırası değil, görsel sıra) ve
        // kademeli giriş uygula. Aynı harfin iç/dış path'leri x'te bitişik
        // olduğundan doğal olarak birlikte gelirler. bbox ölçümü için önce
        // DOM'a girmiş olmalı — o yüzden ekleyip hemen stilliyoruz.
        host.innerHTML = "";
        host.appendChild(svg);
        setInlined(true);
        // Maske/defs içindeki path'ler görünür glif değil (iç boşlukları
        // kesen karşı-şekiller) — onları animasyona katma; katılırlarsa
        // delikler gecikmeli "kapanıyor" gibi görünür.
        const paths = Array.from(svg.querySelectorAll("path")).filter(
          (p) => !p.closest("mask") && !p.closest("defs"),
        );
        const sorted = paths
          .map((p) => ({ p, x: p.getBBox().x }))
          .sort((a, b) => a.x - b.x);
        sorted.forEach(({ p }, i) => {
          p.style.opacity = "0";
          p.style.transform = "translateY(10px)";
          p.style.transition = `opacity 0.5s var(--ease-premium, ease-out) ${i * 40}ms, transform 0.5s var(--ease-premium, ease-out) ${i * 40}ms`;
          p.style.transformBox = "fill-box";
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            for (const { p } of sorted) {
              p.style.opacity = "1";
              p.style.transform = "translateY(0)";
            }
          });
        });
      } catch {
        // Fetch/parse başarısız → temel <image> katmanı görünür kalır.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, animate, viewBox]);

  return (
    <span
      className={cn("block", className)}
      aria-label={alt}
      role="img"
    >
      {/* Elle doldurulan kapsayıcı — React içine hiçbir şey render etmez;
          fetch edilen satır-içi SVG yalnız buraya eklenir. React'in yönettiği
          yedek katmanla aynı ebeveyni paylaşsalar da birbirlerinin düğümlerine
          asla dokunmazlar (removeChild çakışması yaşanmaz). */}
      <span
        ref={hostRef}
        className={cn("block h-full", !inlined && "hidden")}
      />
      {/* Temel katman (SSR, JS'siz) — satır-içi sürüm hazır olunca kalkar. */}
      {!inlined && (
        <svg viewBox={viewBox} className="block h-full w-auto" aria-hidden>
          <image href={src} width={canvasSize} height={canvasSize} />
        </svg>
      )}
    </span>
  );
}
