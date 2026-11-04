import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import type { CostHistoryStats } from "@/lib/pnl";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatDate, formatNumber } from "@/lib/format";
import { CostHistoryChart } from "@/components/charts/cost-history-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/**
 * Listing detay — "satılan ürünlerin verisi ürün sayfasında": satış kalemleri
 * + birim maliyet tarihçesi. Aynı listing'den iki satışta işçilik değişimi
 * (son − önceki) başlıkta rozet olarak okunur.
 */
export function SalesCostHistoryPanel({
  productId,
  stats,
  currency,
}: {
  productId: string;
  stats: CostHistoryStats;
  currency: string;
}) {
  const { points } = stats;
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Bu listing&apos;den henüz satış yok; ilk satışla birlikte kalem maliyetleri ve
        işçilik tarihçesi burada birikir.
      </p>
    );
  }
  const delta = stats.labor_delta_cents;
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const laborPoints = points.filter((p) => p.labor_unit_cents != null).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat
          label="Satış"
          value={`${formatNumber(points.length)} kalem`}
          hint={`${formatNumber(stats.units_sold)} adet`}
        />
        <Stat
          label="Son işçilik / birim"
          value={
            stats.last_labor_unit_cents == null
              ? "—"
              : formatMoney(stats.last_labor_unit_cents, currency)
          }
          hint={
            stats.prev_labor_unit_cents == null
              ? laborPoints > 0
                ? "tek giriş · değişim yok"
                : "işçilik girilmedi"
              : `önceki ${formatMoney(stats.prev_labor_unit_cents, currency)}`
          }
        />
        <div className="space-y-0.5">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            İşçilik değişimi
          </p>
          <p className="flex items-center gap-1.5 font-mono text-lg font-semibold tabular-nums">
            <DeltaIcon
              className={
                "size-4 " +
                (delta == null || delta === 0
                  ? "text-muted-foreground"
                  : delta > 0
                    ? "text-destructive"
                    : "text-emerald-700 dark:text-emerald-400")
              }
            />
            {delta == null
              ? "—"
              : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatMoney(Math.abs(delta), currency)}`}
          </p>
          <p className="text-muted-foreground text-xs">
            {stats.labor_delta_ratio == null
              ? "son iki satış arası"
              : `${stats.labor_delta_ratio > 0 ? "+" : ""}${formatPercent(stats.labor_delta_ratio)} · son iki satış`}
          </p>
        </div>
        <Stat
          label="İşçilik ort · min · max"
          value={
            stats.avg_labor_unit_cents == null
              ? "—"
              : formatMoney(stats.avg_labor_unit_cents, currency)
          }
          hint={
            stats.min_labor_unit_cents != null && stats.max_labor_unit_cents != null
              ? `${formatMoney(stats.min_labor_unit_cents, currency)} – ${formatMoney(stats.max_labor_unit_cents, currency)}`
              : undefined
          }
        />
        <Stat
          label="Net kâr (ömür boyu)"
          value={formatMoney(stats.net_profit_cents, currency)}
          hint={
            stats.margin == null
              ? "marj —"
              : `marj ${formatPercent(stats.margin)} · altın/birim son ${
                  stats.last_gold_unit_cents == null
                    ? "—"
                    : formatMoney(stats.last_gold_unit_cents, currency)
                }`
          }
        />
      </div>

      {laborPoints + points.filter((p) => p.gold_unit_cents != null).length > 0 ? (
        <CostHistoryChart points={points} currency={currency} />
      ) : (
        <p className="text-muted-foreground text-xs">
          Grafik için en az bir satışa altın/işçilik girilmeli.
        </p>
      )}

      <div className="scroll-x">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
              <th className="px-2 py-1.5 text-left">Tarih</th>
              <th className="px-2 py-1.5 text-left">Sipariş</th>
              <th className="px-2 py-1.5 text-left">Varyant</th>
              <th className="px-2 py-1.5 text-right">Adet</th>
              <th className="px-2 py-1.5 text-right">Altın / br</th>
              <th className="px-2 py-1.5 text-right">İşçilik / br</th>
              <th className="px-2 py-1.5 text-right">Taş / br</th>
              <th className="px-2 py-1.5 text-right">Net gelir / br</th>
              <th className="px-2 py-1.5 text-right">Net kâr / br</th>
            </tr>
          </thead>
          <tbody>
            {points
              .slice()
              .reverse()
              .map((p) => (
                <tr key={p.sale_item_id} className="border-border/60 border-t">
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(p.order_date)}</td>
                  <td className="px-2 py-1.5 font-mono text-xs">
                    <Link href={`/satislar/${p.sale_id}`} className="hover:underline">
                      #{p.order_no ?? "—"}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 text-xs">
                    {[p.sku, p.variation].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{p.quantity}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {p.gold_unit_cents == null ? "—" : formatMoney(p.gold_unit_cents, currency)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {p.labor_unit_cents == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        {formatMoney(p.labor_unit_cents, currency)}
                        {!p.labor_manual && (
                          <Badge variant="outline" className="ml-1.5 h-4 px-1.5 text-[9px]">
                            motor
                          </Badge>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {p.gem_unit_cents == null ? "—" : formatMoney(p.gem_unit_cents, currency)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {formatMoney(p.net_revenue_unit_cents, currency)}
                  </td>
                  <td
                    className={
                      "px-2 py-1.5 text-right font-mono font-semibold tabular-nums " +
                      (p.net_profit_unit_cents < 0 ? "text-destructive" : "")
                    }
                  >
                    {formatMoney(p.net_profit_unit_cents, currency)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={`/satislar/maliyet?search=${encodeURIComponent(points[0]?.sku ?? "")}`}>
            Satış &amp; Maliyet Takibi&apos;nde aç
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-xs" data-product={productId}>
        Birim değerler satır toplamı ÷ adet. “motor” = gram × ayar alım fiyatından
        otomatik; elle giriş satış detayından veya takip ızgarasından yapılır.
      </p>
    </div>
  );
}
