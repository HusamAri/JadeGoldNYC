-- 0119 — Şirket bazlı özellik bayrakları (Amuletta çok-kiracı düzeltmesi).
--
-- Amuletta üç mağazaya hizmet eder (EON, Jade Gold, Seselka) ve kapsam kuralları
-- ŞİRKETE ÖZELDİR: bir mağazanın kuralı yüzünden kod SİLİNMEZ, o mağaza için
-- bayrak kapatılır. Örnek: anahtar kelime araştırmasını EON dış servise
-- (Alura) devretti; Jade Gold hâlâ panelde kullanıyor (62 keyword_research
-- satırı, 19 seo_tag_optimizations) → modül KALIR, EON'da bayrakla kapanır.
--
-- Desen `organizations.gold_settings` / `digest_settings` jsonb sütunlarıyla
-- aynı (org'a ait ayar org satırında yaşar); yeni tablo açmaya gerek yok.
--
-- Tanımlı bayraklar (lib/feature-flags.ts ile birebir):
--   externalPricing  — fiyat panel DIŞINDA belirlenir. AÇIKKEN panel fiyat
--                      hesaplamaz/önermez ve platforma fiyat YAZMAZ.
--   keywordResearch  — panel içi anahtar kelime/rakip araştırma yüzeyleri.
--   buyerFollowup    — alıcı takip/geri kazanım yüzeyleri.
--   photoStudio      — görsel üretim + foto prodüksiyon yüzeyleri.
-- Bayrak YOKSA varsayılan: externalPricing=false, diğerleri true (mevcut
-- davranış korunur — yalnız bilerek kapattığımız mağazada değişir).

alter table public.organizations
  add column if not exists feature_flags jsonb not null default '{}'::jsonb;

comment on column public.organizations.feature_flags is
  'Şirket bazlı özellik bayrakları. Bkz. lib/feature-flags.ts (externalPricing, keywordResearch, buyerFollowup, photoStudio).';

-- EON: fiyat 2026-07-16 EON fiyat motoru xlsx''inde belirlenir; panelin fiyat
-- hesaplaması/yazması KAPALI. Anahtar kelime + alıcı takip Alura''ya devredildi.
update public.organizations
set feature_flags = coalesce(feature_flags, '{}'::jsonb) || jsonb_build_object(
      'externalPricing', true,
      'keywordResearch', false,
      'buyerFollowup', false
    )
where slug = 'eon-266055';

-- Jade Gold: anahtar kelime/SEO/stüdyo yüzeylerini AKTİF kullanıyor; fiyat
-- kısıtı EON''un ev kuralı, Jade''i bağlamaz.
update public.organizations
set feature_flags = coalesce(feature_flags, '{}'::jsonb) || jsonb_build_object(
      'externalPricing', false,
      'keywordResearch', true,
      'buyerFollowup', true,
      'photoStudio', true
    )
where slug = 'jade-gold-nyc';

-- Seselka: bugün veri yok (kabuk org). Nötr varsayılan; kural üretmez.
update public.organizations
set feature_flags = coalesce(feature_flags, '{}'::jsonb) || jsonb_build_object(
      'externalPricing', false,
      'photoStudio', false
    )
where slug = 'seselka-home';
