"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { moveTask } from "@/app/(dashboard)/gorevler/actions";
import { TASK_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { TaskPriorityBadge } from "@/components/task-priority-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportTier, TaskWithAssignee } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<
  ReportTier["key"],
  { rail: string; tag: string }
> = {
  reinstate: { rail: "border-l-primary", tag: "bg-primary/15 text-primary" },
  test: { rail: "border-l-[color:var(--chart-2)]", tag: "bg-[color:var(--chart-2)]/15 text-[color:var(--gold-deep,#9A7A34)]" },
  hold: { rail: "border-l-muted-foreground/40", tag: "bg-muted text-muted-foreground" },
};

/**
 * Bir kademe (Kademe 1/2/3) tablosu. `taskId` dolu satırlar Görevler'e
 * bağlıdır — durumu burada değiştirmek `tasks.status`'u günceller, bu da
 * Görevler tahtasında da AYNI satırdan yansır (kopya veri yok).
 */
export function ReportTierTable({
  tier,
  tasksById,
}: {
  tier: ReportTier;
  tasksById: Record<string, TaskWithAssignee>;
}) {
  const style = TIER_STYLE[tier.key];

  return (
    <div className={cn("space-y-2 border-l-[3px] pl-4", style.rail)}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={cn("rounded px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase", style.tag)}>
          {tier.label}
        </span>
        <span className="text-muted-foreground text-xs">
          {tier.items.length} listing
        </span>
      </div>
      <p className="text-muted-foreground max-w-2xl text-sm">{tier.note}</p>

      <div className="nm-raised-sm overflow-x-auto rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead className="text-right">Fiyat</TableHead>
              <TableHead>Kanıt</TableHead>
              <TableHead>Aksiyon</TableHead>
              <TableHead>Görev durumu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tier.items.map((item) => {
              const task = item.taskId ? tasksById[item.taskId] : undefined;
              return (
                <TableRow key={item.title}>
                  <TableCell className="max-w-[240px] font-medium">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(item.priceCents)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                    {item.evidence}
                  </TableCell>
                  <TableCell className="text-sm">{item.action}</TableCell>
                  <TableCell>
                    {task ? (
                      <TaskStatusCell task={task} />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TaskStatusCell({ task }: { task: TaskWithAssignee }) {
  const [pending, startTransition] = useTransition();

  function onChange(status: string) {
    startTransition(async () => {
      const res = await moveTask(task.id, status);
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <TaskPriorityBadge priority={task.priority} />
      <Select value={task.status} onValueChange={onChange} disabled={pending}>
        <SelectTrigger size="sm" className="h-7 w-[128px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Link
        href={`/gorevler/${task.id}`}
        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
      >
        görev
      </Link>
    </div>
  );
}
