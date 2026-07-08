"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ViewsSeriesPoint } from "@/lib/db/queries/etsy-insights";

/**
 * Günlük listing görüntülenme serisi (Etsy API fotoğraf farkları). Panelin
 * grafik diliyle (chart-2 altın alan) uyumlu.
 */
export function EtsyViewsChart({ data }: { data: ViewsSeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-etsy-views" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={40}
        />
        <Tooltip
          formatter={(v, name) => [
            Number(v).toLocaleString("tr-TR"),
            name === "views" ? "Görüntülenme" : "Net favori",
          ]}
          labelFormatter={(l) => String(l)}
        />
        <Area
          type="monotone"
          dataKey="views"
          name="views"
          stroke="var(--chart-2)"
          fill="url(#grad-etsy-views)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
