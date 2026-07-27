-- 0109 — Listing sabit birim maliyeti (ürün seviyesi, tüm varyantlar).
--
-- Bazı ürünlerde işçilik altın formülünden pahalıdır. Panelde listing künyesine
-- sabit birim maliyet girilir; satışta her kalem için (adet × listing_cost)
-- `source='listing_fixed'` maliyet satırı yazılır. Listing maliyeti VARYANTLARA
-- kopyalanmaz — products.listing_cost_cents tek kaynaktır.
--
-- Altın auto-işçilik ile çift sayımı önlemek: listing_cost > 0 ise
-- rebuild_gold_costs / createGoldCostForSale yalnız MALZEME yazar; işçilik
-- satırı listing_fixed olur.

alter table public.products
  add column if not exists listing_cost_cents integer
    check (listing_cost_cents is null or listing_cost_cents >= 0);

comment on column public.products.listing_cost_cents is
  'Sabit birim maliyet (cent). Tüm varyantlara uygulanır; satışta listing_fixed olarak işlenir.';

alter table public.costs drop constraint if exists costs_source_check;
alter table public.costs add constraint costs_source_check
  check (source = any (array[
    'manual'::text,
    'csv'::text,
    'etsy'::text,
    'etsy_ledger'::text,
    'shipstation'::text,
    'gold_auto'::text,
    'listing_fixed'::text
  ]));

-- Toplu: listing_cost_cents > 0 ürünlerin satış kalemlerine sabit maliyet yaz.
-- İdempotent: sale_item_id + source='listing_fixed'.
create or replace function public.rebuild_listing_fixed_costs(
  p_org_id uuid
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat_isc uuid;
  v_inserted integer := 0;
begin
  select id into v_cat_isc from public.cost_categories
    where org_id = p_org_id and key = 'iscilik' limit 1;

  with resolved as (
    select
      si.id as item_id,
      si.sale_id,
      s.order_date::date as order_date,
      coalesce(si.quantity, 1) as qty,
      coalesce(p.title, pv.name, si.title, '') as title_text,
      p.listing_cost_cents
    from public.sale_items si
    join public.sales s
      on s.id = si.sale_id and s.status <> 'cancelled'
    left join public.product_variants pv
      on pv.org_id = si.org_id and pv.sku = si.sku
    left join public.products p
      on p.id = coalesce(si.product_id, pv.product_id)
    where si.org_id = p_org_id
      and p.listing_cost_cents is not null
      and p.listing_cost_cents > 0
      and not exists (
        select 1 from public.costs c
        where c.sale_item_id = si.id and c.source = 'listing_fixed'
      )
  ),
  ins as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date,
       vendor, sale_id, sale_item_id, source, notes)
    select
      p_org_id,
      v_cat_isc,
      'Listing sabit maliyet — × ' || qty || ' (' || left(title_text, 60) || ')',
      listing_cost_cents * qty,
      'USD',
      order_date,
      null,
      sale_id,
      item_id,
      'listing_fixed',
      'products.listing_cost_cents=' || listing_cost_cents || ' × adet ' || qty
    from resolved
    returning 1
  )
  select count(*) into v_inserted from ins;

  return v_inserted;
end;
$$;

revoke all on function public.rebuild_listing_fixed_costs(uuid) from public, anon;
revoke execute on function public.rebuild_listing_fixed_costs(uuid) from authenticated;
grant execute on function public.rebuild_listing_fixed_costs(uuid) to service_role;

-- Altın rebuild: listing_cost > 0 ise auto-işçilik yazma (malzeme kalır).
create or replace function public.rebuild_gold_costs(
  p_org_id uuid,
  p_gold_price_per_ounce numeric
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pure    numeric := p_gold_price_per_ounce / 31.1035;
  v_pur14   integer;
  v_pur10   integer;
  v_cat_mal uuid;
  v_cat_isc uuid;
  v_inserted integer := 0;
begin
  select
    coalesce((gold_settings ->> 'purchase_price_14k_cents')::int, 10100),
    coalesce((gold_settings ->> 'purchase_price_10k_cents')::int, 6500)
  into v_pur14, v_pur10
  from public.organizations where id = p_org_id;
  v_pur14 := coalesce(v_pur14, 10100);
  v_pur10 := coalesce(v_pur10, 6500);

  select id into v_cat_mal from public.cost_categories
    where org_id = p_org_id and key = 'malzeme' limit 1;
  select id into v_cat_isc from public.cost_categories
    where org_id = p_org_id and key = 'iscilik' limit 1;

  with resolvable as (
    select
      si.id                                       as item_id,
      si.sale_id,
      s.order_date::date                          as order_date,
      coalesce(si.quantity, 1)                    as qty,
      coalesce(p.title, pv.name, si.title, '')    as title_text,
      pv.weight_grams::numeric                    as w,
      coalesce(p.listing_cost_cents, 0)           as listing_cost_cents,
      case
        when coalesce(p.title, '') ~* '\y14\s*k' or coalesce(pv.name, '') ~* '\y14\s*k' or coalesce(si.title, '') ~* '\y14\s*k' then '14K'
        when coalesce(p.title, '') ~* '\y10\s*k' or coalesce(pv.name, '') ~* '\y10\s*k' or coalesce(si.title, '') ~* '\y10\s*k' then '10K'
      end                                         as karat
    from public.sale_items si
    join public.sales s
      on s.id = si.sale_id and s.status <> 'cancelled'
    join public.product_variants pv
      on pv.org_id = si.org_id and pv.sku = si.sku and pv.weight_grams > 0
    left join public.products p
      on p.id = coalesce(si.product_id, pv.product_id)
    where si.org_id = p_org_id
      and not exists (
        select 1 from public.costs c
        where c.sale_item_id = si.id and c.source = 'gold_auto'
      )
  ),
  priced as (
    select
      r.*,
      (v_pure * case r.karat when '14K' then 0.585 when '10K' then 0.416 end)            as ayar_gram,
      ((case r.karat when '14K' then v_pur14 when '10K' then v_pur10 end) / 100.0)       as alim_gram
    from resolvable r
    where r.karat is not null and r.w > 0
  ),
  rows as (
    select
      p.item_id, p.sale_id, p.order_date, p.qty, p.title_text, p.karat, p.w,
      p.listing_cost_cents,
      (round(p.ayar_gram * p.w * 100))::int * p.qty                                        as gold_cents,
      (round(greatest(0, p.alim_gram - p.ayar_gram) * p.w * 100))::int * p.qty             as labor_cents
    from priced p
  ),
  ins as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date, vendor, sale_id, sale_item_id, source, notes)
    select
      p_org_id, v_cat_mal,
      'Altin malzeme — ' || karat || ' ' || w || 'g × ' || qty || ' (' || left(title_text, 60) || ')',
      gold_cents, 'USD', order_date, 'Altin Tedarik', sale_id, item_id, 'gold_auto',
      'Ons: $' || p_gold_price_per_ounce || ' | Ayar: ' || karat || ' | Agirlik: ' || w || 'g | Adet: ' || qty
    from rows
    union all
    select
      p_org_id, v_cat_isc,
      'Iscilik — ' || karat || ' ' || w || 'g × ' || qty || ' (' || left(title_text, 60) || ')',
      labor_cents, 'USD', order_date, 'Altin Tedarik', sale_id, item_id, 'gold_auto',
      'Iscilik (alim - piyasa) | Ayar: ' || karat
    from rows
    where listing_cost_cents <= 0
    returning 1
  )
  select count(*) into v_inserted from ins;

  return v_inserted;
end;
$$;

revoke all on function public.rebuild_gold_costs(uuid, numeric) from public, anon;
revoke execute on function public.rebuild_gold_costs(uuid, numeric) from authenticated;
grant execute on function public.rebuild_gold_costs(uuid, numeric) to service_role;
