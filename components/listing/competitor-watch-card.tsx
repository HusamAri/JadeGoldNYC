"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  addCompetitorToSet,
  removeCompetitorFromSet,
} from "@/app/(dashboard)/analizler/urunler/anahtar-kelime/actions";
import type {
  CompetitorVariantMatchItem,
  CompetitorWatchItem,
} from "@/lib/db/queries/keyword-research";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompetitorProductRow } from "@/components/listing/competitor-product-row";
import { CompetitorSection } from "@/components/listing/competitor-section";
import { CompetitorMatchDialog } from "@/components/listing/competitor-match-dialog";

/** Ürün başına rakip üst sınırı (server action ile aynı). */
const MAX_COMPETITORS = 10;

/**
 * Rakip renk kimliği paleti — `color` null olduğunda indeks bazlı belirleyici
 * (deterministic) renk. Matris örtüsü de aynı renkleri kullanabilsin diye
 * dışa açık.
 */
export const WATCH_PALETTE = [
  "#6366F1",
  "#E0568A",
  "#0EA5A4",
  "#D97706",
  "#7C3AED",
  "#DB2777",
  "#059669",
  "#DC2626",
  "#2563EB",
  "#CA8A04",
] as const;

/**
 * Rakip seti (STR tarzı sabit comp-set) — 0091.
 * `AddCompetitorToSetButton`: organik rakip satırından tek tıkla sete ekleme.
 * `CompetitorWatchList`: sabitlenen rakipler — kompakt görselli satırlar.
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
    image_url?: string | null;
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
      className="h-7 px-2 text-[10px]"
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
      <span className="text-muted-foreground text-[11px]">
        henüz karşılaştırma kaydı yok
      </span>
    );
  }
  const cur = item.last_currency ?? "USD";
  if (last === prev) {
    return (
      <span className="text-muted-foreground text-[11px]">
        değişim yok ({formatDate(item.prev_captured_at)}&apos;den beri)
      </span>
    );
  }
  const up = last > prev;
  return (
    <span
      className={`text-[11px] font-medium ${
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
  ourVariants = [],
  matches = [],
  currency = "USD",
}: {
  productId: string;
  items: CompetitorWatchItem[];
  ourVariants?: { sku: string; label: string; weight_grams?: number | null }[];
  matches?: CompetitorVariantMatchItem[];
  currency?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <CompetitorSection
      title="Rakip seti"
      meta={`${items.length} sabit takip`}
      defaultOpen
    >
      <ul className="divide-y divide-[color-mix(in_oklab,var(--border)_40%,transparent)]">
        {items.map((item, i) => {
          const dot = item.color ?? WATCH_PALETTE[i % WATCH_PALETTE.length];
          return (
            <CompetitorProductRow
              key={item.id}
              imageUrl={item.image_url}
              title={item.title ?? `Listing #${item.competitor_listing_id}`}
              href={item.url}
              shop={
                item.last_state === "gone"
                  ? `${item.shop_name ?? "Mağaza bilinmiyor"} · Etsy'den kalktı`
                  : (item.shop_name ?? "Mağaza bilinmiyor")
              }
              colorDot={dot}
              price={
                item.last_price_cents != null
                  ? formatMoney(
                      item.last_price_cents,
                      item.last_currency ?? "USD",
                    )
                  : "—"
              }
              meta={<PriceChange item={item} />}
              actions={
                <>
                  <CompetitorMatchDialog
                    productId={productId}
                    competitorListingId={item.competitor_listing_id}
                    competitorTitle={item.title}
                    currency={item.last_currency ?? currency}
                    ourVariants={ourVariants}
                    existingMatches={matches}
                    fallbackPriceCents={item.last_price_cents}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5"
                    disabled={pending}
                    title="Rakip setinden çıkar"
                    aria-label="Rakip setinden çıkar"
                    onClick={() =>
                      start(async () => {
                        const r = await removeCompetitorFromSet(
                          productId,
                          item.id,
                        );
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
                </>
              }
            />
          );
        })}
      </ul>
      <p className="text-muted-foreground px-1.5 pt-1 text-xs">
        Fiyatlar günlük tazelenir; son 48 saatte ≥3 taze kayıt olduğunda fiyat
        bandı organik arama yerine bu setten kurulur.
      </p>
    </CompetitorSection>
  );
}

/**
 * Elle rakip linki ekleme formu — Etsy listing URL'i girilir, action URL'den
 * listing_id çözer. Ürün başına 10 rakip üst sınırı.
 */
export function AddCompetitorLinkForm({
  productId,
  currentCount,
}: {
  productId: string;
  /** Aktif rakip sayısı (listCompetitorWatch uzunluğu). */
  currentCount: number;
}) {
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const atMax = currentCount >= MAX_COMPETITORS;
  const remaining = Math.max(0, MAX_COMPETITORS - currentCount);

  function submit() {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Etsy listing linki girin.");
      return;
    }
    start(async () => {
      const r = await addCompetitorToSet(productId, { url: trimmed });
      if (r.error) toast.error(r.error);
      else {
        toast.success("Rakip setine eklendi — fiyatı günlük takip edilecek");
        setUrl("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          Elle rakip linki ekle
        </p>
        <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {currentCount}/{MAX_COMPETITORS}
        </span>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.etsy.com/listing/..."
          disabled={atMax || pending}
          className="h-9 flex-1"
          aria-label="Rakip Etsy listing linki"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={atMax || pending}
        >
          <Plus className="size-3" />
          Ekle
        </Button>
      </form>
      {atMax ? (
        <p className="text-muted-foreground text-xs">En fazla 10 rakip</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          {remaining} slot kaldı — Etsy listing linkini yapıştırın.
        </p>
      )}
    </div>
  );
}
