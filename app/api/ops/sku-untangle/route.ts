import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  getListingInventory,
  pushListingPrices,
  renameListingSkuPrefix,
} from "@/lib/etsy/inventory";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { logAudit } from "@/lib/audit";
import {
  variantPropsForMatch,
  type RawVariantProperties,
} from "@/lib/variant-properties";

export const maxDuration = 300;

/**
 * SKU KİMLİK AYRIŞTIRMASI — kopya-listing çakışmasının kalıcı çözümü
 * (gözetimli, tek seferlik, idempotent; 2026-08-11 vakası).
 *
 * ## Durum
 * İki canlı listing ($260'lık 4540106368 rose dome + 4543427531 white flat)
 * Etsy'de, panelde BAŞKA listing'lerin sahiplendiği SKU ailelerini taşıyor:
 *   - RSG-R-1401 → panelde SARI listing 4544441878'e bağlı (kopya kaynağı)
 *   - WHG-R-1402 → panelde HAMMERED listing 4543442596'ya bağlı
 * Bu yüzden iki listing'in panel aynası boş; fiyat itişleri onları kapsayamadı
 * ve Temmuz düzeltmesinin tamamen dışında kaldılar (zararına satış riski —
 * kullanıcı ikisini pasife aldı).
 *
 * ## Akış (`?step=`)
 *  - `untangle`: sahip listing'lerin Etsy SKU'ları semantik doğru kimliğe
 *    taşınır (sarı: RSG→GLD; hammered: WHG-R-1402→HMW-R-1402 — 1402 rakamları
 *    bilinçli korunur, karat/fiyat davranışı değişmez) + dört listing'in panel
 *    aynası tazelenir. Serbest kalan aileler pasif listing'lere bağlanır.
 *  - (fiyat kopyası DB'de ayrıca yapılır: ikiz aileden — rota işi değil)
 *  - `publish`: iki listing'e DB fiyatları itilir, GERİ OKUMAYLA doğrulanır,
 *    çapa güncellenir; `&activate=1` verilirse doğrulama geçen listing yeniden
 *    yayına alınır.
 *
 * ## Auth
 * `Authorization: Bearer $CRON_SECRET` VEYA `?token=` (ops_tokens, 0136):
 * SHA-256 hash CAS tüketimi — tek kullanımlık, süreli, çift kullanım imkânsız.
 * Varsayılan KURU ÇALIŞMA; gerçek yazma `?apply=1`.
 */

const YELLOW = {
  listingId: 4544441878,
  from: "RSG-R-1401-",
  to: "GLD-R-1401-",
  label: "14K Yellow Dome (kopya kaynağı)",
};
const HAMMER = {
  listingId: 4543442596,
  from: "WHG-R-1402-",
  to: "HMW-R-1402-",
  label: "Hammered",
};
const FREED = [
  {
    listingId: 4540106368,
    family: "RSG-R-1401-",
    twin: "WHG-R-1401-",
    label: "14K Rose Dome",
  },
  {
    listingId: 4543427531,
    family: "WHG-R-1402-",
    twin: "GLD-R-1402-",
    label: "14K White Flat",
  },
];

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  // CAS tüketimi: koşullu UPDATE yalnız bir çağrıda satır döndürür.
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "sku-untangle")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

type Row = Record<string, unknown>;

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const step = url.searchParams.get("step") ?? "untangle";
  const activate = url.searchParams.get("activate") === "1";

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", "EON")
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "EON yok" }, { status: 500 });
  const orgId = (org as { id: string }).id;

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json(
      { error: "etsy not connected", detail: String(e) },
      { status: 503 },
    );
  }

  const productIdByListing = async (listingId: number) => {
    const { data } = await admin
      .from("products")
      .select("id, status")
      .eq("org_id", orgId)
      .eq("etsy_listing_id", listingId)
      .maybeSingle();
    return data as { id: string; status: string | null } | null;
  };

  const results: Row[] = [];

  if (step === "untangle") {
    const { syncOneListingVariants } = await import("@/lib/etsy/variants");

    for (const t of [YELLOW, HAMMER]) {
      const row: Row = { step: "rename", listing: t.listingId, label: t.label };
      const prod = await productIdByListing(t.listingId);
      if (!prod) {
        row.status = "error";
        row.detail = "panelde ürün yok";
        results.push(row);
        continue;
      }

      // İdempotentlik: hedef önek zaten bu ürüne bağlıysa rename bitmiştir.
      const { count: done } = await admin
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("product_id", prod.id)
        .like("sku", `${t.to}%`);
      if ((done ?? 0) > 0) {
        row.status = "already-done";
        results.push(row);
        continue;
      }

      if (!apply) {
        const inv = await getListingInventory(client, t.listingId);
        const skus = (inv.products ?? [])
          .filter((p) => !p.is_deleted)
          .map((p) => p.sku ?? "");
        row.status = "would-rename";
        row.etsy_skus = skus.length;
        row.matching = skus.filter((s) => s.startsWith(t.from)).length;
        results.push(row);
        continue;
      }

      // Eksen adları (Width/Ring Size) — 2025 PUT sözleşmesi (panel action'la
      // aynı: eski SKU önekiyle org genelinden çekilir; satırlar kaynak
      // listing'e bağlı olabilir).
      const { data: vRows } = await admin
        .from("product_variants")
        .select("sku, properties")
        .eq("org_id", orgId)
        .like("sku", `${t.from}%`);
      const propsBySku = new Map<string, { name: string; value: string }[]>();
      for (const v of (vRows ?? []) as {
        sku: string | null;
        properties: RawVariantProperties;
      }[]) {
        const sku = (v.sku ?? "").trim();
        if (sku) propsBySku.set(sku, variantPropsForMatch(v.properties));
      }

      const r = await renameListingSkuPrefix(
        client,
        t.listingId,
        t.from,
        t.to,
        propsBySku,
      );
      row.status = r.status;
      row.renamed = r.renamed;
      if (r.detail) row.detail = r.detail;
      if (r.status !== "error") {
        const s = await syncOneListingVariants(orgId, prod.id);
        row.mirror = s.error ?? `${s.variants} varyant`;
        await logAudit(admin, {
          orgId,
          action: "etsy.variant_sync",
          entityType: "product",
          entityId: prod.id,
          summary: `SKU ayrıştırma (ops): listing ${t.listingId} — ${r.renamed} SKU '${t.from}' → '${t.to}'.`,
          source: "app",
        });
      }
      results.push(row);
    }

    // Serbest kalan aileleri pasif listing'lere bağla.
    for (const f of FREED) {
      const row: Row = { step: "mirror", listing: f.listingId, label: f.label };
      const prod = await productIdByListing(f.listingId);
      if (!prod) {
        row.status = "error";
        row.detail = "panelde ürün yok";
        results.push(row);
        continue;
      }
      if (!apply) {
        row.status = "would-sync";
        results.push(row);
        continue;
      }
      const s = await syncOneListingVariants(orgId, prod.id);
      row.status = s.error ? "error" : "synced";
      row.variants = s.variants;
      if (s.error) row.detail = s.error;
      results.push(row);
    }
  } else if (step === "publish") {
    for (const f of FREED) {
      const row: Row = { step: "publish", listing: f.listingId, label: f.label };
      const prod = await productIdByListing(f.listingId);
      if (!prod) {
        row.status = "error";
        row.detail = "panelde ürün yok";
        results.push(row);
        continue;
      }
      const { data: vars } = await admin
        .from("product_variants")
        .select("sku, price_cents")
        .eq("org_id", orgId)
        .eq("product_id", prod.id);
      const priceBySku = new Map<string, number>();
      for (const v of (vars ?? []) as { sku: string; price_cents: number }[]) {
        if (v.sku && v.price_cents > 0) priceBySku.set(v.sku, v.price_cents);
      }
      row.panel_variants = priceBySku.size;
      if (priceBySku.size === 0) {
        row.status = "error";
        row.detail = "panelde varyant yok — önce untangle adımı";
        results.push(row);
        continue;
      }
      if (!apply) {
        row.status = "would-push";
        results.push(row);
        continue;
      }

      const out = await pushListingPrices(client, f.listingId, priceBySku);
      row.push = out.status;
      row.changed = out.changed;
      if (out.detail) row.detail = out.detail;
      if (out.status === "error") {
        results.push(row);
        continue;
      }

      // GERİ OKU — "200 OK" teslim sayılmaz.
      const after = await getListingInventory(client, f.listingId);
      const prices = (after.products ?? [])
        .filter((p) => !p.is_deleted)
        .flatMap((p) =>
          (p.offerings ?? [])
            .filter((o) => !o.is_deleted)
            .map((o) =>
              o.price ? Math.round((o.price.amount / o.price.divisor) * 100) : 0,
            ),
        );
      const minLive = prices.length ? Math.min(...prices) : null;
      const expectedMin = Math.min(...priceBySku.values());
      row.live_min = minLive;
      row.expected_min = expectedMin;
      const verified = minLive != null && minLive >= expectedMin;
      row.verified = verified;
      if (!verified) {
        results.push(row);
        continue;
      }

      await admin
        .from("products")
        .update({ price_cents: minLive })
        .eq("id", prod.id)
        .eq("org_id", orgId);

      await logAudit(admin, {
        orgId,
        action: "etsy.reprice",
        entityType: "product",
        entityId: prod.id,
        summary:
          `SKU ayrıştırma sonrası fiyat yayını: listing ${f.listingId} (${f.label}) — ` +
          `${out.changed} offering güncellendi, canlı taban ${((minLive ?? 0) / 100).toFixed(0)}$ doğrulandı.`,
        source: "etsy",
      });

      if (activate) {
        try {
          const shopId = await client.requireShopId();
          await client.requestForm(
            "PATCH",
            etsyPaths.shopListing(shopId, f.listingId),
            { state: "active" },
          );
          await admin
            .from("products")
            .update({ status: "active" })
            .eq("id", prod.id)
            .eq("org_id", orgId);
          row.activated = true;
          await logAudit(admin, {
            orgId,
            action: "etsy.listing_state",
            entityType: "product",
            entityId: prod.id,
            summary: `Listing ${f.listingId} doğrulanmış fiyatlarla yeniden YAYINA alındı (${f.label}).`,
            source: "app",
          });
        } catch (e) {
          row.activated = false;
          row.activate_error = e instanceof Error ? e.message : String(e);
        }
      }
      row.status = "ok";
      results.push(row);
    }
  } else {
    return NextResponse.json({ error: "step: untangle | publish" }, { status: 400 });
  }

  return NextResponse.json({ dry_run: !apply, step, results });
}
