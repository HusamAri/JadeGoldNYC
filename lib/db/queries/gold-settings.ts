import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";

export interface GoldSettings {
  purchase_price_14k_cents: number;
  purchase_price_10k_cents: number;
}

const DEFAULTS: GoldSettings = {
  purchase_price_14k_cents: 101_00,
  purchase_price_10k_cents: 65_00,
};

export async function getGoldSettings(): Promise<GoldSettings> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("gold_settings")
    .eq("id", m.org_id)
    .maybeSingle();

  const raw = (data as { gold_settings?: Partial<GoldSettings> } | null)
    ?.gold_settings;

  return {
    purchase_price_14k_cents:
      raw?.purchase_price_14k_cents ?? DEFAULTS.purchase_price_14k_cents,
    purchase_price_10k_cents:
      raw?.purchase_price_10k_cents ?? DEFAULTS.purchase_price_10k_cents,
  };
}
