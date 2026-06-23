import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Jade Gold NYC marka markı.
 *
 * Gerçek antik altın JG monogramını (yerel SVG) zarif, minimal bir
 * neumorphic kapta sunar. `className` kabın boyutunu/yerleşimini kontrol eder
 * (mevcut çağrı yerleri korunur: <Logo />, <Logo className="size-11" />).
 *
 * - variant="mark"     → sadece monogram (varsayılan; dar/küçük alanlar)
 * - variant="wordmark" → monogram + JADE GOLD kelime markası kilidi (geniş alan)
 */
export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "wordmark";
}) {
  // Mark kabı: ince nm-raised, concentric köşeler; iç padding ile monogram
  // nefes alır. Şeffaf zeminli altın SVG, kart/sidebar zemininde AA kontrastta.
  const mark = (
    <span
      className={cn(
        "nm-raised-sm relative flex size-9 shrink-0 items-center justify-center rounded-2xl p-[18%] ring-1 ring-accent/30",
        className,
      )}
    >
      <Image
        src="/brand/logo/monogram-jg.svg"
        alt=""
        fill
        sizes="44px"
        className="object-contain p-[14%]"
        priority
      />
    </span>
  );

  if (variant === "mark") {
    return (
      <span role="img" aria-label="Jade Gold NYC" className="inline-flex">
        {mark}
      </span>
    );
  }

  return (
    <span role="img" aria-label="Jade Gold NYC" className="inline-flex items-center gap-2.5">
      {mark}
      <Image
        src="/brand/logo/logo-wordmark.svg"
        alt=""
        width={148}
        height={28}
        className="h-5 w-auto"
        priority
      />
    </span>
  );
}
