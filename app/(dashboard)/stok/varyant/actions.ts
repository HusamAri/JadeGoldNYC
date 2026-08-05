"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { pushListingQuantity, pushPanelVariantsToListing } from "@/lib/etsy/inventory";

/** Bir varyantın (SKU) hedef adedini kaydeder — satır içi otomatik kayıt. */
export async function saveVariantTarget(
  sku: string,
  qty: number | null,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  if (qty != null && (!Number.isInteger(qty) || qty < 0)) {
    return { error: "Adet 0 veya daha büyük tam sayı olmalı." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ target_quantity: qty })
    .eq("org_id", m.org_id)
    .eq("sku", sku);
  if (error) return { error: error.message };
  revalidatePath("/stok/varyant");
  return {};
}

export interface VariantPushResult {
  updated: number;
  unchanged: number;
  errors: number;
  /** Parti limiti (40) nedeniyle bu turda işlenmeyen değişiklik sayısı. */
  remaining: number;
  needsReconnect?: boolean;
  error?: string;
}

/**
 * Gönderim ÖNİZLEMESİ: hedefi güncelden farklı varyant sayısı (org geneli,
 * ekrandaki filtreden bağımsız). Kullanıcı push'tan önce kapsamı görür.
 */
export async function previewVariantPush(): Promise<{
  wouldChange: number;
  error?: string;
}> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { wouldChange: 0, error: MANAGER_ONLY_ERROR };

  const supabase = await createClient();
  const { data } = await supabase
    .from("product_variants")
    .select("quantity, target_quantity")
    .eq("org_id", m.org_id)
    .not("product_id", "is", null)
    .not("etsy_listing_id", "is", null)
    .not("target_quantity", "is", null);

  const rows = (data ?? []) as unknown as {
    quantity: number | null;
    target_quantity: number | null;
  }[];
  return {
    wouldChange: rows.filter(
      (r) => r.target_quantity != null && r.target_quantity !== r.quantity,
    ).length,
  };
}

/**
 * Hedef adedi girilmiş ve güncel adetten farklı varyantları Etsy'ye yazar —
 * her varyant kendi offering'i olarak (SKU eşleşmesi). Etsy'nin canlı envanteri
 * okunur, yalnız o offering güncellenir; yerel `quantity` gerçek sonuca çekilir.
 * Süre bütçesi: parti başına en çok 40 varyant (timeout riski); kalan varsa
 * kullanıcı tekrar çalıştırır (idempotent — güncellenen atlanır).
 */
export async function pushVariantStock(): Promise<VariantPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role))
    return { updated: 0, unchanged: 0, errors: 0, remaining: 0, error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return { updated: 0, unchanged: 0, errors: 0, remaining: 0, needsReconnect: true };

  const supabase = await createClient();
  const { data } = await supabase
    .from("product_variants")
    .select("sku, etsy_listing_id, quantity, target_quantity")
    .eq("org_id", m.org_id)
    .not("product_id", "is", null)
    .not("etsy_listing_id", "is", null)
    .not("target_quantity", "is", null);

  const rows = (data ?? []) as unknown as {
    sku: string;
    etsy_listing_id: number | null;
    quantity: number | null;
    target_quantity: number | null;
  }[];

  const changedAll = rows.filter(
    (r) => r.target_quantity != null && r.target_quantity !== r.quantity,
  );
  const changed = changedAll.slice(0, 40);
  const remaining = changedAll.length - changed.length;

  if (changed.length === 0)
    return { updated: 0, unchanged: 0, errors: 0, remaining: 0 };

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    if (e instanceof EtsyNotConnectedError)
      return { updated: 0, unchanged: 0, errors: 0, remaining: 0, needsReconnect: true };
    return {
      updated: 0,
      unchanged: 0,
      errors: 0,
      remaining,
      error: e instanceof Error ? e.message : "Etsy istemcisi kurulamadı.",
    };
  }

  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  for (const r of changed) {
    if (r.etsy_listing_id == null || r.target_quantity == null) continue;
    const outcome = await pushListingQuantity(
      client,
      r.etsy_listing_id,
      r.sku,
      r.target_quantity,
      false,
    );
    if (outcome.status === "updated") {
      updated++;
      await supabase
        .from("product_variants")
        .update({ quantity: outcome.after })
        .eq("org_id", m.org_id)
        .eq("sku", r.sku);
    } else if (outcome.status === "skipped") {
      unchanged++;
    } else {
      errors++;
    }
  }

  if (updated > 0 || errors > 0) {
    await logAudit(supabase, {
      orgId: m.org_id,
      action: "etsy.stock_push",
      entityType: "product_variants",
      summary: `Varyant stok gönderimi: ${updated} güncellendi, ${unchanged} atlandı, ${errors} hata`,
      source: "etsy",
    });
  }

  revalidatePath("/stok/varyant");
  revalidatePath("/stok");
  return { updated, unchanged, errors, remaining };
}

export interface PushPanelVariantsResult {
  updated?: number;
  created?: number;
  missing?: string[];
  error?: string;
}

/**
 * Panel varyantlarının tamamını bir listing'e yazar: fiyatlar, property'ler
 * (kişiselleştirme dahil), adetler. Etsy'de bulunmayan varyantlar `missing`'de
 * raporlanır (elle oluşturulması gerekir). Kişiselleştirme vb. panel-eklenmiş
 * property'lerin Etsy'ye dağıtılması bu akış ile gerçekleşir.
 */
export async function pushAllPanelVariantsToListing(
  productId: string,
): Promise<PushPanelVariantsResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const supabase = await createClient();
  const { data: prodData, error: prodErr } = await supabase
    .from("products")
    .select("id, etsy_listing_id")
    .eq("org_id", m.org_id)
    .eq("id", productId)
    .maybeSingle();
  if (prodErr) return { error: prodErr.message };
  const prod = prodData as { id: string; etsy_listing_id: number | null } | null;
  if (!prod) return { error: "Ürün bulunamadı." };
  if (!prod.etsy_listing_id) return { error: "Bu ürün Etsy'ye gönderilmemiş." };

  // Panel varyantlarını oku.
  const { data: varData, error: varErr } = await supabase
    .from("product_variants")
    .select("sku, price_cents, quantity, properties")
    .eq("org_id", m.org_id)
    .eq("product_id", productId);
  if (varErr) return { error: varErr.message };
  const variantsRaw = (varData ?? []) as unknown as Array<{
    sku: string;
    price_cents: number | null;
    quantity: number;
    properties: Array<{ name: string; values: string[] }> | null;
  }>;

  if (variantsRaw.length === 0) {
    return { error: "Panelde varyant yok." };
  }

  // Varyantları camelCase'e dönüştür.
  const variants = variantsRaw.map((v) => ({
    sku: v.sku,
    priceCents: v.price_cents,
    quantity: v.quantity,
    properties: v.properties,
  }));

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    if (e instanceof EtsyNotConnectedError)
      return { error: "Etsy bağlantısı yok — Ayarlar'dan bağlanın." };
    return {
      error: e instanceof Error ? e.message : "Etsy istemcisi kurulamadı.",
    };
  }

  const outcome = await pushPanelVariantsToListing(
    client,
    prod.etsy_listing_id,
    variants,
  );

  if (outcome.status === "updated" || outcome.missing.length === 0) {
    if (outcome.updated > 0 || outcome.created > 0 || outcome.missing.length > 0) {
      await logAudit(supabase, {
        orgId: m.org_id,
        action: "etsy.variant_sync",
        entityType: "product_variants",
        summary:
          `Panel varyantları Etsy'ye yazıldı: ${outcome.updated} güncellendi` +
          (outcome.created ? `, ${outcome.created} oluşturuldu` : "") +
          (outcome.missing.length ? `, ${outcome.missing.length} bulunamadı` : ""),
        source: "etsy",
      });
    }
  }

  revalidatePath("/stok/varyant");
  revalidatePath("/stok");
  return outcome as PushPanelVariantsResult;
}
