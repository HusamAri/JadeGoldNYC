"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ReportYoyPoint } from "@/lib/types";

import {
  BarNeo,
  CHART_INK,
  ChartDefs,
  GLASS_TOOLTIP,
  GrooveTrack,
} from "./dashboard-charts";

/**
 * Yıldan yıla aynı takvim penceresinde tek bir metriği karşılaştıran bar
 * grafik. Panel `nm-pressed` ile yüzeye oyulmuş görünür; her yıl kendi oyuk
 * rayında kabarır, GÜNCEL pencere (son çubuk) TEK accent — tone degradesi +
 * hafif glow, geçmiş yıllar nötr raised. Değer etiketleri mono readout.
 */
export function ReportYoyChart({ points }: { points: ReportYoyPoint[] }) {
  const accentIdx = points.length - 1;
  return (
    <div className={`nm-pressed rounded-2xl p-3 ${CHART_INK}`}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={points} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <ChartDefs id="yoy" tone="var(--jg-ink-2)" />
          <rect x="0" y="0" width="100%" height="100%" fill="url(#yoy-spot)" />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            width={32}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
            {...GLASS_TOOLTIP}
            formatter={(v, _n, item) => [
              `${Number(v).toFixed(2)} sipariş/gün`,
              item.payload.note ?? "",
            ]}
          />
          <Bar
            dataKey="value"
            shape={<BarNeo defsId="yoy" accentIndex={accentIdx} />}
            background={<GrooveTrack defsId="yoy" />}
            isAnimationActive={false}
            label={{
              position: "top",
              fontSize: 11,
              fill: "var(--muted-foreground)",
              fontFamily: "var(--font-index)",
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
