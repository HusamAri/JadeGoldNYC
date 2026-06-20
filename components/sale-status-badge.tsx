import { Badge } from "@/components/ui/badge";
import { SALE_STATUS_LABELS } from "@/lib/constants";
import type { SaleStatus } from "@/lib/types";

const VARIANT: Record<
  SaleStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  paid: "warning",
  completed: "success",
  shipped: "default",
  cancelled: "destructive",
  refunded: "outline",
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return (
    <Badge variant={VARIANT[status] ?? "secondary"}>
      {SALE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
