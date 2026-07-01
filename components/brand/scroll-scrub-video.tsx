"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Video'yu oynatmaz — kaydırma (scroll) ilerlemesini video.currentTime'a
 * doğrudan eşler. Aşağı kaydırma ileri, yukarı kaydırma otomatik olarak
 * geri sarar (ayrı bir "geri sarma" mantığı gerekmez; sadece sürekli bir
 * eşleme). `prefers-reduced-motion` veya video henüz hazır değilse poster
 * görseli sabit kalır.
 */
export function ScrollScrubVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ready = false;
    let raf = 0;

    function update() {
      if (!ready || !video!.duration || !container) return;
      const vh = window.innerHeight;
      const rect = container.getBoundingClientRect();
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      const progress = Math.min(1, Math.max(0, traveled / total));
      video!.currentTime = progress * video!.duration;
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    function onLoaded() {
      ready = true;
      update();
    }

    video.addEventListener("loadedmetadata", onLoaded);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        className={cn("size-full scale-105 object-cover", className)}
        aria-hidden
      />
    </div>
  );
}
