-- 0135 — costs.source: 'invoice' değeri.
--
-- Tedarikçi faturasından girilen GERÇEK maliyet, otomatik tahminden
-- (gold_auto) ayrı işaretlenir: 'invoice' satırı varken maliyet üreticisi
-- o kalemi atlar (lib/gold-cost-entry.ts idempotency artık iki kaynağa
-- bakar). İlk kullanım: Creations By Tamsan fatura geri-doldurması
-- (no. 17794/17834/17863/17953, 2026-08-08 — docs/eon/tamsan-cost-calibration.md).

alter table public.costs drop constraint costs_source_check;
alter table public.costs add constraint costs_source_check
  check (source = any (array['manual','csv','etsy','etsy_ledger','shipstation','gold_auto','invoice']));
