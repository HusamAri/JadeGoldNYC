import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { getSaleWithItems } from "@/lib/db/queries/sales";
import {
  getManualItemCostNotes,
  getSaleCostRows,
  getSalePnlItems,
  getSaleRefunds,
  getSaleShipments,
  listUnlinkedLabelEntries,
} from "@/lib/db/queries/sale-costs";
import { requireMembership, isManager } from "@/lib/auth";
import { SalePnlSection } from "@/components/sales/sale-pnl-section";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { SaleStatusBadge } from "@/components/sale-status-badge";
import { DeleteButton } from "@/components/data-table/delete-button";
import { PinDock } from "@/components/pins/pin-dock";
import { deleteSale } from "../actions";

function SummaryRow({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          (strong ? "font-semibold " : "") +
          (negative ? "text-destructive tabular-nums" : "tabular-nums")
        }
      >
        {value}
      </span>
    </div>
  );
}

export default async function SatisDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSaleWithItems(id);
  if (!data) notFound();
  const { sale, items } = data;
  const currency = sale.currency;
  const netCents = sale.grand_total_cents - sale.etsy_fees_cents;

  // Kalem K/Z + Etsy iade/gönderi aynaları + bağlı maliyetler (0138) —
  // birbirinden bağımsız, tek turda paralel.
  const m = await requireMembership();
  const canEdit = isManager(m.role);
  const refundUnknown =
    (sale.status === "refunded" || sale.status === "partially_refunded") &&
    !sale.refunds_synced_at;
  const [pnlItems, refunds, shipments, costRows, unlinkedLabels] = await Promise.all([
    getSalePnlItems(sale.id),
    getSaleRefunds(sale.id),
    getSaleShipments(sale.id),
    getSaleCostRows(sale.id),
    // İade etiketi adayları: iade/iptal siparişte iade anı, yoksa sipariş
    // tarihi etrafında ±45 gün (bağlanmamış ledger etiketleri).
    listUnlinkedLabelEntries(m.org_id, {
      aroundIso: sale.last_refund_at ?? sale.shipped_at ?? sale.order_date,
      limit: 120,
    }),
  ]);
  const notes = await getManualItemCostNotes(pnlItems.map((p) => p.sale_item_id));

  return (
    <div className="page-stack">
      <PageHeader
        title={`Satış ${sale.order_no ?? ""}`}
        description={formatDate(sale.order_date, "d MMMM yyyy")}
        action={
          <>
            <Button asChild variant="outline">
              <Link href={`/satislar/${sale.id}/duzenle`}>
                <Pencil />
                Düzenle
              </Link>
            </Button>
            <DeleteButton
              action={deleteSale}
              id={sale.id}
              variant="button"
              redirectTo="/satislar"
            />
          </>
        }
      />

      {/* Pinler — satışa iğnelenen setler (ekipçe görünür, sete özel). */}
      <PinDock targetType="sale" targetId={sale.id} size="lg" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass-fluted">
          <CardHeader>
            <CardTitle>Kalemler</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu siparişe ait kalem bulunmuyor.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">Birim</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="wrap-box font-medium">
                        {it.title ?? "—"}
                      </TableCell>
                      <TableCell>{it.sku ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(it.unit_price_cents, currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(it.line_total_cents, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="glass-iced">
          <CardHeader>
            <CardTitle>Özet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Durum</span>
                <SaleStatusBadge status={sale.status} />
              </div>
              <SummaryRow label="Alıcı" value={sale.buyer_name ?? "—"} />
              <SummaryRow label="Ülke" value={sale.ship_country ?? "—"} />
              <SummaryRow label="Kaynak" value={sale.source} />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <SummaryRow
                label="Ürün Toplamı"
                value={formatMoney(sale.item_total_cents, currency)}
              />
              <SummaryRow
                label="Kargo"
                value={formatMoney(sale.shipping_cents, currency)}
              />
              <SummaryRow
                label="Vergi"
                value={formatMoney(sale.tax_cents, currency)}
              />
              <SummaryRow
                label="İndirim"
                value={`- ${formatMoney(sale.discount_cents, currency)}`}
                negative
              />
              <SummaryRow
                label="Etsy ücretleri (ledger)"
                value={`- ${formatMoney(sale.etsy_fees_cents, currency)}`}
                negative
              />
              <p className="text-muted-foreground -mt-1 text-xs">
                İşlem + ödeme işleme + offsite ads; iade mahsubu dahil.
              </p>
              {(sale.refunded_cents ?? 0) > 0 && (
                <SummaryRow
                  label={`İade (${sale.refund_count ?? 0})`}
                  value={`- ${formatMoney(sale.refunded_cents ?? 0, currency)}`}
                  negative
                />
              )}
              {refundUnknown && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  İade tutarı Etsy&apos;den henüz okunmadı (Satış &amp; Maliyet
                  Takibi → “İade verisini çek”).
                </p>
              )}
              <Separator />
              <SummaryRow
                label="Genel Toplam"
                value={
                  <Money cents={sale.grand_total_cents} currency={currency} />
                }
                strong
              />
              <SummaryRow
                label="Net (ücret sonrası)"
                value={<Money cents={netCents} currency={currency} />}
                strong
              />
              <p className="text-muted-foreground -mt-1 text-xs">
                Genel toplam vergi içerir; kâr hesabı aşağıda vergisizdir.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 0138 — Kalem başına tüm maliyetler + Etsy iade/gönderi + etiket bağlama. */}
      <SalePnlSection
        saleId={sale.id}
        items={pnlItems}
        refunds={refunds}
        shipments={shipments}
        costRows={costRows}
        notes={notes}
        unlinkedLabels={unlinkedLabels}
        canEdit={canEdit}
        refundUnknown={refundUnknown}
      />
    </div>
  );
}
