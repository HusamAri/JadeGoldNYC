"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import {
  createDraftListingFromProduct,
  type DraftProduct,
  type DraftVariant,
} from "@/lib/etsy/create-listing";
import { sortVariantsByWidthThenSize } from "@/lib/variant-sort";

/**
 * "Etsy'e gönder" — panel taslağını (etsy_listing_id boş) Etsy'de DRAFT listing
 * olarak açar. Yalnız owner/admin. Etsy yazma erişimi kapalıysa reddedilir.
 * Ağır iş lib/etsy/create-listing.ts'te (throw etmez, adım-adım sonuç döner).
 */

export interface SendListingResult {
  ok?: boolean;
  skipped?: boolean;
  listingId?: number;
  url?: string;
  error?: string;
  /** Kısmi başarı uyarıları (ör. görsel yüklenemedi ama taslak açıldı). */
  warnings?: string[];
}

export async function sendListingToEtsy(
  productId: string,
): Promise<SendListingResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const admin = createAdminClient();

  // Ürün (org kilidi) — künye alanları + kapak görseli.
  const { data: pData, error: pErr } = await admin
    .from("products")
    .select(
      "id, org_id, etsy_listing_id, title, description, tags, materials, price_cents, quantity, image_url",
    )
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (pErr) return { error: pErr.message };
  if (!pData) return { error: "Listing bulunamadı." };
  const prod = pData as Omit<DraftProduct, "variants">;

  if (prod.etsy_listing_id != null) {
    return {
      ok: true,
      skipped: true,
      listingId: prod.etsy_listing_id,
      url: `https://www.etsy.com/listing/${prod.etsy_listing_id}`,
    };
  }

  // Aktif varyantlar (org kilidi).
  const { data: vData, error: vErr } = await admin
    .from("product_variants")
    .select("sku, properties, price_cents, quantity")
    .eq("org_id", m.org_id)
    .eq("product_id", productId)
    .eq("active", true);
  if (vErr) return { error: vErr.message };
  const withSku = ((vData ?? []) as DraftVariant[]).filter(
    (v): v is DraftVariant & { sku: string } => (v.sku ?? "").trim().length > 0,
  );
  if (withSku.length === 0) {
    return { error: "Listing SKU’suz varyant — Etsy senkronunu kontrol edin." };
  }
  const variants = sortVariantsByWidthThenSize(withSku);

  let client: EtsyClient;
  let shopId: number;
  try {
    client = await EtsyClient.forOrg(m.org_id);
    shopId = await client.requireShopId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Etsy bağlantısı kurulamadı." };
  }

  const result = await createDraftListingFromProduct(admin, client, m.org_id, shopId, {
    ...prod,
    variants,
  });

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");

  if (!result.ok) {
    return {
      error: result.error ?? "Etsy'e gönderilemedi.",
      listingId: result.listingId,
      url: result.url,
      warnings: result.warnings,
    };
  }
  return {
    ok: true,
    skipped: result.skipped,
    listingId: result.listingId,
    url: result.url,
    warnings: result.warnings,
  };
}
