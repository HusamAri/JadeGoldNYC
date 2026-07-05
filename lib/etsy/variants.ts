import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListingInventory } from "@/lib/etsy/inventory";
import {
  etsyMoneyToCents,
  type EtsyInventoryProduct,
  type EtsyPropertyValue,
} from "@/lib/etsy/types";

export interface VariantSyncResult {
  listings: number;
  variants: number;
  skipped: number;
  errors: number;
  gramsMatched: number;
}

interface ListingRow {
  id: string;
  etsy_listing_id: number;
  title: string | null;
}

/** property_values → okunur beden/renk etiketi (ör. "Length: 7 inches"). */
function propsLabel(props?: EtsyPropertyValue[]): string | null {
  if (!props || props.length === 0) return null;
  const parts = props
    .map((p) => (p.values ?? []).join(", "))
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Bir listing'in envanterindeki (silinmemiş) ürünleri variant satırlarına çevirir. */
function toRows(
  orgId: string,
  listing: ListingRow,
  products: EtsyInventoryProduct[],
) {
  return products
    .filter((p) => !p.is_deleted && (p.sku ?? "").trim() !== "")
    .map((p) => {
      const offerings = (p.offerings ?? []).filter((o) => !o.is_deleted);
      const priceCents = offerings.length
        ? etsyMoneyToCents(offerings[0].price)
        : null;
      const quantity = offerings.reduce((s, o) => s + (o.quantity ?? 0), 0);
      const label = propsLabel(p.property_values);
      return {
        org_id: orgId,
        sku: (p.sku as string).trim(),
        product_id: listing.id,
        etsy_listing_id: listing.etsy_listing_id,
        etsy_product_id: p.product_id ?? null,
        // Ad: listing başlığı + varyant etiketi (beden/renk).
        name: label ? `${listing.title ?? ""} — ${label}`.trim() : listing.title,
        properties: p.property_values ?? null,
        price_cents: priceCents,
        quantity,
        active: true,
        updated_at: new Date().toISOString(),
        // NOT: weight_grams / weight_source BİLEREK yok — mevcut gram korunur
        // (ShipStation'dan gelen ağırlığı Etsy senkronu ezmesin).
      };
    });
}

/**
 * Etsy envanterini gezip her listing'in varyantlarını `product_variants`e yazar
 * (SKU↔listing eşleşmesi + beden/renk property'leri + fiyat/adet). Ağırlık
 * alanına DOKUNMAZ; grams ShipStation'dan eşlenir (matchVariantWeights).
 *
 * Üretimde çalışır (geçerli Etsy token'ı + ETSY_API_SECRET gerekir). Etsy
 * istemcisi 429'da otomatik yeniden dener; süre bütçesi dolunca durur, sonraki
 * çağrı kaldığı yerden sürebilir (offset).
 */
export async function syncListingVariants(
  orgId: string,
  opts: { budgetMs?: number; limit?: number } = {},
): Promise<VariantSyncResult> {
  const deadline = Date.now() + (opts.budgetMs ?? 45_000);
  const admin = createAdminClient();
  const client = await EtsyClient.forOrg(orgId);

  const { data: listingData } = await admin
    .from("products")
    .select("id, etsy_listing_id, title")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .order("etsy_listing_id", { ascending: true })
    .limit(opts.limit ?? 1000);

  const listings = (listingData ?? []) as ListingRow[];
  const result: VariantSyncResult = {
    listings: 0,
    variants: 0,
    skipped: 0,
    errors: 0,
    gramsMatched: 0,
  };

  for (const listing of listings) {
    if (Date.now() > deadline) break;
    try {
      const inv = await getListingInventory(client, listing.etsy_listing_id);
      const rows = toRows(orgId, listing, inv.products ?? []);
      result.skipped += (inv.products ?? []).length - rows.length;
      if (rows.length > 0) {
        const { error } = await admin
          .from("product_variants")
          .upsert(rows, { onConflict: "org_id,sku" });
        if (error) throw new Error(error.message);
        result.variants += rows.length;
      }
      result.listings += 1;
    } catch {
      result.errors += 1;
    }
  }

  result.gramsMatched = await matchVariantWeights(admin, orgId);
  return result;
}

/**
 * ShipStation `internalNotes` gramajlarını SKU eşleşen varyantlara yazar
 * (yalnız ağırlığı boş olanlara — elle/önceki değerleri ezmez). Döndürdüğü
 * sayı bu turda ağırlık kazanan varyant sayısıdır.
 */
export async function matchVariantWeights(
  admin: SupabaseClient,
  orgId: string,
): Promise<number> {
  const { data, error } = await admin.rpc("match_variant_weights_from_shipstation", {
    p_org_id: orgId,
  });
  if (error) return 0;
  return (data as number | null) ?? 0;
}
