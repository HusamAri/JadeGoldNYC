/**
 * Alan tipleri — Supabase şemasıyla (supabase/migrations) eşleşir.
 * Provizyon sonrası `supabase gen types` ile üretilen types/database.types.ts
 * bunları tamamlayabilir; sorgular bu tiplere cast eder.
 */

export type Role = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  etsy_shop_id: number | null;
  default_currency: string;
  created_at: string;
}

export interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: Role;
}

export type SourceKind = "manual" | "csv" | "etsy";

export type SaleStatus =
  | "paid"
  | "completed"
  | "shipped"
  | "cancelled"
  | "refunded";

export interface Sale {
  id: string;
  org_id: string;
  source: SourceKind;
  etsy_receipt_id: number | null;
  order_no: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  status: SaleStatus;
  order_date: string;
  ship_country: string | null;
  item_total_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  etsy_fees_cents: number;
  grand_total_cents: number;
  currency: string;
  csv_import_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  org_id: string;
  sale_id: string;
  product_id: string | null;
  etsy_transaction_id: number | null;
  title: string | null;
  sku: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
  created_at: string;
}

export interface CostCategory {
  id: string;
  org_id: string;
  key: string;
  label_tr: string;
  is_system: boolean;
}

export interface Cost {
  id: string;
  org_id: string;
  category_id: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  cost_date: string;
  vendor: string | null;
  sale_id: string | null;
  source: SourceKind;
  receipt_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // join kolaylığı
  category?: CostCategory | null;
}

export type AuditAction =
  | "insert"
  | "update"
  | "delete"
  | "auth.login"
  | "auth.logout"
  | "csv.import"
  | "etsy.connect"
  | "etsy.sync"
  | "report.export"
  | "profile.update";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface AuditLog {
  id: string;
  org_id: string;
  actor_id: string | null;
  actor_label: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  summary: string | null;
  diff: unknown;
  source: string;
  ip: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  org_id: string;
  etsy_listing_id: number | null;
  sku: string | null;
  title: string;
  status: string | null;
  price_cents: number | null;
  currency: string;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Design {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: string;
  product_id: string | null;
  storage_bucket: string;
  storage_path: string | null;
  thumbnail_path: string | null;
  tags: string[] | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = "yeni" | "yanitlandi" | "isaretli";

export interface Review {
  id: string;
  org_id: string;
  etsy_review_id: string | null;
  product_id: string | null;
  sale_id: string | null;
  rating: number | null;
  review_text: string | null;
  language: string | null;
  buyer_name: string | null;
  review_date: string | null;
  source: SourceKind;
  status: ReviewStatus;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsvImport {
  id: string;
  org_id: string;
  module: string;
  filename: string | null;
  file_path: string | null;
  mapping_template: string | null;
  status: string;
  row_count: number;
  imported_count: number;
  skipped_count: number;
  error_log: unknown;
  raw_preview: unknown;
  created_by: string | null;
  created_at: string;
  committed_at: string | null;
}

export interface EtsyConnectionStatus {
  status: "connected" | "expired" | "revoked" | "disconnected";
  shop_id: number | null;
  last_sync_at: string | null;
  expires_at: string | null;
}

export interface ShopMetric {
  id: string;
  org_id: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  visits: number | null;
  orders: number | null;
  revenue_cents: number | null;
  cart_abandon_amount_cents: number | null;
  cart_abandon_count: number | null;
  rating: number | null;
  ads_spend_cents: number | null;
  ads_revenue_cents: number | null;
  traffic_sources: Record<string, number> | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductMetric {
  id: string;
  org_id: string;
  product_id: string | null;
  period_label: string;
  product_title: string;
  sku: string | null;
  views: number | null;
  orders: number | null;
  revenue_cents: number | null;
  ads_clicks: number | null;
  ads_spend_cents: number | null;
  ads_revenue_cents: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CartRecoveryStatus = "yeni" | "iletildi" | "kazanildi" | "kayip";

export interface CartRecovery {
  id: string;
  org_id: string;
  buyer_name: string | null;
  buyer_email: string | null;
  cart_value_cents: number | null;
  item_summary: string | null;
  abandoned_at: string | null;
  status: CartRecoveryStatus;
  action_taken: string | null;
  incentive: string | null;
  recovered_value_cents: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
