import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  CHAPTERS,
  CHAPTER_ORDER,
  type Chapter,
  type ChapterMeta,
} from "@/lib/collections/chapters";

/** Bir bölümün canlı katalogdaki durumu (panel board'u besler). */
export interface ChapterSummary {
  meta: ChapterMeta;
  /** Etsy'de var olan, silinmemiş listing sayısı. */
  listings: number;
  /** Bunlardan kaçı Etsy'de aktif. */
  active: number;
  /** Ömür-boyu görüntülenme (bölüm ilgi hacmi). */
  views: number;
  /** Ömür-boyu favori. */
  favs: number;
  /** Elle sabitlenmiş (kilitli) sınıflama sayısı. */
  locked: number;
  /** Bu bölümde bekleyen/onaylı/gönderilmiş yeniden tasarım sayıları. */
  redesign: { pending: number; approved: number; pushed: number };
}

interface ProductRow {
  chapter: string | null;
  chapter_locked: boolean | null;
  status: string | null;
  views: number | null;
  num_favorers: number | null;
}

interface RedesignRow {
  chapter: string | null;
  status: string | null;
}

function emptySummary(key: Chapter): ChapterSummary {
  return {
    meta: CHAPTERS[key],
    listings: 0,
    active: 0,
    views: 0,
    favs: 0,
    locked: 0,
    redesign: { pending: 0, approved: 0, pushed: 0 },
  };
}

/**
 * Bölüm bazlı özet: her anlam bölümü için listing/trafik sayıları + yeniden
 * tasarım durumu. Sınıflanmamış (chapter null) listingler ayrı döner ki
 * "kapsama boşluğu" görünür olsun — sessizce bir bölüme sayılmaz.
 *
 * Multi-tenant: org_id parametre sözleşmesi UYGULANIR (RLS'in aktif-org
 * varsayımına yaslanmaz).
 */
export async function getChapterBoard(orgId: string): Promise<{
  chapters: ChapterSummary[];
  unclassified: number;
  totalListings: number;
}> {
  const supabase = await createClient();

  const [prodRes, redesignRes] = await Promise.all([
    supabase
      .from("products")
      .select("chapter, chapter_locked, status, views, num_favorers")
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null)
      .is("etsy_deleted_at", null)
      .is("archived_at", null),
    supabase
      .from("listing_redesigns")
      .select("chapter, status")
      .eq("org_id", orgId),
  ]);

  if (prodRes.error) {
    console.error("getChapterBoard products:", prodRes.error.message);
  }
  if (redesignRes.error) {
    console.error("getChapterBoard redesigns:", redesignRes.error.message);
  }

  const byKey = new Map<Chapter, ChapterSummary>(
    CHAPTER_ORDER.map((k) => [k, emptySummary(k)]),
  );
  let unclassified = 0;

  for (const row of (prodRes.data ?? []) as ProductRow[]) {
    const key = row.chapter as Chapter | null;
    if (!key || !byKey.has(key)) {
      unclassified++;
      continue;
    }
    const s = byKey.get(key)!;
    s.listings++;
    if ((row.status ?? "").toLowerCase() === "active") s.active++;
    if (row.chapter_locked) s.locked++;
    s.views += row.views ?? 0;
    s.favs += row.num_favorers ?? 0;
  }

  for (const row of (redesignRes.data ?? []) as RedesignRow[]) {
    const key = row.chapter as Chapter | null;
    if (!key || !byKey.has(key)) continue;
    const s = byKey.get(key)!;
    const st = row.status ?? "";
    if (st === "pending") s.redesign.pending++;
    else if (st === "approved") s.redesign.approved++;
    else if (st === "pushed") s.redesign.pushed++;
  }

  return {
    chapters: CHAPTER_ORDER.map((k) => byKey.get(k)!),
    unclassified,
    totalListings: (prodRes.data ?? []).length,
  };
}

/** Etsy'deki canlı vitrin bölümü (biçim ekseni — anlam bölümünden farklı). */
export interface ShopSectionRow {
  section_id: number;
  title: string;
  active_listing_count: number;
  rank: number | null;
}

/**
 * Etsy mağaza bölümleri: alıcının vitrinde gördüğü gerçek yerleşim.
 *
 * Anlam bölümlerinden (chapter) BAĞIMSIZ bir eksendir ve canlıdır — panel
 * burada yalnız aynadır. Boş bölümler ayrıca döner: alıcıya vitrinde
 * karşılığı olmayan başlıklar mağazayı dağınık gösterir ve yönetimde
 * "bu ne işe yarıyor" sorusunu açık bırakır.
 */
export async function getShopSections(orgId: string): Promise<{
  filled: ShopSectionRow[];
  empty: ShopSectionRow[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("etsy_shop_sections")
    .select("section_id, title, active_listing_count, rank")
    .eq("org_id", orgId)
    .order("rank", { ascending: true });

  if (error) {
    console.error("getShopSections:", error.message);
    return { filled: [], empty: [] };
  }
  const rows = (data ?? []) as ShopSectionRow[];
  return {
    filled: rows.filter((r) => (r.active_listing_count ?? 0) > 0),
    empty: rows.filter((r) => (r.active_listing_count ?? 0) === 0),
  };
}

/** Sınıflanmamış listingler (bölüm ataması bekleyen) — kapsama boşluğunu kapatmak için. */
export async function listUnclassified(
  orgId: string,
  limit = 50,
): Promise<{ id: string; title: string | null; etsy_listing_id: number | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title, etsy_listing_id")
    .eq("org_id", orgId)
    .is("chapter", null)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    .is("archived_at", null)
    .order("views", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listUnclassified:", error.message);
    return [];
  }
  return (data ?? []) as { id: string; title: string | null; etsy_listing_id: number | null }[];
}
