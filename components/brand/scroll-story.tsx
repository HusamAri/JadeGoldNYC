"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export interface StoryChapter {
  src: string;
  poster?: string;
  eyebrow: string;
  title: string;
  text: string;
}

/**
 * Süreç sahnesi — kaydırmayla anlatılan bölümlü hikâye. Sahne kaydırma
 * boyunca EKRANDA SABİT kalır (sticky); ilerledikçe:
 *
 * - aktif bölümün videosu kaydırma ilerlemesiyle KARE KARE akar (aşağı ileri,
 *   yukarı geri sarar; oynatma yok, doğrudan currentTime eşlemesi),
 * - her bölüm sıkı kadrajda başlayıp yavaşça açılır (zoom-out reveal),
 * - bölüm sınırlarında videolar çapraz-geçişle (crossfade) değişir,
 * - bölümün açıklama metni (eyebrow + serif başlık + kısa metin) kendi
 *   penceresinde belirip kaybolur,
 * - en altta ince altın ilerleme çizgisi toplam yolculuğu gösterir.
 *
 * Zemin her iki temada da BİLEREK koyu (marka Kömür #131313) — video bölgesi
 * aydınlık/karanlık mod fark etmeksizin aynı görünür. `prefers-reduced-motion`:
 * ilk bölümün posteri + metni statik durur, kaydırma hiçbir şeyi oynatmaz.
 */
export function ScrollStory({
  chapters,
  chapterVh = 140,
  className,
}: {
  chapters: StoryChapter[];
  /** Bölüm başına kaydırma rayı yüksekliği (vh). */
  chapterVh?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const videos = Array.from(
      track.querySelectorAll<HTMLVideoElement>("[data-ss-video]"),
    );
    const captions = Array.from(
      track.querySelectorAll<HTMLElement>("[data-ss-caption]"),
    );
    const bar = track.querySelector<HTMLElement>("[data-ss-bar]");
    const n = videos.length;
    if (n === 0) return;

    const ready = videos.map(() => false);
    let raf = 0;

    const clamp = (v: number) => Math.min(1, Math.max(0, v));

    function update() {
      if (!track) return;
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const rect = track.getBoundingClientRect();
      const p = clamp(-rect.top / total);
      const g = p * n; // küresel ilerleme: bölüm i, [i, i+1) penceresinde aktif

      if (bar) bar.style.width = `${(p * 100).toFixed(2)}%`;

      videos.forEach((video, i) => {
        const local = clamp(g - i);
        // Trapez opaklık: bölüm penceresi içinde tam, sınırlarda ±0.08'lik
        // bantta komşusuyla çapraz geçiş. İlk/son bölüm dışa doğru hep açık.
        const fadeIn = i === 0 ? 1 : clamp((g - (i - 0.08)) / 0.16);
        const fadeOut = i === n - 1 ? 1 : clamp((i + 1 + 0.08 - g) / 0.16);
        const opacity = Math.min(fadeIn, fadeOut);
        video.style.opacity = `${opacity}`;

        // Zoom-out reveal: sıkı kadrajdan (1.16) rahat kadraja (1.0).
        const eased = 1 - (1 - local) * (1 - local);
        video.style.transform = `scale(${(1.16 - 0.16 * eased).toFixed(4)})`;

        if (opacity > 0 && ready[i] && video.duration) {
          video.currentTime = local * video.duration;
        }

        const cap = captions[i];
        if (cap) {
          const capIn = clamp((local - 0.12) / 0.12);
          const capOut = i === n - 1 ? 1 : clamp((0.92 - local) / 0.12);
          const capOpacity = Math.min(capIn, capOut);
          cap.style.opacity = `${capOpacity}`;
          cap.style.transform = `translateY(${((1 - capOpacity) * 18).toFixed(1)}px)`;
        }
      });
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    const cleanups = videos.map((video, i) => {
      const onLoaded = () => {
        ready[i] = true;
        update();
      };
      video.addEventListener("loadedmetadata", onLoaded);
      // Önbellekten yüklenmişse loadedmetadata dinleyiciden önce ateşlenmiş
      // olabilir — senkron kontrol (bkz. scroll-pinned-video ile aynı ders).
      if (video.readyState >= 1) onLoaded();
      return () => video.removeEventListener("loadedmetadata", onLoaded);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      cleanups.forEach((fn) => fn());
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `${chapterVh * chapters.length}vh` }}
    >
      <div
        className={cn(
          "sticky top-0 h-svh overflow-hidden bg-[#131313]",
          className,
        )}
      >
        {chapters.map((c, i) => (
          <video
            key={c.src}
            data-ss-video
            src={c.src}
            poster={c.poster}
            muted
            playsInline
            preload={i === 0 ? "auto" : "metadata"}
            className="absolute inset-0 size-full object-cover"
            style={{ opacity: i === 0 ? 1 : 0, transform: "scale(1.16)" }}
            aria-hidden
          />
        ))}

        {/* marka tonlu scrim — metin okunurluğu için */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#131313]/85 via-[#131313]/25 to-[#131313]/10"
          aria-hidden
        />

        {chapters.map((c, i) => (
          <div
            key={c.src}
            data-ss-caption
            className="absolute inset-x-0 bottom-0 p-8 md:p-12"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <span className="text-[11px] font-medium tracking-[0.3em] text-[oklch(0.87_0.1_86)] uppercase">
              {c.eyebrow}
            </span>
            <h3 className="mt-2 max-w-xl font-serif text-3xl leading-tight text-white md:text-4xl">
              {c.title}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              {c.text}
            </p>
          </div>
        ))}

        {/* ince altın ilerleme çizgisi */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
          <div
            data-ss-bar
            className="h-full bg-[#B89347]"
            style={{ width: "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
