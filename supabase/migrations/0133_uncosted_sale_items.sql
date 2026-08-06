-- 0133: Maliyetsiz satış kalemleri — "kâr olduğundan yüksek görünüyor" sinyali.
--
-- Altın maliyet motoru gram olmadan maliyet hesaplayamaz ve kalemi ATLAR
-- (uydurmaz). Sonuç: o satışın maliyeti hiç düşmez, marj raporu şişer.
-- 2026-08 vakası: 4 Ağustos siparişinde `EH2-50` varyantının gramı boştu;
-- son 90 günde 11 kalem / ~$7.124 ciro maliyetsiz kalmıştı ve bu HİÇBİR
-- yerde flaglenmiyordu.
--
-- Fonksiyon Uyarı Merkezi tarafından okunur. `security definer` DEĞİL —
-- çağıran üyenin RLS'i geçerlidir; org kapsamı ayrıca parametreyle daraltılır
-- (multi-tenant kilidi: RLS'in aktif-org varsayımına yaslanma).

create or replace function public.uncosted_sale_items(
  p_org uuid,
  p_since timestamptz
)
returns table (
  sku text,
  title text,
  line_total_cents integer,
  variant_id uuid,
  variant_weight numeric
)
language sql
stable
as $$
  select
    si.sku,
    coalesce(p.title, si.title) as title,
    si.line_total_cents,
    v.id as variant_id,
    v.weight_grams as variant_weight
  from public.sale_items si
  join public.sales s
    on s.id = si.sale_id
   and s.org_id = p_org
   and s.status <> 'cancelled'
   and s.order_date >= p_since
  left join public.products p on p.id = si.product_id
  -- Satılan SKU'nun katalog karşılığı (yoksa variant_id null → "eşleşmeyen").
  left join public.product_variants v
    on v.org_id = p_org and v.sku = si.sku
  where si.org_id = p_org
    -- Maliyet kaydı hiç olmayan satışlar.
    and not exists (
      select 1 from public.costs c where c.sale_id = si.sale_id
    );
$$;

grant execute on function public.uncosted_sale_items(uuid, timestamptz)
  to authenticated;
