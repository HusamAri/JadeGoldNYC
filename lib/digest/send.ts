import type { SupabaseClient } from "@supabase/supabase-js";

import {
  collectOrgDigest,
  listDigestOrgIds,
  listDigestRecipients,
} from "@/lib/digest/collect";
import { renderDigestHtml, renderDigestSubject } from "@/lib/digest/render-html";
import { isEmailConfigured, sendEmail } from "@/lib/email/resend";
export type DigestSendSummary = {
  orgs: number;
  sent: number;
  skipped: number;
  errors: string[];
  results: Record<
    string,
    { recipients: number; emailId?: string; error?: string; skipped?: string }
  >;
};

/**
 * Tüm (veya tek) org için günlük digest üretir ve üyelerine gönderir.
 * `extraRecipients`: manuel “Şimdi gönder” için oturum e-postası yedeği.
 */
export async function sendDailyDigests(
  admin: SupabaseClient,
  opts: {
    orgId?: string;
    dryRun?: boolean;
    extraRecipients?: { email: string; name: string | null; role: string }[];
  } = {},
): Promise<DigestSendSummary> {
  const summary: DigestSendSummary = {
    orgs: 0,
    sent: 0,
    skipped: 0,
    errors: [],
    results: {},
  };

  if (!opts.dryRun && !isEmailConfigured()) {
    summary.errors.push(
      "E-posta yapılandırılmadı (SMTP_USER/SMTP_PASS veya RESEND_API_KEY).",
    );
    return summary;
  }

  const orgIds = opts.orgId
    ? [opts.orgId]
    : await listDigestOrgIds(admin);
  summary.orgs = orgIds.length;

  for (const orgId of orgIds) {
    try {
      const digest = await collectOrgDigest(admin, orgId);
      if (!digest) {
        summary.skipped += 1;
        summary.results[orgId] = {
          recipients: 0,
          skipped: "digest kapalı veya org yok",
        };
        continue;
      }

      let recipients = await listDigestRecipients(admin, orgId);
      if (recipients.length === 0 && opts.extraRecipients?.length) {
        recipients = opts.extraRecipients.filter((r) => r.email.trim());
      }
      if (recipients.length === 0) {
        summary.skipped += 1;
        summary.results[orgId] = {
          recipients: 0,
          skipped: "e-postalı üye yok",
        };
        continue;
      }

      const html = renderDigestHtml(digest);
      const subject = renderDigestSubject(digest);

      if (opts.dryRun) {
        summary.results[orgId] = {
          recipients: recipients.length,
          skipped: "dry-run",
        };
        summary.skipped += 1;
        continue;
      }

      // Resend: tek istekte birden fazla alıcı.
      const result = await sendEmail({
        to: recipients.map((r) => r.email),
        subject,
        html,
      });

      if (!result.ok) {
        summary.errors.push(`${digest.orgName}: ${result.error}`);
        summary.results[orgId] = {
          recipients: recipients.length,
          error: result.error,
        };
        continue;
      }

      summary.sent += 1;
      summary.results[orgId] = {
        recipients: recipients.length,
        emailId: result.id,
      };

      // Şirket hafızası — sistem aktörü (auth.uid yok).
      try {
        await admin.from("audit_log").insert({
          org_id: orgId,
          actor_id: null,
          actor_label: "Daily Digest",
          action: "digest.daily_sent",
          entity_type: "organization",
          entity_id: orgId,
          summary: `Günlük özet e-postası gönderildi (${recipients.length} alıcı)`,
          diff: {
            email_id: result.id,
            recipient_count: recipients.length,
          },
          source: "cron",
        });
      } catch {
        // audit başarısız olsa mail gitmiş sayılır
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "digest error";
      summary.errors.push(`${orgId}: ${msg}`);
      summary.results[orgId] = { recipients: 0, error: msg };
    }
  }

  return summary;
}
