#!/usr/bin/env node
/**
 * Willow 07 — spec karti. ELLE DIZILIR, model uretmez.
 *
 * Neden: modelin gorsele yazdigi rakam yazim hatasi degil YANLIS BEYANdir
 * (2026-09-11 dersi). Bu seride model iki kez sahte ayar damgasi da basti
 * ("14K HERITAGE GOLD", "14K WG"). O yuzden karttaki her rakam listing'in
 * kendi manifest'inden okunur ve script, metinle manifest uyusmazsa yazmaz.
 *
 * Gorsel alan: her rengin kabul edilmis hero'su (01-hero-daylight.jpg).
 * Fontlar: Cinzel (baslik/etiket) + Prata (alt baslik) — aciklamada gravur
 * fontu olarak zaten vaat edilen iki font. Degerler Bitstream Charter: Prata'nin
 * eski-stil "1"i "l" gibi okundugu icin (ilk dizimde "lOK · l4K").
 *
 * Kullanim: node scripts/eon/typeset_willow_spec_card.mjs
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, "../../docs/eon/listings/2026-09-26-eon-willow-diamond-cut-band");
const manifest = JSON.parse(await readFile(path.join(pkg, "listing-manifest.json"), "utf8"));
const { karats, widthsMm, ringSizesUs } = manifest.structure;

// Rakamlar yalniz manifest'ten. Yapiyla metin arasinda sapma = hata.
const sizeMin = Math.min(...ringSizesUs);
const sizeMax = Math.max(...ringSizesUs);
const halfSizes = ringSizesUs.some((s) => !Number.isInteger(s));
const karatLine = karats.join("  ·  ");
const widthLine = `${widthsMm.join("  ·  ")} mm`;
const sizeLine = `US ${sizeMin} to ${sizeMax}${halfSizes ? ", half sizes included" : ""}`;

const COLORS = { Y: "yellow", W: "white", R: "rose" };
const W = 2048, H = 2048, PHOTO = 1080, PHOTO_Y = 60;
// Degerler Charter ile dizilir: Prata'nin "1"i kucuk "l" gibi okunuyordu
// ("10K" -> "lOK"). Kartin tek isi rakam oldugu icin rakami net font sart.
const VALUE_FONT = "'Bitstream Charter', 'Liberation Serif', serif"; // bosluklu ad SVG'de tirnaksiz eslesmiyor
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

for (const listing of manifest.listings) {
  const code = listing.listingSku.split("-").pop();
  const dir = COLORS[code];
  const desc = listing.description;
  // Kartta vaat edilen her sey aciklamada da yazili olmali.
  assert(desc.includes(widthsMm.join(", ").replace(/, (\d+)$/, " or $1") + " mm"), `${dir}: genislik metni kartla uyusmuyor`);
  assert(desc.includes(`US ${sizeMin} to US ${sizeMax}, including half sizes`), `${dir}: beden metni kartla uyusmuyor`);
  assert(desc.includes("up to 30 characters"), `${dir}: gravur siniri kartla uyusmuyor`);
  assert(/No gemstones/.test(desc), `${dir}: 'No gemstones' aciklamada yok`);
  assert(!/thick/i.test(desc), `${dir}: kaynaksiz kalinlik beyani`);

  const metalName = listing.metalColor.toUpperCase();
  const rows = [
    ["SOLID GOLD", karatLine],
    ["WIDTH", widthLine],
    ["RING SIZE", sizeLine],
    ["FIT", "Comfort fit, polished interior"],
    ["ENGRAVING", "Optional inside, up to 30 characters"],
  ];

  // Kare fotograf, kirpmasiz: yuzuk urun oldugu icin kesilmez.
  const hero = await sharp(path.join(pkg, "images", dir, "01-hero-daylight.jpg"))
    .resize(PHOTO, PHOTO)
    .toBuffer();

  const ink = "#2B2622", muted = "#7A6F66", rule = "#D8CFC4";
  const top = PHOTO_Y + PHOTO + 130;
  const rowY = (i) => top + 215 + i * 88;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${W / 2}" y="${top}" text-anchor="middle" font-family="Cinzel" font-size="96" letter-spacing="18" fill="${ink}">WILLOW</text>
  <text x="${W / 2}" y="${top + 80}" text-anchor="middle" font-family="Prata" font-size="46" fill="${muted}">Hand diamond-cut leaves on brushed satin  ·  ${esc(metalName)}</text>
  <line x1="424" y1="${top + 140}" x2="${W - 424}" y2="${top + 140}" stroke="${rule}" stroke-width="3"/>
  ${rows.map(([k, v], i) => `
  <text x="760" y="${rowY(i)}" text-anchor="end" font-family="Cinzel" font-size="40" letter-spacing="6" fill="${muted}">${esc(k)}</text>
  <text x="820" y="${rowY(i)}" font-family="${VALUE_FONT}" font-size="50" fill="${ink}">${esc(v)}</text>`).join("")}
  <text x="${W / 2}" y="${H - 55}" text-anchor="middle" font-family="Prata" font-size="36" fill="${muted}">No gemstones  ·  "diamond-cut" is the faceting technique</text>
</svg>`;

  const out = path.join(pkg, "images", dir, "07-spec-card.jpg");
  await sharp({ create: { width: W, height: H, channels: 3, background: "#F4EFE8" } })
    .composite([{ input: hero, top: PHOTO_Y, left: (W - PHOTO) / 2 }, { input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toColorspace("srgb")
    .toFile(out);
  console.log(`${dir}: 07-spec-card.jpg  |  ${karatLine}  |  ${widthLine}  |  ${sizeLine}`);
}
