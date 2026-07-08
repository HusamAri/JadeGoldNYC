import Link from "next/link";
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
  Users,
  Store,
} from "lucide-react";

import { resolvePeriod, previousPeriod } from "@/lib/period";
import { getDashboard } from "@/lib/db/queries/dashboard";
import { getDataGaps } from "@/lib/db/queries/data-gaps";
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
import { EditorialCard } from "@/components/brand/editorial-card";
import { KpiCard } from "@/components/kpi-card";
import { WhatsNew } from "@/components/whats-new";
import { DataGapsCard } from "@/components/data-gaps-card";
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
  const [d, goldPriceOunce, prevData, gaps, timeline] = await Promise.all([
    getDashboard(period),
    getGoldPricePerOunce(),
    prev ? getDashboard(prev) : Promise.resolve(null),
    getDataGaps(m.org_id),
    getTimelineData(m.org_id),
  ]);
  const cur = d.currency;
  const goldPricePerGram = goldPriceOunce / TROY_OUNCE_GRAMS;

  function pctChange(current: number, previous: number | undefined | null): number | null {
    if (previous == null || previous === 0) return null;
    return (current - previous) / Math.abs(previous);
  }

  return (
    <div className="relative z-0 pb-28 space-y-6">
      <GoldStream motif="necklace" />
      <PageHeader
        title="Panel"
        description={`Genel bakış · ${period.label}`}
        action={<PeriodSelector />}
      />

      <WhatsNew />

      {/* Görev yol haritası + satış bağlamı — geniş; kaydırıcıyla geçmiş↔gelecek */}
      <PanelTimeline data={timeline} />

      <DataGapsCard gaps={gaps} />

      {/* ── Güncel Altın Fiyatı (bağlam şeridi) ─────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Scale className="text-muted-foreground size-4" />
            <span className="text-muted-foreground">Güncel Altın:</span>
            <span className="font-semibold tabular-nums">
              ${formatNumber(goldPriceOunce)}/oz
            </span>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <span className="text-muted-foreground">24K Gram: </span>
            <span className="font-semibold tabular-nums">
              ${goldPricePerGram.toFixed(2)}
            </span>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <span className="text-muted-foreground">14K Gram: </span>
            <span className="font-semibold tabular-nums">
              ${(goldPricePerGram * KARAT_PURITY["14K"]).toFixed(2)}
            </span>
          </div>
          <div className="text-muted-foreground">|</div>
          <div>
            <span className="text-muted-foreground">10K Gram: </span>
            <span className="font-semibold tabular-nums">
              ${(goldPricePerGram * KARAT_PURITY["10K"]).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ══ GELİR & KÂRLILIK — grafik, sonuçlarında kullanılan metriklerle
          YAN YANA (Panel 2.0 okuma düzeni: sol grafik, sağ metrikler) ══ */}
      <SectionTitle
        eyebrow="Gelir & Kârlılık"
        title="Trend ve dönem metrikleri"
        hint={`${period.label}${prev ? ` · karşılaştırma: ${prev.label}` : ""}`}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir / Maliyet Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={d.trend} />
          </CardContent>
        </Card>
        <div className="stagger grid grid-cols-2 content-start gap-4">
          <KpiCard
            label="Toplam Gelir"
            value={formatMoney(d.revenueCents, cur)}
            icon={DollarSign}
            change={pctChange(d.revenueCents, prevData?.revenueCents)}
            changeLabel={prev?.label}
          />
          <KpiCard
            label="Toplam Maliyet"
            value={formatMoney(d.costCents, cur)}
            icon={Wallet}
            change={pctChange(d.costCents, prevData?.costCents)}
            changeLabel={prev?.label}
          />
          <KpiCard
            label="Net Kâr"
            value={formatMoney(d.profitCents, cur)}
            icon={TrendingUp}
            accent={d.profitCents >= 0 ? "positive" : "negative"}
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

      {/* ══ SİPARİŞLER ══ */}
      <SectionTitle
        eyebrow="Siparişler"
        title="Günlük hacim ve sepet metrikleri"
      />
      <div className="grid gap-4 lg:grid-cols-3">
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
            value={formatMoney(d.aovCents, cur)}
            icon={Receipt}
            change={pctChange(d.aovCents, prevData?.aovCents)}
            changeLabel={prev?.label}
          />
        </div>
      </div>

      {/* ══ MALİYET YAPISI — kırılım grafiği + altın maliyet metrikleri ══ */}
      <SectionTitle
        eyebrow="Maliyet Yapısı"
        title="Kırılım ve altın maliyeti"
      />
      <div className="grid gap-4 lg:grid-cols-3">
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
              value={formatMoney(d.goldCosts.materialCents, cur)}
              icon={Gem}
            />
            <KpiCard
              label="İşçilik"
              value={formatMoney(d.goldCosts.laborCents, cur)}
              icon={Hammer}
            />
            <KpiCard
              label="Toplam Altın Maliyet"
              value={formatMoney(d.goldCosts.totalGoldCents, cur)}
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
      <SectionTitle
        eyebrow="Ürünler & Etkinlik"
        title="En çok satanlar ve son kayıtlar"
      />

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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
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
              <Store className="size-4" />
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
                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
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
      <span className="text-[11px] font-bold tracking-[0.2em] text-[color:var(--brand-mark)] uppercase">
        {eyebrow}
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}
