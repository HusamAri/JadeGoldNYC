"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ReportYoyPoint } from "@/lib/types";

/**
 * Yıldan yıla aynı takvim penceresinde tek bir metriği karşılaştıran bar
 * grafik. Panel `nm-pressed` ile yüzeye oyulmuş görünür; çubuklar üstten
 * hafif ışık alan/altta koyulaşan tek-tonlu bir degrade ile kabartma
 * hissi verir — ek renk yok, yalnız aynı tonun açık/koyu ışıklandırması.
 */
export function ReportYoyChart({ points }: { points: ReportYoyPoint[] }) {
  return (
    <div className="nm-pressed rounded-2xl p-3">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={points} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-yoy-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="color-mix(in oklab, var(--chart-2) 55%, white)" />
              <stop offset="100%" stopColor="var(--chart-2)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            width={32}
          />
          <Tooltip
            formatter={(v, _n, item) => [
              `${Number(v).toFixed(2)} sipariş/gün`,
              item.payload.note ?? "",
            ]}
          />
          <Bar
            dataKey="value"
            fill="url(#grad-yoy-bar)"
            radius={[3, 3, 0, 0]}
            label={{ position: "top", fontSize: 11, fill: "var(--muted-foreground)" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
