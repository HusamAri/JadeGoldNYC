import type { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

/**
 * Etsy satıcı taksonomisinden "Rings" düğümünün taxonomy_id'sini çözer.
 *
 * getSellerTaxonomyNodes public'tir (api-key yeterli, OAuth gerekmez) ve tüm
 * ağacı `results` altında İÇ İÇE `children` dizileriyle döndürür. Ağaç oturum
 * boyunca değişmez → ilk çözümden sonra modül-içi cache'lenir (tek fetch).
 *
 * Tercih sırası: Jewelry > Rings (> "Wedding Bands" alt düğümü VARSA o).
 * Mağaza yüzük/alyans sattığından "Rings" güvenli varsayılan; "Wedding Bands"
 * ağaçta bu adla yoksa (Etsy kimi sürümde farklı adlandırır) Rings'e düşülür.
 */

interface TaxonomyNode {
  id: number;
  name?: string;
  level?: number;
  parent_id?: number | null;
  children?: TaxonomyNode[];
}

let cachedRingTaxonomyId: number | null = null;

/** Bir düğüm listesinde adı TAM eşleşen (büyük/küçük harf duyarsız) ilk düğüm. */
function findByName(nodes: TaxonomyNode[], name: string): TaxonomyNode | null {
  const target = name.toLowerCase();
  for (const n of nodes) {
    if ((n.name ?? "").trim().toLowerCase() === target) return n;
  }
  return null;
}

export async function resolveRingTaxonomyId(
  client: EtsyClient,
): Promise<number> {
  if (cachedRingTaxonomyId != null) return cachedRingTaxonomyId;

  const res = await client.get<{ results?: TaxonomyNode[] }>(
    etsyPaths.sellerTaxonomyNodes(),
  );
  const roots = res.results ?? [];

  // Jewelry (level 1) > Rings (level 2). Ağaç şekli değişirse kökte de ararız.
  const jewelry = findByName(roots, "Jewelry");
  let rings = findByName(jewelry?.children ?? [], "Rings");
  if (!rings) rings = findByName(roots, "Rings");
  if (!rings) {
    throw new Error("Etsy taksonomisinde 'Rings' düğümü bulunamadı.");
  }

  // "Wedding Bands" alt düğümü varsa daha spesifik olan onu tercih et.
  const wedding = findByName(rings.children ?? [], "Wedding Bands");
  cachedRingTaxonomyId = wedding?.id ?? rings.id;
  return cachedRingTaxonomyId;
}
