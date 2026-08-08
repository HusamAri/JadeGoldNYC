import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
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

export const maxDuration = 300;

/**
 * Varyantını kaybetmiş listing'lerin ZARARINA fiyatını düzeltir
 * (gözetimli, tek seferlik, idempotent).
 *
 * ## Sorun
 *
 * Üç EON listing'i panelde SIFIR varyantla duruyor (bkz. sıfır-varyant
 * mutabakatı). Varyantı olmayan listing 2026-07-28 fiyat itişine hiç
 * girmedi — üzerlerinde o düzeltmeden ÖNCEKİ tek fiyat kalmış:
 *
 *   4540106368  14K Rose Dome   "2mm to 12mm"  →  $260
 *   4543427531  14K White Flat  "2mm to 12mm"  →  $260
 *
 * İkisi de CANLI. Kardeş 14K listing'leri aynı ürünü $410'dan başlatıyor,
 * fiyat motoru da 14K/2mm/beden 4 için $390 liste diyor (maliyet $188).
 * Motor ızgarasına göre 14K standard'ın 143 konfigürasyonundan 130'u
 * $260'ın ÜSTÜNDE maliyete sahip: en geniş/en büyük beden yalnız metalde
 * $1.270 tutuyor, yani $260'a satılırsa ~$1.010 zarar.
 *
 * ## Kök neden (kalıcı çözüm ayrı iş)
 *
 * SKU sahipliği el değiştirmiş: `RSG-R-1401` ailesi (275 varyant, doğru
 * fiyatlı) rose listing'i yerine SARI başlıklı 4544441878'e bağlı. Bu rota
 * o kimlik karışıklığını ÇÖZMEZ — yalnız kanamayı durdurur. Kalıcı çözüm
 * SKU önekini ayırmak + varyant matrisini geri kurmak.
 *
 * ## Bu rotanın sınırı — dürüst olmak gerekirse
 *
 * "2mm to 12mm" vaat eden bir listing TEK fiyatla yapısal olarak güvenli
 * olamaz: taban fiyat dar bedende doğruyken geniş bedende hâlâ zarardır.
 * Bu yüzden `mode` iki seçenek sunar ve kuru çalışma İKİSİNİ de gösterir:
 *
 *   mode=floor (varsayılan) → en dar bedenin liste fiyatı. Kardeşlerle
 *     hizalanır, tipik siparişteki zararı bitirir; GENİŞ bedende risk sürer.
 *   mode=safe              → hiçbir konfigürasyonun zarar etmeyeceği fiyat
 *     (en yüksek liste). Ticari olarak caydırıcıdır ama sıfır risklidir.
 *
 * Gerçek çözüm her hâlükârda varyant matrisini geri kurmaktır.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` veya `?token=$PRUNE_ONE_SHOT_TOKEN`.
 * Varsayılan KURU ÇALIŞMA — gerçek yazma için `?apply=1`.
 */

type Target = {
  listingId: number;
  /** Fiyat ızgarasındaki karat anahtarı. */
  karat: "10K" | "14K" | "18K";
  /** Izgara profili: milgrain dışındaki tüm profiller `standard`. */
  profile: "standard" | "milgrain";
  label: string;
};

const TARGETS: Target[] = [
  { listingId: 4540106368, karat: "14K", profile: "standard", label: "14K Rose Dome" },
  { listingId: 4543427531, karat: "14K", profile: "standard", label: "14K White Flat" },
];

const ONE_SHOT = process.env.PRUNE_ONE_SHOT_TOKEN;

type Grid = {
  minListCents: number;
  maxListCents: number;
  maxLandedCents: number;
  configs: number;
};

/**
 * Listing'in TÜM offering'lerini tek hedef fiyata çeker.
 *
 * Yalnız YÜKSELTİR: hedeften zaten pahalı offering'e dokunulmaz. Izgara ya da
 * karat eşlemesi yanlış olsaydı bu koruma fiyatı düşürmemizi engeller —
 * geri dönüşü olmayan yönde hata yapmayız.
 */
function buildRaiseOnlyUpdate(
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

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const oneShot = url.searchParams.get("token");
  const authorized =
    (secret && auth === `Bearer ${secret}`) ||
    (ONE_SHOT != null && ONE_SHOT.length > 0 && oneShot === ONE_SHOT);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apply = url.searchParams.get("apply") === "1";
  const mode = url.searchParams.get("mode") === "safe" ? "safe" : "floor";
  const only = url.searchParams.get("listing");
  const targets = only
    ? TARGETS.filter((t) => String(t.listingId) === only)
    : TARGETS;
  if (targets.length === 0) {
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

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(org.id);
  } catch (e) {
    return NextResponse.json(
      {
        error: "etsy not connected",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 503 },
    );
  }

  const results: Record<string, unknown>[] = [];

  for (const t of targets) {
    const row: Record<string, unknown> = {
      listing: t.listingId,
      label: t.label,
      mode,
    };

    // ── 1. Izgaradan bu karat/profil için sınırları oku ────────────────
    const { data: gridRows, error: gridErr } = await admin
      .from("pricing_engine_current")
      .select("list_cents, landed_cents")
      .eq("org_id", org.id)
      .eq("karat", t.karat)
      .eq("profile", t.profile);
    if (gridErr || !gridRows || gridRows.length === 0) {
      row.status = "error";
      row.detail = gridErr?.message ?? "fiyat ızgarasında satır yok";
      results.push(row);
      continue;
    }
    const grid: Grid = {
      minListCents: Math.min(...gridRows.map((r) => Number(r.list_cents))),
      maxListCents: Math.max(...gridRows.map((r) => Number(r.list_cents))),
      maxLandedCents: Math.max(...gridRows.map((r) => Number(r.landed_cents))),
      configs: gridRows.length,
    };
    const targetCents =
      mode === "safe" ? grid.maxListCents : grid.minListCents;
    row.grid = {
      configs: grid.configs,
      min_list: grid.minListCents,
      max_list: grid.maxListCents,
      max_landed: grid.maxLandedCents,
    };
    row.target_cents = targetCents;

    // ── 2. Etsy envanterini oku ────────────────────────────────────────
    let inventory: EtsyInventory;
    try {
      inventory = await getListingInventory(client, t.listingId);
    } catch (e) {
      row.status = "error";
      row.detail = e instanceof Error ? e.message : String(e);
      results.push(row);
      continue;
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
    row.zarar_riski_konfig = gridRows.filter(
      (r) => Number(r.landed_cents) > (prices.length ? Math.min(...prices) : 0),
    ).length;

    if (prices.length === 0) {
      row.status = "skipped";
      row.detail = "Etsy envanteri boş — yazacak offering yok";
      results.push(row);
      continue;
    }

    // ── 3. Gerçek varyant matrisi VARSA dokunma ────────────────────────
    // Tanıdığımız SKU şeması (AAA-R-NNNN-<N>MM-<beden>) görünüyorsa bu
    // listing varyantlı demektir; düz fiyat basmak matrisi bozar. O durumda
    // doğru araç fiyat itişidir (pushListingPrices), bu rota değil.
    const structured = skus.filter((s) => /-\d+(\.\d+)?MM-/.test(s));
    if (structured.length > 0) {
      row.status = "refused";
      row.detail =
        `Etsy'de ${structured.length} yapılandırılmış SKU var — bu listing ` +
        `varyantlı. Düz fiyat basmak matrisi bozar; panel aynasını ` +
        `senkronla ve fiyat itişini kullan.`;
      results.push(row);
      continue;
    }

    if (!apply) {
      const willChange = prices.filter((p) => p < targetCents).length;
      row.status = willChange > 0 ? "would-update" : "unchanged";
      row.would_change = willChange;
      results.push(row);
      continue;
    }

    // ── 4. Yaz ─────────────────────────────────────────────────────────
    const readinessStateId = await resolveReadinessStateId(client);
    const { update, changed } = buildRaiseOnlyUpdate(
      inventory,
      targetCents,
      readinessStateId,
    );
    if (changed === 0) {
      row.status = "unchanged";
      results.push(row);
      continue;
    }
    try {
      await putListingInventory(client, t.listingId, update, {
        legacy: readinessStateId != null ? false : undefined,
      });
    } catch (e) {
      row.status = "error";
      row.detail = e instanceof Error ? e.message : String(e);
      results.push(row);
      continue;
    }

    // ── 5. GERİ OKU — "200 OK" teslim sayılmaz (second-brain kuralı) ───
    let after: EtsyInventory;
    try {
      after = await getListingInventory(client, t.listingId);
    } catch (e) {
      row.status = "unverified";
      row.detail =
        `PUT gitti ama geri okuma başarısız: ` +
        (e instanceof Error ? e.message : String(e));
      results.push(row);
      continue;
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
      results.push(row);
      continue;
    }

    // ── 6. Panel aynasını YALNIZ doğrulandıktan sonra eşitle ───────────
    const newAnchor = Math.min(...afterPrices);
    const { error: syncErr } = await admin
      .from("products")
      .update({ price_cents: newAnchor })
      .eq("org_id", org.id)
      .eq("etsy_listing_id", t.listingId);
    row.panel_sync = syncErr ? `hata: ${syncErr.message}` : "ok";

    await logAudit(admin, {
      orgId: org.id,
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
    results.push(row);
  }

  return NextResponse.json({
    dry_run: !apply,
    mode,
    note:
      mode === "floor"
        ? "floor modu en dar bedenin liste fiyatını basar — geniş bedende zarar riski SÜRER. Kalıcı çözüm varyant matrisini geri kurmak."
        : "safe modu hiçbir konfigürasyonun zarar etmeyeceği fiyatı basar (ticari olarak caydırıcı).",
    results,
  });
}
