"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth";
import { countOwners } from "@/lib/db/queries/team";
import type { Role } from "@/lib/types";

/** İstemciden gelen rol değeri çalışma-zamanı doğrulaması (server action). */
const roleSchema = z.enum(["owner", "admin", "member"]);

export interface TeamActionResult {
  ok?: boolean;
  error?: string;
}

const OWNER_ONLY_ERROR = "Bu işlem için sahip (owner) rolü gereklidir.";
const LAST_OWNER_ERROR =
  "Organizasyonda en az bir sahip (owner) kalmalıdır. Bu işlem son sahibi kaldırır.";

/**
 * E-posta ile yeni üye davet eder. Yalnızca sahip.
 *
 * Platform modeli: davet artık org'a bağlı — org_invites satırı yazılır;
 * kullanıcı kaydolduğunda DB trigger'ı (handle_new_user) daveti tüketip
 * DAVET EDEN şirkete üye yapar (eski davranış: ilk org'a girerdi).
 * E-posta zaten kayıtlı bir kullanıcıya aitse davet maili yerine üyelik
 * doğrudan eklenir (aynı hesap ikinci şirkete katılır).
 */
export async function inviteMember(email: string): Promise<TeamActionResult> {
  const m = await requireMembership();
  if (m.role !== "owner") return { error: OWNER_ONLY_ERROR };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "E-posta adresi gerekli." };

  try {
    const admin = createAdminClient();

    // Davet kaydı — trigger'ın hangi org'a üye yapacağını belirler.
    const { error: inviteRowError } = await admin.from("org_invites").upsert(
      {
        org_id: m.org_id,
        email: trimmed,
        role: "member",
        invited_by: m.user_id,
        accepted_at: null,
      },
      { onConflict: "org_id,email" },
    );
    if (inviteRowError) return { error: inviteRowError.message };

    const { error } = await admin.auth.admin.inviteUserByEmail(trimmed);
    if (error) {
      // Kullanıcı zaten kayıtlıysa üyeliği doğrudan ekle.
      const already = /already|registered|exists/i.test(error.message);
      if (!already) return { error: error.message };

      const { data: userList, error: listError } =
        await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return { error: listError.message };
      const target = userList.users.find(
        (u) => u.email?.toLowerCase() === trimmed,
      );
      if (!target) return { error: error.message };

      const { error: memberError } = await admin
        .from("organization_members")
        .upsert(
          { org_id: m.org_id, user_id: target.id, role: "member" },
          { onConflict: "org_id,user_id" },
        );
      if (memberError) return { error: memberError.message };
      await admin
        .from("org_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("org_id", m.org_id)
        .eq("email", trimmed);
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Davet gönderilemedi.",
    };
  }

  revalidatePath("/ayarlar/ekip");
  return { ok: true };
}

/** Üyenin rolünü değiştirir. Son sahibi düşürmeye izin vermez. Yalnızca sahip. */
export async function updateMemberRole(
  memberRowId: string,
  newRole: Role,
): Promise<TeamActionResult> {
  const m = await requireMembership();
  if (m.role !== "owner") return { error: OWNER_ONLY_ERROR };

  const parsedRole = roleSchema.safeParse(newRole);
  if (!parsedRole.success) return { error: "Geçersiz rol." };
  newRole = parsedRole.data;

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_members")
    .select("id, org_id, role")
    .eq("id", memberRowId)
    .maybeSingle();
  const row = target as { id: string; org_id: string; role: Role } | null;
  if (!row) return { error: "Üye bulunamadı." };

  if (row.role === "owner" && newRole !== "owner") {
    const owners = await countOwners(row.org_id);
    if (owners <= 1) return { error: LAST_OWNER_ERROR };
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: newRole })
    .eq("id", memberRowId);
  if (error) return { error: error.message };

  revalidatePath("/ayarlar/ekip");
  return { ok: true };
}

/** Üyeyi organizasyondan çıkarır. Son sahibi kaldırmaya izin vermez. Yalnızca sahip. */
export async function removeMember(memberRowId: string): Promise<TeamActionResult> {
  const m = await requireMembership();
  if (m.role !== "owner") return { error: OWNER_ONLY_ERROR };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_members")
    .select("id, org_id, user_id, role")
    .eq("id", memberRowId)
    .maybeSingle();
  const row = target as
    | { id: string; org_id: string; user_id: string; role: Role }
    | null;
  if (!row) return { error: "Üye bulunamadı." };

  if (row.role === "owner") {
    const owners = await countOwners(row.org_id);
    if (owners <= 1) return { error: LAST_OWNER_ERROR };
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberRowId);
  if (error) return { error: error.message };

  revalidatePath("/ayarlar/ekip");
  return { ok: true };
}
