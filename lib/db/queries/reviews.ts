import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";

export interface ReviewSummary {
  total: number;
  ratedCount: number;
  avgRating: number;
  newCount: number;
  flagged: number;
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("status, rating");
  const rows = (data ?? []) as { status: string; rating: number | null }[];

  const total = rows.length;
  const rated = rows.filter((r) => r.rating != null);
  const ratedCount = rated.length;
  const avgRating = ratedCount
    ? rated.reduce((a, r) => a + (r.rating ?? 0), 0) / ratedCount
    : 0;
  const newCount = rows.filter((r) => r.status === "yeni").length;
  const flagged = rows.filter((r) => r.status === "isaretli").length;

  return { total, ratedCount, avgRating, newCount, flagged };
}

export interface ListReviewOptions {
  status?: string;
  rating?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listReviews(opts: ListReviewOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 25;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .order("review_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.rating) query = query.eq("rating", Number(opts.rating));
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) {
      query = query.or(`buyer_name.ilike.%${s}%,review_text.ilike.%${s}%`);
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Review[], count: count ?? 0, limit, offset };
}

export async function getReview(id: string): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Review) ?? null;
}
