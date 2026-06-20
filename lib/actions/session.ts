"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export interface SignInState {
  error?: string;
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
  }

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
