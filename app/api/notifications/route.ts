import { NextResponse } from "next/server";

import { getMembership } from "@/lib/auth";
import { getAlertCenter } from "@/lib/db/queries/alerts";

/**
 * Üst bar bildirim zilinin veri ucu — Uyarı Merkezi sinyallerini hafif JSON
 * olarak döner. Zil istemcide mount SONRASI çeker: en ağır sorgu (tüm listing
 * denetimi) layout'u/kabuğu bekletmez, sayfa gezinmelerinde tekrar koşmaz.
 */
export async function GET() {
  const m = await getMembership();
  if (!m) return NextResponse.json({ items: [] }, { status: 401 });
  const c = await getAlertCenter(m.org_id);
  return NextResponse.json({
    currency: c.currency,
    counts: c.counts,
    items: c.alerts.map((a) => ({
      key: a.key,
      title: a.title,
      hint: a.hint,
      href: a.href,
      severity: a.severity,
      costCents: a.costCents ?? null,
      actionLabel: a.actionLabel,
    })),
  });
}
