-- 0044 — products.target_quantity: toplu stok senkronizasyonu için hedef adet
-- ------------------------------------------------------------------
-- Personel (ör. atölye) her ürün için "elde/hedef stok" adedini panelde
-- doldurur; bu değer Etsy'ye YAZILACAK hedef adettir. Etsy'den okunan güncel
-- adet products.quantity'de tutulur — fark (diff) bu iki kolondan hesaplanır.
-- NULL = henüz doldurulmadı (senkronda atlanır). Additive; mevcut veriyi
-- değiştirmez.

alter table public.products
  add column if not exists target_quantity integer;
