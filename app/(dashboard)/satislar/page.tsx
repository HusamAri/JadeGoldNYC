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
import {
  listSales,
  getSalesAnalytics,
  getMonthlySalesSeries,
} from "@/lib/db/queries/sales";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { SALE_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate, formatNumber } from "@/lib/format";
import { OrgMark } from "@/components/brand/org-mark";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { CornerMarks } from "@/components/brand/corner-marks";
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
  // 24 aylık TS aylıklaştırması: RPC'nin 12 aylık grafiğine "geçen yıl aynı ay"
  // overlay'i + KPI'lara MoM/YoY rozetleri için (RPC değişmeden, aynı filtreler).
  const [{ rows, count }, analytics, monthly24] = await Promise.all([
    listSales({ search, status, limit, offset }),
    getSalesAnalytics(m.org_id, { search, status }),
    getMonthlySalesSeries(m.org_id, { months: 24, search, status }),
  ]);

  const t = analytics.totals;
  const netCents = t.gross_cents - t.fees_cents;
  const avgCents = t.orders > 0 ? Math.round(t.gross_cents / t.orders) : 0;
  const feePct = t.gross_cents > 0 ? t.fees_cents / t.gross_cents : 0;

  // ── MoM / YoY karşılaştırmaları (bu ay vs geçen ay · vs geçen yıl aynı ay) ──
  const byYm = new Map(monthly24.map((x) => [x.ym, x]));
  const ymOf = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  const now = new Date();
  const thisMonth = byYm.get(ymOf(now));
  const lastMonth = byYm.get(ymOf(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
  const lastYearMonth = byYm.get(ymOf(new Date(now.getFullYear() - 1, now.getMonth(), 1)));
  const pct = (curVal: number, prevVal: number | undefined | null): number | null =>
    prevVal == null || prevVal === 0 ? null : (curVal - prevVal) / Math.abs(prevVal);
  /** Aylık metrik için iki rozet: MoM + YoY (pencere hep görünür; veri yoksa
      KpiCard "veri yok" yazar — kısıt gizlenmez). */
  const monthlyComparisons = (
    pick: (x: { orders: number; gross_cents: number }) => number,
  ) => [
    {
      change: pct(thisMonth ? pick(thisMonth) : 0, lastMonth ? pick(lastMonth) : null),
      label: "Bu ay vs geçen ay",
    },
    {
      change: pct(
        thisMonth ? pick(thisMonth) : 0,
        lastYearMonth ? pick(lastYearMonth) : null,
      ),
      label: "Bu ay vs geçen yıl aynı ay",
    },
  ];
  const monthlyAov = (x: { orders: number; gross_cents: number }) =>
    x.orders > 0 ? x.gross_cents / x.orders : 0;

  // ── Grafik overlay'i: her ayın karşısına GEÇEN YIL aynı ayı hizala.
  // 24 aylık pencere son 12 ayın tüm YoY karşılıklarını kapsar; kayıt yokluğu
  // pencere içinde gerçek 0 demektir. Geçen yıl HİÇ veri yoksa overlay yerine
  // etikette "geçen yıl verisi yok" denir (seri sessizce gizlenmez).
  const prevYm = (ym: string) => `${Number(ym.slice(0, 4)) - 1}${ym.slice(4)}`;
  const yoyHasData = analytics.monthly.some((x) => byYm.has(prevYm(x.ym)));
  const revenueSeries = analytics.monthly.map((x) => ({
    label: monthLabel(x.ym),
    revenue: Math.round(x.gross_cents / 100),
    compareRevenue: yoyHasData
      ? Math.round((byYm.get(prevYm(x.ym))?.gross_cents ?? 0) / 100)
      : null,
  }));
  const orderSeries = analytics.monthly.map((x) => ({
    label: monthLabel(x.ym),
    orders: x.orders,
    prevOrders: yoyHasData ? (byYm.get(prevYm(x.ym))?.orders ?? 0) : null,
  }));
  const yoyCaption = yoyHasData
    ? "son 12 ay · kesikli/soluk: geçen yıl aynı ay"
    : "son 12 ay · geçen yıl verisi yok";
  const maxCountry = Math.max(
    1,
    ...analytics.countries.map((c) => c.gross_cents),
  );
  const filtered = Boolean(search || status);
  // Özet KPI'ları toplulaştırılmış USD (usd0 zaten USD varsayar) → Money için para birimi.
  const cur = "USD";

  return (
    <div className="relative z-0 space-y-8 pb-28">
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
        {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
        <div aria-hidden className="idx">
          <span>Satışlar / 01 · Özet</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span><OrgMark /></span>
        </div>
        <p className="text-muted-foreground text-xs">
          {filtered
            ? "Özet, uygulanan filtreye göre hesaplanır."
            : "Özet ciro ve sipariş sayısı iptal edilen siparişleri hariç tutar; alttaki liste tümünü gösterir."}
        </p>
        {/* Ana KPI bölümü — Spatial hero köşe işaretleri (dekoratif sarmalayıcı). */}
        <div className="relative">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          <KpiCard
            label="Ciro (brüt)"
            cents={t.gross_cents}
            currency={cur}
            icon={DollarSign}
            comparisons={monthlyComparisons((x) => x.gross_cents)}
          />
          <KpiCard
            label="Net (kesinti sonrası)"
            cents={netCents}
            currency={cur}
            icon={TrendingUp}
            accent="positive"
            hint="Etsy kesintisi düşülmüş"
          />
          <KpiCard
            label="Sipariş"
            value={formatNumber(t.orders)}
            icon={ShoppingBag}
            comparisons={monthlyComparisons((x) => x.orders)}
          />
          <KpiCard
            label="Ort. Sipariş"
            cents={avgCents}
            currency={cur}
            icon={Receipt}
            comparisons={monthlyComparisons(monthlyAov)}
          />
          <KpiCard
            label="Etsy Kesintisi"
            cents={t.fees_cents}
            currency={cur}
            icon={Percent}
            hint={`Cironun %${(feePct * 100).toFixed(1)}'i`}
          />
          <KpiCard
            label="Alıcı"
            value={formatNumber(t.buyers)}
            icon={Users}
          />
        </div>
        <CornerMarks />
        </div>

        {analytics.monthly.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="glass-iced">
              <CardContent className="space-y-3">
                <h3 className="text-muted-foreground text-sm font-medium">
                  Aylık Ciro{" "}
                  <span className="text-xs font-normal">· {yoyCaption}</span>
                </h3>
                <RevenueAreaChart
                  data={revenueSeries}
                  compareLabel={yoyHasData ? "Geçen yıl aynı ay" : undefined}
                />
              </CardContent>
            </Card>
            <Card className="glass-iced">
              <CardContent className="space-y-3">
                <h3 className="text-muted-foreground text-sm font-medium">
                  Aylık Sipariş{" "}
                  <span className="text-xs font-normal">· {yoyCaption}</span>
                </h3>
                <OrdersBarChart
                  data={orderSeries}
                  compareLabel={yoyHasData ? "Geçen yıl aynı ay" : undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {analytics.countries.length > 0 && (
          <Card>
            <CardContent className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-medium">
                Ülkeye Göre Ciro{" "}
                {/* Pencere etiketi: bu kırılım dönem filtresine tabi değildir. */}
                <span className="text-xs font-normal">· tüm zamanlar</span>
              </h3>
              <ul className="space-y-2.5">
                {analytics.countries.map((c) => (
                  <li key={c.country} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      {/* Uzun ülke adı liste satırında tek satır kalır, taşarsa yatay kaydırılır. */}
                      <span className="scroll-x min-w-0 font-medium">
                        {c.country}
                        <span className="text-muted-foreground ml-2 text-xs font-normal">
                          {formatNumber(c.orders)} sipariş
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums font-medium">
                        {usd0(c.gross_cents)}
                      </span>
                    </div>
                    <div className="nm-pressed h-2 overflow-hidden rounded-full">
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

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili). */}
      <div aria-hidden className="idx -mb-3">
        <span>Satışlar / 02 · Kayıtlar</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span><OrgMark /></span>
      </div>
      <Card className="glass-fluted">
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
