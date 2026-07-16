import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { logAudit } from "@/lib/audit";
import { rebuildGoldCostsBulk } from "@/lib/gold-cost-entry";
import {
  etsyMoneyToCents,
  type EtsyListResponse,
  type EtsyReceipt,
  type EtsyListing,
  type EtsyReview,
  type EtsyLedgerEntry,
  type EtsyShop,
  type EtsyShopSection,
  type EtsyShippingProfile,
} from "@/lib/etsy/types";

const PAGE = 100;
// Tek çağrıda harcanacak süre bütçesi (fonksiyon 60sn; ~20sn pay bırak).
const DEFAULT_BUDGET_MS = 40_000;
// Ham ledger için tarih penceresi alt sınırı (2015-01-01). Etsy min/max_created ister.
const LEDGER_MIN_CREATED = 1420070400;
// Etsy ledger min_created↔max_created arası en fazla 31 gün; 30 günle pencerele.
const LEDGER_WINDOW_S = 2_592_000;
// Artımlı turlarda en son kayıttan geriye örtüşme payı (7 gün) — kayıp olmasın.
const LEDGER_OVERLAP_S = 604_800;

export interface SyncProgress {
  done: boolean;
  status: "running" | "done" | "error";
  phase:
    | "sales"
    | "listings"
    | "listings_all"
    | "reviews"
    | "ledger"
    | "extras"
    | "done";
  sales: number;
  items: number;
  products: number;
  reviews: number;
  ledger: number;
  error?: string;
}

interface CursorRow {
  sync_status: string | null;
  sync_phase: string | null;
  sync_offset: number | null;
  sync_sales: number | null;
  sync_items: number | null;
  sync_products: number | null;
  sync_reviews: number | null;
  sync_ledger: number | null;
  sync_ledger_until: number | null;
  sync_ledger_floor: number | null;
  ledger_backfilled: boolean | null;
  last_sync_at: string | null;
  sync_started_at: string | null;
}

/**
 * Etsy senkronunu PARÇA PARÇA ("domino") ilerletir: tek çağrıda yalnızca bir
 * süre bütçesi kadar sayfa işler, ilerlemeyi (faz + offset + sayaçlar) her
 * sayfada etsy_connection'a yazar ve bütçe dolunca `done:false` ile döner.
 * Çağıran taraf (buton döngüsü veya cron) bitene kadar tekrar tetikler →
 * hiçbir tek çağrı 60sn'yi aşmaz, zaman aşımı yapısal olarak imkânsızdır.
 *
 * Her sayfa TEK toplu upsert ile yazılır; getShopReceipts kalemleri (transactions)
 * gömülü döndürdüğünden sipariş başına ayrı istek yapılmaz.
 */
export async function advanceEtsySync(
  orgId: string,
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<SyncProgress> {
  const startedAt = Date.now();
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const admin = createAdminClient();

  const { data } = await admin
    .from("etsy_connection")
    .select(
      "sync_status, sync_phase, sync_offset, sync_sales, sync_items, sync_products, sync_reviews, sync_ledger, sync_ledger_until, sync_ledger_floor, ledger_backfilled, last_sync_at, sync_started_at",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const cur = data as CursorRow | null;

  // Yeni tur mu? (idle/done/error veya faz yok → baştan başlat.)
  const resuming =
    cur?.sync_status === "running" &&
    cur.sync_phase != null &&
    cur.sync_phase !== "done";

  let phase: SyncProgress["phase"] = resuming
    ? (cur!.sync_phase as SyncProgress["phase"])
    : "sales";
  let offset = resuming ? (cur!.sync_offset ?? 0) : 0;
  const counts = {
    sales: resuming ? (cur!.sync_sales ?? 0) : 0,
    items: resuming ? (cur!.sync_items ?? 0) : 0,
    products: resuming ? (cur!.sync_products ?? 0) : 0,
    reviews: resuming ? (cur!.sync_reviews ?? 0) : 0,
    ledger: resuming ? (cur!.sync_ledger ?? 0) : 0,
  };
  // Ledger fazı 30 günlük pencerelerle geriye işler; işlenen pencerenin üst
  // sınırı (max_created) imleçte tutulur. Yeni turda sıfırlanır (null → now).
  let ledgerUntil: number | null = resuming
    ? (cur!.sync_ledger_until ?? null)
    : null;
  let ledgerFloor: number | null = resuming
    ? (cur!.sync_ledger_floor ?? null)
    : null;
  // İlk tam backfill bir kez yapılır; sonrası artımlı. Bu bayrak turlar arası kalıcı.
  const ledgerBackfilled = cur?.ledger_backfilled ?? false;

  // Sales fazı: ilk tam tarama (last_sync_at yok) tüm geçmişi; sonraki turlar
  // artımlı. Pencere MIN_LAST_MODIFIED ile açılır (min_created DEĞİL): durumu
  // sonradan değişen eski sipariş (kargolandı → completed, iptal → cancelled)
  // ancak last_modified penceresine girer; created penceresi bu güncellemeleri
  // yapısal olarak kaçırıyordu. 1 saat örtüşme payı korunur.
  const minLastModified = cur?.last_sync_at
    ? Math.floor(new Date(cur.last_sync_at).getTime() / 1000) - 3600
    : undefined;

  // Listing mutabakatının tarama işareti: bu turun başlangıcı. Taramada
  // görülen her listing upsert'lenir → set_updated_at trigger'ı updated_at'i
  // bu işaretin SONRASINA taşır; işaretten eski kalanlar Etsy'de yok demektir.
  let syncStartedAtIso = resuming ? cur?.sync_started_at ?? null : null;

  if (!resuming) {
    syncStartedAtIso = new Date().toISOString();
    await admin
      .from("etsy_connection")
      .update({
        sync_status: "running",
        sync_phase: "sales",
        sync_offset: 0,
        sync_sales: 0,
        sync_items: 0,
        sync_products: 0,
        sync_reviews: 0,
        sync_ledger: 0,
        sync_ledger_until: null,
        sync_ledger_floor: null,
        sync_error: null,
        sync_started_at: syncStartedAtIso,
        sync_updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId);
  }

  const persist = (extra: Record<string, unknown> = {}) =>
    admin
      .from("etsy_connection")
      .update({
        sync_phase: phase,
        sync_offset: offset,
        sync_sales: counts.sales,
        sync_items: counts.items,
        sync_products: counts.products,
        sync_reviews: counts.reviews,
        sync_ledger: counts.ledger,
        sync_updated_at: new Date().toISOString(),
        ...extra,
      })
      .eq("org_id", orgId);

  try {
    while (phase !== "done") {
      if (Date.now() - startedAt > budgetMs) {
        await persist();
        return { done: false, status: "running", phase, ...counts };
      }

      if (phase === "sales") {
        const page = await client.get<EtsyListResponse<EtsyReceipt>>(
          etsyPaths.receipts(shopId),
          { limit: PAGE, offset, min_last_modified: minLastModified },
        );
        const results = page.results ?? [];
        if (results.length > 0) {
          const n = await upsertSalesPage(admin, orgId, results);
          counts.sales += results.length;
          counts.items += n;
        }
        if (results.length < PAGE) {
          // Sales tamamlandı → artımlı imleci yaz, listings'e geç.
          phase = "listings";
          offset = 0;
          await persist({ last_sync_at: new Date().toISOString() });
        } else {
          offset += PAGE;
          await persist();
        }
      } else if (phase === "listings") {
        const page = await client.get<EtsyListResponse<EtsyListing>>(
          etsyPaths.shopListings(shopId),
          { limit: PAGE, offset, state: "active", includes: "Images" },
        );
        const results = page.results ?? [];
        // getListingsByShop?state=active geçici "edit" satırlarını da dönebiliyor;
        // yalnız gerçekten aktif olanları yaz/say. Sayfalama ham uzunlukla.
        const active = results.filter((l) => l.state === "active");
        if (active.length > 0) {
          await upsertListingsPage(admin, orgId, active);
          counts.products += active.length;
        }
        if (results.length < PAGE) {
          // Aktif listeler bitti → diğer durumları da çek (tam envanter).
          phase = "listings_all";
          offset = 0;
        } else {
          offset += PAGE;
        }
        await persist();
      } else if (phase === "listings_all") {
        // Aktif OLMAYAN listing durumları — API state başına ayrı sayfalama
        // ister; durum imleci offset'e kodlanır (stateIdx*1e6 + sayfaOfseti).
        const STATES = ["inactive", "sold_out", "draft", "expired"] as const;
        const stateIdx = Math.floor(offset / 1_000_000);
        const pageOffset = offset % 1_000_000;
        if (stateIdx >= STATES.length) {
          // TAM envanter taraması bitti (active + inactive/sold_out/draft/
          // expired). Genel kural: Etsy nihai kaynak — taramada karşılığı
          // olmayan listing panelden de silinir. Yalnız tam tarama sonunda
          // çalışır; kısmi/yarıda kalan tarama asla silme tetiklemez.
          await reconcileUnmatchedListings(admin, orgId, syncStartedAtIso);
          phase = "reviews";
          offset = 0;
          await persist();
        } else {
          const st = STATES[stateIdx];
          const page = await client.get<EtsyListResponse<EtsyListing>>(
            etsyPaths.shopListings(shopId),
            { limit: PAGE, offset: pageOffset, state: st, includes: "Images" },
          );
          const results = page.results ?? [];
          if (results.length > 0) {
            await upsertListingsPage(admin, orgId, results);
            counts.products += results.length;
          }
          offset =
            results.length < PAGE
              ? (stateIdx + 1) * 1_000_000 // sıradaki duruma geç
              : stateIdx * 1_000_000 + pageOffset + PAGE;
          await persist();
        }
      } else if (phase === "reviews") {
        const page = await client.get<EtsyListResponse<EtsyReview>>(
          etsyPaths.reviews(shopId),
          { limit: PAGE, offset },
        );
        const results = page.results ?? [];
        if (results.length > 0) {
          await upsertReviewsPage(admin, orgId, results);
          counts.reviews += results.length;
        }
        if (results.length < PAGE) {
          // Yorum senkronu bitti → Etsy'de (alıcı tarafından) yanıtımızdan
          // sonra değiştirilen yorumları panelde tekrar "yeni"ye çek. Hata
          // senkronu bozmasın (yorumlar zaten yazıldı).
          try {
            await admin.rpc("reconcile_reviews_after_sync", {
              p_org_id: orgId,
            });
          } catch {
            // yok say
          }
          phase = "ledger";
          offset = 0;
        } else {
          offset += PAGE;
        }
        await persist();
      } else if (phase === "ledger") {
        // ledger — Etsy ücret/komisyon/reklam kayıtları. 30 günlük pencerelerle
        // geriye doğru tara (Etsy 31 gün sınırı). İlk tur tüm geçmişi backfill
        // eder; sonraki turlar artımlı (yalnız en son kayıttan beri).
        if (ledgerUntil == null) {
          ledgerUntil = Math.floor(Date.now() / 1000);
          if (ledgerFloor == null) {
            if (ledgerBackfilled) {
              const { data: m } = await admin
                .from("etsy_ledger_entries")
                .select("created_timestamp")
                .eq("org_id", orgId)
                .order("created_timestamp", { ascending: false })
                .limit(1)
                .maybeSingle();
              const maxTs = (m as { created_timestamp: number } | null)
                ?.created_timestamp;
              ledgerFloor = maxTs
                ? maxTs - LEDGER_OVERLAP_S
                : LEDGER_MIN_CREATED;
            } else {
              ledgerFloor = LEDGER_MIN_CREATED;
            }
          }
          await persist({
            sync_ledger_until: ledgerUntil,
            sync_ledger_floor: ledgerFloor,
          });
        }
        const floor = ledgerFloor ?? LEDGER_MIN_CREATED;
        if (ledgerUntil <= floor) {
          phase = "extras";
          offset = 0;
          // Tam backfill ilk kez bitti → bayrağı kalıcılaştır (sonrası artımlı).
          const justBackfilled =
            !ledgerBackfilled && floor <= LEDGER_MIN_CREATED;
          await persist(justBackfilled ? { ledger_backfilled: true } : {});
        } else {
          const minCreatedWin = Math.max(ledgerUntil - LEDGER_WINDOW_S, floor);
          const page = await client.get<EtsyListResponse<EtsyLedgerEntry>>(
            etsyPaths.ledgerEntries(shopId),
            {
              limit: PAGE,
              offset,
              min_created: minCreatedWin,
              max_created: ledgerUntil,
            },
          );
          const results = page.results ?? [];
          if (results.length > 0) {
            await upsertLedgerPage(admin, orgId, results);
            counts.ledger += results.length;
          }
          if (results.length < PAGE) {
            // Bu pencere bitti → daha eski pencereye geç (üst kontrol bitirir).
            ledgerUntil = minCreatedWin;
            offset = 0;
          } else {
            offset += PAGE;
          }
          await persist({ sync_ledger_until: ledgerUntil });
        }
      } else {
        // extras — API'nin sunduğu kalan her şey, tek geçişte:
        // (1) getShop → günlük mağaza sağlık fotoğrafı,
        // (2) mağaza bölümleri, (3) kargo profilleri,
        // (4) listing views/favori GÜNLÜK fotoğrafı (tarihçeyi panel biriktirir).
        await syncShopExtras(admin, client, orgId, shopId);
        phase = "done";
        await persist();
      }
    }

    // Ledger bitti → Etsy ücret/komisyon/reklamı costs'a yansıt (idempotent).
    // Hata senkronu bozmasın (siparişler zaten yazıldı).
    try {
      await admin.rpc("rebuild_etsy_ledger_costs", { p_org_id: orgId });
    } catch {
      // yok say
    }

    // sales.etsy_fees_cents'i ledger'dan gerçek per-order ücretle doldur (idempotent).
    try {
      await admin.rpc("rebuild_sales_etsy_fees", { p_org_id: orgId });
    } catch {
      // yok say
    }

    // Altın maliyet kalemlerini otomatik oluştur (idempotent, küme-tabanlı RPC —
    // on binlerce satışta Node döngüsü cron bütçesine sığmıyordu). Ağırlık
    // (SKU→varyant) girildikçe her senkronda kendiliğinden dolar.
    try {
      await rebuildGoldCostsBulk(admin, orgId);
    } catch {
      // yok say
    }

    // İlk senkronda sales fazı listings'ten önce çalıştığı için product_id
    // eşlemesi boş kalabilir; products doldukça (veya sıra ne olursa olsun)
    // kendini onaran bağ tamiri (idempotent). Hata senkronu bozmasın.
    try {
      await admin.rpc("rebuild_sale_item_product_links", { p_org_id: orgId });
    } catch {
      // yok say
    }

    await persist({ sync_status: "done" });
    await logAudit(admin, {
      orgId,
      action: "etsy.sync",
      entityType: "sales",
      summary: `Etsy senkronizasyonu tamamlandı: ${counts.sales} sipariş, ${counts.items} kalem`,
      source: "etsy",
      actorLabel: "Etsy Sync",
    });
    return { done: true, status: "done", phase: "done", ...counts };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Senkron hatası";
    await persist({ sync_status: "error", sync_error: message });
    return { done: true, status: "error", phase, ...counts, error: message };
  }
}

/**
 * Etsy receipt.status → panel satış durumu (0005/0080 sözlüğü).
 * Etsy enum'u: open · payment processing · paid · completed · canceled ·
 * fully refunded · partially refunded. Panel: tek-kelime + çift-L 'cancelled'.
 */
export function mapReceiptStatus(r: EtsyReceipt): string {
  switch ((r.status ?? "").toLowerCase()) {
    case "open":
      return "open";
    case "payment processing":
      return "processing";
    case "paid":
      // Kargolanmış ama henüz "completed" damgalanmamış sipariş → shipped.
      return r.is_shipped ? "shipped" : "paid";
    case "completed":
      return "completed";
    case "canceled":
      return "cancelled";
    case "fully refunded":
      return "refunded";
    case "partially refunded":
      return "partially_refunded";
    default:
      // Bilinmeyen/boş durum: eski davranışla uyumlu güvenli varsayılan.
      return "completed";
  }
}

/** Bir sayfa siparişi + gömülü kalemleri toplu upsert eder; kalem sayısını döner. */
export async function upsertSalesPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyReceipt[],
): Promise<number> {
  const saleRows = results.map((r) => ({
    org_id: orgId,
    source: "etsy",
    etsy_receipt_id: r.receipt_id,
    order_no: String(r.receipt_id),
    buyer_name: r.name ?? null,
    buyer_email: r.buyer_email ?? null,
    status: mapReceiptStatus(r),
    order_date: new Date(
      (r.created_timestamp ?? Date.now() / 1000) * 1000,
    ).toISOString(),
    ship_country: r.country_iso ?? null,
    item_total_cents: etsyMoneyToCents(r.subtotal),
    shipping_cents: etsyMoneyToCents(r.total_shipping_cost),
    tax_cents: etsyMoneyToCents(r.total_tax_cost),
    discount_cents: etsyMoneyToCents(r.discount_amt),
    grand_total_cents: etsyMoneyToCents(r.grandtotal),
    currency: r.grandtotal?.currency_code ?? "USD",
  }));

  const { data: upserted, error: salesErr } = await admin
    .from("sales")
    .upsert(saleRows, { onConflict: "org_id,etsy_receipt_id" })
    .select("id, etsy_receipt_id");
  if (salesErr) throw new Error(`sales upsert: ${salesErr.message}`);

  const idByReceipt = new Map<number, string>();
  for (const row of (upserted ?? []) as {
    id: string;
    etsy_receipt_id: number;
  }[]) {
    idByReceipt.set(row.etsy_receipt_id, row.id);
  }

  // transaction.listing_id → products.id: altın maliyet motoru ürünün
  // gerçek açıklamasına (ağırlık burada yazılı) yalnız bu bağ üzerinden erişir.
  const { data: productRows } = await admin
    .from("products")
    .select("id, etsy_listing_id")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null);
  const productIdByListing = new Map<number, string>();
  for (const p of (productRows ?? []) as {
    id: string;
    etsy_listing_id: number;
  }[]) {
    productIdByListing.set(p.etsy_listing_id, p.id);
  }

  const itemRows = results.flatMap((r) => {
    const saleId = idByReceipt.get(r.receipt_id);
    if (!saleId) return [];
    const currency = r.grandtotal?.currency_code ?? "USD";
    return (r.transactions ?? []).map((t) => ({
      org_id: orgId,
      sale_id: saleId,
      product_id: t.listing_id
        ? (productIdByListing.get(t.listing_id) ?? null)
        : null,
      etsy_listing_id: t.listing_id ?? null,
      etsy_transaction_id: t.transaction_id,
      title: t.title ?? null,
      sku: t.sku ?? null,
      quantity: t.quantity ?? 1,
      unit_price_cents: etsyMoneyToCents(t.price),
      line_total_cents: etsyMoneyToCents(t.price) * (t.quantity ?? 1),
      currency,
    }));
  });

  if (itemRows.length > 0) {
    const { error: itemsErr } = await admin
      .from("sale_items")
      .upsert(itemRows, { onConflict: "etsy_transaction_id" });
    if (itemsErr) throw new Error(`sale_items upsert: ${itemsErr.message}`);
  }
  return itemRows.length;
}

async function upsertListingsPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyListing[],
): Promise<void> {
  const rows = results.map((l) => ({
    org_id: orgId,
    etsy_listing_id: l.listing_id,
    // Etsy API başlıkları HTML-escape'li döndürür ("7.5&quot;") — panelde
    // ham entity görünmesin diye senkron sınırında çözülür.
    title: l.title ? decodeHtmlEntities(l.title) : `Liste ${l.listing_id}`,
    sku: l.sku?.[0] ?? null,
    status: l.state ?? null,
    price_cents: etsyMoneyToCents(l.price),
    currency: l.price?.currency_code ?? "USD",
    url: l.url ?? null,
    description: l.description ?? null,
    tags: l.tags ?? null,
    materials: l.materials ?? null,
    image_url: l.images?.[0]?.url_570xN ?? null,
    num_images: l.images?.length ?? null,
    quantity: l.quantity ?? null,
    has_variations: l.has_variations ?? null,
    featured_rank: l.featured_rank ?? null,
    views: l.views ?? null,
    num_favorers: l.num_favorers ?? null,
    last_modified_ts: l.last_modified_timestamp ?? null,
  }));
  const { error } = await admin
    .from("products")
    .upsert(rows, { onConflict: "org_id,etsy_listing_id" });
  if (error) throw new Error(`products upsert: ${error.message}`);
}

/**
 * Etsy-panel listing mutabakatı (genel kural: nihai kaynak Etsy).
 * Tam envanter taraması bittikten sonra çağrılır: taramada GÖRÜLMEYEN
 * (updated_at, tarama başlangıcından eski kalan) etsy_listing_id'li ürünler
 * panelden silinir — Etsy'de olmayan hiçbir listing panelde yaşamaz.
 *
 * Güvenlik sınırları:
 * - Yalnız TAM tarama sonunda çağrılır (kısmi taramada asla) ve tarama
 *   işareti (sweepStartIso) yoksa hiçbir şey yapmaz.
 * - Yanlış yön imkânsız: taramada görülen her satır upsert'lenip updated_at'i
 *   işaretin sonrasına taşınır; yalnız hiç dokunulmayanlar silinir.
 * - Panel-doğumlu taslaklar (etsy_listing_id NULL) kapsam dışıdır.
 * - Satış geçmişi korunur (sale_items.product_id FK'sı SET NULL; kalemdeki
 *   etsy_listing_id izi durur). listing_media arşivi de silinmez (kalıcı arşiv).
 * - product_variants FK'sı SET NULL olduğundan yetim varyant (ve işgal edilen
 *   SKU) kalmasın diye varyantlar açıkça silinir.
 */
async function reconcileUnmatchedListings(
  admin: SupabaseClient,
  orgId: string,
  sweepStartIso: string | null,
): Promise<number> {
  if (!sweepStartIso) return 0;

  const { data, error } = await admin
    .from("products")
    .select("id, etsy_listing_id, sku, title")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .lt("updated_at", sweepStartIso);
  if (error) {
    // Mutabakat okuması düşerse senkronu düşürme — bir sonraki tam taramada
    // tekrar denenir; ama sessiz kalma.
    console.error("[etsy-sync] mutabakat okuması:", error.message);
    return 0;
  }
  const stale = (data ?? []) as {
    id: string;
    etsy_listing_id: number;
    sku: string | null;
    title: string;
  }[];
  if (stale.length === 0) return 0;

  const CHUNK = 100;
  for (let i = 0; i < stale.length; i += CHUNK) {
    const part = stale.slice(i, i + CHUNK);
    const ids = part.map((r) => r.id);
    const listingIds = part.map((r) => r.etsy_listing_id);
    // Varyantlar: product_id bağıyla VE (daha önce yetim kalmışsa)
    // etsy_listing_id bağıyla temizlenir.
    const { error: vErr } = await admin
      .from("product_variants")
      .delete()
      .eq("org_id", orgId)
      .or(
        `product_id.in.(${ids.join(",")}),etsy_listing_id.in.(${listingIds.join(",")})`,
      );
    if (vErr) throw new Error(`mutabakat varyant silme: ${vErr.message}`);
    const { error: pErr } = await admin
      .from("products")
      .delete()
      .eq("org_id", orgId)
      .in("id", ids);
    if (pErr) throw new Error(`mutabakat ürün silme: ${pErr.message}`);
  }

  await logAudit(admin, {
    orgId,
    action: "etsy.reconcile",
    entityType: "products",
    summary: `Etsy mutabakatı: taramada karşılığı olmayan ${stale.length} listing panelden silindi`,
    diff: {
      deleted: stale.map((r) => ({
        etsy_listing_id: r.etsy_listing_id,
        sku: r.sku,
        title: r.title,
      })),
    },
    source: "etsy",
  });
  return stale.length;
}

async function upsertReviewsPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyReview[],
): Promise<void> {
  // transaction_id'siz yorum onConflict anahtarına giremez → her senkronda
  // mükerrer satır üretirdi; atla (panelde zaten kimliksiz izlenemez).
  const rows = results
    .filter((rv) => rv.transaction_id != null)
    .map((rv) => {
    const ts = rv.created_timestamp ?? rv.create_timestamp;
    const updated = rv.updated_timestamp ?? rv.update_timestamp;
    return {
      org_id: orgId,
      etsy_review_id:
        rv.transaction_id != null ? String(rv.transaction_id) : null,
      rating: rv.rating ?? null,
      review_text: rv.review ?? null,
      language: rv.language ?? null,
      review_date: ts ? new Date(ts * 1000).toISOString() : null,
      etsy_updated_at: updated ? new Date(updated * 1000).toISOString() : null,
      source: "etsy",
      // status/response_text/responded_at/internal_note KASITLI gönderilmiyor:
      // bunlar panele ait (yanıt takibi). Yeni satır DB default'u ile 'yeni'
      // olur; MEVCUT satırın durumu/yanıtı upsert'te korunur (aksi halde her
      // senkron panelde "yanıtlandı" işaretini "yeni"ye geri ezerdi).
    };
  });
  const { error } = await admin
    .from("reviews")
    .upsert(rows, { onConflict: "org_id,etsy_review_id" });
  if (error) throw new Error(`reviews upsert: ${error.message}`);
}

/** Ham ledger kayıtlarını idempotent (entry_id) toplu upsert eder. */
/**
 * "extras" fazı: getShop günlük fotoğrafı + bölümler + kargo profilleri +
 * listing istatistik fotoğrafı. Hepsi küçük/tek sayfa; hata senkronu
 * düşürmesin diye her parça kendi içinde yutulur (bir sonraki turda tekrar
 * denenir — upsert'ler idempotent).
 */
async function syncShopExtras(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
  shopId: number,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // (1) Mağaza sağlık fotoğrafı
  try {
    const shop = await client.get<EtsyShop>(etsyPaths.shop(shopId));
    await admin.from("etsy_shop_snapshots").upsert(
      {
        org_id: orgId,
        snapshot_date: today,
        shop_name: shop.shop_name ?? null,
        num_favorers: shop.num_favorers ?? null,
        review_average: shop.review_average ?? null,
        review_count: shop.review_count ?? null,
        listing_active_count: shop.listing_active_count ?? null,
        transaction_sold_count: shop.transaction_sold_count ?? null,
        is_vacation: shop.is_vacation ?? null,
        announcement: shop.announcement ?? null,
        url: shop.url ?? null,
        currency_code: shop.currency_code ?? null,
      },
      { onConflict: "org_id,snapshot_date" },
    );
  } catch {
    // sıradaki turda yeniden denenir
  }

  // (2) Mağaza bölümleri
  try {
    const page = await client.get<EtsyListResponse<EtsyShopSection>>(
      etsyPaths.shopSections(shopId),
    );
    const rows = (page.results ?? [])
      .filter((x) => x.shop_section_id != null)
      .map((x) => ({
        org_id: orgId,
        section_id: x.shop_section_id!,
        title: x.title ?? null,
        rank: x.rank ?? null,
        active_listing_count: x.active_listing_count ?? null,
        updated_at: new Date().toISOString(),
      }));
    if (rows.length > 0) {
      await admin
        .from("etsy_shop_sections")
        .upsert(rows, { onConflict: "org_id,section_id" });
    }
  } catch {
    // yut
  }

  // (3) Kargo profilleri
  try {
    const page = await client.get<EtsyListResponse<EtsyShippingProfile>>(
      etsyPaths.shippingProfiles(shopId),
    );
    const rows = (page.results ?? [])
      .filter((x) => x.shipping_profile_id != null)
      .map((x) => ({
        org_id: orgId,
        profile_id: x.shipping_profile_id!,
        title: x.title ?? null,
        min_processing_days: x.min_processing_days ?? null,
        max_processing_days: x.max_processing_days ?? null,
        processing_days_display: x.processing_days_display_label ?? null,
        origin_country_iso: x.origin_country_iso ?? null,
        origin_postal_code: x.origin_postal_code ?? null,
        updated_at: new Date().toISOString(),
      }));
    if (rows.length > 0) {
      await admin
        .from("etsy_shipping_profiles")
        .upsert(rows, { onConflict: "org_id,profile_id" });
    }
  } catch {
    // yut
  }

  // (4) Listing istatistik GÜNLÜK fotoğrafı — products'taki ömür boyu
  // toplamlardan bugünün satırı yazılır; tarihsel seri panelde birikir.
  try {
    const { data } = await admin
      .from("products")
      .select("etsy_listing_id, views, num_favorers, quantity")
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null);
    const rows = ((data ?? []) as {
      etsy_listing_id: number;
      views: number | null;
      num_favorers: number | null;
      quantity: number | null;
    }[]).map((r) => ({
      org_id: orgId,
      etsy_listing_id: r.etsy_listing_id,
      stat_date: today,
      views: r.views,
      num_favorers: r.num_favorers,
      quantity: r.quantity,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      await admin
        .from("etsy_listing_stats")
        .upsert(rows.slice(i, i + 500), {
          onConflict: "org_id,etsy_listing_id,stat_date",
        });
    }
  } catch {
    // yut
  }
}

async function upsertLedgerPage(
  admin: SupabaseClient,
  orgId: string,
  results: EtsyLedgerEntry[],
): Promise<void> {
  const rows = results.map((e) => {
    const ts = e.created_timestamp ?? e.create_date ?? null;
    return {
      org_id: orgId,
      entry_id: e.entry_id,
      ledger_id: e.ledger_id ?? null,
      ledger_type: e.ledger_type ?? null,
      reference_type: e.reference_type ?? null,
      reference_id: e.reference_id != null ? String(e.reference_id) : null,
      description: e.description ?? null,
      amount_cents: typeof e.amount === "number" ? e.amount : null,
      currency: e.currency ?? null,
      balance_cents: typeof e.balance === "number" ? e.balance : null,
      created_timestamp: ts,
      entry_date: ts != null ? new Date(ts * 1000).toISOString() : null,
    };
  });
  const { error } = await admin
    .from("etsy_ledger_entries")
    .upsert(rows, { onConflict: "entry_id" });
  if (error) throw new Error(`etsy_ledger_entries upsert: ${error.message}`);
}

/** Senkron ilerleme durumunu okur (canlı akış paneli için). */
export async function getSyncProgress(orgId: string): Promise<SyncProgress> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("etsy_connection")
    .select(
      "sync_status, sync_phase, sync_sales, sync_items, sync_products, sync_reviews, sync_ledger, sync_error",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const c = data as
    | (CursorRow & { sync_error: string | null })
    | null;
  const status = (c?.sync_status ?? "idle") as SyncProgress["status"] | "idle";
  return {
    done: status === "done" || status === "error" || status === "idle",
    status: status === "idle" ? "done" : status,
    phase: (c?.sync_phase ?? "done") as SyncProgress["phase"],
    sales: c?.sync_sales ?? 0,
    items: c?.sync_items ?? 0,
    products: c?.sync_products ?? 0,
    reviews: c?.sync_reviews ?? 0,
    ledger: c?.sync_ledger ?? 0,
    error: c?.sync_error ?? undefined,
  };
}

export interface EtsyListingChange {
  title: string;
  etsyListingId: number | null;
}

export interface EtsySyncSummary {
  status: "running" | "done" | "error" | "idle";
  phase: SyncProgress["phase"];
  lastSyncAt: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  error?: string;
  counts: {
    sales: number;
    items: number;
    products: number;
    reviews: number;
    ledger: number;
  };
  linkedProducts: { total: number; active: number };
  listingChanges: {
    becameActive: EtsyListingChange[];
    becameInactive: EtsyListingChange[];
    moreActiveCount: number;
    moreInactiveCount: number;
  };
}

const LISTING_CHANGE_SHOW = 6;

/**
 * KALICI "Son Senkron Özeti" — sayfa her açıldığında (çalışan bir tur olsun
 * olmasın) gösterilir. Ürün durum değişimleri ("ne geldi ne gitti") audit
 * logdan çıkarılır: `sync_started_at`→`sync_updated_at` penceresinde
 * `products` tablosuna yazılan status değişiklikleri (audit_trigger zaten her
 * update'i before/after diff'iyle audit_log'a yazıyor — ayrı bir izleme
 * tablosu gerekmez).
 */
export async function getLastSyncSummary(orgId: string): Promise<EtsySyncSummary> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("etsy_connection")
    .select(
      "sync_status, sync_phase, sync_sales, sync_items, sync_products, sync_reviews, sync_ledger, sync_error, last_sync_at, sync_started_at, sync_updated_at",
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const c = data as
    | (CursorRow & {
        sync_error: string | null;
        sync_started_at: string | null;
        sync_updated_at: string | null;
      })
    | null;
  const status = (c?.sync_status ?? "idle") as EtsySyncSummary["status"];

  const [{ count: total }, { count: active }] = await Promise.all([
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null),
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .not("etsy_listing_id", "is", null)
      .eq("status", "active"),
  ]);

  const becameActive: EtsyListingChange[] = [];
  const becameInactive: EtsyListingChange[] = [];
  let moreActiveCount = 0;
  let moreInactiveCount = 0;

  if (c?.sync_started_at) {
    const windowEnd = c.sync_updated_at ?? new Date().toISOString();
    const { data: auditRows } = await admin
      .from("audit_log")
      .select("diff")
      .eq("org_id", orgId)
      .eq("entity_type", "products")
      .eq("action", "update")
      .gte("created_at", c.sync_started_at)
      .lte("created_at", windowEnd)
      .limit(1000);

    for (const row of (auditRows ?? []) as { diff: unknown }[]) {
      const diff = row.diff as {
        before?: { status?: string | null };
        after?: {
          status?: string | null;
          title?: string | null;
          etsy_listing_id?: number | null;
        };
      } | null;
      const before = diff?.before?.status ?? null;
      const after = diff?.after?.status ?? null;
      if (!diff?.after || before === after) continue;
      const entry: EtsyListingChange = {
        title: diff.after.title ?? "Ürün",
        etsyListingId: diff.after.etsy_listing_id ?? null,
      };
      if (after === "active") {
        if (becameActive.length < LISTING_CHANGE_SHOW) becameActive.push(entry);
        else moreActiveCount++;
      } else if (before === "active") {
        if (becameInactive.length < LISTING_CHANGE_SHOW) becameInactive.push(entry);
        else moreInactiveCount++;
      }
    }
  }

  return {
    status,
    phase: (c?.sync_phase ?? "done") as SyncProgress["phase"],
    lastSyncAt: c?.last_sync_at ?? null,
    startedAt: c?.sync_started_at ?? null,
    updatedAt: c?.sync_updated_at ?? null,
    error: c?.sync_error ?? undefined,
    counts: {
      sales: c?.sync_sales ?? 0,
      items: c?.sync_items ?? 0,
      products: c?.sync_products ?? 0,
      reviews: c?.sync_reviews ?? 0,
      ledger: c?.sync_ledger ?? 0,
    },
    linkedProducts: { total: total ?? 0, active: active ?? 0 },
    listingChanges: {
      becameActive,
      becameInactive,
      moreActiveCount,
      moreInactiveCount,
    },
  };
}
