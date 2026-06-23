-- Devam ettirilebilir ("domino") Etsy senkronu için ilerleme imleci.
-- Her sayfa işlendiğinde güncellenir; zaman aşımında bir sonraki çağrı kaldığı
-- yerden devam eder. Canlı akış paneli bu sayaçları okur.
alter table public.etsy_connection
  add column if not exists sync_status   text not null default 'idle', -- idle|running|done|error
  add column if not exists sync_phase     text,                         -- sales|listings|reviews|done
  add column if not exists sync_offset    integer not null default 0,
  add column if not exists sync_sales     integer not null default 0,
  add column if not exists sync_items     integer not null default 0,
  add column if not exists sync_products  integer not null default 0,
  add column if not exists sync_reviews   integer not null default 0,
  add column if not exists sync_error     text,
  add column if not exists sync_started_at timestamptz,
  add column if not exists sync_updated_at timestamptz;
