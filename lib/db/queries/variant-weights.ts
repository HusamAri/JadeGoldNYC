import { createClient } from "@/lib/supabase/server";
import type { EtsyPropertyValue } from "@/lib/etsy/types";
import {
  buildWeightBlock,
  injectWeightBlock,
  type VariantWeight,
} from "@/lib/etsy/weights";

export interface ListingWeightPreview {
  productId: string;
  etsyListingId: number;
  title: string;
  variantCount: number;
  block: string;
  /** Yerel (senkron) açıklamaya göre önizlenen yeni açıklama. */
  previewDescription: string;
  /** Blok yerel açıklamada zaten var mı (idempotent gösterge). */
  alreadyHasBlock: boolean;
  /**
   * Açıklamadaki blok, üretilen güncel blokla birebir aynı mı — true ise
   * gönderim no-op olur; listede "bekleyen" değil "güncel" grubuna düşer.
   */
  upToDate: boolean;
}

export interface VariantListingOption {
  id: string;
  title: string;
  variantCount: number;
}

/**
 * Otomatik Varyant hesaplayıcısının listing seçicisi — org'un varyantı olan
 * ürünleri (id + başlık + varyant sayısı). Sayım gömülü aggregate ile alınır;
 * satır limiti riski yok (ürün sayısı < sayfa boyutu).
 */
export async function listVariantListingOptions(
  orgId: string,
): Promise<VariantListingOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title, product_variants(count)")
    .eq("org_id", orgId)
    .order("title", { ascending: true });
  if (error) {
    console.error("[variant-weights] listVariantListingOptions:", error.message);
    return [];
  }
  const rows = (data ?? []) as {
    id: string;
    title: string | null;
    product_variants: { count: number }[] | null;
  }[];
  return rows
    .map((r) => ({
      id: r.id,
      title: r.title ?? "Başlıksız listing",
      variantCount: r.product_variants?.[0]?.count ?? 0,
    }))
    .filter((r) => r.variantCount > 0);
}

interface VariantRow {
  sku: string;
  weight_grams: number;
  properties: EtsyPropertyValue[] | null;
  product_id: string | null;
  etsy_listing_id: number | null;
}
interface ProductRow {
  id: string;
  etsy_listing_id: number | null;
  title: string | null;
  description: string | null;
}

/**
 * Ağırlığı olan varyantları listing'e göre gruplar ve her listing için Etsy
 * açıklamasına eklenecek beden→gram bloğunu + önizleme açıklamasını üretir.
 * Yalnız listing'e BAĞLI (etsy_listing_id dolu) ve gramı olan varyantlar
 * dahildir — eşleşme (Etsy envanter senkronu) çalışmadan liste boş gelir.
 */
export async function listingsWithVariantWeights(
  orgId: string,
): Promise<ListingWeightPreview[]> {
  const supabase = await createClient();

  const { data: vData } = await supabase
    .from("product_variants")
    .select("sku, weight_grams, properties, product_id, etsy_listing_id")
    .eq("org_id", orgId)
    .not("weight_grams", "is", null)
    .not("etsy_listing_id", "is", null);
  const variants = (vData ?? []) as VariantRow[];
  if (variants.length === 0) return [];

  const productIds = [...new Set(variants.map((v) => v.product_id).filter(Boolean))] as string[];
  const { data: pData } = await supabase
    .from("products")
    .select("id, etsy_listing_id, title, description")
    .eq("org_id", orgId)
    .in("id", productIds);
  const products = new Map(
    ((pData ?? []) as ProductRow[]).map((p) => [p.id, p]),
  );

  const byProduct = new Map<string, VariantRow[]>();
  for (const v of variants) {
    if (!v.product_id) continue;
    const list = byProduct.get(v.product_id) ?? [];
    list.push(v);
    byProduct.set(v.product_id, list);
  }

  const out: ListingWeightPreview[] = [];
  for (const [productId, rows] of byProduct) {
    const p = products.get(productId);
    if (!p || p.etsy_listing_id == null) continue;
    const weights: VariantWeight[] = rows.map((r) => ({
      sku: r.sku,
      weightGrams: Number(r.weight_grams),
      properties: r.properties,
    }));
    const karatHint = /14k/i.test(p.title ?? "")
      ? "14K"
      : /10k/i.test(p.title ?? "")
        ? "10K"
        : undefined;
    const block = buildWeightBlock(weights, { karatHint });
    if (!block) continue;
    const desc = p.description ?? "";
    const previewDescription = injectWeightBlock(desc, block);
    out.push({
      productId,
      etsyListingId: p.etsy_listing_id,
      title: p.title ?? `Liste ${p.etsy_listing_id}`,
      variantCount: weights.filter((w) => w.weightGrams > 0).length,
      block,
      previewDescription,
      alreadyHasBlock: desc.includes("<!-- JG-WEIGHTS -->"),
      // Yerel açıklama gönderim SONRASI yazıldığı için Etsy durumunun vekilidir.
      upToDate: desc.length > 0 && previewDescription === desc,
    });
  }
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}
