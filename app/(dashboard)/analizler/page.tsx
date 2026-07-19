import Link from "next/link";
import type { ReactNode } from "react";
import {
  Plus,
  Pencil,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  PackageSearch,
  ListChecks,
} from "lucide-react";

import { listMetrics } from "@/lib/db/queries/metrics";
import {
  derive,
  evaluateFramework,
  evaluatePerformanceAlerts,
  verdictLabel,
  THRESHOLDS,
  type Verdict,
  type AlertLevel,
} from "@/lib/performance";
import { formatMoney, formatPercent } from "@/lib/money";
import { Money } from "@/components/money";
import { formatNumber, formatDate } from "@/lib/format";
import { requireMembership } from "@/lib/auth";
import {
  getEtsyInsights,
  ETSY_INSIGHTS_WINDOW_DAYS,
  type EtsyInsights,
} from "@/lib/db/queries/etsy-insights";
import { EtsyViewsChart } from "@/components/charts/etsy-views-chart";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { DeltaBadge } from "@/components/delta-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteButton } from "@/components/data-table/delete-button";
import { deleteMetric } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn } from "@/lib/utils";

export const metadata = { title: "Etsy Performansı" };

const TRAFFIC_LABELS: Record<string, string> = {
  etsy_app: "Etsy App / Sayfa",
  etsy_marketing: "Etsy Marketing / SEO",
  etsy_ads: "Etsy Ads",
  etsy_search: "Etsy Arama",
  direct: "Direkt ve Diğer",
  social: "Sosyal Medya",
};

const ALERT_ICON: Record<AlertLevel, typeof ShieldAlert> = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const VERDICT_VARIANT: Record<Verdict, "success" | "warning" | "destructive"> = {
  pass: "success",
  risk: "warning",
  fail: "destructive",
};

function pctDelta(
  cur: number | null | undefined,
  prev: number | null | undefined,
): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return (cur - prev) / prev;
}

export default async function PerformansPage() {
  const m = await requireMembership();
  const [metrics, insights] = await Promise.all([
    listMetrics(),
    getEtsyInsights(m.org_id),
  ]);

  if (metrics.length === 0) {
    return (
      <div>
        <PageHeader
          title="Etsy Performansı"
          description="Dönüşüm hunisi, yatırım karar çerçevesi ve otomatik uyarılar"
          action={
            <Button asChild>
              <Link href="/analizler/yeni">
                <Plus />
                Yeni Snapshot
              </Link>
            </Button>
          }
        />
        <EmptyState
          icon={BarChart3}
          title="Henüz performans verisi yok"
          description="Etsy Stats dönemlerinizi (ziyaret, sipariş, ciro, sepette terk, puan) girince dönüşüm oranı, karar çerçevesi ve düşüş uyarıları burada canlanır."
          action={
            <Button asChild>
              <Link href="/analizler/yeni">
                <Plus />
                İlk Snapshot&apos;ı Ekle
              </Link>
            </Button>
          }
        />
        <div className="mt-6">
          <EtsyApiSection insights={insights} />
        </div>
      </div>
    );
  }

  const currency = "USD";
  const current = metrics[0];
  const previous = metrics[1] ?? null;
  const dCur = derive(current);
  const dPrev = derive(previous);
  const alerts = evaluatePerformanceAlerts(current, previous, currency);
  const framework = evaluateFramework(current, previous, currency);

  const traffic = current.traffic_sources ?? null;
  const trafficTotal = traffic
    ? Object.values(traffic).reduce((a, b) => a + b, 0)
    : 0;

  const convAccent =
    dCur.conversion == null
      ? ""
      : dCur.conversion >= THRESHOLDS.conversionTarget
        ? "text-primary"
        : "text-destructive";

  const kpis: {
    label: string;
    value: ReactNode;
    delta: number | null;
    goodWhenUp: boolean;
    accent?: string;
    hint?: string;
  }[] = [
    {
      label: "Dönüşüm Oranı",
      value: dCur.conversion != null ? formatPercent(dCur.conversion, 2) : "—",
      delta: pctDelta(dCur.conversion, dPrev.conversion),
      goodWhenUp: true,
      accent: convAccent,
      hint: `Eşik ${formatPercent(THRESHOLDS.conversionTarget)}`,
    },
    {
      label: "Ziyaret",
      value: current.visits != null ? formatNumber(current.visits) : "—",
      delta: pctDelta(current.visits, previous?.visits),
      goodWhenUp: true,
    },
    {
      label: "Sipariş",
      value: current.orders != null ? formatNumber(current.orders) : "—",
      delta: pctDelta(current.orders, previous?.orders),
      goodWhenUp: true,
    },
    {
      label: "Ciro",
      value:
        current.revenue_cents != null ? (
          <Money cents={current.revenue_cents} currency={currency} />
        ) : (
          "—"
        ),
      delta: pctDelta(current.revenue_cents, previous?.revenue_cents),
      goodWhenUp: true,
    },
    {
      label: "Ort. Sepet (AOV)",
      value:
        dCur.aovCents != null ? (
          <Money cents={dCur.aovCents} currency={currency} />
        ) : (
          "—"
        ),
      delta: pctDelta(dCur.aovCents, dPrev.aovCents),
      goodWhenUp: true,
    },
    {
      label: "Sepette Terk",
      value:
        current.cart_abandon_amount_cents != null ? (
          <Money
            cents={current.cart_abandon_amount_cents}
            currency={currency}
          />
        ) : (
          "—"
        ),
      delta: pctDelta(
        current.cart_abandon_amount_cents,
        previous?.cart_abandon_amount_cents,
      ),
      goodWhenUp: false,
    },
  ];

  return (
    <div className="page-stack relative z-0 pb-32">
      <GoldStream motif="spark" />
      <AutoRefresh intervalMs={60000} />
      <PageHeader
        title="Etsy Performansı"
        description={`Güncel dönem · ${current.period_label}${previous ? ` (önceki: ${previous.period_label})` : ""}`}
        action={
          <>
            <Button asChild variant="outline">
              <Link href="/analizler/aksiyon-plani">
                <ListChecks />
                Aksiyon Planı
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/analizler/urunler">
                <PackageSearch />
                Ürün Performansı
              </Link>
            </Button>
            <Button asChild>
              <Link href="/analizler/yeni">
                <Plus />
                Yeni Snapshot
              </Link>
            </Button>
          </>
        }
      />

      {/* Uyarılar — sayfanın hero/özet şeridi: berrak cam board (.glass-board) */}
      <Card className="glass-board">
        <CardHeader>
          <CardTitle>Uyarılar</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-primary flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4" />
              Aktif uyarı yok — eşiklerin üstündesiniz.
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => {
                const Icon = ALERT_ICON[a.level];
                return (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3.5 shadow-[var(--lift-sm)]",
                      a.level === "danger" &&
                        "border-destructive/30 bg-destructive/5",
                      a.level === "warning" && "border-accent bg-accent/30",
                      a.level === "info" && "bg-muted/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        a.level === "danger" && "text-destructive",
                        a.level === "warning" && "text-accent-foreground",
                        a.level === "info" && "text-muted-foreground",
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-muted-foreground text-sm">{a.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* KPI'lar (önceki döneme göre) */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="space-y-1">
              <p className="text-muted-foreground text-sm">{k.label}</p>
              <p
                className={cn(
                  "text-2xl font-semibold tracking-tight",
                  k.accent,
                )}
              >
                {k.value}
              </p>
              <div className="flex items-center gap-2">
                <DeltaBadge deltaPct={k.delta} goodWhenUp={k.goodWhenUp} />
                {k.hint && (
                  <span className="text-muted-foreground text-xs">{k.hint}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Yatırım Karar Çerçevesi */}
        <Card>
          <CardHeader>
            <CardTitle>Yatırım Karar Çerçevesi</CardTitle>
          </CardHeader>
          <CardContent>
            {framework.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Karşılaştırma için daha fazla veri gerekli.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kriter</TableHead>
                    <TableHead>Değer</TableHead>
                    <TableHead>Eşik</TableHead>
                    <TableHead className="text-right">Sonuç</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {framework.map((r) => (
                    <TableRow key={r.criter}>
                      <TableCell className="font-medium">{r.criter}</TableCell>
                      <TableCell className="tabular-nums">{r.value}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.threshold}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={VERDICT_VARIANT[r.verdict]}>
                          {verdictLabel(r.verdict)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Trafik Kaynakları */}
        <Card>
          <CardHeader>
            <CardTitle>Trafik Kaynakları</CardTitle>
          </CardHeader>
          <CardContent>
            {!traffic || trafficTotal === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu dönem için trafik kaynağı girilmemiş.
              </p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(traffic)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, value]) => {
                    const pct = trafficTotal ? value / trafficTotal : 0;
                    return (
                      <li key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{TRAFFIC_LABELS[key] ?? key}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {formatNumber(value)} · {formatPercent(pct)}
                          </span>
                        </div>
                        <div className="nm-pressed h-2 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.round(pct * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snapshot Geçmişi — uzun tablo kabı: dikey oluklu cam (.glass-fluted) */}
      <Card className="glass-fluted">
        <CardHeader>
          <CardTitle>Dönem Geçmişi</CardTitle>
          {/* Kapsam: listMetrics limitsizdir — tüm kayıtlar burada. Dönemler
              kullanıcı girişli etiketlerdir (takvimsel pencere değil). */}
          <CardDescription className="text-xs">
            tüm dönem kayıtları · {metrics.length} kayıt · kullanıcı girişli
            dönem etiketleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dönem</TableHead>
                <TableHead className="text-right">Dönüşüm</TableHead>
                <TableHead className="text-right">Ziyaret</TableHead>
                <TableHead className="text-right">Sipariş</TableHead>
                <TableHead className="text-right">Ciro</TableHead>
                <TableHead className="text-right">Sepette Terk</TableHead>
                <TableHead className="text-right">Puan</TableHead>
                <TableHead className="w-1 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => {
                const d = derive(m);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.period_label}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.conversion != null
                        ? formatPercent(d.conversion, 2)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.visits != null ? formatNumber(m.visits) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.orders != null ? formatNumber(m.orders) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.revenue_cents != null
                        ? formatMoney(m.revenue_cents, currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.cart_abandon_amount_cents != null
                        ? formatMoney(m.cart_abandon_amount_cents, currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.rating != null ? m.rating.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/analizler/${m.id}/duzenle`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Düzenle</span>
                          </Link>
                        </Button>
                        <DeleteButton action={deleteMetric} id={m.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EtsyApiSection insights={insights} />
    </div>
  );
}

/**
 * Etsy API veri setleri (tam senkron): mağaza sağlık fotoğrafı + günlük
 * görüntülenme serisi + en çok hareket eden listingler. Seri, günlük senkron
 * fotoğraflarından türetilir — biriktikçe zenginleşir.
 */
function EtsyApiSection({ insights }: { insights: EtsyInsights }) {
  const latest = insights.snapshots[0] ?? null;
  const prev = insights.snapshots[1] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[color:var(--brand-mark)] uppercase">
          Etsy Verileri (API)
        </span>
        <h2 className="text-lg font-semibold tracking-tight">
          Mağaza sağlığı ve görüntülenme trendi
        </h2>
        <span className="text-muted-foreground text-xs">
          günlük senkron fotoğrafları
          {latest && ` · son fotoğraf: ${formatDate(latest.snapshotDate)}`}
        </span>
      </div>

      {latest ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <ShopStat
            label="Mağaza Takipçisi"
            value={latest.numFavorers}
            prevValue={prev?.numFavorers ?? null}
            prevDate={prev?.snapshotDate ?? null}
          />
          <ShopStat
            label="Puan Ortalaması"
            value={latest.reviewAverage}
            prevValue={prev?.reviewAverage ?? null}
            prevDate={prev?.snapshotDate ?? null}
            decimals={2}
          />
          <ShopStat
            label="Toplam Yorum"
            value={latest.reviewCount}
            prevValue={prev?.reviewCount ?? null}
            prevDate={prev?.snapshotDate ?? null}
          />
          <ShopStat
            label="Toplam Satış (ömür boyu)"
            value={latest.transactionSoldCount}
            prevValue={prev?.transactionSoldCount ?? null}
            prevDate={prev?.snapshotDate ?? null}
          />
        </div>
      ) : (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-5 text-sm">
          Mağaza sağlık fotoğrafı henüz yok — ilk Etsy senkronundan sonra
          burada belirir (Ayarlar → Etsy → Şimdi Senkronize Et).
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Günlük Görüntülenme (tüm listingler)</CardTitle>
            {/* Veri penceresi — sorguyla aynı sabitten (ETSY_INSIGHTS_WINDOW_DAYS). */}
            <CardDescription className="text-xs">
              son {ETSY_INSIGHTS_WINDOW_DAYS} gün penceresi ·{" "}
              {insights.statDays} günlük fotoğraf
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.viewsSeries.length >= 2 ? (
              <EtsyViewsChart data={insights.viewsSeries} />
            ) : (
              <p className="text-muted-foreground py-10 text-center text-sm">
                Seri birikiyor — son {ETSY_INSIGHTS_WINDOW_DAYS} gün
                penceresinde {insights.statDays} günlük fotoğraf var; trend
                için en az 3 gün gerekir. Günlük senkron otomatik biriktirir.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dün En Çok Hareket Edenler</CardTitle>
            <CardDescription className="text-xs">
              son iki fotoğraf günü arasındaki fark · ilk 8 listing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.topMovers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                İki günlük fotoğraf birikince listing bazlı hareketler burada
                sıralanır.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {insights.topMovers.map((t) => (
                  <li
                    key={t.etsyListingId}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="scroll-x min-w-0 font-medium">
                      {t.title}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      +{formatNumber(t.deltaViews)} görüntülenme
                      {t.deltaFavorers !== 0 &&
                        ` · ${t.deltaFavorers > 0 ? "+" : ""}${t.deltaFavorers} fav`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShopStat({
  label,
  value,
  prevValue,
  prevDate,
  decimals = 0,
}: {
  label: string;
  value: number | null;
  prevValue: number | null;
  /** Delta'nın referansı: önceki günlük fotoğrafın tarihi (kullanıcı görsün). */
  prevDate?: string | null;
  decimals?: number;
}) {
  const delta =
    value != null && prevValue != null ? value - prevValue : null;
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-[11px] font-bold tracking-[0.12em] uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums">
          {value != null
            ? decimals > 0
              ? value.toFixed(decimals)
              : formatNumber(value)
            : "—"}
        </p>
        {delta != null && delta !== 0 && (
          <p
            className={cn(
              "text-xs font-semibold tabular-nums",
              delta > 0 ? "text-primary" : "text-destructive",
            )}
          >
            {delta > 0 ? "+" : ""}
            {decimals > 0 ? delta.toFixed(decimals) : formatNumber(delta)}{" "}
            <span className="text-muted-foreground font-normal">
              önceki fotoğrafa göre
              {prevDate ? ` (${formatDate(prevDate)})` : ""}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
