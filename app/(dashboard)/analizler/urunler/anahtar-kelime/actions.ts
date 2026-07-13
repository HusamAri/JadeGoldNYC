"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MappedKeywordRow } from "@/lib/csv/mappers/etsy-keywords";

export interface KeywordImportResult {
  ok?: boolean;
  error?: string;
  matched?: number;
  unmatched?: number;
}

/**
 * İçe aktarılan anahtar kelime satırlarını org ürünleriyle eşleştirip
 * `research_keyword`'e yazar. Eşleşme: önce etsy_listing_id (kesin), sonra
 * başlık (tam ya da içeren). Bulk yazım service-role ile (org'a kilitli).
 */
export async function commitKeywordImport(
  rows: MappedKeywordRow[],
): Promise<KeywordImportResult> {
  const m = await requireMembership();
  if (!rows.length) return { error: "İçe aktarılacak satır yok." };

  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, etsy_listing_id, title")
    .eq("org_id", m.org_id);

  const byId = new Map<number, string>();
  const byTitle = new Map<string, string>();
  for (const p of (products ?? []) as {
    id: string;
    etsy_listing_id: number | null;
    title: string;
  }[]) {
    if (p.etsy_listing_id) byId.set(p.etsy_listing_id, p.id);
    if (p.title) byTitle.set(p.title.toLowerCase().trim(), p.id);
  }

  const updates: { id: string; keyword: string }[] = [];
  let unmatched = 0;
  for (const r of rows) {
    let pid: string | undefined;
    if (r.listingId) pid = byId.get(r.listingId);
    if (!pid && r.title) {
      const t = r.title.toLowerCase().trim();
      pid =
        byTitle.get(t) ??
        [...byTitle.entries()].find(
          ([k]) => k.includes(t) || t.includes(k),
        )?.[1];
    }
    if (pid) updates.push({ id: pid, keyword: r.keyword });
    else unmatched++;
  }

  for (const u of updates) {
    await admin
      .from("products")
      .update({ research_keyword: u.keyword })
      .eq("id", u.id)
      .eq("org_id", m.org_id);
  }

  revalidatePath("/analizler/urunler");
  return { ok: true, matched: updates.length, unmatched };
}
