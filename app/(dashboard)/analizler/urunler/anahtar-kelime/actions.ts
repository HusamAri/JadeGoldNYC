"use server";

import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  addCompetitorWatch,
  captureWatchPrice,
  deactivateCompetitorWatch,
  parseListingIdFromUrl,
} from "@/lib/etsy/competitor-watch";
import {
  fetchCompetitorOfferings,
  proposeAutoMatches,
} from "@/lib/etsy/keyword-research";
import type { RawVariantProperties } from "@/lib/variant-properties";
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
  /** Ekleme/otomatik eşleştirmede kurulan yeni eşleşme sayısı (varsa). */
  matched?: number;
}

/**
 * "Aynı varyantı otomatik eşleştir" — verilen rakip listing'in canlı
 * tekliflerini çeker, bizim varyantlarla beden/ayar token'ıyla TEK-KESİN
 * eşleşenleri `competitor_variant_match`'e yazar. Zaten (bu listing için)
 * eşlenen SKU'lar atlanır → manuel eşleşme ezilmez, çift yazılmaz. Belirsiz
 * eşleşmeler manuel EŞLEŞTİR'e bırakılır. SKU kaynağı product_variants
 * olduğundan ayrıca doğrulama gerekmez. Yeni eşleşme sayısını döndürür.
 */
async function autoMatchWithClient(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  userId: string,
  productId: string,
  competitorListingId: number,
  currency: string,
): Promise<number> {
  const { data: variants, error: vErr } = await admin
    .from("product_variants")
    .select("sku, properties")
    .eq("org_id", orgId)
    .eq("product_id", productId);
  if (vErr) {
    console.error("[rakip-oto-eşleştir] varyant sorgusu:", vErr.message);
    return 0;
  }
  const ours = ((variants ?? []) as {
    sku: string | null;
    properties: RawVariantProperties;
  }[])
    .filter((v) => !!v.sku?.trim())
    .map((v) => ({ sku: v.sku as string, properties: v.properties }));
  if (ours.length === 0) return 0;

  const offerings = await fetchCompetitorOfferings(
    client,
    competitorListingId,
    currency,
  );
  if (offerings.length === 0) return 0;

  const proposals = proposeAutoMatches(ours, offerings);
  if (proposals.length === 0) return 0;

  // Bu rakip listing için zaten eşlenen SKU'ları atla (manuel ezilmesin).
  const { data: existing } = await admin
    .from("competitor_variant_match")
    .select("our_sku")
    .eq("org_id", orgId)
    .eq("product_id", productId)
    .eq("competitor_listing_id", competitorListingId);
  const already = new Set(
    ((existing ?? []) as { our_sku: string }[]).map((r) => r.our_sku),
  );
  const fresh = proposals.filter((p) => !already.has(p.our_sku));
  if (fresh.length === 0) return 0;

  const nowIso = new Date().toISOString();
  const rows = fresh.map((p) => ({
    org_id: orgId,
    product_id: productId,
    our_sku: p.our_sku,
    competitor_listing_id: competitorListingId,
    competitor_product_id: p.competitor_product_id,
    competitor_label: p.competitor_label,
    competitor_size: p.competitor_size,
    competitor_karat: p.competitor_karat,
    price_cents: p.price_cents,
    currency,
    created_by: userId,
    updated_at: nowIso,
  }));
  const { error } = await admin
    .from("competitor_variant_match")
    .upsert(rows, {
      onConflict: "org_id,product_id,our_sku,competitor_listing_id",
    });
  if (error) {
    console.error("[rakip-oto-eşleştir] upsert:", error.message);
    return 0;
  }
  return rows.length;
}

/** Var olan bir rakip için aynı varyantları elle tetiklenen otomatik eşleştirme. */
export async function autoMatchCompetitor(
  productId: string,
  competitorListingId: number,
  currency = "USD",
): Promise<CompetitorWatchActionResult> {
  const m = await requireMembership();
  if (!competitorListingId)
    return { error: "Rakip listing kimliği gerekli." };
  const admin = createAdminClient();
  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Otomatik eşleştirme için Etsy bağlantısı gerekli.",
    };
  }
  const matched = await autoMatchWithClient(
    admin,
    client,
    m.org_id,
    m.user_id,
    productId,
    competitorListingId,
    currency,
  );
  revalidateWatchSurfaces(productId);
  return { ok: true, matched };
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

  // Ekler eklemez: (1) tek seferlik fiyat çekimi, (2) aynı varyantları otomatik
  // eşleştir (tek Etsy istemcisiyle). Etsy bağlı değilse ikisi de sessizce
  // atlanır; kart yine eklenir, günlük cron fiyatı sonra doldurur.
  let matched = 0;
  try {
    const client = await EtsyClient.forOrg(m.org_id);
    await captureWatchPrice(admin, client, {
      id: r.id,
      org_id: m.org_id,
      competitor_listing_id: listingId,
    });
    matched = await autoMatchWithClient(
      admin,
      client,
      m.org_id,
      m.user_id,
      productId,
      listingId,
      "USD",
    );
  } catch {
    // İlk fiyat/eşleştirme yapılamadı (Etsy bağlı değil / geçici hata) —
    // izleme durur; manuel EŞLEŞTİR ve günlük cron fiyatı telafi eder.
  }

  revalidateWatchSurfaces(productId);
  return { ok: true, matched };
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

/**
 * Bizim SKU ↔ rakip teklif eşlemesini kaydeder (upsert).
 * SKU kaynağı yalnız Etsy senkronu: product_variants.sku veya (varyantsızsa)
 * products.sku. Uydurma / ürün-id dilimi / elle icat SKU reddedilir.
 * products / product_variants satırlarına ASLA yazılmaz.
 */
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
  const ourSku = input.our_sku.trim();
  if (!ourSku) return { error: "Bizim varyant (SKU) seçin." };
  if (!input.competitor_listing_id)
    return { error: "Rakip listing kimliği gerekli." };

  const admin = createAdminClient();

  // SKU truth: Etsy sync alanları — eşleşme tablosuna yazmadan önce doğrula.
  const { data: variantHit, error: vErr } = await admin
    .from("product_variants")
    .select("sku")
    .eq("org_id", m.org_id)
    .eq("product_id", productId)
    .eq("sku", ourSku)
    .maybeSingle();
  if (vErr) return { error: vErr.message };

  let allowed = !!variantHit;
  if (!allowed) {
    const { data: productHit, error: pErr } = await admin
      .from("products")
      .select("sku")
      .eq("org_id", m.org_id)
      .eq("id", productId)
      .maybeSingle();
    if (pErr) return { error: pErr.message };
    const productSku = (productHit as { sku: string | null } | null)?.sku?.trim();
    allowed = !!productSku && productSku === ourSku;
  }
  if (!allowed) {
    return {
      error:
        "SKU Etsy kaydıyla eşleşmiyor — yalnız senkron varyant/ürün SKU’su seçilebilir.",
    };
  }

  const { error } = await admin.from("competitor_variant_match").upsert(
    {
      org_id: m.org_id,
      product_id: productId,
      our_sku: ourSku,
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
