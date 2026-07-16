import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  etsyMoneyToCents,
  type EtsyPropertyValue,
  type EtsyInventory,
} from "@/lib/etsy/types";
import { getGoldPricePerOunce } from "@/lib/gold-price";
import {
  detectKarat,
  extractWeightGrams,
  KARAT_PURITY,
  PURCHASE_PRICE_CENTS_PER_GRAM,
  TROY_OUNCE_GRAMS,
} from "@/lib/gold-cost";
import { getFreshCompetitorSetPrices } from "@/lib/etsy/competitor-watch";

/**
 * Rekabet fiyat araştırması motoru.
 *
 * Her listing için "araştırma kelimesi"nde (products.research_keyword — boşsa
 * birincil tag) Etsy'de organik/relevans sıralı arama yapar, kendi mağazamız
 * dışındaki ilk 10 rakip ürünün fiyat bandını (min/medyan/ort/max) ve bizim
 * fiyatımızın bu banttaki yüzdelik konumunu hesaplayıp `keyword_research`
 * tablosuna anlık görüntü olarak yazar.
 *
 * Listingler 7 gruba (research_group 0..6) bölünmüştür; günlük cron bir grubu
 * işler → her listing 7 günde bir tazelenir.
 */

interface EtsyMoney {
  amount: number;
  divisor: number;
  currency_code: string;
}
interface EtsyActiveListing {
  listing_id: number;
  title: string;
  url?: string;
  shop_id?: number;
  price?: EtsyMoney;
  // includes=Shop ile gelir (uçtan uca değişebilen şekil — iki olasılığı da tut).
  shop_name?: string;
  Shop?: { shop_name?: string };
}
interface EtsyActiveSearch {
  count: number;
  results: EtsyActiveListing[];
}

/** Etsy para nesnesi → tam sayı cent (geçersizse null). */
function moneyToCents(m?: EtsyMoney): number | null {
  if (!m || !m.divisor) return null;
  const cents = Math.round((m.amount / m.divisor) * 100);
  return cents > 0 ? cents : null;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// ── Aynı-varyant karşılaştırması (deep mod) ────────────────────────────────
// Rakip listing'lerin varyantları (getListingInventory) çekilir; bizim
// varyantlarla beden/uzunluk + ayar (karat) token'ıyla eşleştirilir.

interface VariantTokens {
  size: string | null; // normalize uzunluk/beden, ör. "22in" | "7"
  karat: string | null; // "10k" | "14k" | "18k" | "24k"
}

/** property_values dizisinden beden/ayar token'larını çıkarır. */
function tokenize(props?: EtsyPropertyValue[] | null): VariantTokens {
  const text = (props ?? [])
    .flatMap((p) => p.values ?? [])
    .join(" ")
    .toLowerCase();
  let size: string | null = null;
  let karat: string | null = null;
  const len = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in\b|"|”|cm|mm)/);
  if (len) size = len[1].replace(/\.0$/, "") + "in";
  if (!size) {
    // bedensiz sayı (yüzük ölçüsü vb.) — ilk bağımsız sayı
    const n = text.match(/\b(\d{1,2}(?:\.\d)?)\b/);
    if (n) size = n[1];
  }
  const k = text.match(/\b(\d{1,2})\s*k(?:t|arat|\b)/) || text.match(/\b(\d{1,2})\s*ayar/);
  if (k) karat = k[1] + "k";
  return { size, karat };
}

/** İki varyant token'ı aynı varyantı mı gösteriyor? */
function tokensMatch(a: VariantTokens, b: VariantTokens): boolean {
  if (a.karat && b.karat && a.size && b.size)
    return a.karat === b.karat && a.size === b.size;
  if (a.size && b.size) return a.size === b.size;
  if (a.karat && b.karat) return a.karat === b.karat;
  return false;
}

interface CompetitorOffering {
  tokens: VariantTokens;
  price_cents: number;
}

/** Bir rakip listing'in varyant offering'lerini çeker (okunamıyorsa boş).
 *  Public getListing?includes=Inventory kullanılır — sahiplik gerektirmez,
 *  aktif listing'in herkese açık varyant/fiyatlarını döndürür. */
async function fetchCompetitorOfferings(
  client: EtsyClient,
  listingId: number,
  currency: string,
): Promise<CompetitorOffering[]> {
  try {
    const resp = await client.get<{ inventory?: EtsyInventory }>(
      etsyPaths.listing(listingId),
      { includes: "Inventory" },
    );
    const products = resp.inventory?.products ?? [];
    const out: CompetitorOffering[] = [];
    for (const p of products) {
      if (p.is_deleted) continue;
      const off = (p.offerings ?? []).find((o) => !o.is_deleted);
      const cents = etsyMoneyToCents(off?.price);
      if (!cents || (off?.price && off.price.currency_code !== currency)) continue;
      out.push({ tokens: tokenize(p.property_values), price_cents: cents });
    }
    return out;
  } catch {
    return []; // rakip envanteri okunamadı — bu rakip atlanır
  }
}

export interface OurVariant {
  sku: string;
  name: string | null;
  properties: EtsyPropertyValue[] | null;
  price_cents: number | null;
  weight_grams: number | null;
}

export interface VariantComparison {
  sku: string;
  label: string;
  our_price_cents: number | null;
  competitor_count: number;
  min_cents: number | null;
  median_cents: number | null;
  avg_cents: number | null;
  max_cents: number | null;
  our_rank_pct: number | null;
  basis: "variant" | "none";
}

/** Bizim varyantlar × rakip offering'ler → varyant başına fiyat bandı + konum. */
function buildVariantComparison(
  ourVariants: OurVariant[],
  competitorOfferings: CompetitorOffering[],
): VariantComparison[] {
  return ourVariants.map((v) => {
    const vt = tokenize(v.properties);
    const label =
      (v.properties ?? [])
        .flatMap((p) => p.values ?? [])
        .join(" · ") || v.name || v.sku;
    const matched = competitorOfferings.filter((c) => tokensMatch(vt, c.tokens));
    const prices = matched.map((c) => c.price_cents);
    if (!prices.length) {
      return {
        sku: v.sku,
        label,
        our_price_cents: v.price_cents,
        competitor_count: 0,
        min_cents: null,
        median_cents: null,
        avg_cents: null,
        max_cents: null,
        our_rank_pct: null,
        basis: "none",
      };
    }
    const our = v.price_cents;
    return {
      sku: v.sku,
      label,
      our_price_cents: our,
      competitor_count: prices.length,
      min_cents: Math.min(...prices),
      median_cents: median(prices),
      avg_cents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      max_cents: Math.max(...prices),
      our_rank_pct:
        our != null ? prices.filter((p) => p < our).length / prices.length : null,
      basis: "variant",
    };
  });
}

export interface CompetitorRow {
  title: string;
  price_cents: number;
  currency: string;
  shop: number | null;
  /** Mağaza adı (includes=Shop ile; eski kayıtlarda olmayabilir). */
  shop_name: string | null;
  url: string | null;
  position: number;
  /** Etsy listing_id — rakip setine ekleme için (eski kayıtlarda yok; url'den
   *  /listing/(\d+)/ ile çözülür). */
  listing_id?: number | null;
}

export interface ResearchResult {
  product_id: string;
  keyword: string | null;
  status: "ok" | "no-keyword" | "no-results";
  result_count: number;
}

export interface ProductRow {
  id: string;
  title: string;
  price_cents: number | null;
  currency: string | null;
  tags: string[] | null;
  research_keyword: string | null;
  etsy_listing_id: number | null;
  weight_grams: number | null;
}

// ── Pazar konumu (gram-normalize melt çarpanı) ─────────────────────────────
// Metodoloji: docs/pazar-arastirma-metodolojisi.md
// Katı altın perakende bandı, araştırmadan kalibre melt çarpanları:
const MARKET_MULT_LOW = 1.3; // bunun altı: çok ucuz (kalite algısı/marj riski)
const MARKET_MULT_HIGH = 2.3; // bunun üstü: pazara göre pahalı
const MARKET_MULT_MID = 1.8;

// Fiziksel-mantık guard'ı: $/g melt'in yarısının ALTI imkânsızdır (hurda değeri
// bile satış fiyatını aşar) → bu ZARAR değil VERİ HATASI sinyalidir (ağırlık
// fazla girilmiş ya da fiyat/ağırlık farklı varyantlara ait). 20 katının ÜSTÜ
// de absürttür (ağırlık eksik girilmiş). İki uçta da öneri üretmek yanıltır.
const DATA_SUSPECT_LOW_MELT_RATIO = 0.5;
const DATA_SUSPECT_HIGH_MELT_RATIO = 20;

/** Fiyat bandının kaynağı: organik arama mı, sabit rakip seti mi (0091). */
export type BandSource = "organik" | "rakip-seti";

/** Bizim $/g'nin hangi fiyat/ağırlık çiftinden kurulduğu (varyant-farkında). */
export interface PriceBasis {
  price_cents: number | null;
  weight_grams: number | null;
  /** Kayda yazılan insan-okur temel açıklaması (basis_note kolonu). */
  note: string;
}

/** resolvePriceBasis'in ihtiyaç duyduğu dar varyant kolonları. */
export interface VariantBasisRow {
  sku: string;
  price_cents: number | null;
  weight_grams: number | string | null; // numeric — bazı sürücüler string döndürür
}

/**
 * Varyant-farkında fiyat/ağırlık temeli: products.price_cents listing'in EN
 * DÜŞÜK varyant fiyatıdır — $/g'de ağırlık da O varyanta ait olmalı. En düşük
 * fiyatlı ve ağırlığı OLAN varyant seçilir; hiç yoksa ürün alanlarına düşülür.
 */
export function resolvePriceBasis(
  product: ProductRow,
  variants: VariantBasisRow[],
): PriceBasis {
  const paired = variants
    .map((v) => ({
      sku: v.sku,
      price: v.price_cents,
      weight: v.weight_grams == null ? null : Number(v.weight_grams),
    }))
    .filter(
      (v): v is { sku: string; price: number; weight: number } =>
        v.price != null && v.price > 0 && v.weight != null && v.weight > 0,
    )
    .sort((a, b) => a.price - b.price);
  if (paired.length > 0) {
    const v = paired[0];
    return {
      price_cents: v.price,
      weight_grams: v.weight,
      note: `varyant temeli: en düşük fiyatlı gramajlı varyant ${v.sku} ($${(v.price / 100).toFixed(0)} · ${v.weight} g)`,
    };
  }
  return {
    price_cents: product.price_cents,
    weight_grams:
      product.weight_grams == null ? null : Number(product.weight_grams),
    note: "ürün temeli: listing fiyatı + ürün gramajı (fiyat+gram çifti olan varyant yok)",
  };
}

export interface MarketPosition {
  our_per_gram_cents: number | null;
  market_low_per_gram_cents: number | null;
  market_avg_per_gram_cents: number | null;
  market_high_per_gram_cents: number | null;
  melt_per_gram_cents: number | null;
  price_position: "pahali" | "ucuz" | "bantta" | "belirsiz";
  deviation_pct: number | null;
  confidence: "yuksek" | "orta" | "dusuk";
  /** Eski tek-metin öneri — geriye dönük dolmaya devam eder (what+why+action). */
  recommendation: string | null;
  /** Motorun önerdiği TAM fiyat (uygula butonu bunu kullanır); yoksa null. */
  suggested_price_cents: number | null;
  /** Fiziksel-mantık guard'ı: $/g imkânsızsa true — zarar değil veri hatası. */
  data_suspect: boolean;
  /** Yapılandırılmış hüküm (insancıl metin dersi): ne oldu / neden / ne yap. */
  verdict_what: string | null;
  verdict_why: string | null;
  verdict_action: string | null;
  /** Bizim $/g hangi fiyat/ağırlık temelinden kuruldu (varyant mı ürün mü). */
  basis_note: string | null;
  band_source: BandSource;
}

export interface MarketPositionOptions {
  /** Varyant-farkında fiyat/ağırlık temeli; verilmezse ürün alanları. */
  basis?: PriceBasis | null;
  /** Band kaynağı — 'rakip-seti' ise ayar filtresi atlanır (küme elle
   *  doğrulanmış), $/g eşiği 3'e düşer ve güven 'yuksek' olur. */
  bandSource?: BandSource;
}

/** Rakip başlığından gram çıkarıp $/g döndürür (yoksa null). */
function competitorPerGram(c: CompetitorRow): number | null {
  const g = extractWeightGrams(c.title, null);
  if (!g || g <= 0) return null;
  return c.price_cents / g;
}

/**
 * Bir listing için gram-normalize pazar konumu hesaplar.
 * Rakip başlıklarından gram çıkarabildiğimiz kadarıyla CANLI $/g bandı kurar;
 * yeterli değilse (organikte n<5, rakip setinde n<3) melt-çarpanı kalibre
 * bandına düşer. Bizim $/g imkânsız çıkarsa (melt×0,5 altı / melt×20 üstü)
 * öneri ÜRETMEZ — bunu veri hatası (data_suspect) olarak işaretler.
 */
export function computeMarketPosition(
  product: ProductRow,
  competitors: CompetitorRow[],
  goldOunceUsd: number,
  opts?: MarketPositionOptions,
): MarketPosition {
  const bandSource: BandSource = opts?.bandSource ?? "organik";
  const compSet = bandSource === "rakip-seti";
  const basis = opts?.basis ?? null;
  const basisNote =
    basis?.note ?? "ürün temeli: listing fiyatı + ürün gramajı";
  const basePrice = basis ? basis.price_cents : product.price_cents;
  const ourWeight = basis ? basis.weight_grams : product.weight_grams;

  const karat = detectKarat(product.title, product.tags);
  const empty: MarketPosition = {
    our_per_gram_cents: null,
    market_low_per_gram_cents: null,
    market_avg_per_gram_cents: null,
    market_high_per_gram_cents: null,
    melt_per_gram_cents: null,
    price_position: "belirsiz",
    deviation_pct: null,
    confidence: "dusuk",
    recommendation: null,
    suggested_price_cents: null,
    data_suspect: false,
    verdict_what: null,
    verdict_why: null,
    verdict_action: null,
    basis_note: basisNote,
    band_source: bandSource,
  };
  if (!karat) return empty;

  const meltPerGram = Math.round(
    (goldOunceUsd / TROY_OUNCE_GRAMS) * KARAT_PURITY[karat] * 100,
  );
  const breakevenPerGram = PURCHASE_PRICE_CENTS_PER_GRAM[karat]; // taban maliyet

  // Bizim $/g: temel fiyat ÷ temel ağırlık (varyant-farkında — bkz. basis).
  const ourPerGram =
    basePrice != null && ourWeight && ourWeight > 0
      ? Math.round(basePrice / ourWeight)
      : null;

  // Rakiplerin $/g'si (başlıktan gram + makul melt üstü). Organikte bire bir
  // ayar eşleşmesi aranır; rakip seti elle doğrulanmış küme olduğundan
  // başlıkta ayar geçmese de sayılır.
  const rivalPerGram = competitors
    .filter((c) => compSet || detectKarat(c.title) === karat)
    .map((c) => competitorPerGram(c))
    .filter((v): v is number => v != null && v >= meltPerGram * 0.9);

  let low: number, avg: number, high: number;
  let confidence: MarketPosition["confidence"];
  const minRivals = compSet ? 3 : 5;
  if (rivalPerGram.length >= minRivals) {
    const sorted = [...rivalPerGram].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    // Tam sayı cent disiplini: $/g bölümleri float üretir, kolonlar integer.
    low = Math.round(q(0.25));
    avg = Math.round(median(sorted));
    high = Math.round(q(0.75));
    confidence = compSet || rivalPerGram.length >= 10 ? "yuksek" : "orta";
  } else {
    // Yedek: kalibre melt-çarpanı bandı (güven düşük).
    low = Math.round(meltPerGram * MARKET_MULT_LOW);
    avg = Math.round(meltPerGram * MARKET_MULT_MID);
    high = Math.round(meltPerGram * MARKET_MULT_HIGH);
    confidence = "dusuk";
  }
  // Rakip seti banda hükmediyorsa güven yüksektir (küme elle doğrulanmış,
  // fiyatlar canlı çekilmiş — bkz. 0091).
  if (compSet) confidence = "yuksek";

  const fg = (c: number) => `$${(c / 100).toFixed(0)}/g`;
  const fp = (c: number | null) =>
    c == null ? "—" : `$${(c / 100).toFixed(0)}`;

  // ── Fiziksel-mantık guard'ı: imkânsız $/g = veri hatası, zarar değil ──
  const suspectLow =
    ourPerGram != null && ourPerGram < meltPerGram * DATA_SUSPECT_LOW_MELT_RATIO;
  const suspectHigh =
    ourPerGram != null && ourPerGram > meltPerGram * DATA_SUSPECT_HIGH_MELT_RATIO;
  if (suspectLow || suspectHigh) {
    const what = `VERİ ŞÜPHELİ · ${fg(ourPerGram!)} ${karat} için fiziksel olarak ${
      suspectLow ? "imkânsız derecede düşük" : "absürt derecede yüksek"
    } (melt ${fg(meltPerGram)})`;
    const why = suspectLow
      ? `Fiyat ${fp(basePrice)} ÷ ağırlık ${ourWeight} g = ${fg(ourPerGram!)}; oysa ${karat} hurda (melt) değeri bile ${fg(meltPerGram)}. Bu ZARAR değil VERİ HATASI sinyali: büyük olasılıkla ağırlık fazla girilmiş ya da fiyat/ağırlık eşleşmesi yanlış (${basisNote}).`
      : `Fiyat ${fp(basePrice)} ÷ ağırlık ${ourWeight} g = ${fg(ourPerGram!)} — ${karat} melt değeri ${fg(meltPerGram)}'ın 20 katından fazla. Büyük olasılıkla ağırlık eksik/yanlış girilmiş (${basisNote}).`;
    const action =
      "Öneri üretilmedi. Listeler > listing detayında ağırlığı ve varyant fiyat/ağırlık eşleşmesini düzeltin, sonra 'Şimdi araştır' ile yenileyin.";
    return {
      our_per_gram_cents: ourPerGram,
      market_low_per_gram_cents: low,
      market_avg_per_gram_cents: avg,
      market_high_per_gram_cents: high,
      melt_per_gram_cents: meltPerGram,
      price_position: "belirsiz",
      deviation_pct: null,
      confidence,
      recommendation: `${what}. ${why} ${action}`,
      suggested_price_cents: null, // imkânsız $/g'den fiyat türetilmez
      data_suspect: true,
      verdict_what: what,
      verdict_why: why,
      verdict_action: action,
      basis_note: basisNote,
      band_source: bandSource,
    };
  }

  let position: MarketPosition["price_position"] = "bantta";
  let deviation: number | null = null;
  if (ourPerGram != null) {
    if (ourPerGram < breakevenPerGram) {
      position = "ucuz"; // maliyet altı — zarar riski
      deviation = ourPerGram / breakevenPerGram - 1;
    } else if (ourPerGram > high) {
      position = "pahali";
      deviation = ourPerGram / high - 1;
    } else if (ourPerGram < low) {
      position = "ucuz";
      deviation = ourPerGram / low - 1;
    } else {
      position = "bantta";
      deviation = ourPerGram / avg - 1;
    }
  } else {
    position = "belirsiz";
  }

  const rivalN = rivalPerGram.length;
  const src = compSet
    ? `rakip seti · ${competitors.length} kayıt`
    : confidence === "dusuk"
      ? "kalibre band (rakip $/g az)"
      : `${rivalN} rakip $/g`;
  // Bizim mevcut fiyat ve önerilen tam fiyat (hedef $/g × ağırlık).
  const priceAt = (perGram: number): number | null =>
    ourWeight && ourWeight > 0 ? Math.round(perGram * ourWeight) : null;
  let what: string | null = null;
  let why: string | null = null;
  let action: string | null = null;
  let suggested: number | null = null; // uygula butonunun kullanacağı tam fiyat

  if (position === "pahali") {
    const targetBand = priceAt(high); // banda giren en yüksek (marjı korur)
    const targetMid = priceAt(avg); // rekabetçi (daha agresif)
    suggested = targetBand; // öneri: bant içine çek (marjı korur)
    what = `PAHALI · pazar bandının %${Math.round((deviation ?? 0) * 100)} üstünde`;
    why = `Bizim ${fg(ourPerGram!)} (${basisNote}); pazar bandı ${fg(low)}–${fg(high)} (${src}, ${confidence} güven).`;
    action =
      `Önerilen fiyat: ${fp(targetBand)} (bant içine; şu an ${fp(basePrice)}), agresif: ${fp(targetMid)}. ` +
      `En çok fayda: FİYAT düşürmek — pahalı üründe reklam bütçesi dönüşüm getirmez, reklamı artırmadan önce fiyatı banda çek.`;
  } else if (position === "ucuz") {
    if (ourPerGram != null && ourPerGram < breakevenPerGram) {
      const targetFloor = priceAt(Math.round(breakevenPerGram * 1.4));
      suggested = targetFloor;
      what = `ZARAR RİSKİ · ${fg(ourPerGram)} maliyet tabanı ${fg(breakevenPerGram)} ALTINDA`;
      why = `Gram başına satış fiyatı alım maliyetinin altında (${basisNote}) — bu fiyatla her satış zarar yazar.`;
      action = `Acil düzelt: önerilen minimum fiyat ${fp(targetFloor)} (taban×1,4). En çok fayda: fiyatı düzeltmek; bu üründe reklam para yakar.`;
    } else {
      const targetLow = priceAt(low);
      const targetMid = priceAt(avg);
      suggested = targetMid; // hedef: bant ortası (zam fırsatı)
      what = `UCUZ · pazar bandı ${fg(low)}–${fg(high)} ALTINDA`;
      why = `Bizim ${fg(ourPerGram!)} (${basisNote}); ${src}, ${confidence} güven.`;
      action = `Zam fırsatı: en az ${fp(targetLow)} (bant alt sınırı), hedef ${fp(targetMid)}. Reklamdan ÖNCE fiyatı bant içine çek — talep zaten var, marj masada kalıyor. 2. teyit beklenmeli.`;
    }
  } else if (position === "bantta") {
    what = `BANTTA · ${fg(ourPerGram!)} pazar aralığında (${fg(low)}–${fg(high)})`;
    why = `Fiyat rekabetçi (${src}, ${confidence} güven; ${basisNote}).`;
    action =
      "En çok fayda: fiyat değil, GÖRÜNÜRLÜK — dönüşümü zaten iyiyse hedefli/daraltılmış reklam ya da SEO ile trafik artır.";
  } else {
    what = "KONUM BELİRSİZ · $/g hesaplanamadı";
    why = ourWeight
      ? "Ağırlık var ama fiyat yok — konum hesaplanamadı."
      : "Ürün/varyant ağırlığı girilmemiş — $/g konumu için gram gerekli.";
    action = "Listeler > listing detayında ağırlığı girin, sonra 'Şimdi araştır' ile yenileyin.";
  }

  return {
    our_per_gram_cents: ourPerGram,
    market_low_per_gram_cents: low,
    market_avg_per_gram_cents: avg,
    market_high_per_gram_cents: high,
    melt_per_gram_cents: meltPerGram,
    price_position: position,
    deviation_pct: deviation,
    confidence,
    recommendation: what ? `${what}. ${why ?? ""} ${action ?? ""}`.trim() : null,
    suggested_price_cents: suggested,
    data_suspect: false,
    verdict_what: what,
    verdict_why: why,
    verdict_action: action,
    basis_note: basisNote,
    band_source: bandSource,
  };
}

/** Bir listing'in araştırma kelimesini çözer (override → birincil tag). */
export function resolveKeyword(product: ProductRow): string | null {
  const override = product.research_keyword?.trim();
  if (override) return override;
  const firstTag = product.tags?.find((t) => t && t.trim().length > 0);
  return firstTag?.trim() ?? null;
}

/** Bir listing için rekabet araştırması yapıp `keyword_research`'e yazar. */
export async function researchListing(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  ownShopId: number | null,
  product: ProductRow,
  goldOunceUsd: number,
  deep = false,
): Promise<ResearchResult> {
  const keyword = resolveKeyword(product);
  if (!keyword) {
    return { product_id: product.id, keyword: null, status: "no-keyword", result_count: 0 };
  }

  const search = await client.get<EtsyActiveSearch>(
    etsyPaths.activeListingsSearch(),
    {
      keywords: keyword,
      limit: 20,
      sort_on: "score",
      sort_order: "down",
      includes: "Shop", // rakip mağaza adını da getir
    },
  );

  const currency = product.currency ?? "USD";
  // Rakip = kendi mağazamız dışında, geçerli fiyatlı, aynı para birimi; organik
  // sırayı koruyarak ilk 10. Ham liste listing_id'yi taşır (derin mod için).
  const rawCompetitors = (search.results ?? [])
    .filter((l) => ownShopId == null || l.shop_id !== ownShopId)
    .filter((l) => {
      const c = moneyToCents(l.price);
      return c != null && (l.price?.currency_code ?? currency) === currency;
    })
    .slice(0, 10);

  const competitors: CompetitorRow[] = rawCompetitors.map((l, i) => ({
    title: l.title,
    price_cents: moneyToCents(l.price) as number,
    currency: l.price?.currency_code ?? currency,
    shop: l.shop_id ?? null,
    shop_name: l.shop_name ?? l.Shop?.shop_name ?? null,
    url: l.url ?? null,
    position: i + 1,
    listing_id: l.listing_id ?? null, // rakip setine ekleme için
  }));

  // Varyantlar: fiyat/ağırlık temeli için HER modda dar kolon; deep modda
  // aynı-varyant karşılaştırması için tam kolon (tek sorgu iki ihtiyaca yeter).
  const { data: varRows, error: varError } = await admin
    .from("product_variants")
    .select(
      deep
        ? "sku, name, properties, price_cents, weight_grams"
        : "sku, price_cents, weight_grams",
    )
    .eq("org_id", orgId)
    .eq("product_id", product.id);
  if (varError)
    console.error("keyword-research: varyant sorgusu hatası:", varError.message);
  // Dar modda name/properties yok — basis yalnız sku+fiyat+gram okur; deep
  // karşılaştırması yalnız tam kolonlu satırlarla çalışır (aşağıda deep guard).
  const variantRows = (varRows ?? []) as unknown as OurVariant[];
  const basis = resolvePriceBasis(product, variantRows);

  // Rakip seti (0091): son 48 saatte ≥3 taze fiyat varsa band ORGANİK arama
  // yerine buradan kurulur — organik sonuçlar yine `results`e yazılır ama
  // banda rakip seti hükmeder.
  const compSetPrices = await getFreshCompetitorSetPrices(
    admin,
    orgId,
    product.id,
    currency,
  );
  const bandSource: BandSource =
    compSetPrices.length >= 3 ? "rakip-seti" : "organik";
  const bandRows: CompetitorRow[] =
    bandSource === "rakip-seti"
      ? compSetPrices.map((c, i) => ({
          title: c.title ?? "",
          price_cents: c.price_cents,
          currency: c.currency,
          shop: null,
          shop_name: c.shop_name,
          url: c.url,
          position: i + 1,
          listing_id: c.competitor_listing_id,
        }))
      : competitors;

  const prices = bandRows.map((c) => c.price_cents);
  const our = product.price_cents; // listing fiyatı — $/g temeli ayrı (basis)
  const stats = prices.length
    ? {
        min_cents: Math.min(...prices),
        max_cents: Math.max(...prices),
        avg_cents: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        median_cents: median(prices),
        our_rank_pct:
          our != null ? prices.filter((p) => p < our).length / prices.length : null,
      }
    : {
        min_cents: null,
        max_cents: null,
        avg_cents: null,
        median_cents: null,
        our_rank_pct: null,
      };

  // Derin mod: rakip varyantlarını çekip bizimkilerle eşleştir (aynı-varyant
  // fiyat karşılaştırması). Maliyeti sınırlamak için ilk 8 rakip.
  let variantComparison: VariantComparison[] | null = null;
  if (deep && variantRows.length > 0) {
    const offerings: CompetitorOffering[] = [];
    for (const l of rawCompetitors.slice(0, 8)) {
      if (l.listing_id == null) continue;
      const offs = await fetchCompetitorOfferings(client, l.listing_id, currency);
      offerings.push(...offs);
      await new Promise((r) => setTimeout(r, 160));
    }
    variantComparison = buildVariantComparison(variantRows, offerings);
  }

  const market = computeMarketPosition(product, bandRows, goldOunceUsd, {
    basis,
    bandSource,
  });

  const { error: insertError } = await admin.from("keyword_research").insert({
    org_id: orgId,
    product_id: product.id,
    keyword,
    our_price_cents: our,
    currency,
    result_count: competitors.length,
    ...stats,
    results: competitors,
    variant_comparison: variantComparison,
    our_per_gram_cents: market.our_per_gram_cents,
    market_low_per_gram_cents: market.market_low_per_gram_cents,
    market_avg_per_gram_cents: market.market_avg_per_gram_cents,
    market_high_per_gram_cents: market.market_high_per_gram_cents,
    melt_per_gram_cents: market.melt_per_gram_cents,
    price_position: market.price_position,
    deviation_pct: market.deviation_pct,
    confidence: market.confidence,
    recommendation: market.recommendation,
    suggested_price_cents: market.suggested_price_cents,
    data_suspect: market.data_suspect,
    verdict_what: market.verdict_what,
    verdict_why: market.verdict_why,
    verdict_action: market.verdict_action,
    basis_note: market.basis_note,
    band_source: market.band_source,
  });
  if (insertError)
    throw new Error(`keyword_research yazılamadı: ${insertError.message}`);

  return {
    product_id: product.id,
    keyword,
    status: competitors.length ? "ok" : "no-results",
    result_count: competitors.length,
  };
}

/**
 * Verilen grubu (0..6) tüm bağlı organizasyonlar için işler. Etsy rate-limit'e
 * saygılı (istekler arası ~220ms). Etsy bağlı değilse org atlanır (inert).
 */
export async function advanceKeywordResearch(
  group: number,
): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const goldOunceUsd = await getGoldPricePerOunce(); // grup başına tek çekim
  const { data: conns } = await admin
    .from("etsy_connection")
    .select("org_id, shop_id")
    .eq("status", "connected");

  const out: Record<string, unknown> = {};
  for (const conn of (conns ?? []) as { org_id: string; shop_id: number | null }[]) {
    let client: EtsyClient;
    try {
      client = await EtsyClient.forOrg(conn.org_id);
    } catch (e) {
      out[conn.org_id] = {
        skipped: e instanceof EtsyNotConnectedError ? "not-connected" : "error",
      };
      continue;
    }

    const { data: products } = await admin
      .from("products")
      .select(
        "id, title, price_cents, currency, tags, research_keyword, etsy_listing_id, weight_grams",
      )
      .eq("org_id", conn.org_id)
      .eq("research_group", group)
      .eq("status", "active");

    let ok = 0;
    let noKeyword = 0;
    let noResults = 0;
    let errors = 0;
    for (const p of (products ?? []) as ProductRow[]) {
      try {
        const r = await researchListing(
          admin,
          client,
          conn.org_id,
          conn.shop_id,
          p,
          goldOunceUsd,
        );
        if (r.status === "ok") ok++;
        else if (r.status === "no-keyword") noKeyword++;
        else noResults++;
      } catch {
        errors++;
      }
      await new Promise((r) => setTimeout(r, 220));
    }
    out[conn.org_id] = {
      group,
      total: products?.length ?? 0,
      ok,
      no_keyword: noKeyword,
      no_results: noResults,
      errors,
    };
  }
  return out;
}
