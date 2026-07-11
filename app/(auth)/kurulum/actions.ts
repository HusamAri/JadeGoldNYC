"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface SetupState {
  error?: string;
}

/**
 * Site içinden şirket kurulumu: create_organization RPC'si org + owner
 * üyeliği + sistem maliyet kategorilerini tek işlemde oluşturur ve aktif
 * şirketi yeni org'a çevirir. Hem ilk kurulum hem "yeni şirket ekle" bunu
 * kullanır.
 */
export async function createOrganizationAction(
  _prevState: SetupState,
  formData: FormData,
): Promise<SetupState> {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "USD").trim();
  if (!name) return { error: "Şirket adı gerekli." };
  if (name.length > 120) return { error: "Şirket adı çok uzun." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_currency: currency || "USD",
  });
  if (error) return { error: error.message };

  const orgId = data as string;
  await logAudit(supabase, {
    orgId,
    action: "org.created",
    entityType: "organizations",
    summary: `Şirket kuruldu: ${name}`,
  });

  revalidatePath("/", "layout");
  redirect("/panel");
}
