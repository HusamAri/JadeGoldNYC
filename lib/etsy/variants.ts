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
  saleItemsLinked: number;
  /** Etsy'de artık olmayan (eşleşmeyen) silinen panel varyantı sayısı. */
  removed: number;
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
  const live = products.filter((p) => !p.is_deleted);
  // Saf-Etsy kuralı (kullanıcı): panel Etsy'yi BİREBİR yansıtır — Etsy SKU'yu
  // ne veriyorsa o. Mint (panel-üretimi yedek SKU) KALDIRILDI: Etsy'de SKU
  // yoksa panelde de varyant satırı oluşmaz. Yalnız SKU'lu offering'ler yazılır.
  return live
    .filter(
      (p) =>
        (p.sku ?? "").trim() !== "" &&
        // Okunabilir (silinmemiş) offering yoksa YAZMA: aksi halde price_cents
        // null + quantity 0 upsert'lenip paneldeki iyi fiyat/adedi EZER. Etsy'de
        // offering yoksa yazacak bir şey de yok — mevcut satır korunur.
        (p.offerings ?? []).some((o) => !o.is_deleted),
    )
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
 * Tek listing'in Etsy envanterinden varyant fiyat/adetlerini panel'e yazar
 * (gram dokunulmaz). Panelde yanlışlıkla ezilen fiyatları Etsy'ye döndürmek için.
 * Yalnız Etsy'deki SKU'lu offering'ler yazılır — panel SKU üretmez.
 */
export async function syncOneListingVariants(
  orgId: string,
  productId: string,
): Promise<{ variants: number; error?: string }> {
  const admin = createAdminClient();
  const { data: listingData, error: listingErr } = await admin
    .from("products")
    .select("id, etsy_listing_id, title")
    .eq("org_id", orgId)
    .eq("id", productId)
    .maybeSingle();
  if (listingErr) return { variants: 0, error: listingErr.message };
  const listing = listingData as ListingRow | null;
  if (!listing?.etsy_listing_id) {
    return { variants: 0, error: "Bu listing Etsy'ye bağlı değil." };
  }

  try {
    const client = await EtsyClient.forOrg(orgId);
    const inv = await getListingInventory(client, listing.etsy_listing_id);
    const rows = toRows(orgId, listing, inv.products ?? []);
    if (rows.length === 0) {
      return { variants: 0, error: "Etsy envanterinde SKU'lu varyant yok." };
    }
    const { error } = await admin
      .from("product_variants")
      .upsert(rows, { onConflict: "org_id,sku" });
    if (error) return { variants: 0, error: error.message };
    return { variants: rows.length };
  } catch (e) {
    return {
      variants: 0,
      error: e instanceof Error ? e.message : "Etsy varyant senkronu başarısız",
    };
  }
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

  // SATILAMAZ LİSTİNG SKU SAHİPLİĞİ ÇALAMAZ.
  // Varyant satırı (org_id, sku) ile TEKİLDİR: aynı SKU iki listing'de varsa
  // (çift listing) sahiplik her senkronda el değiştirir — panel "0 varyant"
  // gösterir, fiyat itişi yanlış hedefe gider (canlı vaka: 14K Rose Dome).
  // Pasif/süresi dolmuş listing satışta olmadığı için envanteri de karar
  // taşımaz; taramanın dışında bırakılır ve SKU aktif/taslak listing'de kalır.
  // (sold_out satılabilirliğini koruyor sayılır — kapsamda bırakıldı.)
  const { data: listingData } = await admin
    .from("products")
    .select("id, etsy_listing_id, title")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .not("status", "in", "(inactive,expired)")
    .order("etsy_listing_id", { ascending: true })
    .limit(opts.limit ?? 1000);

  const listings = (listingData ?? []) as ListingRow[];
  const result: VariantSyncResult = {
    listings: 0,
    variants: 0,
    skipped: 0,
    errors: 0,
    gramsMatched: 0,
    saleItemsLinked: 0,
    removed: 0,
  };

  for (const listing of listings) {
    if (Date.now() > deadline) break;
    try {
      const inv = await getListingInventory(client, listing.etsy_listing_id);
      const etsyProducts = inv.products ?? [];
      const rows = toRows(orgId, listing, etsyProducts);
      result.skipped += etsyProducts.length - rows.length;
      if (rows.length > 0) {
        const { error } = await admin
          .from("product_variants")
          .upsert(rows, { onConflict: "org_id,sku" });
        if (error) throw new Error(error.message);
        result.variants += rows.length;
      }

      // Etsy-ayna mutabakatı (kullanıcı kuralı: eşleşmeyen varyant kalmaz).
      // Etsy envanteri KESİN okunduysa (getListingInventory throw etmedi ve en
      // az bir ürün döndü), bu üründe Etsy'de karşılığı olmayan panel varyantları
      // silinir. keepSkus = Etsy'nin SKU'lu offering'lerinden yazılanlar; Etsy
      // hiç SKU vermediyse keepSkus BOŞ → tüm eski (ör. backfill) varyantlar
      // silinir (saf-Etsy: SKU yoksa panelde de yok). GÜVENLİK: yalnız
      // etsyProducts>0 iken çalışır — geçici hata (throw) veya boş yanıtta silme
      // yapılmaz (transient wipe önlenir). ID-bazlı silme: kullanıcı-tanımlı Etsy
      // SKU'larında (virgül/parantez) enjeksiyon/kaçış riski yok.
      if (etsyProducts.length > 0) {
        const keepSkus = new Set(rows.map((r) => r.sku));
        const { data: existing, error: exErr } = await admin
          .from("product_variants")
          .select("id, sku")
          .eq("org_id", orgId)
          .eq("product_id", listing.id);
        if (exErr) {
          console.error(
            `[variants] mutabakat okuma (${listing.etsy_listing_id}):`,
            exErr.message,
          );
        } else {
          const staleIds = (existing ?? [])
            .filter((v) => !keepSkus.has((v as { sku: string }).sku))
            .map((v) => (v as { id: string }).id);
          if (staleIds.length > 0) {
            const { error: delErr } = await admin
              .from("product_variants")
              .delete()
              .in("id", staleIds);
            if (delErr) {
              console.error(
                `[variants] mutabakat silme (${listing.etsy_listing_id}):`,
                delErr.message,
              );
            } else {
              result.removed += staleIds.length;
            }
          }
        }
      }
      result.listings += 1;
    } catch {
      result.errors += 1;
    }
  }

  result.gramsMatched = await matchVariantWeights(admin, orgId);
  result.saleItemsLinked = await linkSaleItemsBySku(admin, orgId);
  return result;
}

/**
 * Satış kalemlerini SKU üzerinden ürüne bağlar (product_variants SKU↔product_id
 * eşleşmesinden). Yalnız product_id'si boş kalemleri doldurur. Döndürdüğü sayı
 * bu turda bağlanan kalem sayısıdır. (RPC: migration 0057.)
 */
export async function linkSaleItemsBySku(
  admin: SupabaseClient,
  orgId: string,
): Promise<number> {
  const { data, error } = await admin.rpc("link_sale_items_by_sku", {
    p_org_id: orgId,
  });
  if (error) return 0;
  return (data as number | null) ?? 0;
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
