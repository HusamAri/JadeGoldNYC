import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/types";

/* Öncelik çipi — idx mikro dili: mono, küçük uppercase, geniş letterspace.
   Öncelik rengi tek `--tone` değişkeninden türer (nokta + yumuşak tint zemin
   + ince renkli hairline): P0 kırmızı → P3 nötr rampası. Metin yüksek
   kontrastlı ön plan renginde kalır — renk tek sinyal değildir (P0..P3
   etiketi her zaman görünür). */
const CHIP =
  "gap-1.5 border-(--tone)/30 bg-(--tone)/12 px-2.5 py-1 font-mono text-[10px]/[1.5] tracking-[0.14em] uppercase text-foreground shadow-none dark:shadow-none";
const DOT =
  "size-1.5 shrink-0 rounded-full bg-(--tone) dark:shadow-[0_0_10px_0_var(--tone)]";

const TONE: Record<TaskPriority, string> = {
  P0: "[--tone:var(--destructive)] bg-(--tone)/20 border-(--tone)/40",
  P1: "[--tone:var(--chart-4)]",
  P2: "[--tone:var(--chart-2)]",
  P3: "[--tone:var(--muted-foreground)]",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      className={cn(CHIP, TONE[priority] ?? "[--tone:var(--muted-foreground)]")}
    >
      <span aria-hidden className={DOT} />
      {priority}
    </Badge>
  );
}
