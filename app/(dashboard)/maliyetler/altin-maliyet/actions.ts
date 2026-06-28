"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";
import { processGoldCostsForRecentSales } from "@/lib/gold-cost-entry";

export interface RetroactiveResult {
  ok?: boolean;
  processed?: number;
  skipped?: number;
  error?: string;
}

/**
 * Geriye dönük olarak, henüz altın maliyet kaydı olmayan tüm satışlar
 * için otomatik maliyet hesabı yapar ve costs tablosuna yazar.
 */
export async function runRetroactiveGoldCosts(): Promise<RetroactiveResult> {
  const m = await requireMembership();
  const supabase = await createClient();

  try {
    const result = await processGoldCostsForRecentSales(supabase, m.org_id);
    revalidatePath("/maliyetler");
    revalidatePath("/maliyetler/altin-maliyet");
    revalidatePath("/panel");
    return {
      ok: true,
      processed: result.totalProcessed,
      skipped: result.totalSkipped,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Hesaplama hatası" };
  }
}
