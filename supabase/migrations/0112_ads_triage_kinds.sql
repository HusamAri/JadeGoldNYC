-- 0112_ads_triage_kinds.sql
-- Reklam TRİYAJ kuralı (kullanıcı direktifi): "bütçe yiyen" listing'de önce
-- ARAMA TERİMLERİ raporu okunur; karar ağacının sonuçları yeni aksiyon
-- türleri gerektirir:
--   listing_duzelt — terimler HEDEFTE ama sipariş yok → sorun reklam değil
--                    listing (güven boşluğu: fotoğraf, fiyat çerçevesi,
--                    yorumlar). Reklama dokunulmaz.
--   daralt         — terimler HEDEF DIŞI → uyumsuz etiket listing'den
--                    çıkarılır / Etsy negatif kelime sunuyorsa terim hariç
--                    tutulur.
--   bekle          — veri çok taze (≈3 gün) → kapatma kararı verilmez,
--                    birkaç gün sonra triyaj tekrarlanır.
-- ("kapat" zaten var — yalnız trafik HİÇ dönüşmeyecekse ve yeterli veriyle.)

alter table public.ads_actions
  drop constraint if exists ads_actions_kind_check;

alter table public.ads_actions
  add constraint ads_actions_kind_check
  check (kind in ('kapat', 'azalt', 'artir', 'incele', 'listing_duzelt', 'daralt', 'bekle'));
