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
 * Paylaşılan SVG tanımları — 3B derinlik ve "neon" ışıma dili. Her grafik
 * kendi <defs>'ini basar (id'ler aynı SVG içinde çözülmeli):
 *  - spot: grafiğin arkasına düşen yumuşak holo/altın ışık halesi
 *  - neon: çizgi/nokta için yumuşak dış parıltı (feGaussianBlur + merge)
 *  - barFace: 3B ekstrüde barın ön yüzü için dikey degrade
 *  - barShadow: bar grubunun altına düşen yumuşak derinlik gölgesi
 * Renkler --chart-* tokenlarından; platformda holo periwinkle, JG'de altın.
 */
function ChartDefs({ id, tone = "var(--chart-1)" }: { id: string; tone?: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-spot`} cx="0.8" cy="0.1" r="0.7">
        <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
        <stop offset="100%" stopColor={tone} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={tone} stopOpacity="0.95" />
        <stop offset="100%" stopColor={tone} stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={tone} stopOpacity="0.4" />
        <stop offset="95%" stopColor={tone} stopOpacity="0" />
      </linearGradient>
      <filter id={`${id}-neon`} x="-40%" y="-80%" width="180%" height="260%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${id}-depth`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="5"
          floodColor="var(--glass-outer)"
        />
      </filter>
    </defs>
  );
}

/**
 * 3B ekstrüde bar — üst yüz (aydınlık pah), ön yüz (degrade) ve sağ yan yüz
 * (koyu derinlik). Işık sağ-üstten; barlar tabandan hafifçe yükselir (kit dili).
 * Recharts custom `shape`; props Recharts'tan gelir (x/y/width/height/fill).
 */
function Bar3D(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  defsId: string;
  tone: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, defsId, tone } = props;
  if (height <= 0 || width <= 0) return null;
  const dx = Math.min(8, width * 0.5);
  const dy = -dx;
  const topFace = `${x},${y} ${x + dx},${y + dy} ${x + width + dx},${y + dy} ${x + width},${y}`;
  const sideFace = `${x + width},${y} ${x + width + dx},${y + dy} ${x + width + dx},${y + height + dy} ${x + width},${y + height}`;
  return (
    <g filter={`url(#${defsId}-depth)`}>
      <polygon points={sideFace} fill={tone} opacity="0.4" />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="3"
        fill={`url(#${defsId}-face)`}
      />
      <polygon points={topFace} fill="#ffffff" opacity="0.72" />
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
          filter="url(#trend-neon)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--chart-1)", filter: "url(#trend-neon)" }}
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

/** Günlük/dönemsel sipariş sayısı — 3B ekstrüde bar grafiği + spot ışık. */
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
          shape={<Bar3D defsId="orders" tone="var(--chart-1)" />}
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
          filter="url(#rev-neon)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--chart-2)", filter: "url(#rev-neon)" }}
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
  return (
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
          innerRadius={55}
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
  );
}
