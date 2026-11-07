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
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkListingText } from "./lab_grown_gates.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/02-vertical-baguette";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0176_eon_lab_grown_vb6.sql");

const EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";

// ---- metin kapıları
checkListingText(L);
const fmtSize = (s) => (Number.isInteger(s) ? String(s) : s.toFixed(1));
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
const sizes = [];
for (let s = L.sizes.from; s <= L.sizes.to + 1e-9; s += L.sizes.step) sizes.push(Number(s.toFixed(1)));
assert.equal(sizes.length, 25);
const cells = sizes.map((s) => ({ size: s, label: fmtSize(s), grams: Number(gramAt(s).toFixed(2)) }));
assert.equal(cells.find((c) => c.size === 8.5).grams, 11.5);
assert(cells[0].grams > 9 && cells[24].grams < 15.5, "gram aralığı makul değil");

// ---- varyant satırları (SQL aynı kuralla üretir; mühür buradan)
const rows = [];
for (const [code, name] of L.colors) {
  for (const c of cells) {
    rows.push({
      sku: `${L.productSku}-14K-${code}-US${String(Math.round(c.size * 10)).padStart(3, "0")}`,
      color: name,
      size: `US ${c.label}`,
      price: L.priceCents,
      grams: c.grams,
    });
  }
}
assert.equal(rows.length, 75);
for (const r of rows) assert(r.sku.length <= 32, r.sku);
assert.equal(new Set(rows.map((r) => r.sku)).size, 75);
const sealRows = [...rows]
  .sort((a, b) => (a.sku < b.sku ? -1 : 1))
  .map((r) => [r.sku, r.color, r.size, r.price, r.grams.toFixed(2)].join("|"));
const seal = createHash("md5").update(sealRows.join("\n")).digest("hex");

// ---- SQL
const q = (s) => {
  assert(!String(s).includes("$ww$"), "dollar-quote çakışması");
  return `$ww$${s}$ww$`;
};
const arr = (xs) => `ARRAY[${xs.map(q).join(",")}]::text[]`;
const meta = {
  productType: L.productType,
  listingProtocol: L.listingProtocol,
  protocolVersion: "etsy-listing-v1",
  section: null,
  sourcePackage: L.sourcePackage,
  sourcePackagePath: pkgRel,
  generatorScript: "scripts/eon/gen_lab_grown_vb_migration.mjs",
  sourceReferenceUrl: L.referenceUrl,
  variationAxes: L.variationAxes,
  metalColor: "Yellow, white or rose gold (Metal Color axis)",
  goldSolidity: "Solid gold",
  offersPersonalization: false,
  stone: L.stone,
  band: L.band,
  gram: L.gram,
  pricing: L.pricing,
  classification: L.classification,
  approval: L.approval,
  variantSeal: seal,
};

const colorValues = L.colors.map(([code, name]) => `('${code}','${name}')`).join(",");
const sizeValues = cells.map((c) => `(${c.size.toFixed(1)},'${c.label}',${c.grams.toFixed(2)})`).join(",\n    ");

const sql = `-- 0176_eon_lab_grown_vb6.sql
-- EON lab-grown 02: 14K Vertical Baguette band, 6 mm × 2,2 mm, fırçalanmış dış / cilalı iç, tek dikey
-- (bandın enine) 6 × 2 mm lab-grown baget, kenardan kenara ve yüzeyle aynı hizada.
-- Metal Color (3) × Ring Size (US 4-16, yarım bedenler, 25) = 75 varyant, her beden tek fiyat $2.665
-- (sahip kararı 2026-11-07; alıcı %25 vitrinle $1.999). Maliyet okuması B: 11,5 g × $100 (altın + işçilik)
-- + taş 0,35 ct × $280 + takma $10 = $1.258 (US 8½); kanıt: docs/eon/lab-grown/2026-11-07-vertical-baguette-pricing.md.
-- Kaynak paket: ${pkgRel}/. Üretici: scripts/eon/gen_lab_grown_vb_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-VB6-%';
--   beklenen: ${seal}
begin;

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type,
  stone_shape, stone_origin, stone_count, setting_fee_cents, casting_fee_cents,
  listing_metadata
)
select
  '${EON_ORG}', '${L.productSku}', ${q(L.title)},
  ${q(L.description)},
  ${arr(L.tags)}, ${arr(L.materials)}, 'draft', 'USD',
  ${L.priceCents}, ${L.quantityPerVariant}, true, null, 0, '${L.productType}',
  '${L.stone.shape}', '${L.stone.origin}', ${L.stone.count}, ${L.stone.settingFeeCents}, ${L.stone.castingFeeCents},
  ${q(JSON.stringify(meta))}::jsonb
where not exists (
  select 1 from public.products p where p.org_id = '${EON_ORG}' and p.sku = '${L.productSku}'
);

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency,
  stone_carat, stone_cost_cents, stone_cost_source
)
select
  p.org_id,
  '${L.productSku}-14K-' || c.code || '-US' || lpad(round(s.size * 10)::int::text, 3, '0'),
  p.id,
  '14K / US ' || s.label || ' / ' || c.name,
  jsonb_build_object('Metal Color', c.name, 'Ring Size', 'US ' || s.label),
  ${L.priceCents},
  ${L.quantityPerVariant},
  s.grams,
  '${L.gram.weightSource}',
  true,
  'USD',
  ${L.stone.totalCarat},
  ${L.stone.stoneCostCentsEstimate},
  'manual'
from public.products p
cross join (values ${colorValues}) as c(code, name)
cross join (values
    ${sizeValues}) as s(size, label, grams)
where p.org_id = '${EON_ORG}' and p.sku = '${L.productSku}'
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  name = excluded.name,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  stone_carat = excluded.stone_carat,
  stone_cost_cents = excluded.stone_cost_cents,
  stone_cost_source = excluded.stone_cost_source,
  updated_at = now();

commit;
`;

await writeFile(outFile, sql);
console.log(`wrote ${path.relative(repoRoot, outFile)}: 1 product, ${rows.length} variants, grams US${cells[0].label} ${cells[0].grams} → US${cells[24].label} ${cells[24].grams}`);
console.log(`variantSeal ${seal}`);
