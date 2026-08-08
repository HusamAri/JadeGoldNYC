import type { SupabaseClient } from "@supabase/supabase-js";

import { EtsyClient } from "@/lib/etsy/client";
import {
  getListingInventory,
  putListingInventory,
  resolveReadinessStateId,
} from "@/lib/etsy/inventory";
import type {
  EtsyInventory,
  EtsyInventoryUpdate,
  EtsyProductUpdate,
} from "@/lib/etsy/types";
import { logAudit } from "@/lib/audit";

/**
 * Varyantını kaybetmiş (sıfır-varyant) listing'lerin zararına tek fiyatını
 * düzelten ORTAK çekirdek. İki tüketicisi var:
 *   - `/api/ops/fix-underpriced` (CRON_SECRET'lı ops rotası, curl ile)
 *   - `/fiyat` panelindeki tek-tuş itiş (server action) — kullanıcı yalnız
 *     panelden işlem yapabildiğinde tek yol budur.
 *
 * Neden ayrı akış: bu listing'lerin panelde varyantı YOK, dolayısıyla ne
 * fiyat konsolu (gram tabanlı kuru çalıştırma) ne DB-fiyat itişi onları
 * kapsayabilir. Tek fiyatları ızgara tabanına çekilir.
 */

export type FlatFixMode = "floor" | "safe";

export type FlatFixTarget = {
  listingId: number;
  /** Fiyat ızgarasındaki karat anahtarı. */
  karat: "10K" | "14K" | "18K";
  /** Izgara profili: milgrain dışındaki tüm profiller `standard`. */
  profile: "standard" | "milgrain";
  label: string;
};

/**
 * Bilinen sıfır-varyant + zararına fiyat vakaları (teşhis 2026-08-08):
 * 28 Temmuz itişine varyantsızlık yüzünden girmeyip $260'ta kalan iki CANLI
 * listing. Kalıcı çözüm SKU kimlik ayrıştırması; bu liste kanama durdurucu.
 * (4543000739 sold_out + tek bedenlik olduğu için bilerek dışarıda.)
 */
export const FLAT_FIX_TARGETS: FlatFixTarget[] = [
  { listingId: 4540106368, karat: "14K", profile: "standard", label: "14K Rose Dome" },
  { listingId: 4543427531, karat: "14K", profile: "standard", label: "14K White Flat" },
];

/**
 * Listing'in TÜM offering'lerini tek hedef fiyata çeker.
 *
 * Yalnız YÜKSELTİR: hedeften zaten pahalı offering'e dokunulmaz. Izgara ya da
 * karat eşlemesi yanlış olsaydı bu koruma fiyatı düşürmemizi engeller —
 * geri dönüşü olmayan yönde hata yapmayız.
 */
export function buildFlatRaiseUpdate(
  inventory: EtsyInventory,
  targetCents: number,
  readinessStateId?: number | null,
): { update: EtsyInventoryUpdate; changed: number; seen: number } {
  let changed = 0;
  let seen = 0;
  const products: EtsyProductUpdate[] = (inventory.products ?? [])
    .filter((p) => !p.is_deleted)
    .map((p) => ({
      sku: p.sku ?? "",
      property_values: (p.property_values ?? []).map((pv) => ({
        property_id: pv.property_id,
        property_name: pv.property_name ?? "",
        value_ids: pv.value_ids ?? [],
        values: pv.values ?? [],
        ...(pv.scale_id != null ? { scale_id: pv.scale_id } : {}),
      })),
      offerings: (p.offerings ?? [])
        .filter((o) => !o.is_deleted)
        .map((o) => {
          seen += 1;
          const cur = o.price
            ? Math.round((o.price.amount / o.price.divisor) * 100)
            : 0;
          const next = cur < targetCents ? targetCents : cur;
          if (next !== cur) changed += 1;
          return {
            price: next / 100,
            quantity: o.quantity ?? 1,
            is_enabled: o.is_enabled ?? true,
            ...(readinessStateId != null
              ? { readiness_state_id: readinessStateId }
              : {}),
          };
        }),
    }));
  return {
    update: {
      products,
      price_on_property: inventory.price_on_property ?? [],
      quantity_on_property: inventory.quantity_on_property ?? [],
      sku_on_property: inventory.sku_on_property ?? [],
      ...(readinessStateId != null ? { readiness_state_on_property: [] } : {}),
    },
    changed,
    seen,
  };
}

export type FlatFixRow = Record<string, unknown>;

/**
 * Tek hedef için uçtan uca akış: ızgara sınırlarını oku → Etsy envanterini
 * oku → yapılandırılmış SKU varsa REDDET (varyantlı listing'e düz fiyat
 * basılmaz) → kuru çalışmada sayıları döndür / apply'da yaz → GERİ OKUYARAK
 * doğrula ("200 OK" teslim sayılmaz) → panel çapasını ve audit'i yalnız
 * doğrulama geçince yaz.
 */
export async function runFlatFix(
  client: EtsyClient,
  admin: SupabaseClient,
  orgId: string,
  t: FlatFixTarget,
  opts: { apply: boolean; mode: FlatFixMode },
): Promise<FlatFixRow> {
  const { apply, mode } = opts;
  const row: FlatFixRow = { listing: t.listingId, label: t.label, mode };

  // ── 1. Izgaradan bu karat/profil için sınırları oku ──────────────────
  const { data: gridRows, error: gridErr } = await admin
    .from("pricing_engine_current")
    .select("list_cents, landed_cents")
    .eq("org_id", orgId)
    .eq("karat", t.karat)
    .eq("profile", t.profile);
  if (gridErr || !gridRows || gridRows.length === 0) {
    row.status = "error";
    row.detail = gridErr?.message ?? "fiyat ızgarasında satır yok";
    return row;
  }
  const minList = Math.min(...gridRows.map((r) => Number(r.list_cents)));
  const maxList = Math.max(...gridRows.map((r) => Number(r.list_cents)));
  const targetCents = mode === "safe" ? maxList : minList;
  row.grid = {
    configs: gridRows.length,
    min_list: minList,
    max_list: maxList,
    max_landed: Math.max(...gridRows.map((r) => Number(r.landed_cents))),
  };
  row.target_cents = targetCents;

  // ── 2. Etsy envanterini oku ──────────────────────────────────────────
  let inventory: EtsyInventory;
  try {
    inventory = await getListingInventory(client, t.listingId);
  } catch (e) {
    row.status = "error";
    row.detail = e instanceof Error ? e.message : String(e);
    return row;
  }
  const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
  const skus = live.map((p) => p.sku ?? "").filter(Boolean);
  const prices = live.flatMap((p) =>
    (p.offerings ?? [])
      .filter((o) => !o.is_deleted)
      .map((o) =>
        o.price ? Math.round((o.price.amount / o.price.divisor) * 100) : 0,
      ),
  );
  row.etsy = {
    products: live.length,
    offerings: prices.length,
    skus: skus.slice(0, 10),
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
  };

  if (prices.length === 0) {
    row.status = "skipped";
    row.detail = "Etsy envanteri boş — yazacak offering yok";
    return row;
  }

  // ── 3. Gerçek varyant matrisi VARSA dokunma ──────────────────────────
  const structured = skus.filter((s) => /-\d+(\.\d+)?MM-/.test(s));
  if (structured.length > 0) {
    row.status = "refused";
    row.detail =
      `Etsy'de ${structured.length} yapılandırılmış SKU var — bu listing ` +
      `varyantlı. Düz fiyat basmak matrisi bozar; panel aynasını senkronla ` +
      `ve fiyat itişini kullan.`;
    return row;
  }

  if (!apply) {
    const willChange = prices.filter((p) => p < targetCents).length;
    row.status = willChange > 0 ? "would-update" : "unchanged";
    row.would_change = willChange;
    return row;
  }

  // ── 4. Yaz ───────────────────────────────────────────────────────────
  const readinessStateId = await resolveReadinessStateId(client);
  const { update, changed } = buildFlatRaiseUpdate(
    inventory,
    targetCents,
    readinessStateId,
  );
  if (changed === 0) {
    row.status = "unchanged";
    return row;
  }
  try {
    await putListingInventory(client, t.listingId, update, {
      legacy: readinessStateId != null ? false : undefined,
    });
  } catch (e) {
    row.status = "error";
    row.detail = e instanceof Error ? e.message : String(e);
    return row;
  }

  // ── 5. GERİ OKU — "200 OK" teslim sayılmaz (second-brain kuralı) ─────
  let after: EtsyInventory;
  try {
    after = await getListingInventory(client, t.listingId);
  } catch (e) {
    row.status = "unverified";
    row.detail =
      `PUT gitti ama geri okuma başarısız: ` +
      (e instanceof Error ? e.message : String(e));
    return row;
  }
  const afterPrices = (after.products ?? [])
    .filter((p) => !p.is_deleted)
    .flatMap((p) =>
      (p.offerings ?? [])
        .filter((o) => !o.is_deleted)
        .map((o) =>
          o.price ? Math.round((o.price.amount / o.price.divisor) * 100) : 0,
        ),
    );
  const stillLow = afterPrices.filter((p) => p < targetCents).length;
  row.after = {
    min_price: afterPrices.length ? Math.min(...afterPrices) : null,
    still_below_target: stillLow,
  };
  if (stillLow > 0) {
    row.status = "unverified";
    row.detail = `Geri okumada ${stillLow} offering hâlâ hedefin altında`;
    return row;
  }

  // ── 6. Panel aynasını YALNIZ doğrulandıktan sonra eşitle ─────────────
  const newAnchor = Math.min(...afterPrices);
  const { error: syncErr } = await admin
    .from("products")
    .update({ price_cents: newAnchor })
    .eq("org_id", orgId)
    .eq("etsy_listing_id", t.listingId);
  row.panel_sync = syncErr ? `hata: ${syncErr.message}` : "ok";

  await logAudit(admin, {
    orgId,
    action: "etsy.reprice",
    entityType: "products",
    entityId: String(t.listingId),
    summary:
      `Zararına fiyat düzeltmesi (${t.label}, listing ${t.listingId}): ` +
      `${changed} offering ${mode} modunda ${(targetCents / 100).toFixed(0)}$ ` +
      `hedefine yükseltildi; yeni çapa ${(newAnchor / 100).toFixed(0)}$.`,
    source: "etsy",
  });

  row.status = "updated";
  row.changed = changed;
  return row;
}
