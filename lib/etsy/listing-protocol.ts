import {
  DEFAULT_PERSONALIZATION_QUESTIONS,
  type PersonalizationQuestion,
} from "@/lib/etsy/personalization";

/**
 * LISTING PROTOKOLÜ — bir ürün tipinin Etsy sözleşmesi.
 *
 * ## Neden var
 *
 * `lib/etsy/create-listing.ts` EON alyansları için yazıldı ve akışın TAMAMI o
 * şekle sabitlenmişti: taksonomi `findTaxonomyNode("Wedding Bands")` ile
 * çözülüyor, varyasyon doğrulayıcısı `["Wedding Bands"]` yolu ELLE geçilerek
 * çağrılıyor (yani ürün ne olursa olsun her zaman alyans sayılıyor), iç gravür
 * kişiselleştirmesi koşulsuz yazılıyor ve koli ölçüsü yüzük kutusu varsayıyordu.
 *
 * Sonuç: yüzük OLMAYAN her panel taslağı push'ta
 * "Wedding band listinglerinde her varyant Width ve Ring Size içermelidir."
 * hatasına çarpıyordu. Vaka 2026-09-13: `by Artifact Studio Jewelry` kolyesi.
 * Ölçüm, hatanın tek listing'e özel OLMADIĞINI gösterdi — aynı duvarın
 * arkasında Jade Gold NYC'nin 22 kolye, 21 bileklik ve 8 küpe panel taslağı
 * bekliyordu. Bu, second-brain'deki "çok kiracılı sistemde sabitlenmiş hedef"
 * dersinin (ops price-sync `eq("name","EON")` vakası) ürün-tipi sürümüdür.
 *
 * ## Sözleşme
 *
 * Her protokol, o ürün tipinin Etsy'de neye ihtiyaç duyduğunu TEK yerde toplar.
 * Yeni ürün tipi eklemek = buraya bir kayıt eklemek; akış dosyasına dokunulmaz.
 *
 * ## Bilinçli kararlar
 *
 * 1. **Tanımsız tip sessizce bir protokole DÜŞMEZ.** `resolveListingProtocol`
 *    tanımadığı bir `product_type` için `null` döner ve çağıran net bir hatayla
 *    durur. Bilinmeyeni yüzük saymak, düzeltmeye çalıştığımız hatanın ta
 *    kendisiydi; "şüphede üret" yerine "şüphede REDDET" kuruyoruz.
 * 2. **`product_type` NULL olan kayıt eski davranışı korur** (`wedding_band`).
 *    Canlıda 26 EON panel taslağı bu durumda ve onların push akışı bugün
 *    çalışıyor; bu yama onları riske atmaz. Değişim YALNIZ bugün yanlış olan
 *    yerde olur. Yeni kayıtlar `product_type` yazmalıdır.
 * 3. **Taksonomi ada göre çözülürken kök iddiası ile sınırlanabilir.**
 *    Etsy ağacında "Pendant Necklaces" İKİ kez geçiyor: `Jewelry > Necklaces`
 *    ve `Weddings > Jewelry`. Ada göre ilk eşleşmeyi almak, listing'i sessizce
 *    gelinlik dikeyine dosyalardı. `taxonomyRoot` verildiğinde çözücü o köke
 *    filtreler ve birden çok aday kalırsa BAĞIRARAK durur.
 *    Alyans kaydında `taxonomyRoot` BİLEREK yok — mevcut çözüm
 *    (`"Wedding Bands"` yoksa `"Rings"`) canlıda kanıtlı ve birebir korunuyor.
 */

export type ListingProtocolId =
  | "wedding_band"
  | "pendant_necklace"
  | "chain_bracelet";

export interface ParcelSpec {
  weight: number;
  weight_unit: string;
  length: number;
  width: number;
  height: number;
  dimensions_unit: string;
}

export interface ListingProtocolSpec {
  id: ListingProtocolId;
  /** Hata mesajlarında geçen okunur ad. */
  label: string;
  /**
   * Taksonomi adayları, TERCİH SIRASINDA. İlk bulunan kullanılır.
   * (Alyansta bu `["Wedding Bands", "Rings"]` — eski davranışın aynısı.)
   */
  taxonomyNames: string[];
  /**
   * Verilirse, eşleşme bu KÖK düğümün altında olmak zorundadır. Aynı adın
   * ağacın iki ayrı dalında bulunduğu durumlarda yanlış dala dosyalamayı
   * engeller. Verilmezse kök kontrolü yapılmaz (eski davranış).
   */
  taxonomyRoot?: string;
  /**
   * Her varyantta BULUNMASI ve gerçekten DEĞİŞMESİ gereken property adları.
   * Boş dizi = bu protokol varyasyon ekseni dayatmaz.
   */
  requiredVariationAxes: string[];
  /**
   * Create sonrası yazılacak kişiselleştirme soruları. `null` = bu ürün tipinde
   * kişiselleştirme YOK ve uç hiç çağrılmaz.
   */
  personalization: PersonalizationQuestion[] | null;
  /** Etsy'nin zorunlu tuttuğu koli ölçüleri (kargo bedeli fiyata gömülü). */
  parcel: ParcelSpec;
}

/** Yüzük kutusu + koruyucu zarf (EON kararı, canlıda kanıtlı). */
const RING_PARCEL: ParcelSpec = {
  weight: 3,
  weight_unit: "oz",
  length: 4,
  width: 4,
  height: 2,
  dimensions_unit: "in",
};

/**
 * Zincirli takı kutusu + koruyucu zarf — kolye ve bileklik AYNI kutuya girer,
 * o yüzden tek sabit. Yüzük kutusundan daha uzun ve daha yassı.
 *
 * Bu ölçüler Etsy'nin ZORUNLU alanını doldurmak içindir; ABD'de kargo ücretsiz
 * ve bedeli fiyata gömülü, yani ölçü alıcıya bir bedel yansıtmaz. İKİSİ DE
 * VARSAYIM: gerçek kutu seçildiğinde güncellenmeli. İkinci bir uydurma set
 * yazmaktansa tek sabit paylaşılıyor — böylece düzeltme de tek yerde olur.
 */
const CHAIN_JEWELRY_PARCEL: ParcelSpec = {
  weight: 4,
  weight_unit: "oz",
  length: 7,
  width: 5,
  height: 1,
  dimensions_unit: "in",
};

export const LISTING_PROTOCOLS: Record<ListingProtocolId, ListingProtocolSpec> = {
  wedding_band: {
    id: "wedding_band",
    label: "Wedding band",
    taxonomyNames: ["Wedding Bands", "Rings"],
    requiredVariationAxes: ["Width", "Ring Size"],
    personalization: DEFAULT_PERSONALIZATION_QUESTIONS,
    parcel: RING_PARCEL,
  },
  pendant_necklace: {
    id: "pendant_necklace",
    label: "Pendant necklace",
    // Etsy ağacında bu ad iki dalda var; kök iddiası şart (bkz. karar 3).
    taxonomyNames: ["Pendant Necklaces", "Necklaces"],
    taxonomyRoot: "Jewelry",
    // Kolyede zorunlu eksen YOK: bir kolye tek varyantlı da satılabilir, üç
    // zincir uzunluğu × üç metal rengi de. Eksen dayatmak yeni bir yanlış
    // pozitif üretirdi — asıl düzeltmeye çalıştığımız hatanın tekrarı olurdu.
    requiredVariationAxes: [],
    // Bu protokolde iç gravür yok. Alyansın 30 karakterlik gravür sorusunu
    // kolyeye taşımak, olmayan bir hizmeti vaat etmek olurdu.
    personalization: null,
    parcel: CHAIN_JEWELRY_PARCEL,
  },
  chain_bracelet: {
    id: "chain_bracelet",
    label: "Chain bracelet",
    // "Bracelets" da ağaçta birden çok dalda geçebilir; kök iddiası şart.
    // UYARI: bu adlar CANLI taksonomiye karşı doğrulanmadı. Çözücü ada göre
    // arar ve bulamazsa BAĞIRARAK durur, yani yanlış ad sessiz hata üretmez —
    // ama ilk push'tan önce
    // GET /v3/application/seller-taxonomy/nodes ile teyit edilmeli.
    taxonomyNames: ["Chain & Link Bracelets", "Bracelets"],
    taxonomyRoot: "Jewelry",
    // Bileklik boyu bir varyasyon eksenidir ama ZORUNLU değil: tek bedenli
    // bileklik de satılabilir. Eksen dayatmak, düzeltmeye çalıştığımız yanlış
    // pozitifin aynısını üretirdi.
    requiredVariationAxes: [],
    personalization: null,
    parcel: CHAIN_JEWELRY_PARCEL,
  },
};

/** `product_type` → protokol. Listelenmeyen tip BİLEREK eşlenmez. */
const PRODUCT_TYPE_PROTOCOL: Record<string, ListingProtocolId> = {
  ring: "wedding_band",
  necklace: "pendant_necklace",
  pendant: "pendant_necklace",
  bracelet: "chain_bracelet",
};

/**
 * `product_type` NULL olan eski kayıtların düştüğü protokol. Canlıdaki 26 EON
 * panel taslağı bu durumda; onların bugün çalışan akışı korunuyor (karar 2).
 */
const LEGACY_NULL_TYPE_PROTOCOL: ListingProtocolId = "wedding_band";

export interface ProtocolSource {
  product_type?: string | null;
  /** Legacy records may not have product_type; use their explicit selling copy
   * only to avoid routing an obvious bracelet/necklace as a wedding band. */
  title?: string | null;
  tags?: string[] | null;
  materials?: string[] | null;
  listing_metadata?: {
    listingProtocol?: unknown;
    offersPersonalization?: unknown;
  } | null;
}

/** Product records created before product_type existed retain the legacy ring
 * fallback unless their own title, tags, or materials explicitly identify a
 * chain product. This is deliberately narrow: ambiguous legacy records stay
 * on the established wedding-band contract. */
function resolveLegacyNullTypeProtocol(
  product: ProtocolSource,
): ListingProtocolSpec {
  const text = [product.title ?? "", ...(product.tags ?? []), ...(product.materials ?? [])]
    .join(" ")
    .toLocaleLowerCase("en-US");
  if (/\bbracelet\b|\banklet\b/.test(text)) {
    return LISTING_PROTOCOLS.chain_bracelet;
  }
  if (/\bnecklace\b|\bpendant\b/.test(text)) {
    return LISTING_PROTOCOLS.pendant_necklace;
  }
  return LISTING_PROTOCOLS[LEGACY_NULL_TYPE_PROTOCOL];
}

function isProtocolId(value: unknown): value is ListingProtocolId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(LISTING_PROTOCOLS, value)
  );
}

/**
 * Ürünün listing protokolünü çözer.
 *
 * Öncelik: `listing_metadata.listingProtocol` (açık beyan) > `product_type`
 * eşlemesi > tip NULL ise eski davranış. Tanınmayan bir tip için `null` döner;
 * çağıran push'u net bir hatayla durdurmalıdır — sessizce yüzük kuralı
 * uygulamak YASAK.
 */
export function resolveListingProtocol(
  product: ProtocolSource,
): ListingProtocolSpec | null {
  const spec = resolveBaseProtocol(product);
  return spec ? applyPersonalizationOptOut(spec, product) : null;
}

function resolveBaseProtocol(
  product: ProtocolSource,
): ListingProtocolSpec | null {
  const declared = product.listing_metadata?.listingProtocol;
  if (isProtocolId(declared)) return LISTING_PROTOCOLS[declared];

  const type = (product.product_type ?? "").trim().toLocaleLowerCase("en-US");
  if (type === "") return resolveLegacyNullTypeProtocol(product);

  const mapped = PRODUCT_TYPE_PROTOCOL[type];
  return mapped ? LISTING_PROTOCOLS[mapped] : null;
}

/**
 * Ürün başına kişiselleştirme çıkışı.
 *
 * Protokolün kişiselleştirme sorusu ÜRÜN TİPİNİN sözleşmesidir, satıcının o
 * ürünü nasıl sattığının değil: alyans protokolü gravürü yazar çünkü EON'un
 * 59 yüzüğü gravür SUNAR. Gravür sunmayan bir alyans için doğru düzeltme
 * varsayılanı çevirmek değil (o 59 üründen hizmeti sessizce kaldırırdı),
 * o ürüne açık bir çıkış vermektir.
 *
 * Kapı SADECE `offersPersonalization === false` ile açılır. Alan yoksa, null
 * ise, string ise ya da başka bir değerse protokol AYNEN korunur — eksik
 * metadata sessizce hizmet kapatamaz.
 */
function applyPersonalizationOptOut(
  spec: ListingProtocolSpec,
  product: ProtocolSource,
): ListingProtocolSpec {
  if (spec.personalization === null) return spec;
  if (product.listing_metadata?.offersPersonalization !== false) return spec;
  return { ...spec, personalization: null };
}

/** Tanınmayan tip için kullanıcıya gösterilecek hata. */
export function unknownProtocolError(product: ProtocolSource): string {
  const declared = product.listing_metadata?.listingProtocol;
  if (typeof declared === "string" && declared.trim() !== "") {
    return `Bilinmeyen listing protokolü: "${declared}". Tanımlı protokoller: ${Object.keys(LISTING_PROTOCOLS).join(", ")}.`;
  }
  return `"${product.product_type}" ürün tipi için listing protokolü tanımlı değil — Etsy sözleşmesi (taksonomi, varyasyon ekseni, kişiselleştirme, koli) bilinmiyor. lib/etsy/listing-protocol.ts içine bir kayıt ekleyin.`;
}
