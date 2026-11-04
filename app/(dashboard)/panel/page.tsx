import { Suspense } from "react";
import Link from "next/link";
import { Palette, Receipt as ReceiptLine, RotateCcw, Send } from "lucide-react";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Percent,
  Scale,
  Gem,
  Hammer,
} from "@/components/icons/lux-art";

import { resolvePeriod, previousPeriod, samePeriodLastYear } from "@/lib/period";
import { getDashboard, type DashboardData } from "@/lib/db/queries/dashboard";
import { getAlertCenter } from "@/lib/db/queries/alerts";
import { getListingLoopStatus } from "@/lib/db/queries/listings";
import { countRefundBacklog, listSaleItemPnl } from "@/lib/db/queries/sale-costs";
import { requireMembership } from "@/lib/auth";
import { getGoldPricePerOunce } from "@/lib/gold-price";
import { TROY_OUNCE_GRAMS, KARAT_PURITY } from "@/lib/gold-cost";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDateTime, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { AlertCenterCard } from "@/components/alert-center";
import { SleepingNote } from "@/components/sleeping-boxes";
import { AlertResolutionTracker } from "@/components/panel/alert-resolution-tracker";
import { PeriodSelector } from "@/components/period-selector";
import { TrendChart } from "@/components/charts/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Panel" };

export const maxDuration = 60;

/** Dikkat listesi en çok bu kadar satır gösterir (alarm yorgunluğu kuralı). */
const ATTENTION_LIMIT = 5;

/**
 * Ana sayfa — Amuletta 2.0 (docs/amuletta-2/plan.md §1, research-ux.md §2):
 * yalnız BUGÜN aksiyon alınacak şey görünür, gerisi bir tık ötede.
 *   1) Dört aksiyon sayısı (taslak bekleyen, Etsy'de taslak, maliyeti eksik
 *      kalem, iade tutarı bekleyen) + "veri şu ana kadar" tazeliği
 *   2) Dikkat: uyarı merkezinin paraya göre sıralı ilk 5 satırı
 *   3) Altın şeridi
 *   4) Gelir/maliyet trendi + 4 KPI
 *   5) Maliyet kırılımı (çubuk, pasta değil) + altın maliyet metrikleri
 * Ömür boyu toplam, en iyi müşteri, kanal, pazar bandı ve oturum popup'ı yok.
 */
export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const period = resolvePeriod(strParam(sp.period));
  const prev = previousPeriod(period);
  const lastYear = samePeriodLastYear(period);
  const m = await requireMembership();
  // Kabuk yalnız KPI + altın bekler; uyarı merkezi ve aksiyon sayıları
  // kendi Suspense dallarında akar.
  const [d, goldPriceOunce, prevData, lastYearData] = await Promise.all([
    getDashboard(period, m.org_id),
    getGoldPricePerOunce(),
    prev ? getDashboard(prev, m.org_id) : Promise.resolve(null),
    lastYear ? getDashboard(lastYear, m.org_id) : Promise.resolve(null),
  ]);
  const cur = d.currency;
  const goldPricePerGram = goldPriceOunce / TROY_OUNCE_GRAMS;

  function pctChange(current: number, previous: number | undefined | null): number | null {
    if (previous == null || previous === 0) return null;
    return (current - previous) / Math.abs(previous);
  }
  function kpiComparisons(pick: (x: DashboardData) => number) {
    const list: { change: number | null; label: string }[] = [];
    if (prev)
      list.push({ change: pctChange(pick(d), prevData ? pick(prevData) : null), label: prev.label });
    if (lastYear)
      list.push({ change: pctChange(pick(d), lastYearData ? pick(lastYearData) : null), label: lastYear.label });
    return list;
  }
  const marginComparisons = [
    ...(prev
      ? [{ change: prevData && prevData.revenueCents > 0 ? d.margin - prevData.margin : null, label: prev.label }]
      : []),
    ...(lastYear
      ? [{ change: lastYearData && lastYearData.revenueCents > 0 ? d.margin - lastYearData.margin : null, label: lastYear.label }]
      : []),
  ];

  // Önceki dönem overlay'i — gün index'ine göre hizala.
  const dayIndex = (dateIso: string, fromIso: string) =>
    Math.floor((new Date(dateIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
  let trendData: (DashboardData["trend"][number] & { prevRevenue?: number | null })[] = d.trend;
  if (prev?.fromIso && period.fromIso && prevData) {
    const prevByIdx = new Map<number, number>();
    for (const t of prevData.trend) prevByIdx.set(dayIndex(t.date, prev.fromIso), t.revenue);
    trendData = d.trend.map((t) => ({
      ...t,
      prevRevenue: prevByIdx.get(dayIndex(t.date, period.fromIso!)) ?? null,
    }));
  }
  const prevTrendEmpty = prevData != null && prevData.trend.length === 0;
  const compareCaption = prev
    ? prevTrendEmpty
      ? `${period.label} · ${prev.label.toLocaleLowerCase("tr-TR")} verisi yok`
      : `${period.label} · kesikli: ${prev.label.toLocaleLowerCase("tr-TR")}`
    : `${period.label} · karşılaştırma yok (tüm zamanlar)`;
  const lastSaleDate = d.trend.length ? d.trend[d.trend.length - 1].date : null;

  const hasGold = d.goldCosts.totalGoldCents > 0;
  const hasCosts = d.costByCategory.length > 0;

  return (
    <div className="page-stack relative z-0 pb-24">
      <PageHeader
        title="Panel"
        description={`Bugün ne yapmalı · ${period.label}`}
        action={<PeriodSelector />}
      />

      <Suspense fallback={<SectionSkeleton h="h-[132px]" label="Aksiyon sayıları…" />}>
        <ActionCounts orgId={m.org_id} lastSaleDate={lastSaleDate} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton h="h-[260px]" label="Dikkat listesi…" />}>
        <AttentionSection orgId={m.org_id} />
      </Suspense>

      {/* Altın şeridi — kabarık yüzey, tek sıcak vurgu. */}
      <div className="nm-raised relative isolate rounded-[26px] px-6 py-6">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="nm-pressed inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--gold-deep)]"
            >
              <Gem className="size-6" />
            </span>
            <div className="flex flex-col">
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                Güncel altın
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-semibold tracking-tight tabular-nums">
                  ${formatNumber(goldPriceOunce)}
                </span>
                <span className="text-muted-foreground text-sm font-medium">/oz</span>
              </span>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <GramReadout label="24K gram" value={goldPricePerGram} />
            <GramReadout label="14K gram" value={goldPricePerGram * KARAT_PURITY["14K"]} />
            <GramReadout label="10K gram" value={goldPricePerGram * KARAT_PURITY["10K"]} />
          </div>
        </div>
      </div>

      {/* Gelir & kârlılık */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>01 · Gelir &amp; kârlılık</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir / maliyet trendi</CardTitle>
            <p className="text-muted-foreground text-xs">{compareCaption}</p>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendData}
              compareLabel={
                prev && !prevTrendEmpty
                  ? `Gelir · ${prev.label.toLocaleLowerCase("tr-TR")}`
                  : undefined
              }
            />
          </CardContent>
        </Card>
        <div className="stagger grid grid-cols-2 content-start gap-5">
          <KpiCard label="Toplam gelir" cents={d.revenueCents} currency={cur} icon={DollarSign} comparisons={kpiComparisons((x) => x.revenueCents)} />
          <KpiCard label="Toplam maliyet" cents={d.costCents} currency={cur} icon={Wallet} comparisons={kpiComparisons((x) => x.costCents)} />
          <KpiCard label="Net kâr" cents={d.profitCents} currency={cur} icon={TrendingUp} holo comparisons={kpiComparisons((x) => x.profitCents)} />
          <KpiCard label="Kâr marjı" value={formatPercent(d.margin)} icon={Percent} accent={d.margin >= 0 ? "positive" : "negative"} comparisons={marginComparisons} />
        </div>
      </div>

      {/* Maliyet yapısı — çubuk kırılım (pasta değil) + altın metrikleri */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>02 · Maliyet yapısı</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
      </div>
      {hasCosts || hasGold ? (
        <div className={hasGold ? "grid gap-5 lg:grid-cols-3" : "grid gap-5"}>
          <Card>
            <CardHeader>
              <CardTitle>Maliyet kırılımı</CardTitle>
              <p className="text-muted-foreground text-xs">{period.label} · kategoriye göre pay</p>
            </CardHeader>
            <CardContent>
              <CostBars data={d.costByCategory} currency={cur} />
            </CardContent>
          </Card>
          {hasGold && (
            <div className="stagger grid grid-cols-2 content-start gap-4 lg:col-span-2">
              <KpiCard label="Altın malzeme" cents={d.goldCosts.materialCents} currency={cur} icon={Gem} />
              <KpiCard label="İşçilik" cents={d.goldCosts.laborCents} currency={cur} icon={Hammer} />
              <KpiCard label="Toplam altın maliyet" cents={d.goldCosts.totalGoldCents} currency={cur} icon={Scale} />
              <KpiCard
                label="Altın kâr marjı"
                value={formatPercent(
                  d.revenueCents > 0 ? (d.revenueCents - d.goldCosts.totalGoldCents) / d.revenueCents : 0,
                )}
                icon={Percent}
                accent={d.revenueCents > d.goldCosts.totalGoldCents ? "positive" : "negative"}
              />
            </div>
          )}
        </div>
      ) : (
        <SleepingNote name="Maliyet yapısı" hint="bu dönemde maliyet kaydı girilince uyanır" />
      )}
    </div>
  );
}

/**
 * Dört aksiyon sayısı — her biri işin bir sonraki adımına link verir; 0 da
 * bilgidir ("yapacak iş yok"). Altında veri tazeliği: son Etsy senkronu ve
 * son sipariş tarihi ("senkron koştu" yeşili veri kanıtı değildir).
 */
async function ActionCounts({ orgId, lastSaleDate }: { orgId: string; lastSaleDate: string | null }) {
  const [loop, refundBacklog, incomplete] = await Promise.all([
    getListingLoopStatus(orgId),
    countRefundBacklog(orgId),
    listSaleItemPnl(orgId, { flag: "eksik", limit: 1 }).then((r) => r.count).catch(() => null),
  ]);
  const tiles = [
    { label: "Etsy'ye gidecek taslak", value: loop.pending, href: "/listing-onerileri", icon: Palette, hint: "panelde hazır" },
    { label: "Etsy'de taslak", value: loop.sent, href: "/tasarimlar", icon: Send, hint: "yayın bekliyor" },
    { label: "Maliyeti eksik kalem", value: incomplete, href: "/satislar/maliyet?flag=eksik", icon: ReceiptLine, hint: "altın veya işçilik yok" },
    { label: "İade tutarı bekleyen", value: refundBacklog, href: "/satislar/maliyet", icon: RotateCcw, hint: "Etsy'den okunacak" },
  ];
  return (
    <section aria-label="Aksiyon sayıları" className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          const zero = t.value === 0;
          return (
            <Link
              key={t.label}
              href={t.href}
              className={cn(
                "nm-raised jg-focus-outline group flex items-center gap-4 rounded-[20px] px-5 py-4 transition-[box-shadow] hover:[box-shadow:var(--shadow-hover)]",
                zero && "opacity-80",
              )}
            >
              <span className="nm-pressed inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--gold-deep)]">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-3xl font-semibold tracking-tight tabular-nums">
                  {t.value == null ? "—" : formatNumber(t.value)}
                </span>
                <span className="text-muted-foreground block text-xs leading-tight">
                  {t.label}
                  <span className="opacity-70"> · {t.hint}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="text-muted-foreground font-mono text-[11px] tracking-[0.08em] uppercase">
        Veri şu ana kadar:{" "}
        {loop.lastSyncAt ? `Etsy senkronu ${formatDateTime(loop.lastSyncAt)}` : "Etsy senkronu yok"}
        {lastSaleDate ? ` · son sipariş ${formatDate(lastSaleDate)}` : ""}
      </p>
    </section>
  );
}

/** Dikkat — uyarı merkezinin ilk 5 satırı (paraya göre sıralı gelir). */
async function AttentionSection({ orgId }: { orgId: string }) {
  const center = await getAlertCenter(orgId);
  if (center.total === 0)
    return <SleepingNote name="Dikkat listesi" hint="her şey yolunda; aksiyon bekleyen uyarı çıkınca uyanır" />;
  const trimmed = { ...center, alerts: center.alerts.slice(0, ATTENTION_LIMIT) };
  return (
    <>
      <AlertResolutionTracker alerts={center.alerts} />
      <AlertCenterCard data={trimmed} />
      {center.alerts.length > ATTENTION_LIMIT && (
        <p className="text-muted-foreground -mt-4 text-xs">
          {center.alerts.length - ATTENTION_LIMIT} uyarı daha var; en pahalı {ATTENTION_LIMIT} tanesi burada.
        </p>
      )}
    </>
  );
}

/** Maliyet kırılımı — inset ray içinde altın dolgu çubukları (pasta yerine). */
function CostBars({ data, currency }: { data: { name: string; value: number }[]; currency: string }) {
  const total = data.reduce((a, c) => a + (c.value ?? 0), 0);
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 8);
  if (total <= 0)
    return <p className="text-muted-foreground text-sm">Bu dönemde maliyet kaydı yok.</p>;
  return (
    <ul className="space-y-3.5">
      {sorted.map((c) => {
        const pct = c.value / total;
        return (
          <li key={c.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{c.name}</span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                {formatMoney(Math.round(c.value * 100), currency)} · {formatPercent(pct)}
              </span>
            </div>
            <div className="nm-pressed h-2.5 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full [background-image:var(--grad-holo)] shadow-[0_1px_2px_oklch(from_var(--nm-lo)_l_c_h/0.5)]"
                style={{ width: `${Math.max(2, Math.round(pct * 100))}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SectionSkeleton({ h, label }: { h: string; label: string }) {
  return (
    <div className={`nm-pressed relative overflow-hidden rounded-[26px] ${h} motion-safe:animate-pulse`}>
      <span className="text-muted-foreground absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[0.14em] uppercase">
        {label}
      </span>
    </div>
  );
}

function GramReadout({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">{label}</span>
      <span className="font-semibold tabular-nums">${value.toFixed(2)}</span>
    </div>
  );
}
