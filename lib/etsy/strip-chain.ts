/**
 * The chain of desc-strip writes for one text of one product (its description, or one
 * translation), newest first, and the way back from the live text to the text before any
 * desc-strip write. Pure: `app/api/ops/desc-strip` reads the audit rows and calls these.
 */
import { normText } from "@/lib/etsy/listing-rewrite";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { stripVisualizationDisclosure as rule20261027 } from "@/lib/etsy/legacy/strip-visualization-2026-10-27";

export type AuditDiff = { lang?: string; before?: string; after?: string; original?: string; verified?: boolean; legacy?: boolean };
export type AuditRow = { id: string; diff: AuditDiff };

/**
 * The text before any desc-strip write, for a live text that one of the writes left. Takes the
 * newest write whose result is the live text; an unverified attempt that does not match (it
 * failed or never landed) is skipped, but a newer VERIFIED write whose result is not the live
 * text means someone changed the text since: null. Then walks back: the text a write started
 * from (its recorded `original`, else its `before`) is, when an earlier write left exactly that
 * text, that earlier write's result, so the walk goes on from there. (An English write of
 * 2026-11-01 recorded as `original` what 2026-10-27 had left, because the chain could not read
 * those writes yet.)
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
  const startOf = (r: AuditRow) => (typeof r.diff.original === "string" ? r.diff.original : (r.diff.before as string));
  for (;;) {
    const start = startOf(rows[i]);
    const j = rows.findIndex((r, k) => k > i && normText(r.diff.after as string) === normText(start));
    if (j < 0) break;
    i = j;
  }
  return { original: startOf(rows[i]), from: rows[i].id, verified };
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
 * text before and after. That route took `before = decodeHtmlEntities(Etsy description)`,
 * wrote `text = stripVisualizationDisclosure(before).text` to Etsy and, once read back, the
 * same `text` to the panel copy; the products trigger row of that update holds the panel copy
 * before it and `text`. The panel copy stands in for the Etsy text only when it IS that text
 * as far as the write can tell: decoded, its length is the summary's, and the frozen rule of
 * that day (lib/etsy/legacy) turns it into exactly the text written. A copy that differs gives
 * no chain and the product is reported, never written: 15 of the 196 had other lengths, and an
 * equal-length stale copy fails the rule wherever the rule kept text. What it cannot see is a
 * difference inside the sentences that rule removed; from those, replan restores at most the
 * multi-metal caption (a closed grammar, strip-visualization.ts), and the dry run shows it for
 * a person to read before any write.
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
  for (const p of near) {
    const before = decodeHtmlEntities(p.before as string);
    const after = p.after as string;
    if (before.length !== s.from || after.length !== s.to) continue;
    if (rule20261027(before).text !== after) continue;
    return { id: ds.id, diff: { before, after, verified: s.verified, legacy: true } };
  }
  return null;
}
