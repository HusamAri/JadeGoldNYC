import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** 1–5 yıldız gösterimi. rating null ise tire. */
export function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} / 5`}
      title={`${rating} / 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}
