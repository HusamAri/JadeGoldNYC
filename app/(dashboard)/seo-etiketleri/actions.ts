"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EtsyClient } from "@/lib/etsy/client";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { updateListingTags } from "@/lib/etsy/listing";

const PATH = "/seo-etiketleri";

export interface SeoPushResult {
  ok?: boolean;
  error?: string;
}

/** Etsy kuralı: TAM 13 tag, her biri ≤20 karakter, birebir tekrar yok. */
function validateTags(tags: string[]): string | null {
  if (tags.length !== 13) return `13 tag gerekli (${tags.length} verildi).`;
  for (const t of tags) {
    if (!t.trim()) return "Boş tag olamaz.";
    if (t.length > 20) return `20 karakteri aşan tag: "${t}"`;
  }
  const low = tags.map((t) => t.toLowerCase().trim());
  if (new Set(low).size !== low.length) return "Birebir tekrar eden tag var.";
  return null;
}

interface Row {
  id: string;
  etsy_listing_id: number;
  proposed_tags: string[] | null;
  status: string;
}

/**
 * Tek bir öneriyi Etsy'ye gönderir: baseline (views/favs) yakalanır, tag'ler
 * canlı listing'e yazılır, satır 'pushed' işaretlenir, products.tags eşitlenir
 * (vekil taze kalır). Idempotent: zaten pushed ise atlar.
 */
async function pushRow(
  client: EtsyClient,
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  row: Row,
): Promise<SeoPushResult> {
  const tags = row.proposed_tags ?? [];
  const invalid = validateTags(tags);
  if (invalid) {
    await supabase
      .from("seo_tag_optimizations")
      .update({ status: "failed", error: invalid })
      .eq("id", row.id)
      .eq("org_id", orgId);
    return { error: invalid };
  }

  // Baseline: push anındaki canlı views/favs (measure loop referansı)
  const { data: prod } = await supabase
    .from("products")
    .select("views, num_favorers")
    .eq("org_id", orgId)
    .eq("etsy_listing_id", row.etsy_listing_id)
    .maybeSingle();

  try {
    await updateListingTags(client, row.etsy_listing_id, tags);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Etsy'ye gönderilemedi.";
    await supabase
      .from("seo_tag_optimizations")
      .update({ status: "failed", error: msg })
      .eq("id", row.id)
      .eq("org_id", orgId);
    return { error: msg };
  }

  const p = prod as { views: number | null; num_favorers: number | null } | null;
  await supabase
    .from("seo_tag_optimizations")
    .update({
      status: "pushed",
      pushed_tags: tags,
      pushed_at: new Date().toISOString(),
      pushed_by: userId,
      baseline_views: p?.views ?? null,
      baseline_favs: p?.num_favorers ?? null,
      baseline_captured_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", row.id)
    .eq("org_id", orgId);

  // Vekili eşitle: yerel products.tags = artık canlıdaki set (bayat kalmasın).
  await supabase
    .from("products")
    .update({ tags })
    .eq("org_id", orgId)
    .eq("etsy_listing_id", row.etsy_listing_id);

  return { ok: true };
}

/** Tek listing'in optimize tag'lerini Etsy'ye gönderir. */
export async function pushSeoTag(id: string): Promise<SeoPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { error: "Etsy yazma erişimi kapalı." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("seo_tag_optimizations")
    .select("id, etsy_listing_id, proposed_tags, status")
    .eq("id", id)
    .eq("org_id", m.org_id)
    .maybeSingle();
  const row = data as Row | null;
  if (!row) return { error: "Öneri bulunamadı." };
  if (row.status === "pushed") return { ok: true };

  const client = await EtsyClient.forOrg(m.org_id);
  const res = await pushRow(client, supabase, m.org_id, m.user_id, row);
  revalidatePath(PATH);
  return res;
}

export interface SeoBatchResult {
  pushed: number;
  failed: number;
  error?: string;
}

/**
 * Bir arketip grubunu (ör. leak + bestseller) sırayla Etsy'ye gönderir.
 * Zaten pushed olanları atlar; EtsyClient 429'da kendi retry'ını yapar.
 */
export async function pushSeoBatch(
  archetypes: string[],
): Promise<SeoBatchResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { pushed: 0, failed: 0, error: MANAGER_ONLY_ERROR };
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled) return { pushed: 0, failed: 0, error: "Etsy yazma erişimi kapalı." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("seo_tag_optimizations")
    .select("id, etsy_listing_id, proposed_tags, status")
    .eq("org_id", m.org_id)
    .in("archetype", archetypes)
    .neq("status", "pushed")
    .neq("status", "rejected");
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return { pushed: 0, failed: 0 };

  const client = await EtsyClient.forOrg(m.org_id);
  let pushed = 0;
  let failed = 0;
  for (const row of rows) {
    const res = await pushRow(client, supabase, m.org_id, m.user_id, row);
    if (res.ok) pushed++;
    else failed++;
  }
  revalidatePath(PATH);
  return { pushed, failed };
}

/** Öneriyi reddeder (Etsy'ye gitmez, listeden düşer). */
export async function rejectSeoTag(id: string): Promise<SeoPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const supabase = await createClient();
  const { error } = await supabase
    .from("seo_tag_optimizations")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("org_id", m.org_id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/** Reddedilen/başarısız öneriyi tekrar 'pending'e alır. */
export async function resetSeoTag(id: string): Promise<SeoPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const supabase = await createClient();
  const { error } = await supabase
    .from("seo_tag_optimizations")
    .update({ status: "pending", error: null })
    .eq("id", id)
    .eq("org_id", m.org_id);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/** Öneri tag'lerini elle düzenler (gönderilmeden önce). */
export async function updateProposedTags(
  id: string,
  tags: string[],
): Promise<SeoPushResult> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };
  const invalid = validateTags(tags);
  if (invalid) return { error: invalid };
  const supabase = await createClient();
  const { error } = await supabase
    .from("seo_tag_optimizations")
    .update({ proposed_tags: tags })
    .eq("id", id)
    .eq("org_id", m.org_id)
    .neq("status", "pushed");
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}
