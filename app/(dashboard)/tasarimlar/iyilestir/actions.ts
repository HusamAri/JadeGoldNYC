"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeHtmlEntities, hasHtmlEntities } from "@/lib/etsy/text";

/**
 * Listing İyileştirme aksiyonları. Tek otomatik düzeltme: başlıklardaki ham
 * HTML entity'lerini panel verisinde normalize etmek — Etsy'ye YAZMAZ
 * (Etsy'deki başlık zaten düzgün; entity'ler API'nin escape çıktısı).
 */
export async function normalizeTitleEntities(): Promise<{
  ok?: boolean;
  fixed?: number;
  error?: string;
}> {
  const m = await requireMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .eq("org_id", m.org_id)
    .or("title.ilike.%&quot;%,title.ilike.%&#%,title.ilike.%&amp;%,title.ilike.%&apos;%");
  if (error) return { error: error.message };

  const rows = ((data ?? []) as { id: string; title: string | null }[]).filter(
    (r) => r.title != null && hasHtmlEntities(r.title),
  );
  if (rows.length === 0) return { ok: true, fixed: 0 };

  const admin = createAdminClient();
  let fixed = 0;
  for (const r of rows) {
    const decoded = decodeHtmlEntities(r.title!);
    if (decoded === r.title) continue;
    const { error: upErr } = await admin
      .from("products")
      .update({ title: decoded, updated_at: new Date().toISOString() })
      .eq("id", r.id)
      .eq("org_id", m.org_id);
    if (upErr) return { error: `${r.id}: ${upErr.message}` };
    fixed += 1;
  }

  // Not: products tablosunun audit trigger'ı her update'i şirket hafızasına
  // zaten yazar — ayrıca semantik log gerekmez.
  revalidatePath("/tasarimlar/iyilestir");
  revalidatePath("/tasarimlar");
  return { ok: true, fixed };
}
