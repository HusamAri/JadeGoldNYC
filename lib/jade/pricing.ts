/**
 * Jade Gold NYC — fiyat motoru.
 *
 * NEDEN AYRI BİR MOTOR: `lib/pricing-engine/*` EON'un YÜZÜK grid'idir
 * (genişlik × beden × profil). Jade SKU'ları o eksenleri taşımadığı için
 * `buildPricingDiff` her Jade satırını `unknown` döndürür — bu bir arıza değil,
 * koruma. Jade'in kendi fiyat formülü hiç olmamıştı; katalog fiyatları elle
 * girilmişti. Bu dosya o boşluğu doldurur.
 *
 * EON SABİTLERİ BİLEREK İTHAL EDİLMEZ. `docs/second-brain.md` (2026-08):
 * Tamsan faturalarından çıkan parça-başı işçilik ($54 düz / $74 süslü) EON'un
 * üreticisine kilitlidir (`organizations.gold_settings.labor_model`). O modeli
 * 0,37 gramlık bir charm'a uygulamak — işçilik tek başına satış fiyatını aşar —
 * kayıtlı hatanın birebir tekrarı olurdu. Buradaki gram maliyeti kullanıcının
 * doğruladığı HER ŞEY DAHİL tedarikçi faturasıdır; ayrı işçilik kalemi YOKTUR.
 *
 * Girdiler kullanıcı tarafından doğrulandı (2026-08-14). Dış dünya değiştiğinde
 * (altın fiyatı, kargo tarifesi, Etsy komisyonu, indirim oranı) bu sabitler
 * elden geçirilmelidir — tarih taşımalarının sebebi budur.
 */

/** Her şey dahil tedarikçi maliyeti: ham altın + işçilik + taş/boncuk. */
export const JADE_COST_PER_GRAM_CENTS = 106_00;

/** Ücretsiz kargo — bedeli satıcı karşılıyor, yani her satışta gider. */
export const JADE_SHIPPING_CENTS = 5_00;

/** Kutu/ambalaj. */
export const JADE_PACKAGING_CENTS = 1_50;

/**
 * Etsy'de KALICI mağaza indirimi → tahsilat her zaman liste × (1 − oran).
 * Etsy API aktif Sale'i vermiyor (bkz. migration 0115), bu yüzden oran elle
 * taşınır. İndirim kapanırsa burası 0 olmalı, yoksa fiyatlar şişer.
 *
 * 2026-08-20: %15 → **%25**. Mağaza geneli indirim 25'e çekildi (Etsy'de
 * shop-wide asgarî 25 giriliyor) ve canlı siparişlerde SALE25 kuponu görüldü.
 * Sabit 0,15'te kalsaydı motor "hedef %20" derken fiilen %12,3 marj üretirdi —
 * 89 varyant da breakeven'in ALTINDA kalırdı. Girdi değişince sabit değişir;
 * ayrıntı: `docs/jade/fiyatlandirma.md` §9.
 *
 * 2026-08-27: KISA SÜRE 1/3 YAZILDI, **GERİ ALINDI — değer %25'tir.**
 * O gün "indirim 1/3'e çıkmış" diye ölçüldü ve sabit değiştirildi; ölçüm
 * YANLIŞTI. Payda hatası: oran `discount/item_total` ile hesaplanmıştı, oysa
 * `sales.item_total_cents` indirim SONRASI nettir — doğru payda
 * `discount/(item_total+discount)`. 138/138 siparişte
 * `sum(unit_price×qty) = item_total + discount` doğrulandı.
 * Hatalı payda her oranı `x/(1−x)` olarak şişiriyordu: 0,15→0,176 ·
 * 0,20→0,25 · **0,25→0,3333**. Yani "1/3" gördüğüm şey %25'in ta kendisiydi;
 * indirim 20 Ağustos'tan beri hiç değişmedi ve §9 kararı zaten doğruydu.
 * Ayrıntı ve etki: `docs/jade/fiyatlandirma.md` §11.
 */
export const JADE_DISCOUNT_RATE = 0.25;

/** Etsy oransal kesinti: %6,5 işlem + %3 ödeme işleme. */
export const JADE_ETSY_RATE = 0.095;

/** Etsy sabit kesinti (ödeme işleme sabiti). */
export const JADE_ETSY_FIXED_CENTS = 25;

/**
 * Bölüm geneli hedef net marj.
 *
 * 2026-08-27: %20 → **%25** (kullanıcı kararı, kâr maksimizasyonu turu).
 * Gerekçe indirim telafisinden AYRI: satış verisi derin indirimin talebi
 * artırmadığını gösteriyor — %17,6 döneminde 9 günde ~35 sipariş, %33,3
 * döneminde 7 günde ~14. Yani indirimi derinleştirmek hacim getirmiyor,
 * yalnız marjı yiyor. UYARI: fiyat-talep elastikiyeti ÖLÇÜLMEDİ (A/B verisi
 * yok); bu hedef bir karardır, ölçüm sonucu değildir. Hacim düşerse önce
 * burası gözden geçirilir.
 */
export const JADE_TARGET_MARGIN = 0.25;

/** Tahsilat oranı: indirimden sonra kasaya giren pay. */
const NET_RATE = 1 - JADE_DISCOUNT_RATE;

/** Etsy kesintisinden sonra elde kalan oransal pay. */
const AFTER_FEE_RATE = 1 - JADE_ETSY_RATE;

/** Ürünün bize maliyeti (metal + kargo + ambalaj). */
export function jadeCostCents(grams: number): number {
  if (!(grams > 0)) throw new Error("jadeCostCents: gram > 0 olmalı");
  return Math.round(grams * JADE_COST_PER_GRAM_CENTS) + JADE_SHIPPING_CENTS + JADE_PACKAGING_CENTS;
}

/**
 * Hedef marja ulaşan LİSTE fiyatı (indirim öncesi, Etsy'ye yazılan sayı).
 *
 * liste × 0,85 × (1 − 0,095) − 0,25 − maliyet = marj × liste × 0,85
 * → liste = (maliyet + sabit) / (0,85 × (0,905 − marj))
 *
 * Tam dolara yuvarlanır: Etsy'de küsuratlı fiyat (54,37) amatör durur ve
 * mağazanın mevcut fiyatları da tam dolar.
 */
export function jadeTargetPriceCents(grams: number, margin = JADE_TARGET_MARGIN): number {
  const denom = NET_RATE * (AFTER_FEE_RATE - margin);
  if (denom <= 0) throw new Error("jadeTargetPriceCents: marj Etsy kesintisini aşamaz");
  const cents = (jadeCostCents(grams) + JADE_ETSY_FIXED_CENTS) / denom;
  return Math.ceil(cents / 100) * 100;
}

/** Marjın sıfırlandığı fiyat — bunun altı her satışta zarardır. */
export function jadeBreakevenCents(grams: number): number {
  return jadeTargetPriceCents(grams, 0);
}

/** Verilen liste fiyatının gerçek net marjı (indirim + Etsy kesintisi sonrası). */
export function jadeMarginAt(priceCents: number, grams: number): number {
  const gross = priceCents * NET_RATE;
  if (gross <= 0) return 0;
  const net = gross - (gross * JADE_ETSY_RATE + JADE_ETSY_FIXED_CENTS) - jadeCostCents(grams);
  return net / gross;
}

export interface JadePriceRow {
  sku: string;
  grams: number;
  oldCents: number;
  newCents: number;
  costCents: number;
  breakevenCents: number;
  oldMargin: number;
  newMargin: number;
  /** Fiyat neden değişti / neden değişmedi. */
  reason: "zarar-duzeltme" | "marj-yukseltme" | "degisiklik-yok" | "hero-kademeli";
}

/**
 * Tek varyantın yeni fiyatı.
 *
 * YALNIZ YUKARI: hesaplanan hedef mevcut fiyatın altındaysa fiyat KORUNUR.
 * Sebep ticari, matematiksel değil — %70 marjla satan Italian Horn'u formüle
 * çekmek ciroyu bedelsiz yakar. Formül zarar kapatmak için var, fiyat
 * "normalleştirmek" için değil.
 *
 * `capCents` hero için kademeli tavan: fiyat şokunu bölmek üzere hedefin
 * altında bir ara basamağa sabitler.
 */
export function jadePriceRow(
  sku: string,
  grams: number,
  oldCents: number,
  opts: { margin?: number; capCents?: number } = {},
): JadePriceRow {
  const margin = opts.margin ?? JADE_TARGET_MARGIN;
  const target = jadeTargetPriceCents(grams, margin);
  const breakeven = jadeBreakevenCents(grams);
  const capped = opts.capCents != null ? Math.min(target, opts.capCents) : target;
  const newCents = Math.max(oldCents, capped);

  let reason: JadePriceRow["reason"];
  if (newCents === oldCents) reason = "degisiklik-yok";
  else if (opts.capCents != null) reason = "hero-kademeli";
  else if (oldCents < breakeven) reason = "zarar-duzeltme";
  else reason = "marj-yukseltme";

  return {
    sku,
    grams,
    oldCents,
    newCents,
    costCents: jadeCostCents(grams),
    breakevenCents: breakeven,
    oldMargin: jadeMarginAt(oldCents, grams),
    newMargin: jadeMarginAt(newCents, grams),
    reason,
  };
}
