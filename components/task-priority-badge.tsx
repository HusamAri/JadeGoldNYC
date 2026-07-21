import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/types";

/* Öncelik çipi — idx mikro dili: mono, küçük uppercase, geniş letterspace.
   Öncelik rengi tek `--tone` değişkeninden türer (nokta + yumuşak tint zemin
   + ince renkli hairline): P0 kırmızı → P3 nötr rampası. Metin yüksek
   kontrastlı ön plan renginde kalır — renk tek sinyal değildir (P0..P3
   etiketi her zaman görünür). */
const CHIP =
  "gap-1.5 border-(--tone)/30 bg-(--tone)/12 px-2.5 py-1 font-mono text-[10px]/[1.5] tracking-[0.14em] uppercase text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]";
const DOT =
  "size-1.5 shrink-0 rounded-full bg-(--tone) dark:shadow-[0_0_10px_0_var(--tone)]";

/* Mürekkepler Spatial mor rampası (koyuda lume eşleri): P1 en koyu mor →
   P3 soluk mor; P0 negatif 344. Jenerik turuncu/mavi chart tonları
   KULLANILMAZ — P0..P3 etiketi her zaman görünür. */
const TONE: Record<TaskPriority, string> = {
  P0: "[--tone:oklch(0.58_0.16_344)] dark:[--tone:oklch(0.74_0.12_344)] bg-(--tone)/20 border-(--tone)/40",
  P1: "[--tone:oklch(0.54_0.20_278)] dark:[--tone:oklch(0.72_0.14_262)]",
  P2: "[--tone:oklch(0.68_0.15_286)] dark:[--tone:oklch(0.78_0.12_278)]",
  P3: "[--tone:oklch(0.83_0.07_290)] dark:[--tone:oklch(0.86_0.05_262)]",
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
