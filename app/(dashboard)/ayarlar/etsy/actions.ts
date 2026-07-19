"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import {
  advanceEtsySync,
  getSyncProgress,
  getLastSyncSummary,
  type SyncProgress,
  type EtsySyncSummary,
} from "@/lib/etsy/sync";
import { syncListingVariants } from "@/lib/etsy/variants";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyNotConnectedError } from "@/lib/etsy/client";

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
