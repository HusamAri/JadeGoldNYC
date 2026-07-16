import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { etsyMoneyToCents, type EtsyMoney } from "@/lib/etsy/types";

/**
 * Rakip seti (STR tarzı sabit comp-set) — 0091.
 *
 * Kullanıcı, organik araştırma sonuçlarından (ya da elle) belirlediği rakip
 * listinglerini bir ürüne SABİTLER (`competitor_watch`); günlük cron her aktif
 * izlemenin fiyatını public getListing ile çekip `competitor_prices`e tarih
 * serisi olarak yazar. Fiyat araştırması motoru taze (48 saat) ≥3 kayıt
 * bulursa fiyat bandını organik arama yerine bu setten kurar
 * (band_source='rakip-seti'). Listing Etsy'den kalkarsa (404) state='gone'
 * kaydedilir — izleme pasiflenmez, ekranda görünür kalır.
 */

export interface CompetitorWatchRow {
  id: string;
  org_id: string;
  product_id: string;
  competitor_listing_id: number;
  shop_name: string | null;
  title: string | null;
  url: string | null;
  note: string | null;
  color: string | null;
  active: boolean;
}

/** Motorun band kurarken kullandığı taze rakip-seti fiyatı. */
export interface CompetitorSetPrice {
  watch_id: string;
  competitor_listing_id: number;
  shop_name: string | null;
  title: string | null;
  url: string | null;
  price_cents: number;
  currency: string;
  captured_at: string;
}

/** Etsy listing URL'inden listing_id çözer (eski snapshot'larda listing_id yok). */
export function parseListingIdFromUrl(
  url: string | null | undefined,
): number | null {
  if (!url) return null;
  const m = /\/listing\/(\d+)/.exec(url);
  return m ? Number(m[1]) : null;
}

// ── CRUD yardımcıları ────────────────────────────────────────────────

/** Bir izlemeyi ekler ya da yeniden aktifler (org+ürün+listing tekil). */
export async function addCompetitorWatch(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  input: {
    product_id: string;
    competitor_listing_id: number;
    shop_name?: string | null;
    title?: string | null;
    url?: string | null;
    note?: string | null;
    color?: string | null;
  },
): Promise<{ id: string } | { error: string }> {
  // Renk yalnız verildiğinde yazılır — upsert'te var olan kaydın rengini
  // undefined'la ezmemek için koşullu eklenir.
  const row: Record<string, unknown> = {
    org_id: orgId,
    product_id: input.product_id,
    competitor_listing_id: input.competitor_listing_id,
    shop_name: input.shop_name ?? null,
    title: input.title ?? null,
    url:
      input.url ??
      `https://www.etsy.com/listing/${input.competitor_listing_id}`,
    note: input.note ?? null,
    active: true,
    created_by: userId,
  };
  if (input.color != null) row.color = input.color;
  const { data, error } = await admin
    .from("competitor_watch")
    .upsert(
      row,
      { onConflict: "org_id,product_id,competitor_listing_id" },
    )
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: (data as { id: string }).id };
}

/** İzlemeyi pasifler (fiyat tarihi silinmez — geriye dönük iz korunur). */
export async function deactivateCompetitorWatch(
  admin: SupabaseClient,
  orgId: string,
  watchId: string,
): Promise<{ error?: string }> {
  const { data, error } = await admin
    .from("competitor_watch")
    .update({ active: false })
    .eq("id", watchId)
    .eq("org_id", orgId)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Rakip izleme bulunamadı." };
  return {};
}

// ── Fiyat çekimi ─────────────────────────────────────────────────────

interface EtsyPublicListing {
  listing_id?: number;
  state?: string;
  title?: string;
  price?: EtsyMoney;
}

/**
 * Tek izlemenin canlı fiyatını public getListing ile çekip
 * `competitor_prices`e ekler (tarih serisi — her çağrı yeni satır).
 * Listing 404 dönerse state='gone' kaydedilir; diğer hatalar fırlatılır
 * (geçici hata 'gone' sanılmasın).
 */
export async function captureWatchPrice(
  admin: SupabaseClient,
  client: EtsyClient,
  watch: Pick<CompetitorWatchRow, "id" | "org_id" | "competitor_listing_id">,
): Promise<{ state: string; price_cents: number | null }> {
  let priceCents: number | null = null;
  let currency = "USD";
  let state = "active";
  try {
    const l = await client.get<EtsyPublicListing>(
      etsyPaths.listing(watch.competitor_listing_id),
    );
    state = l.state ?? "active";
    const cents = etsyMoneyToCents(l.price);
    priceCents = cents > 0 ? cents : null;
    currency = l.price?.currency_code ?? "USD";
  } catch (e) {
    // EtsyClient hata formatı sabittir: "Etsy API hatası (STATUS) ..."
    // (lib/etsy/client.ts). Önekli eşleşme: mesaj gövdesinde geçen rastgele
    // bir "(404)" ile karışmaz; format değişirse gone yazılamaz ama listing
    // geçici hata sayılıp bir sonraki turda yeniden denenir (güvenli yön).
    if (e instanceof Error && /^Etsy API hatası \(404\)/.test(e.message)) {
      state = "gone"; // listing Etsy'den kaldırılmış
    } else {
      throw e;
    }
  }

  const { error } = await admin.from("competitor_prices").insert({
    org_id: watch.org_id,
    watch_id: watch.id,
    price_cents: priceCents,
    currency,
    state,
  });
  if (error)
    console.error("competitor-watch: fiyat kaydı yazılamadı:", error.message);
  return { state, price_cents: priceCents };
}

/**
 * Bir org'un TÜM aktif izlemelerinin fiyatını tazeler (cron adımı).
 * Etsy rate-limit'e saygılı: istekler arası ~200ms.
 */
export async function refreshCompetitorPrices(
  admin: SupabaseClient,
  client: EtsyClient,
  orgId: string,
): Promise<{ total: number; captured: number; gone: number; errors: number }> {
  const { data, error } = await admin
    .from("competitor_watch")
    .select("id, org_id, product_id, competitor_listing_id")
    .eq("org_id", orgId)
    .eq("active", true);
  if (error) {
    console.error("competitor-watch: izleme listesi okunamadı:", error.message);
    return { total: 0, captured: 0, gone: 0, errors: 1 };
  }

  const watches = (data ?? []) as Pick<
    CompetitorWatchRow,
    "id" | "org_id" | "product_id" | "competitor_listing_id"
  >[];
  let captured = 0;
  let gone = 0;
  let errors = 0;
  for (const w of watches) {
    try {
      const r = await captureWatchPrice(admin, client, w);
      if (r.state === "gone") gone++;
      else captured++;
    } catch {
      errors++; // geçici Etsy hatası — sonraki cron turunda tekrar denenir
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { total: watches.length, captured, gone, errors };
}

/**
 * Tüm bağlı org'ların rakip setini tazeler (cron girişi —
 * advanceKeywordResearch'ten ÖNCE çağrılır ki bugünün araştırması taze
 * rakip-seti fiyatlarını kullansın). Etsy bağlı değilse org atlanır.
 */
export async function refreshAllCompetitorPrices(): Promise<
  Record<string, unknown>
> {
  const admin = createAdminClient();
  const { data: conns, error } = await admin
    .from("etsy_connection")
    .select("org_id")
    .eq("status", "connected");
  if (error) {
    console.error("competitor-watch: bağlantı listesi okunamadı:", error.message);
    return { error: error.message };
  }

  const out: Record<string, unknown> = {};
  for (const conn of (conns ?? []) as { org_id: string }[]) {
    try {
      const client = await EtsyClient.forOrg(conn.org_id);
      out[conn.org_id] = await refreshCompetitorPrices(
        admin,
        client,
        conn.org_id,
      );
    } catch (e) {
      out[conn.org_id] = {
        skipped: e instanceof EtsyNotConnectedError ? "not-connected" : "error",
      };
    }
  }
  return out;
}

// ── Motor entegrasyonu ───────────────────────────────────────────────

interface FreshPriceDbRow {
  watch_id: string;
  price_cents: number | null;
  currency: string;
  state: string | null;
  captured_at: string;
}

/**
 * Ürünün aktif rakip setinin TAZE fiyatları — izleme başına EN GÜNCEL kayıt
 * (snapshot dedupe dersi), pencere içinde (varsayılan 48 saat), fiyatlı,
 * 'gone' olmayan ve para birimi eşleşen. Motor ≥3 kayıt bulursa fiyat bandını
 * organik arama yerine bu setten kurar.
 */
export async function getFreshCompetitorSetPrices(
  admin: SupabaseClient,
  orgId: string,
  productId: string,
  currency: string,
  hours = 48,
): Promise<CompetitorSetPrice[]> {
  const { data: wData, error: wError } = await admin
    .from("competitor_watch")
    .select("id, competitor_listing_id, shop_name, title, url")
    .eq("org_id", orgId)
    .eq("product_id", productId)
    .eq("active", true);
  if (wError) {
    console.error("competitor-watch: set okunamadı:", wError.message);
    return [];
  }
  const watches = (wData ?? []) as Pick<
    CompetitorWatchRow,
    "id" | "competitor_listing_id" | "shop_name" | "title" | "url"
  >[];
  if (watches.length === 0) return [];

  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data: pData, error: pError } = await admin
    .from("competitor_prices")
    .select("watch_id, price_cents, currency, state, captured_at")
    .in(
      "watch_id",
      watches.map((w) => w.id),
    )
    .gte("captured_at", since)
    .order("captured_at", { ascending: false });
  if (pError) {
    console.error("competitor-watch: fiyatlar okunamadı:", pError.message);
    return [];
  }

  // İzleme başına en güncel kayıt (desc sıralı geldiğinden ilk görülen).
  const latest = new Map<string, FreshPriceDbRow>();
  for (const p of (pData ?? []) as FreshPriceDbRow[]) {
    if (!latest.has(p.watch_id)) latest.set(p.watch_id, p);
  }

  const out: CompetitorSetPrice[] = [];
  for (const w of watches) {
    const p = latest.get(w.id);
    if (!p || p.price_cents == null || p.state === "gone") continue;
    if (p.currency !== currency) continue; // farklı kurlar tek banda toplanmaz
    out.push({
      watch_id: w.id,
      competitor_listing_id: w.competitor_listing_id,
      shop_name: w.shop_name,
      title: w.title,
      url: w.url,
      price_cents: p.price_cents,
      currency: p.currency,
      captured_at: p.captured_at,
    });
  }
  return out;
}
