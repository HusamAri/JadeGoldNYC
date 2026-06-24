import { resolvePeriod } from "@/lib/period";
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
  const d = await getDashboard(period);
  const cur = d.currency;

  const kpis = [
    { label: "Toplam Gelir", value: formatMoney(d.revenueCents, cur) },
    { label: "Toplam Maliyet", value: formatMoney(d.costCents, cur) },
    { label: "Net Kâr", value: formatMoney(d.profitCents, cur) },
    { label: "Sipariş Sayısı", value: formatNumber(d.orderCount) },
    { label: "Ortalama Sipariş", value: formatMoney(d.aovCents, cur) },
    { label: "Kâr Marjı", value: formatPercent(d.margin) },
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
