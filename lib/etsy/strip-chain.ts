/**
 * The chain of desc-strip writes for one text of one product (its description, or one
 * translation), newest first, and the way back from the live text to the text before any
 * desc-strip write. Pure: `app/api/ops/desc-strip` reads the audit rows and calls these.
 */
import { normText } from "@/lib/etsy/listing-rewrite";

export type AuditDiff = { lang?: string; before?: string; after?: string; original?: string; verified?: boolean; legacy?: boolean };
export type AuditRow = { id: string; diff: AuditDiff };

/**
 * The text before any desc-strip write, for a live text that one of the writes left. Takes the
 * newest write whose result is the live text; an unverified attempt that does not match (it
 * failed or never landed) is skipped, but a newer VERIFIED write whose result is not the live
 * text means someone changed the text since: null. Then walks back through writes that recorded
 * no `original`, each one the result of the write before it.
 */
export function originalOf(rows: AuditRow[], live: string): { original: string; from: string; verified: boolean } | null {
  let i = -1;
  for (let k = 0; k < rows.length; k++) {
    if (normText(rows[k].diff.after as string) === normText(live)) {
      i = k;
      break;
    }
    if (rows[k].diff.verified === true) return null;
  }
  if (i < 0) return null;
  const verified = rows[i].diff.verified === true;
  while (typeof rows[i].diff.original !== "string") {
    const cur = rows[i];
    const j = rows.findIndex((r, k) => k > i && normText(r.diff.after as string) === normText(cur.diff.before as string));
    if (j < 0) break;
    i = j;
  }
  const row = rows[i];
  return { original: typeof row.diff.original === "string" ? row.diff.original : (row.diff.before as string), from: row.id, verified };
}

/** "... listing 4569517712, 1 cümle, 1312 -> 1247 kr; read-back doğrulandı." */
export function parseStripSummary(summary: string | null | undefined): { from: number; to: number; verified: boolean } | null {
  const m = /(\d+) -> (\d+) kr\b/.exec(summary ?? "");
  if (!m) return null;
  return { from: Number(m[1]), to: Number(m[2]), verified: /read-back doğrulandı/.test(summary ?? "") };
}

export type PanelUpdate = { created_at: string; before: string | null; after: string | null };

// The panel copy is written in the same request as the Etsy write, a fraction of a second
// before the desc-strip row (2026-10-27: 0.12-0.45 s, all 196 writes).
const LEGACY_WINDOW_MS = 10_000;

/**
 * The desc-strip writes of 2026-10-27 recorded no diff, only a summary with the lengths of the
 * text before and after. The same request wrote the result to the panel copy, so the products
 * trigger row (`update`, description before -> after) holds both texts. It stands in for the
 * missing diff only when its lengths are the ones the summary recorded: a panel copy that was
 * not the Etsy text it replaced (15 of the 196) is not that text, and then there is no chain
 * (the product is reported, never written).
 */
export function legacyRow(
  ds: { id: string; created_at: string; summary: string | null },
  panel: PanelUpdate[],
): AuditRow | null {
  const s = parseStripSummary(ds.summary);
  if (!s) return null;
  const at = Date.parse(ds.created_at);
  const near = panel
    .filter((p) => typeof p.before === "string" && typeof p.after === "string" && p.before !== p.after)
    .filter((p) => Math.abs(Date.parse(p.created_at) - at) <= LEGACY_WINDOW_MS)
    .sort((a, b) => Math.abs(Date.parse(a.created_at) - at) - Math.abs(Date.parse(b.created_at) - at));
  const p = near[0];
  if (!p || (p.before as string).length !== s.from || (p.after as string).length !== s.to) return null;
  return { id: ds.id, diff: { before: p.before as string, after: p.after as string, verified: s.verified, legacy: true } };
}
