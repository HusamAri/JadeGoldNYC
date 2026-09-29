-- EON iki tonlu (two-tone) yüzükler — 1,6 mm gram + $250 işçilik, kendi motoru,
-- düşüş yok (2026-09-29, sahip kararları).
--
-- Kapsam: TTG 10K/14K/18K (4550516268, 4550506421, 4550506827), EON-R Step Edge
-- 18K (4565472159), Brushed Center 10K (4565494144) ve 14K (4565471789),
-- Meridian panel taslağı (EON-MERID-TT). Yalnız 4–8 mm varyantlar; aralık dışı
-- (TTG 9–12 mm, EON-R 3 mm) prune-widths ile Etsy'den + panelden kalkar.
-- QS26 sabit genişlikli tasarım yüzükleri sahip kararıyla istisna.
--
-- Motorlar (bit-uyumla doğrulandı: formül bugünkü fiyatı birebir üretiyor):
--  - TTG: v4 (lib/pricing/gold-index.ts eonListCents), endeks tabanı $4.399,90.
--    Bugünkü fiyat 225/225 $74 (10K/14K) ve $40 (18K) kademesiyle birebir.
--  - Meridian: yeni aile motoru (scripts/eon/gen_meridian_package.mjs), $4.429,10.
--    Bugünkü fiyat 252/252 $55 işçilikle birebir.
--  - EON-R: formülle kurulmamış (elle); v4 ile hesaplanır, greatest(bugün, v4).
-- Ayar: TTG SKU'nun 3. segmentinin ilk iki hanesi (TTG-R-1406-…), EON-R ve
-- Meridian SKU'nun 4. segmenti (EON-R-1015-18-…). DİKKAT: `-R-(10|14|18)\d{2}-`
-- deseni EON-R'de tasarım kodu 1015'i yakalayıp her şeyi 10K sayıyordu.
--
-- İdempotens: gram çarpımı bileşikleşir; `weight_source` sonuna `+t1.6` eklenir
-- ve etiketli satır tekrar seçilmez. Fiyat yeni gramdan türediği için ikinci
-- koşu aynı sonucu verir.
--
-- Sonuç (792 varyant): TTG 225 (+%29,4 / +%30,5 / +%41,5), EON-R 10 (Brushed
-- Center 10K, en fazla +%2,7; 14K ve 18K motorun üstünde, değişmedi),
-- Meridian 252 (+%38,2). %30 indirimde zarar eden: 0.
-- Mühürler (md5 of id|price_cents|grams::float8, id sırası), kuru = yazım:
--   TTG 4550516268 21ac68e57400bc634900455db5b0947d
--   TTG 4550506421 db80c69490c8a2c3cd0983e84f158ee0
--   TTG 4550506827 037ed8590210fec41ad962f6a60fca0c
--   EONR 4565472159 2c33213e0161d15f37d1385655858aa9
--   EONR 4565494144 870ab8fba58f8078d6f2c7fd39ca81d2
--   EONR 4565471789 266db3d2eb2cdbc8a1af79443bdaaecb
--   MERID           8984a72399adf0c35ac2c620ac69a971
-- audit_log: 792 satır.

with v as (
 select p.etsy_listing_id lid, v.id, v.sku, v.price_cents, v.weight_grams::numeric g0, v.weight_source ws,
  case when v.sku like 'TTG-R-%' then 'TTG' when v.sku like 'EON-R-%' then 'EONR' else 'MERID' end fam,
  (regexp_match(coalesce(case when jsonb_typeof(v.properties)='array' then jsonb_path_query_first(v.properties,'$[*] ? (@.property_name == "Width").values[0]')#>>'{}' else v.properties->>'Width' end,''),'([0-9.]+)'))[1]::float8 w,
  case when v.sku like 'TTG-R-%' then substr(split_part(v.sku,'-',3),1,2)::int else split_part(v.sku,'-',4)::int end k
 from products p join product_variants v on v.product_id=p.id and v.active
 where p.org_id='9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
   and (p.etsy_listing_id in (4550516268,4550506421,4550506827,4565472159,4565494144,4565471789) or p.sku like 'EON-MERID%')),
c as (select v.*, round(g0*1.6/1.5, 2)::float8 g,
  case k when 10 then 0.417 when 14 then 0.583 when 18 then 0.75 end p4,
  case k when 10 then 0.417 when 14 then 0.585 when 18 then 0.75 end pn
 from v where w between 4 and 8 and ws not like '%+t1.6%'),
f as (select c.*,
  (ceil(floor((g*(4399.9/31.1034768)*p4*1.07 + 250 + 30)*(case when w<=7 then 1.55 else 2.0 end)+0.5)*4/15)*5*100)::int v4,
  (ceil(((g+1)*(4429.1/31.1034768)*pn*1.08 + 250 + 30)*(case when w>=8 then 2.2 else 2.05 end)/0.75/5)*500)::int nf
 from c),
t as (select f.*, case fam when 'TTG' then v4 when 'EONR' then greatest(price_cents, v4) else nf end newp from f),
u as (update product_variants pv
  set weight_grams = t.g, price_cents = t.newp, weight_source = coalesce(pv.weight_source,'') || '+t1.6', updated_at = now()
  from t where pv.id = t.id returning pv.id)
select count(*) from u;
