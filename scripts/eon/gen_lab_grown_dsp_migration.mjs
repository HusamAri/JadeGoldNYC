#!/usr/bin/env node
/**
 * EON lab-grown Double Shared Prong band → panel taslağı:
 * supabase/migrations/0175_eon_lab_grown_dsp.sql
 *
 * Girdi YALNIZ docs/eon/lab-grown/01-double-shared-prong/listing.json. Fiyat orada
 * (sahip kararı 2026-11-04: liste $1.200, her beden tek fiyat); gram burada
 * geometriden türetilir (2,75 × 2,50 mm bant, taş yuvaları %12 metal alır) ve
 * `weight_source = 'estimated'` ile yazılır. Üç renk aynı fiyat ve gramı taşır,
 * SQL rengi cross join ile çoğaltır: elle taşınan satır 13, varyant 39.
 *
 * Görsel YOK: Etsy gerçek fotoğraf ister (playbook 01/04); taslak
 * `listing_metadata.draftTransfer = hold` ile ops/drafts-push'tan tutulur.
 *
 * Kapılar: başlık <15 kelime, 13 tag ≤20 kr, kelime-kümesi tekrar yok, occasion
 * sözcüğü yok (03-seo 2026-11-02), FTC §23.25: "diamond" yalnız lab niteleyicisinin
 * hemen ardından (ya da "mined diamonds" karşılaştırmasında).
 *
 * Çıktının sonuna md5 mührü basılır; DB'ye yazıldıktan sonra README'deki sorgu
 * canlıdan koşulup karşılaştırılır.
 *
 * Kullanım: node scripts/eon/gen_lab_grown_dsp_migration.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const pkgRel = "docs/eon/lab-grown/01-double-shared-prong";
const L = JSON.parse(await readFile(path.join(repoRoot, pkgRel, "listing.json"), "utf8"));
const outFile = path.join(repoRoot, "supabase/migrations/0175_eon_lab_grown_dsp.sql");

const EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";

// ---- metin kapıları
const words = L.title.trim().split(/\s+/);
assert(words.length < 15, `başlık ${words.length} kelime`);
assert(L.title.length <= 140, "başlık 140 kr");
assert(/\b14K Gold\b/.test(L.title) && !/\b1[08]K\b/.test(L.title), "başlıkta yalnız satılan ayar: 14K");
assert.equal(L.tags.length, 13);
const wset = (t) =>
  t.toLowerCase().split(/\s+/).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)).sort().join(" ");
assert.equal(new Set(L.tags.map(wset)).size, 13, "tag kelime-kümesi tekrarı");
const DEAD = /\b(gift|anniversary|promise|his|hers|him|her|unisex|minimalist|christmas)\b/;
for (const t of L.tags) {
  assert(t.length <= 20 && /^[a-z0-9' ]+$/.test(t), `tag biçimi: ${t}`);
  assert(!DEAD.test(t), `occasion sözcüğü: ${t}`);
}
// FTC §23.25: taş adının hemen önünde lab niteleyicisi; "mined diamonds" yalnız karşılaştırma.
const UNQUALIFIED =
  /(?<!\blab grown )(?<!\blab-grown )(?<!\blaboratory-grown )(?<!\blab created )(?<!\bmined )\bdiamonds?\b/i;
for (const [k, text] of Object.entries({
  title: L.title,
  description: L.description,
  tags: L.tags.join("\n"),
  materials: L.materials.join("\n"),
})) {
  const m = UNQUALIFIED.exec(text);
  assert(!m, `${k}: niteliksiz "diamond" @${m?.index}: …${text.slice(Math.max(0, (m?.index ?? 0) - 40), (m?.index ?? 0) + 12)}…`);
}
assert(!/\blab diamond\b/i.test(L.description + L.title + L.tags.join(" ")), '"lab diamond" yetersiz niteleyici');
assert(!/\bAI\b|\brender|\bvisuali[sz]ation|ABOUT THE IMAGES/i.test(L.description), "görsel yokken görsel beyanı yazılmaz");

// ---- gram: geometri (iç çap 11,63 + 0,8128×US; orta çevre × kesit × doluluk; taş yuvası %12)
const geomG = (w, thick, us) => {
  const d = 11.63 + 0.8128 * us;
  return ((w * thick * 0.9 * Math.PI * (d + thick) * 0.88) / 1000) * 13.0;
};
const sizes = [];
for (let s = L.sizes.from; s <= L.sizes.to + 1e-9; s += L.sizes.step) sizes.push(Number(s.toFixed(1)));
assert.equal(sizes.length, 13);
const cells = sizes.map((s) => ({
  size: s,
  label: Number.isInteger(s) ? String(s) : s.toFixed(1),
  grams: Number(geomG(L.band.widthMm, L.band.heightMm, s).toFixed(2)),
}));
assert(cells[0].grams > 3.5 && cells[12].grams < 5.5, "gram aralığı makul değil");

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
assert.equal(rows.length, 39);
for (const r of rows) assert(r.sku.length <= 32, r.sku);
assert.equal(new Set(rows.map((r) => r.sku)).size, 39);
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
  generatorScript: "scripts/eon/gen_lab_grown_dsp_migration.mjs",
  sourceReferenceUrl: L.referenceUrl,
  variationAxes: L.variationAxes,
  metalColor: "Yellow, white or rose gold (Metal Color axis)",
  goldSolidity: "Solid gold",
  offersPersonalization: false,
  stone: L.stone,
  band: L.band,
  pricing: L.pricing,
  approval: L.approval,
  draftTransfer: L.draftTransferHold,
  variantSeal: seal,
};

const colorValues = L.colors.map(([code, name]) => `('${code}','${name}')`).join(",");
const sizeValues = cells.map((c) => `(${c.size.toFixed(1)},'${c.label}',${c.grams.toFixed(2)})`).join(",\n    ");

const sql = `-- 0175_eon_lab_grown_dsp.sql
-- (Canlıya 2026-11-04 MCP ile "0173_eon_lab_grown_dsp" adıyla uygulandı; main'de 0173/0174 başka
-- migration'lara ait olduğu için dosya 0175'e taşındı. İçerik birebir, idempotent.)
-- EON'un ilk lab-grown pırlantalı listing'i: 14K Double Shared Prong yarım tur bant,
-- 13 round lab-grown taş (≈0,78 ct), Metal Color (3) × Ring Size (US 4-10, 13) = 39 varyant,
-- her beden tek fiyat $1.200 (sahip kararı 2026-11-04; alıcı %25 vitrinle $900).
-- Kaynak paket: ${pkgRel}/ (fiyat kanıtı: docs/eon/lab-grown/2026-11-04-double-shared-prong-pricing.md).
-- Üretici: scripts/eon/gen_lab_grown_dsp_migration.mjs — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: Etsy gerçek fotoğraf ister; listing_metadata.draftTransfer = hold ile
-- ops/drafts-push atlar. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\\n' order by sku collate "C"))
--   from product_variants where sku like 'EON-DSP-%';
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
  'estimated',
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
console.log(`wrote ${path.relative(repoRoot, outFile)}: 1 product, ${rows.length} variants, grams US${cells[0].label} ${cells[0].grams} → US${cells[12].label} ${cells[12].grams}`);
console.log(`variantSeal ${seal}`);
