-- 0173_artifact_silver_chains_sale25.sql
-- by Artifact Studio Jewelry silver chains (S01-S06): list prices rebuilt for the shop's 25% sale (was built for 30%).
-- Owner 2026-10-27: "mağaza 25% indirimde buna uygun fiyatları ayarla". Buyer price stays 50 + 6 USD/g;
-- list = ceil9((50 + 6 x grams) / 0.75), grams = catalog 18in weight x length / 18 (docs/artifact-studio/silver-chains/pricing.py).
-- Precondition: live set seal = 8e85c330f76fa1511bee63664a01e817 (0172 as applied); postcondition: 84f0f7969e89e3d9e01819b7c681bd2e.
-- Runs once: a second run finds the post seal and stops.
do $$
declare s text;
begin
  select md5(string_agg(line, E'\n' order by line collate "C")) into s from (
    select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line
    from public.product_variants v join public.products p on p.id = v.product_id where p.sku like 'BAS-SLV-S0_') x;
  if s = '84f0f7969e89e3d9e01819b7c681bd2e' then raise notice 'already repriced'; return; end if;
  if s is distinct from '8e85c330f76fa1511bee63664a01e817' then raise exception 'precondition seal %', s; end if;

  update public.product_variants v
  set price_cents = ((ceil(((50 + 6.0 * m.g18 * (split_part(v.properties->>'Length', ' ', 1))::numeric / 18) / 0.75 + 1) / 10) * 10 - 1) * 100)::int,
      updated_at = now()
  from public.products p, (values ('S01',2.2,12.9),('S01',3.0,21.7),('S01',3.4,28.3),('S01',4.1,41.1),('S01',4.8,56.0),('S01',5.2,65.3),('S02',2.2,12.9),('S02',3.0,21.7),('S02',3.4,28.3),('S02',4.1,41.1),('S02',4.8,56.0),('S02',5.2,65.3),('S03',3.3,7.6),('S03',4.8,14.8),('S03',6.5,25.1),('S03',7.6,32.6),('S03',8.5,41.6),('S03',10.2,52.8),('S04',3.3,7.6),('S04',4.8,14.8),('S04',6.5,25.1),('S04',7.6,32.6),('S04',8.5,41.6),('S04',10.2,52.8),('S05',3.4,7.1),('S05',4.6,12.5),('S05',6.6,23.5),('S05',7.2,30.7),('S05',8.3,35.1),('S05',10.3,55.3),('S06',3.4,7.1),('S06',4.6,12.5),('S06',6.6,23.5),('S06',7.2,30.7),('S06',8.3,35.1),('S06',10.3,55.3)) m(lid, width, g18)
  where p.id = v.product_id and p.sku = 'BAS-SLV-' || m.lid
    and v.properties->>'Width' = trim_scale(m.width) || ' mm';

  update public.products p
  set price_cents = (select min(price_cents) from public.product_variants v where v.product_id = p.id),
      listing_metadata = jsonb_set(jsonb_set(listing_metadata, '{pricing,model}',
        to_jsonb('pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.75 (shop sale 25%), ends in 9'::text)),
        '{variantSeal}', to_jsonb((select md5(string_agg(v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00'), E'\n' order by v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') collate "C")) from public.product_variants v where v.product_id = p.id))),
      updated_at = now()
  where p.sku like 'BAS-SLV-S0_';

  select md5(string_agg(line, E'\n' order by line collate "C")) into s from (
    select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line
    from public.product_variants v join public.products p on p.id = v.product_id where p.sku like 'BAS-SLV-S0_') x;
  if s <> '84f0f7969e89e3d9e01819b7c681bd2e' then raise exception 'postcondition seal %', s; end if;
end $$;
