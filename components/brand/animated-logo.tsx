"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Gerçek marka logosu (SVG dosyası) — dosya satır içine (inline) alınır,
 * viewBox içerikteki gerçek sınırlara kırpılır (kaynak dosyalar 2048×2048
 * tuval içinde dar bir bantta durur) ve `animate` açıksa her glif/parça
 * soldan sağa sıralanarak (bbox.x'e göre) yumuşak bir giriş yapar: hafif
 * aşağıdan yukarı + saydamdan görünür, marka easing'iyle.
 *
 * Kaynak SVG'lerde harfler etiketsiz <path> çiftleri olduğundan sıralama
 * çalışma anında ölçülerek yapılır — dosyadaki path sırası önemsizdir.
 * `prefers-reduced-motion`: animasyonsuz, doğrudan görünür.
 */
export function AnimatedLogo({
  src,
  animate = false,
  alt,
  className,
}: {
  src: string;
  animate?: boolean;
  alt: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok || cancelled) return;
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        const source = doc.documentElement;
        if (source.nodeName !== "svg" || cancelled) return;

        host.innerHTML = "";
        const svg = document.adoptNode(source) as unknown as SVGSVGElement;
        svg.removeAttribute("style");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("class", "block h-full w-auto");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", alt);
        host.appendChild(svg);

        // İçeriğin gerçek sınırlarını ölç, viewBox'ı kırp (küçük pay ile).
        const box = svg.getBBox();
        const pad = Math.max(box.width, box.height) * 0.02;
        svg.setAttribute(
          "viewBox",
          `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`,
        );

        if (
          !animate ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          return;
        }

        // Glifleri soldan sağa sırala (dosya sırası değil, görsel sıra) ve
        // kademeli giriş uygula. Aynı harfin iç/dış path'leri x'te bitişik
        // olduğundan doğal olarak birlikte gelirler.
        const paths = Array.from(svg.querySelectorAll("path"));
        const sorted = paths
          .map((p) => ({ p, x: p.getBBox().x }))
          .sort((a, b) => a.x - b.x);
        sorted.forEach(({ p }, i) => {
          p.style.opacity = "0";
          p.style.transform = "translateY(10px)";
          p.style.transition = `opacity 0.5s var(--ease-premium, ease-out) ${i * 40}ms, transform 0.5s var(--ease-premium, ease-out) ${i * 40}ms`;
          p.style.transformBox = "fill-box";
        });
        // Stilleri uygula → bir sonraki karede hedef değerlere geçir.
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
        // Logo yüklenemezse sessizce boş kal — çevredeki metin/başlık taşır.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, animate, alt]);

  return (
    <span
      ref={hostRef}
      className={cn("block", className)}
      aria-label={alt}
      role="img"
    />
  );
}
