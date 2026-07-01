"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Sabitlenmiş (pinned) kaydırma videosu — video kutusu kaydırma sırasında
 * EKRANDA SABİT kalır (position: sticky), yalnızca içindeki kare kaydırma
 * ilerlemesine göre değişir (aşağı ileri, yukarı otomatik geri sarar).
 * Sabitleme, kutunun kendi yüksekliğinden daha uzun bir "kaydırma rayı"
 * (track) içine sarılmasıyla sağlanır: ray boyunca kaydırıldıkça kutu sabit
 * kalır, ray bitince normal akışa döner. Arka plan `bg-background` ile site
 * temasıyla aynı renkte (harf kutusu / letterbox), video henüz hazır değilken
 * veya `prefers-reduced-motion`'da poster görseli sabit kalır.
 */
export function ScrollPinnedVideo({
  src,
  poster,
  trackHeightVh = 180,
  className,
  children,
}: {
  src: string;
  poster?: string;
  trackHeightVh?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ready = false;
    let raf = 0;

    function update() {
      if (!ready || !video!.duration || !track) return;
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const rect = track.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / total));
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
    // Video zaten önbellekten yüklenmiş olabilir — bu durumda loadedmetadata
    // useEffect'in dinleyici eklemesinden ÖNCE ateşlenmiş olur ve bir daha
    // hiç tetiklenmez, `ready` sonsuza dek false kalır. Senkron kontrol et.
    if (video.readyState >= 1) onLoaded();
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
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `${trackHeightVh}vh` }}
    >
      <div
        className={cn(
          "bg-background sticky top-0 h-svh overflow-hidden",
          className,
        )}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-cover"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}
