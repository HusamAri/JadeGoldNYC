import { test } from "node:test";
import assert from "node:assert/strict";

import { legacyRow, originalOf, parseStripSummary, type AuditRow } from "../lib/etsy/strip-chain";

// The 2026-10-27 summary, verbatim in form.
const SUMMARY = "Görselleştirme beyanı kaldırıldı (ops desc-strip): listing 4569517712, 1 cümle, 25 -> 12 kr; read-back doğrulandı.";
const BEFORE = "Gold ring. Images are AI."; // 25
const AFTER = "Gold ring. "; // 11
const AFTER12 = "Gold ring.  "; // 12
const DS = { id: "ds1", created_at: "2026-10-27T20:06:17.143Z", summary: SUMMARY };

test("the 2026-10-27 summary gives the lengths and the read-back", () => {
  assert.deepEqual(parseStripSummary(SUMMARY), { from: 25, to: 12, verified: true });
  assert.deepEqual(parseStripSummary("... 1312 -> 1247 kr; read-back BAŞARISIZ."), { from: 1312, to: 1247, verified: false });
  assert.equal(parseStripSummary("Açıklama güncellendi"), null);
  assert.equal(parseStripSummary(null), null);
});

test("a 2026-10-27 write stands in through the panel copy of the same request", () => {
  // Measured: the panel row lands 0.12-0.45 s before the desc-strip row.
  const row = legacyRow(DS, [
    { created_at: "2026-10-27T20:06:16.900Z", before: BEFORE, after: AFTER12 },
    { created_at: "2026-10-27T20:06:16.000Z", before: "x", after: "x" }, // no description change
  ]);
  assert.deepEqual(row, { id: "ds1", diff: { before: BEFORE, after: AFTER12, verified: true, legacy: true } });
});

test("a panel copy that was not the Etsy text it replaced gives no chain", () => {
  // Lengths differ from the summary: the panel held another text (15 of the 196).
  assert.equal(legacyRow(DS, [{ created_at: "2026-10-27T20:06:16.900Z", before: BEFORE + "!", after: AFTER12 }]), null);
  assert.equal(legacyRow(DS, [{ created_at: "2026-10-27T20:06:16.900Z", before: BEFORE, after: AFTER }]), null);
  // Too far from the write to be the same request.
  assert.equal(legacyRow(DS, [{ created_at: "2026-10-27T20:07:17.143Z", before: BEFORE, after: AFTER12 }]), null);
  // No lengths recorded.
  assert.equal(legacyRow({ ...DS, summary: "Görselleştirme beyanı kaldırıldı" }, [{ created_at: DS.created_at, before: BEFORE, after: AFTER12 }]), null);
  assert.equal(legacyRow(DS, []), null);
});

test("the nearest panel row is the one of the same request", () => {
  const row = legacyRow(DS, [
    { created_at: "2026-10-27T20:06:12.000Z", before: "a".repeat(25), after: "b".repeat(12) },
    { created_at: "2026-10-27T20:06:16.990Z", before: BEFORE, after: AFTER12 },
  ]);
  assert.equal(row?.diff.before, BEFORE);
});

test("replan walks from a later write back through a 2026-10-27 write to its original", () => {
  const legacy = legacyRow(DS, [{ created_at: "2026-10-27T20:06:16.900Z", before: BEFORE, after: AFTER12 }]) as AuditRow;
  // A later write without `original` that replaced what 2026-10-27 left.
  const later: AuditRow = { id: "w2", diff: { before: AFTER12, after: "Gold ring.", verified: true } };
  assert.deepEqual(originalOf([later, legacy], "Gold ring."), { original: BEFORE, from: "ds1", verified: true });
  // The live text is what 2026-10-27 left.
  assert.deepEqual(originalOf([legacy], AFTER12), { original: BEFORE, from: "ds1", verified: true });
  // Someone changed it since: no write left the live text.
  assert.equal(originalOf([legacy], "Gold ring, edited."), null);
});

test("a recorded original wins over walking back", () => {
  const rows: AuditRow[] = [
    { id: "w3", diff: { before: "B", after: "C", original: "A0", verified: true } },
    { id: "w2", diff: { before: "A", after: "B", verified: true } },
  ];
  assert.deepEqual(originalOf(rows, "C"), { original: "A0", from: "w3", verified: true });
  // An unverified attempt that never landed is skipped; a verified newer one that is not live stops.
  assert.deepEqual(originalOf([{ id: "x", diff: { before: "B", after: "Z", verified: false } }, ...rows.slice(1)], "B"), { original: "A", from: "w2", verified: true });
  assert.equal(originalOf([{ id: "x", diff: { before: "B", after: "Z", verified: true } }, ...rows.slice(1)], "B"), null);
});
