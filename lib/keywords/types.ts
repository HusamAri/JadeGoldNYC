/** Anahtar kelime araştırma katmanı — sağlayıcıdan bağımsız tipler. */

export type KeywordSource =
  | "rule"
  | "ai"
  | "dataforseo"
  | "google_ads"
  | "etsy"
  | "manual";

/** Tek bir aday anahtar kelime + (varsa) talep metrikleri + panel skoru. */
export interface KeywordCandidate {
  keyword: string;
  source: KeywordSource;
  /** Aylık arama hacmi — talep kaynağı bağlı değilse null. */
  searchVolume: number | null;
  /** Rekabet 0..1 — bağlı değilse null. */
  competition: number | null;
  /** Tahmini tıklama başı maliyet (cent) — opsiyonel. */
  cpcCents: number | null;
  /** Panel fırsat skoru 0..100 (kural bazlı; hacim varsa hacim×(1-rekabet)). */
  score: number;
}

/** Araştırma girdisi: serbest tohum ve/veya ürün bağlamı. */
export interface KeywordResearchInput {
  seed: string;
  productTitle?: string | null;
  productTags?: string[] | null;
}
