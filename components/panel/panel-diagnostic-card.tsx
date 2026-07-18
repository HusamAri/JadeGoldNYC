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

/**
 * Panel üstündeki Satış Tanısı özet kartı — headline + en kritik 3 sinyal +
 * tam teşhis sayfasına link. Veriyi çağıran Suspense bölümü sağlar.
 */
export function PanelDiagnosticCard({ data }: { data: SalesDiagnostics }) {
  const top = data.signals
    .filter((s) => s.severity === "critical" || s.severity === "warning")
    .slice(0, 3);
  const show = top.length > 0 ? top : data.signals.slice(0, 2);
  const urgent = data.lifecycle === "stalled" || data.lifecycle === "declining";

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
              <span className="font-semibold">Satış Tanısı</span>
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
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
              >
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
                      {s.severity}
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
