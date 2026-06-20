import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { getSaleWithItems } from "@/lib/db/queries/sales";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
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
import { deleteSale } from "../actions";

function SummaryRow({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string;
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

  return (
    <div>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                      <TableCell className="font-medium">
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

        <Card>
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
                label="Etsy Ücretleri"
                value={`- ${formatMoney(sale.etsy_fees_cents, currency)}`}
                negative
              />
              <Separator />
              <SummaryRow
                label="Genel Toplam"
                value={formatMoney(sale.grand_total_cents, currency)}
                strong
              />
              <SummaryRow
                label="Net (ücret sonrası)"
                value={formatMoney(netCents, currency)}
                strong
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
