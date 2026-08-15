import { createClient } from "@/lib/supabase/server";
import type { Chapter } from "@/lib/collections/chapters";

export interface RedesignRow {
  id: string;
  etsyListingId: number;
  chapter: string;
  oldTitle: string | null;
  oldDescription: string | null;
  proposedTitle: string | null;
  proposedDescription: string | null;
  proposedTags: string[] | null;
  rationale: string | null;
  confidence: string | null;
  status: string;
  qaStatus: string | null;
  qaErrors: string[];
  qaWarnings: string[];
  pushedAt: string | null;
  baselineViews: number | null;
  baselineFavs: number | null;
  /** Push sonrası ölçüm için canlı sayaçlar (yalnız pushed satırlarda dolu). */
  currentViews: number | null;
  currentFavs: number | null;
  error: string | null;
}

export interface RedesignSummary {
  total: number;
  pending: number;
  approved: number;
  pushed: number;
  rejected: number;
  failed: number;
  qaFailed: number;
}

interface Raw {
  id: string;
  etsy_listing_id: number;
  chapter: string;
  old_title: string | null;
  old_description: string | null;
  proposed_title: string | null;
  proposed_description: string | null;
  proposed_tags: string[] | null;
  rationale: string | null;
  confidence: string | null;
  status: string;
  qa_report: { status?: string; errors?: string[]; warnings?: string[] } | null;
  pushed_at: string | null;
  baseline_views: number | null;
  baseline_favs: number | null;
  error: string | null;
}

/**
 * Bölümün içerik önerileri. `pushed` satırlarda canlı views/favs de çekilir —
 * baseline ile fark ölçümü bu iki sayının karşılaştırılmasıyla yapılır
 * (seo-tags.ts'teki ölçüm döngüsüyle aynı desen).
 */
export async function getRedesignBoard(
  orgId: string,
  chapter: Chapter,
): Promise<RedesignRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_redesigns")
    .select(
      "id, etsy_listing_id, chapter, old_title, old_description, proposed_title," +
        " proposed_description, proposed_tags, rationale, confidence, status," +
        " qa_report, pushed_at, baseline_views, baseline_favs, error",
    )
    .eq("org_id", orgId)
    .eq("chapter", chapter)
    .order("status", { ascending: true })
    .order("etsy_listing_id", { ascending: true });

  if (error) {
    console.error("getRedesignBoard:", error.message);
    return [];
  }
  const rows = (data ?? []) as unknown as Raw[];

  const pushedIds = rows.filter((r) => r.status === "pushed").map((r) => r.etsy_listing_id);
  const live = new Map<number, { views: number | null; favs: number | null }>();
  if (pushedIds.length) {
    const { data: prods } = await supabase
      .from("products")
      .select("etsy_listing_id, views, num_favorers")
      .eq("org_id", orgId)
      .in("etsy_listing_id", pushedIds);
    for (const p of (prods ?? []) as {
      etsy_listing_id: number;
      views: number | null;
      num_favorers: number | null;
    }[]) {
      live.set(p.etsy_listing_id, { views: p.views, favs: p.num_favorers });
    }
  }

  return rows.map((r) => {
    const cur = live.get(r.etsy_listing_id);
    return {
      id: r.id,
      etsyListingId: r.etsy_listing_id,
      chapter: r.chapter,
      oldTitle: r.old_title,
      oldDescription: r.old_description,
      proposedTitle: r.proposed_title,
      proposedDescription: r.proposed_description,
      proposedTags: r.proposed_tags,
      rationale: r.rationale,
      confidence: r.confidence,
      status: r.status,
      qaStatus: r.qa_report?.status ?? null,
      qaErrors: r.qa_report?.errors ?? [],
      qaWarnings: r.qa_report?.warnings ?? [],
      pushedAt: r.pushed_at,
      baselineViews: r.baseline_views,
      baselineFavs: r.baseline_favs,
      currentViews: cur?.views ?? null,
      currentFavs: cur?.favs ?? null,
      error: r.error,
    };
  });
}

export function summarizeRedesigns(rows: RedesignRow[]): RedesignSummary {
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    pushed: rows.filter((r) => r.status === "pushed").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    failed: rows.filter((r) => r.status === "failed").length,
    qaFailed: rows.filter((r) => r.qaStatus === "fail").length,
  };
}
