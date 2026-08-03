-- 0110_eon_two_tone_diamond_cut.sql
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, 10K solid gold (TTG-R-1006).
--
-- YENI STIL. Mevcut 39 listing bes profilde toplaniyordu (01 Dome, 02 Flat,
-- 03 Beveled, 04 Milgrain, 05 Knife Edge); bu altincisi: basamakli sari altin
-- raylar + yuksek beyaz altin merkez, merkez florentine zemin uzerine elmas
-- kesim kafes deseniyle islenmis. Panelde LISTING ONERISI olarak durur
-- (status='draft', etsy_listing_id null) — Etsy'ye gonderim ayri adim.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>. Yeni renk kodu TTG
-- (Two-Tone Gold), profil 06. 14K/18K kardesleri TTG-R-1406 / TTG-R-1806
-- olarak ayni desende acilir (gorseller gelince).
--
-- Varyant ekseni: 5 genislik (6-10mm) x 25 beden (US 4-16 tam+yarim) = 125.
--   Neden 2-12mm DEGIL: elmas kesim kafes + cift ray dar bantta fiziksel
--   olarak okunmaz; pazar arastirmasi en cok satan erkek bandinin 6-8mm
--   oldugunu gosteriyor (2026 Etsy erkek aliansi taramasi).
--
-- Gram tablosu: 0101'in 10K satirlarindan BIREBIR (1.5mm kalinlik).
--   VARSAYIM: basamakli iki-tonlu profil, ayni genislik/kalinlikta dome ile
--   kutlece karsilastirilabilir (kenar basamaklari metal alir, duz merkez
--   ekler). Ilk uretimde tartip dogrulanmali.
--
-- Fiyat: ev formulu — ceil(gram * 10730 / 500) * 500 + 1000
--   ($5 yukari yuvarla + $10 kargo payi fiyata gomulu; bkz. second-brain
--   "ucretsiz kargo = bedel fiyata gomulur"). Aralik $455.00 - $1175.00.
--   NOT: 10K ev ppg'si (10730 c/g) duz profillerle AYNI birakildi —
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
  $ttg$TTG-R-1006$ttg$,
  $ttg$10K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him$ttg$,
  $ttg$A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 10mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge. The white center is brushed flat, then cut through, so every facet catches a hard point of light while the ground behind it stays soft. Three finishes on one band, and the gold runs solid under all of them.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 6mm through 10mm, in Width. A 6 to 7mm reads trim for a patterned band; 8mm is the width most men wear; 9 to 10mm sits wide and carries the lattice at full scale.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 5 (6-10mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$mens wedding band$ttg$,$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$10k solid gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$wide wedding band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$,$ttg$gift for husband$ttg$,$ttg$unisex wedding band$ttg$,$ttg$white gold inlay$ttg$,$ttg$mens promise ring$ttg$,$ttg$gold band for men$ttg$]::text[],
  ARRAY[$ttg$Solid 10k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  45500,
  20,
  true,
  $ttg$/eon/ttg-r-1006/01.jpg$ttg$,
  5,
  $ttg$10k two tone diamond cut wedding band$ttg$,
  40
from public.organizations o
where o.name = 'EON'
  and not exists (
    select 1 from public.products p
    where p.org_id = o.id and p.sku = $ttg$TTG-R-1006$ttg$
  );

-- Yeniden calistirmada metin/etiket alanlarini kanonik surumle esitle
-- (Etsy'ye gonderilmis kayitta etsy_listing_id dolu olur; yine de panel
-- kunyesi tek kaynakta kalsin diye guncellenir).
update public.products p set
  title = $ttg$10K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him$ttg$,
  description = $ttg$A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 10mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge. The white center is brushed flat, then cut through, so every facet catches a hard point of light while the ground behind it stays soft. Three finishes on one band, and the gold runs solid under all of them.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 6mm through 10mm, in Width. A 6 to 7mm reads trim for a patterned band; 8mm is the width most men wear; 9 to 10mm sits wide and carries the lattice at full scale.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 5 (6-10mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$mens wedding band$ttg$,$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$10k solid gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$wide wedding band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$,$ttg$gift for husband$ttg$,$ttg$unisex wedding band$ttg$,$ttg$white gold inlay$ttg$,$ttg$mens promise ring$ttg$,$ttg$gold band for men$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 10k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$10k two tone diamond cut wedding band$ttg$,
  research_group = 40,
  image_url = $ttg$/eon/ttg-r-1006/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1006$ttg$;

-- ==== Varyantlar: 5 genislik x 25 beden = 125 ====

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
  ($ttg$TTG-R-1006-6MM-4$ttg$, 6, $ttg$4$ttg$, 4.11, 45500),
  ($ttg$TTG-R-1006-6MM-4.5$ttg$, 6, $ttg$4.5$ttg$, 4.205, 46500),
  ($ttg$TTG-R-1006-6MM-5$ttg$, 6, $ttg$5$ttg$, 4.3, 47500),
  ($ttg$TTG-R-1006-6MM-5.5$ttg$, 6, $ttg$5.5$ttg$, 4.4, 48500),
  ($ttg$TTG-R-1006-6MM-6$ttg$, 6, $ttg$6$ttg$, 4.5, 49500),
  ($ttg$TTG-R-1006-6MM-6.5$ttg$, 6, $ttg$6.5$ttg$, 4.6, 50500),
  ($ttg$TTG-R-1006-6MM-7$ttg$, 6, $ttg$7$ttg$, 4.7, 51500),
  ($ttg$TTG-R-1006-6MM-7.5$ttg$, 6, $ttg$7.5$ttg$, 4.8, 53000),
  ($ttg$TTG-R-1006-6MM-8$ttg$, 6, $ttg$8$ttg$, 4.9, 54000),
  ($ttg$TTG-R-1006-6MM-8.5$ttg$, 6, $ttg$8.5$ttg$, 5.0, 55000),
  ($ttg$TTG-R-1006-6MM-9$ttg$, 6, $ttg$9$ttg$, 5.1, 56000),
  ($ttg$TTG-R-1006-6MM-9.5$ttg$, 6, $ttg$9.5$ttg$, 5.2, 57000),
  ($ttg$TTG-R-1006-6MM-10$ttg$, 6, $ttg$10$ttg$, 5.3, 58000),
  ($ttg$TTG-R-1006-6MM-10.5$ttg$, 6, $ttg$10.5$ttg$, 5.4, 59000),
  ($ttg$TTG-R-1006-6MM-11$ttg$, 6, $ttg$11$ttg$, 5.5, 60500),
  ($ttg$TTG-R-1006-6MM-11.5$ttg$, 6, $ttg$11.5$ttg$, 5.6, 61500),
  ($ttg$TTG-R-1006-6MM-12$ttg$, 6, $ttg$12$ttg$, 5.7, 62500),
  ($ttg$TTG-R-1006-6MM-12.5$ttg$, 6, $ttg$12.5$ttg$, 5.8, 63500),
  ($ttg$TTG-R-1006-6MM-13$ttg$, 6, $ttg$13$ttg$, 5.9, 64500),
  ($ttg$TTG-R-1006-6MM-13.5$ttg$, 6, $ttg$13.5$ttg$, 6.0, 65500),
  ($ttg$TTG-R-1006-6MM-14$ttg$, 6, $ttg$14$ttg$, 6.1, 66500),
  ($ttg$TTG-R-1006-6MM-14.5$ttg$, 6, $ttg$14.5$ttg$, 6.195, 67500),
  ($ttg$TTG-R-1006-6MM-15$ttg$, 6, $ttg$15$ttg$, 6.29, 68500),
  ($ttg$TTG-R-1006-6MM-15.5$ttg$, 6, $ttg$15.5$ttg$, 6.39, 70000),
  ($ttg$TTG-R-1006-6MM-16$ttg$, 6, $ttg$16$ttg$, 6.49, 71000),
  ($ttg$TTG-R-1006-7MM-4$ttg$, 7, $ttg$4$ttg$, 4.79, 52500),
  ($ttg$TTG-R-1006-7MM-4.5$ttg$, 7, $ttg$4.5$ttg$, 4.905, 54000),
  ($ttg$TTG-R-1006-7MM-5$ttg$, 7, $ttg$5$ttg$, 5.02, 55000),
  ($ttg$TTG-R-1006-7MM-5.5$ttg$, 7, $ttg$5.5$ttg$, 5.135, 56500),
  ($ttg$TTG-R-1006-7MM-6$ttg$, 7, $ttg$6$ttg$, 5.25, 57500),
  ($ttg$TTG-R-1006-7MM-6.5$ttg$, 7, $ttg$6.5$ttg$, 5.37, 59000),
  ($ttg$TTG-R-1006-7MM-7$ttg$, 7, $ttg$7$ttg$, 5.49, 60000),
  ($ttg$TTG-R-1006-7MM-7.5$ttg$, 7, $ttg$7.5$ttg$, 5.605, 61500),
  ($ttg$TTG-R-1006-7MM-8$ttg$, 7, $ttg$8$ttg$, 5.72, 62500),
  ($ttg$TTG-R-1006-7MM-8.5$ttg$, 7, $ttg$8.5$ttg$, 5.835, 64000),
  ($ttg$TTG-R-1006-7MM-9$ttg$, 7, $ttg$9$ttg$, 5.95, 65000),
  ($ttg$TTG-R-1006-7MM-9.5$ttg$, 7, $ttg$9.5$ttg$, 6.065, 66500),
  ($ttg$TTG-R-1006-7MM-10$ttg$, 7, $ttg$10$ttg$, 6.18, 67500),
  ($ttg$TTG-R-1006-7MM-10.5$ttg$, 7, $ttg$10.5$ttg$, 6.3, 69000),
  ($ttg$TTG-R-1006-7MM-11$ttg$, 7, $ttg$11$ttg$, 6.42, 70000),
  ($ttg$TTG-R-1006-7MM-11.5$ttg$, 7, $ttg$11.5$ttg$, 6.535, 71500),
  ($ttg$TTG-R-1006-7MM-12$ttg$, 7, $ttg$12$ttg$, 6.65, 72500),
  ($ttg$TTG-R-1006-7MM-12.5$ttg$, 7, $ttg$12.5$ttg$, 6.765, 74000),
  ($ttg$TTG-R-1006-7MM-13$ttg$, 7, $ttg$13$ttg$, 6.88, 75000),
  ($ttg$TTG-R-1006-7MM-13.5$ttg$, 7, $ttg$13.5$ttg$, 6.995, 76500),
  ($ttg$TTG-R-1006-7MM-14$ttg$, 7, $ttg$14$ttg$, 7.11, 77500),
  ($ttg$TTG-R-1006-7MM-14.5$ttg$, 7, $ttg$14.5$ttg$, 7.225, 79000),
  ($ttg$TTG-R-1006-7MM-15$ttg$, 7, $ttg$15$ttg$, 7.34, 80000),
  ($ttg$TTG-R-1006-7MM-15.5$ttg$, 7, $ttg$15.5$ttg$, 7.46, 81500),
  ($ttg$TTG-R-1006-7MM-16$ttg$, 7, $ttg$16$ttg$, 7.58, 82500),
  ($ttg$TTG-R-1006-8MM-4$ttg$, 8, $ttg$4$ttg$, 5.47, 60000),
  ($ttg$TTG-R-1006-8MM-4.5$ttg$, 8, $ttg$4.5$ttg$, 5.605, 61500),
  ($ttg$TTG-R-1006-8MM-5$ttg$, 8, $ttg$5$ttg$, 5.74, 63000),
  ($ttg$TTG-R-1006-8MM-5.5$ttg$, 8, $ttg$5.5$ttg$, 5.87, 64000),
  ($ttg$TTG-R-1006-8MM-6$ttg$, 8, $ttg$6$ttg$, 6.0, 65500),
  ($ttg$TTG-R-1006-8MM-6.5$ttg$, 8, $ttg$6.5$ttg$, 6.135, 67000),
  ($ttg$TTG-R-1006-8MM-7$ttg$, 8, $ttg$7$ttg$, 6.27, 68500),
  ($ttg$TTG-R-1006-8MM-7.5$ttg$, 8, $ttg$7.5$ttg$, 6.405, 70000),
  ($ttg$TTG-R-1006-8MM-8$ttg$, 8, $ttg$8$ttg$, 6.54, 71500),
  ($ttg$TTG-R-1006-8MM-8.5$ttg$, 8, $ttg$8.5$ttg$, 6.67, 73000),
  ($ttg$TTG-R-1006-8MM-9$ttg$, 8, $ttg$9$ttg$, 6.8, 74000),
  ($ttg$TTG-R-1006-8MM-9.5$ttg$, 8, $ttg$9.5$ttg$, 6.935, 75500),
  ($ttg$TTG-R-1006-8MM-10$ttg$, 8, $ttg$10$ttg$, 7.07, 77000),
  ($ttg$TTG-R-1006-8MM-10.5$ttg$, 8, $ttg$10.5$ttg$, 7.2, 78500),
  ($ttg$TTG-R-1006-8MM-11$ttg$, 8, $ttg$11$ttg$, 7.33, 80000),
  ($ttg$TTG-R-1006-8MM-11.5$ttg$, 8, $ttg$11.5$ttg$, 7.465, 81500),
  ($ttg$TTG-R-1006-8MM-12$ttg$, 8, $ttg$12$ttg$, 7.6, 83000),
  ($ttg$TTG-R-1006-8MM-12.5$ttg$, 8, $ttg$12.5$ttg$, 7.73, 84000),
  ($ttg$TTG-R-1006-8MM-13$ttg$, 8, $ttg$13$ttg$, 7.86, 85500),
  ($ttg$TTG-R-1006-8MM-13.5$ttg$, 8, $ttg$13.5$ttg$, 7.995, 87000),
  ($ttg$TTG-R-1006-8MM-14$ttg$, 8, $ttg$14$ttg$, 8.13, 88500),
  ($ttg$TTG-R-1006-8MM-14.5$ttg$, 8, $ttg$14.5$ttg$, 8.26, 90000),
  ($ttg$TTG-R-1006-8MM-15$ttg$, 8, $ttg$15$ttg$, 8.39, 91500),
  ($ttg$TTG-R-1006-8MM-15.5$ttg$, 8, $ttg$15.5$ttg$, 8.525, 92500),
  ($ttg$TTG-R-1006-8MM-16$ttg$, 8, $ttg$16$ttg$, 8.66, 94000),
  ($ttg$TTG-R-1006-9MM-4$ttg$, 9, $ttg$4$ttg$, 6.16, 67500),
  ($ttg$TTG-R-1006-9MM-4.5$ttg$, 9, $ttg$4.5$ttg$, 6.31, 69000),
  ($ttg$TTG-R-1006-9MM-5$ttg$, 9, $ttg$5$ttg$, 6.46, 70500),
  ($ttg$TTG-R-1006-9MM-5.5$ttg$, 9, $ttg$5.5$ttg$, 6.61, 72000),
  ($ttg$TTG-R-1006-9MM-6$ttg$, 9, $ttg$6$ttg$, 6.76, 74000),
  ($ttg$TTG-R-1006-9MM-6.5$ttg$, 9, $ttg$6.5$ttg$, 6.905, 75500),
  ($ttg$TTG-R-1006-9MM-7$ttg$, 9, $ttg$7$ttg$, 7.05, 77000),
  ($ttg$TTG-R-1006-9MM-7.5$ttg$, 9, $ttg$7.5$ttg$, 7.2, 78500),
  ($ttg$TTG-R-1006-9MM-8$ttg$, 9, $ttg$8$ttg$, 7.35, 80000),
  ($ttg$TTG-R-1006-9MM-8.5$ttg$, 9, $ttg$8.5$ttg$, 7.5, 81500),
  ($ttg$TTG-R-1006-9MM-9$ttg$, 9, $ttg$9$ttg$, 7.65, 83500),
  ($ttg$TTG-R-1006-9MM-9.5$ttg$, 9, $ttg$9.5$ttg$, 7.8, 85000),
  ($ttg$TTG-R-1006-9MM-10$ttg$, 9, $ttg$10$ttg$, 7.95, 86500),
  ($ttg$TTG-R-1006-9MM-10.5$ttg$, 9, $ttg$10.5$ttg$, 8.1, 88000),
  ($ttg$TTG-R-1006-9MM-11$ttg$, 9, $ttg$11$ttg$, 8.25, 90000),
  ($ttg$TTG-R-1006-9MM-11.5$ttg$, 9, $ttg$11.5$ttg$, 8.4, 91500),
  ($ttg$TTG-R-1006-9MM-12$ttg$, 9, $ttg$12$ttg$, 8.55, 93000),
  ($ttg$TTG-R-1006-9MM-12.5$ttg$, 9, $ttg$12.5$ttg$, 8.7, 94500),
  ($ttg$TTG-R-1006-9MM-13$ttg$, 9, $ttg$13$ttg$, 8.85, 96000),
  ($ttg$TTG-R-1006-9MM-13.5$ttg$, 9, $ttg$13.5$ttg$, 8.995, 98000),
  ($ttg$TTG-R-1006-9MM-14$ttg$, 9, $ttg$14$ttg$, 9.14, 99500),
  ($ttg$TTG-R-1006-9MM-14.5$ttg$, 9, $ttg$14.5$ttg$, 9.29, 101000),
  ($ttg$TTG-R-1006-9MM-15$ttg$, 9, $ttg$15$ttg$, 9.44, 102500),
  ($ttg$TTG-R-1006-9MM-15.5$ttg$, 9, $ttg$15.5$ttg$, 9.59, 104000),
  ($ttg$TTG-R-1006-9MM-16$ttg$, 9, $ttg$16$ttg$, 9.74, 106000),
  ($ttg$TTG-R-1006-10MM-4$ttg$, 10, $ttg$4$ttg$, 6.84, 74500),
  ($ttg$TTG-R-1006-10MM-4.5$ttg$, 10, $ttg$4.5$ttg$, 7.005, 76500),
  ($ttg$TTG-R-1006-10MM-5$ttg$, 10, $ttg$5$ttg$, 7.17, 78000),
  ($ttg$TTG-R-1006-10MM-5.5$ttg$, 10, $ttg$5.5$ttg$, 7.34, 80000),
  ($ttg$TTG-R-1006-10MM-6$ttg$, 10, $ttg$6$ttg$, 7.51, 82000),
  ($ttg$TTG-R-1006-10MM-6.5$ttg$, 10, $ttg$6.5$ttg$, 7.675, 83500),
  ($ttg$TTG-R-1006-10MM-7$ttg$, 10, $ttg$7$ttg$, 7.84, 85500),
  ($ttg$TTG-R-1006-10MM-7.5$ttg$, 10, $ttg$7.5$ttg$, 8.005, 87000),
  ($ttg$TTG-R-1006-10MM-8$ttg$, 10, $ttg$8$ttg$, 8.17, 89000),
  ($ttg$TTG-R-1006-10MM-8.5$ttg$, 10, $ttg$8.5$ttg$, 8.335, 90500),
  ($ttg$TTG-R-1006-10MM-9$ttg$, 10, $ttg$9$ttg$, 8.5, 92500),
  ($ttg$TTG-R-1006-10MM-9.5$ttg$, 10, $ttg$9.5$ttg$, 8.665, 94000),
  ($ttg$TTG-R-1006-10MM-10$ttg$, 10, $ttg$10$ttg$, 8.83, 96000),
  ($ttg$TTG-R-1006-10MM-10.5$ttg$, 10, $ttg$10.5$ttg$, 8.995, 98000),
  ($ttg$TTG-R-1006-10MM-11$ttg$, 10, $ttg$11$ttg$, 9.16, 99500),
  ($ttg$TTG-R-1006-10MM-11.5$ttg$, 10, $ttg$11.5$ttg$, 9.33, 101500),
  ($ttg$TTG-R-1006-10MM-12$ttg$, 10, $ttg$12$ttg$, 9.5, 103000),
  ($ttg$TTG-R-1006-10MM-12.5$ttg$, 10, $ttg$12.5$ttg$, 9.665, 105000),
  ($ttg$TTG-R-1006-10MM-13$ttg$, 10, $ttg$13$ttg$, 9.83, 106500),
  ($ttg$TTG-R-1006-10MM-13.5$ttg$, 10, $ttg$13.5$ttg$, 9.995, 108500),
  ($ttg$TTG-R-1006-10MM-14$ttg$, 10, $ttg$14$ttg$, 10.16, 110500),
  ($ttg$TTG-R-1006-10MM-14.5$ttg$, 10, $ttg$14.5$ttg$, 10.325, 112000),
  ($ttg$TTG-R-1006-10MM-15$ttg$, 10, $ttg$15$ttg$, 10.49, 114000),
  ($ttg$TTG-R-1006-10MM-15.5$ttg$, 10, $ttg$15.5$ttg$, 10.655, 115500),
  ($ttg$TTG-R-1006-10MM-16$ttg$, 10, $ttg$16$ttg$, 10.82, 117500);

insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  t.sku,
  p.id,
  jsonb_build_object(
    'Karat', $ttg$10K$ttg$,
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
join public.products p on p.sku = $ttg$TTG-R-1006$ttg$
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
  where v.weight_source = 'catalog_ttg' and pp.sku = $ttg$TTG-R-1006$ttg$
  group by v.product_id
) m
where m.product_id = p.id;

-- ==== Galeri: 5 gorsel (repo public/ altinda, kok-goreli URL) ====
-- Kaynak baytlar public/eon/ttg-r-1006/*.jpg — meta veri sokulmus
-- (bkz. second-brain "disa cikan gorselden koken meta verisi sok").
-- Etsy sirasi: 01 hero, 02 elde (olcek), 03 tezgah, 04 makro, 05 kutu.

delete from public.listing_images li
using public.products p
where li.product_id = p.id
  and p.sku = $ttg$TTG-R-1006$ttg$
  and li.url like $ttg$/eon/ttg-r-1006/%$ttg$;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, v.url, 'url', v.alt, v.position
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
cross join (values
  ($ttg$/eon/ttg-r-1006/01.jpg$ttg$, $ttg$10k solid gold two tone wedding band, yellow gold rails around a diamond-cut white gold center$ttg$, 0),
  ($ttg$/eon/ttg-r-1006/02.jpg$ttg$, $ttg$Two tone 10k gold diamond cut wedding band worn on a hand$ttg$, 1),
  ($ttg$/eon/ttg-r-1006/03.jpg$ttg$, $ttg$10k two tone gold wedding band on a jeweller's bench with hand tools$ttg$, 2),
  ($ttg$/eon/ttg-r-1006/04.jpg$ttg$, $ttg$Macro detail of the diamond-cut lattice on the white gold center$ttg$, 3),
  ($ttg$/eon/ttg-r-1006/05.jpg$ttg$, $ttg$10k two tone gold wedding band presented in a gift box$ttg$, 4)
) as v(url, alt, position)
where p.sku = $ttg$TTG-R-1006$ttg$;
