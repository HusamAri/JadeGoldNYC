import { Badge } from "@/components/ui/badge";
import { REVIEW_STATUS_LABELS } from "@/lib/constants";
import type { ReviewStatus } from "@/lib/types";

const VARIANT: Record<ReviewStatus, "secondary" | "success" | "warning"> = {
  yeni: "secondary",
  yanitlandi: "success",
  isaretli: "warning",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant={VARIANT[status] ?? "secondary"}>
      {REVIEW_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
