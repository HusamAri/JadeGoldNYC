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
  materials: string[] | null;
  numImages: number | null;
}

export type AuditCheckKey =
  | "tags_missing"
  | "tags_duplicate"
  | "title_repeat"
  | "materials_missing"
  | "description_missing"
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
    sourceUrl: "https://www.etsy.com/seller-handbook/article/371398403109",
  },
  {
    key: "tags_duplicate",
    severity: "bilgi",
    title: (n) => `${n} listing'de yinelenen tag var`,
    hint: "Aynı (ya da yalnız çoğul eki farklı) tag'i iki kez yazmak ikinci slotu çöpe atar — Etsy zaten tekil/çoğul eşleşmesini kendisi yapar. Yinelenen tag'i sil, yerine yeni bir arama ifadesi ekle.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Tag'leri düzenle",
    sourceLabel: "Etsy Seller Handbook — Keywords 101",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/371398403109",
  },
  {
    key: "title_repeat",
    severity: "bilgi",
    title: (n) => `${n} listing başlığında tekrarlı kelime var`,
    hint: "Aynı kelimeyi başlıkta tekrar etmek sıralamaya HİÇBİR katkı yapmaz — Etsy kelimeyi bir kez sayar. Tekrarlar 140 karakterlik başlık bütçesini yiyor; tekrar yerine yeni bir anahtar ifade yaz (en önemli kelimeler başa).",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Başlığı düzenle",
    sourceLabel: "Etsy Seller Handbook — Keywords 101",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/371398403109",
  },
  {
    key: "materials_missing",
    severity: "onemli",
    title: (n) => `${n} listing'de malzeme (materials) boş`,
    hint: "Malzeme ve nitelik alanları aramada tag gibi eşleşir — boş bırakınca '14k solid gold' arayan alıcıya görünmüyorsun. Malzemeleri doldur; alıcı filtrelerinde de yer alırsın.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Malzemeleri doldur",
    sourceLabel: "Etsy Help — How Etsy Search Works (listing quality & relevancy)",
    sourceUrl: "https://help.etsy.com/hc/en-us/articles/115015745428",
  },
  {
    key: "description_missing",
    severity: "onemli",
    title: (n) => `${n} listing'in açıklaması boş ya da çok kısa`,
    hint: "Etsy araması 2022'den beri açıklamaları da tarıyor; boş/kısa açıklama hem eşleşme kaybettirir hem alıcı güvenini düşürür. İlk cümlelere ürünün anahtar kelimelerini doğal biçimde yerleştir.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Açıklama yaz",
    sourceLabel: "Etsy Seller Handbook — descriptions in Etsy search",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/1017850985674",
  },
  {
    key: "images_low",
    severity: "bilgi",
    title: (n) => `${n} listing ${LOW_IMAGE_THRESHOLD}'ten az fotoğraf kullanıyor`,
    hint: "Etsy 10 foto slotu verir ve çok açılı fotoğrafın dönüşümü artırdığını söyler — az fotoğraf, bakan alıcının 'emin olamayıp' çıkması demek. Detay/ölçek/kullanım karesi ekleyerek 10 slota yaklaş.",
    fixHref: (id) => `/tasarimlar/listing/${id}`,
    fixLabel: "Listing'i aç",
    sourceLabel: "Etsy Seller Handbook — 5 Ways to Improve Your Listing Photos",
    sourceUrl: "https://www.etsy.com/seller-handbook/article/361776103175",
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

  const repeats = findTitleRepeats(p.title);
  if (repeats.length > 0) {
    out.push({ key: "title_repeat", detail: repeats.join(" · ") });
  }

  if ((p.materials ?? []).filter((m) => m.trim()).length === 0) {
    out.push({ key: "materials_missing", detail: "0/13 malzeme" });
  }

  const desc = (p.description ?? "").trim();
  if (desc.length < 160) {
    out.push({
      key: "description_missing",
      detail: desc.length === 0 ? "açıklama yok" : `${desc.length} karakter`,
    });
  }

  if (p.numImages != null && p.numImages < LOW_IMAGE_THRESHOLD) {
    out.push({ key: "images_low", detail: `${p.numImages}/10 foto` });
  }

  if (hasHtmlEntities(p.title)) {
    out.push({ key: "title_entities", detail: "başlıkta ham entity" });
  }

  return out;
}
