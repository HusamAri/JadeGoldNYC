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
-- Varyant ekseni: 5 genislik (6-10mm) x 25 beden (US 4-16 tam+yarim) = 125.
--   Neden 2-12mm DEGIL: elmas kesim kafes + cift ray dar bantta fiziksel
--   olarak okunmaz; pazar arastirmasi en cok satan erkek bandinin 6-8mm
--   oldugunu gosteriyor (2026 Etsy erkek aliansi taramasi).
--
-- Gram tablosu: 0101'in 18K satirlarindan BIREBIR (1.5mm kalinlik).
--   VARSAYIM: basamakli iki-tonlu profil, ayni genislik/kalinlikta dome ile
--   kutlece karsilastirilabilir (kenar basamaklari metal alir, duz merkez
--   ekler). Ilk uretimde tartip dogrulanmali.
--
-- Fiyat: ev formulu — ceil(gram * 19320 / 500) * 500 + 1000
--   ($5 yukari yuvarla + $10 kargo payi fiyata gomulu; bkz. second-brain
--   "ucretsiz kargo = bedel fiyata gomulur"). Aralik $1055.00 - $2720.00.
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
  $ttg$18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him$ttg$,
  $ttg$A solid 18k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 10mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

The two colors do the work here, and 18k pushes the contrast further. The yellow runs deep and warm against the pale white center, the color you picture when someone says gold. The center is brushed flat, then cut through, so every facet throws a hard point of light while the ground behind it stays quiet. Three finishes on one band, and the gold runs solid under all of them.

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
[EON 41 - TTG-R-1806 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 5 (6-10mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$mens wedding band$ttg$,$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$18k solid gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$wide wedding band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$,$ttg$gift for husband$ttg$,$ttg$unisex wedding band$ttg$,$ttg$white gold inlay$ttg$,$ttg$18k wedding band$ttg$,$ttg$gold band for men$ttg$]::text[],
  ARRAY[$ttg$Solid 18k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  105500,
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
  title = $ttg$18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him$ttg$,
  description = $ttg$A solid 18k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 10mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

The two colors do the work here, and 18k pushes the contrast further. The yellow runs deep and warm against the pale white center, the color you picture when someone says gold. The center is brushed flat, then cut through, so every facet throws a hard point of light while the ground behind it stays quiet. Three finishes on one band, and the gold runs solid under all of them.

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
[EON 41 - TTG-R-1806 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 5 (6-10mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$mens wedding band$ttg$,$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$18k solid gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$wide wedding band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$,$ttg$gift for husband$ttg$,$ttg$unisex wedding band$ttg$,$ttg$white gold inlay$ttg$,$ttg$18k wedding band$ttg$,$ttg$gold band for men$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 18k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$18k two tone diamond cut wedding band$ttg$,
  research_group = 41,
  image_url = $ttg$/eon/ttg-r-1806/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1806$ttg$;

-- ==== Varyantlar: 5 genislik x 25 beden = 125 ====

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
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
  ($ttg$TTG-R-1806-10MM-16$ttg$, 10, $ttg$16$ttg$, 14.02, 272000);

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
