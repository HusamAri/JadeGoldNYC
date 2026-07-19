import type { SupabaseClient } from "@supabase/supabase-js";

import { EtsyClient } from "./client";
import { etsyPaths } from "./endpoints";
import type { EtsyListing, EtsyListResponse } from "./types";

/**
 * Etsy listing id backfill (reconcile).
 *
 * Sorun: "Etsy'e gönder" taslağı Etsy'de AÇAR sonra `products.etsy_listing_id`
 * yazar. Yazım (mirror) adımı hata verirse listing Etsy'de canlıdır ama panel
 * taslağının `etsy_listing_id`'si NULL kalır → taslak sonsuza dek "Listing
 * Önerileri"nde takılır (öneri filtresi `etsy_listing_id IS NULL`), bir sonraki
 * senkron da onu eşleştiremez (`onConflict: org_id,etsy_listing_id`) ve AYRI bir
 * ürün satırı (duplicate) açar.
 *
 * Çözüm: Etsy'deki tüm listing'leri (her durum) çek, SKU ailesiyle panel
 * taslağına eşle, `etsy_listing_id` + `url`'i taslağa yaz. Böylece taslak
 * Önerilerden düşer, Listeler'e taşınır ve sonraki senkron duplicate açmaz.
 *
 * GÜVENLİK: `products`'ta `(org_id, etsy_listing_id)` benzersizdir. Bir
 * listing id'yi zaten BAŞKA satır tutuyorsa (senkronun açtığı duplicate),
 * taslağa yazmak benzersizliği bozar → o durum YAZILMAZ, `conflicts`'te
 * raporlanır (elle merge gerekir). Aynı aileye birden çok Etsy listing'i
 * düşerse `ambiguous`'ta raporlanır. Otomatik silme/merge YOK.
 */

/** Etsy'nin durum sayfaları — aktif + aktif-olmayan tüm envanter. */
const LISTING_STATES = ["active", "inactive", "sold_out", "draft", "expired"] as const;
const PAGE = 100;

/** `GLD-R-1401-6MM-4.5` → `GLD-R-1401`. Varyant son ekini (`-<W>MM-<beden>`) söker. */
export function familyFromSku(sku: string): string {
  const m = sku.match(/^(.+)-\d+MM-\d+(?:\.\d+)?$/i);
  return m ? m[1] : sku;
}

export interface ReconcileLink {
  productId: string;
  familySku: string;
  listingId: number;
  url: string;
}
export interface ReconcileConflict {
  familySku: string;
  listingId: number;
  reason: string;
}
export interface ReconcileResult {
  scannedListings: number;
  draftCount: number;
  linked: ReconcileLink[];
  conflicts: ReconcileConflict[];
  ambiguous: ReconcileConflict[];
  unmatchedDrafts: { productId: string; familySku: string }[];
  warnings: string[];
}

/** Etsy'deki tüm listing'leri (her durum) sayfa sayfa çek. */
async function fetchAllShopListings(
  client: EtsyClient,
  shopId: number,
): Promise<EtsyListing[]> {
  const all: EtsyListing[] = [];
  for (const state of LISTING_STATES) {
    let offset = 0;
    // Güvenlik tavanı: 5000 listing (50 sayfa) — sonsuz döngü engeli.
    for (let guard = 0; guard < 50; guard++) {
      const page = await client.get<EtsyListResponse<EtsyListing>>(
        etsyPaths.shopListings(shopId),
        { limit: PAGE, offset, state },
      );
      const results = page.results ?? [];
      all.push(...results);
      if (results.length < PAGE) break;
      offset += PAGE;
    }
  }
  return all;
}

/**
 * Panel taslaklarını (etsy_listing_id NULL) Etsy listing'leriyle SKU ailesiyle
 * eşleyip `etsy_listing_id`'yi backfill eder. Yalnız çakışmasız durumlar yazılır.
 */
export async function reconcileEtsyListingIds(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
): Promise<ReconcileResult> {
  const warnings: string[] = [];

  // 1) Etsy'deki tüm listing'ler → aile → [{listingId, url}].
  const listings = await fetchAllShopListings(client, shopId);
  const byFamily = new Map<string, { listingId: number; url: string }[]>();
  const listingIdToFamily = new Map<number, string>();
  for (const l of listings) {
    const firstSku = l.sku?.[0];
    if (!firstSku || !l.listing_id) continue;
    const fam = familyFromSku(firstSku);
    const url = l.url ?? `https://www.etsy.com/listing/${l.listing_id}`;
    const arr = byFamily.get(fam) ?? [];
    // Aynı listing'i iki kez sayma (durum sayfaları örtüşebilir).
    if (!arr.some((x) => x.listingId === l.listing_id)) arr.push({ listingId: l.listing_id, url });
    byFamily.set(fam, arr);
    listingIdToFamily.set(l.listing_id, fam);
  }

  // 2) Zaten kullanılan etsy_listing_id'ler (benzersizlik kilidi).
  const { data: taken, error: takenErr } = await admin
    .from("products")
    .select("etsy_listing_id")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null);
  if (takenErr) throw new Error(`etsy_listing_id okunamadı: ${takenErr.message}`);
  const takenIds = new Set<number>(
    (taken ?? []).map((r) => (r as { etsy_listing_id: number }).etsy_listing_id),
  );

  // 3) Panel taslakları: etsy_listing_id NULL, arşivsiz.
  const { data: drafts, error: draftErr } = await admin
    .from("products")
    .select("id, sku")
    .eq("org_id", orgId)
    .is("etsy_listing_id", null)
    .is("archived_at", null)
    .not("sku", "is", null);
  if (draftErr) throw new Error(`Taslaklar okunamadı: ${draftErr.message}`);

  const linked: ReconcileLink[] = [];
  const conflicts: ReconcileConflict[] = [];
  const ambiguous: ReconcileConflict[] = [];
  const unmatchedDrafts: { productId: string; familySku: string }[] = [];

  for (const d of (drafts ?? []) as { id: string; sku: string }[]) {
    const fam = d.sku; // panel ürün sku'su = aile (ör. GLD-R-1401)
    const cand = byFamily.get(fam);
    if (!cand || cand.length === 0) {
      unmatchedDrafts.push({ productId: d.id, familySku: fam });
      continue;
    }
    if (cand.length > 1) {
      ambiguous.push({
        familySku: fam,
        listingId: cand[0].listingId,
        reason: `Aynı aileye ${cand.length} Etsy listing'i düşüyor (${cand
          .map((c) => c.listingId)
          .join(", ")}) — elle eşle.`,
      });
      continue;
    }
    const { listingId, url } = cand[0];
    if (takenIds.has(listingId)) {
      conflicts.push({
        familySku: fam,
        listingId,
        reason: `Listing #${listingId} zaten başka bir panel satırına bağlı (senkron duplicate'i olası) — elle merge gerekir.`,
      });
      continue;
    }
    // 4) Backfill — taslağa etsy_listing_id + url yaz.
    const { error: updErr } = await admin
      .from("products")
      .update({ etsy_listing_id: listingId, url })
      .eq("id", d.id)
      .eq("org_id", orgId)
      .is("etsy_listing_id", null); // yarış koruması
    if (updErr) {
      conflicts.push({ familySku: fam, listingId, reason: `Yazılamadı: ${updErr.message}` });
      continue;
    }
    takenIds.add(listingId);
    linked.push({ productId: d.id, familySku: fam, listingId, url });
  }

  return {
    scannedListings: listings.length,
    draftCount: (drafts ?? []).length,
    linked,
    conflicts,
    ambiguous,
    unmatchedDrafts,
    warnings,
  };
}
