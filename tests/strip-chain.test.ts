import { test } from "node:test";
import assert from "node:assert/strict";

import { legacyRow, originalOf, parseStripSummary, type AuditRow } from "../lib/etsy/strip-chain";
import { stripVisualizationDisclosure as rule20261027 } from "../lib/etsy/legacy/strip-visualization-2026-10-27";

// A 2026-10-27 write: the Etsy text, what that day's rule made of it, the summary it logged.
const BEFORE =
  "Solid gold ring with a gift box & card.\n\n- Made to order.\n" +
  "- The product images are design visualizations, and the three-metal image shows the same design in yellow, white, and rose gold.\n" +
  "- Ships free.";
const AFTER = rule20261027(BEFORE).text;
const SUMMARY = `Görselleştirme beyanı kaldırıldı (ops desc-strip): listing 4569517712, 1 cümle, ${BEFORE.length} -> ${AFTER.length} kr; read-back doğrulandı.`;
const DS = { id: "ds1", created_at: "2026-10-27T20:06:17.143Z", summary: SUMMARY };
// Measured: the panel row lands 0.12-0.45 s before the desc-strip row.
const AT = "2026-10-27T20:06:16.900Z";

test("the frozen 2026-10-27 rule is the one that ran (it took the whole bullet)", () => {
  assert.equal(AFTER, "Solid gold ring with a gift box & card.\n\n- Made to order.\n- Ships free.");
});

test("the 2026-10-27 summary gives the lengths and the read-back", () => {
  assert.deepEqual(parseStripSummary(SUMMARY), { from: BEFORE.length, to: AFTER.length, verified: true });
  assert.deepEqual(parseStripSummary("... 1312 -> 1247 kr; read-back BAŞARISIZ."), { from: 1312, to: 1247, verified: false });
  assert.equal(parseStripSummary("Açıklama güncellendi"), null);
  assert.equal(parseStripSummary(null), null);
});

test("a 2026-10-27 write stands in through the panel copy that reproduces it", () => {
  const row = legacyRow(DS, [
    { created_at: AT, before: BEFORE, after: AFTER },
    { created_at: "2026-10-27T20:06:16.000Z", before: "x", after: "x" }, // no description change
  ]);
  assert.deepEqual(row, { id: "ds1", diff: { before: BEFORE, after: AFTER, verified: true, legacy: true } });
});

test("an HTML-escaped panel copy of the same text is the same text", () => {
  const escaped = BEFORE.replace("&", "&amp;");
  assert.equal(legacyRow(DS, [{ created_at: AT, before: escaped, after: AFTER }])?.diff.before, BEFORE);
});

test("a stale panel copy of the same length gives no chain (review 2026-11-01)", () => {
  // The owner had edited Etsy; the panel still held the old wording, same length.
  const stale = BEFORE.replace("Made to order.", "Made in order.");
  assert.equal(stale.length, BEFORE.length);
  assert.equal(legacyRow(DS, [{ created_at: AT, before: stale, after: AFTER }]), null);
});

test("a panel copy with other lengths, too far off, or no summary gives no chain", () => {
  assert.equal(legacyRow(DS, [{ created_at: AT, before: BEFORE + "!", after: AFTER }]), null);
  assert.equal(legacyRow(DS, [{ created_at: AT, before: BEFORE, after: AFTER + " " }]), null);
  assert.equal(legacyRow(DS, [{ created_at: "2026-10-27T20:07:17.143Z", before: BEFORE, after: AFTER }]), null);
  assert.equal(legacyRow({ ...DS, summary: "Görselleştirme beyanı kaldırıldı" }, [{ created_at: AT, before: BEFORE, after: AFTER }]), null);
  assert.equal(legacyRow(DS, []), null);
});

test("the nearest panel row that reproduces the write is the one", () => {
  const other = "a".repeat(BEFORE.length);
  const row = legacyRow(DS, [
    { created_at: "2026-10-27T20:06:17.100Z", before: other, after: "b".repeat(AFTER.length) },
    { created_at: AT, before: BEFORE, after: AFTER },
  ]);
  assert.equal(row?.diff.before, BEFORE);
});

test("replan walks from a later write back through a 2026-10-27 write to its original", () => {
  const legacy = legacyRow(DS, [{ created_at: AT, before: BEFORE, after: AFTER }]) as AuditRow;
  // A later write without `original` that replaced what 2026-10-27 left.
  const later: AuditRow = { id: "w2", diff: { before: AFTER, after: "Solid gold ring.", verified: true } };
  assert.deepEqual(originalOf([later, legacy], "Solid gold ring."), { original: BEFORE, from: "ds1", verified: true });
  // A later write that recorded as `original` what 2026-10-27 left (the chain could not read it then).
  const recorded: AuditRow = { id: "w3", diff: { before: AFTER, after: "Solid gold ring.", original: AFTER, verified: true } };
  assert.deepEqual(originalOf([recorded, legacy], "Solid gold ring."), { original: BEFORE, from: "ds1", verified: true });
  // The live text is what 2026-10-27 left.
  assert.deepEqual(originalOf([legacy], AFTER), { original: BEFORE, from: "ds1", verified: true });
  // Someone changed it since: no write left the live text.
  assert.equal(originalOf([legacy], "Solid gold ring, edited."), null);
});

test("a recorded original that no earlier write left ends the walk", () => {
  const rows: AuditRow[] = [
    { id: "w3", diff: { before: "B", after: "C", original: "A0", verified: true } },
    { id: "w2", diff: { before: "A", after: "B", verified: true } },
  ];
  assert.deepEqual(originalOf(rows, "C"), { original: "A0", from: "w3", verified: true });
  // An unverified attempt that never landed is skipped; a verified newer one that is not live stops.
  assert.deepEqual(originalOf([{ id: "x", diff: { before: "B", after: "Z", verified: false } }, ...rows.slice(1)], "B"), { original: "A", from: "w2", verified: true });
  assert.equal(originalOf([{ id: "x", diff: { before: "B", after: "Z", verified: true } }, ...rows.slice(1)], "B"), null);
});
