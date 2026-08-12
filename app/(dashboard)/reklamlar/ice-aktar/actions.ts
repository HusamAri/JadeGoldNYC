"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ADS_PERIOD_LABEL } from "@/lib/db/queries/ads-actions";
import type { MappedAdsRow } from "@/lib/csv/mappers/etsy-ads";
import type { MappedAdsDailyRow } from "@/lib/csv/mappers/etsy-ads-daily";

export interface CommitAdsImportResult {
  ok?: boolean;
  imported?: number;
  matched?: number;
  /** Listing kimliğiyle eşleşenler (güvenilir yol). */
  matchedById?: number;
  /** Yalnız başlıkla eşleşenler (kırılgan yol). */
  matchedByTitle?: number;
  unmatched?: number;
  periodLabel?: string;
  error?: string;
}

/**
 * Etsy Ads CSV satırlarını `product_metrics`'e yazar.
 *
 * Eşleştirme sırası: (1) `products.etsy_listing_id` — dışa aktarımda
 * "Listing ID" sütunu varsa; (2) başlık tam eşleşmesi; (3) başlık içerme.
 * Kimlik önce gelir çünkü başlık Etsy'de elle düzenlenebilir ve senkron
 * paneldeki başlığı ezer — kimlik sabittir. Eşleşemeyen satırlar
 * `product_id` olmadan yine kaydedilir (mağaza toplamı bozulmasın).
 *
 * `periodLabel` verilmezse `ADS_PERIOD_LABEL` kullanılır. Verilen etiket
 * `ADS_PERIOD_MATCH` (`%son 30%`) ile eşleşecek şekilde önekle saklanır ki
 * mevcut okuyucu (ads-actions) etiketi görmeye devam etsin; kullanıcının
 * yazdığı pencere etiketin devamında durur → hangi tarih aralığından
 * geldiği kayıtta yaşar.
 */
export async function commitAdsImport(
  rows: MappedAdsRow[],
  periodNote?: string,
): Promise<CommitAdsImportResult> {
  const m = await requireMembership();
  if (!rows.length) return { error: "İçe aktarılacak satır yok." };

  const supabase = await createClient();
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, title, etsy_listing_id")
    .eq("org_id", m.org_id);
  if (pErr) return { error: pErr.message };

  const byId = new Map<number, string>();
  const byTitle = new Map<string, string>();
  for (const p of (products ?? []) as {
    id: string;
    title: string | null;
    etsy_listing_id: number | null;
  }[]) {
    if (p.etsy_listing_id != null) byId.set(Number(p.etsy_listing_id), p.id);
    if (p.title) byTitle.set(p.title.toLowerCase().trim(), p.id);
  }

  const note = (periodNote ?? "").trim();
  const periodLabel = note ? `${ADS_PERIOD_LABEL} · ${note}` : ADS_PERIOD_LABEL;

  let matchedById = 0;
  let matchedByTitle = 0;
  const inserts = rows.map((r) => {
    const t = r.title.toLowerCase().trim();
    let pid = r.listingId != null ? (byId.get(r.listingId) ?? null) : null;
    if (pid) {
      matchedById++;
    } else if (t) {
      // Boş başlıkta içerme araması HER ÜRÜNE uyar — yalnız dolu başlıkta koş.
      pid =
        byTitle.get(t) ??
        [...byTitle.entries()].find(
          ([k]) => k.includes(t) || t.includes(k),
        )?.[1] ??
        null;
      if (pid) matchedByTitle++;
    }
    return {
      org_id: m.org_id,
      product_id: pid,
      product_title: r.title,
      period_label: periodLabel,
      views: r.views,
      orders: r.orders,
      ads_clicks: r.adsClicks,
      ads_spend_cents: r.adsSpendCents,
      ads_revenue_cents: r.adsRevenueCents,
      created_by: m.user_id,
    };
  });

  const { error } = await supabase.from("product_metrics").insert(inserts);
  if (error) return { error: error.message };

  revalidatePath("/reklamlar/ice-aktar");
  revalidatePath("/tasarimlar");
  const matched = matchedById + matchedByTitle;
  return {
    ok: true,
    imported: inserts.length,
    matched,
    matchedById,
    matchedByTitle,
    unmatched: inserts.length - matched,
    periodLabel,
  };
}

export interface CommitAdsDailyImportResult {
  ok?: boolean;
  imported?: number;
  error?: string;
}

/**
 * Mağaza geneli GÜNLÜK reklam satırlarını `ad_daily_stats`'e yazar (Etsy
 * Reklam panosunun "stats over time" dışa aktarımı). Idempotent: (org_id,
 * stat_date) çakışmasında üzerine yazar — aynı ayı tekrar yüklemek satır
 * çoğaltmaz. Reklamlar panosu bu seriyi "Etsy Reklam · günlük" bölümünde okur.
 */
export async function commitAdsDailyImport(
  rows: MappedAdsDailyRow[],
  currency = "USD",
): Promise<CommitAdsDailyImportResult> {
  const m = await requireMembership();
  if (!rows.length) return { error: "İçe aktarılacak günlük satır yok." };

  const supabase = await createClient();
  const payload = rows.map((r) => ({
    org_id: m.org_id,
    stat_date: r.date,
    views: r.views,
    clicks: r.clicks,
    orders: r.orders,
    revenue_cents: r.revenueCents,
    spend_cents: r.spendCents,
    ending_budget_cents: r.endingBudgetCents,
    currency,
    source: "etsy_ads_csv",
    created_by: m.user_id,
  }));

  const { error } = await supabase
    .from("ad_daily_stats")
    .upsert(payload, { onConflict: "org_id,stat_date" });
  if (error) return { error: error.message };

  revalidatePath("/reklamlar/ice-aktar");
  revalidatePath("/panel");
  return { ok: true, imported: payload.length };
}
