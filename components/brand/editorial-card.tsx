import { cn } from "@/lib/utils";

/**
 * Editorial marka kartı — çıkıntı (raised) kutunun tamamını kaplayan ürün çekimi
 * + marka tonlu (charcoal→şeffaf) scrim, üzerinde altın eyebrow ve sakin serif
 * başlık. Sessiz lüks; az ve asimetrik kullanılır, veri kartlarında değil.
 */
export function EditorialCard({
  image,
  eyebrow,
  title,
  subtitle,
  align = "end",
  className,
}: {
  image: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-raised)]",
        className,
      )}
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')` }}
        aria-hidden
      />
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
          <span className="text-[11px] font-medium tracking-[0.3em] text-[oklch(0.87_0.1_86)] uppercase">
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
    </div>
  );
}
