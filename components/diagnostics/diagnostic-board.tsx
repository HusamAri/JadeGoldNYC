import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  Megaphone,
  Percent,
  Sparkles,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";

import type {
  SalesDiagnostics,
  DiagnosticSignal,
  Severity,
} from "@/lib/db/queries/diagnostics";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY: Record<
  Severity,
  { label: string; badge: "destructive" | "warning" | "secondary" | "success"; ring: string }
> = {
  critical: { label: "Kritik", badge: "destructive", ring: "border-l-destructive" },
  warning: { label: "Uyarı", badge: "warning", ring: "border-l-amber-500" },
  info: { label: "Bilgi", badge: "secondary", ring: "border-l-sky-500" },
  good: { label: "İyi", badge: "success", ring: "border-l-emerald-500" },
};

function pct(n: number | null): string {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n * 100)}%`;
}

export function DiagnosticBoard({ data }: { data: SalesDiagnostics }) {
  const cur = data.currency;
  return (
    <div className="space-y-6">
      {/* Verdict banner */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={data.lifecycle === "healthy" ? "success" : "secondary"}>
              {data.lifecycle}
            </Badge>
            <p className="text-lg font-semibold">{data.headline}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Sipariş (30g)"
              value={String(data.orders.current)}
              sub={`önceki: ${data.orders.previous} · ${pct(data.orders.changePct)}`}
              down={(data.orders.changePct ?? 0) < 0}
            />
            <Metric
              label="Gelir (30g)"
              value={formatMoney(data.revenueCents.current, cur)}
              sub={`önceki: ${formatMoney(data.revenueCents.previous, cur)} · ${pct(
                data.revenueCents.changePct,
              )}`}
              down={(data.revenueCents.changePct ?? 0) < 0}
            />
            <Metric
              label="Reklam harcaması"
              value={formatMoney(data.ads.spendCents, cur)}
              sub={
                data.ads.roas == null
                  ? "ROAS —"
                  : `ROAS ${data.ads.roas.toFixed(2)}`
              }
              down={data.ads.roas != null && data.ads.roas < 1}
            />
            <Metric
              label="Aktif listing"
              value={String(data.freshness.activeListings)}
              sub={`${data.freshness.newListings30d} yeni (30g)`}
            />
          </div>
          {data.verdict === "conversion" && (
            <p className="text-muted-foreground text-sm">
              Ziyaret var ama sipariş düşük → <b>dönüşüm sorunu</b> (fiyat/görsel/yorum/kargo).
            </p>
          )}
          {data.verdict === "unknown" && (
            <p className="text-muted-foreground text-sm">
              Trafik verisi eksik — trafik mi dönüşüm mü olduğunu kesinleştirmek için Etsy
              Stats (arama/ziyaret) CSV&apos;sini içe aktarın.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prioritized signals */}
      <div className="space-y-3">
        {data.signals.map((s, i) => (
          <SignalCard key={i} signal={s} />
        ))}
      </div>

      {/* Ad leaks table */}
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
                    <th className="py-1.5 px-3 text-right font-medium">Harcama</th>
                    <th className="py-1.5 px-3 text-right font-medium">Gelir</th>
                    <th className="py-1.5 px-3 text-right font-medium">ROAS</th>
                    <th className="py-1.5 pl-3 text-right font-medium">Sipariş</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ads.leaks.map((l) => (
                    <tr key={l.productId ?? l.title} className="border-t">
                      <td className="max-w-[280px] py-2 pr-3">
                        <span className="block truncate font-medium">{l.title}</span>
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
                          l.roas != null && l.roas < 1 && "text-destructive font-semibold",
                        )}
                      >
                        {l.roas == null ? "—" : l.roas.toFixed(2)}
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums">{l.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-xs">
              Öneri: ROAS&nbsp;&lt;&nbsp;1 veya siparişsiz listinglerin reklamını durdurup
              bütçeyi dönüşen listinglere aktarın.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Freshness / coverage grid */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <h3 className="font-semibold">Tazelik & kapsam</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Aktif listing" value={data.freshness.activeListings} />
            <Stat label="Yeni (30g)" value={data.freshness.newListings30d} />
            <Stat label="Pasif/stoksuz" value={data.freshness.inactiveOrOOS} warn={data.freshness.inactiveOrOOS > 0} />
            <Stat label="Az görselli" value={data.freshness.lowImageListings} warn={data.freshness.lowImageListings > 0} />
            <Stat label="0 görüntüleme" value={data.freshness.zeroViewListings} />
            <Stat label="Bekleyen SEO" value={data.freshness.pendingSeoTags} />
          </div>
          {data.discount.historicalRatePct != null && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Percent className="size-3.5" />
              İndirim: geçmiş {Math.round((data.discount.historicalRatePct ?? 0) * 100)}% · son 30g{" "}
              {Math.round((data.discount.recentRatePct ?? 0) * 100)}%
              {data.discount.dependent && " — indirim bağımlılığı riski"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
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
      <p className={cn("text-xl font-semibold tabular-nums", down && "text-destructive")}>
        {value}
      </p>
      {sub && <p className="text-muted-foreground text-xs tabular-nums">{sub}</p>}
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
      <p className={cn("text-lg font-semibold tabular-nums", warn && "text-amber-600")}>
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
