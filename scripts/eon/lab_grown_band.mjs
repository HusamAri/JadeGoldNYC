/**
 * EON lab-grown tek taşlı BANT paketleri için ortak panel-taslağı üreteci (02 VB6, 03 FR6 ...).
 *
 * Her paket kendi üretecinde yalnız ürüne özgü olanı tutar: yapı-metin kapıları, gram eğrisi ve
 * migration başlığındaki ürün tarifi. Satırlar, mühür ve SQL gövdesi burada, tek kaynaktan:
 *  - beden hücreleri (US from..to, step) × renk = varyant; SKU `<sku>-14K-<renk>-US<beden×10>`;
 *  - mühür: sku|Metal Color|Ring Size|price_cents|gram (FM990.00), SKU "C" sırasıyla (README sorgusu);
 *  - SQL: ürün not-exists ile bir kez, varyantlar (org_id, sku) upsert; Etsy'ye yazmaz, görsel yok.
 * 0176 (VB6) bu modüle taşındığında çıktısı bayt bayt aynı kaldı (2026-11-08).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0";

export const fmtSize = (s) => (Number.isInteger(s) ? String(s) : s.toFixed(1));

/** Beden hücreleri: {size, label, grams}; gram 2 haneye yuvarlanır (DB numeric ile aynı). */
export function bandCells(L, gramAt) {
  const sizes = [];
  for (let s = L.sizes.from; s <= L.sizes.to + 1e-9; s += L.sizes.step) sizes.push(Number(s.toFixed(1)));
  return sizes.map((s) => ({ size: s, label: fmtSize(s), grams: Number(gramAt(s).toFixed(2)) }));
}

/** Varyant satırları + md5 mührü (SQL aynı kuralla üretir). */
export function bandRows(L, cells) {
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
  for (const r of rows) assert(r.sku.length <= 32, r.sku);
  assert.equal(new Set(rows.map((r) => r.sku)).size, rows.length, "SKU tekil değil");
  const sealRows = [...rows]
    .sort((a, b) => (a.sku < b.sku ? -1 : 1))
    .map((r) => [r.sku, r.color, r.size, r.price, r.grams.toFixed(2)].join("|"));
  const seal = createHash("md5").update(sealRows.join("\n")).digest("hex");
  return { rows, seal };
}

/**
 * Migration SQL'i. `header`: dosya adından sonraki ürün tarifi satırları ("-- " öneki burada eklenir).
 */
export function bandMigrationSql({ fileName, header, L, pkgRel, generatorScript, cells, seal }) {
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
    generatorScript,
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

  return `-- ${fileName}
${header.map((h) => `-- ${h}`).join("\n")}
-- Kaynak paket: ${pkgRel}/. Üretici: ${generatorScript} — ELLE DÜZENLEMEYİN.
--
-- Görsel yok: galeri ayrı migration'dır. Bu migration Etsy'ye yazmaz.
--
-- Idempotent: ürün varsa yeniden eklenmez (not-exists); varyantlar (org_id, sku) upsert.
--
-- Mühür (DB'den doğrulama):
--   select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
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
}
