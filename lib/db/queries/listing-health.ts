import { createClient } from "@/lib/supabase/server";

export type ListingActionKind =
  | "koru" // iyi gidiyor — dokunma
  | "fiyat" // yeniden fiyatla (pahalı/ucuz)
  | "tanit" // fiyat iyi, görünürlük/reklam gerek
  | "tedarik" // iptal/stok sorunu — önce tedarik
  | "kapat" // ölü listing — kapat/pasifle
  | "incele"; // veri yetersiz / belirsiz

export interface ListingHealth {
  product_id: string;
  title: string;
  status: string | null;
  price_cents: number | null;
  weight_grams: number | null;
  views: number;
  favorers: number;
  orders_lifetime: number;
  orders_30d: number;
  revenue_30d_cents: number;
  last_sale: string | null;
  ship_total: number;
  ship_cancelled: number;
  /** İptal oranı (0..1); ShipStation verisi yoksa null. */
  cancel_rate: number | null;
  /** Dönüşüm (ömür sipariş / görüntülenme); görüntülenme yoksa null. */
  conversion: number | null;
  market: {
    price_position: "pahali" | "ucuz" | "bantta" | "belirsiz" | null;
    our_per_gram_cents: number | null;
    market_low_per_gram_cents: number | null;
    market_high_per_gram_cents: number | null;
    deviation_pct: number | null;
    confidence: string | null;
    recommendation: string | null;
    suggested_price_cents: number | null;
    researched_at: string | null;
  } | null;
  action: {
    kind: ListingActionKind;
    title: string;
    reasoning: string;
  };
}

interface RawSignals {
  product_id: string;
  title: string;
  status: string | null;
  price_cents: number | null;
  weight_grams: number | null;
  views: number;
  favorers: number;
  orders_lifetime: number;
  orders_30d: number;
  revenue_30d_cents: number;
  last_sale: string | null;
  ship_total: number;
  ship_cancelled: number;
  market: ListingHealth["market"];
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Tüm sinyalleri değerlendirip TEK bir önerilen aksiyon sentezler.
 * Öncelik sırası kritiktir — tedarik sorunu fiyattan, ölü listing tanıtımdan önce.
 */
function synthesize(s: RawSignals): ListingHealth["action"] {
  const cancelRate =
    s.ship_total >= 4 ? s.ship_cancelled / s.ship_total : null;
  const conv = s.views > 0 ? s.orders_lifetime / s.views : null;
  const sinceSale = daysSince(s.last_sale);
  const pos = s.market?.price_position ?? null;

  // 1) Tedarik/stok riski — her şeyden önce (Jade Gold stoksuz çalışıyor).
  if (cancelRate != null && cancelRate >= 0.4) {
    return {
      kind: "tedarik",
      title: "Önce tedarik/stok kararı",
      reasoning: `Bu ürünün SKU'larında son 12 ayda iptal oranı %${Math.round(cancelRate * 100)} (${s.ship_cancelled}/${s.ship_total}). Yüksek iptal = tedarik edilemiyor. Fiyatı değiştirmeden önce hangi varyantların stoğu olduğunu teyit et; temin edilemeyenleri pasifle. İndirim bu sorunu çözmez, iptali artırır.`,
    };
  }

  // 2) Ölü listing — kapat/pasifle.
  if (
    s.orders_lifetime <= 1 &&
    (sinceSale == null || sinceSale > 180) &&
    s.views < 1500
  ) {
    return {
      kind: "kapat",
      title: "Kapat / pasifle",
      reasoning: `Ömür boyu ${s.orders_lifetime} sipariş, ${s.views} görüntülenme${sinceSale != null ? `, son satış ${sinceSale} gün önce` : ", hiç satış yok"}. Düşük ilgi + satış yok → kaynak (görsel, reklam) harcamaya değmez; kapatmak ya da baştan elden geçirmek daha doğru.`,
    };
  }

  // 3) Fiyat — pazar bandı dışında (yeniden fiyatla).
  if (pos === "pahali" || pos === "ucuz") {
    return {
      kind: "fiyat",
      title: pos === "pahali" ? "Fiyatı düşür (bant üstü)" : "Fiyatı yükselt (bant altı)",
      reasoning:
        s.market?.recommendation ??
        `Pazar konumu: ${pos}. Önerilen fiyata göre güncelle.`,
    };
  }

  // 4) Fiyat bandında ama trafik/dönüşüm düşük — tanıt.
  if (pos === "bantta" || pos == null) {
    const lowTraffic = s.views < 5000 || (conv != null && conv < 0.005);
    if (s.orders_30d === 0 && (lowTraffic || s.favorers < 50)) {
      return {
        kind: "tanit",
        title: "Görünürlük / reklam",
        reasoning: `Fiyat ${pos === "bantta" ? "pazar bandında (rekabetçi)" : "değerlendirilemedi"}, ama son 30 günde satış yok${conv != null ? ` ve dönüşüm düşük (%${(conv * 100).toFixed(2)})` : ""}. Sorun fiyat değil görünürlük → hedefli/daraltılmış reklam ya da SEO (başlık/etiket) ile trafik artır. ${s.favorers > 300 ? `${s.favorers} favori birikmiş — retargeting güçlü aday.` : ""}`,
      };
    }
  }

  // 5) İyi gidiyor.
  if (s.orders_30d > 0) {
    return {
      kind: "koru",
      title: "İyi gidiyor — koru",
      reasoning: `Son 30 günde ${s.orders_30d} sipariş${s.revenue_30d_cents > 0 ? ` ($${(s.revenue_30d_cents / 100).toFixed(0)})` : ""}, fiyat ${pos === "bantta" ? "pazar bandında" : "makul"}. Aktif satıyor — dokunma; sadece stok yeterliliğini izle.`,
    };
  }

  return {
    kind: "incele",
    title: "İncele — veri yetersiz",
    reasoning: `Net bir sinyal yok (pazar konumu: ${pos ?? "yok"}, ömür ${s.orders_lifetime} sipariş). Ağırlık/anahtar kelime girip 'şimdi araştır' ile pazar konumunu netleştir.`,
  };
}

/** Bir listing için tüm sinyalleri + sentezlenmiş aksiyonu döndürür. */
export async function getListingHealth(
  productId: string,
): Promise<ListingHealth | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listing_health_signals", {
    p_product_id: productId,
  });
  if (error || !data) return null;
  const s = data as RawSignals;
  const cancel_rate =
    s.ship_total >= 4 ? s.ship_cancelled / s.ship_total : null;
  const conversion = s.views > 0 ? s.orders_lifetime / s.views : null;
  return {
    ...s,
    cancel_rate,
    conversion,
    action: synthesize(s),
  };
}
