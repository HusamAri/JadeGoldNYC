import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendDailyDigests } from "@/lib/digest/send";
import { isEmailConfigured } from "@/lib/email/send";

export const maxDuration = 60;

/**
 * Günlük marka özet e-postası — senkron cron'larından sonra (11:00 UTC).
 * Bearer CRON_SECRET. SMTP veya Resend yoksa 503.
 *
 * Manuel: GET /api/cron/daily-digest?org=<uuid>&dry=1
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email not configured — set SMTP_USER/SMTP_PASS (Gmail) or RESEND_API_KEY",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const orgId = url.searchParams.get("org") ?? undefined;
  const dryRun = url.searchParams.get("dry") === "1";

  const admin = createAdminClient();
  const summary = await sendDailyDigests(admin, { orgId, dryRun });

  return NextResponse.json({ ok: summary.errors.length === 0, ...summary });
}
