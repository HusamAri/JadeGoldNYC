import Link from "next/link";
import { Store } from "lucide-react";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Percent,
  Scale,
  Gem,
  Hammer,
} from "@/components/icons/lux-art";
import { SceneCutouts } from "@/components/scene-cutouts";
// Satır içi (küçük, tek renk) kullanımlar için ince-çizgi SVG sürümleri —
// currentColor'a saygı duyar (cutout PNG'ler yalnız KPI filigranında).
import { Users as UsersLine } from "@/components/icons/lux";

import { resolvePeriod, previousPeriod } from "@/lib/period";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { getAlertCenter } from "@/lib/db/queries/alerts";
import { getTimelineData } from "@/lib/db/queries/timeline";
import { requireMembership } from "@/lib/auth";
import { getGoldPricePerOunce } from "@/lib/gold-price";
import { TROY_OUNCE_GRAMS, KARAT_PURITY } from "@/lib/gold-cost";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { formatMoney, formatPercent } from "@/lib/money";
import { formatNumber, formatDateTime } from "@/lib/format";
import { auditSummary } from "@/lib/audit-format";
import { PageHeader } from "@/components/page-header";
import { PanelTimeline } from "@/components/panel/panel-timeline";
import { GoldStream } from "@/components/brand/gold-stream";
import { CornerMarks } from "@/components/brand/corner-marks";
import { EditorialCard } from "@/components/brand/editorial-card";
import { KpiCard } from "@/components/kpi-card";
import { WhatsNew } from "@/components/whats-new";
import { AlertCenterCard } from "@/components/alert-center";
import { MarketPriceAlertsCard } from "@/components/market-price-alerts-card";
import { getMarketPriceAlerts } from "@/lib/db/queries/market-alerts";
import { PeriodSelector } from "@/components/period-selector";
import {
  TrendChart,
  CategoryPie,
  OrdersBarChart,
} from "@/components/charts/dashboard-charts";
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
  const prev = previousPeriod(period);
  const m = await requireMembership();
  const [d, goldPriceOunce, prevData, alertCenter, timeline, marketAlerts] =
    await Promise.all([
      getDashboard(period),
      getGoldPricePerOunce(),
      prev ? getDashboard(prev) : Promise.resolve(null),
      getAlertCenter(m.org_id),
      getTimelineData(m.org_id),
      getMarketPriceAlerts(m.org_id),
    ]);
  const cur = d.currency;
  const goldPricePerGram = goldPriceOunce / TROY_OUNCE_GRAMS;

  function pctChange(current: number, previous: number | undefined | null): number | null {
    if (previous == null || previous === 0) return null;
    return (current - previous) / Math.abs(previous);
  }

  return (
    <div className="relative z-0 pb-28 space-y-8">
      <SceneCutouts page="panel" />
      <GoldStream motif="necklace" />
      <PageHeader
        title="Panel"
        description={`Genel bakış · ${period.label}`}
        action={<PeriodSelector />}
      />

      <WhatsNew />

      {/* Uyarı Merkezi — sistem genelindeki tüm aksiyon sinyalleri tek yerde,
          3 önem derecesi + bedele göre sıralı. "Neler yolunda gitmiyor?" */}
      <AlertCenterCard data={alertCenter} />

      {/* Pazar uyarıları DETAY/AKSİYON yüzeyi — merkez özet sayar, bu kart
          listing-başına sapma + karar linki verir (merkez satırı buraya işaret eder). */}
      <MarketPriceAlertsCard alerts={marketAlerts} />

      {/* Görev yol haritası + satış bağlamı — geniş; kaydırıcıyla geçmiş↔gelecek */}
      <PanelTimeline data={timeline} />

      {/* ── Güncel Altın Fiyatı — öne çıkan yüzen cam şerit ───────────────
          Buzlu cam board (.glass-board) yüzeyin ÜSTÜNDE süzülür; girişte
          yumuşak "yüksel" (.animate-rise); hero rakam cam üstünde yüzen büyük
          display (.text-glass-display); tek kahraman rozet iridesan holo dolgu
          (.holo-fill); arkada dekoratif marka altın tozu dokusu (.jg-dust). */}
      <div className="glass-board animate-rise relative isolate overflow-hidden rounded-[26px] px-6 py-7">
        {/* Dekoratif marka doku katmanı — yalnız fısıltı; içeriğin altında. */}
        <div
          aria-hidden
          className="jg-dust pointer-events-none absolute inset-0 rounded-[inherit]"
        />
        <div className="relative z-10 flex flex-wrap items-center gap-x-10 gap-y-5">
          {/* Hero — holo rozet + cam üstünde yüzen büyük altın fiyatı */}
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="holo-fill inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white"
            >
              <Gem className="size-6" />
            </span>
            <div className="flex flex-col">
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
                Güncel Altın
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-glass-display font-mono text-4xl font-semibold tabular-nums tracking-tight">
                  ${formatNumber(goldPriceOunce)}
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  /oz
                </span>
              </span>
            </div>
          </div>
          {/* Karat gram okumaları — dengeli, hizalı üçlü grid (simetri) */}
          <div className="grid flex-1 grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <GramReadout label="24K Gram" value={goldPricePerGram} />
            <GramReadout
              label="14K Gram"
              value={goldPricePerGram * KARAT_PURITY["14K"]}
            />
            <GramReadout
              label="10K Gram"
              value={goldPricePerGram * KARAT_PURITY["10K"]}
            />
          </div>
        </div>
      </div>

      {/* ══ GELİR & KÂRLILIK — grafik, sonuçlarında kullanılan metriklerle
          YAN YANA (Panel 2.0 okuma düzeni: sol grafik, sağ metrikler) ══ */}
      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili) — başlık metni değişmez. */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Panel / 01 · Gelir &amp; Kârlılık</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>Jade Gold · NYC</span>
      </div>
      <SectionTitle
        eyebrow="Gelir & Kârlılık"
        title="Trend ve dönem metrikleri"
        hint={`${period.label}${prev ? ` · karşılaştırma: ${prev.label}` : ""}`}
      />
      {/* Ana KPI bölümü — Spatial hero köşe işaretleri (dekoratif sarmalayıcı). */}
      <div className="relative">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir / Maliyet Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={d.trend} />
          </CardContent>
        </Card>
        <div className="stagger grid grid-cols-2 content-start gap-4 sm:gap-5">
          <KpiCard
            label="Toplam Gelir"
            cents={d.revenueCents}
            currency={cur}
            icon={DollarSign}
            change={pctChange(d.revenueCents, prevData?.revenueCents)}
            changeLabel={prev?.label}
          />
          <KpiCard
            label="Toplam Maliyet"
            cents={d.costCents}
            currency={cur}
            icon={Wallet}
            change={pctChange(d.costCents, prevData?.costCents)}
            changeLabel={prev?.label}
          />
          <KpiCard
            label="Net Kâr"
            cents={d.profitCents}
            currency={cur}
            icon={TrendingUp}
            holo
            change={pctChange(d.profitCents, prevData?.profitCents)}
            changeLabel={prev?.label}
          />
          <KpiCard
            label="Kâr Marjı"
            value={formatPercent(d.margin)}
            icon={Percent}
            accent={d.margin >= 0 ? "positive" : "negative"}
            change={prevData ? d.margin - prevData.margin : null}
            changeLabel={prev?.label}
          />
        </div>
      </div>
      <CornerMarks />
      </div>

      {/* ══ SİPARİŞLER ══ */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Panel / 02 · Siparişler</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>Jade Gold · NYC</span>
      </div>
      <SectionTitle
        eyebrow="Siparişler"
        title="Günlük hacim ve sepet metrikleri"
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Günlük Sipariş Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersBarChart data={d.trend} />
          </CardContent>
        </Card>
        <div className="grid content-start gap-4">
          <KpiCard
            label="Sipariş Sayısı"
            value={formatNumber(d.orderCount)}
            icon={ShoppingBag}
            change={pctChange(d.orderCount, prevData?.orderCount)}
            changeLabel={prev?.label}
          />
          <KpiCard
            label="Ort. Sipariş (AOV)"
            cents={d.aovCents}
            currency={cur}
            icon={Receipt}
            change={pctChange(d.aovCents, prevData?.aovCents)}
            changeLabel={prev?.label}
          />
        </div>
      </div>

      {/* ══ MALİYET YAPISI — kırılım grafiği + altın maliyet metrikleri ══ */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Panel / 03 · Maliyet Yapısı</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>Jade Gold · NYC</span>
      </div>
      <SectionTitle
        eyebrow="Maliyet Yapısı"
        title="Kırılım ve altın maliyeti"
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Maliyet Kırılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie data={d.costByCategory} />
          </CardContent>
        </Card>
        {d.goldCosts.totalGoldCents > 0 ? (
          <div className="grid grid-cols-2 content-start gap-4 lg:col-span-2">
            <KpiCard
              label="Altın Malzeme"
              cents={d.goldCosts.materialCents}
            currency={cur}
              icon={Gem}
            />
            <KpiCard
              label="İşçilik"
              cents={d.goldCosts.laborCents}
            currency={cur}
              icon={Hammer}
            />
            <KpiCard
              label="Toplam Altın Maliyet"
              cents={d.goldCosts.totalGoldCents}
            currency={cur}
              icon={Scale}
            />
            <KpiCard
              label="Altın Kâr Marjı"
              value={formatPercent(
                d.revenueCents > 0
                  ? (d.revenueCents - d.goldCosts.totalGoldCents) /
                      d.revenueCents
                  : 0,
              )}
              icon={Percent}
              accent={
                d.revenueCents > d.goldCosts.totalGoldCents
                  ? "positive"
                  : "negative"
              }
            />
          </div>
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Bu dönemde altın maliyeti kaydı yok.
            </CardContent>
          </Card>
        )}
      </div>

      {/* ══ ÜRÜNLER & ETKİNLİK ══ */}
      <div aria-hidden className="idx sm:-mb-4">
        <span>Panel / 04 · Ürünler &amp; Etkinlik</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>Jade Gold · NYC</span>
      </div>
      <SectionTitle
        eyebrow="Ürünler & Etkinlik"
        title="En çok satanlar ve son kayıtlar"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            <div className="mt-4">
              <Link
                href="/maliyetler/altin-maliyet"
                className="text-primary text-sm font-medium hover:underline"
              >
                Altın maliyet analizi →
              </Link>
            </div>
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

      {/* ── En İyi Müşteriler + Kanal Kirilimi ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersLine aria-hidden className="size-4" />
              En İyi Müşteriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu donemde musteri verisi yok.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="text-right">Siparis</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.topCustomers.map((c) => (
                    <TableRow key={c.buyerName}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {c.buyerName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(c.orderCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(c.revenueCents, cur)}
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
            <CardTitle className="flex items-center gap-2">
              <Store aria-hidden className="size-4" />
              Satış Kanalları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.channelBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu dönemde satış yok.
              </p>
            ) : (
              <div className="space-y-4">
                {d.channelBreakdown.map((ch) => {
                  const pct =
                    d.revenueCents > 0
                      ? ch.revenueCents / d.revenueCents
                      : 0;
                  return (
                    <div key={ch.channel} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{ch.channel}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatMoney(ch.revenueCents, cur)} · {formatNumber(ch.orderCount)} sipariş
                        </span>
                      </div>
                      {/* Sıvı dolgu: içe gölgeli pill ray (açık) / lume-pit
                          çukur (koyu); dolgu grad-holo + mor ışıma (açık),
                          lume-fill + lume-glow (koyu); üstünde kayan sheen. */}
                      <div className="h-2.5 overflow-hidden rounded-full [background-color:rgb(122_122_155/0.16)] [box-shadow:inset_0_2px_4px_rgba(84,80,120,.28),inset_0_-1px_0_rgba(255,255,255,.7)] dark:[background-color:oklch(0_0_0/0.35)] dark:[box-shadow:var(--lume-pit)]">
                        <div
                          className="sheen-sweep h-full rounded-full transition-all [background-image:var(--grad-holo)] [box-shadow:0_0_12px_oklch(0.62_0.20_278/0.5)] dark:[background-image:var(--lume-fill)] dark:[box-shadow:var(--lume-glow)]"
                          style={{ width: `${Math.round(pct * 100)}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {formatPercent(pct)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editorial marka şeridi — veri önce gelsin diye Panel 2.0'da en altta */}
      <EditorialCard
        compact
        heightClassName="h-[240px]"
        image="/brand/gallery/koyu-franco.webp"
        video="/brand/video/altin-zincir-orbit.mp4"
        eyebrow="Jade Gold · New York"
        title="Sessiz lüks, kalıcı değer"
        subtitle="Som altın, el işçiliği — her parça bir miras."
      />
    </div>
  );
}

/** Altın fiyat şeridinde karat gram okuması — hizalı etiket + tabular değer. */
function GramReadout({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
        {label}
      </span>
      <span className="font-semibold tabular-nums">${value.toFixed(2)}</span>
    </div>
  );
}

/** Panel 2.0 bölüm başlığı — altın eyebrow + başlık + opsiyonel ipucu. */
function SectionTitle({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2">
      {/* Eyebrow: zemine KAZINMIŞ (carved) etiket — nöromorfik yüzey dili */}
      <span className="text-carved text-[11px] font-bold tracking-[0.2em] text-[color:var(--brand-mark)] uppercase">
        {eyebrow}
      </span>
      <h2 className="display-emboss text-lg font-semibold tracking-tight">{title}</h2>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
