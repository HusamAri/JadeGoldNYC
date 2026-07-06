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
  needsReconnect?: boolean;
  error?: string;
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
    return { updated: 0, unchanged: 0, errors: 0, error: MANAGER_ONLY_ERROR };

  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return { updated: 0, unchanged: 0, errors: 0, needsReconnect: true };

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

  const changed = rows
    .filter((r) => r.target_quantity != null && r.target_quantity !== r.quantity)
    .slice(0, 40);

  if (changed.length === 0) return { updated: 0, unchanged: 0, errors: 0 };

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    if (e instanceof EtsyNotConnectedError)
      return { updated: 0, unchanged: 0, errors: 0, needsReconnect: true };
    return {
      updated: 0,
      unchanged: 0,
      errors: 0,
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
  return { updated, unchanged, errors };
}
