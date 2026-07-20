"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { getListing, updateListingDescription } from "@/lib/etsy/listing";
import { injectWeightBlock, stripWeightBlocks } from "@/lib/etsy/weights";
import { listingsWithVariantWeights } from "@/lib/db/queries/variant-weights";

const PATH = "/tasarimlar/etsy-agirlik";

function hasWeightBlock(description: string | null): boolean {
  const d = description ?? "";
  return (
    /Weight by size \([^)]*\):/.test(d) ||
    d.includes("<!-- JG-WEIGHTS -->") ||
    d.includes("&lt;!-- JG-WEIGHTS --&gt;") ||
    d.includes("<!-- /JG-WEIGHTS -->") ||
    d.includes("&lt;!-- /JG-WEIGHTS --&gt;") ||
    d.includes("Weights are approximate and may vary slightly per piece.")
  );
}

export interface WeightPushResult {
  ok?: boolean;
  unchanged?: boolean;
  error?: string;
}

/**
 * Tek bir listing'in açıklamasına beden→gram bloğunu işler. Blok DB'den
 * (güvenilir) yeniden üretilir; açıklama Etsy'den TAZE okunup blok idempotent
 * enjekte edilir → mevcut açıklama ve eş zamanlı düzenlemeler korunur.
 */
export async function pushWeightForListing(
  productId: string,
): Promise<WeightPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const previews = await listingsWithVariantWeights(m.org_id);
  const target = previews.find((p) => p.productId === productId);
  if (!target) return { error: "Bu liste için listing'e bağlı, gramlı varyant yok." };

  try {
    const client = await EtsyClient.forOrg(m.org_id);
    const detail = await getListing(client, target.etsyListingId);
    const fresh = detail.description ?? "";
    const next = injectWeightBlock(fresh, target.block);
    const supabase = await createClient();
    if (next === fresh) {
      // Etsy zaten güncel — yerel kopya bayatsa eşitle ki "bekleyen"
      // listesinde takılı kalmasın (upToDate vekili yerel açıklamadır).
      await supabase
        .from("products")
        .update({ description: fresh })
        .eq("id", productId)
        .eq("org_id", m.org_id);
      revalidatePath(PATH);
      return { ok: true, unchanged: true };
    }

    await updateListingDescription(client, target.etsyListingId, next);
    await supabase
      .from("products")
      .update({ description: next })
      .eq("id", productId)
      .eq("org_id", m.org_id);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gönderilemedi." };
  }
}

/** Tüm uygun listing'lere sırayla gönderir (toplu). */
export async function pushAllWeights(): Promise<{
  updated: number;
  unchanged: number;
  errors: number;
  error?: string;
}> {
  const m = await requireMembership();
  if (!isManager(m.role))
    return { updated: 0, unchanged: 0, errors: 0, error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return { updated: 0, unchanged: 0, errors: 0, error: "Etsy yazma erişimi kapalı." };

  const previews = await listingsWithVariantWeights(m.org_id);
  const client = await EtsyClient.forOrg(m.org_id);
  const supabase = await createClient();
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const t of previews) {
    try {
      const detail = await getListing(client, t.etsyListingId);
      const fresh = detail.description ?? "";
      const next = injectWeightBlock(fresh, t.block);
      if (next === fresh) {
        await supabase
          .from("products")
          .update({ description: fresh })
          .eq("id", t.productId)
          .eq("org_id", m.org_id);
        unchanged++;
        continue;
      }
      await updateListingDescription(client, t.etsyListingId, next);
      await supabase
        .from("products")
        .update({ description: next })
        .eq("id", t.productId)
        .eq("org_id", m.org_id);
      updated++;
    } catch {
      errors++;
    }
  }

  revalidatePath(PATH);
  return { updated, unchanged, errors };
}

/**
 * Açıklamalardaki beden→gram bloklarını söker (DB + Etsy).
 * Yanlışlıkla tüm Jade listing'lere basılan blokları geri almak için.
 */
export async function stripAllWeightBlocks(): Promise<{
  updated: number;
  unchanged: number;
  errors: number;
  scanned: number;
  error?: string;
}> {
  const m = await requireMembership();
  if (!isManager(m.role))
    return {
      updated: 0,
      unchanged: 0,
      errors: 0,
      scanned: 0,
      error: MANAGER_ONLY_ERROR,
    };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return {
      updated: 0,
      unchanged: 0,
      errors: 0,
      scanned: 0,
      error: "Etsy yazma erişimi kapalı.",
    };

  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, etsy_listing_id, description")
    .eq("org_id", m.org_id)
    .is("archived_at", null);
  if (error) {
    return {
      updated: 0,
      unchanged: 0,
      errors: 0,
      scanned: 0,
      error: error.message,
    };
  }

  const client = await EtsyClient.forOrg(m.org_id);
  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  const rows = products ?? [];

  for (const p of rows) {
    if (!hasWeightBlock(p.description as string | null)) continue;
    if (p.etsy_listing_id == null) continue;
    try {
      const detail = await getListing(client, Number(p.etsy_listing_id));
      const fresh = detail.description ?? "";
      const next = stripWeightBlocks(fresh);
      if (next === fresh) {
        await supabase
          .from("products")
          .update({ description: fresh })
          .eq("id", p.id)
          .eq("org_id", m.org_id);
        unchanged++;
        continue;
      }
      await updateListingDescription(client, Number(p.etsy_listing_id), next);
      await supabase
        .from("products")
        .update({ description: next })
        .eq("id", p.id)
        .eq("org_id", m.org_id);
      updated++;
    } catch {
      errors++;
    }
  }

  revalidatePath(PATH);
  return { updated, unchanged, errors, scanned: rows.length };
}
