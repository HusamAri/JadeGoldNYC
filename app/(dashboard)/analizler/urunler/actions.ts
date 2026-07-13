"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth";
import {
  productMetricFormSchema,
  type ProductMetricFormValues,
} from "@/lib/validations/product-metric";
import { parseMoneyToCents } from "@/lib/money";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { researchListing, type ProductRow } from "@/lib/etsy/keyword-research";
import { getGoldPricePerOunce } from "@/lib/gold-price";

export interface ProductMetricActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function intOrNull(s: string): number | null {
  const v = s.trim();
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}
function moneyOrNull(s: string): number | null {
  return s.trim() ? parseMoneyToCents(s) : null;
}

function toRow(v: ProductMetricFormValues) {
  return {
    period_label: v.period_label,
    product_title: v.product_title,
    product_id: v.product_id || null,
    sku: v.sku || null,
    views: intOrNull(v.views),
    orders: intOrNull(v.orders),
    revenue_cents: moneyOrNull(v.revenue),
    ads_clicks: intOrNull(v.ads_clicks),
    ads_spend_cents: moneyOrNull(v.ads_spend),
    ads_revenue_cents: moneyOrNull(v.ads_revenue),
    notes: v.notes || null,
  };
}

export async function createProductMetric(
  values: ProductMetricFormValues,
): Promise<ProductMetricActionResult> {
  const parsed = productMetricFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_metrics")
    .insert({ ...toRow(parsed.data), org_id: m.org_id, created_by: m.user_id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateProductMetric(
  id: string,
  values: ProductMetricFormValues,
): Promise<ProductMetricActionResult> {
  const parsed = productMetricFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Form geçersiz.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_metrics")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return { ok: true, id };
}

export async function deleteProductMetric(
  id: string,
): Promise<{ error?: string }> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("product_metrics").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return {};
}

/**
 * Bir listing'in rekabet araştırması anahtar kelimesini ayarlar (boş = birincil
 * tag'e düş). "En çok tıklanan" kelimeyi Etsy Stats'tan buraya girin.
 */
export async function setResearchKeyword(
  productId: string,
  keyword: string,
): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();
  const kw = keyword.trim();
  const { error } = await supabase
    .from("products")
    .update({ research_keyword: kw || null })
    .eq("id", productId)
    .eq("org_id", m.org_id);
  if (error) return { error: error.message };
  revalidatePath("/analizler/urunler");
  return { ok: true };
}

/**
 * Bir listing için rekabet araştırmasını HEMEN çalıştırır (cron'u beklemeden).
 * Etsy bağlı değilse anlaşılır hata döndürür.
 */
export async function researchProductNow(
  productId: string,
): Promise<{ ok?: boolean; error?: string; count?: number }> {
  const m = await requireMembership();
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select(
      "id, title, price_cents, currency, tags, research_keyword, etsy_listing_id, weight_grams",
    )
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (!product) return { error: "Ürün bulunamadı." };

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return {
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlı değil — Ayarlar → Etsy'den bağlayın."
          : "Etsy istemcisi hatası.",
    };
  }

  const { data: conn } = await admin
    .from("etsy_connection")
    .select("shop_id")
    .eq("org_id", m.org_id)
    .maybeSingle();

  try {
    const goldOunceUsd = await getGoldPricePerOunce();
    const r = await researchListing(
      admin,
      client,
      m.org_id,
      (conn as { shop_id: number | null } | null)?.shop_id ?? null,
      product as ProductRow,
      goldOunceUsd,
      true, // derin: aynı-varyant karşılaştırması dahil
    );
    revalidatePath("/analizler/urunler");
    if (r.status === "no-keyword") {
      return {
        error: "Anahtar kelime yok — kelime girin veya listing'e etiket ekleyin.",
      };
    }
    return { ok: true, count: r.result_count };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Araştırma hatası." };
  }
}
