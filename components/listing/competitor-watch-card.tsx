"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  addCompetitorToSet,
  removeCompetitorFromSet,
} from "@/app/(dashboard)/analizler/urunler/anahtar-kelime/actions";
import type { CompetitorWatchItem } from "@/lib/db/queries/keyword-research";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

/**
 * Rakip seti (STR tarzı sabit comp-set) — 0091.
 * `AddCompetitorToSetButton`: organik rakip satırından tek tıkla sete ekleme.
 * `CompetitorWatchList`: sabitlenen rakipler — mağaza+ürün, son fiyat ve
 * ÖNCEKİ KAYDA GÖRE değişim (tarih + eski→yeni; "değişim neye oranla"
 * sorusunun cevabı ekranda), çıkar düğmesi. Fiyatlar günlük cron ile tazelenir.
 */

export function AddCompetitorToSetButton({
  productId,
  competitor,
  watched,
}: {
  productId: string;
  competitor: {
    listing_id: number | null;
    url: string | null;
    title: string | null;
    shop_name: string | null;
  };
  /** Bu listing zaten sette mi (düğme pasifleşir). */
  watched: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (watched) {
    return (
      <span className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
        Sette
      </span>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-[10px]"
      disabled={pending}
      title="Rakip setine ekle — fiyatı günlük takip edilir"
      onClick={() =>
        start(async () => {
          const r = await addCompetitorToSet(productId, competitor);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Rakip setine eklendi — fiyatı günlük takip edilecek");
            router.refresh();
          }
        })
      }
    >
      <Plus className="size-3" />
      Sete ekle
    </Button>
  );
}

/** Önceki kayda göre değişim satırı — tarih + eski→yeni. */
function PriceChange({ item }: { item: CompetitorWatchItem }) {
  const { last_price_cents: last, prev_price_cents: prev } = item;
  if (last == null || prev == null || item.prev_captured_at == null) {
    return (
      <span className="text-muted-foreground text-xs">
        henüz karşılaştırma kaydı yok
      </span>
    );
  }
  const cur = item.last_currency ?? "USD";
  if (last === prev) {
    return (
      <span className="text-muted-foreground text-xs">
        değişim yok ({formatDate(item.prev_captured_at)}&apos;den beri)
      </span>
    );
  }
  const up = last > prev;
  return (
    <span
      className={`text-xs font-medium ${
        up
          ? "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
          : "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]"
      }`}
    >
      {formatDate(item.prev_captured_at)}: {formatMoney(prev, cur)} →{" "}
      {formatMoney(last, cur)} ({up ? "+" : ""}
      {(((last - prev) / prev) * 100).toFixed(1)}%)
    </span>
  );
}

export function CompetitorWatchList({
  productId,
  items,
}: {
  productId: string;
  items: CompetitorWatchItem[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        Rakip seti · {items.length} sabit takip
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span className="min-w-0 flex-1">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary block truncate hover:underline"
                >
                  {item.title ?? `Listing #${item.competitor_listing_id}`}
                </a>
              ) : (
                <span className="block truncate">
                  {item.title ?? `Listing #${item.competitor_listing_id}`}
                </span>
              )}
              <span className="text-muted-foreground block truncate text-xs">
                {item.shop_name ?? "Mağaza bilinmiyor"}
                {item.last_state === "gone" && (
                  <span className="text-destructive"> · Etsy&apos;den kalktı</span>
                )}
              </span>
              <PriceChange item={item} />
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-mono font-semibold tabular-nums">
                {item.last_price_cents != null
                  ? formatMoney(item.last_price_cents, item.last_currency ?? "USD")
                  : "—"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5"
                disabled={pending}
                title="Rakip setinden çıkar"
                aria-label="Rakip setinden çıkar"
                onClick={() =>
                  start(async () => {
                    const r = await removeCompetitorFromSet(productId, item.id);
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success("Rakip setinden çıkarıldı");
                      router.refresh();
                    }
                  })
                }
              >
                <X className="size-3" />
              </Button>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        Fiyatlar günlük tazelenir; son 48 saatte ≥3 taze kayıt olduğunda fiyat
        bandı organik arama yerine bu setten kurulur.
      </p>
    </div>
  );
}
