/**
 * Sahne cutout'ları — Higgsfield görsellerinden ayıklanan objeler, sayfalara
 * minimalist/editorial sanat yönetimiyle yerleşir (referans: Artifact Studio
 * Materials/Liquid cutout dili).
 *
 * Kurallar:
 *  • Sayfa başına 1-2 obje, FARKLI derinlikte: near = keskin + güçlü temas
 *    gölgesi; far = küçük + hafif blur + düşük opaklık (alan derinliği).
 *  • MUM yalnız koyu temada görünür (hidden dark:block) — fitilinde canlı
 *    alev ışığı (flame-glow/flame-trem) yanar; obje kendisi hareketsiz.
 *  • Her obje kendi gerçek doğasında hareket eder: zincir çok yavaş salınır
 *    (sway), prizma süzülür (float), taşlar hareketsiz durur.
 *  • pointer-events-none + içerik altında (-z) — okumayı asla engellemez.
 *  • prefers-reduced-motion: global kural animasyonları durdurur.
 */
import { cn } from "@/lib/utils";

type Depth = "near" | "far";

const DEPTH: Record<Depth, string> = {
  near: "w-32 md:w-40 opacity-90",
  far: "w-20 md:w-24 opacity-70 blur-[1.5px]",
};

/* Obje doğasına göre hareket + gölge (temas gölgesi drop-shadow katmanları). */
const KIND = {
  chains: {
    src: "/brand/cutout/gold-chains.webp",
    motion: "animate-[obj-sway_16s_ease-in-out_infinite]",
    shadow:
      "drop-shadow-[0_14px_10px_rgb(var(--nm-dark)/0.35)] drop-shadow-[0_3px_3px_rgb(var(--nm-dark)/0.3)]",
  },
  prism: {
    src: "/brand/platform/holo-prism.webp",
    motion: "animate-[obj-float_12s_ease-in-out_infinite]",
    shadow:
      "drop-shadow-[0_18px_14px_rgb(var(--nm-dark)/0.3)] drop-shadow-[0_4px_4px_rgb(var(--nm-dark)/0.22)]",
  },
  stones: {
    src: "/brand/cutout/stones.png",
    motion: "", // taşlar hareket etmez — gerçekçilik
    shadow:
      "drop-shadow-[0_10px_8px_rgb(var(--nm-dark)/0.4)] drop-shadow-[0_2px_2px_rgb(var(--nm-dark)/0.35)]",
  },
  candle: {
    src: "/brand/cutout/candle.png",
    motion: "", // mum gövdesi sabit; yalnız alev yaşar
    shadow:
      "drop-shadow-[0_16px_12px_rgb(0_0_0/0.55)] drop-shadow-[0_4px_4px_rgb(0_0_0/0.5)]",
  },
} as const;

export type CutoutKind = keyof typeof KIND;

export function SceneCutout({
  kind,
  depth = "near",
  className,
}: {
  kind: CutoutKind;
  depth?: Depth;
  /** Konum: absolute koordinat sınıfları (ör. "right-6 top-24"). */
  className?: string;
}) {
  const k = KIND[kind];
  const isCandle = kind === "candle";
  return (
    <figure
      aria-hidden
      className={cn(
        "pointer-events-none absolute select-none",
        DEPTH[depth],
        // Mum yalnız koyu zeminde — açık temada hiç render edilmez (CSS).
        isCandle && "hidden dark:block",
        className,
      )}
    >
      <div className={cn("relative", k.motion)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={k.src} alt="" draggable={false} className={cn("w-full", k.shadow)} />
        {isCandle && (
          <>
            {/* Alevin kendi ışığı — fitil ucunda yumuşak, canlı parıltı. */}
            <span
              className="absolute top-[6%] left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen animate-[flame-glow_2.6s_ease-in-out_infinite,flame-trem_1.3s_ease-in-out_infinite]"
              style={{
                background:
                  "radial-gradient(circle, rgb(255 206 138 / 0.65) 0%, rgb(255 166 90 / 0.22) 42%, transparent 72%)",
                filter: "blur(6px)",
              }}
            />
            {/* Mumun zemine döktüğü sıcak havuz. */}
            <span
              className="absolute -bottom-2 left-1/2 h-10 w-28 -translate-x-1/2 rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(ellipse, rgb(255 182 112 / 0.16), transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </>
        )}
      </div>
    </figure>
  );
}

/**
 * Sayfa sahneleri — hangi sayfada hangi objeler, hangi derinlik/konumda.
 * Ebeveynin `relative` olması yeterli; katman içerik ALTINDA kalır.
 */
export function SceneCutouts({ page }: { page: "panel" | "satislar" | "maliyetler" | "gorevler" }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[4] overflow-hidden">
      {/* Yerleşim: sayfaların pb-28 alt "gutter"ı + üst hero şeridi — objeler
          içeriğin ARKASINDA kalır; görünür kısımları boş zeminlere denk gelir.
          Mum yüksek obje: negatif bottom ile yalnız ÜST gövdesi + alevi
          gutter'da görünür (referans: housing kenarına oturan mum). */}
      {page === "panel" && (
        <>
          <SceneCutout kind="stones" depth="far" className="bottom-3 left-10" />
          <SceneCutout kind="candle" depth="near" className="-bottom-44 right-12" />
        </>
      )}
      {page === "satislar" && (
        <>
          <SceneCutout kind="chains" depth="near" className="top-24 -right-6 rotate-6" />
          <SceneCutout kind="prism" depth="far" className="bottom-3 left-10" />
        </>
      )}
      {page === "maliyetler" && (
        <>
          <SceneCutout kind="stones" depth="near" className="bottom-2 left-8" />
          <SceneCutout kind="prism" depth="far" className="bottom-6 right-14" />
        </>
      )}
      {page === "gorevler" && (
        <SceneCutout kind="prism" depth="far" className="bottom-4 right-12" />
      )}
    </div>
  );
}
