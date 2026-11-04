"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CostHistoryPoint } from "@/lib/pnl";
import { useChartAnimation } from "@/lib/motion";
import { CHART_INK, GLASS_TOOLTIP } from "./dashboard-charts";

/**
 * Ürün özelinde birim maliyet tarihçesi — işçilik ve altın (cent → birim para),
 * satış sırasıyla. İşçilik girilmemiş satışlar boşluk bırakır (0 çizilmez).
 */
export function CostHistoryChart({
  points,
  currency,
}: {
  points: CostHistoryPoint[];
  currency: string;
}) {
  const anim = useChartAnimation();
  const data = points.map((p, i) => ({
    i,
    label: new Date(p.order_date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }),
    labor: p.labor_unit_cents == null ? null : p.labor_unit_cents / 100,
    gold: p.gold_unit_cents == null ? null : p.gold_unit_cents / 100,
    gem: p.gem_unit_cents == null ? null : p.gem_unit_cents / 100,
    manual: p.labor_manual,
  }));
  const fmt = (v: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(v);
  return (
    <div className={CHART_INK}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
            width={56}
            tickFormatter={(v) => fmt(Number(v))}
          />
          <Tooltip
            {...GLASS_TOOLTIP}
            formatter={(v, name) => [
              v == null ? "—" : fmt(Number(v)),
              name === "labor" ? "İşçilik / birim" : name === "gold" ? "Altın / birim" : "Taş / birim",
            ]}
            labelFormatter={(l) => String(l)}
          />
          <Line
            type="monotone"
            dataKey="labor"
            name="labor"
            stroke="var(--jg-ink-1)"
            strokeWidth={2.5}
            connectNulls
            dot={{ r: 3, fill: "var(--jg-dot-f)", stroke: "var(--jg-dot-s)" }}
            activeDot={{ r: 5 }}
            {...anim}
          />
          <Line
            type="monotone"
            dataKey="gold"
            name="gold"
            stroke="var(--jg-ink-3)"
            strokeWidth={1.8}
            strokeDasharray="4 3"
            connectNulls
            dot={false}
            {...anim}
          />
          <Line
            type="monotone"
            dataKey="gem"
            name="gem"
            stroke="var(--jg-ink-neg)"
            strokeWidth={1.5}
            connectNulls
            dot={false}
            {...anim}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
