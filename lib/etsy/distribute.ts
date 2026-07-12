/**
 * Varyant değer dağıtımı — beden/ağırlık örüntüsünden eksik varyantları doldurur.
 *
 * İki ayrı örüntü (gerçek Etsy verisinden tersine mühendislikle doğrulandı):
 *
 *  1) AĞIRLIK ↔ BEDEN: Ağırlık, bedenle (zincir/kolye/bileklik uzunluğu inç,
 *     hoop çapı mm) SIFIRDAN GEÇEN doğrusal ilişkidedir: `w = k · beden`.
 *     Ölçüm (JG verisi): zincir r̄²≈0.90, bileklik ≈0.88; noktaların ~%88'i
 *     ≤%5 hata. Yüzük/küpe bedenleri güvenilmez → yalnız grup-içi doğrusal
 *     regresyon (r² kapısı) ile.
 *
 *  2) FİYAT ↔ AĞIRLIK: Fiyat bedenle DEĞİL, AĞIRLIKLA doğrusaldır ve bir
 *     işçilik SABİTİ (intercept) taşır: `fiyat = gram_fiyatı · ağırlık + işçilik`.
 *     Ölçüm (JG verisi): listing içi medyan r²(fiyat,ağırlık)=0.97 (%75 listing
 *     ≥0.90), buna karşın r²(fiyat,beden)=0.19. Yani fiyat dağıtımı ağırlık
 *     üzerinden yapılmalı — bu yüzden önce ağırlık çıkarımı beslenir.
 */

export interface DistVariant {
  sku: string;
  weightGrams?: number | null;
  priceCents?: number | null;
}

/** Uzunluk/çap ile ölçeklenen (sıfırdan geçen) kategoriler — SKU ilk harfi. */
const LENGTH_CATEGORIES = new Set(["C", "N", "B", "P"]);

export interface SkuParts {
  stem: string;
  size: number | null;
  category: string;
}

/** SKU'yu gövde (stil) + son sayısal beden + kategori (ilk harf) olarak ayırır. */
export function parseSkuParts(sku: string): SkuParts {
  const m = sku.match(/-(\d+(?:\.\d+)?)$/);
  const size = m ? parseFloat(m[1]) : null;
  const stem = m ? sku.replace(/-\d+(?:\.\d+)?$/, "") : sku;
  return { stem, size, category: (sku[0] ?? "").toUpperCase() };
}

type Pt = { x: number; y: number };

/** En küçük kareler doğrusal uyum: y = a·x + b (+ r²). */
function linreg(pts: Pt[]): { a: number; b: number; r2: number } | null {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0,
    sy = 0,
    sxx = 0,
    sxy = 0,
    syy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
    syy += p.y * p.y;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  const ssTot = syy - (sy * sy) / n;
  const ssRes = pts.reduce((s, p) => s + (p.y - (a * p.x + b)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { a, b, r2 };
}

/** Sıfırdan geçen orantı katsayısı: k = Σ(x·y)/Σ(x²). */
function proportional(pts: Pt[]): number | null {
  let sxy = 0,
    sxx = 0;
  for (const p of pts) {
    sxy += p.x * p.y;
    sxx += p.x * p.x;
  }
  return sxx > 0 ? sxy / sxx : null;
}

export type Confidence = "high" | "medium" | "low";

export interface WeightPrediction {
  sku: string;
  weightGrams: number;
  model: "linear" | "proportional";
  confidence: Confidence;
}

/**
 * Eksik varyant ağırlıklarını bedenden çıkarır. Girdi TEK bir listing'in tüm
 * varyantlarıdır. Grup = aynı stil (stem). Model seçimi:
 *   • ≥3 bilinen & r²≥0.90 → grup-içi doğrusal (yüzük/küpe dâhil, kapıyı geçerse)
 *   • =2 bilinen (uzunluk kategorisi) → doğrusal ara-değer
 *   • =1 bilinen (uzunluk kategorisi, makul beden) → sıfırdan geçen orantı
 * Aşırı ekstrapolasyon ve ≤0 değerler elenir. Yalnız ağırlığı boş + bedeni olan
 * varyantlar için tahmin döner.
 */
export function inferWeightsBySize(variants: DistVariant[]): WeightPrediction[] {
  const groups = new Map<string, { v: DistVariant; p: SkuParts }[]>();
  for (const v of variants) {
    const p = parseSkuParts(v.sku);
    if (p.size == null) continue; // bedensiz (temel/renk SKU) → çıkarılamaz
    const arr = groups.get(p.stem) ?? [];
    arr.push({ v, p });
    groups.set(p.stem, arr);
  }

  const out: WeightPrediction[] = [];
  for (const [, items] of groups) {
    const cat = items[0].p.category;
    const known = items.filter(
      (i) => i.v.weightGrams != null && i.v.weightGrams > 0,
    );
    const missing = items.filter((i) => i.v.weightGrams == null);
    if (known.length === 0 || missing.length === 0) continue;

    const pts: Pt[] = known.map((i) => ({
      x: i.p.size as number,
      y: i.v.weightGrams as number,
    }));
    const sizes = pts.map((p) => p.x);
    const mins = Math.min(...sizes);
    const maxs = Math.max(...sizes);

    let predict: ((s: number) => number) | null = null;
    let model: WeightPrediction["model"] = "proportional";
    let confidence: Confidence = "medium";

    const reg = linreg(pts);
    if (known.length >= 3 && reg && reg.r2 >= 0.9) {
      predict = (s) => reg.a * s + reg.b;
      model = "linear";
      confidence = reg.r2 >= 0.97 ? "high" : "medium";
    } else if (known.length === 2 && LENGTH_CATEGORIES.has(cat) && reg) {
      predict = (s) => reg.a * s + reg.b;
      model = "linear";
      confidence = "medium";
    } else if (known.length === 1 && LENGTH_CATEGORIES.has(cat)) {
      const s0 = pts[0].x;
      const okChain = (cat === "C" || cat === "B" || cat === "N") && s0 >= 7;
      const okNeck = cat === "P" && s0 >= 13;
      if (okChain || okNeck) {
        const k = proportional(pts);
        if (k) {
          predict = (s) => k * s;
          model = "proportional";
          confidence = "low";
        }
      }
    }
    if (!predict) continue;

    for (const i of missing) {
      const s = i.p.size as number;
      // orantı modeli sıfırdan geçtiği için aralık dışına da güvenli; doğrusal
      // modelde aşırı ekstrapolasyonu sınırla.
      if (model === "linear" && !(s >= mins * 0.5 && s <= maxs * 1.7)) continue;
      const g = Math.round(predict(s) * 100) / 100;
      if (g > 0.04) out.push({ sku: i.v.sku, weightGrams: g, model, confidence });
    }
  }
  return out;
}

/** Ayar → saf altın oranı (fiyat/gram türetimi için). */
export function karatPurity(karat: number): number {
  return Math.max(0, Math.min(1, karat / 24));
}

export interface PriceDistOptions {
  /** Tek fiyat noktasından dağıtım için gram başına altın maliyeti (USD/g). */
  goldSpotPerGramUsd?: number;
  /** Ayar (ör. 10, 14) — pürite goldSpotPerGramUsd ile çarpılır. */
  karat?: number;
  /** Melt üzerine çarpan (işçilik/kâr) — tek nokta senaryosu. Vars. 2.5. */
  markup?: number;
}

export interface PricePrediction {
  sku: string;
  priceCents: number;
  model: "weight-linear" | "weight-proportional";
  confidence: Confidence;
}

/**
 * Eksik varyant FİYATLARINI AĞIRLIKTAN dağıtır (fiyat = gram_fiyatı·ağırlık +
 * işçilik). Girdi tek listing'in varyantları; ağırlıkları dolu olmalı (önce
 * inferWeightsBySize ile beslenebilir).
 *   • ≥2 bilinen fiyat → (ağırlık, fiyat) doğrusal uyum → gram_fiyatı + işçilik
 *   • =1 bilinen fiyat → gram_fiyatı = spot·pürite·markup; işçilik o noktadan
 *     çözülür; kalanlar dağıtılır.
 */
export function distributePriceByWeight(
  variants: DistVariant[],
  opts: PriceDistOptions = {},
): PricePrediction[] {
  const withW = variants.filter((v) => v.weightGrams != null && v.weightGrams > 0);
  const known = withW.filter((v) => v.priceCents != null && v.priceCents > 0);
  const targets = withW.filter((v) => v.priceCents == null);
  if (targets.length === 0) return [];

  let ppgCents: number | null = null; // gram başına fiyat (cent)
  let laborCents = 0;
  let model: PricePrediction["model"] = "weight-linear";
  let confidence: Confidence = "medium";

  if (known.length >= 2) {
    const reg = linreg(
      known.map((v) => ({ x: v.weightGrams as number, y: v.priceCents as number })),
    );
    if (!reg) return [];
    ppgCents = reg.a;
    laborCents = reg.b;
    confidence = reg.r2 >= 0.95 ? "high" : reg.r2 >= 0.85 ? "medium" : "low";
    if (reg.r2 < 0.6) return []; // fiyat ağırlıkla açıklanmıyor → dağıtma
  } else if (known.length === 1 && opts.goldSpotPerGramUsd && opts.karat) {
    const purity = karatPurity(opts.karat);
    const markup = opts.markup ?? 2.5;
    ppgCents = opts.goldSpotPerGramUsd * purity * markup * 100;
    const k0 = known[0];
    laborCents = (k0.priceCents as number) - ppgCents * (k0.weightGrams as number);
    model = "weight-proportional";
    confidence = "low";
  } else {
    return [];
  }

  const out: PricePrediction[] = [];
  for (const t of targets) {
    const cents = Math.round(ppgCents * (t.weightGrams as number) + laborCents);
    if (cents > 0) out.push({ sku: t.sku, priceCents: cents, model, confidence });
  }
  return out;
}
