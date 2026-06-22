"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireUser, getMembership } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export interface ProfileState {
  ok?: boolean;
  error?: string;
}

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "")
    .trim()
    .slice(0, 120);

  let avatarUrl: string | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { error: "Yalnızca görsel dosyası yükleyebilirsiniz." };
    }
    if (file.size > MAX_BYTES) {
      return { error: "Görsel 3 MB'tan küçük olmalı." };
    }
    const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      return { error: "Yükleme başarısız: " + upErr.message };
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
  }

  const patch: Record<string, unknown> = { full_name: fullName || null };
  if (avatarUrl) patch.avatar_url = avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  if (error) {
    return { error: "Kaydedilemedi: " + error.message };
  }

  const m = await getMembership();
  if (m) {
    await logAudit(supabase, {
      orgId: m.org_id,
      action: "profile.update",
      entityType: "profile",
      entityId: user.id,
      summary: avatarUrl
        ? "Profil bilgileri ve fotoğraf güncellendi"
        : "Profil bilgileri güncellendi",
    });
  }

  revalidatePath("/ayarlar/profil");
  revalidatePath("/", "layout");
  return { ok: true };
}
