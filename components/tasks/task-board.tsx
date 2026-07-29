"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { toast } from "sonner";

import { springs } from "@/lib/motion";

import { moveTask } from "@/app/(dashboard)/gorevler/actions";
import { TASK_STATUSES, TASK_LANE_SHORT } from "@/lib/constants";
import type { TaskWithAssignee, TaskPriority, TaskStatus } from "@/lib/types";
import type { AssignableUser } from "@/lib/db/queries/tasks";
import { TaskPriorityBadge } from "@/components/task-priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { SlideButton } from "@/components/tasks/motion";
import { LiquidTabs } from "@/components/tasks/liquid-tabs";
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

export function TaskBoard({
  tasks,
  members,
}: {
  tasks: TaskWithAssignee[];
  members: AssignableUser[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [lane, setLane] = useState<string>("all");
  const [assignee, setAssignee] = useState<string>("all");
  // Taşınmakta olan görev — YALNIZ o kartın düğmeleri kilitlenir. Eskiden tek
  // bir `pending` tüm kartların düğmelerini kapatıyordu: bir görevi taşımak
  // sunucu turu boyunca panonun TAMAMINI donduruyordu.
  const [movingId, setMovingId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // TIKLAMA ANINDA hareket: kart sunucu turunu beklemeden yeni kolona geçer.
  // Sunucu hata dönerse (veya taze veri geldiğinde) React iyimser durumu
  // otomatik atar → kart geri kayar + toast hatayı söyler.
  // Veri/aksiyon sözleşmesi (moveTask argümanları) DEĞİŞMEDİ.
  const [optimisticTasks, applyOptimisticMove] = useOptimistic(
    tasks,
    (state: TaskWithAssignee[], patch: { id: string; status: TaskStatus }) =>
      state.map((t) =>
        t.id === patch.id ? { ...t, status: patch.status } : t,
      ),
  );

  const filtered = useMemo(
    () =>
      optimisticTasks.filter((t) => {
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
    [optimisticTasks, lane, assignee],
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

  // İlerleme çubuğu da iyimser kümeden okunur: kart taşındığı anda sayaç da
  // ilerler (aynı tıklamanın iki farklı gerçeği olmaz).
  const doneCount = optimisticTasks.filter((t) => t.status === "done").length;
  const pct = optimisticTasks.length
    ? Math.round((doneCount / optimisticTasks.length) * 100)
    : 0;

  function move(id: string, status: TaskStatus) {
    startTransition(async () => {
      // İyimser yazma transition'ın İÇİNDE olmak zorunda (React sözleşmesi).
      applyOptimisticMove({ id, status });
      setMovingId(id);
      const res = await moveTask(id, status);
      if (res?.error) {
        toast.error(res.error);
        setMovingId(null);
        return;
      }
      // Transition içindeki `router.refresh()` taze RSC yükü gelene kadar
      // sürer → iyimser durum tam o ana kadar tutar, kart iki kez oynamaz.
      router.refresh();
      setMovingId(null);
    });
  }

  const laneItems = [
    { value: "all", label: "Tümü" },
    { value: "A", label: "A · Büyüme" },
    { value: "B", label: "B · Dönüşüm" },
    { value: "owner", label: "Onay" },
  ];
  const assigneeItems = [
    { value: "all", label: "Herkes" },
    { value: "unassigned", label: "Atanmamış" },
    ...members.map((u) => ({ value: u.user_id, label: u.full_name || "Üye" })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-[0.7rem] font-medium tracking-wide uppercase">
          Şerit
        </span>
        <LiquidTabs items={laneItems} value={lane} onChange={setLane} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-[0.7rem] font-medium tracking-wide uppercase">
          Atanan
        </span>
        <LiquidTabs items={assigneeItems} value={assignee} onChange={setAssignee} />
      </div>

      <div className="flex items-center gap-3">
        <div className="nm-pressed h-2 flex-1 overflow-hidden rounded-full">
          {/* Dolgu `width` DEĞİL `scaleX` ile büyür: genişlik animasyonu her
              karede layout+paint tetikler (bütçe beyaz listesi dışı), transform
              yalnız kompozitörde koşar. */}
          <div
            className="bg-accent h-full w-full origin-left rounded-full transition-transform duration-500 ease-[var(--ease-premium)]"
            style={{ transform: `scaleX(${pct / 100})` }}
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
                  /* `layoutId`: kart bir kolondan diğerine geçerken FLIP ile
                     KAYAR (eski konumdan yenisine) — "bir şey oldu ama nerede?"
                     sorusu doğmaz. Hareket yalnız transform. useReducedMotion
                     ile JS tarafında da guard'lı (bütçe md.9).
                     NOT: components/motion/pressable.tsx bilerek kullanılmadı —
                     kalıcı `will-change-transform` yazıyor; 20+ kartta bu,
                     "statik will-change <=5 element" bütçesini deler. Onun
                     basma fiziği (springs.snappy + scale .985) burada whileTap
                     olarak birebir veriliyor; yer değiştirme calm yayla. */
                  <motion.div
                    key={t.id}
                    layout={reduce ? false : "position"}
                    layoutId={reduce ? undefined : `task-card-${t.id}`}
                    transition={springs.calm}
                    whileTap={
                      reduce
                        ? undefined
                        : { scale: 0.985, transition: springs.snappy }
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/gorevler/${t.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/gorevler/${t.id}`);
                      }
                    }}
                    className="nm-raised-sm focus-visible:ring-ring/60 cursor-pointer rounded-2xl p-3 transition-shadow duration-300 outline-none hover:shadow-[var(--shadow-hover)] focus-visible:ring-2"
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
                        <SlideButton
                          direction="right"
                          disabled={movingId === t.id}
                          onClick={() => move(t.id, PREV[t.status]!)}
                        >
                          <ChevronLeft className="size-3.5" />
                          Geri
                        </SlideButton>
                      )}
                      {NEXT[t.status] && (
                        <SlideButton
                          direction="left"
                          className="ml-auto"
                          disabled={movingId === t.id}
                          onClick={() => move(t.id, NEXT[t.status]!)}
                        >
                          İleri
                          <ChevronRight className="size-3.5" />
                        </SlideButton>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
