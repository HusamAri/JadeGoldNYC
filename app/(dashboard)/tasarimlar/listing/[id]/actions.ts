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
