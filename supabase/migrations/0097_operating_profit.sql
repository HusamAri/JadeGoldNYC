-- 0097 — İşletme kârı (EBITDA yaklaşığı): sabit/değişken kategori ayrımı + aylık RPC
--
-- Fiyat motoru sipariş-başı katkı marjını korur; ama işletmenin gerçekten para
-- kazanıp kazanmadığı SABİT giderler düşülünce belli olur (EBITDA ≈ işletme
-- kârı; bu ölçekte faiz/vergi/amortisman ihmal edilebilir). Bunun için:
--
-- 1) `cost_categories.is_fixed` — sınıflandırma KATEGORİDE taşınır (0088
--    default_bearer deseni; dışarıda string-key eşleme haritası kurulmaz).
--    Varsayılanlar: reklam / yol_ulasim / diger = sabit (satış adedinden
--    bağımsız aylık gider); malzeme / kargo / etsy_ucretleri / iscilik /
--    paketleme = değişken (sipariş başına akar). Yeni kategori default FALSE
--    (değişken) düşer — katkıyı olduğundan düşük gösterir, kârı ŞİŞİRMEZ
--    (temkinli taraf).
--
-- 2) `operating_profit_monthly` RPC — ay bazında: gelir (0094 semantiği:
--    coalesce(grand_total, item_total, 0), iptaller hariç), sipariş adedi,
--    değişken/sabit/kategorisiz maliyet toplamları. Katkı marjı, EBITDA ve
--    başa-baş adedi UI'da türetilir. Farklı kurlar TEK sayıya toplanmaz —
--    yalnız USD satırları girer; USD-dışı kayıt sayısı ayrıca döner ki kart
--    sessizce eksik toplamasın, uyarı göstersin.

alter table public.cost_categories
  add column if not exists is_fixed boolean not null default false;

comment on column public.cost_categories.is_fixed is
  'true = sabit gider (satış adedinden bağımsız; EBITDA/başa-baş hesabında sabit blok). false = değişken (sipariş başına akan).';

update public.cost_categories
  set is_fixed = true
  where key in ('reklam', 'yol_ulasim', 'diger');

create or replace function public.operating_profit_monthly(
  p_org uuid,
  p_months int default 6
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with months as (
    select date_trunc('month', current_date)::date
           - (interval '1 month' * m) as month_start
    from generate_series(0, greatest(coalesce(p_months, 6), 1) - 1) as m
  ),
  rev as (
    select date_trunc('month', s.order_date::date)::date as month_start,
           sum(coalesce(s.grand_total_cents, s.item_total_cents, 0)) as revenue_cents,
           count(*) as orders
    from public.sales s
    where s.org_id = p_org
      and s.org_id = public.current_org_id()
      and coalesce(s.status, '') <> 'cancelled'
      and s.currency = 'USD'
    group by 1
  ),
  cst as (
    select date_trunc('month', c.cost_date)::date as month_start,
           coalesce(sum(c.amount_cents) filter (where cc.is_fixed), 0) as fixed_cents,
           coalesce(sum(c.amount_cents) filter (where cc.id is not null and not cc.is_fixed), 0) as variable_cents,
           coalesce(sum(c.amount_cents) filter (where cc.id is null), 0) as uncategorized_cents
    from public.costs c
    left join public.cost_categories cc on cc.id = c.category_id
    where c.org_id = p_org
      and c.org_id = public.current_org_id()
      and c.currency = 'USD'
    group by 1
  ),
  fx as (
    -- USD-dışı kayıt var mı? (Toplama girmez; kart uyarı göstersin.)
    select
      (select count(*) from public.sales s
        where s.org_id = p_org and s.org_id = public.current_org_id()
          and s.currency <> 'USD') as sales_non_usd,
      (select count(*) from public.costs c
        where c.org_id = p_org and c.org_id = public.current_org_id()
          and c.currency <> 'USD') as costs_non_usd
  )
  select jsonb_build_object(
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
