"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({
  className,
  containerClassName,
  stickyHeader = false,
  ...props
}: React.ComponentProps<"table"> & {
  /** Kaydırma kabının sınıfı — dikey sınır vermek için (örn. `max-h-[70vh]`). */
  containerClassName?: string;
  /**
   * Başlık satırı, kabın üstüne yapışsın mı? SESSİZCE ETKİSİZ OLMASIN diye
   * opt-in: `position:sticky` en yakın SCROLLPORT'a göre yapışır ve bu kap
   * `overflow-x:auto` taşıdığı için scrollport KABIN KENDİSİDİR (viewport
   * değil). Yani yapışmanın bir anlamı olması için kaba dikey bir sınır
   * (`containerClassName="max-h-…"`) verilmelidir; bu bayrak ikisini birlikte
   * açar. Varsayılan `false` → mevcut ~40 tablo bit-bit aynı kalır.
   */
  stickyHeader?: boolean;
}) {
  // Kaydırma affordance'ı: içerik sağa taşıyorsa kabın sağ kenarı zemine
  // doğru solar (fade maskesi) — kullanıcı tablonun kaydırılabilir olduğunu
  // görür; sona kaydırınca maske kalkar. Salt görsel, davranış değişmez.
  // AYNI dinleyici dikey kaydırmayı da okur (yeni listener AÇILMAZ): başlık
  // ancak içerik altına kaydığında gölge basar — gölge KEYFRAME değil,
  // durum geçişidir.
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [fadeRight, setFadeRight] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setFadeRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
      setScrolled(el.scrollTop > 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      data-sticky-head={stickyHeader ? "true" : undefined}
      data-scrolled={scrolled ? "true" : undefined}
      className={cn(
        "relative w-full overflow-x-auto",
        stickyHeader && "overflow-y-auto",
        fadeRight &&
          "[mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)]",
        containerClassName,
      )}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium tabular-nums [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Hairline satır (açık: var(--border), koyu: beyaz %7 — lume kuralı);
        // hover: açıkta hafif accent yıkaması, koyuda beyaz ışık banyosu.
        // Süre 300ms → 150ms: vurgu imlece YETİŞSİN (300ms'de satırlar arası
        // gezinirken vurgu geride kalıyordu).
        "border-b transition-[color,background-color,box-shadow] duration-150 ease-[var(--ease-quiet)]",
        // Klavye eşitliği: satır içindeki bir öğe odaklandığında satır da
        // hover'daki gibi aydınlanır — fare kullanmayan aynı bilgiyi görür.
        "hover:bg-accent/30 focus-within:bg-accent/30 data-[state=selected]:bg-accent/50",
        "dark:hover:bg-white/[0.04] dark:focus-within:bg-white/[0.04] dark:data-[state=selected]:bg-white/[0.07]",
        // Kontak gölgesi: satır zeminden 1px kopar (A kulvarı --row-contact).
        // NOT: preflight `border-collapse: collapse` uygularken bazı tarayıcılar
        // <tr> box-shadow'unu boyamaz — o durumda sessizce no-op'tur, asıl
        // geri bildirim zemin renginde yaşar.
        "hover:shadow-[var(--row-contact)] focus-within:shadow-[var(--row-contact)]",
        // Tıklanabilir satır (`data-clickable`): imleç + basma karşılığı.
        // Satır ÖLÇEKLENMEZ/EĞİLMEZ — tabular hizayı ve tıklama hedefini
        // bozmamak için basış zemin koyulaşması + kontağın düzleşmesiyle
        // anlatılır (transform yok, layout yok).
        "data-[clickable]:cursor-pointer data-[clickable]:active:bg-accent/55 data-[clickable]:active:shadow-none dark:data-[clickable]:active:bg-white/[0.09]",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Editorial başlık (.idx dili) — mono, uppercase, geniş letterspacing.
        "text-muted-foreground h-10 px-2 text-left align-middle font-mono text-[11px] font-medium tracking-[0.16em] uppercase whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        // Yapışkan başlık — YALNIZ kap `stickyHeader` ile açtığında (bkz. Table).
        // Opak `bg-card` şart: yarı saydam kalsa altından kayan satırlar
        // başlığın içinden geçerdi. Gölge yalnız içerik altına kaydığında
        // biner (data-scrolled) — hiyerarşi ancak ayrışma varsa anlatılır.
        "[[data-sticky-head]_&]:bg-card [[data-sticky-head]_&]:sticky [[data-sticky-head]_&]:top-0 [[data-sticky-head]_&]:z-10 [[data-sticky-head]_&]:transition-shadow [[data-sticky-head]_&]:duration-200 [[data-sticky-head]_&]:ease-[var(--ease-quiet)]",
        "[[data-sticky-head][data-scrolled=true]_&]:shadow-[var(--sticky-head-shadow)]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // Sayısal hücreler hizalı okunur (tabular rakamlar — readout dili).
        // Sağa hizalı (tutar/adet) hücreler index yüzüyle okunur: JetBrains
        // readout; koyuda lume beyazı + 0 0 14px beyaz ışıma (lab reçetesi).
        // NOT: global `whitespace-nowrap` kaldırıldı — uzun metin hücreleri
        // (açıklama/yorum) tabloyu kartın dışına itiyordu; nowrap gereken
        // hücreler (tarih/tutar/işlem) kendi className'inde belirtir.
        "p-2 align-middle tabular-nums [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        "[&.text-right]:[font-family:var(--font-index)] [&.text-right]:text-[13px] dark:[&.text-right]:text-white dark:[&.text-right]:[text-shadow:0_0_14px_rgba(255,255,255,0.4)]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
