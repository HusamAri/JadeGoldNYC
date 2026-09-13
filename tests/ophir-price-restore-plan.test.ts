import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";

import {
  buildOphirPriceRestoreCasBatches,
  buildOphirPriceRestorePlan,
  classifyOphirPriceRestoreCurrentValue,
  type OphirPriceAuditRecord,
} from "../lib/ophir-price-restore-plan";

const PRODUCT = "10000000-0000-4000-8000-000000000001";
const VARIANT = "20000000-0000-4000-8000-000000000001";
const ORG = "30000000-0000-4000-8000-000000000001";
const LISTING = 4558671043;

function auditId(index: number) {
  return `40000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function record(index = 1, beforeCents = 51200, afterCents = 57500): OphirPriceAuditRecord {
  const identity = { id: VARIANT, sku: "OPH-4558671043-10Y-9", product_id: PRODUCT,
    etsy_listing_id: LISTING, currency: "USD", price_cents: beforeCents };
  return { audit_id: auditId(index), created_at: "2026-08-29T18:49:00.000001Z", entity_id: VARIANT,
    before: identity, after: { ...identity, price_cents: afterCents } };
}

function productRecord(index = 90, beforeCents = 36600, afterCents = 39500): OphirPriceAuditRecord {
  const row = record(index, beforeCents, afterCents);
  const before = { ...row.before, id: PRODUCT, sku: null, product_id: null };
  return { ...row, entity_id: PRODUCT, before, after: { ...before, price_cents: afterCents } };
}

function plan(variantRecords: unknown[], productRecords: unknown[] = []) {
  return buildOphirPriceRestorePlan({ variantRecords, productRecords });
}

test("collapses only a continuous audited operation and retains exact product anchors", () => {
  const first = record(1, 51200, 54000);
  const second = { ...record(2, 54000, 57500), created_at: "2026-08-29T18:50:00Z" };
  const result = plan([second, first], [productRecord()]);
  assert.deepEqual(result.manifest, [{ auditIds: [auditId(1), auditId(2)], variantId: VARIANT,
    productId: PRODUCT, listingId: LISTING, sku: first.before.sku, currency: "USD",
    beforeCents: 51200, afterCents: 57500 }]);
  assert.deepEqual(result.productAnchors, [{ auditIds: [auditId(90)], productId: PRODUCT,
    listingId: LISTING, sku: null, currency: "USD", beforeCents: 36600, afterCents: 39500 }]);
  assert.equal(result.listingGroups.length, 1);
  assert.deepEqual(result.listingGroups[0].variants, result.manifest);
  assert.deepEqual(result.listingGroups[0].productAnchor, result.productAnchors[0]);
  assert.equal(result.totalChangedTargets, 1);
  assert.equal(result.totalChangedProductAnchors, 1);
  assert.equal(result.minAuditTimestamp, "2026-08-29T18:49:00.000001Z");
  assert.equal(result.maxAuditTimestamp, "2026-08-29T18:50:00.000000Z");
});

test("canonical manifest and hash are independent of input order and current observations", () => {
  const first = record();
  const otherId = "20000000-0000-4000-8000-000000000002";
  const other = { ...record(2, 73790, 74000), entity_id: otherId,
    before: { ...first.before, id: otherId, sku: "OPH-4558671043-14W-9", price_cents: 73790 },
    after: { ...first.after, id: otherId, sku: "OPH-4558671043-14W-9", price_cents: 74000 } };
  const beforeInput = JSON.stringify([first, other]);
  const a = plan([other, first], [productRecord()]);
  const b = plan([{ ...first, current_db: { price_cents: 1 }, arbitrary: "ignored" }, other], [productRecord()]);
  assert.deepEqual(a.manifest, b.manifest);
  assert.equal(a.manifestHash, b.manifestHash);
  assert.equal(a.manifestHash, createHash("sha256").update(JSON.stringify({ manifest: a.manifest, productAnchors: a.productAnchors })).digest("hex"));
  assert.equal(JSON.stringify([first, other]), beforeInput);
  assert.deepEqual(Object.keys(a.manifest[0]), ["auditIds", "variantId", "productId", "listingId", "sku", "currency", "beforeCents", "afterCents"]);
  assert.notEqual(plan([first], [productRecord(90, 36500, 39500)]).manifestHash, plan([first], [productRecord()]).manifestHash);
  assert.notEqual(plan([first]).manifestHash, plan([{ ...first, audit_id: auditId(99) }]).manifestHash);
});

test("orders PostgreSQL microseconds correctly despite JavaScript millisecond equality", () => {
  const first = record(1, 51200, 54000);
  const second = { ...record(2, 54000, 57500), created_at: "2026-08-29T21:49:00.000002+03:00" };
  const result = plan([second, first]);
  assert.deepEqual(result.manifest[0].auditIds, [auditId(1), auditId(2)]);
  assert.equal(result.maxAuditTimestamp, "2026-08-29T18:49:00.000002Z");
});

test("equal timestamps require a unique price chain rather than UUID tie ordering", () => {
  const first = record(99, 51200, 54000);
  const second = record(1, 54000, 57500);
  assert.deepEqual(plan([second, first]).manifest[0].auditIds, [auditId(99), auditId(1)]);
  assert.throws(() => plan([record(1, 51200, 54000), record(2, 51200, 57500)]), /ambiguous/);
  assert.throws(() => plan([record(1, 51200, 54000), record(2, 54000, 51200)]), /ambiguous/);
});

test("rejects missing chain links and duplicate audit identities across entities", () => {
  const second = { ...record(2, 55000, 57500), created_at: "2026-08-29T18:50:00Z" };
  assert.throws(() => plan([record(1, 51200, 54000), second]), /discontinuous/);
  assert.throws(() => plan([record(), record()]), /duplicate audit ID/);
  assert.throws(() => plan([record()], [productRecord(1)]), /duplicate audit ID/);
});

test("rejects changed or incomplete identity fields and unsafe price values", () => {
  const source = record();
  for (const [field, value] of [["id", PRODUCT], ["sku", "OTHER"], ["product_id", VARIANT],
    ["etsy_listing_id", LISTING + 1], ["currency", "EUR"]] as const) {
    assert.throws(() => plan([{ ...source, after: { ...source.after, [field]: value } }]), /identity|match/);
  }
  for (const value of [null, 0, -1, 57500.5, "57500", Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => plan([{ ...source, before: { ...source.before, price_cents: value } }]), /positive integer/);
  }
  assert.throws(() => plan([{ ...source, before: { ...source.before, sku: null }, after: { ...source.after, sku: null } }]), /SKU/);
  assert.throws(() => plan([{ ...source, before: { ...source.before, currency: "EUR" }, after: { ...source.after, currency: "EUR" } }]), /USD/);
  assert.throws(() => plan([{ ...source, after: { ...source.after, price_cents: source.before.price_cents } }]), /not a price change/);
  const missingPrice = Object.fromEntries(Object.entries(source.before).filter(([key]) => key !== "price_cents"));
  assert.throws(() => plan([{ ...source, before: missingPrice }]), /positive integer/);
});

test("rejects identity drift between separate audits, duplicate SKU ownership and listing mismatch", () => {
  const first = record(1, 51200, 54000);
  const second = { ...record(2, 54000, 57500), created_at: "2026-08-29T18:50:00Z" };
  assert.throws(() => plan([first, { ...second,
    before: { ...second.before, sku: "OTHER" }, after: { ...second.after, sku: "OTHER" } }]), /between audit/);
  const otherId = "20000000-0000-4000-8000-000000000002";
  assert.throws(() => plan([first, { ...second, entity_id: otherId,
    before: { ...second.before, id: otherId }, after: { ...second.after, id: otherId } }]), /SKU belongs/);
  const anchor = productRecord();
  assert.throws(() => plan([first], [{ ...anchor,
    before: { ...anchor.before, etsy_listing_id: LISTING + 1 }, after: { ...anchor.after, etsy_listing_id: LISTING + 1 } }]), /conflicting listing/);
});

test("pins the exact operation window and rejects malformed timestamps", () => {
  assert.doesNotThrow(() => plan([{ ...record(), created_at: "2026-08-29T18:45:00Z" }]));
  assert.doesNotThrow(() => plan([{ ...record(), created_at: "2026-08-29T19:04:59.999999Z" }]));
  for (const created_at of ["2026-08-29T18:44:59.999999Z", "2026-08-29T19:05:00Z", "2026-09-13T18:49:00Z"]) {
    assert.throws(() => plan([{ ...record(), created_at }]), /outside the pinned/);
  }
  for (const created_at of ["2026-02-31T18:49:00Z", "2026-08-29T24:00:00Z", "2026-08-29T18:49:00", "2026-08-29T18:49:00.0000001Z"]) {
    assert.throws(() => plan([{ ...record(), created_at }]), /timestamp/);
  }
  assert.throws(() => plan([]), /evidence is empty/);
});

test("classifies exact current prices and preserves net-zero chains without issuing writes", () => {
  const source = record();
  const target = plan([source]).manifest[0];
  assert.equal(classifyOphirPriceRestoreCurrentValue(57500, target), "restore");
  assert.equal(classifyOphirPriceRestoreCurrentValue(51200, target), "already-restored");
  for (const current of [null, 0, 57499, "57500", 57500.1]) assert.equal(classifyOphirPriceRestoreCurrentValue(current, target), "conflict");
  const second = { ...record(2, 57500, 51200), created_at: "2026-08-29T18:50:00Z" };
  const unchanged = plan([source, second]);
  assert.equal(unchanged.manifest.length, 1);
  assert.equal(unchanged.totalChangedTargets, 0);
  assert.equal(classifyOphirPriceRestoreCurrentValue(51200, unchanged.manifest[0]), "already-restored");
  assert.deepEqual(buildOphirPriceRestoreCasBatches(unchanged, ORG), []);
});

test("CAS descriptions retain exact old-price and organization filters and split at100 UUIDs", () => {
  const records = Array.from({ length: 205 }, (_, index) => {
    const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    const row = record(index + 1);
    const before = { ...row.before, id, sku: `OPH-${index + 1}` };
    return { ...row, entity_id: id, before, after: { ...before, price_cents: 57500 } };
  });
  const result = plan(records, [productRecord(900)]);
  const frozenInput = JSON.stringify(result);
  const batches = buildOphirPriceRestoreCasBatches(result, ORG);
  const variants = batches.filter((row) => row.table === "product_variants");
  assert.deepEqual(variants.map((row) => row.where.id_in.length), [100, 100, 5]);
  assert.equal(new Set(variants.flatMap((row) => row.where.id_in)).size, 205);
  for (const batch of variants) {
    assert.deepEqual(batch.patch, { price_cents: 51200 });
    assert.equal(batch.where.price_cents, 57500);
    assert.equal(batch.where.org_id, ORG);
    assert.deepEqual(Object.keys(batch.where), ["org_id", "price_cents", "id_in"]);
  }
  const products = batches.filter((row) => row.table === "products");
  assert.equal(products.length, 1);
  assert.deepEqual(products[0].patch, { price_cents: 36600 });
  assert.deepEqual(products[0].where, { org_id: ORG, price_cents: 39500, id_in: [PRODUCT] });
  assert.equal(JSON.stringify(result), frozenInput);
  assert.throws(() => buildOphirPriceRestoreCasBatches(result, "other-org"), /UUID/);
});
