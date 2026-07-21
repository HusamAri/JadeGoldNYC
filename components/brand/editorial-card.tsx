import { cn } from "@/lib/utils";
import { ScrollPinnedVideo } from "@/components/brand/scroll-pinned-video";
import { LazyLoopVideo } from "@/components/brand/lazy-loop-video";

/**
 * Editorial marka kartı — çıkıntı (raised) kutunun tamamını kaplayan ürün çekimi
 * + marka tonlu (charcoal→şeffaf) scrim, üzerinde altın eyebrow ve sakin serif
 * başlık. Sessiz lüks; az ve asimetrik kullanılır, veri kartlarında değil.
 *
 * `video` verilirse kart, kaydırma boyunca EKRANDA SABİT kalan (position:
 * sticky) bir video kutusuna dönüşür — yalnızca içindeki kare kaydırma
 * ilerlemesine göre değişir (bkz. ScrollPinnedVideo). `image` her zaman
 * poster/geri dönüş görseli olarak kalır.
 *
 * `compact` verilirse tam ekran kaydırma rayı KULLANILMAZ — sabit, makul
 * yükseklikte (varsayılan 320px) normal bir kutuda sessiz döngülü video
 * oynar. Veri yoğun sayfalarda (ör. Panel) kaydırma maliyeti olmadan marka
 * anı için kullanılır.
 */
export function EditorialCard({
  image,
  video,
  trackHeightVh = 180,
  compact = false,
  heightClassName = "h-[320px]",
  eyebrow,
  title,
  subtitle,
  align = "end",
  className,
}: {
  image: string;
  video?: string;
  trackHeightVh?: number;
  compact?: boolean;
  heightClassName?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "end";
  className?: string;
}) {
  const overlay = (
    <>
      {/* marka tonlu scrim — charcoal'dan şeffafa */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#131313]/88 via-[#131313]/35 to-[#131313]/5"
        aria-hidden
      />
      <div
        className={cn(
          "relative flex h-full flex-col p-7 md:p-9",
          align === "end" ? "justify-end" : "justify-start",
        )}
      >
        {eyebrow && (
          <span className="text-[11px] font-medium tracking-[0.3em] text-[oklch(0.87_0.1_86)] uppercase [font-family:var(--font-index)]">
            {eyebrow}
          </span>
        )}
        <h3 className="mt-2 font-serif text-2xl leading-tight text-white md:text-[1.7rem]">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-2 max-w-sm text-sm text-white/80">{subtitle}</p>
        )}
      </div>
    </>
  );

  if (video && compact) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] shadow-[var(--lift-natural-lg)]",
          heightClassName,
          className,
        )}
      >
        {/* Görünüme gelmeden video İNMEZ (panelde 10MB+ tasarruf) — poster taşır. */}
        <LazyLoopVideo
          src={video}
          poster={image}
          className="absolute inset-0 size-full object-cover"
        />
        {overlay}
      </div>
    );
  }

  if (video) {
    return (
      <ScrollPinnedVideo
        src={video}
        poster={image}
        trackHeightVh={trackHeightVh}
        className="overflow-hidden rounded-[1.75rem] shadow-[var(--lift-natural-lg)]"
      >
        {overlay}
      </ScrollPinnedVideo>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] shadow-[var(--lift-natural-lg)]",
        className,
      )}
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')` }}
        aria-hidden
      />
      {overlay}
    </div>
  );
}
