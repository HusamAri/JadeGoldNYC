-- 0101_eon_catalog_v3.sql
-- EON Katalog v3 — v2'nin üstüne TRANSFORM (0100'den sonra çalışır).
--
-- Değişiklikler (kullanıcı direktifi):
--   1) Bedenlere YARIM ölçüler eklendi: US 4, 4.5, 5, ... 16 = 25 beden
--      (yarım-beden gramları komşu tam bedenlerin doğrusal orta-noktası;
--       tablolar satır-doğrusal olduğu için birebir interpolasyon geçerli).
--   2) 2.0mm kalınlık KALDIRILDI; tek kalınlık 1.5mm kaldı ("2 kalınları
--      temizle, 1.5mm olanı kalsın"). Varyant ekseni artık 11 genişlik
--      (2-12mm) yalnız; SKU'dan T15/T20 kalınlık token'ı düştü.
--   3) Varyant/listing: 25 beden x 11 genişlik = 275 (v2'de 286'ydı).
--      39 listing x 275 = 10.725 varyant (v2'de 11.154).
--   4) 39 açıklama, iki-kalınlık dili temizlenip yeniden yazıldı
--      ("whole and half sizes", tek 1.5mm kalınlık); sessiz-lüks ton,
--      minimalist/kalıcı kural (fiyat/gram/servis-süresi/resize sözü YOK).
--
-- Fiyat formülü değişmedi: fiyat = ceil(gram * hedef_ppg_cent / 500)*500 + 1000
-- ($5 yukarı yuvarla + $10 kargo payı). hedef ppg (cent/g): 10K 10730,
-- 14K standart 15820, 18K 19320; YILDIZ GLD-R-1401 (14K Yellow Dome) 13560.
--
-- Not: Bu migration canlıya Supabase MCP ile parçalı uygulandı; dosya
-- preview provizyonu ve kalıcı kayıt içindir. SKU şeması: <fam>-<W>MM-<SIZE>
-- (ör. GLD-R-1401-6MM-4.5). Yarım beden ondalıkla, tam beden tam sayı.

-- ==== BÖLÜM A: varyant katmanı v2 -> v3 (gram/ppg staging + transform) ====

-- v3 gram + ppg staging
create temp table _v3g(karat text, width int, grams numeric[]);
insert into _v3g values

('10K',2,'{1.37,1.4,1.43,1.465,1.5,1.535,1.57,1.6,1.63,1.665,1.7,1.735,1.77,1.8,1.83,1.865,1.9,1.935,1.97,2.0,2.03,2.065,2.1,2.13,2.16}'::numeric[]),
('10K',3,'{2.05,2.1,2.15,2.2,2.25,2.3,2.35,2.4,2.45,2.5,2.55,2.6,2.65,2.7,2.75,2.8,2.85,2.9,2.95,3.0,3.05,3.1,3.15,3.2,3.25}'::numeric[]),
('10K',4,'{2.74,2.805,2.87,2.935,3.0,3.07,3.14,3.205,3.27,3.335,3.4,3.465,3.53,3.6,3.67,3.735,3.8,3.865,3.93,3.995,4.06,4.13,4.2,4.265,4.33}'::numeric[]),
('10K',5,'{3.42,3.505,3.59,3.67,3.75,3.835,3.92,4.0,4.08,4.165,4.25,4.335,4.42,4.5,4.58,4.665,4.75,4.83,4.91,4.995,5.08,5.185,5.29,5.355,5.42}'::numeric[]),
('10K',6,'{4.11,4.205,4.3,4.4,4.5,4.6,4.7,4.8,4.9,5.0,5.1,5.2,5.3,5.4,5.5,5.6,5.7,5.8,5.9,6.0,6.1,6.195,6.29,6.39,6.49}'::numeric[]),
('10K',7,'{4.79,4.905,5.02,5.135,5.25,5.37,5.49,5.605,5.72,5.835,5.95,6.065,6.18,6.3,6.42,6.535,6.65,6.765,6.88,6.995,7.11,7.225,7.34,7.46,7.58}'::numeric[]),
('10K',8,'{5.47,5.605,5.74,5.87,6.0,6.135,6.27,6.405,6.54,6.67,6.8,6.935,7.07,7.2,7.33,7.465,7.6,7.73,7.86,7.995,8.13,8.26,8.39,8.525,8.66}'::numeric[]),
('10K',9,'{6.16,6.31,6.46,6.61,6.76,6.905,7.05,7.2,7.35,7.5,7.65,7.8,7.95,8.1,8.25,8.4,8.55,8.7,8.85,8.995,9.14,9.29,9.44,9.59,9.74}'::numeric[]),
('10K',10,'{6.84,7.005,7.17,7.34,7.51,7.675,7.84,8.005,8.17,8.335,8.5,8.665,8.83,8.995,9.16,9.33,9.5,9.665,9.83,9.995,10.16,10.325,10.49,10.655,10.82}'::numeric[]),
('10K',11,'{7.53,7.71,7.89,8.075,8.26,8.44,8.62,8.805,8.99,9.17,9.35,9.535,9.72,9.9,10.08,10.265,10.45,10.63,10.81,10.995,11.18,11.355,11.53,11.72,11.91}'::numeric[]),
('10K',12,'{8.21,8.41,8.61,8.81,9.01,9.21,9.41,9.605,9.8,10.0,10.2,10.4,10.6,10.8,11.0,11.2,11.4,11.595,11.79,11.99,12.19,12.39,12.59,12.79,12.99}'::numeric[]),
('14K',2,'{1.56,1.595,1.63,1.67,1.71,1.745,1.78,1.82,1.86,1.895,1.93,1.97,2.01,2.045,2.08,2.12,2.16,2.195,2.23,2.27,2.31,2.345,2.38,2.39,2.4}'::numeric[]),
('14K',3,'{2.33,2.39,2.45,2.505,2.56,2.615,2.67,2.73,2.79,2.845,2.9,2.955,3.01,3.065,3.12,3.18,3.24,3.295,3.35,3.405,3.46,3.52,3.58,3.635,3.69}'::numeric[]),
('14K',4,'{3.11,3.185,3.26,3.335,3.41,3.485,3.56,3.635,3.71,3.785,3.86,3.935,4.01,4.09,4.17,4.245,4.32,4.395,4.47,4.545,4.62,4.695,4.77,4.845,4.92}'::numeric[]),
('14K',5,'{3.89,3.975,4.06,4.16,4.26,4.355,4.45,4.545,4.64,4.735,4.83,4.925,5.02,5.115,5.21,5.305,5.4,5.49,5.58,5.675,5.77,5.865,5.96,6.055,6.15}'::numeric[]),
('14K',6,'{4.67,4.78,4.89,5.005,5.12,5.23,5.34,5.455,5.57,5.685,5.8,5.91,6.02,6.135,6.25,6.36,6.47,6.585,6.7,6.815,6.93,7.04,7.15,7.265,7.38}'::numeric[]),
('14K',7,'{5.44,5.575,5.71,5.84,5.97,6.1,6.23,6.365,6.5,6.63,6.76,6.895,7.03,7.16,7.29,7.42,7.55,7.685,7.82,7.95,8.08,8.215,8.35,8.48,8.61}'::numeric[]),
('14K',8,'{6.22,6.37,6.52,6.67,6.82,6.975,7.13,7.28,7.43,7.58,7.73,7.88,8.03,8.18,8.33,8.48,8.63,8.78,8.93,9.085,9.24,9.39,9.54,9.69,9.84}'::numeric[]),
('14K',9,'{7.0,7.17,7.34,7.51,7.68,7.85,8.02,8.19,8.36,8.525,8.69,8.86,9.03,9.2,9.37,9.54,9.71,9.88,10.05,10.22,10.39,10.56,10.73,10.9,11.07}'::numeric[]),
('14K',10,'{7.78,7.965,8.15,8.34,8.53,8.72,8.91,9.095,9.28,9.47,9.66,9.85,10.04,10.225,10.41,10.6,10.79,10.98,11.17,11.36,11.55,11.735,11.92,12.11,12.3}'::numeric[]),
('14K',11,'{8.55,8.76,8.97,9.175,9.38,9.59,9.8,10.005,10.21,10.42,10.63,10.835,11.04,11.25,11.46,11.665,11.87,12.08,12.29,12.495,12.7,12.905,13.11,13.32,13.53}'::numeric[]),
('14K',12,'{9.33,9.555,9.78,10.01,10.24,10.465,10.69,10.915,11.14,11.365,11.59,11.815,12.04,12.27,12.5,12.725,12.95,13.175,13.4,13.625,13.85,14.08,14.31,14.535,14.76}'::numeric[]),
('18K',2,'{2.04,2.095,2.15,2.205,2.26,2.31,2.36,2.415,2.47,2.52,2.57,2.625,2.68,2.73,2.78,2.835,2.89,2.945,3.0,3.065,3.13,3.195,3.26,3.31,3.36}'::numeric[]),
('18K',3,'{2.64,2.7,2.76,2.82,2.88,2.94,3.0,3.06,3.12,3.18,3.24,3.3,3.36,3.42,3.48,3.54,3.6,3.66,3.72,3.785,3.85,3.93,4.01,4.045,4.08}'::numeric[]),
('18K',4,'{3.6,3.67,3.74,3.815,3.89,3.965,4.04,4.115,4.19,4.26,4.33,4.405,4.48,4.555,4.63,4.705,4.78,4.85,4.92,4.98,5.04,5.105,5.17,5.285,5.4}'::numeric[]),
('18K',5,'{4.56,4.655,4.75,4.84,4.93,5.025,5.12,5.21,5.3,5.4,5.5,5.59,5.68,5.775,5.87,5.96,6.05,6.145,6.24,6.305,6.37,6.435,6.5,6.755,7.01}'::numeric[]),
('18K',6,'{5.4,5.515,5.63,5.745,5.86,5.97,6.08,6.195,6.31,6.42,6.53,6.645,6.76,6.87,6.98,7.095,7.21,7.325,7.44,7.505,7.57,7.75,7.93,8.045,8.16}'::numeric[]),
('18K',7,'{5.88,6.01,6.14,6.275,6.41,6.545,6.68,6.815,6.95,7.08,7.21,7.345,7.48,7.615,7.75,7.885,8.02,8.15,8.28,8.34,8.4,8.52,8.64,8.88,9.12}'::numeric[]),
('18K',8,'{6.48,6.625,6.77,6.92,7.07,7.215,7.36,7.51,7.66,7.8,7.94,8.09,8.24,8.385,8.53,8.68,8.83,8.975,9.12,9.24,9.36,9.48,9.6,9.78,9.96}'::numeric[]),
('18K',9,'{7.98,8.17,8.36,8.555,8.75,8.945,9.14,9.33,9.52,9.715,9.91,10.105,10.3,10.495,10.69,10.88,11.07,11.265,11.46,11.655,11.85,12.04,12.23,12.425,12.62}'::numeric[]),
('18K',10,'{8.86,9.075,9.29,9.505,9.72,9.935,10.15,10.365,10.58,10.795,11.01,11.225,11.44,11.51,11.58,11.94,12.3,12.515,12.73,12.945,13.16,13.375,13.59,13.805,14.02}'::numeric[]),
('18K',11,'{9.75,9.985,10.22,10.46,10.7,10.935,11.17,11.405,11.64,11.875,12.11,12.35,12.59,12.825,13.06,13.295,13.53,13.77,14.01,14.245,14.48,14.715,14.95,15.185,15.42}'::numeric[]),
('18K',12,'{10.64,10.895,11.15,11.41,11.67,11.925,12.18,12.44,12.7,12.96,13.22,13.475,13.73,13.985,14.24,14.5,14.76,15.02,15.28,15.535,15.79,16.05,16.31,16.57,16.83}'::numeric[]);
create temp table _v3p(family text, karat text, ppg int);
insert into _v3p values

('GLD-R-1001','10K',10730),
('GLD-R-1401','14K',13560),
('GLD-R-1801','18K',19320),
('WHG-R-1001','10K',10730),
('WHG-R-1401','14K',15820),
('WHG-R-1801','18K',19320),
('RSG-R-1001','10K',10730),
('RSG-R-1401','14K',15820),
('RSG-R-1801','18K',19320),
('GLD-R-1002','10K',10730),
('GLD-R-1402','14K',15820),
('GLD-R-1802','18K',19320),
('WHG-R-1002','10K',10730),
('WHG-R-1402','14K',15820),
('WHG-R-1802','18K',19320),
('RSG-R-1002','10K',10730),
('RSG-R-1402','14K',15820),
('RSG-R-1802','18K',19320),
('GLD-R-1003','10K',10730),
('GLD-R-1403','14K',15820),
('GLD-R-1803','18K',19320),
('WHG-R-1003','10K',10730),
('WHG-R-1403','14K',15820),
('WHG-R-1803','18K',19320),
('RSG-R-1003','10K',10730),
('RSG-R-1403','14K',15820),
('RSG-R-1803','18K',19320),
('GLD-R-1004','10K',10730),
('GLD-R-1404','14K',15820),
('GLD-R-1804','18K',19320),
('WHG-R-1004','10K',10730),
('WHG-R-1404','14K',15820),
('WHG-R-1804','18K',19320),
('RSG-R-1004','10K',10730),
('RSG-R-1404','14K',15820),
('RSG-R-1804','18K',19320),
('GLD-R-1005','10K',10730),
('GLD-R-1405','14K',15820),
('GLD-R-1805','18K',19320);

-- eski v2 varyantları sil
delete from product_variants v using products p
where v.product_id=p.id and p.org_id=(select id from organizations where name='EON')
  and v.weight_source in ('catalog_v2');

-- yeni v3 varyantları türet (25 beden x 11 genişlik, 1.5mm)
with eon as (select id from organizations where name='EON'),
sizes as (select s.size, s.i from unnest(ARRAY[4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,12.5,13,13.5,14,14.5,15,15.5,16]::numeric[]) with ordinality as s(size,i)),
prod as (select p.id, p.sku, pp.karat, pp.ppg from products p join _v3p pp on pp.family=p.sku
         where p.org_id=(select id from eon)),
v as (
  select pr.id as product_id, pr.sku as family, pr.karat, pr.ppg,
         g.width, s.size, g.grams[s.i] as grams
  from prod pr join _v3g g on g.karat=pr.karat cross join sizes s
)
insert into product_variants (org_id, sku, product_id, properties, price_cents, quantity, weight_grams, weight_source, active, currency)
select (select id from eon),
  v.family||'-'||v.width||'MM-'||(case when v.size=floor(v.size) then floor(v.size)::text else v.size::text end),
  v.product_id,
  jsonb_build_object('Karat',v.karat,
    'Metal',(case split_part(v.family,'-',1) when 'GLD' then 'Yellow Gold' when 'WHG' then 'White Gold' when 'RSG' then 'Rose Gold' end),
    'Width', v.width||'mm',
    'Ring Size',(case when v.size=floor(v.size) then floor(v.size)::text else v.size::text end)),
  (ceil((v.grams*v.ppg)/500.0)*500 + 1000)::int,
  20, v.grams, 'catalog_v3', true, 'USD'
from v;

-- ürün çapa fiyatı = min varyant
update products p set price_cents=m.minp, updated_at=now()
from (select product_id, min(price_cents) minp from product_variants where weight_source='catalog_v3' group by product_id) m
where m.product_id=p.id and p.org_id=(select id from organizations where name='EON');

drop table _v3g; drop table _v3p;


-- ==== BÖLÜM B: 39 açıklama v3 (iki-kalınlık dili temiz, whole+half) ====

update products set description=$eon$A solid 10k yellow gold wedding band, domed and comfort fit, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: Domed half-round, the classic wedding-band curve.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The yellow runs warm but quiet, never showy. The domed curve rounds the light instead of flashing it.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 2mm through 12mm, in Width. A 2 to 4mm reads slim and stacks well; 5 to 7mm is the everyday width; 8 to 12mm sits wide across the finger.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J · June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. Solid gold, all the way through.

---
[EON 01 · GLD-R-1001 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1001$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 14k yellow gold wedding band, domed and smooth, made to order in your size. Never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold. Never plated, never filled.
Profile: Domed half-round, comfort fit interior.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Ring Size covers US sizes 4 to 16, whole and half sizes, picked in the Ring Size dropdown. Width covers 2 to 12 mm, picked in the Width dropdown. Widths from 2 to 4 mm sit close and stack well; 5 to 7 mm is the classic width; 8 to 12 mm sits wide on the hand. If you're between sizes, send us a message before you order.

MAKE IT YOURS
Three choices, top to bottom:
1. Pick your ring size, US sizes 4 to 16 in whole and half sizes.
2. Pick your width, 2 to 12 mm.
3. Add your engraving in the Personalization box, up to 30 characters, set inside the band and copied exactly as you type it. Script is the default; say the word if you'd rather have block letters. Something like "A & M", a date, or coordinates. Leave it blank and it ships clean. Engraving is free.

WHY EON
EON makes solid gold wedding bands, made to order. I make each in your size and stamp it 14k inside. Worn as a wedding, anniversary, or promise band.

---
[EON 02 · GLD-R-1401 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1401$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k yellow gold wedding band, domed and comfort fit inside. Made to order, never plated, never filled, with free engraving hidden in the band.

The color runs deep and warm, the yellow you picture when someone says the word. The dome sits high and catches light along one soft line as the hand moves.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: Dome.
Fit: Comfort fit interior.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US 4 to 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Width sets the look: 2 to 4 mm reads slim and stacks easily, 5 to 7 mm is the classic band, 8 to 12 mm sits wide and bold. Sizes run US 4 to 16 in whole and half sizes; if you land between two, message us before ordering.

MAKE IT YOURS
1. Pick your size in the Ring Size dropdown.
2. Pick your width in the Width dropdown.
3. Type your engraving in the Personalization box. It is free, up to 30 characters, set inside the band and copied exactly as you write it. Script is the default; note block letters if you prefer them. One quiet example: A & J · June 15. Left blank, it ships clean.

WHY EON
I make each band to order in 18k gold, solid all the way through.

---
[EON 03 · GLD-R-1801 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1801$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k white gold wedding band, domed with a comfort fit inside. Never plated, never filled. Made to order in your size, with free engraving inside. The color is a cool, pale white, quiet against the skin, and the rounded outside turns a single soft line of light as the hand moves.

THE DETAILS
Metal: Solid 10k white gold, never plated, never filled.
Profile: Domed, curved across the top.
Fit: Comfort fit interior, rounded so it slides over the knuckle and settles in.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.
The rounded interior is the part you stop feeling by the end of the day.

SIZE & WIDTH
Ring Size covers US sizes 4 through 16, whole and half sizes. Width runs 2 through 12 mm, picked in the Width dropdown.
If you land between two sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size, US 4 through 16 in whole and half sizes.
2. Choose your width, 2 through 12 mm.
3. Add an engraving inside the band. Type it in the Personalization box, up to 30 characters, copied exactly as you write it. Something like A & J, June 15, or a name or a date. Script is the default; ask for block letters if you prefer. Left blank, the band ships clean.
Engraving is free.

WHY EON
I cut and finish each band to order in your size. A plain white band meant to be worn daily, slept in, and handed down.

---
[EON 04 · WHG-R-1001 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1001$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 14k white gold wedding band, domed and made to order in your size and width. Never plated, never filled, with free engraving hidden inside.

The dome keeps the outside smooth and rounded.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: Dome.
Fit: Comfort fit interior, rounded on the inside so it clears the knuckle and settles in for daily wear.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm, picked in the Width dropdown. If you're between sizes, message us.

MAKE IT YOURS
1. Choose your ring size, US 4 through 16 in whole and half sizes.
2. Choose your width in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you type it. Script is the default; note block letters if you'd rather. Something like A & J · June 15, or a few initials. Left blank, it ships clean.

WHY EON
I make each one to order, solid 14k gold all the way through. No plating to wear thin, no filler underneath.

---
[EON 05 · WHG-R-1401 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1401$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k white gold wedding band, domed profile, never plated or filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k white gold, never plated, never filled.
Profile: Domed.
Fit: Comfort fit interior.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns build your band. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick a width, 2 to 12 mm, in the Width dropdown.
Width sets how it wears: 2 to 4 mm runs slim and stacks easily, 5 to 7 mm sits as a classic middle, 8 to 12 mm covers more of the finger. If you fall between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Add your engraving in the Personalization box.
Engraving is free and sits inside the band, seen only by the one who wears it: a date, initials, or a few words, up to 30 characters, copied exactly as you type it. Script is the default; note block letters if you prefer them. Something like A & J · June 15. Leave it blank and the band ships clean.

WHY EON
I make each band to order at the bench, one size and one width at a time, in gold that stays solid the whole way through. It is a ring made to be worn every day, slept in, and one day handed down.

---
[EON 06 · WHG-R-1801 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1801$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k rose gold wedding band, domed and comfort fit inside, never plated, never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k rose gold. Never plated, never filled.
Profile: Dome.
Fit: Comfort fit interior, rounded to clear the knuckle and settle in.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

Rose gold wears warm against the skin, a low pink that catches quietly, and the domed top holds a single soft line of light as the hand turns.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2 to 12 mm, chosen in the Width dropdown.

Wider bands wear a touch snugger, so if you land between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.

Engraving is free and sits hidden inside the band, reproduced exactly as you type it, up to 30 characters. Something like A & J, June 15, or a set of initials, or a date. Script is the default; say the word if you'd prefer block letters. Leave it blank and the band ships clean. For anything more involved, send a message before you order.

WHY EON
I make each band to order and stamp it 10k inside, one at a time. This is a ring made to be worn now, slept in, and handed down.

---
[EON 07 · RSG-R-1001 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1001$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 14k rose gold wedding band, domed and never plated, never filled. Made to order in your size and width, with free engraving inside the band.

The domed profile rounds up off the finger and holds the light in one clean line. Rose gold runs warm, and this one keeps it quiet. No stones, nothing to date it.

THE DETAILS
Metal: Solid 14k rose gold, never plated, never filled.
Profile: Domed half-round, no stones.
Fit: Comfort fit interior, rounded so it clears the knuckle.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Two dropdowns build your band. Ring Size covers US sizes 4 through 16, whole and half sizes. Width runs 2mm to 12mm, picked in the Width dropdown.

Width changes how it wears. A 2 to 4mm band sits light and stacks with others; 5 to 7mm is the classic wedding width, present without taking over; 8 to 12mm runs wide and covers more of the finger. If you sit between sizes, message us before ordering.

MAKE IT YOURS
Order in three steps:
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Type your engraving in the Personalization box, or leave it blank.

The engraving is free and hidden inside the band, read only by the one wearing it: a date, initials, coordinates, a few words. It's copied exactly as you type it, up to 30 characters, so check the spelling. Script is the default; note block letters if you'd rather. Something like A & J · June 15, or leave it blank and it ships clean. For another date format or a coordinate, message us before ordering.

WHY EON
I make these to order, one band at a time, and stamp the karat inside before it ships. Solid gold, never plated, never filled.

---
[EON 08 · RSG-R-1401 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1401$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k rose gold wedding band, domed on top, comfort fit inside — not plated, not filled. Made to order in your size, with free engraving inside the band. Rose gold this deep reads warm against the skin, and the domed top holds a soft line of light that rolls as the hand turns.

THE DETAILS
Metal: Solid 18k rose gold, never plated, never filled.
Profile: Domed half-round, one continuous curve across the top.
Fit: Comfort fit interior, rounded so it clears the knuckle and settles in for daily wear.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.
The rounded interior is the part your finger forgets first.

SIZE & WIDTH
Pick your size in the Ring Size dropdown: US sizes 4 through 16, whole and half sizes. Pick your width in the Width dropdown, 2 to 12 mm. If you're between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you type it: a date, initials, a few words, like A & J · June 15. Script is the default; note block letters if you'd rather. Left blank, it ships clean. For anything more particular, send a message first.

WHY EON
EON is solid gold made to outlast the day it marks. I make each band to the size you order, one at a time, never pulled from a drawer. Gold the whole way through, worn every day, slept in, and handed down when it's time.

---
[EON 09 · RSG-R-1801 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1801$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 10k yellow gold wedding band with a flat profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: Flat.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width runs 2mm through 12mm, picked in the Width dropdown.

2 to 4mm reads slim and stacks well. 5 to 7mm is the classic band. 8 to 12mm wears wide and bold. If you land between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size. 2. Choose your width. 3. Add an engraving, or leave it blank.

The engraving is free and hidden inside the band: a date, initials, coordinates, a few words. Type it in the Personalization box, up to 30 characters, copied exactly as written. Script is the default; note block letters if you'd rather. Something like A & J · June 15, or leave the box empty and the band ships clean.

WHY EON
This is the plain, hard-wearing yellow gold you put on and stop thinking about: worn daily, slept in, handed down.

---
[EON 10 · GLD-R-1002 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1002$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 14k yellow gold in a flat wedding band, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: Flat.
Fit: Flat inner wall, made true to your size.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

The color warms against skin, and the flat face reads as a bright line rather than a rounded gleam.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm. Choose your width there.

Width changes the ring more than you would expect. 2mm to 4mm is slim and easy to stack. 5mm to 7mm is the classic band most people picture. 8mm to 12mm is a wide band that covers more of the finger. A wider band wears snugger, so if you land between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.

Engraving is free and sits inside the band, where only the wearer will find it. Up to 30 characters, copied exactly as you type them, something like "A & J · June 15." Script is the default; ask for block letters if you would rather. For a coordinate or a different date format, message us first. Leave it blank and the band ships unengraved.

WHY EON
I make each band to order in solid gold, cut and stamped one at a time. It is meant to be worn every day, slept in, and handed down when the time comes. It marks the moment now and outlasts it.

---
[EON 11 · GLD-R-1402 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1402$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k yellow gold wedding band with a flat profile and clean edges. Never plated, never filled, made to order with free engraving inside the band.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: A flat face with crisp, clean edges.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.
The flat face catches light in a clean, straight line, and the 18k underneath runs deep and warm against the skin. Solid gold, all the way through.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 to 16, whole and half sizes. Width covers 2mm to 12mm, picked in the Width dropdown. If you sit between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size, US 4 to 16 in whole and half sizes.
2. Choose your width in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you type it: a date, initials, coordinates, or a few words, like "A & J, June 15". Script is the default, so note if you prefer block letters. Left blank, it ships clean. For anything more involved, message us before ordering.

WHY EON
I make each band to order at the bench, one size and one width at a time, in gold that is solid the whole way down. EON makes solid gold meant to outlive the moment it marks, worn daily, slept in, and handed down.

---
[EON 12 · GLD-R-1802 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1802$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k white gold wedding band with a flat profile. Not plated, not filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k white gold, never plated, never filled.
Profile: Flat.
Width: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
A 2 to 4 mm band reads slim and stacks easily. The 5 to 7 mm range is the everyday middle, and 8 to 12 mm sits wide across the finger. Wider bands wear a little snugger. From about 6 mm up, if you land between two sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Type your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it. Script is the default; note block letters if you prefer them. It is copied exactly as you type it, so check the spelling: a date, initials, a few words, something like A & J · June 15. Left blank, it ships clean.
The engraving is free.

WHY EON
I cut every band to order in solid 10k, never plated, never filled, stamped 10k inside.

---
[EON 13 · WHG-R-1002 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1002$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 14k white gold wedding band, flat profile with crisp, clean edges. Never plated, never filled, made to order with free engraving inside the band.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: A flat face with clean, crisp edges.
Width: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k on the inside.
The flat face sits level against the finger, and those clean edges hold a line of light where a rounded band would soften it.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 to 16, whole and half sizes, and sets the fit. Width covers 2mm to 12mm and sets the face, picked in that same dropdown.

2 to 4mm sits slim and stacks well, 5 to 7mm is a classic width, and 8 to 12mm covers more of the finger. If you land between sizes, send us a message before you order.

MAKE IT YOURS
1. Choose your ring size, US 4 to 16 in whole and half sizes.
2. Choose your width, 2mm to 12mm.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you write it. Script is the default; note block letters if you prefer. One example: A & J · June 15. Leave it blank and the band ships clean.

WHY EON
I make each band to order in solid 14k white gold. Solid gold, all the way through. Worn every day, slept in, handed down when the time comes.

---
[EON 14 · WHG-R-1402 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1402$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A flat wedding band in solid 18k white gold, never plated, never filled. Made to order in your size and width, with free engraving hidden inside the band.

THE DETAILS
Metal: solid 18k white gold.
Profile: flat, with crisp, clean edges.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: stamped 18k inside the band.
The flat face sits flush to the finger and the edges stay crisp, so the band catches the light in one clean line.

SIZE & WIDTH
Two dropdowns build your band. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm, picked in that same Width dropdown.
Narrow widths, 2 to 4mm, sit slim and stack easily. The 5 to 7mm range is the classic wedding width. From 8mm up the band covers more of the finger and reads wide. If you fall between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Add your engraving in the Personalization box.
The engraving sits inside the band, where only the wearer sees it, and it is free. Up to 30 characters, copied exactly as you type them. A date, initials, a few words, like A & J · June 15. Script is the default; note block letters if you prefer them. Left blank, the band ships clean. For anything more particular, send a message before you order.

WHY EON
I make each band to order, solid all the way through. It is meant to be worn every day, slept in, and handed down when the time comes. Gold this solid keeps its word.

---
[EON 15 · WHG-R-1802 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1802$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 10k rose gold wedding band, flat profile — not plated, not filled. Made to order in your size and width, with free engraving hidden inside.

THE DETAILS
Metal: solid 10k rose gold, never plated, never filled.
Profile: flat.
Interior: flat.
Hallmark: stamped 10k inside the band.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US 4 through 16, whole and half sizes.
Rose gold keeps a warm, pink cast against the skin.

SIZE & WIDTH
Two dropdowns build the ring. Pick a US size, 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 2mm to 12mm, in the Width menu.
Wider bands take up more of the finger: 2 to 4mm sits slim and stacks well; 5 to 7mm is a classic single-band width; 8 to 12mm is broad. If you fall between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.
It goes inside the band, up to 30 characters, copied exactly as you type it: a date, initials, a few words. Something like A & J · June 15. Script is the default; ask for block letters if you'd rather. Left blank, the band ships clean. Engraving is free.

WHY EON
I cut, size, and stamp each band to order — nothing waits in a tray. A ring for every day, worn now and handed down when the time comes. Solid gold, all the way through.

---
[EON 16 · RSG-R-1002 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1002$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A flat wedding band in solid 14k rose gold, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: solid 14k rose gold, never plated, never filled.
Profile: flat, with crisp, clean edges.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US 4 through 16, whole and half sizes.
Hallmark: stamped 14k inside the band.
The flat face sits level across the finger, its edges crisp rather than rounded, and the rose tone reads warm against the skin.

SIZE & WIDTH
Two dropdowns build your band. Ring Size covers US sizes 4 through 16, whole and half sizes. The Width dropdown covers 2 mm through 12 mm. If you land between sizes, send a message before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.

The engraving is free and goes inside the band, copied exactly as you type it, up to 30 characters — a date, initials, or a few words. Script is the default; note block letters if you prefer them. Something like A & J · June 15. Leave it blank and the band ships unengraved.

WHY EON
I make each band to order, one at a time, solid gold the whole way through. It is made to be worn every day, slept in, and passed down.

---
[EON 17 · RSG-R-1402 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1402$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k rose gold wedding band with a flat profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k rose gold, never plated, never filled.
Profile: A flat face with crisp, squared edges.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 through 16, whole and half sizes, made to order.
Hallmark: Stamped 18k inside the band.

The flat face catches a clean line of light along each crisp edge. At 18k the rose sits deep and warm against the skin.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm. If you're between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.

Engraving is free and goes inside the band, hidden once it's on. Up to 30 characters, copied exactly as you type them: a date, initials, a few words (A & J · June 15). Script is the default; note block letters if you'd rather have them. Left blank, the band ships clean. For anything unusual, like a coordinate or another date format, send a message before ordering.

---
[EON 18 · RSG-R-1802 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1802$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 10k yellow gold wedding band with a beveled profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: A flat top framed by beveled edges cut at an angle. The flat face stays calm; the bevels throw a bright line of light down each side.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm, chosen in the Width dropdown.

If you fall between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.

Engraving is free and sits inside the band, out of sight — a date, initials, a few words. Up to 30 characters, copied exactly as you type them. Script is the default; note block letters if you prefer them. Something like A & J · June 15. Left blank, it ships clean.

WHY EON
I make each band to order, one at a time, in solid gold.

---
[EON 19 · GLD-R-1003 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1003$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 14k yellow gold wedding band with a beveled profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: A flat center framed by angled, beveled edges.
Hallmark: Stamped 14k on the inside.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
The flat top holds a straight line across the finger, and the bevels break the light into two bright edges where a rounded band would only glow.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width runs 2mm through 12mm; you choose the width in the Width dropdown.
Narrow widths from 2mm to 4mm sit slim and stack easily against other rings. The 5mm to 7mm range is the classic middle most people picture for a wedding band. From 8mm up, the band covers more of the finger and reads as a statement. Wider bands wear snug, so if you fall between sizes, message us before ordering. The size and width photos show how each one reads on the hand.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.
The engraving is free and sits inside the band, seen only by the one who wears it: a date, initials, or a few words, up to 30 characters, copied exactly as you type it. Script is the default; note block letters if you prefer. Something like A & J June 15 reads well. Left blank, it ships clean. For a coordinate or a different date format, send a message first so we set it right.

WHY EON
I make each band to order and stamp it 14k before it leaves the bench, the classic wedding gold, warm against the skin and heavy enough to feel like it means something. It is built to be worn every day, slept in, and handed down when the time comes. Solid gold, all the way through.

---
[EON 20 · GLD-R-1403 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1403$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 18k yellow gold wedding band, beveled edges — not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: Beveled edges.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Pick your size in the Ring Size dropdown, US 4 through 16 in whole and half sizes. Pick your width in the Width dropdown, 2 through 12 mm.
If you land between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you write it: a date, initials, or a few words, like "A & J · June 15". Script is the default; ask for block letters if you prefer them. Left blank, it ships clean. Engraving is free. For anything more particular, message us before ordering.

WHY EON
I make each band to order in solid 18k, beveled at the edges and stamped 18k inside. Worn daily, slept in, handed down.

---
[EON 21 · GLD-R-1803 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1803$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k white gold wedding band, beveled at the edges, never plated and never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k white gold, never plated, never filled.
Profile: Beveled edge.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build your ring. Pick a US size, 4 to 16 in whole and half sizes, in Ring Size. Pick your width, 2 to 12 mm, in Width. If you land between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it.

Engraving is free and copied exactly as you type it, so check the spelling. Script is the default; ask for block letters if you prefer them. One example: A & J · June 15. Leave the box blank and the band ships clean. For anything unusual, like a date in another format or initials only, send a message before you order.

WHY EON
Every EON band is made to order and stamped 10k inside.

---
[EON 22 · WHG-R-1003 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1003$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A beveled wedding band, solid 14k white gold, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: A flat center framed by angled, beveled edges.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

The flat top holds the light steady; the beveled edges break it into a bright line down each side. No stones.

SIZE & WIDTH
The ring is built from two dropdowns. Pick a US size, 4 to 16 in whole and half sizes, under Ring Size. Pick your width, 2mm to 12mm, under Width.

If you're between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Add an engraving, or leave it blank. Type your text in the Personalization box, up to 30 characters, and it goes inside the band, copied exactly as you write it. Script is standard; ask for block letters if you prefer. One example: A & J · June 15. Left blank, it ships clean.

For a date in another format, initials only, or coordinates, send a message before ordering.

WHY EON
Each ring is made to order in the size and width you choose, then ships with free tracked shipping. Solid 14k white gold, all the way through.

---
[EON 23 · WHG-R-1403 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1403$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k white gold wedding band, beveled edges around a flat center. Not plated, not filled, made to order in your size, with free engraving inside.

THE DETAILS
Metal: Solid 18k white gold, never plated, never filled.
Profile: Beveled, a flat center with an angled edge cut on each side.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k on the inside.
The bevels take the light in two fine lines and leave the flat top quiet between them.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2 to 12 mm. You pick the width in the Width dropdown. The size chart photo shows the measurements; the on-finger comparison shows how each width reads.
A narrow band sits light and stacks easily: 2 to 4 mm is slim, 5 to 7 mm is the classic middle, 8 to 12 mm is a wide band you notice on the hand. If you fall between two sizes, message us and we will settle it.

MAKE IT YOURS
1. Choose your ring size, US 4 through 16 in whole and half sizes.
2. Choose your width, 2 to 12 mm.
3. Add your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it. The engraving is free, script by default, block letters if you note it, and copied exactly as you type: A & J · June 15, a date, initials, coordinates. Left blank, it ships clean.
Anything more involved, a date in another format or initials only, send us a message before ordering and we will get it right.

WHY EON
I make each band to order in the size and width you choose, then stamp it 18k before it ships.

---
[EON 24 · WHG-R-1803 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1803$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k rose gold wedding band with beveled edges, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k rose gold, never plated, never filled.
Profile: A flat center framed by angled beveled edges.
Sizes: US sizes 4 to 16, whole and half sizes.
Widths: 2mm to 12mm, 1.5mm thick.
Hallmark: Stamped 10k inside the band.
The flat face sits level on the finger while the two beveled edges catch the light on either side. Rose gold, warm against the skin, quiet on the hand.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 to 16, whole and half sizes. Width covers 2mm to 12mm, picked in the same dropdown.

If you land between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size, US sizes 4 to 16 in whole and half sizes.
2. Choose your width, 2mm to 12mm.
3. Add your engraving in the Personalization box, up to 30 characters, inside the band, copied exactly as you type it. Script is the default; note if you would rather have block letters. One example: A & J, June 15. Leave it blank and the band ships clean.

---
[EON 25 · RSG-R-1003 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1003$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 14k rose gold wedding band, a flat face between two beveled edges. Solid gold, never plated or filled, made to order with free engraving inside.

THE DETAILS
Metal: Solid 14k rose gold, never plated, never filled.
Profile: A flat face framed by two angled beveled edges.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.
The flat face stays quiet while the beveled edges catch the light, and the rose color warms where it meets skin.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size from 4 to 16, whole and half sizes, in Ring Size. Pick your width, 2mm to 12mm, in the Width dropdown.
Width changes the whole look. 2 to 4mm sits slim and stacks easily. 5 to 7mm is the classic wedding width. 8 to 12mm reads as a statement. Wider bands wear snugger than narrow ones, so if you land between sizes, message us before ordering.

MAKE IT YOURS
Ordering runs top to bottom.
1. Choose your ring size.
2. Choose your width in the Width dropdown.
3. Add an engraving, or leave it blank.
Engraving is free and sits hidden inside the band, read only by the one wearing it: a date, initials, a few words. Type it in the Personalization box, up to 30 characters, copied exactly as you write it. Script is the default; ask for block letters if you'd rather. A & J · June 15. Left blank, it ships clean.

WHY EON
I cut and finish these one at a time, solid gold with nothing underneath the color. Your band is sized and shaped for your finger, stamped 14k, and made to be worn every day, slept in, knocked around, handed down when the time comes. Solid gold, all the way through.

---
[EON 26 · RSG-R-1403 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1403$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 18k rose gold wedding band, never plated, never filled. Made to order in your size and width, with free engraving inside the band. A flat center framed by angled beveled edges.

THE DETAILS
Metal: solid 18k rose gold, never plated, never filled.
Profile: a flat top between two beveled, angled edges.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: stamped 18k inside the band.
The flat center reads clean head-on. The beveled edges catch light as the hand turns, where the rose gold runs deepest.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 to 16, whole and half sizes. Width covers 2mm to 12mm, picked in the Width dropdown.
If you land between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you write it: a date, initials, coordinates, a few words. Script is the default, so note block letters if you want them, and an example might read A & J · June 15. Left blank, it ships clean.

---
[EON 27 · RSG-R-1803 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1803$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k yellow gold wedding band, milgrain beaded along both edges, never plated and never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, stamped 10k inside the band.
Profile: Milgrain, a fine row of beading worked along both edges.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.

SIZE & WIDTH
The Ring Size dropdown runs US sizes 4 through 16, whole and half sizes. If you're between two sizes, message us. The Width dropdown runs 2 to 12 mm.

MAKE IT YOURS
1. Choose your ring size, US 4 through 16 in whole and half sizes, in the Ring Size dropdown.
2. Choose your width, 2 to 12 mm, in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you type them: a date, initials, a few words, like A & J June 15. Script is the default; note if you would rather have block letters. Left blank, it ships clean.

WHY EON
Solid 10k gold, stamped 10k inside the band. Made to order for a wedding, an anniversary, or a promise.

---
[EON 28 · GLD-R-1004 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1004$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 14k yellow gold wedding band with milgrain beaded edges, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: Milgrain, a row of fine beading worked along each edge.
Widths: 2 to 12 mm.
Thickness: 1.5 mm.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.
The beading catches light in small points as the hand moves, and the yellow gold warms against the skin.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers US sizes 4 to 16, whole and half sizes. Width covers 2 to 12 mm; you pick the width in the Width dropdown.
If you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Add your engraving, or leave it blank.

Type your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it. It's free. Script is the default; ask for block letters if you'd rather. We copy it exactly as typed, so check the spelling before you send it. Something like A & J · June 15. Left blank, the band ships clean. For anything more particular, a coordinate or a format you don't see here, message us before ordering.

WHY EON
I make each band to order and stamp it 14k inside before it goes out. It's meant to be worn every day, slept in, and handed down when the time comes. EON makes solid gold that outlasts the moment it marks.

---
[EON 29 · GLD-R-1404 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1404$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k yellow gold wedding band with milgrain edges, never plated, never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Solid 18k yellow gold reads deep and warm, a soft glow with weight that settles in the hand. Fine milgrain beading runs each edge, a row of tiny points that catch the light when the hand moves.
Metal: Solid 18k yellow gold, never plated, never filled.
Edges: Milgrain beading along both borders.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Pick your size, 4 to 16 in whole and half sizes, in Ring Size. Pick your width in the Width dropdown, from 2 to 12 mm.
Width is how much ring shows on the hand: 2 to 4 mm sits slim and stacks well, 5 to 7 mm is the classic wedding width, and 8 to 12 mm wears wide and full. If you land between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.
The engraving is free, hidden inside the band where only the wearer finds it. A date, initials, coordinates, or a few words, up to 30 characters. We set it in script; say the word if you want block letters. It reads exactly as you type it, so check the spelling. Something like A & J, June 15. Leave it blank and the band ships clean.

WHY EON
I make each band to order at the bench, one size and one width at a time, solid gold the whole way through. It's built to be worn every day, slept in, and handed down when the time comes.

---
[EON 30 · GLD-R-1804 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1804$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A 10k white gold wedding band with milgrain beaded edges. Solid gold, never plated, never filled, made to order with free engraving inside the band.

THE DETAILS
Metal: solid 10k white gold, never plated, never filled.
Profile: milgrain beaded edges, a fine row of tiny beads set along each side.
Color: a soft, natural white that holds without plating.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Engraving: free, inside the band, up to 30 characters.
Hallmark: stamped 10k inside the band.
The beading catches light in a fine, even line down each edge.

SIZE & WIDTH
Two dropdowns set the ring. Pick your US size, 4 to 16 in whole and half sizes, in the Ring Size menu. Pick your width, 2mm to 12mm, in the Width menu. If you are unsure of your size, a jeweler's measurement settles it; if you land between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Add your engraving in the Personalization box.
Type up to 30 characters, engraved inside the band and copied exactly as written: a date, initials, a few words. Script is standard; ask for block letters if you prefer them. Something like A & J · June 15 reads well. For a coordinate or another date format, message us before ordering. Left blank, the band ships clean.

WHY EON
I make solid gold, cut to your size and stamped 10k. A quiet, practical white for a ring you keep on, worn every day, slept in, and passed down. No trend to date it, no plating to wear thin.

---
[EON 31 · WHG-R-1004 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1004$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A 14k white gold Milgrain wedding band, solid gold — not plated, not filled. Made to order in your size and width, with free engraving hidden inside. The beading runs both edges in a fine row: small bright points strung along a cool white band.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: Milgrain edges, a row of fine beads worked down both sides.
Color: A cool, silver-white that sits bright against skin.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 14k on the inside.
The beaded edge gives the band a texture your thumb finds without looking, and the light breaks along it in small points instead of one flat shine.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm, chosen in the Width menu. If you land between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box — up to 30 characters, set inside the band where only you see it, copied exactly as you write it. Something like A & J · June 15, or a few initials. Script is standard; ask for block letters if you'd rather. Leave it blank and the band ships clean.

---
[EON 32 · WHG-R-1404 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1404$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k white gold wedding band, milgrain beaded at the edges. Never plated, never filled, made to order in your size, with free engraving inside the band. The milgrain runs as a fine row of beads down both edges.

THE DETAILS
Metal: Solid 18k white gold, never plated, never filled.
Edges: Fine milgrain beading worked down both sides.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm to 12mm, picked in the Width dropdown.
If you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size, US 4 through 16 in whole and half sizes, in the Ring Size dropdown.
2. Choose your width, 2mm to 12mm, in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you write it, like A & J · June 15. Script is the default; note block letters if you prefer them. Left blank, it ships clean.
Engraving is free.

WHY EON
I cut and finish each band to order at the bench, then stamp it 18k inside. Solid gold, all the way through.

---
[EON 33 · WHG-R-1804 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$WHG-R-1804$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 10k rose gold wedding band with milgrain beaded edges — not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold, never plated, never filled.
Profile: Milgrain, fine beads of gold worked along both edges.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.
The beading catches light in a fine line along each edge.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width runs 2mm to 12mm, chosen in the Width menu. If you fall between sizes, message us before ordering.

MAKE IT YOURS
Three steps, in the order the page asks.
1. Choose your ring size.
2. Choose your width.
3. Add an engraving, or leave it off. Type up to 30 characters in the Personalization box; they go inside the band, reproduced exactly as written: a date, initials, a short line. Script is standard; note in the box if you want block letters. Left blank, it ships clean, and the engraving is free.

WHY EON
I make these to order in the size and width you choose. A milgrain band like this is meant to be worn every day, slept in, and handed down the way old rings are. Solid gold, all the way through, and stamped 10k so it always reads true.

---
[EON 34 · RSG-R-1004 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1004$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A 14k rose gold milgrain wedding band, solid gold, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: solid 14k rose gold, never plated, never filled.
Profile: a band edged in beaded milgrain on both sides.
Widths: 2mm to 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: stamped 14k inside the band.
Rose gold reads warm and pink against the skin, and the milgrain catches light in a fine row of points along each edge.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2mm through 12mm, chosen in the same Width dropdown. The widths look different on the hand: 2 to 4mm sits slim and stacks easily, 5 to 7mm is the classic everyday band, and 8 to 12mm makes a wider, bolder band. If you fall between two sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size, US 4 through 16 in whole and half sizes.
2. Choose your width, 2mm to 12mm.
3. Add an engraving in the Personalization box: up to 30 characters set inside the band, copied exactly as you type it. Something like "A & J, June 15", or a few initials. Script is the default; ask for block letters if you'd rather. Left blank, it ships clean.

WHY EON
Solid 14k rose gold, all the way through. Stamped 14k inside the band and made to order in your size, for a wedding, an anniversary, or a promise.

---
[EON 35 · RSG-R-1404 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1404$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 18k rose gold milgrain wedding band, warm all the way through, not plated, not filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k rose gold, never plated, never filled.
Edges: Milgrain, a fine row of raised beads worked along each rim.
Color: A deep, even rose with a soft glow.
Widths: 2 to 12mm, 1.5mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.
The beads catch light in a fine dotted line down each edge, and the rose runs warm the whole way round.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2 through 12mm, chosen in the Width dropdown.
Narrow widths, 2 to 4mm, sit light and stack well. The 5 to 7mm range is a classic band width. From 8 to 12mm the band covers more of the finger. Wider bands wear a touch snugger, so if you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band where only the wearer sees it. A date, initials, a few words: "A & J · June 15" reads just fine. It is copied exactly as you type it, script by default, block letters if you note that. The engraving is free. Leave it blank and the band ships clean. For anything more particular, a coordinate or a second line, send a message before ordering.

WHY EON
I make each band to order at the bench, one ring at a time, in solid gold stamped 18k. This is gold meant to be worn every day, slept in, and handed down when the time comes. No trends to chase. Just the ring that lasts.

---
[EON 36 · RSG-R-1804 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$RSG-R-1804$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$Solid 10k yellow gold wedding band with a knife edge profile — not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: A knife edge. Two flat faces angle up to a soft ridge down the center, a fine line the light runs along.
Color: A quiet, even yellow, an honest gold made to be worn rather than saved for good.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2 mm through 12 mm, chosen in the Width dropdown.
A slim 2 to 4 mm stacks well; 5 to 7 mm is the classic width. Go wider, 8 to 12 mm, for a bolder band. If you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size (US 4 through 16 in whole and half sizes) in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Type your engraving in the Personalization box: up to 30 characters, set inside the band, copied exactly as you type it. Script is the default; add a note if you would rather have block letters. Something like A & J · June 15, or your own words. Left blank, it ships clean.

WHY EON
I make each band to order, one at a time, in the size and width you choose. It is meant to be worn every day, slept in, handed down. Solid gold the whole way through, not a layer over something else.

---
[EON 37 · GLD-R-1005 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1005$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 14k yellow gold wedding band with a knife edge that climbs to a soft ridge down the center. Never plated, never filled. Made to order, free engraving inside.

The center ridge catches a single line of light that travels as the hand moves, bright against the warm yellow. This is gold you can pick out across a room.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: Knife edge sides rising to a soft ridge at the center.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2 through 12 mm, picked in the Width dropdown.
A 2 to 4 mm band reads slim and stacks well. 5 to 7 mm is the classic wedding width. 8 to 12 mm covers more of the finger and carries more weight. If you land between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Type your engraving in the Personalization box.
Up to 30 characters, set inside the band where only the wearer sees it: a date, initials, or a short line, like A & J. Script is the default; ask for block letters instead. It's engraved exactly as typed, so check the spelling. Left blank, the band ships clean.

WHY EON
EON makes solid gold meant to outlast the moment it marks. I make each band to order, for the hand it's going on. The kind of ring you wear now and hand down later, worn daily and slept in.

---
[EON 38 · GLD-R-1405 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1405$eon$ and org_id=(select id from organizations where name='EON');
update products set description=$eon$A solid 18k yellow gold wedding band with a knife edge profile. Never plated, never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: A knife edge, the two faces angling up to a soft ridge down the center.
Color: A deep, warm yellow. There is a lot of gold in 18k, and it shows in the hand.
Feel: The ridge picks up a thin line of light as your hand moves; the faces stay quiet.
Widths: 2 to 12 mm, 1.5 mm thick.
Sizes: US sizes 4 to 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers US sizes 4 through 16, whole and half sizes. Width covers 2 through 12 mm, chosen in the Width dropdown. Sitting between two sizes? Message us before ordering.

A band at 2 to 4 mm reads slim and stacks easily. 5 to 7 mm sits as a classic single band, and 8 to 12 mm wears as a statement.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width.
3. Add an engraving, free. Type it in the Personalization box and it goes inside the band, copied exactly as you write it, up to 30 characters. Script is the default; say so if you want block letters. A date, initials, or a line like A & J, June 15. Left blank, the band ships clean.

WHY EON
I make each EON band to order at the bench, one ring at a time, in solid gold that is stamped and meant to be kept. It is the kind of ring you wear every day, sleep in, and hand down when the time comes. No trends to chase. Just the ring, made to last.

---
[EON 39 · GLD-R-1805 · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, updated_at=now() where sku=$eon$GLD-R-1805$eon$ and org_id=(select id from organizations where name='EON');
