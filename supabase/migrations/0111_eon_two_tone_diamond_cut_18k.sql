-- 0111_eon_two_tone_diamond_cut_18k.sql
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, 18K solid gold (TTG-R-1806).
--
-- YENI STIL. Mevcut 39 listing bes profilde toplaniyordu (01 Dome, 02 Flat,
-- 03 Beveled, 04 Milgrain, 05 Knife Edge); bu altincisi: basamakli sari altin
-- raylar + yuksek beyaz altin merkez, merkez florentine zemin uzerine elmas
-- kesim kafes deseniyle islenmis. Panelde LISTING ONERISI olarak durur
-- (status='draft', etsy_listing_id null) — Etsy'ye gonderim ayri adim.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>. Yeni renk kodu TTG
-- (Two-Tone Gold), profil 06. 10K kardesi TTG-R-1006 (0110); 14K
-- TTG-R-1406 gorseller gelince 0112 ile acilir. Varyant ekseni UCUNDE DE AYNI.
--
-- Varyant ekseni: 11 genislik (2-12mm) x 25 beden (US 4-16 tam+yarim) = 275.
--   EV STANDARDI: 39 canli listing'in hepsi bu ekseni tasiyor
--   (docs/eon/katalog-v3.md, eon-v3-catalog.json). Desen genislikle
--   olceklenir: dar bantta ince/sik kafes, genis bantta acilir.
--
-- Gram tablosu: 0101'in 18K satirlarindan BIREBIR (1.5mm kalinlik).
--   VARSAYIM: basamakli iki-tonlu profil, ayni genislik/kalinlikta dome ile
--   kutlece karsilastirilabilir (kenar basamaklari metal alir, duz merkez
--   ekler). Ilk uretimde tartip dogrulanmali.
--
-- Fiyat: ev formulu — ceil(gram * 19320 / 500) * 500 + 1000
--   ($5 yukari yuvarla + $10 kargo payi fiyata gomulu; bkz. second-brain
--   "ucretsiz kargo = bedel fiyata gomulur"). Aralik $405.00 - $3265.00.
--   NOT: 18K ev ppg'si (19320 c/g) duz profillerle AYNI birakildi —
--   elmas kesim + iki-tonlu birlestirme ekstra iscilik tasir; premium ppg
--   istenirse yalnizca bu dosyadaki PPG sabiti degisir.
--
-- Uretici: scripts/gen_catalog_ttg.py (saf, ic assert'li)
-- Bu dosya: scripts/emit_ttg_migration.py ciktisi — ELLE DUZENLEMEYIN.

-- Idempotent: aile zaten varsa urun yeniden yazilmaz, varyant/gorsel eslenir.

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images,
  research_keyword, research_group
)
select
  o.id,
  $ttg$TTG-R-1806$ttg$,
  $ttg$18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 2mm to 12mm, Anniversary Gift for Him$ttg$,
  $ttg$A solid 18k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

The two colors do the work here, and 18k pushes the contrast further. The yellow runs deep and warm against the pale white center, the color you picture when someone says gold. The center is brushed flat, then cut through, so every facet throws a hard point of light while the ground behind it stays quiet. Three finishes on one band, and the gold runs solid under all of them.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 2mm through 12mm, in Width. A 2 to 4mm reads slim and stacks well; 5 to 7mm is the everyday width; 8 to 12mm sits wide across the finger. The lattice scales with the band: the narrow widths carry a fine, close-set pattern, and the wider ones open it up.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON 41 - TTG-R-1806 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$18k solid gold ring$ttg$,$ttg$18k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$thin gold band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  ARRAY[$ttg$Solid 18k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  40500,
  20,
  true,
  $ttg$/eon/ttg-r-1806/01.jpg$ttg$,
  5,
  $ttg$18k two tone diamond cut wedding band$ttg$,
  41
from public.organizations o
where o.name = 'EON'
  and not exists (
    select 1 from public.products p
    where p.org_id = o.id and p.sku = $ttg$TTG-R-1806$ttg$
  );

-- Yeniden calistirmada metin/etiket alanlarini kanonik surumle esitle
-- (Etsy'ye gonderilmis kayitta etsy_listing_id dolu olur; yine de panel
-- kunyesi tek kaynakta kalsin diye guncellenir).
update public.products p set
  title = $ttg$18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 2mm to 12mm, Anniversary Gift for Him$ttg$,
  description = $ttg$A solid 18k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

The two colors do the work here, and 18k pushes the contrast further. The yellow runs deep and warm against the pale white center, the color you picture when someone says gold. The center is brushed flat, then cut through, so every facet throws a hard point of light while the ground behind it stays quiet. Three finishes on one band, and the gold runs solid under all of them.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 2mm through 12mm, in Width. A 2 to 4mm reads slim and stacks well; 5 to 7mm is the everyday width; 8 to 12mm sits wide across the finger. The lattice scales with the band: the narrow widths carry a fine, close-set pattern, and the wider ones open it up.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON 41 - TTG-R-1806 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$18k solid gold ring$ttg$,$ttg$18k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$thin gold band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 18k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$18k two tone diamond cut wedding band$ttg$,
  research_group = 41,
  image_url = $ttg$/eon/ttg-r-1806/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1806$ttg$;

-- ==== Varyantlar: 11 genislik x 25 beden = 275 ====

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
  ($ttg$TTG-R-1806-2MM-4$ttg$, 2, $ttg$4$ttg$, 2.04, 40500),
  ($ttg$TTG-R-1806-2MM-4.5$ttg$, 2, $ttg$4.5$ttg$, 2.095, 41500),
  ($ttg$TTG-R-1806-2MM-5$ttg$, 2, $ttg$5$ttg$, 2.15, 43000),
  ($ttg$TTG-R-1806-2MM-5.5$ttg$, 2, $ttg$5.5$ttg$, 2.205, 44000),
  ($ttg$TTG-R-1806-2MM-6$ttg$, 2, $ttg$6$ttg$, 2.26, 45000),
  ($ttg$TTG-R-1806-2MM-6.5$ttg$, 2, $ttg$6.5$ttg$, 2.31, 46000),
  ($ttg$TTG-R-1806-2MM-7$ttg$, 2, $ttg$7$ttg$, 2.36, 47000),
  ($ttg$TTG-R-1806-2MM-7.5$ttg$, 2, $ttg$7.5$ttg$, 2.415, 48000),
  ($ttg$TTG-R-1806-2MM-8$ttg$, 2, $ttg$8$ttg$, 2.47, 49000),
  ($ttg$TTG-R-1806-2MM-8.5$ttg$, 2, $ttg$8.5$ttg$, 2.52, 50000),
  ($ttg$TTG-R-1806-2MM-9$ttg$, 2, $ttg$9$ttg$, 2.57, 51000),
  ($ttg$TTG-R-1806-2MM-9.5$ttg$, 2, $ttg$9.5$ttg$, 2.625, 52000),
  ($ttg$TTG-R-1806-2MM-10$ttg$, 2, $ttg$10$ttg$, 2.68, 53000),
  ($ttg$TTG-R-1806-2MM-10.5$ttg$, 2, $ttg$10.5$ttg$, 2.73, 54000),
  ($ttg$TTG-R-1806-2MM-11$ttg$, 2, $ttg$11$ttg$, 2.78, 55000),
  ($ttg$TTG-R-1806-2MM-11.5$ttg$, 2, $ttg$11.5$ttg$, 2.835, 56000),
  ($ttg$TTG-R-1806-2MM-12$ttg$, 2, $ttg$12$ttg$, 2.89, 57000),
  ($ttg$TTG-R-1806-2MM-12.5$ttg$, 2, $ttg$12.5$ttg$, 2.945, 58000),
  ($ttg$TTG-R-1806-2MM-13$ttg$, 2, $ttg$13$ttg$, 3.0, 59000),
  ($ttg$TTG-R-1806-2MM-13.5$ttg$, 2, $ttg$13.5$ttg$, 3.065, 60500),
  ($ttg$TTG-R-1806-2MM-14$ttg$, 2, $ttg$14$ttg$, 3.13, 61500),
  ($ttg$TTG-R-1806-2MM-14.5$ttg$, 2, $ttg$14.5$ttg$, 3.195, 63000),
  ($ttg$TTG-R-1806-2MM-15$ttg$, 2, $ttg$15$ttg$, 3.26, 64000),
  ($ttg$TTG-R-1806-2MM-15.5$ttg$, 2, $ttg$15.5$ttg$, 3.31, 65000),
  ($ttg$TTG-R-1806-2MM-16$ttg$, 2, $ttg$16$ttg$, 3.36, 66000),
  ($ttg$TTG-R-1806-3MM-4$ttg$, 3, $ttg$4$ttg$, 2.64, 52500),
  ($ttg$TTG-R-1806-3MM-4.5$ttg$, 3, $ttg$4.5$ttg$, 2.7, 53500),
  ($ttg$TTG-R-1806-3MM-5$ttg$, 3, $ttg$5$ttg$, 2.76, 54500),
  ($ttg$TTG-R-1806-3MM-5.5$ttg$, 3, $ttg$5.5$ttg$, 2.82, 55500),
  ($ttg$TTG-R-1806-3MM-6$ttg$, 3, $ttg$6$ttg$, 2.88, 57000),
  ($ttg$TTG-R-1806-3MM-6.5$ttg$, 3, $ttg$6.5$ttg$, 2.94, 58000),
  ($ttg$TTG-R-1806-3MM-7$ttg$, 3, $ttg$7$ttg$, 3.0, 59000),
  ($ttg$TTG-R-1806-3MM-7.5$ttg$, 3, $ttg$7.5$ttg$, 3.06, 60500),
  ($ttg$TTG-R-1806-3MM-8$ttg$, 3, $ttg$8$ttg$, 3.12, 61500),
  ($ttg$TTG-R-1806-3MM-8.5$ttg$, 3, $ttg$8.5$ttg$, 3.18, 62500),
  ($ttg$TTG-R-1806-3MM-9$ttg$, 3, $ttg$9$ttg$, 3.24, 64000),
  ($ttg$TTG-R-1806-3MM-9.5$ttg$, 3, $ttg$9.5$ttg$, 3.3, 65000),
  ($ttg$TTG-R-1806-3MM-10$ttg$, 3, $ttg$10$ttg$, 3.36, 66000),
  ($ttg$TTG-R-1806-3MM-10.5$ttg$, 3, $ttg$10.5$ttg$, 3.42, 67500),
  ($ttg$TTG-R-1806-3MM-11$ttg$, 3, $ttg$11$ttg$, 3.48, 68500),
  ($ttg$TTG-R-1806-3MM-11.5$ttg$, 3, $ttg$11.5$ttg$, 3.54, 69500),
  ($ttg$TTG-R-1806-3MM-12$ttg$, 3, $ttg$12$ttg$, 3.6, 71000),
  ($ttg$TTG-R-1806-3MM-12.5$ttg$, 3, $ttg$12.5$ttg$, 3.66, 72000),
  ($ttg$TTG-R-1806-3MM-13$ttg$, 3, $ttg$13$ttg$, 3.72, 73000),
  ($ttg$TTG-R-1806-3MM-13.5$ttg$, 3, $ttg$13.5$ttg$, 3.785, 74500),
  ($ttg$TTG-R-1806-3MM-14$ttg$, 3, $ttg$14$ttg$, 3.85, 75500),
  ($ttg$TTG-R-1806-3MM-14.5$ttg$, 3, $ttg$14.5$ttg$, 3.93, 77000),
  ($ttg$TTG-R-1806-3MM-15$ttg$, 3, $ttg$15$ttg$, 4.01, 78500),
  ($ttg$TTG-R-1806-3MM-15.5$ttg$, 3, $ttg$15.5$ttg$, 4.045, 79500),
  ($ttg$TTG-R-1806-3MM-16$ttg$, 3, $ttg$16$ttg$, 4.08, 80000),
  ($ttg$TTG-R-1806-4MM-4$ttg$, 4, $ttg$4$ttg$, 3.6, 71000),
  ($ttg$TTG-R-1806-4MM-4.5$ttg$, 4, $ttg$4.5$ttg$, 3.67, 72000),
  ($ttg$TTG-R-1806-4MM-5$ttg$, 4, $ttg$5$ttg$, 3.74, 73500),
  ($ttg$TTG-R-1806-4MM-5.5$ttg$, 4, $ttg$5.5$ttg$, 3.815, 75000),
  ($ttg$TTG-R-1806-4MM-6$ttg$, 4, $ttg$6$ttg$, 3.89, 76500),
  ($ttg$TTG-R-1806-4MM-6.5$ttg$, 4, $ttg$6.5$ttg$, 3.965, 78000),
  ($ttg$TTG-R-1806-4MM-7$ttg$, 4, $ttg$7$ttg$, 4.04, 79500),
  ($ttg$TTG-R-1806-4MM-7.5$ttg$, 4, $ttg$7.5$ttg$, 4.115, 81000),
  ($ttg$TTG-R-1806-4MM-8$ttg$, 4, $ttg$8$ttg$, 4.19, 82000),
  ($ttg$TTG-R-1806-4MM-8.5$ttg$, 4, $ttg$8.5$ttg$, 4.26, 83500),
  ($ttg$TTG-R-1806-4MM-9$ttg$, 4, $ttg$9$ttg$, 4.33, 85000),
  ($ttg$TTG-R-1806-4MM-9.5$ttg$, 4, $ttg$9.5$ttg$, 4.405, 86500),
  ($ttg$TTG-R-1806-4MM-10$ttg$, 4, $ttg$10$ttg$, 4.48, 88000),
  ($ttg$TTG-R-1806-4MM-10.5$ttg$, 4, $ttg$10.5$ttg$, 4.555, 89500),
  ($ttg$TTG-R-1806-4MM-11$ttg$, 4, $ttg$11$ttg$, 4.63, 90500),
  ($ttg$TTG-R-1806-4MM-11.5$ttg$, 4, $ttg$11.5$ttg$, 4.705, 92000),
  ($ttg$TTG-R-1806-4MM-12$ttg$, 4, $ttg$12$ttg$, 4.78, 93500),
  ($ttg$TTG-R-1806-4MM-12.5$ttg$, 4, $ttg$12.5$ttg$, 4.85, 95000),
  ($ttg$TTG-R-1806-4MM-13$ttg$, 4, $ttg$13$ttg$, 4.92, 96500),
  ($ttg$TTG-R-1806-4MM-13.5$ttg$, 4, $ttg$13.5$ttg$, 4.98, 97500),
  ($ttg$TTG-R-1806-4MM-14$ttg$, 4, $ttg$14$ttg$, 5.04, 98500),
  ($ttg$TTG-R-1806-4MM-14.5$ttg$, 4, $ttg$14.5$ttg$, 5.105, 100000),
  ($ttg$TTG-R-1806-4MM-15$ttg$, 4, $ttg$15$ttg$, 5.17, 101000),
  ($ttg$TTG-R-1806-4MM-15.5$ttg$, 4, $ttg$15.5$ttg$, 5.285, 103500),
  ($ttg$TTG-R-1806-4MM-16$ttg$, 4, $ttg$16$ttg$, 5.4, 105500),
  ($ttg$TTG-R-1806-5MM-4$ttg$, 5, $ttg$4$ttg$, 4.56, 89500),
  ($ttg$TTG-R-1806-5MM-4.5$ttg$, 5, $ttg$4.5$ttg$, 4.655, 91000),
  ($ttg$TTG-R-1806-5MM-5$ttg$, 5, $ttg$5$ttg$, 4.75, 93000),
  ($ttg$TTG-R-1806-5MM-5.5$ttg$, 5, $ttg$5.5$ttg$, 4.84, 95000),
  ($ttg$TTG-R-1806-5MM-6$ttg$, 5, $ttg$6$ttg$, 4.93, 96500),
  ($ttg$TTG-R-1806-5MM-6.5$ttg$, 5, $ttg$6.5$ttg$, 5.025, 98500),
  ($ttg$TTG-R-1806-5MM-7$ttg$, 5, $ttg$7$ttg$, 5.12, 100000),
  ($ttg$TTG-R-1806-5MM-7.5$ttg$, 5, $ttg$7.5$ttg$, 5.21, 102000),
  ($ttg$TTG-R-1806-5MM-8$ttg$, 5, $ttg$8$ttg$, 5.3, 103500),
  ($ttg$TTG-R-1806-5MM-8.5$ttg$, 5, $ttg$8.5$ttg$, 5.4, 105500),
  ($ttg$TTG-R-1806-5MM-9$ttg$, 5, $ttg$9$ttg$, 5.5, 107500),
  ($ttg$TTG-R-1806-5MM-9.5$ttg$, 5, $ttg$9.5$ttg$, 5.59, 109000),
  ($ttg$TTG-R-1806-5MM-10$ttg$, 5, $ttg$10$ttg$, 5.68, 111000),
  ($ttg$TTG-R-1806-5MM-10.5$ttg$, 5, $ttg$10.5$ttg$, 5.775, 113000),
  ($ttg$TTG-R-1806-5MM-11$ttg$, 5, $ttg$11$ttg$, 5.87, 114500),
  ($ttg$TTG-R-1806-5MM-11.5$ttg$, 5, $ttg$11.5$ttg$, 5.96, 116500),
  ($ttg$TTG-R-1806-5MM-12$ttg$, 5, $ttg$12$ttg$, 6.05, 118000),
  ($ttg$TTG-R-1806-5MM-12.5$ttg$, 5, $ttg$12.5$ttg$, 6.145, 120000),
  ($ttg$TTG-R-1806-5MM-13$ttg$, 5, $ttg$13$ttg$, 6.24, 122000),
  ($ttg$TTG-R-1806-5MM-13.5$ttg$, 5, $ttg$13.5$ttg$, 6.305, 123000),
  ($ttg$TTG-R-1806-5MM-14$ttg$, 5, $ttg$14$ttg$, 6.37, 124500),
  ($ttg$TTG-R-1806-5MM-14.5$ttg$, 5, $ttg$14.5$ttg$, 6.435, 125500),
  ($ttg$TTG-R-1806-5MM-15$ttg$, 5, $ttg$15$ttg$, 6.5, 127000),
  ($ttg$TTG-R-1806-5MM-15.5$ttg$, 5, $ttg$15.5$ttg$, 6.755, 132000),
  ($ttg$TTG-R-1806-5MM-16$ttg$, 5, $ttg$16$ttg$, 7.01, 136500),
  ($ttg$TTG-R-1806-6MM-4$ttg$, 6, $ttg$4$ttg$, 5.4, 105500),
  ($ttg$TTG-R-1806-6MM-4.5$ttg$, 6, $ttg$4.5$ttg$, 5.515, 108000),
  ($ttg$TTG-R-1806-6MM-5$ttg$, 6, $ttg$5$ttg$, 5.63, 110000),
  ($ttg$TTG-R-1806-6MM-5.5$ttg$, 6, $ttg$5.5$ttg$, 5.745, 112000),
  ($ttg$TTG-R-1806-6MM-6$ttg$, 6, $ttg$6$ttg$, 5.86, 114500),
  ($ttg$TTG-R-1806-6MM-6.5$ttg$, 6, $ttg$6.5$ttg$, 5.97, 116500),
  ($ttg$TTG-R-1806-6MM-7$ttg$, 6, $ttg$7$ttg$, 6.08, 118500),
  ($ttg$TTG-R-1806-6MM-7.5$ttg$, 6, $ttg$7.5$ttg$, 6.195, 121000),
  ($ttg$TTG-R-1806-6MM-8$ttg$, 6, $ttg$8$ttg$, 6.31, 123000),
  ($ttg$TTG-R-1806-6MM-8.5$ttg$, 6, $ttg$8.5$ttg$, 6.42, 125500),
  ($ttg$TTG-R-1806-6MM-9$ttg$, 6, $ttg$9$ttg$, 6.53, 127500),
  ($ttg$TTG-R-1806-6MM-9.5$ttg$, 6, $ttg$9.5$ttg$, 6.645, 129500),
  ($ttg$TTG-R-1806-6MM-10$ttg$, 6, $ttg$10$ttg$, 6.76, 132000),
  ($ttg$TTG-R-1806-6MM-10.5$ttg$, 6, $ttg$10.5$ttg$, 6.87, 134000),
  ($ttg$TTG-R-1806-6MM-11$ttg$, 6, $ttg$11$ttg$, 6.98, 136000),
  ($ttg$TTG-R-1806-6MM-11.5$ttg$, 6, $ttg$11.5$ttg$, 7.095, 138500),
  ($ttg$TTG-R-1806-6MM-12$ttg$, 6, $ttg$12$ttg$, 7.21, 140500),
  ($ttg$TTG-R-1806-6MM-12.5$ttg$, 6, $ttg$12.5$ttg$, 7.325, 143000),
  ($ttg$TTG-R-1806-6MM-13$ttg$, 6, $ttg$13$ttg$, 7.44, 145000),
  ($ttg$TTG-R-1806-6MM-13.5$ttg$, 6, $ttg$13.5$ttg$, 7.505, 146000),
  ($ttg$TTG-R-1806-6MM-14$ttg$, 6, $ttg$14$ttg$, 7.57, 147500),
  ($ttg$TTG-R-1806-6MM-14.5$ttg$, 6, $ttg$14.5$ttg$, 7.75, 151000),
  ($ttg$TTG-R-1806-6MM-15$ttg$, 6, $ttg$15$ttg$, 7.93, 154500),
  ($ttg$TTG-R-1806-6MM-15.5$ttg$, 6, $ttg$15.5$ttg$, 8.045, 156500),
  ($ttg$TTG-R-1806-6MM-16$ttg$, 6, $ttg$16$ttg$, 8.16, 159000),
  ($ttg$TTG-R-1806-7MM-4$ttg$, 7, $ttg$4$ttg$, 5.88, 115000),
  ($ttg$TTG-R-1806-7MM-4.5$ttg$, 7, $ttg$4.5$ttg$, 6.01, 117500),
  ($ttg$TTG-R-1806-7MM-5$ttg$, 7, $ttg$5$ttg$, 6.14, 120000),
  ($ttg$TTG-R-1806-7MM-5.5$ttg$, 7, $ttg$5.5$ttg$, 6.275, 122500),
  ($ttg$TTG-R-1806-7MM-6$ttg$, 7, $ttg$6$ttg$, 6.41, 125000),
  ($ttg$TTG-R-1806-7MM-6.5$ttg$, 7, $ttg$6.5$ttg$, 6.545, 127500),
  ($ttg$TTG-R-1806-7MM-7$ttg$, 7, $ttg$7$ttg$, 6.68, 130500),
  ($ttg$TTG-R-1806-7MM-7.5$ttg$, 7, $ttg$7.5$ttg$, 6.815, 133000),
  ($ttg$TTG-R-1806-7MM-8$ttg$, 7, $ttg$8$ttg$, 6.95, 135500),
  ($ttg$TTG-R-1806-7MM-8.5$ttg$, 7, $ttg$8.5$ttg$, 7.08, 138000),
  ($ttg$TTG-R-1806-7MM-9$ttg$, 7, $ttg$9$ttg$, 7.21, 140500),
  ($ttg$TTG-R-1806-7MM-9.5$ttg$, 7, $ttg$9.5$ttg$, 7.345, 143000),
  ($ttg$TTG-R-1806-7MM-10$ttg$, 7, $ttg$10$ttg$, 7.48, 146000),
  ($ttg$TTG-R-1806-7MM-10.5$ttg$, 7, $ttg$10.5$ttg$, 7.615, 148500),
  ($ttg$TTG-R-1806-7MM-11$ttg$, 7, $ttg$11$ttg$, 7.75, 151000),
  ($ttg$TTG-R-1806-7MM-11.5$ttg$, 7, $ttg$11.5$ttg$, 7.885, 153500),
  ($ttg$TTG-R-1806-7MM-12$ttg$, 7, $ttg$12$ttg$, 8.02, 156000),
  ($ttg$TTG-R-1806-7MM-12.5$ttg$, 7, $ttg$12.5$ttg$, 8.15, 158500),
  ($ttg$TTG-R-1806-7MM-13$ttg$, 7, $ttg$13$ttg$, 8.28, 161000),
  ($ttg$TTG-R-1806-7MM-13.5$ttg$, 7, $ttg$13.5$ttg$, 8.34, 162500),
  ($ttg$TTG-R-1806-7MM-14$ttg$, 7, $ttg$14$ttg$, 8.4, 163500),
  ($ttg$TTG-R-1806-7MM-14.5$ttg$, 7, $ttg$14.5$ttg$, 8.52, 166000),
  ($ttg$TTG-R-1806-7MM-15$ttg$, 7, $ttg$15$ttg$, 8.64, 168000),
  ($ttg$TTG-R-1806-7MM-15.5$ttg$, 7, $ttg$15.5$ttg$, 8.88, 173000),
  ($ttg$TTG-R-1806-7MM-16$ttg$, 7, $ttg$16$ttg$, 9.12, 177500),
  ($ttg$TTG-R-1806-8MM-4$ttg$, 8, $ttg$4$ttg$, 6.48, 126500),
  ($ttg$TTG-R-1806-8MM-4.5$ttg$, 8, $ttg$4.5$ttg$, 6.625, 129000),
  ($ttg$TTG-R-1806-8MM-5$ttg$, 8, $ttg$5$ttg$, 6.77, 132000),
  ($ttg$TTG-R-1806-8MM-5.5$ttg$, 8, $ttg$5.5$ttg$, 6.92, 135000),
  ($ttg$TTG-R-1806-8MM-6$ttg$, 8, $ttg$6$ttg$, 7.07, 138000),
  ($ttg$TTG-R-1806-8MM-6.5$ttg$, 8, $ttg$6.5$ttg$, 7.215, 140500),
  ($ttg$TTG-R-1806-8MM-7$ttg$, 8, $ttg$7$ttg$, 7.36, 143500),
  ($ttg$TTG-R-1806-8MM-7.5$ttg$, 8, $ttg$7.5$ttg$, 7.51, 146500),
  ($ttg$TTG-R-1806-8MM-8$ttg$, 8, $ttg$8$ttg$, 7.66, 149000),
  ($ttg$TTG-R-1806-8MM-8.5$ttg$, 8, $ttg$8.5$ttg$, 7.8, 152000),
  ($ttg$TTG-R-1806-8MM-9$ttg$, 8, $ttg$9$ttg$, 7.94, 154500),
  ($ttg$TTG-R-1806-8MM-9.5$ttg$, 8, $ttg$9.5$ttg$, 8.09, 157500),
  ($ttg$TTG-R-1806-8MM-10$ttg$, 8, $ttg$10$ttg$, 8.24, 160500),
  ($ttg$TTG-R-1806-8MM-10.5$ttg$, 8, $ttg$10.5$ttg$, 8.385, 163000),
  ($ttg$TTG-R-1806-8MM-11$ttg$, 8, $ttg$11$ttg$, 8.53, 166000),
  ($ttg$TTG-R-1806-8MM-11.5$ttg$, 8, $ttg$11.5$ttg$, 8.68, 169000),
  ($ttg$TTG-R-1806-8MM-12$ttg$, 8, $ttg$12$ttg$, 8.83, 172000),
  ($ttg$TTG-R-1806-8MM-12.5$ttg$, 8, $ttg$12.5$ttg$, 8.975, 174500),
  ($ttg$TTG-R-1806-8MM-13$ttg$, 8, $ttg$13$ttg$, 9.12, 177500),
  ($ttg$TTG-R-1806-8MM-13.5$ttg$, 8, $ttg$13.5$ttg$, 9.24, 180000),
  ($ttg$TTG-R-1806-8MM-14$ttg$, 8, $ttg$14$ttg$, 9.36, 182000),
  ($ttg$TTG-R-1806-8MM-14.5$ttg$, 8, $ttg$14.5$ttg$, 9.48, 184500),
  ($ttg$TTG-R-1806-8MM-15$ttg$, 8, $ttg$15$ttg$, 9.6, 186500),
  ($ttg$TTG-R-1806-8MM-15.5$ttg$, 8, $ttg$15.5$ttg$, 9.78, 190000),
  ($ttg$TTG-R-1806-8MM-16$ttg$, 8, $ttg$16$ttg$, 9.96, 193500),
  ($ttg$TTG-R-1806-9MM-4$ttg$, 9, $ttg$4$ttg$, 7.98, 155500),
  ($ttg$TTG-R-1806-9MM-4.5$ttg$, 9, $ttg$4.5$ttg$, 8.17, 159000),
  ($ttg$TTG-R-1806-9MM-5$ttg$, 9, $ttg$5$ttg$, 8.36, 163000),
  ($ttg$TTG-R-1806-9MM-5.5$ttg$, 9, $ttg$5.5$ttg$, 8.555, 166500),
  ($ttg$TTG-R-1806-9MM-6$ttg$, 9, $ttg$6$ttg$, 8.75, 170500),
  ($ttg$TTG-R-1806-9MM-6.5$ttg$, 9, $ttg$6.5$ttg$, 8.945, 174000),
  ($ttg$TTG-R-1806-9MM-7$ttg$, 9, $ttg$7$ttg$, 9.14, 178000),
  ($ttg$TTG-R-1806-9MM-7.5$ttg$, 9, $ttg$7.5$ttg$, 9.33, 181500),
  ($ttg$TTG-R-1806-9MM-8$ttg$, 9, $ttg$8$ttg$, 9.52, 185000),
  ($ttg$TTG-R-1806-9MM-8.5$ttg$, 9, $ttg$8.5$ttg$, 9.715, 189000),
  ($ttg$TTG-R-1806-9MM-9$ttg$, 9, $ttg$9$ttg$, 9.91, 192500),
  ($ttg$TTG-R-1806-9MM-9.5$ttg$, 9, $ttg$9.5$ttg$, 10.105, 196500),
  ($ttg$TTG-R-1806-9MM-10$ttg$, 9, $ttg$10$ttg$, 10.3, 200000),
  ($ttg$TTG-R-1806-9MM-10.5$ttg$, 9, $ttg$10.5$ttg$, 10.495, 204000),
  ($ttg$TTG-R-1806-9MM-11$ttg$, 9, $ttg$11$ttg$, 10.69, 208000),
  ($ttg$TTG-R-1806-9MM-11.5$ttg$, 9, $ttg$11.5$ttg$, 10.88, 211500),
  ($ttg$TTG-R-1806-9MM-12$ttg$, 9, $ttg$12$ttg$, 11.07, 215000),
  ($ttg$TTG-R-1806-9MM-12.5$ttg$, 9, $ttg$12.5$ttg$, 11.265, 219000),
  ($ttg$TTG-R-1806-9MM-13$ttg$, 9, $ttg$13$ttg$, 11.46, 222500),
  ($ttg$TTG-R-1806-9MM-13.5$ttg$, 9, $ttg$13.5$ttg$, 11.655, 226500),
  ($ttg$TTG-R-1806-9MM-14$ttg$, 9, $ttg$14$ttg$, 11.85, 230000),
  ($ttg$TTG-R-1806-9MM-14.5$ttg$, 9, $ttg$14.5$ttg$, 12.04, 234000),
  ($ttg$TTG-R-1806-9MM-15$ttg$, 9, $ttg$15$ttg$, 12.23, 237500),
  ($ttg$TTG-R-1806-9MM-15.5$ttg$, 9, $ttg$15.5$ttg$, 12.425, 241500),
  ($ttg$TTG-R-1806-9MM-16$ttg$, 9, $ttg$16$ttg$, 12.62, 245000),
  ($ttg$TTG-R-1806-10MM-4$ttg$, 10, $ttg$4$ttg$, 8.86, 172500),
  ($ttg$TTG-R-1806-10MM-4.5$ttg$, 10, $ttg$4.5$ttg$, 9.075, 176500),
  ($ttg$TTG-R-1806-10MM-5$ttg$, 10, $ttg$5$ttg$, 9.29, 180500),
  ($ttg$TTG-R-1806-10MM-5.5$ttg$, 10, $ttg$5.5$ttg$, 9.505, 185000),
  ($ttg$TTG-R-1806-10MM-6$ttg$, 10, $ttg$6$ttg$, 9.72, 189000),
  ($ttg$TTG-R-1806-10MM-6.5$ttg$, 10, $ttg$6.5$ttg$, 9.935, 193000),
  ($ttg$TTG-R-1806-10MM-7$ttg$, 10, $ttg$7$ttg$, 10.15, 197500),
  ($ttg$TTG-R-1806-10MM-7.5$ttg$, 10, $ttg$7.5$ttg$, 10.365, 201500),
  ($ttg$TTG-R-1806-10MM-8$ttg$, 10, $ttg$8$ttg$, 10.58, 205500),
  ($ttg$TTG-R-1806-10MM-8.5$ttg$, 10, $ttg$8.5$ttg$, 10.795, 210000),
  ($ttg$TTG-R-1806-10MM-9$ttg$, 10, $ttg$9$ttg$, 11.01, 214000),
  ($ttg$TTG-R-1806-10MM-9.5$ttg$, 10, $ttg$9.5$ttg$, 11.225, 218000),
  ($ttg$TTG-R-1806-10MM-10$ttg$, 10, $ttg$10$ttg$, 11.44, 222500),
  ($ttg$TTG-R-1806-10MM-10.5$ttg$, 10, $ttg$10.5$ttg$, 11.51, 223500),
  ($ttg$TTG-R-1806-10MM-11$ttg$, 10, $ttg$11$ttg$, 11.58, 225000),
  ($ttg$TTG-R-1806-10MM-11.5$ttg$, 10, $ttg$11.5$ttg$, 11.94, 232000),
  ($ttg$TTG-R-1806-10MM-12$ttg$, 10, $ttg$12$ttg$, 12.3, 239000),
  ($ttg$TTG-R-1806-10MM-12.5$ttg$, 10, $ttg$12.5$ttg$, 12.515, 243000),
  ($ttg$TTG-R-1806-10MM-13$ttg$, 10, $ttg$13$ttg$, 12.73, 247000),
  ($ttg$TTG-R-1806-10MM-13.5$ttg$, 10, $ttg$13.5$ttg$, 12.945, 251500),
  ($ttg$TTG-R-1806-10MM-14$ttg$, 10, $ttg$14$ttg$, 13.16, 255500),
  ($ttg$TTG-R-1806-10MM-14.5$ttg$, 10, $ttg$14.5$ttg$, 13.375, 259500),
  ($ttg$TTG-R-1806-10MM-15$ttg$, 10, $ttg$15$ttg$, 13.59, 264000),
  ($ttg$TTG-R-1806-10MM-15.5$ttg$, 10, $ttg$15.5$ttg$, 13.805, 268000),
  ($ttg$TTG-R-1806-10MM-16$ttg$, 10, $ttg$16$ttg$, 14.02, 272000),
  ($ttg$TTG-R-1806-11MM-4$ttg$, 11, $ttg$4$ttg$, 9.75, 189500),
  ($ttg$TTG-R-1806-11MM-4.5$ttg$, 11, $ttg$4.5$ttg$, 9.985, 194000),
  ($ttg$TTG-R-1806-11MM-5$ttg$, 11, $ttg$5$ttg$, 10.22, 198500),
  ($ttg$TTG-R-1806-11MM-5.5$ttg$, 11, $ttg$5.5$ttg$, 10.46, 203500),
  ($ttg$TTG-R-1806-11MM-6$ttg$, 11, $ttg$6$ttg$, 10.7, 208000),
  ($ttg$TTG-R-1806-11MM-6.5$ttg$, 11, $ttg$6.5$ttg$, 10.935, 212500),
  ($ttg$TTG-R-1806-11MM-7$ttg$, 11, $ttg$7$ttg$, 11.17, 217000),
  ($ttg$TTG-R-1806-11MM-7.5$ttg$, 11, $ttg$7.5$ttg$, 11.405, 221500),
  ($ttg$TTG-R-1806-11MM-8$ttg$, 11, $ttg$8$ttg$, 11.64, 226000),
  ($ttg$TTG-R-1806-11MM-8.5$ttg$, 11, $ttg$8.5$ttg$, 11.875, 230500),
  ($ttg$TTG-R-1806-11MM-9$ttg$, 11, $ttg$9$ttg$, 12.11, 235000),
  ($ttg$TTG-R-1806-11MM-9.5$ttg$, 11, $ttg$9.5$ttg$, 12.35, 240000),
  ($ttg$TTG-R-1806-11MM-10$ttg$, 11, $ttg$10$ttg$, 12.59, 244500),
  ($ttg$TTG-R-1806-11MM-10.5$ttg$, 11, $ttg$10.5$ttg$, 12.825, 249000),
  ($ttg$TTG-R-1806-11MM-11$ttg$, 11, $ttg$11$ttg$, 13.06, 253500),
  ($ttg$TTG-R-1806-11MM-11.5$ttg$, 11, $ttg$11.5$ttg$, 13.295, 258000),
  ($ttg$TTG-R-1806-11MM-12$ttg$, 11, $ttg$12$ttg$, 13.53, 262500),
  ($ttg$TTG-R-1806-11MM-12.5$ttg$, 11, $ttg$12.5$ttg$, 13.77, 267500),
  ($ttg$TTG-R-1806-11MM-13$ttg$, 11, $ttg$13$ttg$, 14.01, 272000),
  ($ttg$TTG-R-1806-11MM-13.5$ttg$, 11, $ttg$13.5$ttg$, 14.245, 276500),
  ($ttg$TTG-R-1806-11MM-14$ttg$, 11, $ttg$14$ttg$, 14.48, 281000),
  ($ttg$TTG-R-1806-11MM-14.5$ttg$, 11, $ttg$14.5$ttg$, 14.715, 285500),
  ($ttg$TTG-R-1806-11MM-15$ttg$, 11, $ttg$15$ttg$, 14.95, 290000),
  ($ttg$TTG-R-1806-11MM-15.5$ttg$, 11, $ttg$15.5$ttg$, 15.185, 294500),
  ($ttg$TTG-R-1806-11MM-16$ttg$, 11, $ttg$16$ttg$, 15.42, 299000),
  ($ttg$TTG-R-1806-12MM-4$ttg$, 12, $ttg$4$ttg$, 10.64, 207000),
  ($ttg$TTG-R-1806-12MM-4.5$ttg$, 12, $ttg$4.5$ttg$, 10.895, 211500),
  ($ttg$TTG-R-1806-12MM-5$ttg$, 12, $ttg$5$ttg$, 11.15, 216500),
  ($ttg$TTG-R-1806-12MM-5.5$ttg$, 12, $ttg$5.5$ttg$, 11.41, 221500),
  ($ttg$TTG-R-1806-12MM-6$ttg$, 12, $ttg$6$ttg$, 11.67, 226500),
  ($ttg$TTG-R-1806-12MM-6.5$ttg$, 12, $ttg$6.5$ttg$, 11.925, 231500),
  ($ttg$TTG-R-1806-12MM-7$ttg$, 12, $ttg$7$ttg$, 12.18, 236500),
  ($ttg$TTG-R-1806-12MM-7.5$ttg$, 12, $ttg$7.5$ttg$, 12.44, 241500),
  ($ttg$TTG-R-1806-12MM-8$ttg$, 12, $ttg$8$ttg$, 12.7, 246500),
  ($ttg$TTG-R-1806-12MM-8.5$ttg$, 12, $ttg$8.5$ttg$, 12.96, 251500),
  ($ttg$TTG-R-1806-12MM-9$ttg$, 12, $ttg$9$ttg$, 13.22, 256500),
  ($ttg$TTG-R-1806-12MM-9.5$ttg$, 12, $ttg$9.5$ttg$, 13.475, 261500),
  ($ttg$TTG-R-1806-12MM-10$ttg$, 12, $ttg$10$ttg$, 13.73, 266500),
  ($ttg$TTG-R-1806-12MM-10.5$ttg$, 12, $ttg$10.5$ttg$, 13.985, 271500),
  ($ttg$TTG-R-1806-12MM-11$ttg$, 12, $ttg$11$ttg$, 14.24, 276500),
  ($ttg$TTG-R-1806-12MM-11.5$ttg$, 12, $ttg$11.5$ttg$, 14.5, 281500),
  ($ttg$TTG-R-1806-12MM-12$ttg$, 12, $ttg$12$ttg$, 14.76, 286500),
  ($ttg$TTG-R-1806-12MM-12.5$ttg$, 12, $ttg$12.5$ttg$, 15.02, 291500),
  ($ttg$TTG-R-1806-12MM-13$ttg$, 12, $ttg$13$ttg$, 15.28, 296500),
  ($ttg$TTG-R-1806-12MM-13.5$ttg$, 12, $ttg$13.5$ttg$, 15.535, 301500),
  ($ttg$TTG-R-1806-12MM-14$ttg$, 12, $ttg$14$ttg$, 15.79, 306500),
  ($ttg$TTG-R-1806-12MM-14.5$ttg$, 12, $ttg$14.5$ttg$, 16.05, 311500),
  ($ttg$TTG-R-1806-12MM-15$ttg$, 12, $ttg$15$ttg$, 16.31, 316500),
  ($ttg$TTG-R-1806-12MM-15.5$ttg$, 12, $ttg$15.5$ttg$, 16.57, 321500),
  ($ttg$TTG-R-1806-12MM-16$ttg$, 12, $ttg$16$ttg$, 16.83, 326500);

insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  t.sku,
  p.id,
  jsonb_build_object(
    'Karat', $ttg$18K$ttg$,
    'Metal', $ttg$Two Tone Yellow and White Gold$ttg$,
    'Width', t.width || 'mm',
    'Ring Size', t.ring_size
  ),
  t.price_cents,
  20,
  t.grams,
  'catalog_ttg',
  true,
  'USD'
from _ttg t
join public.products p on p.sku = $ttg$TTG-R-1806$ttg$
join public.organizations o on o.id = p.org_id and o.name = 'EON'
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  currency = excluded.currency,
  updated_at = now();

drop table _ttg;

-- Capa fiyati = bu ailenin en ucuz varyanti (0101 deseni).
-- NOT: ailenin KENDI varyantlariyla sinirli — 'catalog_ttg' kaynagini uc ayar
-- da paylasiyor, product_id ile daraltilmazsa ayarlar birbirinin capasini ezer.
update public.products p
set price_cents = m.minp, updated_at = now()
from (
  select v.product_id, min(v.price_cents) as minp
  from public.product_variants v
  join public.products pp on pp.id = v.product_id
  where v.weight_source = 'catalog_ttg' and pp.sku = $ttg$TTG-R-1806$ttg$
  group by v.product_id
) m
where m.product_id = p.id;

-- ==== Galeri: 5 gorsel (repo public/ altinda, kok-goreli URL) ====
-- Kaynak baytlar public/eon/ttg-r-1806/*.jpg — meta veri sokulmus
-- (bkz. second-brain "disa cikan gorselden koken meta verisi sok").
-- Etsy sirasi: 01 hero, 02 elde (olcek), 03 uc-ceyrek, 04 makro, 05 kutu.

delete from public.listing_images li
using public.products p
where li.product_id = p.id
  and p.sku = $ttg$TTG-R-1806$ttg$
  and li.url like $ttg$/eon/ttg-r-1806/%$ttg$;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, v.url, 'url', v.alt, v.position
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
cross join (values
  ($ttg$/eon/ttg-r-1806/01.jpg$ttg$, $ttg$18k solid gold two tone wedding band, yellow gold rails around a diamond-cut white gold center$ttg$, 0),
  ($ttg$/eon/ttg-r-1806/02.jpg$ttg$, $ttg$Two tone 18k gold diamond cut wedding band worn on a hand$ttg$, 1),
  ($ttg$/eon/ttg-r-1806/03.jpg$ttg$, $ttg$18k two tone gold wedding band standing on dark wood, three quarter view$ttg$, 2),
  ($ttg$/eon/ttg-r-1806/04.jpg$ttg$, $ttg$Macro detail of the diamond-cut lattice on the white gold center$ttg$, 3),
  ($ttg$/eon/ttg-r-1806/05.jpg$ttg$, $ttg$18k two tone gold wedding band presented in a suede gift box$ttg$, 4)
) as v(url, alt, position)
where p.sku = $ttg$TTG-R-1806$ttg$;
