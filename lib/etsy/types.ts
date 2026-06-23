export interface EtsyListResponse<T> {
  count: number;
  results: T[];
}

export interface EtsyMoney {
  amount: number;
  divisor: number;
  currency_code: string;
}

export interface EtsyTransaction {
  transaction_id: number;
  title?: string;
  sku?: string;
  quantity?: number;
  price?: EtsyMoney;
  listing_id?: number;
  product_id?: number;
}

export interface EtsyReceipt {
  receipt_id: number;
  name?: string;
  buyer_email?: string;
  created_timestamp?: number;
  grandtotal?: EtsyMoney;
  subtotal?: EtsyMoney;
  total_shipping_cost?: EtsyMoney;
  total_tax_cost?: EtsyMoney;
  discount_amt?: EtsyMoney;
  country_iso?: string;
  status?: string;
  transactions?: EtsyTransaction[];
}

export interface EtsyListing {
  listing_id: number;
  title?: string;
  description?: string;
  sku?: string[];
  state?: string;
  price?: EtsyMoney;
  url?: string;
  tags?: string[];
  materials?: string[];
  quantity?: number;
  has_variations?: boolean;
  featured_rank?: number;
  last_modified_timestamp?: number;
  images?: { listing_image_id?: number }[];
}

export interface EtsyReview {
  listing_id?: number;
  transaction_id?: number;
  rating?: number;
  review?: string;
  language?: string;
  create_timestamp?: number;
  created_timestamp?: number;
}

export interface EtsyLedgerEntry {
  entry_id: number;
  ledger_id?: number;
  // Ücret türü ipuçları (Etsy değerleri belgesiz; ham saklanır, sonra eşlenir).
  ledger_type?: string;
  reference_type?: string;
  reference_id?: string | number | null;
  description?: string;
  amount?: number; // tam sayı, minor unit (cent)
  currency?: string;
  balance?: number;
  create_date?: number;
  created_timestamp?: number;
}

export interface EtsyShop {
  shop_id: number;
  shop_name?: string;
}

export interface EtsyUser {
  user_id: number;
  shop_id?: number;
}

/** Etsy para nesnesini cent'e çevirir. */
export function etsyMoneyToCents(m?: EtsyMoney | null): number {
  if (!m || !m.amount || !m.divisor) return 0;
  return Math.round((m.amount / m.divisor) * 100);
}
