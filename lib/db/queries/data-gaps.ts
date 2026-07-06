import { createClient } from "@/lib/supabase/server";

export interface DataGap {
  key: string;
  title: string;
  /** Eksik kayıt sayısı. */
  count: number;
  /** Neyi etkilediği (analiz). */
  hint: string;
  href: string;
  actionLabel: string;
  tone: "warn" | "info";
}

/**
 * Analizleri etkileyen EKSİK verileri gruplayıp sayar. Her grup, kullanıcının
 * bilgiyi girebileceği bir sayfaya link verir. Yeni bir eksik-veri türü
 * eklemek = buraya bir sayım + bir DataGap satırı eklemek.
 * Yalnız count > 0 olan gruplar döner (sırf sorun olanlar gösterilir).
 */
export async function getDataGaps(orgId: string): Promise<DataGap[]> {
  const supabase = await createClient();

  const head = (table: string) =>
    supabase.from(table).select("*", { count: "exact", head: true }).eq("org_id", orgId);

  const [
    { count: variantsMissingWeight },
    { count: reviewsNeedReply },
    { data: actionableUnlinked },
  ] = await Promise.all([
    head("product_variants").is("weight_grams", null),
    head("reviews").eq("status", "yeni").lte("rating", 3),
    // Yalnız YAPILABİLİR (bağlanabilir) kalemleri say — SKU'su ürüne bağlı bir
    // varyantla eşleşen ama henüz bağlanmamış olanlar. Silinmiş/eski listelere
    // ait tarihsel kalemler (aktif ürüne ulaşmayan) sayılmaz — onlarla iş yok.
    supabase.rpc("count_actionable_unlinked_items", { p_org_id: orgId }),
  ]);
  const saleItemsUnlinked = (actionableUnlinked as number | null) ?? 0;

  const gaps: DataGap[] = [];

  if ((variantsMissingWeight ?? 0) > 0) {
    gaps.push({
      key: "variant_weights",
      title: `${variantsMissingWeight} varyantın ağırlığı (gram) eksik`,
      count: variantsMissingWeight ?? 0,
      hint: "Altın maliyeti ve kâr/marj analizleri gramla hesaplanır; eksik gram = tahmini/eksik maliyet.",
      href: "/tasarimlar/eksik-agirlik",
      actionLabel: "Ağırlıkları gir",
      tone: "warn",
    });
  }

  if ((reviewsNeedReply ?? 0) > 0) {
    gaps.push({
      key: "reviews_reply",
      title: `${reviewsNeedReply} olumsuz yorum yanıt bekliyor`,
      count: reviewsNeedReply ?? 0,
      hint: "Yanıt oranı ve Yıldız Satıcı metriklerini etkiler.",
      href: "/yorumlar",
      actionLabel: "Yanıtla",
      tone: "warn",
    });
  }

  if ((saleItemsUnlinked ?? 0) > 0) {
    gaps.push({
      key: "sale_items_unlinked",
      title: `${saleItemsUnlinked} satış kalemi ürüne bağlanabilir`,
      count: saleItemsUnlinked,
      hint: "SKU'su ürüne bağlı bir varyantla eşleşiyor; Stok sayfasındaki varyant senkronu bunları bağlar.",
      href: "/stok",
      actionLabel: "Varyantları senkronize et",
      tone: "info",
    });
  }

  return gaps;
}
