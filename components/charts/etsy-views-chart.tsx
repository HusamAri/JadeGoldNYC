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

import { ChartDefs, GLASS_TOOLTIP, GlowDot } from "./dashboard-charts";

/**
 * Günlük listing görüntülenme serisi (Etsy API fotoğraf farkları). Panelin
 * grafik diliyle uyumlu: chart-2 tonunda gradient izli çizgi + altına
 * sönümlenen ışık alanı + parlayan uç nokta; cam tooltip ve mono eksen.
 */
export function EtsyViewsChart({ data }: { data: ViewsSeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <ChartDefs id="etsy" tone="var(--chart-2)" />
        <rect x="0" y="0" width="100%" height="100%" fill="url(#etsy-spot)" />
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
          tick={{
            fontSize: 11,
            fill: "var(--muted-foreground)",
            fontFamily: "var(--font-mono)",
          }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          {...GLASS_TOOLTIP}
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
          stroke="url(#etsy-stroke)"
          fill="url(#etsy-area)"
          strokeWidth={2.5}
          filter="url(#etsy-float)"
          dot={(p) => <GlowDot {...p} defsId="etsy" tone="var(--chart-2)" />}
          activeDot={{ r: 5, fill: "var(--chart-2)", filter: "url(#etsy-float)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
