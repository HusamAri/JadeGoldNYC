"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  computeDescriptionWeightFills,
  type FillVariantRow,
} from "@/lib/etsy/description-weights";

export interface FillFromDescriptionsResult {
  ok?: boolean;
  error?: string;
  filled?: number;
  exact?: number;
  scaled?: number;
  unmatched?: number;
  gated?: number;
}

/**
 * Org'un TÜM listing açıklamalarındaki "Average Weight" tablolarından eksik
 * varyant gramajlarını doldurur. Yalnız weight_grams boş varyantlar dolar;
 * birebir satır 'description', uzunluk/boyut-ölçekli tahmin
 * 'description-scaled' kaynağıyla işaretlenir.
 */
export async function fillWeightsFromDescriptions(): Promise<FillFromDescriptionsResult> {
  const m = await requireMembership();
  const supabase = await createClient();

  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, description")
    .eq("org_id", m.org_id)
    .ilike("description", "%average weight%");
  if (pErr) return { error: pErr.message };

  // Select 1000 satırda doyar — varyantlar sayfalanarak çekilir.
  const variants: (FillVariantRow & { product_id: string | null })[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("product_variants")
      .select("sku, product_id, weight_grams, weight_source, properties")
      .eq("org_id", m.org_id)
      .order("sku", { ascending: true })
      .range(from, from + 999);
    if (error) return { error: error.message };
    variants.push(
      ...((data ?? []) as (FillVariantRow & { product_id: string | null })[]),
    );
    if (!data || data.length < 1000) break;
  }

  const byProduct = new Map<string, FillVariantRow[]>();
  for (const v of variants) {
    if (!v.product_id) continue;
    const arr = byProduct.get(v.product_id) ?? [];
    arr.push(v);
    byProduct.set(v.product_id, arr);
  }

  const report = computeDescriptionWeightFills(products ?? [], byProduct);

  let filled = 0;
  for (const c of report.candidates) {
    const { error } = await supabase
      .from("product_variants")
      .update({
        weight_grams: c.grams,
        weight_source: c.source,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", m.org_id)
      .eq("sku", c.sku)
      .is("weight_grams", null);
    if (!error) filled++;
  }

  const exact = report.candidates.filter((c) => c.source === "description").length;
  await logAudit(supabase, {
    orgId: m.org_id,
    action: "etsy.variant_sync",
    entityType: "product_variant",
    summary: `Açıklamalardan gramaj dolumu: ${filled} varyant (${exact} birebir, ${report.candidates.length - exact} ölçekli); ${report.unmatched} eşleşmedi, ${report.listingsGated} listing güven kapısına takıldı.`,
    source: "app",
  });

  revalidatePath("/tasarimlar/eksik-agirlik");
  revalidatePath("/panel");
  return {
    ok: true,
    filled,
    exact,
    scaled: report.candidates.length - exact,
    unmatched: report.unmatched,
    gated: report.listingsGated,
  };
}
