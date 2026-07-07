import { createClient } from "@/lib/supabase/server";

export interface GeneratedImage {
  id: string;
  etsyListingId: number | null;
  title: string | null;
  sourceUrl: string;
  thumbUrl: string | null;
  refUrl: string | null;
  prompt: string | null;
  model: string | null;
  aspectRatio: string | null;
  kind: string | null;
  isSelected: boolean;
  createdAt: string;
  etsyUploadedAt: string | null;
}

type Row = {
  id: string;
  etsy_listing_id: number | null;
  title: string | null;
  source_url: string;
  thumb_url: string | null;
  ref_url: string | null;
  prompt: string | null;
  model: string | null;
  aspect_ratio: string | null;
  kind: string | null;
  is_selected: boolean;
  created_at: string;
  etsy_uploaded_at: string | null;
};

function map(r: Row): GeneratedImage {
  return {
    id: r.id,
    etsyListingId: r.etsy_listing_id,
    title: r.title,
    sourceUrl: r.source_url,
    thumbUrl: r.thumb_url,
    refUrl: r.ref_url,
    prompt: r.prompt,
    model: r.model,
    aspectRatio: r.aspect_ratio,
    kind: r.kind,
    isSelected: r.is_selected,
    createdAt: r.created_at,
    etsyUploadedAt: r.etsy_uploaded_at,
  };
}

/**
 * Panelde gösterilecek üretilmiş görseller — en yeni önce. Yalnız URL + meta
 * okunur (görsel baytları Higgsfield'da kalır). İsteğe bağlı yalnız-seçili.
 */
export async function listGeneratedImages(
  orgId: string,
  opts: { onlySelected?: boolean } = {},
): Promise<GeneratedImage[]> {
  const supabase = await createClient();
  let query = supabase
    .from("generated_images")
    .select(
      "id, etsy_listing_id, title, source_url, thumb_url, ref_url, prompt, model, aspect_ratio, kind, is_selected, created_at, etsy_uploaded_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (opts.onlySelected) query = query.eq("is_selected", true);

  const { data } = await query;
  return ((data ?? []) as unknown as Row[]).map(map);
}

export async function countGeneratedImages(
  orgId: string,
): Promise<{ total: number; selected: number }> {
  const supabase = await createClient();
  const [{ count: total }, { count: selected }] = await Promise.all([
    supabase
      .from("generated_images")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("generated_images")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_selected", true),
  ]);
  return { total: total ?? 0, selected: selected ?? 0 };
}
