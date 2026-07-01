import Link from "next/link";
import { Plus, Upload, Eye, Pencil, ShoppingBag } from "lucide-react";

import { listSales } from "@/lib/db/queries/sales";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { SALE_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { Pagination } from "@/components/data-table/pagination";
import { DeleteButton } from "@/components/data-table/delete-button";
import { SaleStatusBadge } from "@/components/sale-status-badge";
import { deleteSale } from "./actions";

export default async function SatislarPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const search = strParam(sp.search);
  const status = strParam(sp.status);
  const offset = numParam(sp.offset);
  const limit = 25;

  const { rows, count } = await listSales({ search, status, limit, offset });

  return (
    <div className="relative z-0 pb-28">
      <GoldStream motif="gift" />
      <PageHeader
        title="Satışlar"
        description="Manuel, CSV ve Etsy siparişleri"
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/satislar/ice-aktar">
                <Upload />
                CSV İçe Aktar
              </Link>
            </Button>
            <Button asChild>
              <Link href="/satislar/yeni">
                <Plus />
                Yeni Satış
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Sipariş no, alıcı…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={SALE_STATUSES}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Satış kaydı yok"
              description="Henüz satış yok. Yeni satış ekleyin veya Etsy CSV dosyanızı içe aktarın."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Genel Toplam</TableHead>
                  <TableHead className="w-1 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.order_date)}</TableCell>
                    <TableCell className="font-medium">
                      {s.order_no ?? "—"}
                    </TableCell>
                    <TableCell>{s.buyer_name ?? "—"}</TableCell>
                    <TableCell>
                      <SaleStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(s.grand_total_cents, s.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/satislar/${s.id}`}>
                            <Eye className="size-4" />
                            <span className="sr-only">Görüntüle</span>
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/satislar/${s.id}/duzenle`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                        </Button>
                        <DeleteButton action={deleteSale} id={s.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination count={count} limit={limit} offset={offset} />
        </CardContent>
      </Card>
    </div>
  );
}
