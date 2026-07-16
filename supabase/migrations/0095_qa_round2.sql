-- 0095 — QA denetimi 2. tur düzeltmeleri (DB tarafı)
-- ------------------------------------------------------------------
-- 1) keyword_research.band_result_count: fiyat bandının GERÇEKTEN kurulduğu
--    rakip sayısı. Rakip seti (0091) banda hükmederken organik result_count
--    ile ayrışır; reprice MIN_RESULT_COUNT eşiği ve panel band tablosu artık
--    bunu okur (eski kayıtlarda NULL → result_count'a düşülür).
-- 2) ads_actions kısmi UNIQUE: createAdsAction'ın check-then-insert
--    idempotensi yarışa açıktı — aynı ürün+tür için ikinci 'beklemede' kaydı
--    DB seviyesinde engellenir.
-- 3) sales_analytics sıfır-kenarı: SQL coalesce yalnız NULL'da düşerken
--    paneldeki JS `||` sıfırda da düşer; grand_total=0 + item_total>0 kaydında
--    iki yüzey yine ayrışıyordu. nullif(...,0) ile panel semantiğine birebir
--    eşitlenir (0094'ün tamamlanması).

alter table public.keyword_research
  add column if not exists band_result_count integer;

comment on column public.keyword_research.band_result_count is
  'Fiyat bandının kurulduğu rakip sayısı (rakip seti aktifken organik result_count''tan farklı olabilir).';

-- Aynı ürün+tür için tek 'beklemede' aksiyon (yarış-korumalı idempotens).
create unique index if not exists ads_actions_pending_unique
  on public.ads_actions (org_id, product_id, kind)
  where status = 'beklemede';

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
      and (p_status is not null or coalesce(s.status, '') <> 'cancelled')
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
      -- Panelle AYNI gelir semantiği (JS `||`): grand_total NULL **veya 0**
      -- ise item_total'a düş — nullif sıfır-kenarını kapatır.
      coalesce(sum(coalesce(nullif(grand_total_cents, 0), item_total_cents, 0)), 0)
                                                 as gross_cents,
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
      coalesce(sum(coalesce(nullif(grand_total_cents, 0), item_total_cents, 0)), 0)
                                          as gross_cents
    from base
    where order_date >= (date_trunc('month', now()) - interval '11 months')
    group by 1
    order by 1
  ),
  countries as (
    select
      coalesce(nullif(ship_country, ''), '—') as country,
      count(*)                                as orders,
      coalesce(sum(coalesce(nullif(grand_total_cents, 0), item_total_cents, 0)), 0)
                                              as gross_cents
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
