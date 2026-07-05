"use client";

import { useState } from "react";
import { CalendarRange, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
  const reduce = useReducedMotion();

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

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === "timeline" ? (
            <TaskTimeline tasks={tasks} members={members} serverToday={serverToday} />
          ) : (
            <TaskBoard tasks={tasks} members={members} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
