import Link from "next/link";
import { Stethoscope, ArrowRight, AlertTriangle } from "lucide-react";

import type { SalesDiagnostics, Severity } from "@/lib/db/queries/diagnostics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SEVERITY_BADGE: Record<
  Severity,
  "destructive" | "warning" | "secondary" | "success"
> = {
  critical: "destructive",
  warning: "warning",
  info: "secondary",
  good: "success",
};

const LIFECYCLE_LABEL: Record<SalesDiagnostics["lifecycle"], string> = {
  young: "Genç mağaza",
  stalled: "Satış durdu",
  declining: "Düşüşte",
  healthy: "Sağlıklı",
  dormant: "Hareketsiz",
};

function pct(n: number | null): string {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n * 100)}%`;
}

/**
 * Panel üstündeki Aylık Tanı özet kartı — dönem + en kritik açık aksiyonlar
 * + tam teşhis sayfasına link.
 */
export function PanelDiagnosticCard({ data }: { data: SalesDiagnostics }) {
  const top = data.openFixes
    .filter((s) => s.severity === "critical" || s.severity === "warning")
    .slice(0, 3);
  const show = top.length > 0 ? top : data.openFixes.slice(0, 2);
  const urgent = data.lifecycle === "stalled" || data.lifecycle === "declining";
  const downMonths = data.months.filter(
    (m) => !m.isPartial && (m.status === "down" || m.status === "zero"),
  ).length;

  return (
    <Card
      className={cn(
        "border-l-4",
        urgent ? "border-l-destructive" : "border-l-sky-500",
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Stethoscope className="size-4 shrink-0" />
              <span className="font-semibold">Aylık Tanı</span>
              <Badge
                variant={
                  urgent
                    ? "destructive"
                    : data.lifecycle === "healthy"
                      ? "success"
                      : "secondary"
                }
              >
                {LIFECYCLE_LABEL[data.lifecycle]}
              </Badge>
            </div>
            <p className="text-sm font-medium">{data.headline}</p>
            <p className="text-muted-foreground text-xs">
              {data.fromLabel} → {data.toLabel}
              {downMonths > 0
                ? ` · ${downMonths} ay geriledi/sıfır`
                : ""}
              {data.latestComplete
                ? ` · Son tam ay ${data.latestComplete.label}: ${pct(data.latestComplete.ordersChangePct)} vs ${data.latestComplete.prevLabel ?? "—"}`
                : ""}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/analizler/tani">
              Detay
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {show.length > 0 && (
          <ul className="space-y-2">
            {show.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {(s.severity === "critical" || s.severity === "warning") && (
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      s.severity === "critical"
                        ? "text-destructive"
                        : "text-amber-600",
                    )}
                  />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{s.title}</span>
                    <Badge variant={SEVERITY_BADGE[s.severity]}>
                      {s.severity === "critical"
                        ? "kritik"
                        : s.severity === "warning"
                          ? "uyarı"
                          : s.severity === "good"
                            ? "iyi"
                            : "bilgi"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {s.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
