"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { toast } from "sonner";

import { moveTask } from "@/app/(dashboard)/gorevler/actions";
import { TASK_STATUSES, TASK_LANE_SHORT } from "@/lib/constants";
import type { TaskWithAssignee, TaskPriority, TaskStatus } from "@/lib/types";
import type { AssignableUser } from "@/lib/db/queries/tasks";
import { TaskPriorityBadge } from "@/components/task-priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  todo: "doing",
  doing: "done",
};
const PREV: Partial<Record<TaskStatus, TaskStatus>> = {
  doing: "todo",
  done: "doing",
};
const PRIORITY_ORDER: Record<TaskPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-[box-shadow,color] duration-300",
        active
          ? "bg-accent text-accent-foreground shadow-[var(--shadow-raised-sm)]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function TaskBoard({
  tasks,
  members,
}: {
  tasks: TaskWithAssignee[];
  members: AssignableUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lane, setLane] = useState<string>("all");
  const [assignee, setAssignee] = useState<string>("all");

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (lane !== "all" && (t.lane ?? "") !== lane) return false;
        if (assignee === "unassigned" && t.assignee_id) return false;
        if (
          assignee !== "all" &&
          assignee !== "unassigned" &&
          t.assignee_id !== assignee
        )
          return false;
        return true;
      }),
    [tasks, lane, assignee],
  );

  const columns = TASK_STATUSES.map((s) => ({
    ...s,
    items: filtered
      .filter((t) => t.status === s.value)
      .sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          a.sort_order - b.sort_order,
      ),
  }));

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  function move(id: string, status: TaskStatus) {
    startTransition(async () => {
      const res = await moveTask(id, status);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  const laneChips = [
    { v: "all", l: "Tümü" },
    { v: "A", l: "A · Büyüme" },
    { v: "B", l: "B · Dönüşüm" },
    { v: "owner", l: "Onay" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-[0.7rem] font-medium tracking-wide uppercase">
          Şerit
        </span>
        {laneChips.map((c) => (
          <Chip key={c.v} active={lane === c.v} onClick={() => setLane(c.v)}>
            {c.l}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-[0.7rem] font-medium tracking-wide uppercase">
          Atanan
        </span>
        <Chip active={assignee === "all"} onClick={() => setAssignee("all")}>
          Herkes
        </Chip>
        <Chip
          active={assignee === "unassigned"}
          onClick={() => setAssignee("unassigned")}
        >
          Atanmamış
        </Chip>
        {members.map((u) => (
          <Chip
            key={u.user_id}
            active={assignee === u.user_id}
            onClick={() => setAssignee(u.user_id)}
          >
            {u.full_name || "Üye"}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {doneCount}/{tasks.length} tamam
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => (
          <div key={col.value} className="bg-secondary/40 rounded-[1.5rem] p-3">
            <h3 className="text-muted-foreground mb-3 flex items-center justify-between px-1 text-xs font-semibold tracking-wide uppercase">
              <span>{col.label}</span>
              <span className="tabular-nums">{col.items.length}</span>
            </h3>
            <div className="space-y-2.5">
              {col.items.length === 0 ? (
                <p className="text-muted-foreground/60 px-1 py-6 text-center text-xs">
                  Görev yok
                </p>
              ) : (
                col.items.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/gorevler/${t.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/gorevler/${t.id}`);
                    }}
                    className="nm-raised-sm cursor-pointer rounded-2xl p-3 transition-shadow duration-300 outline-none hover:shadow-[var(--shadow-hover)] focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <TaskPriorityBadge priority={t.priority} />
                      {t.lane && (
                        <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                          {TASK_LANE_SHORT[t.lane]}
                        </span>
                      )}
                      <span className="ml-auto">
                        {t.assignee ? (
                          <UserAvatar
                            src={t.assignee.avatar_url}
                            name={t.assignee.full_name}
                            className="size-6"
                          />
                        ) : (
                          <span className="text-muted-foreground/50 flex size-6 items-center justify-center rounded-full border border-dashed">
                            <UserRound className="size-3" />
                          </span>
                        )}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-snug font-medium",
                        t.status === "done" &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {t.title}
                    </p>
                    {t.effort && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t.effort}
                      </p>
                    )}
                    <div
                      className="mt-2.5 flex items-center gap-1.5 border-t pt-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {PREV[t.status] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => move(t.id, PREV[t.status]!)}
                        >
                          <ChevronLeft className="size-3.5" />
                          Geri
                        </Button>
                      )}
                      {NEXT[t.status] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          disabled={pending}
                          onClick={() => move(t.id, NEXT[t.status]!)}
                        >
                          İleri
                          <ChevronRight className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
