/**
 * Altın fiyatı çekme servisi.
 *
 * Birincil kaynak: metals.dev (ücretsiz katman, anahtar gerekmez).
 * Yedek: goldapi.io (GOLD_API_KEY env var gerektirir).
 * Son çare: önbellek veya varsayılan değer.
 *
 * Fiyat 1 saat boyunca bellekte tutulur (sunucu ömrü boyunca).
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat

interface CachedPrice {
  pricePerOunceUsd: number;
  fetchedAt: number;
}

let cache: CachedPrice | null = null;

const DEFAULT_GOLD_PRICE_PER_OUNCE = 4088;

async function fetchFromMetalsDev(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz",
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      metals?: { gold?: number };
    };
    const price = data?.metals?.gold;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function fetchFromGoldApi(): Promise<number | null> {
  const apiKey = process.env.GOLD_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { price?: number };
    return typeof data?.price === "number" && data.price > 0
      ? data.price
      : null;
  } catch {
    return null;
  }
}

async function fetchFromMetalsLive(): Promise<number | null> {
  try {
    const res = await fetch("https://api.metals.live/v1/spot/gold", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { price?: number }[] | { price?: number };
    const entry = Array.isArray(data) ? data[0] : data;
    const price = entry?.price;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Güncel altın ons fiyatını (USD) döndürür.
 * Önbellekte varsa ve 1 saatten tazeyse önbellekten döner.
 * Hiçbir API başarısız olursa varsayılan değeri kullanır.
 */
export async function getGoldPricePerOunce(): Promise<number> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.pricePerOunceUsd;
  }

  const price =
    (await fetchFromMetalsDev()) ??
    (await fetchFromGoldApi()) ??
    (await fetchFromMetalsLive());

  if (price) {
    cache = { pricePerOunceUsd: price, fetchedAt: Date.now() };
    return price;
  }

  return cache?.pricePerOunceUsd ?? DEFAULT_GOLD_PRICE_PER_OUNCE;
}

/** Önbelleği sıfırlar (test / zorunlu yenileme için). */
export function clearGoldPriceCache(): void {
  cache = null;
}
