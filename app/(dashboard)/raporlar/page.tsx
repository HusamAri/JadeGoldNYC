import { resolvePeriod, previousPeriod } from "@/lib/period";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { PeriodSelector } from "@/components/period-selector";
import { ReportExport } from "@/components/report-export";
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

export const metadata = { title: "Raporlar" };

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const period = resolvePeriod(strParam(sp.period));
  const prev = previousPeriod(period);
  const [d, prevData] = await Promise.all([
    getDashboard(period),
    prev ? getDashboard(prev) : Promise.resolve(null),
  ]);
  const cur = d.currency;

  function pctChange(current: number, previous: number | undefined | null): string | null {
    if (previous == null || previous === 0) return null;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const arrow = change >= 0 ? "↑" : "↓";
    return `${arrow} %${Math.abs(change).toFixed(1)}`;
  }

  const kpis = [
    { label: "Toplam Gelir", value: formatMoney(d.revenueCents, cur), change: pctChange(d.revenueCents, prevData?.revenueCents) },
    { label: "Toplam Maliyet", value: formatMoney(d.costCents, cur), change: pctChange(d.costCents, prevData?.costCents) },
    { label: "Net Kar", value: formatMoney(d.profitCents, cur), change: pctChange(d.profitCents, prevData?.profitCents) },
    { label: "Siparis Sayisi", value: formatNumber(d.orderCount), change: pctChange(d.orderCount, prevData?.orderCount) },
    { label: "Ortalama Siparis", value: formatMoney(d.aovCents, cur), change: pctChange(d.aovCents, prevData?.aovCents) },
    { label: "Kar Marji", value: formatPercent(d.margin), change: prevData ? (() => { const diff = (d.margin - prevData.margin) * 100; const arrow = diff >= 0 ? "↑" : "↓"; return `${arrow} %${Math.abs(diff).toFixed(1)}`; })() : null },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raporlar"
        description={`Dönem · ${period.label}`}
        action={
          <>
            <PeriodSelector />
            <ReportExport
              periodLabel={period.label}
              kpis={kpis}
              trend={d.trend}
              categories={d.costByCategory}
              currency={cur}
            />
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Özet (Kâr / Zarar)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-lg border p-4">
                <p className="text-muted-foreground text-sm">{k.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {k.value}
                </p>
                {k.change && (
                  <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                    {k.change}{prev ? ` (${prev.label})` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günlük Gelir / Maliyet</CardTitle>
          </CardHeader>
          <CardContent>
            {d.trend.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu dönemde veri yok.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gün</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.trend.map((t) => (
                    <TableRow key={t.date}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Math.round(t.revenue * 100), cur)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Math.round(t.cost * 100), cur)}
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
            <CardTitle>Maliyet Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            {d.costByCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu dönemde maliyet yok.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.costByCategory.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Math.round(c.value * 100), cur)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
