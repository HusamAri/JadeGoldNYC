/**
 * Listing AÇIKLAMASINDAKİ "Average Weight" bloklarından varyant gramajı çıkarımı.
 *
 * Satıcı açıklamaları serbest metin ama tekrar eden kalıplar taşır:
 *   A) "25mm X 2mm"   + sonraki satır "Weight: 1.55g" (g'siz de olur)
 *   B) "15mm X 4mm 2.30 grams" / "16 X 6mm 3.25 grams" (ilk boyut birimsiz)
 *   C) "2.5mm - 3.50 grams"  (başlıkta "Based on 18\"" zincir/bileklik bazı)
 *   D) "1.70 grams" + sonraki satır "Length: 1\"" ya da "Length: 25mm"
 *   E) "Height: 36mm 1.5\"" + sonraki satır "3.80 grams"
 *   F) "Small 30mm 0.61 grams" (isimli beden) · "Style 1 = 20mm - 5 grams"
 *   G) "20\" = 3mm - 5.60 grams" (uzunluk + kalınlık + gram tek satırda)
 *   H) "16\" 2.64 grams" (uzunluk tablosu) — çoğu kez "With ... Chain" bölümünde
 *   I) Tek ağırlık: "5 grams" (+ "Length: 7.5\"" gibi sabit ölçüler)
 *
 * Bölüm başlıkları ("Pendant Average Weight", "For Chain", "Based on Size 10")
 * ayrı tablolar açar; eşleştirme bölüm bilgisine saygı duyar.
 */

// ── Tipler ────────────────────────────────────────────────────────────────

export interface DescWeightEntry {
  grams: number;
  /** Birincil mm boyutu (çap/genişlik; "25mm X 2mm"de 25). */
  mm: number | null;
  /** İkincil mm boyutu (kalınlık; "25mm X 2mm"de 2). */
  mm2: number | null;
  /** İnç uzunluğu (zincir/bileklik satırı ya da Length satırı). */
  inch: number | null;
  /** Satırın kendisi uzunluk bazı taşımıyorsa bölüm başlığındaki baz ("Based on 18\""). */
  baseInch: number | null;
  styleNum: number | null;
  sizeLabel: string | null; // small/medium/large
  /** Bölüm ipucu: 'pendant' | 'chain' | null */
  section: string | null;
}

export interface VariantSizeInfo {
  mm: number[];
  inch: number[];
  styleNum: number | null;
  sizeLabel: string | null;
  /** Yüzük bedeni gibi çıplak sayı (scale Inches DEĞİLSE). */
  bareNums: number[];
  pendantOnly: boolean;
}

export interface WeightMatch {
  grams: number;
  /** true = açıklamadaki birebir satır; false = uzunluk oranıyla ölçeklendi. */
  exact: boolean;
}

// ── Yardımcılar ───────────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/gi, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/[″”]/g, '"');
}

/** "1 1/2" → 1.5 · "3/4" → 0.75 · "7.5" → 7.5 */
function parseMixedNumber(s: string): number {
  const t = s.trim();
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return parseFloat(t);
}

const INCH_RE =
  /(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(?:"|in\b|inch(?:es)?\b)/gi;
const MM_RE = /(\d+(?:\.\d+)?)\s*mm\b/gi;
/** "16 X 6mm" — ilk boyut birimsiz ama mm'dir. */
const DIM_PAIR_RE = /(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm/i;
const GRAMS_RE = /(\d+(?:[.,]\d+)?)\s*g(?:rams?|r)?\b/i;
const WEIGHT_LABEL_RE = /weight\s*:?\s*(\d+(?:[.,]\d+)?)/i;
const STYLE_RE = /style\s*#?\s*(\d+)/i;
const LABEL_RE = /\b(small|medium|large|x-?large)\b/i;

function lineGrams(line: string): number | null {
  // "10K Gold" gibi ayar ifadeleriyle karışmasın: sayı+g birebir aranır.
  const g = line.match(GRAMS_RE);
  if (g) return parseFloat(g[1].replace(",", "."));
  const w = line.match(WEIGHT_LABEL_RE);
  if (w && !/mm|"|inch/i.test(line.slice(0, w.index))) {
    return parseFloat(w[1].replace(",", "."));
  }
  return null;
}

function plausibleGrams(g: number): boolean {
  return g >= 0.05 && g <= 500;
}

interface LineTokens {
  grams: number | null;
  mm: number | null;
  mm2: number | null;
  inch: number | null;
  styleNum: number | null;
  sizeLabel: string | null;
  hasSize: boolean;
}

function tokenizeLine(raw: string): LineTokens {
  const line = raw.trim();
  const t: LineTokens = {
    grams: null,
    mm: null,
    mm2: null,
    inch: null,
    styleNum: null,
    sizeLabel: null,
    hasSize: false,
  };
  if (!line) return t;

  t.grams = lineGrams(line);
  // Gram ifadesini çıkarıp kalan metinde boyut ara ("2.30 grams" içindeki
  // 2.30, mm sanılmasın).
  const rest = line
    .replace(GRAMS_RE, " ")
    .replace(/weight\s*:?\s*(\d+(?:[.,]\d+)?)/i, " ");

  const pair = rest.match(DIM_PAIR_RE);
  if (pair) {
    t.mm = parseFloat(pair[1]);
    t.mm2 = parseFloat(pair[2]);
  } else {
    const mms = [...rest.matchAll(MM_RE)].map((m) => parseFloat(m[1]));
    if (mms.length > 0) t.mm = mms[0];
    if (mms.length > 1) t.mm2 = mms[1];
  }

  const inches = [...rest.matchAll(INCH_RE)].map((m) => parseMixedNumber(m[1]));
  if (inches.length > 0) t.inch = inches[0];

  const st = rest.match(STYLE_RE);
  if (st) t.styleNum = Number(st[1]);
  const lb = rest.match(LABEL_RE);
  if (lb) t.sizeLabel = lb[1].toLowerCase().replace("-", "");

  t.hasSize =
    t.mm != null || t.inch != null || t.styleNum != null || t.sizeLabel != null;
  return t;
}

/** Bölüm başlığı mı? ("Pendant Average Weight", "For Chain", "With Box Chain…") */
function sectionOf(line: string): string | null {
  if (/pendant|charm/i.test(line)) return "pendant";
  if (/chain|necklace|bracelet/i.test(line)) return "chain";
  return null;
}

// ── Açıklama ayrıştırma ──────────────────────────────────────────────────

/**
 * Açıklamadaki TÜM ağırlık tablolarını satır-durum makinesiyle çıkarır.
 * Boyutsuz tek-ağırlık girdileri (I formatı) mm/inch alanları null döner.
 */
export function parseDescriptionWeights(description: string): DescWeightEntry[] {
  const text = decodeEntities(description ?? "");
  const lines = text.split(/\r?\n/);
  const entries: DescWeightEntry[] = [];

  // "Average Weight" başlık satırlarını bul (birden çok bölüm olabilir).
  const headerIdx: number[] = [];
  lines.forEach((l, i) => {
    if (/average\s+weights?/i.test(l)) headerIdx.push(i);
  });
  if (headerIdx.length === 0) return entries;

  for (let h = 0; h < headerIdx.length; h++) {
    const start = headerIdx[h];
    const hardEnd = h + 1 < headerIdx.length ? headerIdx[h + 1] : lines.length;
    const headerLine = lines[start];

    let section = sectionOf(headerLine);
    // "Based on 18\"" / "Based 20\"" başlıkta uzunluk bazı; "Based on Size 10"
    // ise beden bazı (uzunluk değil) — inç bazı sanılmasın.
    let baseInch: number | null = null;
    const based = headerLine.match(
      /based(?:\s+on)?\s+(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)\s*(?:"|in\b|inch)/i,
    );
    if (based && !/based(?:\s+on)?\s+size/i.test(headerLine)) {
      baseInch = parseMixedNumber(based[1]);
    }

    let pendingSize: LineTokens | null = null;
    let pendingGrams: number | null = null;
    let pendingAge = 0;
    let dead = 0;

    // Gramaj başlıkla AYNI satırda olabilir: "Average Weight: 8.05 grams".
    const headerRest = headerLine.replace(/.*average\s+weights?\s*:?/i, "");
    const headerGrams = lineGrams(headerRest);
    if (headerGrams != null) pendingGrams = headerGrams;

    const push = (tok: LineTokens, grams: number) => {
      if (!plausibleGrams(grams)) return;
      entries.push({
        grams,
        mm: tok.mm,
        mm2: tok.mm2,
        inch: tok.inch,
        baseInch,
        styleNum: tok.styleNum,
        sizeLabel: tok.sizeLabel,
        section,
      });
    };

    for (let i = start + 1; i < hardEnd; i++) {
      const line = lines[i].trim();
      if (!line) {
        pendingAge++;
        if (pendingAge > 2) {
          pendingSize = null;
          pendingGrams = null;
        }
        continue;
      }
      // Blok sonu: standart kuyruk metni ya da arka arkaya boyut/gram taşımayan
      // içerik satırları (açıklamanın pazarlama gövdesine geçtik).
      if (/^all of our items/i.test(line)) break;

      // Ara bölüm başlığı ("For Chain", "With Box Chain Average Weight:")
      if (
        /^(for|with)\b/i.test(line) &&
        sectionOf(line) &&
        line.length < 60 &&
        lineGrams(line) == null
      ) {
        section = sectionOf(line);
        const b = line.match(
          /based(?:\s+on)?\s+(\d+(?:\.\d+)?)\s*(?:"|in\b|inch)/i,
        );
        if (b) baseInch = parseMixedNumber(b[1]);
        pendingSize = null;
        pendingGrams = null;
        continue;
      }

      const tok = tokenizeLine(line);

      // "Length: Selectable" gibi değersiz etiket satırları ölü sayılır.
      if (tok.grams == null && !tok.hasSize) {
        // "Style #1 Rectangle" gibi stil başlığı bekleyen boyut olabilir.
        const st = line.match(STYLE_RE);
        if (st) {
          pendingSize = { ...tokenizeLine(""), styleNum: Number(st[1]), hasSize: true };
          pendingAge = 0;
          continue;
        }
        dead++;
        if (dead >= 3) break;
        continue;
      }
      dead = 0;

      if (tok.grams != null && tok.hasSize) {
        // Stil başlığı bir önceki satırdan geliyorsa birleştir
        if (pendingSize?.styleNum != null && tok.styleNum == null)
          tok.styleNum = pendingSize.styleNum;
        push(tok, tok.grams);
        pendingSize = null;
        pendingGrams = null;
        pendingAge = 0;
      } else if (tok.grams != null) {
        if (pendingSize) {
          push(pendingSize, tok.grams);
          pendingSize = null;
        } else {
          pendingGrams = tok.grams;
        }
        pendingAge = 0;
      } else if (tok.hasSize) {
        if (pendingGrams != null) {
          push(tok, pendingGrams);
          pendingGrams = null;
        } else {
          pendingSize = tok;
        }
        pendingAge = 0;
      }
    }

    // Bölümde hiç boyutlu satır çıkmadıysa ve tek gram kaldıysa → tek-ağırlık.
    if (pendingGrams != null && plausibleGrams(pendingGrams)) {
      entries.push({
        grams: pendingGrams,
        mm: null,
        mm2: null,
        inch: null,
        baseInch,
        styleNum: null,
        sizeLabel: null,
        section,
      });
    }
  }

  return entries;
}

// ── Varyant boyut bilgisi ────────────────────────────────────────────────

interface PropertyValue {
  values?: string[] | null;
  scale_name?: string | null;
  property_name?: string | null;
}

/** Varyantın property değerlerinden mm/inç/stil/beden bilgisi çıkarır. */
export function extractVariantSize(
  properties: PropertyValue[] | null | undefined,
): VariantSizeInfo {
  const info: VariantSizeInfo = {
    mm: [],
    inch: [],
    styleNum: null,
    sizeLabel: null,
    bareNums: [],
    pendantOnly: false,
  };
  for (const p of properties ?? []) {
    const scale = (p.scale_name ?? "").toLowerCase();
    const pname = (p.property_name ?? "").toLowerCase();
    for (const vRaw of p.values ?? []) {
      const v = decodeEntities(String(vRaw));
      if (/pendant\s+only|charm\s+only|no\s+chain/i.test(v)) {
        info.pendantOnly = true;
        continue;
      }
      const st = v.match(STYLE_RE);
      if (st) info.styleNum = Number(st[1]);
      const lb = v.match(LABEL_RE);
      if (lb) info.sizeLabel = lb[1].toLowerCase().replace("-", "");

      for (const m of v.matchAll(MM_RE)) info.mm.push(parseFloat(m[1]));
      for (const m of v.matchAll(INCH_RE)) info.inch.push(parseMixedNumber(m[1]));

      // Çıplak sayı: scale Inches ise inç; uzunluk property'siyse inç;
      // aksi halde beden adayı (yüzük bedeni vb.).
      const bare = v.trim().match(/^(\d+(?:\.\d+)?)$/);
      if (bare) {
        const n = parseFloat(bare[1]);
        if (scale.includes("inch") || pname.includes("length")) info.inch.push(n);
        else info.bareNums.push(n);
      }
    }
  }
  return info;
}

// ── Eşleştirme ───────────────────────────────────────────────────────────

const NEAR = (a: number, b: number) => Math.abs(a - b) < 0.26;

/**
 * mm için EN YAKIN benzersiz eşleşme: önce sıkı (±0.05), sonra gevşek (±0.3)
 * ama yalnız ikinci en yakın aday belirgin uzaksa (çakışan 3.4/3.6 gibi
 * komşu kalınlıklar yanlış eşleşmesin).
 */
function nearestByMm(
  entries: DescWeightEntry[],
  mm: number,
): DescWeightEntry[] {
  const rows = entries.filter((e) => e.mm != null);
  const tight = rows.filter((e) => Math.abs(e.mm! - mm) < 0.05);
  if (tight.length > 0) return tight;
  const sorted = rows
    .map((e) => ({ e, d: Math.abs(e.mm! - mm) }))
    .sort((a, b) => a.d - b.d);
  if (
    sorted.length > 0 &&
    sorted[0].d < 0.3 &&
    (sorted.length === 1 || sorted[1].d > sorted[0].d + 0.15)
  )
    return [sorted[0].e];
  return [];
}

/**
 * mm-tablosundan doğrusal model: tabloda OLMAYAN bir boyutu (örn. 15mm halka,
 * tablo 19–70mm) listing'in KENDİ katsayısıyla tahmin eder. Halka/kasnak tipi
 * ürünlerde ağırlık ~ a·mm + b (çevreyle doğrusal); ≥3 nokta ve R²≥0.97
 * şartıyla, tablonun makul komşuluğunda (0.5×min – 1.5×max) uygulanır.
 */
function mmLinearEstimate(
  entries: DescWeightEntry[],
  mm: number,
): number | null {
  const pts = entries
    .filter((e) => e.mm != null && e.inch == null && e.baseInch == null)
    .map((e) => [e.mm!, e.grams] as const);
  if (pts.length < 3) return null;
  const n = pts.length;
  const sx = pts.reduce((s, p) => s + p[0], 0);
  const sy = pts.reduce((s, p) => s + p[1], 0);
  const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0);
  const sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const a = (n * sxy - sx * sy) / denom;
  const b = (sy - a * sx) / n;
  const mean = sy / n;
  const ssTot = pts.reduce((s, p) => s + (p[1] - mean) ** 2, 0);
  const ssRes = pts.reduce((s, p) => s + (p[1] - (a * p[0] + b)) ** 2, 0);
  if (ssTot < 1e-9 || 1 - ssRes / ssTot < 0.97) return null;
  const mms = pts.map((p) => p[0]);
  if (mm < Math.min(...mms) * 0.5 || mm > Math.max(...mms) * 1.5) return null;
  const grams = a * mm + b;
  return plausibleGrams(grams) ? Math.round(grams * 100) / 100 : null;
}

/**
 * Varyantı açıklama tablosuyla eşler.
 *  - Birebir satır (mm / inç / stil / isimli beden / pendant-only) → exact.
 *  - Zincir/bileklik: kalınlık (mm) eşleşir ama uzunluk farklıysa gram,
 *    uzunluk oranıyla ölçeklenir (ağırlık↔uzunluk ~doğrusal; kendi
 *    regresyon analizimizle tutarlı) → exact=false.
 *  - Tek-ağırlık listing: boyut ayrımı olmayan varyantlara uygulanır.
 * Belirsizlik (aynı boyuta iki farklı gram) → null.
 */
export function matchVariantWeight(
  entries: DescWeightEntry[],
  info: VariantSizeInfo,
): WeightMatch | null {
  if (entries.length === 0) return null;

  const uniq = (list: DescWeightEntry[]): DescWeightEntry | null => {
    if (list.length === 0) return null;
    const g = list[0].grams;
    return list.every((e) => Math.abs(e.grams - g) < 0.005) ? list[0] : null;
  };

  // 1) Pendant-only varyant → pendant bölümü (yoksa tek boyutsuz girdi).
  if (info.pendantOnly) {
    const pend =
      uniq(entries.filter((e) => e.section === "pendant")) ??
      uniq(entries.filter((e) => e.mm != null && e.inch == null));
    return pend ? { grams: pend.grams, exact: true } : null;
  }

  // 2) Stil numarası
  if (info.styleNum != null) {
    const hit = uniq(entries.filter((e) => e.styleNum === info.styleNum));
    if (hit) return { grams: hit.grams, exact: true };
  }

  // 3) İsimli beden (small/medium/large)
  if (info.sizeLabel) {
    const hit = uniq(entries.filter((e) => e.sizeLabel === info.sizeLabel));
    if (hit) return { grams: hit.grams, exact: true };
  }

  let vMm = info.mm[0] ?? null;
  const vInch = info.inch[0] ?? null;
  // Uzunluk (inç) property'si olan varyantta birimsiz çıplak sayı ("5.5")
  // zincir/bileklik KALINLIĞIDIR (yüzük bedeni uzunluk taşımaz).
  if (vMm == null && vInch != null && info.bareNums.length > 0) {
    const cand = info.bareNums.find((n) => n > 0.5 && n < 20 && !NEAR(n, vInch));
    if (cand != null) vMm = cand;
  }

  // 4) mm + inç birlikte (zincir kalınlık × uzunluk)
  if (vMm != null && vInch != null) {
    const rows = nearestByMm(entries, vMm);
    // 4a) Uzunluğu birebir veren satır
    const exactRow = uniq(
      rows.filter((e) => e.inch != null && NEAR(e.inch, vInch)),
    );
    if (exactRow) return { grams: exactRow.grams, exact: true };
    // 4b) Satır uzunluğu ya da bölüm bazı üzerinden doğrusal ölçek
    const scalable = rows
      .map((e) => ({ e, base: e.inch ?? e.baseInch }))
      .filter((r): r is { e: DescWeightEntry; base: number } => r.base != null);
    if (scalable.length > 0) {
      const first = scalable[0];
      const allSame = scalable.every(
        (r) =>
          Math.abs(r.e.grams / r.base - first.e.grams / first.base) < 0.01,
      );
      if (allSame) {
        const grams = (first.e.grams / first.base) * vInch;
        if (plausibleGrams(grams)) {
          const exact = NEAR(first.base, vInch);
          return { grams: Math.round(grams * 100) / 100, exact };
        }
      }
      return null;
    }
    // 4c) Uzunluk bazsız tek mm satırı (uzunluk seçimi ağırlığı değiştirmiyor
    // kabul edilemez) — yalnız satır zaten bazsızsa VE tek adaysa kullan.
    const bald = uniq(rows.filter((e) => e.inch == null && e.baseInch == null));
    if (bald && rows.length === scalableSafe(rows))
      return { grams: bald.grams, exact: true };
    return null;
  }

  // 5) Yalnız mm
  if (vMm != null) {
    const hit = uniq(nearestByMm(entries, vMm));
    if (hit) return { grams: hit.grams, exact: true };
    // mm ikincil boyutta da olabilir ("2mm" kalınlık varyantı)
    const hit2 = uniq(entries.filter((e) => e.mm2 != null && NEAR(e.mm2, vMm)));
    if (hit2) return { grams: hit2.grams, exact: true };
    // Tabloda olmayan boyut: listing'in KENDİ doğrusal katsayısıyla tahmin
    const est = mmLinearEstimate(entries, vMm);
    if (est != null) return { grams: est, exact: false };
    return singleFallback(entries);
  }

  // 6) Yalnız inç (uzunluk tablosu ya da baz ölçekleme)
  if (vInch != null) {
    const exactRow = uniq(
      entries.filter((e) => e.inch != null && NEAR(e.inch, vInch)),
    );
    if (exactRow) return { grams: exactRow.grams, exact: true };
    const scalable = entries.filter(
      (e) => e.mm == null && (e.inch ?? e.baseInch) != null,
    );
    if (scalable.length === 1) {
      const base = (scalable[0].inch ?? scalable[0].baseInch)!;
      const grams = (scalable[0].grams / base) * vInch;
      if (plausibleGrams(grams))
        return { grams: Math.round(grams * 100) / 100, exact: NEAR(base, vInch) };
    }
    return singleFallback(entries);
  }

  // 7) Boyutsuz varyant (renk/beden-dışı seçenekler ya da tek varyant)
  return singleFallback(entries);
}

/** Tablodaki TEK girdi (ya da hepsi aynı gram) → listing ortalaması. */
function singleFallback(entries: DescWeightEntry[]): WeightMatch | null {
  const g = entries[0].grams;
  if (entries.every((e) => Math.abs(e.grams - g) < 0.005))
    return { grams: g, exact: true };
  return null;
}

function scalableSafe(rows: DescWeightEntry[]): number {
  return rows.filter((e) => e.inch == null && e.baseInch == null).length;
}

// ── Toplu dolum orkestrasyonu (script + panel aksiyonu ortak çekirdeği) ──

export interface FillVariantRow {
  sku: string;
  weight_grams: number | string | null;
  weight_source?: string | null;
  properties: unknown;
}

export interface FillCandidate {
  sku: string;
  grams: number;
  source: "description" | "description-scaled";
}

export interface FillReport {
  candidates: FillCandidate[];
  listingsParsed: number;
  listingsUnparsed: number;
  /** Tartılı kardeş varyantla >%20 çelişen (bayat açıklama) listing sayısı. */
  listingsGated: number;
  unmatched: number;
}

/**
 * Açıklama tablolarından eksik varyant gramajı adaylarını üretir. Yalnız
 * weight_grams'i boş varyantlar aday olur; listing'in TARTILMIŞ (shipstation)
 * kardeşinde motor >%20 şaşıyorsa listing komple atlanır (güven kapısı).
 */
export function computeDescriptionWeightFills(
  products: { id: string; description: string | null }[],
  variantsByProduct: Map<string, FillVariantRow[]>,
): FillReport {
  const report: FillReport = {
    candidates: [],
    listingsParsed: 0,
    listingsUnparsed: 0,
    listingsGated: 0,
    unmatched: 0,
  };

  for (const p of products) {
    const entries = parseDescriptionWeights(p.description ?? "");
    if (entries.length === 0) {
      report.listingsUnparsed++;
      continue;
    }
    report.listingsParsed++;
    const all = variantsByProduct.get(p.id) ?? [];

    const weighed = all.filter(
      (v) => v.weight_grams != null && v.weight_source === "shipstation",
    );
    let gated = false;
    for (const w of weighed) {
      const hit = matchVariantWeight(
        entries,
        extractVariantSize(w.properties as never),
      );
      const real = Number(w.weight_grams);
      if (hit && real > 0 && Math.abs(hit.grams - real) / real > 0.2) {
        gated = true;
        break;
      }
    }
    if (gated) {
      report.listingsGated++;
      continue;
    }

    for (const v of all.filter((v) => v.weight_grams == null)) {
      const hit = matchVariantWeight(
        entries,
        extractVariantSize(v.properties as never),
      );
      if (hit) {
        report.candidates.push({
          sku: v.sku,
          grams: hit.grams,
          source: hit.exact ? "description" : "description-scaled",
        });
      } else {
        report.unmatched++;
      }
    }
  }

  return report;
}
