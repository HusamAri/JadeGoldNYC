import Link from "next/link";
import { Plus, Pencil, ArrowLeft, PackageSearch } from "lucide-react";

import {
  listProductMetrics,
  listProductPeriods,
} from "@/lib/db/queries/product-metrics";
import { deriveProduct, type ProductTone } from "@/lib/product-performance";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterSelect } from "@/components/data-table/filter-select";
import { DeleteButton } from "@/components/data-table/delete-button";
import { deleteProductMetric } from "./actions";

export const metadata = { title: "Ürün Performansı" };

const TONE_VARIANT: Record<
  ProductTone,
  "success" | "default" | "warning" | "destructive" | "secondary"
> = {
  star: "success",
  steady: "default",
  zero: "warning",
  adwaste: "destructive",
  none: "secondary",
};

export default async function UrunPerformansPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const period = strParam(sp.period);
  const [rows, periods] = await Promise.all([
    listProductMetrics(period),
    listProductPeriods(),
  ]);

  return (
    <div>
      <PageHeader
        title="Ürün Performansı"
        description="Ürün başına görüntüleme, dönüşüm, ciro ve Etsy Ads ROAS"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/analizler">
                <ArrowLeft />
                Performans
              </Link>
            </Button>
            <Button asChild>
              <Link href="/analizler/urunler/yeni">
                <Plus />
                Yeni Ürün Kaydı
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          {periods.length > 0 && (
            <FilterSelect
              paramKey="period"
              placeholder="Dönem"
              options={periods.map((p) => ({ value: p, label: p }))}
              allLabel="Tüm dönemler"
            />
          )}

          {rows.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Ürün verisi yok"
              description="Rapor §07/§08'deki ürün satırlarını ekleyin: görüntüleme, sipariş, ciro ve reklam (ROAS) ile 'sıfır satış' / 'reklam israfı' otomatik işaretlenir."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Görüntüleme</TableHead>
                  <TableHead className="text-right">Sipariş</TableHead>
                  <TableHead className="text-right">Dönüşüm</TableHead>
                  <TableHead className="text-right">Ciro</TableHead>
                  <TableHead className="text-right">Reklam</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-1 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => {
                  const d = deriveProduct(m);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {m.period_label}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate font-medium">
                        {m.product_title}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.views != null ? formatNumber(m.views) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.orders != null ? formatNumber(m.orders) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.conversion != null ? formatPercent(d.conversion, 2) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.revenue_cents != null
                          ? formatMoney(m.revenue_cents)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.ads_spend_cents != null
                          ? formatMoney(m.ads_spend_cents)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.roas != null ? `${d.roas.toFixed(1)}x` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TONE_VARIANT[d.status.tone]}>
                          {d.status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/analizler/urunler/${m.id}/duzenle`}>
                              <Pencil className="size-4" />
                              <span className="sr-only">Düzenle</span>
                            </Link>
                          </Button>
                          <DeleteButton action={deleteProductMetric} id={m.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
