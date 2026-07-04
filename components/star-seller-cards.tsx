import { MessageCircle, Truck, Star, Scale } from "lucide-react";

import {
  metricViews,
  overallStatus,
  METRIC_STATUS_LABEL,
  type MetricStatus,
  type StarSellerValues,
} from "@/lib/star-seller";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const ICONS = { message: MessageCircle, shipping: Truck, rating: Star, case: Scale };

const STATUS_STYLE: Record<MetricStatus, string> = {
  target:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20",
  standard:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20",
  risk: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-400/20",
};

function StatusPill({ status }: { status: MetricStatus | null }) {
  if (!status) {
    return (
      <span className="text-muted-foreground ring-border rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset">
        Veri yok
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLE[status],
      )}
    >
      {METRIC_STATUS_LABEL[status]}
    </span>
  );
}

export function StarSellerCards({ values }: { values: StarSellerValues }) {
  const views = metricViews(values);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {views.map((m) => {
        const Icon = ICONS[m.key];
        return (
          <Card key={m.key}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">{m.title}</span>
                  {m.auto && (
                    <span className="text-muted-foreground ring-border rounded-full px-1.5 py-0.5 text-[10px] ring-1 ring-inset">
                      otomatik
                    </span>
                  )}
                </div>
                <StatusPill status={m.status} />
              </div>
              <div className="text-3xl font-semibold tabular-nums">{m.value}</div>
              <dl className="space-y-1 text-xs">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground shrink-0">Standart:</dt>
                  <dd>{m.standard}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-primary/80 shrink-0">Hedef:</dt>
                  <dd className="text-primary/90">{m.target}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function overallLabel(values: StarSellerValues): {
  status: MetricStatus | "unknown";
  text: string;
} {
  const s = overallStatus(metricViews(values));
  const text =
    s === "target"
      ? "Tüm metrikler Star Seller hedefinde"
      : s === "standard"
        ? "Hizmet standardında — bazı metrikler hedefin altında"
        : s === "risk"
          ? "Risk — en az bir metrik standardın altında"
          : "Henüz veri girilmedi";
  return { status: s, text };
}
