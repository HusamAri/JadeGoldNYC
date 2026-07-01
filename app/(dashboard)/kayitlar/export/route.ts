import { requireMembership } from "@/lib/auth";
import { listAudit } from "@/lib/db/queries/audit";
import { auditSummary } from "@/lib/audit-format";
import { AUDIT_ACTION_LABELS, AUDIT_SOURCE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

function cell(v: string | null | undefined) {
  let s = v ?? "";
  // CSV/formül enjeksiyonu: = + - @ (veya tab/CR) ile başlayan değerleri nötrle
  // — Excel/Sheets bunları formül sanmasın diye başına tek tırnak ekle.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Mevcut filtrelerle (entity/action/search) denetim kaydını CSV olarak indirir.
export async function GET(request: Request) {
  await requireMembership();
  const sp = new URL(request.url).searchParams;

  const { rows } = await listAudit({
    entityType: sp.get("entity") ?? undefined,
    action: sp.get("action") ?? undefined,
    source: sp.get("source") ?? undefined,
    search: sp.get("search") ?? undefined,
    limit: 5000,
    offset: 0,
  });

  const header = ["Tarih", "Kullanıcı", "İşlem", "Varlık", "Özet", "Kaynak"];
  const lines = [header.join(",")];
  for (const a of rows) {
    lines.push(
      [
        cell(formatDateTime(a.created_at)),
        cell(a.actor_label ?? "Sistem"),
        cell(AUDIT_ACTION_LABELS[a.action] ?? a.action),
        cell(a.entity_type),
        cell(auditSummary(a)),
        cell(AUDIT_SOURCE_LABELS[a.source] ?? a.source),
      ].join(","),
    );
  }
  // BOM → Excel'de Türkçe karakterler doğru görünür.
  const csv = "﻿" + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jadegold-kayitlar-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
