-- 0045 — etsy_write_enabled: Etsy'ye YAZMA izni var mı? (yalnız boolean)
-- ------------------------------------------------------------------
-- Stok senkronizasyonunun gönder (push) butonunu koşullamak için kullanılır.
-- etsy_connection.scope RLS ile korunur (token sızmasın diye); bu SECURITY
-- DEFINER fonksiyon SADECE listings_w kapsamının olup olmadığını (boolean)
-- döndürür — scope/token dışarı çıkmaz. authenticated çağırabilir.

create or replace function public.etsy_write_enabled(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select c.status = 'connected'
        and c.scope ~ '(^|\s)listings_w(\s|$)'
      from public.etsy_connection c
      where c.org_id = p_org
        and c.org_id = public.current_org_id()
    ),
    false
  );
$$;

revoke all on function public.etsy_write_enabled(uuid) from public, anon;
grant execute on function public.etsy_write_enabled(uuid) to authenticated;
