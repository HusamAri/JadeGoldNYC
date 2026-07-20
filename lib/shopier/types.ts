/**
 * Shopier PAT REST API yanıt şekilleri — SAVUNMACI tipler: resmi şema
 * dokümanı bot korumalıdır; alanlar topluluk SDK'sının (api.shopier.com/v1
 * sözleşmesi) tip haritasından alınmıştır ve hepsi opsiyonel işlenir.
 * Para alanları STRING ondalıktır ("149.90") — parseMoneyToCents ile cent'e.
 */

export interface ShopierOrderTotals {
  subtotal?: string;
  shipping?: string;
  discount?: string;
  total?: string;
}

export interface ShopierAddressInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}

export interface ShopierOrderLineItem {
  productId?: string;
  title?: string;
  quantity?: number;
  price?: string;
  total?: string;
}

export interface ShopierRefundSummary {
  id?: string;
  type?: "partial" | "full" | string;
  status?: string;
}

export interface ShopierOrder {
  id: string;
  status?: "fulfilled" | "unfulfilled" | string;
  paymentStatus?: "paid" | "unpaid" | string;
  dateCreated?: string;
  currency?: string;
  totals?: ShopierOrderTotals;
  shippingInfo?: ShopierAddressInfo;
  billingInfo?: ShopierAddressInfo;
  note?: string;
  lineItems?: ShopierOrderLineItem[];
  refunds?: ShopierRefundSummary[];
}

export interface ShopierShopOwner {
  [key: string]: unknown;
}
