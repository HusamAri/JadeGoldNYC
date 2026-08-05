import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SALE_STATUS_LABELS } from "@/lib/constants";
import type { SaleStatus } from "@/lib/types";

/* Durum çipi — idx mikro dili: mono, küçük uppercase, geniş letterspace.
   Durum rengi tek `--tone` değişkeninden türer (nokta + yumuşak tint zemin +
   ince renkli hairline); metin yüksek kontrastlı ön plan renginde kalır —
   renk hiçbir zaman tek sinyal değildir (etiket her zaman görünür).
   Koyu modda nokta hafifçe ışır (Lume). */
const CHIP =
  "gap-1.5 border-(--tone)/30 bg-(--tone)/12 px-2.5 py-1 font-mono text-[10px]/[1.5] tracking-[0.14em] uppercase text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]";
const DOT =
  "size-1.5 shrink-0 rounded-full bg-(--tone) dark:shadow-[0_0_10px_0_var(--tone)]";

/* Mürekkepler Spatial mor rampası (koyuda lume eşleri): paid en koyu mor →
   completed soluk mor; cancelled negatif 344. Jenerik chart paleti
   (yeşil/mavi/turuncu) KULLANILMAZ — etiket her zaman görünür olduğundan
   renk-anlam kaybı yok. */
const TONE: Record<SaleStatus, string> = {
  // Açık/işleniyor: rampanın en canlı ucu — aksiyon bekleyen sipariş.
  open: "[--tone:oklch(0.62_0.19_300)] dark:[--tone:oklch(0.76_0.14_295)]",
  processing:
    "[--tone:oklch(0.62_0.19_300)] dark:[--tone:oklch(0.76_0.14_295)] border-dashed",
  paid: "[--tone:oklch(0.54_0.20_278)] dark:[--tone:oklch(0.72_0.14_262)]",
  completed: "[--tone:oklch(0.83_0.07_290)] dark:[--tone:oklch(0.86_0.05_262)]",
  shipped: "[--tone:oklch(0.68_0.15_286)] dark:[--tone:oklch(0.78_0.12_278)]",
  cancelled:
    "[--tone:oklch(0.58_0.16_344)] dark:[--tone:oklch(0.74_0.12_344)] bg-(--tone)/20 border-(--tone)/40",
  refunded: "[--tone:var(--muted-foreground)] border-dashed",
  partially_refunded:
    "[--tone:oklch(0.58_0.16_344)] dark:[--tone:oklch(0.74_0.12_344)] border-dashed",
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return (
    <Badge
      className={cn(CHIP, TONE[status] ?? "[--tone:var(--muted-foreground)]")}
    >
      <span aria-hidden className={DOT} />
      {SALE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
