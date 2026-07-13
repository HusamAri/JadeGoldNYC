"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Package, Search, TrendingUp } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { ProductWeightInput } from "@/components/product-weight-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ProductListing {
  id: string;
  title: string;
  status: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  image_url: string | null;
  description: string | null;
  tags: string[] | null;
  materials: string[] | null;
  num_images: number | null;
  quantity: number | null;
  weight_grams: number | null;
}

const DEFAULT_VISIBLE = 24;

/**
 * Etsy başlıkları HTML entity'leriyle gelebiliyor ("Men&#39;s" gibi) —
 * görüntülemeden önce metne çevir (salt görsel; veri değişmez).
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, c: string) => String.fromCodePoint(Number(c)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c: string) =>
      String.fromCodePoint(parseInt(c, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Etsy referans katalog kartları. Ağırlık girişi (altın maliyet motorunun tek
 * kaynağı) yalnızca bu kartlarda olduğundan hiçbir ürün kalıcı olarak
 * erişilemez kalmamalı — bu yüzden sayfa yükünü sınırlamak için arama +
 * "tümünü göster" kullanılır, sabit bir kesme (slice) DEĞİL.
 */
export function EtsyListingGrid({ listings }: { listings: ProductListing[] }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((p) => p.title.toLowerCase().includes(q));
  }, [listings, query]);

  const visible =
    showAll || query.trim() ? filtered : filtered.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search
          aria-hidden
          className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Listing ara…"
          aria-label="Listing ara"
          className="pl-8"
        />
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Package aria-hidden className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              Aramayla eşleşen listing yok.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <Link
                href={`/analizler/urunler/liste/${p.id}`}
                className="group block"
                title="Rakip & pazar analizini aç"
              >
                {p.image_url ? (
                  <div className="bg-muted relative aspect-square">
                    <Image
                      src={p.image_url}
                      alt={decodeEntities(p.title)}
                      fill
                      className="object-cover transition-opacity group-hover:opacity-90"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="from-primary/20 to-accent/30 flex aspect-square items-center justify-center bg-gradient-to-br">
                    <Package aria-hidden className="text-muted-foreground size-12" />
                  </div>
                )}
              </Link>
              <CardContent className="space-y-2 p-4">
                <Link href={`/analizler/urunler/liste/${p.id}`}>
                  <h4 className="hover:text-primary line-clamp-2 text-sm font-medium leading-tight transition-colors">
                    {decodeEntities(p.title)}
                  </h4>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {p.price_cents != null && (
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(p.price_cents, p.currency)}
                    </span>
                  )}
                  {p.quantity != null && (
                    <Badge variant="secondary" className="text-xs">
                      Stok: {p.quantity}
                    </Badge>
                  )}
                  {p.num_images != null && p.num_images > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {p.num_images} görsel
                    </Badge>
                  )}
                </div>
                <ProductWeightInput productId={p.id} initialGrams={p.weight_grams} />
                {p.materials && p.materials.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.materials.slice(0, 5).map((mat) => (
                      <Badge key={mat} variant="outline" className="text-xs font-normal">
                        {mat}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                  <Link
                    href={`/analizler/urunler/liste/${p.id}`}
                    className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                  >
                    <TrendingUp aria-hidden className="size-3" />
                    Rakip & pazar analizi
                  </Link>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      Etsy&apos;de gör
                      <ExternalLink aria-hidden className="size-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-primary text-sm font-medium hover:underline"
        >
          {hiddenCount} listing daha göster →
        </button>
      )}
    </div>
  );
}
