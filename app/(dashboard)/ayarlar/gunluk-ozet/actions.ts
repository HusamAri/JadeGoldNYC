"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseDigestEmailList } from "@/lib/digest/emails";
import {
  normalizeDigestContentPrefs,
  type DigestActionLevel,
  type DigestSectionKey,
} from "@/lib/digest/preferences";
import { sendDailyDigests } from "@/lib/digest/send";
import { isEmailConfigured } from "@/lib/email/send";

async function readDigestSettings(orgId: string) {
  const admin = createAdminClient();
  const { data: row, error: readErr } = await admin
    .from("organizations")
    .select("digest_settings")
    .eq("id", orgId)
    .maybeSingle();

  if (readErr?.message?.includes("digest_settings")) {
    return {
      admin,
      prev: null as Record<string, unknown> | null,
      error:
        "Veritabanında digest_settings kolonu yok. Supabase SQL Editor’da migration 0106’yı çalıştırın.",
    };
  }

  const prev =
    (row as { digest_settings?: Record<string, unknown> } | null)
      ?.digest_settings ?? {};
  return { admin, prev, error: null as string | null };
}

export async function setDigestEnabled(
  enabled: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız owner/admin günlük özeti açıp kapatabilir." };
  }

  const { admin, prev, error: readError } = await readDigestSettings(m.org_id);
  if (readError) return { error: readError };

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

/** Elle alıcı listesi — satır/virgül ayrılmış metin. Boş = org üyelerine düş. */
export async function setDigestRecipients(
  raw: string,
): Promise<{ ok?: boolean; error?: string; emails?: string[] }> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız owner/admin alıcı listesini değiştirebilir." };
  }

  const emails = parseDigestEmailList(raw);
  const invalidLeft = raw
    .split(/[\n,;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !emails.includes(p.toLowerCase()));
  if (invalidLeft.length > 0) {
    return {
      error: `Geçersiz e-posta: ${invalidLeft.slice(0, 3).join(", ")}`,
    };
  }

  const { admin, prev, error: readError } = await readDigestSettings(m.org_id);
  if (readError) return { error: readError };

  const { error } = await admin
    .from("organizations")
    .update({
      digest_settings: { ...prev, emails },
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
  return { ok: true, emails };
}

/** Hangi bölümler + aksiyon eşiği — preference center. */
export async function setDigestContentPrefs(input: {
  sections: Partial<Record<DigestSectionKey, boolean>>;
  actionLevel: DigestActionLevel;
}): Promise<{
  ok?: boolean;
  error?: string;
  sections?: Record<DigestSectionKey, boolean>;
  actionLevel?: DigestActionLevel;
}> {
  const m = await requireMembership();
  if (m.role !== "owner" && m.role !== "admin") {
    return { error: "Yalnız owner/admin içerik tercihlerini değiştirebilir." };
  }

  const normalized = normalizeDigestContentPrefs({
    sections: input.sections,
    actionLevel: input.actionLevel,
  });

  const { admin, prev, error: readError } = await readDigestSettings(m.org_id);
  if (readError) return { error: readError };

  const { error } = await admin
    .from("organizations")
    .update({
      digest_settings: {
        ...prev,
        sections: normalized.sections,
        actionLevel: normalized.actionLevel,
      },
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
  return {
    ok: true,
    sections: normalized.sections,
    actionLevel: normalized.actionLevel,
  };
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
  if (!isEmailConfigured()) {
    return {
      error:
        "E-posta yapılandırılmadı. Vercel’de SMTP_USER + SMTP_PASS (Gmail App Password) veya RESEND_API_KEY ekleyin.",
    };
  }

  // Oturum e-postası — admin.listUsers/getUserById boş dönerse yedek alıcı.
  const user = await requireUser();
  const sessionEmail = user.email?.trim() ?? "";

  const admin = createAdminClient();
  const summary = await sendDailyDigests(admin, {
    orgId: m.org_id,
    extraRecipients: sessionEmail
      ? [{ email: sessionEmail, name: null, role: m.role }]
      : undefined,
  });
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
        error: sessionEmail
          ? "Alıcı yok. Ayarlar’da e-posta listesine en az bir adres ekle."
          : "Alıcı listesi boş ve oturumunda e-posta yok.",
      };
    }
    return { error: result.skipped };
  }
  return { ok: true, recipients: result?.recipients ?? 0 };
}
