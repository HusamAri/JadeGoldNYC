import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListing } from "@/lib/etsy/listing";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  getListingInventory,
  putListingInventory,
  resolveReadinessStateId,
} from "@/lib/etsy/inventory";
import { syncOneListingVariants } from "@/lib/etsy/variants";
import { logAudit } from "@/lib/audit";
import { buildRebuildInventory, type RebuildVariant } from "@/lib/etsy/inventory-rebuild";
import type { EtsyInventoryUpdate } from "@/lib/etsy/types";

export const maxDuration = 120;

/**
 * INVENTORY-REBUILD: bir Etsy TASLAĞININ envanterini panel varyantlarından
 * baştan yazar. Varyasyon YAPISI değiştiğinde (ör. 2 eksen → 3 eksen,
 * beden aralığı genişledi) price-sync işe yaramaz: o yalnız var olan
 * offering'lerin fiyatını SKU ile eşler, yeni kombinasyon açamaz.
 *
 * NEDEN VAR (2026-09-26): Cartouche Signet Etsy'ye Metal × Ring Size (105)
 * olarak taslak açıldı; sahip 18K beyaz/rose ve tüm US bedenleri istedi ve
 * "bundan sonra 3 varyantlı kur" dedi → Karat × Metal Color × Ring Size (243).
 *
 * Sözleşme:
 *  - `?org=` ZORUNLU (varsayılan org YOK, 2026-08-27 yanlış-org dersi).
 *  - `?listing=` tek listing; varsayılan yalnız Etsy state `draft`.
 *    Aktif listing ancak `?active=1` ile ve sahibin açık talebiyle kurulur
 *    (yapı değişimi sepetteki eski kombinasyonları düşürür; Cartouche
 *    Signet 2026-09-26: yayında ama 0 satış, sahip tam matrisi istedi).
 *    sold_out / inactive / expired her durumda reddedilir.
 *  - Eksen sırası `?axes=A,B,C` ya da `listing_metadata.variationAxes`.
 *    Her aktif panel varyantı her eksende değer taşımalı, kombinasyon ve SKU
 *    tekil olmalı; aksi hâlde HİÇBİR ŞEY yazılmaz.
 *  - Yük, create yolunun (lib/etsy/create-listing.ts) sözleşmesiyle aynıdır:
 *    3 eksen 516/513/514, 2 eksen 513/514; kullanılan tüm slotlar
 *    price_on_property ve sku_on_property'de; offering başına readiness.
 *  - `?text=1` başlık + açıklama + tag'leri de panelden PATCH'ler.
 *  - `?apply=1` yazar; AYNI turda geri okur (sayı, SKU, eksen değerleri,
 *    fiyat) ve panel aynasını tazeler (`syncOneListingVariants`).
 */

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "inventory-rebuild")
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
  const withText = url.searchParams.get("text") === "1";
  const orgName = url.searchParams.get("org");
  const listingId = Number.parseInt(url.searchParams.get("listing") ?? "", 10);
  if (!orgName || !Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "org ve listing parametreleri zorunlu" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

  const { data: prod } = await admin
    .from("products")
    .select("id, title, description, tags, quantity, listing_metadata")
    .eq("org_id", orgId)
    .eq("etsy_listing_id", listingId)
    .maybeSingle();
  if (!prod) return NextResponse.json({ error: "panelde-yok" }, { status: 404 });
  const product = prod as {
    id: string;
    title: string | null;
    description: string | null;
    tags: string[] | null;
    quantity: number | null;
    listing_metadata: { variationAxes?: unknown } | null;
  };

  const axesParam = url.searchParams.get("axes");
  const metaAxes = product.listing_metadata?.variationAxes;
  const axes = axesParam
    ? axesParam.split(",").map((a) => a.trim()).filter(Boolean)
    : Array.isArray(metaAxes)
      ? metaAxes.filter((a): a is string => typeof a === "string")
      : [];

  const { data: vars } = await admin
    .from("product_variants")
    .select("sku, price_cents, quantity, properties")
    .eq("org_id", orgId)
    .eq("product_id", product.id)
    .eq("active", true);
  const variants = (vars ?? []) as RebuildVariant[];

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
  }

  try {
    const liveListing = await getListing(client, listingId);
    const allowActive = url.searchParams.get("active") === "1";
    const stateOk =
      liveListing.state === "draft" || (allowActive && liveListing.state === "active");
    if (!stateOk) {
      throw new Error(
        `listing Etsy'de '${liveListing.state}'; yalnız taslak, ya da active=1 ile aktif listing yeniden kurulur`,
      );
    }
    const readinessStateId = await resolveReadinessStateId(client);
    if (readinessStateId == null) throw new Error("Made-to-order işlem profili çözülemedi");

    const built = buildRebuildInventory(variants, axes, readinessStateId, product.quantity ?? 1);
    if (!built.ok) throw new Error(built.error);
    const update: EtsyInventoryUpdate = built.update;

    const before = await getListingInventory(client, listingId);
    const beforeLive = (before.products ?? []).filter((p) => !p.is_deleted);
    const ozet = {
      eksenler: axes,
      etsyOnce: beforeLive.length,
      panelSonra: update.products.length,
      eksenDegerleri: built.axisValues,
      fiyatAraligi: built.priceRange,
      slotlar: update.price_on_property,
    };

    if (!apply) {
      return NextResponse.json({ ok: true, apply: false, listing: listingId, ozet });
    }

    if (withText) {
      if (!product.title || !product.description || !(product.tags ?? []).length) {
        throw new Error("text=1 için panelde başlık/açıklama/tag dolu olmalı");
      }
      const shopId = await client.requireShopId();
      await client.requestForm<unknown>("PATCH", etsyPaths.shopListing(shopId, listingId), {
        title: product.title,
        description: product.description,
        tags: (product.tags ?? []).join(","),
      });
    }
    await putListingInventory(client, listingId, update, { legacy: false });

    // Geri okuma: "200 OK" teslim sayılmaz.
    const after = await getListingInventory(client, listingId);
    const afterLive = (after.products ?? []).filter((p) => !p.is_deleted);
    const kalan: string[] = [];
    if (afterLive.length !== update.products.length) {
      kalan.push(`offering-sayisi ${afterLive.length}/${update.products.length}`);
    }
    const expected = new Map(update.products.map((p) => [p.sku, p]));
    for (const p of afterLive) {
      const exp = expected.get((p.sku ?? "").trim());
      if (!exp) {
        kalan.push(`sku:${p.sku}`);
        continue;
      }
      for (const ev of exp.property_values) {
        const got = (p.property_values ?? []).find((x) => x.property_name === ev.property_name);
        if (got?.values?.[0] !== ev.values[0]) kalan.push(`eksen:${p.sku}:${ev.property_name}`);
      }
      const o = (p.offerings ?? []).find((x) => !x.is_deleted);
      const price = o?.price?.amount && o.price.divisor ? o.price.amount / o.price.divisor : 0;
      if (Math.round(price * 100) !== Math.round(exp.offerings[0].price * 100)) {
        kalan.push(`fiyat:${p.sku}`);
      }
    }

    const senkron = await syncOneListingVariants(orgId, product.id);

    await logAudit(admin, {
      orgId,
      action: "etsy.inventory_rebuild",
      entityType: "product",
      entityId: product.id,
      summary:
        `Listing ${listingId} (${liveListing.state}) envanteri panelden yeniden kuruldu: ${axes.join(" × ")}, ` +
        `${beforeLive.length} → ${update.products.length} offering` +
        (withText ? ", başlık+açıklama+tag PATCH" : "") +
        `; read-back ${kalan.length === 0 ? "doğrulandı" : `BAŞARISIZ (${kalan.slice(0, 10).join(", ")})`}` +
        `; panel senkron ${senkron.variants}` +
        (senkron.error ? ` (${senkron.error})` : ""),
    });

    return NextResponse.json({
      ok: kalan.length === 0,
      apply: true,
      listing: listingId,
      status: kalan.length === 0 ? "rebuilt" : "verify-failed",
      kalan: kalan.slice(0, 50),
      ozet,
      panelSenkron: senkron,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, listing: listingId, error: String(e) }, { status: 500 });
  }
}
