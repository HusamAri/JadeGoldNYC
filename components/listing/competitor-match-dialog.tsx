"use client";

import { useRef, useState, useTransition } from "react";
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
}: {
  productId: string;
  competitorListingId: number;
  competitorTitle?: string | null;
  currency?: string;
  ourVariants: { sku: string; label: string; weight_grams?: number | null }[];
  existingMatches: CompetitorVariantMatchItem[];
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
    void listCompetitorOfferingsForMatch(competitorListingId, currency)
      .then((r) => {
        if (gen !== loadGen.current) return;
        setLoadingOffs(false);
        if (r.error) {
          setLoadError(r.error);
          setOfferings([]);
          return;
        }
        setOfferings(r.offerings ?? []);
      })
      .catch((e: unknown) => {
        // Reject (ağ kopması) catch'siz kalırsa yükleyici sonsuza dek döner.
        if (gen !== loadGen.current) return;
        setLoadingOffs(false);
        setLoadError(e instanceof Error ? e.message : "Varyantlar yüklenemedi.");
        setOfferings([]);
      });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) loadOfferings();
  }

  function selectedOffering(): CompetitorOfferingOption | null {
    if (!offeringKey) return null;
    if (offeringKey === "__listing__") {
      // Tek fiyat / listing seviyesi — ilk teklif veya yok.
      return offerings[0] ?? null;
    }
    const idx = Number(offeringKey);
    return Number.isFinite(idx) ? (offerings[idx] ?? null) : null;
  }

  function save() {
    if (!sku) {
      toast.error("Bizim varyantı seçin.");
      return;
    }
    const off = selectedOffering();
    if (!off && offerings.length > 0) {
      toast.error("Rakip teklif seçin.");
      return;
    }
    start(async () => {
      const r = await saveCompetitorVariantMatch(productId, {
        our_sku: sku,
        competitor_listing_id: competitorListingId,
        competitor_product_id: off?.product_id ?? null,
        competitor_label: off?.label ?? competitorTitle ?? null,
        competitor_size: off?.size ?? null,
        competitor_karat: off?.karat ?? null,
        price_cents: off?.price_cents ?? null,
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

  if (ourVariants.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] tracking-wide uppercase"
          title="Bu rakibi bizim bir varyantla eşleştir"
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
          <div className="space-y-1.5">
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              Bizim varyant
            </p>
            <Select value={sku} onValueChange={setSku}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Varyant seç…" />
              </SelectTrigger>
              <SelectContent>
                {ourVariants.map((v) => (
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
              <p className="text-destructive text-sm">{loadError}</p>
            ) : offerings.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Varyant teklifi yok — listing fiyatı eşleştirilir (yeniden araştır
                sonrası güncellenir).
              </p>
            ) : (
              <Select value={offeringKey} onValueChange={setOfferingKey}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Teklif seç…" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((o, i) => (
                    <SelectItem key={`${o.product_id ?? i}-${o.label}`} value={String(i)}>
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
              disabled={pending || !sku || (offerings.length > 0 && !offeringKey)}
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
