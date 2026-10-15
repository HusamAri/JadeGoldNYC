#!/usr/bin/env node
/**
 * EON listing paketleri icin 12 — gravur karti. ELLE DIZILIR, model uretmez.
 *
 * Neden: modelin yuzuk icine "yazdigi" gravur harfleri bozuk cikar ve alicinin
 * secebilecegi fontlari gostermez. Kart, aciklamada vaat edilen dort fontu
 * (1 Prata, 2 Cinzel, 3 Cinzel Decorative, 4 Great Vibes) gercek fontla dizer;
 * aciklamadaki font listesi ve karakter siniri burada yazilanla uyusmazsa
 * script yazmaz.
 *
 * Gorsel alan: her rengin ic yuzey karesi (09-interior.jpg).
 * Numaralar Charter ile: Cinzel'in "1"i "I" gibi okunuyor (spec karti ile ayni ders).
 * Fontlar sistemde kurulu olmali (Google Fonts, OFL): Cinzel, Cinzel
 * Decorative, Prata, Great Vibes. `fc-list | grep -iE "cinzel|prata|great vibes"`.
 *
 * Kullanim: node scripts/eon/typeset_engraving_card.mjs tideline
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const FAMILIES = {
  tideline: { pkg: "2026-10-15-eon-tideline-band", photo: "09-interior.jpg" },
};
const family = FAMILIES[process.argv[2]];
assert(family, `bilinmeyen aile: ${process.argv[2]} (${Object.keys(FAMILIES).join("|")})`);

const FONTS = [
  { n: 1, name: "Prata", family: "Prata", size: 74 },
  { n: 2, name: "Cinzel", family: "Cinzel", size: 70 },
  { n: 3, name: "Cinzel Decorative", family: "Cinzel Decorative", size: 66 },
  { n: 4, name: "Great Vibes", family: "Great Vibes", size: 92 },
];
const SAMPLE = "Forever Yours";
const LIMIT = 30;
assert(SAMPLE.length <= LIMIT);

// Font kurulu degilse SVG sessizce yedek fonta duser ve kart YALAN soyler.
const installed = execFileSync("fc-list", [":", "family"], { encoding: "utf8" });
for (const f of FONTS) {
  assert(
    installed.split("\n").some((l) => l.split(",").map((x) => x.trim()).includes(f.family)),
    `font kurulu degil: ${f.family}`,
  );
}

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, "../../docs/eon/listings", family.pkg);
const manifest = JSON.parse(await readFile(path.join(pkg, "listing-manifest.json"), "utf8"));
const COLORS = { Y: "yellow", W: "white", R: "rose" };
const W = 2048, H = 2048, PHOTO = 900, PHOTO_Y = 70;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

for (const listing of manifest.listings) {
  const dir = COLORS[listing.listingSku.split("-").pop()];
  const desc = listing.description;
  const fontLine = FONTS.map((f) => `${f.n} ${f.name}`).join(", ").replace(/, (4 [^,]+)$/, " or $1");
  assert(desc.includes(fontLine), `${dir}: aciklamadaki font listesi kartla uyusmuyor (${fontLine})`);
  assert(desc.includes(`up to ${LIMIT} characters`), `${dir}: karakter siniri kartla uyusmuyor`);

  const photo = await sharp(path.join(pkg, "images", dir, family.photo)).resize(PHOTO, PHOTO).toBuffer();
  const ink = "#2B2622", muted = "#7A6F66", rule = "#D8CFC4";
  const top = PHOTO_Y + PHOTO + 120;
  const rowY = (i) => top + 230 + i * 165;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="${top}" text-anchor="middle" font-family="Cinzel" font-size="78" letter-spacing="14" fill="${ink}">INSIDE ENGRAVING</text>
  <text x="${W / 2}" y="${top + 74}" text-anchor="middle" font-family="Prata" font-size="42" fill="${muted}">Optional  ·  up to ${LIMIT} characters  ·  choose one font</text>
  <line x1="424" y1="${top + 120}" x2="${W - 424}" y2="${top + 120}" stroke="${rule}" stroke-width="3"/>
  ${FONTS.map((f, i) => `
  <text x="640" y="${rowY(i)}" text-anchor="end" font-family="Cinzel" font-size="36" letter-spacing="5" fill="${muted}"><tspan font-family="'Bitstream Charter', serif" font-size="40" letter-spacing="0">${f.n}</tspan>  ${esc(f.name.toUpperCase())}</text>
  <text x="700" y="${rowY(i)}" font-family="${f.family}" font-size="${f.size}" fill="${ink}">${esc(SAMPLE)}</text>`).join("")}
</svg>`;

  const out = path.join(pkg, "images", dir, "12-engraving-card.jpg");
  await sharp({ create: { width: W, height: H, channels: 3, background: "#F4EFE8" } })
    .composite([{ input: photo, top: PHOTO_Y, left: (W - PHOTO) / 2 }, { input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toColorspace("srgb")
    .toFile(out);
  console.log(`${dir}: 12-engraving-card.jpg  |  ${fontLine}`);
}
