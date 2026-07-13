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

import { CHART_INK, ChartDefs, GLASS_TOOLTIP, GlowDot } from "./dashboard-charts";

/**
 * Günlük listing görüntülenme serisi (Etsy API fotoğraf farkları). Lab-referans
 * grafik dili: açıkta Spatial mor izli çizgi, koyuda lume lineTrail (kuyruğu
 * sönen beyaz + çift ışıma) + parlayan uç nokta; cam tooltip ve mono eksen.
 */
export function EtsyViewsChart({ data }: { data: ViewsSeriesPoint[] }) {
  return (
    <div className={CHART_INK}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <ChartDefs id="etsy" tone="var(--jg-ink-2)" />
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
              fontFamily: "var(--font-index)",
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
            filter="url(#etsy-lglow)"
            dot={(p) => <GlowDot {...p} defsId="etsy" tone="var(--jg-ink-2)" />}
            activeDot={{
              r: 5,
              fill: "var(--jg-ink-2)",
              filter: "url(#etsy-dotglow)",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
