import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { REVIEW_STATUS_LABELS } from "@/lib/constants";
import type { ReviewStatus } from "@/lib/types";

/* Durum çipi — idx mikro dili: mono, küçük uppercase, geniş letterspace.
   Durum rengi tek `--tone` değişkeninden türer (nokta + yumuşak tint zemin +
   ince renkli hairline); metin yüksek kontrastlı ön plan renginde kalır —
   renk hiçbir zaman tek sinyal değildir (etiket her zaman görünür). */
const CHIP =
  "gap-1.5 border-(--tone)/30 bg-(--tone)/12 px-2.5 py-1 font-mono text-[10px]/[1.5] tracking-[0.14em] uppercase text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]";
const DOT =
  "size-1.5 shrink-0 rounded-full bg-(--tone) dark:shadow-[0_0_10px_0_var(--tone)]";

const TONE: Record<ReviewStatus, string> = {
  yeni: "[--tone:var(--chart-2)]",
  yanitlandi: "[--tone:var(--chart-5)]",
  isaretli: "[--tone:var(--chart-4)]",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge
      className={cn(CHIP, TONE[status] ?? "[--tone:var(--muted-foreground)]")}
    >
      <span aria-hidden className={DOT} />
      {REVIEW_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
