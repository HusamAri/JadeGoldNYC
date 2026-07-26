"use server";

import { revalidatePath } from "next/cache";

import {
  requireMembership,
  isManager,
  MANAGER_ONLY_ERROR,
} from "@/lib/auth";
import { isEonActive } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeHtmlEntities, hasHtmlEntities } from "@/lib/etsy/text";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  applyEonPersonalization,
  getListingPersonalization,
  matchesEonPersonalization,
  summarizePersonalization,
} from "@/lib/etsy/personalization";
import { fetchAllPages } from "@/lib/db/queries/listings";

const PATH = "/tasarimlar/iyilestir";

/**
 * Listing İyileştirme aksiyonları.
 * - normalizeTitleEntities: panel verisi (Etsy'ye yazmaz)
 * - scan / push EON personalization: canlı Etsy (Alura listing-helper fix deseni)
 */

export async function normalizeTitleEntities(): Promise<{
  ok?: boolean;
  fixed?: number;
  error?: string;
}> {
  const m = await requireMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .eq("org_id", m.org_id)
    .or("title.ilike.%&quot;%,title.ilike.%&#%,title.ilike.%&amp;%,title.ilike.%&apos;%");
  if (error) return { error: error.message };

  const rows = ((data ?? []) as { id: string; title: string | null }[]).filter(
    (r) => r.title != null && hasHtmlEntities(r.title),
  );
  if (rows.length === 0) return { ok: true, fixed: 0 };

  const admin = createAdminClient();
  let fixed = 0;
  for (const r of rows) {
    const decoded = decodeHtmlEntities(r.title!);
    if (decoded === r.title) continue;
    const { error: upErr } = await admin
      .from("products")
      .update({ title: decoded, updated_at: new Date().toISOString() })
      .eq("id", r.id)
      .eq("org_id", m.org_id);
    if (upErr) return { error: `${r.id}: ${upErr.message}` };
    fixed += 1;
  }

  // Not: products tablosunun audit trigger'ı her update'i şirket hafızasına
  // zaten yazar — ayrıca semantik log gerekmez.
  revalidatePath(PATH);
  revalidatePath("/tasarimlar");
  return { ok: true, fixed };
}

export interface PersonalizationScanItem {
  etsyListingId: number;
  productId: string | null;
  title: string;
  summary: string;
}

export interface PersonalizationScanResult {
  scanned: number;
  matched: number;
  mismatches: PersonalizationScanItem[];
  error?: string;
}

/**
 * Aktif (+ isteğe bağlı draft) Etsy listing'lerinin kişiselleştirmesini
 * kanonik EON sete karşı tarar. Yalnız EON org. Yazma yapmaz.
 */
export async function scanEonPersonalization(): Promise<PersonalizationScanResult> {
  const empty: PersonalizationScanResult = {
    scanned: 0,
    matched: 0,
    mismatches: [],
  };
  const m = await requireMembership();
  if (!(await isEonActive())) {
    return { ...empty, error: "Bu araç yalnız EON organizasyonunda çalışır." };
  }
  const { connected } = await getEtsyWriteAccess(m.org_id);
  if (!connected) {
    return { ...empty, error: "Etsy bağlantısı yok — önce mağazayı bağla." };
  }

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return {
      ...empty,
      error: e instanceof Error ? e.message : "Etsy istemcisi açılamadı.",
    };
  }

  let shopId: number;
  try {
    shopId = await client.requireShopId();
  } catch (e) {
    return {
      ...empty,
      error: e instanceof Error ? e.message : "Etsy shop_id bulunamadı.",
    };
  }

  // Panel ürün map'i — başlık + listing detay linki için.
  const supabase = await createClient();
  const products = await fetchAllPages<{
    id: string;
    etsy_listing_id: number | null;
    title: string | null;
  }>((from, to) =>
    supabase
      .from("products")
      .select("id, etsy_listing_id, title")
      .eq("org_id", m.org_id)
      .not("etsy_listing_id", "is", null)
      .range(from, to),
  );
  const byListing = new Map<
    number,
    { id: string; title: string }
  >();
  for (const p of products) {
    if (p.etsy_listing_id == null) continue;
    byListing.set(p.etsy_listing_id, {
      id: p.id,
      title: p.title ?? "Başlıksız listing",
    });
  }

  // Canlı Etsy: active + draft (Alura tüm canlı listingleri tarar).
  const listingIds: { id: number; title: string }[] = [];
  for (const state of ["active", "draft"] as const) {
    let offset = 0;
    const limit = 100;
    for (;;) {
      const res = await client.get<{
        results?: { listing_id: number; title: string }[];
      }>(etsyPaths.shopListings(shopId), { state, limit, offset });
      const batch = res.results ?? [];
      for (const L of batch) {
        listingIds.push({ id: L.listing_id, title: L.title });
      }
      if (batch.length < limit) break;
      offset += limit;
      if (offset > 12000) break;
    }
  }

  let matched = 0;
  const mismatches: PersonalizationScanItem[] = [];
  for (const L of listingIds) {
    const questions = await getListingPersonalization(client, L.id);
    if (matchesEonPersonalization(questions)) {
      matched += 1;
      continue;
    }
    const prod = byListing.get(L.id);
    mismatches.push({
      etsyListingId: L.id,
      productId: prod?.id ?? null,
      title: prod?.title ?? L.title,
      summary: summarizePersonalization(questions),
    });
  }

  return {
    scanned: listingIds.length,
    matched,
    mismatches,
  };
}

export interface PersonalizationPushResult {
  applied: number;
  failed: number;
  skipped: number;
  error?: string;
}

/**
 * Seçili listing'lere kanonik EON kişiselleştirmesini yazar.
 * SEO `pushSeoBatch` ile aynı kapı: yönetici + Etsy yazma.
 */
export async function pushEonPersonalizationBatch(
  etsyListingIds: number[],
): Promise<PersonalizationPushResult> {
  const empty = { applied: 0, failed: 0, skipped: 0 };
  const m = await requireMembership();
  if (!isManager(m.role)) {
    return { ...empty, error: MANAGER_ONLY_ERROR };
  }
  if (!(await isEonActive())) {
    return { ...empty, error: "Bu araç yalnız EON organizasyonunda çalışır." };
  }
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) {
    return { ...empty, error: "Etsy yazma erişimi kapalı." };
  }

  const ids = [...new Set(etsyListingIds)].filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  if (ids.length === 0) return empty;

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return {
      ...empty,
      error: e instanceof Error ? e.message : "Etsy istemcisi açılamadı.",
    };
  }
  let shopId: number;
  try {
    shopId = await client.requireShopId();
  } catch (e) {
    return {
      ...empty,
      error: e instanceof Error ? e.message : "Etsy shop_id bulunamadı.",
    };
  }

  let applied = 0;
  let failed = 0;
  let skipped = 0;
  for (const listingId of ids) {
    try {
      const questions = await getListingPersonalization(client, listingId);
      if (matchesEonPersonalization(questions)) {
        skipped += 1;
        continue;
      }
      await applyEonPersonalization(client, shopId, listingId);
      applied += 1;
    } catch {
      failed += 1;
    }
  }

  revalidatePath(PATH);
  return { applied, failed, skipped };
}
