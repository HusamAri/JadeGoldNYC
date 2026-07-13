import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  Plus,
  ListChecks,
  CircleDashed,
  Loader,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SceneCutouts } from "@/components/scene-cutouts";
import { cn } from "@/lib/utils";

import {
  listTasks,
  listAssignableUsers,
  getTaskSummary,
} from "@/lib/db/queries/tasks";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { CornerMarks } from "@/components/brand/corner-marks";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { TaskViews } from "@/components/tasks/task-views";

export const metadata = { title: "Görevler" };

/**
 * Lucide glifini Satışlar'daki lux-art gravür diline yaklaştırır: ince hat
 * (strokeWidth 1) + soluk mor mürekkep — ham currentColor gri klipart yerine
 * kart camının altında oyma filigran gibi okunur. KpiCard'ın verdiği
 * konum/boyut sınıfları korunur; yalnız ton/opaklık üste yazılır.
 */
function luxLine(Icon: ComponentType<SVGProps<SVGSVGElement>>) {
  return function LuxLineIcon({ className, style }: SVGProps<SVGSVGElement>) {
    return (
      <Icon
        className={cn(
          className,
          "text-[oklch(0.68_0.15_286)] opacity-30 dark:text-[oklch(0.83_0.07_290)] dark:opacity-20",
        )}
        style={style}
        strokeWidth={1}
      />
    );
  };
}

const ListChecksArt = luxLine(ListChecks);
const CircleDashedArt = luxLine(CircleDashed);
const LoaderArt = luxLine(Loader);
const CheckCircle2Art = luxLine(CheckCircle2);
const AlertTriangleArt = luxLine(AlertTriangle);

export default async function GorevlerPage() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  }); // YYYY-MM-DD, mağaza saat dilimi (NYC)

  const [tasks, members, summary] = await Promise.all([
    listTasks(),
    listAssignableUsers(),
    getTaskSummary(),
  ]);

  return (
    <div className="relative z-0 pb-28 space-y-8">
      <SceneCutouts page="gorevler" />
      <GoldStream motif="check" />
      <PageHeader
        title="Görevler"
        description="Etsy turnaround planı · ekip görev tahtası"
        action={
          <Button asChild>
            <Link href="/gorevler/yeni">
              <Plus />
              Yeni Görev
            </Link>
          </Button>
        }
      />

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili) — kendi boş
          hattında durur; kart camının altına girmesin diye negatif çekme yok. */}
      <div aria-hidden className="idx relative z-[2]">
        <span>Görevler / 01 · Özet</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>Jade Gold · NYC</span>
      </div>
      {/* Ana KPI bölümü — Spatial hero köşe işaretleri (dekoratif sarmalayıcı). */}
      <div className="relative">
      <div className="stagger grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Toplam Görev"
          value={formatNumber(summary.total)}
          icon={ListChecksArt}
        />
        <KpiCard
          label="Yapılacak"
          value={formatNumber(summary.todo)}
          icon={CircleDashedArt}
        />
        <KpiCard
          label="Devam Eden"
          value={formatNumber(summary.doing)}
          icon={LoaderArt}
        />
        <KpiCard
          label="Tamamlanan"
          value={formatNumber(summary.done)}
          icon={CheckCircle2Art}
          accent="positive"
        />
        <KpiCard
          label="Açık P0"
          value={formatNumber(summary.p0Open)}
          icon={AlertTriangleArt}
          accent={summary.p0Open > 0 ? "negative" : "default"}
          className="col-span-2 lg:col-span-1"
        />
      </div>
      <CornerMarks />
      </div>

      {/* Dekoratif indeks satırı (Spatial/Liquid .idx dili) — sekme pill'i
          üstüne binmesin diye negatif çekme kaldırıldı. */}
      <div aria-hidden className="idx relative z-[2]">
        <span>Görevler / 02 · Tahta</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span>Jade Gold · NYC</span>
      </div>
      <TaskViews tasks={tasks} members={members} serverToday={today} />
    </div>
  );
}
