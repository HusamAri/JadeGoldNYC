-- 0042 — sale_items.etsy_listing_id + self-healing product_id link rebuild
-- ------------------------------------------------------------------
-- İlk senkron turunda faz sırası sales → listings → reviews → ledger'dır
-- (bkz. lib/etsy/sync.ts). upsertSalesPage sale_items.product_id'yi
-- products.etsy_listing_id üzerinden arar, ama sales fazı çalıştığında
-- products tablosu henüz listings fazınca doldurulmamıştır — bu yüzden
-- ilk toplu geçmiş içe aktarımında product_id kalıcı olarak NULL kalır
-- (sonraki artımlı senkronlar yalnız YENİ satışları çeker, eskileri bir
-- daha dokunmaz). Bu da lib/gold-cost-entry.ts'teki altın ağırlık
-- eşlemesini o ilk geçmiş grup için devre dışı bırakır.
--
-- Kalıcı çözüm: transaction'ın listing_id'sini eşleşme olsun olmasın her
-- zaman sale_items'a yaz, sonra org bazında idempotent bir rebuild
-- fonksiyonuyla product_id'leri products tablosu dolduktan sonra da
-- (senkron sırası ne olursa olsun) tamamlayabil.

alter table public.sale_items add column if not exists etsy_listing_id bigint;

-- sale_items.etsy_listing_id ↔ products.etsy_listing_id eşleşmesiyle
-- product_id'yi tamamlar/düzeltir. Yalnız gerçekten değişen satırları
-- günceller (idempotent) ve etkilenen satır sayısını döner.
create or replace function public.rebuild_sale_item_product_links(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.sale_items si
  set product_id = p.id
  from public.products p
  where si.org_id = p_org_id
    and p.org_id = p_org_id
    and si.etsy_listing_id is not null
    and si.etsy_listing_id = p.etsy_listing_id
    and si.product_id is distinct from p.id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.rebuild_sale_item_product_links(uuid) from public, anon;
grant execute on function public.rebuild_sale_item_product_links(uuid) to authenticated, service_role;
