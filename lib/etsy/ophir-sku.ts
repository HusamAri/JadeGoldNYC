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
      // Beden — Etsy CANLI veride kesirli yazıyor ("3 1/4", "3 1/2", "3 3/4"),
      // ondalık değil. Kanarya (2026-08-28, listing 4558671043) bunu yakaladı:
      // kesirliler eşleşmeyince sıra-numarası yedeğine düşüp gerçek bedenlerle
      // ÇAKIŞMIŞTI. Her iki biçimi de kabul et, ondalığa normalize et.
      if (!out.beden) {
        const kesir = /^(?:us\s*)?(\d{1,2})\s+(\d)\/(\d)$/i.exec(lower);
        if (kesir) {
          const tam = Number(kesir[1]);
          const pay = Number(kesir[2]);
          const payda = Number(kesir[3]);
          if (payda > 0) {
            const deger = tam + pay / payda;
            // "3.25" / "3.5" — sondaki sıfırlar atılır, SKU kısa kalır.
            out.beden = String(Number(deger.toFixed(2)));
          }
        } else {
          const ondalik = /^(?:us\s*)?(\d{1,2}(?:\.\d{1,2})?)$/i.exec(lower);
          if (ondalik) out.beden = String(Number(ondalik[1]));
        }
      }
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
  // Beden çözülemedi → sıra numarası. "x" öneki AD ALANINI ayırır: yedek yol
  // gerçek bir bedenle asla çakışamaz (kanarya vakası: "3 1/2" yedeğe düşüp
  // sıra 3 üretmiş, gerçek "3" bedeniyle çakışmıştı).
  if (orta) return `OPH-${listingId}-${orta}-x${i + 1}`;
  return `OPH-${listingId}-x${i + 1}`;
}
