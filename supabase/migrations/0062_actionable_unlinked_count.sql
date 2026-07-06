-- 0062 — "Bağlı değil" bildirimini yalnız YAPILABİLİR kalemlerle sınırla.
--
-- Kullanıcı: silinmiş/eski Etsy listelerine ait tarihsel kalemlerle iş yok;
-- bunlar bildirimde sayılmasın. Kalan bağlanamayan kalemlerin çoğu, SKU'su
-- artık aktif bir ürüne ulaşmayan (kapanmış listing) varyanta ait → hiçbir
-- kullanıcı işlemiyle bağlanamaz. Bildirim yalnız GERÇEKTEN bağlanabilir
-- kalemleri saysın: SKU'su, ürüne bağlı (product_id dolu) bir varyantla
-- eşleşen ama henüz bağlanmamış kalemler (yalnız senkron bekleyenler).
--
-- security INVOKER (varsayılan) → RLS'e saygı duyar; çağıran yalnız kendi
-- org'unun satırlarını sayar (başka org_id geçse RLS 0 döndürür).
create or replace function public.count_actionable_unlinked_items(p_org_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)::int
  from public.sale_items si
  where si.org_id = p_org_id
    and si.product_id is null
    and si.sku is not null
    and si.sku <> ''
    and exists (
      select 1 from public.product_variants pv
      where pv.org_id = si.org_id
        and pv.sku = si.sku
        and pv.product_id is not null
    );
$$;
