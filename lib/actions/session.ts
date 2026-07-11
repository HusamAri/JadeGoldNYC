"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMembership, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export interface SignInState {
  error?: string;
  /** signUp: e-posta doğrulama bekleniyor (oturum açılmadı). */
  confirmEmail?: boolean;
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Giriş başarısız. E-posta veya şifre hatalı." };
  }

  const m = await getMembership();
  if (m) {
    await logAudit(supabase, {
      orgId: m.org_id,
      action: "auth.login",
      entityType: "auth",
      summary: `${email} giriş yaptı`,
    });
    redirect("/panel");
  }
  // Hiçbir şirkete üye değil → site içinden şirket kurulum sihirbazı.
  redirect("/kurulum");
}

/**
 * Self-serve kayıt: yeni e-posta → yeni hesap. Bekleyen davet varsa DB
 * trigger'ı (handle_new_user) kullanıcıyı davet eden şirkete üye yapar;
 * yoksa /kurulum sihirbazında kendi şirketini kurar.
 */
export async function signUp(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  });
  if (error) {
    return { error: error.message };
  }
  // E-posta doğrulaması açıksa oturum dönmez; kullanıcıya bilgi ver.
  if (!data.session) {
    return { confirmEmail: true };
  }
  const m = await getMembership();
  redirect(m ? "/panel" : "/kurulum");
}

/**
 * Aktif şirketi değiştirir (şirket seçici). profiles.active_org_id hem
 * uygulamanın hem RLS'in (current_org_id) org çapası olduğundan tek
 * güncelleme tüm paneli yeni şirkete geçirir.
 */
export async function switchOrganization(orgId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  // Yalnız gerçekten üyesi olduğu bir org'a geçebilir.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!membership) return;

  await supabase
    .from("profiles")
    .update({ active_org_id: orgId })
    .eq("id", user.id);

  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const m = await getMembership();
  if (m) {
    await logAudit(supabase, {
      orgId: m.org_id,
      action: "auth.logout",
      entityType: "auth",
      summary: "Çıkış yapıldı",
    });
  }
  await supabase.auth.signOut();
  redirect("/login");
}
