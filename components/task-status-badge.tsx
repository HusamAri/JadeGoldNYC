import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import type { TaskStatus } from "@/lib/types";

/* Durum çipi — TaskPriorityBadge ile aynı idx mikro dili (mono, küçük
   uppercase, `--tone` nokta + tint zemin + hairline). Durumun tek `--tone`
   değişkeninden türer; etiket her zaman görünür (renk tek sinyal değil).
   todo = nötr mor-gri · doing = aktif altın/amber · done = yeşim (jade). */
const CHIP =
  "gap-1.5 border-(--tone)/30 bg-(--tone)/12 px-2.5 py-1 font-mono text-[10px]/[1.5] tracking-[0.14em] uppercase text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]";
const DOT =
  "size-1.5 shrink-0 rounded-full bg-(--tone) dark:shadow-[0_0_10px_0_var(--tone)]";

const TONE: Record<TaskStatus, string> = {
  // Nötr: yapılacak, henüz başlanmadı.
  todo: "[--tone:oklch(0.68_0.03_286)] dark:[--tone:oklch(0.72_0.03_286)]",
  // Aktif: devam ediyor — sıcak altın/amber, hareket sinyali.
  doing:
    "[--tone:oklch(0.70_0.13_85)] dark:[--tone:oklch(0.80_0.12_85)] bg-(--tone)/18 border-(--tone)/40",
  // Tamamlandı: yeşim (jade) — olumlu, kapandı.
  done: "[--tone:oklch(0.60_0.12_165)] dark:[--tone:oklch(0.74_0.11_165)]",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={cn(CHIP, TONE[status] ?? "[--tone:var(--muted-foreground)]")}>
      <span aria-hidden className={DOT} />
      {TASK_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
