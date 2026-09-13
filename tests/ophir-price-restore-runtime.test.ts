import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EtsyClient } from "@/lib/etsy/client";
import { buildOphirPriceRestorePlan } from "@/lib/ophir-price-restore-plan";
import {
  OPHIR_RESTORE_SHOP_ID,
  ophirRestoreGridSummary,
  ophirRestorePricesCsv,
  processOphirRestoreListing,
  type OphirRestorePreviewProof,
} from "@/lib/ophir-price-restore-runtime";

const ORG = "11111111-1111-4111-8111-111111111111";
const PRODUCT = "22222222-2222-4222-8222-222222222222";
const LISTING = 4_549_712_730;
type Row = Record<string, unknown>;
type Result = { data: Row[] | Row | null; error: null; count?: number };
type Filter = { method: string; key: string; value: unknown };
type QuerySpec = { table: string; patch?: Row; filters: Filter[]; single: boolean };

function variantId(index: number) { return `33333333-3333-4333-8333-${String(index + 1).padStart(12, "0")}`; }
function auditId(index: number) { return `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`; }
function sku(index: number) { return `OPH-${LISTING}-10R-${index + 3}`; }

class Query implements PromiseLike<Result> {
  readonly spec: QuerySpec;
  constructor(table: string, private readonly execute: (spec: QuerySpec) => Result) {
    this.spec = { table, filters: [], single: false };
  }
  select() { return this; }
  order() { return this; }
  limit() { return this; }
  update(patch: Row) { this.spec.patch = patch; return this; }
  eq(key: string, value: unknown) { this.spec.filters.push({ method: "eq", key, value }); return this; }
  in(key: string, value: unknown[]) { this.spec.filters.push({ method: "in", key, value }); return this; }
  is(key: string, value: unknown) { this.spec.filters.push({ method: "is", key, value }); return this; }
  gte(key: string, value: unknown) { this.spec.filters.push({ method: "gte", key, value }); return this; }
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

function identityPairs(filter: string): { id: string; sku: string }[] {
  const clauses = Array.from(filter.matchAll(/and\(id\.eq\.([0-9a-f-]+),sku\.eq\.("(?:[^"\\]|\\.)*")\)/g));
  assert.equal(clauses.map((clause) => clause[0]).join(","), filter, "Every OR clause must bind one exact ID/SKU pair");
  return clauses.map((clause) => ({ id: clause[1], sku: JSON.parse(clause[2]) as string }));
}

function fixture(count = 1, skus?: string[]) {
  const variants: Row[] = Array.from({ length: count }, (_, index) => ({
    id: variantId(index), org_id: ORG, product_id: PRODUCT, etsy_listing_id: LISTING,
    sku: skus?.[index] ?? sku(index), currency: "USD", price_cents: 200,
  }));
  const product: Row = { id: PRODUCT, org_id: ORG, sku: null, etsy_listing_id: LISTING, currency: "USD", price_cents: 200 };
  const variantRecords = variants.map((row, index) => ({
    audit_id: auditId(index), created_at: "2026-08-29T18:59:00.000001Z", entity_id: row.id,
    before: { ...row, price_cents: 100 }, after: { ...row },
  }));
  const plan = buildOphirPriceRestorePlan({ variantRecords, productRecords: [{
    audit_id: "55555555-5555-4555-8555-555555555555", created_at: "2026-08-29T18:59:01.000001Z", entity_id: PRODUCT,
    before: { ...product, product_id: null, price_cents: 100 }, after: { ...product, product_id: null },
  }] });
  const state = {
    inventory: {
      products: variants.map((row, index) => ({ sku: row.sku,
        property_values: [{ property_id: 100, property_name: "Gold and size", value_ids: [index + 1], values: [`10K size ${index + 3}`] }],
        offerings: [{ price: { amount: 200, divisor: 100, currency_code: "USD" }, quantity: 9, is_enabled: true, readiness_state_id: 123 }],
      })), price_on_property: [100], quantity_on_property: [] as number[], sku_on_property: [100], readiness_state_on_property: [] as number[],
    },
    variants, product, queries: [] as QuerySpec[], audits: [] as Row[], laterAudits: [] as Row[],
    inventoryReads: 0, etsyWrites: 0, uncertainWrite: false, badReadback: false, failVariantUpdateNumber: 0, variantUpdates: 0,
    swapSkusOnNextVariantUpdate: false,
  };
  const execute = (spec: QuerySpec): Result => {
    state.queries.push(structuredClone(spec));
    if (spec.table === "audit_log") {
      const entity = spec.filters.find((filter) => filter.key === "entity_type")?.value;
      const ids = spec.filters.find((filter) => filter.key === "entity_id")?.value as string[];
      return { data: state.laterAudits.filter((row) => row.entity_type === entity && ids.includes(row.entity_id as string)), error: null };
    }
    const source = spec.table === "product_variants" ? variants : [product];
    if (spec.patch && spec.table === "product_variants" && state.swapSkusOnNextVariantUpdate) {
      [variants[0].sku, variants[1].sku] = [variants[1].sku, variants[0].sku];
      state.swapSkusOnNextVariantUpdate = false;
    }
    let matches = source.filter((row) => spec.filters.every((filter) => {
      if (filter.method === "or") return identityPairs(filter.value as string).some((pair) => pair.id === row.id && pair.sku === row.sku);
      if (filter.method === "in") return (filter.value as unknown[]).includes(row[filter.key]);
      if (filter.method === "eq" || filter.method === "is") return row[filter.key] === filter.value;
      return true;
    }));
    if (spec.patch) {
      if (spec.table === "product_variants") {
        state.variantUpdates++;
        if (state.variantUpdates === state.failVariantUpdateNumber) matches = [];
      }
      for (const row of matches) Object.assign(row, spec.patch);
      return { data: matches.map((row) => ({ id: row.id })), error: null };
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
    assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "price_cents" && filter.value === 200));
    assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "etsy_listing_id" && filter.value === LISTING));
    assert.ok(write.filters.some((filter) => filter.method === "eq" && filter.key === "currency" && filter.value === "USD"));
  }
  const variantWrite = writes.find((write) => write.table === "product_variants")!;
  assert.ok(variantWrite.filters.some((filter) => filter.key === "product_id" && filter.value === PRODUCT));
  const pairedFilter = variantWrite.filters.find((filter) => filter.method === "or")!;
  assert.deepEqual(identityPairs(pairedFilter.value as string), [{ id: variantId(0), sku: sku(0) }]);
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
  assert.deepEqual(pairs, [{ id: variantId(0), sku: exactSku }]);
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
