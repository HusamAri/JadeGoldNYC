"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import {
  advanceShipStationSync,
  getShipStationProgress,
  type ShipStationProgress,
} from "@/lib/shipstation/sync";
import { ShipStationNotConfiguredError } from "@/lib/shipstation/client";

/**
 * Şirkete özel ShipStation API anahtarlarını kaydeder (platform modeli:
 * her org kendi anahtarını site içinden girer). Sırlar service-role-only
 * `shipstation_credentials` tablosunda tutulur — üye RLS'i okuyamaz.
 */
export async function saveShipStationCredentials(
  apiKey: string,
  apiSecret: string,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  const key = apiKey.trim();
  const secret = apiSecret.trim();
  if (!key || !secret) return { error: "API Key ve API Secret gerekli." };

  const admin = createAdminClient();
  const { error } = await admin.from("shipstation_credentials").upsert(
    {
      org_id: m.org_id,
      api_key: key,
      api_secret: secret,
      updated_by: m.user_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  );
  if (error) return { error: error.message };

  // Sır içermeyen semantik iz — şirket hafızası.
  const supabase = await createClient();
  await logAudit(supabase, {
    orgId: m.org_id,
    action: "shipstation.credentials",
    entityType: "shipstation_connection",
    summary: "ShipStation API anahtarları güncellendi",
  });

  revalidatePath("/ayarlar/shipstation");
  return {};
}

/** Bu org için ShipStation yapılandırılmış mı (org kaydı veya platform env)? */
export async function shipStationConfiguredAction(): Promise<boolean> {
  const m = await requireMembership();
  const admin = createAdminClient();
  const { ShipStationClient } = await import("@/lib/shipstation/client");
  return ShipStationClient.isConfiguredForOrg(admin, m.org_id);
}

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
      products: 0,
      shipments: 0,
      error,
    };
  }
}

export async function shipStationStatusAction(): Promise<ShipStationProgress> {
  const m = await requireMembership();
  return getShipStationProgress(m.org_id);
}
