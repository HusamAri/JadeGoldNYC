"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDailyDigests } from "@/lib/digest/send";

export async function setDigestEnabled(
  enabled: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız owner/admin günlük özeti açıp kapatabilir." };
  }

  // Org update RLS dar olabilir — membership doğrulandıktan sonra admin yazar
  // (altın ayarlarıyla aynı güven modeli: yalnız owner/admin buraya gelir).
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("organizations")
    .select("digest_settings")
    .eq("id", m.org_id)
    .maybeSingle();

  const prev =
    (row as { digest_settings?: Record<string, unknown> } | null)
      ?.digest_settings ?? {};

  const { error } = await admin
    .from("organizations")
    .update({
      digest_settings: { ...prev, enabled },
    })
    .eq("id", m.org_id);

  if (error) return { error: error.message };
  revalidatePath("/ayarlar/gunluk-ozet");
  revalidatePath("/ayarlar");
  return { ok: true };
}

/** Owner/admin: kendi org’una anında bir digesti gönder (test). */
export async function sendDigestNow(): Promise<{
  ok?: boolean;
  error?: string;
  recipients?: number;
}> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız owner/admin test gönderimi yapabilir." };
  }
  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      error:
        "RESEND_API_KEY tanımlı değil. .env.local veya Vercel env’e ekleyin.",
    };
  }

  const admin = createAdminClient();
  const summary = await sendDailyDigests(admin, { orgId: m.org_id });
  const result = summary.results[m.org_id];
  if (result?.error) return { error: result.error };
  if (result?.skipped) return { error: result.skipped };
  return { ok: true, recipients: result?.recipients ?? 0 };
}
