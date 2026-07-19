"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseMoneyToCents } from "@/lib/money";

/**
 * Listing Komuta Merkezi — detay sayfası yazma action'ları.
 * Yazmalar admin client ile yapılır ve HER sorguda org_id kilidi zorunludur
 * (bkz. app/(dashboard)/analizler/urunler/actions.ts deseni). Şirket hafızası
 * (audit_log) Postgres trigger'ı ile otomatik dolar — elle loglama gerekmez.
 */

export interface ListingActionResult {
  ok?: boolean;
  error?: string;
}

/** Künye formu alanları — para/adet metin gelir, burada ayrıştırılır. */
export interface ListingFieldsInput {
  title: string;
  description: string;
  /** Virgüllü liste ("gold, chain, necklace"). */
  tags: string;
  /** Virgüllü liste ("14k gold, solid gold"). */
  materials: string;
  /** Para metni ("129,00" / "$129.00"); boş = fiyat yok. */
  price: string;
  quantity: string;
  research_keyword: string;
}

function splitList(s: string): string[] | null {
  const items = s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function parseIntOrNull(s: string): number | null | "invalid" {
  const v = s.trim();
  if (!v) return null;
  if (!/^\d+$/.test(v)) return "invalid";
  return Number(v);
}

function parseGramsOrNull(s: string): number | null | "invalid" {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  if (!Number.isFinite(n) || n <= 0 || n > 500) return "invalid";
  return Math.round(n * 100) / 100;
}

/** Künye alanlarını günceller (title, description, tags, materials, fiyat, adet, kelime). */
export async function updateListingFields(
  id: string,
  fields: ListingFieldsInput,
): Promise<ListingActionResult> {
  const m = await requireMembership();

  const title = fields.title.trim();
  if (!title) return { error: "Başlık boş olamaz." };

  let priceCents: number | null = null;
  if (fields.price.trim()) {
    priceCents = parseMoneyToCents(fields.price);
    if (priceCents <= 0) return { error: "Geçerli bir fiyat girin (ör. 129,00)." };
  }

  const quantity = parseIntOrNull(fields.quantity);
  if (quantity === "invalid") return { error: "Adet tam sayı olmalı." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .update({
      title,
      description: fields.description.trim() || null,
      tags: splitList(fields.tags),
      materials: splitList(fields.materials),
      price_cents: priceCents,
      quantity,
      research_keyword: fields.research_keyword.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("org_id", m.org_id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Listing bulunamadı." };

  revalidatePath(`/tasarimlar/listing/${id}`);
  revalidatePath("/tasarimlar");
  return { ok: true };
}

/** Varyant satırı girdisi — inline editörden metin olarak gelir. */
export interface VariantValuesInput {
  /** Para metni; boş = fiyat bilinmiyor (null). */
  price: string;
  /** Gram; boş = ağırlık bilinmiyor (null). */
  weight: string;
  quantity: string;
  /**
   * Ağırlık hücresine dokunuldu mu? Yalnız adet/fiyat değişen kayıtlarda
   * weight_source ('etsy'/'inferred' vb. köken bilgisi) EZİLMESİN diye
   * ağırlık alanları sadece dirty ise güncellenir.
   */
  weightDirty: boolean;
}

/**
 * Tek varyantı günceller (org_id + sku kapsamlı). Ağırlık girildiyse
 * weight_source='manual'; ağırlık boşaltıldıysa kaynak da temizlenir.
 */
export async function updateVariant(
  productId: string,
  sku: string,
  values: VariantValuesInput,
): Promise<ListingActionResult> {
  const m = await requireMembership();
  if (!sku.trim()) return { error: "SKU gerekli." };

  let priceCents: number | null = null;
  if (values.price.trim()) {
    priceCents = parseMoneyToCents(values.price);
    if (priceCents <= 0) return { error: "Geçerli bir fiyat girin (ör. 129,00)." };
  }

  const grams = parseGramsOrNull(values.weight);
  if (grams === "invalid") return { error: "0–500 arası geçerli bir gram girin." };

  const quantity = parseIntOrNull(values.quantity);
  if (quantity === "invalid") return { error: "Adet tam sayı olmalı." };

  const patch: Record<string, unknown> = {
    price_cents: priceCents,
    quantity,
    updated_at: new Date().toISOString(),
  };
  if (values.weightDirty) {
    patch.weight_grams = grams;
    patch.weight_source = grams != null ? "manual" : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("product_variants")
    .update(patch)
    .eq("org_id", m.org_id)
    .eq("sku", sku)
    .select("sku");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Varyant bulunamadı." };

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true };
}

/**
 * Etsy envanterindeki fiyat/adetleri bu listing'in varyantlarına yazar
 * (gram korunur). Panelde toplu fiyatla ezilen matrisi Etsy'ye döndürmek için.
 */
export async function restoreVariantPricesFromEtsy(
  productId: string,
): Promise<ListingActionResult & { variants?: number }> {
  const m = await requireMembership();
  const { syncOneListingVariants } = await import("@/lib/etsy/variants");
  const res = await syncOneListingVariants(m.org_id, productId);
  if (res.error) return { error: res.error };
  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, variants: res.variants };
}

/**
 * Audit log'daki son fiyat değişiminden ÖNCEKİ price_cents değerlerine döner
 * (Etsy senkronu yoksa / panel-only değişiklik için).
 */
export async function restoreVariantPricesFromAudit(
  productId: string,
): Promise<ListingActionResult & { restored?: number }> {
  const m = await requireMembership();
  const admin = createAdminClient();

  const { data: variants, error: vErr } = await admin
    .from("product_variants")
    .select("id, sku, price_cents")
    .eq("org_id", m.org_id)
    .eq("product_id", productId);
  if (vErr) return { error: vErr.message };
  const rows = (variants ?? []) as {
    id: string;
    sku: string;
    price_cents: number | null;
  }[];
  if (rows.length === 0) return { error: "Varyant yok." };

  let restored = 0;
  for (const v of rows) {
    const { data: logs } = await admin
      .from("audit_log")
      .select("diff, created_at")
      .eq("org_id", m.org_id)
      .eq("entity_type", "product_variants")
      .eq("entity_id", v.id)
      .eq("action", "update")
      .order("created_at", { ascending: false })
      .limit(20);

    type Diff = {
      before?: { price_cents?: number | null };
      after?: { price_cents?: number | null };
    };
    let prevPrice: number | null | undefined;
    for (const log of (logs ?? []) as { diff: Diff }[]) {
      const before = log.diff?.before?.price_cents;
      const after = log.diff?.after?.price_cents;
      if (before !== after && before != null) {
        prevPrice = before;
        break;
      }
    }
    if (prevPrice == null || prevPrice === v.price_cents) continue;

    const { error } = await admin
      .from("product_variants")
      .update({
        price_cents: prevPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", m.org_id)
      .eq("id", v.id);
    if (!error) restored += 1;
  }

  if (restored === 0) {
    return {
      error:
        "Audit’te geri alınacak fiyat değişimi bulunamadı. Etsy’den geri almayı dene.",
    };
  }

  revalidatePath(`/tasarimlar/listing/${productId}`);
  revalidatePath("/tasarimlar");
  return { ok: true, restored };
}

/** Birim fiyatla hesaplanmış satırları toplu kaydet. */
export async function saveVariantsBulkPrices(
  productId: string,
  items: { sku: string; price: string }[],
): Promise<ListingActionResult & { updated?: number }> {
  const m = await requireMembership();
  if (items.length === 0) return { error: "Kaydedilecek fiyat yok." };
  const admin = createAdminClient();
  let updated = 0;
  for (const it of items) {
    if (!it.sku.trim() || !it.price.trim()) continue;
    const priceCents = parseMoneyToCents(it.price);
    if (priceCents <= 0) continue;
    const { data, error } = await admin
      .from("product_variants")
      .update({
        price_cents: priceCents,
        updated_at: new Date().toISOString(),
      })
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
