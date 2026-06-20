import { AUDIT_ACTION_LABELS, ENTITY_TYPE_LABELS } from "@/lib/constants";

/** Denetim kaydı için Türkçe özet üretir (trigger satırlarında summary null'dır). */
export function auditSummary(row: {
  summary: string | null;
  action: string;
  entity_type: string;
}): string {
  if (row.summary) return row.summary;
  const entity = ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type;
  const action = (
    AUDIT_ACTION_LABELS[row.action] ?? row.action
  ).toLocaleLowerCase("tr");
  return `${entity} ${action}`;
}
