import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { getListingInventory, pushListingQuantity } from "@/lib/etsy/inventory";
import {
  enabledQuantities,
  planQuantitySet,
  priceFingerprint,
} from "@/lib/etsy/quantity-set";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * QUANTITY-SET: seçili listing'lerin Etsy adedini tek bir değere çeker
 * (gözetimli, tek kullanımlık token).
 *
 * NEDEN VAR (2026-11-17, Leander): 20 Evil Eye listing'i adet 1 ile yayında,
 * mağazanın geri kalanı 20. Sipariş üzerine üretilen listing'de adet 1, ilk
 * satışta listing'in tükenip yayından düşmesi demektir. Satıştan sonra 19'da
 * kalan listing de aynı yolla 20'ye döner.
 *
 * Tasarım (price-sync ile aynı desen):
 *  - Auth: `Authorization: Bearer $CRON_SECRET` ya da `?token=` (`ops_tokens`
 *    purpose='quantity-set', SHA-256 CAS, tek kullanımlık, süreli).
 *  - `?org=` ZORUNLU, varsayılan yok (yanlış org sessizce "panelde-yok" döner).
 *  - `?listings=<id,id,...>` ZORUNLU, en çok 25; `?qty=` 1..999 ZORUNLU.
 *  - Varsayılan KURU ÇALIŞMA: Etsy envanterini okur, listing başına mevcut
 *    adetleri ve planı döner. Ayrıca mağazanın işlem profili tanımlarını ve
 *    offering'lerdeki profil kimliklerini döker (salt okuma).
 *  - `?apply=1`: yalnız planı "would-set" olan listing yazılır. Adet bir
 *    varyasyona bağlıysa, satışa açık offering'ler farklı adet taşıyorsa ya
 *    da bir fiyat okunamıyorsa REDDEDİLİR (lib/etsy/quantity-set.ts).
 *  - Yazım `pushListingQuantity(..., applyToAll)`: fiyatlar okunduğu gibi
 *    geri gönderilir, okunamayan fiyatta PUT yapılmaz.
 *  - Yazımdan sonra AYNI turda geri okuma: satışa açık her offering hedef
 *    adette olmalı VE fiyat/yapı izi yazım öncesiyle birebir aynı olmalı.
 *  - Doğrulanan listing'de panel `products.quantity` hedefe çekilir
 *    (inventory-rebuild `product.quantity ?? 1` kullanır; boş kalırsa bir
 *    sonraki yeniden kurma adedi yine 1'e düşürür).
 */

const MAX_LISTINGS = 25;

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
    .eq("purpose", "quantity-set")
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

  const orgName = (url.searchParams.get("org") ?? "").trim();
  if (!orgName) {
    return NextResponse.json({ error: "org parametresi zorunlu" }, { status: 400 });
  }

  const qtyRaw = (url.searchParams.get("qty") ?? "").trim();
  const qty = /^\d{1,3}$/.test(qtyRaw) ? Number.parseInt(qtyRaw, 10) : Number.NaN;
  if (!(qty >= 1 && qty <= 999)) {
    return NextResponse.json({ error: "qty parametresi zorunlu (1..999)" }, { status: 400 });
  }

  const listingIds = [
    ...new Set(
      (url.searchParams.get("listings") ?? "")
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];
  if (listingIds.length === 0) {
    return NextResponse.json(
      { error: "listings parametresi zorunlu (virgüllü etsy_listing_id)" },
      { status: 400 },
    );
  }
  if (listingIds.length > MAX_LISTINGS) {
    return NextResponse.json(
      { error: `tek çağrıda en çok ${MAX_LISTINGS} listing` },
      { status: 400 },
    );
  }

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

  // Kuru çalışmada mağazanın işlem profili tanımları (salt okuma). Adet yazımı
  // her offering'e "made_to_order" profilini yeniden damgalar; hangi süreyi
  // taşıdığı burada görünür.
  let readinessStates: unknown;
  if (!apply) {
    try {
      const shopId = await client.resolveShopId();
      if (shopId != null) {
        const rs = await client.get<{ results?: unknown[] }>(
          etsyPaths.readinessStateDefinitions(shopId),
        );
        readinessStates = rs.results ?? [];
      }
    } catch (e) {
      readinessStates = { error: String(e) };
    }
  }

  const results: Row[] = [];
  for (const listingId of listingIds) {
    const { data: prod } = await admin
      .from("products")
      .select("id, title, quantity")
      .eq("org_id", orgId)
      .eq("etsy_listing_id", listingId)
      .maybeSingle();
    if (!prod) {
      results.push({ listing: listingId, status: "panelde-yok" });
      continue;
    }
    const p = prod as { id: string; title: string | null; quantity: number | null };

    try {
      const inventory = await getListingInventory(client, listingId);
      const plan = planQuantitySet(inventory, qty);
      const base: Row = {
        listing: listingId,
        title: (p.title ?? "").slice(0, 48),
        panelQuantity: p.quantity,
        before: plan.before,
        products: plan.products,
        offerings: plan.offerings,
        disabled: plan.disabled,
      };

      if (plan.status === "refuse") {
        results.push({ ...base, status: "refused", reason: plan.reason });
        continue;
      }

      if (plan.status === "already") {
        // Etsy hedefte; panel geride kaldıysa yalnız panel eşitlenir.
        if (apply && p.quantity !== qty) {
          await admin.from("products").update({ quantity: qty }).eq("org_id", orgId).eq("id", p.id);
          results.push({ ...base, status: "already", panel: "eşitlendi" });
        } else {
          results.push({ ...base, status: "already" });
        }
        continue;
      }

      if (!apply) {
        const readiness = [
          ...new Set(
            (inventory.products ?? [])
              .filter((x) => !x.is_deleted)
              .flatMap((x) => (x.offerings ?? []).filter((o) => !o.is_deleted))
              .map((o) => (o as { readiness_state_id?: number }).readiness_state_id ?? null),
          ),
        ];
        results.push({ ...base, status: "would-set", readiness });
        continue;
      }

      const fingerprint = priceFingerprint(inventory);
      const outcome = await pushListingQuantity(client, listingId, null, qty, true);
      if (outcome.status !== "updated") {
        results.push({
          ...base,
          status: outcome.status === "error" ? "error" : "skipped",
          detail: outcome.detail ?? null,
        });
        continue;
      }

      // Geri okuma: adet hedefte mi, fiyat ve yapı yazım öncesiyle aynı mı.
      const verify = await getListingInventory(client, listingId);
      const after = enabledQuantities(verify);
      const qtyOk = after.length === 1 && after[0] === qty;
      const pricesKept = priceFingerprint(verify) === fingerprint;
      const ok = qtyOk && pricesKept;
      if (qtyOk) {
        await admin.from("products").update({ quantity: qty }).eq("org_id", orgId).eq("id", p.id);
      }
      results.push({ ...base, status: ok ? "set" : "verify-failed", after, pricesKept });
      await logAudit(admin, {
        orgId,
        action: "etsy.stock_push",
        entityType: "product",
        entityId: p.id,
        summary:
          `Adet (ops quantity-set): listing ${listingId}, ${plan.before.join("/")} -> ${qty}, ` +
          `${plan.offerings} offering; geri okuma ${ok ? "doğrulandı, fiyatlar aynı" : "BAŞARISIZ"}.`,
        diff: { listing: listingId, before: plan.before, after, offerings: plan.offerings, pricesKept },
        source: "ops/quantity-set",
      });
    } catch (e) {
      results.push({ listing: listingId, status: "error", detail: String(e) });
    }
  }

  return NextResponse.json({
    ok: true,
    apply,
    org: orgName,
    qty,
    results,
    ...(readinessStates !== undefined ? { readinessStates } : {}),
  });
}
