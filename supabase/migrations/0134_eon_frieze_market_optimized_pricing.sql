-- 0134: Apply the market-optimized EON Frieze and Textured price ladder.
--
-- Decision, 2026-08-16:
--   * handfinished labor = 55 USD
--   * 3-7mm multiplier = 2.05
--   * 8-12mm multiplier = 2.20
--   * permanent visible sale = list price x 0.75
--
-- The generic EON multipliers remain unchanged for non-patterned products.
-- This migration updates the panel mirror only. It does not call Etsy.

begin;

drop table if exists _eon_frieze_market_reprice;

create temp table _eon_frieze_market_reprice as
with basis as (
  select
    o.id as org_id,
    coalesce(
      (
        select b.spot_per_ozt
        from public.gold_reprice_basis b
        where b.org_id = o.id
        order by b.created_at desc
        limit 1
      ),
      (
        select c.spot_usd_per_ozt
        from public.pricing_config c
        where c.org_id = o.id
      ),
      4399.90
    )::numeric as spot_per_ozt
  from public.organizations o
  where o.name = 'EON'
), classified as (
  select
    v.id as variant_id,
    v.product_id,
    v.weight_grams::numeric as grams,
    substring(v.sku from '-R-(10|14|18)[0-9]{2}-')::integer as karat,
    substring(v.sku from '-([0-9]+)MM-')::integer as width_mm,
    b.spot_per_ozt
  from public.product_variants v
  join public.products p on p.id = v.product_id and p.org_id = v.org_id
  join basis b on b.org_id = v.org_id
  where v.active = true
    and v.weight_grams is not null
    and v.weight_grams > 0
    and v.sku ~ '^[A-Z]+-R-(10|14|18)[0-9]{2}-[0-9]+MM-[0-9]+(\.[0-9]+)?$'
    and (
      p.sku ~* '^(GLD|WHG|RSG)-R-(10|14|18)04$'
      or p.sku in ('GLD-R-1006', 'GLD-R-1007')
      or p.sku ~* '^TTG-R-(10|14|18)06$'
      or p.sku ~* '^(GLD|WHG|RSG)-R-(10|14|18)08$'
      or coalesce(p.title, '') ~* '(milgrain|hammered|basket[[:space:]]*weave|basketweave|ribbed|fluted|greek[[:space:]]+key|maeander|meander|frieze|diamond[-[:space:]]*cut)'
    )
), costs as (
  select
    variant_id,
    product_id,
    width_mm,
    (
      grams
      * (spot_per_ozt / 31.1034768)
      * case karat when 10 then 0.417 when 14 then 0.583 else 0.75 end
      * 1.07
      + 55
      + 8
      + 22
    ) as landed_usd
  from classified
)
select
  variant_id,
  product_id,
  (
    ceil(
      round(
        landed_usd * case when width_mm <= 7 then 2.05 else 2.20 end
      ) * 4.0 / 15.0
    ) * 5 * 100
  )::integer as price_cents
from costs;

do $$
declare
  matched_products integer;
  matched_variants integer;
  configured_labor numeric;
begin
  select count(distinct product_id), count(*)
  into matched_products, matched_variants
  from _eon_frieze_market_reprice;

  select c.labor_handfinished_usd
  into configured_labor
  from public.pricing_config c
  join public.organizations o on o.id = c.org_id
  where o.name = 'EON';

  if configured_labor is distinct from 55 then
    raise exception 'EON handfinished labor verification failed: %', configured_labor;
  end if;

  if matched_products = 0 or matched_variants = 0 then
    raise exception 'EON market repricing matched no products or variants';
  end if;
end;
$$;

update public.product_variants v
set
  price_cents = r.price_cents,
  updated_at = now()
from _eon_frieze_market_reprice r
where v.id = r.variant_id
  and v.price_cents is distinct from r.price_cents;

update public.products p
set
  price_cents = anchors.min_cents,
  updated_at = now()
from (
  select r.product_id, min(r.price_cents) as min_cents
  from _eon_frieze_market_reprice r
  group by r.product_id
) anchors
where p.id = anchors.product_id
  and p.price_cents is distinct from anchors.min_cents;

do $$
declare
  mismatched_variants integer;
begin
  select count(*)
  into mismatched_variants
  from _eon_frieze_market_reprice r
  join public.product_variants v on v.id = r.variant_id
  where v.price_cents is distinct from r.price_cents;

  if mismatched_variants <> 0 then
    raise exception 'EON market repricing verification failed for % variants',
      mismatched_variants;
  end if;
end;
$$;

drop table _eon_frieze_market_reprice;

commit;
