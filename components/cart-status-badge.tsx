import { Badge } from "@/components/ui/badge";
import { CART_STATUS_LABELS } from "@/lib/constants";
import type { CartRecoveryStatus } from "@/lib/types";

const VARIANT: Record<
  CartRecoveryStatus,
  "secondary" | "warning" | "success" | "destructive"
> = {
  yeni: "secondary",
  iletildi: "warning",
  kazanildi: "success",
  kayip: "destructive",
};

export function CartStatusBadge({ status }: { status: CartRecoveryStatus }) {
  return (
    <Badge variant={VARIANT[status] ?? "secondary"}>
      {CART_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
