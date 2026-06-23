import Link from "next/link";
import {
  Plus,
  Pencil,
  Users,
  Repeat,
  UserRoundX,
  DollarSign,
  CheckCircle2,
} from "lucide-react";

import {
  listCartRecoveries,
  getCartSummary,
  getWinbackCandidates,
  getWinbackSummary,
} from "@/lib/db/queries/cart-recoveries";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { CART_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatNumber, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
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
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { Pagination } from "@/components/data-table/pagination";
import { DeleteButton } from "@/components/data-table/delete-button";
import { CartStatusBadge } from "@/components/cart-status-badge";
import { deleteCartRecovery } from "./actions";

export const metadata = { title: "Müşteri Geri Kazanım" };

const LAPSE_DAYS = 90;

export default async function GeriKazanimPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const status = strParam(sp.status);
  const search = strParam(sp.search);
  const offset = numParam(sp.offset);
  const limit = 25;

  const [candidates, winback, { rows, count }, tracking] = await Promise.all([
    getWinbackCandidates(LAPSE_DAYS, 100),
    getWinbackSummary(LAPSE_DAYS),
    listCartRecoveries({ status, search, limit, offset }),
    getCartSummary(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Geri Kazanım"
        description="Uzun süredir sipariş vermemiş yüksek değerli müşterileri belirleyin ve geri kazanım aksiyonlarını takip edin"
        action={
          <Button asChild>
            <Link href="/sepet-kurtarma/yeni">
              <Plus />
              Yeni Kayıt
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Toplam Müşteri"
          value={formatNumber(winback.total_customers)}
          icon={Users}
        />
        <KpiCard
          label="Tekrar Eden Müşteri"
          value={formatNumber(winback.repeat_customers)}
          icon={Repeat}
          accent="positive"
        />
        <KpiCard
          label={`${LAPSE_DAYS}+ Gün Gelmeyen`}
          value={formatNumber(winback.lapsed_customers)}
          icon={UserRoundX}
        />
        <KpiCard
          label="Risk Altındaki Değer"
          value={formatMoney(winback.lapsed_value_cents)}
          icon={DollarSign}
          hint="geçmiş ciro toplamı"
        />
        <KpiCard
          label="Kazanılan"
          value={formatMoney(tracking.recoveredValueCents)}
          icon={CheckCircle2}
          hint={`${formatNumber(tracking.recovered)} müşteri`}
          accent="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Öncelikli Geri Kazanım Adayları</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aday yok"
              description="Etsy senkronundan sonra sipariş geçmişi burada müşteri bazında özetlenir; en değerli, uzun süredir gelmeyen müşteriler öne çıkar."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="text-right">Sipariş</TableHead>
                  <TableHead className="text-right">Toplam Harcama</TableHead>
                  <TableHead>Son Sipariş</TableHead>
                  <TableHead className="text-right">Gün Önce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow key={c.buyer_key}>
                    <TableCell className="max-w-[260px] truncate font-medium">
                      {c.buyer_name ?? c.buyer_email ?? c.buyer_key}
                      {c.buyer_email && c.buyer_name && (
                        <span className="text-muted-foreground block truncate text-xs font-normal">
                          {c.buyer_email}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(c.order_count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMoney(c.total_spent_cents)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(c.last_order_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {formatNumber(c.days_since)}
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
          <CardTitle>Geri Kazanım Takibi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Müşteri, e-posta, not…" />
            <FilterSelect
              paramKey="status"
              placeholder="Durum"
              options={CART_STATUSES}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Takip kaydı yok"
              description="Bir müşteriye ulaştığınızda kaydı buraya ekleyin; teşvik/aksiyon ve sonucu (kazanıldı/kayıp) takip edin."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="text-right">Değer</TableHead>
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
