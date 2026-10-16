import { floorUsd } from "@/lib/pricing-engine/eon-cost";
import {
  TROY_OZ_GRAMS,
  V4,
  eonListCents,
  eonSaleCents,
  isEonFriezeProduct,
  parseEonSku,
} from "@/lib/pricing/gold-index";

/**
 * Eon vitrin fiyatı.
 *
 * Etsy vitrin indirimi kasada ayrıca uygulanır (Ekim 2026: %30).
 * Offering fiyatı bu yüzden liste olarak kalır; bir de listeyi satışa
 * çekmek indirimi %35 tavanının üstüne taşır. Burada liste, yeni spotla
 * yeniden kurulur. İndirim canlı fiyattan en fazla %35 iner, maliyet
 * zemininin altına inmez ve fiyat yükseltilmez.
 */

export const MAX_SHOP_DISCOUNT = 0.35;
const MATCH_TOLERANCE = 0.03;

type Tier = { labor: number; narrow: number; wide: number };

function tiersFor(frieze: boolean): Tier[] {
  if (!frieze) {
    return [
      {
        labor: V4.laborStandardUsd,
        narrow: V4.multNarrow,
        wide: V4.multWide,
      },
    ];
  }
  return [
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
  ];
}

export interface ShopPriceInput {
  sku: string;
  title: string;
  grams: number;
  oldCents: number;
  basisPerOzt: number;
  spotPerOzt: number;
}

export type ShopPriceDecision =
  | {
      action: "reprice";
      newCents: number;
      cutPct: number;
      capped: boolean;
      heldAtFloor: boolean;
      matched: "list" | "sale";
    }
  | { action: "unchanged"; reason: string }
  | { action: "skip"; reason: string };

/** Hedefi %35 tavanı ve maliyet zemini ile sınırlar. Yükseltmez. */
export function capShopPrice(
  oldCents: number,
  targetCents: number,
  floorCents: number,
): { newCents: number; capped: boolean; heldAtFloor: boolean } | null {
  if (!(oldCents > 0) || !(targetCents > 0)) return null;
  const deepestCut = Math.round(oldCents * (1 - MAX_SHOP_DISCOUNT));
  const floor = Math.max(1, floorCents);
  const deepest = Math.max(deepestCut, floor);
  const next = Math.max(targetCents, deepest);
  if (next >= oldCents) return null;
  return {
    newCents: next,
    capped: next === deepestCut && targetCents < deepestCut,
    heldAtFloor: next === floor && floor > targetCents && floor >= deepestCut,
  };
}

function relativeDistance(price: number, candidate: number): number {
  if (!(candidate > 0)) return Number.POSITIVE_INFINITY;
  return Math.abs(price - candidate) / candidate;
}

export function competitiveShopPrice(input: ShopPriceInput): ShopPriceDecision {
  const parsed = parseEonSku(input.sku);
  if (!parsed) return { action: "skip", reason: "sku-desen-disi" };
  if (!(input.grams > 0)) return { action: "skip", reason: "gramsiz" };
  if (!(input.oldCents > 0)) return { action: "skip", reason: "fiyatsiz" };
  if (!(input.basisPerOzt > 0) || !(input.spotPerOzt > 0)) {
    return { action: "skip", reason: "spot-yok" };
  }

  const frieze = isEonFriezeProduct(input.sku, input.title);
  const purity = V4.purity[parsed.karat];
  if (!purity) return { action: "skip", reason: "karat-yok" };

  let best:
    | { tier: Tier; kind: "list" | "sale"; distance: number }
    | undefined;
  for (const tier of tiersFor(frieze)) {
    const list = eonListCents(
      parsed.karat,
      parsed.widthMm,
      input.grams,
      tier.labor,
      input.basisPerOzt,
      tier,
    );
    const sale = eonSaleCents(
      parsed.karat,
      parsed.widthMm,
      input.grams,
      tier.labor,
      input.basisPerOzt,
      tier,
    );
    const options: { kind: "list" | "sale"; cents: number }[] = [
      { kind: "list", cents: list },
      { kind: "sale", cents: sale },
    ];
    for (const option of options) {
      const distance = relativeDistance(input.oldCents, option.cents);
      if (!best || distance < best.distance) {
        best = { tier, kind: option.kind, distance };
      }
    }
  }
  if (!best || best.distance > MATCH_TOLERANCE) {
    return { action: "skip", reason: "taban-uyumsuz" };
  }

  const landed =
    input.grams * (input.spotPerOzt / TROY_OZ_GRAMS) * purity * (1 + V4.fire) +
    best.tier.labor +
    V4.packagingUsd +
    V4.shippingUsd;
  const floorCents = Math.round(floorUsd(landed) * 100);
  // Liste eşleşmesi listede kalır. Satış eşleşmesi satışta kalır.
  // Kasadaki mağaza indirimi bu fiyatın üstüne biner.
  const target =
    best.kind === "list"
      ? eonListCents(
          parsed.karat,
          parsed.widthMm,
          input.grams,
          best.tier.labor,
          input.spotPerOzt,
          best.tier,
        )
      : eonSaleCents(
          parsed.karat,
          parsed.widthMm,
          input.grams,
          best.tier.labor,
          input.spotPerOzt,
          best.tier,
        );
  const capped = capShopPrice(input.oldCents, target, floorCents);
  if (!capped) {
    return { action: "unchanged", reason: "hedef-yukari-veya-ayni" };
  }
  return {
    action: "reprice",
    newCents: capped.newCents,
    cutPct: (input.oldCents - capped.newCents) / input.oldCents,
    capped: capped.capped,
    heldAtFloor: capped.heldAtFloor,
    matched: best.kind,
  };
}
