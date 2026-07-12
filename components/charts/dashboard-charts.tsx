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

/* Grafik tooltip'leri için ortak buzlu-cam (liquid glass) stili — "Neler Yeni"
   popup'ıyla aynı dil: yarı saydam cam + backdrop-blur + ince çerçeve + sheen.
   Renkler tema değişkenlerinden gelir, açık/koyu + marka kapsamında otomatik uyar. */
const GLASS_TOOLTIP = {
  contentStyle: {
    background: "var(--glass-sheen), var(--glass)",
    border: "1px solid var(--glass-border)",
    borderRadius: 14,
    fontSize: 12,
    padding: "8px 12px",
    color: "var(--popover-foreground)",
    boxShadow:
      "0 18px 40px -18px var(--glass-outer), var(--glass-highlight), var(--glass-depth)",
    backdropFilter: "blur(16px) saturate(150%)",
    WebkitBackdropFilter: "blur(16px) saturate(150%)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600, marginBottom: 2 },
} as const;

/**
 * Paylaşılan SVG tanımları — TAM TEPEDEN bakılan 3B dili. Panelin geri
 * kalanı gibi grafiklere de kuşbakışı bakarız; yükseklik izometrik yüzeyle
 * DEĞİL, öğenin yüzeyin çok yukarısında durup ALTINA düşürdüğü yumuşak
 * gölge + çevresine yaydığı ışık alanıyla anlatılır (nöromorfik dil).
 *  - spot: grafiğin arkasına düşen yumuşak holo/altın ışık halesi
 *  - face: barın üstten degrade dolgusu (sol-üst highlight, sağ-alt gölge)
 *  - area: çizginin yaydığı ışık — altına dökülen yumuşak glow
 *  - float: öğeyi "çok yukarıda" gösteren birleşik filtre — aşağı ofsetli
 *    koyu yumuşak gölge (yükseklik) + tonda dış glow (yayılan ışık)
 * Renkler --chart-* tokenlarından; platformda holo, JG'de altın.
 */
function ChartDefs({ id, tone = "var(--chart-1)" }: { id: string; tone?: string }) {
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
        <stop offset="0%" stopColor={tone} stopOpacity="0.34" />
        <stop offset="70%" stopColor={tone} stopOpacity="0.06" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </linearGradient>
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
      {/* Barlar için: yalnız aşağı düşen yumuşak gölge (kuşbakışı yükseklik). */}
      <filter id={`${id}-drop`} x="-40%" y="-30%" width="180%" height="200%">
        <feDropShadow
          dx="0"
          dy="9"
          stdDeviation="6"
          floodColor="var(--glass-outer)"
        />
      </filter>
    </defs>
  );
}

/**
 * TEPEDEN bakılan yükseltilmiş bar — izometrik yüz YOK. Düz, üstten
 * aydınlatılmış (sol-üst beyaz highlight → sağ-alt tonda gölge) yuvarlak
 * bar; ALTINA düşen yumuşak gölge (drop) barı yüzeyin yukarısında "yüzer"
 * gösterir. Işık yönü panelin geri kalanıyla aynı. Recharts custom `shape`.
 */
function BarRaised(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  defsId: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, defsId } = props;
  if (height <= 0 || width <= 0) return null;
  const r = Math.min(6, width * 0.32);
  return (
    <g filter={`url(#${defsId}-drop)`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        fill={`url(#${defsId}-face)`}
      />
      {/* üst pah highlight'ı — kuşbakışı ışık yüzeye tepeden vurur */}
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={Math.min(3, height)}
        rx={r * 0.6}
        fill="#ffffff"
        opacity="0.55"
      />
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
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <ChartDefs id="trend" tone="var(--chart-1)" />
        <rect x="0" y="0" width="100%" height="100%" fill="url(#trend-spot)" />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip {...GLASS_TOOLTIP} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Gelir"
          stroke="var(--chart-1)"
          fill="url(#trend-area)"
          strokeWidth={2.5}
          filter="url(#trend-float)"
          dot={false}
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

/** Günlük/dönemsel sipariş sayısı — tepeden yükseltilmiş barlar + spot ışık. */
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
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
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
          shape={<BarRaised defsId="orders" />}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Aylık ciro — neon ışımalı tek-seri alan grafiği + spot ışık (Satışlar). */
export function RevenueAreaChart({
  data,
}: {
  data: { label: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
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
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
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
          filter="url(#rev-float)"
          dot={false}
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
    // Digital-display halka: donut'un ortasında camsı bir disk üzerinde
    // mono/segment tarzı toplam okuması (ışıklı) — "digital display" dili.
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <defs>
            <filter id="pie-depth" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="7"
                floodColor="var(--glass-outer)"
              />
            </filter>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={95}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            filter="url(#pie-depth)"
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
        <div className="flex size-[104px] flex-col items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[image:var(--glass-sheen),var(--glass)] shadow-[var(--glass-highlight),var(--glass-depth)] backdrop-blur-md">
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
