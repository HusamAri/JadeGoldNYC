import { Badge } from "@/components/ui/badge";
import { DESIGN_STATUS_LABELS } from "@/lib/constants";

const VARIANT: Record<
  string,
  "secondary" | "warning" | "success" | "outline"
> = {
  taslak: "secondary",
  onaylandi: "warning",
  yayinda: "success",
  arsiv: "outline",
};

export function DesignStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "secondary"}>
      {DESIGN_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
