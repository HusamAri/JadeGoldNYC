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

/* Obje doğasına göre hareket + gölge. Cutout gölge çifti Spatial referansından
   BİREBİR: drop-shadow(0 7px 5px rgba(66,62,98,.30)) + (0 2px 1px …/.34);
   mum Liquid_Dark reçetesi: (0 12px 12px rgba(0,0,0,.55)) + (0 3px 4px …/.5). */
const CUTOUT_SHADOW =
  "drop-shadow-[0_7px_5px_rgba(66,62,98,0.3)] drop-shadow-[0_2px_1px_rgba(66,62,98,0.34)]";

const KIND = {
  chains: {
    src: "/brand/cutout/gold-chains.webp",
    motion: "animate-[obj-sway_16s_ease-in-out_infinite]",
    shadow: CUTOUT_SHADOW,
  },
  prism: {
    src: "/brand/platform/holo-prism.webp",
    motion: "animate-[obj-float_12s_ease-in-out_infinite]",
    shadow: CUTOUT_SHADOW,
  },
  stones: {
    src: "/brand/cutout/stones.png",
    motion: "", // taşlar hareket etmez — gerçekçilik
    shadow: CUTOUT_SHADOW,
  },
  candle: {
    src: "/brand/cutout/candle.png",
    motion: "", // mum gövdesi sabit; yalnız alev yaşar
    shadow:
      "drop-shadow-[0_12px_12px_rgba(0,0,0,0.55)] drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)]",
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
            {/* Alevin kendi ışığı — Liquid_Dark .flame reçetesi birebir:
                obje genişliğinin %117'si çapında daire (ref 98px/84px),
                radial rgba(255,206,138,.6)→(255,166,90,.2) %40→şeffaf %72,
                blur(7px), mix-blend screen, flameGlow 2.6s + flameTrem 1.3s.
                Ref fitili kutunun %42'sindeydi; bu PNG'de (560×1334) fitil
                ~%10'da — alev FİTİLE eşlenir (ref: "mapped onto the wick"). */}
            <span
              className="absolute top-[10%] left-1/2 aspect-square w-[117%] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen animate-[flame-glow_2.6s_ease-in-out_infinite,flame-trem_1.3s_ease-in-out_infinite]"
              style={{
                background:
                  "radial-gradient(circle, rgb(255 206 138 / 0.6) 0%, rgb(255 166 90 / 0.2) 40%, transparent 72%)",
                filter: "blur(7px)",
              }}
            />
            {/* Mumun zemine döktüğü sıcak havuz — Liquid_Dark ::after birebir:
                bottom -12px, 120×56 (obje genişliğinin %143'ü, 15:7 elips),
                rgba(255,182,112,.16)→şeffaf %70, blur(8px), screen. */}
            <span
              className="absolute -bottom-3 left-1/2 aspect-[15/7] w-[143%] -translate-x-1/2 rounded-full mix-blend-screen"
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
      {/* Koyu zemin sakinleştirici — holo-drift'in menekşe bloom'unu üst
          bölgede düşük kromalı soğuk griye çeker (referans lume ground:
          oklch ~262, krom 0.02). Yalnız koyuda; kartlar opak olduğundan
          etkisi boşluklarda okunur. */}
      <span className="absolute inset-x-0 top-0 hidden h-[42rem] dark:block [background:radial-gradient(120%_100%_at_50%_0%,oklch(0.20_0.015_262/0.55),transparent_70%)]" />
      {/* Yerleşim: sayfaların pb-28 alt "gutter"ı + üst hero şeridi — objeler
          içeriğin ARKASINDA kalır; görünür kısımları boş zeminlere denk gelir.
          Mum yüksek obje: üst gövdesi + alevi başlık şeridinde görünür, alt
          gövdesi ilk kart sırasının ARKASINDA kaybolur (referans: housing
          kenarına oturan mum — .candle-obj top:-84px dili). */}
      {page === "panel" && (
        <>
          <SceneCutout kind="stones" depth="far" className="bottom-3 left-10" />
          {/* Mobilde gizli: 390px'te mum, başlık/select şeridine düşüp okumayı
              bozuyordu — cutout'lar yalnız boş zeminlere denk gelmeli. */}
          <SceneCutout kind="candle" depth="near" className="max-md:hidden! top-2 right-32 md:right-56" />
        </>
      )}
      {page === "satislar" && (
        <>
          {/* Mobilde gizli: zincir, CTA butonu + idx etiketi bölgesine denk
              gelip mono etiketi okunmaz kılıyordu. */}
          {/* Masaüstünde zincir .idx satırının ('Jade Gold · NYC' sağ etiketi)
              ALTINA iner — parlak cutout soluk etiketi/KPI braketini örtmez
              (brief: okumayı asla engellemez). */}
          <SceneCutout kind="chains" depth="near" className="max-sm:hidden! top-44 -right-6 rotate-6" />
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
