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
    { count: soldOutProducts },
    { count: expiredProducts },
  ] = await Promise.all([
    head("product_variants").is("weight_grams", null),
    head("reviews").eq("status", "yeni").lte("rating", 3),
    // Yalnız YAPILABİLİR (bağlanabilir) kalemleri say — SKU'su ürüne bağlı bir
    // varyantla eşleşen ama henüz bağlanmamış olanlar. Silinmiş/eski listelere
    // ait tarihsel kalemler (aktif ürüne ulaşmayan) sayılmaz — onlarla iş yok.
    supabase.rpc("count_actionable_unlinked_items", { p_org_id: orgId }),
    // Stoğu biten (Etsy `sold_out`) ve süresi dolan (`expired`) listingler —
    // satış kaybı/görünmezlik; senkron kartında anlık görünüyordu ama ana
    // sayfada kalıcı aksiyon flag'i yoktu.
    head("products").eq("status", "sold_out"),
    head("products").eq("status", "expired"),
  ]);
  const saleItemsUnlinked = (actionableUnlinked as number | null) ?? 0;

  const gaps: DataGap[] = [];

  if ((soldOutProducts ?? 0) > 0) {
    gaps.push({
      key: "products_sold_out",
      title: `${soldOutProducts} ürün tükendi — şu an satılamıyor`,
      count: soldOutProducts ?? 0,
      hint: "Stok bitince listing kapanıyor; müşteri o ürünü başka mağazadan alıyor ve Etsy sıralamanda geriliyorsun. Stok ekleyip yeniden yayınla, satışa geri dönsün.",
      href: "/tasarimlar?status=sold_out",
      actionLabel: "Tükenenleri gör",
      tone: "warn",
    });
  }

  if ((expiredProducts ?? 0) > 0) {
    gaps.push({
      key: "products_expired",
      title: `${expiredProducts} listing süresi doldu`,
      count: expiredProducts ?? 0,
      hint: "Süresi dolan ürün aramada hiç çıkmıyor — alıcılar seni bulamıyor, o listinge gelen trafik tamamen kesiliyor. Yenile, tekrar görünür olsun.",
      href: "/tasarimlar?status=expired",
      actionLabel: "Süresi dolanları gör",
      tone: "warn",
    });
  }

  if ((variantsMissingWeight ?? 0) > 0) {
    gaps.push({
      key: "variant_weights",
      title: `${variantsMissingWeight} varyantın gram bilgisi eksik`,
      count: variantsMissingWeight ?? 0,
      hint: "Gram bilinmeyince altın maliyetini ve gerçek kârını hesaplayamıyoruz — yanlış fiyatlıyor, farkında olmadan zarar edebiliyorsun. Ağırlıkları gir, kâr rakamların doğru olsun.",
      href: "/tasarimlar/eksik-agirlik",
      actionLabel: "Ağırlıkları gir",
      tone: "warn",
    });
  }

  if ((reviewsNeedReply ?? 0) > 0) {
    gaps.push({
      key: "reviews_reply",
      title: `${reviewsNeedReply} olumsuz yorum yanıtsız`,
      count: reviewsNeedReply ?? 0,
      hint: "Yanıtsız olumsuz yorum yeni alıcıların gözüne ilk çarpan şey oluyor ve Yıldız Satıcı puanını düşürüyor. Yanıtla, hem güveni hem puanı koru.",
      href: "/yorumlar",
      actionLabel: "Yanıtla",
      tone: "warn",
    });
  }

  if ((saleItemsUnlinked ?? 0) > 0) {
    gaps.push({
      key: "sale_items_unlinked",
      title: `${saleItemsUnlinked} satış bir ürüne bağlı değil`,
      count: saleItemsUnlinked,
      hint: "Bu satışlar bir ürüne bağlanmadığı için ürün bazlı kâr ve performans raporlarında görünmüyor — rakamların eksik çıkıyor. Bağla, raporların tam olsun.",
      href: "/stok",
      actionLabel: "Varyantları bağla",
      tone: "info",
    });
  }

  return gaps;
}
