import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/lib/types";

const VARIANT: Record<
  TaskPriority,
  "destructive" | "warning" | "secondary" | "outline"
> = {
  P0: "destructive",
  P1: "warning",
  P2: "secondary",
  P3: "outline",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant={VARIANT[priority] ?? "secondary"}>{priority}</Badge>
  );
}
