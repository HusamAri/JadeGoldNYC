"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import {
  advanceShipStationSync,
  getShipStationProgress,
  type ShipStationProgress,
} from "@/lib/shipstation/sync";
import { ShipStationNotConfiguredError } from "@/lib/shipstation/client";

/** Senkronu bir adım ilerletir (buton döngüsü done olana dek çağırır). */
export async function advanceShipStationSyncAction(): Promise<ShipStationProgress> {
  const m = await requireMembership();
  try {
    const p = await advanceShipStationSync(m.org_id);
    if (p.done && p.status === "done") {
      revalidatePath("/ayarlar/shipstation");
      revalidatePath("/maliyetler");
      revalidatePath("/panel");
    }
    return p;
  } catch (e) {
    const error =
      e instanceof ShipStationNotConfiguredError
        ? "ShipStation API anahtarları (SHIPSTATION_API_KEY/SECRET) tanımlı değil."
        : e instanceof Error
          ? e.message
          : "Senkronizasyon sırasında hata oluştu.";
    return {
      done: true,
      status: "error",
      phase: "orders",
      orders: 0,
      shipments: 0,
      error,
    };
  }
}

export async function shipStationStatusAction(): Promise<ShipStationProgress> {
  const m = await requireMembership();
  return getShipStationProgress(m.org_id);
}
