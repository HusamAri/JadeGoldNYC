import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "NEW" yıldız rozeti — kabartma (konveks) + altın neon gölge. Son büyük
 * yenilikleri öne çıkarır. `withLabel` ile yanında "NEW" metni gösterilir.
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
        "jg-star-neon inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-[oklch(0.5_0.09_86)] uppercase dark:text-[oklch(0.82_0.11_86)]",
        className,
      )}
    >
      <Star className="size-3 fill-current" />
      {withLabel && "New"}
    </span>
  );
}
