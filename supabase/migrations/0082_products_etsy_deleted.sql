-- 0082 — Etsy'den silinen ama panelde İZİ TUTULAN listingler. `products` satırı
-- SİLİNMEZ (geriye dönük arşiv isteği); yalnız etsy_deleted_at işaretlenir.
-- Akış: önce medyayı arşivle (0081 listing_media) → Etsy'den sil → burada işaretle.
alter table public.products
  add column if not exists etsy_deleted_at timestamptz;
