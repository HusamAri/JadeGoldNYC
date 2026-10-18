import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { getListingInventory, pushListingPrices } from "@/lib/etsy/inventory";
import { etsyMoneyToUnit } from "@/lib/etsy/types";
import { fetchLiveSpotUsd, type SpotQuote } from "@/lib/pricing/gold-index";
import {
  competitiveShopPrice,
  type ShopPriceDecision,
} from "@/lib/pricing/eon-shop-price";

const EON_ORG_ID = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";
const EON_SHOP_NAME = "EONFineJewelry";

type VariantRow = {
  id: string;
  sku: string | null;
  price_cents: number | null;
  weight_grams: string | number | null;
  product_id: string;
  products: {
    title: string | null;
    status: string;
    etsy_listing_id: number | null;
  };
};

export type ShopPriceTarget = {
  variantId: string;
  sku: string;
  productId: string;
  listingId: number | null;
  oldCents: number;
  newCents: number;
  cutPct: number;
  capped: boolean;
  heldAtFloor: boolean;
  matched: "list" | "sale";
};

export type ShopPriceRun = {
  ok: boolean;
  shop?: string;
  apply: boolean;
  spot?: SpotQuote;
  basisPerOzt: number;
  variants: number;
  repriced: number;
  unchanged: number;
  capped: number;
  heldAtFloor: number;
  skipped: Record<string, number>;
  avgCutPct: number | null;
  maxCutPct: number | null;
  samples: { sku: string; old: number; next: number; cutPct: number }[];
  listings?: Record<string, unknown>[];
  dbUpdated?: number;
  detail?: string;
};

function toNumber(x: string | number | null): number {
  if (x == null) return 0;
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

async function fetchActiveVariants(): Promise<VariantRow[]> {
  const admin = createAdminClient();
  const out: VariantRow[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await admin
      .from("product_variants")
      .select(
        "id, sku, price_cents, weight_grams, product_id, products!inner(title, status, etsy_listing_id, etsy_deleted_at)",
      )
      .eq("org_id", EON_ORG_ID)
      .eq("products.status", "active")
      .is("products.etsy_deleted_at", null)
      .order("id")
      .range(from, from + page - 1);
    if (error) throw new Error(`Varyant okunamadı: ${error.message}`);
    const rows = (data ?? []) as unknown as VariantRow[];
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

function summarize(decisions: ShopPriceDecision[], targets: ShopPriceTarget[]): Pick<
  ShopPriceRun,
  "unchanged" | "capped" | "heldAtFloor" | "skipped" | "avgCutPct" | "maxCutPct" | "samples"
> {
  const skipped: Record<string, number> = {};
  let unchanged = 0;
  for (const d of decisions) {
    if (d.action === "skip") skipped[d.reason] = (skipped[d.reason] ?? 0) + 1;
    if (d.action === "unchanged") unchanged += 1;
  }
  const avgCutPct =
    targets.length === 0
      ? null
      : Math.round(
          (targets.reduce((s, t) => s + t.cutPct, 0) / targets.length) * 10000,
        ) / 100;
  const maxCutPct =
    targets.length === 0
      ? null
      : Math.round(Math.max(...targets.map((t) => t.cutPct)) * 10000) / 100;
  const samples = [...targets]
    .sort((a, b) => b.cutPct - a.cutPct)
    .slice(0, 8)
    .map((t) => ({
      sku: t.sku,
      old: t.oldCents,
      next: t.newCents,
      cutPct: Math.round(t.cutPct * 10000) / 100,
    }));
  return {
    unchanged,
    capped: targets.filter((t) => t.capped).length,
    heldAtFloor: targets.filter((t) => t.heldAtFloor).length,
    skipped,
    avgCutPct,
    maxCutPct,
    samples,
  };
}

export async function runEonShopPrices(opts: {
  apply: boolean;
  listingId?: number;
}): Promise<ShopPriceRun> {
  const admin = createAdminClient();
  const spot = await fetchLiveSpotUsd();
  const { data: basisRow } = await admin
    .from("gold_reprice_basis")
    .select("spot_per_ozt")
    .eq("org_id", EON_ORG_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const basis = toNumber(
    (basisRow as { spot_per_ozt?: string | number } | null)?.spot_per_ozt ?? 0,
  );

  const rows = await fetchActiveVariants();
  const decisions: ShopPriceDecision[] = [];
  const targets: ShopPriceTarget[] = [];
  for (const row of rows) {
    if (opts.listingId && row.products.etsy_listing_id !== opts.listingId) {
      continue;
    }
    const decision = competitiveShopPrice({
      sku: row.sku ?? "",
      title: row.products.title ?? "",
      grams: toNumber(row.weight_grams),
      oldCents: row.price_cents ?? 0,
      basisPerOzt: basis,
      spotPerOzt: spot.spotPerOzt,
    });
    decisions.push(decision);
    if (decision.action !== "reprice") continue;
    targets.push({
      variantId: row.id,
      sku: (row.sku ?? "").trim(),
      productId: row.product_id,
      listingId: row.products.etsy_listing_id,
      oldCents: row.price_cents ?? 0,
      newCents: decision.newCents,
      cutPct: decision.cutPct,
      capped: decision.capped,
      heldAtFloor: decision.heldAtFloor,
      matched: decision.matched,
    });
  }

  const summary = summarize(decisions, targets);
  const result: ShopPriceRun = {
    ok: true,
    apply: opts.apply,
    spot,
    basisPerOzt: basis,
    variants: opts.listingId ? decisions.length : rows.length,
    repriced: targets.length,
    ...summary,
  };

  if (!opts.apply) return result;

  const client = await EtsyClient.forOrg(EON_ORG_ID);
  const shopId = await client.requireShopId();
  const shop = await client.get<{ shop_name?: string }>(etsyPaths.shop(shopId));
  const name = shop.shop_name ?? "";
  result.shop = name;
  if (name.toLowerCase() !== EON_SHOP_NAME.toLowerCase()) {
    return {
      ...result,
      ok: false,
      detail: `shop is ${name || "unknown"}`,
      listings: [],
      dbUpdated: 0,
    };
  }

  const byListing = new Map<number, ShopPriceTarget[]>();
  for (const target of targets) {
    if (target.listingId == null) continue;
    const list = byListing.get(target.listingId) ?? [];
    list.push(target);
    byListing.set(target.listingId, list);
  }

  const reports: Record<string, unknown>[] = [];
  const verified: ShopPriceTarget[] = [];
  for (const [listingId, list] of byListing) {
    const priceBySku = new Map(list.map((t) => [t.sku, t.newCents]));
    const pushed = await pushListingPrices(client, listingId, priceBySku);
    const report: Record<string, unknown> = {
      listingId,
      targets: list.length,
      push: pushed.status,
    };
    if (pushed.detail) report.detail = pushed.detail.slice(0, 180);
    if (pushed.status === "error") {
      reports.push(report);
      continue;
    }
    try {
      const inv = await getListingInventory(client, listingId);
      const liveBySku = new Map<string, number>();
      for (const product of inv.products ?? []) {
        if (product.is_deleted) continue;
        const offering = (product.offerings ?? []).find((o) => !o.is_deleted);
        const unit = offering ? etsyMoneyToUnit(offering.price) : 0;
        liveBySku.set((product.sku ?? "").trim(), Math.round(unit * 100));
      }
      const mismatch = list.filter((t) => liveBySku.get(t.sku) !== t.newCents);
      report.verified = mismatch.length === 0;
      if (mismatch.length > 0) {
        report.mismatch = mismatch.slice(0, 3).map(
          (t) => `${t.sku}: ${t.newCents} vs ${liveBySku.get(t.sku) ?? "missing"}`,
        );
      } else {
        verified.push(...list);
      }
    } catch (e) {
      report.verified = false;
      report.mismatch = [e instanceof Error ? e.message.slice(0, 160) : String(e)];
    }
    reports.push(report);
  }
  result.listings = reports;

  const pairs = verified.map((t) => ({ id: t.variantId, cents: t.newCents }));
  let dbUpdated = 0;
  for (let i = 0; i < pairs.length; i += 1000) {
    const chunk = pairs.slice(i, i + 1000);
    const { data: n, error } = await admin.rpc("gold_reprice_apply", {
      p_org: EON_ORG_ID,
      p_pairs: chunk,
    });
    if (error) throw new Error(`DB uygulaması: ${error.message}`);
    dbUpdated += (n as number) ?? 0;
  }
  if (verified.length > 0) {
    await admin.rpc("gold_reprice_refresh_anchors", { p_org: EON_ORG_ID });
  }
  result.dbUpdated = dbUpdated;

  if (!opts.listingId && verified.length === targets.filter((t) => t.listingId != null).length) {
    await admin.from("gold_reprice_basis").insert({
      org_id: EON_ORG_ID,
      spot_per_ozt: spot.spotPerOzt,
      source: spot.sources.map((s) => s.name).join("+"),
      note: `Altın listesi. ${verified.length} varyant. Kesinti tavanı %35; kasa indirimi ayrıca.`,
    });
  }

  await logAudit(admin, {
    orgId: EON_ORG_ID,
    action: "etsy.reprice",
    entityType: "organizations",
    entityId: EON_ORG_ID,
    summary:
      `Eon liste fiyatı yeni altına çekildi: ${targets.length} varyant hedeflendi, ` +
      `${verified.length} Etsy'de doğrulandı, panelde ${dbUpdated} güncellendi. ` +
      `Kesinti tavanı %35. Spot $${spot.spotPerOzt}/ozt.`,
    source: "app",
  });

  return result;
}
