"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { pushListingQuantity } from "@/lib/etsy/inventory";

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
