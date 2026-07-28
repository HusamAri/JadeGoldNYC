"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth";
import { pricingWriteBlocked } from "@/lib/feature-flags";

export type RejectReason =
  | "tedarik"
  | "maliyet_alti"
  | "marka_primi"
  | "yanlis_rakip"
  | "gecici"
  | "diger";

/** Reddetme gerekçesine göre "sıradaki aksiyon" önerisi (senaryolar). */
const REJECT_NEXT_ACTION: Record<RejectReason, string> = {
  tedarik:
    "Tedarik/stok problemi → fiyatı değiştirme. Sıradaki: bu varyantın stok durumunu teyit et; tedarik edilemiyorsa varyantı pasifle. İptal oranını izle.",
  maliyet_alti:
    "Önerilen fiyat maliyet tabanının altında kalırdı → düşürme. Sıradaki: bu bedeni fiyatta tut; bunun yerine daha hafif/kârlı bedeni öne çıkar ya da listing'i yeniden değerlendir.",
  marka_primi:
    "Meşru pahalılık (marka/kalite/hızlı ABD kargo, Star Seller) → fiyat kalsın. Sıradaki: farkı görsel + açıklama + rozetle gerekçelendir. Dönüşüm yine düşükse yeniden değerlendir.",
  yanlis_rakip:
    "Rakip eşleşmesi hatalı (bire bir aynı ürün değil) → bu araştırmayı yok say. Sıradaki: araştırma kelimesini daralt (tip + ayar + mm) ve 'şimdi araştır' ile tekrar dene.",
  gecici:
    "Şimdilik izlemeye alındı. Sıradaki: bir sonraki 7-günlük taramada tekrar değerlendirilecek; sinyal tekrarlarsa aksiyona dönüştür.",
  diger: "Karar not edildi. Sıradaki aksiyon nota göre elle belirlenecek.",
};

/** Önerilen fiyatı UYGULA: panel referans fiyatını günceller + kararı loglar. */
export async function applyMarketPrice(input: {
  productId: string;
  researchId: string | null;
  suggestedPriceCents: number;
}): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireMembership();
  // Fiyat panel dışında belirleniyorsa (EON) önerilen fiyat UYGULANAMAZ.
  const pricingBlocked = await pricingWriteBlocked(m.org_id);
  if (pricingBlocked) return { error: pricingBlocked };
  const { productId, researchId, suggestedPriceCents } = input;
  if (!Number.isFinite(suggestedPriceCents) || suggestedPriceCents <= 0) {
    return { error: "Geçersiz fiyat." };
  }
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id, price_cents")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (!product) return { error: "Ürün bulunamadı." };

  const { error: upErr } = await admin
    .from("products")
    .update({ price_cents: suggestedPriceCents })
    .eq("id", productId)
    .eq("org_id", m.org_id);
  if (upErr) return { error: "Fiyat güncellenemedi." };

  const nextAction = `Panel referans fiyatı $${(suggestedPriceCents / 100).toFixed(0)} yapıldı. Sıradaki: Etsy'de de bu fiyatı uygula (varyant fiyatları) ve 2-3 hafta dönüşümü izle. Etsy'ye otomatik yazma henüz kapalı — değişikliği Etsy panelinden de yap.`;

  await admin.from("market_price_decisions").insert({
    org_id: m.org_id,
    product_id: productId,
    research_id: researchId,
    decision: "applied",
    suggested_price_cents: suggestedPriceCents,
    applied_price_cents: suggestedPriceCents,
    next_action: nextAction,
    decided_by: m.user_id,
  });

  revalidatePath(`/analizler/urunler/liste/${productId}`);
  revalidatePath("/panel");
  return { ok: true };
}

/** Önerilen fiyatı REDDET: gerekçe + sonraki aksiyonu loglar (fiyat değişmez). */
export async function rejectMarketPrice(input: {
  productId: string;
  researchId: string | null;
  suggestedPriceCents: number | null;
  reason: RejectReason;
  note?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireMembership();
  const { productId, researchId, suggestedPriceCents, reason, note } = input;
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("org_id", m.org_id)
    .maybeSingle();
  if (!product) return { error: "Ürün bulunamadı." };

  const nextAction = REJECT_NEXT_ACTION[reason];

  const { error } = await admin.from("market_price_decisions").insert({
    org_id: m.org_id,
    product_id: productId,
    research_id: researchId,
    decision: "rejected",
    suggested_price_cents: suggestedPriceCents,
    reject_reason: reason,
    note: note?.trim() || null,
    next_action: nextAction,
    decided_by: m.user_id,
  });
  if (error) return { error: "Karar kaydedilemedi." };

  revalidatePath(`/analizler/urunler/liste/${productId}`);
  revalidatePath("/panel");
  return { ok: true };
}

/** Bir ürünün en güncel kararı (varsa) — UI'da durum göstermek için. */
export async function getLatestDecision(productId: string): Promise<{
  decision: "applied" | "rejected";
  reject_reason: string | null;
  next_action: string | null;
  applied_price_cents: number | null;
  created_at: string;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("latest_market_decision")
    .select("decision, reject_reason, next_action, applied_price_cents, created_at")
    .eq("product_id", productId)
    .maybeSingle();
  return (data as never) ?? null;
}
