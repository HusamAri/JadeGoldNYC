"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { reconcileEtsyListingIds } from "@/lib/etsy/reconcile";

/**
 * Listing Önerileri yaşam-döngüsü action'ları.
 * Arşiv = panel görünürlüğü (Etsy'ye DOKUNMAZ): `products.archived_at`.
 * Etsy senkronu bu alana yazmaz (senkron arşivi geri açmaz) — bu yalnız
 * panelde listeden gizleme/gösterme kararıdır.
 */

async function setArchived(
  id: string,
  archived: boolean,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız sahip/yönetici arşivleyebilir." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/listing-onerileri");
  revalidatePath("/tasarimlar");
  return {};
}

/** Ürünü arşivden çıkar (panelde tekrar görünür). */
export async function restoreListing(id: string): Promise<{ error?: string }> {
  return setArchived(id, false);
}

/** Ürünü arşivle (panel listelerinden gizle; Etsy'ye dokunmaz). */
export async function archiveListing(id: string): Promise<{ error?: string }> {
  return setArchived(id, true);
}

export interface ReconcileSummary {
  ok?: boolean;
  error?: string;
  linked?: number;
  conflicts?: number;
  ambiguous?: number;
  unmatched?: number;
  scanned?: number;
  /** Elle müdahale gereken durumların kısa açıklamaları (conflict + ambiguous). */
  notes?: string[];
}

/**
 * "Etsy ile eşle" — Etsy'de canlı olduğu halde `etsy_listing_id` yazılamamış
 * (mirror hatası → Önerilerde takılı) panel taslaklarını SKU ailesiyle Etsy
 * listing'lerine eşleyip `etsy_listing_id`'yi backfill eder. Taslak böylece
 * Önerilerden düşüp Listeler'e taşınır. Yalnız owner/admin; Etsy okuma için
 * bağlantı gerekir. Çakışma/belirsizlik OTOMATİK çözülmez, raporlanır.
 */
export async function reconcileEtsyListings(): Promise<ReconcileSummary> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const { connected } = await getEtsyWriteAccess(m.org_id);
  if (!connected) return { error: "Etsy bağlantısı yok — önce mağazayı bağlayın." };

  let client: EtsyClient;
  let shopId: number;
  try {
    client = await EtsyClient.forOrg(m.org_id);
    shopId = await client.requireShopId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Etsy bağlantısı kurulamadı." };
  }

  const admin = createAdminClient();
  try {
    const r = await reconcileEtsyListingIds(admin, client, m.org_id, shopId);
    revalidatePath("/listing-onerileri");
    revalidatePath("/tasarimlar");
    const notes = [
      ...r.conflicts.map((c) => `${c.familySku}: ${c.reason}`),
      ...r.ambiguous.map((c) => `${c.familySku}: ${c.reason}`),
    ];
    return {
      ok: true,
      linked: r.linked.length,
      conflicts: r.conflicts.length,
      ambiguous: r.ambiguous.length,
      unmatched: r.unmatchedDrafts.length,
      scanned: r.scannedListings,
      notes,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eşleme başarısız." };
  }
}
