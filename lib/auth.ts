import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

/** Geçerli oturumdaki kullanıcı (istek başına memoize edilir). */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Kullanıcı yoksa /login'e yönlendirir. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Kullanıcının organizasyon üyeliği — RLS ve org_id çapası. */
export const getMembership = cache(async (): Promise<Member | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("id, org_id, user_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return (data as Member) ?? null;
});

/** Üyelik yoksa /login'e yönlendirir; org_id ve rol döner. */
export async function requireMembership(): Promise<Member> {
  const m = await getMembership();
  if (!m) redirect("/login");
  return m;
}
