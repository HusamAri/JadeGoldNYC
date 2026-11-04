import Link from "next/link";
import { PackageCheck, RotateCcw, Truck } from "lucide-react";

import type { Cost, SaleRefund, SaleShipment } from "@/lib/types";
import type { SaleItemPnlRow } from "@/lib/pnl";
import { COST_KIND_META, marginRatio, summarizePnl, variationLabel } from "@/lib/pnl";
import type { UnlinkedLabelEntry } from "@/lib/db/queries/sale-costs";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SaleItemCostForm } from "@/components/sales/sale-item-cost-form";
import { ReturnLabelLinker } from "@/components/sales/return-label-linker";

function Row({
  label,
  cents,
  currency,
  neg,
  strong,
  note,
}: {
  label: string;
  cents: number;
  currency: string;
  neg?: boolean;
  strong?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
        {note && <span className="text-muted-foreground ml-1 text-[11px]">{note}</span>}
      </span>
      <span
        className={
          "font-mono tabular-nums " +
          (strong ? "font-semibold " : "") +
          (neg && cents !== 0 ? "text-destructive" : "")
        }
      >
        {neg && cents !== 0 ? "− " : ""}
        {formatMoney(Math.abs(cents), currency)}
      </span>
    </div>
  );
}

/**
 * Satış detayı — "bir satış kaleminde tüm maliyetleri görebilmeliyim":
 * kalem kalem K/Z + maliyet girişi, iade kayıtları (Etsy), gönderiler (Etsy),
 * siparişe bağlı maliyet satırları (etiketler, motor, elle) ve iade etiketi
 * bağlama (API bağ vermez → elle).
 */
export function SalePnlSection({
  saleId,
  items,
  refunds,
  shipments,
  costRows,
  notes,
  unlinkedLabels,
  canEdit,
  refundUnknown,
}: {
  saleId: string;
  items: SaleItemPnlRow[];
  refunds: SaleRefund[];
  shipments: SaleShipment[];
  costRows: Cost[];
  notes: Map<string, string>;
  unlinkedLabels: UnlinkedLabelEntry[];
  canEdit: boolean;
  refundUnknown: boolean;
}) {
  if (items.length === 0) return null;
  const currency = items[0].currency;
  const t = summarizePnl(items);
  const margin = marginRatio(t.net_profit_cents, t.net_revenue_cents);
  const saleLevelCosts = costRows.filter((c) => !c.sale_item_id);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass-fluted">
          <CardHeader>
            <CardTitle>Kalem başına maliyet &amp; kâr</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {items.map((it) => {
              const im = marginRatio(it.net_profit_cents, it.net_revenue_cents);
              const variation = variationLabel(it.variations);
              return (
                <div key={it.sale_item_id} className="nm-pressed rounded-[1.25rem] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {it.product_id ? (
                          <Link
                            href={`/tasarimlar/listing/${it.product_id}`}
                            className="hover:underline"
                          >
                            {it.title ?? "—"}
                          </Link>
                        ) : (
                          (it.title ?? "—")
                        )}
                      </p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {[it.sku, variation, `× ${it.quantity}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          "font-mono text-lg font-semibold tabular-nums " +
                          (it.net_profit_cents < 0
                            ? "text-destructive"
                            : "text-emerald-700 dark:text-emerald-400")
                        }
                      >
                        {it.net_profit_cents < 0 ? "− " : ""}
                        {formatMoney(Math.abs(it.net_profit_cents), currency)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        net kâr · marj {im == null ? "—" : formatPercent(im, 0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Row label="Satış" cents={it.line_total_cents} currency={currency} />
                      <Row label="İndirim payı" cents={it.discount_alloc_cents} currency={currency} neg />
                      <Row label="Kargo geliri payı" cents={it.shipping_income_alloc_cents} currency={currency} />
                      <Row
                        label="İade payı"
                        cents={it.refund_alloc_cents}
                        currency={currency}
                        neg
                        note={it.refund_unknown ? "(tutar Etsy'den okunmadı)" : undefined}
                      />
                      <Row label="Net gelir" cents={it.net_revenue_cents} currency={currency} strong />
                      <Row label="Vergi (gelir değil)" cents={it.tax_alloc_cents} currency={currency} note="Etsy toplar/öder" />
                    </div>
                    <div className="space-y-1">
                      <Row label="Etsy ücreti payı" cents={it.etsy_fees_alloc_cents} currency={currency} neg />
                      <Row label="Kargo etiketi" cents={it.shipping_label_cents} currency={currency} neg />
                      <Row label="İade etiketi" cents={it.return_label_cents} currency={currency} neg />
                      <Row
                        label={`Altın ${it.has_gold ? (it.gold_manual ? "(elle)" : "(motor)") : "(yok)"}`}
                        cents={it.gold_cents}
                        currency={currency}
                        neg
                      />
                      <Row
                        label={`İşçilik ${it.has_labor ? (it.labor_manual ? "(elle)" : "(motor)") : "(yok)"}`}
                        cents={it.labor_cents}
                        currency={currency}
                        neg
                      />
                      <Row label="Taş" cents={it.gem_cents} currency={currency} neg />
                      <Row label="Paketleme" cents={it.packaging_cents} currency={currency} neg />
                      {it.recovered_cents > 0 && (
                        <Row label="Geri kazanım (iade)" cents={it.recovered_cents} currency={currency} />
                      )}
                      <Row label="Toplam maliyet" cents={it.total_cost_cents} currency={currency} neg strong />
                    </div>
                  </div>

                  <Separator className="my-3" />
                  <SaleItemCostForm
                    item={it}
                    notes={notes}
                    canEdit={canEdit}
                    currency={currency}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-iced">
            <CardHeader>
              <CardTitle>Sipariş K/Z</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Row label="Brüt gelir (vergi hariç)" cents={t.gross_revenue_cents} currency={currency} />
              <Row
                label="İade"
                cents={t.refund_cents}
                currency={currency}
                neg
                note={refundUnknown ? "(bilinmiyor)" : undefined}
              />
              <Row label="Net gelir" cents={t.net_revenue_cents} currency={currency} strong />
              <Separator className="my-2" />
              <Row label="Etsy ücretleri" cents={t.etsy_fees_cents} currency={currency} neg />
              <Row label="Kargo etiketi" cents={t.shipping_label_cents} currency={currency} neg />
              <Row label="İade etiketi" cents={t.return_label_cents} currency={currency} neg />
              <Row label="COGS" cents={t.cogs_cents} currency={currency} neg />
              {t.other_cost_cents !== 0 && (
                <Row label="Diğer" cents={t.other_cost_cents} currency={currency} neg />
              )}
              <Separator className="my-2" />
              <Row label="Net kâr" cents={t.net_profit_cents} currency={currency} strong />
              <p className="text-muted-foreground text-right text-xs">
                marj {margin == null ? "—" : formatPercent(margin)}
              </p>
              {t.incomplete_items > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t.incomplete_items} kalemde altın/işçilik yok — net kâr eksik.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="size-4" /> İadeler (Etsy)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {refunds.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  {refundUnknown
                    ? "Durum iade ama receipt gövdesi bu sürümden önce okunmuş; iade tutarı için Satış & Maliyet Takibi'nde \"İade verisini çek\"."
                    : "Etsy iade kaydı yok."}
                </p>
              ) : (
                refunds.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{formatDateTime(f.refunded_at)}</p>
                      <p className="text-muted-foreground text-xs">
                        {[f.reason, f.status].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {f.note_from_issuer && (
                        <p className="text-muted-foreground text-xs italic">
                          “{f.note_from_issuer}”
                        </p>
                      )}
                    </div>
                    <span className="text-destructive font-mono text-sm tabular-nums">
                      − {formatMoney(f.amount_cents, f.currency)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-4" /> Gönderiler (Etsy)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {shipments.length === 0 ? (
                <p className="text-muted-foreground text-xs">Etsy gönderi kaydı yok.</p>
              ) : (
                shipments.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{s.carrier_name ?? "Kargo"}</p>
                      <p className="text-muted-foreground font-mono text-xs break-all">
                        {s.tracking_code ?? "—"}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {s.notified_at ? formatDate(s.notified_at) : "—"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-fluted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="size-4" /> Siparişe bağlı maliyet satırları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {costRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Bu siparişe bağlı maliyet satırı yok.
            </p>
          ) : (
            <div className="scroll-x">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                    <th className="px-2 py-1.5 text-left">Tarih</th>
                    <th className="px-2 py-1.5 text-left">Açıklama</th>
                    <th className="px-2 py-1.5 text-left">Tür</th>
                    <th className="px-2 py-1.5 text-left">Kaynak</th>
                    <th className="px-2 py-1.5 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {costRows.map((c) => (
                    <tr key={c.id} className="border-border/60 border-t">
                      <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(c.cost_date)}</td>
                      <td className="px-2 py-1.5">
                        <span className="block max-w-[420px] truncate" title={c.description}>
                          {c.description}
                        </span>
                        {c.notes && (
                          <span className="text-muted-foreground block truncate text-[11px]" title={c.notes}>
                            {c.notes}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        {c.cost_kind ? (
                          <Badge variant="secondary">{COST_KIND_META[c.cost_kind].short}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <Badge variant="outline">{c.source}</Badge>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                        {formatMoney(c.amount_cents, c.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ReturnLabelLinker
            saleId={saleId}
            candidates={unlinkedLabels}
            linked={saleLevelCosts
              .filter((c) => c.external_key)
              .map((c) => ({
                id: c.id,
                description: c.description,
                amount_cents: c.amount_cents,
                currency: c.currency,
                kind: c.cost_kind ?? null,
              }))}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
