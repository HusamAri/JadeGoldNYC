"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import {
  ADS_ACTION_KINDS,
  createAdsAction as insertAdsAction,
  updateAdsActionStatus,
  type AdsActionKind,
  type AdsActionStatus,
  type AdsMetricSnapshot,
} from "@/lib/db/queries/ads-actions";

/**
 * Reklam aksiyonları — form action olarak çağrılır (RSC <form action={…}>).
 * Panel Etsy reklamını DEĞİŞTİRMEZ (API sunmuyor); burada yalnız karar
 * kuyruğa yazılır ve yapıldı/yok sayıldı takibi tutulur.
 */

export async function createAdsAction(formData: FormData): Promise<void> {
  const m = await requireMembership();

  const productId = String(formData.get("product_id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as AdsActionKind;
  if (!productId || !(ADS_ACTION_KINDS as readonly string[]).includes(kind)) {
    throw new Error("Geçersiz aksiyon isteği.");
  }
  const reason = String(formData.get("reason") ?? "").trim() || null;

  let snapshot: AdsMetricSnapshot | null = null;
  const raw = formData.get("snapshot");
  if (typeof raw === "string" && raw) {
    try {
      snapshot = JSON.parse(raw) as AdsMetricSnapshot;
    } catch {
      snapshot = null; // fotoğraf bozuksa karar yine de kaydedilir
    }
  }

  const { error } = await insertAdsAction({
    orgId: m.org_id,
    productId,
    kind,
    reason,
    snapshot,
  });
  if (error) throw new Error(error);

  revalidatePath("/reklamlar");
  revalidatePath("/panel");
}

export async function markAdsAction(formData: FormData): Promise<void> {
  const m = await requireMembership();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "") as Exclude<
    AdsActionStatus,
    "beklemede"
  >;
  if (!id || (status !== "yapildi" && status !== "yok_sayildi")) {
    throw new Error("Geçersiz durum isteği.");
  }

  const { error } = await updateAdsActionStatus({
    orgId: m.org_id,
    id,
    status,
    userId: m.user_id,
  });
  if (error) throw new Error(error);

  revalidatePath("/reklamlar");
  revalidatePath("/panel");
}
