/**
 * İndirim yardımcıları — manuel girilen `products.discount_pct` (0..90)
 * üzerinden indirimli fiyat türetir.
 *
 * Neden panel-tarafı: Etsy Open API v3 aktif Sale/promosyon ya da kupon
 * kodlarını OKUTMUYOR (migration 0115 başlığı). Bu yüzden satıcı Etsy'de
 * yürüttüğü indirim yüzdesini panele kendi girer; indirimli fiyat YALNIZ
 * panelde gösterilir ve marj/eritme-altı kararlarında kullanılır — Etsy'ye
 * yazılmaz (taban fiyat değişmez). Saf fonksiyonlar: kolay test + tek kaynak.
 */

/** `discount_pct`'i güvenli aralığa (0..90 tam yüzde) sıkıştır. */
export function clampDiscountPct(pct: number | null | undefined): number {
  const n = Math.round(Number(pct ?? 0));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, n);
}

/** İndirim aktif mi (0'dan büyük mü)? */
export function hasDiscount(pct: number | null | undefined): boolean {
  return clampDiscountPct(pct) > 0;
}

/**
 * İndirimli fiyat (cent). İndirim yoksa taban fiyatı AYNEN döner; taban null
 * ise null. `base * (100 - pct) / 100`, cent'e yuvarlanır.
 */
export function discountedCents(
  baseCents: number | null | undefined,
  pct: number | null | undefined,
): number | null {
  if (baseCents == null) return null;
  const p = clampDiscountPct(pct);
  if (p === 0) return baseCents;
  return Math.round((baseCents * (100 - p)) / 100);
}

/** İndirim tutarı (cent) — taban ile indirimli fiyat farkı (yoksa 0). */
export function discountAmountCents(
  baseCents: number | null | undefined,
  pct: number | null | undefined,
): number {
  if (baseCents == null) return 0;
  const disc = discountedCents(baseCents, pct);
  return disc == null ? 0 : baseCents - disc;
}
