"use client";

import { useState } from "react";
import { CalendarRange, LayoutGrid } from "lucide-react";

import type { TaskWithAssignee } from "@/lib/types";
import type { AssignableUser } from "@/lib/db/queries/tasks";
import { TaskTimeline } from "@/components/tasks/task-timeline";
import { TaskBoard } from "@/components/tasks/task-board";
import { cn } from "@/lib/utils";

/** Görevler: "Zaman Çizelgesi" (varsayılan) ↔ "Pano" (Kanban) görünüm geçişi. */
export function TaskViews({
  tasks,
  members,
  serverToday,
}: {
  tasks: TaskWithAssignee[];
  members: AssignableUser[];
  serverToday: string;
}) {
  const [view, setView] = useState<"timeline" | "board">("timeline");

  const tabs = [
    { value: "timeline" as const, label: "Zaman Çizelgesi", icon: CalendarRange },
    { value: "board" as const, label: "Pano", icon: LayoutGrid },
  ];

  return (
    <div className="space-y-4">
      <div className="nm-raised-sm inline-flex gap-1 rounded-full p-1">
        {tabs.map((t) => {
          const active = view === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setView(t.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "bg-accent text-accent-foreground shadow-[var(--shadow-raised-sm)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {view === "timeline" ? (
        <TaskTimeline tasks={tasks} members={members} serverToday={serverToday} />
      ) : (
        <TaskBoard tasks={tasks} members={members} />
      )}
    </div>
  );
}
