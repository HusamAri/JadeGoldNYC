/**
 * Ophir SKU üreteci — SAF hesap katmanı (IO yok, test edilebilir).
 *
 * Şema: `OPH-<listingId>-<KARAT><RENK>-<BEDEN>`
 *   çözülemeyen offering'de → `OPH-<listingId>-<sıra>`
 *
 * listingId'yi BİLEREK içerir: kopya-listing SKU'yu miras alamaz, dolayısıyla
 * sahiplik senkronda el değiştiremez (second-brain 2026-08 vakası: miras
 * alınan SKU yüzünden toplu SEO push'unda yanlış renk başlığı yazılmıştı).
 */

export interface SkuKaynak {
  property_values?: { values?: string[] | null }[] | null;
}

const RENK: Record<string, string> = {
  yellow: "Y",
  white: "W",
  rose: "R",
  pink: "R",
};

/** Offering property'lerinden kimlik parçaları. İlk eşleşme kazanır. */
export function skuParcalari(p: SkuKaynak): {
  karat?: string;
  renk?: string;
  beden?: string;
} {
  const out: { karat?: string; renk?: string; beden?: string } = {};
  for (const pv of p.property_values ?? []) {
    for (const raw of pv?.values ?? []) {
      const v = (raw ?? "").trim();
      if (!v) continue;
      const lower = v.toLowerCase();
      const k = /\b(10|14|18)\s*k\b/i.exec(v);
      if (k && !out.karat) out.karat = k[1];
      if (!out.renk) {
        for (const [ad, kod] of Object.entries(RENK)) {
          if (lower.includes(ad)) {
            out.renk = kod;
            break;
          }
        }
      }
      // Beden: yalnız sayı ("7", "7.5") ya da "US 7" biçimi.
      const b = /^(?:us\s*)?(\d{1,2}(?:\.\d)?)$/i.exec(lower);
      if (b && !out.beden) out.beden = b[1];
    }
  }
  return out;
}

/** Etsy SKU üst sınırı. Aşan SKU yazılmaz (çağıran doğrular). */
export const SKU_MAX = 32;

export function skuUret(listingId: number, p: SkuKaynak, i: number): string {
  const { karat, renk, beden } = skuParcalari(p);
  const orta = [karat, renk].filter(Boolean).join("");
  if (orta && beden) return `OPH-${listingId}-${orta}-${beden}`;
  if (orta) return `OPH-${listingId}-${orta}-${i + 1}`;
  return `OPH-${listingId}-${i + 1}`;
}
