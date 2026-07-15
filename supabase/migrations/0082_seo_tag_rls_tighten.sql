-- 0082 — SEO etiket optimizasyonu RLS sıkılaştırma (güvenlik düzeltmesi)
--
-- 0081'deki "seo_tag_opt_update" politikası her authenticated org üyesine
-- UPDATE veriyordu; sütun kısıtı yoktu. Yönetici olmayan bir üye tarayıcı
-- Supabase istemcisiyle status/pushed_*/baseline alanlarını değiştirip
-- server-action'daki isManager kapısını atlayabilir, deney durumunu bozabilir.
--
-- Düzeltme: authenticated UPDATE politikasını KALDIR. Tüm yazmalar server
-- action'larda service-role (admin) istemcisiyle yapılır — isManager + Etsy
-- yazma izni orada zorlanır (keyword_research ile aynı desen: yalnız SELECT
-- politikası, yazma service-role). Okuma politikası (org üyesi) korunur.

drop policy if exists "seo_tag_opt_update" on public.seo_tag_optimizations;
