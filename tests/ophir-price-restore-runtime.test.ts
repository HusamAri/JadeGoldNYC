import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EtsyClient } from "@/lib/etsy/client";
import { buildOphirPriceRestorePlan } from "@/lib/ophir-price-restore-plan";
import {
  OPHIR_RESTORE_SHOP_ID,
  loadOphirRestorePlan,
  ophirRestoreGridSummary,
  ophirRestorePricesCsv,
  processOphirRestoreListing,
  type OphirRestorePreviewProof,
} from "@/lib/ophir-price-restore-runtime";

const ORG = "11111111-1111-4111-8111-111111111111";
const PRODUCT = "22222222-2222-4222-8222-222222222222";
const LISTING = 4_549_712_730;
type Row = Record<string, unknown>;
type Result = { data: Row[] | Row | null; error: { code?: string; message?: string } | null; count?: number | null; status?: number };
type Filter = { method: string; key: string; value: unknown };
type QuerySpec = { table: string; patch?: Row; filters: Filter[]; single: boolean; selection?: string; head?: boolean; limit?: number };

function variantId(index: number) { return `33333333-3333-4333-8333-${String(index + 1).padStart(12, "0")}`; }
function auditId(index: number) { return `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`; }
function sku(index: number) { return `OPH-${LISTING}-10R-${index + 3}`; }

class Query implements PromiseLike<Result> {
  readonly spec: QuerySpec;
  constructor(table: string, private readonly execute: (spec: QuerySpec) => Result | PromiseLike<Result>) {
    this.spec = { table, filters: [], single: false };
  }
  select(fields?: string, options?: { head?: boolean }) { this.spec.selection = fields; this.spec.head = options?.head; return this; }
  order() { return this; }
  limit(value: number) { this.spec.limit = value; return this; }
  update(patch: Row) { this.spec.patch = patch; return this; }
  eq(key: string, value: unknown) { this.spec.filters.push({ method: "eq", key, value }); return this; }
  in(key: string, value: unknown[]) { this.spec.filters.push({ method: "in", key, value }); return this; }
  is(key: string, value: unknown) { this.spec.filters.push({ method: "is", key, value }); return this; }
  gte(key: string, value: unknown) { this.spec.filters.push({ method: "gte", key, value }); return this; }
  lt(key: string, value: unknown) { this.spec.filters.push({ method: "lt", key, value }); return this; }
  gt(key: string, value: unknown) { this.spec.filters.push({ method: "gt", key, value }); return this; }
  or(value: string) { this.spec.filters.push({ method: "or", key: "paired_identity", value }); return this; }
  maybeSingle() { this.spec.single = true; return this; }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute(this.spec)).then(onfulfilled, onrejected);
  }
}

function projectedAudit(row: Row): Row {
  const result: Row = { id: row.id, created_at: row.created_at, entity_type: row.entity_type, entity_id: row.entity_id };
  for (const side of ["before", "after"]) {
    const identity = row[side] as Row;
    for (const field of ["id", "sku", "product_id", "etsy_listing_id", "currency", "price_cents"]) {
      result[`${side}_${field}`] = identity?.[field] ?? null;
    }
  }
  return result;
}

function identityPairs(filter: string): { id: string; sku: string; afterCents: number }[] {
  const clauses = Array.from(filter.matchAll(/and\(id\.eq\.([0-9a-f-]+),sku\.eq\.("(?:[^"\\]|\\.)*"),price_cents\.eq\.(\d+)\)/g));
  assert.equal(clauses.map((clause) => clause[0]).join(","), filter, "Every OR clause must bind one exact ID/SKU pair");
  return clauses.map((clause) => ({ id: clause[1], sku: JSON.parse(clause[2]) as string, afterCents: Number(clause[3]) }));
}

function fixture(count = 1, skus?: string[], pricePairs?: { beforeCents: number; afterCents: number }[]) {
  const variants: Row[] = Array.from({ length: count }, (_, index) => ({
    id: variantId(index), org_id: ORG, product_id: PRODUCT, etsy_listing_id: LISTING,
    sku: skus?.[index] ?? sku(index), currency: "USD", price_cents: pricePairs?.[index].afterCents ?? 200,
  }));
  const product: Row = { id: PRODUCT, org_id: ORG, sku: null, etsy_listing_id: LISTING, currency: "USD", price_cents: 200 };
  const variantRecords = variants.map((row, index) => ({
    audit_id: auditId(index), created_at: "2026-08-29T18:59:00.000001Z", entity_id: row.id,
    before: { ...row, price_cents: pricePairs?.[index].beforeCents ?? 100 }, after: { ...row },
  }));
  const plan = buildOphirPriceRestorePlan({ variantRecords, productRecords: [{
    audit_id: "55555555-5555-4555-8555-555555555555", created_at: "2026-08-29T18:59:01.000001Z", entity_id: PRODUCT,
    before: { ...product, product_id: null, price_cents: 100 }, after: { ...product, product_id: null },
  }] });
  const state = {
    inventory: {
      products: variants.map((row, index) => ({ sku: row.sku,
        property_values: [{ property_id: 100, property_name: "Gold and size", value_ids: [index + 1], values: [`10K size ${index + 3}`] }],
        offerings: [{ price: { amount: row.price_cents as number, divisor: 100, currency_code: "USD" }, quantity: 9, is_enabled: true, readiness_state_id: 123 }],
      })), price_on_property: [100], quantity_on_property: [] as number[], sku_on_property: [100], readiness_state_on_property: [] as number[],
    },
    variants, product, queries: [] as QuerySpec[], audits: [] as Row[], laterAudits: [] as Row[],
    inventoryReads: 0, etsyWrites: 0, uncertainWrite: false, badReadback: false, failVariantUpdateNumber: 0, variantUpdates: 0,
    swapSkusOnNextVariantUpdate: false,
    variantUpdateHook: null as ((number: number, spec: QuerySpec) => Promise<void>) | null,
    variantUpdateResponse: null as ((number: number, ids: Row[]) => Result) | null,
  };
  const execute = async (spec: QuerySpec): Promise<Result> => {
    state.queries.push(structuredClone(spec));
    if (spec.table === "audit_log") {
      const entity = spec.filters.find((filter) => filter.key === "entity_type")?.value;
      const ids = spec.filters.find((filter) => filter.key === "entity_id")?.value as string[];
      return { data: state.laterAudits.filter((row) => row.entity_type === entity && ids.includes(row.entity_id as string)).map(projectedAudit), error: null };
    }
    const source = spec.table === "product_variants" ? variants : [product];
    let updateNumber = 0;
    if (spec.patch && spec.table === "product_variants") {
      updateNumber = ++state.variantUpdates;
      await state.variantUpdateHook?.(updateNumber, spec);
    }
    if (spec.patch && spec.table === "product_variants" && state.swapSkusOnNextVariantUpdate) {
      [variants[0].sku, variants[1].sku] = [variants[1].sku, variants[0].sku];
      state.swapSkusOnNextVariantUpdate = false;
    }
    let matches = source.filter((row) => spec.filters.every((filter) => {
      if (filter.method === "or") return identityPairs(filter.value as string).some((pair) => pair.id === row.id && pair.sku === row.sku && pair.afterCents === row.price_cents);
      if (filter.method === "in") return (filter.value as unknown[]).includes(row[filter.key]);
      if (filter.method === "eq" || filter.method === "is") return row[filter.key] === filter.value;
      return true;
    }));
    if (spec.patch) {
      if (spec.table === "product_variants") {
        if (updateNumber === state.failVariantUpdateNumber) matches = [];
      }
      for (const row of matches) Object.assign(row, spec.patch);
      const ids = matches.map((row) => ({ id: row.id }));
      return spec.table === "product_variants" && state.variantUpdateResponse
        ? state.variantUpdateResponse(updateNumber, ids) : { data: ids, error: null };
    }
    return { data: spec.single ? structuredClone(matches[0] ?? null) : structuredClone(matches), error: null };
  };
  const client = {
    from: (table: string) => new Query(table, execute),
    rpc: async (_name: string, params: Row) => { state.audits.push(params); return { data: null, error: null }; },
  } as unknown as SupabaseClient;
  const etsy = {
    requireShopId: async () => OPHIR_RESTORE_SHOP_ID,
    get: async (path: string, query?: Record<string, string>) => {
      if (!path.endsWith("/inventory")) return { shop_id: OPHIR_RESTORE_SHOP_ID };
      assert.equal(query?.legacy, "false");
      assert.equal(query?.max_variations_supported, "3");
      state.inventoryReads++;
      return structuredClone(state.inventory);
    },
    request: async (method: string, path: string, payload: {
      products: { sku: string; property_values: Row[]; offerings: { price: number; quantity: number; is_enabled: boolean; readiness_state_id: number }[] }[];
      price_on_property: number[]; quantity_on_property: number[]; sku_on_property: number[]; readiness_state_on_property: number[];
    }, retry: number) => {
      assert.equal(method, "PUT");
      assert.match(path, /legacy=false/);
      assert.equal(retry, 0);
      state.etsyWrites++;
      state.inventory = { ...structuredClone(payload), products: payload.products.map((p) => ({
        sku: p.sku, property_values: p.property_values as typeof state.inventory.products[number]["property_values"],
        offerings: p.offerings.map((offering) => ({ ...offering,
          price: { amount: Math.round(offering.price * 100), divisor: 100, currency_code: "USD" },
        })),
      })) };
      if (state.badReadback) state.inventory.products[0].offerings[0].quantity++;
      if (state.uncertainWrite) throw new Error("Uncertain response");
      return {};
    },
  } as unknown as EtsyClient;
  const input = { client, etsy, orgId: ORG, plan, listing: plan.listingGroups[0] };
  const preview = async (): Promise<OphirRestorePreviewProof> => {
    const etsyWritesBefore = state.etsyWrites;
    const dbWritesBefore = state.queries.filter((query) => query.patch).length;
    const result = await processOphirRestoreListing({ ...input, mode: "dry-run" });
    assert.equal(result.status, "verified", result.error);
    assert.equal(state.etsyWrites, etsyWritesBefore);
    assert.equal(state.queries.filter((query) => query.patch).length, dbWritesBefore);
    return result.proof!;
  };
  return { state, input, preview };
}

async function nextTurn() { await new Promise<void>((resolve) => setImmediate(resolve)); }
async function until(predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await nextTurn();
  }
  assert.fail("Expected asynchronous CAS progress did not arrive.");
}
function controlledUpdates(f: ReturnType<typeof fixture>, throwNumber = 0) {
  const gates = new Map<number, () => void>();
  const completed: number[] = [];
  let active = 0;
  let maximum = 0;
  f.state.variantUpdateHook = async (number) => {
    active++; maximum = Math.max(maximum, active);
    await new Promise<void>((resolve) => gates.set(number, resolve));
    active--; completed.push(number);
    if (number === throwNumber) throw new Error("Uncertain transport response");
  };
  return { gates, completed, maximum: () => maximum };
}

test("four disjoint prior-price groups can finish out of order with exact per-record CAS predicates", async () => {
  const pairs = Array.from({ length: 6 }, (_, index) => ({ beforeCents: 100 + index, afterCents: 200 + index }));
  const f = fixture(6, undefined, pairs);
  const proof = await f.preview();
  const control = controlledUpdates(f);
  const pending = processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  await until(() => control.gates.size === 4);
  assert.equal(f.state.audits.length, 0);
  control.gates.get(3)!();
  await until(() => control.gates.has(5));
  control.gates.get(2)!();
  await until(() => control.gates.has(6));
  for (const number of [6, 5, 4, 1]) { control.gates.get(number)!(); await nextTurn(); }
  const result = await pending;
  assert.equal(result.status, "verified", result.error);
  assert.equal(result.dbVariantsChanged, 6);
  assert.equal(result.dbAnchorChanged, true);
  assert.equal(control.maximum(), 4);
  assert.deepEqual(control.completed, [3, 2, 6, 5, 4, 1]);
  const writes = f.state.queries.filter((query) => query.table === "product_variants" && query.patch);
  assert.equal(writes.length, 6);
  for (const [index, write] of writes.entries()) {
    assert.deepEqual(write.patch, { price_cents: pairs[index].beforeCents });
    assert.deepEqual(identityPairs(write.filters.find((filter) => filter.method === "or")!.value as string),
      [{ id: variantId(index), sku: sku(index), afterCents: pairs[index].afterCents }]);
    for (const [key, value] of Object.entries({ org_id: ORG, product_id: PRODUCT, etsy_listing_id: LISTING, currency: "USD" })) {
      assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === key && filter.value === value));
    }
    assert.ok(!write.filters.some((filter) => filter.key === "price_cents"));
  }
  assert.equal(f.state.etsyWrites, 1);
});

for (const failure of ["empty-response", "thrown-transport"] as const) {
  test(`${failure} drains successful in-flight groups before failure audit and resumes only remaining IDs`, async () => {
    const pairs = Array.from({ length: 6 }, (_, index) => ({ beforeCents: 100 + index, afterCents: 200 + index }));
    const f = fixture(6, undefined, pairs);
    const proof = await f.preview();
    if (failure === "empty-response") f.state.failVariantUpdateNumber = 2;
    const control = controlledUpdates(f, failure === "thrown-transport" ? 2 : 0);
    let returned = false;
    const pending = processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof }).then((result) => {
      returned = true; return result;
    });
    await until(() => control.gates.size === 4);
    control.gates.get(2)!(); await nextTurn();
    assert.equal(control.gates.size, 4, "No fifth group may start after the failure is known");
    for (const number of [3, 4]) { control.gates.get(number)!(); await nextTurn(); }
    assert.equal(returned, false, "The first request is still in flight");
    assert.equal(f.state.audits.length, 0, "Failure audit must wait for every in-flight result");
    assert.equal(f.state.queries.filter((query) => query.table === "products" && query.patch).length, 0);
    assert.equal(control.gates.size, 4);
    control.gates.get(1)!();
    const result = await pending;
    assert.equal(result.status, "failed");
    assert.equal(result.stage, "db-restore");
    assert.equal(result.dbVariantsChanged, 3);
    assert.equal(result.dbAnchorChanged, false);
    assert.equal(f.state.variantUpdates, 4, "Uncertain writes must not be retried");
    assert.equal(f.state.product.price_cents, 200);
    assert.equal(f.state.audits.length, 1);
    assert.equal((f.state.audits[0].p_diff as Row).db_variants_changed, 3);
    assert.equal(control.maximum(), 4);
    const remainingIds = f.state.variants.filter((row, index) => row.price_cents !== pairs[index].beforeCents).map((row) => row.id);
    f.state.variantUpdateHook = null; f.state.failVariantUpdateNumber = 0;
    const previousQueries = f.state.queries.length;
    const resumedProof = await f.preview();
    const resumed = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: resumedProof });
    assert.equal(resumed.status, "verified", resumed.error);
    assert.equal(resumed.dbVariantsChanged, 3);
    assert.equal(resumed.dbAnchorChanged, true);
    assert.equal(f.state.etsyWrites, 1);
    const resumedIds = f.state.queries.slice(previousQueries).filter((query) => query.table === "product_variants" && query.patch)
      .flatMap((query) => identityPairs(query.filters.find((filter) => filter.method === "or")!.value as string).map((pair) => pair.id));
    assert.deepEqual(resumedIds.sort(), remainingIds.sort());
  });
}

test("same prior price combines heterogeneous audited after prices into one exact CAS batch", async () => {
  const pairs = [{ beforeCents: 100, afterCents: 200 }, { beforeCents: 100, afterCents: 300 }];
  const f = fixture(2, undefined, pairs);
  const proof = await f.preview();
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "verified", result.error);
  assert.equal(result.dbVariantsChanged, 2);
  const writes = f.state.queries.filter((query) => query.table === "product_variants" && query.patch);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].patch, { price_cents: 100 });
  assert.deepEqual(identityPairs(writes[0].filters.find((filter) => filter.method === "or")!.value as string), [
    { id: variantId(0), sku: sku(0), afterCents: 200 }, { id: variantId(1), sku: sku(1), afterCents: 300 },
  ]);
});

test("an audited ID cannot borrow another target's after price between identity read and CAS", async () => {
  const f = fixture(2, undefined, [{ beforeCents: 100, afterCents: 200 }, { beforeCents: 100, afterCents: 300 }]);
  const proof = await f.preview();
  f.state.variantUpdateHook = async () => { f.state.variants[0].price_cents = 300; };
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "failed");
  assert.equal(result.stage, "db-restore");
  assert.equal(result.dbVariantsChanged, 1);
  assert.deepEqual(f.state.variants.map((row) => row.price_cents), [300, 100]);
  assert.equal(f.state.product.price_cents, 200);
  assert.equal(f.state.queries.filter((query) => query.table === "products" && query.patch).length, 0);
});

test("foreign and duplicate returned IDs fail without inflating recognized partial counts", async () => {
  const f = fixture(3);
  const proof = await f.preview();
  f.state.variantUpdateResponse = () => ({ data: [{ id: variantId(0) }, { id: variantId(0) }, { id: variantId(9) }], error: null });
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "failed");
  assert.equal(result.dbVariantsChanged, 1);
  assert.equal(result.dbAnchorChanged, false);
  assert.equal((f.state.audits[0].p_diff as Row).db_variants_changed, 1);
});

for (const field of ["variantId", "sku"] as const) {
  test(`overlapping audited ${field} identities stop before any Etsy PUT or DB price update`, async () => {
    const f = fixture(2);
    f.input.listing.variants[1][field] = f.input.listing.variants[0][field];
    const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: {} as OphirRestorePreviewProof });
    assert.equal(result.status, "failed");
    assert.match(result.error!, /overlapping identities/);
    assert.equal(f.state.etsyWrites, 0);
    assert.equal(f.state.queries.filter((query) => query.patch).length, 0);
  });
}

test("DB price conflict stops before Etsy PUT or DB update", async () => {
  const f = fixture();
  f.state.variants[0].price_cents = 201;
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: {} as OphirRestorePreviewProof });
  assert.equal(result.status, "failed");
  assert.match(result.error!, /Current DB price conflicts/);
  assert.equal(f.state.etsyWrites, 0);
  assert.equal(f.state.queries.filter((query) => query.patch).length, 0);
});

test("a later price audit prevents writes even when the current value matches the final run", async () => {
  const f = fixture();
  const row = f.state.variants[0];
  f.state.laterAudits.push({ id: "66666666-6666-4666-8666-666666666666", created_at: "2026-08-30T00:00:00Z",
    entity_type: "product_variants", entity_id: row.id, before: { ...row }, after: { ...row, price_cents: 300 } });
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: {} as OphirRestorePreviewProof });
  assert.equal(result.status, "failed");
  assert.match(result.error!, /later price change/);
  assert.equal(f.state.etsyWrites, 0);
  assert.equal(f.state.queries.filter((query) => query.patch).length, 0);
});

test("live Etsy price conflict stops before PUT or DB update", async () => {
  const f = fixture();
  f.state.inventory.products[0].offerings[0].price.amount = 201;
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: {} as OphirRestorePreviewProof });
  assert.equal(result.status, "failed");
  assert.match(result.error!, /price conflict/);
  assert.equal(f.state.etsyWrites, 0);
  assert.equal(f.state.queries.filter((query) => query.patch).length, 0);
});

test("stale preview proof rejects an apply without price writes", async () => {
  const f = fixture();
  const proof = await f.preview();
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: { ...proof, nonPriceHash: "0".repeat(64) } });
  assert.equal(result.status, "failed");
  assert.match(result.error!, /changed since its preview/);
  assert.equal(f.state.etsyWrites, 0);
  assert.equal(f.state.queries.filter((query) => query.patch).length, 0);
});

test("non-price readback mismatch stops before any DB restoration", async () => {
  const f = fixture();
  const proof = await f.preview();
  f.state.badReadback = true;
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "failed");
  assert.equal(result.stage, "etsy-readback");
  assert.match(result.error!, /no DB restoration was attempted/);
  assert.equal(f.state.etsyWrites, 1);
  assert.equal(f.state.queries.filter((query) => query.patch).length, 0);
});

test("an uncertain PUT is read back without retry and can complete when the full state matches", async () => {
  const f = fixture();
  const proof = await f.preview();
  f.state.uncertainWrite = true;
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "verified", result.error);
  assert.equal(result.nonPriceFieldsPreserved, true);
  assert.equal(result.auditWritten, true);
  assert.equal(f.state.etsyWrites, 1);
  assert.ok(f.state.inventoryReads >= 4);
  assert.equal(f.state.variants[0].price_cents, 100);
  assert.equal(f.state.product.price_cents, 100);
});

test("DB writes contain only the prior price patch and all scoped CAS identity predicates", async () => {
  const f = fixture();
  const proof = await f.preview();
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "verified", result.error);
  const writes = f.state.queries.filter((query) => query.patch);
  assert.equal(writes.length, 2);
  for (const write of writes) {
    assert.deepEqual(write.patch, { price_cents: 100 });
    assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "org_id" && filter.value === ORG));
    if (write.table === "products") assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "price_cents" && filter.value === 200));
    assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "etsy_listing_id" && filter.value === LISTING));
    assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "currency" && filter.value === "USD"));
  }
  const variantWrite = writes.find((write) => write.table === "product_variants")!;
  assert.ok(variantWrite.filters.some((filter) => filter.key === "product_id" && filter.value === PRODUCT));
  const pairedFilter = variantWrite.filters.find((filter) => filter.method === "or")!;
  assert.deepEqual(identityPairs(pairedFilter.value as string), [{ id: variantId(0), sku: sku(0), afterCents: 200 }]);
  assert.ok(!variantWrite.filters.some((filter) => filter.method === "in" && ["id", "sku"].includes(filter.key)));
  assert.equal(f.state.inventory.products[0].offerings[0].quantity, 9);
  assert.equal(f.state.inventory.products[0].offerings[0].readiness_state_id, 123);
});

test("partial DB CAS progress is counted and stops before the anchor update", async () => {
  const f = fixture(101);
  const proof = await f.preview();
  f.state.failVariantUpdateNumber = 2;
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "failed");
  assert.equal(result.stage, "db-restore");
  assert.equal(result.dbVariantsChanged, 50);
  assert.equal(result.dbAnchorChanged, false);
  assert.match(result.error!, /inspect partial progress/i);
  assert.equal(f.state.product.price_cents, 200);
  assert.equal(f.state.variants.filter((row) => row.price_cents === 100).length, 50);
  assert.ok(f.state.queries.filter((query) => query.table === "product_variants" && query.patch)
    .every((query) => identityPairs(query.filters.find((filter) => filter.method === "or")!.value as string).length <= 50));
  assert.equal(f.state.queries.filter((query) => query.table === "products" && query.patch).length, 0);
  assert.equal(result.auditWritten, true);
  const resumedProof = await f.preview();
  const resumed = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: resumedProof });
  assert.equal(resumed.status, "verified", resumed.error);
  assert.equal(resumed.dbVariantsChanged, 51);
  assert.equal(resumed.dbAnchorChanged, true);
  assert.equal(resumed.etsyPricesChanged, 0);
  assert.equal(f.state.etsyWrites, 1);
  assert.equal(f.state.variants.filter((row) => row.price_cents === 100).length, 101);
  assert.equal(f.state.product.price_cents, 100);
});

test("swapping audited SKUs between the last read and CAS prevents both DB price patches", async () => {
  const f = fixture(2);
  const proof = await f.preview();
  f.state.swapSkusOnNextVariantUpdate = true;
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "failed");
  assert.equal(result.stage, "db-restore");
  assert.equal(result.dbVariantsChanged, 0);
  assert.equal(result.dbAnchorChanged, false);
  assert.deepEqual(f.state.variants.map((row) => row.price_cents), [200, 200]);
  assert.equal(f.state.product.price_cents, 200);
  assert.equal(f.state.queries.filter((query) => query.table === "products" && query.patch).length, 0);
});

test("quoted SKU filter values preserve punctuation, quotes, and backslashes as exact data", async () => {
  const exactSku = 'OPH-test,(id.eq.fake)-"quoted"-\\backslash';
  const f = fixture(1, [exactSku]);
  const proof = await f.preview();
  const result = await processOphirRestoreListing({ ...f.input, mode: "apply", previewProof: proof });
  assert.equal(result.status, "verified", result.error);
  const write = f.state.queries.find((query) => query.table === "product_variants" && query.patch)!;
  const pairs = identityPairs(write.filters.find((filter) => filter.method === "or")!.value as string);
  assert.deepEqual(pairs, [{ id: variantId(0), sku: exactSku, afterCents: 200 }]);
  assert.equal(f.state.variants[0].price_cents, 100);
});

test("compact CSV keeps exact integer prices, entity identities, and quoted SKU values", () => {
  const exactSku = 'OPH-quoted,"SKU"';
  const f = fixture(1, [exactSku]);
  const csv = ophirRestorePricesCsv(f.input.plan);
  assert.equal(csv, `record_type,entity_id,listing_id,sku,currency,prior_cents,last_change_cents\r\nvariant,${variantId(0)},${LISTING},"OPH-quoted,""SKU""",USD,100,200\r\nproduct_anchor,${PRODUCT},${LISTING},,USD,100,200\r\n`);
  assert.equal(ophirRestorePricesCsv(f.input.plan, [LISTING]), csv);
  assert.equal(ophirRestorePricesCsv(f.input.plan, [LISTING + 1]).split("\r\n").length, 2);
});

test("grid summary exposes exact per-color prior values behind a collapsed workbook group", () => {
  const f = fixture(3, [`OPH-${LISTING}-10R-11`, `OPH-${LISTING}-10Y-11`, `OPH-${LISTING}-10W-11`]);
  for (const [index, target] of f.input.plan.manifest.entries()) {
    target.beforeCents = index === 0 ? 54_500 : 55_000;
    target.afterCents = 74_000;
  }
  const summary = ophirRestoreGridSummary(f.input.plan);
  assert.equal(summary.audited_price_groups, 1);
  assert.equal(summary.groups_with_different_prior_color_prices, 1);
  assert.equal(summary.variants_in_groups_with_different_prior_color_prices, 3);
  assert.equal(summary.unparsed_audited_sku_count, 0);
  const group = summary.different_prior_color_price_groups[0];
  assert.equal(group.karat, "10K");
  assert.equal(group.size, "11");
  assert.equal(group.prior_min_cents, 54_500);
  assert.equal(group.prior_max_cents, 55_000);
  assert.equal(group.last_change_min_cents, 74_000);
  assert.deepEqual(group.variants.map((variant) => variant.prior_cents), [54_500, 55_000, 55_000]);
});

function auditReadFixture(options: { transientPageFailures?: number; permanentCode?: string; missingCountRow?: boolean } = {}) {
  const f = fixture();
  const variant = f.state.variants[0];
  const product = f.state.product;
  const rows: Row[] = [{ id: auditId(0), created_at: "2026-08-29T18:59:00.000001Z", entity_type: "product_variants", entity_id: variant.id,
    before: { ...variant, price_cents: 100, unrelated: "never projected" }, after: { ...variant } },
  { id: "55555555-5555-4555-8555-555555555555", created_at: "2026-08-29T18:59:01.000001Z", entity_type: "products", entity_id: PRODUCT,
    before: { ...product, price_cents: 100 }, after: { ...product } }];
  const queries: QuerySpec[] = [];
  let failures = options.transientPageFailures ?? 0;
  const client = { from: (table: string) => new Query(table, (spec) => {
    queries.push(structuredClone(spec));
    assert.equal(spec.table, "audit_log");
    assert.ok(!spec.patch, "Audit retries must remain reads");
    if (spec.head) return { data: null, error: null, count: rows.length + (options.missingCountRow ? 1 : 0), status: 200 };
    if (options.permanentCode) return { data: null, error: { code: options.permanentCode, message: "SQL, URL, or token must never escape" }, status: 403 };
    if (failures > 0) { failures--; return { data: null, error: { code: "57014", message: "SQL, URL, or token must never escape" }, status: 500 }; }
    const cursor = spec.filters.find((filter) => filter.method === "gt" && filter.key === "id")?.value as string | undefined;
    return { data: rows.filter((row) => !cursor || (row.id as string) > cursor).slice(0, spec.limit).map(projectedAudit), error: null, status: 200 };
  }) } as unknown as SupabaseClient;
  return { client, queries, expectedPlan: f.input.plan };
}

test("audit SELECT projects only exact identity leaves and reconstructs the unchanged complete hash", async () => {
  const f = auditReadFixture();
  const plan = await loadOphirRestorePlan(f.client, ORG);
  assert.equal(plan.manifestHash, f.expectedPlan.manifestHash);
  assert.deepEqual(plan.manifest, f.expectedPlan.manifest);
  assert.deepEqual(plan.productAnchors, f.expectedPlan.productAnchors);
  assert.equal(plan.minAuditTimestamp, "2026-08-29T18:59:00.000001Z");
  assert.equal(plan.productAnchors[0].sku, null);
  for (const query of f.queries.filter((query) => !query.head)) {
    const fields = query.selection!;
    assert.ok(!fields.includes("before:diff->before") && !fields.includes("after:diff->after"));
    for (const side of ["before", "after"]) {
      for (const field of ["id", "sku", "product_id", "etsy_listing_id", "currency", "price_cents"]) {
        assert.ok(fields.includes(`${side}_${field}:diff->${side}->${field}`));
      }
    }
    assert.ok(!fields.includes("->>"), "JSON prices must retain their original leaf type");
  }
});

test("a transient audit read retries the same keyset page twice then returns the same manifest hash", async () => {
  const f = auditReadFixture({ transientPageFailures: 2 });
  const plan = await loadOphirRestorePlan(f.client, ORG);
  assert.equal(plan.manifestHash, f.expectedPlan.manifestHash);
  const reads = f.queries.filter((query) => !query.head);
  assert.equal(reads.length, 4, "Three attempts on the first page, then one terminal empty page");
  assert.deepEqual(reads[0], reads[1]);
  assert.deepEqual(reads[1], reads[2]);
});

test("persistent transient failures stop after three attempts with database-code-only diagnostics", async () => {
  const f = auditReadFixture({ transientPageFailures: 3 });
  await assert.rejects(loadOphirRestorePlan(f.client, ORG), (error: unknown) => {
    assert.equal((error as Error).message, "The pinned pricing audit window could not be read. Database code: 57014.");
    return true;
  });
  assert.equal(f.queries.filter((query) => !query.head).length, 3);
});

test("permanent audit failure is not retried and cannot return a partial plan or hash", async () => {
  const f = auditReadFixture({ permanentCode: "42501" });
  await assert.rejects(loadOphirRestorePlan(f.client, ORG), (error: unknown) => {
    assert.equal((error as Error).message, "The pinned pricing audit window could not be read. Database code: 42501.");
    return true;
  });
  assert.equal(f.queries.filter((query) => !query.head).length, 1);
});

test("audit page/count mismatch still fails instead of returning an incomplete manifest hash", async () => {
  const f = auditReadFixture({ missingCountRow: true });
  await assert.rejects(loadOphirRestorePlan(f.client, ORG), /audit window changed while it was being collected/);
});
