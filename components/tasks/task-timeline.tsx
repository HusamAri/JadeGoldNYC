"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  UserRound,
  CalendarClock,
  ArrowDownToLine,
  Check,
  Layers,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

import { moveTask } from "@/app/(dashboard)/gorevler/actions";
import { TASK_LANE_SHORT } from "@/lib/constants";
import type { TaskWithAssignee, TaskPriority, TaskStatus } from "@/lib/types";
import type { AssignableUser } from "@/lib/db/queries/tasks";
import { TaskPriorityBadge } from "@/components/task-priority-badge";
import { TASK_COLOR_BY_KEY, taskIconUrl } from "@/lib/task-style";
import {
  HorizontalTimelineBand,
  type HTask,
  type HFloatTask,
} from "@/components/timeline/horizontal-band";
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
const PRIORITY_ORDER: Record<TaskPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function dayDiff(fromDay: string, toDay: string): number {
  const a = new Date(`${fromDay}T00:00:00`);
  const b = new Date(`${toDay}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
const fmtDay = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
function labelDay(day: string): string {
  return fmtDay.format(new Date(`${day}T00:00:00`));
}

type Section = "past" | "today" | "future";

export function TaskTimeline({
  tasks,
  members,
  serverToday,
}: {
  tasks: TaskWithAssignee[];
  members: AssignableUser[];
  serverToday: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lane, setLane] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const reduce = useReducedMotion();

  // "Bugün" mağaza saat dilimine (NYC) göre sunucuda hesaplanır — due_date'ler
  // de o takvimde; sabit tutmak SSR/hydration uyumunu da garanti eder.
  const today = serverToday;

  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [todayOffscreen, setTodayOffscreen] = useState(false);

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (lane !== "all" && (t.lane ?? "") !== lane) return false;
        if (assignee === "unassigned" && t.assignee_id) return false;
        if (assignee !== "all" && assignee !== "unassigned" && t.assignee_id !== assignee)
          return false;
        return true;
      }),
    [tasks, lane, assignee],
  );

  const { pastList, todayList, futureList, undated, doneCount } = useMemo(() => {
    const byDue = (a: TaskWithAssignee, b: TaskWithAssignee) =>
      (a.due_date ?? "").localeCompare(b.due_date ?? "") ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.sort_order - b.sort_order;
    const dated = filtered.filter((t) => t.due_date).sort(byDue);
    return {
      pastList: dated.filter((t) => (t.due_date as string) < today),
      todayList: dated.filter((t) => t.due_date === today),
      futureList: dated.filter((t) => (t.due_date as string) > today),
      undated: filtered
        .filter((t) => !t.due_date)
        .sort(
          (a, b) =>
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
            a.sort_order - b.sort_order,
        ),
      doneCount: filtered.filter((t) => t.status === "done").length,
    };
  }, [filtered, today]);

  const overdue = useMemo(
    () => pastList.filter((t) => t.status !== "done"),
    [pastList],
  );

  // Geniş yatay band için normalize edilmiş görevler (şerit/atanan filtreli).
  const bandTasks: HTask[] = useMemo(
    () =>
      filtered
        .filter((t) => t.due_date)
        .map((t) => ({
          id: t.id,
          title: t.title,
          day: t.due_date as string,
          status:
            t.status === "done" ? "done" : t.status === "doing" ? "doing" : "todo",
          priority: t.priority,
          progress: t.progress ?? null,
          icon: t.icon ?? null,
          color: t.color ?? null,
          assigneeName: t.assignee?.full_name ?? null,
          href: `/gorevler/${t.id}`,
        })),
    [filtered],
  );

  // Tarihsiz görevler bandın kenarlarında "havada" süzülür (leader line'sız).
  // Aktif olanlar önce — deterministik sıra, çipler render'lar arası zıplamaz.
  const floatTasks: HFloatTask[] = useMemo(
    () =>
      [...undated]
        .sort(
          (a, b) =>
            Number(a.status === "done") - Number(b.status === "done") ||
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
            a.sort_order - b.sort_order,
        )
        .map((t) => ({
          id: t.id,
          title: t.title,
          icon: t.icon ?? null,
          color: t.color ?? null,
          priority: t.priority,
          done: t.status === "done",
          href: `/gorevler/${t.id}`,
        })),
    [undated],
  );

  // Açılışta BUGÜN düğümünü kabın ortasına getir — sayfa hep today odağında.
  useEffect(() => {
    const sc = scrollRef.current;
    const tn = todayRef.current;
    if (!sc || !tn) return;
    sc.scrollTop = Math.max(0, tn.offsetTop - sc.clientHeight / 2 + tn.clientHeight / 2);
  }, [pastList.length, futureList.length]);

  // BUGÜN görünürde mi? Değilse "Bugüne dön" düğmesi belirir.
  useEffect(() => {
    const sc = scrollRef.current;
    const tn = todayRef.current;
    if (!sc || !tn) return;
    const io = new IntersectionObserver(
      ([e]) => setTodayOffscreen(!e.isIntersecting),
      { root: sc, threshold: 0.1 },
    );
    io.observe(tn);
    return () => io.disconnect();
  }, [pastList.length, futureList.length]);

  const scrollToToday = useCallback(() => {
    const sc = scrollRef.current;
    const tn = todayRef.current;
    if (!sc || !tn) return;
    sc.scrollTo({
      top: Math.max(0, tn.offsetTop - sc.clientHeight / 2 + tn.clientHeight / 2),
      behavior: "smooth",
    });
  }, []);

  const move = useCallback(
    (id: string, status: TaskStatus) => {
      startTransition(async () => {
        const res = await moveTask(id, status);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        router.refresh();
      });
    },
    [router],
  );

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

  const card = (t: TaskWithAssignee, section: Section) => (
    <TimelineCard
      key={t.id}
      task={t}
      section={section}
      today={today}
      pending={pending}
      onOpen={() => router.push(`/gorevler/${t.id}`)}
      onMove={move}
    />
  );

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

      {/* ── Geniş yatay bakış — geçmiş ← bugün → gelecek (sürüklenir);
             tarihsiz görevler kartın kenarlarında süzülür ─────────────── */}
      <HorizontalTimelineBand
        tasks={bandTasks}
        floating={floatTasks}
        today={today}
        title="Zaman Çizelgesi — Geniş Bakış"
      />

      {/* ── Zaman çizelgesi (BUGÜN odaklı, geçmiş yukarı geriler) ─────── */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="bg-secondary/30 relative max-h-[68vh] overflow-x-hidden overflow-y-auto rounded-[1.75rem] border px-4 py-6 sm:px-6 dark:border-[color:oklch(1_0_0/0.05)] dark:bg-[color:var(--lume-panel)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]"
        >
          {/* Omurga — marka vurgu token'ı (v3: --gold mor aileye eşlendi) */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-[calc(1.25rem+7.5px)] w-px sm:left-[calc(1.75rem+7.5px)]"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--gold) 8%, var(--gold) 92%, transparent)",
            }}
          />
          {/* Geçmişe karışan üst tül */}
          <div
            aria-hidden
            className="from-secondary/60 pointer-events-none sticky top-0 z-10 -mx-4 -mt-6 h-8 bg-gradient-to-b to-transparent sm:-mx-6"
          />

          {pastList.length === 0 && (
            <p className="text-muted-foreground/60 relative mb-4 pl-9 text-xs italic">
              Geçmişte bekleyen gecikme yok.
            </p>
          )}

          {renderWithDayLabels(pastList, today, "past", card)}

          {/* ── BUGÜN çıpası ── */}
          <div ref={todayRef} className="relative my-3 flex items-center gap-3 pl-1">
            <span className="tl-today-halo relative z-10 grid size-[15px] place-items-center rounded-full bg-[color:var(--gold)]">
              <span className="size-1.5 rounded-full bg-white/90" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg leading-none font-semibold text-[color:var(--gold-deep)]">
                BUGÜN
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {labelDay(today)}
              </span>
            </div>
          </div>

          {todayList.length === 0 ? (
            <p className="text-muted-foreground/60 relative mb-3 pl-9 text-xs">
              Bugüne planlı görev yok.
            </p>
          ) : (
            <div className="mb-3">{todayList.map((t) => card(t, "today"))}</div>
          )}

          {renderWithDayLabels(futureList, today, "future", card)}

          {futureList.length === 0 && (
            <p className="text-muted-foreground/60 relative mt-1 pl-9 text-xs italic">
              İleri tarihli planlı görev yok.
            </p>
          )}
        </div>

        <AnimatePresence>
          {todayOffscreen && (
            <motion.button
              type="button"
              onClick={scrollToToday}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              className="bg-accent text-accent-foreground absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-raised-sm)]"
            >
              <ArrowDownToLine className="size-3.5" />
              Bugüne dön
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Alt bölümler: Geciken + Kapsam ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section
          icon={Flame}
          title="Geciken Görevler"
          count={overdue.length}
          tone={overdue.length > 0 ? "danger" : "muted"}
          empty="Geciken görev yok — güncelsin."
        >
          {overdue.map((t) => (
            <MiniRow
              key={t.id}
              task={t}
              meta={`${dayDiff(t.due_date as string, today)} gün gecikti`}
              danger
              onOpen={() => router.push(`/gorevler/${t.id}`)}
            />
          ))}
        </Section>

        <Section
          icon={Layers}
          title="Kapsam (tarihsiz)"
          count={undated.length}
          tone="muted"
          empty="Tarihsiz görev yok."
        >
          {undated.map((t) => (
            <MiniRow
              key={t.id}
              task={t}
              meta={t.lane ? TASK_LANE_SHORT[t.lane] : undefined}
              onOpen={() => router.push(`/gorevler/${t.id}`)}
            />
          ))}
        </Section>
      </div>

      <p className="text-muted-foreground/70 text-center text-xs">
        {doneCount} tamamlandı · {overdue.length} gecikme · {todayList.length} bugün ·{" "}
        {futureList.length} yaklaşan
      </p>
    </div>
  );
}

/** Gün değiştikçe küçük tarih etiketi ekleyerek listeyi çizer. */
function renderWithDayLabels(
  list: TaskWithAssignee[],
  today: string,
  section: Section,
  card: (t: TaskWithAssignee, s: Section) => React.ReactNode,
) {
  const out: React.ReactNode[] = [];
  let last: string | null = null;
  for (const t of list) {
    if (t.due_date !== last) {
      last = t.due_date as string;
      const diff = dayDiff(last, today);
      out.push(
        <div
          key={`day-${last}`}
          className="relative mt-3 mb-1.5 flex items-center gap-2 pl-9"
        >
          <span className="text-muted-foreground/70 text-[0.7rem] font-medium tracking-wide uppercase">
            {labelDay(last)}
          </span>
          {section === "past" && diff > 0 && (
            <span className="text-[0.7rem] font-medium text-[oklch(0.58_0.16_344)]/70 dark:text-[oklch(0.74_0.12_344)]/70">
              · {diff} gün önce
            </span>
          )}
          {section === "future" && diff < 0 && (
            <span className="text-muted-foreground/50 text-[0.7rem]">
              · {-diff} gün sonra
            </span>
          )}
        </div>,
      );
    }
    out.push(card(t, section));
  }
  return out;
}

function TimelineCard({
  task: t,
  section,
  today,
  pending,
  onOpen,
  onMove,
}: {
  task: TaskWithAssignee;
  section: Section;
  today: string;
  pending: boolean;
  onOpen: () => void;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  const reduce = useReducedMotion();
  const done = t.status === "done";
  const overdue = section === "past" && !done;
  const late = overdue ? dayDiff(t.due_date as string, today) : 0;
  const taskColor = t.color ? TASK_COLOR_BY_KEY.get(t.color) : null;
  const progress =
    t.status === "doing" && t.progress != null
      ? Math.max(0, Math.min(100, t.progress))
      : null;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-start gap-3 py-1.5 pl-1"
    >
      {/* Omurga düğümü — görev rengi (varsa) skalanın mürekkebiyle; yoksa
          duruma göre. Renk ATANMIŞSA gecikme pembesi/altın onu ezmez. */}
      <span
        aria-hidden
        className={cn(
          "relative z-10 mt-3.5 size-[15px] shrink-0 rounded-full border-2 border-[var(--background)]",
          overdue && !taskColor && "tl-overdue-dot",
          !taskColor && done && "bg-[color:var(--gold)]",
          !taskColor &&
            overdue &&
            "bg-[oklch(0.58_0.16_344)] dark:bg-[oklch(0.74_0.12_344)]",
          !taskColor &&
            !done &&
            !overdue &&
            section === "today" &&
            "bg-[color:var(--gold)]",
          !taskColor &&
            !done &&
            !overdue &&
            section === "future" &&
            "bg-muted-foreground/40",
        )}
        style={taskColor ? { backgroundColor: taskColor.ink } : undefined}
      >
        {done && (
          <Check className="absolute inset-0 m-auto size-2.5 text-white" strokeWidth={3.5} />
        )}
      </span>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "nm-raised-sm focus-visible:ring-ring/60 min-w-0 flex-1 cursor-pointer rounded-2xl p-3 outline-none transition-shadow duration-300 hover:shadow-[var(--shadow-hover)] focus-visible:ring-2",
          overdue && "tl-overdue-neon",
          section === "past" && !overdue && "opacity-70",
          done && "opacity-60",
        )}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <TaskPriorityBadge priority={t.priority} />
          {t.lane && (
            <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
              {TASK_LANE_SHORT[t.lane]}
            </span>
          )}
          {overdue && (
            <span className="flex items-center gap-1 rounded-full bg-[oklch(0.58_0.16_344)]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[oklch(0.58_0.16_344)] dark:bg-[oklch(0.74_0.12_344)]/15 dark:text-[oklch(0.74_0.12_344)]">
              <CalendarClock className="size-3" />
              {late} gün gecikti
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

        <div className="flex items-center gap-2">
          {/* Görev ikonu — skala mürekkebiyle boyanır (CSS mask) */}
          {t.icon && (
            <span
              aria-hidden
              className="inline-block size-[18px] shrink-0"
              style={{
                backgroundColor: taskColor?.ink ?? "var(--gold-deep)",
                maskImage: `url(${taskIconUrl(t.icon)})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskImage: `url(${taskIconUrl(t.icon)})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
          )}
          <p
            className={cn(
              "min-w-0 flex-1 text-sm leading-snug font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {t.title}
          </p>
          {progress != null && (
            <span className="shrink-0 rounded-full bg-[color:var(--gold)]/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[color:var(--gold-deep)] tabular-nums">
              %{progress}
            </span>
          )}
        </div>
        {t.effort && (
          <p className="text-muted-foreground mt-1 text-xs">{t.effort}</p>
        )}
        {progress != null && (
          <span
            aria-hidden
            className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[color:var(--gold)]/12"
          >
            <span
              className="block h-full rounded-full bg-[color:var(--gold)] motion-safe:animate-[tl-fill_0.9s_var(--ease-premium)_both]"
              style={{ width: `${progress}%` }}
            />
          </span>
        )}

        {!done && (
          <div
            className="mt-2.5 flex items-center gap-1.5 border-t pt-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {PREV[t.status] && (
              <SlideButton
                direction="right"
                disabled={pending}
                onClick={() => onMove(t.id, PREV[t.status]!)}
              >
                <ChevronLeft className="size-3.5" />
                Geri
              </SlideButton>
            )}
            {NEXT[t.status] && (
              <SlideButton
                direction="left"
                className="ml-auto"
                disabled={pending}
                onClick={() => onMove(t.id, NEXT[t.status]!)}
              >
                {t.status === "doing" ? "Tamamla" : "İleri"}
                <ChevronRight className="size-3.5" />
              </SlideButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  tone,
  empty,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  tone: "danger" | "muted";
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-secondary/40 rounded-[1.5rem] p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon
          className={cn(
            "size-4",
            tone === "danger" && count > 0
              ? "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
              : "text-muted-foreground",
          )}
        />
        {title}
        <span className="text-muted-foreground ml-auto tabular-nums">{count}</span>
      </h3>
      {count === 0 ? (
        <p className="text-muted-foreground/60 py-4 text-center text-xs">{empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

function MiniRow({
  task: t,
  meta,
  danger,
  onOpen,
}: {
  task: TaskWithAssignee;
  meta?: string;
  danger?: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "nm-raised-sm focus-visible:ring-ring/60 flex cursor-pointer items-center gap-2 rounded-xl p-2.5 outline-none transition-shadow duration-300 hover:shadow-[var(--shadow-hover)] focus-visible:ring-2",
        danger && "tl-overdue-neon",
      )}
    >
      <TaskPriorityBadge priority={t.priority} />
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</p>
      {meta && (
        <span
          className={cn(
            "shrink-0 text-[0.7rem] font-medium",
            danger
              ? "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
              : "text-muted-foreground",
          )}
        >
          {meta}
        </span>
      )}
      {t.assignee && (
        <UserAvatar
          src={t.assignee.avatar_url}
          name={t.assignee.full_name}
          className="size-5 shrink-0"
        />
      )}
    </div>
  );
}
