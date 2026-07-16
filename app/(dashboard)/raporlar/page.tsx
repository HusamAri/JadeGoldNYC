import Link from "next/link";
import { FileText } from "lucide-react";

import { resolvePeriod, previousPeriod, samePeriodLastYear } from "@/lib/period";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { listReports } from "@/lib/db/queries/reports";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDate } from "@/lib/format";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { SceneCutouts } from "@/components/scene-cutouts";
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
  const lastYear = samePeriodLastYear(period);
  const [d, prevData, lastYearData, savedReports] = await Promise.all([
    getDashboard(period),
    prev ? getDashboard(prev) : Promise.resolve(null),
    lastYear ? getDashboard(lastYear) : Promise.resolve(null),
    listReports(),
  ]);
  const cur = d.currency;

  function pctChange(current: number, previous: number | undefined | null): string | null {
    if (previous == null || previous === 0) return null;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const arrow = change >= 0 ? "↑" : "↓";
    return `${arrow} %${Math.abs(change).toFixed(1)}`;
  }

  /** Kâr marjı için puan farkı metni (oran − oran); karşılaştırma verisi yoksa null. */
  function marginDiff(base: { margin: number; revenueCents: number } | null): string | null {
    if (!base || base.revenueCents === 0) return null;
    const diff = (d.margin - base.margin) * 100;
    const arrow = diff >= 0 ? "↑" : "↓";
    return `${arrow} %${Math.abs(diff).toFixed(1)}`;
  }

  // cents alanı: öne çıkan para tutarları <Money/> ile gösterilir; para
  // olmayanlar (adet/oran) cents=null → düz value metniyle kalır. value alanı
  // ReportExport (CSV/PDF) için string olarak korunur. change = önceki bitişik
  // dönem (MoM), changeYoY = geçen yılın aynı dönemi (YoY).
  const kpis: {
    label: string;
    value: string;
    cents: number | null;
    change: string | null;
    changeYoY: string | null;
  }[] = [
    { label: "Toplam Gelir", value: formatMoney(d.revenueCents, cur), cents: d.revenueCents, change: pctChange(d.revenueCents, prevData?.revenueCents), changeYoY: pctChange(d.revenueCents, lastYearData?.revenueCents) },
    { label: "Toplam Maliyet", value: formatMoney(d.costCents, cur), cents: d.costCents, change: pctChange(d.costCents, prevData?.costCents), changeYoY: pctChange(d.costCents, lastYearData?.costCents) },
    { label: "Net Kar", value: formatMoney(d.profitCents, cur), cents: d.profitCents, change: pctChange(d.profitCents, prevData?.profitCents), changeYoY: pctChange(d.profitCents, lastYearData?.profitCents) },
    { label: "Siparis Sayisi", value: formatNumber(d.orderCount), cents: null, change: pctChange(d.orderCount, prevData?.orderCount), changeYoY: pctChange(d.orderCount, lastYearData?.orderCount) },
    { label: "Ortalama Siparis", value: formatMoney(d.aovCents, cur), cents: d.aovCents, change: pctChange(d.aovCents, prevData?.aovCents), changeYoY: pctChange(d.aovCents, lastYearData?.aovCents) },
    { label: "Kar Marji", value: formatPercent(d.margin), cents: null, change: marginDiff(prevData), changeYoY: marginDiff(lastYearData) },
  ];

  return (
    <div className="relative z-0 pb-28 space-y-8">
      <GoldStream motif="seal" />
      <SceneCutouts page="raporlar" />
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
        <Card className="glass-iced">
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
                  {/* Liste satırı tek-satır başlığı: kırpma yerine yatay kaydır */}
                  <p className="scroll-x font-medium">{r.title}</p>
                  {/* Açıklama metni kutu içinde: alt satıra sarsın (özet kırpılmasın) */}
                  <p className="wrap-box text-muted-foreground text-xs">
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

      <Card className="glass-board">
        <CardHeader>
          <CardTitle>Özet (Kâr / Zarar)</CardTitle>
          {/* Pencere + karşılaştırma dönemleri etiketi — veri kısıtı ekranda. */}
          <p className="text-muted-foreground text-xs">
            {period.label}
            {prev
              ? ` · MoM: ${prev.label.toLocaleLowerCase("tr-TR")}`
              : ""}
            {lastYear
              ? ` · YoY: ${lastYear.label.toLocaleLowerCase("tr-TR")}`
              : " · karşılaştırma yok (tüm zamanlar)"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.label} className="nm-raised-sm rounded-2xl p-4">
                <p className="text-muted-foreground text-sm">{k.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {k.cents != null ? (
                    <Money cents={k.cents} currency={cur} />
                  ) : (
                    k.value
                  )}
                </p>
                {/* İki delta: geçen döneme göre + geçen yıla göre. Pencere var
                    ama verisi yoksa satır gizlenmez — "veri yok" yazılır. */}
                {prev && (
                  <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                    {k.change
                      ? `${k.change} (${prev.label})`
                      : `${prev.label}: veri yok`}
                  </p>
                )}
                {lastYear && (
                  <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                    {k.changeYoY
                      ? `${k.changeYoY} (${lastYear.label})`
                      : `${lastYear.label}: veri yok`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-fluted">
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

        <Card className="glass-fluted">
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
