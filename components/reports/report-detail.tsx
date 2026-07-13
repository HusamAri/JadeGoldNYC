import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportTimelineChart } from "@/components/charts/report-timeline-chart";
import { ReportYoyChart } from "@/components/charts/report-yoy-chart";
import { ReportTierTable } from "@/components/reports/report-tier-table";
import type { ReportWithTasks, TaskWithAssignee } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Kayıtlı bir raporun tam görünümü — bulgular, grafikler, kademeli aksiyon planı. */
export function ReportDetail({ report }: { report: ReportWithTasks }) {
  const { content, tasks } = report;
  const tasksById = tasks.reduce<Record<string, TaskWithAssignee>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {content.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {content.stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="space-y-1 p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {s.label}
                </p>
                <p className="text-xl font-semibold tabular-nums">{s.value}</p>
                {s.delta && (
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      s.direction === "up" && "text-primary",
                      s.direction === "down" && "text-destructive",
                      (!s.direction || s.direction === "flat") && "text-muted-foreground",
                    )}
                  >
                    {s.delta}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {content.findings.map((f) => (
        <Card key={f.heading}>
          <CardHeader>
            <CardTitle className="text-base">{f.heading}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {f.body}
            </p>
          </CardContent>
        </Card>
      ))}

      {content.timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Günlük indirim oranı ve sipariş adedi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportTimelineChart
              points={content.timeline.points}
              cutoffDate={content.timeline.cutoffDate}
              cutoffLabel={content.timeline.cutoffLabel}
            />
          </CardContent>
        </Card>
      )}

      {content.yoy && content.yoy.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aynı takvim penceresinde yıl karşılaştırması
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportYoyChart points={content.yoy} />
          </CardContent>
        </Card>
      )}

      {content.tiers.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-lg font-semibold tracking-tight">Yol haritası</h2>
          {content.tiers.map((tier) => (
            <ReportTierTable key={tier.key} tier={tier} tasksById={tasksById} />
          ))}
        </div>
      )}

      {content.sourceNote && (
        <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
          {content.sourceNote}
        </p>
      )}
    </div>
  );
}
