"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import {
  updateListingFields,
  type ListingFieldsInput,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { centsToDecimal } from "@/lib/money";
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
  tags: string[] | null;
  materials: string[] | null;
  price_cents: number | null;
  quantity: number | null;
  research_keyword: string | null;
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
}: {
  productId: string;
  initial: ListingFieldsInitial;
  /** Listing zaten Etsy'de mi (etsy_listing_id dolu)? "Etsy'e gönder" yalnız
   *  taslakta (false) görünür — mükerrer taslak açılmaz. */
  alreadyOnEtsy?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ListingFieldsInput>(() => ({
    title: initial.title,
    description: initial.description ?? "",
    tags: (initial.tags ?? []).join(", "),
    materials: (initial.materials ?? []).join(", "),
    price:
      initial.price_cents != null
        ? centsToDecimal(initial.price_cents).toFixed(2)
        : "",
    quantity: initial.quantity != null ? String(initial.quantity) : "",
    research_keyword: initial.research_keyword ?? "",
  }));

  const missing = useMemo(
    () => ({
      title: !fields.title.trim(),
      description: !fields.description.trim(),
      tags: !fields.tags.trim(),
      materials: !fields.materials.trim(),
      price: !fields.price.trim(),
      quantity: !fields.quantity.trim(),
      research_keyword: !fields.research_keyword.trim(),
    }),
    [fields],
  );

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
            <Label htmlFor={LISTING_FIELD_IDS.price}>Fiyat ($)</Label>
            {missing.price && <MissingChip />}
          </div>
          <Input
            id={LISTING_FIELD_IDS.price}
            inputMode="decimal"
            value={fields.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="129,00"
            className={cn("tabular-nums", missing.price && MISSING_RING)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={LISTING_FIELD_IDS.quantity}>Adet</Label>
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
          Amber işaretli alanlar eksik — doldurup kaydedin.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save />}
            Künyeyi kaydet
          </Button>
          {/* Taslağı (etsy_listing_id boş) Etsy'de DRAFT açar; zaten Etsy'de
              olan listing'de gizlenir (mükerrer taslak önlenir). */}
          {!alreadyOnEtsy && <SendToEtsyButton productId={productId} />}
        </div>
      </div>
    </div>
  );
}
