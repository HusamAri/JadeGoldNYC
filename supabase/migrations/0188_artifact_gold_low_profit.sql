-- 0188_artifact_gold_low_profit.sql
-- by Artifact Studio Jewelry (Leander): low-profit list prices for the 22 gold listings whose cost is the maker's
-- own band list or a per-piece quote (Christmas rings R01-R10, N02, B09; For Him rings R01-R10). 4,914 variants.
-- Owner 2026-11-12: "sell with low profit ... set highly competitive prices for ... the listings that we are secure about costs".
-- list = ceil5((grams x rate + extras + 22.00 + 0.45) / (0.905 x 0.75)); see docs/artifact-studio/low-profit-2026-11-12/gen.py.
-- Before: panel = catalog (2 x maker cost); live Etsy was the catalog x 1.265 (two listings x 1.0 and x 1.2).
-- Precondition: set seal = 0f49501f32a2d3d5ea0105e211893176 (catalog as applied); postcondition: aef08ece5ae02842664f762ea6e7974e.
-- Runs once: a second run finds the post seal and stops.
do $$
declare s text; n int;
begin
  select md5(string_agg(line, E'\n' order by line collate "C")), count(*) into s, n from (
    select v.sku || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line from public.product_variants v where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and (v.sku ~ '^BAS-XM-R(0[1-9]|10)-' or v.sku like 'BAS-XM-N02-%' or v.sku like 'BAS-XM-B09-%' or v.sku ~ '^BAS-HM-R(0[1-9]|10)-')) x;
  if s = 'aef08ece5ae02842664f762ea6e7974e' then raise notice 'already repriced'; return; end if;
  if n <> 4914 or s is distinct from '0f49501f32a2d3d5ea0105e211893176' then raise exception 'precondition: % variants, seal %', n, s; end if;

  update public.product_variants v
  set price_cents = (ceil((v.weight_grams * r.rate
        + (case when v.sku like 'BAS-XM-R02-%' then 100 when v.sku like 'BAS-XM-N02-%' then 50 when v.sku like 'BAS-XM-B09-%' then 100 else 0 end)
        + 22.45) / 0.67875 / 5) * 5 * 100)::int,
      updated_at = now()
  from (values ('10K', 77.43), ('14K', 100.00), ('18K', 123.13)) r(k, rate)
  where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and (v.sku ~ '^BAS-XM-R(0[1-9]|10)-' or v.sku like 'BAS-XM-N02-%' or v.sku like 'BAS-XM-B09-%' or v.sku ~ '^BAS-HM-R(0[1-9]|10)-') and v.properties->>'Karat' = r.k;
  get diagnostics n = row_count;
  if n <> 4914 then raise exception 'updated % variants, expected 4914', n; end if;

  update public.products p
  set price_cents = (select min(price_cents) from public.product_variants v where v.product_id = p.id),
      listing_metadata = jsonb_set(coalesce(listing_metadata, '{}'::jsonb), '{lowProfit20261112}', to_jsonb('low profit (owner 2026-11-12): list = ceil5((grams x maker rate + extras + 22.00 + 0.45) / (0.905 x 0.75)); maker rate per alloy gram 10K 77.43, 14K 100.00, 18K 123.13; breaks even at a 25% sale; docs/artifact-studio/low-profit-2026-11-12/gen.py'::text)),
      updated_at = now()
  where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.id in (select v.product_id from public.product_variants v where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and (v.sku ~ '^BAS-XM-R(0[1-9]|10)-' or v.sku like 'BAS-XM-N02-%' or v.sku like 'BAS-XM-B09-%' or v.sku ~ '^BAS-HM-R(0[1-9]|10)-'));
  get diagnostics n = row_count;
  if n <> 22 then raise exception 'updated % products, expected 22', n; end if;

  select md5(string_agg(line, E'\n' order by line collate "C")) into s from (
    select v.sku || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line from public.product_variants v where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and (v.sku ~ '^BAS-XM-R(0[1-9]|10)-' or v.sku like 'BAS-XM-N02-%' or v.sku like 'BAS-XM-B09-%' or v.sku ~ '^BAS-HM-R(0[1-9]|10)-')) x;
  if s <> 'aef08ece5ae02842664f762ea6e7974e' then raise exception 'postcondition seal %', s; end if;
end $$;
