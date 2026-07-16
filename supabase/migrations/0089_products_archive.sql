-- 0089 — Panel-içi ürün arşivi + EON yarım-kalanların arşivlenmesi
-- ------------------------------------------------------------------
-- Kural (kullanıcı): Etsy'de SKU'suz varyant var olamaz; EON SKU aile planına
-- (0087) girmeyen 8 yarım-kalan listing panelde SİLİNMEZ, ARŞİVLENİR.
-- `archived_at` panel-yaşam-döngüsü alanıdır: Etsy senkronu bu kolona yazmaz,
-- dolayısıyla senkron arşivi geri açmaz. Liste sorguları arşivi varsayılan
-- olarak hariç tutar; "Arşiv" filtresiyle görülebilir ve geri alınabilir.
-- (Etsy tarafında listing'lere dokunulmaz — bu yalnız panel görünürlüğüdür.)

alter table public.products
  add column if not exists archived_at timestamptz;

comment on column public.products.archived_at is
  'Panel arşiv damgası. Dolu = listelerden gizli (Arşiv filtresi hariç). Etsy senkronu bu alana dokunmaz.';

-- EON planı (0087) dışında kalan, Etsy'de SKU'suz 8 yarım-kalan listing.
update public.products p
set archived_at = now()
from public.organizations o
where o.id = p.org_id
  and o.name = 'EON'
  and p.archived_at is null
  and p.etsy_listing_id in (
    4347735406, 4350477012, 4354574774, 4354584587,
    4354589957, 4465743886, 4522887378, 4347753512
  );
