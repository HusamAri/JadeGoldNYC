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
