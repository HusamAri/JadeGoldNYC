import {
  fetchLiveSpotUsd,
  SPOT_SANITY_MIN,
  SPOT_SANITY_MAX,
} from "@/lib/pricing/gold-index";

/**
 * Altın ons fiyatı — panelin GÖSTERİM ve MALİYET tarafı için tek giriş.
 *
 * ## 2026-08-22: bu dosya sessizce sahte fiyat dağıtıyordu
 *
 * Önceki sürüm üç kaynak deniyordu ve ÜÇÜ DE ölüydü:
 *   - `api.metals.dev/v1/latest?api_key=demo` → **401** ("The API Key provided
 *     is invalid"); ücretsiz `demo` anahtarı kapatılmış.
 *   - `api.metals.live/v1/spot/gold`          → bağlantı kurulamıyor (uç yok).
 *   - `goldapi.io`                            → `GOLD_API_KEY` şart, env'de yok.
 * Üçü de `null` dönünce fonksiyon `DEFAULT_GOLD_PRICE_PER_OUNCE = 4088`
 * sabitini döndürüyordu — hata YUTULARAK. Canlı spot o gün **$4.604** idi,
 * yani panel her yerde **%12,6 düşük** altın fiyatı gösteriyordu: ana panel
 * kartı, altın ayarları, altın maliyet sayfası, `gold-cost-entry` (GERÇEK
 * satılan-mal maliyeti) ve rakip fiyat araştırması. Hiçbir test/typecheck bunu
 * göremezdi — çalışma zamanı sözleşmesi, ve sahte değer "başarı" gibi dönüyordu.
 *
 * ## Kural
 *
 * Repoda spot çeken TEK yer `fetchLiveSpotUsd()` (lib/pricing/gold-index.ts).
 * Orada elenen kaynaklar tek tek yazılı, üç kapı (tazelik ≤24sa, mutlak aralık,
 * çağıranın adım kapıları) kurulu ve başarısızlıkta **fırlatıyor** — sessizce
 * varsayılana düşmüyor. Burada ikinci bir çekici yaşatmak, o dosyadaki dersin
 * yeniden yazılması demekti; bu yüzden bu modül artık ona delege ediyor.
 *
 * Fiyat 1 saat bellekte tutulur (sunucu ömrü boyunca).
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat

export interface GoldSpotQuote {
  pricePerOunceUsd: number;
  /** Değerin nereden geldiği: kaynak adı, "önbellek" ya da "son çare sabiti". */
  source: string;
  fetchedAt: number;
  /** true ise bu değer CANLI DEĞİL — ekranda uyarı gösterilmeli. */
  stale: boolean;
  /** Canlı çekim neden başarısız oldu (stale=true iken doludur). */
  error: string | null;
}

let cache: { quote: GoldSpotQuote } | null = null;

/**
 * SON ÇARE — canlı çekim de önbellek de yoksa kullanılır ve `stale: true`
 * ile İŞARETLENİR. Sayı olarak yanlış olduğu bilinerek durur: amacı doğru
 * fiyat vermek değil, sayfanın çökmemesidir. Aralık kapısının ortasında
 * durması bilinçli (SPOT_SANITY_MIN/MAX arası), böylece "makul ama işaretli"
 * bir değer döner. Buraya düşüldüğünde konsola hata basılır ve
 * `getGoldSpotQuote().stale` ile yüzeye çıkar — SESSİZ düşüş yok.
 */
const LAST_RESORT_SPOT_USD = 4500;

/**
 * Güncel altın ons fiyatını kaynak/tazelik bilgisiyle döndürür.
 *
 * Fiyatı EKRANDA gösteren ya da ona dayanıp karar ürettiren her yer bunu
 * kullanmalı ve `stale` olduğunda kullanıcıya söylemeli: bayat spotla
 * hesaplanan marj/maliyet, doğru sanılan yanlış sayıdır.
 */
export async function getGoldSpotQuote(): Promise<GoldSpotQuote> {
  if (cache && Date.now() - cache.quote.fetchedAt < CACHE_TTL_MS) {
    return cache.quote;
  }

  try {
    const { spotPerOzt, sources } = await fetchLiveSpotUsd();
    const quote: GoldSpotQuote = {
      pricePerOunceUsd: spotPerOzt,
      source: sources.map((s) => s.name).join("+"),
      fetchedAt: Date.now(),
      stale: false,
      error: null,
    };
    cache = { quote };
    return quote;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    // Sebebi YÜZEYE ÇIKAR: "alınamadı" deyip susmak hem kullanıcıyı hem bizi
    // kör bırakıyordu (bkz. dosya başı vakası).
    console.error("[gold-price] canlı spot alınamadı:", error);

    // Bayat önbellek, uydurma sabitten iyidir — ama yine de `stale`.
    if (cache) {
      return { ...cache.quote, stale: true, source: "önbellek", error };
    }
    return {
      pricePerOunceUsd: LAST_RESORT_SPOT_USD,
      source: "son çare sabiti",
      fetchedAt: Date.now(),
      stale: true,
      error,
    };
  }
}

/**
 * Güncel altın ons fiyatını (USD) döndürür.
 *
 * Geriye dönük uyumlu sade sürüm: yalnız sayıyı ister, tazeliği umursamayan
 * çağıranlar için. Tazeliğe DUYARLI olman gerekiyorsa `getGoldSpotQuote()`
 * kullan — bu sürüm bayat değeri sessizce döndürür.
 */
export async function getGoldPricePerOunce(): Promise<number> {
  return (await getGoldSpotQuote()).pricePerOunceUsd;
}

/** Önbelleği sıfırlar (test / zorunlu yenileme için). */
export function clearGoldPriceCache(): void {
  cache = null;
}

/** Mantık kapısı sınırları — çağıranlar aynı aralığı yeniden tanımlamasın. */
export { SPOT_SANITY_MIN, SPOT_SANITY_MAX };
