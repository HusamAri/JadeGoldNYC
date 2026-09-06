"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import {
  updateListingFields,
  type ListingFieldsInput,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import {
  detectKarat,
  purchaseCostCentsForGrams,
  type KaratType,
} from "@/lib/gold-cost";
import { centsToDecimal, formatMoney, parseMoneyToCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SendToEtsyButton } from "@/components/listing/send-to-etsy-button";

/** Boşluk kartının odaklanabilmesi için alan id'leri (tek kaynak). */
export const LISTING_FIELD_IDS = {
  title: "alan-title",
  description: "alan-description",
  tags: "alan-tags",
  materials: "alan-materials",
  price: "alan-price",
  quantity: "alan-quantity",
  research_keyword: "alan-kelime",
} as const;

export interface ListingFieldsInitial {
  title: string;
  description: string | null;
  tags: string[] | string | null;
  materials: string[] | string | null;
  price_cents: number | null;
  quantity: number | null;
  research_keyword: string | null;
}

function listToCsv(v: string[] | string | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return v.join(", ");
}

/** Boş alan etiketi — amber "eksik" vurgusu (Amuletta data-gaps çip dili). */
function MissingChip() {
  return (
    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-amber-600 uppercase shadow-[var(--shadow-raised-sm)] dark:text-amber-400">
      eksik
    </span>
  );
}

const MISSING_RING =
  "ring-1 ring-amber-500/60 focus-visible:ring-amber-500/60 dark:ring-amber-400/50";

/**
 * Künye & boşluk doldurma formu — listing'in TÜM düzenlenebilir alanları tek
 * yerde; boş alanlar amber "eksik" ile vurgulanır, doldurup tek tuşla
 * kaydedilir (updateListingFields server action).
 */
export function ListingFieldsForm({
  productId,
  initial,
  alreadyOnEtsy = false,
  isDraft = false,
  hasVariations = false,
  weightGrams = null,
  purchasePrice14kCents,
  purchasePrice10kCents,
  currency = "USD",
  variantPriceRange = null,
}: {
  productId: string;
  initial: ListingFieldsInitial;
  /** Listing zaten Etsy'de mi? "Etsy'e gönder" yalnız taslakta görünür. */
  alreadyOnEtsy?: boolean;
  /** Panel taslağı Etsy'ye bağlıysa galeri doğrulama ve onarımını gösterir. */
  isDraft?: boolean;
  /** Varyantlı listingde ürün fiyat/adet Etsy'de genelde boş — eksik sayma. */
  hasVariations?: boolean;
  /** Tek-SKU / ürün seviye gram — maliyet tahmini için. */
  weightGrams?: number | null;
  purchasePrice14kCents?: number;
  purchasePrice10kCents?: number;
  currency?: string;
  /** Varyant fiyat aralığı (min–max cent). Varyantlı listingde künye fiyatı
   *  bunun SALT-OKUNUR aynasıdır; gerçek fiyat varyant satırlarında düzenlenir. */
  variantPriceRange?: { minCents: number; maxCents: number } | null;
}) {
  // Varyantlı listingde künye fiyatı düzenlenmez → aynası varyantlardan gelir.
  const mirrorPrice = hasVariations && variantPriceRange != null;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ListingFieldsInput>(() => ({
    title: initial.title,
    description: initial.description ?? "",
    tags: listToCsv(initial.tags),
    materials: listToCsv(initial.materials),
    price:
      initial.price_cents != null
        ? centsToDecimal(initial.price_cents).toFixed(2)
        : "",
    quantity: initial.quantity != null ? String(initial.quantity) : "",
    research_keyword: initial.research_keyword ?? "",
  }));

  const missing = useMemo(() => {
    const base = {
      title: !fields.title.trim(),
      description: !fields.description.trim(),
      tags: !fields.tags.trim(),
      materials: !fields.materials.trim(),
      price: !fields.price.trim(),
      quantity: !fields.quantity.trim(),
      research_keyword: !fields.research_keyword.trim(),
    };
    // Varyantlı ürünlerde fiyat/adet varyant satırında yaşar — künyede "eksik" yanıltır.
    if (hasVariations) {
      base.price = false;
      base.quantity = false;
    }
    return base;
  }, [fields, hasVariations]);

  const anyMissing = Object.values(missing).some(Boolean);

  const priceCost = useMemo(() => {
    const tags = fields.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const materials = fields.materials
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const karat: KaratType | null = detectKarat(
      fields.title,
      tags,
      materials,
    );
    if (!karat || weightGrams == null || !(weightGrams > 0)) {
      return { karat, costCents: null as number | null };
    }
    const costCents = purchaseCostCentsForGrams(weightGrams, karat, {
      "14K": purchasePrice14kCents,
      "10K": purchasePrice10kCents,
    });
    return { karat, costCents };
  }, [
    fields.title,
    fields.tags,
    fields.materials,
    weightGrams,
    purchasePrice14kCents,
    purchasePrice10kCents,
  ]);

  const saleCents = parseMoneyToCents(fields.price);

  function set(key: keyof ListingFieldsInput, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function save() {
    if (!fields.title.trim()) {
      toast.error("Başlık boş olamaz.");
      return;
    }
    setSaving(true);
    updateListingFields(productId, fields)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Künye kaydedildi.");
        router.refresh();
      })
      .finally(() => setSaving(false));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={LISTING_FIELD_IDS.title}>Başlık</Label>
          {missing.title && <MissingChip />}
        </div>
        <Input
          id={LISTING_FIELD_IDS.title}
          value={fields.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Listing başlığı"
          className={cn(missing.title && MISSING_RING)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={LISTING_FIELD_IDS.description}>Açıklama</Label>
          {missing.description && <MissingChip />}
        </div>
        <Textarea
          id={LISTING_FIELD_IDS.description}
          value={fields.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Ürün açıklaması — malzeme, ölçü, bakım…"
          className={cn("min-h-28", missing.description && MISSING_RING)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={LISTING_FIELD_IDS.tags}>Etiketler (virgüllü)</Label>
            {missing.tags && <MissingChip />}
          </div>
          <Input
            id={LISTING_FIELD_IDS.tags}
            value={fields.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="gold chain, cuban link, 14k"
            className={cn(missing.tags && MISSING_RING)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={LISTING_FIELD_IDS.materials}>
              Malzemeler (virgüllü)
            </Label>
            {missing.materials && <MissingChip />}
          </div>
          <Input
            id={LISTING_FIELD_IDS.materials}
            value={fields.materials}
            onChange={(e) => set("materials", e.target.value)}
            placeholder="14k solid gold"
            className={cn(missing.materials && MISSING_RING)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={LISTING_FIELD_IDS.price}>
              Satış fiyatı ($)
              {mirrorPrice ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · varyantlardan
                </span>
              ) : null}
            </Label>
            {missing.price && !mirrorPrice && <MissingChip />}
          </div>
          {mirrorPrice ? (
            // Salt-okunur ayna: aralık varyant satırlarından gelir; künyeden
            // düzenlenmez (yoksa aşağıdaki gerçek varyant fiyatlarıyla ayrışır).
            <>
              <div className="border-input bg-muted/40 text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm tabular-nums">
                {variantPriceRange!.minCents === variantPriceRange!.maxCents
                  ? formatMoney(variantPriceRange!.minCents, currency)
                  : `${formatMoney(variantPriceRange!.minCents, currency)} – ${formatMoney(variantPriceRange!.maxCents, currency)}`}
              </div>
              <p className="text-muted-foreground text-xs">
                Fiyatlar aşağıda varyant satırlarında düzenlenir; künye onun
                aynasıdır. Maliyet/marj varyant matrisinde.
              </p>
            </>
          ) : (
            <>
              <Input
                id={LISTING_FIELD_IDS.price}
                inputMode="decimal"
                value={fields.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="129,00"
                className={cn("tabular-nums", missing.price && MISSING_RING)}
              />
              {priceCost.costCents != null ? (
                <p className="text-muted-foreground text-xs tabular-nums">
                  Alım maliyeti: {formatMoney(priceCost.costCents, currency)}
                  {priceCost.karat ? ` · ${priceCost.karat}` : ""}
                  {weightGrams != null ? ` · ${weightGrams} g` : ""}
                  {saleCents > 0 && (
                    <>
                      {" · "}
                      <span
                        className={
                          saleCents >= priceCost.costCents
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }
                      >
                        {saleCents >= priceCost.costCents ? "+" : ""}
                        {formatMoney(saleCents - priceCost.costCents, currency)}
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Maliyet için ayar (10K/14K) ve gram gerekir
                  {weightGrams == null ? " — varyant/ürün gramı eksik" : ""}.
                </p>
              )}
            </>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={LISTING_FIELD_IDS.quantity}>
              Adet
              {hasVariations ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · varyantlarda
                </span>
              ) : null}
            </Label>
            {missing.quantity && <MissingChip />}
          </div>
          <Input
            id={LISTING_FIELD_IDS.quantity}
            inputMode="numeric"
            value={fields.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="1"
            className={cn("tabular-nums", missing.quantity && MISSING_RING)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={LISTING_FIELD_IDS.research_keyword}>
              Araştırma kelimesi
            </Label>
            {missing.research_keyword && <MissingChip />}
          </div>
          <Input
            id={LISTING_FIELD_IDS.research_keyword}
            value={fields.research_keyword}
            onChange={(e) => set("research_keyword", e.target.value)}
            placeholder="gold cuban chain"
            className={cn(missing.research_keyword && MISSING_RING)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {anyMissing
            ? "Amber işaretli alanlar eksik — doldurup kaydedin."
            : hasVariations
              ? "Künye dolu. Fiyat ve adet varyant satırlarında."
              : "Künye dolu."}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save />}
            Künyeyi kaydet
          </Button>
          {(!alreadyOnEtsy || isDraft) && (
            <SendToEtsyButton
              productId={productId}
              repairExisting={alreadyOnEtsy}
            />
          )}
        </div>
      </div>
    </div>
  );
}
