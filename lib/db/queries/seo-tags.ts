import { createClient } from "@/lib/supabase/server";

export type SeoTagStatus =
  | "pending"
  | "approved"
  | "pushed"
  | "rejected"
  | "failed";

export interface SeoTagOptimization {
  id: string;
  etsyListingId: number;
  title: string | null;
  ptype: string | null;
  archetype: string | null;
  oldTags: string[];
  proposedTags: string[];
  dropped: { tag: string; reason: string }[];
  added: { tag: string; reason: string }[];
  keyIssue: string | null;
  rationale: string | null;
  confidence: string | null;
  status: SeoTagStatus;
  baselineViews: number | null;
  baselineFavs: number | null;
  baselineCapturedAt: string | null;
  pushedAt: string | null;
  pushedTags: string[] | null;
  error: string | null;
  /** Push sonrası mevcut (canlı) views/favs — measure loop için. */
  currentViews: number | null;
  currentFavs: number | null;
}

const ARCH_ORDER: Record<string, number> = {
  leak: 0,
  bestseller: 1,
  converter: 2,
  standart: 3,
};

/**
 * SEO etiket optimizasyonları — değer-öncelikli sıralı (leak > bestseller >
 * converter > standart). Push edilmiş satırlar için güncel views/favs
 * products'tan eklenir (baseline ile kıyas = measure loop).
 */
export async function getSeoOptimizations(
  orgId: string,
): Promise<SeoTagOptimization[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seo_tag_optimizations")
    .select(
      "id, etsy_listing_id, title, ptype, archetype, old_tags, proposed_tags, dropped, added, key_issue, rationale, confidence, status, baseline_views, baseline_favs, baseline_captured_at, pushed_at, pushed_tags, error",
    )
    .eq("org_id", orgId);
  if (error) {
    console.error("getSeoOptimizations:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as {
    id: string;
    etsy_listing_id: number;
    title: string | null;
    ptype: string | null;
    archetype: string | null;
    old_tags: string[] | null;
    proposed_tags: string[] | null;
    dropped: { tag: string; reason: string }[] | null;
    added: { tag: string; reason: string }[] | null;
    key_issue: string | null;
    rationale: string | null;
    confidence: string | null;
    status: SeoTagStatus;
    baseline_views: number | null;
    baseline_favs: number | null;
    baseline_captured_at: string | null;
    pushed_at: string | null;
    pushed_tags: string[] | null;
    error: string | null;
  }[];

  // Push edilmişler için güncel views/favs (measure loop kıyası)
  const pushedIds = rows
    .filter((r) => r.status === "pushed")
    .map((r) => r.etsy_listing_id);
  const current = new Map<number, { views: number | null; favs: number | null }>();
  if (pushedIds.length > 0) {
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
      current.set(p.etsy_listing_id, { views: p.views, favs: p.num_favorers });
    }
  }

  return rows
    .map((r) => {
      const cur = current.get(r.etsy_listing_id);
      return {
        id: r.id,
        etsyListingId: r.etsy_listing_id,
        title: r.title,
        ptype: r.ptype,
        archetype: r.archetype,
        oldTags: r.old_tags ?? [],
        proposedTags: r.proposed_tags ?? [],
        dropped: r.dropped ?? [],
        added: r.added ?? [],
        keyIssue: r.key_issue,
        rationale: r.rationale,
        confidence: r.confidence,
        status: r.status,
        baselineViews: r.baseline_views,
        baselineFavs: r.baseline_favs,
        baselineCapturedAt: r.baseline_captured_at,
        pushedAt: r.pushed_at,
        pushedTags: r.pushed_tags,
        error: r.error,
        currentViews: cur?.views ?? null,
        currentFavs: cur?.favs ?? null,
      };
    })
    .sort(
      (a, b) =>
        (ARCH_ORDER[a.archetype ?? "standart"] ?? 3) -
          (ARCH_ORDER[b.archetype ?? "standart"] ?? 3) ||
        (a.title ?? "").localeCompare(b.title ?? ""),
    );
}

export interface SeoTagSummary {
  total: number;
  pending: number;
  pushed: number;
  rejected: number;
  failed: number;
  byArchetype: Record<string, number>;
}

export function summarizeSeo(rows: SeoTagOptimization[]): SeoTagSummary {
  const s: SeoTagSummary = {
    total: rows.length,
    pending: 0,
    pushed: 0,
    rejected: 0,
    failed: 0,
    byArchetype: {},
  };
  for (const r of rows) {
    if (r.status === "pending" || r.status === "approved") s.pending++;
    else if (r.status === "pushed") s.pushed++;
    else if (r.status === "rejected") s.rejected++;
    else if (r.status === "failed") s.failed++;
    const a = r.archetype ?? "standart";
    s.byArchetype[a] = (s.byArchetype[a] ?? 0) + 1;
  }
  return s;
}
