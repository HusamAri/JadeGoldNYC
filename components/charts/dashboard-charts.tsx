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

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/* Sayısal eksen okumaları — editorial dil: mono + tabular (idiom: readout). */
const MONO_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
  fontFamily: "var(--font-mono)",
} as const;

/* Grafik tooltip'leri için ortak buzlu-cam (liquid glass) stili — "Neler Yeni"
   popup'ıyla aynı dil: yarı saydam cam + backdrop-blur + ince çerçeve + sheen.
   Renkler tema değişkenlerinden gelir, açık/koyu + marka kapsamında otomatik uyar.
   Diğer grafik dosyaları da aynı camı paylaşır (tek kaynak). */
export const GLASS_TOOLTIP = {
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
 * Paylaşılan SVG tanımları — TAM TEPEDEN bakılan 3B dili. Panelin geri
 * kalanı gibi grafiklere de kuşbakışı bakarız; yükseklik izometrik yüzeyle
 * DEĞİL, öğenin yüzeyin çok yukarısında durup ALTINA düşürdüğü yumuşak
 * gölge + çevresine yaydığı ışık alanıyla anlatılır (nöromorfik dil).
 *  - spot: grafiğin arkasına düşen yumuşak holo/altın ışık halesi
 *  - face: TEK vurgu çubuğunun/serinin üstten degrade dolgusu
 *  - area: çizginin yaydığı ışık — altına dökülen, sönümlenen yumuşak glow
 *  - stroke: çizgiye soldan sağa yoğunlaşan "gradient iz" (lume trail)
 *  - neutral: nötr kabarık çubuk yüzeyine üstten vuran adaptif ışık sheen'i
 *  - halo: parlayan uç nokta (glow dot) çevresindeki ışık halesi
 *  - float: öğeyi "çok yukarıda" gösteren birleşik filtre — aşağı ofsetli
 *    koyu yumuşak gölge (yükseklik) + tonda dış glow (yayılan ışık)
 *  - drop: yalnız aşağı düşen yumuşak gölge (nötr kabarık öğeler)
 *  - inset: oyulmuş oluk — üst iç gölge + alt iç dudak ışığı (nm-pressed dili)
 * Renkler --chart-* tokenlarından; platformda holo, JG'de altın.
 */
export function ChartDefs({
  id,
  tone = "var(--chart-1)",
}: {
  id: string;
  tone?: string;
}) {
  return (
    <defs>
      <radialGradient id={`${id}-spot`} cx="0.7" cy="0.1" r="0.8">
        <stop offset="0%" stopColor={tone} stopOpacity="0.18" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="24%" stopColor={tone} stopOpacity="0.98" />
        <stop offset="100%" stopColor={tone} stopOpacity="0.72" />
      </linearGradient>
      <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={tone} stopOpacity="0.42" />
        <stop offset="70%" stopColor={tone} stopOpacity="0.06" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </linearGradient>
      {/* Çizgi izi — geçmiş soluk, "şimdi"ye (sağa) doğru ışık yoğunlaşır. */}
      <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={tone} stopOpacity="0.3" />
        <stop offset="60%" stopColor={tone} stopOpacity="0.8" />
        <stop offset="100%" stopColor={tone} stopOpacity="1" />
      </linearGradient>
      {/* Nötr kabarık çubuk sheen'i — --glass-border beyazı tema ile ölçeklenir
          (açıkta belirgin, koyuda belli belirsiz lume kenarı). */}
      <linearGradient id={`${id}-neutral`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--glass-border)" />
        <stop offset="55%" stopColor="var(--glass-border)" stopOpacity="0.18" />
        <stop offset="100%" stopColor="var(--glass-border)" stopOpacity="0" />
      </linearGradient>
      {/* Parlayan uç nokta halesi. */}
      <radialGradient id={`${id}-halo`}>
        <stop offset="0%" stopColor={tone} stopOpacity="0.5" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </radialGradient>
      {/* "Çok yukarıda" hissi: aşağı ofsetli yumuşak koyu gölge (yüzeye düşer)
          + tonda dış glow (yayılan ışık) + kaynak. Tek geçişte birleşir. */}
      <filter id={`${id}-float`} x="-40%" y="-60%" width="180%" height="260%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="sblur" />
        <feOffset in="sblur" dx="0" dy="14" result="soff" />
        <feFlood floodColor="var(--glass-outer)" result="scol" />
        <feComposite in="scol" in2="soff" operator="in" result="shadow" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="glow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Nötr öğeler için: yalnız aşağı düşen yumuşak gölge (kuşbakışı yükseklik). */}
      <filter id={`${id}-drop`} x="-40%" y="-30%" width="180%" height="200%">
        <feDropShadow
          dx="0"
          dy="9"
          stdDeviation="6"
          floodColor="var(--glass-outer)"
        />
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
      style={{ fill: "rgb(var(--nm-dark) / 0.2)" }}
      filter={`url(#${defsId}-inset)`}
    />
  );
}

/**
 * TEPEDEN bakılan çubuk — oluk içinde TEK vurgu çubuğu accent (tone degradesi
 * + hafif glow: `-float`), diğerleri nötr kabarık (nm-raised dili: adaptif
 * beyaz sheen + yalnız aşağı düşen `-drop` gölgesi). `accentIndex` verilmezse
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
    <g filter={`url(#${defsId}-${accent ? "float" : "drop"})`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        fill={accent ? `url(#${defsId}-face)` : "var(--secondary)"}
      />
      {!accent && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={r}
          style={{ fill: "rgb(var(--nm-dark) / 0.26)" }}
        />
      )}
      {/* üst pah highlight'ı — kuşbakışı ışık yüzeye tepeden vurur */}
      {width > 4 && (
        <rect
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={Math.min(3, height)}
          rx={r * 0.6}
          fill="#ffffff"
          opacity={accent ? 0.55 : 0.4}
        />
      )}
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
  const { cx, cy, index, points, tone = "var(--chart-1)", defsId } = props;
  const last = (points?.length ?? 0) - 1;
  if (cx == null || cy == null || index == null || index !== last || last < 0) {
    return <g aria-hidden="true" />;
  }
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={11} fill={`url(#${defsId}-halo)`} />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={tone}
        stroke="var(--glass-border)"
        strokeWidth={1.5}
      />
      <circle cx={cx - 1.2} cy={cy - 1.2} r={1.1} fill="#ffffff" opacity={0.9} />
    </g>
  );
}

export function TrendChart({
  data,
}: {
  data: { label: string; revenue: number; cost: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
        <ChartDefs id="trend" tone="var(--chart-1)" />
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
        <Area
          type="monotone"
          dataKey="revenue"
          name="Gelir"
          stroke="var(--chart-1)"
          fill="url(#trend-area)"
          strokeWidth={2.5}
          dot={(p) => <GlowDot {...p} defsId="trend" tone="var(--chart-1)" />}
          activeDot={{ r: 5, fill: "var(--chart-1)", filter: "url(#trend-float)" }}
        />
        <Area
          type="monotone"
          dataKey="cost"
          name="Maliyet"
          stroke="var(--chart-4)"
          fill="none"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Günlük/dönemsel sipariş sayısı — oyuk raylar içinde kabarık çubuklar;
 *  zirve gün TEK accent (degrade + glow), kalanı nötr raised. */
export function OrdersBarChart({
  data,
}: {
  data: { label: string; orders: number }[];
}) {
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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 16, right: 14, left: 0, bottom: 0 }}>
        <ChartDefs id="orders" tone="var(--chart-1)" />
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
        <Bar
          dataKey="orders"
          name="Sipariş"
          shape={<BarNeo defsId="orders" accentIndex={accentIdx} />}
          background={<GrooveTrack defsId="orders" />}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Aylık ciro — gradient izli çizgi + parlayan uç nokta + spot ışık (Satışlar). */
export function RevenueAreaChart({
  data,
}: {
  data: { label: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
        <ChartDefs id="rev" tone="var(--chart-2)" />
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
          formatter={(v) => [`$${Number(v).toLocaleString("en-US")}`, "Ciro"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Ciro"
          stroke="var(--chart-2)"
          fill="url(#rev-area)"
          strokeWidth={2.5}
          dot={(p) => <GlowDot {...p} defsId="rev" tone="var(--chart-2)" />}
          activeDot={{ r: 5, fill: "var(--chart-2)", filter: "url(#rev-float)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        Bu dönemde maliyet kaydı yok.
      </div>
    );
  }
  const total = data.reduce((a, d) => a + (d.value ?? 0), 0);
  return (
    // Digital-display halka: oyulmuş oluk (debossed ray) içinde accent yay;
    // donut'un ortasında camsı disk üzerinde mono/segment tarzı toplam
    // okuması (ışıklı) — "digital display" dili korunur.
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <ChartDefs id="pie" />
          {/* Oyuk ray — dilimlerin oturduğu, yüzeye kazınmış tam halka. */}
          <Pie
            data={[{ name: "ray", value: 1 }]}
            dataKey="value"
            innerRadius={58}
            outerRadius={99}
            fill="var(--muted)"
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
            stroke="var(--card)"
            strokeWidth={2}
            filter="url(#pie-drop)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...GLASS_TOOLTIP} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      {/* Merkezî dijital okuma — halkanın göbeğinde camsı disk + ışıklı mono */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center"
        style={{ top: 0, height: 260, paddingBottom: 34 }}
      >
        <div className="flex size-[104px] flex-col items-center justify-center rounded-full border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-tint),var(--glass-sheen)] shadow-[var(--glass-highlight),var(--glass-ring),var(--glass-depth)] [backdrop-filter:var(--glass-filter-sm)]">
          <span className="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.22em] uppercase">
            Toplam
          </span>
          <span className="text-digital mt-0.5 text-lg text-[color:var(--gold-deep)]">
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
