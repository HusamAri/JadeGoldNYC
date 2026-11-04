"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartAnimation } from "@/lib/motion";

/**
 * Grafik mürekkep değişkenleri — Spatial (açık) / Lume (koyu) kayıtları.
 * Açık: Spatial mor oklch ailesi (0.54/0.66 0.20 278–286), negatif 0.58 0.16 344.
 * Koyu: Lume — kuyruğu sönen beyaz iz (lineTrail), #c9cde6 alan fade'i, cam
 * barlar (oklch .62/.9 262) + taban ışık havuzu, beyaz-stroke'lu uç nokta.
 * Her grafiğin kök sarmalayıcısına uygulanır; SVG defs bu değişkenleri okur.
 */
export const CHART_INK = [
  // — mürekkep ailesi (kategori/seri renkleri): orman yeşili, altın, yosun,
  //   çay yeşili; negatif kil kırmızısı. Amuletta 2.0 (docs/amuletta-2/plan.md).
  "[--jg-ink-1:var(--chart-1)]",
  "[--jg-ink-2:var(--chart-2)]",
  "[--jg-ink-3:var(--chart-3)]",
  "[--jg-ink-4:var(--chart-4)]",
  "[--jg-ink-neg:var(--chart-5)]",
  // — çizgi izi: yeşil yoğunlaşır (koyuda altına döner, kuyruk söner) —
  "[--jg-trail-0:oklch(0.45_0.10_152/.28)] dark:[--jg-trail-0:oklch(0.82_0.13_88/0)]",
  "[--jg-trail-1:oklch(0.45_0.10_152/.75)] dark:[--jg-trail-1:oklch(0.82_0.13_88/.55)]",
  "[--jg-trail-2:oklch(0.40_0.10_152)] dark:[--jg-trail-2:oklch(0.88_0.11_90)]",
  // — alan dolgusu —
  "[--jg-area-c:oklch(0.45_0.10_152/.26)] dark:[--jg-area-c:oklch(0.82_0.13_88/.28)]",
  "[--jg-area-c0:oklch(0.45_0.10_152/0)] dark:[--jg-area-c0:oklch(0.82_0.13_88/0)]",
  // — çizgi ışıması (yalnız koyuda) —
  "[--jg-lglow-a:transparent] dark:[--jg-lglow-a:oklch(0.82_0.13_88/.5)]",
  "[--jg-lglow-b:transparent] dark:[--jg-lglow-b:oklch(0.82_0.13_88/.22)]",
  // — uç nokta —
  "[--jg-dot-f:var(--surface)] dark:[--jg-dot-f:oklch(0.82_0.13_88)]",
  "[--jg-dot-s:oklch(0.45_0.10_152)] dark:[--jg-dot-s:oklch(1_0_0/.85)]",
  "[--jg-dotglow:oklch(0.98_0.01_110/.9)] dark:[--jg-dotglow:oklch(0.82_0.13_88/.6)]",
  // — barlar: üst ışık +0,06 L gradyanı (yeşil cam), koyuda altın cam —
  "[--jg-bar-0:oklch(0.62_0.09_152/.95)] dark:[--jg-bar-0:oklch(0.86_0.10_90/.85)]",
  "[--jg-bar-1:oklch(0.50_0.10_152/.95)] dark:[--jg-bar-1:oklch(0.78_0.12_88/.85)]",
  "[--jg-bar-2:oklch(0.42_0.10_152)] dark:[--jg-bar-2:oklch(0.70_0.13_85/.9)]",
  "[--jg-bar-edge:oklch(0.98_0.01_110/.6)] dark:[--jg-bar-edge:oklch(1_0_0/.3)]",
  "[--jg-bar-edge-dim:oklch(0.98_0.01_110/.4)] dark:[--jg-bar-edge-dim:oklch(1_0_0/.12)]",
  "[--jg-bar-dim:oklch(0.60_0.06_130/.45)] dark:[--jg-bar-dim:oklch(0.70_0.08_90/.3)]",
  // — DOĞAL 3D gölge: ambient + kontak, bölüm tonuyla boyanır (siyah değil) —
  "[--jg-bar-shadow:var(--nm-lo)] dark:[--jg-bar-shadow:var(--nm-lo)]",
  "[--jg-bar-glow:transparent] dark:[--jg-bar-glow:oklch(0.82_0.13_88/.18)]",
  "[--jg-pool:transparent] dark:[--jg-pool:oklch(0.88_0.11_90/.6)]",
  // — ray/oluk ve dilim kenarı —
  "[--jg-groove:var(--nm-lo)] dark:[--jg-groove:oklch(0_0_0/.3)]",
  "[--jg-track:oklch(from_var(--nm-lo)_l_c_h/.6)] dark:[--jg-track:oklch(0.82_0.13_88/.14)]",
  "[--jg-slice-edge:var(--nm-hi)] dark:[--jg-slice-edge:oklch(1_0_0/.28)]",
].join(" ");

const COLORS = [
  "var(--jg-ink-1)",
  "var(--jg-ink-2)",
  "var(--jg-ink-3)",
  "var(--jg-ink-4)",
  "var(--jg-ink-neg)",
];

/* Sayısal eksen okumaları — index yüzü (.idx dili): mono + tabular readout. */
const MONO_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
  fontFamily: "var(--font-index)",
} as const;

/* Legend — CategoryPie ile aynı .idx dili (mono, uppercase, geniş tracking).
   Karşılaştırma overlay'li grafiklerde seri adları buradan okunur. */
const LEGEND_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--font-index)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

/* Grafik tooltip'leri için ortak buzlu-cam (liquid glass) stili — "Neler Yeni"
   popup'ıyla aynı dil: yarı saydam cam + backdrop-blur + ince çerçeve + sheen.
   Renkler tema değişkenlerinden gelir, açık/koyu + marka kapsamında otomatik uyar.
   Diğer grafik dosyaları da aynı camı paylaşır (tek kaynak). */
export const GLASS_TOOLTIP = {
  // Tooltip, grafik üstüne absolute binen merkez okuma/ada katmanının ALTINDA
  // kalmasın — popup her zaman en üstte okunur.
  wrapperStyle: { zIndex: 50 },
  contentStyle: {
    background: "var(--glass-sheen), var(--glass)",
    border: "1px solid var(--glass-border)",
    borderRadius: 14,
    fontSize: 12,
    padding: "8px 12px",
    color: "var(--popover-foreground)",
    boxShadow:
      "0 18px 40px -18px var(--glass-outer), var(--glass-highlight), var(--glass-depth)",
    backdropFilter: "var(--glass-filter-sm)",
    WebkitBackdropFilter: "var(--glass-filter-sm)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600, marginBottom: 2 },
} as const;

/**
 * Paylaşılan SVG tanımları — lab-referans iki kayıt (CHART_INK değişkenleri
 * üzerinden tema-duyarlı): açıkta Spatial cam/mor mürekkep, koyuda Lume
 * "içeriden aydınlatılmış" dil.
 *  - spot: grafiğin arkasına düşen yumuşak tonlu ışık halesi
 *  - face: renkli cam sütun dolgusu (Spatial iceUp / lume cam bar)
 *  - area: çizgi altı fade (mor / #c9cde6)
 *  - stroke: çizgi izi (mor yoğunlaşan / lineTrail beyaz)
 *  - halo: parlayan uç nokta çevresindeki ışık halesi
 *  - bpool + pool: bar tabanındaki screen ışık havuzu (yalnız koyu)
 *  - lglow: çizgi ışıması (yalnız koyu, çift drop-shadow)
 *  - dotglow: uç nokta ışıması
 *  - float/drop: sütun gölgesi — açıkta tonlu düşen gölge, koyuda dış glow
 *  - inset: oyulmuş oluk — üst iç gölge + alt iç dudak ışığı (nm-pressed dili)
 */
export function ChartDefs({
  id,
  tone = "var(--jg-ink-1)",
}: {
  id: string;
  tone?: string;
}) {
  return (
    <defs>
      <radialGradient id={`${id}-spot`} cx="0.7" cy="0.1" r="0.8">
        <stop offset="0%" stopColor={tone} stopOpacity="0.16" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </radialGradient>
      {/* Renkli cam sütun yüzü — açıkta Spatial iceUp (0.86→0.62→0.50 278),
          koyuda lume cam bar (0deg: .62 .06 262/.34 → .9 .04 262/.16). */}
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--jg-bar-0)" />
        <stop offset="50%" stopColor="var(--jg-bar-1)" />
        <stop offset="100%" stopColor="var(--jg-bar-2)" />
      </linearGradient>
      {/* Alan dolgusu — açıkta mor fade; koyuda #c9cde6 .36→0 (underFade). */}
      <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--jg-area-c)" />
        <stop offset="100%" stopColor="var(--jg-area-c0)" />
      </linearGradient>
      {/* Çizgi izi — açıkta mor yoğunlaşır; koyuda lineTrail: kuyruğu sönen
          beyaz (0 → #cbd2ff .45 → #fff). */}
      <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--jg-trail-0)" />
        <stop offset="50%" stopColor="var(--jg-trail-1)" />
        <stop offset="100%" stopColor="var(--jg-trail-2)" />
      </linearGradient>
      {/* Parlayan uç nokta halesi. */}
      <radialGradient id={`${id}-halo`}>
        <stop offset="0%" stopColor={tone} stopOpacity="0.5" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </radialGradient>
      {/* Bar tabanındaki ışık havuzu (yalnız koyuda görünür; açıkta şeffaf). */}
      <radialGradient id={`${id}-bpool`} cx="0.5" cy="1" r="0.9">
        <stop offset="0%" stopColor="var(--jg-pool)" />
        <stop offset="70%" stopColor="var(--jg-pool)" stopOpacity="0" />
      </radialGradient>
      {/* Çizgi ışıması — koyuda çift drop-shadow (0 0 6px + 0 0 16px);
          açıkta flood'lar şeffaf → glow yok (yalnız uç noktada). */}
      <filter id={`${id}-lglow`} x="-40%" y="-60%" width="180%" height="300%">
        {/* Çizginin altına düşen yumuşak ambient (bölüm tonlu) + koyuda ışıma. */}
        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="var(--jg-bar-shadow)" floodOpacity="0.3" />
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--jg-lglow-a)" />
        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="var(--jg-lglow-b)" />
      </filter>
      {/* Uç nokta ışıması — Spatial sparkDot: drop-shadow(0 0 8px beyaz .9). */}
      <filter id={`${id}-dotglow`} x="-120%" y="-120%" width="340%" height="340%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--jg-dotglow)" />
      </filter>
      {/* DOĞAL 3D GÖLGE (Amuletta 2.0): kontak (dy 1, sd 1) + ambient (dy 6,
          sd 8), ikisi de bölüm tonuyla boyalı (--jg-bar-shadow = --nm-lo),
          asla siyah; koyuda ayrıca altın dış ışıma. Grafik başına TEK filtre
          (performans: blur maliyeti alan × yarıçap; animasyon yok). */}
      <filter id={`${id}-float`} x="-40%" y="-60%" width="180%" height="300%">
        <feDropShadow in="SourceGraphic" dx="0" dy="6" stdDeviation="8" floodColor="var(--jg-bar-shadow)" floodOpacity="0.42" result="ambient" />
        <feDropShadow in="SourceGraphic" dx="0" dy="1" stdDeviation="1" floodColor="var(--jg-bar-shadow)" floodOpacity="0.6" result="contact" />
        <feDropShadow in="SourceGraphic" dx="0" dy="0" stdDeviation="8" floodColor="var(--jg-bar-glow)" result="glow" />
        <feMerge>
          <feMergeNode in="ambient" />
          <feMergeNode in="contact" />
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Nötr sütun / dilim: aynı tarif, ışımasız. */}
      <filter id={`${id}-drop`} x="-40%" y="-60%" width="180%" height="300%">
        <feDropShadow in="SourceGraphic" dx="0" dy="5" stdDeviation="7" floodColor="var(--jg-bar-shadow)" floodOpacity="0.36" result="ambient" />
        <feDropShadow in="SourceGraphic" dx="0" dy="1" stdDeviation="1" floodColor="var(--jg-bar-shadow)" floodOpacity="0.5" result="contact" />
        <feMerge>
          <feMergeNode in="ambient" />
          <feMergeNode in="contact" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Havuz blur'u — lume ::after blur(7px) karşılığı. */}
      <filter id={`${id}-pool`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      {/* Oyulmuş oluk — ışık tepeden geldiği için iç gölge ÜSTTE, alt dudakta
          ince adaptif highlight (nm-pressed'in SVG karşılığı). */}
      <filter id={`${id}-inset`} x="-20%" y="-20%" width="140%" height="140%">
        <feOffset in="SourceAlpha" dx="0" dy="2.5" result="po" />
        <feGaussianBlur in="po" stdDeviation="2.2" result="pb" />
        <feComposite in="SourceAlpha" in2="pb" operator="out" result="pz" />
        <feFlood floodColor="var(--glass-outer)" floodOpacity="0.55" result="pc" />
        <feComposite in="pc" in2="pz" operator="in" result="ps" />
        <feOffset in="SourceAlpha" dx="0" dy="-1.5" result="ho" />
        <feGaussianBlur in="ho" stdDeviation="1" result="hb" />
        <feComposite in="SourceAlpha" in2="hb" operator="out" result="hz" />
        <feFlood floodColor="var(--glass-border)" result="hc" />
        <feComposite in="hc" in2="hz" operator="in" result="hl" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="ps" />
          <feMergeNode in="hl" />
        </feMerge>
      </filter>
    </defs>
  );
}

/**
 * Çubuk grafiklerde her sütunun arkasındaki OYUK RAY — çubuk, yüzeye oyulmuş
 * bir oluğun içinde kabarır (idiom: bars in inset groove). Recharts `background`.
 * Renk token'lardan türeyen nötr gölge; derinlik `-inset` filtresinden gelir.
 */
export function GrooveTrack(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  defsId: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, defsId } = props;
  if (height <= 0 || width <= 0) return null;
  const r = Math.min(7, width * 0.36);
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={r}
      style={{ fill: "var(--jg-groove)" }}
      filter={`url(#${defsId}-inset)`}
    />
  );
}

/**
 * Renkli cam sütun — açıkta Spatial "range column" (iceUp degradesi + 1px
 * beyaz kenar + tonlu düşen gölge), koyuda lume cam bar (cam dolgu + 1px
 * beyaz border + tabanda screen ışık havuzu + dış glow). HER sütun içten
 * ışıklı camdır (referans: mat gri levha yok); vurgu sütunu tam yoğunlukta,
 * diğerleri aynı cam malzemenin hafif soluk hâli. `accentIndex` verilmezse
 * tüm çubuklar accent kalır. Recharts custom `shape`; `index` Recharts'tan gelir.
 */
export function BarNeo(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  accentIndex?: number;
  defsId: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, index, accentIndex, defsId } = props;
  if (height <= 0 || width <= 0) return null;
  const accent = accentIndex == null || index === accentIndex;
  const r = Math.min(6, width * 0.32);
  return (
    <g>
      <g filter={`url(#${defsId}-float)`}>
        <rect
          x={x + 0.5}
          y={y + 0.5}
          width={Math.max(width - 1, 1)}
          height={Math.max(height - 1, 1)}
          rx={r}
          fill={`url(#${defsId}-face)`}
          fillOpacity={accent ? 1 : 0.72}
          stroke="var(--jg-bar-edge)"
          strokeOpacity={accent ? 1 : 0.65}
          strokeWidth={1}
        />
        {/* üst iç highlight — ışık tepeden vurur (inset 0 1px 0 beyaz) */}
        {width > 4 && (
          <rect
            x={x + 1.5}
            y={y + 1.5}
            width={width - 3}
            height={Math.min(2, height)}
            rx={r * 0.5}
            fill="#ffffff"
            opacity={accent ? 0.5 : 0.3}
          />
        )}
      </g>
      {/* tabanda ışık havuzu — lume ::after: radyal + blur(7px) + screen;
          açıkta --jg-pool şeffaf olduğundan görünmez. Havuz bar tabanının
          İÇİNDE kalır (referans lume reçetesi): elips tamamen çizim alanında,
          eksen etiketlerine (Eyl 25 vb.) taşmaz. */}
      <ellipse
        aria-hidden="true"
        cx={x + width / 2}
        cy={y + height - Math.min(14, height * 0.45)}
        rx={width * 0.5}
        ry={Math.min(14, height * 0.45)}
        fill={`url(#${defsId}-bpool)`}
        filter={`url(#${defsId}-pool)`}
        style={{ mixBlendMode: "screen" }}
      />
    </g>
  );
}

/**
 * Parlayan uç nokta (glow dot) — serinin YALNIZ son noktasında ışık taşıyan
 * bir damla: tonda hale (`-halo`) + cam kenarlıklı çekirdek + beyaz spec.
 * Recharts `dot` fonksiyon formu; son nokta `points` uzunluğundan bulunur.
 */
export function GlowDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  points?: readonly unknown[];
  tone?: string;
  defsId: string;
}) {
  const { cx, cy, index, points, defsId } = props;
  const last = (points?.length ?? 0) - 1;
  if (cx == null || cy == null || index == null || index !== last || last < 0) {
    return <g aria-hidden="true" />;
  }
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={11} fill={`url(#${defsId}-halo)`} />
      {/* Açıkta Spatial sparkDot (beyaz + mor stroke + beyaz ışıma);
          koyuda lume ldot (oklch .72 .14 262 + beyaz stroke + lume ışıma). */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--jg-dot-f)"
        stroke="var(--jg-dot-s)"
        strokeWidth={1.5}
        filter={`url(#${defsId}-dotglow)`}
      />
      <circle cx={cx - 1.2} cy={cy - 1.2} r={1.1} fill="#ffffff" opacity={0.9} />
    </g>
  );
}

export function TrendChart({
  data,
  compareLabel,
}: {
  data: {
    label: string;
    revenue: number;
    cost: number;
    /** Önceki dönemin aynı gün-index'ine hizalanmış geliri (overlay). */
    prevRevenue?: number | null;
  }[];
  /** Verilirse `prevRevenue` kesikli/soluk ikinci gelir çizgisi olarak çizilir. */
  compareLabel?: string;
}) {
  const anim = useChartAnimation();
  return (
    <div className={CHART_INK}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
          <ChartDefs id="trend" tone="var(--jg-ink-1)" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#trend-spot)" />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={MONO_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...GLASS_TOOLTIP} />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="plainline" />
          {/* Önceki dönem overlay'i — soluk + kesikli; gün index'ine hizalı.
              DOM'da önce gelir ki asıl seriler üstte kalsın. */}
          {compareLabel && (
            <Area
              type="monotone"
              dataKey="prevRevenue"
              name={compareLabel}
              stroke="var(--jg-ink-4)"
              strokeOpacity={0.8}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            name="Gelir"
            stroke="url(#trend-stroke)"
            fill="url(#trend-area)"
            strokeWidth={2.5}
            filter="url(#trend-lglow)"
            dot={(p) => <GlowDot {...p} defsId="trend" tone="var(--jg-ink-1)" />}
            activeDot={{
              r: 5,
              fill: "var(--jg-ink-1)",
              filter: "url(#trend-dotglow)",
            }}
            {...anim}
          />
          <Area
            type="monotone"
            dataKey="cost"
            name="Maliyet"
            stroke="var(--jg-ink-neg)"
            fill="none"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            {...anim}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Günlük/dönemsel sipariş sayısı — oyuk raylar içinde kabarık çubuklar;
 *  zirve gün TEK accent (degrade + glow), kalanı nötr raised. */
export function OrdersBarChart({
  data,
  compareLabel,
}: {
  data: {
    label: string;
    orders: number;
    /** Karşılaştırma dönemi sipariş sayısı (soluk overlay bar). */
    prevOrders?: number | null;
  }[];
  /** Verilirse `prevOrders` soluk ikinci bar serisi olarak çizilir. */
  compareLabel?: string;
}) {
  const anim = useChartAnimation();
  const total = data.reduce((a, d) => a + (d.orders ?? 0), 0);
  if (total === 0) {
    return (
      <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
        Bu dönemde sipariş yok.
      </div>
    );
  }
  const accentIdx = data.reduce(
    (best, d, i) => ((d.orders ?? 0) > (data[best]?.orders ?? 0) ? i : best),
    0,
  );
  return (
    <div className={CHART_INK}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16, right: 14, left: 0, bottom: 0 }}>
          <ChartDefs id="orders" tone="var(--jg-ink-1)" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#orders-spot)" />
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={MONO_TICK}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
            {...GLASS_TOOLTIP}
          />
          {compareLabel && <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" />}
          <Bar
            dataKey="orders"
            name="Sipariş"
            shape={<BarNeo defsId="orders" accentIndex={accentIdx} />}
            background={<GrooveTrack defsId="orders" />}
            {...anim}
          />
          {/* Karşılaştırma dönemi — aynı cam dilin soluk hâli (dim dolgu),
              oyuk ray yok: asıl seriden görsel olarak geride durur. */}
          {compareLabel && (
            <Bar
              dataKey="prevOrders"
              name={compareLabel}
              fill="var(--jg-bar-dim)"
              stroke="var(--jg-bar-edge-dim)"
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              {...anim}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Aylık ciro — gradient izli çizgi + parlayan uç nokta + spot ışık (Satışlar). */
export function RevenueAreaChart({
  data,
  compareLabel,
}: {
  data: {
    label: string;
    revenue: number;
    /** Geçen yılın aynı ayına hizalanmış ciro (kesikli overlay). */
    compareRevenue?: number | null;
  }[];
  /** Verilirse `compareRevenue` kesikli/soluk ikinci çizgi olarak çizilir. */
  compareLabel?: string;
}) {
  const anim = useChartAnimation();
  return (
    <div className={CHART_INK}>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
          <ChartDefs id="rev" tone="var(--jg-ink-2)" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#rev-spot)" />
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={MONO_TICK}
            tickLine={false}
            axisLine={false}
            width={46}
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
          />
          <Tooltip
            {...GLASS_TOOLTIP}
            formatter={(v, name) => [
              `$${Number(v).toLocaleString("en-US")}`,
              String(name),
            ]}
          />
          {compareLabel && (
            <Legend wrapperStyle={LEGEND_STYLE} iconType="plainline" />
          )}
          {/* Geçen yıl overlay'i — soluk + kesikli; asıl serinin altında çizilir. */}
          {compareLabel && (
            <Area
              type="monotone"
              dataKey="compareRevenue"
              name={compareLabel}
              stroke="var(--jg-ink-4)"
              strokeOpacity={0.8}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            name="Ciro"
            stroke="url(#rev-stroke)"
            fill="url(#rev-area)"
            strokeWidth={2.5}
            filter="url(#rev-lglow)"
            dot={(p) => <GlowDot {...p} defsId="rev" tone="var(--jg-ink-2)" />}
            activeDot={{
              r: 5,
              fill: "var(--jg-ink-2)",
              filter: "url(#rev-dotglow)",
            }}
            {...anim}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const anim = useChartAnimation();
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        Bu dönemde maliyet kaydı yok.
      </div>
    );
  }
  const total = data.reduce((a, d) => a + (d.value ?? 0), 0);
  return (
    // Analog kadran: açıkta Spatial donut (mor cam dilimler + tick halkası +
    // iç cam hub), koyuda lume gauge (arc glow + tick conic halka + beyaz
    // ışımalı font-index okuma).
    <div className={`relative ${CHART_INK}`}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <ChartDefs id="pie" />
          {/* Oyuk ray — dilimlerin oturduğu, yüzeye kazınmış tam halka. */}
          <Pie
            data={[{ name: "ray", value: 1 }]}
            dataKey="value"
            innerRadius={58}
            outerRadius={99}
            fill="var(--jg-track)"
            stroke="none"
            isAnimationActive={false}
            legendType="none"
            tooltipType="none"
            filter="url(#pie-inset)"
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={95}
            paddingAngle={2}
            cornerRadius={3}
            stroke="var(--jg-slice-edge)"
            strokeWidth={1.5}
            filter="url(#pie-float)"
            {...anim}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...GLASS_TOOLTIP} />
          <Legend
            wrapperStyle={{
              fontSize: 10,
              fontFamily: "var(--font-index)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Merkezî okuma + tick halkası — Spatial/lume kadran dili */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center"
        style={{ top: 0, height: 260, paddingBottom: 34 }}
      >
        {/* Silindir gölgesi — tick bandına vuran ışık/gölge: üst rim beyaz
            highlight, alt rim mor gölge. Düz halkayı içe kavisli bir silindir
            duvarı gibi okutur (3B derinlik). */}
        <div
          className="absolute left-1/2 size-[204px] -translate-x-1/2 -translate-y-1/2 rounded-full [background-image:linear-gradient(to_bottom,rgba(255,255,255,.55),transparent_44%,oklch(from_var(--nm-lo)_l_c_h/.5))] [mask-image:radial-gradient(farthest-side,transparent_calc(100%_-_13px),#000_calc(100%_-_12px))] dark:[background-image:linear-gradient(to_bottom,oklch(1_0_0/.18),transparent_46%,rgba(0,0,0,.4))]"
          style={{ top: "calc(50% - 17px)" }}
        />
        {/* Tick halkası — açıkta repeating-conic (70,52,120/.5, .6°/15°);
            koyuda lume tick'leri (.9°/6°). İki maske İÇ İÇE elemanda: dış
            sarmalayıcı üstten-alta sönümler (alt tick'ler silinir — simetri
            bozulmaz, tick'ler üst rim'e sarılır: silindir ağzı hissi), içteki
            dış ince bandı keser. mask-composite gerektirmez — desteklemeyen
            motorda maskeler union'a düşüp diski doldurmasın diye. */}
        <div
          className="absolute left-1/2 size-[204px] -translate-x-1/2 -translate-y-1/2 [mask-image:linear-gradient(to_bottom,#000_0%,#000_40%,transparent_88%)]"
          style={{ top: "calc(50% - 17px)" }}
        >
          <div className="size-full rounded-full [background-image:repeating-conic-gradient(from_-90deg,oklch(from_var(--nm-lo)_l_c_h/.6)_0deg_.6deg,transparent_.6deg_15deg)] [mask-image:radial-gradient(farthest-side,transparent_calc(100%_-_12px),#000_calc(100%_-_11px))] dark:[background-image:repeating-conic-gradient(from_-90deg,oklch(0.82_0.13_88/.4)_0deg_.9deg,transparent_.9deg_6deg)]" />
        </div>
        {/* İç cam hub — radyal beyaz→cam + Spatial iç gölge çifti; koyuda sade
            lume yüzeyi (okuma kendisi ışır). */}
        <div className="flex size-[118px] flex-col items-center justify-center rounded-full border border-[color:rgba(255,255,255,.7)] [background-image:radial-gradient(circle_at_40%_32%,#ffffff,var(--glass)_72%)] [backdrop-filter:var(--glass-filter-sm)] [box-shadow:inset_0_3px_7px_rgba(255,255,255,.8),inset_0_-8px_13px_oklch(from_var(--nm-lo)_l_c_h/.55),0_5px_9px_-3px_oklch(from_var(--nm-lo)_l_c_h/.5)] dark:border-[color:oklch(1_0_0/0.08)] dark:[background-color:oklch(1_0_0/0.04)] dark:[background-image:none] dark:[box-shadow:inset_0_1px_0_oklch(1_0_0/0.08)]">
          <span className="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.22em] uppercase [font-family:var(--font-index)]">
            Toplam
          </span>
          <span className="text-foreground mt-0.5 text-xl font-medium [font-family:var(--font-index)] [text-shadow:0_1px_0_rgba(255,255,255,.85)] dark:text-white dark:[text-shadow:0_0_14px_rgba(255,255,255,.5)]">
            $
            {total.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
