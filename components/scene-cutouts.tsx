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
import { getActiveOrgSlug } from "@/lib/auth";

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
    // 320px webp (ekranda ≤160px görünür; PNG orijinali 657KB→21KB)
    src: "/brand/cutout/stones-sm.webp",
    motion: "", // taşlar hareket etmez — gerçekçilik
    shadow: CUTOUT_SHADOW,
  },
  candle: {
    src: "/brand/cutout/candle-sm.webp",
    motion: "", // mum gövdesi sabit; yalnız alev yaşar
    shadow:
      "drop-shadow-[0_12px_12px_rgba(0,0,0,0.55)] drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)]",
  },
  // EON üretim görseli — som altın alyans çifti (Higgsfield üretimi cutout).
  rings: {
    src: "/brand/cutout/eon-rings-sm.webp",
    motion: "", // ağır metal objeler zeminde durur — gerçekçilik
    shadow: CUTOUT_SHADOW,
  },
} as const;

export type CutoutKind = keyof typeof KIND;

/**
 * Marka-duyarlı cutout çevirisi — ürün görselleri markaya aittir; bir markanın
 * paneli başka markanın ürününü GÖSTEREMEZ. Jade: kendi seti. EON: alyans
 * cutout'u. Diğer/gelecek org'lar: nötr (yalnız platform prizması).
 * null = o obje bu markada hiç render edilmez.
 */
type Brand = "jade" | "eon" | "neutral";

const BRAND_KIND: Record<Brand, Record<CutoutKind, CutoutKind | null>> = {
  jade: { chains: "chains", stones: "stones", candle: "candle", prism: "prism", rings: "rings" },
  eon: { chains: "rings", stones: "rings", candle: null, prism: "prism", rings: "rings" },
  neutral: { chains: null, stones: null, candle: null, prism: "prism", rings: null },
};

function resolveBrand(slug: string | null): Brand {
  if (!slug) return "neutral";
  if (slug.startsWith("jade")) return "jade";
  if (slug.startsWith("eon")) return "eon";
  return "neutral";
}

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

type SceneLayer = "back" | "front";

interface Placement {
  kind: CutoutKind;
  depth: Depth;
  className: string;
  /** back = içerik arkasında; front = kart kenarına BİNER (önde durur). */
  layer: SceneLayer;
}

type ScenePage =
  | "panel"
  | "satislar"
  | "maliyetler"
  | "gorevler"
  | "yorumlar"
  | "raporlar"
  | "yildiz-satici"
  | "stok";

/**
 * Sayfa sahneleri — hangi objeler, hangi derinlik/katman/konumda. Gerçekçi
 * derinlik: bazı objeler kartların ARKASINDA kaybolur (back), bazıları kart
 * köşe/kenarının ÖNÜNE sarkar (front) — takı masaya, kart üstüne bırakılmış
 * gibi. Ön objeler yalnız köşe/kenara biner, metni asla örtmez; mobilde
 * gizlenir. Mum daima arkada (housing kenarına oturan mum dili).
 */
const SCENES: Record<ScenePage, Placement[]> = {
  panel: [
    { kind: "stones", depth: "far", className: "bottom-3 left-10", layer: "back" },
    // Mum AĞIR obje → zemine oturur; alt-sağ gutter'da içeriğin arkasında.
    { kind: "candle", depth: "near", className: "max-md:hidden! bottom-0 right-10 md:right-16", layer: "back" },
  ],
  satislar: [
    // Zincir kart sırasının sağ üst köşesine ÖNDEN sarkar — kartın üstüne
    // bırakılmış takı hissi (metin bölgesine girmez, köşeye biner).
    { kind: "chains", depth: "near", className: "max-sm:hidden! top-44 -right-6 rotate-6", layer: "front" },
    { kind: "prism", depth: "far", className: "bottom-3 left-10", layer: "back" },
  ],
  maliyetler: [
    // Taşlar alt-sol kart köşesinin önünde durur (masaya konmuş taş).
    { kind: "stones", depth: "near", className: "bottom-2 left-8", layer: "front" },
    { kind: "prism", depth: "far", className: "bottom-6 right-14", layer: "back" },
  ],
  gorevler: [
    { kind: "prism", depth: "far", className: "bottom-4 right-12", layer: "back" },
  ],
  yorumlar: [
    { kind: "stones", depth: "far", className: "max-sm:hidden! bottom-3 left-10", layer: "back" },
  ],
  raporlar: [
    { kind: "prism", depth: "far", className: "max-sm:hidden! bottom-4 right-12", layer: "back" },
  ],
  "yildiz-satici": [
    { kind: "chains", depth: "near", className: "max-md:hidden! top-40 -right-6 rotate-6", layer: "front" },
    { kind: "candle", depth: "far", className: "max-sm:hidden! bottom-3 left-8", layer: "back" },
  ],
  stok: [
    { kind: "stones", depth: "near", className: "max-sm:hidden! bottom-2 left-8", layer: "front" },
  ],
};

/**
 * Async RSC: aktif org'un markasına göre cutout seti çevrilir (Jade seti
 * yalnız Jade'de; EON alyans görselini görür, diğer org'lar nötr kalır).
 * İKİ KARDEŞ katman döner: -z arka sahne + z-[2] ön sahne. Negatif z-index'li
 * kap stacking context yarattığından ön objeler onun İÇİNDEN öne çıkamaz —
 * ön katman ayrı kardeş kap olmak zorunda. Her iki katman pointer-events-none.
 */
export async function SceneCutouts({ page }: { page: ScenePage }) {
  const map = BRAND_KIND[resolveBrand(await getActiveOrgSlug())];
  const resolved = SCENES[page]
    .map((pl) => ({ ...pl, kind: map[pl.kind] }))
    .filter((pl): pl is Placement => pl.kind != null);
  const render = (pl: Placement, i: number) => (
    <SceneCutout key={i} kind={pl.kind} depth={pl.depth} className={pl.className} />
  );
  const back = resolved.filter((p) => p.layer === "back");
  const front = resolved.filter((p) => p.layer === "front");

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[4] overflow-hidden"
      >
        {/* Koyu zemin sakinleştirici — holo-drift'in menekşe bloom'unu üst
            bölgede düşük kromalı soğuk griye çeker (referans lume ground:
            oklch ~262, krom 0.02). Yalnız koyuda; kartlar opak olduğundan
            etkisi boşluklarda okunur. */}
        <span className="absolute inset-x-0 top-0 hidden h-[42rem] dark:block [background:radial-gradient(120%_100%_at_50%_0%,oklch(0.20_0.015_262/0.55),transparent_70%)]" />
        {back.map(render)}
      </div>
      {front.length > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
        >
          {front.map(render)}
        </div>
      )}
    </>
  );
}
