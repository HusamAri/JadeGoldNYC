"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { advanceEtsyCreate } from "@/lib/etsy/create-listing";

/**
 * Onaylı taslakları (research_keyword dolu, etsy_listing_id boş) Etsy'de DRAFT
 * listing olarak oluşturur. Kullanıcı tetikler — motor sunucu tarafında canlı
 * Etsy'ye yazar (bu iş yalnız deploy edilmiş app'te çalışır; env anahtarları
 * orada). `limit` ile "önce 1'de doğrula" adımı yapılabilir.
 *
 * Dönüş: özet + son deneme kayıtları (etsy_create_log) — ekranda sonuç/hata
 * ve oluşan listing'in id'si gösterilir.
 */
export interface EtsyCreateRunResult {
  ok: boolean;
  error?: string;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
  rows: {
    product_id: string;
    title: string | null;
    outcome: string;
    step: string | null;
    etsy_listing_id: number | null;
    error: string | null;
  }[];
}

export async function runEtsyCreate(limit: number): Promise<EtsyCreateRunResult> {
  const m = await requireMembership();
  // Sadece owner/admin dışa-dönük oluşturma tetikleyebilsin.
  if (m.role !== "owner" && m.role !== "admin") {
    return {
      ok: false,
      error: "Yalnız sahip/yönetici Etsy'de listing oluşturabilir.",
      processed: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      rows: [],
    };
  }

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit) || 1));

  let summary;
  try {
    const out = await advanceEtsyCreate(m.org_id, safeLimit);
    summary = out[m.org_id];
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Bilinmeyen hata",
      processed: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      rows: [],
    };
  }

  // Bu turda yazılan deneme kayıtlarını (son safeLimit kadar) başlıkla getir.
  const admin = createAdminClient();
  const { data: logRows } = await admin
    .from("etsy_create_log")
    .select("product_id, outcome, step, etsy_listing_id, error, products(title)")
    .eq("org_id", m.org_id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  const rows = ((logRows ?? []) as unknown as {
    product_id: string;
    outcome: string;
    step: string | null;
    etsy_listing_id: number | null;
    error: string | null;
    products: { title: string | null } | null;
  }[]).map((r) => ({
    product_id: r.product_id,
    title: r.products?.title ?? null,
    outcome: r.outcome,
    step: r.step,
    etsy_listing_id: r.etsy_listing_id,
    error: r.error,
  }));

  revalidatePath("/tasarimlar");
  return {
    ok: true,
    processed: summary?.processed ?? 0,
    created: summary?.created ?? 0,
    skipped: summary?.skipped ?? 0,
    failed: summary?.failed ?? 0,
    rows,
  };
}
