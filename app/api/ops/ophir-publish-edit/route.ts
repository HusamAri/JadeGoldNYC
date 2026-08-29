import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { logAudit } from "@/lib/audit";
import { requireMembership, isManager, MANAGER_ONLY_ERROR } from "@/lib/auth";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const OPHIR_SLUG = "ophir-gold-usa";
const EXPECTED_EDIT_LISTINGS = 84;
const CONCURRENCY = 4;

type ProductRow = {
  id: string;
  etsy_listing_id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  price_cents: number | null;
  quantity: number | null;
  num_images: number | null;
};

type VariantRow = {
  product_id: string;
  sku: string | null;
  price_cents: number | null;
  quantity: number | null;
};

type PublishResult = {
  listing: number;
  productId: string;
  state?: string;
  error?: string;
};

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Publishes Ophir listings currently returned by Etsy as `edit`.
 *
 * Etsy defines `edit` as the same lifecycle state as `inactive`. Publishing is
 * an updateListing PATCH with `state=active`. The route is deliberately scoped
 * to the 84 approved listings and refuses partial or structurally invalid input.
 * Existing inventory, prices, SKUs, images, copy and discounts are not written.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("confirm") !== "PUBLISH_84") {
    return NextResponse.json(
      { error: "confirm=PUBLISH_84 is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let orgId: string;
  let tokenAuthorized = false;
  const token = url.searchParams.get("token");
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: consumed } = await admin
      .from("ops_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("purpose", "ophir-publish-edit")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id");
    if ((consumed ?? []).length !== 1) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data: ophir } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", OPHIR_SLUG)
      .maybeSingle();
    if (!ophir) {
      return NextResponse.json({ error: "Ophir Gold USA not found." }, { status: 404 });
    }
    orgId = ophir.id;
    tokenAuthorized = true;
  } else {
    const membership = await requireMembership();
    if (!isManager(membership.role)) {
      return NextResponse.json({ error: MANAGER_ONLY_ERROR }, { status: 403 });
    }
    orgId = membership.org_id;
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .maybeSingle();
  if (!org || org.slug !== OPHIR_SLUG) {
    return NextResponse.json(
      { error: "Active organization must be Ophir Gold USA." },
      { status: 409 },
    );
  }

  const writeEnabled = tokenAuthorized
    ? (await admin.rpc("etsy_write_enabled", { p_org: orgId })).data === true
    : (await getEtsyWriteAccess(orgId)).writeEnabled;
  if (!writeEnabled) {
    return NextResponse.json({ error: "Etsy write access is disabled." }, { status: 403 });
  }

  const { data: productData, error: productError } = await admin
    .from("products")
    .select(
      "id, etsy_listing_id, title, description, status, price_cents, quantity, num_images",
    )
    .eq("org_id", orgId)
    .eq("status", "edit")
    .not("etsy_listing_id", "is", null)
    .order("etsy_listing_id", { ascending: true });
  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }
  const products = (productData ?? []) as ProductRow[];
  if (products.length !== EXPECTED_EDIT_LISTINGS) {
    return NextResponse.json(
      {
        error: "Approved listing count changed. Nothing was published.",
        expected: EXPECTED_EDIT_LISTINGS,
        found: products.length,
      },
      { status: 409 },
    );
  }

  const productIds = products.map((product) => product.id);
  const variants: VariantRow[] = [];
  for (let from = 0; ; from += 1_000) {
    const { data, error } = await admin
      .from("product_variants")
      .select("product_id, sku, price_cents, quantity")
      .in("product_id", productIds)
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const page = (data ?? []) as VariantRow[];
    variants.push(...page);
    if (page.length < 1_000) break;
  }

  const variantsByProduct = new Map<string, VariantRow[]>();
  for (const variant of variants) {
    const rows = variantsByProduct.get(variant.product_id) ?? [];
    rows.push(variant);
    variantsByProduct.set(variant.product_id, rows);
  }

  const preflightIssues: { listing: number; issue: string }[] = [];
  for (const product of products) {
    const rows = variantsByProduct.get(product.id) ?? [];
    const add = (issue: string) =>
      preflightIssues.push({ listing: product.etsy_listing_id, issue });
    if (!product.title?.trim()) add("missing title");
    if (!product.description?.trim()) add("missing description");
    if (!product.num_images || product.num_images < 1) add("missing image");
    if (!product.price_cents || product.price_cents < 1) add("invalid product price");
    if (!product.quantity || product.quantity < 1) add("invalid product quantity");
    if (rows.length === 0) add("missing variants");
    if (rows.some((row) => !row.sku?.trim())) add("missing variant SKU");
    if (rows.some((row) => !row.price_cents || row.price_cents < 1)) {
      add("invalid variant price");
    }
    if (rows.some((row) => !row.quantity || row.quantity < 1)) {
      add("invalid variant quantity");
    }
  }
  if (preflightIssues.length > 0) {
    return NextResponse.json(
      { error: "Preflight failed. Nothing was published.", preflightIssues },
      { status: 409 },
    );
  }

  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();
  const results: PublishResult[] = [];

  for (const batch of chunks(products, CONCURRENCY)) {
    const batchResults = await Promise.all(
      batch.map(async (product): Promise<PublishResult> => {
        try {
          await client.requestForm(
            "PATCH",
            etsyPaths.shopListing(shopId, product.etsy_listing_id),
            { state: "active" },
          );

          let state = "";
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const live = await client.get<{ state?: string }>(
              etsyPaths.listing(product.etsy_listing_id),
            );
            state = live.state ?? "";
            if (state === "active") break;
            await sleep(400 * (attempt + 1));
          }
          if (state !== "active") {
            return {
              listing: product.etsy_listing_id,
              productId: product.id,
              state,
              error: `Read-back state is ${state || "unknown"}.`,
            };
          }
          return {
            listing: product.etsy_listing_id,
            productId: product.id,
            state,
          };
        } catch (error) {
          return {
            listing: product.etsy_listing_id,
            productId: product.id,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );
    results.push(...batchResults);
    await sleep(250);
  }

  const published = results.filter((result) => result.state === "active" && !result.error);
  const failed = results.filter((result) => result.error);
  if (published.length > 0) {
    const { error } = await admin
      .from("products")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("org_id", orgId)
      .in(
        "id",
        published.map((result) => result.productId),
      );
    if (error) {
      return NextResponse.json(
        {
          error: "Etsy publish succeeded but panel mirror update failed.",
          detail: error.message,
          published: published.length,
          failed,
        },
        { status: 500 },
      );
    }
  }

  await logAudit(admin, {
    orgId,
    action: "etsy.listing_state",
    entityType: "products",
    summary: `Ophir bulk publish: ${published.length}/${products.length} active, ${failed.length} failed`,
    diff: {
      from: "edit",
      to: "active",
      approvedCount: EXPECTED_EDIT_LISTINGS,
      publishedListingIds: published.map((result) => result.listing),
      failures: failed.map(({ listing, error }) => ({ listing, error })),
    },
    source: "app",
  });

  return NextResponse.json(
    {
      ok: failed.length === 0 && published.length === EXPECTED_EDIT_LISTINGS,
      org: org.name,
      approved: EXPECTED_EDIT_LISTINGS,
      published: published.length,
      failed: failed.length,
      variantRowsChecked: variants.length,
      failures: failed.map(({ listing, error }) => ({ listing, error })),
    },
    { status: failed.length === 0 ? 200 : 207 },
  );
}
