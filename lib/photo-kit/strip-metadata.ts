/**
 * Görsel meta verisi temizleyici. Panelden DIŞARI çıkan (Etsy'ye yüklenen ya da
 * kullanıcıya indirilen) her görselden üreteç/köken meta verisini söker; ürün
 * fotoğrafı, kaynağını ele veren etiketler taşımadan mağazaya gider.
 *
 * Kapsam: PNG metin/EXIF chunk'ları (tEXt/iTXt/zTXt/eXIf/tIME — ör. Higgsfield'ın
 * `hf-job-id` etiketi) ve JPEG APP1/APP13/COM (EXIF, XMP, IPTC, yorum) blokları.
 * Renk/derinlik gibi GÖRÜNTÜYÜ ETKİLEYEN chunk'lar (IHDR, PLTE, tRNS, gAMA, cHRM,
 * iCCP, sRGB, sBIT, bKGD, pHYs, IDAT, IEND) KORUNUR — yalnız meta veri düşer.
 *
 * NOT: Bu yalnız DOSYA meta verisini temizler. Nano Banana / Gemini görselleri
 * ayrıca piksele gömülü, GÖRÜNMEZ bir SynthID filigranı taşır; o meta veri
 * değildir ve bu fonksiyonla (ya da herhangi bir meta veri temizlemeyle) SÖKÜLEMEZ.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** PNG'de düşürülecek meta veri chunk tipleri (görüntüyü etkilemez). */
const PNG_METADATA_CHUNKS = new Set(["tEXt", "iTXt", "zTXt", "eXIf", "tIME"]);

function isPng(b: Uint8Array): boolean {
  if (b.length < 8) return false;
  for (let i = 0; i < 8; i++) if (b[i] !== PNG_SIGNATURE[i]) return false;
  return true;
}

function isJpeg(b: Uint8Array): boolean {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function readUInt32BE(b: Uint8Array, o: number): number {
  return (
    ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0
  );
}

/** PNG'den meta veri chunk'larını çıkarır; kalan chunk'lar (CRC'leriyle) korunur. */
function stripPng(b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out: Uint8Array[] = [b.subarray(0, 8)];
  let i = 8;
  while (i + 8 <= b.length) {
    const len = readUInt32BE(b, i);
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const end = i + 12 + len; // length(4)+type(4)+data(len)+crc(4)
    if (end > b.length) break; // bozuk/eksik — kalanı olduğu gibi bırakma, dur
    if (!PNG_METADATA_CHUNKS.has(type)) out.push(b.subarray(i, end));
    i = end;
    if (type === "IEND") break;
  }
  return concat(out);
}

/**
 * JPEG'den EXIF/XMP (APP1), IPTC/Photoshop (APP13) ve yorum (COM) bloklarını
 * çıkarır. Diğer segmentler (APP0/JFIF, quantization, frame, scan) korunur.
 */
function stripJpeg(b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out: Uint8Array[] = [b.subarray(0, 2)]; // SOI
  let i = 2;
  while (i + 1 < b.length) {
    if (b[i] !== 0xff) break; // marker değil — güvenli tarafta kal, kalanı ekle
    const marker = b[i + 1];
    // SOS (0xDA): sıkıştırılmış veri başlar; buradan sonu olduğu gibi taşı.
    if (marker === 0xda) {
      out.push(b.subarray(i));
      return concat(out);
    }
    // Uzunluksuz markerlar (RSTn, TEM) — nadir bu konumda; olduğu gibi bırak.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(b.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const segLen = (b[i + 2] << 8) | b[i + 3]; // length includes these 2 bytes
    const end = i + 2 + segLen;
    if (end > b.length) break;
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe; // APP1, APP13, COM
    if (!drop) out.push(b.subarray(i, end));
    i = end;
  }
  out.push(b.subarray(i));
  return concat(out);
}

function concat(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  let total = 0;
  for (const p of parts) total += p.length;
  const res = new Uint8Array(new ArrayBuffer(total));
  let o = 0;
  for (const p of parts) {
    res.set(p, o);
    o += p.length;
  }
  return res;
}

/**
 * Verilen görsel baytlarından köken/üreteç meta verisini temizler. PNG ve JPEG
 * desteklenir; diğer formatlar (webp vb.) olduğu gibi döner (kaynak üretim
 * çıktısı PNG'dir). Hata durumunda orijinali döndürür — indirme/yükleme kırılmaz.
 */
export function stripImageMetadata(
  input: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  try {
    if (isPng(input)) return stripPng(input);
    if (isJpeg(input)) return stripJpeg(input);
    return input;
  } catch {
    return input;
  }
}
