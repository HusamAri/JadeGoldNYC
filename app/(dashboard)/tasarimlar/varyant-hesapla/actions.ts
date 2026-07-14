"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Otomatik Varyant hesaplayıcısının listing bağı — seçilen listing'in varyant
 * satırlarını yükler ve hesaplanan sonuçları o listing'e geri yazar. Tüm
 * sorgular org_id kilidli (multi-tenant sözleşmesi; RLS'e yaslanılmaz).
 */

export interface CalcVariantRow {
  sku: string;
  weight_grams: number | null;
  price_cents: number | null;
}

export async function fetchListingVariantRows(
  productId: string,
): Promise<{ rows?: CalcVariantRow[]; error?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("sku, weight_grams, price_cents")
    .eq("org_id", m.org_id)
    .eq("product_id", productId)
    .order("sku", { ascending: true });
  if (error) return { error: error.message };
  return { rows: (data as CalcVariantRow[] | null) ?? [] };
}

export interface ApplyVariantItem {
  sku: string;
  weightGrams: number | null;
  /** 'given' kullanıcı girdisi, 'inferred' bedenden çıkarım. */
  weightSource: "given" | "inferred" | null;
  priceCents: number | null;
}

/**
 * Hesaplanan ağırlık/fiyatları listing'in varyantlarına yazar. Yalnız değeri
 * OLAN alanlar güncellenir; motorun hesaplayamadığı satırlara dokunulmaz.
 */
export async function applyCalculatedVariants(
  productId: string,
  items: ApplyVariantItem[],
): Promise<{ ok?: boolean; updated?: number; error?: string }> {
  const m = await requireMembership();
  if (!items.length) return { error: "Kaydedilecek hesaplanmış satır yok." };

  const admin = createAdminClient();
  let updated = 0;
  for (const it of items) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (it.weightGrams != null && it.weightGrams > 0 && it.weightGrams <= 500) {
      patch.weight_grams = Math.round(it.weightGrams * 100) / 100;
      patch.weight_source = it.weightSource === "given" ? "manual" : "inferred";
    }
    if (it.priceCents != null && it.priceCents > 0) patch.price_cents = it.priceCents;
    if (Object.keys(patch).length === 1) continue; // yalnız updated_at — atla

    const { data, error } = await admin
      .from("product_variants")
      .update(patch)
      .eq("org_id", m.org_id)
      .eq("product_id", productId)
      .eq("sku", it.sku)
      .select("sku");
    if (error) return { error: `${it.sku}: ${error.message}` };
    if (data && data.length > 0) updated += 1;
  }

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, updated };
}
