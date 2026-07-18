import { createClient } from "@/lib/supabase/server";

export type SocialPlatform = "instagram" | "tiktok" | "pinterest" | "other";
export type SocialFormat = "reel" | "photo" | "carousel" | "story" | "post";
export type SocialStatus =
  | "idea"
  | "planned"
  | "ready"
  | "published"
  | "skipped";

export interface SocialPost {
  id: string;
  org_id: string;
  platform: SocialPlatform;
  format: SocialFormat;
  status: SocialStatus;
  week_number: number | null;
  week_theme: string | null;
  series: string | null;
  title: string;
  scheduled_at: string | null;
  published_at: string | null;
  asset_note: string | null;
  overlay: string | null;
  caption: string | null;
  hashtags: string | null;
  tags_note: string | null;
  permalink: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialSummary {
  total: number;
  planned: number;
  ready: number;
  published: number;
  upcoming7d: number;
}

/** Org'un sosyal içeriklerini tarih sırasıyla listeler. */
export async function listSocialPosts(orgId: string): Promise<SocialPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select(
      "id, org_id, platform, format, status, week_number, week_theme, series, title, scheduled_at, published_at, asset_note, overlay, caption, hashtags, tags_note, permalink, sort_order, created_at, updated_at",
    )
    .eq("org_id", orgId)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("listSocialPosts:", error.message);
    return [];
  }
  return (data ?? []) as SocialPost[];
}

export async function getSocialSummary(orgId: string): Promise<SocialSummary> {
  const posts = await listSocialPosts(orgId);
  const now = Date.now();
  const week = now + 7 * 86_400_000;
  return {
    total: posts.length,
    planned: posts.filter((p) => p.status === "planned" || p.status === "idea")
      .length,
    ready: posts.filter((p) => p.status === "ready").length,
    published: posts.filter((p) => p.status === "published").length,
    upcoming7d: posts.filter((p) => {
      if (!p.scheduled_at) return false;
      if (p.status === "published" || p.status === "skipped") return false;
      const t = new Date(p.scheduled_at).getTime();
      return t >= now && t <= week;
    }).length,
  };
}
