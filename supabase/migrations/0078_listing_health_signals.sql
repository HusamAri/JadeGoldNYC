-- 0078 — Listing sağlık sinyalleri: bir listing hakkında karar (fiyat, tanıtım,
-- tedarik, kapat) verirken SADECE anlık pazar verisini değil, tüm verileri
-- (satış geçmişi, dönüşüm, favori, iptal/tedarik riski, pazar konumu) bir arada
-- döndürür. Aksiyon sentezi uygulama katmanında (TS) yapılır.

create or replace function public.listing_health_signals(p_product_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with p as (
    select id, org_id, etsy_listing_id, title, status, price_cents,
           weight_grams, views, num_favorers
    from public.products
    where id = p_product_id and org_id = public.current_org_id()
  ),
  sales_agg as (
    select
      coalesce(sum(si.quantity), 0) as orders_lifetime,
      coalesce(sum(si.quantity) filter (where sa.order_date >= now() - interval '30 days'), 0) as orders_30d,
      coalesce(sum(si.line_total_cents) filter (where sa.order_date >= now() - interval '30 days'), 0) as revenue_30d_cents,
      max(sa.order_date) as last_sale
    from public.sale_items si
    join public.sales sa on sa.id = si.sale_id
    where si.etsy_listing_id = (select etsy_listing_id from p)
      and si.org_id = (select org_id from p)
  ),
  -- Tedarik riski: bu ürünün SKU köklerinin ShipStation iptal oranı (12 ay).
  sku_roots as (
    select distinct regexp_replace(sku, '-.*$', '') as root
    from public.product_variants
    where product_id = (select id from p) and sku is not null
  ),
  cancel_agg as (
    select
      count(*) as ship_total,
      count(*) filter (where o.order_status = 'cancelled') as ship_cancelled
    from public.shipstation_order_items i
    join public.shipstation_orders o on o.order_id = i.order_id
    where o.order_date >= now() - interval '12 months'
      and regexp_replace(coalesce(i.sku, ''), '-.*$', '') in (select root from sku_roots)
  ),
  kr as (
    select price_position, our_per_gram_cents, market_low_per_gram_cents,
           market_high_per_gram_cents, deviation_pct, confidence,
           recommendation, suggested_price_cents, researched_at
    from public.keyword_research
    where product_id = (select id from p)
    order by researched_at desc
    limit 1
  )
  select jsonb_build_object(
    'product_id', (select id from p),
    'title', (select title from p),
    'status', (select status from p),
    'price_cents', (select price_cents from p),
    'weight_grams', (select weight_grams from p),
    'views', (select coalesce(views, 0) from p),
    'favorers', (select coalesce(num_favorers, 0) from p),
    'orders_lifetime', (select orders_lifetime from sales_agg),
    'orders_30d', (select orders_30d from sales_agg),
    'revenue_30d_cents', (select revenue_30d_cents from sales_agg),
    'last_sale', (select last_sale from sales_agg),
    'ship_total', (select coalesce(ship_total, 0) from cancel_agg),
    'ship_cancelled', (select coalesce(ship_cancelled, 0) from cancel_agg),
    'market', (select to_jsonb(kr) from kr)
  )
  where exists (select 1 from p);
$$;

grant execute on function public.listing_health_signals(uuid) to authenticated;
