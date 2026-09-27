#!/usr/bin/env node
/**
 * Comet → panel taslakları: supabase/migrations/0154_eon_comet_family.sql
 *
 * Girdi YALNIZ listing-manifest.json (gen_comet_package.mjs çıktısı). Fiyat ve
 * gram burada hesaplanmaz, manifest'ten taşınır. Üç renk aynı fiyat ve gramı
 * taşıdığı için (assert) 378 hücre bir kez yazılır, SQL renk başına çoğaltır:
 * elle taşınan metin 1.134 satır yerine 378 satır olur.
 *
 * Görseller public/eon/comet/<renk>/ altından prod domain'inden servis edilir.
 * Etsy'ye gönderim ayrı adım: panelde listing sayfasındaki "Etsy'ye gönder"
 * (sahibin oturumu = yetki; Etsy'de DRAFT açılır, canlı değil).
 *
 * Çıktının sonuna bir md5 mührü basılır: DB'ye yazıldıktan sonra aynı sorgu
 * canlıdan koşulup karşılaştırılır (bkz. README).
 *
 * Kullanım: node scripts/eon/gen_comet_migration.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/listings/2026-09-27-eon-comet-stardust-band";
const manifest = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing-manifest.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0154_eon_comet_family.sql");

const EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";
const IMAGE_BASE = "https://amuletta.artifactstudio.info/eon/comet";
const COLOR_DIR = { Y: "yellow", W: "white", R: "rose" };

// Alt metin: sahnenin ne gösterdiği, renk adıyla. Model/üreteç adı geçmez.
const ALT = {
  "01-hero": "{c} gold sandblasted wedding band with one polished groove, standing on clear glass",
  "02-worn-linen": "{c} gold sparkle-finish band worn on the ring finger, hand resting on linen",
  "03-macro": "Close-up of the sparkling sandblasted surface and single polished groove on the {c} gold band",
  "04-width-ladder": "Three {c} gold sparkle-finish bands in narrow, medium and wide widths",
  "05-profile": "{c} gold band lying on cast glass, showing its square edge and groove",
  "06-worn-glass": "{c} gold sparkle-finish band worn while holding a glass of water",
  "07-spec-card": "Comet specification card: 10K 14K 18K, 3 to 8 mm, US 3 to 13",
  "08-scale-fingers": "{c} gold sparkle-finish band held between two fingers for scale",
  "09-interior": "{c} gold band seen from above, showing the polished comfort-fit interior",
  "10-pair": "Pair of {c} gold sparkle-finish wedding bands in two widths",
};

const q = (s) => {
  assert(!String(s).includes("$ww$"), "dollar-quote çakışması");
  return `$ww$${s}$ww$`;
};
const arr = (xs) => `ARRAY[${xs.map(q).join(",")}]::text[]`;

// ---- hücreler: üç renk birebir aynı olmalı
const key = (v) => `${v.properties.Karat}|${v.properties.Width}|${v.properties["Ring Size"]}`;
const [first, ...rest] = manifest.listings;
const cells = first.variants.map((v) => ({
  karat: v.properties.Karat,
  widthMm: Number(v.properties.Width.replace(" mm", "")),
  size: v.properties["Ring Size"].replace("US ", ""),
  priceCents: Math.round(v.priceUsd * 100),
  grams: v.estimatedTotalWeightGrams,
}));
assert.equal(cells.length, 378);
for (const l of rest) {
  assert.equal(l.variants.length, 378);
  l.variants.forEach((v, i) => {
    const a = first.variants[i];
    assert.equal(key(v), key(a), `${l.listingSku}: sıra farklı`);
    assert.equal(v.priceUsd, a.priceUsd, `${v.sku}: renkler arası fiyat farkı`);
    assert.equal(v.estimatedTotalWeightGrams, a.estimatedTotalWeightGrams, `${v.sku}: gram farkı`);
  });
}

// SQL'in türettiği SKU, manifest'teki SKU ile birebir olmalı.
const skuOf = (code, c) =>
  `EON-COMET-${code}-${c.karat.slice(0, 2)}-${String(c.widthMm).padStart(2, "0")}-${String(Math.round(Number(c.size) * 10)).padStart(3, "0")}`;
for (const l of manifest.listings) {
  const code = l.listingSku.split("-").pop();
  l.variants.forEach((v, i) => assert.equal(skuOf(code, cells[i]), v.sku));
}

// Galeri diskte olmalı, her renkte 10.
const gallery = {};
for (const code of Object.keys(COLOR_DIR)) {
  const files = (await readdir(path.join(repoRoot, "public/eon/comet", COLOR_DIR[code])))
    .filter((f) => /^\d{2}-.+\.jpg$/.test(f))
    .sort();
  assert.equal(files.length, 10, `${COLOR_DIR[code]}: public galeri 10 değil`);
  gallery[code] = files;
}

// ---- mühür: DB'den aynı biçimde yeniden üretilecek satırlar
const sealRows = manifest.listings
  .flatMap((l) => l.variants.map((v) => ({ v, l })))
  .sort((a, b) => (a.v.sku < b.v.sku ? -1 : 1)) // bayt sırası = SQL collate "C"
  .map(({ v }) =>
    [v.sku, v.properties.Karat, v.properties.Width, v.properties["Ring Size"], Math.round(v.priceUsd * 100), v.estimatedTotalWeightGrams.toFixed(2)].join("|"),
  );
const seal = createHash("md5").update(sealRows.join("\n")).digest("hex");

const cellValues = cells
  .map((c) => `('${c.karat}',${c.widthMm},'${c.size}',${c.priceCents},${c.grams.toFixed(2)})`)
  .join(",\n");

const listingValues = manifest.listings
  .map((l) => {
    const code = l.listingSku.split("-").pop();
    const meta = {
      productType: "ring",
      listingProtocol: "wedding_band",
      protocolVersion: "etsy-listing-v1",
      section: "Wedding Bands",
      sourcePackage: "2026-09-27-eon-comet-stardust-band",
      sourcePackagePath: pkgRel,
      generatorScript: "scripts/eon/gen_comet_migration.mjs",
      variationAxes: ["Karat", "Width", "Ring Size"],
      metalColor: l.metalColor,
      goldSolidity: l.goldSolidity,
      pricing: {
        laborUsd: manifest.pricing.laborUsd,
        goldSpotUsdPerOzt: manifest.pricing.goldSpotUsdPerOzt,
        goldQuoteTimestamp: manifest.pricing.goldQuoteTimestamp,
        storePromotionRate: manifest.pricing.storePromotionRate,
        methodology: manifest.pricingMethod,
        regression: manifest.summary.priceRegressionAgainstRidge,
      },
      approval: {
        blockers: manifest.approval.blockers,
        etsyDraftCreationAuthorized: true,
        livePublicationAuthorized: false,
        authority: "Owner instruction 2026-09-26: \"aynı şekilde listingleri oluştur\" (same flow as Willow: panel draft, then Etsy draft via the panel button).",
      },
      variantSeal: seal,
    };
    const images = gallery[code].map((f) => [f, ALT[f.replace(".jpg", "")].replaceAll("{c}", l.metalColor.split(" ")[0])]);
    images.forEach(([f, alt]) => assert(alt && !alt.includes("undefined"), `${f}: alt yok`));
    return `  (${q(code)}, ${q(l.listingSku)}, ${q(COLOR_DIR[code])}, ${q(l.title)},\n   ${q(l.description)},\n   ${arr(l.tags)}, ${arr(l.materials)},\n   ${q(JSON.stringify(images))}::jsonb,\n   ${q(JSON.stringify(meta))}::jsonb)`;
  })
  .join(",\n");

const sql = `-- 0154_eon_comet_family.sql
-- EON Comet: düz profilli, parlak kumlanmış (stardust) yüzeyli, çevresinde tek parlak
-- oluk olan alyans, renk başına bir listing (EON-COMET-Y/W/R), her biri Karat x Width x Ring Size = 378 varyant.
-- Kaynak paket: ${pkgRel}/ (README'de fiyat kanıtı: Ridge 378/378 + canlı DB mührü).
-- Üretici: scripts/eon/gen_comet_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Etsy: panelde "Etsy'ye gönder" (sahibin oturumu). Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (products'ta (org_id, sku) unique
-- yok, not-exists deseni); varyantlar (org_id, sku) üzerinden upsert; görsel
-- satırı aynı URL varsa atlanır. Etsy'de açılmış (etsy_listing_id dolu) ürüne
-- görsel eklenmez.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Karat')||'|'||(properties->>'Width')||'|'
--     ||(properties->>'Ring Size')||'|'||price_cents||'|'||to_char(weight_grams,'FM990.00'),
--     E'\\n' order by sku collate "C")) from product_variants where sku like 'EON-COMET-%';
--   beklenen: ${seal}
begin;

create temporary table _ww_cell(karat text, width_mm int, size text, price_cents int, grams numeric) on commit drop;
insert into _ww_cell values
${cellValues};

create temporary table _ww_listing(code text, sku text, dir text, title text, description text, tags text[], materials text[], images jsonb, meta jsonb) on commit drop;
insert into _ww_listing values
${listingValues};

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images,
  product_type, listing_metadata
)
select
  '${EON_ORG}', l.sku, l.title, l.description, l.tags, l.materials, 'draft', 'USD',
  (select min(price_cents) from _ww_cell), 20, true,
  '${IMAGE_BASE}/' || l.dir || '/' || (l.images->0->>0), jsonb_array_length(l.images),
  'ring', l.meta
from _ww_listing l
where not exists (
  select 1 from public.products p where p.org_id = '${EON_ORG}' and p.sku = l.sku
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  l.sku || '-' || left(c.karat, 2) || '-' || lpad(c.width_mm::text, 2, '0') || '-' || lpad(round(c.size::numeric * 10)::int::text, 3, '0'),
  p.id,
  c.width_mm || ' mm / US ' || c.size || ' / ' || c.karat,
  jsonb_build_object('Karat', c.karat, 'Width', c.width_mm || ' mm', 'Ring Size', 'US ' || c.size),
  c.price_cents,
  20,
  c.grams,
  'estimated',
  true,
  'USD'
from _ww_listing l
join public.products p on p.org_id = '${EON_ORG}' and p.sku = l.sku
cross join _ww_cell c
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, '${IMAGE_BASE}/' || l.dir || '/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from _ww_listing l
join public.products p on p.org_id = '${EON_ORG}' and p.sku = l.sku and p.etsy_listing_id is null
cross join lateral jsonb_array_elements(l.images) with ordinality img(v, n)
where not exists (
  select 1 from public.listing_images li
  where li.product_id = p.id and li.url = '${IMAGE_BASE}/' || l.dir || '/' || (img.v->>0)
);

commit;
`;

await writeFile(outFile, sql);
console.log(JSON.stringify({ file: path.relative(repoRoot, outFile), bytes: Buffer.byteLength(sql), cells: cells.length, variants: sealRows.length, seal }, null, 2));
