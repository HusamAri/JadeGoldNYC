"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ReportTimelinePoint } from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * İki ayrı ölçekli seri (indirim % ve sipariş adedi) tek eksende değil, iki
 * dikey panelde — çift-eksen grafik yerine küçük-çoklu (small multiples).
 * Her panel `nm-pressed` ile yüzeye oyulmuş bir gösterge gibi görünür — derinlik
 * yalnız ışık/gölgeden gelir, renk eklenmez.
 */
export function ReportTimelineChart({
  points,
  cutoffDate,
  cutoffLabel,
}: {
  points: ReportTimelinePoint[];
  cutoffDate: string;
  cutoffLabel: string;
}) {
  const data = points.map((p) => ({ ...p, label: formatDate(p.date) }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-semibold">
          Günlük indirim %
        </p>
        <div className="nm-pressed rounded-2xl p-3">
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-report-discount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={32}
                domain={[0, 60]}
                tickFormatter={(v) => `%${v}`}
              />
              <Tooltip
                formatter={(v) => [`%${v}`, "İndirim"]}
                labelFormatter={(l) => formatDate(String(l))}
              />
              <ReferenceLine
                x={cutoffDate}
                stroke="var(--destructive)"
                strokeDasharray="3 3"
                label={{ value: cutoffLabel, position: "insideTopRight", fontSize: 10, fill: "var(--destructive)" }}
              />
              <Area
                type="monotone"
                dataKey="discountPct"
                stroke="var(--chart-2)"
                fill="url(#grad-report-discount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-xs font-semibold">
          Günlük sipariş adedi
        </p>
        <div className="nm-pressed rounded-2xl p-3">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-report-orders-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="color-mix(in oklab, var(--chart-1) 55%, white)" />
                  <stop offset="100%" stopColor="var(--chart-1)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatDate(String(v))}
                minTickGap={28}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(v) => [v, "Sipariş"]}
                labelFormatter={(l) => formatDate(String(l))}
              />
              <ReferenceLine x={cutoffDate} stroke="var(--destructive)" strokeDasharray="3 3" />
              <Bar dataKey="orders" fill="url(#grad-report-orders-bar)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
