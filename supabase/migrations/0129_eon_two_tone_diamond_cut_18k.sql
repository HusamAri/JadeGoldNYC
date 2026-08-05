-- 0129_eon_two_tone_diamond_cut_18k.sql
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, 18K solid gold (TTG-R-1806).
--
-- YENI STIL. Mevcut 39 listing bes profilde toplaniyordu (01 Dome, 02 Flat,
-- 03 Beveled, 04 Milgrain, 05 Knife Edge); bu altincisi: basamakli sari altin
-- raylar + yuksek beyaz altin merkez, merkez florentine zemin uzerine elmas
-- kesim kafes deseniyle islenmis. Panelde LISTING ONERISI olarak durur
-- (status='draft', etsy_listing_id null) — Etsy'ye gonderim ayri adim.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>. Yeni renk kodu TTG
-- (Two-Tone Gold), profil 06. 10K kardesi TTG-R-1006 (0127); 14K
-- TTG-R-1406 0128 ile ayni desende acilir. Varyant ekseni UCUNDE DE AYNI.
--
-- Varyant ekseni: 7 genislik (6-12mm) x 25 beden (US 4-16 tam+yarim) = 175.
--   EV STANDARDI: 39 canli listing'in hepsi bu ekseni tasiyor
--   (docs/eon/katalog-v3.md, eon-v3-catalog.json). Desen genislikle
--   olceklenir: dar bantta ince/sik kafes, genis bantta acilir.
--
-- ISCILIK + FIYAT: HAMMERED LISTING ILE AYNI KADEME (kullanici direktifi).
--   Hammered listing ("10K Solid Gold Hammered Wedding Band, Milgrain Comfort
--   Fit") motorun MILGRAIN profilindedir; v4 ASM sayfasi bu kalemi acikca
--   "Iscilik Milgrain USD = 40 — Hammered/milgrain istisnasi" diye tanimlar.
--   TTG de elmas kesim + iki-tonlu birlestirme tasidigi icin ayni kademede:
--     * iscilik = $40/adet — FIYATIN icinde (v4 grid formulu tasir).
--       NOT: dal-kokenli `listing_cost_cents` kolonu (0109_listing_fixed_cost)
--       main'e/prod'a hic inmedi; maliyet tarafinda TTG, hammered'in bugunku
--       prod isleyisiyle AYNI yoldan gider (gold_auto). Kolon gelirse doldur.
--     * fiyat   = v4 grid MILGRAIN profili, "ETSY LISTE" kolonu
--     * gorunen = liste x 0.75 (kalici %25 indirim, AYRI mekanizma)
--
-- Fiyat panelde HESAPLANMAZ (0119 `externalPricing`) — motor disaridadir.
--   Kaynak: 2026-07-29-eon-etsy-giris-grid-spot4090-v4.xlsx
--           sha256 f198fc27de356ffbf2501bd61d75aba308d6d6c3bd78c7e9bccd13d307f6f3b8
--   Varsayimlar: spot $4090/ozt · fire %7 · paket $8 ·
--   kargo $22 (landed'in ICINDE, ayri kargo payi EKLENMEZ) ·
--   carpan 2-7mm 1.55 / 8-12mm 2 ("mens wide" primi) ·
--   Etsy %10.5 · offsite %15 · kalinlik 1.5mm.
--   Formul: landed = gram*spot_g*saflik*(1+fire) + iscilik + paket + kargo;
--           motor = ROUND(landed_ham * carpan); liste = CEILING(motor*4/15)*5.
--   Uretici motoru YENIDEN URETMEZ, formulu birebir cozer: v4'un 858
--   hucresi / 5148 kolon kontrolu SIFIR SAPMA ile dogrulandi.
--
-- Yarim bedenler: grid yalnizca 13 tam beden tasir. Yarim beden grami komsu
--   tam bedenlerin dogrusal orta-noktasi (ev yontemi, katalog-v3), fiyat ayni
--   motor formulunden. Tam bedenler grid'le BIREBIR (91/91 tam beden v4 MILGRAIN grid'iyle BIREBIR).
--   Liste araligi $1,325.00 - $4,925.00 · gorunen
--   $993.75 - $3,693.75.
--
-- Uretici: scripts/gen_catalog_ttg.py (saf, ic assert'li)
-- Bu dosya: scripts/emit_ttg_migration.py ciktisi — ELLE DUZENLEMEYIN.

-- Idempotent: aile zaten varsa urun yeniden yazilmaz, varyant/gorsel eslenir.

insert into public.products (
  org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url,
  num_images, research_keyword, research_group
)
select
  o.id,
  $ttg$TTG-R-1806$ttg$,
  $ttg$18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 12mm, Anniversary Gift for Him$ttg$,
  $ttg$A solid 18k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

The two colors do the work here, and 18k pushes the contrast further. The yellow runs deep and warm against the pale white center, the color you picture when someone says gold. The center is brushed flat, then cut through, so every facet throws a hard point of light while the ground behind it stays quiet. Three finishes on one band, and the gold runs solid under all of them.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 6mm through 12mm, in Width. A 6mm is the everyday width and the one most people wear daily; 7 to 8mm reads a little more present on the hand; 9 to 12mm sits wide and bold across the finger. The lattice scales with the band: 6mm carries a fine, close-set pattern, and the wider ones open it up.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON 41 - TTG-R-1806 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 7 (6-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$18k solid gold ring$ttg$,$ttg$18k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$wide wedding band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  ARRAY[$ttg$Solid 18k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  132500,
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
  title = $ttg$18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 12mm, Anniversary Gift for Him$ttg$,
  description = $ttg$A solid 18k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 18k inside the band.

The two colors do the work here, and 18k pushes the contrast further. The yellow runs deep and warm against the pale white center, the color you picture when someone says gold. The center is brushed flat, then cut through, so every facet throws a hard point of light while the ground behind it stays quiet. Three finishes on one band, and the gold runs solid under all of them.

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, 6mm through 12mm, in Width. A 6mm is the everyday width and the one most people wear daily; 7 to 8mm reads a little more present on the hand; 9 to 12mm sits wide and bold across the finger. The lattice scales with the band: 6mm carries a fine, close-set pattern, and the wider ones open it up.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON 41 - TTG-R-1806 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 7 (6-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$18k solid gold ring$ttg$,$ttg$18k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$wide wedding band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 18k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$18k two tone diamond cut wedding band$ttg$,
  research_group = 41,
  image_url = $ttg$/eon/ttg-r-1806/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1806$ttg$;

-- ==== Varyantlar: 7 genislik x 25 beden = 175 ====
-- price_cents = ETSY LISTE (Etsy'ye girilen). Gorunen fiyat liste x 0.75.

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
  ($ttg$TTG-R-1806-6MM-4$ttg$, 6, $ttg$4$ttg$, 5.4, 132500),
  ($ttg$TTG-R-1806-6MM-4.5$ttg$, 6, $ttg$4.5$ttg$, 5.515, 135000),
  ($ttg$TTG-R-1806-6MM-5$ttg$, 6, $ttg$5$ttg$, 5.63, 137500),
  ($ttg$TTG-R-1806-6MM-5.5$ttg$, 6, $ttg$5.5$ttg$, 5.745, 140000),
  ($ttg$TTG-R-1806-6MM-6$ttg$, 6, $ttg$6$ttg$, 5.86, 142500),
  ($ttg$TTG-R-1806-6MM-6.5$ttg$, 6, $ttg$6.5$ttg$, 5.97, 145000),
  ($ttg$TTG-R-1806-6MM-7$ttg$, 6, $ttg$7$ttg$, 6.08, 147500),
  ($ttg$TTG-R-1806-6MM-7.5$ttg$, 6, $ttg$7.5$ttg$, 6.195, 150000),
  ($ttg$TTG-R-1806-6MM-8$ttg$, 6, $ttg$8$ttg$, 6.31, 152500),
  ($ttg$TTG-R-1806-6MM-8.5$ttg$, 6, $ttg$8.5$ttg$, 6.42, 155000),
  ($ttg$TTG-R-1806-6MM-9$ttg$, 6, $ttg$9$ttg$, 6.53, 157000),
  ($ttg$TTG-R-1806-6MM-9.5$ttg$, 6, $ttg$9.5$ttg$, 6.645, 159500),
  ($ttg$TTG-R-1806-6MM-10$ttg$, 6, $ttg$10$ttg$, 6.76, 162000),
  ($ttg$TTG-R-1806-6MM-10.5$ttg$, 6, $ttg$10.5$ttg$, 6.87, 164500),
  ($ttg$TTG-R-1806-6MM-11$ttg$, 6, $ttg$11$ttg$, 6.98, 167000),
  ($ttg$TTG-R-1806-6MM-11.5$ttg$, 6, $ttg$11.5$ttg$, 7.095, 169500),
  ($ttg$TTG-R-1806-6MM-12$ttg$, 6, $ttg$12$ttg$, 7.21, 172000),
  ($ttg$TTG-R-1806-6MM-12.5$ttg$, 6, $ttg$12.5$ttg$, 7.325, 174500),
  ($ttg$TTG-R-1806-6MM-13$ttg$, 6, $ttg$13$ttg$, 7.44, 177000),
  ($ttg$TTG-R-1806-6MM-13.5$ttg$, 6, $ttg$13.5$ttg$, 7.505, 178500),
  ($ttg$TTG-R-1806-6MM-14$ttg$, 6, $ttg$14$ttg$, 7.57, 180000),
  ($ttg$TTG-R-1806-6MM-14.5$ttg$, 6, $ttg$14.5$ttg$, 7.74, 183500),
  ($ttg$TTG-R-1806-6MM-15$ttg$, 6, $ttg$15$ttg$, 7.91, 187000),
  ($ttg$TTG-R-1806-6MM-15.5$ttg$, 6, $ttg$15.5$ttg$, 8.025, 189500),
  ($ttg$TTG-R-1806-6MM-16$ttg$, 6, $ttg$16$ttg$, 8.14, 192000),
  ($ttg$TTG-R-1806-7MM-4$ttg$, 7, $ttg$4$ttg$, 5.88, 143000),
  ($ttg$TTG-R-1806-7MM-4.5$ttg$, 7, $ttg$4.5$ttg$, 6.01, 146000),
  ($ttg$TTG-R-1806-7MM-5$ttg$, 7, $ttg$5$ttg$, 6.14, 148500),
  ($ttg$TTG-R-1806-7MM-5.5$ttg$, 7, $ttg$5.5$ttg$, 6.275, 151500),
  ($ttg$TTG-R-1806-7MM-6$ttg$, 7, $ttg$6$ttg$, 6.41, 154500),
  ($ttg$TTG-R-1806-7MM-6.5$ttg$, 7, $ttg$6.5$ttg$, 6.545, 157500),
  ($ttg$TTG-R-1806-7MM-7$ttg$, 7, $ttg$7$ttg$, 6.68, 160500),
  ($ttg$TTG-R-1806-7MM-7.5$ttg$, 7, $ttg$7.5$ttg$, 6.815, 163500),
  ($ttg$TTG-R-1806-7MM-8$ttg$, 7, $ttg$8$ttg$, 6.95, 166000),
  ($ttg$TTG-R-1806-7MM-8.5$ttg$, 7, $ttg$8.5$ttg$, 7.08, 169000),
  ($ttg$TTG-R-1806-7MM-9$ttg$, 7, $ttg$9$ttg$, 7.21, 172000),
  ($ttg$TTG-R-1806-7MM-9.5$ttg$, 7, $ttg$9.5$ttg$, 7.345, 175000),
  ($ttg$TTG-R-1806-7MM-10$ttg$, 7, $ttg$10$ttg$, 7.48, 178000),
  ($ttg$TTG-R-1806-7MM-10.5$ttg$, 7, $ttg$10.5$ttg$, 7.615, 181000),
  ($ttg$TTG-R-1806-7MM-11$ttg$, 7, $ttg$11$ttg$, 7.75, 183500),
  ($ttg$TTG-R-1806-7MM-11.5$ttg$, 7, $ttg$11.5$ttg$, 7.885, 186500),
  ($ttg$TTG-R-1806-7MM-12$ttg$, 7, $ttg$12$ttg$, 8.02, 189500),
  ($ttg$TTG-R-1806-7MM-12.5$ttg$, 7, $ttg$12.5$ttg$, 8.15, 192500),
  ($ttg$TTG-R-1806-7MM-13$ttg$, 7, $ttg$13$ttg$, 8.28, 195500),
  ($ttg$TTG-R-1806-7MM-13.5$ttg$, 7, $ttg$13.5$ttg$, 8.42, 198500),
  ($ttg$TTG-R-1806-7MM-14$ttg$, 7, $ttg$14$ttg$, 8.56, 201500),
  ($ttg$TTG-R-1806-7MM-14.5$ttg$, 7, $ttg$14.5$ttg$, 8.695, 204500),
  ($ttg$TTG-R-1806-7MM-15$ttg$, 7, $ttg$15$ttg$, 8.83, 207500),
  ($ttg$TTG-R-1806-7MM-15.5$ttg$, 7, $ttg$15.5$ttg$, 8.965, 210000),
  ($ttg$TTG-R-1806-7MM-16$ttg$, 7, $ttg$16$ttg$, 9.1, 213000),
  ($ttg$TTG-R-1806-8MM-4$ttg$, 8, $ttg$4$ttg$, 6.48, 201500),
  ($ttg$TTG-R-1806-8MM-4.5$ttg$, 8, $ttg$4.5$ttg$, 6.625, 205500),
  ($ttg$TTG-R-1806-8MM-5$ttg$, 8, $ttg$5$ttg$, 6.77, 209500),
  ($ttg$TTG-R-1806-8MM-5.5$ttg$, 8, $ttg$5.5$ttg$, 6.92, 213500),
  ($ttg$TTG-R-1806-8MM-6$ttg$, 8, $ttg$6$ttg$, 7.07, 218000),
  ($ttg$TTG-R-1806-8MM-6.5$ttg$, 8, $ttg$6.5$ttg$, 7.215, 222000),
  ($ttg$TTG-R-1806-8MM-7$ttg$, 8, $ttg$7$ttg$, 7.36, 226000),
  ($ttg$TTG-R-1806-8MM-7.5$ttg$, 8, $ttg$7.5$ttg$, 7.51, 230000),
  ($ttg$TTG-R-1806-8MM-8$ttg$, 8, $ttg$8$ttg$, 7.66, 234500),
  ($ttg$TTG-R-1806-8MM-8.5$ttg$, 8, $ttg$8.5$ttg$, 7.8, 238500),
  ($ttg$TTG-R-1806-8MM-9$ttg$, 8, $ttg$9$ttg$, 7.94, 242500),
  ($ttg$TTG-R-1806-8MM-9.5$ttg$, 8, $ttg$9.5$ttg$, 8.09, 246500),
  ($ttg$TTG-R-1806-8MM-10$ttg$, 8, $ttg$10$ttg$, 8.24, 251000),
  ($ttg$TTG-R-1806-8MM-10.5$ttg$, 8, $ttg$10.5$ttg$, 8.385, 255000),
  ($ttg$TTG-R-1806-8MM-11$ttg$, 8, $ttg$11$ttg$, 8.53, 259000),
  ($ttg$TTG-R-1806-8MM-11.5$ttg$, 8, $ttg$11.5$ttg$, 8.68, 263000),
  ($ttg$TTG-R-1806-8MM-12$ttg$, 8, $ttg$12$ttg$, 8.83, 267500),
  ($ttg$TTG-R-1806-8MM-12.5$ttg$, 8, $ttg$12.5$ttg$, 8.975, 271500),
  ($ttg$TTG-R-1806-8MM-13$ttg$, 8, $ttg$13$ttg$, 9.12, 275500),
  ($ttg$TTG-R-1806-8MM-13.5$ttg$, 8, $ttg$13.5$ttg$, 9.24, 279000),
  ($ttg$TTG-R-1806-8MM-14$ttg$, 8, $ttg$14$ttg$, 9.36, 282000),
  ($ttg$TTG-R-1806-8MM-14.5$ttg$, 8, $ttg$14.5$ttg$, 9.48, 285500),
  ($ttg$TTG-R-1806-8MM-15$ttg$, 8, $ttg$15$ttg$, 9.6, 289000),
  ($ttg$TTG-R-1806-8MM-15.5$ttg$, 8, $ttg$15.5$ttg$, 9.785, 294000),
  ($ttg$TTG-R-1806-8MM-16$ttg$, 8, $ttg$16$ttg$, 9.97, 299500),
  ($ttg$TTG-R-1806-9MM-4$ttg$, 9, $ttg$4$ttg$, 7.98, 243500),
  ($ttg$TTG-R-1806-9MM-4.5$ttg$, 9, $ttg$4.5$ttg$, 8.17, 249000),
  ($ttg$TTG-R-1806-9MM-5$ttg$, 9, $ttg$5$ttg$, 8.36, 254000),
  ($ttg$TTG-R-1806-9MM-5.5$ttg$, 9, $ttg$5.5$ttg$, 8.555, 259500),
  ($ttg$TTG-R-1806-9MM-6$ttg$, 9, $ttg$6$ttg$, 8.75, 265000),
  ($ttg$TTG-R-1806-9MM-6.5$ttg$, 9, $ttg$6.5$ttg$, 8.945, 270500),
  ($ttg$TTG-R-1806-9MM-7$ttg$, 9, $ttg$7$ttg$, 9.14, 276000),
  ($ttg$TTG-R-1806-9MM-7.5$ttg$, 9, $ttg$7.5$ttg$, 9.33, 281500),
  ($ttg$TTG-R-1806-9MM-8$ttg$, 9, $ttg$8$ttg$, 9.52, 287000),
  ($ttg$TTG-R-1806-9MM-8.5$ttg$, 9, $ttg$8.5$ttg$, 9.715, 292000),
  ($ttg$TTG-R-1806-9MM-9$ttg$, 9, $ttg$9$ttg$, 9.91, 298000),
  ($ttg$TTG-R-1806-9MM-9.5$ttg$, 9, $ttg$9.5$ttg$, 10.105, 303500),
  ($ttg$TTG-R-1806-9MM-10$ttg$, 9, $ttg$10$ttg$, 10.3, 309000),
  ($ttg$TTG-R-1806-9MM-10.5$ttg$, 9, $ttg$10.5$ttg$, 10.495, 314000),
  ($ttg$TTG-R-1806-9MM-11$ttg$, 9, $ttg$11$ttg$, 10.69, 319500),
  ($ttg$TTG-R-1806-9MM-11.5$ttg$, 9, $ttg$11.5$ttg$, 10.88, 325000),
  ($ttg$TTG-R-1806-9MM-12$ttg$, 9, $ttg$12$ttg$, 11.07, 330500),
  ($ttg$TTG-R-1806-9MM-12.5$ttg$, 9, $ttg$12.5$ttg$, 11.265, 336000),
  ($ttg$TTG-R-1806-9MM-13$ttg$, 9, $ttg$13$ttg$, 11.46, 341500),
  ($ttg$TTG-R-1806-9MM-13.5$ttg$, 9, $ttg$13.5$ttg$, 11.655, 347000),
  ($ttg$TTG-R-1806-9MM-14$ttg$, 9, $ttg$14$ttg$, 11.85, 352500),
  ($ttg$TTG-R-1806-9MM-14.5$ttg$, 9, $ttg$14.5$ttg$, 12.04, 357500),
  ($ttg$TTG-R-1806-9MM-15$ttg$, 9, $ttg$15$ttg$, 12.23, 363000),
  ($ttg$TTG-R-1806-9MM-15.5$ttg$, 9, $ttg$15.5$ttg$, 12.425, 368500),
  ($ttg$TTG-R-1806-9MM-16$ttg$, 9, $ttg$16$ttg$, 12.62, 374000),
  ($ttg$TTG-R-1806-10MM-4$ttg$, 10, $ttg$4$ttg$, 8.86, 268000),
  ($ttg$TTG-R-1806-10MM-4.5$ttg$, 10, $ttg$4.5$ttg$, 9.075, 274000),
  ($ttg$TTG-R-1806-10MM-5$ttg$, 10, $ttg$5$ttg$, 9.29, 280500),
  ($ttg$TTG-R-1806-10MM-5.5$ttg$, 10, $ttg$5.5$ttg$, 9.505, 286500),
  ($ttg$TTG-R-1806-10MM-6$ttg$, 10, $ttg$6$ttg$, 9.72, 292500),
  ($ttg$TTG-R-1806-10MM-6.5$ttg$, 10, $ttg$6.5$ttg$, 9.935, 298500),
  ($ttg$TTG-R-1806-10MM-7$ttg$, 10, $ttg$7$ttg$, 10.15, 304500),
  ($ttg$TTG-R-1806-10MM-7.5$ttg$, 10, $ttg$7.5$ttg$, 10.365, 310500),
  ($ttg$TTG-R-1806-10MM-8$ttg$, 10, $ttg$8$ttg$, 10.58, 316500),
  ($ttg$TTG-R-1806-10MM-8.5$ttg$, 10, $ttg$8.5$ttg$, 10.795, 322500),
  ($ttg$TTG-R-1806-10MM-9$ttg$, 10, $ttg$9$ttg$, 11.01, 329000),
  ($ttg$TTG-R-1806-10MM-9.5$ttg$, 10, $ttg$9.5$ttg$, 11.225, 335000),
  ($ttg$TTG-R-1806-10MM-10$ttg$, 10, $ttg$10$ttg$, 11.44, 341000),
  ($ttg$TTG-R-1806-10MM-10.5$ttg$, 10, $ttg$10.5$ttg$, 11.655, 347000),
  ($ttg$TTG-R-1806-10MM-11$ttg$, 10, $ttg$11$ttg$, 11.87, 353000),
  ($ttg$TTG-R-1806-10MM-11.5$ttg$, 10, $ttg$11.5$ttg$, 12.085, 359000),
  ($ttg$TTG-R-1806-10MM-12$ttg$, 10, $ttg$12$ttg$, 12.3, 365000),
  ($ttg$TTG-R-1806-10MM-12.5$ttg$, 10, $ttg$12.5$ttg$, 12.515, 371000),
  ($ttg$TTG-R-1806-10MM-13$ttg$, 10, $ttg$13$ttg$, 12.73, 377000),
  ($ttg$TTG-R-1806-10MM-13.5$ttg$, 10, $ttg$13.5$ttg$, 12.945, 383000),
  ($ttg$TTG-R-1806-10MM-14$ttg$, 10, $ttg$14$ttg$, 13.16, 389000),
  ($ttg$TTG-R-1806-10MM-14.5$ttg$, 10, $ttg$14.5$ttg$, 13.375, 395500),
  ($ttg$TTG-R-1806-10MM-15$ttg$, 10, $ttg$15$ttg$, 13.59, 401500),
  ($ttg$TTG-R-1806-10MM-15.5$ttg$, 10, $ttg$15.5$ttg$, 13.805, 407500),
  ($ttg$TTG-R-1806-10MM-16$ttg$, 10, $ttg$16$ttg$, 14.02, 413500),
  ($ttg$TTG-R-1806-11MM-4$ttg$, 11, $ttg$4$ttg$, 9.75, 293500),
  ($ttg$TTG-R-1806-11MM-4.5$ttg$, 11, $ttg$4.5$ttg$, 9.985, 300000),
  ($ttg$TTG-R-1806-11MM-5$ttg$, 11, $ttg$5$ttg$, 10.22, 306500),
  ($ttg$TTG-R-1806-11MM-5.5$ttg$, 11, $ttg$5.5$ttg$, 10.46, 313500),
  ($ttg$TTG-R-1806-11MM-6$ttg$, 11, $ttg$6$ttg$, 10.7, 320000),
  ($ttg$TTG-R-1806-11MM-6.5$ttg$, 11, $ttg$6.5$ttg$, 10.935, 326500),
  ($ttg$TTG-R-1806-11MM-7$ttg$, 11, $ttg$7$ttg$, 11.17, 333000),
  ($ttg$TTG-R-1806-11MM-7.5$ttg$, 11, $ttg$7.5$ttg$, 11.405, 340000),
  ($ttg$TTG-R-1806-11MM-8$ttg$, 11, $ttg$8$ttg$, 11.64, 346500),
  ($ttg$TTG-R-1806-11MM-8.5$ttg$, 11, $ttg$8.5$ttg$, 11.875, 353000),
  ($ttg$TTG-R-1806-11MM-9$ttg$, 11, $ttg$9$ttg$, 12.11, 359500),
  ($ttg$TTG-R-1806-11MM-9.5$ttg$, 11, $ttg$9.5$ttg$, 12.35, 366500),
  ($ttg$TTG-R-1806-11MM-10$ttg$, 11, $ttg$10$ttg$, 12.59, 373000),
  ($ttg$TTG-R-1806-11MM-10.5$ttg$, 11, $ttg$10.5$ttg$, 12.825, 380000),
  ($ttg$TTG-R-1806-11MM-11$ttg$, 11, $ttg$11$ttg$, 13.06, 386500),
  ($ttg$TTG-R-1806-11MM-11.5$ttg$, 11, $ttg$11.5$ttg$, 13.295, 393000),
  ($ttg$TTG-R-1806-11MM-12$ttg$, 11, $ttg$12$ttg$, 13.53, 399500),
  ($ttg$TTG-R-1806-11MM-12.5$ttg$, 11, $ttg$12.5$ttg$, 13.77, 406500),
  ($ttg$TTG-R-1806-11MM-13$ttg$, 11, $ttg$13$ttg$, 14.01, 413000),
  ($ttg$TTG-R-1806-11MM-13.5$ttg$, 11, $ttg$13.5$ttg$, 14.245, 419500),
  ($ttg$TTG-R-1806-11MM-14$ttg$, 11, $ttg$14$ttg$, 14.48, 426500),
  ($ttg$TTG-R-1806-11MM-14.5$ttg$, 11, $ttg$14.5$ttg$, 14.715, 433000),
  ($ttg$TTG-R-1806-11MM-15$ttg$, 11, $ttg$15$ttg$, 14.95, 439500),
  ($ttg$TTG-R-1806-11MM-15.5$ttg$, 11, $ttg$15.5$ttg$, 15.185, 446000),
  ($ttg$TTG-R-1806-11MM-16$ttg$, 11, $ttg$16$ttg$, 15.42, 453000),
  ($ttg$TTG-R-1806-12MM-4$ttg$, 12, $ttg$4$ttg$, 10.64, 318500),
  ($ttg$TTG-R-1806-12MM-4.5$ttg$, 12, $ttg$4.5$ttg$, 10.895, 325500),
  ($ttg$TTG-R-1806-12MM-5$ttg$, 12, $ttg$5$ttg$, 11.15, 332500),
  ($ttg$TTG-R-1806-12MM-5.5$ttg$, 12, $ttg$5.5$ttg$, 11.41, 340000),
  ($ttg$TTG-R-1806-12MM-6$ttg$, 12, $ttg$6$ttg$, 11.67, 347500),
  ($ttg$TTG-R-1806-12MM-6.5$ttg$, 12, $ttg$6.5$ttg$, 11.925, 354500),
  ($ttg$TTG-R-1806-12MM-7$ttg$, 12, $ttg$7$ttg$, 12.18, 361500),
  ($ttg$TTG-R-1806-12MM-7.5$ttg$, 12, $ttg$7.5$ttg$, 12.44, 369000),
  ($ttg$TTG-R-1806-12MM-8$ttg$, 12, $ttg$8$ttg$, 12.7, 376000),
  ($ttg$TTG-R-1806-12MM-8.5$ttg$, 12, $ttg$8.5$ttg$, 12.96, 383500),
  ($ttg$TTG-R-1806-12MM-9$ttg$, 12, $ttg$9$ttg$, 13.22, 391000),
  ($ttg$TTG-R-1806-12MM-9.5$ttg$, 12, $ttg$9.5$ttg$, 13.475, 398000),
  ($ttg$TTG-R-1806-12MM-10$ttg$, 12, $ttg$10$ttg$, 13.73, 405500),
  ($ttg$TTG-R-1806-12MM-10.5$ttg$, 12, $ttg$10.5$ttg$, 13.985, 412500),
  ($ttg$TTG-R-1806-12MM-11$ttg$, 12, $ttg$11$ttg$, 14.24, 419500),
  ($ttg$TTG-R-1806-12MM-11.5$ttg$, 12, $ttg$11.5$ttg$, 14.5, 427000),
  ($ttg$TTG-R-1806-12MM-12$ttg$, 12, $ttg$12$ttg$, 14.76, 434000),
  ($ttg$TTG-R-1806-12MM-12.5$ttg$, 12, $ttg$12.5$ttg$, 15.02, 441500),
  ($ttg$TTG-R-1806-12MM-13$ttg$, 12, $ttg$13$ttg$, 15.28, 449000),
  ($ttg$TTG-R-1806-12MM-13.5$ttg$, 12, $ttg$13.5$ttg$, 15.535, 456000),
  ($ttg$TTG-R-1806-12MM-14$ttg$, 12, $ttg$14$ttg$, 15.79, 463500),
  ($ttg$TTG-R-1806-12MM-14.5$ttg$, 12, $ttg$14.5$ttg$, 16.05, 470500),
  ($ttg$TTG-R-1806-12MM-15$ttg$, 12, $ttg$15$ttg$, 16.31, 478000),
  ($ttg$TTG-R-1806-12MM-15.5$ttg$, 12, $ttg$15.5$ttg$, 16.57, 485000),
  ($ttg$TTG-R-1806-12MM-16$ttg$, 12, $ttg$16$ttg$, 16.83, 492500);

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
