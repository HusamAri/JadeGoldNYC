/**
 * EON lab-grown AYAR eksenli bant paketleri için panel-taslağı üreteci (07 TMC9, iki tonlu, 2026-11-13).
 *
 * lab_grown_band.mjs Metal Color × Ring Size içindir (tek ayar 14K, her varyant aynı fiyat). İki tonlu parçada renk
 * eksen DEĞİL, sabittir (beyaz raylar + sarı orta); eksen Karat × Ring Size, fiyat ve gram ayara göre değişir. Ortak
 * modüle dokunulmadı: o modülün çıktısı uygulanmış migration'ları üretir (0176, 0179, 0189...).
 *
 *  - hücre: {karat, size, label, grams}; gram 2 haneye yuvarlanır (DB numeric ile aynı);
 *  - SKU `<sku>-<10K|14K|18K>-US<beden×10, 3 hane>`;
 *  - mühür: sku|Karat|Ring Size|price_cents|gram (FM990.00), SKU "C" sırasıyla (aşağıdaki sorgu);
 *  - SQL: ürün not-exists ile bir kez, varyantlar (org_id, sku) upsert, satırlar açık VALUES (gram ayar × beden);
 *    Etsy'ye yazmaz, görsel yok.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { EON_ORG, fmtSize } from "./lab_grown_band.mjs";

export const KARATS = ["10K", "14K", "18K"];

/** Hücreler: ayar × beden. `gramAt(size, karat)` ham gram döner, burada 2 haneye yuvarlanır. */
export function karatCells(L, gramAt) {
  const sizes = [];
  for (let s = L.sizes.from; s <= L.sizes.to + 1e-9; s += L.sizes.step) sizes.push(Number(s.toFixed(1)));
  const cells = [];
  for (const k of L.karats.map((x) => x.karat)) {
    for (const s of sizes) cells.push({ karat: k, size: s, label: fmtSize(s), grams: Number(gramAt(s, k).toFixed(2)) });
  }
  return cells;
}

const priceOf = (L, karat) => {
  const k = L.karats.find((x) => x.karat === karat);
  assert(k && Number.isInteger(k.priceCents) && k.priceCents > 0, `fiyat yok: ${karat}`);
  return k.priceCents;
};

export const karatSku = (L, karat, size) => `${L.productSku}-${karat}-US${String(Math.round(size * 10)).padStart(3, "0")}`;

/** Varyant satırları + md5 mührü (SQL aynı kuralla doğrular). */
export function karatRows(L, cells) {
  const rows = cells.map((c) => ({
    sku: karatSku(L, c.karat, c.size),
    karat: c.karat,
    size: `US ${c.label}`,
    price: priceOf(L, c.karat),
    grams: c.grams,
  }));
  for (const r of rows) assert(r.sku.length <= 32, r.sku);
  assert.equal(new Set(rows.map((r) => r.sku)).size, rows.length, "SKU tekil değil");
  const sealRows = [...rows]
    .sort((a, b) => (a.sku < b.sku ? -1 : 1))
    .map((r) => [r.sku, r.karat, r.size, r.price, r.grams.toFixed(2)].join("|"));
  const seal = createHash("md5").update(sealRows.join("\n")).digest("hex");
  return { rows, seal };
}

const q = (s) => {
  assert(!String(s).includes("$ww$"), "dollar-quote çakışması");
  return `$ww$${s}$ww$`;
};
const arr = (xs) => `ARRAY[${xs.map(q).join(",")}]::text[]`;

/** products.listing_metadata: paketin yapısal alanları + varyant mührü. */
export function karatMeta({ L, pkgRel, generatorScript, seal }) {
  return {
    productType: L.productType,
    listingProtocol: L.listingProtocol,
    protocolVersion: "etsy-listing-v1",
    section: null,
    sourcePackage: L.sourcePackage,
    sourcePackagePath: pkgRel,
    generatorScript,
    sourceReference: L.referenceNote,
    variationAxes: L.variationAxes,
    metalColor: L.metalColor,
    goldSolidity: "Solid gold",
    offersPersonalization: false,
    karats: L.karats,
    stone: L.stone,
    band: L.band,
    gram: L.gram,
    pricing: L.pricing,
    classification: L.classification,
    approval: L.approval,
    variantSeal: seal,
  };
}

export function karatMigrationSql({ fileName, header, L, pkgRel, generatorScript, cells, seal }) {
  const meta = karatMeta({ L, pkgRel, generatorScript, seal });
  const minPrice = Math.min(...L.karats.map((k) => k.priceCents));
  const rowValues = cells
    .map((c) => `('${c.karat}',${priceOf(L, c.karat)},${c.size.toFixed(1)},'${c.label}',${c.grams.toFixed(2)})`)
    .join(",\n    ");
  return `-- ${fileName}
${header.map((h) => `-- ${h}`).join("\n")}
-- Kaynak paket: ${pkgRel}/. Üretici: ${generatorScript} — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert. products.price_cents en düşük
-- ayarın fiyatıdır (Etsy listing fiyatı en ucuz seçenektir); her varyant kendi ayarının fiyatını taşır.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Karat')||'|'||(properties->>'Ring Size')||'|'
--     ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\\n' order by sku collate "C"))
--   from product_variants where sku like '${L.productSku}-%';
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
  ${minPrice}, ${L.quantityPerVariant}, true, null, 0, '${L.productType}',
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
  '${L.productSku}-' || r.karat || '-US' || lpad(round(r.size * 10)::int::text, 3, '0'),
  p.id,
  r.karat || ' / US ' || r.label || ' / ${L.colorLabel}',
  jsonb_build_object('Karat', r.karat, 'Ring Size', 'US ' || r.label),
  r.price,
  ${L.quantityPerVariant},
  r.grams,
  '${L.gram.weightSource}',
  true,
  'USD',
  ${L.stone.totalCarat},
  ${L.stone.stoneCostCentsEstimate},
  'manual'
from public.products p
cross join (values
    ${rowValues}) as r(karat, price, size, label, grams)
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
}
