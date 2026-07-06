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
 *
 * Renk TEMA UYUMLUDUR: SVG dosyaları CSS `mask` olarak kullanılır ve
 * `--brand-mark` tokeniyle boyanır (aydınlıkta koyu antik altın, koyuda parlak
 * altın) — böylece mark her iki modda da AA kontrastla okunur.
 */

/** Tek renkli SVG'yi maske olarak kullanan tema-uyumlu boya stili. */
const maskStyle = (src: string): React.CSSProperties => ({
  maskImage: `url(${src})`,
  WebkitMaskImage: `url(${src})`,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  maskSize: "contain",
  WebkitMaskSize: "contain",
});

export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "wordmark";
}) {
  // Mark kabı: ince nm-raised, concentric köşeler; iç padding ile monogram
  // nefes alır. Maskelenen altın SVG, kart/sidebar zemininde AA kontrastta.
  const mark = (
    <span
      className={cn(
        "nm-raised-sm relative flex size-9 shrink-0 items-center justify-center rounded-2xl p-[18%] ring-1 ring-accent/30",
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-brand-mark block size-full"
        style={maskStyle("/brand/logo/monogram-jg.svg")}
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
      <span
        aria-hidden
        className="bg-brand-mark block h-5 w-[6.9rem]"
        style={maskStyle("/brand/logo/logo-wordmark.svg")}
      />
    </span>
  );
}
