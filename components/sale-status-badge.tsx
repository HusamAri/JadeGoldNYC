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
  "gap-1.5 border-(--tone)/30 bg-(--tone)/12 px-2.5 py-1 font-mono text-[10px]/[1.5] tracking-[0.14em] uppercase text-foreground shadow-none dark:shadow-none";
const DOT =
  "size-1.5 shrink-0 rounded-full bg-(--tone) dark:shadow-[0_0_10px_0_var(--tone)]";

const TONE: Record<SaleStatus, string> = {
  paid: "[--tone:var(--chart-4)]",
  completed: "[--tone:var(--chart-5)]",
  shipped: "[--tone:var(--chart-2)]",
  cancelled: "[--tone:var(--destructive)] bg-(--tone)/20 border-(--tone)/40",
  refunded: "[--tone:var(--muted-foreground)] border-dashed",
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
