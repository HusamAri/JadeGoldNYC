import Link from "next/link";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Percent,
} from "lucide-react";

import { resolvePeriod } from "@/lib/period";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDateTime } from "@/lib/format";
import { auditSummary } from "@/lib/audit-format";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { PeriodSelector } from "@/components/period-selector";
import { TrendChart, CategoryPie } from "@/components/charts/dashboard-charts";
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

export const metadata = { title: "Panel" };

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const period = resolvePeriod(strParam(sp.period));
  const d = await getDashboard(period);
  const cur = d.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel"
        description={`Genel bakış · ${period.label}`}
        action={<PeriodSelector />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Toplam Gelir"
          value={formatMoney(d.revenueCents, cur)}
          icon={DollarSign}
        />
        <KpiCard
          label="Toplam Maliyet"
          value={formatMoney(d.costCents, cur)}
          icon={Wallet}
        />
        <KpiCard
          label="Net Kâr"
          value={formatMoney(d.profitCents, cur)}
          icon={TrendingUp}
          accent={d.profitCents >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          label="Sipariş Sayısı"
          value={formatNumber(d.orderCount)}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Ort. Sipariş"
          value={formatMoney(d.aovCents, cur)}
          icon={Receipt}
        />
        <KpiCard
          label="Kâr Marjı"
          value={formatPercent(d.margin)}
          icon={Percent}
          accent={d.margin >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir / Maliyet Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={d.trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maliyet Kırılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie data={d.costByCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>En Çok Satan Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            {d.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu dönemde ürün satışı yok.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.topProducts.map((p) => (
                    <TableRow key={p.title}>
                      <TableCell className="max-w-[280px] truncate font-medium">
                        {p.title}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(p.quantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Math.round(p.revenue * 100), cur)}
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
            <CardTitle>Son Etkinlikler</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Henüz kayıt yok.
              </p>
            ) : (
              <ul className="space-y-3">
                {d.recent.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {auditSummary(a)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {a.actor_label ?? "Sistem"}
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDateTime(a.created_at, "d MMM HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link
                href="/kayitlar"
                className="text-primary text-sm font-medium hover:underline"
              >
                Tüm kayıtları gör →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
