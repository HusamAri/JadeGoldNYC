import { cn } from "@/lib/utils";

/**
 * Marka markı — marka kapsamına duyarlı.
 *
 * Bileşen HER İKİ markın işaretini de basar; hangisinin görüneceğini
 * `html[data-brand]` kapsamındaki CSS kuralları belirler (.brand-jg /
 * .brand-pf — bkz. globals.css). Böylece sunucu bileşeni kalır, org
 * değişiminde flash olmaz:
 *   • jade-gold  → antik altın JG monogramı (yerel SVG maskesi)
 *   • artifact   → Spatial marka orb'u (22px yuvarlak, holo-radial dolgu)
 *
 * - variant="mark"     → sadece işaret (varsayılan; dar/küçük alanlar)
 * - variant="wordmark" → işaret + kelime markası (geniş alan)
 *
 * JG monogramı TEMA UYUMLU `--brand-mark` ile boyanır; platform orb'u
 * sistemin tek kroması olan holo degradeyi taşır (Spatial .mk formu).
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

/** Artifact platform markı — Spatial marka orb'u (ref: .navglass .brand .mk):
    22px yuvarlak, grad-holo-radial dolgu, üstten pah ışığı + hafif indigo
    glow. Koyuda glow lume periwinkle'a döner. */
function ArtifactMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "rounded-full [background-image:var(--grad-holo-radial)]",
        "[box-shadow:0_0_24px_rgb(157_140_255/0.35),inset_0_1px_1px_rgb(255_255_255/0.9),inset_0_-2px_5px_rgb(91_76_196/0.35)]",
        "dark:[box-shadow:0_0_12px_rgb(205_214_255/0.45),0_0_24px_rgb(150_160_255/0.22),inset_0_1px_1px_rgb(255_255_255/0.6),inset_0_-2px_5px_rgb(16_14_40/0.55)]",
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
  // Mark kabı — Spatial marka formu: kutu/kabartma YOK, çıplak 22px işaret
  // (ref: .mk 22px). İki markın işareti de basılır, kapsam CSS'i birini gizler.
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
      {/* Spatial serif wordmark (ref: .navglass .brand — serif 600, 20px, -.01em). */}
      <span
        aria-hidden
        className="brand-pf text-foreground text-xl leading-none font-semibold tracking-[-0.01em] [font-family:var(--font-serif)]"
      >
        Amuletta
      </span>
    </span>
  );
}
