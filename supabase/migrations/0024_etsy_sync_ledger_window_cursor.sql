-- Etsy ledger uç noktası min_created/max_created arasını en fazla 31 günle
-- sınırlıyor. Ledger 30 günlük pencerelerle geriye doğru çekilir; işlenen
-- pencerenin üst sınırı (max_created) imleçte saklanır ki zaman aşımında
-- kaldığı yerden devam edebilsin.
alter table public.etsy_connection
  add column if not exists sync_ledger_until bigint;
