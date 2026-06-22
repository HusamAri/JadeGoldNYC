import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "@/lib/types";

/** Kullanıcı profili (ad + avatar). Yoksa null. */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}
