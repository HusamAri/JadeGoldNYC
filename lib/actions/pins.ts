"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership, requireUser } from "@/lib/auth";

export interface PinActionState {
  error?: string;
}

/**
 * Bir hedefe kendi setinden pin iğneler. Aynı hedefe aynı pin BİRDEN ÇOK kez
 * iğnelenebilir (kullanıcı kararı: gerçek hayattaki gibi yan yana dizilir) —
 * benzersizlik kısıtı bilerek yok. RLS: yalnız kendi setindeki sticker +
 * aktif org'un hedefi.
 */
export async function addPin(input: {
  targetType: "task" | "sale" | "event" | "audit";
  targetId: string;
  stickerId: string;
  /** revalidate edilecek sayfa yolu (iğnelenen yüzey). */
  path: string;
}): Promise<PinActionState> {
  const user = await requireUser();
  const m = await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("pins").insert({
    org_id: m.org_id,
    sticker_id: input.stickerId,
    pinned_by: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
  });
  if (error) {
    console.error("[pins] addPin:", error.message);
    return { error: "Pin iğnelenemedi." };
  }
  revalidatePath(input.path);
  return {};
}

/** Pini kaldırır — RLS gereği yalnız iğneleyen ya da owner/admin. */
export async function removePin(input: {
  pinId: string;
  path: string;
}): Promise<PinActionState> {
  await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("pins").delete().eq("id", input.pinId);
  if (error) {
    console.error("[pins] removePin:", error.message);
    return { error: "Pin kaldırılamadı." };
  }
  revalidatePath(input.path);
  return {};
}
