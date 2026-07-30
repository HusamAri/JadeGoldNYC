/**
 * Fiyat motoru xlsx'inin SAF ayrıştırıcı/doğrulayıcısı.
 *
 * Panel fiyat HESAPLAMAZ (0119 `externalPricing`) — burada yapılan şey fiyat
 * türetmek değil, motorun ÜRETTİĞİ ızgarayı okuyup **doğru okuduğumuzu
 * kanıtlamaktır**. Bu ayrım önemli: aşağıdaki `list`/`sale` yeniden hesabı bir
 * fiyat önerisi değil, sütun kayması / birim hatası yakalayan bir bütünlük
 * testidir. Uyuşmazlıkta içe aktarım REDDEDİLİR, düzeltilmez.
 *
 * Bu dosya bilerek bağımlılıksızdır (xlsx okuma script'te) → derleyip
 * çalıştırarak tek başına test edilebilir (second-brain: saf motoru bağımsız
 * çalıştırmayla kanıtla).
 */

/** ASM sayfasındaki varsayımlar (etiket → değer). */
export interface PricingAssumptions {
  spotUsdPerOzt: number;
  spotUsdPerGram: number;
  fire: number;
  laborUsd: number;
  laborMilgrainUsd: number;
  packagingUsd: number;
  shippingUsd: number;
  /** Motor çarpanı, genişlik 2–7mm (v4 ASM "Carpan 2-7mm"; v2/v3'te tek "Carpan"). */
  multiplier: number;
  /** Motor çarpanı, genişlik 8–12mm (v4 "Carpan 8-12mm", bilinçli mens-wide
   *  primi). v4 öncesi dosyalarda çarpan tekti → multiplier ile aynı değer. */
  multiplierWide: number;
  etsyFeeRate: number;
  offsiteRate: number;
  purity: Record<Karat, number>;
  thickness: string;
}

export type Karat = "10K" | "14K" | "18K";
export type PricingProfile = "standard" | "milgrain";

/** Izgaranın tek hücresi — para alanları tam sayı CENT (CLAUDE.md). */
export interface PricingRow {
  karat: Karat;
  profile: PricingProfile;
  widthMm: number;
  sizeUs: number;
  grams: number;
  landedCents: number;
  engineCents: number;
  listCents: number;
  saleCents: number;
  floorCents: number;
  offsiteFloorCents: number;
  kontrolOk: boolean;
}

export interface PricingSnapshot {
  assumptions: PricingAssumptions;
  rows: PricingRow[];
}

/** Ham sayfa girdisi — script exceljs'ten doldurur, bu modül şekli bilmez. */
export interface RawSheet {
  karat: Karat;
  profile: PricingProfile;
  /** Başlık satırı HARİÇ veri satırları; kolon sırası motor dosyasındaki gibi. */
  rows: (string | number | null)[][];
}

export class PricingImportError extends Error {}

const EPS = 0.005;

function usdToCents(v: number): number {
  // Motor 2 ondalıkla üretir; float artığını yuvarlayarak tam sayıya indir.
  return Math.round(v * 100);
}

/**
 * `CEILING(engine / 0.75, 5)` — TAM SAYI aritmetiğiyle.
 * engine/0.75 = engine*4/3; 5'in katına yukarı yuvarla → ceil(engine*4/15)*5.
 * Float bölme kullanılmaz (0.1+0.2 sınıfı kenar hataları bu tabloda $5'lik
 * sapmaya dönüşürdü).
 */
export function expectedListUsd(engineUsd: number): number {
  if (!Number.isInteger(engineUsd)) {
    throw new PricingImportError(
      `Motor degeri tam sayi bekleniyordu: ${engineUsd}`,
    );
  }
  return Math.ceil((engineUsd * 4) / 15) * 5;
}

/** `Gorunen Sale = Liste x 0.75` — cent tabanında tam sayı (liste*3/4). */
export function expectedSaleCents(listCents: number): number {
  return Math.round((listCents * 3) / 4);
}

function num(v: unknown, where: string): number {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : (v as number);
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new PricingImportError(`${where}: sayi bekleniyordu, geldi: ${v}`);
  }
  return n;
}

/**
 * Ham sayfaları doğrulanmış anlık görüntüye çevirir.
 *
 * Reddetme koşulları (hepsi içe aktarımı durdurur — sessizce düzeltme YOK):
 *  - eksik/geçersiz varsayım,
 *  - gram veya para alanı ≤ 0,
 *  - `KONTROL` kolonu OK değil (görünen sale zeminin altına düşüyor),
 *  - `list` ≠ CEILING(engine/0.75, 5) ya da `sale` ≠ list*0.75 (okuma hatası),
 *  - aynı (karat, profil, genişlik, beden) hücresi iki kez.
 */
export function parsePricingSnapshot(
  assumptions: PricingAssumptions,
  sheets: RawSheet[],
): PricingSnapshot {
  if (!(assumptions.spotUsdPerOzt > 0)) {
    throw new PricingImportError("Spot (ASM!B2) pozitif olmali.");
  }
  if (!(assumptions.multiplier > 0)) {
    throw new PricingImportError("Carpan 2-7mm (ASM!B7) pozitif olmali.");
  }
  if (!(assumptions.multiplierWide > 0)) {
    throw new PricingImportError("Carpan 8-12mm (ASM!B17) pozitif olmali.");
  }
  for (const k of ["10K", "14K", "18K"] as Karat[]) {
    if (!(assumptions.purity[k] > 0 && assumptions.purity[k] < 1)) {
      throw new PricingImportError(`Saflik ${k} 0-1 araliginda olmali.`);
    }
  }

  const rows: PricingRow[] = [];
  const seen = new Set<string>();

  for (const sheet of sheets) {
    for (const [i, raw] of sheet.rows.entries()) {
      const where = `${sheet.karat}/${sheet.profile} satir ${i + 2}`;
      if (raw[0] == null) continue; // boş kuyruk satırı

      const widthMm = num(raw[0], `${where} genislik`);
      const sizeUs = num(raw[1], `${where} beden`);
      const grams = num(raw[2], `${where} gram`);
      const landed = num(raw[3], `${where} landed`);
      const engine = num(raw[4], `${where} motor`);
      const list = num(raw[5], `${where} liste`);
      const sale = num(raw[6], `${where} sale`);
      const floor = num(raw[7], `${where} floor`);
      const offsiteFloor = num(raw[8], `${where} offsite floor`);
      const kontrol = String(raw[9] ?? "").trim().toUpperCase();

      if (grams <= 0) {
        throw new PricingImportError(`${where}: gram pozitif olmali (${grams}).`);
      }
      for (const [label, v] of [
        ["landed", landed],
        ["motor", engine],
        ["liste", list],
        ["sale", sale],
        ["floor", floor],
        ["offsite floor", offsiteFloor],
      ] as const) {
        if (v <= 0) {
          throw new PricingImportError(`${where}: ${label} pozitif olmali (${v}).`);
        }
      }

      // Motorun kendi zemin kontrolü. Tek bir "FLOOR ALTI" bile içe aktarımı
      // durdurur: zararına satış fiyatı aynaya girmemeli.
      if (kontrol !== "OK") {
        throw new PricingImportError(
          `${where}: KONTROL '${kontrol}' (OK degil) — gorunen sale zeminin altinda. Ice aktarim reddedildi.`,
        );
      }

      // Bütünlük: doğru kolonları mı okuduk? (fiyat ONERISI degil, okuma testi)
      const wantList = expectedListUsd(engine);
      if (Math.abs(wantList - list) > EPS) {
        throw new PricingImportError(
          `${where}: liste tutarsiz — dosyada ${list}, CEILING(${engine}/0.75,5)=${wantList}. Kolon kaymasi olabilir.`,
        );
      }
      const listCents = usdToCents(list);
      const wantSaleCents = expectedSaleCents(listCents);
      if (Math.abs(wantSaleCents - usdToCents(sale)) > 1) {
        throw new PricingImportError(
          `${where}: sale tutarsiz — dosyada ${sale}, liste*0.75=${wantSaleCents / 100}.`,
        );
      }

      const key = `${sheet.karat}|${sheet.profile}|${widthMm}|${sizeUs}`;
      if (seen.has(key)) {
        throw new PricingImportError(`${where}: yinelenen hucre (${key}).`);
      }
      seen.add(key);

      rows.push({
        karat: sheet.karat,
        profile: sheet.profile,
        widthMm,
        sizeUs,
        grams,
        landedCents: usdToCents(landed),
        engineCents: usdToCents(engine),
        listCents,
        saleCents: usdToCents(sale),
        floorCents: usdToCents(floor),
        offsiteFloorCents: usdToCents(offsiteFloor),
        kontrolOk: true,
      });
    }
  }

  if (rows.length === 0) {
    throw new PricingImportError("Izgara bos — hic satir okunamadi.");
  }
  return { assumptions, rows };
}
