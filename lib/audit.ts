import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditAction } from "@/lib/types";

/**
 * Uygulama düzeyi denetim kaydı — satır-diff'i olmayan semantik olaylar için
 * (login, csv.import, etsy.connect/sync, report.export).
 *
 * Not: Veri tablolarındaki create/update/delete işlemleri ayrıca Postgres
 * trigger'ları (0011) tarafından otomatik loglanır — burada tekrar loglanmaz.
 *
 * `log_audit` RPC'si SECURITY DEFINER'dır ve actor_id'yi auth.uid()'den alır.
 */
export async function logAudit(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    action: Extract<
      AuditAction,
      | "auth.login"
      | "auth.logout"
      | "csv.import"
      | "etsy.connect"
      | "etsy.sync"
      | "report.export"
    >;
    entityType: string;
    summary: string;
    entityId?: string | null;
    diff?: unknown;
    source?: string;
    actorLabel?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.rpc("log_audit", {
    p_org_id: params.orgId,
    p_action: params.action,
    p_entity_type: params.entityType,
    p_entity_id: params.entityId ?? null,
    p_summary: params.summary,
    p_diff: params.diff ?? null,
    p_source: params.source ?? "app",
    p_actor_label: params.actorLabel ?? null,
  });
  // Loglama, asıl işlemi bozmamalı: hatayı yut, sunucu konsoluna yaz.
  if (error) {
    console.error("logAudit hatası:", error.message);
  }
}
