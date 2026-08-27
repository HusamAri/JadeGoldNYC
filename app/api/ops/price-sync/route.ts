import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  buildPriceSyncUpdate,
  getListingInventory,
  pushListingPrices,
} from "@/lib/etsy/inventory";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * PRICE-SYNC — panel varyant fiyatlarını Etsy envanterine basar
 * (gözetimli, tek kullanımlık token).
 *
 * NEDEN VAR: gold-reprice motoru hedeflerini PANELDEN kurar ve "DB == hedef"
 * satırı basmaz — panel fiyatı güncellenip Etsy'de eski fiyat kaldığında
 * (2026-08-17 Greek Key vakası: el-işi işçilik tabanı $40 → $74'e çekildi,
 * 1.750 varyant DB'de yeniden fiyatlandı ama Etsy draft'ları eski tabanda
 * kaldı) o uyumsuzluğu hiçbir mevcut akış göremiyordu. Bu rota tersini yapar:
 * doğruluk kaynağı DB'dir, Etsy ona eşitlenir.
 *
 * Güvenlik/tasarım (es-push + lintel-drafts desenleri):
 *  - Auth: `Authorization: Bearer $CRON_SECRET` VEYA `?token=` (`ops_tokens`
 *    purpose='price-sync', SHA-256 CAS — tek kullanımlık, süreli).
 *  - `?listings=<id,id,...>` ZORUNLU — "tüm mağaza" modu bilerek YOK; her
 *    çağrı hedeflerini açıkça sayar.
 *  - Varsayılan KURU ÇALIŞMA; gerçek yazma `?apply=1`. Kuru çalışma Etsy
 *    envanterini okuyup offering-başına farkı raporlar, hiçbir şey yazmaz.
 *  - Apply sonrası AYNI turda read-back: envanter yeniden okunur ve kalan
 *    fark sayısının 0 olduğu kanıtlanır ("200 OK" teslim sayılmaz).
 *  - Fiyatı 0/NULL panel varyantı haritaya girmez (canlı fiyatı ezemez).
 */

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
    .eq("purpose", "price-sync")
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
  const listingsParam = url.searchParams.get("listings") ?? "";
  const listingIds = listingsParam
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (listingIds.length === 0) {
    return NextResponse.json(
      { error: "listings parametresi zorunlu (virgüllü etsy_listing_id)" },
      { status: 400 },
    );
  }

  // Org, es-pull ile aynı desende parametreli. Varsayılan EON — bu rota EON
  // için yazıldı ve mevcut çağrılar org'suz geliyor, kırılmasınlar.
  // 2026-08-27: sabit "EON" idi ve rota adı genel olduğu için Jade fiyat
  // itişinde sessizce YANLIŞ org'a bakıyordu; Jade listing'leri EON'un
  // kataloğunda olmadığı için her satır "panelde-yok" dönerdi — yani hiç
  // yazmadan "ok" raporlardı. panelPushAll'daki FLAT_FIX_TARGETS org süzgeci
  // vakasının aynısı (bkz. o dosyadaki yorum).
  const orgName = url.searchParams.get("org") ?? "EON";
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .maybeSingle();
  if (!org) {
    return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  }
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

  const results: Row[] = [];
  for (const listingId of listingIds) {
    const { data: prod } = await admin
      .from("products")
      .select("id, title")
      .eq("org_id", orgId)
      .eq("etsy_listing_id", listingId)
      .maybeSingle();
    if (!prod) {
      results.push({ listing: listingId, status: "panelde-yok" });
      continue;
    }
    const productId = (prod as { id: string }).id;

    const { data: vars } = await admin
      .from("product_variants")
      .select("sku, price_cents")
      .eq("org_id", orgId)
      .eq("product_id", productId);
    const priceBySku = new Map<string, number>();
    for (const v of (vars ?? []) as { sku: string | null; price_cents: number | null }[]) {
      const sku = (v.sku ?? "").trim();
      if (sku && v.price_cents != null && v.price_cents > 0) {
        priceBySku.set(sku, v.price_cents);
      }
    }
    if (priceBySku.size === 0) {
      results.push({ listing: listingId, status: "panel-fiyati-yok" });
      continue;
    }

    try {
      if (!apply) {
        // Kuru çalışma: Etsy'yi oku, farkı say, yazma.
        const inventory = await getListingInventory(client, listingId);
        const { changed } = buildPriceSyncUpdate(inventory, priceBySku);
        results.push({
          listing: listingId,
          status: changed > 0 ? "would-sync" : "unchanged",
          offeringFarki: changed,
          panelVaryant: priceBySku.size,
        });
        continue;
      }

      const outcome = await pushListingPrices(client, listingId, priceBySku);
      if (outcome.status === "error") {
        results.push({
          listing: listingId,
          status: "error",
          detail: outcome.detail ?? null,
        });
        continue;
      }

      // Read-back: aynı turda envanteri yeniden oku; kalan fark 0 olmalı.
      const verify = await getListingInventory(client, listingId);
      const { changed: kalan } = buildPriceSyncUpdate(verify, priceBySku);
      const ok = kalan === 0;
      results.push({
        listing: listingId,
        status: ok ? "synced" : "verify-failed",
        yazilan: outcome.changed,
        kalanFark: kalan,
      });
      await logAudit(admin, {
        orgId,
        action: "etsy.reprice",
        entityType: "product",
        entityId: productId,
        summary:
          `Fiyat senkronu (ops price-sync): listing ${listingId} — ` +
          `${outcome.changed} offering güncellendi; read-back ${ok ? "doğrulandı" : `BAŞARISIZ (${kalan} fark kaldı)`}.`,
      });
    } catch (e) {
      results.push({ listing: listingId, status: "error", detail: String(e) });
    }
  }

  return NextResponse.json({ ok: true, apply, results });
}
