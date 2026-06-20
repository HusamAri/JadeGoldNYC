import { createClient } from "@/lib/supabase/server";
import type { CartRecovery } from "@/lib/types";

export interface CartSummary {
  total: number;
  totalValueCents: number;
  recovered: number;
  recoveredValueCents: number;
  lost: number;
  open: number;
  recoveryRate: number;
}

export async function getCartSummary(): Promise<CartSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_recoveries")
    .select("status, cart_value_cents, recovered_value_cents");
  const rows = (data ?? []) as {
    status: string;
    cart_value_cents: number | null;
    recovered_value_cents: number | null;
  }[];

  const total = rows.length;
  const totalValueCents = rows.reduce((a, r) => a + (r.cart_value_cents ?? 0), 0);
  const recovered = rows.filter((r) => r.status === "kazanildi").length;
  const recoveredValueCents = rows.reduce(
    (a, r) => a + (r.recovered_value_cents ?? 0),
    0,
  );
  const lost = rows.filter((r) => r.status === "kayip").length;
  const open = rows.filter(
    (r) => r.status === "yeni" || r.status === "iletildi",
  ).length;
  const recoveryRate = total ? recovered / total : 0;

  return {
    total,
    totalValueCents,
    recovered,
    recoveredValueCents,
    lost,
    open,
    recoveryRate,
  };
}

export interface ListCartOptions {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listCartRecoveries(opts: ListCartOptions = {}) {
  const supabase = await createClient();
  const limit = opts.limit ?? 25;
  const offset = opts.offset ?? 0;

  let query = supabase
    .from("cart_recoveries")
    .select("*", { count: "exact" })
    .order("abandoned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) {
    const s = opts.search.replace(/[,()%*]/g, " ").trim();
    if (s) {
      query = query.or(
        `buyer_name.ilike.%${s}%,buyer_email.ilike.%${s}%,item_summary.ilike.%${s}%`,
      );
    }
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as CartRecovery[], count: count ?? 0, limit, offset };
}

export async function getCartRecovery(id: string): Promise<CartRecovery | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_recoveries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CartRecovery) ?? null;
}
