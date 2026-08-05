-- 0109 — İşletme kârı RPC: org varsayılan kuruna göre topla (Shopier TRY org vb.)
--
-- 0097 yalnız USD satırlarını topluyordu; ayrı şirket hesabında TRY satışlar
-- sessizce dışarıda kalıyordu. Kur org.default_currency'den okunur; farklı kurlar
-- yine tek sayıya karışmaz — yalnızca org varsayılanı DIŞINDAKİ kayıt sayılır.

create or replace function public.operating_profit_monthly(
  p_org uuid,
  p_months int default 6
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with org_cur as (
    select coalesce(o.default_currency, 'USD') as currency
    from public.organizations o
    where o.id = p_org
      and o.id = public.current_org_id()
  ),
  months as (
    select date_trunc('month', current_date)::date
           - (interval '1 month' * m) as month_start
    from generate_series(0, greatest(coalesce(p_months, 6), 1) - 1) as m
  ),
  rev as (
    select date_trunc('month', s.order_date::date)::date as month_start,
           sum(coalesce(s.grand_total_cents, s.item_total_cents, 0)) as revenue_cents,
           count(*) as orders
    from public.sales s
    cross join org_cur oc
    where s.org_id = p_org
      and s.org_id = public.current_org_id()
      and coalesce(s.status, '') <> 'cancelled'
      and s.currency = oc.currency
    group by 1
  ),
  cst as (
    select date_trunc('month', c.cost_date)::date as month_start,
           coalesce(sum(c.amount_cents) filter (where cc.is_fixed), 0) as fixed_cents,
           coalesce(sum(c.amount_cents) filter (where cc.id is not null and not cc.is_fixed), 0) as variable_cents,
           coalesce(sum(c.amount_cents) filter (where cc.id is null), 0) as uncategorized_cents
    from public.costs c
    left join public.cost_categories cc on cc.id = c.category_id
    cross join org_cur oc
    where c.org_id = p_org
      and c.org_id = public.current_org_id()
      and c.currency = oc.currency
    group by 1
  ),
  fx as (
    select
      (select count(*) from public.sales s
        cross join org_cur oc
        where s.org_id = p_org and s.org_id = public.current_org_id()
          and s.currency <> oc.currency) as sales_non_usd,
      (select count(*) from public.costs c
        cross join org_cur oc
        where c.org_id = p_org and c.org_id = public.current_org_id()
          and c.currency <> oc.currency) as costs_non_usd,
      (select currency from org_cur) as currency
  )
  select jsonb_build_object(
    'currency', (select currency from fx),
    'months', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m.month_start, 'YYYY-MM'),
        'revenue_cents', coalesce(r.revenue_cents, 0),
        'orders', coalesce(r.orders, 0),
        'variable_cents', coalesce(k.variable_cents, 0),
        'fixed_cents', coalesce(k.fixed_cents, 0),
        'uncategorized_cents', coalesce(k.uncategorized_cents, 0)
      ) order by m.month_start)
      from months m
      left join rev r on r.month_start = m.month_start::date
      left join cst k on k.month_start = m.month_start::date
    ),
    'sales_non_usd', (select sales_non_usd from fx),
    'costs_non_usd', (select costs_non_usd from fx)
  )
$$;
