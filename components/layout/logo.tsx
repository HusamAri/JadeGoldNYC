import { cn } from "@/lib/utils";
import { AmulettaMark } from "@/components/brand/amuletta-mark";

/**
 * Marka markı — marka kapsamına duyarlı.
 *
 * Bileşen HER İKİ markın işaretini de basar; hangisinin görüneceğini
 * `html[data-brand]` kapsamındaki CSS kuralları belirler (.brand-jg /
 * .brand-pf — bkz. globals.css).
 *
 * - variant="mark"     → sadece işaret (varsayılan)
 * - variant="wordmark" → işaret + kelime markası
 *
 * JG monogramı TEMA UYUMLU `--brand-mark` ile boyanır; Amuletta yay/halka
 * negatif-A markası `currentColor` / primary ile boyanır.
 */

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

function ArtifactMark({ className }: { className?: string }) {
  return (
    <AmulettaMark
      className={cn(
        "text-primary drop-shadow-[0_1px_2px_rgb(91_76_196/0.25)]",
        "dark:drop-shadow-[0_0_10px_rgb(169_155_255/0.35)]",
        className,
      )}
    />
  );
}

export function Logo({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "wordmark";
}) {
  const mark = (
    <span
      className={cn(
        "relative flex size-[22px] shrink-0 items-center justify-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="brand-jg bg-brand-mark block size-full"
        style={maskStyle("/brand/logo/monogram-jg.svg")}
      />
      <ArtifactMark className="brand-pf block size-full" />
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
        className="brand-pf text-foreground text-xl leading-none font-semibold tracking-[-0.01em] [font-family:var(--font-serif)]"
      >
        Amuletta
      </span>
    </span>
  );
}
