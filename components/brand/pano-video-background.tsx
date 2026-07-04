"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * "Pano" arka planı — dönen ürün videosu, sayfanın en arkasında (-z-10) loop
 * olarak akar; fare pano üzerinde hareket ettikçe videoyu yatay eksende
 * "çevirir" (currentTime scrub). Fare durunca kaldığı yerden yavaşça yeniden
 * loop'a döner. Kartlar opak olduğundan video yalnızca aralardan/kenarlardan
 * görünür; okunabilirlik için üstüne tema rengiyle hafif bir perde konur.
 *
 * Ebeveyn kapsayıcı `relative z-0` olmalı. Dosya `/public/pano/pano-loop.mp4`
 * üzerinden Vercel CDN'den servis edilir.
 *
 * `prefers-reduced-motion`: video ilk karede sabit durur, scrub kapatılır.
 */
export function PanoVideoBackground({
  src = "/pano/pano-loop.mp4",
  className,
}: {
  src?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const v = videoRef.current;
    if (!wrap || !v) return;
    // pointer-events yok olan wrapper olay almaz — kapsayıcı (sayfa) dinlenir.
    const scope = wrap.parentElement ?? wrap;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let targetT = 0;
    let scrubbing = false;
    let idle: ReturnType<typeof setTimeout> | null = null;

    if (!reduced) v.play().catch(() => {});

    // Fare hedef zamanına doğru yumuşak yaklaşır; loop kenarında en kısa yolu
    // seçerek sürekli "dönme" hissi verir.
    const step = () => {
      const d = v.duration;
      if (d && Number.isFinite(d)) {
        const cur = v.currentTime;
        let diff = targetT - cur;
        if (diff > d / 2) diff -= d;
        else if (diff < -d / 2) diff += d;
        if (Math.abs(diff) < 0.006) {
          v.currentTime = targetT;
        } else {
          let next = cur + diff * 0.18;
          if (next < 0) next += d;
          if (next >= d) next -= d;
          v.currentTime = next;
        }
      }
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      if (reduced) return;
      const d = v.duration;
      if (!d || !Number.isFinite(d)) return;
      const rect = scope.getBoundingClientRect();
      const fx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      targetT = fx * d;
      if (!scrubbing) {
        scrubbing = true;
        v.pause();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      }
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => {
        scrubbing = false;
        cancelAnimationFrame(raf);
        v.play().catch(() => {});
      }, 1100);
    };

    scope.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      scope.removeEventListener("pointermove", onMove);
      if (idle) clearTimeout(idle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        className="absolute left-1/2 top-0 h-full w-full max-w-none -translate-x-1/2 object-cover opacity-[0.18] [mask-image:radial-gradient(120%_80%_at_50%_0%,black,transparent)]"
      />
      {/* Okunabilirlik perdesi — açık/koyu temada içerik net kalsın. */}
      <div className="from-background/70 via-background/45 to-background/80 absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}
