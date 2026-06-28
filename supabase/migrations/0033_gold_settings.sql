-- 0033 — Altın maliyet ayarları
-- Organizasyon bazında tedarikçi alım fiyatı (gram/USD) yapılandırması.
-- Varsayılan değerler: 14K → $101/g, 10K → $65/g
-- ------------------------------------------------------------------

alter table public.organizations
  add column if not exists gold_settings jsonb not null default '{
    "purchase_price_14k_cents": 10100,
    "purchase_price_10k_cents": 6500
  }'::jsonb;
