import type {
  SaleStatus,
  CartRecoveryStatus,
  ReviewStatus,
  TaskStatus,
  TaskPriority,
  TaskLane,
  Role,
} from "@/lib/types";

/** Sistem maliyet kategorileri (0006 + 0018 seed ile eşleşir). */
export const COST_CATEGORIES = [
  { key: "malzeme", label_tr: "Malzeme" },
  { key: "kargo", label_tr: "Kargo" },
  { key: "paketleme", label_tr: "Paketleme" },
  { key: "yol_ulasim", label_tr: "Yol / Ulaşım" },
  { key: "etsy_ucretleri", label_tr: "Etsy Ücretleri" },
  { key: "reklam", label_tr: "Reklam" },
  { key: "iscilik", label_tr: "İşçilik" },
  { key: "diger", label_tr: "Diğer" },
] as const;

/** Satış durumları ve Türkçe etiketleri. */
export const SALE_STATUSES: { value: SaleStatus; label: string }[] = [
  { value: "paid", label: "Ödendi" },
  { value: "completed", label: "Tamamlandı" },
  { value: "shipped", label: "Kargolandı" },
  { value: "cancelled", label: "İptal" },
  { value: "refunded", label: "İade" },
];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = Object.fromEntries(
  SALE_STATUSES.map((s) => [s.value, s.label]),
) as Record<SaleStatus, string>;

/** Tasarım durumları (placeholder modül). */
export const DESIGN_STATUSES = [
  { value: "taslak", label: "Taslak" },
  { value: "onaylandi", label: "Onaylandı" },
  { value: "yayinda", label: "Yayında" },
  { value: "arsiv", label: "Arşiv" },
] as const;

/** Yorum durumları ve Türkçe etiketleri. */
export const REVIEW_STATUSES: { value: ReviewStatus; label: string }[] = [
  { value: "yeni", label: "Yeni" },
  { value: "yanitlandi", label: "Yanıtlandı" },
  { value: "isaretli", label: "İşaretli" },
];

export const REVIEW_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  REVIEW_STATUSES.map((s) => [s.value, s.label]),
);

/** Denetim logu kaynakları için Türkçe etiketler. */
export const AUDIT_SOURCE_LABELS: Record<string, string> = {
  app: "Uygulama",
  trigger: "Otomatik",
  etsy: "Etsy",
  csv: "CSV",
  system: "Sistem",
};

/** Denetim logu eylemleri için Türkçe etiketler. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  insert: "Oluşturuldu",
  update: "Güncellendi",
  delete: "Silindi",
  "auth.login": "Giriş yapıldı",
  "auth.logout": "Çıkış yapıldı",
  "csv.import": "CSV içe aktarıldı",
  "etsy.connect": "Etsy bağlandı",
  "etsy.sync": "Etsy senkronizasyonu",
  "report.export": "Rapor dışa aktarıldı",
};

/** Varlık tipleri için Türkçe etiketler (denetim logu görünümü). */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  sales: "Satış",
  sale_items: "Satış kalemi",
  costs: "Maliyet",
  products: "Ürün",
  designs: "Tasarım",
  reviews: "Yorum",
  etsy_connection: "Etsy bağlantısı",
  csv_import: "CSV içe aktarma",
  shop_metrics: "Performans",
  product_metrics: "Ürün performansı",
  cart_recoveries: "Müşteri geri kazanım",
  tasks: "Görev",
  task_notes: "Görev notu",
  auth: "Oturum",
  report: "Rapor",
};

/** Sepet kurtarma durumları. */
export const CART_STATUSES: { value: CartRecoveryStatus; label: string }[] = [
  { value: "yeni", label: "Yeni" },
  { value: "iletildi", label: "İletildi" },
  { value: "kazanildi", label: "Kazanıldı" },
  { value: "kayip", label: "Kayıp" },
];

export const CART_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  CART_STATUSES.map((s) => [s.value, s.label]),
);

/** Görev durumları (Kanban sütunları) ve Türkçe etiketleri. */
export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Yapılacak" },
  { value: "doing", label: "Devam Ediyor" },
  { value: "done", label: "Tamamlandı" },
];

export const TASK_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  TASK_STATUSES.map((s) => [s.value, s.label]),
);

/** Görev öncelikleri (turnaround planı P0–P3). */
export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "P0", label: "P0 · Bu hafta" },
  { value: "P1", label: "P1 · 2–4 hafta" },
  { value: "P2", label: "P2 · 4–8 hafta" },
  { value: "P3", label: "P3 · Sürekli" },
];

export const TASK_PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  TASK_PRIORITIES.map((s) => [s.value, s.label]),
);

/** Operatör şeritleri (iki-operatör bölüşümü). */
export const TASK_LANES: { value: TaskLane; label: string }[] = [
  { value: "A", label: "A · Büyüme & Görünürlük" },
  { value: "B", label: "B · Dönüşüm & Marka" },
  { value: "owner", label: "Sahip Onayı" },
];

export const TASK_LANE_LABELS: Record<string, string> = Object.fromEntries(
  TASK_LANES.map((s) => [s.value, s.label]),
);

/** Şerit için kısa etiket (kart üzerinde). */
export const TASK_LANE_SHORT: Record<string, string> = {
  A: "A · Büyüme",
  B: "B · Dönüşüm",
  owner: "Onay",
};

/** Organizasyon rolleri ve Türkçe etiketleri (Ekip sayfası). */
export const ROLES: { value: Role; label: string }[] = [
  { value: "owner", label: "Sahip" },
  { value: "admin", label: "Yönetici" },
  { value: "member", label: "Üye" },
];

export const ROLE_LABELS: Record<Role, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
) as Record<Role, string>;

export const DEFAULT_CURRENCY = "USD";
