import Link from "next/link";
import {
  Plus,
  Pencil,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
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
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeltaBadge } from "@/components/delta-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteButton } from "@/components/data-table/delete-button";
import { deleteMetric } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const metrics = await listMetrics();

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
    value: string;
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
        current.revenue_cents != null
          ? formatMoney(current.revenue_cents, currency)
          : "—",
      delta: pctDelta(current.revenue_cents, previous?.revenue_cents),
      goodWhenUp: true,
    },
    {
      label: "Ort. Sepet (AOV)",
      value: dCur.aovCents != null ? formatMoney(dCur.aovCents, currency) : "—",
      delta: pctDelta(dCur.aovCents, dPrev.aovCents),
      goodWhenUp: true,
    },
    {
      label: "Sepette Terk",
      value:
        current.cart_abandon_amount_cents != null
          ? formatMoney(current.cart_abandon_amount_cents, currency)
          : "—",
      delta: pctDelta(
        current.cart_abandon_amount_cents,
        previous?.cart_abandon_amount_cents,
      ),
      goodWhenUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={60000} />
      <PageHeader
        title="Etsy Performansı"
        description={`Güncel dönem · ${current.period_label}${previous ? ` (önceki: ${previous.period_label})` : ""}`}
        action={
          <Button asChild>
            <Link href="/analizler/yeni">
              <Plus />
              Yeni Snapshot
            </Link>
          </Button>
        }
      />

      {/* Uyarılar */}
      <Card>
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
                      "flex items-start gap-3 rounded-md border p-3",
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
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
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
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

      {/* Snapshot Geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle>Dönem Geçmişi</CardTitle>
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
    </div>
  );
}
