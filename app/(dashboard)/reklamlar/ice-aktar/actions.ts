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
  unmatched?: number;
  error?: string;
}

/**
 * Etsy Ads CSV satırlarını `product_metrics`'e yazar. Ürün eşleşmesi başlık
 * üzerinden yapılır (tam eşleşme, sonra içeren — keyword import deseni);
 * eşleşemeyen satırlar product_id'siz kaydedilir. Reklamlar panosu
 * "son 30" etiketli en güncel kayıtları okur.
 */
export async function commitAdsImport(
  rows: MappedAdsRow[],
): Promise<CommitAdsImportResult> {
  const m = await requireMembership();
  if (!rows.length) return { error: "İçe aktarılacak satır yok." };

  const supabase = await createClient();
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, title")
    .eq("org_id", m.org_id);
  if (pErr) return { error: pErr.message };

  const byTitle = new Map<string, string>();
  for (const p of (products ?? []) as { id: string; title: string }[]) {
    if (p.title) byTitle.set(p.title.toLowerCase().trim(), p.id);
  }

  let matched = 0;
  const inserts = rows.map((r) => {
    const t = r.title.toLowerCase().trim();
    const pid =
      byTitle.get(t) ??
      [...byTitle.entries()].find(([k]) => k.includes(t) || t.includes(k))?.[1] ??
      null;
    if (pid) matched++;
    return {
      org_id: m.org_id,
      product_id: pid,
      product_title: r.title,
      period_label: ADS_PERIOD_LABEL,
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

  revalidatePath("/reklamlar");
  revalidatePath("/analizler/urunler");
  return {
    ok: true,
    imported: inserts.length,
    matched,
    unmatched: inserts.length - matched,
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

  revalidatePath("/reklamlar");
  return { ok: true, imported: payload.length };
}
