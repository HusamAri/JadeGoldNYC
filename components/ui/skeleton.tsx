import * as React from "react";

import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════
   İSKELET ARKETİPLERİ — "dondu" hissinin panel genelindeki tek kaynağı.
   ───────────────────────────────────────────────────────────────────────
   Tez: donma hissi animasyon eksikliği değil, GERİ BİLDİRİM eksikliğidir.
   Bu yüzden buradaki iskeletler jenerik gri kutu değil; gerçek yüzeyin
   GEOMETRİSİNİ (aynı yükseklik, aynı grid, aynı kolon sayısı) taşır →
   içerik geldiğinde layout kaymaz, geçiş sert okunmaz.

   PERFORMANS SÖZLEŞMESİ (app/globals.css bütçe bloğu md.8):
   • Ekran başına eşzamanlı NABIZ <= 3 blok. Bu dosyada nabız yalnız iki
     yerde açıktır: PageHeaderSkeleton başlık çubuğu + LoadingNote noktası.
     Diğer TÜM arketipler `pulse={false}` ile statiktir ve derinliği
     .jg-skel-ladder'ın STATİK opaklık merdiveninden alır (0 kare maliyeti).
   • Anime edilen tek özellik: opacity.
   • YASAK (bu dosyada bilerek hiç kullanılmaz): backdrop-filter, blur,
     shimmer / background-position animasyonu, position:fixed,
     pointer-events'i kapatan örtü. İskelet `main` içinde BÖLGESEL kalır;
     sidebar/topbar canlı ve tıklanabilir kalır.
   • prefers-reduced-motion: nabız `motion-safe:` varyantıyla sönümlenir;
     GERİ BİLDİRİM silinmez — LoadingNote'un metni her koşulda okunur.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Tek iskelet yüzeyi (kazınmış oluk). Mevcut API korunur: `className` ile
 * geometri verilir, `rounded-lg` varsayılan kalır.
 *
 * @param pulse Nabız. Varsayılan `true` (eski davranış). Merdivenli
 *   (ladder) kaplarda ve çok tekrarlı bloklarda MUTLAKA `false` verin —
 *   yoksa 25 satırlık tablo 25 ayrı nabız hasarı yaratır. `false` iken
 *   `animate-none` utility'si .jg-skel'in kendi nabzını da bilerek ezer
 *   (utility > @layer components; burada ezme İSTENEN davranıştır).
 */
function Skeleton({
  className,
  pulse = true,
  ...props
}: React.ComponentProps<"div"> & { pulse?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Oluk yüzeyi + koyu tema karşılığı tek yerde: .jg-skel (globals A4).
        // Nabzı da .jg-skel'in KENDİSİ taşır (--skel-pulse + --ease-premium):
        // burada `animate-pulse` yazılsaydı Tailwind'in 2s cubic-bezier'i
        // (utility > components) kazanır, iskelet ritmi tema dilinin dışına
        // düşerdi. `pulse=false` yalnız o zaman ezer — merdivenli kaplarda
        // nabzı BİLEREK susturmak için (25 satır = 25 hasar bölgesi olmasın).
        "jg-skel rounded-lg",
        pulse ? null : "animate-none",
        className,
      )}
      {...props}
    />
  );
}

/* ── Yardımcı: deterministik kolon genişlikleri ───────────────────────────
   Math.random YASAK (SSR/CSR uyuşmazlığı). Sabit desen "içerik varmış"
   izlenimini verir; son kolon her zaman dar (işlem/aksiyon kolonu). */
const CELL_W = ["w-[70%]", "w-[52%]", "w-[84%]", "w-[44%]", "w-[64%]", "w-[76%]"];
function cellWidth(row: number, col: number): string {
  return CELL_W[(row * 3 + col * 2) % CELL_W.length];
}

/** Cam kart kabının iskelet karşılığı — blur YOK, yalnız kenar + yarıçap. */
const FRAME =
  "rounded-[1.75rem] border border-[color:var(--glass-border)] dark:border-white/[0.05]";

/**
 * İskelet ekranının KÖKÜ — gerçek sayfaların `page-stack relative z-0 pb-32`
 * kabıyla birebir aynı.
 *
 * Giriş hareketi tek seferliktir ve YALNIZ opacity anime eder:
 * `delay-150 + fill-mode-both` sayesinde iskelet ilk 150ms boyunca opacity 0
 * durur → hızlı route geçişlerinde "iskelet parlaması" (flash) hiç görünmez,
 * yavaş geçişlerde ise yumuşakça belirir. Böylece içerik geldiğinde de sert
 * bir sıçrama okunmaz. reduced-motion'da hareket hiç bağlanmaz (motion-safe).
 */
function SkeletonScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "page-stack relative z-0 pb-32",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-both motion-safe:delay-150 motion-safe:duration-500",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sayfa başlığı yer tutucusu — PageHeader ile birebir metrik:
 * `mb-8 space-y-5 md:mb-10`, editorial idx satırı, 4xl/5xl kahraman başlık,
 * açıklama satırı ve sağdaki aksiyon pill'leri.
 * Ekranın TEK nabız kaynağıdır (LoadingNote ile birlikte 2 → bütçe içinde).
 */
function PageHeaderSkeleton({
  actions = 2,
  className,
}: {
  /** Sağ üstteki buton sayısı (gerçek sayfayla eşleşirse satır kaymaz). */
  actions?: number;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 space-y-5 md:mb-10", className)} aria-hidden>
      {/* Editorial idx satırı: etiket + 36px primary bar + uzayan hairline. */}
      <div className="flex items-center gap-3">
        <Skeleton pulse={false} className="h-[10px] w-32 rounded-full" />
        <span className="bg-primary/50 h-px w-9" />
        <span className="bg-border h-px flex-1" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          {/* NABIZ 1/3 — kahraman başlık nefes alır. */}
          <Skeleton className="h-9 w-56 rounded-xl sm:w-72 md:h-12 md:w-80" />
          <Skeleton pulse={false} className="h-4 w-[min(46ch,100%)] rounded-md" />
        </div>
        {actions > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: actions }).map((_, i) => (
              <Skeleton
                key={i}
                pulse={false}
                className="h-10 w-32 rounded-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Metinsel ilerleme sinyali. reduced-motion kullanıcısında hareket sönse de
 * "çalışıyor" bilgisi BURADA yaşar (bütçe md.9: hareketi söndür, geri
 * bildirimi silme). `role="status"` ile ekran okuyucuya da duyurulur.
 */
function LoadingNote({
  label = "Veriler alınıyor…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "text-muted-foreground flex items-center gap-2.5 font-mono text-[11px] tracking-[0.16em] uppercase",
        className,
      )}
    >
      {/* NABIZ 2/3 — 6px'lik tek nokta; hasar bölgesi ihmal edilebilir. */}
      <span
        aria-hidden
        className="bg-primary/70 size-1.5 shrink-0 rounded-full motion-safe:animate-pulse"
      />
      {label}
    </p>
  );
}

/** KPI ızgarasının kolon sayısına göre gerçek sayfa sınıfları (literal). */
const KPI_GRID: Record<number, string> = {
  3: "grid grid-cols-2 gap-5 md:grid-cols-3",
  4: "grid grid-cols-2 gap-5 md:grid-cols-4",
  5: "grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-5",
  6: "grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-6",
};

/**
 * KPI şeridi. Kutu metriği KpiCard ile birebir: `rounded-[18px]` (koyuda
 * 26px), `px-6 py-6`, 40px etiket yuvası + ~25px değer satırı = ~113px.
 * Kap `.jg-skel-ladder` → soldan sağa STATİK opaklık merdiveni (derinlik,
 * sıfır kare maliyeti).
 */
function KpiRowSkeleton({
  count = 4,
  cols,
  className,
}: {
  count?: number;
  /** Izgara kolon sayısı; verilmezse `count` (3–6 arası kırpılır). */
  cols?: number;
  className?: string;
}) {
  const c = Math.min(6, Math.max(3, cols ?? count));
  return (
    <div aria-hidden className={cn(KPI_GRID[c], "jg-skel-ladder", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[18px] border border-[color:var(--glass-border)] px-6 py-6 dark:rounded-[26px] dark:border-white/[0.05]"
        >
          {/* Etiket yuvası — gerçek kartta min-h-[2.5rem] (2 satır yer ayırır). */}
          <div className="flex h-10 items-start">
            <Skeleton pulse={false} className="h-[10px] w-3/4 rounded-full" />
          </div>
          <Skeleton pulse={false} className="h-[25px] w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/**
 * Tablo yüzeyi. Gerçek tablo Card (rounded-[1.75rem], py-7, px-7) içinde
 * yaşadığı için kap da o metriği taşır; başlık satırı 40px (TableHead h-10),
 * gövde satırları 36px (TableCell p-2 + sm satır) → sayfa gelince kayma yok.
 * Satır kabı `.jg-skel-ladder`: 25 satır 25 nabız DEĞİL, statik merdiven.
 */
function TableSkeleton({
  rows = 8,
  cols = 5,
  toolbar = true,
  className,
}: {
  rows?: number;
  cols?: number;
  /** Arama + filtre şeridi (gerçek tablolarda tablonun üstünde durur). */
  toolbar?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn(FRAME, "px-7 py-7", className)}>
      {toolbar && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton pulse={false} className="h-9 w-full rounded-xl sm:w-64" />
          <Skeleton pulse={false} className="h-9 w-full rounded-xl sm:w-40" />
          <Skeleton pulse={false} className="h-9 w-full rounded-xl sm:w-40" />
        </div>
      )}
      {/* Başlık satırı — mono/uppercase başlıklar kısa çubuklarla temsil. */}
      <div className="border-border flex h-10 items-center gap-4 border-b">
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className={cn(
              c === cols - 1 ? "w-16 shrink-0" : "min-w-0 flex-1",
              "flex",
              c === cols - 1 && "justify-end",
            )}
          >
            <Skeleton
              pulse={false}
              className={cn(
                "h-[8px] rounded-full",
                c === cols - 1 ? "w-10" : "w-[56%]",
              )}
            />
          </div>
        ))}
      </div>
      <div className="jg-skel-ladder">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="border-border/60 flex h-9 items-center gap-4 border-b last:border-b-0"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={cn(
                  c === cols - 1 ? "w-16 shrink-0" : "min-w-0 flex-1",
                  "flex",
                  c === cols - 1 && "justify-end",
                )}
              >
                <Skeleton
                  pulse={false}
                  className={cn(
                    "h-[10px] rounded-full",
                    c === cols - 1 ? "w-8" : cellWidth(r, c),
                  )}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Görsel ızgarası en-boy oranları (literal sınıf — JIT taraması için). */
const ASPECT: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[4/5]",
};

/**
 * Kart/galeri ızgarası — görsel bloğu + iki metin satırı. Görsel yüklenirken
 * algılanan bekleme en uzun burada olduğu için oran birebir korunur.
 */
function CardGridSkeleton({
  count = 9,
  aspect = "square",
  className,
}: {
  count?: number;
  aspect?: "square" | "video" | "portrait";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "jg-skel-ladder grid grid-cols-2 gap-5 md:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(FRAME, "space-y-3 p-4")}>
          <Skeleton
            pulse={false}
            className={cn(ASPECT[aspect], "w-full rounded-[1.25rem]")}
          />
          <Skeleton pulse={false} className="h-[11px] w-3/4 rounded-full" />
          <Skeleton pulse={false} className="h-[9px] w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Form iskeleti — etiket (11px) + alan (h-10) çiftleri, sonda gönder pill'i.
 * Gerçek formlarla aynı dikey ritim (space-y-5) → kayma yok.
 */
function FormSkeleton({
  fields = 6,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn(FRAME, "px-7 py-7", className)}>
      <div className="jg-skel-ladder space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton pulse={false} className="h-[10px] w-28 rounded-full" />
            <Skeleton pulse={false} className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mt-7 flex gap-2">
        <Skeleton pulse={false} className="h-10 w-32 rounded-full" />
        <Skeleton pulse={false} className="h-10 w-24 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Panel/kart yer tutucusu — metin kartı veya grafik alanı.
 * `bodyHeight` verilirse gövde tek blok olur (grafik/hero şeridi);
 * verilmezse `lines` kadar metin satırı çizilir.
 */
function PanelSkeleton({
  lines = 3,
  bodyHeight,
  title = true,
  className,
}: {
  lines?: number;
  /** Örn. "h-[220px]" — grafik alanı. Literal sınıf olarak geçirin. */
  bodyHeight?: string;
  title?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn(FRAME, "space-y-4 px-7 py-7", className)}>
      {title && (
        <Skeleton pulse={false} className="h-4 w-40 rounded-md" />
      )}
      {bodyHeight ? (
        <Skeleton
          pulse={false}
          className={cn("w-full rounded-2xl", bodyHeight)}
        />
      ) : (
        <div className="jg-skel-ladder space-y-2.5">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              pulse={false}
              className={cn(
                "h-[11px] rounded-full",
                i === lines - 1 ? "w-2/5" : "w-full",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Detay sayfası iskeleti — başlık + marka görsel şeridi (PageHeader `image`
 * ile aynı 96/112px yükseklik) + künye tablosu.
 */
function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("page-stack", className)}>
      <div aria-hidden className="space-y-5">
        <Skeleton
          pulse={false}
          className="h-24 w-full rounded-[1.5rem] md:h-28"
        />
        <PageHeaderSkeleton actions={1} className="mb-0 md:mb-0" />
      </div>
      <TableSkeleton rows={8} cols={4} toolbar={false} />
    </div>
  );
}

export {
  Skeleton,
  SkeletonScreen,
  PageHeaderSkeleton,
  LoadingNote,
  KpiRowSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  FormSkeleton,
  PanelSkeleton,
  DetailSkeleton,
};
