"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Timer,
  ArrowDownToLine,
} from "lucide-react";

import type {
  TimelineData,
  TimelineEvent,
  TimelineTask,
} from "@/lib/db/queries/timeline";
import { TASK_COLOR_BY_KEY, taskIconUrl } from "@/lib/task-style";

const fmtDay = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
function labelDay(iso: string): string {
  return fmtDay.format(new Date(iso + "T00:00:00"));
}
function dayDiff(from: string, to: string): number {
  return Math.round(
    (new Date(to + "T00:00:00").getTime() -
      new Date(from + "T00:00:00").getTime()) /
      86_400_000,
  );
}

/** Olay türü → kontrast gradient mürekkepleri (mor aileye komplemanter). */
const EVENT_INK: Record<
  TimelineEvent["kind"],
  { label: string; hi: string; lo: string; glow: string }
> = {
  satis: {
    label: "Satış",
    hi: "oklch(0.92 0.12 95)",
    lo: "oklch(0.68 0.14 70)",
    glow: "oklch(0.8 0.14 85 / 0.5)",
  },
  yorum: {
    label: "Yorum",
    hi: "oklch(0.9 0.1 350)",
    lo: "oklch(0.62 0.19 350)",
    glow: "oklch(0.72 0.17 350 / 0.5)",
  },
  sistem: {
    label: "Sistem",
    hi: "oklch(0.92 0.09 195)",
    lo: "oklch(0.6 0.12 210)",
    glow: "oklch(0.75 0.12 200 / 0.5)",
  },
};

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

interface DayBucket {
  day: string;
  tasks: TimelineTask[];
  events: TimelineEvent[];
}

/**
 * Ana panel GÖREV zaman çizelgesi v3 — DİKEY, gün-ayrımlı.
 *
 * Eski yatay-lane düzeni (MAX_LANES=3) aynı güne düşen görevleri düşürüyordu
 * ("yalnız 3 görev" hatası) ve yatay hiza bir anlam taşımıyordu. Yeni düzen:
 * görevler ve olaylar GÜNE göre gruplanır, her gün DİKEY bir blok olur, aynı
 * güne düşen görevler o günün altında DİKEY yığılır — hiçbir görev düşmez,
 * tavan yoktur. Yukarı = geçmiş, aşağı = gelecek; "BUGÜN" çıpası ayraç.
 * Renk skalası (TASK_COLOR_BY_KEY) + ikon (taskIconUrl) + olay küreleri
 * (EVENT_INK) her kartta öne çıkar. Kaydırıldıkça gün blokları Intersection
 * Observer ile bir kez belirir (reveal); idle'da animasyon/backdrop churn YOK
 * (perf dersi). prefers-reduced-motion global kuralıyla tüm geçişler durur.
 */
export function PanelTimeline({
  data,
  serverToday,
}: {
  data: TimelineData;
  serverToday: string;
}) {
  const today = serverToday;
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [todayOffscreen, setTodayOffscreen] = useState(false);

  // Görev + olayları GÜNE göre grupla; günleri kronolojik sırala.
  const { past, todayBucket, future, counts } = useMemo(() => {
    const map = new Map<string, DayBucket>();
    const bucket = (day: string) => {
      let b = map.get(day);
      if (!b) {
        b = { day, tasks: [], events: [] };
        map.set(day, b);
      }
      return b;
    };
    for (const t of data.tasks) {
      if (!t.dueDate) continue;
      bucket(t.dueDate).tasks.push(t);
    }
    for (const e of data.events) bucket(e.date).events.push(e);

    const sortTasks = (a: TimelineTask, b: TimelineTask) =>
      (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
      a.title.localeCompare(b.title);
    const buckets = [...map.values()].sort((a, b) =>
      a.day.localeCompare(b.day),
    );
    for (const b of buckets) b.tasks.sort(sortTasks);

    const doneCount = data.tasks.filter((t) => t.status === "done").length;
    const overdue = data.tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "done",
    ).length;

    return {
      past: buckets.filter((b) => b.day < today),
      todayBucket: buckets.find((b) => b.day === today) ?? null,
      future: buckets.filter((b) => b.day > today),
      counts: {
        done: doneCount,
        overdue,
        today: map.get(today)?.tasks.length ?? 0,
        future: buckets
          .filter((b) => b.day > today)
          .reduce((n, b) => n + b.tasks.length, 0),
      },
    };
  }, [data, today]);

  const totalTasks = data.tasks.filter((t) => t.dueDate).length;

  // Açılışta BUGÜN çıpasını kabın ortasına getir.
  useEffect(() => {
    const sc = scrollRef.current;
    const tn = todayRef.current;
    if (!sc || !tn) return;
    sc.scrollTop = Math.max(
      0,
      tn.offsetTop - sc.clientHeight / 2 + tn.clientHeight / 2,
    );
  }, [past.length, future.length]);

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
  }, [past.length, future.length]);

  const scrollToToday = () => {
    const sc = scrollRef.current;
    const tn = todayRef.current;
    if (!sc || !tn) return;
    sc.scrollTo({
      top: Math.max(0, tn.offsetTop - sc.clientHeight / 2 + tn.clientHeight / 2),
      behavior: "smooth",
    });
  };

  return (
    <div
      className={
        "w-full rounded-[26px] border border-[color:var(--glass-border)] p-4 sm:p-5 " +
        "[background-color:var(--glass)] [background-image:var(--glass-sheen)] [backdrop-filter:var(--glass-filter)] shadow-[var(--lift),var(--glass-highlight)] " +
        "dark:border-[color:oklch(1_0_0/0.05)] dark:[background-color:var(--lume-panel)] dark:[background-image:none] dark:[backdrop-filter:none] dark:shadow-[0_20px_50px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.06)] " +
        "[--tl-todo:oklch(0.54_0.20_278)] [--tl-doing:oklch(0.66_0.20_285)] [--tl-done:oklch(0.83_0.07_290)] [--tl-late:oklch(0.58_0.16_344)] " +
        "dark:[--tl-todo:oklch(0.72_0.14_262)] dark:[--tl-doing:oklch(0.78_0.12_278)] dark:[--tl-done:oklch(0.86_0.05_262)] dark:[--tl-late:oklch(0.74_0.12_344)]"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock aria-hidden className="size-4 text-[color:var(--gold-deep)]" />
        <p className="font-semibold">Görev Zaman Çizelgesi</p>
        <span className="text-muted-foreground text-xs">
          {totalTasks} tarihli görev · {counts.done} bitti · {counts.overdue} gecikme
        </span>
        <span className="text-muted-foreground ml-auto hidden gap-3 text-[11px] sm:flex">
          <Legend color="var(--tl-todo)" label="Yapılacak" />
          <Legend color="var(--tl-doing)" label="Sürüyor · %" />
          <Legend color="var(--tl-done)" label="Bitti" />
          <Legend color="var(--tl-late)" label="Gecikmiş" />
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{
                backgroundImage: `radial-gradient(circle at 32% 30%, ${EVENT_INK.satis.hi}, ${EVENT_INK.satis.lo} 70%)`,
              }}
            />
            Olaylar
          </span>
        </span>
      </div>

      {/* Dikey çizelge — yukarı geçmiş, aşağı gelecek; BUGÜN çıpası ortada */}
      <div className="relative mt-3">
        <div
          ref={scrollRef}
          className="relative max-h-[64vh] overflow-x-hidden overflow-y-auto rounded-2xl px-1 py-2"
        >
          {/* Omurga çizgisi */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-[9px] w-px"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--gold, oklch(0.62 0.20 278)) 6%, var(--gold, oklch(0.62 0.20 278)) 94%, transparent)",
            }}
          />

          {totalTasks === 0 && data.events.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Tarihli görev ya da olay yok —{" "}
              <Link href="/gorevler/yeni" className="underline underline-offset-2">
                tarihli görev ekle
              </Link>
              .
            </p>
          ) : (
            <>
              {past.length === 0 && (
                <p className="text-muted-foreground/60 relative mb-2 pl-9 text-xs italic">
                  Geçmişte bekleyen gün yok.
                </p>
              )}
              {past.map((b) => (
                <DayBlock key={b.day} bucket={b} today={today} />
              ))}

              {/* BUGÜN çıpası */}
              <div
                ref={todayRef}
                className="relative my-2 flex items-center gap-3 pl-1"
              >
                <span className="tl-today-halo relative z-10 grid size-[15px] place-items-center rounded-full bg-[color:var(--gold,oklch(0.54_0.20_278))]">
                  <span className="size-1.5 rounded-full bg-white/90" />
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-base leading-none font-semibold text-[color:var(--gold-deep,oklch(0.5_0.19_278))]">
                    BUGÜN
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {labelDay(today)}
                  </span>
                </div>
              </div>
              {todayBucket ? (
                <DayBlock bucket={todayBucket} today={today} noLabel />
              ) : (
                <p className="text-muted-foreground/60 relative mb-2 pl-9 text-xs">
                  Bugüne planlı görev yok.
                </p>
              )}

              {future.map((b) => (
                <DayBlock key={b.day} bucket={b} today={today} />
              ))}
              {future.length === 0 && (
                <p className="text-muted-foreground/60 relative mt-1 pl-9 text-xs italic">
                  İleri tarihli planlı görev yok.
                </p>
              )}
            </>
          )}
        </div>

        {todayOffscreen && (
          <button
            type="button"
            onClick={scrollToToday}
            className="bg-accent text-accent-foreground absolute right-3 bottom-3 z-20 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-raised-sm)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            <ArrowDownToLine className="size-3.5" />
            Bugüne dön
          </button>
        )}
      </div>
    </div>
  );
}

/** Bir günün bloğu: gün etiketi + olay rozetleri + dikey görev listesi.
    Kaydırılınca bir kez belirir (IntersectionObserver reveal, ucuz). */
function DayBlock({
  bucket,
  today,
  noLabel,
}: {
  bucket: DayBucket;
  today: string;
  noLabel?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const diff = dayDiff(today, bucket.day);
  const rel =
    diff === 0 ? null : diff < 0 ? `${-diff} gün önce` : `${diff} gün sonra`;

  return (
    <div
      ref={ref}
      className="motion-safe:transition-[opacity,transform] motion-safe:duration-500 motion-safe:ease-[var(--ease-premium)]"
      style={
        shown
          ? undefined
          : { opacity: 0, transform: "translateY(10px)" }
      }
    >
      {!noLabel && (
        <div className="relative mt-3 mb-1 flex items-center gap-2 pl-9">
          <span className="text-muted-foreground/70 text-[0.7rem] font-medium tracking-wide uppercase">
            {labelDay(bucket.day)}
          </span>
          {rel && (
            <span
              className={
                diff < 0
                  ? "text-[0.7rem] font-medium text-[oklch(0.58_0.16_344)]/70 dark:text-[oklch(0.74_0.12_344)]/70"
                  : "text-muted-foreground/50 text-[0.7rem]"
              }
            >
              · {rel}
            </span>
          )}
        </div>
      )}

      {/* Günün olay rozetleri */}
      {bucket.events.length > 0 && (
        <div className="relative mb-1.5 flex flex-wrap gap-1.5 pl-9">
          {bucket.events.map((e, i) => {
            const ink = EVENT_INK[e.kind];
            return (
              <span
                key={`${e.kind}-${i}`}
                title={`${ink.label} · ${e.title}${e.detail ? " · " + e.detail : ""}`}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                style={{
                  borderColor: ink.lo,
                  color: ink.lo,
                }}
              >
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{
                    backgroundImage: `radial-gradient(circle at 32% 30%, ${ink.hi}, ${ink.lo} 70%)`,
                  }}
                />
                {ink.label}
                <span className="max-w-[120px] truncate opacity-80">{e.title}</span>
              </span>
            );
          })}
        </div>
      )}

      {bucket.tasks.map((t) => (
        <TaskRow key={t.id} task={t} today={today} />
      ))}
    </div>
  );
}

/** Tek görev satırı — omurga düğümü (renk) + ikon + başlık + durum/ilerleme. */
function TaskRow({ task: t, today }: { task: TimelineTask; today: string }) {
  const done = t.status === "done";
  const overdue = !done && !!t.dueDate && t.dueDate < today;
  const taskColor = t.color ? TASK_COLOR_BY_KEY.get(t.color) : null;
  const nodeColor = overdue
    ? "var(--tl-late)"
    : done
      ? "var(--tl-done)"
      : t.status === "doing"
        ? "var(--tl-doing)"
        : "var(--tl-todo)";
  const progress =
    t.status === "doing" && t.progress != null
      ? Math.max(0, Math.min(100, t.progress))
      : null;
  const late = overdue ? dayDiff(t.dueDate as string, today) : 0;

  return (
    <Link
      href={`/gorevler/${t.id}`}
      className="group relative flex items-start gap-3 py-1 pl-1"
    >
      {/* Omurga düğümü — görev rengi (yoksa duruma göre) */}
      <span
        aria-hidden
        className="relative z-10 mt-2 size-[15px] shrink-0 rounded-full border-2 border-[var(--background)]"
        style={{ backgroundColor: taskColor ? taskColor.ink : nodeColor }}
      />

      <div
        className={
          "min-w-0 flex-1 rounded-2xl border border-[color:var(--glass-border)] px-3 py-2 transition-shadow duration-300 group-hover:shadow-[var(--lift-sm)] " +
          "[background-color:var(--glass)] dark:border-[color:oklch(1_0_0/0.06)] dark:[background-color:var(--lume-glass)] " +
          (overdue ? "tl-overdue-neon " : "") +
          (done ? "opacity-65 " : "")
        }
      >
        <div className="flex items-center gap-2">
          {/* İkon — skala mürekkebiyle boyanır (CSS mask) */}
          {t.icon ? (
            <span
              aria-hidden
              className="inline-block size-[18px] shrink-0"
              style={{
                backgroundColor: taskColor?.ink ?? nodeColor,
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
          ) : done ? (
            <CheckCircle2 className="size-[18px] shrink-0" style={{ color: nodeColor }} />
          ) : overdue ? (
            <Timer className="size-[18px] shrink-0" style={{ color: nodeColor }} />
          ) : (
            <CircleDot className="size-[18px] shrink-0" style={{ color: nodeColor }} />
          )}

          <span
            className={
              "min-w-0 flex-1 truncate text-[13px] font-semibold " +
              (done ? "text-muted-foreground line-through" : "")
            }
          >
            {t.title}
          </span>

          {progress != null && (
            <span className="shrink-0 rounded-full bg-[color:var(--tl-doing)]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[color:var(--tl-doing)] tabular-nums">
              %{progress}
            </span>
          )}
        </div>

        <div className="text-muted-foreground mt-0.5 flex items-center gap-2 pl-[26px] font-mono text-[9px] tracking-[0.1em] uppercase">
          <span>{t.priority}</span>
          {t.assigneeName && <span>· {t.assigneeName}</span>}
          {overdue && (
            <span className="text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]">
              · {late} gün gecikti
            </span>
          )}
          {done && <span>· bitti</span>}
        </div>

        {/* Süren görev ilerleme çubuğu */}
        {progress != null && (
          <span
            aria-hidden
            className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[color:var(--tl-doing)]/12"
          >
            <span
              className="block h-full rounded-full bg-[color:var(--tl-doing)] motion-safe:animate-[tl-fill_0.9s_var(--ease-premium)_both]"
              style={{ width: `${progress}%` }}
            />
          </span>
        )}
      </div>
    </Link>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
