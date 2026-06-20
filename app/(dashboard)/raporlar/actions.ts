"use server";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function logReportExport(label: string): Promise<void> {
  const m = await requireMembership();
  const supabase = await createClient();
  await logAudit(supabase, {
    orgId: m.org_id,
    action: "report.export",
    entityType: "report",
    summary: `Rapor dışa aktarıldı (${label})`,
    source: "app",
  });
}
