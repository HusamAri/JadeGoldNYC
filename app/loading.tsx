import { Logo } from "@/components/layout/logo";

/**
 * Kök yükleniyor durumu — ince, markalı. Soluk/pulse monogram + kısa metin.
 * Restraint: tek mark, bol boşluk; warm-minimal estetiğe sadık. Aşırıya kaçma.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="motion-safe:animate-pulse">
        <Logo className="size-12" />
      </div>
      <p className="text-muted-foreground text-sm tracking-wide">
        Yükleniyor…
      </p>
    </div>
  );
}
