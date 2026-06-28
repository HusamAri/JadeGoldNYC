-- 0034 — Ürün görseli URL'si
-- Etsy listing'lerinden birincil görsel URL'si saklanır.
-- ------------------------------------------------------------------

alter table public.products
  add column if not exists image_url text;
