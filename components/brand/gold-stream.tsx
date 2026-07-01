"use client";

import { useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * "Erimiş altın" şeridi — sayfanın tepesinden başlayıp kaydırma ilerledikçe
 * içerik BLOKLARININ ARKASINDAN akan (kartlar opak olduğundan yalnızca
 * aralardan/boşluklardan görünen), yukarı kaydırınca geri sarılan ve en altta
 * sayfanın işlevine uygun bir sembole "donarak" tamamlanan dekoratif katman.
 *
 * Her istasyon (sayfa) sürecin bir aşamasını anlatır; şeridin dili aynı kalır,
 * yalnızca uçtaki motif değişir (`motif` prop'u): panel→kolye, satışlar→hediye
 * paketi, maliyetler→terazi, tasarımlar→yüzük eskizi, yorumlar→yıldız,
 * sepet kurtarma→yeniden kenetlenen halkalar, görevler→onay işareti,
 * analizler→yükselen ok, raporlar→mühür, kayıtlar→açık defter, marka→taş.
 *
 * Video değil, kaydırmayla çizilen vektör: dikdörtgen video dosyaları saydam
 * olamayacağından layout'un arasına gerçekten "yedirilemez" — bu efekt SVG
 * stroke-dashoffset ile çizilir. Ebeveyn kapsayıcı `relative z-0` olmalı;
 * şerit -z-10'da kalır, opak zeminli kartlar üstünü örter.
 *
 * `prefers-reduced-motion`: şerit baştan tam çizili ve statik durur.
 * Renkler marka Antik Altın ölçeği — açık/koyu temada aynı okunur.
 */
export type GoldStreamMotif =
  | "necklace"
  | "ring"
  | "scale"
  | "star"
  | "check"
  | "link"
  | "spark"
  | "gift"
  | "seal"
  | "ledger"
  | "gem";

const STROKE = { stroke: "#B89347", strokeWidth: 2.5, fill: "none" } as const;

/** Uç motifleri — şerit ucunun hemen altında ~60px'lik alanda çizilir. */
const MOTIFS: Record<GoldStreamMotif, React.ReactNode> = {
  necklace: (
    <>
      <circle cx="0" cy="24" r="22" {...STROKE} />
      <path d="M 0 14 L 9 26 L 0 40 L -9 26 Z" fill="#B89347" />
      <path d="M 0 14 L 9 26 L 0 30 L -9 26 Z" fill="#D8B86A" />
    </>
  ),
  ring: (
    <>
      <path d="M 0 2 L 7 10 L 0 16 L -7 10 Z" fill="#D8B86A" />
      <circle cx="0" cy="34" r="19" {...STROKE} />
    </>
  ),
  scale: (
    <>
      <path d="M 0 0 V 12 M -22 12 H 22" {...STROKE} strokeLinecap="round" />
      <path d="M -22 12 L -29 30 M -22 12 L -15 30 M -29 30 A 7 7 0 0 0 -15 30" {...STROKE} />
      <path d="M 22 12 L 15 30 M 22 12 L 29 30 M 15 30 A 7 7 0 0 0 29 30" {...STROKE} />
    </>
  ),
  star: (
    <g transform="translate(0,26)">
      <path
        d="M 0 -16 L 4 -5.5 L 15.2 -4.9 L 6.5 2.1 L 9.4 12.9 L 0 6.8 L -9.4 12.9 L -6.5 2.1 L -15.2 -4.9 L -4 -5.5 Z"
        fill="#B89347"
      />
    </g>
  ),
  check: (
    <path
      d="M -15 26 L -4 37 L 17 10"
      {...STROKE}
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  link: (
    <>
      <circle cx="-9" cy="24" r="13" {...STROKE} />
      <circle cx="9" cy="24" r="13" {...STROKE} />
    </>
  ),
  spark: (
    <path
      d="M -20 38 L -4 20 L 4 27 L 20 8 M 20 8 L 11 9 M 20 8 L 19 17"
      {...STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  gift: (
    <>
      <rect x="-16" y="14" width="32" height="26" rx="3" {...STROKE} />
      <path d="M 0 14 V 40 M -16 27 H 16" {...STROKE} />
      <path d="M 0 14 C -6 4 -15 8 -8 14 M 0 14 C 6 4 15 8 8 14" {...STROKE} />
    </>
  ),
  seal: (
    <>
      <circle cx="0" cy="26" r="20" {...STROKE} />
      <circle cx="0" cy="26" r="13" {...STROKE} strokeWidth={1.5} />
      <circle cx="0" cy="26" r="3.5" fill="#B89347" />
    </>
  ),
  ledger: (
    <>
      <path
        d="M 0 40 C -6 32 -18 32 -24 36 L -24 14 C -18 10 -6 10 0 18 C 6 10 18 10 24 14 L 24 36 C 18 32 6 32 0 40 Z"
        {...STROKE}
        strokeLinejoin="round"
      />
      <path d="M 0 18 V 40" {...STROKE} strokeWidth={1.5} />
    </>
  ),
  gem: (
    <>
      <path d="M 0 4 L 17 24 L 0 48 L -17 24 Z" fill="#B89347" opacity="0.9" />
      <path d="M 0 4 L 17 24 L 0 31 L -17 24 Z" fill="#D8B86A" />
    </>
  ),
};

export function GoldStream({
  motif = "necklace",
  className,
}: {
  motif?: GoldStreamMotif;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `gs-gold-${uid}`;
  const blurId = `gs-blur-${uid}`;

  useEffect(() => {
    const svg = svgRef.current;
    const container = svg?.parentElement;
    if (!svg || !container) return;

    const glow = svg.querySelector<SVGPathElement>("[data-gs-glow]");
    const core = svg.querySelector<SVGPathElement>("[data-gs-core]");
    const head = svg.querySelector<SVGCircleElement>("[data-gs-head]");
    const ornament = svg.querySelector<SVGGElement>("[data-gs-ornament]");
    if (!glow || !core || !head || !ornament) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let len = 0;
    let raf = 0;

    // Kapsayıcının o anki boyutuna göre serpantin yol üretir: tepe-merkezden
    // başlar, sağ-sol kenar payları arasında S'ler çizerek iner, en altta
    // merkezde motifin tepesine bağlanarak biter.
    function build() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 200 || h < 600) return;
      svg!.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const margin = Math.max(20, w * 0.03);
      const left = margin;
      const right = w - margin;
      const bottomReserve = 170;
      const usable = h - bottomReserve;
      const waves = Math.min(9, Math.max(2, Math.round(usable / 850)));
      const period = usable / (waves + 1);

      let d = `M ${(w / 2).toFixed(1)} 0`;
      let x = w / 2;
      let y = 0;
      let side = true;
      for (let i = 0; i < waves; i++) {
        const nx = side ? right : left;
        const ny = y + period;
        d += ` C ${x.toFixed(1)} ${(y + period * 0.55).toFixed(1)}, ${nx.toFixed(1)} ${(ny - period * 0.55).toFixed(1)}, ${nx.toFixed(1)} ${ny.toFixed(1)}`;
        x = nx;
        y = ny;
        side = !side;
      }
      const cx = w / 2;
      const endY = h - bottomReserve + 60;
      d += ` C ${x.toFixed(1)} ${(y + period * 0.6).toFixed(1)}, ${cx} ${(endY - 80).toFixed(1)}, ${cx} ${endY.toFixed(1)}`;

      glow!.setAttribute("d", d);
      core!.setAttribute("d", d);
      len = core!.getTotalLength();
      for (const p of [glow!, core!]) {
        p.style.strokeDasharray = `${len}`;
      }
      ornament!.setAttribute("transform", `translate(${cx}, ${endY + 4})`);
      update();
    }

    function update() {
      if (!container || !len) return;
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = reduced
        ? 1
        : Math.min(1, Math.max(0, (vh - rect.top) / rect.height));
      const offset = len * (1 - progress);
      glow!.style.strokeDashoffset = `${offset}`;
      core!.style.strokeDashoffset = `${offset}`;

      // Akışın ucundaki damla — şerit tamamlanınca kaybolur.
      if (!reduced && progress > 0.01 && progress < 0.97) {
        const pt = core!.getPointAtLength(len * progress);
        head!.setAttribute("cx", `${pt.x}`);
        head!.setAttribute("cy", `${pt.y}`);
        head!.style.opacity = "0.9";
      } else {
        head!.style.opacity = "0";
      }
      // Motif son %10'da belirir ("donar", sayfanın sembolü olur).
      const solid = Math.min(1, Math.max(0, (progress - 0.9) / 0.1));
      ornament!.style.opacity = `${solid}`;
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    const ro = new ResizeObserver(() => build());
    ro.observe(container);
    build();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 size-full",
        className,
      )}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8B86A" />
          <stop offset="0.5" stopColor="#B89347" />
          <stop offset="1" stopColor="#9A7D3E" />
        </linearGradient>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path
        data-gs-glow
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.3"
        filter={`url(#${blurId})`}
      />
      <path
        data-gs-core
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle data-gs-head r="5" fill="#E8CE8F" opacity="0" />
      <g data-gs-ornament opacity="0">
        {MOTIFS[motif]}
      </g>
    </svg>
  );
}
