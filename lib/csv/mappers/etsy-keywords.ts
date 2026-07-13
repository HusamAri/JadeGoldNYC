import { parseIntLoose } from "@/lib/csv/helpers";

/**
 * Etsy Stats "arama terimleri" CSV içe aktarımı — her listing'in EN ÇOK
 * tıklanan/ziyaret edilen kelimesini bulup rekabet araştırması için
 * `products.research_keyword`'e yazar.
 *
 * Etsy'nin dışa aktarım formatı görünüme göre değişir; bu yüzden mapper
 * esnektir: sütunlar otomatik tespit edilir, kullanıcı arayüzden override
 * edebilir (listing / kelime / metrik sütunları).
 */

export interface MappedKeywordRow {
  listingId: number | null;
  title: string | null;
  keyword: string;
  metric: number | null;
}

export interface KeywordMapResult {
  rows: MappedKeywordRow[];
  warnings: string[];
}

export interface KeywordColumnMap {
  listing?: string;
  keyword?: string;
  metric?: string;
}

const LISTING_ALIASES = [
  "Listing ID", "Listing Id", "listing_id", "Listing", "Listing URL", "URL",
  "Item", "Item Name", "Title", "Listing Title", "Product", "Ürün",
];
const KEYWORD_ALIASES = [
  "Search Term", "Search term", "Search Query", "Query", "Keyword",
  "Term", "Anahtar Kelime", "Arama Terimi",
];
const METRIC_ALIASES = [
  "Clicks", "Click", "Visits", "Views", "Impressions", "Orders",
  "Tıklama", "Ziyaret", "Görüntüleme",
];

function findHeader(headers: string[], aliases: string[]): string | undefined {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const a of aliases) {
    const i = lower.indexOf(a.toLowerCase());
    if (i >= 0) return headers[i];
  }
  for (const a of aliases) {
    const al = a.toLowerCase();
    const i = lower.findIndex((h) => h.includes(al));
    if (i >= 0) return headers[i];
  }
  return undefined;
}

/** Başlıklardan listing / kelime / metrik sütunlarını sezgisel tespit. */
export function autoDetectKeywordColumns(headers: string[]): KeywordColumnMap {
  return {
    listing: findHeader(headers, LISTING_ALIASES),
    keyword: findHeader(headers, KEYWORD_ALIASES),
    metric: findHeader(headers, METRIC_ALIASES),
  };
}

/** listing tanımlayıcıdan (id ya da URL) etsy_listing_id çıkarır. */
function extractListingId(raw: string): number | null {
  const m = raw.match(/(\d{6,})/);
  return m ? Number(m[1]) : null;
}

/**
 * Satırları listing bazında grupla, her listing için en yüksek metrikli
 * (metrik yoksa ilk) kelimeyi seç.
 */
export function mapEtsyKeywords(
  rows: Record<string, string>[],
  cols: KeywordColumnMap,
): KeywordMapResult {
  const warnings: string[] = [];
  if (!cols.listing || !cols.keyword) {
    return {
      rows: [],
      warnings: ["Listing ve Anahtar Kelime sütunları seçilmeli."],
    };
  }
  const best = new Map<string, MappedKeywordRow>();
  for (const row of rows) {
    const listingRaw = (row[cols.listing] ?? "").trim();
    const keyword = (row[cols.keyword] ?? "").trim();
    if (!listingRaw || !keyword) continue;
    const metric = cols.metric ? parseIntLoose(row[cols.metric] ?? "") : null;
    const listingId = extractListingId(listingRaw);
    const key = listingId ? `id:${listingId}` : `t:${listingRaw.toLowerCase()}`;
    const cur = best.get(key);
    if (!cur || (metric ?? 0) > (cur.metric ?? 0)) {
      best.set(key, {
        listingId,
        title: listingId ? null : listingRaw,
        keyword,
        metric,
      });
    }
  }
  if (best.size === 0) {
    warnings.push("Eşleşen satır bulunamadı — sütun seçimlerini kontrol edin.");
  }
  return { rows: [...best.values()], warnings };
}
