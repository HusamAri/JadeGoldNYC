import { cn } from "@/lib/utils";

/**
 * Spatial hero köşe işaretleri — referans: Spatial.html `.hero-head .corner`.
 * Birebir değerler: 46×46px kutu, 2.5px `oklch(0.78 0.09 285 / 0.85)` çizgi,
 * YALNIZ köşe yayları (iki kenar + 20px köşe radius'u). Saf dekor:
 * aria-hidden + pointer-events-none; ebeveyn `relative` olmalıdır.
 */
const CORNER =
  "absolute size-[46px] border-0 border-solid border-[oklch(0.78_0.09_285_/_0.85)]";

export function CornerMarks({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <span
        className={cn(
          CORNER,
          "-top-3 -left-3 rounded-tl-[20px] border-t-[2.5px] border-l-[2.5px]",
        )}
      />
      <span
        className={cn(
          CORNER,
          "-top-3 -right-3 rounded-tr-[20px] border-t-[2.5px] border-r-[2.5px]",
        )}
      />
      <span
        className={cn(
          CORNER,
          "-bottom-3 -left-3 rounded-bl-[20px] border-b-[2.5px] border-l-[2.5px]",
        )}
      />
      <span
        className={cn(
          CORNER,
          "-bottom-3 -right-3 rounded-br-[20px] border-b-[2.5px] border-r-[2.5px]",
        )}
      />
    </div>
  );
}
