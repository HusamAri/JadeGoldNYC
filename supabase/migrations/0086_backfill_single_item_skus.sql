-- 0086 — Tek-parça (varyantsız) listing'lere SKU backfill'i
-- ------------------------------------------------------------------
-- Platform kuralı: her sellable birim, org içinde benzersiz bir SKU taşıyan bir
-- product_variants satırıdır; SKU'suz varyant/listing olamaz ve tüm çapraz-sistem
-- eşleşmeleri (satış, ShipStation gram, altın maliyet) `product_variants.sku`
-- üzerinden yürür.
--
-- Sorun: Etsy'nin varyasyonsuz (tek-parça) listing'leri SKU alanı boş yaşayabilir;
-- envanter senkronu (lib/etsy/variants.ts) SKU'suz envanteri düşürdüğü için bu
-- listing'ler panelde HİÇ varyant satırı almıyor ve `products.sku` da null kalıyor
-- → hiçbir yerde SKU'ları yok (108 kayıt: Jade 83 + EON 25). Bunların çoğu SATAN
-- canlı üründür; arşivlenmez, SKU ÜRETİLİR.
--
-- Bu migration her uygun tek-parça listing'e:
--   • deterministik SKU üretir  <KategoriHarfi><etsy_listing_id>  (benzersiz,
--     idempotent; distribute.ts konvansiyonuyla uyumlu — sonda "-<sayı>" yok, o
--     yüzden beden-çıkarımı bu SKU'ları atlar),
--   • 1 adet product_variants satırı ekler (fiyat/adet/gram üründen taşınır),
--   • products.sku'yu aynı SKU ile mirror'lar.
-- ENVANTER OLMAYAN yardımcı listing'ler (kargo yükseltme, fiyat farkı) HARİÇ.
-- Idempotent: ON CONFLICT (org_id, sku) DO NOTHING + yalnız sku'su boş kayıtlar.

with candidate as (
  select
    p.id            as product_id,
    p.org_id,
    p.etsy_listing_id,
    p.price_cents,
    p.quantity,
    p.weight_grams,
    p.status,
    -- Kategori harfi: earring/hoop, ring'den ÖNCE ("earring" içinde "ring" geçer).
    (case
      when p.title ilike '%earring%' or p.title ilike '%hoop%' then 'E'
      when p.title ilike '%ring%'                              then 'R'
      when p.title ilike '%bracelet%'                          then 'B'
      when p.title ilike '%necklace%' or p.title ilike '%chain%' then 'C'
      when p.title ilike '%pendant%'                           then 'P'
      else 'X'
    end) || p.etsy_listing_id::text as sku
  from public.products p
  left join (
    select product_id, count(*) as n
    from public.product_variants group by product_id
  ) vc on vc.product_id = p.id
  where p.etsy_listing_id is not null
    and (vc.n is null or vc.n = 0)                 -- varyantsız
    and (p.sku is null or btrim(p.sku) = '')       -- SKU'suz
    -- Envanter olmayan yardımcı listing'ler hariç (ücret/kargo):
    and p.etsy_listing_id not in (1593402358, 1669546571)
),
ins as (
  insert into public.product_variants
    (org_id, sku, product_id, etsy_listing_id, name,
     price_cents, quantity, weight_grams, weight_source, active)
  select
    c.org_id, c.sku, c.product_id, c.etsy_listing_id, 'Tek parça',
    c.price_cents, c.quantity, c.weight_grams,
    case when c.weight_grams is not null then 'manual' else null end,
    (c.status = 'active')
  from candidate c
  on conflict (org_id, sku) do nothing
  returning product_id
)
update public.products p
set sku = c.sku
from candidate c
where p.id = c.product_id
  and (p.sku is null or btrim(p.sku) = '');
