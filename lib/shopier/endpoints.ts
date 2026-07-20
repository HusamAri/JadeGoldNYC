export const SHOPIER_API_BASE = "https://api.shopier.com/v1";

export const shopierPaths = {
  /** Bağlantı testi — mağaza sahibi bilgisi (sır değil). */
  shopOwner: () => `/shop/owner`,
  /** Sipariş listesi — limit/page/sort(dateAsc|dateDesc)/dateStart/dateEnd. */
  orders: () => `/orders`,
  order: (orderId: string) => `/orders/${encodeURIComponent(orderId)}`,
};
