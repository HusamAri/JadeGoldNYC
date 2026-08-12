import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListingInventory } from "@/lib/etsy/inventory";
import { detectKarat } from "@/lib/gold-cost";
import {
  computeEonCost,
  EonCostError,
  type EonKarat,
  type EonPricingConfig,
  type EonProfile,
} from "@/lib/pricing-engine/eon-cost";

/**
 * KURU ÇALIŞTIRMA (Faz 5b) — itişten ÖNCE yetkili fark.
 *
 * Her varyant için: canlı Etsy fiyatı, motorun hesapladığı fiyat, delta ve
 * zemin bayrağı. "Yetkili" olması şu demek: mevcut fiyat PANELDEN değil
 * ETSY'DEN okunur (panel aynası bayat olabilir), yeni fiyat motordan türetilir
 * (elle girilmez), gram bilinmiyorsa satır UYDURULMAZ — `unknown` olarak
 * işaretlenir ve itişten çıkarılır.
 *
 * YASAK (kullanıcı kuralı): bir varyantın fiyatını diğerlerine KOPYALAMAK.
 * Tek listing içinde doğru fiyatlar ~5,9 kat aralığa yayılır (gram genişlikle
 * ölçeklenir); kopyalama kolaylık değil, zarar olayıdır. Bu yüzden burada
 * satır başına tek yol vardır: kendi gramından hesapla.
 */

export type PricingRowStatus =
  | "changed"
  | "unchanged"
  | "below_floor"
  | "unknown";

export interface PricingRunRow {
  sku: string;
  listingId: number;
  productId: string;
  productTitle: string;
  karat: EonKarat | null;
  profile: EonProfile | null;
  widthMm: number | null;
  sizeUs: number | null;
  grams: number | null;
  /** Etsy'de ŞU AN duran fiyat (cent). Okunamadıysa null. */
  liveCents: number | null;
  /** Motorun ürettiği liste fiyatı (cent). Hesaplanamadıysa null. */
  newCents: number | null;
  deltaCents: number | null;
  landedUsd: number | null;
  floorUsd: number | null;
  offsiteFloorUsd: number | null;
  /** Yeni SATIŞ fiyatı (liste × sale_rate) zeminin altında mı. */
  belowFloor: boolean;
  status: PricingRowStatus;
  /** Neden hesaplanamadı / neden hariç (kullanıcıya gösterilir). */
  note?: string;
}

export interface PricingRunDiff {
  rows: PricingRunRow[];
  total: number;
  changed: number;
  unchanged: number;
  belowFloor: number;
  unknown: number;
}

/** Elde bitirilen desenler önce aranır: başlıkta ikisi birden geçebilir. */
const PROFILE_PATTERNS: { re: RegExp; profile: EonProfile }[] = [
  { re: /\bmilgrain\b/i, profile: "milgrain" },
  { re: /\bhammered\b/i, profile: "hammered" },
  { re: /\bbasket\s*weave\b/i, profile: "basketweave" },
  { re: /\bribbed\b|\bfluted\b/i, profile: "ribbed" },
  // TTG iki-ton (profil 06, hammered kademesi işçilik). "Diamond Cut" tek
  // başına AYIRT EDİCİ DEĞİL — basketweave/ribbed başlıkları da taşıyor;
  // bu yüzden desen "two tone"a anahtarlı ve elde-bitirilenlerle birlikte
  // ÖNCE aranıyor.
  { re: /\btwo[\s-]?tone\b/i, profile: "twotone" },
  // The Lintel (profil 08, STANDART işçilik): "Wide Satin Center". 2026-08-11
  // dry run'ında bu iki aile null profil yüzünden 350 satır "unknown" düştü
  // ve fiyatları sessizce eski kalacaktı — bkz. video-qa ile aynı günkü
  // fiyat denetimi raporu.
  { re: /\bsatin\b/i, profile: "satin" },
  { re: /\bdome[d]?\b/i, profile: "dome" },
  { re: /\bbevel(?:ed)?\b/i, profile: "beveled" },
  { re: /\bknife\b/i, profile: "knife" },
  { re: /\bflat\b/i, profile: "flat" },
];

/**
 * Etsy hatasını satır notuna sığacak tek satıra indirger. `client.get`
 * `Etsy API hatası (403) /listings/…: {"error":"…"}` biçiminde fırlatır;
 * buradan durum kodu + gövdenin başı alınır (tam gövde notu şişirir).
 */
export function etsyHataOzeti(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.match(/Etsy API hatası \((\d{3})\)[^:]*:\s*([\s\S]*)/);
  if (m) {
    const govde = m[2].replace(/\s+/g, " ").trim().slice(0, 120);
    return govde ? `HTTP ${m[1]} — ${govde}` : `HTTP ${m[1]}`;
  }
  return raw.replace(/\s+/g, " ").trim().slice(0, 140);
}

/** Başlıktan işçilik sınıfını çözer. Bulunamazsa null — VARSAYILANA DÜŞMEZ. */
export function detectProfile(title: string): EonProfile | null {
  for (const { re, profile } of PROFILE_PATTERNS) {
    if (re.test(title)) return profile;
  }
  return null;
}

/** `GLD-R-1401-6MM-4.5` → { widthMm: 6, sizeUs: 4.5 }. */
export function parseSkuAxes(
  sku: string,
): { widthMm: number; sizeUs: number } | null {
  const m = sku.match(/-(\d+)MM-(\d+(?:\.\d+)?)$/i);
  if (!m) return null;
  return { widthMm: Number(m[1]), sizeUs: Number(m[2]) };
}

interface VariantRow {
  sku: string;
  weight_grams: string | number | null;
  product_id: string;
}

interface ProductRow {
  id: string;
  etsy_listing_id: number;
  title: string;
}

/**
 * Kuru çalıştırma farkını üretir.
 *
 * @param productId Yalnız bu listing (verilmezse org'un tüm canlı listing'leri).
 */
export async function buildPricingDiff(
  orgId: string,
  spotUsdPerOzt: number,
  config: EonPricingConfig,
  opts: { productId?: string; budgetMs?: number } = {},
): Promise<PricingRunDiff> {
  const deadline = Date.now() + (opts.budgetMs ?? 180_000);
  const admin = createAdminClient();

  let q = admin
    .from("products")
    .select("id, etsy_listing_id, title")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    // Etsy yalnız active/expired listing'in fiyatını düzenletir.
    .in("status", ["active", "expired"])
    .order("title")
    .order("id");
  if (opts.productId) q = q.eq("id", opts.productId);
  const { data: prodData, error: prodErr } = await q;
  if (prodErr) throw new Error(`products okuma: ${prodErr.message}`);
  const products = (prodData ?? []) as ProductRow[];

  const client = await EtsyClient.forOrg(orgId);
  const rows: PricingRunRow[] = [];

  for (const p of products) {
    if (Date.now() > deadline) break;

    // Canlı fiyat ETSY'DEN. Panel aynası bayat olabilir; kuru çalıştırmanın
    // "yetkili" olması bu okumaya bağlı.
    const liveBySku = new Map<string, number>();
    let liveOkundu = true;
    let liveHata: string | null = null;
    try {
      const inv = await getListingInventory(client, p.etsy_listing_id);
      for (const prod of inv.products ?? []) {
        if (prod.is_deleted) continue;
        const sku = (prod.sku ?? "").trim();
        if (!sku) continue;
        const off = (prod.offerings ?? []).find((o) => !o.is_deleted);
        const price = off?.price;
        if (price == null) continue;
        const cents =
          typeof price === "number"
            ? Math.round(price * 100)
            : Math.round((price.amount / price.divisor) * 100);
        liveBySku.set(sku, cents);
      }
    } catch (e) {
      liveOkundu = false;
      // Sebebi YUTMA. Bu blok yalnız "okunamadı" derse koşu teşhis edilemez
      // hale gelir: 08-08/08-09 kuru koşularında 29 listing'in 29'u burada
      // düştü ve raporda hangi hatanın (401/403/404/429/ağ) olduğu HİÇ
      // görünmedi. Mesajı satır notuna taşı — ilk bakışta kök neden çıksın.
      liveHata = etsyHataOzeti(e);
      console.error(
        `pricing dry-run: envanter okunamadı listing=${p.etsy_listing_id}`,
        e,
      );
    }

    const { data: varData, error: varErr } = await admin
      .from("product_variants")
      .select("sku, weight_grams, product_id")
      .eq("org_id", orgId)
      .eq("product_id", p.id);
    if (varErr) throw new Error(`variants okuma: ${varErr.message}`);
    const variants = (varData ?? []) as VariantRow[];

    const karat = detectKarat(p.title) as EonKarat | null;
    const profile = detectProfile(p.title);

    for (const v of variants) {
      const axes = parseSkuAxes(v.sku);
      const grams =
        v.weight_grams == null ? null : Number(v.weight_grams) || null;
      const live = liveBySku.get(v.sku) ?? null;

      const temel: PricingRunRow = {
        sku: v.sku,
        listingId: p.etsy_listing_id,
        productId: p.id,
        productTitle: p.title,
        karat,
        profile,
        widthMm: axes?.widthMm ?? null,
        sizeUs: axes?.sizeUs ?? null,
        grams,
        liveCents: live,
        newCents: null,
        deltaCents: null,
        landedUsd: null,
        floorUsd: null,
        offsiteFloorUsd: null,
        belowFloor: false,
        status: "unknown",
      };

      // Bilinmeyen hiçbir girdi İKAME EDİLMEZ (kullanıcı kısıtı 5).
      const eksik: string[] = [];
      if (karat == null) eksik.push("karat başlıktan çözülemedi");
      if (profile == null) eksik.push("işçilik sınıfı başlıktan çözülemedi");
      if (axes == null) eksik.push("SKU genişlik/beden taşımıyor");
      if (grams == null) eksik.push("gram bilinmiyor");
      if (!liveOkundu) {
        eksik.push(
          liveHata
            ? `Etsy envanteri okunamadı (${liveHata})`
            : "Etsy envanteri okunamadı",
        );
      }
      else if (live == null) eksik.push("Etsy'de bu SKU yok");
      if (eksik.length > 0) {
        rows.push({ ...temel, note: eksik.join(" · ") });
        continue;
      }

      try {
        const r = computeEonCost({
          karat: karat!,
          profile: profile!,
          widthMm: axes!.widthMm,
          grams: grams!,
          sizeUs: axes!.sizeUs,
          spotUsdPerOzt,
          config,
        });
        const newCents = r.listCents;
        // Zemin kontrolü SATIŞ fiyatı üzerinden: vitrinde görülen ve tahsil
        // edilen tutar odur (liste × sale_rate).
        const saleUsd = (newCents / 100) * config.saleRate;
        const belowFloor = saleUsd < r.floorUsd;
        rows.push({
          ...temel,
          newCents,
          deltaCents: newCents - live!,
          landedUsd: r.landedUsd,
          floorUsd: r.floorUsd,
          offsiteFloorUsd: r.offsiteFloorUsd,
          belowFloor,
          status: belowFloor
            ? "below_floor"
            : newCents === live
              ? "unchanged"
              : "changed",
        });
      } catch (e) {
        rows.push({
          ...temel,
          note:
            e instanceof EonCostError
              ? e.message
              : e instanceof Error
                ? e.message
                : String(e),
        });
      }
    }
  }

  return {
    rows,
    total: rows.length,
    changed: rows.filter((r) => r.status === "changed").length,
    unchanged: rows.filter((r) => r.status === "unchanged").length,
    belowFloor: rows.filter((r) => r.status === "below_floor").length,
    unknown: rows.filter((r) => r.status === "unknown").length,
  };
}
