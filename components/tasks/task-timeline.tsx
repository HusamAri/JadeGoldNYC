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

      {/* ── Zaman çizelgesi (BUGÜN odaklı, geçmiş yukarı geriler) ─────── */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="relative max-h-[68vh] overflow-y-auto overflow-x-hidden rounded-[1.75rem] border bg-secondary/30 px-4 py-6 sm:px-6"
        >
          {/* Omurga — akan erimiş altın */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-[calc(0.75rem+7px)] w-px sm:left-[calc(1.5rem+7px)]"
            style={{
              background:
                "linear-gradient(to bottom, transparent, #B89347 8%, #B89347 92%, transparent)",
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
            <span className="tl-today-halo relative z-10 grid size-[15px] place-items-center rounded-full bg-[#E8C669]">
              <span className="size-1.5 rounded-full bg-[#7a5a1a]" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg leading-none font-semibold text-[#B89347]">
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

        {todayOffscreen && (
          <button
            type="button"
            onClick={scrollToToday}
            className="bg-accent text-accent-foreground absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-raised-sm)] transition-transform hover:scale-105"
          >
            <ArrowDownToLine className="size-3.5" />
            Bugüne dön
          </button>
        )}
      </div>

      {/* ── Alt bölümler: Geciken + Kapsam ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
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
            <span className="text-[0.7rem] font-medium text-red-500/70">
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
  const done = t.status === "done";
  const overdue = section === "past" && !done;
  const late = overdue ? dayDiff(t.due_date as string, today) : 0;

  return (
    <div className="relative flex items-start gap-3 py-1.5 pl-1">
      {/* Omurga düğümü */}
      <span
        aria-hidden
        className={cn(
          "relative z-10 mt-3.5 size-[15px] shrink-0 rounded-full border-2 border-[var(--background)]",
          done && "bg-[#B89347]",
          overdue && "tl-overdue-dot bg-red-500",
          !done && !overdue && section === "today" && "bg-[#E8C669]",
          !done && !overdue && section === "future" && "bg-muted-foreground/40",
        )}
      >
        {done && (
          <Check className="absolute inset-0 m-auto size-2.5 text-[#3b2c10]" strokeWidth={3.5} />
        )}
      </span>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
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
            <span className="flex items-center gap-1 rounded-full bg-red-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
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

        <p
          className={cn(
            "text-sm leading-snug font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {t.title}
        </p>
        {t.effort && (
          <p className="text-muted-foreground mt-1 text-xs">{t.effort}</p>
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
    </div>
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
            tone === "danger" && count > 0 ? "text-red-500" : "text-muted-foreground",
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
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
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
            danger ? "text-red-500" : "text-muted-foreground",
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
