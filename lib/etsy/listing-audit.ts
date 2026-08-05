import { hasHtmlEntities } from "@/lib/etsy/text";
import type { AlertSeverity } from "@/lib/db/queries/data-gaps";

/**
 * LISTING DENETİM MOTORU — aktif listingleri Etsy'nin BELGELİ arama/kalite
 * sinyallerine göre tarar. Yalnız Etsy'nin kendi rehberlerine (Seller
 * Handbook / Help Center) dayanan, verimizden deterministik doğrulanabilen
 * kontroller yer alır; spekülatif "SEO folkloru" bilerek dışarıda.
 *
 * Saf fonksiyonlar — DB erişimi lib/db/queries/listing-audit.ts'te.
 * Her kontrol insancıl üçlü anlatır: ne oldu + aksiyonsuz bedeli + ne yap.
 */

export interface AuditProductInput {
  id: string;
  etsyListingId: number | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  numImages: number | null;
}

export type AuditCheckKey =
  | "tags_missing"
  | "tags_duplicate"
  | "tags_single_word"
  | "title_repeat"
  | "title_rules"
  | "title_short"
  | "title_long"
  | "description_missing"
  | "description_copies_title"
  | "images_low"
  | "title_entities";

export interface AuditCheckDef {
  key: AuditCheckKey;
  severity: AlertSeverity;
  /** Grup başlığı (n = etkilenen listing sayısı). */
  title: (n: number) => string;
  /** Ne oldu + bedel + ne yap (insancıl, sonuç odaklı). */
  hint: string;
  /** Etkilenen listing'de düzeltmenin yapılacağı yer. */
  fixHref: (productId: string) => string;
  fixLabel: string;
  /** Etsy'nin kendi rehberindeki dayanak. */
  sourceLabel: string;
  sourceUrl: string;
  /** Tek tuşla panelden düzeltilebilir mi (Etsy'ye yazmadan)? */
  autoFixable?: boolean;
}

export interface AuditFinding {
  key: AuditCheckKey;
  /** Ürün-özel ayrıntı, ör. `"gold" 4× tekrar` ya da `9/13 tag`. */
  detail: string;
}

/**
 * Sıralama/başlık ağırlığı taşımayan bağlaçlar — tekrar sayımında atlanır.
 * Kısa tutulur: "her", "men" gibi kelimeler Etsy'de GERÇEK anahtar kelimedir.
 */
const TITLE_STOPWORDS = new Set([
  "a", "an", "and", "the", "or", "of", "in", "on", "to", "by", "at",
  "is", "as", "with", "from", "your", "this", "that",
]);

/** Başlıkta 3+ kez geçen içerik kelimeleri: `kelime (n×)` listesi. */
export function findTitleRepeats(title: string): string[] {
  const counts = new Map<string, number>();
  for (const raw of title.toLowerCase().split(/[^a-z0-9']+/)) {
    const w = raw.replace(/^'+|'+$/g, "");
    if (w.length < 3 || TITLE_STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([w, n]) => `"${w}" ${n}×`);
}

export const ETSY_TAG_LIMIT = 13;
/**
 * Başlık alt sınırı — YALNIZ gerçekten cılız başlığı yakalar.
 *
 * 2026-08 düzeltmesi: burada 110 yazıyordu ("140 bütçesini doldur"). Etsy
 * Ağustos 2025'te bunun TERSİNE döndü — Seller Handbook artık 15 kelimeden
 * kısa, insan-okunur başlık öneriyor ve eRank'in aktardığına göre Etsy eski
 * tarz uzun başlıkların cezalandırılmadığını açıkça doğruladı. 110 eşiği
 * kullanıcıyı rehberliğin tersine (anahtar kelime yığmaya) itiyordu ve aynı
 * dosyadaki `title_long` (>15 kelime) kuralıyla mantıksal olarak çelişiyordu:
 * bu alanda 110 karakterlik bir alyans başlığı zaten ~18 kelimedir.
 *
 * Yeni eşik "kayıp bütçe" değil "eksik künye" ölçer: 40 karakterin altında
 * karat + metal + profil + ürün adı aynı anda sığmaz.
 */
export const TITLE_MIN_LENGTH = 40;
/** Etsy 10 foto slotu verir; 5'in altı belirgin eksik kullanım sayılır. */
export const LOW_IMAGE_THRESHOLD = 5;

export const AUDIT_CHECKS: AuditCheckDef[] = [
  {
    key: "tags_missing",
    severity: "onemli",
    title: (n) => `${n} listing 13 tag hakkının tamamını kullanmıyor`,
    hint: "Etsy her listing'e 13 tag hakkı verir ve hepsini kullanmanı açıkça önerir — boş bırakılan her tag, o aramada hiç çıkmamak demek. Eksik tag'leri çok kelimeli (long-tail) ifadelerle doldur.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Tag'leri düzenle",
    sourceLabel: "Etsy Seller Handbook — Keywords 101: Everything You Need to Know",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/keywords-101-everything-you-need-to-know/382774281517",
  },
  {
    key: "tags_duplicate",
    severity: "bilgi",
    title: (n) => `${n} listing'de yinelenen tag var`,
    hint: "Aynı (ya da yalnız çoğul eki farklı) tag'i iki kez yazmak ikinci slotu çöpe atar — Etsy zaten tekil/çoğul eşleşmesini kendisi yapar. Yinelenen tag'i sil, yerine yeni bir arama ifadesi ekle.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Tag'leri düzenle",
    sourceLabel: "Etsy Seller Handbook — Keywords 101 (don't repeat tags)",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/keywords-101-everything-you-need-to-know/382774281517",
  },
  {
    key: "tags_single_word",
    severity: "bilgi",
    title: (n) => `${n} listing'de tek kelimelik tag'ler çoğunlukta`,
    hint: "Etsy açıkça söylüyor: 'custom bracelet' gibi çok kelimeli ifadeler, 'custom' + 'bracelet' gibi tek kelimelerden GÜÇLÜDÜR ve long-tail aramalar daha iyi dönüşür. Tek kelimelik tag'leri alıcının gerçekte yazdığı ifadelerle birleştir.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Tag'leri düzenle",
    sourceLabel: "Etsy Seller Handbook — Keywords 101 (multi-word phrases)",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/keywords-101-everything-you-need-to-know/382774281517",
  },
  {
    key: "title_repeat",
    severity: "bilgi",
    title: (n) => `${n} listing başlığında tekrarlı kelime var`,
    hint: "Etsy'nin başlık rehberi net: 'tekrarlanan kelime ve ifadeleri kaldırın' — tekrar alıcıyı yorar, başlığın işini arama zaten bütünsel yapıyor. Tekrar yerine ürünü anlatan yeni bir ifade yaz.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Başlığı düzenle",
    sourceLabel: "Etsy Seller Handbook — New Guidance for Listing Titles",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/1399426136697",
  },
  {
    key: "title_rules",
    severity: "onemli",
    title: (n) => `${n} listing başlığı Etsy'nin sabit kurallarını zorluyor`,
    hint: "Etsy'nin sert başlık kuralları var: en fazla 140 karakter, en fazla 3 TAMAMEN BÜYÜK kelime, $ ^ ` hiç kullanılamaz, % : & yalnız bir kez. Kural dışı başlık kaydedilemez ya da kırpılır — düzenlemede sorun yaşamadan önce düzelt.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Başlığı düzenle",
    sourceLabel: "Etsy Help — Using Listing Titles to Get Found in Search",
    sourceUrl: "https://help.etsy.com/hc/en-us/articles/360000337827",
  },
  {
    key: "title_short",
    severity: "onemli",
    title: (n) => `${n} listing başlığı ${TITLE_MIN_LENGTH} karakterin altında (künye eksik)`,
    hint: "Bu kadar kısa bir başlığa karat + metal rengi + profil + ürün adı aynı anda sığmaz; alıcı listeye bakınca neyi satın aldığını anlayamaz. Uzatmak için anahtar kelime YIĞMA — Etsy'nin güncel rehberi 15 kelimenin altını öneriyor. Eksik olan künye parçasını ekle, orada bırak.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Başlığı düzenle",
    sourceLabel: "Etsy Seller Handbook — New Guidance for Listing Titles (Ağu 2025)",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/1399426136697",
  },
  {
    key: "title_long",
    severity: "bilgi",
    title: (n) => `${n} listing başlığı 15 kelimeden uzun`,
    hint: "Etsy'nin güncel başlık rehberi 15 kelimenin altını öneriyor: alıcı (özellikle mobilde) ilk birkaç kelimeyi görür; gerisi taranabilirliği düşürür. Sıralama kaybı değil, okunabilirlik önerisi — en önemli ifadeler öne, gereksiz kuyruk kırpılsın.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Başlığı düzenle",
    sourceLabel: "Etsy Seller Handbook — New Guidance for Listing Titles",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/1399426136697",
  },
  {
    key: "description_missing",
    severity: "onemli",
    title: (n) => `${n} listing'in açıklaması boş ya da çok kısa`,
    hint: "Etsy araması açıklamalardaki kelimeleri de eşleştiriyor; boş/kısa açıklama hem eşleşme kaybettirir hem alıcı güvenini düşürür. Etsy'nin önerisi: anahtar kelimeleri İLK BİRKAÇ CÜMLEYE doğal biçimde yerleştir.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Açıklama yaz",
    sourceLabel: "Etsy Seller Handbook — Keywords 101 (descriptions)",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/keywords-101-everything-you-need-to-know/382774281517",
  },
  {
    key: "description_copies_title",
    severity: "bilgi",
    title: (n) => `${n} listing'in açıklaması başlığın kopyasıyla açılıyor`,
    hint: "Etsy açıkça 'başlığınızı aynen kopyalamayın, anahtar kelime listesi dizmeyin' diyor — açılış cümlesi alıcıya (ve aramaya) yeni bilgi taşımalı. İlk cümleyi ürünü anlatan doğal bir cümleyle değiştir.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Açıklamayı düzenle",
    sourceLabel: "Etsy Seller Handbook — Keywords 101 (descriptions)",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/keywords-101-everything-you-need-to-know/382774281517",
  },
  {
    key: "images_low",
    severity: "bilgi",
    title: (n) => `${n} listing ${LOW_IMAGE_THRESHOLD}'ten az fotoğraf kullanıyor`,
    hint: "Etsy'nin rehberi: '10 görselin hepsini kullanmak dönüşümü artırabilir' — her ek kare alıcıya karar verdiren bilgidir; az fotoğraf, bakan alıcının emin olamayıp çıkması demek. Detay/ölçek/kullanım karesi ekleyerek 10 slota yaklaş. (Bu bir dönüşüm önerisi; sıralama iddiası değil.)",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Listing'i aç",
    sourceLabel: "Etsy Seller Handbook — The Anatomy of a Well-Crafted Listing",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/1347574487014",
  },
  {
    key: "title_entities",
    severity: "bilgi",
    title: (n) => `${n} listing başlığında ham HTML kodu görünüyor (&quot; gibi)`,
    hint: "Etsy API başlıkları kodlanmış gönderiyor ve panelde '7.5&quot;' gibi ham kod görünüyor — raporlar ve aramalar da bundan etkileniyor. Tek tuşla panelde normalize edilir; Etsy'deki listing'e dokunulmaz.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Listing'i aç",
    sourceLabel: "Panel veri kalitesi (Etsy API escape davranışı)",
    sourceUrl: "https://developers.etsy.com/documentation/reference/#operation/getListing",
    autoFixable: true,
  },
];

export const AUDIT_CHECK_BY_KEY = new Map(AUDIT_CHECKS.map((c) => [c.key, c]));

/** Tek ürünü tüm kontrollerden geçirir. */
export function auditProduct(p: AuditProductInput): AuditFinding[] {
  const out: AuditFinding[] = [];

  const tags = (p.tags ?? []).map((t) => t.trim()).filter(Boolean);
  if (tags.length < ETSY_TAG_LIMIT) {
    out.push({ key: "tags_missing", detail: `${tags.length}/${ETSY_TAG_LIMIT} tag` });
  }
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const t of tags) {
    // Tekil/çoğul (son 's') ve büyük/küçük farkını aynı say.
    const norm = t.toLowerCase().replace(/s$/, "");
    if (seen.has(norm)) dupes.push(`"${seen.get(norm)}" ≈ "${t}"`);
    else seen.set(norm, t);
  }
  if (dupes.length > 0) {
    out.push({ key: "tags_duplicate", detail: dupes.join(" · ") });
  }

  // Tek kelimelik tag çoğunluğu — Etsy: çok kelimeli ifadeler daha güçlü.
  const singles = tags.filter((t) => !t.trim().includes(" "));
  if (tags.length > 0 && singles.length >= Math.ceil(tags.length / 2)) {
    out.push({
      key: "tags_single_word",
      detail: `${singles.length}/${tags.length} tek kelime`,
    });
  }

  const repeats = findTitleRepeats(p.title);
  if (repeats.length > 0) {
    out.push({ key: "title_repeat", detail: repeats.join(" · ") });
  }

  // Etsy'nin SERT başlık kuralları (form doğrulaması): 140 karakter,
  // en çok 3 TAMAMEN BÜYÜK kelime, $ ^ ` yasak, % : & en fazla birer kez.
  const ruleHits: string[] = [];
  if (p.title.length > 140) ruleHits.push(`${p.title.length}/140 karakter`);
  const capsWords = p.title
    .split(/\s+/)
    .filter((w) => w.length >= 2 && /^[A-Z0-9&%:]+$/.test(w) && /[A-Z]/.test(w));
  if (capsWords.length > 3) ruleHits.push(`${capsWords.length} BÜYÜK kelime`);
  const forbidden = p.title.match(/[$^`]/g);
  if (forbidden) ruleHits.push(`yasak karakter: ${[...new Set(forbidden)].join(" ")}`);
  for (const ch of ["%", ":", "&"]) {
    const n = p.title.split(ch).length - 1;
    if (n > 1) ruleHits.push(`'${ch}' ${n} kez`);
  }
  if (ruleHits.length > 0) {
    out.push({ key: "title_rules", detail: ruleHits.join(" · ") });
  }

  // Cılız künye kontrolü. Eşiğin NEDEN 110'dan 40'a indiği TITLE_MIN_LENGTH
  // tanımında: Etsy Ağu 2025'te kısa/okunur başlığa döndü, 110 hedefi hem
  // rehberliğe hem aşağıdaki title_long kuralına ters düşüyordu.
  if (p.title.length < TITLE_MIN_LENGTH) {
    out.push({
      key: "title_short",
      detail: `${p.title.length} karakter (künye için en az ${TITLE_MIN_LENGTH})`,
    });
  }

  const wordCount = p.title.split(/\s+/).filter(Boolean).length;
  if (wordCount > 15) {
    out.push({ key: "title_long", detail: `${wordCount} kelime` });
  }

  const desc = (p.description ?? "").trim();
  if (desc.length < 160) {
    out.push({
      key: "description_missing",
      detail: desc.length === 0 ? "açıklama yok" : `${desc.length} karakter`,
    });
  } else if (
    p.title.trim().length > 20 &&
    desc.toLowerCase().startsWith(p.title.trim().toLowerCase())
  ) {
    out.push({ key: "description_copies_title", detail: "açılış = başlık" });
  }

  if (p.numImages != null && p.numImages < LOW_IMAGE_THRESHOLD) {
    out.push({ key: "images_low", detail: `${p.numImages}/10 foto` });
  }

  if (hasHtmlEntities(p.title)) {
    out.push({ key: "title_entities", detail: "başlıkta ham entity" });
  }

  return out;
}
