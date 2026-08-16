-- 0133: Start the nine EON Maeander 1008 listing families at 5mm.
--
-- Removes exactly 450 panel variants:
--   * 9 listing families
--   * 2 removed widths, 3mm and 4mm
--   * 25 whole and half US sizes per width
--
-- This migration updates the panel mirror only. It does not call Etsy.

begin;

create temp table _eon_maeander_products on commit drop as
select p.id as product_id, p.sku
from public.products p
join public.organizations o on o.id = p.org_id
where o.name = 'EON'
  and p.sku ~ '^(GLD|WHG|RSG)-R-(10|14|18)08$';

create temp table _eon_maeander_narrow_variants on commit drop as
select
  v.id as variant_id,
  v.product_id,
  v.sku,
  substring(v.sku from '-([0-9]+)MM-')::integer as width_mm
from public.product_variants v
join _eon_maeander_products p on p.product_id = v.product_id
where v.sku ~ '^[A-Z]+-R-(10|14|18)08-[0-9]+MM-[0-9]+(\.[0-9]+)?$'
  and substring(v.sku from '-([0-9]+)MM-')::integer < 5;

do $$
declare
  scoped_products integer;
  narrow_variants integer;
begin
  select count(*) into scoped_products from _eon_maeander_products;
  select count(*) into narrow_variants from _eon_maeander_narrow_variants;

  if scoped_products <> 9 then
    raise exception 'Maeander 5mm guard expected 9 products, found %', scoped_products;
  end if;

  if narrow_variants <> 450 then
    raise exception 'Maeander 5mm guard expected 450 narrow variants, found %', narrow_variants;
  end if;
end;
$$;

delete from public.product_variants v
using _eon_maeander_narrow_variants n
where v.id = n.variant_id;

update public.products p
set
  title = replace(p.title, '3mm to 12mm', '5mm to 12mm'),
  description = replace(
    replace(
      replace(
        p.description,
        '3mm through 12mm',
        '5mm through 12mm'
      ),
      '3mm to 12mm',
      '5mm to 12mm'
    ),
    'A 3mm to 5mm band reads restrained.',
    'A 5mm band reads restrained.'
  ),
  updated_at = now()
from _eon_maeander_products scope
where p.id = scope.product_id;

update public.listing_images li
set alt = replace(li.alt, '3mm to 12mm', '5mm to 12mm')
from _eon_maeander_products scope
where li.product_id = scope.product_id
  and li.alt like '%3mm to 12mm%';

update public.products p
set
  price_cents = anchors.min_cents,
  updated_at = now()
from (
  select v.product_id, min(v.price_cents) as min_cents
  from public.product_variants v
  join _eon_maeander_products scope on scope.product_id = v.product_id
  where v.active = true
  group by v.product_id
) anchors
where p.id = anchors.product_id
  and p.price_cents is distinct from anchors.min_cents;

do $$
declare
  remaining_variants integer;
  remaining_narrow integer;
  minimum_width integer;
  maximum_width integer;
  distinct_widths integer;
  stale_copy integer;
begin
  select
    count(*),
    count(*) filter (where axes.width_mm < 5),
    min(axes.width_mm),
    max(axes.width_mm),
    count(distinct axes.width_mm)
  into
    remaining_variants,
    remaining_narrow,
    minimum_width,
    maximum_width,
    distinct_widths
  from (
    select
      v.id,
      substring(v.sku from '-([0-9]+)MM-')::integer as width_mm
    from public.product_variants v
    join _eon_maeander_products scope on scope.product_id = v.product_id
  ) axes;

  select count(*)
  into stale_copy
  from public.products p
  join _eon_maeander_products scope on scope.product_id = p.id
  where p.title like '%3mm%'
     or p.description like '%3mm%';

  if remaining_variants <> 1800
     or remaining_narrow <> 0
     or minimum_width <> 5
     or maximum_width <> 12
     or distinct_widths <> 8 then
    raise exception
      'Maeander 5mm verification failed: variants %, narrow %, min %, max %, widths %',
      remaining_variants,
      remaining_narrow,
      minimum_width,
      maximum_width,
      distinct_widths;
  end if;

  if stale_copy <> 0 then
    raise exception 'Maeander 5mm copy verification failed for % products', stale_copy;
  end if;

  raise notice 'Maeander minimum width verified at 5mm: 1800 variants remain';
end;
$$;

commit;
