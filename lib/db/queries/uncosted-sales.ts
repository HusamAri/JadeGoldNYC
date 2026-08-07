import { createClient } from "@/lib/supabase/server";

/**
 * MALİYETSİZ SATIŞ tespiti — "kâr olduğundan yüksek görünüyor" sinyali.
 *
 * Altın maliyet motoru (lib/gold-cost-entry.ts) bir satış kalemine maliyet
 * yazabilmek için AYAR + GRAM ister. Gram yoksa kalemi bilinçli olarak ATLAR
 * (uydurmaz). Sonuç: o satışın maliyeti hiç düşmez ve kâr/marj raporları o
 * cirodan %100 kâr ediyormuş gibi görünür.
 *
 * Bu boşluk hiçbir yerde flaglenmiyordu — 2026-08'de kullanıcı 4 Ağustos'taki
 * bir siparişte tesadüfen fark etti (satılan varyant `EH2-50`, gramı boş).
 * Ders (docs/second-brain.md): "Aksiyon sinyali ana sayfada flaglenir."
 *
 * İki ayrı arıza ayrı ayrı sayılır, çünkü tedavileri farklıdır:
 *  - `gramsiz`  → varyant katalogda VAR ama gramı yok → gram gir, maliyeti
 *    yeniden ürettir (rebuildGoldCostsBulk).
 *  - `eslesmeyen` → satılan SKU katalogda YOK (silinmiş/yeniden adlandırılmış)
 *    → gram girmek çözmez; SKU kimliğini düzeltmek gerekir.
 */

export interface UncostedSalesSummary {
  /** Maliyet kaydı hiç olmayan satış kalemi sayısı (pencere içinde). */
  items: number;
  /** O kalemlerin toplam cirosu (cent). */
  revenueCents: number;
  /** Varyant var ama gramı yok. */
  gramsiz: number;
  /** Satılan SKU katalogda bulunamadı. */
  eslesmeyen: number;
  /** En pahalı birkaç örnek — kullanıcı nereden başlayacağını görsün. */
  samples: { sku: string; title: string; revenueCents: number }[];
}

const BOS: UncostedSalesSummary = {
  items: 0,
  revenueCents: 0,
  gramsiz: 0,
  eslesmeyen: 0,
  samples: [],
};

interface Row {
  sku: string | null;
  title: string | null;
  line_total_cents: number | null;
  variant_id: string | null;
  variant_weight: string | number | null;
}

/**
 * @param windowDays Geriye dönük pencere (varsayılan 90 gün).
 */
export async function getUncostedSales(
  orgId: string,
  windowDays = 90,
): Promise<UncostedSalesSummary> {
  const supabase = await createClient();
  const since = new Date(
    Date.now() - windowDays * 86_400_000,
  ).toISOString();

  // Tek RPC yerine dar sorgu: sale_items + sales(status) + costs varlığı.
  // `costs.sale_id` boş olan satışların kalemleri maliyetsizdir.
  const { data, error } = await supabase.rpc("uncosted_sale_items", {
    p_org: orgId,
    p_since: since,
  });
  if (error) {
    // Migration henüz uygulanmadıysa sessiz geç — uyarı merkezi düşmesin.
    const msg = error.message ?? "";
    if (!/could not find|does not exist|schema cache/i.test(msg)) {
      console.error("[uncosted-sales]", msg);
    }
    return BOS;
  }

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return BOS;

  let revenueCents = 0;
  let gramsiz = 0;
  let eslesmeyen = 0;
  for (const r of rows) {
    revenueCents += r.line_total_cents ?? 0;
    if (r.variant_id == null) eslesmeyen += 1;
    else gramsiz += 1;
  }

  const samples = [...rows]
    .sort((a, b) => (b.line_total_cents ?? 0) - (a.line_total_cents ?? 0))
    .slice(0, 3)
    .map((r) => ({
      sku: (r.sku ?? "").trim() || "—",
      title: (r.title ?? "").trim(),
      revenueCents: r.line_total_cents ?? 0,
    }));

  return { items: rows.length, revenueCents, gramsiz, eslesmeyen, samples };
}
