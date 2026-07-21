// PIN CUTOUT ÜRETİCİSİ — kullanıcı pin sayfalarından (AI üretimi emaye pin
// sheet'leri) tek tek pin cutout'ları keser: zemin şeffaflaşır, AÇIK zeminli
// sayfalarda pinin boyalı gölgesi yarı saydam mürekkep olarak KORUNUR
// ("gerçekten iğnelenmiş" hissi); KOYU (siyah keçe) sayfalarda gölge zeminle
// bir olduğundan çıktı gölgesiz kesilir, kaldırma gölgesi CSS'te verilir.
//
// Yöntem: krop kenarlarından flood-fill (zemin + gölge pikselleri yürünebilir;
// her pinin altın çerçevesi doymuş/parlak olduğundan fill pin içine giremez).
// EN BÜYÜK iç bileşen pinin kendisidir ve krop kenarına değse bile korunur;
// kenara değen DİĞER parçalar komşu pin sızıntısıdır → atılır. Çevrili zemin
// delikleri (yüzük içi, kulp boşluğu) açık zeminde otomatik (bölgenin ≥%70'i
// zeminle neredeyse aynıysa), koyu zeminde (siyah emaye ile siyah keçe ayırt
// edilemez) yalnız elle verilen tohum noktalarından açılır.
//
// Kaynak sheet'ler oturum scratchpad'inde durur (kullanıcı yüklemeleri;
// repo'ya konmaz — transcript'ten yeniden çıkarılabilir). Yeni set eklemek =
// SHEETS + SETS'e kayıt eklemek.
// Koş: node scripts/cut-pins.mjs   (repo kökünden; sharp repo bağımlılığı)
import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import path from "path";

const SRC =
  process.env.PIN_SHEET_DIR ??
  "/tmp/claude-0/-home-user-JadeGoldNYC/26940d52-aed1-5d7a-9a7c-1fcc52d905e8/scratchpad/pins-src";
const OUT = new URL("../public/pins", import.meta.url).pathname;

/** Sheet ayarları: dark=koyu keçe zemin (gölge korunmaz, eşik dar). */
const SHEETS = {
  "sheet0.webp": { dark: false, bgTol: 38 }, // Gamze — krem kumaş
  "sheet1.webp": { dark: false, bgTol: 38 }, // Hüsam — beyaz
  "sheet2.webp": { dark: true, bgTol: 26 }, // Yasin A — siyah keçe
  "sheet3.webp": { dark: true, bgTol: 26 }, // Yasin B — siyah keçe
};

/**
 * Pin kropları. box=[x,y,w,h] kaynak sheet pikselinde (1122×1402);
 * holeSeeds=[x,y] (krop-yereli) koyu zeminde elle açılacak zemin deliği.
 * Gamze setinde HÜSAM yazılı pil pin BİLEREK yok (kullanıcı kararı).
 * Yasin B sayfasından yalnız A'da OLMAYAN tasarımlar alındı (portre ve
 * isim plakası tekrarları atlandı — "different pins" talimatı).
 */
const SETS = {
  gamze: [
    { key: "person", sheet: "sheet0.webp", box: [380, 320, 460, 700] },
    { key: "cat", sheet: "sheet0.webp", box: [30, 85, 385, 405] },
    { key: "jg-monogram", sheet: "sheet0.webp", box: [725, 120, 370, 355] },
    { key: "chain", sheet: "sheet0.webp", box: [20, 505, 375, 300] },
    { key: "jade", sheet: "sheet0.webp", box: [820, 470, 270, 325] },
    { key: "ring-box", sheet: "sheet0.webp", box: [30, 845, 380, 430] },
    { key: "curated-chaos", sheet: "sheet0.webp", box: [400, 1020, 340, 230] },
    { key: "coffee-notes", sheet: "sheet0.webp", box: [715, 845, 380, 470] },
  ],
  husam: [
    { key: "person", sheet: "sheet1.webp", box: [150, 60, 445, 545] },
    { key: "curator", sheet: "sheet1.webp", box: [595, 150, 385, 200] },
    { key: "husam-name", sheet: "sheet1.webp", box: [595, 335, 385, 195] },
    { key: "amuletta", sheet: "sheet1.webp", box: [150, 560, 415, 390] },
    { key: "motel-tag", sheet: "sheet1.webp", box: [580, 485, 405, 520] },
    { key: "hummingbird", sheet: "sheet1.webp", box: [60, 915, 460, 385] },
    { key: "ring", sheet: "sheet1.webp", box: [440, 975, 305, 320] },
    { key: "basket", sheet: "sheet1.webp", box: [710, 925, 365, 385] },
  ],
  yasin: [
    { key: "person", sheet: "sheet2.webp", box: [310, 340, 505, 665] },
    { key: "eon-medallion", sheet: "sheet2.webp", box: [35, 90, 330, 350] },
    { key: "yasin-name", sheet: "sheet2.webp", box: [380, 150, 370, 205] },
    { key: "engraver", sheet: "sheet2.webp", box: [740, 150, 365, 320] },
    { key: "gemstone", sheet: "sheet2.webp", box: [35, 450, 305, 420] },
    {
      key: "ring",
      sheet: "sheet2.webp",
      box: [790, 535, 290, 290],
      holeSeeds: [[145, 145]],
    },
    { key: "ring-box", sheet: "sheet2.webp", box: [35, 855, 315, 435] },
    { key: "money", sheet: "sheet2.webp", box: [340, 1010, 360, 275] },
    { key: "tesla", sheet: "sheet2.webp", box: [675, 1000, 440, 275] },
    { key: "eon-plate", sheet: "sheet3.webp", box: [35, 65, 470, 285] },
    {
      key: "ring-hammered",
      sheet: "sheet3.webp",
      box: [685, 80, 315, 300],
      holeSeeds: [[155, 140]],
    },
    { key: "mandrel", sheet: "sheet3.webp", box: [45, 345, 245, 465] },
    { key: "sketch", sheet: "sheet3.webp", box: [770, 375, 325, 365] },
    { key: "gold-pour", sheet: "sheet3.webp", box: [30, 800, 300, 350] },
    { key: "emerald", sheet: "sheet3.webp", box: [840, 765, 250, 300] },
    { key: "naive", sheet: "sheet3.webp", box: [485, 1120, 290, 190] },
    { key: "star", sheet: "sheet3.webp", box: [770, 1070, 250, 265] },
  ],
};

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

async function cutPin(sheetFile, { box: [bx, by, bw, bh], holeSeeds }, outPath) {
  const cfg = SHEETS[sheetFile];
  const { data, info } = await sharp(path.join(SRC, sheetFile))
    .extract({ left: bx, top: by, width: bw, height: bh })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const px = (x, y) => (y * W + x) * 3;

  // Zemin: kenar şeridi (6px) medyanı.
  const ring = [[], [], []];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (x > 5 && x < W - 6 && y > 5 && y < H - 6) continue;
      const i = px(x, y);
      ring[0].push(data[i]); ring[1].push(data[i + 1]); ring[2].push(data[i + 2]);
    }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  const bg = [med(ring[0]), med(ring[1]), med(ring[2])];
  const Lbg = lum(...bg);

  const isBgLike = (i) => {
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db) < cfg.bgTol;
  };
  // Gölge pikseli (yalnız açık zemin): zeminden koyu, düşük doygunluk.
  const isShadowLike = (i) => {
    if (cfg.dark) return false;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const L = lum(r, g, b);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    return L < Lbg && L > Lbg * 0.38 && sat < 0.35;
  };

  // 1) Kenarlardan flood-fill.
  const outside = new Uint8Array(W * H);
  const q = [];
  const trySeed = (x, y) => {
    const idx = y * W + x, i = px(x, y);
    if (!outside[idx] && (isBgLike(i) || isShadowLike(i))) { outside[idx] = 1; q.push(idx); }
  };
  for (let x = 0; x < W; x++) { trySeed(x, 0); trySeed(x, H - 1); }
  for (let y = 0; y < H; y++) { trySeed(0, y); trySeed(W - 1, y); }
  while (q.length) {
    const idx = q.pop();
    const x = idx % W, y = (idx / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nidx = ny * W + nx;
      if (outside[nidx]) continue;
      const i = px(nx, ny);
      if (isBgLike(i) || isShadowLike(i)) { outside[nidx] = 1; q.push(nidx); }
    }
  }

  // 1b) Elle verilen delik tohumları (koyu zemin: yüzük içi) — zemin-benzeri
  //     pikseller üzerinden ikinci fill; "outside" işaretlenir (alfa 0 yolu).
  for (const [sx, sy] of holeSeeds ?? []) {
    const idx = sy * W + sx;
    if (idx < 0 || idx >= W * H || outside[idx]) continue;
    if (!isBgLike(px(sx, sy))) continue;
    outside[idx] = 1; q.push(idx);
    while (q.length) {
      const c = q.pop();
      const x = c % W, y = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nidx = ny * W + nx;
        if (outside[nidx]) continue;
        if (isBgLike(px(nx, ny))) { outside[nidx] = 1; q.push(nidx); }
      }
    }
  }

  // 2) İç bileşenler. Kural: EN BÜYÜK iç bileşen PİNİN KENDİSİDİR ve krop
  //    kenarına değse bile DAİMA korunur (dar krop tüm pini düşürmesin —
  //    kontak-sayfa doğrulamasının yakaladığı hata). Kenara değen DİĞER
  //    parçalar komşu pin sızıntısıdır → atılır.
  const comp = new Int32Array(W * H).fill(-1);
  let ncomp = 0;
  const touchesBorder = [];
  const compArea = [];
  for (let idx = 0; idx < W * H; idx++) {
    if (outside[idx] || comp[idx] !== -1) continue;
    const cq = [idx]; comp[idx] = ncomp;
    let touch = false, area = 0;
    while (cq.length) {
      const c = cq.pop();
      area++;
      const x = c % W, y = (c / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touch = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nidx = ny * W + nx;
        if (!outside[nidx] && comp[nidx] === -1) { comp[nidx] = ncomp; cq.push(nidx); }
      }
    }
    touchesBorder.push(touch);
    compArea.push(area);
    ncomp++;
  }
  let mainComp = 0;
  for (let c = 1; c < ncomp; c++) if (compArea[c] > compArea[mainComp]) mainComp = c;

  // 3) Çevrili zemin delikleri (yalnız AÇIK zemin — otomatik güvenli):
  //    bölge piksellerinin ≥%70'i zeminle NEREDEYSE AYNI ise (dist<16) delik
  //    (kulp boşluğu). Ortalama-mesafe tek başına yetmez — krem pin yüzeyi
  //    (kedi tüyü) ortalamada zemine yakın çıkıp yanlışlıkla açılıyordu.
  const isHole = new Array(ncomp).fill(false);
  if (!cfg.dark) {
    const stats = new Map();
    for (let idx = 0; idx < W * H; idx++) {
      if (outside[idx]) continue;
      const i = px(idx % W, (idx / W) | 0);
      const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const s = stats.get(comp[idx]) ?? [0, 0];
      s[0]++; if (dist < 16) s[1]++;
      stats.set(comp[idx], s);
    }
    for (const [c, [n, strict]] of stats)
      if (c !== mainComp && n > 120 && strict / n >= 0.7) isHole[c] = true;
  }

  // 4) RGBA: dış zemin→alfa0; dış gölge (açık zemin)→sıcak mürekkep+orantılı
  //    alfa; iç geçerli→opak; sızıntı/delik→alfa0.
  const rgba = Buffer.alloc(W * H * 4);
  const INK = [40, 34, 48];
  for (let idx = 0; idx < W * H; idx++) {
    const x = idx % W, y = (idx / W) | 0;
    const i = px(x, y), o = idx * 4;
    if (outside[idx]) {
      if (!cfg.dark) {
        const L = lum(data[i], data[i + 1], data[i + 2]);
        // Alfa tabanı: kumaş greni ~0.05 ham alfa üretir ve koyu panelde
        // "tozlu dikdörtgen" olarak görünür — 0.14 altı sıfırlanır, kalan
        // gerçek gölge yeniden ölçeklenir (kontak-sayfa doğrulama bulgusu).
        const raw = ((Lbg - L) / Lbg) * 1.55;
        const a = raw < 0.14 ? 0 : Math.min(0.62, (raw - 0.14) * 1.8);
        rgba[o] = INK[0]; rgba[o + 1] = INK[1]; rgba[o + 2] = INK[2];
        rgba[o + 3] = Math.round(a * 255);
      }
    } else if (
      comp[idx] !== mainComp &&
      (touchesBorder[comp[idx]] || isHole[comp[idx]])
    ) {
      rgba[o + 3] = 0;
    } else {
      rgba[o] = data[i]; rgba[o + 1] = data[i + 1]; rgba[o + 2] = data[i + 2];
      rgba[o + 3] = 255;
    }
  }

  // 4b) Gölge alfasında morfolojik AÇMA (3×3 erozyon + genişletme), yalnız
  //     dış piksellerde: kumaş greninin izole benekleri (koyu panelde pırıltı
  //     tozu) silinir, bitişik gerçek gölge blobu korunur.
  if (!cfg.dark) {
    const a0 = new Uint8Array(W * H);
    for (let idx = 0; idx < W * H; idx++) a0[idx] = rgba[idx * 4 + 3];
    const pass = (srcA, pick) => {
      const dst = new Uint8Array(srcA);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (!outside[idx]) continue;
          let v = srcA[idx];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            v = pick(v, srcA[ny * W + nx]);
          }
          dst[idx] = v;
        }
      return dst;
    };
    const eroded = pass(a0, Math.min);
    const opened = pass(eroded, Math.max);
    for (let idx = 0; idx < W * H; idx++)
      if (outside[idx]) rgba[idx * 4 + 3] = opened[idx];
  }

  // 5) İçerik bbox'una kırp (+8px pay), PNG yaz.
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let idx = 0; idx < W * H; idx++) {
    if (rgba[idx * 4 + 3] > 12) {
      const x = idx % W, y = (idx / W) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const pad = 8;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toFile(outPath);
  return { w: maxX - minX + 1, h: maxY - minY + 1 };
}

for (const [owner, pins] of Object.entries(SETS)) {
  mkdirSync(path.join(OUT, owner), { recursive: true });
  for (const p of pins) {
    if (!existsSync(path.join(SRC, p.sheet))) {
      console.warn("SKIP (sheet yok):", owner, p.key);
      continue;
    }
    const out = path.join(OUT, owner, `${p.key}.png`);
    const r = await cutPin(p.sheet, p, out);
    console.log(owner, p.key, `${r.w}x${r.h}`);
  }
}
console.log("done");
