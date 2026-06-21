import type { SaleStatus, CartRecoveryStatus, ReviewStatus } from "@/lib/types";

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
  cart_recoveries: "Sepet kurtarma",
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

export const DEFAULT_CURRENCY = "USD";
