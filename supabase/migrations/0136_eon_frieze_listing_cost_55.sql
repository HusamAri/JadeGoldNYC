-- 0136: Keep EON Frieze and Textured labor visible as a 55 USD listing cost.
--
-- The pricing engine already uses 55 USD for hand-finished bands. This
-- migration aligns the panel's product-level fixed labor field with that
-- pricing rule. It updates panel data only and does not call Etsy.

begin;

alter table public.products
  add column if not exists listing_cost_cents integer
    check (listing_cost_cents is null or listing_cost_cents >= 0);

comment on column public.products.listing_cost_cents is
  'Fixed unit labor cost in cents. Applied to every variant for sale costing.';

update public.pricing_config c
set
  labor_handfinished_usd = 55,
  updated_at = now()
from public.organizations o
where c.org_id = o.id
  and o.name = 'EON'
  and c.labor_handfinished_usd is distinct from 55;

update public.products p
set
  listing_cost_cents = 5500,
  updated_at = now()
from public.organizations o
where p.org_id = o.id
  and o.name = 'EON'
  and (
    p.sku ~* '^(GLD|WHG|RSG)-R-(10|14|18)(04|08|09)$'
    or p.sku in ('GLD-R-1006', 'GLD-R-1007')
    or p.sku ~* '^TTG-R-(10|14|18)06$'
    or coalesce(p.title, '') ~* '(milgrain|hammered|basket[[:space:]]*weave|basketweave|ribbed|fluted|greek[[:space:]]+key|maeander|meander|frieze|diamond[-[:space:]]*cut)'
  )
  and p.listing_cost_cents is distinct from 5500;

do $$
declare
  matched_products integer;
  mismatched_products integer;
  configured_labor numeric;
begin
  select
    count(*),
    count(*) filter (where p.listing_cost_cents is distinct from 5500)
  into matched_products, mismatched_products
  from public.products p
  join public.organizations o on o.id = p.org_id and o.name = 'EON'
  where
    p.sku ~* '^(GLD|WHG|RSG)-R-(10|14|18)(04|08|09)$'
    or p.sku in ('GLD-R-1006', 'GLD-R-1007')
    or p.sku ~* '^TTG-R-(10|14|18)06$'
    or coalesce(p.title, '') ~* '(milgrain|hammered|basket[[:space:]]*weave|basketweave|ribbed|fluted|greek[[:space:]]+key|maeander|meander|frieze|diamond[-[:space:]]*cut)';

  select c.labor_handfinished_usd
  into configured_labor
  from public.pricing_config c
  join public.organizations o on o.id = c.org_id
  where o.name = 'EON';

  if matched_products = 0 then
    raise exception 'EON Frieze listing cost update matched no products';
  end if;

  if mismatched_products <> 0 then
    raise exception 'EON Frieze listing cost verification failed for % products',
      mismatched_products;
  end if;

  if configured_labor is distinct from 55 then
    raise exception 'EON hand-finished labor verification failed: %',
      configured_labor;
  end if;
end;
$$;

commit;
