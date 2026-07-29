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
 * GENİŞ YATAY ZAMAN BANDI (v5) — ana panel + görevler ortak bileşeni.
 *
 * v4 sorunu: çip 168px genişken x yalnız tarihe (dayPx=34) bağlıydı ve
 * çakışma çözümü SADECE aynı gün içindeydi — tarihi yakın görevler merkezde
 * üst üste binip metinleri okunmaz kılıyordu. v5:
 *  • 4 RAY (üst-iç / alt-iç / üst-dış / alt-dış): kartlar tarih sırasına göre
 *    round-robin tercih + greedy x-aralık kontrolüyle raylara dağıtılır;
 *    tercih rayı doluysa sıradaki raya, 4'ü de doluysa en erken boşalan raya
 *    SAĞA itilerek (yatay ofset) girer → hiçbir kart metni üst üste binmez,
 *    yerleşim deterministiktir (render'lar arası zıplamaz).
 *  • LEADER LINE: her kart, eksendeki boncuğuna ince eğik SVG çizgiyle bağlı —
 *    kart nereye kayarsa kaysın tarih aidiyeti görünür kalır.
 *  • DERİNLİK: iç raylar önde (z-20, gölgeli), dış raylar arkada (z-10,
 *    %96 ölçek, gölgesiz); hover kartı öne alır (z-40 + derin gölge).
 *    Negatif z-index kabı YOK — katmanlar kardeş pozitif z ile kurulur.
 *  • TARİHSİZ görevler (opsiyonel `floating` prop) çizgiye bağlanmadan kartın
 *    kenarlarında süzülür; kutunun ~12px dışına taşarlar (kap kırpmaz).
 *  • Olay küreleri (satış/yorum/sistem) eksenin altında süzülür → derinlik.
 *
 * Perf dersi: idle'da backdrop churn YOK; süzülme transform-only ve bölgeseldir.
 * Çipler/küreler IntersectionObserver ile bir kez belirir (reveal), gerisi
 * hover-tetikli. prefers-reduced-motion global kuralıyla tüm hareket durur.
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

/** Tarihsiz görev — çizgiye bağlanmaz, bandın kenarlarında süzülür. */
export interface HFloatTask {
  id: string;
  title: string;
  icon: string | null; // task-style anahtarı
  color: string | null; // task-style anahtarı
  priority?: string | null;
  done?: boolean;
  href: string;
}

const DAY_MS = 86_400_000;

/* Kart geometrisi — yerleşim (çakışma) hesabı da bu sabitleri kullanır. */
const CHIP_W = 168; // kart genişliği (px)
const CHIP_GAP = 12; // aynı rayda iki kart arası asgari boşluk (px)
const CHIP_H = 52; // yükseklik payı (yerleşim/ray hesabı için)
const ROW = 58; // ray başına dikey adım (iç ray → dış ray)

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
  floating = [],
  today,
  title = "Zaman Çizelgesi",
  dayPx = 34,
}: {
  tasks: HTask[];
  events?: HEvent[];
  /** Tarihsiz görevler — eksene bağlanmaz, kartın kenarlarında süzülür. */
  floating?: HFloatTask[];
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

    // ── Kartları 4 raya deterministik dağıt (çakışma çözümü) ────────────
    // Tarih sırasına göre round-robin ray tercihi + greedy x-aralık kontrolü:
    // kartın [x-84, x+84] aralığı tercih rayında doluysa sıradaki raya kayar;
    // 4 ray da doluysa en erken boşalan raya SAĞA itilerek girer (yatay
    // ofset — leader line aidiyeti korur). Sıralama anahtarı (gün, öncelik,
    // başlık, id) tam belirleyici → render'lar arası yerleşim zıplamaz.
    const sorted = [...tasks].sort(
      (a, b) =>
        a.day.localeCompare(b.day) ||
        (PRIORITY_ORDER[a.priority ?? ""] ?? 9) -
          (PRIORITY_ORDER[b.priority ?? ""] ?? 9) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id),
    );
    const rails = [
      { up: true, lane: 1, lastEnd: -Infinity }, // üst-iç (önde)
      { up: false, lane: 1, lastEnd: -Infinity }, // alt-iç (önde)
      { up: true, lane: 2, lastEnd: -Infinity }, // üst-dış (arkada)
      { up: false, lane: 2, lastEnd: -Infinity }, // alt-dış (arkada)
    ];
    let maxUp = 0;
    let maxDown = 0;
    let maxChipEnd = 0;
    const placed: (HTask & {
      x: number;
      chipX: number;
      lane: number;
      up: boolean;
    })[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      const x = dayDiff(min, t.day) * dayPx;
      // hafif organik yatay ofset (deterministik hash) — merkez yığılmasını kırar
      const desired = x + ((hash(t.id) % 13) - 6);
      let ri = -1;
      for (let k = 0; k < rails.length; k++) {
        const cand = (i + k) % rails.length; // round-robin başlangıç
        if (desired - CHIP_W / 2 >= rails[cand].lastEnd + CHIP_GAP) {
          ri = cand;
          break;
        }
      }
      let chipX = desired;
      if (ri === -1) {
        // hepsi dolu → en erken boşalan ray + sağa itme
        ri = 0;
        for (let k = 1; k < rails.length; k++) {
          if (rails[k].lastEnd < rails[ri].lastEnd) ri = k;
        }
        chipX = rails[ri].lastEnd + CHIP_GAP + CHIP_W / 2;
      }
      rails[ri].lastEnd = chipX + CHIP_W / 2;
      maxChipEnd = Math.max(maxChipEnd, chipX + CHIP_W / 2);
      const { up, lane } = rails[ri];
      if (up) maxUp = Math.max(maxUp, lane);
      else maxDown = Math.max(maxDown, lane);
      placed.push({ ...t, x, chipX, lane, up });
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
      // sağa itilen kart kanvası aşabilir → genişliği itmeye göre uzat
      width: Math.max(span * dayPx, maxChipEnd + CHIP_GAP),
      placed,
      placedEvents,
      months,
      todayX: dayDiff(min, today) * dayPx,
      maxUp,
      maxDown,
    };
  }, [tasks, events, today, dayPx]);

  const PAD = 40;
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
        "relative w-full rounded-[26px] border border-[color:var(--glass-border)] p-4 sm:p-5 " +
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
          {floating.length > 0 && <> · {floating.length} tarihsiz süzülüyor</>}
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

            {/* Görev boncukları + kartları (leader line ile bağlı) */}
            {model.placed.map((t) => (
              <BandTask
                key={t.id}
                task={t}
                axisY={axisY}
                left={PAD + t.x}
                chipDx={t.chipX - t.x}
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

      {/* ── Tarihsiz görevler — çizgiye bağlı değil, kenarlarda süzülür ────
          Katman kartın ~12px DIŞINA taşar (kap overflow-hidden değil, kırpmaz);
          z-20 kardeş katman = scroller içeriğinin üstünde, "Bugüne dön" (z-30)
          altında. Negatif z-index kabı yok (stacking-context tuzağı). */}
      {floating.length > 0 && (
        <div className="pointer-events-none absolute -inset-3 z-20">
          {floating.slice(0, FLOAT_SLOTS.length).map((f, i) => (
            <FloatingChip key={f.id} item={f} slot={i} />
          ))}
          {floating.length > FLOAT_SLOTS.length && (
            <span
              className="text-muted-foreground absolute right-[38%] top-0.5 rounded-full border border-[color:var(--glass-border)] bg-card px-2 py-0.5 text-[10px] font-medium shadow-[var(--lift-sm)]"
              title="Diğer tarihsiz görevler Kapsam bölümünde"
            >
              +{floating.length - FLOAT_SLOTS.length} tarihsiz
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* Süzülen tarihsiz çipler için deterministik kenar yuvaları — merkez (BUGÜN
   odağı) ve başlık satırı boş bırakılır; kenarlarda ~12px dışa taşarlar. */
const FLOAT_SLOTS: React.CSSProperties[] = [
  { left: "-4px", top: "34%" },
  { right: "-4px", top: "22%" },
  { left: "14%", bottom: "-2px" },
  { right: "22%", bottom: "0px" },
  { left: "44%", bottom: "-4px" },
  { right: "-2px", bottom: "30%" },
];

/** Tarihsiz görev çipi — leader line'sız, yavaş/bölgesel float animasyonlu. */
function FloatingChip({ item: f, slot }: { item: HFloatTask; slot: number }) {
  const taskColor = f.color ? TASK_COLOR_BY_KEY.get(f.color) : null;
  const ink = taskColor?.ink ?? "var(--tl-todo)";
  const h = hash(f.id);
  const dur = 9 + (h % 6); // 9–14 sn — çip başına farklı tempo
  const delay = -(h % 7); // negatif gecikme = fazlar senkron başlamaz
  return (
    <Link
      href={f.href}
      title={f.title}
      className="focus-visible:ring-ring/60 pointer-events-auto absolute block rounded-full outline-none focus-visible:ring-2"
      style={{
        ...FLOAT_SLOTS[slot],
        animation: `tl-float-${slot % 2 ? "b" : "a"} ${dur}s ease-in-out ${delay}s infinite`,
      }}
    >
      <span className="bg-card flex max-w-48 items-center gap-1.5 rounded-full border border-[color:var(--glass-border)] px-2.5 py-1 shadow-[var(--lift-sm)] transition-[scale,box-shadow] duration-300 ease-[var(--ease-premium)] hover:scale-105 hover:shadow-[var(--lift)] dark:border-[color:oklch(1_0_0/0.1)]">
        {f.icon && (
          <span
            aria-hidden
            className="inline-block size-[13px] shrink-0"
            style={{
              backgroundColor: ink,
              maskImage: `url(${taskIconUrl(f.icon)})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${taskIconUrl(f.icon)})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        )}
        <span
          className={
            "truncate text-[11px] font-semibold " +
            (f.done ? "text-muted-foreground line-through" : "text-foreground")
          }
        >
          {f.title}
        </span>
        {f.priority && (
          <span className="text-muted-foreground shrink-0 font-mono text-[9px] font-bold">
            {f.priority}
          </span>
        )}
      </span>
    </Link>
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
      className="absolute z-[5] inline-block shrink-0 rounded-full transition-[translate,scale,opacity] duration-500 ease-[var(--ease-premium)] hover:scale-125"
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

/** Eksen üstünde/altında bir görev: 3B boncuk + eğik leader line + cam kart. */
function BandTask({
  task: t,
  axisY,
  left,
  chipDx,
  today,
  onClickCapture,
}: {
  task: HTask & { lane: number; up: boolean };
  axisY: number;
  left: number;
  /** Kartın boncuğa göre yatay ofseti (çakışma itmesi + organik jitter). */
  chipDx: number;
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

  const front = t.lane === 1; // iç ray önde, dış ray arkada (derinlik)
  const stem = t.lane * ROW - 10; // boncuktan kart kenarına dikey uzaklık
  const chipTop = t.up ? axisY - stem - CHIP_H : axisY + stem;

  // Leader line kutusu — boncuk (yerel x=0) ile kart merkezi (x=chipDx)
  // arasında eğik ince çizgi; kart nereye itilirse itilsin aidiyet görünür.
  const lineTop = t.up ? axisY - stem : axisY + 8;
  const lineH = Math.max(1, stem - 8);
  const boxL = Math.min(0, chipDx) - 1;
  const boxW = Math.abs(chipDx) + 2;
  const beadX = -boxL; // yerel koordinatta boncuk
  const chipXL = chipDx - boxL; // yerel koordinatta kart merkezi

  return (
    <div
      ref={ref}
      className={
        "absolute hover:z-40 focus-within:z-40 " + (front ? "z-20" : "z-10")
      }
      style={{ left: `${left}px`, top: 0, bottom: 0 }}
    >
      {/* Leader line (boncuk → kart) — kartın altında kalır */}
      <svg
        aria-hidden
        className="absolute overflow-visible"
        style={{
          left: `${boxL}px`,
          top: `${lineTop}px`,
          width: `${boxW}px`,
          height: `${lineH}px`,
          opacity: shown ? 0.55 : 0,
          transition: "opacity 500ms var(--ease-premium)",
        }}
      >
        <line
          x1={beadX}
          y1={t.up ? lineH : 0}
          x2={chipXL}
          y2={t.up ? 0 : lineH}
          stroke={ink}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>
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

      {/* Cam kart — zemin OPAK-yakın (--glass-strong): alttaki küre/çizgi
          metni asla bozamaz. İç ray önde (gölgeli), dış ray arkada (küçük). */}
      <Link
        href={t.href}
        onClickCapture={onClickCapture}
        className="focus-visible:ring-ring/60 group absolute block w-[168px] -translate-x-1/2 rounded-xl outline-none focus-visible:ring-2"
        style={{
          left: `${chipDx}px`,
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
            "relative overflow-hidden rounded-xl border border-l-[3px] border-[color:var(--glass-border)] px-2.5 py-1.5 transition-[translate,scale,box-shadow] duration-300 ease-[var(--ease-premium)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--lift),0_0_18px_var(--task-glow)] " +
            "[background-color:var(--glass-strong)] [background-image:var(--glass-sheen)] dark:border-[color:oklch(1_0_0/0.08)] dark:[background-image:none] " +
            (front
              ? "shadow-[var(--lift-sm)] "
              : "scale-[0.96] shadow-none group-hover:scale-100 ") +
            (overdue ? "tl-overdue-neon " : "")
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
