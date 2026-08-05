-- 0117 — Sık kullanılan filtreler için eksik indeksler (performans)
-- ------------------------------------------------------------------------------
-- Büyük tablolarda (sale_items, products, sales) her sayfa yüklemesinde çalışan
-- ama destekleyici indeksi olmayan WHERE kolonları. Hepsi additive + idempotent
-- (`if not exists`); veri değişmez.
--
-- Not: product_metrics'in "%son 30%" ILIKE'ı (leading-wildcard) listings
-- sorgusunda ARTIK `.in(product_id, ...)` ile daraltıldığından mevcut
-- product_metrics(product_id) indeksi devreye girer — ayrı indeks gerekmez.

-- 1) sale_items.etsy_listing_id: 0042'de kolon eklendi ama indekslenmedi.
--    getListingViewsTrends + keyword-research listing-başı satış sayımında
--    org + etsy_listing_id ile filtrelenir; sale_items en büyük tablolardan.
create index if not exists sale_items_org_etsy_listing_idx
  on public.sale_items (org_id, etsy_listing_id);

-- 2) products: her /tasarimlar + arşiv yüklemesi `archived_at is null` +
--    `etsy_listing_id (null|not null)` süzer; yalnız (org_id) indeksliydi.
--    Kısmi indeks sık yolu (arşivsiz) doğrudan karşılar.
create index if not exists products_active_etsy_idx
  on public.products (org_id, etsy_listing_id)
  where archived_at is null;

-- 3) sales.etsy_receipt_id: reklam ledger uzlaştırması org + etsy_receipt_id
--    üyelik testi yapar; (org_id, order_date) indeksi bunu karşılamıyordu.
create index if not exists sales_org_receipt_idx
  on public.sales (org_id, etsy_receipt_id);
