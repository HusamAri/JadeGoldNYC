import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

/** Organizasyon üyesi — profil ve e-posta bilgisiyle (Ekip sayfası). */
export interface OrgMember {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

/** Organizasyon üyelerini profil + e-posta bilgisiyle döndürür (Ekip sayfası). */
export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  const rows = (members ?? []) as {
    id: string;
    user_id: string;
    role: Role;
    created_at: string;
  }[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  const pmap = new Map(
    ((profs ?? []) as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }[]).map((p) => [p.id, p]),
  );

  // E-postalar auth.users'ta — yalnızca service-role admin istemcisiyle okunabilir.
  // Üye sayısı küçük olduğundan tek sayfalık listUsers() yeterli; sınırı üye
  // sayısının üstünde tutuyoruz (varsayılan sayfa boyutu 50'nin altında kalabilir).
  const emap = new Map<string, string | null>();
  try {
    const admin = createAdminClient();
    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: Math.max(200, ids.length),
    });
    for (const u of authData?.users ?? []) {
      if (ids.includes(u.id)) emap.set(u.id, u.email ?? null);
    }
  } catch {
    // Service-role yapılandırılmamışsa e-postasız devam et (liste yine çalışsın).
  }

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    role: r.role,
    created_at: r.created_at,
    full_name: pmap.get(r.user_id)?.full_name ?? null,
    avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
    email: emap.get(r.user_id) ?? null,
  }));
}

/** Organizasyondaki 'owner' rolündeki üye sayısı (son sahip korumasi için). */
export async function countOwners(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "owner");
  return count ?? 0;
}
