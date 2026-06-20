import { createClient } from "@/lib/supabase/server";
import type { ShopMetric } from "@/lib/types";

export async function listMetrics(): Promise<ShopMetric[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shop_metrics")
    .select("*")
    .order("period_end", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as ShopMetric[];
}

export async function getMetric(id: string): Promise<ShopMetric | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shop_metrics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as ShopMetric) ?? null;
}
