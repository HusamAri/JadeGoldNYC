"use client";

import { ExternalLink } from "lucide-react";

import type { CompetitorRow } from "@/lib/etsy/keyword-research";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  AddCompetitorLinkForm,
  AddCompetitorToSetButton,
  CompetitorWatchList,
} from "@/components/listing/competitor-watch-card";
import type { CompetitorWatchItem } from "@/lib/db/queries/keyword-research";

/**
 * "Listing altında benzer içerikler" hissi — organik araştırma sonuçlarını
 * kart ızgarası olarak gösterir. Tek tıkla rakip setine eklenir; elle link
 * formu her zaman altta kalır.
 */
export function SimilarListingsGrid({
  productId,
  results,
  watchItems,
  keyword,
}: {
  productId: string;
  results: CompetitorRow[];
  watchItems: CompetitorWatchItem[];
  keyword: string | null;
}) {
  const watchedIds = new Set(
    watchItems.map((w) => w.competitor_listing_id).filter(Boolean),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase">
            Benzer listingler
          </p>
          <p className="text-muted-foreground text-xs">
            {keyword
              ? `“${keyword}” aramasında çıkan yakın ürünler — sete ekleyince fiyatı günlük takip edilir.`
              : "Araştırma kelimesi kaydedilip tarama yapılınca benzerler burada dolar."}
          </p>
        </div>
        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {watchItems.length}/10 sette
        </span>
      </div>

      {results.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.slice(0, 9).map((c) => {
            const listingId = c.listing_id ?? listingIdFromUrl(c.url);
            const watched =
              listingId != null ? watchedIds.has(listingId) : false;
            return (
              <li
                key={`${c.position}-${listingId ?? c.url ?? c.title}`}
                className={cn(
                  "nm-raised-sm flex flex-col overflow-hidden rounded-[1.25rem]",
                  watched && "ring-1 ring-primary/40",
                )}
              >
                <div className="bg-muted/40 relative aspect-[4/3] overflow-hidden">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Etsy CDN; uzak host değişken
                    <img
                      src={c.image_url}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-muted-foreground flex size-full items-center justify-center font-mono text-[10px] tracking-[0.14em] uppercase">
                      {String(c.position).padStart(2, "0")}
                    </div>
                  )}
                  <span className="bg-background/80 absolute top-2 left-2 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums backdrop-blur">
                    #{String(c.position).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="hover:text-primary line-clamp-2 text-sm font-medium leading-snug"
                      >
                        {c.title}
                        <ExternalLink className="ml-1 inline size-3 opacity-50" />
                      </a>
                    ) : (
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {c.title}
                      </p>
                    )}
                    {c.shop_name && (
                      <p className="text-muted-foreground truncate text-xs">
                        {c.shop_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm tabular-nums">
                      {formatMoney(c.price_cents, c.currency)}
                    </span>
                    {listingId != null && (
                      <AddCompetitorToSetButton
                        productId={productId}
                        competitor={{
                          listing_id: listingId,
                          url: c.url,
                          title: c.title,
                          shop_name: c.shop_name,
                        }}
                        watched={watched}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-[1.25rem] border border-dashed px-4 py-6 text-center text-sm">
          Henüz benzer listing yok. Yukarıdan kelimeyi kaydedip &ldquo;Şimdi
          araştır&rdquo; deyin — sonuçlar burada kart olarak çıkar.
        </p>
      )}

      <CompetitorWatchList productId={productId} items={watchItems} />
      <AddCompetitorLinkForm
        productId={productId}
        currentCount={watchItems.length}
      />
    </div>
  );
}

function listingIdFromUrl(url: string | null): number | null {
  if (!url) return null;
  const m = /\/listing\/(\d+)/.exec(url);
  return m ? Number(m[1]) : null;
}
