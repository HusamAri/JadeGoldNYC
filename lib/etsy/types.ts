export interface EtsyListResponse<T> {
  count: number;
  results: T[];
}

export interface EtsyMoney {
  amount: number;
  divisor: number;
  currency_code: string;
}

/** Kalem varyasyonu (ShopReceiptTransaction.variations[]). */
export interface EtsyTransactionVariation {
  property_id?: number;
  value_id?: number;
  formatted_name?: string;
  formatted_value?: string;
}

export interface EtsyTransaction {
  transaction_id: number;
  title?: string;
  sku?: string;
  quantity?: number;
  price?: EtsyMoney;
  listing_id?: number;
  product_id?: number;
  // 2026-11 (0138): kalem seviyesindeki kalan alanlar — kalem K/Z + etiket
  // bağlama (shipped_timestamp ↔ ledger etiket anı) için.
  shipping_cost?: EtsyMoney;
  is_digital?: boolean;
  variations?: EtsyTransactionVariation[];
  paid_timestamp?: number | null;
  shipped_timestamp?: number | null;
  expected_ship_date?: number | null;
  /** Kupon tutarları — Etsy bunları SAYI (dolar cinsinden float) döndürür. */
  buyer_coupon?: number;
  shop_coupon?: number;
}

/** receipt.refunds[] — ShopRefund (kimliği yoktur; (an, tutar) doğal anahtar). */
export interface EtsyRefund {
  amount?: EtsyMoney;
  created_timestamp?: number;
  reason?: string | null;
  note_from_issuer?: string | null;
  status?: string | null;
}

/** receipt.shipments[] — ShopReceiptShipment (etiket id/maliyet TAŞIMAZ). */
export interface EtsyShipment {
  receipt_shipping_id?: number | null;
  shipment_notification_timestamp?: number;
  carrier_name?: string | null;
  tracking_code?: string | null;
}

export interface EtsyReceipt {
  receipt_id: number;
  name?: string;
  buyer_email?: string;
  buyer_user_id?: number;
  created_timestamp?: number;
  updated_timestamp?: number;
  update_timestamp?: number;
  is_paid?: boolean;
  is_shipped?: boolean;
  grandtotal?: EtsyMoney;
  subtotal?: EtsyMoney;
  total_price?: EtsyMoney;
  total_shipping_cost?: EtsyMoney;
  total_tax_cost?: EtsyMoney;
  total_vat_cost?: EtsyMoney;
  discount_amt?: EtsyMoney;
  gift_wrap_price?: EtsyMoney;
  is_gift?: boolean;
  needs_gift_wrap?: boolean;
  message_from_buyer?: string | null;
  payment_method?: string | null;
  country_iso?: string;
  city?: string | null;
  state?: string | null;
  status?: string;
  transactions?: EtsyTransaction[];
  refunds?: EtsyRefund[];
  shipments?: EtsyShipment[];
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
  views?: number;
  num_favorers?: number;
  last_modified_timestamp?: number;
  /** Listing'in bulunduğu mağaza bölümü (vitrin yerleşimi). */
  shop_section_id?: number;
  images?: { listing_image_id?: number; url_570xN?: string }[];
}

export interface EtsyReview {
  listing_id?: number;
  transaction_id?: number;
  rating?: number;
  review?: string;
  language?: string;
  create_timestamp?: number;
  created_timestamp?: number;
  // Alıcı yorumu düzenlerse ilerler — yanıtımızdan sonraki değişikliği yakalar.
  update_timestamp?: number;
  updated_timestamp?: number;
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
  // getShop — mağaza sağlık fotoğrafında kullanılan alanlar
  num_favorers?: number;
  review_average?: number;
  review_count?: number;
  listing_active_count?: number;
  transaction_sold_count?: number;
  is_vacation?: boolean;
  announcement?: string | null;
  url?: string;
  currency_code?: string;
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

// ── Envanter (inventory / offerings) — stok senkronizasyonu ────────────
// Etsy'de adet, liste düzeyinde DEĞİL her "offering" (varyant kombinasyonu)
// düzeyinde tutulur. Adet güncellemek için önce GET /listings/{id}/inventory
// ile tüm yapı okunur, yalnız hedef offering'in quantity'si değiştirilir ve
// tüm products dizisi PUT ile geri yazılır (Etsy kısmi güncelleme kabul etmez).

export interface EtsyOffering {
  offering_id?: number;
  quantity?: number;
  is_enabled?: boolean;
  is_deleted?: boolean;
  price?: EtsyMoney;
}

export interface EtsyPropertyValue {
  property_id: number;
  property_name?: string;
  scale_id?: number | null;
  scale_name?: string | null;
  value_ids?: number[];
  values?: string[];
}

export interface EtsyInventoryProduct {
  product_id?: number;
  sku?: string;
  is_deleted?: boolean;
  offerings?: EtsyOffering[];
  property_values?: EtsyPropertyValue[];
}

export interface EtsyInventory {
  products: EtsyInventoryProduct[];
  price_on_property?: number[];
  quantity_on_property?: number[];
  sku_on_property?: number[];
}

// PUT payload'ı — Etsy salt-okunur alanları (product_id, offering_id,
// scale_name, is_deleted, property_name) reddettiği için ayrı, dar tipler.
export interface EtsyOfferingUpdate {
  price: number; // float (amount/divisor)
  quantity: number;
  is_enabled: boolean;
  /**
   * Etsy 2025 envanter modeli: `?legacy=false` ile PUT edilen fiziksel
   * listing'lerde HER offering'in işlem profili (readiness state) olmalı
   * ("All offerings need readiness state"). Legacy (eski) PUT'ta gönderilmez.
   */
  readiness_state_id?: number;
}

export interface EtsyPropertyValueUpdate {
  property_id: number;
  /**
   * 2025 envanter PUT'u (`?legacy=false`) property_name'i STRING olarak ister
   * ("Expected string value for 'property_name' (got NULL)"). GET envanterinden
   * korunur; legacy PUT'ta gönderilmese de zararsızdır.
   */
  property_name?: string;
  value_ids: number[];
  values: string[];
  scale_id?: number;
}

export interface EtsyProductUpdate {
  sku: string;
  property_values: EtsyPropertyValueUpdate[];
  offerings: EtsyOfferingUpdate[];
}

export interface EtsyInventoryUpdate {
  products: EtsyProductUpdate[];
  price_on_property?: number[];
  quantity_on_property?: number[];
  sku_on_property?: number[];
  /** 2025 modeli: işlem profili hiçbir property'ye göre değişmiyorsa []. */
  readiness_state_on_property?: number[];
}

/** Etsy para nesnesini float birime çevirir (PUT offering.price için). */
export function etsyMoneyToUnit(m?: EtsyMoney | null): number {
  if (!m || !m.amount || !m.divisor) return 0;
  return Math.round((m.amount / m.divisor) * 100) / 100;
}

/** Mağaza bölümü (getShopSections). */
export interface EtsyShopSection {
  shop_section_id?: number;
  title?: string;
  rank?: number;
  active_listing_count?: number;
}

/** Kargo profili (getShopShippingProfiles) — profil düzeyi alanlar. */
export interface EtsyShippingProfile {
  shipping_profile_id?: number;
  title?: string;
  min_processing_days?: number;
  max_processing_days?: number;
  processing_days_display_label?: string;
  origin_country_iso?: string;
  origin_postal_code?: string;
}
