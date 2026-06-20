"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { syncSales, syncListings, syncReviews } from "@/lib/etsy/sync";
import { EtsyNotConnectedError } from "@/lib/etsy/client";

export interface SyncResult {
  ok?: boolean;
  error?: string;
  imported?: number;
}

export async function runEtsySync(): Promise<SyncResult> {
  const m = await requireMembership();
  try {
    const sales = await syncSales(m.org_id);
    await syncListings(m.org_id);
    await syncReviews(m.org_id);
    revalidatePath("/satislar");
    revalidatePath("/panel");
    revalidatePath("/ayarlar/etsy");
    return { ok: true, imported: sales.imported };
  } catch (e) {
    if (e instanceof EtsyNotConnectedError) {
      return { error: "Etsy bağlantısı yok. Önce mağazanızı bağlayın." };
    }
    return {
      error: e instanceof Error ? e.message : "Senkronizasyon sırasında hata oluştu.",
    };
  }
}
