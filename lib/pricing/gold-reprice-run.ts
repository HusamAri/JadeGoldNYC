import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListingInventory, pushListingPrices } from "@/lib/etsy/inventory";
import { etsyMoneyToUnit } from "@/lib/etsy/types";
import { logAudit } from "@/lib/audit";
import {
  DEADBAND_PCT,
  MAX_STEP_PCT,
  SPOT_SANITY_MAX,
  SPOT_SANITY_MIN,
  V4,
  eonListCents,
  fetchLiveSpotUsd,
  isEonFriezeProduct,
  jadeAdjustedCents,
  parseEonSku,
  parseKaratPurity,
  type SpotQuote,
} from "@/lib/pricing/gold-index";

/**
 * Altın-endeksli fiyat koşusu (ops rotası + cron ortak çekirdeği).
 *
 * Sıra second-brain disipliniyle: (1) hedefler ESKİ tabanla doğrulanarak
 * hesaplanır, (2) Etsy'ye itilir, (3) AYNI turda read-back ile kanıtlanır,
 * (4) ancak o zaman panel aynası eşitlenir, (5) yeni taban + audit yazılır.
 * Etsy'de doğrulanamayan listing'in paneli DEĞİŞTİRİLMEZ (ayna bozulmaz).
 */

type VariantRow = {
  id: string;
  sku: string | null;
  price_cents: number | null;
  weight_grams: string | number | null;
  product_id: string;
  products: {
    id: string;
    title: string | null;
    status: string;
    etsy_listing_id: number | null;
    materials: string[] | null;
  };
};

type Target = {
  variantId: string;
  sku: string;
  productId: string;
  listingId: number | null;
  oldCents: number;
  newCents: number;
};

export type OrgRunResult = {
  org: string;
  basisPerOzt: number;
  spotPerOzt: number;
  stepPct: number;
  status:
    | "dry-run"
    | "applied"
    | "deadband"
    | "blocked-max-step"
    | "etsy-disconnected"
    | "error";
  variants: number;
  repriced: number;
  unchanged: number;
  skipped: Record<string, number>;
  skippedSamples: string[];
  avgChangePct: number | null;
  listings?: Record<string, unknown>[];
  dbUpdated?: number;
  anchorsUpdated?: number;
  detail?: string;
  samples: { sku: string; old: number; new: number }[];
};

const ORG_NAMES = ["EON", "Jade Gold NYC"] as const;

function toNumber(x: string | number | null): number {
  if (x == null) return 0;
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

/** Org'un tüm canlı/taslak varyantlarını sayfalayarak çeker (11k+ satır). */
async function fetchVariants(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
): Promise<VariantRow[]> {
  const out: VariantRow[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await admin
      .from("product_variants")
      .select(
        "id, sku, price_cents, weight_grams, product_id, products!inner(id, title, status, etsy_listing_id, materials, etsy_deleted_at)",
      )
      .eq("org_id", orgId)
      .in("products.status", ["active", "draft"])
      .is("products.etsy_deleted_at", null)
      .order("id")
      .range(from, from + page - 1);
    if (error) throw new Error(`Varyant okunamadı: ${error.message}`);
    const rows = (data ?? []) as unknown as VariantRow[];
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

function computeTargets(
  orgName: string,
  rows: VariantRow[],
  basis: number,
  spot: number,
): {
  targets: Target[];
  unchanged: number;
  skipped: Record<string, number>;
  skippedSamples: string[];
} {
  const targets: Target[] = [];
  const skipped: Record<string, number> = {};
  const skippedSamples: string[] = [];
  let unchanged = 0;
  const skip = (reason: string, sku: string) => {
    skipped[reason] = (skipped[reason] ?? 0) + 1;
    if (skippedSamples.length < 8) skippedSamples.push(`${reason}: ${sku}`);
  };

  for (const v of rows) {
    const sku = (v.sku ?? "").trim();
    const oldCents = v.price_cents ?? 0;
    const grams = toNumber(v.weight_grams);
    if (!(oldCents > 0)) {
      skip("fiyatsiz", sku || v.id);
      continue;
    }

    let newCents: number | null = null;

    if (orgName === "EON") {
      const parsed = sku ? parseEonSku(sku) : null;
      if (!parsed) {
        skip("sku-desen-disi", sku || v.id);
        continue;
      }
      if (!(grams > 0)) {
        skip("gramsiz", sku);
        continue;
      }
      const frieze = isEonFriezeProduct(sku, v.products.title ?? "");
      // Transition safety recognizes both market-optimized and legacy bases.
      const currentCandidates = frieze
        ? [
            {
              labor: V4.laborMilgrainUsd,
              narrow: V4.multHandfinishedNarrow,
              wide: V4.multHandfinishedWide,
            },
            {
              labor: V4.laborMilgrainUsd,
              narrow: V4.multHandfinishedNarrowLegacy,
              wide: V4.multHandfinishedWideLegacy,
            },
            {
              labor: V4.laborMilgrainUsd,
              narrow: V4.multNarrow,
              wide: V4.multWide,
            },
            {
              labor: V4.laborMilgrainLegacyUsd,
              narrow: V4.multNarrow,
              wide: V4.multWide,
            },
            {
              labor: V4.laborStandardUsd,
              narrow: V4.multNarrow,
              wide: V4.multWide,
            },
          ]
        : [
            {
              labor: V4.laborStandardUsd,
              narrow: V4.multNarrow,
              wide: V4.multWide,
            },
          ];
      const matched = currentCandidates.some(
        ({ labor, narrow, wide }) =>
          eonListCents(parsed.karat, parsed.widthMm, grams, labor, basis, {
            narrow,
            wide,
          }) === oldCents,
      );
      if (!matched) {
        skip("taban-uyumsuz", sku);
        continue;
      }
      newCents = eonListCents(
        parsed.karat,
        parsed.widthMm,
        grams,
        frieze ? V4.laborMilgrainUsd : V4.laborStandardUsd,
        spot,
        {
          narrow: frieze ? V4.multHandfinishedNarrow : V4.multNarrow,
          wide: frieze ? V4.multHandfinishedWide : V4.multWide,
        },
      );
    } else {
      // Jade: formül dayatılmaz; yalnız ham metal bedeli farkı eklenir.
      if (!(grams > 0)) {
        skip("gramsiz", sku || v.id);
        continue;
      }
      const purity = parseKaratPurity(
        `${sku} ${v.products.title ?? ""} ${(v.products.materials ?? []).join(" ")}`,
      );
      if (purity == null) {
        skip("karat-cozulemedi", sku || v.id);
        continue;
      }
      newCents = jadeAdjustedCents(oldCents, grams, purity, basis, spot);
    }

    if (newCents == null || !(newCents > 0)) {
      skip("hesap-gecersiz", sku || v.id);
      continue;
    }
    if (newCents === oldCents) {
      unchanged += 1;
      continue;
    }
    targets.push({
      variantId: v.id,
      sku,
      productId: v.product_id,
      listingId: v.products.etsy_listing_id,
      oldCents,
      newCents,
    });
  }

  return { targets, unchanged, skipped, skippedSamples };
}

export async function runGoldReprice(opts: {
  apply: boolean;
  spotOverride?: number;
  orgFilter?: string;
  listingFilter?: number;
  force?: boolean;
}): Promise<{ ok: boolean; spot?: SpotQuote; orgs: OrgRunResult[] }> {
  const admin = createAdminClient();

  let spotQuote: SpotQuote;
  if (opts.spotOverride != null) {
    if (
      opts.spotOverride < SPOT_SANITY_MIN ||
      opts.spotOverride > SPOT_SANITY_MAX
    ) {
      throw new Error(
        `Elle verilen spot mantık kapısı dışında: ${opts.spotOverride}`,
      );
    }
    spotQuote = {
      spotPerOzt: opts.spotOverride,
      sources: [{ name: "manuel", value: opts.spotOverride }],
    };
  } else {
    spotQuote = await fetchLiveSpotUsd();
  }
  const spot = spotQuote.spotPerOzt;

  const { data: orgRows, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .in("name", [...ORG_NAMES]);
  if (orgErr) throw new Error(orgErr.message);

  const results: OrgRunResult[] = [];

  for (const org of (orgRows ?? []) as { id: string; name: string }[]) {
    if (
      opts.orgFilter &&
      org.name.toLowerCase() !== opts.orgFilter.toLowerCase() &&
      !(opts.orgFilter.toLowerCase() === "jade" && org.name === "Jade Gold NYC")
    ) {
      continue;
    }

    const res: OrgRunResult = {
      org: org.name,
      basisPerOzt: 0,
      spotPerOzt: spot,
      stepPct: 0,
      status: "error",
      variants: 0,
      repriced: 0,
      unchanged: 0,
      skipped: {},
      skippedSamples: [],
      avgChangePct: null,
      samples: [],
    };
    results.push(res);

    try {
      const { data: basisRow } = await admin
        .from("gold_reprice_basis")
        .select("spot_per_ozt")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const basis = toNumber(
        (basisRow as { spot_per_ozt: string | number } | null)?.spot_per_ozt ??
          4090,
      );
      res.basisPerOzt = basis;
      const step = spot / basis - 1;
      res.stepPct = Math.round(step * 10000) / 100;

      if (Math.abs(step) < DEADBAND_PCT && !opts.force) {
        res.status = "deadband";
        continue;
      }
      if (Math.abs(step) > MAX_STEP_PCT && !opts.force) {
        res.status = "blocked-max-step";
        res.detail = `Tek adımda %${(MAX_STEP_PCT * 100).toFixed(0)} üstü değişim insan onayı ister (force=1).`;
        continue;
      }

      const rows = await fetchVariants(admin, org.id);
      res.variants = rows.length;
      const { targets, unchanged, skipped, skippedSamples } = computeTargets(
        org.name,
        rows,
        basis,
        spot,
      );
      const scoped = opts.listingFilter
        ? targets.filter((t) => t.listingId === opts.listingFilter)
        : targets;
      res.repriced = scoped.length;
      res.unchanged = unchanged;
      res.skipped = skipped;
      res.skippedSamples = skippedSamples;
      if (scoped.length > 0) {
        res.avgChangePct =
          Math.round(
            (scoped.reduce((s, t) => s + (t.newCents / t.oldCents - 1), 0) /
              scoped.length) *
              10000,
          ) / 100;
        res.samples = scoped
          .slice(0, 5)
          .map((t) => ({ sku: t.sku, old: t.oldCents, new: t.newCents }));
      }

      if (!opts.apply) {
        res.status = "dry-run";
        continue;
      }
      if (scoped.length === 0) {
        res.status = "applied";
        res.dbUpdated = 0;
        continue;
      }

      // ── Etsy itişi: listing bazında grupla ─────────────────────────────
      const byListing = new Map<number, Target[]>();
      const offEtsy: Target[] = [];
      for (const t of scoped) {
        if (t.listingId != null) {
          const arr = byListing.get(t.listingId) ?? [];
          arr.push(t);
          byListing.set(t.listingId, arr);
        } else {
          offEtsy.push(t);
        }
      }

      let client: EtsyClient | null = null;
      if (byListing.size > 0) {
        try {
          client = await EtsyClient.forOrg(org.id);
        } catch (e) {
          res.status = "etsy-disconnected";
          res.detail =
            e instanceof Error ? e.message : "Etsy bağlantısı çözülemedi";
          continue; // canlı listing varken bağlantısız uygulama YOK (ayna).
        }
      }

      const listingReports: Record<string, unknown>[] = [];
      const verifiedVariantIds: string[] = [];

      for (const [listingId, list] of byListing) {
        const priceBySku = new Map(list.map((t) => [t.sku, t.newCents]));
        const out = await pushListingPrices(client!, listingId, priceBySku);
        const report: Record<string, unknown> = {
          listingId,
          targets: list.length,
          push: out.status,
        };
        if (out.detail) report.detail = out.detail;

        if (out.status === "error") {
          listingReports.push(report);
          continue; // Etsy'ye yazılamadıysa panel de DEĞİŞMEZ.
        }

        // READ-BACK: 200 OK teslim sayılmaz — hedef fiyatlar geri okunur.
        try {
          const inv = await getListingInventory(client!, listingId);
          const liveBySku = new Map<string, number>();
          for (const p of inv.products ?? []) {
            if (p.is_deleted) continue;
            const o = (p.offerings ?? []).find((x) => !x.is_deleted);
            const unit = o ? etsyMoneyToUnit(o.price) : 0;
            liveBySku.set((p.sku ?? "").trim(), Math.round(unit * 100));
          }
          const mismatch = list.filter(
            (t) => liveBySku.get(t.sku) !== t.newCents,
          );
          report.verified = mismatch.length === 0;
          if (mismatch.length > 0) {
            report.mismatch = mismatch
              .slice(0, 3)
              .map((t) => `${t.sku}: hedef ${t.newCents}, canlı ${liveBySku.get(t.sku)}`);
          } else {
            verifiedVariantIds.push(...list.map((t) => t.variantId));
          }
        } catch (e) {
          report.verified = false;
          report.mismatch = [e instanceof Error ? e.message : String(e)];
        }
        listingReports.push(report);
      }
      res.listings = listingReports;

      // ── Panel aynası: yalnız doğrulanan + Etsy-dışı hedefler ───────────
      const applyIds = new Set([
        ...verifiedVariantIds,
        ...offEtsy.map((t) => t.variantId),
      ]);
      const pairs = scoped
        .filter((t) => applyIds.has(t.variantId))
        .map((t) => ({ id: t.variantId, cents: t.newCents }));

      let dbUpdated = 0;
      for (let i = 0; i < pairs.length; i += 1000) {
        const chunk = pairs.slice(i, i + 1000);
        const { data: n, error } = await admin.rpc("gold_reprice_apply", {
          p_org: org.id,
          p_pairs: chunk,
        });
        if (error) throw new Error(`DB uygulaması: ${error.message}`);
        dbUpdated += (n as number) ?? 0;
      }
      res.dbUpdated = dbUpdated;

      const { data: anchors } = await admin.rpc("gold_reprice_refresh_anchors", {
        p_org: org.id,
      });
      res.anchorsUpdated = (anchors as number) ?? 0;

      // Yeni taban yalnız TAM kapsamlı koşuda ilerletilir — tek-listing
      // denemesi tabanı kaydırırsa kalan katalog o farkı sonsuza dek kaçırır.
      if (!opts.listingFilter) {
        await admin.from("gold_reprice_basis").insert({
          org_id: org.id,
          spot_per_ozt: spot,
          source: spotQuote.sources.map((s) => s.name).join("+"),
          note: `Δ%${res.stepPct} · ${scoped.length} varyant hedeflendi, ${dbUpdated} panelde güncellendi`,
        });
        // /fiyat konsolunun spot'u da TEK kaynaktan ilerlesin: endeks
        // uyguladıktan sonra elle kuru çalıştırma bayat spotla "geri al"
        // önermesin (ayna çelişkisi). Tüm diğer kolonlar default'lu.
        await admin.from("pricing_config").upsert(
          { org_id: org.id, spot_usd_per_ozt: spot },
          { onConflict: "org_id" },
        );
      }

      await logAudit(admin, {
        orgId: org.id,
        action: "etsy.reprice",
        entityType: "organizations",
        entityId: org.id,
        summary:
          `Altın endeksi: taban $${basis} → $${spot}/ozt (Δ%${res.stepPct}). ` +
          `${scoped.length} varyant hedeflendi; Etsy'de doğrulanan + taslak ${pairs.length}, ` +
          `panelde ${dbUpdated} güncellendi.`,
        source: "system",
      });

      res.status = "applied";
    } catch (e) {
      res.status = "error";
      res.detail = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    ok: results.every((r) =>
      ["applied", "dry-run", "deadband"].includes(r.status),
    ),
    spot: spotQuote,
    orgs: results,
  };
}
