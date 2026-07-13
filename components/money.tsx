import { formatMoneyParts } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Para tutarı — büyük tam sayı + küçük, hafif AŞAĞI kaydırılmış ondalık (kuruş).
 * Estetik "hero rakam" görünümü: $14.166<sub>,73</sub>. Ondalık soluk + küçük,
 * tam sayının hizasını bozmadan alt tarafa oturur.
 */
export function Money({
  cents,
  currency = "USD",
  locale = "tr-TR",
  className,
  fractionClassName,
}: {
  cents: number | null | undefined;
  currency?: string;
  locale?: string;
  className?: string;
  /** Ondalık parçanın ek sınıfı (varsayılan: küçük, soluk, aşağı kaydırılmış). */
  fractionClassName?: string;
}) {
  const { main, fraction } = formatMoneyParts(cents, currency, locale);
  return (
    <span className={cn("tabular-nums", className)}>
      {main}
      {fraction && (
        <span
          className={cn(
            "text-[0.62em] font-medium opacity-60 [vertical-align:-0.08em]",
            fractionClassName,
          )}
        >
          {fraction}
        </span>
      )}
    </span>
  );
}
