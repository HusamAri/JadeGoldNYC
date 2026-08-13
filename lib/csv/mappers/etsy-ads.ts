import { parseIntLoose } from "@/lib/csv/helpers";
import { parseMoneyToCents } from "@/lib/money";

/**
 * Etsy Ads (reklam) CSV içe aktarımı — her listing için görüntülenme,
 * sipariş, reklam tıklaması, reklam harcaması ve reklam geliri
 * metriklerini okur. Parasal değerler cent (minor unit) olarak saklanır.
 *
 * Etsy'nin dışa aktarım formatı dile/görünüme göre değişir; bu yüzden
 * mapper esnektir: sütunlar otomatik tespit edilir, kullanıcı arayüzden
 * override edebilir (listing / metrik sütunları).
 */

export interface MappedAdsRow {
  title: string;
  /**
   * Etsy listing kimliği — dışa aktarımda "Listing ID" sütunu varsa dolar.
   * Ürün eşleştirmesinde BAŞLIKTAN ÖNCE gelir: başlık Etsy'de elle
   * düzenlenebilir ve senkron paneli ezer (docs/eon/sku-integrity-audit),
   * kimlik ise sabittir.
   */
  listingId: number | null;
  views: number | null;
  orders: number | null;
  adsClicks: number | null;
  adsSpendCents: number;
  adsRevenueCents: number;
}

export interface AdsMapResult {
  rows: MappedAdsRow[];
  warnings: string[];
}

export interface AdsColumnMap {
  listing?: string;
  listingId?: string;
  views?: string;
  orders?: string;
  clicks?: string;
  spend?: string;
  revenue?: string;
}

const LISTING_ALIASES = [
  "Listing Title", "Title", "Listing", "Listing URL", "Item", "Item Name",
  "Product", "İlan Başlığı", "İlan", "Ürün",
];
/**
 * Kimlik sütunu başlıktan AYRI aranır. "Listing Title" ile "Listing ID"
 * ikisi de "listing" içerdiği için alias sıralaması önemli: başlık listesi
 * artık "Listing ID"yi içermez, kimlik listesi de "Title"ı içermez.
 */
const LISTING_ID_ALIASES = [
  "Listing ID", "Listing Id", "listing_id", "İlan No", "İlan Kimliği",
];
const VIEWS_ALIASES = [
  "Views", "View", "Impressions", "Görüntülenme", "Görüntüleme",
  "Gösterim", "Ziyaret",
];
const ORDERS_ALIASES = [
  "Orders", "Order", "Siparişler", "Sipariş", "Satış",
];
const CLICKS_ALIASES = [
  "Clicks", "Click", "Ad Clicks", "Ads Clicks", "Tıklama", "Tıklanma",
];
const SPEND_ALIASES = [
  "Spend", "Ad Spend", "Ads Spend", "Ad Cost", "Cost", "Harcama",
  "Reklam Harcaması",
];
const REVENUE_ALIASES = [
  "Revenue", "Ads Revenue", "Ad Revenue", "Getiri", "Reklam Getirisi",
  "Gelir", "Ciro",
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

/** Başlıklardan listing / görüntülenme / sipariş / reklam sütunlarını sezgisel tespit. */
export function autoDetectAdsColumns(headers: string[]): AdsColumnMap {
  const listingId = findHeader(headers, LISTING_ID_ALIASES);
  // Başlık sütunu ararken kimlik sütununu ele — `findHeader`'ın alt-dize
  // yedeği "Listing ID"yi "Listing" sanabilir ve başlık yerine numara okunur.
  const titleHeaders = headers.filter((h) => h !== listingId);
  return {
    listing: findHeader(titleHeaders, LISTING_ALIASES),
    listingId,
    views: findHeader(headers, VIEWS_ALIASES),
    orders: findHeader(headers, ORDERS_ALIASES),
    clicks: findHeader(headers, CLICKS_ALIASES),
    spend: findHeader(headers, SPEND_ALIASES),
    revenue: findHeader(headers, REVENUE_ALIASES),
  };
}

/** "4539777986" / "https://etsy.com/listing/4539777986/..." → 4539777986. */
function parseListingId(raw: string): number | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/(\d{6,})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Satırları MappedAdsRow'a çevirir. Başlık ya da listing kimliği taşımayan
 * satırlar atlanır; metrik sütunu seçilmemişse sayısal alanlar null, parasal
 * alanlar 0 olur. Kimlik sütunu seçiliyse `listingId` dolar ve içe aktarımda
 * eşleştirme onun üzerinden yapılır.
 */
export function mapEtsyAds(
  rows: Record<string, string>[],
  cols: AdsColumnMap,
): AdsMapResult {
  const warnings: string[] = [];
  if (!cols.listing && !cols.listingId) {
    return {
      rows: [],
      warnings: ["Listing başlığı ya da listing kimliği sütunu seçilmeli."],
    };
  }
  const out: MappedAdsRow[] = [];
  let noId = 0;
  for (const row of rows) {
    const title = cols.listing ? (row[cols.listing] ?? "").trim() : "";
    const listingId = cols.listingId
      ? parseListingId(row[cols.listingId] ?? "")
      : null;
    if (!title && listingId == null) continue;
    if (cols.listingId && listingId == null) noId += 1;
    out.push({
      title,
      listingId,
      views: cols.views ? parseIntLoose(row[cols.views] ?? "") : null,
      orders: cols.orders ? parseIntLoose(row[cols.orders] ?? "") : null,
      adsClicks: cols.clicks ? parseIntLoose(row[cols.clicks] ?? "") : null,
      adsSpendCents: cols.spend ? parseMoneyToCents(row[cols.spend] ?? "") : 0,
      adsRevenueCents: cols.revenue
        ? parseMoneyToCents(row[cols.revenue] ?? "")
        : 0,
    });
  }
  if (noId > 0) {
    warnings.push(
      `${noId} satırda listing kimliği okunamadı — o satırlar başlıkla eşleşecek.`,
    );
  }
  if (!cols.listingId) {
    warnings.push(
      "Kimlik sütunu seçilmedi — eşleştirme başlıkla yapılır. Etsy'de başlık " +
        "değişirse eşleşme kayar; dışa aktarımda «Listing ID» varsa onu seçin.",
    );
  }
  if (out.length === 0) {
    warnings.push("Eşleşen satır bulunamadı — sütun seçimlerini kontrol edin.");
  }
  return { rows: out, warnings };
}
