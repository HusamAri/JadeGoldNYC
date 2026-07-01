-- 0041 — products.weight_grams: manuel, güvenilir ağırlık girişi
-- ------------------------------------------------------------------
-- Altın maliyet motoru ağırlığı başlıktan regex ile çıkarmaya çalışıyordu;
-- gerçek Etsy başlıklarının yalnızca %1.7'sinde gram ifadesi var (bkz.
-- Maliyetler denetimi) — bu yüzden gold_auto maliyeti hiç oluşmuyordu.
-- Ağırlık, ürünün sabit fiziksel özelliği: bir kez elle girilir, regex'e
-- gerek kalmaz. NULL ise mevcut başlık/açıklama regex'i yedek olarak kalır.

alter table public.products
  add column if not exists weight_grams numeric(8, 2);
