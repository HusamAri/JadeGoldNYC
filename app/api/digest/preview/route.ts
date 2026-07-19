import { NextResponse } from "next/server";

import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { collectOrgDigest } from "@/lib/digest/collect";
import { renderDigestHtml, renderDigestSubject } from "@/lib/digest/render-html";

/**
 * Oturum açmış üye için kendi org digest HTML önizlemesi.
 * ?format=json → subject + meta; aksi halde text/html.
 */
export async function GET(request: Request) {
  const m = await requireMembership();
  const admin = createAdminClient();
  const digest = await collectOrgDigest(admin, m.org_id);

  if (!digest) {
    return NextResponse.json(
      {
        error:
          "Digest kapalı veya org bulunamadı. Ayarlar’dan günlük özeti açın.",
      },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      subject: renderDigestSubject(digest),
      orgName: digest.orgName,
      windowLabel: digest.windowLabel,
      actionCount: digest.actions.length,
      kpiCount: digest.kpis.length,
    });
  }

  const html = renderDigestHtml(digest);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
