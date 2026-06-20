import Link from "next/link";
import {
  Plus,
  Pencil,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle2,
  Percent,
} from "lucide-react";

import {
  listCartRecoveries,
  getCartSummary,
} from "@/lib/db/queries/cart-recoveries";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { CART_STATUSES } from "@/lib/constants";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
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
import { CartStatusBadge } from "@/components/cart-status-badge";
import { deleteCartRecovery } from "./actions";

export const metadata = { title: "Sepet Kurtarma" };

export default async function SepetKurtarmaPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const status = strParam(sp.status);
  const search = strParam(sp.search);
  const offset = numParam(sp.offset);
  const limit = 25;

  const [{ rows, count }, summary] = await Promise.all([
    listCartRecoveries({ status, search, limit, offset }),
    getCartSummary(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sepet Kurtarma"
        description="Terk edilen sepetleri ve geri kazanım aksiyonlarını takip edin"
        action={
          <Button asChild>
            <Link href="/sepet-kurtarma/yeni">
              <Plus />
              Yeni Sepet
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Toplam Terk"
          value={formatNumber(summary.total)}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Terk Değeri"
          value={formatMoney(summary.totalValueCents)}
          icon={DollarSign}
        />
        <KpiCard label="Açık" value={formatNumber(summary.open)} icon={Clock} />
        <KpiCard
          label="Kazanılan"
          value={formatMoney(summary.recoveredValueCents)}
          icon={CheckCircle2}
          hint={`${formatNumber(summary.recovered)} sepet`}
          accent="positive"
        />
        <KpiCard
          label="Kazanım Oranı"
          value={formatPercent(summary.recoveryRate)}
          icon={Percent}
          accent={summary.recoveryRate > 0 ? "positive" : "default"}
        />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Alıcı, e-posta, ürün…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={CART_STATUSES}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Sepet kaydı yok"
              description="Terk edilen sepetleri ekleyin; hatırlatma/teşvik aksiyonlarını ve sonucu (kazanıldı/kayıp) takip edin."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terk Tarihi</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead className="text-right">Sepet Değeri</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Aksiyon</TableHead>
                  <TableHead className="text-right">Kazanılan</TableHead>
                  <TableHead className="w-1 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(c.abandoned_at)}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-medium">
                      {c.buyer_name ?? c.buyer_email ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.cart_value_cents != null
                        ? formatMoney(c.cart_value_cents)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <CartStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {c.action_taken ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.recovered_value_cents
                        ? formatMoney(c.recovered_value_cents)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/sepet-kurtarma/${c.id}/duzenle`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                        </Button>
                        <DeleteButton action={deleteCartRecovery} id={c.id} />
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
