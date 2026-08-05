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

import { useChartAnimation } from "@/lib/motion";
import {
  BarNeo,
  CHART_INK,
  ChartDefs,
  GLASS_TOOLTIP,
  GlowDot,
} from "./dashboard-charts";

/**
 * İki ayrı ölçekli seri (indirim % ve sipariş adedi) tek eksende değil, iki
 * dikey panelde — çift-eksen grafik yerine küçük-çoklu (small multiples).
 * Her panel `nm-pressed` ile yüzeye oyulmuş bir gösterge gibi görünür — derinlik
 * yalnız ışık/gölgeden gelir. Panel etiketleri editorial `.idx` dilinde;
 * çizgi gradient izli + parlayan uç noktalı, çubuklarda zirve gün TEK accent.
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
  const anim = useChartAnimation();
  const data = points.map((p) => ({ ...p, label: formatDate(p.date) }));
  const accentIdx = data.reduce(
    (best, d, i) => ((d.orders ?? 0) > (data[best]?.orders ?? 0) ? i : best),
    0,
  );

  return (
    <div className={`space-y-4 ${CHART_INK}`}>
      <div>
        <p className="idx mb-2">
          <span className="idx-bar" aria-hidden="true" />
          Günlük indirim %
          <span className="idx-ln" aria-hidden="true" />
        </p>
        <div className="nm-pressed rounded-2xl p-3">
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <ChartDefs id="rtl-disc" tone="var(--jg-ink-2)" />
              <rect x="0" y="0" width="100%" height="100%" fill="url(#rtl-disc-spot)" />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-index)",
                }}
                tickLine={false}
                axisLine={false}
                width={32}
                domain={[0, 60]}
                tickFormatter={(v) => `%${v}`}
              />
              <Tooltip
                {...GLASS_TOOLTIP}
                formatter={(v) => [`%${v}`, "İndirim"]}
                labelFormatter={(l) => formatDate(String(l))}
              />
              <ReferenceLine
                x={cutoffDate}
                stroke="var(--jg-ink-neg)"
                strokeDasharray="3 3"
                label={{ value: cutoffLabel, position: "insideTopRight", fontSize: 10, fill: "var(--jg-ink-neg)" }}
              />
              <Area
                type="monotone"
                dataKey="discountPct"
                stroke="url(#rtl-disc-stroke)"
                fill="url(#rtl-disc-area)"
                strokeWidth={2.5}
                filter="url(#rtl-disc-lglow)"
                dot={(p) => (
                  <GlowDot {...p} defsId="rtl-disc" tone="var(--jg-ink-2)" />
                )}
                activeDot={{
                  r: 4,
                  fill: "var(--jg-ink-2)",
                  filter: "url(#rtl-disc-dotglow)",
                }}
                {...anim}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="idx mb-2">
          <span className="idx-bar" aria-hidden="true" />
          Günlük sipariş adedi
          <span className="idx-ln" aria-hidden="true" />
        </p>
        <div className="nm-pressed rounded-2xl p-3">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <ChartDefs id="rtl-ord" tone="var(--jg-ink-1)" />
              <rect x="0" y="0" width="100%" height="100%" fill="url(#rtl-ord-spot)" />
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
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                  fontFamily: "var(--font-index)",
                }}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                {...GLASS_TOOLTIP}
                formatter={(v) => [v, "Sipariş"]}
                labelFormatter={(l) => formatDate(String(l))}
              />
              <ReferenceLine x={cutoffDate} stroke="var(--jg-ink-neg)" strokeDasharray="3 3" />
              <Bar
                dataKey="orders"
                shape={<BarNeo defsId="rtl-ord" accentIndex={accentIdx} />}
                {...anim}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
