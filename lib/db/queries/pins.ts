import { createClient } from "@/lib/supabase/server";
import type { PinSticker, TargetPin } from "@/lib/pins/meta";

// Saf katman (tipler + eventPinTargetId) istemci-güvenli modülde yaşar;
// RSC tarafındaki tüketiciler için buradan da dışa verilir.
export * from "@/lib/pins/meta";

/** Kullanıcının kendi seti — tepside gösterilir; seti olmayan kullanıcıda boş. */
export async function getMyStickers(userId: string): Promise<PinSticker[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pin_stickers")
    .select("id, key, label, src, kind")
    .eq("owner_user_id", userId)
    .order("sort", { ascending: true });
  if (error) console.error("[pins] getMyStickers:", error.message);
  return (data as PinSticker[] | null) ?? [];
}

/**
 * Verilen hedeflerin pinleri — target_id → pin listesi. Liste yüzeyleri
 * (satış tablosu, kayıt listesi, zaman çizelgesi) TEK sorguda toplu çeker;
 * satır başına sorgu (N+1) yok. `.in()` URL sınırı için 200'lük parçalar.
 */
export async function getPinsForTargets(
  orgId: string,
  targetType: "task" | "sale" | "event" | "audit",
  targetIds: string[],
): Promise<Map<string, TargetPin[]>> {
  const map = new Map<string, TargetPin[]>();
  const ids = [...new Set(targetIds)].filter(Boolean);
  if (ids.length === 0) return map;
  const supabase = await createClient();

  interface Row {
    id: string;
    target_id: string;
    pinned_by: string | null;
    created_at: string;
    sticker: { src: string; label: string } | null;
  }
  const rows: Row[] = [];
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await supabase
      .from("pins")
      .select(
        "id, target_id, pinned_by, created_at, sticker:pin_stickers(src, label)",
      )
      .eq("org_id", orgId)
      .eq("target_type", targetType)
      .in("target_id", ids.slice(i, i + CHUNK))
      .order("created_at", { ascending: true });
    if (error) console.error("[pins] getPinsForTargets:", error.message);
    rows.push(...(((data as unknown) as Row[] | null) ?? []));
  }
  if (rows.length === 0) return map;

  // İğneleyen adları — profiles ayrı çekilir (pins FK'si auth.users'a bakar,
  // PostgREST embed'i profiles'a otomatik çözemez).
  const byIds = [...new Set(rows.map((r) => r.pinned_by).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (byIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", byIds);
    for (const p of (profs as { id: string; full_name: string | null }[] | null) ?? [])
      if (p.full_name) names.set(p.id, p.full_name);
  }

  for (const r of rows) {
    if (!r.sticker) continue;
    const list = map.get(r.target_id) ?? [];
    list.push({
      id: r.id,
      target_id: r.target_id,
      src: r.sticker.src,
      label: r.sticker.label,
      pinned_by: r.pinned_by,
      by_name: r.pinned_by ? (names.get(r.pinned_by) ?? null) : null,
    });
    map.set(r.target_id, list);
  }
  return map;
}
