import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import {
  getListingInventory,
  putListingInventory,
  resolveReadinessStateId,
} from "@/lib/etsy/inventory";
import type {
  EtsyInventory,
  EtsyInventoryUpdate,
  EtsyOfferingUpdate,
} from "@/lib/etsy/types";
import { logAudit } from "@/lib/audit";

/**
 * Otomatik yeniden fiyatlama (reprice) motoru.
 *
 * Kural (ürün başına, `reprice_rules`): bizim fiyat, son rakip araştırması
 * çapasının (keyword_research avg/median) `trigger_over_cents` üstüne çıkınca
 * hedef = çapa + `target_over_cents`'e çekilir. mode='otomatik' + varyantsız
 * listing'de Etsy'ye yazılır; mode='oneri' veya varyantlı listing'de yalnız
 * öneri loglanır (`reprice_log`, outcome='oneri').
 *
 * ETSY YAZMA YOLU: Etsy v3'te fiyat listing alanı değil, envanter offering'i
 * üzerinde yaşar — updateListing (PATCH) fiyatı güncellemez. Bu yüzden mevcut
 * stok push'la aynı yol kullanılır: GET /listings/{id}/inventory ile tam yapı
 * okunur, TEK ürünün offering fiyatı değiştirilir ve TÜM yapı PUT ile geri
 * yazılır (Etsy kısmi güncelleme kabul etmez; bkz. lib/etsy/inventory.ts).
 * Varyantlı listing'de offering-başına fiyat kararı gerekir — İLK SÜRÜMDE
 * varyantlılarda otomatik yazma YAPILMAZ, yalnız öneri üretilir.
 */

// ── Tipler ──────────────────────────────────────────────────────────────────

export type RepriceMode = "kapali" | "oneri" | "otomatik";
export type RepriceAnchor = "ortalama" | "medyan";
export type RepriceConfidence = "dusuk" | "orta" | "yuksek";
export type RepriceOutcome = "uygulandi" | "oneri" | "atlandi";

export interface RepriceRuleRow {
  id: string;
  org_id: string;
  product_id: string;
  mode: RepriceMode;
  anchor: RepriceAnchor;
  trigger_over_cents: number;
  target_over_cents: number;
  floor_cents: number | null;
  floor_melt_mult: number;
  max_change_pct: number;
  min_confidence: RepriceConfidence;
  cooldown_hours: number;
  last_applied_at: string | null;
}

interface ResearchRow {
  id: string;
  keyword: string;
  researched_at: string;
  currency: string;
  result_count: number;
  /** 0095: bandın gerçekten kurulduğu rakip sayısı (rakip seti aktifken
   *  organik sayıdan ayrışır). Eski kayıtlarda null → result_count'a düşülür. */
  band_result_count: number | null;
  avg_cents: number | null;
  median_cents: number | null;
  melt_per_gram_cents: number | null;
  confidence: RepriceConfidence | null;
  price_position: string | null;
  /** 0091: fiziksel-mantık guard'ı — şüpheli bandla asla fiyat değiştirilmez. */
  data_suspect: boolean | null;
}

interface ProductRow {
  id: string;
  title: string;
  price_cents: number | null;
  currency: string | null;
  etsy_listing_id: number | null;
  has_variations: boolean | null;
  weight_grams: number | null;
}

export interface RepriceEvaluation {
  product_id: string;
  outcome: RepriceOutcome | "tetik-yok";
  reason: string | null;
  old_price_cents: number | null;
  new_price_cents: number | null;
}

// Araştırma kaydı bundan eskiyse asla tetiklenmez (bayat banda göre fiyat
// değiştirmek tehlikeli — 7 günlük araştırma cron döngüsüyle hizalı).
const MAX_RESEARCH_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Bu kadar az rakiple kurulan band şüpheli sayılır (tek-iki ilanla band olmaz).
const MIN_RESULT_COUNT = 3;

const CONFIDENCE_RANK: Record<RepriceConfidence, number> = {
  dusuk: 0,
  orta: 1,
  yuksek: 2,
};

// ── Saf yardımcılar ─────────────────────────────────────────────────────────

/**
 * Varyantsız listing envanterini, TEK ürünün offering fiyatını
 * `newPriceCents`'e çekecek PUT payload'ına dönüştürür. Adet/is_enabled AYNEN
 * korunur (stok push'un ayna görüntüsü — orada fiyat korunup adet değişir).
 * Birden fazla canlı ürün (varyant) görülürse fiyat riskine girmeden throw.
 */
export function buildPriceUpdate(
  inventory: EtsyInventory,
  newPriceCents: number,
  readinessStateId?: number | null,
): EtsyInventoryUpdate {
  if (!(newPriceCents > 0)) {
    throw new Error("Geçersiz hedef fiyat — envanter güncellemesi iptal edildi.");
  }
  const live = (inventory.products ?? []).filter((p) => !p.is_deleted);
  if (live.length === 0) {
    throw new Error("Envanter boş — fiyat güncellemesi yapılamadı.");
  }
  if (live.length > 1) {
    throw new Error(
      "Listing varyantlı görünüyor (birden fazla envanter ürünü) — otomatik fiyat yazma varyantsızlarla sınırlı.",
    );
  }
  const product = live[0];
  const price = newPriceCents / 100; // Etsy PUT float birim bekler
  const offerings: EtsyOfferingUpdate[] = (product.offerings ?? [])
    .filter((o) => !o.is_deleted)
    .map((o) => ({
      price,
      quantity: o.quantity ?? 0,
      is_enabled: o.is_enabled ?? true,
      // 2025 (?legacy=false): tek offering'de de readiness zorunlu.
      ...(readinessStateId != null
        ? { readiness_state_id: readinessStateId }
        : {}),
    }));
  if (offerings.length === 0) {
    throw new Error(
      "Üründe okunabilir offering yok — fiyat güncellemesi atlandı.",
    );
  }
  return {
    products: [
      {
        sku: product.sku ?? "",
        property_values: (product.property_values ?? []).map((pv) => ({
          property_id: pv.property_id,
          ...(pv.property_name != null
            ? { property_name: pv.property_name }
            : {}),
          value_ids: pv.value_ids ?? [],
          values: pv.values ?? [],
          ...(pv.scale_id != null ? { scale_id: pv.scale_id } : {}),
        })),
        offerings,
      },
    ],
    ...(inventory.price_on_property
      ? { price_on_property: inventory.price_on_property }
      : {}),
    ...(inventory.quantity_on_property
      ? { quantity_on_property: inventory.quantity_on_property }
      : {}),
    ...(inventory.sku_on_property
      ? { sku_on_property: inventory.sku_on_property }
      : {}),
    ...(readinessStateId != null ? { readiness_state_on_property: [] } : {}),
  };
}

/** Kural + ürün + araştırmadan taban (cent) hesaplar; hesaplanamıyorsa null. */
export function computeFloorCents(
  rule: Pick<RepriceRuleRow, "floor_cents" | "floor_melt_mult">,
  meltPerGramCents: number | null,
  weightGrams: number | null,
): number | null {
  const meltFloor =
    meltPerGramCents != null && weightGrams != null && weightGrams > 0
      ? Math.round(meltPerGramCents * weightGrams * rule.floor_melt_mult)
      : null;
  if (rule.floor_cents != null && meltFloor != null) {
    return Math.max(rule.floor_cents, meltFloor);
  }
  return rule.floor_cents ?? meltFloor;
}

// ── Değerlendirme ───────────────────────────────────────────────────────────

interface OrgContext {
  admin: SupabaseClient;
  writeEnabled: boolean;
  /** Lazy — yalnız gerçekten Etsy'ye yazılacaksa kurulur. */
  getClient: () => Promise<EtsyClient>;
}

/**
 * Tek kuralı değerlendirir; sonucu reprice_log'a yazar ve özetini döndürür.
 * KORUMA ZİNCİRİ (sırayla): güncel araştırma yok → kur uyuşmazlığı/çapa yok →
 * tetik kontrolü → 7 günden eski araştırma → düşük güven → şüpheli band
 * (belirsiz konum / <3 rakip) → taban klibi (taban yoksa atla) → azami %
 * değişim sınırı → cooldown → yazma izni yoksa öneriye düşür → varyantlıysa
 * öneriye düşür → Etsy'ye yaz + vekil fiyatı eşitle + audit.
 *
 * Not: "tetik yok" (fiyat zaten bandın içinde) SAĞLIKLI durumdur ve günlük
 * cron'da log tablosunu şişirmemek için loglanmaz; diğer tüm sonuçlar loglanır.
 */
async function evaluateRule(
  ctx: OrgContext,
  rule: RepriceRuleRow,
  product: ProductRow | undefined,
  research: ResearchRow | null,
): Promise<RepriceEvaluation> {
  const { admin } = ctx;
  const oldPrice = product?.price_cents ?? null;

  const log = async (
    outcome: RepriceOutcome,
    reason: string | null,
    newPrice: number | null,
    anchorCents: number | null,
  ) => {
    const { error } = await admin.from("reprice_log").insert({
      org_id: rule.org_id,
      product_id: rule.product_id,
      rule_id: rule.id,
      old_price_cents: oldPrice,
      new_price_cents: newPrice,
      anchor_cents: anchorCents,
      basis: research
        ? {
            research_id: research.id,
            keyword: research.keyword,
            researched_at: research.researched_at,
            anchor: rule.anchor,
            avg_cents: research.avg_cents,
            median_cents: research.median_cents,
            confidence: research.confidence,
            result_count: research.result_count,
            melt_per_gram_cents: research.melt_per_gram_cents,
            currency: research.currency,
          }
        : null,
      outcome,
      reason,
    });
    if (error) console.error("reprice_log insert hatası:", error.message);
    return {
      product_id: rule.product_id,
      outcome,
      reason,
      old_price_cents: oldPrice,
      new_price_cents: newPrice,
    } satisfies RepriceEvaluation;
  };

  // Ürün/fiyat/araştırma temel ön koşulları.
  if (!product) {
    return log("atlandi", "Ürün bulunamadı (silinmiş olabilir).", null, null);
  }
  if (oldPrice == null || oldPrice <= 0) {
    return log("atlandi", "Ürünün panel fiyatı yok — tetik hesaplanamadı.", null, null);
  }
  if (!research) {
    return log("atlandi", "Bu ürün için rakip araştırması kaydı yok.", null, null);
  }
  const anchorCents =
    rule.anchor === "medyan" ? research.median_cents : research.avg_cents;
  if (anchorCents == null || anchorCents <= 0) {
    return log(
      "atlandi",
      `Araştırma kaydında çapa (${rule.anchor}) değeri yok.`,
      null,
      null,
    );
  }
  // Para kuralı: farklı kurlar tek sayıda karşılaştırılmaz.
  const productCurrency = product.currency ?? "USD";
  if (research.currency !== productCurrency) {
    return log(
      "atlandi",
      `Kur uyuşmazlığı: araştırma ${research.currency}, ürün ${productCurrency}.`,
      null,
      anchorCents,
    );
  }

  // Tetik: bizim fiyat çapa + tolerans üstünde mi?
  if (oldPrice <= anchorCents + rule.trigger_over_cents) {
    return {
      product_id: rule.product_id,
      outcome: "tetik-yok",
      reason: null,
      old_price_cents: oldPrice,
      new_price_cents: null,
    };
  }

  // 1) Araştırma tazeliği (7 gün) — bayat banda göre fiyat değiştirilmez.
  const ageMs = Date.now() - new Date(research.researched_at).getTime();
  if (!Number.isFinite(ageMs) || ageMs > MAX_RESEARCH_AGE_MS) {
    return log(
      "atlandi",
      "Araştırma kaydı 7 günden eski — taze tarama bekleniyor.",
      null,
      anchorCents,
    );
  }

  // 2) Güven eşiği.
  const conf = research.confidence ?? "dusuk";
  if (CONFIDENCE_RANK[conf] < CONFIDENCE_RANK[rule.min_confidence]) {
    return log(
      "atlandi",
      `Araştırma güveni (${conf}) kuralın eşiğinin (${rule.min_confidence}) altında.`,
      null,
      anchorCents,
    );
  }

  // 3) Şüpheli band: data_suspect işaretli, konum belirsiz ya da rakip çok az.
  if (research.data_suspect) {
    return log(
      "atlandi",
      "Araştırma kaydı şüpheli işaretli (data_suspect) — fiyat değiştirilmez.",
      null,
      anchorCents,
    );
  }
  if (research.price_position === "belirsiz") {
    return log(
      "atlandi",
      "Araştırma konumu 'belirsiz' — şüpheli bandla fiyat değiştirilmez.",
      null,
      anchorCents,
    );
  }
  // Bandın kurulduğu sayı: rakip seti aktifken organik result_count değil
  // band_result_count esas alınır (aksi halde comp-set'li ürün organik zayıf
  // diye sonsuza dek atlanırdı — denetim R2 #3).
  const bandCount = research.band_result_count ?? research.result_count;
  if (bandCount < MIN_RESULT_COUNT) {
    return log(
      "atlandi",
      `Rakip sayısı çok az (${bandCount} < ${MIN_RESULT_COUNT}) — band şüpheli.`,
      null,
      anchorCents,
    );
  }

  // 4) Hedef + taban klibi. Taban hiç hesaplanamıyorsa (mutlak taban yok VE
  //    melt×gram yok) güvenli taraf: atla — tabansız otomatik indirim yok.
  let target = anchorCents + rule.target_over_cents;
  const floorCents = computeFloorCents(
    rule,
    research.melt_per_gram_cents,
    product.weight_grams,
  );
  if (floorCents == null) {
    return log(
      "atlandi",
      "Taban hesaplanamadı (mutlak taban girilmemiş, melt/ağırlık da yok) — tabansız fiyat düşürülmez.",
      null,
      anchorCents,
    );
  }
  if (target < floorCents) target = floorCents;
  if (target >= oldPrice) {
    return log(
      "atlandi",
      "Taban klibi sonrası hedef mevcut fiyatın altında değil — değişiklik gereksiz.",
      null,
      anchorCents,
    );
  }

  // 5) Tek seferde azami % değişim (fiyat şoku emniyeti).
  const minAllowed = Math.round(oldPrice * (1 - rule.max_change_pct / 100));
  let reasonSuffix = "";
  if (target < minAllowed) {
    target = minAllowed;
    reasonSuffix = ` (azami %${rule.max_change_pct} değişimle sınırlandı)`;
    if (target >= oldPrice) {
      return log(
        "atlandi",
        "Azami % değişim sınırı anlamlı bir adım bırakmadı.",
        null,
        anchorCents,
      );
    }
  }

  // 6) Cooldown — son otomatik uygulamadan bu yana asgari süre.
  if (rule.last_applied_at) {
    const since = Date.now() - new Date(rule.last_applied_at).getTime();
    if (since < rule.cooldown_hours * 3_600_000) {
      return log(
        "atlandi",
        `Cooldown dolmadı (${rule.cooldown_hours} saat) — son uygulama: ${rule.last_applied_at}.`,
        null,
        anchorCents,
      );
    }
  }

  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
  const baseReason =
    `${rule.anchor === "medyan" ? "Medyan" : "Ortalama"} ${fmt(anchorCents)} + ` +
    `tolerans ${fmt(rule.trigger_over_cents)} aşıldı → hedef ${fmt(anchorCents + rule.target_over_cents)}` +
    `${target !== anchorCents + rule.target_over_cents ? `, uygulanan ${fmt(target)}` : ""}${reasonSuffix}`;

  // 7) Otomatik mod ön koşulları — sağlanmıyorsa öneriye düşür.
  if (rule.mode !== "otomatik") {
    return log("oneri", baseReason, target, anchorCents);
  }
  if (!ctx.writeEnabled) {
    return log(
      "oneri",
      `${baseReason} · Etsy yazma izni (listings_w) kapalı — öneriye düşürüldü.`,
      target,
      anchorCents,
    );
  }
  if (product.has_variations) {
    return log(
      "oneri",
      `${baseReason} · Listing varyantlı — otomatik yazma ilk sürümde yalnız varyantsızlarda, öneriye düşürüldü.`,
      target,
      anchorCents,
    );
  }
  if (product.etsy_listing_id == null) {
    return log(
      "oneri",
      `${baseReason} · Ürünün Etsy listing bağlantısı yok — öneriye düşürüldü.`,
      target,
      anchorCents,
    );
  }

  // 8) Etsy'ye yaz: envanteri oku → tek ürünün offering fiyatını değiştir →
  //    tam yapıyı PUT'la. Sonra vekil durumu eşitle (products.price_cents).
  try {
    const client = await ctx.getClient();
    const inventory = await getListingInventory(client, product.etsy_listing_id);
    // 2025 modeli: tek offering'de de readiness + ?legacy=false gerekir.
    const readinessStateId = await resolveReadinessStateId(client);
    const update = buildPriceUpdate(inventory, target, readinessStateId);
    await putListingInventory(client, product.etsy_listing_id, update, {
      legacy: readinessStateId != null ? false : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen Etsy hatası";
    console.error(
      `reprice: Etsy fiyat yazılamadı (listing ${product.etsy_listing_id}):`,
      msg,
    );
    return log("atlandi", `Etsy yazma hatası: ${msg}`, target, anchorCents);
  }

  // Vekil-durum dersi: uzak fiyat değişti — panel fiyatını da eşitle.
  const { error: priceErr } = await admin
    .from("products")
    .update({ price_cents: target, updated_at: new Date().toISOString() })
    .eq("id", product.id)
    .eq("org_id", rule.org_id);
  if (priceErr) {
    console.error("reprice: products.price_cents eşitlenemedi:", priceErr.message);
  }
  const { error: ruleErr } = await admin
    .from("reprice_rules")
    .update({ last_applied_at: new Date().toISOString() })
    .eq("id", rule.id)
    .eq("org_id", rule.org_id);
  if (ruleErr) {
    console.error("reprice: last_applied_at güncellenemedi:", ruleErr.message);
  }

  await logAudit(admin, {
    orgId: rule.org_id,
    action: "etsy.reprice",
    entityType: "products",
    entityId: product.id,
    summary: `Otomatik fiyat: "${product.title}" ${fmt(oldPrice)} → ${fmt(target)} (çapa ${fmt(anchorCents)})`,
    diff: { old_price_cents: oldPrice, new_price_cents: target },
    source: "cron",
    actorLabel: "Reprice Cron",
  });

  return log("uygulandi", baseReason, target, anchorCents);
}

export interface OrgRepriceSummary {
  rules: number;
  applied: number;
  suggested: number;
  skipped: number;
  not_triggered: number;
  errors: number;
}

/**
 * Aktif (mode≠kapali) kuralları değerlendirir. `orgId` verilirse tek org,
 * verilmezse kuralı olan TÜM org'lar işlenir (cron yolu). Etsy'ye istekler
 * arası kısa bekleme ile rate-limit'e saygılıdır. Multi-tenant kilidi: her
 * sorgu org_id ile kapsanır; RLS varsayımına yaslanılmaz.
 */
export async function evaluateRepriceRules(
  orgId?: string,
): Promise<Record<string, OrgRepriceSummary>> {
  const admin = createAdminClient();

  let ruleQuery = admin
    .from("reprice_rules")
    .select(
      "id, org_id, product_id, mode, anchor, trigger_over_cents, target_over_cents, floor_cents, floor_melt_mult, max_change_pct, min_confidence, cooldown_hours, last_applied_at",
    )
    .neq("mode", "kapali");
  if (orgId) ruleQuery = ruleQuery.eq("org_id", orgId);
  const { data: ruleRows, error: rulesErr } = await ruleQuery;
  if (rulesErr) {
    console.error("reprice: kurallar okunamadı:", rulesErr.message);
    return {};
  }
  const rules = (ruleRows ?? []) as RepriceRuleRow[];
  if (rules.length === 0) return {};

  // Org bazında grupla — yazma izni/istemci org düzeyinde çözülür.
  const byOrg = new Map<string, RepriceRuleRow[]>();
  for (const r of rules) {
    const list = byOrg.get(r.org_id) ?? [];
    list.push(r);
    byOrg.set(r.org_id, list);
  }

  const out: Record<string, OrgRepriceSummary> = {};
  for (const [org, orgRules] of byOrg) {
    const summary: OrgRepriceSummary = {
      rules: orgRules.length,
      applied: 0,
      suggested: 0,
      skipped: 0,
      not_triggered: 0,
      errors: 0,
    };
    out[org] = summary;

    // Yazma izni: cron'da auth bağlamı yok → etsy_write_enabled RPC'si
    // (current_org_id'ye bağlı) kullanılamaz; aynı kural admin ile doğrudan
    // scope üzerinden uygulanır (status=connected + listings_w kapsamı).
    const { data: conn, error: connErr } = await admin
      .from("etsy_connection")
      .select("status, scope")
      .eq("org_id", org)
      .maybeSingle();
    if (connErr) console.error("reprice: etsy_connection okunamadı:", connErr.message);
    const connRow = conn as { status: string; scope: string | null } | null;
    const writeEnabled =
      connRow?.status === "connected" &&
      /(^|\s)listings_w(\s|$)/.test(connRow.scope ?? "");

    let client: EtsyClient | null = null;
    const ctx: OrgContext = {
      admin,
      writeEnabled,
      getClient: async () => {
        if (!client) client = await EtsyClient.forOrg(org);
        return client;
      },
    };

    const productIds = orgRules.map((r) => r.product_id);
    const { data: productRows, error: prodErr } = await admin
      .from("products")
      .select(
        "id, title, price_cents, currency, etsy_listing_id, has_variations, weight_grams",
      )
      .eq("org_id", org)
      .in("id", productIds);
    if (prodErr) console.error("reprice: ürünler okunamadı:", prodErr.message);
    const products = new Map(
      ((productRows ?? []) as ProductRow[]).map((p) => [p.id, p]),
    );

    for (const rule of orgRules) {
      try {
        // Son araştırma kaydı (ürün başına en güncel anlık görüntü).
        const { data: researchRow, error: resErr } = await admin
          .from("keyword_research")
          .select(
            "id, keyword, researched_at, currency, result_count, band_result_count, avg_cents, median_cents, melt_per_gram_cents, confidence, price_position, data_suspect",
          )
          .eq("org_id", org)
          .eq("product_id", rule.product_id)
          .order("researched_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (resErr) {
          console.error("reprice: araştırma okunamadı:", resErr.message);
        }

        const result = await evaluateRule(
          ctx,
          rule,
          products.get(rule.product_id),
          (researchRow as ResearchRow | null) ?? null,
        );
        if (result.outcome === "uygulandi") summary.applied++;
        else if (result.outcome === "oneri") summary.suggested++;
        else if (result.outcome === "atlandi") summary.skipped++;
        else summary.not_triggered++;

        // Etsy'ye dokunan turlar arasında rate-limit nefesi.
        if (result.outcome === "uygulandi") {
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (e) {
        summary.errors++;
        if (e instanceof EtsyNotConnectedError) {
          console.error(`reprice: org ${org} Etsy bağlı değil.`);
        } else {
          console.error(
            `reprice: kural değerlendirme hatası (product ${rule.product_id}):`,
            e instanceof Error ? e.message : e,
          );
        }
      }
    }
  }
  return out;
}
