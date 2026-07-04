-- 0046 — Yorum yanıtları: panelde taslak yanıt yaz / AI öner + "yanıtlandı" takibi
-- ------------------------------------------------------------------
-- Etsy API yorum yanıtı YAZMAYA izin vermiyor (Feedback kaynakları "Retired"),
-- bu yüzden yanıt panelde hazırlanıp takip edilir; nihai gönderim Etsy sitesinde
-- tek tıkla yapıştırma ile olur. Additive: mevcut veriyi değiştirmez.

alter table public.reviews
  add column if not exists response_text text,
  add column if not exists responded_at timestamptz;
