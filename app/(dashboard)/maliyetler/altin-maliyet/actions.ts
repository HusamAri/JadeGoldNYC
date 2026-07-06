"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { rebuildGoldCostsBulk } from "@/lib/gold-cost-entry";

export interface RetroactiveResult {
  ok?: boolean;
  processed?: number;
  skipped?: number;
  error?: string;
}

/**
 * Geriye dönük olarak, henüz altın maliyet kaydı olmayan tüm satışlar
 * için otomatik maliyet hesabı yapar ve costs tablosuna yazar.
 *
 * Küme-tabanlı `rebuild_gold_costs` RPC'siyle (SKU→varyant ağırlığı) tek deyimde
 * çalışır — on binlerce satışta eski Node döngüsü zaman aşımına uğruyordu. RPC
 * service_role ister; rol geçidinden sonra admin (service role) istemciyle çağrılır.
 */
export async function runRetroactiveGoldCosts(): Promise<RetroactiveResult> {
  const m = await requireMembership();
  // Maliyet/COGS yeniden yazımı hassas işlem — yalnız owner/admin.
  if (!isManager(m.role)) return { error: MANAGER_ONLY_ERROR };

  try {
    const admin = createAdminClient();
    const rows = await rebuildGoldCostsBulk(admin, m.org_id);
    revalidatePath("/maliyetler");
    revalidatePath("/maliyetler/altin-maliyet");
    revalidatePath("/panel");
    // RPC malzeme+işçilik olarak 2 satır/kalem yazar → işlenen kalem = satır/2.
    return { ok: true, processed: Math.floor(rows / 2) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Hesaplama hatası" };
  }
}
