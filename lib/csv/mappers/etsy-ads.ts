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
  views?: string;
  orders?: string;
  clicks?: string;
  spend?: string;
  revenue?: string;
}

const LISTING_ALIASES = [
  "Listing", "Listing Title", "Title", "Listing ID", "Listing Id",
  "Listing URL", "Item", "Item Name", "Product", "İlan", "İlan Başlığı",
  "Ürün",
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
  return {
    listing: findHeader(headers, LISTING_ALIASES),
    views: findHeader(headers, VIEWS_ALIASES),
    orders: findHeader(headers, ORDERS_ALIASES),
    clicks: findHeader(headers, CLICKS_ALIASES),
    spend: findHeader(headers, SPEND_ALIASES),
    revenue: findHeader(headers, REVENUE_ALIASES),
  };
}

/**
 * Satırları MappedAdsRow'a çevirir. Listing (başlık) boş olan satırlar
 * atlanır; metrik sütunu seçilmemişse sayısal alanlar null, parasal
 * alanlar 0 olur.
 */
export function mapEtsyAds(
  rows: Record<string, string>[],
  cols: AdsColumnMap,
): AdsMapResult {
  const warnings: string[] = [];
  if (!cols.listing) {
    return {
      rows: [],
      warnings: ["Listing sütunu seçilmeli."],
    };
  }
  const out: MappedAdsRow[] = [];
  for (const row of rows) {
    const title = (row[cols.listing] ?? "").trim();
    if (!title) continue;
    out.push({
      title,
      views: cols.views ? parseIntLoose(row[cols.views] ?? "") : null,
      orders: cols.orders ? parseIntLoose(row[cols.orders] ?? "") : null,
      adsClicks: cols.clicks ? parseIntLoose(row[cols.clicks] ?? "") : null,
      adsSpendCents: cols.spend ? parseMoneyToCents(row[cols.spend] ?? "") : 0,
      adsRevenueCents: cols.revenue
        ? parseMoneyToCents(row[cols.revenue] ?? "")
        : 0,
    });
  }
  if (out.length === 0) {
    warnings.push("Eşleşen satır bulunamadı — sütun seçimlerini kontrol edin.");
  }
  return { rows: out, warnings };
}
