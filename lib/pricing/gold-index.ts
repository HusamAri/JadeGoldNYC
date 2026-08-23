/**
 * Altın-endeksli fiyat motoru — saf hesap katmanı (IO yok).
 *
 * İki ayrı strateji:
 *  - EON: v4 grid formülünün birebir portu (scripts/eon_pricing_engine.py ile
 *    aynı; 5148 hücrede sıfır sapmayla doğrulanmış formül). Varyantın işçilik
 *    kademesi (standart 30 / milgrain-hammered 40) HARDCODE edilmez: mevcut
 *    DB fiyatı ESKİ tabanla hangi kademede birebir çıkıyorsa o kademe seçilir
 *    (kendi kendini doğrulayan eşleme — uymayan varyant atlanır ve raporlanır).
 *  - Jade: katalog formülle üretilmediği için fiyat YENİDEN kurulmaz; yalnız
 *    artan/azalan HAM metal bedeli (gram × saflık × Δspot × 1+fire) mevcut
 *    fiyata eklenir. Marj yapısı değişmez.
 *
 * Para daima tam sayı cent (lib/money.ts kuralı).
 */

export const TROY_OZ_GRAMS = 31.1034768;

/** v4 grid (spot4090) ASM sabitleri — kaynak: docs/eon/pricing/…-v4.xlsx.
 *
 *  İşçilik kademeleri — Tamsan fatura kalibrasyonu (docs/eon/tamsan-cost-
 *  calibration.md). İKİ kademe de gerçek faturayla ölçüldü:
 *    - süslü / el-işi (Diamond Cut): **$74** (2026-08-17, Greek Key vakası)
 *    - düz (Dome & Flat):           **$38** (2026-08-18, 11 satır / 5 fatura;
 *      6 düz satırın fire'lı zımni işçilik medyanı $38)
 *
 *  `laborStandardUsd: 30` ve `laborMilgrainUsd: 40` ESKİ tabanlardır ve yalnız
 *  MEVCUT fiyatı TANIMAK için durur. Reprice koşusu eski tabanla üretilmiş bir
 *  satırı yakaladığında yeni fiyatı hedef kademeyle üretir (30 → 38, 40 → 74;
 *  bkz. gold-reprice-run.ts `hedefKademe`). Yeni fiyat üretiminde 30 ve 40
 *  KULLANILMAZ.
 *
 *  Not: işçilik altın fiyatının yüzdesi DEĞİLDİR — faturalarda işçilik/melt
 *  oranı %21-88 arasında savruluyor. Düzde parça başı sabit (işçilik-gram
 *  korelasyonu r=0,23), süslüde boyutla artıyor (r=0,97) ama $74 sabiti
 *  ölçülen aralıkta dengede kalıyor. Metal bileşeni ise spota birebir bağlı
 *  ve tedarikçi de faturasına kendi altın tabanını basıyor. */
export const V4 = {
  fire: 0.07,
  laborStandardUsd: 30,
  laborStandardTargetUsd: 38,
  laborMilgrainUsd: 40,
  laborHandfinishedTargetUsd: 74,
  packagingUsd: 8,
  shippingUsd: 22,
  multNarrow: 1.55, // 2-7mm
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
): number {
  const purity = V4.purity[karat];
  if (!purity || !(grams > 0) || !(spotPerOzt > 0)) return 0;
  const raw =
    grams * (spotPerOzt / TROY_OZ_GRAMS) * purity * (1 + V4.fire) +
    laborUsd +
    V4.packagingUsd +
    V4.shippingUsd;
  const motor = roundHalfUp(raw * (widthMm <= 7 ? V4.multNarrow : V4.multWide));
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

/** Canlı spotu çeker. Ücretsiz/anahtarsız çalışan tek kaynak var
 *  (gold-api.com — elenenler gövdede listeli), bu yüzden güvenlik çapraz
 *  doğrulama DEĞİL üç kapıdır: tazelik (≤24sa), mutlak aralık ve çağıran
 *  taraftaki adım kapıları. Kapıdan geçemeyen veriyle fiyat ASLA oynatılmaz. */
export async function fetchLiveSpotUsd(): Promise<SpotQuote> {
  const sources: { name: string; value: number }[] = [];

  // 2026-08-05 canlı sondaj: ücretsiz ve anahtarsız çalışan TEK kaynak
  // gold-api.com. Denenip ELENENLER — bir daha aynı yola girilmesin:
  //   stooq.com/q/l/?s=xauusd  → 404 (sembol yok; ilk sürümde bu vardı ve
  //                              hiç çalışmadı, sessizce tek kaynağa düşüyordu)
  //   data-asg.goldprice.org   → 403 (bot koruması)
  //   frankfurter.app / .dev   → XAU desteklenmiyor (301 / 404)
  //   exchangerate.host        → API anahtarı şart
  //   open.er-api.com          → unsupported-code
  //
  // Tek kaynak olduğu için güvenlik ÇAPRAZ DOĞRULAMAYA değil üç kapıya
  // dayanır: (1) tazelik, (2) mutlak aralık, (3) çağıran taraftaki adım
  // kapıları (deadband %1 / max-step %10 — bozuk bir kotasyon tabandan
  // %10'dan fazla saparsa zaten uygulanmaz, insan onayına düşer).
  let staleness: string | null = null;
  try {
    // ZAMAN AŞIMI ŞART: bu çekici artık yalnız reprice koşusunda değil, panel
    // GÖSTERİM yolunda da çalışıyor (lib/gold-price.ts buraya delege ediyor,
    // uyarı merkezi de onu çağırıyor). Zaman aşımsız bir fetch, kaynak asılı
    // kaldığında tüm panel render'ını bekletir. 5sn: kotasyon ucu normalde
    // ~200ms yanıtlıyor, bu tavan yalnız arıza hâlinde devreye girer.
    const r = await fetch("https://api.gold-api.com/price/XAU", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const j = (await r.json()) as { price?: number; updatedAt?: string };
      if (typeof j.price === "number" && j.price > 0) {
        // TAZELİK: donmuş bir kotasyonla fiyat oynatmak, piyasa hareket
        // ederken katalogu yanlış tabana kilitler.
        const ts = j.updatedAt ? Date.parse(j.updatedAt) : NaN;
        const yasSaat = Number.isFinite(ts)
          ? (Date.now() - ts) / 3_600_000
          : null;
        if (yasSaat != null && yasSaat > 24) {
          staleness = `kotasyon ${Math.round(yasSaat)} saat bayat`;
        } else {
          sources.push({ name: "gold-api.com", value: j.price });
        }
      }
    } else {
      staleness = `HTTP ${r.status}`;
    }
  } catch (e) {
    // Next'in KONTROL AKIŞI hatası yutulmaz. Statik üretim sırasında
    // `no-store` bir fetch görüldüğünde Next `DynamicServerError` fırlatır;
    // bu bir ARIZA değil, "bu rotayı dinamik yap" sinyalidir. Yutulursa iki
    // zarar birden olur: (1) rota statik üretilirse son-çare sabiti sayfaya
    // GÖMÜLÜR — tam da bu dosyanın düzelttiği sessiz-yanlış-değer hatası
    // geri gelir, (2) build logu gerçek olmayan bir "spot alınamadı"
    // uyarısıyla kirlenir. Olduğu gibi yukarı bırakıyoruz.
    if ((e as { digest?: string } | null)?.digest === "DYNAMIC_SERVER_USAGE") {
      throw e;
    }
    staleness = e instanceof Error ? e.message : String(e);
  }

  if (sources.length === 0) {
    throw new Error(
      `Spot alınamadı (gold-api.com${staleness ? `: ${staleness}` : ""}) — fiyat oynatılmadı.`,
    );
  }
  // İleride ikinci kaynak eklenirse çapraz doğrulama burada devreye girer.
  if (sources.length > 1) {
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
