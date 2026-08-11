import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  createDraftListingFromProduct,
  type DraftProduct,
  type DraftVariant,
} from "@/lib/etsy/create-listing";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { sortVariantsByWidthThenSize } from "@/lib/variant-sort";

export const maxDuration = 300;

/**
 * The Lintel lansmanı — 9 panel taslağını Etsy'de DRAFT listing olarak açar
 * (gözetimli, tek seferlik / idempotent). Runbook: docs/eon/lintel-launch-runbook.md
 *
 * `sendListingToEtsy` server action'ının ops karşılığı: aynı veri montajı
 * (aktif varyantlar + listing_images galerisi), aynı çekirdek
 * (`createDraftListingFromProduct`). Oturum yerine ops-token kapısı, çünkü
 * Etsy OAuth token'ları yalnız production app bağlamında çalışır ve tetikleyen
 * tarafın CRON_SECRET env'ine erişimi olmayabilir (0136 gerekçesi).
 *
 * Auth (prune-widths ile aynı desen):
 *  1. `Authorization: Bearer $CRON_SECRET`
 *  2. `?token=` → `ops_tokens` purpose='lintel-drafts' SHA-256 CAS tüketimi
 *
 * Varsayılan KURU ÇALIŞMA (hedefleri ve hazırlık durumunu sayar, hiçbir şey
 * yazmaz). Gerçek gönderim `?apply=1`; tek listing kanıtı `?sku=GLD-R-1008`.
 * İdempotent: etsy_listing_id dolu ürün atlanır (createDraft zaten kilitler).
 */

/** 9 Lintel ailesi — ev şeması profil 08 (runbook kararı). */
const LINTEL_SKUS = [
  "GLD-R-1008",
  "WHG-R-1008",
  "RSG-R-1008",
  "GLD-R-1408",
  "WHG-R-1408",
  "RSG-R-1408",
  "GLD-R-1808",
  "WHG-R-1808",
  "RSG-R-1808",
] as const;

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;

  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "lintel-drafts")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const only = url.searchParams.get("sku");
  const skus = only
    ? LINTEL_SKUS.filter((s) => s === only)
    : [...LINTEL_SKUS];
  if (skus.length === 0) {
    return NextResponse.json({ error: "no matching target" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .eq("name", "EON")
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json(
      { error: orgErr?.message ?? "EON org not found" },
      { status: 500 },
    );
  }

  const { writeEnabled } = await getEtsyWriteAccess(org.id);
  if (apply && !writeEnabled) {
    return NextResponse.json({ error: "Etsy yazma erişimi kapalı." }, { status: 403 });
  }

  let client: EtsyClient | null = null;
  let shopId = 0;
  if (apply) {
    try {
      client = await EtsyClient.forOrg(org.id);
      shopId = await client.requireShopId();
    } catch (e) {
      return NextResponse.json(
        {
          error: "etsy not connected",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 503 },
      );
    }
  }

  const results: Record<string, unknown>[] = [];

  for (const sku of skus) {
    const row: Record<string, unknown> = { sku };
    const { data: pData, error: pErr } = await admin
      .from("products")
      .select(
        "id, org_id, etsy_listing_id, title, description, tags, materials, price_cents, quantity, image_url",
      )
      .eq("org_id", org.id)
      .eq("sku", sku)
      .maybeSingle();
    if (pErr || !pData) {
      results.push({ ...row, status: "missing", error: pErr?.message ?? "ürün yok" });
      continue;
    }
    const prod = pData as Omit<DraftProduct, "variants" | "galleryUrls">;
    if (prod.etsy_listing_id != null) {
      results.push({ ...row, status: "skipped", listingId: prod.etsy_listing_id });
      continue;
    }

    const { data: vData } = await admin
      .from("product_variants")
      .select("sku, properties, price_cents, quantity")
      .eq("org_id", org.id)
      .eq("product_id", prod.id)
      .eq("active", true);
    const withSku = ((vData ?? []) as DraftVariant[]).filter(
      (v): v is DraftVariant & { sku: string } =>
        (v.sku ?? "").trim().length > 0,
    );

    const { data: imgData } = await admin
      .from("listing_images")
      .select("url")
      .eq("org_id", org.id)
      .eq("product_id", prod.id)
      .order("position", { ascending: true });
    // Panel galerisi göreli yol saklar (/eon/...); create-listing bunları
    // `fetch(url)` ile indirir ve Node fetch GÖRELİ URL'i parse EDEMEZ —
    // görseller sessizce atlanır, Etsy'de fotoğrafsız taslak kalırdı.
    // Rota prod'da koştuğu için kendi origin'i public /eon/* dosyalarını
    // birebir servis eder; burada mutlaklaştır. Kapak da aynı dertte:
    // create-listing products.image_url'i galeriye kendisi ekler, o yüzden
    // prod nesnesindeki alanı da mutlaklaştırıyoruz.
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin;
    const absolutize = (u: string) =>
      u.startsWith("http") ? u : `${base}${u.startsWith("/") ? u : `/${u}`}`;
    prod.image_url = prod.image_url ? absolutize(prod.image_url.trim()) : prod.image_url;
    const galleryUrls = ((imgData ?? []) as { url: string | null }[])
      .map((r) => (r.url ?? "").trim())
      .filter(Boolean)
      .map(absolutize);

    row.variants = withSku.length;
    row.images = galleryUrls.length;
    // Açıklamaya placeholder sızmışsa bu ürün ASLA gönderilmez (runbook kuralı).
    const leaky = (prod.description ?? "").includes("[[");
    if (leaky) {
      results.push({ ...row, status: "blocked", error: "description placeholder taşıyor" });
      continue;
    }
    if (withSku.length === 0 || galleryUrls.length === 0) {
      results.push({ ...row, status: "not-ready" });
      continue;
    }
    if (!apply || !client) {
      results.push({ ...row, status: "dry-run" });
      continue;
    }

    const result = await createDraftListingFromProduct(
      admin,
      client,
      org.id,
      shopId,
      { ...prod, galleryUrls, variants: sortVariantsByWidthThenSize(withSku) },
    );
    results.push({ ...row, ...result });
  }

  return NextResponse.json({
    ok: true,
    apply,
    org: org.name,
    writeEnabled,
    targets: skus.length,
    results,
  });
}
