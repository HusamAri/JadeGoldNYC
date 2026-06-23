-- Müşteri Geri Kazanım: senkronlanan sipariş geçmişinden (sales) uzun süredir
-- sipariş vermemiş müşterileri çıkarır. Etsy terk-sepet verisi vermediği için
-- "sepet kurtarma" yerine veriye dayalı "müşteri geri kazanım" kurulur.

create or replace function public.winback_candidates(
  p_lapse_days int default 90,
  p_limit int default 100
)
returns table (
  buyer_key text,
  buyer_name text,
  buyer_email text,
  order_count bigint,
  total_spent_cents bigint,
  last_order_date timestamptz,
  days_since int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(s.buyer_email, ''), s.buyer_name) as buyer_key,
    max(s.buyer_name) as buyer_name,
    max(s.buyer_email) as buyer_email,
    count(*) as order_count,
    sum(s.grand_total_cents) as total_spent_cents,
    max(s.order_date) as last_order_date,
    extract(day from now() - max(s.order_date))::int as days_since
  from public.sales s
  where s.org_id = public.current_org_id()
    and coalesce(nullif(s.buyer_email, ''), s.buyer_name) is not null
  group by 1
  having max(s.order_date) < now() - make_interval(days => p_lapse_days)
  order by sum(s.grand_total_cents) desc
  limit p_limit;
$$;

create or replace function public.winback_summary(p_lapse_days int default 90)
returns table (
  total_customers bigint,
  repeat_customers bigint,
  lapsed_customers bigint,
  lapsed_value_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with by_buyer as (
    select
      coalesce(nullif(s.buyer_email, ''), s.buyer_name) as k,
      count(*) as c,
      sum(s.grand_total_cents) as v,
      max(s.order_date) as last_o
    from public.sales s
    where s.org_id = public.current_org_id()
      and coalesce(nullif(s.buyer_email, ''), s.buyer_name) is not null
    group by 1
  )
  select
    count(*) as total_customers,
    count(*) filter (where c > 1) as repeat_customers,
    count(*) filter (where last_o < now() - make_interval(days => p_lapse_days)) as lapsed_customers,
    coalesce(sum(v) filter (where last_o < now() - make_interval(days => p_lapse_days)), 0) as lapsed_value_cents
  from by_buyer;
$$;

revoke all on function public.winback_candidates(int, int) from public, anon;
revoke all on function public.winback_summary(int) from public, anon;
grant execute on function public.winback_candidates(int, int) to authenticated, service_role;
grant execute on function public.winback_summary(int) to authenticated, service_role;
