"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  addCompetitorWatch,
  captureWatchPrice,
  deactivateCompetitorWatch,
  parseListingIdFromUrl,
} from "@/lib/etsy/competitor-watch";
import type { MappedKeywordRow } from "@/lib/csv/mappers/etsy-keywords";

export interface KeywordImportResult {
  ok?: boolean;
  error?: string;
  matched?: number;
  unmatched?: number;
}

/**
 * İçe aktarılan anahtar kelime satırlarını org ürünleriyle eşleştirip
 * `research_keyword`'e yazar. Eşleşme: önce etsy_listing_id (kesin), sonra
 * başlık (tam ya da içeren). Bulk yazım service-role ile (org'a kilitli).
 */
export async function commitKeywordImport(
  rows: MappedKeywordRow[],
): Promise<KeywordImportResult> {
  const m = await requireMembership();
  if (!rows.length) return { error: "İçe aktarılacak satır yok." };

  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, etsy_listing_id, title")
    .eq("org_id", m.org_id);

  const byId = new Map<number, string>();
  const byTitle = new Map<string, string>();
  for (const p of (products ?? []) as {
    id: string;
    etsy_listing_id: number | null;
    title: string;
  }[]) {
    if (p.etsy_listing_id) byId.set(p.etsy_listing_id, p.id);
    if (p.title) byTitle.set(p.title.toLowerCase().trim(), p.id);
  }

  const updates: { id: string; keyword: string }[] = [];
  let unmatched = 0;
  for (const r of rows) {
    let pid: string | undefined;
    if (r.listingId) pid = byId.get(r.listingId);
    if (!pid && r.title) {
      const t = r.title.toLowerCase().trim();
      pid =
        byTitle.get(t) ??
        [...byTitle.entries()].find(
          ([k]) => k.includes(t) || t.includes(k),
        )?.[1];
    }
    if (pid) updates.push({ id: pid, keyword: r.keyword });
    else unmatched++;
  }

  for (const u of updates) {
    await admin
      .from("products")
      .update({ research_keyword: u.keyword })
      .eq("id", u.id)
      .eq("org_id", m.org_id);
  }

  revalidatePath("/analizler/urunler");
  return { ok: true, matched: updates.length, unmatched };
}

// ── Rakip seti (0091) — organik rakibi sabit comp-set'e ekle/çıkar ──────────
// Panel birden çok sayfada render edilir; action sonrası istemci router.refresh
// çağırır, yine de bilinen yüzeyler revalidate edilir.

export interface CompetitorWatchActionResult {
  ok?: boolean;
  error?: string;
}

function revalidateWatchSurfaces(productId: string) {
  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath(`/analizler/urunler/liste/${productId}`);
  revalidatePath("/analizler/urunler");
}

/**
 * Organik rakip satırını ürünün sabit rakip setine ekler. Eski snapshot'larda
 * listing_id yoktur — URL'den /listing/(\d+)/ ile çözülür. Ekler eklemez tek
 * seferlik fiyat çekimi denenir (kart hemen dolsun); Etsy bağlı değilse cron
 * ertesi gün doldurur.
 */
/** Ürün başına sabit rakip seti üst sınırı (elle link ekleme + organik ekleme). */
const MAX_COMPETITORS_PER_PRODUCT = 10;

export async function addCompetitorToSet(
  productId: string,
  competitor: {
    listing_id?: number | null;
    url: string | null;
    title?: string | null;
    shop_name?: string | null;
    color?: string | null;
    image_url?: string | null;
  },
): Promise<CompetitorWatchActionResult> {
  const m = await requireMembership();
  const listingId =
    competitor.listing_id ?? parseListingIdFromUrl(competitor.url);
  if (!listingId)
    return { error: "Rakip listing kimliği çözülemedi (geçerli bir Etsy listing linki girin)." };

  const admin = createAdminClient();

  // 10'luk üst sınır: zaten sette OLMAYAN yeni bir listing eklenirken kontrol
  // edilir (aynı listing'in yeniden aktiflenmesi sınırı artırmaz — upsert).
  const { data: existing, error: exErr } = await admin
    .from("competitor_watch")
    .select("competitor_listing_id")
    .eq("org_id", m.org_id)
    .eq("product_id", productId)
    .eq("active", true);
  if (exErr) return { error: exErr.message };
  const rows = (existing ?? []) as { competitor_listing_id: number }[];
  const alreadyWatched = rows.some(
    (w) => w.competitor_listing_id === listingId,
  );
  if (!alreadyWatched && rows.length >= MAX_COMPETITORS_PER_PRODUCT)
    return { error: "En fazla 10 rakip eklenebilir." };

  const r = await addCompetitorWatch(admin, m.org_id, m.user_id, {
    product_id: productId,
    competitor_listing_id: listingId,
    shop_name: competitor.shop_name ?? null,
    title: competitor.title ?? null,
    url: competitor.url,
    color: competitor.color ?? null,
    image_url: competitor.image_url ?? null,
  });
  if ("error" in r) return { error: r.error };

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    await captureWatchPrice(admin, client, {
      id: r.id,
      org_id: m.org_id,
      competitor_listing_id: listingId,
    });
  } catch {
    // İlk fiyat çekilemedi (Etsy bağlı değil / geçici hata) — izleme durur,
    // günlük cron fiyatı doldurur.
  }

  revalidateWatchSurfaces(productId);
  return { ok: true };
}

/** İzlemeyi rakip setinden çıkarır (pasifler — fiyat tarihi korunur). */
export async function removeCompetitorFromSet(
  productId: string,
  watchId: string,
): Promise<CompetitorWatchActionResult> {
  const m = await requireMembership();
  const admin = createAdminClient();
  const r = await deactivateCompetitorWatch(admin, m.org_id, watchId);
  if (r.error) return { error: r.error };
  revalidateWatchSurfaces(productId);
  return { ok: true };
}

// ── Manuel varyant eşleştirme (0102) ───────────────────────────────────────

export interface CompetitorOfferingOption {
  product_id: number | null;
  label: string;
  size: string | null;
  karat: string | null;
  price_cents: number;
}

/** Rakip listing'in canlı tekliflerini çeker (eşleştirme diyaloğu). */
export async function listCompetitorOfferingsForMatch(
  competitorListingId: number,
  currency = "USD",
): Promise<{ offerings?: CompetitorOfferingOption[]; error?: string }> {
  const m = await requireMembership();
  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const { fetchCompetitorOfferings } = await import(
      "@/lib/etsy/keyword-research"
    );
    const offs = await fetchCompetitorOfferings(
      client,
      competitorListingId,
      currency,
    );
    return {
      offerings: offs.map((o) => ({
        product_id: o.product_id,
        label: o.label,
        size: o.tokens.size,
        karat: o.tokens.karat,
        price_cents: o.price_cents,
      })),
    };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Rakip teklifleri okunamadı (Etsy bağlantısı?).",
    };
  }
}

/** Bizim SKU ↔ rakip teklif eşlemesini kaydeder (upsert). */
export async function saveCompetitorVariantMatch(
  productId: string,
  input: {
    our_sku: string;
    competitor_listing_id: number;
    competitor_product_id?: number | null;
    competitor_label?: string | null;
    competitor_size?: string | null;
    competitor_karat?: string | null;
    price_cents?: number | null;
    currency?: string;
  },
): Promise<CompetitorWatchActionResult> {
  const m = await requireMembership();
  if (!input.our_sku.trim()) return { error: "Bizim varyant (SKU) seçin." };
  if (!input.competitor_listing_id)
    return { error: "Rakip listing kimliği gerekli." };

  const admin = createAdminClient();
  const { error } = await admin.from("competitor_variant_match").upsert(
    {
      org_id: m.org_id,
      product_id: productId,
      our_sku: input.our_sku.trim(),
      competitor_listing_id: input.competitor_listing_id,
      competitor_product_id: input.competitor_product_id ?? null,
      competitor_label: input.competitor_label ?? null,
      competitor_size: input.competitor_size ?? null,
      competitor_karat: input.competitor_karat ?? null,
      price_cents: input.price_cents ?? null,
      currency: input.currency ?? "USD",
      created_by: m.user_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,product_id,our_sku,competitor_listing_id" },
  );
  if (error) return { error: error.message };
  revalidateWatchSurfaces(productId);
  return { ok: true };
}

/** Tek eşleştirmeyi siler. */
export async function removeCompetitorVariantMatch(
  productId: string,
  matchId: string,
): Promise<CompetitorWatchActionResult> {
  const m = await requireMembership();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("competitor_variant_match")
    .delete()
    .eq("id", matchId)
    .eq("org_id", m.org_id)
    .eq("product_id", productId)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Eşleştirme bulunamadı." };
  revalidateWatchSurfaces(productId);
  return { ok: true };
}
