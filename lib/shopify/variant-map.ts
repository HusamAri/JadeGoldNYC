/**
 * PANEL → SHOPIFY VARYANT EŞLEMESİ — saf çekirdek, IO yok.
 *
 * ## Neden bu kadar inatçı
 *
 * 2026-09-06'da EON'un Shopify mağazasında 110 üründen **109'u** bozuk
 * bulundu. Bozukluğun şekli önemli: ürünler boş değildi, DOLU ve YANLIŞtı —
 * `US 3` etiketli varyant beden 13'ün SKU'sunu taşıyordu, `Rose Gold` etiketli
 * varyant sarı altının SKU'sunu. İçe aktarma, ters sıralanmış bir SKU listesini
 * artan seçenek ızgarasına fermuarlamıştı. Fiyatlar da ürün başına tek düz
 * değerdi ve 18K 8mm bir yüzük **eritme değerinin altında** fiyatlanmıştı
 * ($920 fiyat, $1.071 saf altın).
 *
 * Ders: yanlış kimlik, eksik kimlikten TEHLİKELİDİR. Eksik olan patlar;
 * yanlış olan sessizce yanlış satıra yazar. Bu yüzden buradaki her fonksiyon
 * şüphede ÜRETMEZ — `ok:false` döner ve çağıran yazmayı durdurur.
 *
 * ## Girdi şekilleri
 *
 * `product_variants.properties` iki farklı şekil taşıyor ve ikisi de canlı:
 *   1) panel-yerlisi obje:  {"Ring Size": "US 12.5", "Gold Color": "Yellow Gold"}
 *   2) Etsy kaynaklı dizi:  [{property_name:"Width", values:["4mm"]}, ...]
 * Yalnız birini tanıyan kod, diğer aileyi sessizce "seçeneksiz" sayar
 * (bütünlük bayrağı tüm veri şekillerini kapsamalı dersi).
 */

export interface PanelVariant {
  sku: string;
  priceCents: number | null;
  weightGrams: number | null;
  properties: unknown;
}

export interface ShopifyOption {
  name: string;
  values: string[];
}

export interface ShopifyVariantPlan {
  sku: string;
  /** Seçenek adı → değer, `options` sırasıyla. */
  optionValues: { name: string; value: string }[];
  /** Shopify'ın beklediği ondalık metin ("460.75"). */
  price: string;
  weightGrams: number | null;
}

export type MapSonuc =
  | { ok: true; options: ShopifyOption[]; variants: ShopifyVariantPlan[]; atlanan: string[] }
  | { ok: false; reason: string };

/** Shopify'ın ürün başına varyant tavanı (2025-10'da 100'den yükseltildi). */
export const SHOPIFY_MAX_VARIANTS = 2048;

/**
 * Bir varyantın seçeneklerini okur; iki şekli de tanır.
 * Okunamazsa `null` — çağıran bunu KUSUR sayar, "seçeneksiz ürün" saymaz.
 */
export function readOptions(
  properties: unknown,
): { name: string; value: string }[] | null {
  if (properties == null) return null;

  // Şekil 2 — Etsy kaynaklı dizi.
  if (Array.isArray(properties)) {
    const out: { name: string; value: string }[] = [];
    for (const p of properties) {
      const o = p as { property_name?: unknown; values?: unknown };
      const name = typeof o?.property_name === "string" ? o.property_name.trim() : "";
      const vals = Array.isArray(o?.values) ? o.values : [];
      const value = typeof vals[0] === "string" ? (vals[0] as string).trim() : "";
      if (!name || !value) return null;
      out.push({ name, value });
    }
    return out.length > 0 ? out : null;
  }

  // Şekil 1 — panel-yerlisi obje.
  if (typeof properties === "object") {
    const out: { name: string; value: string }[] = [];
    for (const [k, v] of Object.entries(properties as Record<string, unknown>)) {
      if (typeof v !== "string" || !v.trim() || !k.trim()) return null;
      out.push({ name: k.trim(), value: v.trim() });
    }
    return out.length > 0 ? out : null;
  }
  return null;
}

/** `price_cents` → indirimli ondalık metin. Yuvarlama TEK yerde tanımlı. */
export function indirimliFiyat(priceCents: number, discountRate: number): string {
  const oran = 1 - discountRate;
  return (Math.round(priceCents * oran) / 100).toFixed(2);
}

/**
 * Panel varyantlarından Shopify ürün planı üretir.
 *
 * ÜRETMEME koşulları (hepsi bilinçli — şüphede yazma yok):
 *  - herhangi bir varyantın seçenekleri okunamıyorsa,
 *  - varyantlar arasında seçenek EKSEN ADLARI tutarsızsa (kimi "Width",
 *    kimi "Ring Size" taşıyorsa ızgara tanımsızdır),
 *  - aynı seçenek kombinasyonuna iki varyant düşüyorsa — bu tam olarak
 *    mağazada bulunan bozukluğun imzasıdır ve sessizce birini ezerdi,
 *  - varyant sayısı Shopify tavanını aşıyorsa.
 *
 * Fiyatı 0/null olan varyant ATLANIR (canlı fiyatı sıfırla ezmemek için) ama
 * sessizce değil: `atlanan` listesinde raporlanır.
 */
export function planla(
  variants: readonly PanelVariant[],
  opts: { discountRate: number },
): MapSonuc {
  if (variants.length === 0) return { ok: false, reason: "panel varyantı yok" };
  if (!(opts.discountRate >= 0 && opts.discountRate < 1)) {
    return { ok: false, reason: `indirim oranı geçersiz: ${opts.discountRate}` };
  }

  const plan: ShopifyVariantPlan[] = [];
  const atlanan: string[] = [];
  let eksenler: string[] | null = null;
  const gorulenKombinasyon = new Map<string, string>();

  for (const v of variants) {
    const opts0 = readOptions(v.properties);
    if (opts0 == null) {
      return {
        ok: false,
        reason: `${v.sku}: seçenekler okunamadı (properties boş ya da tanınmayan şekil)`,
      };
    }
    const adlar = opts0.map((o) => o.name);
    if (eksenler == null) {
      eksenler = adlar;
    } else if (eksenler.length !== adlar.length || eksenler.some((a, i) => a !== adlar[i])) {
      return {
        ok: false,
        reason:
          `${v.sku}: seçenek eksenleri tutarsız — beklenen [${eksenler.join(", ")}], ` +
          `gelen [${adlar.join(", ")}]`,
      };
    }

    const anahtar = opts0.map((o) => o.value).join(" / ");
    const oncekiSku = gorulenKombinasyon.get(anahtar);
    if (oncekiSku != null) {
      return {
        ok: false,
        reason:
          `seçenek kombinasyonu "${anahtar}" iki varyanta düşüyor ` +
          `(${oncekiSku} ve ${v.sku}) — ızgara belirsiz, yazma durduruldu`,
      };
    }
    gorulenKombinasyon.set(anahtar, v.sku);

    if (v.priceCents == null || v.priceCents <= 0) {
      atlanan.push(v.sku);
      continue;
    }

    plan.push({
      sku: v.sku,
      optionValues: opts0,
      price: indirimliFiyat(v.priceCents, opts.discountRate),
      weightGrams: v.weightGrams,
    });
  }

  if (plan.length === 0) return { ok: false, reason: "fiyatlı varyant kalmadı" };
  if (plan.length > SHOPIFY_MAX_VARIANTS) {
    return {
      ok: false,
      reason: `${plan.length} varyant Shopify tavanını (${SHOPIFY_MAX_VARIANTS}) aşıyor`,
    };
  }

  // Eksen değerleri: ilk görülme sırası korunur — panelin sıralaması anlamlıdır
  // (beden artan, genişlik artan) ve alfabetik sıralamak "US 10"u "US 2"nin
  // önüne atardı.
  const options: ShopifyOption[] = eksenler!.map((ad, i) => {
    const gorulen: string[] = [];
    for (const p of plan) {
      const deger = p.optionValues[i].value;
      if (!gorulen.includes(deger)) gorulen.push(deger);
    }
    return { name: ad, values: gorulen };
  });

  return { ok: true, options, variants: plan, atlanan };
}

/**
 * Canlı Shopify varyantlarının panelle KİMLİK olarak hizalı olduğunu sınar.
 *
 * Fiyat yazmadan önce çağrılır. Mağazadaki bozuklukta SKU'lar doluydu ama
 * yanlış kombinasyona bağlıydı; SKU'ya güvenip yazmak 21 varyantta sessizce
 * yanlış fiyat üretirdi. Bu yüzden ölçüt "SKU var mı" DEĞİL, "SKU'nun panelde
 * karşılık geldiği seçenek kombinasyonu, Shopify'daki başlığıyla aynı mı".
 */
export function hizaliMi(
  canli: readonly { sku: string | null; optionValues: readonly string[] }[],
  panelKombinasyon: ReadonlyMap<string, string>,
): { hizali: boolean; sapan: string[] } {
  const sapan: string[] = [];
  for (const c of canli) {
    if (!c.sku) {
      sapan.push("(SKU yok)");
      continue;
    }
    const beklenen = panelKombinasyon.get(c.sku);
    const gelen = c.optionValues.join(" / ");
    if (beklenen == null) sapan.push(`${c.sku}: panelde yok`);
    else if (beklenen !== gelen) sapan.push(`${c.sku}: "${gelen}" ≠ panel "${beklenen}"`);
  }
  return { hizali: sapan.length === 0, sapan };
}
