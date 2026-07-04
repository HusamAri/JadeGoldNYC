-- 0048 — sales_analytics: Satışlar sekmesi üst dashboard'u için tek çağrıda
-- toplu metrikler. Satır çekip JS'te toplamak yerine DB-side aggregate
-- (10K+ satırda performans). SECURITY INVOKER → RLS uygulanır; ayrıca org
-- filtresi + current_org_id() ile çift kontrol. Liste ile aynı status/search
-- filtresine saygı duyar (dashboard listeyle birlikte daralır).

create or replace function public.sales_analytics(
  p_org uuid,
  p_status text default null,
  p_search text default null
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select *
    from public.sales s
    where s.org_id = p_org
      and s.org_id = public.current_org_id()
      and (p_status is null or s.status = p_status)
      -- status filtresi yoksa iptalleri özetten çıkar; varsa aynen uygula
      and (p_status is not null or coalesce(s.status, '') <> 'canceled')
      and (
        p_search is null or p_search = ''
        or s.order_no ilike '%' || p_search || '%'
        or s.buyer_name ilike '%' || p_search || '%'
        or s.buyer_email ilike '%' || p_search || '%'
      )
  ),
  totals as (
    select
      count(*)                                   as orders,
      coalesce(sum(grand_total_cents), 0)        as gross_cents,
      coalesce(sum(etsy_fees_cents), 0)          as fees_cents,
      coalesce(sum(discount_cents), 0)           as discount_cents,
      coalesce(sum(shipping_cents), 0)           as shipping_cents,
      count(distinct coalesce(buyer_email, buyer_name)) as buyers
    from base
  ),
  monthly as (
    select
      to_char(date_trunc('month', order_date), 'YYYY-MM') as ym,
      count(*)                            as orders,
      coalesce(sum(grand_total_cents), 0) as gross_cents
    from base
    where order_date >= (date_trunc('month', now()) - interval '11 months')
    group by 1
    order by 1
  ),
  countries as (
    select
      coalesce(nullif(ship_country, ''), '—') as country,
      count(*)                                as orders,
      coalesce(sum(grand_total_cents), 0)     as gross_cents
    from base
    group by 1
    order by gross_cents desc
    limit 6
  )
  select jsonb_build_object(
    'totals',    (select to_jsonb(t) from totals t),
    'monthly',   coalesce((select jsonb_agg(to_jsonb(m)) from monthly m), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(to_jsonb(c)) from countries c), '[]'::jsonb)
  );
$$;

revoke all on function public.sales_analytics(uuid, text, text) from public, anon;
grant execute on function public.sales_analytics(uuid, text, text) to authenticated;
