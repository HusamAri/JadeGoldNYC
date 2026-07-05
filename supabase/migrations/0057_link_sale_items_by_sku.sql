-- 0057 — Satış kalemlerini SKU üzerinden ürüne bağla (backfill).
-- sale_items.product_id çoğunlukla boş (ilk senkronda siparişler listing'lerden
-- önce işleniyor; artımlı senkron eskiyi geri doldurmuyor). sale_items'ta SKU
-- var; Etsy varyant senkronu product_variants'e SKU↔product_id yazdıktan sonra
-- bu RPC ile eşleyip boş product_id/etsy_listing_id'leri doldururuz.
-- Yalnız BOŞ olanları doldurur (mevcut bağı ezmez). Etsy varyant senkronu
-- sonunda (lib/etsy/variants.ts) otomatik çağrılır.

create or replace function public.link_sale_items_by_sku(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.sale_items si
    set product_id = pv.product_id,
        etsy_listing_id = coalesce(si.etsy_listing_id, pv.etsy_listing_id)
  from public.product_variants pv
  where si.org_id = p_org_id
    and si.product_id is null
    and si.sku is not null and si.sku <> ''
    and pv.org_id = p_org_id
    and pv.sku = si.sku
    and pv.product_id is not null;

  get diagnostics n = row_count;
  return n;
end;
$$;

-- Grant sıkılaştırma (0014/0031 deseni) — anon çağıramaz.
revoke all on function public.link_sale_items_by_sku(uuid) from public, anon;
grant execute on function public.link_sale_items_by_sku(uuid) to authenticated, service_role;
