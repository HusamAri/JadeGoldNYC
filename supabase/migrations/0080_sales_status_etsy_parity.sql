-- 0080 — Satış durumu Etsy paritesi.
-- Talep: "open / completed / cancelled siparişler panele DOĞRU yansımalı."
--
-- Üç kök neden düzeltiliyor:
--   1) sync.ts her receipt'i status='completed' yazıyordu (hardcode) — artık
--      Etsy receipt.status eşleniyor; sözlük genişletildi (open/processing/
--      partially_refunded).
--   2) sales_analytics 'canceled' (tek L) hariç tutuyordu; panel sözlüğü
--      'cancelled' (çift L) — filtre hiçbir satıra değmiyordu (no-op).
--   3) Artımlı senkron min_created kullanıyordu; durumu SONRADAN değişen
--      (kargolanan/iptal edilen) eski siparişler pencereye girmiyordu —
--      sync.ts artık min_last_modified kullanıyor (kod tarafı).

-- 1) Durum sözlüğü: Etsy enum'unun panel karşılıkları.
--    open · processing · paid · shipped · completed · cancelled · refunded ·
--    partially_refunded  (eski değerler korunur; CSV/manuel akış etkilenmez)
alter table public.sales drop constraint if exists sales_status_check;
alter table public.sales add constraint sales_status_check
  check (status in (
    'open', 'processing', 'paid', 'shipped', 'completed',
    'cancelled', 'refunded', 'partially_refunded'
  ));

-- 2) sales_analytics: iptal hariç tutma yazımı düzeltildi ('cancelled').
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
