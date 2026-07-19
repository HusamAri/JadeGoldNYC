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
  const { data: row, error: readErr } = await admin
    .from("organizations")
    .select("digest_settings")
    .eq("id", m.org_id)
    .maybeSingle();

  if (readErr?.message?.includes("digest_settings")) {
    return {
      error:
        "Veritabanında digest_settings kolonu yok. Supabase SQL Editor’da migration 0106’yı çalıştırın.",
    };
  }

  const prev =
    (row as { digest_settings?: Record<string, unknown> } | null)
      ?.digest_settings ?? {};

  const { error } = await admin
    .from("organizations")
    .update({
      digest_settings: { ...prev, enabled },
    })
    .eq("id", m.org_id);

  if (error) {
    if (error.message.includes("digest_settings")) {
      return {
        error:
          "Veritabanında digest_settings kolonu yok. Supabase SQL Editor’da migration 0106’yı çalıştırın.",
      };
    }
    return { error: error.message };
  }
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
  if (result?.skipped) {
    if (result.skipped.includes("digest kapalı")) {
      return {
        error:
          "Özet üretilemedi. Çoğu zaman sebep: production DB’de digest_settings kolonu yok (migration 0106). Supabase SQL Editor’da ekleyin, sonra tekrar deneyin.",
      };
    }
    if (result.skipped.includes("e-postalı")) {
      return {
        error:
          "Org üyelerinin e-postası bulunamadı. Ayarlar → Ekip’te üyeleri kontrol et; sorun sürerse service-role / auth admin erişimini doğrula.",
      };
    }
    return { error: result.skipped };
  }
  return { ok: true, recipients: result?.recipients ?? 0 };
}
