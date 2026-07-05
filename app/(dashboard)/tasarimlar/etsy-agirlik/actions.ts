"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { getListing, updateListingDescription } from "@/lib/etsy/listing";
import { injectWeightBlock } from "@/lib/etsy/weights";
import { listingsWithVariantWeights } from "@/lib/db/queries/variant-weights";

const PATH = "/tasarimlar/etsy-agirlik";

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
    if (next === fresh) return { ok: true, unchanged: true };

    await updateListingDescription(client, target.etsyListingId, next);
    const supabase = await createClient();
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
