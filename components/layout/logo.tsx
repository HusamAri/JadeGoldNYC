import { cn } from "@/lib/utils";

/**
 * Marka markı — marka kapsamına duyarlı.
 *
 * Bileşen HER İKİ markın işaretini de basar; hangisinin görüneceğini
 * `html[data-brand]` kapsamındaki CSS kuralları belirler (.brand-jg /
 * .brand-pf — bkz. globals.css). Böylece sunucu bileşeni kalır, org
 * değişiminde flash olmaz:
 *   • jade-gold  → antik altın JG monogramı (yerel SVG maskesi)
 *   • artifact   → faset elmas platform markı (satır içi SVG)
 *
 * - variant="mark"     → sadece işaret (varsayılan; dar/küçük alanlar)
 * - variant="wordmark" → işaret + kelime markası (geniş alan)
 *
 * Renk TEMA UYUMLUDUR: her iki mark da `--brand-mark` tokeniyle boyanır
 * (aydınlık/koyu modda AA kontrast iki temada da ayarlıdır).
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

/** Artifact platform markı — faset elmas (currentColor ile boyanır). */
function ArtifactMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3 20.5 9.5 12 21 3.5 9.5Z" />
      <path d="M3.5 9.5h17" />
      <path d="M12 3 8.4 9.5 12 21l3.6-11.5Z" />
    </svg>
  );
}

export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "wordmark";
}) {
  // Mark kabı: ince nm-raised, concentric köşeler; iç padding ile işaret
  // nefes alır. İki markın işareti de basılır, kapsam CSS'i birini gizler.
  const mark = (
    <span
      className={cn(
        "nm-raised-sm relative flex size-9 shrink-0 items-center justify-center rounded-2xl p-[18%] ring-1 ring-accent/30",
        className,
      )}
    >
      <span
        aria-hidden
        className="brand-jg bg-brand-mark block size-full"
        style={maskStyle("/brand/logo/monogram-jg.svg")}
      />
      <ArtifactMark className="brand-pf text-brand-mark block size-full" />
    </span>
  );

  if (variant === "mark") {
    return (
      <span role="img" aria-label="Panel markası" className="inline-flex">
        {mark}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Panel markası"
      className="inline-flex items-center gap-2.5"
    >
      {mark}
      <span
        aria-hidden
        className="brand-jg bg-brand-mark block h-5 w-[6.9rem]"
        style={maskStyle("/brand/logo/logo-wordmark.svg")}
      />
      <span
        aria-hidden
        className="brand-pf text-foreground text-base font-semibold tracking-[0.32em]"
      >
        ARTIFACT
      </span>
    </span>
  );
}
