-- 0115 · Listing bazında indirim yüzdesi (manuel giriş).
--
-- Neden manuel: Etsy Open API v3 aktif Sale/promosyon ya da kupon kodlarını
-- OKUTMUYOR (v2 coupon uçları emekli; "Seller Marketing Promotions" public
-- API'de yok). Yalnız tamamlanmış siparişin uygulanmış indirimi (discount_amt)
-- gelir — o da zaten sales.discount_cents'te. Bu yüzden satıcı Etsy'de yürüttüğü
-- Sale yüzdesini panele kendi girer; panel indirimli fiyatı gösterir ve marj/
-- eritme-altı kararlarını bu indirimli fiyata göre değerlendirir.
--
-- discount_pct: 0..90 tam yüzde (0 = indirim yok). İndirimli fiyat panelde
-- türetilir (base_price_cents * (100 - discount_pct) / 100); Etsy'ye YAZILMAZ.

alter table public.products
  add column if not exists discount_pct smallint not null default 0;

alter table public.products
  drop constraint if exists products_discount_pct_range;
alter table public.products
  add constraint products_discount_pct_range
  check (discount_pct >= 0 and discount_pct <= 90);

comment on column public.products.discount_pct is
  'Manuel girilen aktif indirim yüzdesi (0..90). Etsy API indirimi vermediğinden '
  'satıcı kendi girer; indirimli fiyat panelde türetilir, Etsy''ye yazılmaz.';
