import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { sortListingsBySkuDesc } from "@/lib/variant-sort";

export async function listProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .is("archived_at", null)
    .not("sku", "is", null)
    .neq("sku", "")
    .order("sku", { ascending: false })
    .limit(500);
  if (error) console.error("[listeler] products sorgusu:", error.message);
  return sortListingsBySkuDesc((data ?? []) as Product[]);
}
