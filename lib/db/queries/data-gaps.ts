import { createClient } from "@/lib/supabase/server";

/** Uyarı önem derecesi — Uyarı Merkezi (lib/db/queries/alerts.ts) ile paylaşılır.
 *  kritik = para kaybı akıyor/sistem kırık · onemli = performans aşınıyor ·
 *  bilgi = hijyen/bakım. */
export type AlertSeverity = "kritik" | "onemli" | "bilgi";

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
  /** Uyarı Merkezi'ndeki önem derecesi — gap kendi önemini kendisi taşır,
   *  dışarıda anahtar-string eşlemesi gerekmez (eklerken tek yerde karar). */
  severity: AlertSeverity;
}

/**
 * Analizleri etkileyen EKSİK verileri gruplayıp sayar. Her grup, kullanıcının
 * bilgiyi girebileceği bir sayfaya link verir. Yeni bir eksik-veri türü
 * eklemek = buraya bir sayım + bir DataGap satırı eklemek (severity dahil).
 * Yalnız count > 0 olan gruplar döner (sırf sorun olanlar gösterilir).
 * NOT: Ürün-durumu uyarıları (stok bitti / süresi doldu) burada DEĞİL —
 * sayı+bedel tek sorgudan çıksın diye lib/db/queries/alerts.ts üretir.
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
      title: `${variantsMissingWeight} varyantın gram bilgisi eksik`,
      count: variantsMissingWeight ?? 0,
      hint: "Gram bilinmeyince altın maliyetini ve gerçek kârını hesaplayamıyoruz — yanlış fiyatlıyor, farkında olmadan zarar edebiliyorsun. Ağırlıkları gir, kâr rakamların doğru olsun.",
      href: "/tasarimlar/eksik-agirlik",
      actionLabel: "Ağırlıkları gir",
      tone: "warn",
      severity: "onemli",
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
      severity: "onemli",
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
      severity: "bilgi",
    });
  }

  return gaps;
}
