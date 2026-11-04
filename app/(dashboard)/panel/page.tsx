import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { resolvePeriod, previousPeriod, samePeriodLastYear } from "@/lib/period";
import { getDashboard, type DashboardData } from "@/lib/db/queries/dashboard";
import { getAlertCenter, type AlertSeverity } from "@/lib/db/queries/alerts";
import { getListingLoopStatus } from "@/lib/db/queries/listings";
import { countRefundBacklog, listSaleItemPnl } from "@/lib/db/queries/sale-costs";
import { requireMembership } from "@/lib/auth";
import { getGoldPricePerOunce } from "@/lib/gold-price";
import { TROY_OUNCE_GRAMS, KARAT_PURITY } from "@/lib/gold-cost";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatMoneyParts, formatPercent } from "@/lib/money";
import { formatNumber, formatDateTime, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { AlertResolutionTracker } from "@/components/panel/alert-resolution-tracker";
import { PeriodSelector } from "@/components/period-selector";
import { Bezel, Screen, FmDial, DecorCard, ScopeChart, Legend } from "@/components/instruments";
import { cn } from "@/lib/utils";

export const metadata = { title: "Panel" };

export const maxDuration = 60;

/** Dikkat listesi en çok bu kadar satır gösterir (alarm yorgunluğu kuralı). */
const ATTENTION_LIMIT = 5;

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  kritik: "Kritik",
  onemli: "Önemli",
  bilgi: "Bilgi",
};

/**
 * Ana sayfa — V7 "kumanda paneli" yapısı: dört aksiyon sayısı dört FARKLI
 * göstergede (LCD ekran, halka, mekanik sayaç, dekor kartı), ardından Dikkat
 * defteri, altın tuner şeridi, osiloskop trendi + dört defter KPI'ı ve maliyet
 * kırılımı. Yalnız BUGÜN aksiyon alınacak şey görünür, gerisi bir tık ötede.
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
  const prevByIdx = new Map<number, number>();
  if (prev?.fromIso && prevData)
    for (const t of prevData.trend) prevByIdx.set(dayIndex(t.date, prev.fromIso), t.revenue);
  const points = d.trend.map((t) => ({
    a: t.revenue,
    b: t.cost,
    c: period.fromIso ? (prevByIdx.get(dayIndex(t.date, period.fromIso)) ?? null) : null,
  }));
  const prevTrendEmpty = prevData != null && prevData.trend.length === 0;
  const lastSaleDate = d.trend.length ? d.trend[d.trend.length - 1].date : null;
  const firstLabel = d.trend.length ? d.trend[0].label : period.fromIso ? formatDate(period.fromIso, "d MMM") : "";
  const lastLabel = d.trend.length ? d.trend[d.trend.length - 1].label : formatDate(period.toIso, "d MMM");
  const chartMax = Math.max(0, ...points.flatMap((p) => [p.a, p.b ?? 0]));

  const hasGold = d.goldCosts.totalGoldCents > 0;
  const hasCosts = d.costByCategory.length > 0;
  const gold = formatMoneyParts(Math.round(goldPriceOunce * 100), "USD");

  return (
    <div className="flex flex-col gap-10 pb-24">
      <PageHeader
        eyebrow="00 · Panel"
        meta={period.label.toLocaleLowerCase("tr-TR")}
        title="Bugün ne yapmalı"
        description="Dört sayaç bugünün işini sayar; Dikkat defteri paraya göre sıralı. Gerisi bir tık ötede."
        action={<PeriodSelector />}
      />

      <Suspense fallback={<SectionSkeleton h="h-[190px]" label="Aksiyon sayıları…" />}>
        <ActionCounts orgId={m.org_id} lastSaleDate={lastSaleDate} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton h="h-[220px]" label="Dikkat defteri…" />}>
        <AttentionSection orgId={m.org_id} />
      </Suspense>

      {/* Altın tuner şeridi — tek yatay ekran: ons LCD, gram okumaları dim. */}
      <section aria-label="Güncel altın">
        <div className="sec-h">
          <span className="num">02</span>
          <h2>Altın</h2>
          <span className="mono-label right">spot · troy ons</span>
        </div>
        <Bezel className="mt-4">
          <Screen className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="dim">XAU / USD</span>
              <div className="lcd mt-1.5 text-[36px] leading-none tracking-[0.02em] sm:text-[44px]">
                {gold.main}
                <span className="text-[16px] opacity-70">{gold.fraction}</span>
                <span className="dim ml-3 text-[11px]">/oz</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-x-8 gap-y-1">
              <GramReadout label="24K gram" value={goldPricePerGram} />
              <GramReadout label="14K gram" value={goldPricePerGram * KARAT_PURITY["14K"]} />
              <GramReadout label="10K gram" value={goldPricePerGram * KARAT_PURITY["10K"]} />
            </div>
          </Screen>
        </Bezel>
      </section>

      {/* Gelir & kârlılık — osiloskop + dört defter KPI'ı */}
      <section aria-label="Gelir ve kârlılık" className="grid gap-x-12 gap-y-8 xl:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0">
          <div className="sec-h">
            <span className="num">03</span>
            <h2>Gelir ve maliyet</h2>
            <span className="mono-label right">
              {prev
                ? prevTrendEmpty
                  ? `${prev.label.toLocaleLowerCase("tr-TR")} verisi yok`
                  : `kesikli: ${prev.label.toLocaleLowerCase("tr-TR")}`
                : "karşılaştırma yok"}
            </span>
          </div>
          <ScopeChart
            className="mt-4"
            points={points}
            startLabel={firstLabel.toLocaleUpperCase("tr-TR")}
            endLabel={lastLabel.toLocaleUpperCase("tr-TR")}
            caption={`Gelir / maliyet · ${period.label.toLocaleLowerCase("tr-TR")}`}
            maxLabel={chartMax > 0 ? `max ${formatNumber(Math.round(chartMax))}` : undefined}
            height={220}
          />
          <Legend
            className="mt-4"
            items={[
              { label: "Gelir", kind: "neon" },
              { label: prev && !prevTrendEmpty ? `Gelir · ${prev.label.toLocaleLowerCase("tr-TR")}` : "Önceki dönem (yok)", kind: "dash" },
              { label: "Maliyet", kind: "ink" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <div className="sec-h">
            <span className="num">04</span>
            <h2>Dönem özeti</h2>
            <span className="mono-label right">{period.label.toLocaleLowerCase("tr-TR")}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-8">
            <KpiCard label="Toplam gelir" cents={d.revenueCents} currency={cur} comparisons={kpiComparisons((x) => x.revenueCents)} />
            <KpiCard label="Toplam maliyet" cents={d.costCents} currency={cur} comparisons={kpiComparisons((x) => x.costCents)} />
            <KpiCard label="Net kâr" cents={d.profitCents} currency={cur} holo comparisons={kpiComparisons((x) => x.profitCents)} />
            <KpiCard label="Kâr marjı" value={formatPercent(d.margin)} accent={d.margin >= 0 ? "default" : "negative"} comparisons={marginComparisons} />
          </div>
        </div>
      </section>

      {/* Maliyet yapısı — çubuk kırılım (pasta değil) + altın metrikleri */}
      <section aria-label="Maliyet yapısı">
        <div className="sec-h">
          <span className="num">05</span>
          <h2>Maliyet yapısı</h2>
          <span className="mono-label right">{period.label.toLocaleLowerCase("tr-TR")} · kategoriye göre pay</span>
        </div>
        {hasCosts || hasGold ? (
          <div className={cn("mt-5 grid gap-x-12 gap-y-8", hasGold && "xl:grid-cols-[1.35fr_1fr]")}>
            <CostBars data={d.costByCategory} currency={cur} />
            {hasGold && (
              <div className="grid grid-cols-2 gap-x-8">
                <KpiCard label="Altın malzeme" cents={d.goldCosts.materialCents} currency={cur} />
                <KpiCard label="İşçilik" cents={d.goldCosts.laborCents} currency={cur} />
                <KpiCard label="Toplam altın maliyet" cents={d.goldCosts.totalGoldCents} currency={cur} />
                <KpiCard
                  label="Altın kâr marjı"
                  value={formatPercent(
                    d.revenueCents > 0 ? (d.revenueCents - d.goldCosts.totalGoldCents) / d.revenueCents : 0,
                  )}
                  accent={d.revenueCents > d.goldCosts.totalGoldCents ? "default" : "negative"}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="note mt-4">
            <span className="mark">†</span>
            <span>Bu dönemde maliyet kaydı yok; kayıt girilince kırılım burada belirir.</span>
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Dört aksiyon sayısı — dört farklı gösterge: LCD ekran (taslak bekleyen),
 * halka (Etsy'de taslak / canlı oranı), mekanik sayaç (maliyeti eksik) ve
 * dekor kartı (iade tutarı bekleyen). Her biri işin bir sonraki adımına
 * link verir; 0 da bilgidir. Altında veri tazeliği.
 */
async function ActionCounts({ orgId, lastSaleDate }: { orgId: string; lastSaleDate: string | null }) {
  const [loop, refundBacklog, incomplete] = await Promise.all([
    getListingLoopStatus(orgId),
    countRefundBacklog(orgId),
    listSaleItemPnl(orgId, { flag: "eksik", limit: 1 }).then((r) => r.count).catch(() => null),
  ]);
  const listed = loop.sent + loop.live;
  const liveRatio = listed > 0 ? loop.live / listed : 0;
  return (
    <section aria-label="Aksiyon sayıları" className="flex flex-col gap-4">
      <div className="sec-h">
        <span className="num">01</span>
        <h2>Bugünün işi</h2>
        <span className="mono-label right">dört sayaç · tıkla, işe git</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1 · LCD ekran */}
        <Link href="/listing-onerileri" className="jg-focus-outline block rounded-[22px]">
          <Bezel>
            <Screen className="min-h-[150px]">
              <div className="flex justify-between">
                <span className="dim">Etsy&apos;ye gidecek</span>
                <span className="dim">● rec</span>
              </div>
              <div className="lcd mt-3 text-[48px] leading-none">{formatNumber(loop.pending)}</div>
              <FmDial pos={listed + loop.pending > 0 ? loop.pending / (listed + loop.pending) : null} labels={["0", `${listed + loop.pending}`]} className="mt-2" />
              <div className="dim mt-1">taslak · panelde hazır →</div>
            </Screen>
          </Bezel>
        </Link>

        {/* 2 · Halka */}
        <Link href="/tasarimlar" className="jg-focus-outline flex items-center gap-5 rounded-[20px] border border-[color:var(--rule)] px-5 py-5">
          <RingGauge value={liveRatio} label={formatNumber(loop.sent)} />
          <div className="min-w-0">
            <p className="mono-label">Etsy&apos;de taslak</p>
            <p className="text-ink-2 mt-1.5 text-xs leading-relaxed">
              {formatNumber(loop.sent)} yayın bekliyor · {formatNumber(loop.live)} canlı
            </p>
            <p className="mono-label mt-3 text-foreground">yayına al →</p>
          </div>
        </Link>

        {/* 3 · Mekanik sayaç */}
        <Link href="/satislar/maliyet?flag=eksik" className="jg-focus-outline flex flex-col justify-between rounded-[20px] border border-[color:var(--rule)] px-5 py-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="mono-label">Maliyeti eksik kalem</span>
            <span className="mono-label">→</span>
          </div>
          <Odometer value={incomplete} />
          <p className="mono-label mt-3">altın ya da işçilik yok · hücreye yaz</p>
        </Link>

        {/* 4 · Dekor kartı */}
        <DecorCard
          label="İade tutarı bekleyen"
          value={formatNumber(refundBacklog)}
          hint="sipariş · Etsy'den okunacak"
          href="/satislar/maliyet"
        />
      </div>
      <p className="mono-label">
        Veri şu ana kadar:{" "}
        {loop.lastSyncAt ? `Etsy senkronu ${formatDateTime(loop.lastSyncAt)}` : "Etsy senkronu yok"}
        {lastSaleDate ? ` · son sipariş ${formatDate(lastSaleDate)}` : ""}
      </p>
    </section>
  );
}

/** Halka göstergesi — çentikli ray üstünde asit yay; ortada Fraunces rakam. */
function RingGauge({ value, label }: { value: number; label: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative size-[104px] shrink-0" role="img" aria-label={`canlı oranı ${formatPercent(v, 0)}`}>
      <svg viewBox="0 0 104 104" className="size-full -rotate-90">
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--rule)" strokeWidth="6" />
        <circle
          cx="52" cy="52" r={r} fill="none"
          stroke="var(--neon)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(c * v).toFixed(1)} ${c.toFixed(1)}`}
          style={{ filter: "drop-shadow(0 0 4px var(--neon-glow))" }}
        />
        <circle cx="52" cy="52" r="30" fill="none" stroke="var(--rule-2)" strokeWidth="1" strokeDasharray="1 4" />
      </svg>
      <span className="ledger-num absolute inset-0 flex items-center justify-center text-[30px]">{label}</span>
    </div>
  );
}

/** Mekanik sayaç — her hane ayrı inset hücrede. */
function Odometer({ value }: { value: number | null }) {
  const digits = value == null ? ["—"] : String(Math.max(0, value)).padStart(3, "0").split("");
  return (
    <div className="mt-4 flex gap-1.5" aria-label={value == null ? "veri yok" : formatNumber(value)}>
      {digits.map((ch, i) => (
        <span
          key={i}
          className="soft-inset inline-flex h-14 w-10 items-center justify-center rounded-[8px] font-mono text-[30px] tabular-nums"
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

/** Dikkat — uyarı merkezinin ilk 5 satırı, defter dilinde (paraya göre sıralı). */
async function AttentionSection({ orgId }: { orgId: string }) {
  const center = await getAlertCenter(orgId);
  const shown = center.alerts.slice(0, ATTENTION_LIMIT);
  return (
    <section aria-label="Dikkat">
      <AlertResolutionTracker alerts={center.alerts} />
      <div className="sec-h">
        <span className="num">†</span>
        <h2>Dikkat</h2>
        <span className="mono-label right">
          {center.total === 0
            ? "aksiyon bekleyen uyarı yok"
            : `${formatNumber(center.total)} uyarı · en pahalı ${Math.min(ATTENTION_LIMIT, center.total)}`}
        </span>
      </div>
      {center.total === 0 ? (
        <p className="note mt-4">
          <span className="mark">✓</span>
          <span>Her şey yolunda; aksiyon bekleyen uyarı çıkınca burada belirir.</span>
        </p>
      ) : (
        <ul className="ledger mt-1">
          {shown.map((a) => (
            <li key={a.key} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 border-b border-[color:var(--rule-2)] py-3.5">
              <span
                className={cn(
                  "mono-label w-16 shrink-0",
                  a.severity === "kritik" && "text-[var(--negative)]",
                  a.severity === "onemli" && "text-neon-ink",
                )}
              >
                {SEVERITY_LABEL[a.severity]}
              </span>
              <span className="min-w-0">
                <span className="text-sm font-medium">{a.title}</span>
                <span className="text-ink-2 mt-0.5 block text-xs">{a.hint}</span>
              </span>
              <Link
                href={a.href}
                className="mono-label text-foreground flex items-center gap-1 whitespace-nowrap hover:text-neon-ink"
              >
                {a.costCents != null && a.costCents > 0 && (
                  <span className="text-ink-2 mr-3 normal-case tracking-normal">{formatMoney(a.costCents, center.currency)}</span>
                )}
                {a.actionLabel}
                <ChevronRight className="size-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {center.alerts.length > ATTENTION_LIMIT && (
        <p className="mono-label mt-3">
          {center.alerts.length - ATTENTION_LIMIT} uyarı daha var; en pahalı {ATTENTION_LIMIT} tanesi burada.
        </p>
      )}
    </section>
  );
}

/** Maliyet kırılımı — hairline ray içinde asit dolgu çubukları (pasta yerine). */
function CostBars({ data, currency }: { data: { name: string; value: number }[]; currency: string }) {
  const total = data.reduce((a, c) => a + (c.value ?? 0), 0);
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 8);
  if (total <= 0)
    return <p className="text-ink-2 text-sm">Bu dönemde maliyet kaydı yok.</p>;
  return (
    <ul className="space-y-4">
      {sorted.map((c) => {
        const pct = c.value / total;
        return (
          <li key={c.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{c.name}</span>
              <span className="mono-label shrink-0 text-foreground">
                {formatMoney(Math.round(c.value * 100), currency)} · {formatPercent(pct)}
              </span>
            </div>
            <div className="soft-inset h-2 overflow-hidden rounded-full">
              <div
                className="bg-neon h-full rounded-full shadow-[0_0_6px_var(--neon-glow)]"
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
    <div className={`relative overflow-hidden rounded-[20px] border border-dashed border-[color:var(--rule)] ${h} motion-safe:animate-pulse`}>
      <span className="mono-label absolute inset-0 flex items-center justify-center">{label}</span>
    </div>
  );
}

function GramReadout({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="dim">{label}</span>
      <span className="lcd text-[15px]">${value.toFixed(2)}</span>
    </div>
  );
}
