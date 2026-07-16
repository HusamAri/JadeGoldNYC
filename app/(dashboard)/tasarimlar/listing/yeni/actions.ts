"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseMoneyToCents } from "@/lib/money";
import {
  inferWeightsBySize,
  distributePriceByWeight,
  type DistVariant,
} from "@/lib/etsy/distribute";

/**
 * Yeni listing composer — taslak oluşturma action'ı.
 * Composer ham girdileri (metin) gönderir; eksik gram/fiyat SUNUCUDA aynı
 * motorla (distribute.ts) yeniden hesaplanır — önizleme ile kayıt birebir
 * aynı fonksiyonlardan geçer, istemciden hesaplanmış değer kabul edilmez.
 * Yazma: admin client + org kilidi (bkz. analizler/urunler/actions.ts deseni).
 * Etsy'ye gönderim YOK — bağlantı salt-okunur; kayıt yalnız panele düşer.
 */

export interface DraftVariantInput {
  sku: string;
  /** Gram metni ("2,4"); boş/anlamsız = bilinmiyor (motor çıkarır). */
  weight: string;
  /** USD metni ("129,00"); boş = bilinmiyor (motor dağıtır). */
  price: string;
}

export interface DraftListingInput {
  title: string;
  description: string;
  /** Virgüllü liste ("gold, chain, necklace"). */
  tags: string;
  /** Virgüllü liste ("14k gold, solid gold"). */
  materials: string;
  /** Ayar (ör. "14") — fiyat dağıtım motoruna gider (tek fiyat noktası senaryosu). */
  karat: string;
  /** Altın gram fiyatı USD/g (ops.) — tek fiyat noktasından dağıtım için. */
  goldSpot: string;
  /** Melt çarpanı (işçilik/kâr), vars. 2.5. */
  markup: string;
  variants: DraftVariantInput[];
}

export interface DraftListingResult {
  id?: string;
  error?: string;
}

function splitList(s: string): string[] | null {
  const items = s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

/** Calculator ile aynı esneklik: ayrıştırılamayan/≤0 gram = bilinmiyor. */
function gramOrNull(s: string): number | null {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Boş = bilinmiyor; dolu ama ≤0 = bilinmiyor (calculator davranışı). */
function centsOrNull(s: string): number | null {
  if (!s.trim()) return null;
  const cents = parseMoneyToCents(s);
  return cents > 0 ? cents : null;
}

function numOrUndefined(s: string): number | undefined {
  const v = s.trim().replace(",", ".");
  if (!v) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Taslak listing oluşturur: products (status='draft') + product_variants.
 * Girilen ağırlık weight_source='manual', motor çıkarımı 'inferred'.
 * Başarıda { id } döner → composer detay sayfasına yönlendirir.
 */
export async function createDraftListing(
  input: DraftListingInput,
): Promise<DraftListingResult> {
  const m = await requireMembership();

  const title = input.title.trim();
  if (!title) return { error: "Başlık boş olamaz." };

  // SKU'su dolu satırlar geçerli varyanttır; SKU'lar org içinde benzersiz.
  const rows = input.variants
    .map((r) => ({ ...r, sku: r.sku.trim() }))
    .filter((r) => r.sku);
  // Platform kuralı: SKU'suz listing/varyant olamaz — tüm satırlar SKU'suzsa
  // kayıt sessizce sıfır-varyantlı düşerdi (evrensel anahtar ihlali).
  if (rows.length === 0) {
    return {
      error:
        "En az bir varyantın SKU'su gerekli — SKU'suz listing oluşturulamaz (SKU tüm sistemlerin ortak anahtarıdır).",
    };
  }
  const skuSet = new Set(rows.map((r) => r.sku));
  if (skuSet.size !== rows.length) {
    return { error: "Varyant SKU'ları benzersiz olmalı." };
  }

  // Motor: önce eksik ağırlıklar bedenden, sonra eksik fiyatlar ağırlıktan.
  const base: DistVariant[] = rows.map((r) => ({
    sku: r.sku,
    weightGrams: gramOrNull(r.weight),
    priceCents: centsOrNull(r.price),
  }));
  const wPred = new Map(inferWeightsBySize(base).map((p) => [p.sku, p]));
  const withWeights: DistVariant[] = base.map((v) => ({
    ...v,
    weightGrams: v.weightGrams ?? wPred.get(v.sku)?.weightGrams ?? null,
  }));
  const pPred = new Map(
    distributePriceByWeight(withWeights, {
      karat: numOrUndefined(input.karat),
      goldSpotPerGramUsd: numOrUndefined(input.goldSpot),
      markup: numOrUndefined(input.markup),
    }).map((p) => [p.sku, p]),
  );

  const finalVariants = base.map((v) => {
    const inferred = wPred.get(v.sku);
    const weight = v.weightGrams ?? inferred?.weightGrams ?? null;
    return {
      sku: v.sku,
      weight_grams: weight,
      weight_source:
        v.weightGrams != null ? "manual" : inferred ? "inferred" : null,
      price_cents: v.priceCents ?? pPred.get(v.sku)?.priceCents ?? null,
    };
  });

  const prices = finalVariants
    .map((v) => v.price_cents)
    .filter((c): c is number => c != null);
  const minPriceCents = prices.length > 0 ? Math.min(...prices) : null;

  const admin = createAdminClient();
  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      org_id: m.org_id,
      title,
      description: input.description.trim() || null,
      tags: splitList(input.tags),
      materials: splitList(input.materials),
      status: "draft",
      currency: "USD",
      price_cents: minPriceCents,
      has_variations: finalVariants.length > 1,
    })
    .select("id")
    .single();
  if (productError || !product) {
    return { error: productError?.message ?? "Listing oluşturulamadı." };
  }
  const productId = (product as { id: string }).id;

  if (finalVariants.length > 0) {
    const { error: variantError } = await admin.from("product_variants").insert(
      finalVariants.map((v) => ({
        org_id: m.org_id,
        product_id: productId,
        sku: v.sku,
        price_cents: v.price_cents,
        weight_grams: v.weight_grams,
        weight_source: v.weight_source,
        active: true,
      })),
    );
    if (variantError) {
      // Yarım kayıt bırakma — taslağı geri al (org kilidiyle).
      await admin
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("org_id", m.org_id);
      return {
        error:
          (variantError as { code?: string }).code === "23505"
            ? "Bu SKU'lardan biri zaten kayıtlı — SKU'lar mağaza genelinde benzersiz olmalı."
            : variantError.message,
      };
    }
  }

  revalidatePath("/tasarimlar");
  revalidatePath(`/tasarimlar/listing/${productId}`);
  return { id: productId };
}
