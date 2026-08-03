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
-- Varyant ekseni: 11 genislik (2-12mm) x 25 beden (US 4-16 tam+yarim) = 275.
--   EV STANDARDI: 39 canli listing'in hepsi bu ekseni tasiyor
--   (docs/eon/katalog-v3.md, eon-v3-catalog.json). Desen genislikle
--   olceklenir: dar bantta ince/sik kafes, genis bantta acilir.
--
-- Gram tablosu: 0101'in 10K satirlarindan BIREBIR (1.5mm kalinlik).
--   VARSAYIM: basamakli iki-tonlu profil, ayni genislik/kalinlikta dome ile
--   kutlece karsilastirilabilir (kenar basamaklari metal alir, duz merkez
--   ekler). Ilk uretimde tartip dogrulanmali.
--
-- Fiyat: ev formulu — ceil(gram * 10730 / 500) * 500 + 1000
--   ($5 yukari yuvarla + $10 kargo payi fiyata gomulu; bkz. second-brain
--   "ucretsiz kargo = bedel fiyata gomulur"). Aralik $160.00 - $1405.00.
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
  $ttg$10K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 2mm to 12mm, Anniversary Gift for Him$ttg$,
  $ttg$A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge. The white center is brushed flat, then cut through, so every facet catches a hard point of light while the ground behind it stays soft. Three finishes on one band, and the gold runs solid under all of them.

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
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$10k solid gold ring$ttg$,$ttg$10k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$thin gold band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  ARRAY[$ttg$Solid 10k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  16000,
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
  title = $ttg$10K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 2mm to 12mm, Anniversary Gift for Him$ttg$,
  description = $ttg$A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 2mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge. The white center is brushed flat, then cut through, so every facet catches a hard point of light while the ground behind it stays soft. Three finishes on one band, and the gold runs solid under all of them.

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
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 11 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$10k solid gold ring$ttg$,$ttg$10k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$thin gold band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 10k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$10k two tone diamond cut wedding band$ttg$,
  research_group = 40,
  image_url = $ttg$/eon/ttg-r-1006/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1006$ttg$;

-- ==== Varyantlar: 11 genislik x 25 beden = 275 ====

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
  ($ttg$TTG-R-1006-2MM-4$ttg$, 2, $ttg$4$ttg$, 1.37, 16000),
  ($ttg$TTG-R-1006-2MM-4.5$ttg$, 2, $ttg$4.5$ttg$, 1.4, 16500),
  ($ttg$TTG-R-1006-2MM-5$ttg$, 2, $ttg$5$ttg$, 1.43, 16500),
  ($ttg$TTG-R-1006-2MM-5.5$ttg$, 2, $ttg$5.5$ttg$, 1.465, 17000),
  ($ttg$TTG-R-1006-2MM-6$ttg$, 2, $ttg$6$ttg$, 1.5, 17500),
  ($ttg$TTG-R-1006-2MM-6.5$ttg$, 2, $ttg$6.5$ttg$, 1.535, 17500),
  ($ttg$TTG-R-1006-2MM-7$ttg$, 2, $ttg$7$ttg$, 1.57, 18000),
  ($ttg$TTG-R-1006-2MM-7.5$ttg$, 2, $ttg$7.5$ttg$, 1.6, 18500),
  ($ttg$TTG-R-1006-2MM-8$ttg$, 2, $ttg$8$ttg$, 1.63, 18500),
  ($ttg$TTG-R-1006-2MM-8.5$ttg$, 2, $ttg$8.5$ttg$, 1.665, 19000),
  ($ttg$TTG-R-1006-2MM-9$ttg$, 2, $ttg$9$ttg$, 1.7, 19500),
  ($ttg$TTG-R-1006-2MM-9.5$ttg$, 2, $ttg$9.5$ttg$, 1.735, 20000),
  ($ttg$TTG-R-1006-2MM-10$ttg$, 2, $ttg$10$ttg$, 1.77, 20000),
  ($ttg$TTG-R-1006-2MM-10.5$ttg$, 2, $ttg$10.5$ttg$, 1.8, 20500),
  ($ttg$TTG-R-1006-2MM-11$ttg$, 2, $ttg$11$ttg$, 1.83, 21000),
  ($ttg$TTG-R-1006-2MM-11.5$ttg$, 2, $ttg$11.5$ttg$, 1.865, 21500),
  ($ttg$TTG-R-1006-2MM-12$ttg$, 2, $ttg$12$ttg$, 1.9, 21500),
  ($ttg$TTG-R-1006-2MM-12.5$ttg$, 2, $ttg$12.5$ttg$, 1.935, 22000),
  ($ttg$TTG-R-1006-2MM-13$ttg$, 2, $ttg$13$ttg$, 1.97, 22500),
  ($ttg$TTG-R-1006-2MM-13.5$ttg$, 2, $ttg$13.5$ttg$, 2.0, 22500),
  ($ttg$TTG-R-1006-2MM-14$ttg$, 2, $ttg$14$ttg$, 2.03, 23000),
  ($ttg$TTG-R-1006-2MM-14.5$ttg$, 2, $ttg$14.5$ttg$, 2.065, 23500),
  ($ttg$TTG-R-1006-2MM-15$ttg$, 2, $ttg$15$ttg$, 2.1, 24000),
  ($ttg$TTG-R-1006-2MM-15.5$ttg$, 2, $ttg$15.5$ttg$, 2.13, 24000),
  ($ttg$TTG-R-1006-2MM-16$ttg$, 2, $ttg$16$ttg$, 2.16, 24500),
  ($ttg$TTG-R-1006-3MM-4$ttg$, 3, $ttg$4$ttg$, 2.05, 23000),
  ($ttg$TTG-R-1006-3MM-4.5$ttg$, 3, $ttg$4.5$ttg$, 2.1, 24000),
  ($ttg$TTG-R-1006-3MM-5$ttg$, 3, $ttg$5$ttg$, 2.15, 24500),
  ($ttg$TTG-R-1006-3MM-5.5$ttg$, 3, $ttg$5.5$ttg$, 2.2, 25000),
  ($ttg$TTG-R-1006-3MM-6$ttg$, 3, $ttg$6$ttg$, 2.25, 25500),
  ($ttg$TTG-R-1006-3MM-6.5$ttg$, 3, $ttg$6.5$ttg$, 2.3, 26000),
  ($ttg$TTG-R-1006-3MM-7$ttg$, 3, $ttg$7$ttg$, 2.35, 26500),
  ($ttg$TTG-R-1006-3MM-7.5$ttg$, 3, $ttg$7.5$ttg$, 2.4, 27000),
  ($ttg$TTG-R-1006-3MM-8$ttg$, 3, $ttg$8$ttg$, 2.45, 27500),
  ($ttg$TTG-R-1006-3MM-8.5$ttg$, 3, $ttg$8.5$ttg$, 2.5, 28000),
  ($ttg$TTG-R-1006-3MM-9$ttg$, 3, $ttg$9$ttg$, 2.55, 28500),
  ($ttg$TTG-R-1006-3MM-9.5$ttg$, 3, $ttg$9.5$ttg$, 2.6, 29000),
  ($ttg$TTG-R-1006-3MM-10$ttg$, 3, $ttg$10$ttg$, 2.65, 29500),
  ($ttg$TTG-R-1006-3MM-10.5$ttg$, 3, $ttg$10.5$ttg$, 2.7, 30000),
  ($ttg$TTG-R-1006-3MM-11$ttg$, 3, $ttg$11$ttg$, 2.75, 31000),
  ($ttg$TTG-R-1006-3MM-11.5$ttg$, 3, $ttg$11.5$ttg$, 2.8, 31500),
  ($ttg$TTG-R-1006-3MM-12$ttg$, 3, $ttg$12$ttg$, 2.85, 32000),
  ($ttg$TTG-R-1006-3MM-12.5$ttg$, 3, $ttg$12.5$ttg$, 2.9, 32500),
  ($ttg$TTG-R-1006-3MM-13$ttg$, 3, $ttg$13$ttg$, 2.95, 33000),
  ($ttg$TTG-R-1006-3MM-13.5$ttg$, 3, $ttg$13.5$ttg$, 3.0, 33500),
  ($ttg$TTG-R-1006-3MM-14$ttg$, 3, $ttg$14$ttg$, 3.05, 34000),
  ($ttg$TTG-R-1006-3MM-14.5$ttg$, 3, $ttg$14.5$ttg$, 3.1, 34500),
  ($ttg$TTG-R-1006-3MM-15$ttg$, 3, $ttg$15$ttg$, 3.15, 35000),
  ($ttg$TTG-R-1006-3MM-15.5$ttg$, 3, $ttg$15.5$ttg$, 3.2, 35500),
  ($ttg$TTG-R-1006-3MM-16$ttg$, 3, $ttg$16$ttg$, 3.25, 36000),
  ($ttg$TTG-R-1006-4MM-4$ttg$, 4, $ttg$4$ttg$, 2.74, 30500),
  ($ttg$TTG-R-1006-4MM-4.5$ttg$, 4, $ttg$4.5$ttg$, 2.805, 31500),
  ($ttg$TTG-R-1006-4MM-5$ttg$, 4, $ttg$5$ttg$, 2.87, 32000),
  ($ttg$TTG-R-1006-4MM-5.5$ttg$, 4, $ttg$5.5$ttg$, 2.935, 32500),
  ($ttg$TTG-R-1006-4MM-6$ttg$, 4, $ttg$6$ttg$, 3.0, 33500),
  ($ttg$TTG-R-1006-4MM-6.5$ttg$, 4, $ttg$6.5$ttg$, 3.07, 34000),
  ($ttg$TTG-R-1006-4MM-7$ttg$, 4, $ttg$7$ttg$, 3.14, 35000),
  ($ttg$TTG-R-1006-4MM-7.5$ttg$, 4, $ttg$7.5$ttg$, 3.205, 35500),
  ($ttg$TTG-R-1006-4MM-8$ttg$, 4, $ttg$8$ttg$, 3.27, 36500),
  ($ttg$TTG-R-1006-4MM-8.5$ttg$, 4, $ttg$8.5$ttg$, 3.335, 37000),
  ($ttg$TTG-R-1006-4MM-9$ttg$, 4, $ttg$9$ttg$, 3.4, 37500),
  ($ttg$TTG-R-1006-4MM-9.5$ttg$, 4, $ttg$9.5$ttg$, 3.465, 38500),
  ($ttg$TTG-R-1006-4MM-10$ttg$, 4, $ttg$10$ttg$, 3.53, 39000),
  ($ttg$TTG-R-1006-4MM-10.5$ttg$, 4, $ttg$10.5$ttg$, 3.6, 40000),
  ($ttg$TTG-R-1006-4MM-11$ttg$, 4, $ttg$11$ttg$, 3.67, 40500),
  ($ttg$TTG-R-1006-4MM-11.5$ttg$, 4, $ttg$11.5$ttg$, 3.735, 41500),
  ($ttg$TTG-R-1006-4MM-12$ttg$, 4, $ttg$12$ttg$, 3.8, 42000),
  ($ttg$TTG-R-1006-4MM-12.5$ttg$, 4, $ttg$12.5$ttg$, 3.865, 42500),
  ($ttg$TTG-R-1006-4MM-13$ttg$, 4, $ttg$13$ttg$, 3.93, 43500),
  ($ttg$TTG-R-1006-4MM-13.5$ttg$, 4, $ttg$13.5$ttg$, 3.995, 44000),
  ($ttg$TTG-R-1006-4MM-14$ttg$, 4, $ttg$14$ttg$, 4.06, 45000),
  ($ttg$TTG-R-1006-4MM-14.5$ttg$, 4, $ttg$14.5$ttg$, 4.13, 45500),
  ($ttg$TTG-R-1006-4MM-15$ttg$, 4, $ttg$15$ttg$, 4.2, 46500),
  ($ttg$TTG-R-1006-4MM-15.5$ttg$, 4, $ttg$15.5$ttg$, 4.265, 47000),
  ($ttg$TTG-R-1006-4MM-16$ttg$, 4, $ttg$16$ttg$, 4.33, 47500),
  ($ttg$TTG-R-1006-5MM-4$ttg$, 5, $ttg$4$ttg$, 3.42, 38000),
  ($ttg$TTG-R-1006-5MM-4.5$ttg$, 5, $ttg$4.5$ttg$, 3.505, 39000),
  ($ttg$TTG-R-1006-5MM-5$ttg$, 5, $ttg$5$ttg$, 3.59, 40000),
  ($ttg$TTG-R-1006-5MM-5.5$ttg$, 5, $ttg$5.5$ttg$, 3.67, 40500),
  ($ttg$TTG-R-1006-5MM-6$ttg$, 5, $ttg$6$ttg$, 3.75, 41500),
  ($ttg$TTG-R-1006-5MM-6.5$ttg$, 5, $ttg$6.5$ttg$, 3.835, 42500),
  ($ttg$TTG-R-1006-5MM-7$ttg$, 5, $ttg$7$ttg$, 3.92, 43500),
  ($ttg$TTG-R-1006-5MM-7.5$ttg$, 5, $ttg$7.5$ttg$, 4.0, 44000),
  ($ttg$TTG-R-1006-5MM-8$ttg$, 5, $ttg$8$ttg$, 4.08, 45000),
  ($ttg$TTG-R-1006-5MM-8.5$ttg$, 5, $ttg$8.5$ttg$, 4.165, 46000),
  ($ttg$TTG-R-1006-5MM-9$ttg$, 5, $ttg$9$ttg$, 4.25, 47000),
  ($ttg$TTG-R-1006-5MM-9.5$ttg$, 5, $ttg$9.5$ttg$, 4.335, 48000),
  ($ttg$TTG-R-1006-5MM-10$ttg$, 5, $ttg$10$ttg$, 4.42, 48500),
  ($ttg$TTG-R-1006-5MM-10.5$ttg$, 5, $ttg$10.5$ttg$, 4.5, 49500),
  ($ttg$TTG-R-1006-5MM-11$ttg$, 5, $ttg$11$ttg$, 4.58, 50500),
  ($ttg$TTG-R-1006-5MM-11.5$ttg$, 5, $ttg$11.5$ttg$, 4.665, 51500),
  ($ttg$TTG-R-1006-5MM-12$ttg$, 5, $ttg$12$ttg$, 4.75, 52000),
  ($ttg$TTG-R-1006-5MM-12.5$ttg$, 5, $ttg$12.5$ttg$, 4.83, 53000),
  ($ttg$TTG-R-1006-5MM-13$ttg$, 5, $ttg$13$ttg$, 4.91, 54000),
  ($ttg$TTG-R-1006-5MM-13.5$ttg$, 5, $ttg$13.5$ttg$, 4.995, 55000),
  ($ttg$TTG-R-1006-5MM-14$ttg$, 5, $ttg$14$ttg$, 5.08, 56000),
  ($ttg$TTG-R-1006-5MM-14.5$ttg$, 5, $ttg$14.5$ttg$, 5.185, 57000),
  ($ttg$TTG-R-1006-5MM-15$ttg$, 5, $ttg$15$ttg$, 5.29, 58000),
  ($ttg$TTG-R-1006-5MM-15.5$ttg$, 5, $ttg$15.5$ttg$, 5.355, 58500),
  ($ttg$TTG-R-1006-5MM-16$ttg$, 5, $ttg$16$ttg$, 5.42, 59500),
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
  ($ttg$TTG-R-1006-10MM-16$ttg$, 10, $ttg$16$ttg$, 10.82, 117500),
  ($ttg$TTG-R-1006-11MM-4$ttg$, 11, $ttg$4$ttg$, 7.53, 82000),
  ($ttg$TTG-R-1006-11MM-4.5$ttg$, 11, $ttg$4.5$ttg$, 7.71, 84000),
  ($ttg$TTG-R-1006-11MM-5$ttg$, 11, $ttg$5$ttg$, 7.89, 86000),
  ($ttg$TTG-R-1006-11MM-5.5$ttg$, 11, $ttg$5.5$ttg$, 8.075, 88000),
  ($ttg$TTG-R-1006-11MM-6$ttg$, 11, $ttg$6$ttg$, 8.26, 90000),
  ($ttg$TTG-R-1006-11MM-6.5$ttg$, 11, $ttg$6.5$ttg$, 8.44, 92000),
  ($ttg$TTG-R-1006-11MM-7$ttg$, 11, $ttg$7$ttg$, 8.62, 93500),
  ($ttg$TTG-R-1006-11MM-7.5$ttg$, 11, $ttg$7.5$ttg$, 8.805, 95500),
  ($ttg$TTG-R-1006-11MM-8$ttg$, 11, $ttg$8$ttg$, 8.99, 97500),
  ($ttg$TTG-R-1006-11MM-8.5$ttg$, 11, $ttg$8.5$ttg$, 9.17, 99500),
  ($ttg$TTG-R-1006-11MM-9$ttg$, 11, $ttg$9$ttg$, 9.35, 101500),
  ($ttg$TTG-R-1006-11MM-9.5$ttg$, 11, $ttg$9.5$ttg$, 9.535, 103500),
  ($ttg$TTG-R-1006-11MM-10$ttg$, 11, $ttg$10$ttg$, 9.72, 105500),
  ($ttg$TTG-R-1006-11MM-10.5$ttg$, 11, $ttg$10.5$ttg$, 9.9, 107500),
  ($ttg$TTG-R-1006-11MM-11$ttg$, 11, $ttg$11$ttg$, 10.08, 109500),
  ($ttg$TTG-R-1006-11MM-11.5$ttg$, 11, $ttg$11.5$ttg$, 10.265, 111500),
  ($ttg$TTG-R-1006-11MM-12$ttg$, 11, $ttg$12$ttg$, 10.45, 113500),
  ($ttg$TTG-R-1006-11MM-12.5$ttg$, 11, $ttg$12.5$ttg$, 10.63, 115500),
  ($ttg$TTG-R-1006-11MM-13$ttg$, 11, $ttg$13$ttg$, 10.81, 117000),
  ($ttg$TTG-R-1006-11MM-13.5$ttg$, 11, $ttg$13.5$ttg$, 10.995, 119000),
  ($ttg$TTG-R-1006-11MM-14$ttg$, 11, $ttg$14$ttg$, 11.18, 121000),
  ($ttg$TTG-R-1006-11MM-14.5$ttg$, 11, $ttg$14.5$ttg$, 11.355, 123000),
  ($ttg$TTG-R-1006-11MM-15$ttg$, 11, $ttg$15$ttg$, 11.53, 125000),
  ($ttg$TTG-R-1006-11MM-15.5$ttg$, 11, $ttg$15.5$ttg$, 11.72, 127000),
  ($ttg$TTG-R-1006-11MM-16$ttg$, 11, $ttg$16$ttg$, 11.91, 129000),
  ($ttg$TTG-R-1006-12MM-4$ttg$, 12, $ttg$4$ttg$, 8.21, 89500),
  ($ttg$TTG-R-1006-12MM-4.5$ttg$, 12, $ttg$4.5$ttg$, 8.41, 91500),
  ($ttg$TTG-R-1006-12MM-5$ttg$, 12, $ttg$5$ttg$, 8.61, 93500),
  ($ttg$TTG-R-1006-12MM-5.5$ttg$, 12, $ttg$5.5$ttg$, 8.81, 96000),
  ($ttg$TTG-R-1006-12MM-6$ttg$, 12, $ttg$6$ttg$, 9.01, 98000),
  ($ttg$TTG-R-1006-12MM-6.5$ttg$, 12, $ttg$6.5$ttg$, 9.21, 100000),
  ($ttg$TTG-R-1006-12MM-7$ttg$, 12, $ttg$7$ttg$, 9.41, 102000),
  ($ttg$TTG-R-1006-12MM-7.5$ttg$, 12, $ttg$7.5$ttg$, 9.605, 104500),
  ($ttg$TTG-R-1006-12MM-8$ttg$, 12, $ttg$8$ttg$, 9.8, 106500),
  ($ttg$TTG-R-1006-12MM-8.5$ttg$, 12, $ttg$8.5$ttg$, 10.0, 108500),
  ($ttg$TTG-R-1006-12MM-9$ttg$, 12, $ttg$9$ttg$, 10.2, 110500),
  ($ttg$TTG-R-1006-12MM-9.5$ttg$, 12, $ttg$9.5$ttg$, 10.4, 113000),
  ($ttg$TTG-R-1006-12MM-10$ttg$, 12, $ttg$10$ttg$, 10.6, 115000),
  ($ttg$TTG-R-1006-12MM-10.5$ttg$, 12, $ttg$10.5$ttg$, 10.8, 117000),
  ($ttg$TTG-R-1006-12MM-11$ttg$, 12, $ttg$11$ttg$, 11.0, 119500),
  ($ttg$TTG-R-1006-12MM-11.5$ttg$, 12, $ttg$11.5$ttg$, 11.2, 121500),
  ($ttg$TTG-R-1006-12MM-12$ttg$, 12, $ttg$12$ttg$, 11.4, 123500),
  ($ttg$TTG-R-1006-12MM-12.5$ttg$, 12, $ttg$12.5$ttg$, 11.595, 125500),
  ($ttg$TTG-R-1006-12MM-13$ttg$, 12, $ttg$13$ttg$, 11.79, 128000),
  ($ttg$TTG-R-1006-12MM-13.5$ttg$, 12, $ttg$13.5$ttg$, 11.99, 130000),
  ($ttg$TTG-R-1006-12MM-14$ttg$, 12, $ttg$14$ttg$, 12.19, 132000),
  ($ttg$TTG-R-1006-12MM-14.5$ttg$, 12, $ttg$14.5$ttg$, 12.39, 134000),
  ($ttg$TTG-R-1006-12MM-15$ttg$, 12, $ttg$15$ttg$, 12.59, 136500),
  ($ttg$TTG-R-1006-12MM-15.5$ttg$, 12, $ttg$15.5$ttg$, 12.79, 138500),
  ($ttg$TTG-R-1006-12MM-16$ttg$, 12, $ttg$16$ttg$, 12.99, 140500);

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
