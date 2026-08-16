/**
 * Altın-endeksli fiyat motoru — saf hesap katmanı (IO yok).
 *
 * İki ayrı strateji:
 *  - EON: v4 grid formülünün birebir portu (scripts/eon_pricing_engine.py ile
 *    aynı; 5148 hücrede sıfır sapmayla doğrulanmış formül). Varyantın işçilik
 *    kademesi (standart 30 / milgrain-hammered 40) HARDCODE edilmez: mevcut
 *    DB fiyatı ESKİ tabanla hangi kademede birebir çıkıyorsa sınıf doğrulanır.
 *    Frieze and Textured prices use 55 USD labor plus the market-optimized
 *    2.05 narrow and 2.20 wide multipliers.
 *  - Jade: katalog formülle üretilmediği için fiyat YENİDEN kurulmaz; yalnız
 *    artan/azalan HAM metal bedeli (gram × saflık × Δspot × 1+fire) mevcut
 *    fiyata eklenir. Marj yapısı değişmez.
 *
 * Para daima tam sayı cent (lib/money.ts kuralı).
 */

export const TROY_OZ_GRAMS = 31.1034768;

/** v4 grid (spot4090) ASM sabitleri — kaynak: docs/eon/pricing/…-v4.xlsx. */
export const V4 = {
  fire: 0.07,
  laborStandardUsd: 30,
  laborMilgrainUsd: 55,
  laborMilgrainLegacyUsd: 40,
  packagingUsd: 8,
  shippingUsd: 22,
  multNarrow: 1.55, // 2-7mm
  multHandfinishedNarrow: 2.05, // Frieze and Textured 2-7mm
  multHandfinishedNarrowLegacy: 1.75,
  multHandfinishedWide: 2.2, // Frieze and Textured 8-12mm
  multHandfinishedWideLegacy: 2.0,
  multWide: 2.0, // 8-12mm ("mens wide" primi)
  purity: { 10: 0.417, 14: 0.583, 18: 0.75 } as Record<number, number>,
} as const;

/** Spot mantık kapıları: kaynak arızasına ve tek koşuda aşırı adıma karşı. */
export const SPOT_SANITY_MIN = 3000;
export const SPOT_SANITY_MAX = 6000;
/** |Δ| bunun altındaysa koşu no-op (günlük cron gürültü üretmesin). */
export const DEADBAND_PCT = 0.01;
/** |Δ| bunun üstündeyse insan onayı ister (force olmadan uygulanmaz). */
export const MAX_STEP_PCT = 0.1;

/** Excel ROUND — yarım YUKARI (JS Math.round negatifte farklı; burada hep +). */
function roundHalfUp(x: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.floor(x * f + 0.5) / f;
}

/** EON v4 formülü: ham → motor(çarpan) → Etsy liste (5$'a tavanlanır). */
export function eonListCents(
  karat: number,
  widthMm: number,
  grams: number,
  laborUsd: number,
  spotPerOzt: number,
  multipliers: { narrow?: number; wide?: number } = {},
): number {
  const purity = V4.purity[karat];
  if (!purity || !(grams > 0) || !(spotPerOzt > 0)) return 0;
  const raw =
    grams * (spotPerOzt / TROY_OZ_GRAMS) * purity * (1 + V4.fire) +
    laborUsd +
    V4.packagingUsd +
    V4.shippingUsd;
  const multiplier =
    widthMm <= 7
      ? (multipliers.narrow ?? V4.multNarrow)
      : (multipliers.wide ?? V4.multWide);
  const motor = roundHalfUp(raw * multiplier);
  const liste = Math.ceil((motor * 4) / 15) * 5;
  return liste * 100;
}

/** EON SKU'sundan karat + genişlik: `GLD-R-1404-6MM-7.5` → {14, 6}.
 *  Desen tutmuyorsa null — tanımadığımız SKU'ya fiyat YAZILMAZ. */
export function parseEonSku(
  sku: string,
): { karat: number; widthMm: number } | null {
  const m = /-R-(10|14|18)\d{2}-(\d+(?:\.\d+)?)MM-[0-9.]+$/.exec(sku.trim());
  if (!m) return null;
  return { karat: Number(m[1]), widthMm: Number(m[2]) };
}

/** Frieze & Textured kapsamını SKU ve ürün başlığından güvenli biçimde çözer. */
export function isEonFriezeProduct(sku: string, title: string): boolean {
  const normalizedSku = sku.trim().toUpperCase();
  if (/^(?:GLD|WHG|RSG)-R-(?:10|14|18)04(?:-|$)/.test(normalizedSku)) {
    return true;
  }
  if (/^GLD-R-100[67](?:-|$)/.test(normalizedSku)) return true;
  if (/^TTG-R-(?:10|14|18)06(?:-|$)/.test(normalizedSku)) return true;
  if (/^(?:GLD|WHG|RSG)-R-(?:10|14|18)08(?:-|$)/.test(normalizedSku)) {
    return true;
  }
  return /\bmilgrain\b|\bhammered\b|\bbasket\s*weave\b|\bbasketweave\b|\bribbed\b|\bfluted\b|\bgreek\s+key\b|\bma?eander\b|\bfrieze\b|\bdiamond[-\s]?cut\b/i.test(
    title,
  );
}

/** Serbest metinden (SKU + başlık + malzeme listesi) karat saflığı çözer.
 *  Jade kataloğu heterojen — çözülemeyen ürün ATLANIR, uydurulmaz. */
export function parseKaratPurity(text: string): number | null {
  const m = /(?:^|[^0-9])(9|10|14|18|22|24)\s*(?:k|kt|karat|ayar)(?:[^a-z]|$)/i.exec(
    text,
  );
  if (!m) return null;
  const purity: Record<string, number> = {
    "9": 0.375,
    "10": 0.417,
    "14": 0.583,
    "18": 0.75,
    "22": 0.916,
    "24": 0.999,
  };
  return purity[m[1]] ?? null;
}

/** Jade: mevcut fiyata yalnız HAM metal bedeli farkı eklenir; tam dolara
 *  yuvarlanır, hiçbir koşulda 1$'ın altına düşürülmez. */
export function jadeAdjustedCents(
  oldCents: number,
  grams: number,
  purity: number,
  oldSpotPerOzt: number,
  newSpotPerOzt: number,
): number {
  if (!(oldCents > 0) || !(grams > 0) || !(purity > 0)) return oldCents;
  const deltaUsd =
    (grams * purity * (1 + V4.fire) * (newSpotPerOzt - oldSpotPerOzt)) /
    TROY_OZ_GRAMS;
  const newUsd = Math.max(1, roundHalfUp(oldCents / 100 + deltaUsd));
  return Math.round(newUsd) * 100;
}

export type SpotQuote = {
  spotPerOzt: number;
  sources: { name: string; value: number }[];
};

/** Canlı spotu iki bağımsız kaynaktan çeker ve çapraz doğrular (≤%2 sapma).
 *  Tek kaynak arızasında diğeriyle devam eder; ikisi de yoksa/uyuşmuyorsa
 *  throw — fiyat, doğrulanamayan veriyle ASLA oynatılmaz. */
export async function fetchLiveSpotUsd(): Promise<SpotQuote> {
  const sources: { name: string; value: number }[] = [];

  try {
    const r = await fetch("https://api.gold-api.com/price/XAU", {
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json()) as { price?: number };
      if (typeof j.price === "number" && j.price > 0) {
        sources.push({ name: "gold-api.com", value: j.price });
      }
    }
  } catch {
    // kaynak arızası: diğer kaynakla devam
  }

  try {
    const r = await fetch(
      "https://stooq.com/q/l/?s=xauusd&f=sd2t2ohlcv&h&e=csv",
      { cache: "no-store" },
    );
    if (r.ok) {
      const csv = await r.text();
      // Symbol,Date,Time,Open,High,Low,Close,Volume — Close = 7. kolon
      const cells = (csv.trim().split("\n")[1] ?? "").split(",");
      const close = Number(cells[6]);
      if (Number.isFinite(close) && close > 0) {
        sources.push({ name: "stooq.com", value: close });
      }
    }
  } catch {
    // kaynak arızası: diğer kaynakla devam
  }

  if (sources.length === 0) {
    throw new Error("Spot alınamadı: iki kaynak da yanıt vermedi.");
  }
  if (sources.length === 2) {
    const [a, b] = sources;
    const diff = Math.abs(a.value - b.value) / Math.min(a.value, b.value);
    if (diff > 0.02) {
      throw new Error(
        `Spot kaynakları uyuşmuyor (${a.name} ${a.value} / ${b.name} ${b.value}) — fiyat oynatılmadı.`,
      );
    }
  }

  const spot = sources[0].value;
  if (spot < SPOT_SANITY_MIN || spot > SPOT_SANITY_MAX) {
    throw new Error(
      `Spot mantık kapısı dışında ($${spot}/ozt; beklenen ${SPOT_SANITY_MIN}-${SPOT_SANITY_MAX}) — fiyat oynatılmadı.`,
    );
  }
  return { spotPerOzt: spot, sources };
}
