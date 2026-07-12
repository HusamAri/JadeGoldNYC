import Link from "next/link";
import { Plus, Upload, Eye, Pencil } from "lucide-react";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Receipt,
  Percent,
  Users,
} from "@/components/icons/lux-art";

import { requireMembership } from "@/lib/auth";
import { listSales, getSalesAnalytics } from "@/lib/db/queries/sales";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { SALE_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { SceneCutouts } from "@/components/scene-cutouts";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import {
  RevenueAreaChart,
  OrdersBarChart,
} from "@/components/charts/dashboard-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TR_MON = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${TR_MON[Number(m) - 1] ?? m} ${y.slice(2)}`;
}
const usd0 = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
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

  const m = await requireMembership();
  const [{ rows, count }, analytics] = await Promise.all([
    listSales({ search, status, limit, offset }),
    getSalesAnalytics(m.org_id, { search, status }),
  ]);

  const t = analytics.totals;
  const netCents = t.gross_cents - t.fees_cents;
  const avgCents = t.orders > 0 ? Math.round(t.gross_cents / t.orders) : 0;
  const feePct = t.gross_cents > 0 ? t.fees_cents / t.gross_cents : 0;
  const revenueSeries = analytics.monthly.map((x) => ({
    label: monthLabel(x.ym),
    revenue: Math.round(x.gross_cents / 100),
  }));
  const orderSeries = analytics.monthly.map((x) => ({
    label: monthLabel(x.ym),
    orders: x.orders,
  }));
  const maxCountry = Math.max(
    1,
    ...analytics.countries.map((c) => c.gross_cents),
  );
  const filtered = Boolean(search || status);

  return (
    <div className="relative z-0 space-y-6 pb-28">
      <SceneCutouts page="satislar" />
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

      {/* Analiz paneli — liste filtresine (durum/arama) saygı duyar */}
      <section className="space-y-4">
        <p className="text-muted-foreground text-xs">
          {filtered
            ? "Özet, uygulanan filtreye göre hesaplanır."
            : "Özet ciro ve sipariş sayısı iptal edilen siparişleri hariç tutar; alttaki liste tümünü gösterir."}
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <KpiCard
            label="Ciro (brüt)"
            value={usd0(t.gross_cents)}
            icon={DollarSign}
          />
          <KpiCard
            label="Net (kesinti sonrası)"
            value={usd0(netCents)}
            icon={TrendingUp}
            accent="positive"
            hint="Etsy kesintisi düşülmüş"
          />
          <KpiCard
            label="Sipariş"
            value={formatNumber(t.orders)}
            icon={ShoppingBag}
          />
          <KpiCard
            label="Ort. Sipariş"
            value={usd0(avgCents)}
            icon={Receipt}
          />
          <KpiCard
            label="Etsy Kesintisi"
            value={usd0(t.fees_cents)}
            icon={Percent}
            hint={`Cironun %${(feePct * 100).toFixed(1)}'i`}
          />
          <KpiCard
            label="Alıcı"
            value={formatNumber(t.buyers)}
            icon={Users}
          />
        </div>

        {analytics.monthly.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-muted-foreground text-sm font-medium">
                  Aylık Ciro · son 12 ay
                </h3>
                <RevenueAreaChart data={revenueSeries} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-muted-foreground text-sm font-medium">
                  Aylık Sipariş · son 12 ay
                </h3>
                <OrdersBarChart data={orderSeries} />
              </CardContent>
            </Card>
          </div>
        )}

        {analytics.countries.length > 0 && (
          <Card>
            <CardContent className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-medium">
                Ülkeye Göre Ciro
              </h3>
              <ul className="space-y-2.5">
                {analytics.countries.map((c) => (
                  <li key={c.country} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">
                        {c.country}
                        <span className="text-muted-foreground ml-2 text-xs font-normal">
                          {formatNumber(c.orders)} sipariş
                        </span>
                      </span>
                      <span className="tabular-nums font-medium">
                        {usd0(c.gross_cents)}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-[var(--chart-2)]"
                        style={{
                          width: `${((c.gross_cents / maxCountry) * 100).toFixed(1)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

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
