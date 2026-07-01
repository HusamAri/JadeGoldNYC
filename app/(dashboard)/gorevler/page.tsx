import Link from "next/link";
import {
  Plus,
  ListChecks,
  CircleDashed,
  Loader,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  listTasks,
  listAssignableUsers,
  getTaskSummary,
} from "@/lib/db/queries/tasks";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata = { title: "Görevler" };

export default async function GorevlerPage() {
  const [tasks, members, summary] = await Promise.all([
    listTasks(),
    listAssignableUsers(),
    getTaskSummary(),
  ]);

  return (
    <div className="relative z-0 pb-28 space-y-6">
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

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Toplam Görev"
          value={formatNumber(summary.total)}
          icon={ListChecks}
        />
        <KpiCard
          label="Yapılacak"
          value={formatNumber(summary.todo)}
          icon={CircleDashed}
        />
        <KpiCard
          label="Devam Eden"
          value={formatNumber(summary.doing)}
          icon={Loader}
        />
        <KpiCard
          label="Tamamlanan"
          value={formatNumber(summary.done)}
          icon={CheckCircle2}
          accent="positive"
        />
        <KpiCard
          label="Açık P0"
          value={formatNumber(summary.p0Open)}
          icon={AlertTriangle}
          accent={summary.p0Open > 0 ? "negative" : "default"}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <TaskBoard tasks={tasks} members={members} />
    </div>
  );
}
