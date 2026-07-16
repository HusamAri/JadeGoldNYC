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

export type SourceKind = "manual" | "csv" | "etsy" | "etsy_ledger" | "gold_auto";

export type SaleStatus =
  | "open"
  | "processing"
  | "paid"
  | "completed"
  | "shipped"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

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

/** Maliyete katlanan taraf (EON ortaklık yapısı): H | Y | I (I = doğrudan kârdan). */
export type CostBearer = "H" | "Y" | "I";

export interface CostCategory {
  id: string;
  org_id: string;
  key: string;
  label_tr: string;
  is_system: boolean;
  /** Bu kategorideki maliyetlere otomatik atanan taraf (boşsa atama yok). */
  default_bearer: CostBearer | null;
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
  /** Maliyete katlanan taraf; NULL = atanmamış (tek sahipli org'larda normal). */
  bearer: CostBearer | null;
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
  | "etsy.stock_push"
  | "etsy.variant_sync"
  | "etsy.image_upload"
  | "listing.archive"
  | "listing.delete_etsy"
  | "report.export"
  | "profile.update"
  | "org.created"
  | "shipstation.credentials";

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
  quantity: number | null;
  target_quantity: number | null;
  has_variations: boolean | null;
  image_url: string | null;
  views: number | null;
  num_favorers: number | null;
  /** Panel arşiv damgası — dolu = listelerden gizli (Arşiv filtresi hariç). */
  archived_at: string | null;
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
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StarSellerSnapshot {
  id: string;
  org_id: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  next_chance_on: string | null;
  message_response_rate: number | null;
  on_time_shipping_rate: number | null;
  avg_review_rating: number | null;
  low_review_count: number | null;
  case_count: number | null;
  order_count: number | null;
  note: string | null;
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

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "P0" | "P1" | "P2" | "P3";
export type TaskLane = "A" | "B" | "owner";

export interface Task {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  lane: TaskLane | null;
  assignee_id: string | null;
  effort: string | null;
  due_date: string | null;
  sort_order: number;
  notes: string | null;
  /** Süren görevin ilerleme yüzdesi (0-100); null = belirtilmedi. */
  progress: number | null;
  /** Görev ikon anahtarı (lib/task-style.ts TASK_ICONS). */
  icon: string | null;
  /** İsimlendirilmiş renk anahtarı (lib/task-style.ts TASK_COLORS). */
  color: string | null;
  /** Bu görevin çıktığı kaynak rapor (varsa) — bkz. `Report`. */
  report_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
}

/** Görev + atanan kullanıcının profil bilgisi (join kolaylığı). */
export interface TaskWithAssignee extends Task {
  assignee?: TaskAssignee | null;
}

export type TaskNoteKind = "note" | "handover";

export interface TaskNote {
  id: string;
  org_id: string;
  task_id: string;
  body: string;
  kind: TaskNoteKind;
  author_id: string | null;
  author_label: string | null;
  created_at: string;
}

// ── Raporlar (kayıtlı analiz raporları) ──────────────────────────────

/** Rapor gövdesindeki bir bulgu bölümü. */
export interface ReportFinding {
  heading: string;
  body: string;
}

/** KPI/istatistik kartı — önce/sonra veya tekil değer. */
export interface ReportStat {
  label: string;
  value: string;
  delta?: string;
  direction?: "up" | "down" | "flat";
}

/** Günlük zaman serisi noktası (ör. indirim % + sipariş adedi). */
export interface ReportTimelinePoint {
  date: string;
  discountPct: number;
  orders: number;
}

/** Yıldan yıla karşılaştırma noktası. */
export interface ReportYoyPoint {
  label: string;
  value: number;
  note?: string;
}

export type ReportTierKey = "reinstate" | "test" | "hold";

/** Bir kademedeki tek listing satırı; `taskId` doluysa Görevler'e bağlıdır. */
export interface ReportTierItem {
  title: string;
  priceCents: number;
  evidence: string;
  action: string;
  taskId?: string;
}

export interface ReportTier {
  key: ReportTierKey;
  label: string;
  note: string;
  items: ReportTierItem[];
}

/** `reports.content` JSONB'sinin şekli. */
export interface ReportContent {
  findings: ReportFinding[];
  stats: ReportStat[];
  timeline?: { points: ReportTimelinePoint[]; cutoffDate: string; cutoffLabel: string };
  yoy?: ReportYoyPoint[];
  tiers: ReportTier[];
  sourceNote?: string;
}

export interface Report {
  id: string;
  org_id: string;
  title: string;
  category: string;
  summary: string | null;
  content: ReportContent;
  report_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Rapor + o rapordan çıkan (bağlı) görevlerin canlı durumu. */
export interface ReportWithTasks extends Report {
  tasks: TaskWithAssignee[];
}

export interface ReportListItem {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  report_date: string;
  created_at: string;
  taskTotal: number;
  taskDone: number;
}
