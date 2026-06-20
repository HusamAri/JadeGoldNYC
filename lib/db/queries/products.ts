import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export async function listProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("title", { ascending: true })
    .limit(500);
  return (data ?? []) as Product[];
}
