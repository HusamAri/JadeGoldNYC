-- 0090 — Genel kural uygulaması: Etsy'de karşılığı olmayan listing panelden silinir
-- ------------------------------------------------------------------
-- Kural (kullanıcı, tartışmaya kapalı): NİHAİ KAYNAK ETSY. Tam taramada
-- eşleşme bulamayan listingler panelden de SİLİNİR (arşiv değil). Bu kural
-- tüm org'lar için geçerlidir; ileriye dönük uygulaması senkrondaki
-- `reconcileUnmatchedListings` adımıdır (lib/etsy/sync.ts — tam envanter
-- taraması bitince, taramada görülmeyenleri siler).
--
-- Bu migration mevcut veriye ilk uygulamadır: EON'un tüm Etsy listingleri
-- kullanıcı tarafından silindi ve 07:04'teki tam senkron 0 listing gördü
-- (etsy_connection.sync_products = 0). 25 EON ürünü + varyantları silinir.
-- Korunanlar: satış geçmişi (sale_items.product_id FK SET NULL; EON'da satış
-- yok), listing_media arşivi (kalıcı; 25 listing'in 84 medyası), panel-doğumlu
-- taslak ürün (etsy_listing_id NULL — Etsy eşleşmesi kapsamı dışında) ve onun
-- EON-BEV-* varyantları.

with eon as (
  select id as org_id from public.organizations where name = 'EON'
),
dead_products as (
  select p.id, p.etsy_listing_id
  from public.products p, eon
  where p.org_id = eon.org_id
    and p.etsy_listing_id is not null
),
del_variants as (
  delete from public.product_variants pv
  using eon
  where pv.org_id = eon.org_id
    and (
      pv.product_id in (select id from dead_products)
      or pv.etsy_listing_id in (select etsy_listing_id from dead_products)
    )
  returning pv.id
)
delete from public.products p
using eon
where p.org_id = eon.org_id
  and p.id in (select id from dead_products);
