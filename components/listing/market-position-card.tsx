import { Scale } from "lucide-react";

import type { ListingMarketPosition } from "@/lib/db/queries/listings";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

/** price_position → Türkçe etiket + rozet tonu. */
const POSITION_META: Record<
  ListingMarketPosition["price_position"],
  { label: string; variant: "success" | "warning" | "destructive" | "outline" }
> = {
  ucuz: { label: "Bandın altında", variant: "success" },
  bantta: { label: "Bantta", variant: "outline" },
  pahali: { label: "Bandın üstünde", variant: "destructive" },
  belirsiz: { label: "Belirsiz", variant: "warning" },
};

const CONFIDENCE_LABELS: Record<string, string> = {
  yuksek: "yüksek güven",
  orta: "orta güven",
  dusuk: "düşük güven",
};

/** Gram başı cent → "$x.xx / g" (formatMoney cent bekler). */
function perGram(cents: number | null, currency: string): string {
  return cents != null ? `${formatMoney(cents, currency)} / g` : "—";
}

/**
 * Pazar konumu rozeti — gram-bazlı ($/g) rakip bandı + melt (eritme) tabanına
 * göre listing fiyatının konumu. #148 günlük pazar araştırması rutini
 * keyword_research'e $/gram kolonlarını yazınca dolar; yoksa `position` null
 * gelir ve bu kart hiç render edilmez (rakip bölümünü zarifçe tamamlar).
 */
export function MarketPositionCard({
  position,
  currency,
}: {
  position: ListingMarketPosition;
  currency: string;
}) {
  const meta = POSITION_META[position.price_position];
  const dev = position.deviation_pct;
  const devLabel =
    dev != null
      ? `${dev > 0 ? "+" : ""}${dev.toFixed(1)}% ${
          dev > 0 ? "bant ortalamasının üstünde" : "bant ortalamasının altında"
        }`
      : null;

  return (
    <div className="nm-raised space-y-4 rounded-[1.5rem] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="nm-pressed text-muted-foreground flex size-9 items-center justify-center rounded-[10px]">
            <Scale className="size-4" />
          </span>
          <div>
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              Pazar konumu · $/gram
            </p>
            <Badge variant={meta.variant} className="mt-1">
              {meta.label}
            </Badge>
          </div>
        </div>
        {position.confidence && (
          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
            {CONFIDENCE_LABELS[position.confidence] ?? position.confidence}
          </span>
        )}
      </div>

      {/* Gram başı band: düşük · ortalama · yüksek + bizim konum. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-0.5">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            Bizim
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums">
            {perGram(position.our_per_gram_cents, currency)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            Bant düşük
          </p>
          <p className="font-mono text-sm tabular-nums">
            {perGram(position.market_low_per_gram_cents, currency)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            Bant ort.
          </p>
          <p className="font-mono text-sm tabular-nums">
            {perGram(position.market_avg_per_gram_cents, currency)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            Bant yüksek
          </p>
          <p className="font-mono text-sm tabular-nums">
            {perGram(position.market_high_per_gram_cents, currency)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
        {position.melt_per_gram_cents != null && (
          <span className="text-muted-foreground">
            Eritme tabanı:{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {perGram(position.melt_per_gram_cents, currency)}
            </span>
          </span>
        )}
        {devLabel && (
          <span className="text-muted-foreground">
            Sapma:{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {devLabel}
            </span>
          </span>
        )}
      </div>

      {position.recommendation && (
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Öneri:</span>{" "}
          {position.recommendation}
        </p>
      )}
    </div>
  );
}
