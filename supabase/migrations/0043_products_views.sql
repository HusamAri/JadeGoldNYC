-- 0043 — Etsy listing görüntülenme/favori sayaçları (senkron)
-- ------------------------------------------------------------------
-- Etsy API v3 Listing.views/num_favorers ömür boyu toplamlardır; listings
-- senkron fazı her turda günceller. Ürün Performansı, dönemsel görüntülenmesi
-- olmayan kayıtlarda eşlenen ürünün bu toplamını "toplam" işaretiyle gösterir.

alter table public.products
  add column views integer,
  add column num_favorers integer;
