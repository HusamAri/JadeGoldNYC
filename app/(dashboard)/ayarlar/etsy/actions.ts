"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import {
  advanceEtsySync,
  getSyncProgress,
  getLastSyncSummary,
  type SyncProgress,
  type EtsySyncSummary,
} from "@/lib/etsy/sync";
import { syncListingVariants } from "@/lib/etsy/variants";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { pushListingPrices } from "@/lib/etsy/inventory";
import {
  variantPropsForMatch,
  type RawVariantProperties,
} from "@/lib/variant-properties";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";

/**
 * Senkronu bir adım ("domino" dilimi) ilerletir. Çağıran taraf (buton döngüsü)
 * `done` olana kadar tekrar çağırır; her çağrı zaman bütçesiyle sınırlı olduğundan
 * 60sn fonksiyon limitini aşmaz.
 */
export async function advanceEtsySyncAction(): Promise<SyncProgress> {
  const m = await requireMembership();
  try {
    const p = await advanceEtsySync(m.org_id);
    if (p.done && p.status === "done") {
      revalidatePath("/satislar");
      revalidatePath("/panel");
      revalidatePath("/ayarlar/etsy");
    }
    return p;
  } catch (e) {
    const error =
      e instanceof EtsyNotConnectedError
        ? "Etsy bağlantısı yok. Önce mağazanızı bağlayın."
        : e instanceof Error
          ? e.message
          : "Senkronizasyon sırasında hata oluştu.";
    return {
      done: true,
      status: "error",
      phase: "sales",
      sales: 0,
      items: 0,
      products: 0,
      reviews: 0,
      ledger: 0,
      error,
    };
  }
}

export interface FullResyncResult {
  ok: boolean;
  error?: string;
  /** İşlenen listing sayısı. */
  listings: number;
  /** Yazılan/eşlenen varyant sayısı. */
  variants: number;
  /** Etsy'de artık olmayan (eşleşmeyen) silinen varyant sayısı. */
  removed: number;
}

/**
 * Varyantları Etsy'den TAM yeniden çeker (Etsy-ayna mutabakatı dahil): her
 * listing'in envanteri okunur, SKU'lar Etsy'den yazılır, Etsy'de artık olmayan
 * panel varyantları silinir. Artımlı senkronun kaçırabildiği varyant
 * düzeltmelerini panele KESİN yansıtan elle tetik ("Etsy'de düzeltip panelde
 * bayat kalıyor" sorunu). Listing alanları (başlık/fiyat/tag) zaten normal
 * senkronda her turda Etsy'den ezilir.
 */
export async function resyncVariantsAction(): Promise<FullResyncResult> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return {
      ok: false,
      error: "Yalnız sahip/yönetici tetikleyebilir.",
      listings: 0,
      variants: 0,
      removed: 0,
    };
  }
  try {
    const r = await syncListingVariants(m.org_id, { budgetMs: 50_000 });
    revalidatePath("/tasarimlar");
    revalidatePath("/stok");
    return {
      ok: true,
      listings: r.listings,
      variants: r.variants,
      removed: r.removed,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlantısı yok."
          : e instanceof Error
            ? e.message
            : "Varyant yeniden çekimi başarısız.",
      listings: 0,
      variants: 0,
      removed: 0,
    };
  }
}

/**
 * Satış senkron imlecini sıfırlar: `last_sync_at` null → bir sonraki senkron
 * TAM geçmişi (artımlı pencere olmadan) yeniden çeker. Devam eden bir senkron
 * kilidini de açar. Kullanıcı bunu tetikledikten sonra normal "Senkronu
 * çalıştır" tam tarama yapar.
 */
export async function resetSyncCursorAction(): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız sahip/yönetici tetikleyebilir." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("etsy_connection")
    .update({ last_sync_at: null, sync_status: "idle", sync_phase: null })
    .eq("org_id", m.org_id);
  if (error) return { error: error.message };
  revalidatePath("/ayarlar/etsy");
  return {};
}

/** Canlı akış paneli için anlık ilerleme durumu. */
export async function etsySyncStatusAction(): Promise<SyncProgress> {
  const m = await requireMembership();
  return getSyncProgress(m.org_id);
}

/**
 * Kalıcı "Son Senkron Özeti" — sayfa yenilense/senkron çalışmıyor olsa bile
 * son turun sayılarını, bağlı ürün adedini ve ürün durum değişimlerini döner.
 */
export async function getLastSyncSummaryAction(): Promise<EtsySyncSummary> {
  const m = await requireMembership();
  return getLastSyncSummary(m.org_id);
}

// ── Etsy'e her şeyi gönder (panel → Etsy fiyat itişi) ────────────────────────
// "Etsy'den her şeyi çek"in simetriği: panelde düzenlenen varyant fiyatları
// Etsy'ye canlı yazılır. Fiyat Etsy'de envanter offering'inde yaşar (listing
// alanı değil) → GET inventory → SKU eşle → PUT (lib/etsy/inventory). Güvenlik:
// yalnız owner/admin + listings_w; DB'de fiyatı olmayan SKU'da Etsy fiyatı
// korunur (asla sıfırlanmaz); değişmemiş listing PUT edilmez (idempotent).
// İNDİRİM İTİLMEZ: discount_pct panel-içidir (0115), Etsy tabanı = DB tabanı.

export interface PushPricesResult {
  done: boolean;
  total: number;
  /** Bir sonraki dilimin başlangıç indeksi (domino döngüsü bunu geri verir). */
  nextOffset: number;
  updated: number;
  unchanged: number;
  errors: number;
  sampleErrors: string[];
  error?: string;
}

/** Tek çağrı zaman bütçesi — 60sn fonksiyon limitinin altında kal. */
const PUSH_BUDGET_MS = 45_000;

/**
 * Panel varyant fiyatlarını Etsy'ye yazar. Domino: çağıran `done` olana kadar
 * `nextOffset` ile tekrar çağırır (her çağrı bütçeyle sınırlı). Sabit sıra
 * (products.id) sayesinde offset kaldığı yerden devam eder; yeniden çalıştırma
 * güvenli (değişmemiş listing "unchanged").
 */
export async function pushAllPricesToEtsyAction(
  offset = 0,
): Promise<PushPricesResult> {
  const m = await requireMembership();
  const base = (over: Partial<PushPricesResult> = {}): PushPricesResult => ({
    done: true,
    total: 0,
    nextOffset: offset,
    updated: 0,
    unchanged: 0,
    errors: 0,
    sampleErrors: [],
    ...over,
  });
  if (!isManager(m.role)) return base({ error: MANAGER_ONLY_ERROR });
  const { writeEnabled } = await getEtsyWriteAccess(m.org_id);
  if (!writeEnabled)
    return base({ error: "Etsy yazma erişimi kapalı (listings_w gerekli)." });

  const admin = createAdminClient();
  const { data: prodRows, error: prodErr } = await admin
    .from("products")
    .select("id, etsy_listing_id")
    .eq("org_id", m.org_id)
    .is("archived_at", null)
    .not("etsy_listing_id", "is", null)
    .order("id", { ascending: true });
  if (prodErr) return base({ error: prodErr.message });
  const listings = (prodRows ?? []) as {
    id: string;
    etsy_listing_id: number;
  }[];
  const total = listings.length;
  if (total === 0) return base({ done: true });

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(m.org_id);
  } catch (e) {
    return base({
      total,
      nextOffset: offset,
      error:
        e instanceof EtsyNotConnectedError
          ? "Etsy bağlantısı yok — önce mağazayı bağlayın."
          : e instanceof Error
            ? e.message
            : "Etsy istemcisi kurulamadı.",
    });
  }

  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  const sampleErrors: string[] = [];
  const start = Date.now();
  let i = Math.max(0, offset);
  for (; i < total; i++) {
    if (Date.now() - start > PUSH_BUDGET_MS) break;
    const l = listings[i];
    const { data: vRows, error: vErr } = await admin
      .from("product_variants")
      .select("sku, price_cents, properties")
      .eq("org_id", m.org_id)
      .eq("product_id", l.id);
    if (vErr) {
      errors += 1;
      if (sampleErrors.length < 5)
        sampleErrors.push(`#${l.etsy_listing_id}: ${vErr.message}`);
      continue;
    }
    const priceBySku = new Map<string, number>();
    const propsBySku = new Map<string, { name: string; value: string }[]>();
    for (const v of (vRows ?? []) as {
      sku: string | null;
      price_cents: number | null;
      properties: RawVariantProperties;
    }[]) {
      const sku = (v.sku ?? "").trim();
      if (!sku) continue;
      if (v.price_cents != null && v.price_cents > 0) {
        priceBySku.set(sku, v.price_cents);
      }
      propsBySku.set(sku, variantPropsForMatch(v.properties));
    }
    if (priceBySku.size === 0) {
      unchanged += 1; // yazılacak fiyat yok — dokunma
      continue;
    }
    const r = await pushListingPrices(
      client,
      l.etsy_listing_id,
      priceBySku,
      propsBySku,
    );
    if (r.status === "updated") {
      updated += 1;
      // Etsy'ye yazılan turlar arası rate-limit nefesi.
      await new Promise((res) => setTimeout(res, 250));
    } else if (r.status === "unchanged") {
      unchanged += 1;
    } else {
      errors += 1;
      if (sampleErrors.length < 5)
        sampleErrors.push(`#${l.etsy_listing_id}: ${r.detail ?? "hata"}`);
    }
  }

  const done = i >= total;
  if (done) {
    revalidatePath("/tasarimlar");
    revalidatePath("/ayarlar/etsy");
  }
  return { done, total, nextOffset: i, updated, unchanged, errors, sampleErrors };
}
