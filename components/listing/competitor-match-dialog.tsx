"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  listCompetitorOfferingsForMatch,
  removeCompetitorVariantMatch,
  saveCompetitorVariantMatch,
  type CompetitorOfferingOption,
} from "@/app/(dashboard)/analizler/urunler/anahtar-kelime/actions";
import type { CompetitorVariantMatchItem } from "@/lib/db/queries/keyword-research";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Manuel varyant eşleştirme — rakip listing teklifini bizim SKU ile bağlar.
 * Otomatik beden/ayar eşlemesini düzeltmek için.
 */
export function CompetitorMatchDialog({
  productId,
  competitorListingId,
  competitorTitle,
  currency = "USD",
  ourVariants,
  existingMatches,
  fallbackPriceCents = null,
}: {
  productId: string;
  competitorListingId: number;
  competitorTitle?: string | null;
  currency?: string;
  ourVariants: { sku: string; label: string; weight_grams?: number | null }[];
  existingMatches: CompetitorVariantMatchItem[];
  /** Teklif listesi boşsa (veya seçilmezse) kullanılacak listing fiyatı. */
  fallbackPriceCents?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState<string>("");
  const [offeringKey, setOfferingKey] = useState<string>("");
  const [offerings, setOfferings] = useState<CompetitorOfferingOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingOffs, setLoadingOffs] = useState(false);
  const [pending, start] = useTransition();
  const loadGen = useRef(0);
  const router = useRouter();

  const sortedVariants = useMemo(() => {
    return [...ourVariants].sort((a, b) => {
      const ag = a.weight_grams != null && a.weight_grams > 0 ? 0 : 1;
      const bg = b.weight_grams != null && b.weight_grams > 0 ? 0 : 1;
      if (ag !== bg) return ag - bg;
      return a.label.localeCompare(b.label, "tr");
    });
  }, [ourVariants]);

  const noVariants = ourVariants.length === 0;
  const canUseListingFallback =
    fallbackPriceCents != null && fallbackPriceCents > 0;

  const forThisListing = existingMatches.filter(
    (m) => m.competitor_listing_id === competitorListingId,
  );
  const matchedLabel =
    forThisListing.length > 0
      ? forThisListing
          .map((m) => m.our_sku)
          .slice(0, 2)
          .join(", ") + (forThisListing.length > 2 ? "…" : "")
      : null;

  function loadOfferings() {
    const gen = ++loadGen.current;
    setLoadingOffs(true);
    setLoadError(null);
    setOfferingKey("");
    void listCompetitorOfferingsForMatch(competitorListingId, currency).then(
      (r) => {
        if (gen !== loadGen.current) return;
        setLoadingOffs(false);
        if (r.error) {
          setLoadError(r.error);
          setOfferings([]);
          if (fallbackPriceCents != null && fallbackPriceCents > 0) {
            setOfferingKey("__listing__");
          }
          return;
        }
        const offs = r.offerings ?? [];
        setOfferings(offs);
        if (offs.length === 0 && fallbackPriceCents != null && fallbackPriceCents > 0) {
          setOfferingKey("__listing__");
        } else if (offs.length === 1) {
          setOfferingKey("0");
        }
      },
    );
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) loadOfferings();
  }

  function listingFallbackOffering(): CompetitorOfferingOption | null {
    if (fallbackPriceCents == null || !(fallbackPriceCents > 0)) return null;
    return {
      product_id: null,
      label: competitorTitle ?? "Listing fiyatı",
      size: null,
      karat: null,
      price_cents: fallbackPriceCents,
    };
  }

  function selectedOffering(): CompetitorOfferingOption | null {
    const key =
      offeringKey ||
      (offerings.length === 0 && canUseListingFallback ? "__listing__" : "");
    if (!key) return null;
    if (key === "__listing__") {
      return listingFallbackOffering() ?? offerings[0] ?? null;
    }
    const idx = Number(key);
    return Number.isFinite(idx) ? (offerings[idx] ?? null) : null;
  }

  function resolvePriceCents(
    off: CompetitorOfferingOption | null,
  ): number | null {
    if (off?.price_cents != null && off.price_cents > 0) return off.price_cents;
    if (fallbackPriceCents != null && fallbackPriceCents > 0) {
      return fallbackPriceCents;
    }
    return null;
  }

  function save() {
    if (ourVariants.length === 0) {
      toast.error(
        "Bu listingde eşleştirilecek Etsy SKU’su yok — önce Etsy senkronu yapın.",
      );
      return;
    }
    if (!sku) {
      toast.error("Bizim varyantı seçin.");
      return;
    }
    const off = selectedOffering();
    if (!off && offerings.length > 0) {
      toast.error("Rakip teklif seçin.");
      return;
    }
    const priceCents = resolvePriceCents(off);
    if (priceCents == null) {
      toast.error(
        "Rakip fiyatı yok — teklif seçin veya listing fiyatı bilinen bir rakip kullanın.",
      );
      return;
    }
    const chosen = sortedVariants.find((v) => v.sku === sku);
    if (chosen && !(chosen.weight_grams != null && chosen.weight_grams > 0)) {
      toast.message(
        "Bu SKU gramsız — eşleşme kaydolur ama $/g yansıması için gram girin.",
      );
    }
    start(async () => {
      const r = await saveCompetitorVariantMatch(productId, {
        our_sku: sku,
        competitor_listing_id: competitorListingId,
        competitor_product_id: off?.product_id ?? null,
        competitor_label: off?.label ?? competitorTitle ?? null,
        competitor_size: off?.size ?? null,
        competitor_karat: off?.karat ?? null,
        price_cents: priceCents,
        currency,
      });
      if (r.error) toast.error(r.error);
      else {
        toast.success("Varyant eşleştirildi");
        setOpen(false);
        router.refresh();
      }
    });
  }

  function removeMatch(matchId: string) {
    start(async () => {
      const r = await removeCompetitorVariantMatch(productId, matchId);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Eşleştirme kaldırıldı");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] tracking-wide uppercase"
          title={
            noVariants
              ? "Eşleştirilecek SKU yok — Etsy senkronu gerekli"
              : "Bu rakibi bizim bir varyantla eşleştir"
          }
        >
          <Link2 className="size-3" />
          {matchedLabel ? "Eşleşti" : "Eşleştir"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Varyant eşleştir</DialogTitle>
          <DialogDescription>
            {competitorTitle
              ? `"${competitorTitle}" teklifini bizim Etsy SKU’muzla bağla. Gramı olan varyantı seç — kayıt sonrası Satış sütununda rakip $/g × gram yansıması görünür.`
              : "Rakip teklifi bizim Etsy SKU’muzla bağla. Gramı olan çapadan tüm varyantlara fiyat yansır."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {noVariants ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-sm">
              Bu listingde senkron varyant / ürün SKU’su yok. Üstten Etsy
              senkronunu çalıştırıp sayfayı yenileyin; sonra eşleştirme açılır.
            </p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                Bizim varyant
              </p>
              <Select value={sku} onValueChange={setSku}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Varyant seç…" />
                </SelectTrigger>
                <SelectContent>
                  {sortedVariants.map((v) => (
                    <SelectItem key={v.sku} value={v.sku}>
                      {v.label}
                      <span className="text-muted-foreground ml-1 font-mono text-[10px]">
                        {v.sku}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              Rakip teklif
            </p>
            {loadingOffs ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-3.5 animate-spin" />
                Teklifler yükleniyor…
              </p>
            ) : loadError ? (
              <div className="space-y-2">
                <p className="text-destructive text-sm">{loadError}</p>
                {canUseListingFallback && (
                  <p className="text-muted-foreground text-sm">
                    Listing fiyatı yedek:{" "}
                    <span className="text-foreground font-mono tabular-nums">
                      {formatMoney(fallbackPriceCents!, currency)}
                    </span>
                  </p>
                )}
              </div>
            ) : offerings.length === 0 ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Varyant teklifi yok
                  {canUseListingFallback
                    ? " — bilinen listing fiyatı kullanılacak."
                    : " ve listing fiyatı da yok; eşleştirme $/g yansıtamaz."}
                </p>
                {canUseListingFallback && (
                  <Select
                    value={offeringKey || "__listing__"}
                    onValueChange={setOfferingKey}
                  >
                    <SelectTrigger className="w-full" size="sm">
                      <SelectValue placeholder="Listing fiyatı" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__listing__">
                        Listing fiyatı
                        <span className="text-muted-foreground ml-1 font-mono text-[10px] tabular-nums">
                          {formatMoney(fallbackPriceCents!, currency)}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <Select value={offeringKey} onValueChange={setOfferingKey}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Teklif seç…" />
                </SelectTrigger>
                <SelectContent>
                  {canUseListingFallback && (
                    <SelectItem value="__listing__">
                      Listing fiyatı
                      <span className="text-muted-foreground ml-1 font-mono text-[10px] tabular-nums">
                        {formatMoney(fallbackPriceCents!, currency)}
                      </span>
                    </SelectItem>
                  )}
                  {offerings.map((o, i) => (
                    <SelectItem
                      key={`${o.product_id ?? i}-${o.label}`}
                      value={String(i)}
                    >
                      {o.label}
                      <span className="text-muted-foreground ml-1 font-mono text-[10px] tabular-nums">
                        {formatMoney(o.price_cents, currency)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {forThisListing.length > 0 && (
            <ul className="space-y-1 border-t pt-2">
              <li className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                Bu rakipte kayıtlı
              </li>
              {forThisListing.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-mono text-xs">{m.our_sku}</span>
                    {m.competitor_label && (
                      <span className="text-muted-foreground">
                        {" "}
                        ← {m.competitor_label}
                      </span>
                    )}
                    {m.price_cents != null && (
                      <span className="text-muted-foreground ml-1 font-mono text-[10px] tabular-nums">
                        {formatMoney(m.price_cents, m.currency ?? currency)}
                      </span>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-[10px]"
                    disabled={pending}
                    onClick={() => removeMatch(m.id)}
                  >
                    Kaldır
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={
                pending ||
                noVariants ||
                !sku ||
                (offerings.length > 0
                  ? !offeringKey
                  : !canUseListingFallback)
              }
              onClick={save}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
