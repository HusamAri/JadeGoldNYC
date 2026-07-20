import { createClient } from "@/lib/supabase/server";
import { fetchAllPages } from "@/lib/db/queries/listings";

/**
 * ETSY ADS — API (LEDGER) VERİSİ, org-bağımsız.
 *
 * Etsy Open API v3 reklam panosu verisi (listing başına tık / harcama / ROAS)
 * SUNMAZ — canlı OAS (76 uç) ve resmi tartışmalarla doğrulandı. Ama ödeme
 * hesabı ledger'ı (getShopPaymentAccountLedgerEntries) reklam ücretlerini
 * kayıt kayıt verir:
 *   - `prolist%`         → Etsy Ads (onsite) GÜNLÜK harcaması — mağaza geneli
 *   - `offsite_ads_fee%` → Offsite Ads ücreti — SİPARİŞ referanslı
 *                          (reference_type='receipt' → sales.etsy_receipt_id)
 *
 * Senkron (lib/etsy/sync.ts ledger fazı) bu kayıtları Etsy bağlanan HER org
 * için zaten çekiyor; bu modül onlardan GERÇEK son-30-gün takvim penceresini
 * üretir. Elle giriş / CSV istemez: Jade, EON ve sonraki her şirket için
 * Ayarlar → Etsy bağlantısı yeterlidir.
 *
 * Para kuralı: farklı kurlar tek sayıya karıştırılmaz — penceredeki baskın
 * kur toplanır, diğer kurda kalan kayıt sayısı ayrıca bildirilir.
 */

/** Gerçek takvim penceresi (gün) — "son 30" ETİKETİ değil, tarih filtresi. */
export const ADS_LEDGER_WINDOW_DAYS = 30;

export interface AdsLedgerDay {
  /** YYYY-MM-DD */
  date: string;
  onsiteCents: number;
  offsiteCents: number;
}

export interface OffsiteOrderRow {
  orderNo: string;
  orderDate: string | null;
  status: string | null;
  feeCents: number;
  /** Siparişin cirosu (grand_total, yoksa item_total). */
  revenueCents: number;
}

export interface OffsiteListingRow {
  etsyListingId: number | null;
  title: string;
  orders: number;
  units: number;
  /** Offsite-atıflı siparişlerdeki kalem toplamı (line_total). */
  revenueCents: number;
}

export interface AdsLedgerOverview {
  /** Etsy bağlantısı 'connected' mı? Değilse kalan alanlar boş kümedir. */
  connected: boolean;
  window: { fromIso: string; toIso: string };
  /** Toplamların kuru (penceredeki baskın kur; kayıt yoksa org varsayılanı). */
  currency: string;
  /** Baskın kur DIŞINDA kalan (toplama katılmayan) ledger kaydı sayısı. */
  otherCurrencyCount: number;
  /** Etsy Ads (onsite, prolist) net harcaması — pencere toplamı. */
  onsiteSpendCents: number;
  /** prolist kaydı düşen gün sayısı. */
  onsiteDays: number;
  /** Offsite Ads net ücreti — pencere toplamı. */
  offsiteFeeCents: number;
  /** Offsite-atıflı sipariş sayısı / cirosu (ledger→receipt→sales bağı). */
  offsiteOrderCount: number;
  offsiteRevenueCents: number;
  /** Gün bazlı seri (yalnız kaydı olan günler; tarih azalan). */
  days: AdsLedgerDay[];
  /** Offsite-atıflı siparişler (tarih azalan). */
  offsiteOrders: OffsiteOrderRow[];
  /** Offsite-atıflı siparişlerin listing kırılımı (ciro azalan). */
  offsiteListings: OffsiteListingRow[];
}

interface LedgerRow {
  ledger_type: string | null;
  reference_type: string | null;
  reference_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  entry_date: string | null;
}

const EMPTY = (
  connected: boolean,
  window: { fromIso: string; toIso: string },
  currency: string,
): AdsLedgerOverview => ({
  connected,
  window,
  currency,
  otherCurrencyCount: 0,
  onsiteSpendCents: 0,
  onsiteDays: 0,
  offsiteFeeCents: 0,
  offsiteOrderCount: 0,
  offsiteRevenueCents: 0,
  days: [],
  offsiteOrders: [],
  offsiteListings: [],
});

export async function getAdsLedgerOverview(
  orgId: string,
): Promise<AdsLedgerOverview> {
  const supabase = await createClient();

  const to = new Date();
  const from = new Date(to.getTime() - ADS_LEDGER_WINDOW_DAYS * 86_400_000);
  const window = { fromIso: from.toISOString(), toIso: to.toISOString() };

  const [statusRes, orgRes, entries] = await Promise.all([
    supabase.rpc("etsy_connection_status", { p_org: orgId }),
    supabase
      .from("organizations")
      .select("default_currency")
      .eq("id", orgId)
      .maybeSingle(),
    fetchAllPages<LedgerRow>((fromRow, toRow) =>
      supabase
        .from("etsy_ledger_entries")
        .select(
          "ledger_type, reference_type, reference_id, amount_cents, currency, entry_date",
        )
        .eq("org_id", orgId)
        .gte("entry_date", window.fromIso)
        // PostgREST or() içinde ilike joker karakteri '*'dir (URL'de '%' değil).
        .or("ledger_type.ilike.prolist*,ledger_type.ilike.offsite_ads_fee*")
        .order("id", { ascending: true })
        .range(fromRow, toRow),
    ).catch((e: unknown) => {
      console.error(
        "[reklamlar] ledger sorgusu:",
        e instanceof Error ? e.message : e,
      );
      return [] as LedgerRow[];
    }),
  ]);
  if (orgRes.error)
    console.error("[reklamlar] org sorgusu:", orgRes.error.message);

  const statusRow = Array.isArray(statusRes.data)
    ? statusRes.data[0]
    : statusRes.data;
  const connected =
    (statusRow as { status?: string } | null)?.status === "connected";
  const fallbackCurrency =
    (orgRes.data as { default_currency: string | null } | null)
      ?.default_currency ?? "USD";

  const rows = entries.filter((e) => e.amount_cents != null && e.entry_date);
  if (rows.length === 0) return EMPTY(connected, window, fallbackCurrency);

  // Baskın kur: pencerede en çok kayıt taşıyan kur toplanır, kalanı sayılır.
  const byCurrency = new Map<string, number>();
  for (const r of rows) {
    const c = r.currency ?? fallbackCurrency;
    byCurrency.set(c, (byCurrency.get(c) ?? 0) + 1);
  }
  const currency = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0][0];
  let otherCurrencyCount = 0;

  // Ücretler ledger'da NEGATİF tutardır; iade/kredi pozitif gelir. Net için
  // -sum(amount) alınır (rebuild_etsy_ledger_costs ile aynı semantik).
  const dayMap = new Map<string, AdsLedgerDay>();
  const feeByReceipt = new Map<string, number>();
  let onsiteSpendCents = 0;
  let offsiteFeeCents = 0;
  let onsiteDays = 0;

  for (const r of rows) {
    if ((r.currency ?? fallbackCurrency) !== currency) {
      otherCurrencyCount += 1;
      continue;
    }
    const isOnsite = (r.ledger_type ?? "")
      .toLowerCase()
      .startsWith("prolist");
    const net = -(r.amount_cents ?? 0);
    const date = (r.entry_date as string).slice(0, 10);
    const day = dayMap.get(date) ?? { date, onsiteCents: 0, offsiteCents: 0 };
    if (isOnsite) {
      onsiteSpendCents += net;
      day.onsiteCents += net;
    } else {
      offsiteFeeCents += net;
      day.offsiteCents += net;
      if (r.reference_type === "receipt" && r.reference_id) {
        feeByReceipt.set(
          r.reference_id,
          (feeByReceipt.get(r.reference_id) ?? 0) + net,
        );
      }
    }
    dayMap.set(date, day);
  }
  const days = [...dayMap.values()].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  for (const d of days) if (d.onsiteCents > 0) onsiteDays += 1;

  // Offsite atıf: ücret kaydının reference_id'si sipariş (receipt) — panel
  // satışına bağla (0040 deseni: s.etsy_receipt_id::text = reference_id).
  // Ücreti tamamen iade edilmiş (net<=0) siparişler atıf listesine girmez.
  const receiptIds = [...feeByReceipt.entries()]
    .filter(([, fee]) => fee > 0)
    .map(([id]) => Number(id))
    .filter((n) => Number.isFinite(n));

  const offsiteOrders: OffsiteOrderRow[] = [];
  type ListingAgg = OffsiteListingRow & { _saleIds: Set<string> };
  const listingAgg = new Map<string, ListingAgg>();
  let offsiteRevenueCents = 0;

  const CHUNK = 200;
  for (let i = 0; i < receiptIds.length; i += CHUNK) {
    const part = receiptIds.slice(i, i + CHUNK);
    const { data: saleRows, error: salesErr } = await supabase
      .from("sales")
      .select(
        "id, etsy_receipt_id, order_no, order_date, status, grand_total_cents, item_total_cents, currency",
      )
      .eq("org_id", orgId)
      .in("etsy_receipt_id", part);
    if (salesErr) {
      console.error("[reklamlar] offsite satış sorgusu:", salesErr.message);
      continue;
    }
    const sales = (saleRows ?? []) as {
      id: string;
      etsy_receipt_id: number;
      order_no: string | null;
      order_date: string | null;
      status: string | null;
      grand_total_cents: number | null;
      item_total_cents: number | null;
      currency: string | null;
    }[];
    const saleIds = sales.map((s) => s.id);

    for (const s of sales) {
      const fee = feeByReceipt.get(String(s.etsy_receipt_id)) ?? 0;
      const revenue =
        (s.currency ?? currency) === currency
          ? (s.grand_total_cents || s.item_total_cents || 0)
          : 0;
      offsiteRevenueCents += revenue;
      offsiteOrders.push({
        orderNo: s.order_no ?? String(s.etsy_receipt_id),
        orderDate: s.order_date,
        status: s.status,
        feeCents: fee,
        revenueCents: revenue,
      });
    }

    if (saleIds.length > 0) {
      const { data: itemRows, error: itemsErr } = await supabase
        .from("sale_items")
        .select("sale_id, etsy_listing_id, title, quantity, line_total_cents")
        .eq("org_id", orgId)
        .in("sale_id", saleIds);
      if (itemsErr) {
        console.error(
          "[reklamlar] offsite kalem sorgusu:",
          itemsErr.message,
        );
        continue;
      }
      for (const it of (itemRows ?? []) as {
        sale_id: string;
        etsy_listing_id: number | null;
        title: string | null;
        quantity: number | null;
        line_total_cents: number | null;
      }[]) {
        const key =
          it.etsy_listing_id != null
            ? `l:${it.etsy_listing_id}`
            : `t:${it.title ?? "—"}`;
        const agg =
          listingAgg.get(key) ??
          ({
            etsyListingId: it.etsy_listing_id,
            title: it.title ?? "—",
            orders: 0,
            units: 0,
            revenueCents: 0,
            _saleIds: new Set<string>(),
          } satisfies ListingAgg);
        if (!agg._saleIds.has(it.sale_id)) {
          agg._saleIds.add(it.sale_id);
          agg.orders += 1;
        }
        agg.units += it.quantity ?? 1;
        agg.revenueCents += it.line_total_cents ?? 0;
        listingAgg.set(key, agg);
      }
    }
  }

  offsiteOrders.sort((a, b) =>
    (b.orderDate ?? "").localeCompare(a.orderDate ?? ""),
  );
  const offsiteListings = [...listingAgg.values()]
    .map((row) => {
      const { _saleIds, ...rest } = row;
      void _saleIds;
      return rest;
    })
    .sort((a, b) => b.revenueCents - a.revenueCents);

  return {
    connected,
    window,
    currency,
    otherCurrencyCount,
    onsiteSpendCents,
    onsiteDays,
    offsiteFeeCents,
    offsiteOrderCount: offsiteOrders.length,
    offsiteRevenueCents,
    days,
    offsiteOrders,
    offsiteListings,
  };
}
