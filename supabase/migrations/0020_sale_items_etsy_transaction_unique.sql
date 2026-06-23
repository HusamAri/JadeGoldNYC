-- Etsy senkronu sale_items'ı onConflict: etsy_transaction_id ile upsert eder;
-- eşleşen unique kısıt olmadığı için upsert hata veriyor ve kalemler hiç
-- yazılmıyordu. etsy_transaction_id Etsy'de global benzersizdir; elle eklenen
-- kalemlerde NULL olabilir (Postgres NULL'ları benzersiz kısıtta ayrık sayar).
alter table public.sale_items
  add constraint sale_items_etsy_transaction_id_key unique (etsy_transaction_id);
