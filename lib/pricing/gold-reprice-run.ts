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
    /** Süre bütçesi doldu; `nextIndex` ile devam edilmeli. */
    | "partial"
    | "deadband"
    /** Etsy günlük API kotası rezervin altında — koşu yarına ertelendi. */
    | "quota-deferred"
    | "blocked-max-step"
    | "etsy-disconnected"
    | "error";
  /** Bir sonraki çağrının başlayacağı listing indeksi (devam ettirme). */
  nextIndex?: number;
  remainingListings?: number;
  totalListings?: number;
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
      // İşçilik kademesi kendini doğrular: eski tabanla hangi kademe mevcut
      // fiyatı birebir üretiyorsa o kademe geçerlidir. İkisi de üretmiyorsa
      // fiyat elle/farklı kurulmuş demektir — DOKUNULMAZ, raporlanır.
      const kademeler = [V4.laborMilgrainUsd, V4.laborStandardUsd];
      const labor = kademeler.find(
        (l) =>
          eonListCents(parsed.karat, parsed.widthMm, grams, l, basis) ===
          oldCents,
      );
      if (labor == null) {
        // İDEMPOTANSLIK: yarım kalmış bir koşu bu varyantı zaten YENİ spota
        // çekmiş olabilir. O durumda fiyat eski tabanla eşleşmez ama hedefle
        // birebir eşleşir — "uyumsuz" deyip atlamak yanlış olurdu (varyant
        // sonsuza dek atlanır ve taban ilerleyince farkı bir daha yakalayamaz).
        const zatenUygulanmis = kademeler.some(
          (l) =>
            eonListCents(parsed.karat, parsed.widthMm, grams, l, spot) ===
            oldCents,
        );
        if (zatenUygulanmis) {
          unchanged += 1;
        } else {
          skip("taban-uyumsuz", sku);
        }
        continue;
      }
      newCents = eonListCents(parsed.karat, parsed.widthMm, grams, labor, spot);
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

/**
 * Bir çağrının Etsy itişine ayırdığı süre. Vercel fonksiyon limitinin altında
 * kalır ki koşu kesilmek yerine DÜZGÜN durup `nextIndex` döndürsün.
 * (EON'da 43 listing × ~3 Etsy çağrısı tek isteğe sığmıyordu — koşu ortada
 * ölünce Etsy yazılmış, panel yazılmamış oluyordu.)
 */
const PUSH_BUDGET_MS = 200_000;

export async function runGoldReprice(opts: {
  apply: boolean;
  spotOverride?: number;
  orgFilter?: string;
  /** Kaçıncı listing'den devam edilecek (parçalı koşu). */
  startIndex?: number;
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

      // Kota rezervi kapısı (0134): tam koşu ~3 istek/listing tüketir ve
      // interaktif işlerle (panel itişi, senkron) AYNI günlük kotayı paylaşır.
      // Son 20 saat içinde gözlenen kalan kota rezervin altındaysa koşu
      // YARINA ertelenir — spot farkı kaybolmaz, taban ilerlemediği için
      // sonraki koşu aynı deltayı görür. `force` insan kararıyla aşar.
      const { data: quotaRow } = await admin
        .from("etsy_connection")
        .select("quota_remaining, quota_observed_at")
        .eq("org_id", org.id)
        .maybeSingle();
      const q = quotaRow as {
        quota_remaining: number | null;
        quota_observed_at: string | null;
      } | null;
      const QUOTA_RESERVE = 1500;
      const quotaFresh =
        q?.quota_observed_at != null &&
        Date.now() - new Date(q.quota_observed_at).getTime() < 20 * 3600_000;
      if (
        !opts.force &&
        quotaFresh &&
        q?.quota_remaining != null &&
        q.quota_remaining < QUOTA_RESERVE
      ) {
        res.status = "quota-deferred";
        res.skippedSamples.push(
          `Etsy günlük kotası ${q.quota_remaining} kaldı (< rezerv ${QUOTA_RESERVE}) — yarın denenecek`,
        );
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
      let dbUpdated = 0;

      /** Doğrulanan varyantları HEMEN panele yazar (parça parça kalıcılık). */
      const panelEsitle = async (list: Target[]): Promise<number> => {
        const pairs = list.map((t) => ({ id: t.variantId, cents: t.newCents }));
        let n = 0;
        for (let i = 0; i < pairs.length; i += 1000) {
          const { data, error } = await admin.rpc("gold_reprice_apply", {
            p_org: org.id,
            p_pairs: pairs.slice(i, i + 1000),
          });
          if (error) throw new Error(`DB uygulaması: ${error.message}`);
          n += (data as number) ?? 0;
        }
        return n;
      };

      // SIRA DETERMİNİSTİK olmalı: startIndex çağrılar arasında aynı diziye
      // denk gelmezse bazı listing'ler atlanır/tekrarlanır (aynı tuzak
      // approvePricingRun'da yaşandı — orada da `.order()` ile çözülmüştü).
      const listingIds = [...byListing.keys()].sort((a, b) => a - b);
      const basla = Math.max(
        0,
        Math.min(Math.trunc(opts.startIndex ?? 0), listingIds.length),
      );
      const bitis = Date.now() + PUSH_BUDGET_MS;
      let sonIslenen = basla;
      let sureDoldu = false;

      for (let i = basla; i < listingIds.length; i++) {
        // Süre bütçesi: bir sonraki listing'e başlamadan önce bak. Yarım
        // kalan bir PUT'tan iyi olur — kalanı çağıran devam ettirir.
        if (Date.now() > bitis) {
          sureDoldu = true;
          break;
        }
        const listingId = listingIds[i];
        const list = byListing.get(listingId)!;
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
          sonIslenen = i + 1;
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
            // PARÇA PARÇA KALICILIK: bu listing doğrulandı — panelini HEMEN
            // eşitle. Koşu sonraki listing'de ölse bile Etsy ile panel bu
            // listing için tutarlı kalır (eskiden tüm yazma en sondaydı; süre
            // dolunca Etsy yazılmış, panel yazılmamış oluyordu).
            const n = await panelEsitle(list);
            dbUpdated += n;
            report.panelUpdated = n;
          }
        } catch (e) {
          report.verified = false;
          report.mismatch = [e instanceof Error ? e.message : String(e)];
        }
        listingReports.push(report);
        sonIslenen = i + 1;
      }
      res.listings = listingReports;

      // Etsy'ye bağlı olmayan (taslak) hedefler — tek seferde, süreden bağımsız.
      if (offEtsy.length > 0 && basla === 0) {
        dbUpdated += await panelEsitle(offEtsy);
      }
      res.dbUpdated = dbUpdated;

      const kalan = listingIds.length - sonIslenen;
      res.nextIndex = sonIslenen;
      res.remainingListings = kalan;
      res.totalListings = listingIds.length;

      const { data: anchors } = await admin.rpc("gold_reprice_refresh_anchors", {
        p_org: org.id,
      });
      res.anchorsUpdated = (anchors as number) ?? 0;

      // Yeni taban yalnız TAM kapsamlı ve TAMAMLANMIŞ koşuda ilerletilir:
      //  - tek-listing denemesi tabanı kaydırırsa kalan katalog farkı kaçırır,
      //  - yarım kalan koşuda taban ilerlerse kalan listing'ler bir daha
      //    hedeflenmez (fark sonsuza dek kaybolur).
      if (!opts.listingFilter && kalan === 0) {
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
          `${scoped.length} varyant hedeflendi; ${listingIds.length} listing'in ` +
          `${sonIslenen}'i işlendi, panelde ${dbUpdated} varyant güncellendi` +
          `${kalan > 0 ? `; süre bütçesi doldu, ${kalan} listing bekliyor (devam: start=${sonIslenen})` : ""}.`,
        source: "system",
      });

      res.status = sureDoldu || kalan > 0 ? "partial" : "applied";
      if (res.status === "partial") {
        res.detail = `Süre bütçesi doldu — ${kalan} listing bekliyor. Devam için start=${sonIslenen}.`;
      }
    } catch (e) {
      res.status = "error";
      res.detail = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    // `partial` HATA DEĞİL: iş düzgün ilerledi, yalnız süre bütçesi doldu.
    // Çağıran `nextIndex` ile devam eder; taban ilerlemediği için bir sonraki
    // koşu (elle ya da cron) kalanı yakalar.
    ok: results.every((r) =>
      ["applied", "partial", "dry-run", "deadband"].includes(r.status),
    ),
    spot: spotQuote,
    orgs: results,
  };
}
