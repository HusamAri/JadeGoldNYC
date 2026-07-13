-- 0075 — Rekabet araştırmasına AYNI-VARYANT fiyat karşılaştırması.
-- Derin modda (manuel "şimdi araştır") rakip listing'lerin varyantları çekilir,
-- bizim varyantlarla beden/ayar token'ıyla eşleştirilir; varyant başına rakip
-- fiyat bandı + bizim konumumuz `variant_comparison`'a yazılır.
alter table public.keyword_research
  add column if not exists variant_comparison jsonb;
