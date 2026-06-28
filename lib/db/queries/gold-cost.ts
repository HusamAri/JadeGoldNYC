import { createClient } from "@/lib/supabase/server";
import {
  detectKarat,
  extractWeightGrams,
  calculateGoldCost,
  type KaratType,
  type GoldCostBreakdown,
} from "@/lib/gold-cost";

// ── Satış kalemi + ürün bilgisi birleşik tipi ─────────────────────────

export interface SoldItemWithCost {
  saleItemId: string;
  saleId: string;
  productId: string | null;
  title: string;
  quantity: number;
  lineTotalCents: number;
  orderDate: string;
  buyerName: string | null;
  /** Ürün tablosundan gelen zenginleştirme alanları. */
  productTitle: string | null;
  productDescription: string | null;
  productTags: string[] | null;
  productMaterials: string[] | null;
  /** Tespit sonuçları. */
  karat: KaratType | null;
  weightGrams: number | null;
  /** Hesaplanmış maliyet kırılımı (ayar + ağırlık tespit edilebildiyse). */
  cost: GoldCostBreakdown | null;
}

// ── Özet istatistikler ────────────────────────────────────────────────

export interface GoldCostSummary {
  totalItems: number;
  analyzedItems: number;
  unanalyzedItems: number;
  totalRevenueCents: number;
  totalGoldCostCents: number;
  totalLaborCostCents: number;
  totalPurchaseCostCents: number;
  byKarat: Record<
    KaratType,
    {
      count: number;
      revenueCents: number;
      goldCostCents: number;
      laborCostCents: number;
      purchaseCostCents: number;
      avgLaborMarkup: number;
    }
  >;
}

/**
 * Satılan ürünlerin altın maliyet analizini döndürür.
 *
 * sale_items → sales (tarih/alıcı) + products (başlık/açıklama/etiket)
 * birleştirilir; başlıktan ayar + ağırlık tespit edilir ve güncel altın
 * fiyatına göre maliyet hesaplanır.
 */
export async function getGoldCostAnalysis(
  goldPricePerOunceUsd: number,
): Promise<{ items: SoldItemWithCost[]; summary: GoldCostSummary }> {
  const supabase = await createClient();

  const { data: saleItemRows, error } = await supabase
    .from("sale_items")
    .select(
      "id, sale_id, product_id, title, quantity, line_total_cents, created_at, sales!inner(order_date, buyer_name, status)",
    )
    .neq("sales.status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;

  type RawRow = {
    id: string;
    sale_id: string;
    product_id: string | null;
    title: string | null;
    quantity: number;
    line_total_cents: number;
    created_at: string;
    sales: { order_date: string; buyer_name: string | null };
  };
  const rawItems = (saleItemRows ?? []) as unknown as RawRow[];

  const productIds = [
    ...new Set(rawItems.map((r) => r.product_id).filter(Boolean)),
  ] as string[];

  const productMap = new Map<
    string,
    {
      title: string;
      description: string | null;
      tags: string[] | null;
      materials: string[] | null;
    }
  >();

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, title, description, tags, materials")
      .in("id", productIds);

    for (const p of (products ?? []) as {
      id: string;
      title: string;
      description: string | null;
      tags: string[] | null;
      materials: string[] | null;
    }[]) {
      productMap.set(p.id, {
        title: p.title,
        description: p.description,
        tags: p.tags,
        materials: p.materials,
      });
    }
  }

  const items: SoldItemWithCost[] = rawItems.map((r) => {
    const prod = r.product_id ? productMap.get(r.product_id) : null;
    const combinedTitle = prod?.title ?? r.title ?? "";
    const description = prod?.description ?? null;
    const tags = prod?.tags ?? null;
    const materials = prod?.materials ?? null;

    const karat = detectKarat(combinedTitle, tags, materials);
    const weightGrams = extractWeightGrams(combinedTitle, description);

    let cost: GoldCostBreakdown | null = null;
    if (karat && weightGrams) {
      cost = calculateGoldCost(goldPricePerOunceUsd, karat, weightGrams);
    }

    return {
      saleItemId: r.id,
      saleId: r.sale_id,
      productId: r.product_id,
      title: combinedTitle || r.title || "—",
      quantity: r.quantity,
      lineTotalCents: r.line_total_cents,
      orderDate: r.sales.order_date,
      buyerName: r.sales.buyer_name,
      productTitle: prod?.title ?? null,
      productDescription: description,
      productTags: tags,
      productMaterials: materials,
      karat,
      weightGrams,
      cost,
    };
  });

  const summary = buildSummary(items);

  return { items, summary };
}

function buildSummary(items: SoldItemWithCost[]): GoldCostSummary {
  const byKarat: GoldCostSummary["byKarat"] = {
    "10K": {
      count: 0,
      revenueCents: 0,
      goldCostCents: 0,
      laborCostCents: 0,
      purchaseCostCents: 0,
      avgLaborMarkup: 0,
    },
    "14K": {
      count: 0,
      revenueCents: 0,
      goldCostCents: 0,
      laborCostCents: 0,
      purchaseCostCents: 0,
      avgLaborMarkup: 0,
    },
  };

  let totalRevenueCents = 0;
  let totalGoldCostCents = 0;
  let totalLaborCostCents = 0;
  let totalPurchaseCostCents = 0;
  let analyzedItems = 0;

  for (const item of items) {
    totalRevenueCents += item.lineTotalCents * item.quantity;

    if (item.cost && item.karat) {
      analyzedItems++;
      const qty = item.quantity;
      const k = byKarat[item.karat];
      k.count += qty;
      k.revenueCents += item.lineTotalCents * qty;
      k.goldCostCents += item.cost.totalGoldCostCents * qty;
      k.laborCostCents += item.cost.totalLaborCostCents * qty;
      k.purchaseCostCents += item.cost.totalPurchaseCostCents * qty;

      totalGoldCostCents += item.cost.totalGoldCostCents * qty;
      totalLaborCostCents += item.cost.totalLaborCostCents * qty;
      totalPurchaseCostCents += item.cost.totalPurchaseCostCents * qty;
    }
  }

  for (const k of Object.values(byKarat)) {
    k.avgLaborMarkup =
      k.goldCostCents > 0 ? k.laborCostCents / k.goldCostCents : 0;
  }

  return {
    totalItems: items.length,
    analyzedItems,
    unanalyzedItems: items.length - analyzedItems,
    totalRevenueCents,
    totalGoldCostCents,
    totalLaborCostCents,
    totalPurchaseCostCents,
    byKarat,
  };
}
