import { Check, X } from "lucide-react";

import type { AuditCategory } from "@/lib/etsy/listing-audit";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<AuditCategory, string> = {
  title: "Başlık",
  tags: "Etiketler",
  description: "Açıklama",
  photos: "Fotoğraflar",
  other: "Diğer",
};

const CATEGORY_ORDER: AuditCategory[] = [
  "title",
  "tags",
  "description",
  "photos",
];

/**
 * Alura Listing Helper vekili — mağaza kalite skoru (1–100) + kategori
 * checklist. Skor Etsy Seller Handbook sinyallerinden türetilir
 * (`lib/etsy/listing-audit.ts` scoreListing).
 */
export function ListingQualityScore({
  shopScore,
  auditedCount,
  categoryPassCounts,
}: {
  shopScore: number | null;
  auditedCount: number;
  categoryPassCounts: Record<AuditCategory, { pass: number; total: number }>;
}) {
  if (auditedCount === 0 || shopScore == null) return null;

  const tone =
    shopScore >= 85
      ? "text-emerald-700 dark:text-emerald-400"
      : shopScore >= 65
        ? "text-amber-700 dark:text-amber-400"
        : "text-rose-700 dark:text-rose-400";

  return (
    <div className="border-border/70 bg-muted/20 soft-in flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="shrink-0">
        <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
          Listing Quality Score
        </p>
        <p className={cn("mt-1 text-4xl font-semibold tabular-nums", tone)}>
          {shopScore}
          <span className="text-muted-foreground ml-1 text-base font-normal">
            /100
          </span>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {auditedCount} aktif listing ortalaması · Etsy Seller Handbook
        </p>
      </div>

      <ul className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
        {CATEGORY_ORDER.map((cat) => {
          const { pass, total } = categoryPassCounts[cat];
          const allPass = total > 0 && pass === total;
          return (
            <li
              key={cat}
              className="bg-background/60 flex items-center gap-2 rounded-xl border px-3 py-2"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  allPass
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400",
                )}
                aria-hidden
              >
                {allPass ? (
                  <Check className="size-3" />
                ) : (
                  <X className="size-3" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium">
                  {CATEGORY_LABEL[cat]}
                </span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {pass}/{total} temiz
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
