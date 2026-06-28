-- 0032 — Altın otomatik maliyet kaynağı
-- Satış anında altın fiyatına göre otomatik hesaplanan malzeme + işçilik
-- maliyet kalemleri için yeni kaynak değeri.
-- ------------------------------------------------------------------

alter table public.costs drop constraint if exists costs_source_check;
alter table public.costs add constraint costs_source_check
  check (source = any (array[
    'manual'::text,
    'csv'::text,
    'etsy'::text,
    'etsy_ledger'::text,
    'gold_auto'::text
  ]));
