import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "NEW" yıldız rozeti — kabartma (konveks) + marka vurgusu neon gölge
 * (JG'de altın, platformda holo periwinkle — --neon-star/--gold-deep).
 * Son büyük yenilikleri öne çıkarır. `withLabel` ile "NEW" metni gösterilir.
 */
export function NewStar({
  withLabel = true,
  className,
}: {
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "jg-star-neon inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-[color:var(--gold-deep)] uppercase [font-family:var(--font-index)]",
        className,
      )}
    >
      <Star className="size-3 fill-current" />
      {withLabel && "New"}
    </span>
  );
}
