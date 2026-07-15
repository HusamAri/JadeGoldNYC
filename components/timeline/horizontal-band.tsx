"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowLeftToLine } from "lucide-react";

import { TASK_COLOR_BY_KEY, taskIconUrl } from "@/lib/task-style";

/* ────────────────────────────────────────────────────────────────────────
 * GENİŞ YATAY ZAMAN BANDI (v4) — ana panel + görevler ortak bileşeni.
 *
 * Kullanıcı yatay çizelgeyi geri istedi ("çok daha geniş olsun"): eski
 * WINDOW_DAYS=42 / MAX_LANES=3 düzeni hem dardı hem aynı güne düşen görevleri
 * düşürüyordu. Yeni band:
 *  • Zaman ekseni YATAY (sol=geçmiş, sağ=gelecek); x = tarih → gerçek anlam.
 *  • Pencere veriden türer (min/max gün) + geniş px/gün → uzun, kaydırılır kanvas.
 *  • Görevler TAVANSIZ şeritlerde eksenin üstünde/altında dizilir — düşme yok.
 *  • Olay küreleri (satış/yorum/sistem) eksenin altında süzülür → derinlik.
 *  • 3B boncuk düğüm + cam çip + perspektif = yataydaki "derinlikli" his.
 *
 * Perf dersi: idle'da animasyon/backdrop churn YOK. Çipler/küreler
 * IntersectionObserver ile bir kez belirir (reveal), gerisi hover-tetikli.
 * prefers-reduced-motion global kuralıyla tüm geçişler durur.
 * ──────────────────────────────────────────────────────────────────────── */

export interface HTask {
  id: string;
  title: string;
  day: string; // YYYY-MM-DD
  status: "todo" | "doing" | "done";
  priority?: string | null;
  progress: number | null;
  icon: string | null; // task-style anahtarı
  color: string | null; // task-style anahtarı
  assigneeName?: string | null;
  href: string;
}

export interface HEvent {
  day: string; // YYYY-MM-DD
  kind: "satis" | "yorum" | "sistem";
  title: string;
  detail: string;
  weight: number; // 0-1
}

const DAY_MS = 86_400_000;

/** Olay türü → kontrast gradient mürekkepleri (mor aileye komplemanter). */
const EVENT_INK: Record<
  HEvent["kind"],
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

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00`);
}
function dayDiff(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);
}
function addDays(day: string, n: number): string {
  return new Date(toDate(day).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}
const fmtDay = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const fmtMonth = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
function labelDay(day: string): string {
  return fmtDay.format(toDate(day));
}

/** Deterministik minik hash — küre süzülme jitter'ı için. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function HorizontalTimelineBand({
  tasks,
  events = [],
  today,
  title = "Zaman Çizelgesi",
  dayPx = 34,
}: {
  tasks: HTask[];
  events?: HEvent[];
  today: string;
  title?: string;
  dayPx?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [todayOff, setTodayOff] = useState<0 | -1 | 1>(0); // 0 görünür, -1 solda, 1 sağda

  // ── Zaman domaini: veriden türe, ±belirli pay ile genişlet ───────────────
  const model = useMemo(() => {
    const days = [
      ...tasks.map((t) => t.day),
      ...events.map((e) => e.day),
      today,
    ].filter(Boolean);
    let min = today;
    let max = today;
    for (const d of days) {
      if (d < min) min = d;
      if (d > max) max = d;
    }
    // pay + minimum pencere (bugün ±30) → band asla dar kalmaz
    min = min < addDays(today, -30) ? addDays(min, -6) : addDays(today, -30);
    max = max > addDays(today, 30) ? addDays(max, 6) : addDays(today, 30);
    const span = Math.max(1, dayDiff(min, max));

    // Görevleri güne göre grupla; gün içinde öncelik/başlığa göre sırala.
    const byDay = new Map<string, HTask[]>();
    for (const t of tasks) {
      const arr = byDay.get(t.day) ?? [];
      arr.push(t);
      byDay.set(t.day, arr);
    }
    let maxUp = 0;
    let maxDown = 0;
    const placed: (HTask & { x: number; lane: number; up: boolean })[] = [];
    for (const [day, arr] of byDay) {
      arr.sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority ?? ""] ?? 9) -
            (PRIORITY_ORDER[b.priority ?? ""] ?? 9) ||
          a.title.localeCompare(b.title),
      );
      const x = dayDiff(min, day) * dayPx;
      arr.forEach((t, i) => {
        // 0 üst, 1 alt, 2 üst… şeritte yığ (tavansız)
        const up = i % 2 === 0;
        const lane = Math.floor(i / 2) + 1;
        if (up) maxUp = Math.max(maxUp, lane);
        else maxDown = Math.max(maxDown, lane);
        placed.push({ ...t, x, lane, up });
      });
    }

    const placedEvents = events.map((e) => ({
      ...e,
      x: dayDiff(min, e.day) * dayPx,
      jitter: (hash(e.day + e.kind + e.title) % 34) - 6, // -6..27px aşağı sapma
    }));

    // Ay ayraçları (domain içindeki her ayın 1'i)
    const months: { x: number; label: string }[] = [];
    let cur = min.slice(0, 8) + "01";
    if (cur < min) cur = min;
    for (let i = 0; i < 60; i++) {
      const first = cur.slice(0, 8) + "01";
      if (first > max) break;
      const xf = dayDiff(min, first) * dayPx;
      if (first >= min) months.push({ x: xf, label: fmtMonth.format(toDate(first)) });
      // sonraki ay
      const d = toDate(first);
      cur = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
    }

    return {
      min,
      max,
      span,
      width: span * dayPx,
      placed,
      placedEvents,
      months,
      todayX: dayDiff(min, today) * dayPx,
      maxUp,
      maxDown,
    };
  }, [tasks, events, today, dayPx]);

  const PAD = 40;
  const ROW = 44; // şerit yüksekliği (boncuk→çip mesafesi)
  const CHIP_H = 34;
  const EVENT_BAND = 96; // eksen altında küre bölgesi
  const topH = PAD + model.maxUp * ROW + CHIP_H;
  const bottomH = PAD + Math.max(model.maxDown * ROW + CHIP_H, EVENT_BAND);
  const axisY = topH;
  const totalH = topH + bottomH;

  // Açılışta BUGÜN'ü kabın ortasına getir.
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    sc.scrollLeft = Math.max(0, PAD + model.todayX - sc.clientWidth / 2);
  }, [model.todayX]);

  // BUGÜN görünürde mi? Değilse yön okuyla "Bugüne dön".
  useEffect(() => {
    const sc = scrollRef.current;
    const tn = todayRef.current;
    if (!sc || !tn) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setTodayOff(0);
        else {
          const r = tn.getBoundingClientRect();
          const sr = sc.getBoundingClientRect();
          setTodayOff(r.left < sr.left ? -1 : 1);
        }
      },
      { root: sc, threshold: 0.5 },
    );
    io.observe(tn);
    return () => io.disconnect();
  }, [model.width]);

  const scrollToToday = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    sc.scrollTo({
      left: Math.max(0, PAD + model.todayX - sc.clientWidth / 2),
      behavior: "smooth",
    });
  }, [model.todayX]);

  // ── Sürükle-kaydır (geniş bandı fareyle taramak için) ────────────────────
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    const sc = scrollRef.current;
    if (!sc) return;
    drag.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startLeft: sc.scrollLeft,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const sc = scrollRef.current;
    if (!sc || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) {
      drag.current.moved = true;
      sc.scrollLeft = drag.current.startLeft - dx;
    }
  };
  const endDrag = () => {
    drag.current.down = false;
  };
  // Sürükleme sonrası çip tıklamasını yut (yanlışlıkla gezinme olmasın).
  const swallowIfDragged = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "done" && t.day < today,
  ).length;

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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="font-semibold">{title}</p>
        <span className="text-muted-foreground text-xs">
          {total} tarihli görev · {doneCount} bitti · {overdueCount} gecikme
        </span>
        <span className="text-muted-foreground/70 ml-auto hidden text-[11px] sm:inline">
          ↔ sürükle / kaydır · geçmiş ← bugün → gelecek
        </span>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className="tl-band-scroll relative cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl select-none active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,#000_38px,#000_calc(100%-38px),transparent)] [perspective:1600px] [perspective-origin:50%_45%]"
          style={{ scrollbarWidth: "thin" }}
        >
          <div
            className="relative"
            style={{ width: `${model.width + PAD * 2}px`, height: `${totalH}px` }}
          >
            {/* Ay ayraçları + etiketleri (dikey faint çizgiler, tam yükseklik) */}
            {model.months.map((m) => (
              <div
                key={m.label}
                aria-hidden
                className="pointer-events-none absolute top-0 bottom-0"
                style={{ left: `${PAD + m.x}px` }}
              >
                <div className="absolute top-0 bottom-0 w-px bg-[color:var(--glass-border)]/60" />
                <span className="text-muted-foreground/45 absolute top-1 left-2 text-[10px] font-medium tracking-wide whitespace-nowrap uppercase">
                  {m.label}
                </span>
              </div>
            ))}

            {/* Eksen — ışıyan hacimli yatay ray (derinlik) */}
            <div
              aria-hidden
              className="pointer-events-none absolute h-[3px] rounded-full"
              style={{
                left: `${PAD}px`,
                width: `${model.width}px`,
                top: `${axisY}px`,
                background:
                  "linear-gradient(to right, transparent, var(--gold, oklch(0.62 0.20 278)) 3%, var(--gold, oklch(0.62 0.20 278)) 97%, transparent)",
                boxShadow:
                  "0 0 12px color-mix(in oklch, var(--gold, oklch(0.62 0.20 278)) 45%, transparent)",
              }}
            />

            {/* BUGÜN çıpası — dikey ışık + etiket */}
            <div
              ref={todayRef}
              className="pointer-events-none absolute top-0 bottom-0"
              style={{ left: `${PAD + model.todayX}px` }}
            >
              <div
                className="absolute top-6 bottom-4 w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, color-mix(in oklch, var(--gold, oklch(0.54 0.20 278)) 55%, transparent), transparent)",
                }}
              />
              <span
                className="tl-today-halo absolute z-20 grid size-[17px] -translate-x-1/2 place-items-center rounded-full bg-[color:var(--gold,oklch(0.54_0.20_278))]"
                style={{ top: `${axisY - 8}px` }}
              >
                <span className="size-1.5 rounded-full bg-white/90" />
              </span>
              <span
                className="absolute -translate-x-1/2 font-serif text-sm font-semibold whitespace-nowrap text-[color:var(--gold-deep,oklch(0.5_0.19_278))]"
                style={{ top: `${axisY + 16}px` }}
              >
                BUGÜN
              </span>
            </div>

            {/* Olay küreleri — eksen altında süzülen hacimli küreler */}
            {model.placedEvents.map((e, i) => {
              const ink = EVENT_INK[e.kind];
              const size = 14 + Math.round((e.weight ?? 0.4) * 20); // 14-34px
              return (
                <BandOrb
                  key={`${e.kind}-${e.day}-${i}`}
                  left={PAD + e.x}
                  top={axisY + 30 + e.jitter}
                  size={size}
                  ink={ink}
                  title={`${ink.label} · ${e.title}${e.detail ? " · " + e.detail : ""}`}
                />
              );
            })}

            {/* Görev boncukları + çipleri */}
            {model.placed.map((t) => (
              <BandTask
                key={t.id}
                task={t}
                axisY={axisY}
                left={PAD + t.x}
                row={ROW}
                today={today}
                onClickCapture={swallowIfDragged}
              />
            ))}

            {total === 0 && events.length === 0 && (
              <p
                className="text-muted-foreground absolute left-1/2 -translate-x-1/2 text-sm"
                style={{ top: `${axisY - 8}px` }}
              >
                Tarihli görev ya da olay yok.
              </p>
            )}
          </div>
        </div>

        {todayOff !== 0 && (
          <button
            type="button"
            onClick={scrollToToday}
            className="bg-accent text-accent-foreground absolute bottom-3 z-30 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-raised-sm)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
            style={todayOff === -1 ? { left: "12px" } : { right: "12px" }}
          >
            <ArrowLeftToLine
              className={"size-3.5 " + (todayOff === 1 ? "rotate-180" : "")}
            />
            Bugüne dön
          </button>
        )}
      </div>
    </div>
  );
}

/** Eksen altında havada asılı hacimli küre (radial + ışıma + iç highlight). */
function BandOrb({
  left,
  top,
  size,
  ink,
  title,
}: {
  left: number;
  top: number;
  size: number;
  ink: { label: string; hi: string; lo: string; glow: string };
  title: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
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
      { root: el.closest(".tl-band-scroll"), rootMargin: "0px 120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span
      ref={ref}
      title={title}
      aria-hidden
      className="absolute z-[5] inline-block shrink-0 rounded-full transition-[transform,opacity] duration-500 ease-[var(--ease-premium)] hover:scale-125"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: shown ? undefined : "scale(0.4)",
        opacity: shown ? undefined : 0,
        backgroundImage: `radial-gradient(circle at 32% 28%, ${ink.hi}, ${ink.lo} 66%, transparent 100%)`,
        boxShadow: `0 ${Math.round(size / 3)}px ${size}px ${ink.glow}, 0 2px 4px ${ink.glow}, inset 0 1px 2px oklch(1 0 0 / 0.6)`,
      }}
    />
  );
}

/** Eksen üstünde/altında bir görev: 3B boncuk düğüm + bağ + cam çip. */
function BandTask({
  task: t,
  axisY,
  left,
  row,
  today,
  onClickCapture,
}: {
  task: HTask & { lane: number; up: boolean };
  axisY: number;
  left: number;
  row: number;
  today: string;
  onClickCapture: (e: React.MouseEvent) => void;
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
      { root: el.closest(".tl-band-scroll"), rootMargin: "0px 140px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const done = t.status === "done";
  const overdue = !done && t.day < today;
  const taskColor = t.color ? TASK_COLOR_BY_KEY.get(t.color) : null;
  const nodeColor = overdue
    ? "var(--tl-late)"
    : done
      ? "var(--tl-done)"
      : t.status === "doing"
        ? "var(--tl-doing)"
        : "var(--tl-todo)";
  const ink = taskColor ? taskColor.ink : nodeColor;
  const progress =
    t.status === "doing" && t.progress != null
      ? Math.max(0, Math.min(100, t.progress))
      : null;

  const stem = t.lane * row - 8; // boncuktan çipe uzaklık
  const chipTop = t.up ? axisY - stem - 26 : axisY + stem + 4;
  const connTop = t.up ? axisY - stem + 2 : axisY + 6;
  const connH = stem - 4;

  return (
    <div
      ref={ref}
      className="absolute z-10 [transform-style:preserve-3d]"
      style={{ left: `${left}px`, top: 0, bottom: 0 }}
    >
      {/* Bağ çubuğu (boncuk → çip) */}
      <span
        aria-hidden
        className="absolute w-px"
        style={{
          left: 0,
          top: `${connTop}px`,
          height: `${Math.max(0, connH)}px`,
          background: `linear-gradient(${t.up ? "to top" : "to bottom"}, ${ink}, transparent)`,
          opacity: shown ? 0.5 : 0,
          transition: "opacity 500ms var(--ease-premium)",
        }}
      />
      {/* Eksen boncuğu — ışıyan 3B düğüm */}
      <span
        aria-hidden
        className="absolute size-[15px] -translate-x-1/2 rounded-full"
        style={{
          left: 0,
          top: `${axisY - 7}px`,
          background: `radial-gradient(circle at 35% 30%, color-mix(in oklch, ${ink} 55%, white), ${ink} 72%)`,
          boxShadow: `0 0 0 3px var(--background), 0 2px 6px color-mix(in oklch, ${ink} 45%, transparent), 0 0 12px color-mix(in oklch, ${ink} 40%, transparent), inset 0 1px 1.5px oklch(1 0 0 / 0.65)`,
        }}
      />

      {/* Cam çip */}
      <Link
        href={t.href}
        onClickCapture={onClickCapture}
        className="group absolute block w-[168px] -translate-x-1/2"
        style={{
          top: `${chipTop}px`,
          transform: shown
            ? "translateX(-50%)"
            : `translateX(-50%) translateY(${t.up ? 8 : -8}px)`,
          opacity: shown ? 1 : 0,
          transition: "opacity 500ms var(--ease-premium), transform 500ms var(--ease-premium)",
        }}
      >
        <div
          className={
            "relative overflow-hidden rounded-xl border border-l-[3px] border-[color:var(--glass-border)] px-2.5 py-1.5 shadow-[var(--lift-sm)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-premium)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--lift),0_0_18px_var(--task-glow)] " +
            "[background-color:var(--glass)] [background-image:var(--glass-sheen)] dark:border-[color:oklch(1_0_0/0.06)] dark:[background-color:var(--lume-glass)] dark:[background-image:none] " +
            (overdue ? "tl-overdue-neon " : "") +
            (done ? "opacity-70 " : "")
          }
          style={{
            borderLeftColor: ink,
            ["--task-glow" as string]: `color-mix(in oklch, ${ink} 26%, transparent)`,
          }}
        >
          <div className="flex items-center gap-1.5">
            {t.icon ? (
              <span
                aria-hidden
                className="inline-block size-[15px] shrink-0"
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
            ) : null}
            <span
              className={
                "min-w-0 flex-1 truncate text-[11px] font-semibold " +
                (done ? "text-muted-foreground line-through" : "")
              }
            >
              {t.title}
            </span>
            {progress != null && (
              <span className="shrink-0 font-mono text-[9px] font-bold text-[color:var(--tl-doing)] tabular-nums">
                %{progress}
              </span>
            )}
          </div>
          <div className="text-muted-foreground/80 mt-0.5 truncate font-mono text-[8px] tracking-[0.08em] uppercase">
            {labelDay(t.day)}
            {t.priority ? ` · ${t.priority}` : ""}
            {t.assigneeName ? ` · ${t.assigneeName}` : ""}
          </div>
          {progress != null && (
            <span
              aria-hidden
              className="mt-1 block h-0.5 overflow-hidden rounded-full bg-[color:var(--tl-doing)]/15"
            >
              <span
                className="block h-full rounded-full bg-[color:var(--tl-doing)]"
                style={{ width: `${progress}%` }}
              />
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
