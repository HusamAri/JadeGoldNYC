/**
 * TAŞ (PIRLANTA) MALİYETİ — saf çekirdek.
 *
 * ## Neden ayrı bir modül
 *
 * `lib/pricing-engine/eon-cost.ts` SOLİD ALTIN alyans için kuruldu:
 *   altın gramı × saflık × spot × fire + işçilik + paketleme + kargo
 * Taş diye bir girdisi yok ve olmamalı da — o motorun sözleşmesi (bit-uyumlu
 * fiyat üretmek, taban kaydırmak) taşla kirletilmemeli. Taş maliyeti ONUN
 * ÜSTÜNE eklenen ayrı bir kalem olarak durur.
 *
 * ## Neden formül değil TABLO
 *
 * Pırlanta fiyatı karatla DOĞRUSAL ARTMAZ. 2ct, 1ct'nin iki katı değil
 * ~üç-dört katıdır ve 1,00 / 1,50 / 2,00 ct eşiklerinde sıçrar; ayrıca aynı
 * karat renk/berraklığa göre iki katı olabilir. Bir çarpan uydurmak, altı ay
 * sonra kimsenin fark etmeyeceği sistematik bir hata üretir. Bu yüzden maliyet
 * `diamond_price_book` satırlarından OKUNUR (0148).
 *
 * ## Bu dosya IO yapmaz
 *
 * Fiyat kitabı satırları çağıran tarafından verilir; buradaki her fonksiyon
 * saftır ve bağımsız koşturulabilir (motorun "saf çekirdeği harness'la kanıtla"
 * deseni).
 */

export type StoneOrigin = "lab" | "natural";

/** `diamond_price_book` satırının bu modülün ihtiyaç duyduğu alanları. */
export interface DiamondPriceBookRow {
  origin: StoneOrigin;
  shape: string;
  caratFrom: number;
  caratTo: number;
  color: string;
  clarity: string;
  costCents: number;
}

export interface StoneSpec {
  origin: StoneOrigin;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
}

/** Karşılaştırmalar büyük/küçük harf ve boşluğa takılmasın. */
function norm(s: string): string {
  return s.trim().toLowerCase();
}

export type StoneCostResolution =
  | { ok: true; costCents: number; row: DiamondPriceBookRow }
  | { ok: false; reason: string };

/**
 * Taş maliyetini fiyat kitabından çözer.
 *
 * Eşleşme YOKSA tahmin ÜRETMEZ — `ok: false` döner. Bu bilinçli: eksik taş
 * maliyetinin yerine "yaklaşık" bir sayı koymak, tam da sessizce zarara satan
 * satırı üretir. Çağıran taraf bunu yüzeye çıkarmak zorundadır.
 *
 * Karat bandı ARALIK olarak eşleşir (`caratFrom <= carat <= caratTo`). Birden
 * çok band eşleşirse en DAR olanı kazanır: 1,00-1,50 ile 1,00-3,00 üst üste
 * binerse, daha spesifik olan satır kasıtlı girilmiş demektir.
 */
export function resolveStoneCostCents(
  book: readonly DiamondPriceBookRow[],
  spec: StoneSpec,
): StoneCostResolution {
  if (!(spec.carat > 0)) {
    return { ok: false, reason: "karat 0 ya da geçersiz" };
  }

  const adaylar = book.filter(
    (r) =>
      r.origin === spec.origin &&
      norm(r.shape) === norm(spec.shape) &&
      norm(r.color) === norm(spec.color) &&
      norm(r.clarity) === norm(spec.clarity) &&
      spec.carat >= r.caratFrom &&
      spec.carat <= r.caratTo,
  );

  if (adaylar.length === 0) {
    return {
      ok: false,
      reason:
        `fiyat kitabında satır yok: ${spec.origin} ${spec.shape} ` +
        `${spec.carat}ct ${spec.color}/${spec.clarity}`,
    };
  }

  // En dar band kazanır; eşitlikte maliyeti YÜKSEK olan (kötümser varsayım —
  // eksik fiyatlamak, fazla fiyatlamaktan pahalıdır).
  const secili = adaylar.reduce((a, b) => {
    const genisA = a.caratTo - a.caratFrom;
    const genisB = b.caratTo - b.caratFrom;
    if (genisA !== genisB) return genisA < genisB ? a : b;
    return a.costCents >= b.costCents ? a : b;
  });

  return { ok: true, costCents: secili.costCents, row: secili };
}

export interface StoneSideCostInput {
  /** Taş başına maliyet (fiyat kitabından çözülmüş ya da faturadan girilmiş). */
  stoneCostCents: number;
  /** Kaç taş. Tek taş (solitaire) = 1. */
  stoneCount: number;
  /** Taş BAŞINA takma ücreti. Kendi atölyemizde takarsak 0 → marja döner. */
  settingFeeCents: number;
  /** Döküm — parça başına, taş sayısından bağımsız. */
  castingFeeCents: number;
}

/**
 * Altının ÜSTÜNE binen taş tarafı maliyeti.
 *
 * Taş ve takma taş SAYISIYLA çarpılır, döküm çarpılmaz (parça başına). Bu ayrım
 * tek taşta görünmez (sayı 1) ama mix modele geçildiği an fark eder — o yüzden
 * baştan doğru kuruldu.
 */
export function stoneSideCostCents(i: StoneSideCostInput): number {
  const adet = Math.max(0, Math.trunc(i.stoneCount));
  return (
    Math.max(0, i.stoneCostCents) * adet +
    Math.max(0, i.settingFeeCents) * adet +
    Math.max(0, i.castingFeeCents)
  );
}

export interface CostFloorInput {
  /** Altın tarafı maliyeti (mevcut motor/COGS hesabından). */
  goldCostCents: number;
  /** Taş tarafı — `stoneSideCostCents` çıktısı. */
  stoneSideCostCents: number;
  /** Etsy komisyon+işlem oranı (ör. 0.128 = %12,8; ledger'dan ölçüldü). */
  feeRate: number;
  /** Sabit Etsy kalemleri (liste ücreti vb.), cent. */
  fixedFeeCents: number;
  /**
   * Uygulanan indirim oranı (ör. 0.25). Alıcı indirimli fiyatı öder, ücretler
   * de onun üstünden alınır — taban bu yüzden indirimle birlikte hesaplanır.
   * Pırlantalıların indirim DIŞINDA tutulması öneriliyor; o durumda 0 geçilir.
   */
  discountRate?: number;
}

/**
 * Zarara satmamak için gereken EN DÜŞÜK liste fiyatı.
 *
 * Türetme: alıcı `liste × (1 − indirim)` öder; bundan Etsy `feeRate` payını ve
 * sabit kalemleri alır; kalan, maliyeti karşılamalı.
 *
 *   liste × (1 − indirim) × (1 − feeRate) − sabit ≥ maliyet
 *
 * Sonuç YUKARI yuvarlanır: aşağı yuvarlamak tabanın altına düşürür ve
 * "breakeven'deyiz" derken zarar ettirir.
 */
export function costFloorCents(i: CostFloorInput): number {
  const indirim = Math.min(0.95, Math.max(0, i.discountRate ?? 0));
  const net = (1 - indirim) * (1 - Math.min(0.95, Math.max(0, i.feeRate)));
  if (!(net > 0)) return Number.POSITIVE_INFINITY;
  const maliyet =
    Math.max(0, i.goldCostCents) + Math.max(0, i.stoneSideCostCents);
  return Math.ceil((maliyet + Math.max(0, i.fixedFeeCents)) / net);
}

/**
 * Bir varyantın fiyatı taban altında mı?
 *
 * `null` = KARAR VERİLEMEDİ (taş künyesi eksik). Bu, `false` ile aynı şey
 * DEĞİLDİR ve öyle davranılmamalıdır: eksik veriyi "sorun yok" saymak, bu
 * repoda daha önce yaşanmış sessiz hata desenidir.
 */
export function isBelowCostFloor(
  priceCents: number,
  floor: number,
  stoneCostMissing: boolean,
): boolean | null {
  if (stoneCostMissing) return null;
  if (!Number.isFinite(floor)) return null;
  return priceCents < floor;
}
