-- 0187_artifact_silver_chains_cost5.sql
-- by Artifact Studio Jewelry (Leander) silver chains S01-S06: list prices rebuilt on the supplier cost.
-- Owner 2026-11-12: "5 usd is each gram's cost in silvers. Assume ads cost and Etsy fees and set highly competitive prices."
-- list = ceil((5.00 x grams + 8.50 + 0.45) / (0.905 x 0.75)), grams = catalog 18 in weight x length / 18
-- (docs/artifact-studio/silver-chains/pricing.py). The list price breaks even at the deepest planned sale (25%);
-- at the 15% shop sale it leaves 10.65% of the buyer price for Etsy Ads and profit.
-- Live Etsy was the 0173 list x 0.65 (owner's own cut, 8 to 11 Nov); 63 of 144 variants were below cost there.
-- Precondition: live set seal = 84f0f7969e89e3d9e01819b7c681bd2e (0173 as applied); postcondition: 943509361507c0a24d27a69ae427f162.
-- Runs once: a second run finds the post seal and stops.
do $$
declare s text; n int;
begin
  select md5(string_agg(line, E'\n' order by line collate "C")), count(*) into s, n from (
    select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line from public.product_variants v where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and v.sku like 'BAS-SLV-S0_-%') x;
  if s = '943509361507c0a24d27a69ae427f162' then raise notice 'already repriced'; return; end if;
  if n <> 144 or s is distinct from '84f0f7969e89e3d9e01819b7c681bd2e' then raise exception 'precondition: % variants, seal %', n, s; end if;

  update public.product_variants v
  set price_cents = (ceil((5.00 * m.g18 * (split_part(v.properties->>'Length', ' ', 1))::numeric / 18 + 8.95) / 0.67875) * 100)::int,
      updated_at = now()
  from (values ('S01',2.2,12.9),('S01',3,21.7),('S01',3.4,28.3),('S01',4.1,41.1),('S01',4.8,56.0),('S01',5.2,65.3),('S02',2.2,12.9),('S02',3,21.7),('S02',3.4,28.3),('S02',4.1,41.1),('S02',4.8,56.0),('S02',5.2,65.3),('S03',3.3,7.6),('S03',4.8,14.8),('S03',6.5,25.1),('S03',7.6,32.6),('S03',8.5,41.6),('S03',10.2,52.8),('S04',3.3,7.6),('S04',4.8,14.8),('S04',6.5,25.1),('S04',7.6,32.6),('S04',8.5,41.6),('S04',10.2,52.8),('S05',3.4,7.1),('S05',4.6,12.5),('S05',6.6,23.5),('S05',7.2,30.7),('S05',8.3,35.1),('S05',10.3,55.3),('S06',3.4,7.1),('S06',4.6,12.5),('S06',6.6,23.5),('S06',7.2,30.7),('S06',8.3,35.1),('S06',10.3,55.3)) m(lid, width, g18)
  where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and v.sku like 'BAS-SLV-S0_-%' and v.sku like 'BAS-SLV-' || m.lid || '-%'
    and v.properties->>'Width' = trim_scale(m.width) || ' mm';
  get diagnostics n = row_count;
  if n <> 144 then raise exception 'updated % variants, expected 144', n; end if;

  update public.products p
  set price_cents = (select min(price_cents) from public.product_variants v where v.product_id = p.id),
      listing_metadata = jsonb_set(jsonb_set(listing_metadata, '{pricing,model}', to_jsonb('pricing.py: cost-plus (owner 2026-11-12): list = ceil((5.00 USD/g x grams + 8.50 + 0.45) / (0.905 x 0.75)); breaks even at a 25% sale, leaves 10.65% for ads and profit at the 15% sale; Offsite Ads not in the floor'::text)),
        '{variantSeal}', to_jsonb((select md5(string_agg(v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00'), E'\n' order by v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') collate "C")) from public.product_variants v where v.product_id = p.id))),
      updated_at = now()
  where p.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and p.id in (select v.product_id from public.product_variants v where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and v.sku like 'BAS-SLV-S0_-%');
  get diagnostics n = row_count;
  if n <> 6 then raise exception 'updated % products, expected 6', n; end if;

  select md5(string_agg(line, E'\n' order by line collate "C")) into s from (
    select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line from public.product_variants v where v.org_id = '2c254edf-2119-4079-b09e-dc672e32c1f9' and v.sku like 'BAS-SLV-S0_-%') x;
  if s <> '943509361507c0a24d27a69ae427f162' then raise exception 'postcondition seal %', s; end if;
end $$;
