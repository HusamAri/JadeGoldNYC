-- 0134 — Etsy günlük API kota telemetrisi.
--
-- Neden: 2026-08-08'de günlük kota (429 "Exceeded daily rate limit") dolduğunda
-- hiçbir iş bunu ÖNCEDEN göremiyordu — altın endeksi, senkron, SEO push ve
-- panel itişi aynı kotayı körlemesine paylaşıyor. Etsy her cevapta kalan
-- kotayı header'da bildirir (x-limit-per-day / x-remaining-today); istemci
-- artık bunu bu kolonlara yazar. Tüketiciler:
--   - lib/pricing/gold-reprice-run: rezervin altındaysa koşuyu ERTELER
--   - /fiyat paneli: kalan kotayı gösterir
--
-- Token satırı gibi hassas veri içermez; mevcut RLS düzeni aynen geçerli
-- (tablo üyeye kapalı, erişim RPC/servis üzerinden).

alter table public.etsy_connection
  add column if not exists quota_limit_daily integer,
  add column if not exists quota_remaining integer,
  add column if not exists quota_observed_at timestamptz;

comment on column public.etsy_connection.quota_limit_daily is
  'Etsy x-limit-per-day header''ından gözlenen günlük istek limiti.';
comment on column public.etsy_connection.quota_remaining is
  'Etsy x-remaining-today header''ından gözlenen kalan istek sayısı.';
comment on column public.etsy_connection.quota_observed_at is
  'Kota değerlerinin en son hangi API cevabından okunduğu.';
