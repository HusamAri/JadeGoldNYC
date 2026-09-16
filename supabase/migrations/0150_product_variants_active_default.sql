-- product_variants.active: varsayilan ve NOT NULL.
--
-- VAKA 2026-09-16: BAS-I10 Etsy'ye gonderilemedi, panel "Listing SKU'suz
-- varyant — Etsy senkronunu kontrol edin." dedi. SKU'lar doluydu. Gercek sebep
-- `active` idi: kolon nullable ve VARSAYILANSIZdi, varyantlar ham SQL ile
-- yazildiginda alan NULL kaldi ve `.eq("active", true)` NULL'u disarida birakti.
--
-- Hatanin sinsiligi mesajin YANLIS KATMANI adlandirmasiydi: suzgec hem SKU hem
-- active ariyor ama tek bir metin donduruyor, o yuzden kullanici SKU'yu arar.
-- Sinyalin metni bu migration'da degismiyor; duzeltilen sey, NULL'un artik
-- olusamamasi.
--
-- Kapsam olculdu: yalnizca 6 satir NULL'du (BAS-I10 ve BAS-I06, ucer varyant),
-- hepsi bu oturumda ham SQL ile yazilanlar. Panelin kendi yazicisi
-- (lib/etsy/variants.ts) her zaman `active: true` koyuyor, yani sorun kodda
-- degil semada: uygulama disindan yazan her yol ayni tuzagi kuruyordu.
--
-- Altı okuma yolu bu alani suzuyor (Etsy push, varyant listesi, stok,
-- lintel-drafts, Etsy ayarlari), yani NULL bir varyant panelin yarisinda
-- gorunmez oluyordu; kullanicinin gordugu hata yalnizca ilk yuzeye ciktigi yer.
--
-- NOT NULL guvenli: `product_variants.active` alanina bilerek null yazan
-- hicbir cagri yok (kontrol edildi; lib/shipstation/sync.ts'teki
-- `active: p.active ?? null` BASKA bir tabloya, shipstation_products'a yazar).

update public.product_variants set active = true where active is null;

alter table public.product_variants
  alter column active set default true;

alter table public.product_variants
  alter column active set not null;
