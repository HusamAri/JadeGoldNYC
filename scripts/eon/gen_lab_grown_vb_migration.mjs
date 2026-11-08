#!/usr/bin/env node
/**
 * EON lab-grown 02 Vertical Baguette (EON-VB6) → panel taslağı:
 * supabase/migrations/0176_eon_lab_grown_vb6.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/02-vertical-baguette/listing.json. Fiyat orada (sahip kararı
 * 2026-11-07: liste $2.665, %25 vitrinle $1.999, her beden tek fiyat; US 4-16 yarım beden, 3 renk).
 * Gram burada türetilir: üreticinin bant listesinin beden eğrisi (maker_cost.list_g14 biçimi
 * 0,836 + 0,0515 × US), üreticinin kendi 11,5 g / US 8½ değerine sabitlenmiş; `weight_source =
 * 'estimated'`. Üç renk aynı fiyat ve gramı taşır, SQL rengi cross join ile çoğaltır: elle taşınan
 * satır 25, varyant 75.
 *
 * Görsel bu dosyada yok (galeri ayrı migration, URL'ler canlıda 200 döndükten sonra).
 * Protokol ring_band (Jewelry > Rings > Bands): lab-grown hat alyans değil (sahip 2026-11-04).
 *
 * Kapılar: ortak metin kapıları (scripts/eon/lab_grown_gates.mjs) + yapı-metin bağı: açıklama satılan
 * beden aralığını ve tek fiyatı söyler, karat yazmaz (üretici teyidi yok), ölçüler başlık/açıklamada aynı.
 *
 * Çıktının sonuna md5 mührü basılır; DB'ye yazıldıktan sonra README'deki sorgu canlıdan koşulur.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_vb_migration.mjs
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bandCells, bandMigrationSql, bandRows, fmtSize } from "./lab_grown_band.mjs";
import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/02-vertical-baguette";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0176_eon_lab_grown_vb6.sql");

// ---- metin kapıları
checkListingText(L);
assert(L.description.includes(`US ${fmtSize(L.sizes.from)} to US ${fmtSize(L.sizes.to)}, including half sizes`),
  "açıklama satılan beden aralığını söylemeli");
assert.equal(L.pricing.onePriceAllSizes, true);
assert(L.description.includes("One price for every size"), "tek fiyat açıklamada");
assert(!/\bcarats?\b|\bct\b|0\.35/i.test(L.description), "karat üretici teyidi olmadan yazılmaz");
assert(/\b6mm\b/.test(L.title) && L.description.includes("6 mm wide") && L.description.includes("2.2 mm thick"));
assert.equal(L.band.widthMm, 6);
assert.equal(L.band.thicknessMm, 2.2);
assert.equal(L.listingProtocol, "ring_band");

// ---- gram: üreticinin beden eğrisi, US 8½ = 11,5 g
const shape = (us) => 0.836 + 0.0515 * us;
const gramAt = (us) => (L.gram.anchorGrams * shape(us)) / shape(L.gram.anchorUs);
const cells = bandCells(L, gramAt);
assert.equal(cells.length, 25);
assert.equal(cells.find((c) => c.size === 8.5).grams, 11.5);
assert(cells[0].grams > 9 && cells[24].grams < 15.5, "gram aralığı makul değil");

// ---- varyant satırları + mühür (ortak modül; SQL aynı kuralla üretir)
const { rows, seal } = bandRows(L, cells);
assert.equal(rows.length, 75);

const sql = bandMigrationSql({
  fileName: "0176_eon_lab_grown_vb6.sql",
  header: [
    "EON lab-grown 02: 14K Vertical Baguette band, 6 mm × 2,2 mm, fırçalanmış dış / cilalı iç, tek dikey",
    "(bandın enine) 6 × 2 mm lab-grown baget, kenardan kenara ve yüzeyle aynı hizada.",
    "Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat $2.665",
    "(sahip kararı 2026-11-07; alıcı %25 vitrinle $1.999). Maliyet okuması B: 11,5 g × $100 (altın + işçilik)",
    "+ taş 0,35 ct × $280 + takma $10 = $1.258 (US 8½); kanıt: docs/eon/lab-grown/2026-11-07-vertical-baguette-pricing.md.",
  ],
  L,
  pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_vb_migration.mjs",
  cells,
  seal,
});

await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 1 product, ${rows.length} variants, grams US${cells[0].label} ${cells[0].grams} → US${cells[24].label} ${cells[24].grams}`);
console.log(`variantSeal ${seal}`);
