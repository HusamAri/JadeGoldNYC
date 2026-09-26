#!/usr/bin/env node
/**
 * Uretilen gorselde 32 px izgaraya oturmus "makroblok" kusurlarini sayar.
 *
 * Neden var: nano_banana_2 bazi karelerde bulanik arka planda 32x32'lik duz
 * renkli kareler birakiyor (Willow W01/R01, 2026-09-26). Kusur urunde degil
 * zeminde, ama Etsy'de tam boyutta gorunur. Gozle bakmak her kareyi yakalamaz;
 * bu dedektor QA kapisinin olculebilir yarisidir.
 *
 * Olcut: duz (ic varyansi dusuk) bir 32'lik blok, en az bir komsusundan
 * izgara sinirinda belirgin bir basamakla ayriliyorsa isaretlenir. Dogal
 * bulanik zemin puruzsuz degisir; makroblok ise sinirda keskin atlar.
 *
 * Kullanim: node detect_block_artifacts.mjs a.png b.png ...   (JSON basar)
 */
import sharp from "sharp";

const B = 32;
const STEP = 3;      // sinirda ortalama basamak esigi (0-255, en guclu kanal)
const FLAT = 2.5;    // blok ici std esigi — yalniz duz bolgeler aday
// Kalibrasyon (2026-09-26): gri tonlamada kusurlarin cogu kayboluyordu, cunku
// kareler parlaklikta degil RENKTE ayrisiyor (yesilimsi/mavimsi). Olcum kanal
// basina yapilir, en guclu kanal alinir. Gozle sayilan gercege karsi ayarlandi:
// Y01 0 (temiz), W01 ~20, R01 ~6.

async function scan(file) {
  const { data, info } = await sharp(file).removeAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const C = info.channels;
  let ch = 0;
  const px = (x, y) => data[(y * W + x) * C + ch];
  const nx = Math.floor(W / B), ny = Math.floor(H / B);
  const hits = [];
  for (let by = 0; by < ny; by++) for (let bx = 0; bx < nx; bx++) {
   let best = null;
   for (ch = 0; ch < 3; ch++) {
    let s = 0, s2 = 0, n = 0;
    for (let y = by * B + 2; y < by * B + B - 2; y++)
      for (let x = bx * B + 2; x < bx * B + B - 2; x++) { const v = px(x, y); s += v; s2 += v * v; n++; }
    const mean = s / n, std = Math.sqrt(Math.max(0, s2 / n - mean * mean));
    if (std > FLAT) continue;
    // Dort sinirin her biri: sinirin iki yanindaki piksel ciftlerinin ortalama farki,
    // sinirin hemen icindeki ardisik fark ile karsilastirilir (dogal gradyani eler).
    const edges = [];
    const x0 = bx * B, y0 = by * B, x1 = x0 + B - 1, y1 = y0 + B - 1;
    if (bx > 0) { let d = 0, g = 0; for (let y = y0; y <= y1; y++) { d += Math.abs(px(x0, y) - px(x0 - 1, y)); g += Math.abs(px(x0 + 1, y) - px(x0, y)); } edges.push((d - g) / B); }
    if (bx < nx - 1) { let d = 0, g = 0; for (let y = y0; y <= y1; y++) { d += Math.abs(px(x1 + 1, y) - px(x1, y)); g += Math.abs(px(x1, y) - px(x1 - 1, y)); } edges.push((d - g) / B); }
    if (by > 0) { let d = 0, g = 0; for (let x = x0; x <= x1; x++) { d += Math.abs(px(x, y0) - px(x, y0 - 1)); g += Math.abs(px(x, y0 + 1) - px(x, y0)); } edges.push((d - g) / B); }
    if (by < ny - 1) { let d = 0, g = 0; for (let x = x0; x <= x1; x++) { d += Math.abs(px(x, y1 + 1) - px(x, y1)); g += Math.abs(px(x, y1) - px(x, y1 - 1)); } edges.push((d - g) / B); }
    const strong = edges.filter((e) => e > STEP).length;
    if (strong >= 2) { const step = Math.max(...edges); if (!best || step > best.step) best = { bx, by, x: x0, y: y0, ch, std: +std.toFixed(2), step: +step.toFixed(1) }; }
   }
   if (best) hits.push(best);
  }
  return { file: file.split("/").pop(), size: `${W}x${H}`, blocks: hits.length, maxY: hits.length ? Math.max(...hits.map((h) => h.y + B)) : 0, hits };
}

const files = process.argv.slice(2);
const out = [];
for (const f of files) out.push(await scan(f));
console.log(JSON.stringify(out.map(({ hits, ...r }) => ({ ...r, first: hits.slice(0, 4) })), null, 1));
