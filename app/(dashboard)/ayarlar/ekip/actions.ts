"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth";
import { countOwners } from "@/lib/db/queries/team";
import type { Role } from "@/lib/types";

export interface TeamActionResult {
  ok?: boolean;
  error?: string;
}

const OWNER_ONLY_ERROR = "Bu işlem için sahip (owner) rolü gereklidir.";
const LAST_OWNER_ERROR =
  "Organizasyonda en az bir sahip (owner) kalmalıdır. Bu işlem son sahibi kaldırır.";

/** E-posta ile yeni üye davet eder (Supabase Auth invite). Yalnızca sahip. */
export async function inviteMember(email: string): Promise<TeamActionResult> {
  const m = await requireMembership();
  if (m.role !== "owner") return { error: OWNER_ONLY_ERROR };

  const trimmed = email.trim();
  if (!trimmed) return { error: "E-posta adresi gerekli." };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(trimmed);
    if (error) return { error: error.message };
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
