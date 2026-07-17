"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
