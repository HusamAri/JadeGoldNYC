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
import { decodeHtmlEntities } from "@/lib/etsy/text";
import type {
  EtsyInventoryUpdate,
  EtsyProductUpdate,
} from "@/lib/etsy/types";

export const maxDuration = 120;

/**
 * LISTING-RELABEL — bir listing'in Etsy'deki KİMLİĞİNİ panelin kimliğine
 * eşitler: başlık + açıklama + tag'ler (PATCH) ve varyasyon değerleri + SKU +
 * fiyat (envanter PUT). Gözetimli, tek kullanımlık token, kuru varsayılan.
 *
 * NEDEN VAR (2026-09-23): E08 evil eye BİLEKLİĞİ Etsy'de kolye diye açılmıştı
 * (başlık "Necklace", 16/18/20 inç varyasyonlar, kolye tag'leri); panel ise
 * doğruydu (bileklik, 6.5/7/7.5 inç). price-sync SKU eşleşmediği için sessizce
 * `unchanged` dönüyordu. Panel doğruluk kaynağı; Etsy ona eşitlenir.
 *
 * Sözleşme:
 *  - `?org=` ZORUNLU (varsayılan org YOK — 2026-08-27 yanlış-org dersi).
 *  - `?listing=` tek listing. `?map=ESKI:YENI,ESKI:YENI` Etsy SKU → panel SKU.
 *    Her canlı offering haritada olmalı, her hedef panelde fiyatlı olmalı,
 *    sayılar eşit olmalı; aksi hâlde HİÇBİR ŞEY yazılmaz.
 *  - Varyasyon etiketi panel varyantının `properties` ilk değerinden gelir;
 *    property_id canlı envanterden korunur, value_ids boş (Etsy atar).
 *  - `?apply=1` yazma; ardından AYNI turda geri okuma (başlık/tag/SKU/etiket/
 *    fiyat) ve panel aynası senkronu (`syncOneListingVariants`).
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
    .eq("purpose", "listing-relabel")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

type VariantRow = {
  sku: string | null;
  price_cents: number | null;
  properties: unknown;
};

function firstPropertyValue(props: unknown): string | null {
  if (Array.isArray(props)) {
    for (const p of props as { value?: unknown; values?: unknown }[]) {
      if (typeof p?.value === "string" && p.value.trim()) return p.value.trim();
      if (Array.isArray(p?.values) && typeof p.values[0] === "string")
        return String(p.values[0]).trim();
    }
    return null;
  }
  if (props && typeof props === "object") {
    for (const v of Object.values(props as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return null;
}

function normTags(tags: string[]): string[] {
  return tags.map((t) => t.trim().toLowerCase()).filter(Boolean).sort();
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = url.searchParams.get("org");
  const listingId = Number.parseInt(url.searchParams.get("listing") ?? "", 10);
  const mapParam = url.searchParams.get("map") ?? "";
  if (!orgName || !Number.isFinite(listingId) || listingId <= 0 || !mapParam) {
    return NextResponse.json(
      { error: "org, listing ve map parametreleri zorunlu" },
      { status: 400 },
    );
  }
  const skuMap = new Map<string, string>();
  for (const pair of mapParam.split(",")) {
    const [oldSku, newSku] = pair.split(":").map((s) => s.trim());
    if (!oldSku || !newSku) {
      return NextResponse.json({ error: `map bozuk: ${pair}` }, { status: 400 });
    }
    skuMap.set(oldSku, newSku);
  }
  if (new Set(skuMap.values()).size !== skuMap.size) {
    return NextResponse.json({ error: "map hedef SKU'ları tekil değil" }, { status: 400 });
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
    .select("id, title, description, tags")
    .eq("org_id", orgId)
    .eq("etsy_listing_id", listingId)
    .maybeSingle();
  if (!prod) return NextResponse.json({ error: "panelde-yok" }, { status: 404 });
  const product = prod as {
    id: string;
    title: string | null;
    description: string | null;
    tags: string[] | null;
  };
  if (!product.title || !product.description || !(product.tags ?? []).length) {
    return NextResponse.json(
      { error: "panelde başlık/açıklama/tag eksik — önce panel doldurulmalı" },
      { status: 400 },
    );
  }

  const { data: vars } = await admin
    .from("product_variants")
    .select("sku, price_cents, properties")
    .eq("org_id", orgId)
    .eq("product_id", product.id)
    .eq("active", true);
  const panelBySku = new Map<string, VariantRow>();
  for (const v of (vars ?? []) as VariantRow[]) {
    const sku = (v.sku ?? "").trim();
    if (sku) panelBySku.set(sku, v);
  }

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
  }

  try {
    const inventory = await getListingInventory(client, listingId);
    const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
    if (live.length === 0) throw new Error("Etsy envanteri boş");
    if (live.length !== skuMap.size) {
      throw new Error(`canlı offering ${live.length}, harita ${skuMap.size} — eşit olmalı`);
    }

    const readinessStateId = await resolveReadinessStateId(client);
    const plan: Record<string, unknown>[] = [];
    const products: EtsyProductUpdate[] = live.map((p) => {
      const oldSku = (p.sku ?? "").trim();
      const newSku = skuMap.get(oldSku);
      if (!newSku) throw new Error(`canlı SKU haritada yok: ${oldSku || "(boş)"}`);
      const panel = panelBySku.get(newSku);
      if (!panel || !(panel.price_cents && panel.price_cents > 0)) {
        throw new Error(`panelde fiyatlı varyant yok: ${newSku}`);
      }
      const label = firstPropertyValue(panel.properties);
      if (!label) throw new Error(`panel varyantında etiket yok: ${newSku}`);
      const pvs = (p.property_values ?? []);
      if (pvs.length !== 1) {
        throw new Error(`tek eksenli listing bekleniyor, ${oldSku} ${pvs.length} eksen taşıyor`);
      }
      const offerings = (p.offerings ?? []).filter((o) => !o.is_deleted);
      if (offerings.length === 0) throw new Error(`offering yok: ${oldSku}`);
      const livePrice =
        offerings[0].price && offerings[0].price.amount && offerings[0].price.divisor
          ? Math.round((offerings[0].price.amount / offerings[0].price.divisor) * 100) / 100
          : 0;
      plan.push({
        eski: oldSku,
        yeni: newSku,
        eskiEtiket: pvs[0].values?.[0] ?? null,
        yeniEtiket: label,
        etsyFiyat: livePrice,
        panelFiyat: panel.price_cents / 100,
      });
      return {
        sku: newSku,
        property_values: [
          {
            property_id: pvs[0].property_id,
            property_name: pvs[0].property_name ?? "Length",
            value_ids: [],
            values: [label],
          },
        ],
        offerings: offerings.map((o) => ({
          price: panel.price_cents! / 100,
          quantity: o.quantity ?? 0,
          is_enabled: o.is_enabled ?? true,
          ...(readinessStateId != null ? { readiness_state_id: readinessStateId } : {}),
        })),
      };
    });
    const update: EtsyInventoryUpdate = {
      products,
      ...(inventory.price_on_property ? { price_on_property: inventory.price_on_property } : {}),
      ...(inventory.quantity_on_property
        ? { quantity_on_property: inventory.quantity_on_property }
        : {}),
      ...(inventory.sku_on_property ? { sku_on_property: inventory.sku_on_property } : {}),
      ...(readinessStateId != null ? { readiness_state_on_property: [] } : {}),
    };

    const liveListing = await getListing(client, listingId);
    const textPlan = {
      baslik: { etsy: decodeHtmlEntities(liveListing.title ?? ""), panel: product.title },
      aciklamaUzunluk: { etsy: (liveListing.description ?? "").length, panel: product.description.length },
      tags: { etsy: liveListing.tags ?? [], panel: product.tags },
    };

    if (!apply) {
      return NextResponse.json({ ok: true, apply: false, listing: listingId, plan, textPlan, readinessStateId });
    }

    // 1) Metin: tek PATCH (title + description + tags).
    const shopId = await client.requireShopId();
    await client.requestForm<unknown>("PATCH", etsyPaths.shopListing(shopId, listingId), {
      title: product.title,
      description: product.description,
      tags: (product.tags ?? []).join(","),
    });
    // 2) Envanter: varyasyon etiketi + SKU + fiyat.
    await putListingInventory(client, listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });

    // 3) Geri okuma — "200 OK" teslim sayılmaz.
    const afterListing = await getListing(client, listingId);
    const afterInv = await getListingInventory(client, listingId);
    const afterLive = (afterInv.products ?? []).filter((p) => !p.is_deleted);
    const kalan: string[] = [];
    if (decodeHtmlEntities(afterListing.title ?? "") !== product.title) kalan.push("baslik");
    if (normTags(afterListing.tags ?? []).join("|") !== normTags(product.tags ?? []).join("|"))
      kalan.push("tags");
    const expected = new Map(products.map((p) => [p.sku, p]));
    for (const p of afterLive) {
      const exp = expected.get((p.sku ?? "").trim());
      if (!exp) { kalan.push(`sku:${p.sku}`); continue; }
      const val = p.property_values?.[0]?.values?.[0];
      if (val !== exp.property_values[0].values[0]) kalan.push(`etiket:${p.sku}`);
      const o = (p.offerings ?? []).find((x) => !x.is_deleted);
      const price = o?.price?.amount && o.price.divisor ? o.price.amount / o.price.divisor : 0;
      if (Math.round(price * 100) !== Math.round(exp.offerings[0].price * 100)) kalan.push(`fiyat:${p.sku}`);
    }
    if (afterLive.length !== products.length) kalan.push("offering-sayisi");

    // 4) Panel aynası: Etsy'den okuyup product_variants'i tazele.
    const senkron = await syncOneListingVariants(orgId, product.id);

    await logAudit(admin, {
      orgId,
      action: "etsy.relabel",
      entityType: "product",
      entityId: product.id,
      summary:
        `Listing ${listingId} kimliği panele eşitlendi: başlık+açıklama+${(product.tags ?? []).length} tag, ` +
        `${products.length} varyasyon (${[...skuMap.entries()].map(([a, b]) => `${a}→${b}`).join(", ")}); ` +
        `read-back ${kalan.length === 0 ? "doğrulandı" : `BAŞARISIZ (${kalan.join(", ")})`}; panel senkron ${senkron.variants}` +
        (senkron.error ? ` (${senkron.error})` : ""),
    });

    return NextResponse.json({
      ok: kalan.length === 0,
      apply: true,
      listing: listingId,
      status: kalan.length === 0 ? "relabeled" : "verify-failed",
      kalan,
      plan,
      panelSenkron: senkron,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, listing: listingId, error: String(e) }, { status: 500 });
  }
}
