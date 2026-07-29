/**
 * EON 1.5mm fiyat DÜZELTMESİNİN paylaşılan çekirdeği — geçici
 * /api/ops/eon-price-push rotası kullanır; push tamamlanınca rota ile birlikte
 * emekliye ayrılır. Fiyat HESAPLAMAZ (externalPricing): gömülü v3 grid'inden
 * okur, canlı varyantlarla diff'ler.
 *
 * Yarım-beden kuralı (onaylı): komşu tam bedenlerin ortalaması, $5'e YUKARI
 * yuvarlı — gram tablosundaki yarım-beden orta-nokta kuralının fiyat karşılığı.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { GRID_15_CELLS } from "./grid-1_5mm";
import type { Karat, PricingProfile } from "./parse";

export type CellKey = `${Karat}|${PricingProfile}|${number}|${number}`;
export const cellKey = (
  k: Karat,
  p: PricingProfile,
  w: number,
  s: number,
): CellKey => `${k}|${p}|${w}|${s}`;

/** Grid + yarım-beden enterpolasyonu → hücre→cent haritası. */
export function buildPriceMap(): {
  listByCell: Map<CellKey, number>;
  interpolated: Set<CellKey>;
} {
  const listByCell = new Map<CellKey, number>();
  for (const [k, p, w, s, cents] of GRID_15_CELLS) {
    listByCell.set(cellKey(k, p, w, s), cents);
  }
  const interpolated = new Set<CellKey>();
  for (const [k, p, w, s, cents] of GRID_15_CELLS) {
    const hi = listByCell.get(cellKey(k, p, w, s + 1));
    if (hi == null) continue;
    const key = cellKey(k, p, w, s + 0.5);
    if (listByCell.has(key)) continue;
    listByCell.set(key, Math.ceil((cents + hi) / 2 / 500) * 500);
    interpolated.add(key);
  }
  return { listByCell, interpolated };
}

/** v3 SKU: <RENK>-R-<KARAT+TİP>-<GENİŞLİK>MM-<BEDEN>; tip 04 = milgrain. */
const SKU_RE = /^(GLD|WHG|RSG)-R-(10|14|18)(0[1-5])-(\d+)MM-(\d+(?:\.5)?)$/;
export function parseSku(sku: string): {
  karat: Karat;
  profile: PricingProfile;
  widthMm: number;
  sizeUs: number;
} | null {
  const m = SKU_RE.exec(sku);
  if (!m) return null;
  return {
    karat: `${m[2]}K` as Karat,
    profile: m[3] === "04" ? "milgrain" : "standard",
    widthMm: Number(m[4]),
    sizeUs: Number(m[5]),
  };
}

export type DiffRow = {
  listingId: number;
  sku: string;
  oldCents: number;
  newCents: number | null;
  gap: "" | "sku-cozulmedi" | "grid-kapsam-disi";
  interpolated: boolean;
};

export type ListingDiff = {
  listingId: number;
  productId: string;
  title: string;
  rows: DiffRow[];
  /** Etsy PUT + panel eşitleme hedefi (yalnız yeni fiyatı olan SKU'lar). */
  priceBySku: Map<string, number>;
  propsBySku: Map<string, { name: string; value: string }[]>;
};

export type PushDiff = {
  listings: ListingDiff[];
  totals: {
    variants: number;
    covered: number;
    changed: number;
    unchanged: number;
    gaps: number;
    interpolated: number;
  };
};

/** Canlı EON varyantlarını grid ile diff'ler (salt okuma). */
export async function buildPushDiff(
  admin: SupabaseClient,
  orgId: string,
): Promise<PushDiff> {
  const { listByCell, interpolated } = buildPriceMap();

  const { data: products, error: prodErr } = await admin
    .from("products")
    .select("id, title, etsy_listing_id")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    .order("title");
  if (prodErr) throw new Error(prodErr.message);

  const listings: ListingDiff[] = [];
  const totals = {
    variants: 0,
    covered: 0,
    changed: 0,
    unchanged: 0,
    gaps: 0,
    interpolated: 0,
  };

  for (const p of (products ?? []) as {
    id: string;
    title: string;
    etsy_listing_id: number;
  }[]) {
    const { data: variants, error: vErr } = await admin
      .from("product_variants")
      .select("sku, price_cents, properties")
      .eq("product_id", p.id)
      .eq("active", true)
      .order("sku");
    if (vErr) throw new Error(`${p.title}: ${vErr.message}`);

    const L: ListingDiff = {
      listingId: p.etsy_listing_id,
      productId: p.id,
      title: p.title,
      rows: [],
      priceBySku: new Map(),
      propsBySku: new Map(),
    };
    for (const v of (variants ?? []) as {
      sku: string;
      price_cents: number;
      properties: Record<string, string> | null;
    }[]) {
      totals.variants++;
      const parsed = parseSku(v.sku);
      if (!parsed) {
        totals.gaps++;
        L.rows.push({
          listingId: p.etsy_listing_id,
          sku: v.sku,
          oldCents: v.price_cents,
          newCents: null,
          gap: "sku-cozulmedi",
          interpolated: false,
        });
        continue;
      }
      const key = cellKey(
        parsed.karat,
        parsed.profile,
        parsed.widthMm,
        parsed.sizeUs,
      );
      const target = listByCell.get(key);
      if (target == null) {
        totals.gaps++;
        L.rows.push({
          listingId: p.etsy_listing_id,
          sku: v.sku,
          oldCents: v.price_cents,
          newCents: null,
          gap: "grid-kapsam-disi",
          interpolated: false,
        });
        continue;
      }
      totals.covered++;
      const isInterp = interpolated.has(key);
      if (isInterp) totals.interpolated++;
      if (target === v.price_cents) totals.unchanged++;
      else totals.changed++;
      L.rows.push({
        listingId: p.etsy_listing_id,
        sku: v.sku,
        oldCents: v.price_cents,
        newCents: target,
        gap: "",
        interpolated: isInterp,
      });
      L.priceBySku.set(v.sku, target);
      L.propsBySku.set(
        v.sku,
        Object.entries(v.properties ?? {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
      );
    }
    listings.push(L);
  }
  return { listings, totals };
}
