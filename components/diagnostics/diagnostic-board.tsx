import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Megaphone,
  Sparkles,
  CheckCircle2,
  Info,
  ArrowRight,
  CalendarRange,
} from "lucide-react";

import type {
  SalesDiagnostics,
  DiagnosticSignal,
  MonthEvaluation,
  MonthStatus,
  Severity,
} from "@/lib/db/queries/diagnostics";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY: Record<
  Severity,
  {
    label: string;
    badge: "destructive" | "warning" | "secondary" | "success";
    ring: string;
  }
> = {
  critical: {
    label: "Kritik",
    badge: "destructive",
    ring: "border-l-destructive",
  },
  warning: {
    label: "Uyarı",
    badge: "warning",
    ring: "border-l-amber-500",
  },
  info: { label: "Bilgi", badge: "secondary", ring: "border-l-sky-500" },
  good: { label: "İyi", badge: "success", ring: "border-l-emerald-500" },
};

const STATUS_META: Record<
  MonthStatus,
  {
    label: string;
    badge: "destructive" | "warning" | "secondary" | "success";
    Icon: typeof TrendingUp;
  }
> = {
  up: { label: "Yükseliş", badge: "success", Icon: TrendingUp },
  down: { label: "Düşüş", badge: "destructive", Icon: TrendingDown },
  flat: { label: "Durgun", badge: "secondary", Icon: Minus },
  zero: { label: "Sıfır satış", badge: "destructive", Icon: AlertTriangle },
  partial: { label: "Ay devam ediyor", badge: "warning", Icon: CalendarRange },
};

function pct(n: number | null): string {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n * 100)}%`;
}

export function DiagnosticBoard({ data }: { data: SalesDiagnostics }) {
  const cur = data.currency;
  const downCount = data.months.filter(
    (m) => !m.isPartial && (m.status === "down" || m.status === "zero"),
  ).length;

  return (
    <div className="space-y-6">
      {/* Dönem çerçevesi — neyin neyle karşılaştırıldığı net */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarRange className="size-4 shrink-0" />
                <p className="text-lg font-semibold">
                  {data.fromLabel} → {data.toLabel}
                </p>
                <Badge
                  variant={
                    data.lifecycle === "healthy" ? "success" : "secondary"
                  }
                >
                  {data.year} aylık seri
                </Badge>
              </div>
              <p className="text-sm font-medium">{data.headline}</p>
              <p className="text-muted-foreground text-sm">
                {data.comparisonNote}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Değerlendirilen ay"
              value={String(data.months.length)}
              sub={`${data.fromLabel} – ${data.toLabel}`}
            />
            <Metric
              label="Gerileyen / sıfır ay"
              value={String(downCount)}
              sub="tamamlanmış aylar"
              down={downCount > 0}
            />
            <Metric
              label={
                data.latestComplete
                  ? `Son tam ay (${data.latestComplete.label})`
                  : "Son tam ay"
              }
              value={
                data.latestComplete
                  ? String(data.latestComplete.orders)
                  : "—"
              }
              sub={
                data.latestComplete?.prevLabel
                  ? `vs ${data.latestComplete.prevLabel}: ${pct(data.latestComplete.ordersChangePct)}`
                  : "karşılaştırma yok"
              }
              down={(data.latestComplete?.ordersChangePct ?? 0) < 0}
            />
            <Metric
              label="Aktif listing"
              value={String(data.freshness.activeListings)}
              sub={`${data.freshness.newListings30d} yeni (30g)`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ay ay ne oldu */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Ay ay ne oldu?</h2>
          <p className="text-muted-foreground text-sm">
            Her kart bir takvim ayı. Değişim her zaman bir önceki aya göre
            (MoM).
          </p>
        </div>
        <div className="space-y-3">
          {data.months.map((m) => (
            <MonthCard key={m.ym} month={m} currency={cur} />
          ))}
        </div>
      </section>

      {/* Düzeltilmesi gerekenler */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">
            Düzeltilmesi gerekenler
          </h2>
          <p className="text-muted-foreground text-sm">
            Aylık seriden ve güncel listing/reklam durumundan çıkan açık
            aksiyonlar.
          </p>
        </div>
        <div className="space-y-3">
          {data.openFixes.map((s, i) => (
            <SignalCard key={i} signal={s} />
          ))}
        </div>
      </section>

      {data.ads.leaks.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4" />
              <h3 className="font-semibold">Reklam bütçe kaçakları</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-1.5 pr-3 font-medium">Listing</th>
                    <th className="px-3 py-1.5 text-right font-medium">
                      Harcama
                    </th>
                    <th className="px-3 py-1.5 text-right font-medium">
                      Gelir
                    </th>
                    <th className="px-3 py-1.5 text-right font-medium">ROAS</th>
                    <th className="py-1.5 pl-3 text-right font-medium">
                      Sipariş
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.ads.leaks.map((l) => (
                    <tr key={l.productId ?? l.title} className="border-t">
                      <td className="max-w-[280px] py-2 pr-3">
                        <span className="block truncate font-medium">
                          {l.title}
                        </span>
                        {l.sku && (
                          <span className="text-muted-foreground block font-mono text-[10px] uppercase">
                            {l.sku}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(l.spendCents, cur)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(l.revenueCents, cur)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right tabular-nums",
                          l.roas != null &&
                            l.roas < 1 &&
                            "text-destructive font-semibold",
                        )}
                      >
                        {l.roas == null ? "—" : l.roas.toFixed(2)}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums">
                        {l.orders}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <h3 className="font-semibold">Tazelik ve kapsam (bugün)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Aktif listing" value={data.freshness.activeListings} />
            <Stat label="Yeni (30g)" value={data.freshness.newListings30d} />
            <Stat
              label="Pasif/stoksuz"
              value={data.freshness.inactiveOrOOS}
              warn={data.freshness.inactiveOrOOS > 0}
            />
            <Stat
              label="Az görselli"
              value={data.freshness.lowImageListings}
              warn={data.freshness.lowImageListings > 0}
            />
            <Stat label="0 görüntüleme" value={data.freshness.zeroViewListings} />
            <Stat label="Bekleyen SEO" value={data.freshness.pendingSeoTags} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthCard({
  month,
  currency,
}: {
  month: MonthEvaluation;
  currency: string;
}) {
  const meta = STATUS_META[month.status];
  const Icon = meta.Icon;
  return (
    <Card
      className={cn(
        "border-l-4",
        month.status === "down" || month.status === "zero"
          ? "border-l-destructive"
          : month.status === "up"
            ? "border-l-emerald-500"
            : month.status === "partial"
              ? "border-l-amber-500"
              : "border-l-border",
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="size-4 shrink-0" />
            <span className="font-semibold">{month.label}</span>
            <Badge variant={meta.badge}>{meta.label}</Badge>
            {month.prevLabel && (
              <span className="text-muted-foreground text-xs">
                karşılaştırma: {month.prevLabel} → {month.label}
              </span>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {month.rangeLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="Sipariş"
            value={String(month.orders)}
            sub={
              month.prevLabel
                ? `vs ${month.prevLabel}: ${pct(month.ordersChangePct)}`
                : undefined
            }
            down={(month.ordersChangePct ?? 0) < 0}
          />
          <Metric
            label="Ciro"
            value={formatMoney(month.revenueCents, currency)}
            sub={
              month.prevLabel
                ? `vs ${month.prevLabel}: ${pct(month.revenueChangePct)}`
                : undefined
            }
            down={(month.revenueChangePct ?? 0) < 0}
          />
          <Metric
            label="İndirim oranı"
            value={
              month.discountRatePct == null
                ? "—"
                : `${Math.round(month.discountRatePct * 100)}%`
            }
          />
          <Metric label="Yeni listing" value={String(month.newListings)} />
        </div>

        <p className="text-sm">{month.whatHappened}</p>

        {month.issues.length > 0 && (
          <ul className="space-y-1">
            {month.issues.map((issue, i) => (
              <li
                key={i}
                className="text-muted-foreground flex items-start gap-2 text-sm"
              >
                <AlertTriangle className="text-amber-600 mt-0.5 size-3.5 shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SignalCard({ signal }: { signal: DiagnosticSignal }) {
  const s = SEVERITY[signal.severity];
  const Icon =
    signal.severity === "critical"
      ? AlertTriangle
      : signal.severity === "warning"
        ? TrendingDown
        : signal.severity === "good"
          ? CheckCircle2
          : Info;
  return (
    <Card className={cn("border-l-4", s.ring)}>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="size-4 shrink-0" />
          <span className="font-semibold">{signal.title}</span>
          <Badge variant={s.badge}>{s.label}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{signal.detail}</p>
        {signal.action && (
          <p className="text-sm">
            <span className="font-medium">Aksiyon: </span>
            {signal.action}
          </p>
        )}
        {signal.href && (
          <Link
            href={signal.href}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            İlgili ekrana git <ArrowRight className="size-3.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
  down,
}: {
  label: string;
  value: string;
  sub?: string;
  down?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold tabular-nums",
          down && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="text-muted-foreground text-xs tabular-nums">{sub}</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          warn && "text-amber-600",
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
