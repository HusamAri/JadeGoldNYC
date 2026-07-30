"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  parseMediaUrls,
  socialPostSchema,
  type SocialPostInput,
} from "@/lib/validations/social";

export type SocialActionResult = { ok?: boolean; error?: string; id?: string };

function parseWeek(s?: string): number | null {
  if (!s?.trim()) return null;
  const n = Number(s.trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function parseSchedule(s?: string): string | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toRow(orgId: string, userId: string, input: SocialPostInput) {
  return {
    org_id: orgId,
    platform: input.platform,
    format: input.format,
    status: input.status,
    title: input.title.trim(),
    week_number: parseWeek(input.week_number),
    week_theme: input.week_theme?.trim() || null,
    series: input.series?.trim() || null,
    scheduled_at: parseSchedule(input.scheduled_at),
    asset_note: input.asset_note?.trim() || null,
    overlay: input.overlay?.trim() || null,
    caption: input.caption?.trim() || null,
    hashtags: input.hashtags?.trim() || null,
    tags_note: input.tags_note?.trim() || null,
    permalink: input.permalink?.trim() || null,
    media_urls: parseMediaUrls(input.media_urls),
    created_by: userId,
    published_at:
      input.status === "published" ? new Date().toISOString() : null,
  };
}

export async function createSocialPost(
  raw: SocialPostInput,
): Promise<SocialActionResult> {
  const parsed = socialPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }
  const m = await requireMembership();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .insert(toRow(m.org_id, m.user_id, parsed.data))
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/sosyal");
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateSocialPost(
  id: string,
  raw: SocialPostInput,
): Promise<SocialActionResult> {
  const parsed = socialPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form." };
  }
  const m = await requireMembership();
  const row = toRow(m.org_id, m.user_id, parsed.data);
  // created_by güncellemede ezilmesin
  const patch = { ...row };
  delete (patch as { created_by?: string }).created_by;
  if (parsed.data.status !== "published") {
    patch.published_at = null;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_posts")
    .update(patch)
    .eq("org_id", m.org_id)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sosyal");
  return { ok: true };
}

export async function setSocialPostStatus(
  id: string,
  status: SocialPostInput["status"],
): Promise<SocialActionResult> {
  const m = await requireMembership();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  if (status !== "published") patch.published_at = null;
  const { error } = await supabase
    .from("social_posts")
    .update(patch)
    .eq("org_id", m.org_id)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sosyal");
  return { ok: true };
}

export async function deleteSocialPost(id: string): Promise<SocialActionResult> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("org_id", m.org_id)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sosyal");
  return { ok: true };
}
