import Link from "next/link";
import { FileText } from "lucide-react";

import { resolvePeriod, previousPeriod } from "@/lib/period";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { listReports } from "@/lib/db/queries/reports";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { PeriodSelector } from "@/components/period-selector";
import { ReportExport } from "@/components/report-export";
import { Badge } from "@/components/ui/badge";
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
  const [d, prevData, savedReports] = await Promise.all([
    getDashboard(period),
    prev ? getDashboard(prev) : Promise.resolve(null),
    listReports(),
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
    <div className="relative z-0 pb-28 space-y-6">
      <GoldStream motif="seal" />
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

      {savedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kayıtlı Raporlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedReports.map((r) => (
              <Link
                key={r.id}
                href={`/raporlar/${r.id}`}
                className="nm-raised-sm nm-interactive flex items-center gap-3 rounded-2xl p-3"
              >
                <div className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {formatDate(r.report_date)} · {r.category}
                    {r.summary ? ` · ${r.summary}` : ""}
                  </p>
                </div>
                {r.taskTotal > 0 && (
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {r.taskDone}/{r.taskTotal} görev
                  </Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Özet (Kâr / Zarar)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.label} className="nm-raised-sm rounded-2xl p-4">
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
