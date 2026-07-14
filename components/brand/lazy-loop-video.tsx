"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Görünüme YAKLAŞINCA yüklenen sessiz döngü videosu. Panel gibi veri-önce
 * sayfalarda marka videosu (10MB+) ilk yüke binmesin diye: viewport'a
 * ~200px kala src takılır ve oynar; görünümden çıkınca durur (CPU/pil).
 * O ana kadar yalnız poster görünür — LCP ve toplam ağ yükü video kadar
 * (panelde ~10.7MB) hafifler.
 */
export function LazyLoopVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={active ? src : undefined}
      poster={poster}
      loop
      muted
      playsInline
      preload="none"
      className={className}
      aria-hidden
    />
  );
}
