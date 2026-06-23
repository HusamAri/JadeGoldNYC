-- Artımlı ledger: ilk tam backfill bir kez (ledger_backfilled=true olur),
-- sonraki senkronlar yalnız en son kayıttan beri yeni ücretleri çeker.
-- sync_ledger_floor: o turun ledger taramasının alt sınırı (chunk'lar arası stabil).
alter table public.etsy_connection
  add column if not exists sync_ledger_floor bigint,
  add column if not exists ledger_backfilled boolean not null default false;
