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

/**
 * Kullanıcının AKTİF organizasyondaki üyeliği — RLS ve org_id çapası.
 * Aktif şirket profiles.active_org_id ile seçilir (şirket seçici);
 * geçersiz/boşsa ilk üyeliğe düşülür — DB'deki current_org_id() ile birebir
 * aynı kural, yoksa uygulama ile RLS farklı org görürdü.
 */
export const getMembership = cache(async (): Promise<Member | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, org_id, user_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("active_org_id")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const memberships = (rows ?? []) as Member[];
  if (memberships.length === 0) return null;
  const activeOrgId = (profile as { active_org_id: string | null } | null)
    ?.active_org_id;
  return memberships.find((m) => m.org_id === activeOrgId) ?? memberships[0];
});

/**
 * Aktif organizasyonun kimliği (istek başına memoize) — marka-duyarlı görsel
 * seçimleri (sahne cutout seti) ve .idx marka kuyruğu için. Yoksa null.
 */
export const getActiveOrg = cache(
  async (): Promise<{ name: string; slug: string } | null> => {
    const m = await getMembership();
    if (!m) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from("organizations")
      .select("name, slug")
      .eq("id", m.org_id)
      .maybeSingle();
    const row = data as { name: string | null; slug: string | null } | null;
    if (!row?.slug) return null;
    return { name: row.name ?? row.slug, slug: row.slug };
  },
);

/** Geriye dönük: yalnız slug isteyenler için. */
export const getActiveOrgSlug = cache(async (): Promise<string | null> => {
  return (await getActiveOrg())?.slug ?? null;
});

/** Şirket seçici için: kullanıcının tüm üyelikleri + org adları. */
export interface MembershipWithOrg extends Member {
  orgName: string;
}

export const listMemberships = cache(
  async (): Promise<MembershipWithOrg[]> => {
    const user = await getUser();
    if (!user) return [];
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("organization_members")
      .select("id, org_id, user_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    const memberships = (rows ?? []) as Member[];
    if (memberships.length === 0) return [];

    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name")
      .in(
        "id",
        memberships.map((m) => m.org_id),
      );
    const nameById = new Map(
      ((orgs ?? []) as { id: string; name: string }[]).map((o) => [o.id, o.name]),
    );
    return memberships.map((m) => ({
      ...m,
      orgName: nameById.get(m.org_id) ?? "Şirket",
    }));
  },
);

/**
 * Üyelik yoksa yönlendirir; org_id ve rol döner. Oturum yoksa /login'e,
 * oturum var ama hiçbir şirkete üye değilse /kurulum sihirbazına (yeni
 * kullanıcı kendi şirketini site içinden kurar).
 */
export async function requireMembership(): Promise<Member> {
  const user = await getUser();
  if (!user) redirect("/login");
  const m = await getMembership();
  if (!m) redirect("/kurulum");
  return m;
}

/** Yönetici rolü (owner/admin) — hassas/yazma işlemleri (Etsy yazma, ekip). */
export function isManager(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** Yönetici olmayan için standart hata mesajı. */
export const MANAGER_ONLY_ERROR =
  "Bu işlem için sahip (owner) veya yönetici (admin) yetkisi gerekir.";
