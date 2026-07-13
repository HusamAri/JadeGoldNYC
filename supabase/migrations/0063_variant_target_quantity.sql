-- 0063 — Varyant-başına hedef stok adedi.
-- Talep: "stok listinge eklenince varyantlara dağılmıyor; her varyanta ayrı
-- stok girmek gerek." Varyasyonlu listing'lerde Etsy adedi her offering'de ayrı
-- tutulur; panelde de her varyant (SKU) için hedef adet girilebilsin.
alter table public.product_variants
  add column if not exists target_quantity integer;
