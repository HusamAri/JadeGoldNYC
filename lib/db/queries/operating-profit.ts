import { createClient } from "@/lib/supabase/server";

/**
 * İşletme kârı (EBITDA yaklaşığı) — aylık seri (0097 RPC'si).
 *
 * Fiyat motoru sipariş-başı katkı marjını garanti eder; bu sorgu işletme
 * SEVİYESİNİ anlatır: gelir − değişken maliyet = katkı; katkı − sabit gider
 * = işletme kârı (bu ölçekte faiz/vergi/amortisman ihmal → EBITDA yaklaşığı).
 * Sınıflandırma kategoride taşınır (`cost_categories.is_fixed`); yalnız USD
 * satırları toplanır, USD-dışı kayıt sayısı uyarı için ayrıca döner.
 */
export interface OperatingMonth {
  month: string; // "YYYY-MM"
  revenue_cents: number;
  orders: number;
  variable_cents: number;
  fixed_cents: number;
  uncategorized_cents: number;
  /** Türetilmiş: gelir − değişken (kategorisiz DAHİL DEĞİL — ayrı gösterilir). */
  contribution_cents: number;
  /** Türetilmiş: katkı − sabit. */
  ebitda_cents: number;
  /** Sabit gideri karşılamak için gereken sipariş adedi (o ayın ortalama
   *  sipariş katkısıyla); katkı ≤ 0 ya da sipariş yoksa null. */
  breakeven_orders: number | null;
}

export interface OperatingProfitSeries {
  months: OperatingMonth[];
  /** Org varsayılanı dışı satış kaydı (toplama girmez). */
  salesNonUsd: number;
  /** Org varsayılanı dışı maliyet kaydı (toplama girmez). */
  costsNonUsd: number;
  /** Toplamların para birimi — organizations.default_currency. */
  currency: string;
  /** RPC henüz kurulu değilse (migration 0097 uygulanmamış) false döner. */
  available: boolean;
}

interface RpcMonth {
  month: string;
  revenue_cents: number;
  orders: number;
  variable_cents: number;
  fixed_cents: number;
  uncategorized_cents: number;
}

export async function getOperatingProfitSeries(
  orgId: string,
  months = 6,
): Promise<OperatingProfitSeries> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("operating_profit_monthly", {
    p_org: orgId,
    p_months: months,
  });
  if (error || !data) {
    // Migration 0097 uygulanmadıysa kart boş durumda kalır; hata yutulmaz.
    if (error) console.error("operating_profit_monthly:", error.message);
    return { months: [], salesNonUsd: 0, costsNonUsd: 0, currency: "USD", available: false };
  }
  const payload = data as {
    months: RpcMonth[] | null;
    sales_non_usd: number;
    costs_non_usd: number;
    currency?: string;
  };
  const rows = (payload.months ?? []).map((m) => {
    const contribution = m.revenue_cents - m.variable_cents;
    const ebitda = contribution - m.fixed_cents;
    const avgContribution = m.orders > 0 ? contribution / m.orders : 0;
    return {
      ...m,
      contribution_cents: contribution,
      ebitda_cents: ebitda,
      breakeven_orders:
        avgContribution > 0
          ? Math.ceil(m.fixed_cents / avgContribution)
          : null,
    } satisfies OperatingMonth;
  });
  return {
    months: rows,
    salesNonUsd: payload.sales_non_usd ?? 0,
    costsNonUsd: payload.costs_non_usd ?? 0,
    currency: payload.currency ?? "USD",
    available: true,
  };
}
