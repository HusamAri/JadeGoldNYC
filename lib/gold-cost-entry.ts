/**
 * Satış kalemlerinden otomatik altın maliyet kalemi oluşturma.
 *
 * Her satış gerçekleştiğinde (manuel, CSV, Etsy):
 *  1. sale_items'dan kalem başlıkları çekilir
 *  2. Başlık/ürün bilgisinden ayar (10K/14K) ve ağırlık tespit edilir
 *  3. Güncel altın fiyatıyla malzeme + işçilik maliyeti hesaplanır
 *  4. İki ayrı maliyet kalemi yazılır: "malzeme" ve "iscilik"
 *
 * Stok tutulmadığından tedarik satış sonrası yapılır — bu yüzden maliyet
 * satış anındaki altın fiyatına göre hesaplanır.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { getGoldPricePerOunce } from "@/lib/gold-price";
import {
  detectKarat,
  extractWeightGrams,
  calculateGoldCost,
  type GoldCostBreakdown,
} from "@/lib/gold-cost";

export interface GoldCostResult {
  saleId: string;
  processed: number;
  skipped: number;
  goldCostCents: number;
  laborCostCents: number;
}

/**
 * Tek bir satış için altın maliyet kalemlerini oluşturur.
 *
 * İdempotent: aynı satış için zaten `source = 'gold_auto'` kaydı varsa atlar.
 * Bu sayede Etsy sync tekrar çalışsa bile çift maliyet yazılmaz.
 */
export async function createGoldCostForSale(
  supabase: SupabaseClient,
  saleId: string,
  orgId: string,
): Promise<GoldCostResult> {
  const result: GoldCostResult = {
    saleId,
    processed: 0,
    skipped: 0,
    goldCostCents: 0,
    laborCostCents: 0,
  };

  // Daha önce yazılmış mı kontrol et
  const { data: existing } = await supabase
    .from("costs")
    .select("id")
    .eq("sale_id", saleId)
    .eq("source", "gold_auto")
    .limit(1);
  if (existing && existing.length > 0) {
    return result; // zaten işlenmiş
  }

  // Satış bilgisi
  const { data: sale } = await supabase
    .from("sales")
    .select("order_date, status")
    .eq("id", saleId)
    .maybeSingle();
  if (!sale || (sale as { status: string }).status === "cancelled") {
    return result;
  }
  const orderDate = (sale as { order_date: string }).order_date.slice(0, 10);

  // Satış kalemleri
  const { data: items } = await supabase
    .from("sale_items")
    .select("id, title, quantity, product_id")
    .eq("sale_id", saleId);
  if (!items || items.length === 0) return result;

  type ItemRow = {
    id: string;
    title: string | null;
    quantity: number;
    product_id: string | null;
  };
  const saleItems = items as ItemRow[];

  // Ürün bilgisi (zenginleştirme alanları)
  const productIds = [
    ...new Set(saleItems.map((i) => i.product_id).filter(Boolean)),
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

  // Altın fiyatını çek
  const goldPricePerOunce = await getGoldPricePerOunce();

  // Maliyet kategorilerini çek
  const { data: cats } = await supabase
    .from("cost_categories")
    .select("id, key")
    .eq("org_id", orgId)
    .in("key", ["malzeme", "iscilik"]);
  const catMap = new Map<string, string>();
  for (const c of (cats ?? []) as { id: string; key: string }[]) {
    catMap.set(c.key, c.id);
  }

  const costRows: {
    org_id: string;
    category_id: string | null;
    description: string;
    amount_cents: number;
    currency: string;
    cost_date: string;
    vendor: string | null;
    sale_id: string;
    source: string;
    notes: string | null;
  }[] = [];

  for (const item of saleItems) {
    const prod = item.product_id ? productMap.get(item.product_id) : null;
    const combinedTitle = prod?.title ?? item.title ?? "";
    const description = prod?.description ?? null;
    const tags = prod?.tags ?? null;
    const materials = prod?.materials ?? null;

    const karat = detectKarat(combinedTitle, tags, materials);
    const weightGrams = extractWeightGrams(combinedTitle, description);

    if (!karat || !weightGrams) {
      result.skipped += item.quantity;
      continue;
    }

    const cost: GoldCostBreakdown = calculateGoldCost(
      goldPricePerOunce,
      karat,
      weightGrams,
    );

    const qty = item.quantity || 1;
    const goldCents = cost.totalGoldCostCents * qty;
    const laborCents = cost.totalLaborCostCents * qty;

    result.goldCostCents += goldCents;
    result.laborCostCents += laborCents;
    result.processed += qty;

    const label = `${karat} ${weightGrams}g`;

    // Malzeme kalemi (altın değeri)
    costRows.push({
      org_id: orgId,
      category_id: catMap.get("malzeme") ?? null,
      description: `Altin malzeme — ${label} × ${qty} (${combinedTitle.slice(0, 60)})`,
      amount_cents: goldCents,
      currency: "USD",
      cost_date: orderDate,
      vendor: "Altin Tedarik",
      sale_id: saleId,
      source: "gold_auto",
      notes: `Ons: $${goldPricePerOunce} | Ayar: ${karat} | Agirlik: ${weightGrams}g | Adet: ${qty}`,
    });

    // İşçilik kalemi
    costRows.push({
      org_id: orgId,
      category_id: catMap.get("iscilik") ?? null,
      description: `Iscilik — ${label} × ${qty} (${combinedTitle.slice(0, 60)})`,
      amount_cents: laborCents,
      currency: "USD",
      cost_date: orderDate,
      vendor: "Altin Tedarik",
      sale_id: saleId,
      source: "gold_auto",
      notes: `Iscilik orani: %${(cost.laborMarkup * 100).toFixed(1)}`,
    });
  }

  if (costRows.length > 0) {
    await supabase.from("costs").insert(costRows);
  }

  return result;
}

/**
 * Birden fazla satış için toplu altın maliyet hesabı.
 * Geriye dönük (retroaktif) toplu işlem için kullanılır.
 */
export async function createGoldCostsForSales(
  supabase: SupabaseClient,
  saleIds: string[],
  orgId: string,
): Promise<{
  totalProcessed: number;
  totalSkipped: number;
  totalGoldCostCents: number;
  totalLaborCostCents: number;
}> {
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalGoldCostCents = 0;
  let totalLaborCostCents = 0;

  for (const saleId of saleIds) {
    const r = await createGoldCostForSale(supabase, saleId, orgId);
    totalProcessed += r.processed;
    totalSkipped += r.skipped;
    totalGoldCostCents += r.goldCostCents;
    totalLaborCostCents += r.laborCostCents;
  }

  return { totalProcessed, totalSkipped, totalGoldCostCents, totalLaborCostCents };
}

/**
 * Henüz gold_auto maliyeti olmayan tüm satışları bulup işler.
 * Etsy senkronizasyonu sonrası veya geriye dönük toplu hesaplama için.
 */
export async function processGoldCostsForRecentSales(
  supabase: SupabaseClient,
  orgId: string,
): Promise<{
  totalProcessed: number;
  totalSkipped: number;
  totalGoldCostCents: number;
  totalLaborCostCents: number;
}> {
  const emptyResult = {
    totalProcessed: 0,
    totalSkipped: 0,
    totalGoldCostCents: 0,
    totalLaborCostCents: 0,
  };

  // Tüm geçerli satış ID'lerini çek
  const { data: allSales } = await supabase
    .from("sales")
    .select("id")
    .eq("org_id", orgId)
    .neq("status", "cancelled");
  if (!allSales || allSales.length === 0) return emptyResult;

  // Zaten gold_auto maliyeti olan satış ID'lerini çek
  const { data: existingCosts } = await supabase
    .from("costs")
    .select("sale_id")
    .eq("org_id", orgId)
    .eq("source", "gold_auto")
    .not("sale_id", "is", null);

  const processedSet = new Set(
    ((existingCosts ?? []) as { sale_id: string }[]).map((r) => r.sale_id),
  );

  const pendingSaleIds = (allSales as { id: string }[])
    .map((s) => s.id)
    .filter((id) => !processedSet.has(id));

  if (pendingSaleIds.length === 0) return emptyResult;

  return createGoldCostsForSales(supabase, pendingSaleIds, orgId);
}
