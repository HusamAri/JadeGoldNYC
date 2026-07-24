import { createClient } from "@/lib/supabase/server";

/**
 * Paket indirimleri (0118) — iki ürünü BİRLİKTE alınca uygulanan panel-içi
 * indirim planı. Etsy API sale/kupon kabul etmediğinden yalnız panelde tutulur
 * (planlama/marj). Multi-tenant kilidi: her sorgu org_id ile kapsanır.
 */

export interface DiscountBundleRow {
  id: string;
  product_a_id: string;
  product_b_id: string;
  product_a_title: string | null;
  product_b_title: string | null;
  product_a_image: string | null;
  product_b_image: string | null;
  discount_pct: number;
  start_at: string | null;
  end_at: string | null;
  min_order_cents: number | null;
  note: string | null;
  created_at: string;
}

export interface BundleProductOption {
  id: string;
  title: string;
  sku: string | null;
  image_url: string | null;
}

/** Org'un paket indirimlerini (ürün başlıkları çözülmüş) döndürür. */
export async function listDiscountBundles(
  orgId: string,
): Promise<DiscountBundleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discount_bundles")
    .select(
      "id, product_a_id, product_b_id, discount_pct, start_at, end_at, min_order_cents, note, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[indirimler] paket sorgusu:", error.message);
    return [];
  }
  const rows = (data ?? []) as Omit<
    DiscountBundleRow,
    | "product_a_title"
    | "product_b_title"
    | "product_a_image"
    | "product_b_image"
  >[];
  if (rows.length === 0) return [];

  const ids = [
    ...new Set(rows.flatMap((r) => [r.product_a_id, r.product_b_id])),
  ];
  const { data: prods } = await supabase
    .from("products")
    .select("id, title, image_url")
    .eq("org_id", orgId)
    .in("id", ids);
  const byId = new Map(
    ((prods ?? []) as { id: string; title: string; image_url: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );

  return rows.map((r) => ({
    ...r,
    product_a_title: byId.get(r.product_a_id)?.title ?? null,
    product_b_title: byId.get(r.product_b_id)?.title ?? null,
    product_a_image: byId.get(r.product_a_id)?.image_url ?? null,
    product_b_image: byId.get(r.product_b_id)?.image_url ?? null,
  }));
}

/** Paket kurmak için ürün seçenekleri (Etsy'de canlı, arşivsiz). */
export async function listBundleProductOptions(
  orgId: string,
): Promise<BundleProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title, sku, image_url")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("title", { ascending: true });
  if (error) {
    console.error("[indirimler] ürün seçenek sorgusu:", error.message);
    return [];
  }
  return (data ?? []) as BundleProductOption[];
}
