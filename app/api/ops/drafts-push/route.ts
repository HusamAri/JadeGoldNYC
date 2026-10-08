import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  createDraftListingFromProduct,
  listingTextChecks,
  personalizationFor,
  resolveTaxonomyIdForProtocol,
  type DraftProduct,
  type DraftVariant,
} from "@/lib/etsy/create-listing";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { resolveListingProtocol } from "@/lib/etsy/listing-protocol";
import type { EtsyInventory } from "@/lib/etsy/types";
import { sortVariantsByWidthThenSize } from "@/lib/variant-sort";

export const maxDuration = 300;

/**
 * Toplu Etsy DRAFT gönderimi: bir org'un SKU öneki altındaki panel
 * taslaklarını Etsy'de taslak listing olarak açar. `lintel-drafts`in genel
 * hâli; o rota EON'a ve sabit SKU listesine kilitliydi (second-brain:
 * "sabitlenmiş hedef"). Veri montajı panel butonuyla (`send-actions.ts`)
 * birebir aynı: aktif SKU'lu varyantlar + listing_images galerisi.
 *
 * Parametreler:
 *  - `org`    (zorunlu) org adı, birebir
 *  - `prefix` (zorunlu) SKU öneki, en az 4 karakter (ör. `BAS-FW-`)
 *  - `sku`    tek hedef (kanarya)
 *  - `limit`  bir çağrıda en çok kaç listing açılır (varsayılan 1, üst 10)
 *  - `apply=1` gerçek gönderim; yoksa KURU ÇALIŞMA
 *  - `verify=1` Etsy'ye çıkmış taslakları geri okur (yazmaz)
 *
 * Çift taslak kilidi: gönderimden önce `listing_metadata.draftTransfer`
 * koşullu UPDATE ile alınır (compare-and-swap). createDraft envanter
 * adımında patlarsa listing Etsy'de açılmış ama `etsy_listing_id` yazılmamış
 * olur; kilit listing id'sini tutar ve o ürün bir daha gönderilmez, elle
 * bakılır. Süre bütçesi çağrı başına verilir; kalan süre yetmiyorsa yeni
 * listing başlatılmaz (yarıda kesilen çağrı kapanış kaydını da götürür).
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` ya da `?token=` →
 * `ops_tokens` purpose='drafts-push' SHA-256 CAS tüketimi.
 */

const PURPOSE = "drafts-push";
/** Bir listing (10 görsel + 243 varyantlık envanter) ~60 sn sürebilir. */
const START_BUDGET_MS = 200_000;

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;

  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", PURPOSE)
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  // Yutulan hata "token yok" ile "DB'ye ulaşılamadı"yı aynı 401'e çeviriyordu (2026-10-07).
  if (error) console.error("drafts-push authorize: ops_tokens update failed", error.code, error.message);
  return (data ?? []).length > 0;
}

type ProductRow = Omit<DraftProduct, "variants" | "galleryUrls"> & {
  sku: string;
  listing_metadata: (DraftProduct["listing_metadata"] & { draftTransfer?: unknown }) | null;
};

const PRODUCT_COLUMNS =
  "id, org_id, sku, etsy_listing_id, title, description, tags, materials, price_cents, quantity, image_url, product_type, listing_metadata";

export async function GET(request: Request) {
  const startedAt = Date.now();
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const orgName = url.searchParams.get("org");
  const prefix = url.searchParams.get("prefix") ?? "";
  const only = url.searchParams.get("sku");
  const apply = url.searchParams.get("apply") === "1";
  const verify = url.searchParams.get("verify") === "1";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 1) || 1, 1), 10);
  if (!orgName || prefix.length < 4) {
    return NextResponse.json({ error: "org ve en az 4 karakterlik prefix zorunlu" }, { status: 400 });
  }
  if (only && !only.startsWith(prefix)) {
    return NextResponse.json({ error: "sku, prefix ile başlamalı" }, { status: 400 });
  }
  if (apply && verify) {
    return NextResponse.json({ error: "apply ve verify birlikte verilmez" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .eq("name", orgName)
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? "org bulunamadı" }, { status: 404 });
  }

  // getEtsyWriteAccess oturumun aktif org'una bakar (current_org_id); ops
  // çağrısında oturum yok ve her zaman false döner. Token'la yetkilenen rota
  // bağlantı kaydını doğrudan okur (ophir-publish-edit ile aynı kural).
  const { data: connection } = await admin
    .from("etsy_connection")
    .select("status, scope")
    .eq("org_id", org.id)
    .maybeSingle();
  const conn = connection as { status: string; scope: string | null } | null;
  const writeEnabled =
    conn?.status === "connected" && /(^|\s)listings_w(\s|$)/.test(conn.scope ?? "");
  if (apply && !writeEnabled) {
    return NextResponse.json({ error: "Etsy yazma erişimi kapalı." }, { status: 403 });
  }

  let client: EtsyClient | null = null;
  let shopId = 0;
  if (apply || verify) {
    try {
      client = await EtsyClient.forOrg(org.id);
      shopId = await client.requireShopId();
    } catch (e) {
      return NextResponse.json(
        { error: "etsy not connected", detail: e instanceof Error ? e.message : String(e) },
        { status: 503 },
      );
    }
  }

  // Hedefler: önek altındaki arşivlenmemiş panel taslakları. verify Etsy'ye
  // çıkmışları, gönderim çıkmamışları okur.
  let q = admin
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("org_id", org.id)
    .like("sku", `${prefix}%`)
    .eq("status", "draft")
    .is("archived_at", null)
    .order("sku", { ascending: true });
  q = verify ? q.not("etsy_listing_id", "is", null) : q.is("etsy_listing_id", null);
  if (only) q = q.eq("sku", only);
  const { data: rows, error: rowsErr } = await q;
  if (rowsErr) {
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }
  const products = (rows ?? []) as ProductRow[];
  if (products.length === 0) {
    // "Eşleşme yok" ile "iş yok" aynı görünmesin: sıfır hedef ayrı bir sonuçtur.
    return NextResponse.json(
      { ok: false, error: "hedef yok", org: org.name, prefix, sku: only, verify },
      { status: 404 },
    );
  }

  const assemble = async (prod: ProductRow) => {
    const { data: vData } = await admin
      .from("product_variants")
      .select("sku, name, properties, price_cents, quantity")
      .eq("org_id", org.id)
      .eq("product_id", prod.id)
      .eq("active", true);
    const withSku = ((vData ?? []) as DraftVariant[]).filter(
      (v): v is DraftVariant & { sku: string } => (v.sku ?? "").trim().length > 0,
    );
    const { data: imgData } = await admin
      .from("listing_images")
      .select("url")
      .eq("org_id", org.id)
      .eq("product_id", prod.id)
      .order("position", { ascending: true });
    // create-listing görseli `fetch(url)` ile indirir; göreli yol parse edilemez.
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin;
    const absolutize = (u: string) =>
      u.startsWith("http") ? u : `${base}${u.startsWith("/") ? u : `/${u}`}`;
    const image_url = prod.image_url ? absolutize(prod.image_url.trim()) : prod.image_url;
    const galleryUrls = ((imgData ?? []) as { url: string | null }[])
      .map((r) => (r.url ?? "").trim())
      .filter(Boolean)
      .map(absolutize);
    // create-listing'in yükleyeceği küme: kapak + galeri, tekilleştirilmiş.
    const uploadCount = new Set([image_url, ...galleryUrls].filter(Boolean)).size;
    return {
      product: { ...prod, image_url, galleryUrls, variants: sortVariantsByWidthThenSize(withSku) },
      uploadCount,
    };
  };

  const results: Record<string, unknown>[] = [];

  if (verify && client) {
    for (const prod of products) {
      if (Date.now() - startedAt > START_BUDGET_MS) {
        results.push({ sku: prod.sku, status: "deferred" });
        continue;
      }
      const listingId = prod.etsy_listing_id as number;
      const row: Record<string, unknown> = { sku: prod.sku, listingId };
      try {
        const { product, uploadCount } = await assemble(prod);
        const protocol = resolveListingProtocol(product);
        const listing = await client.get<{
          listing_id: number;
          shop_id: number;
          state: string;
          title: string;
          taxonomy_id: number;
          is_personalizable?: boolean;
          tags?: string[];
          description?: string;
        }>(etsyPaths.listing(listingId));
        const inv = await client.get<EtsyInventory>(
          etsyPaths.listingInventory(listingId) + "?legacy=false",
        );
        const imgs = await client.get<{ count: number; results: unknown[] }>(
          etsyPaths.listingImagesRead(listingId),
        );
        const live = inv.products.filter((p) => !p.is_deleted);
        const panelPrice = new Map(product.variants.map((v) => [v.sku, v.price_cents]));
        let priceMismatch = 0;
        let missingSku = 0;
        for (const p of live) {
          const off = p.offerings?.find((o) => !o.is_deleted);
          const want = panelPrice.get(p.sku ?? "");
          if (want == null) {
            missingSku++;
            continue;
          }
          const cents = off?.price ? Math.round((off.price.amount / off.price.divisor) * 100) : -1;
          if (cents !== want) priceMismatch++;
        }
        let taxonomyPrimary: boolean | null = null;
        if (protocol) {
          const primary = await resolveTaxonomyIdForProtocol(client, {
            ...protocol,
            taxonomyNames: [protocol.taxonomyNames[0]],
          });
          taxonomyPrimary = primary.ok ? primary.taxonomyId === listing.taxonomy_id : null;
        }
        const expectPersonal = protocol ? personalizationFor(protocol, product) != null : null;
        const text = listingTextChecks(listing, product);
        const checks = {
          draft: listing.state === "draft",
          shop: listing.shop_id === shopId,
          title: listing.title === product.title,
          tags: text.tags,
          description: text.description,
          variants: live.length === product.variants.length,
          skus: missingSku === 0,
          prices: priceMismatch === 0,
          images: imgs.results.length === uploadCount,
          taxonomyPrimary,
          personalization:
            expectPersonal == null || listing.is_personalizable == null
              ? null
              : listing.is_personalizable === expectPersonal,
        };
        results.push({
          ...row,
          status: Object.values(checks).every((c) => c !== false) ? "verified" : "mismatch",
          protocol: protocol?.id ?? null,
          state: listing.state,
          etsyTitle: checks.title ? undefined : listing.title,
          panelTitle: checks.title ? undefined : product.title,
          tagDiff: checks.tags === false ? { missing: text.missingTags, extra: text.extraTags } : undefined,
          descriptionDiff: text.descriptionDiff ?? undefined,
          taxonomyId: listing.taxonomy_id,
          etsyVariants: live.length,
          panelVariants: product.variants.length,
          etsyImages: imgs.results.length,
          panelImages: uploadCount,
          missingSku,
          priceMismatch,
          checks,
        });
      } catch (e) {
        results.push({ ...row, status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }
    const count = (s: string) => results.filter((r) => r.status === s).length;
    return NextResponse.json({
      ok: count("mismatch") === 0 && count("error") === 0,
      mode: "verify",
      org: org.name,
      targets: products.length,
      verified: count("verified"),
      mismatch: count("mismatch"),
      error: count("error"),
      deferred: count("deferred"),
      results,
    });
  }

  let started = 0;
  for (const prod of products) {
    const row: Record<string, unknown> = { sku: prod.sku };
    const transfer = prod.listing_metadata?.draftTransfer;
    if (transfer != null) {
      // Önceki aktarımın sonucu belirsiz: Etsy'de taslak açılmış olabilir.
      results.push({ ...row, status: "blocked", error: "önceki aktarım kaydı var", draftTransfer: transfer });
      continue;
    }
    const { product, uploadCount } = await assemble(prod);
    const protocol = resolveListingProtocol(product);
    row.protocol = protocol?.id ?? null;
    row.variants = product.variants.length;
    row.images = uploadCount;
    row.personalization = protocol ? personalizationFor(protocol, product) != null : null;
    if ((prod.description ?? "").includes("[[")) {
      results.push({ ...row, status: "blocked", error: "description placeholder taşıyor" });
      continue;
    }
    if (!protocol || product.variants.length === 0 || uploadCount === 0) {
      results.push({ ...row, status: "not-ready" });
      continue;
    }
    if (!apply || !client) {
      results.push({ ...row, status: "dry-run" });
      continue;
    }
    if (started >= limit || Date.now() - startedAt > START_BUDGET_MS) {
      results.push({ ...row, status: "deferred" });
      continue;
    }

    const meta = prod.listing_metadata ?? {};
    const claim = await admin
      .from("products")
      .update({
        listing_metadata: {
          ...meta,
          draftTransfer: { status: "sending", route: PURPOSE, startedAt: new Date().toISOString() },
        },
      })
      .eq("org_id", org.id)
      .eq("id", prod.id)
      .is("etsy_listing_id", null)
      .is("listing_metadata->draftTransfer", null)
      .select("id");
    if (claim.error || (claim.data ?? []).length !== 1) {
      results.push({ ...row, status: "blocked", error: claim.error?.message ?? "kilit alınamadı" });
      continue;
    }
    started++;

    const result = await createDraftListingFromProduct(admin, client, org.id, shopId, product);
    const clean = result.ok && !result.warnings?.length;
    // createDraft başarıda etsy_listing_id + url yazdı; burada yalnız kilit
    // kaydını kapatıyoruz (metadata'yı yeniden okuyup üstüne yazmadan).
    const { data: fresh } = await admin
      .from("products")
      .select("listing_metadata")
      .eq("org_id", org.id)
      .eq("id", prod.id)
      .maybeSingle();
    await admin
      .from("products")
      .update({
        listing_metadata: {
          ...((fresh?.listing_metadata as Record<string, unknown> | null) ?? meta),
          draftTransfer: {
            status: clean ? "created" : "needs_review",
            route: PURPOSE,
            listingId: result.listingId ?? null,
            step: result.step ?? null,
            error: result.error ?? null,
            warnings: result.warnings ?? [],
            finishedAt: new Date().toISOString(),
          },
        },
      })
      .eq("org_id", org.id)
      .eq("id", prod.id);
    results.push({ ...row, status: clean ? "created" : "needs_review", ...result });
  }

  const count = (s: string) => results.filter((r) => r.status === s).length;
  return NextResponse.json({
    ok: count("needs_review") === 0 && count("blocked") === 0 && count("not-ready") === 0,
    apply,
    org: org.name,
    writeEnabled,
    targets: products.length,
    created: count("created"),
    needsReview: count("needs_review"),
    blocked: count("blocked"),
    notReady: count("not-ready"),
    dryRun: count("dry-run"),
    deferred: count("deferred"),
    results,
  });
}
