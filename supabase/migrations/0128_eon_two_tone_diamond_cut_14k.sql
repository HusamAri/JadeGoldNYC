-- 0128_eon_two_tone_diamond_cut_14k.sql
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, 14K solid gold (TTG-R-1406).
--
-- YENI STIL. Mevcut 39 listing bes profilde toplaniyordu (01 Dome, 02 Flat,
-- 03 Beveled, 04 Milgrain, 05 Knife Edge); bu altincisi: basamakli sari altin
-- raylar + yuksek beyaz altin merkez, merkez florentine zemin uzerine elmas
-- kesim kafes deseniyle islenmis. Panelde LISTING ONERISI olarak durur
-- (status='draft', etsy_listing_id null) — Etsy'ye gonderim ayri adim.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>. Yeni renk kodu TTG
-- (Two-Tone Gold), profil 06. 10K/18K kardesleri TTG-R-1006 (0127) /
-- TTG-R-1806 (0129) ile ayni varyant ekseninde.
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
--   Liste araligi $940.00 - $3,415.00 · gorunen
--   $705.00 - $2,561.25.
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
  $ttg$TTG-R-1406$ttg$,
  $ttg$14K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 12mm, Anniversary Gift for Him$ttg$,
  $ttg$A solid 14k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge, and 14k holds that line hard through daily wear. The white center is brushed flat, then cut through, so every facet catches a point of light while the ground behind it stays soft.

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
[EON 42 - TTG-R-1406 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 7 (6-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$14k solid gold ring$ttg$,$ttg$14k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$wide wedding band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  ARRAY[$ttg$Solid 14k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  94000,
  20,
  true,
  $ttg$/eon/ttg-r-1406/01.jpg$ttg$,
  5,
  $ttg$14k two tone diamond cut wedding band$ttg$,
  42
from public.organizations o
where o.name = 'EON'
  and not exists (
    select 1 from public.products p
    where p.org_id = o.id and p.sku = $ttg$TTG-R-1406$ttg$
  );

-- Yeniden calistirmada metin/etiket alanlarini kanonik surumle esitle
-- (Etsy'ye gonderilmis kayitta etsy_listing_id dolu olur; yine de panel
-- kunyesi tek kaynakta kalsin diye guncellenir).
update public.products p set
  title = $ttg$14K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, White and Yellow Gold Comfort Fit, 6mm to 12mm, Anniversary Gift for Him$ttg$,
  description = $ttg$A solid 14k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 14k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge, and 14k holds that line hard through daily wear. The white center is brushed flat, then cut through, so every facet catches a point of light while the ground behind it stays soft.

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
[EON 42 - TTG-R-1406 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 7 (6-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$14k solid gold ring$ttg$,$ttg$14k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$wide wedding band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 14k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$14k two tone diamond cut wedding band$ttg$,
  research_group = 42,
  image_url = $ttg$/eon/ttg-r-1406/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1406$ttg$;

-- ==== Varyantlar: 7 genislik x 25 beden = 175 ====
-- price_cents = ETSY LISTE (Etsy'ye girilen). Gorunen fiyat liste x 0.75.

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
  ($ttg$TTG-R-1406-6MM-4$ttg$, 6, $ttg$4$ttg$, 4.67, 94000),
  ($ttg$TTG-R-1406-6MM-4.5$ttg$, 6, $ttg$4.5$ttg$, 4.78, 95500),
  ($ttg$TTG-R-1406-6MM-5$ttg$, 6, $ttg$5$ttg$, 4.89, 97500),
  ($ttg$TTG-R-1406-6MM-5.5$ttg$, 6, $ttg$5.5$ttg$, 5.005, 99500),
  ($ttg$TTG-R-1406-6MM-6$ttg$, 6, $ttg$6$ttg$, 5.12, 101500),
  ($ttg$TTG-R-1406-6MM-6.5$ttg$, 6, $ttg$6.5$ttg$, 5.23, 103500),
  ($ttg$TTG-R-1406-6MM-7$ttg$, 6, $ttg$7$ttg$, 5.34, 105000),
  ($ttg$TTG-R-1406-6MM-7.5$ttg$, 6, $ttg$7.5$ttg$, 5.455, 107000),
  ($ttg$TTG-R-1406-6MM-8$ttg$, 6, $ttg$8$ttg$, 5.57, 109000),
  ($ttg$TTG-R-1406-6MM-8.5$ttg$, 6, $ttg$8.5$ttg$, 5.685, 111000),
  ($ttg$TTG-R-1406-6MM-9$ttg$, 6, $ttg$9$ttg$, 5.8, 113000),
  ($ttg$TTG-R-1406-6MM-9.5$ttg$, 6, $ttg$9.5$ttg$, 5.91, 115000),
  ($ttg$TTG-R-1406-6MM-10$ttg$, 6, $ttg$10$ttg$, 6.02, 117000),
  ($ttg$TTG-R-1406-6MM-10.5$ttg$, 6, $ttg$10.5$ttg$, 6.135, 119000),
  ($ttg$TTG-R-1406-6MM-11$ttg$, 6, $ttg$11$ttg$, 6.25, 120500),
  ($ttg$TTG-R-1406-6MM-11.5$ttg$, 6, $ttg$11.5$ttg$, 6.36, 122500),
  ($ttg$TTG-R-1406-6MM-12$ttg$, 6, $ttg$12$ttg$, 6.47, 124500),
  ($ttg$TTG-R-1406-6MM-12.5$ttg$, 6, $ttg$12.5$ttg$, 6.585, 126500),
  ($ttg$TTG-R-1406-6MM-13$ttg$, 6, $ttg$13$ttg$, 6.7, 128000),
  ($ttg$TTG-R-1406-6MM-13.5$ttg$, 6, $ttg$13.5$ttg$, 6.815, 130000),
  ($ttg$TTG-R-1406-6MM-14$ttg$, 6, $ttg$14$ttg$, 6.93, 132000),
  ($ttg$TTG-R-1406-6MM-14.5$ttg$, 6, $ttg$14.5$ttg$, 7.04, 134000),
  ($ttg$TTG-R-1406-6MM-15$ttg$, 6, $ttg$15$ttg$, 7.15, 136000),
  ($ttg$TTG-R-1406-6MM-15.5$ttg$, 6, $ttg$15.5$ttg$, 7.265, 138000),
  ($ttg$TTG-R-1406-6MM-16$ttg$, 6, $ttg$16$ttg$, 7.38, 140000),
  ($ttg$TTG-R-1406-7MM-4$ttg$, 7, $ttg$4$ttg$, 5.44, 107000),
  ($ttg$TTG-R-1406-7MM-4.5$ttg$, 7, $ttg$4.5$ttg$, 5.575, 109000),
  ($ttg$TTG-R-1406-7MM-5$ttg$, 7, $ttg$5$ttg$, 5.71, 111500),
  ($ttg$TTG-R-1406-7MM-5.5$ttg$, 7, $ttg$5.5$ttg$, 5.84, 113500),
  ($ttg$TTG-R-1406-7MM-6$ttg$, 7, $ttg$6$ttg$, 5.97, 116000),
  ($ttg$TTG-R-1406-7MM-6.5$ttg$, 7, $ttg$6.5$ttg$, 6.1, 118000),
  ($ttg$TTG-R-1406-7MM-7$ttg$, 7, $ttg$7$ttg$, 6.23, 120500),
  ($ttg$TTG-R-1406-7MM-7.5$ttg$, 7, $ttg$7.5$ttg$, 6.365, 122500),
  ($ttg$TTG-R-1406-7MM-8$ttg$, 7, $ttg$8$ttg$, 6.5, 125000),
  ($ttg$TTG-R-1406-7MM-8.5$ttg$, 7, $ttg$8.5$ttg$, 6.63, 127000),
  ($ttg$TTG-R-1406-7MM-9$ttg$, 7, $ttg$9$ttg$, 6.76, 129500),
  ($ttg$TTG-R-1406-7MM-9.5$ttg$, 7, $ttg$9.5$ttg$, 6.895, 131500),
  ($ttg$TTG-R-1406-7MM-10$ttg$, 7, $ttg$10$ttg$, 7.03, 134000),
  ($ttg$TTG-R-1406-7MM-10.5$ttg$, 7, $ttg$10.5$ttg$, 7.16, 136000),
  ($ttg$TTG-R-1406-7MM-11$ttg$, 7, $ttg$11$ttg$, 7.29, 138000),
  ($ttg$TTG-R-1406-7MM-11.5$ttg$, 7, $ttg$11.5$ttg$, 7.42, 140500),
  ($ttg$TTG-R-1406-7MM-12$ttg$, 7, $ttg$12$ttg$, 7.55, 142500),
  ($ttg$TTG-R-1406-7MM-12.5$ttg$, 7, $ttg$12.5$ttg$, 7.685, 145000),
  ($ttg$TTG-R-1406-7MM-13$ttg$, 7, $ttg$13$ttg$, 7.82, 147500),
  ($ttg$TTG-R-1406-7MM-13.5$ttg$, 7, $ttg$13.5$ttg$, 7.95, 149500),
  ($ttg$TTG-R-1406-7MM-14$ttg$, 7, $ttg$14$ttg$, 8.08, 151500),
  ($ttg$TTG-R-1406-7MM-14.5$ttg$, 7, $ttg$14.5$ttg$, 8.215, 154000),
  ($ttg$TTG-R-1406-7MM-15$ttg$, 7, $ttg$15$ttg$, 8.35, 156000),
  ($ttg$TTG-R-1406-7MM-15.5$ttg$, 7, $ttg$15.5$ttg$, 8.48, 158500),
  ($ttg$TTG-R-1406-7MM-16$ttg$, 7, $ttg$16$ttg$, 8.61, 160500),
  ($ttg$TTG-R-1406-8MM-4$ttg$, 8, $ttg$4$ttg$, 6.22, 155000),
  ($ttg$TTG-R-1406-8MM-4.5$ttg$, 8, $ttg$4.5$ttg$, 6.37, 158000),
  ($ttg$TTG-R-1406-8MM-5$ttg$, 8, $ttg$5$ttg$, 6.52, 161500),
  ($ttg$TTG-R-1406-8MM-5.5$ttg$, 8, $ttg$5.5$ttg$, 6.67, 165000),
  ($ttg$TTG-R-1406-8MM-6$ttg$, 8, $ttg$6$ttg$, 6.82, 168000),
  ($ttg$TTG-R-1406-8MM-6.5$ttg$, 8, $ttg$6.5$ttg$, 6.975, 171500),
  ($ttg$TTG-R-1406-8MM-7$ttg$, 8, $ttg$7$ttg$, 7.13, 175000),
  ($ttg$TTG-R-1406-8MM-7.5$ttg$, 8, $ttg$7.5$ttg$, 7.28, 178000),
  ($ttg$TTG-R-1406-8MM-8$ttg$, 8, $ttg$8$ttg$, 7.43, 181500),
  ($ttg$TTG-R-1406-8MM-8.5$ttg$, 8, $ttg$8.5$ttg$, 7.58, 185000),
  ($ttg$TTG-R-1406-8MM-9$ttg$, 8, $ttg$9$ttg$, 7.73, 188000),
  ($ttg$TTG-R-1406-8MM-9.5$ttg$, 8, $ttg$9.5$ttg$, 7.88, 191500),
  ($ttg$TTG-R-1406-8MM-10$ttg$, 8, $ttg$10$ttg$, 8.03, 194500),
  ($ttg$TTG-R-1406-8MM-10.5$ttg$, 8, $ttg$10.5$ttg$, 8.18, 198000),
  ($ttg$TTG-R-1406-8MM-11$ttg$, 8, $ttg$11$ttg$, 8.33, 201000),
  ($ttg$TTG-R-1406-8MM-11.5$ttg$, 8, $ttg$11.5$ttg$, 8.48, 204500),
  ($ttg$TTG-R-1406-8MM-12$ttg$, 8, $ttg$12$ttg$, 8.63, 207500),
  ($ttg$TTG-R-1406-8MM-12.5$ttg$, 8, $ttg$12.5$ttg$, 8.78, 211000),
  ($ttg$TTG-R-1406-8MM-13$ttg$, 8, $ttg$13$ttg$, 8.93, 214000),
  ($ttg$TTG-R-1406-8MM-13.5$ttg$, 8, $ttg$13.5$ttg$, 9.085, 217500),
  ($ttg$TTG-R-1406-8MM-14$ttg$, 8, $ttg$14$ttg$, 9.24, 221000),
  ($ttg$TTG-R-1406-8MM-14.5$ttg$, 8, $ttg$14.5$ttg$, 9.39, 224500),
  ($ttg$TTG-R-1406-8MM-15$ttg$, 8, $ttg$15$ttg$, 9.54, 227500),
  ($ttg$TTG-R-1406-8MM-15.5$ttg$, 8, $ttg$15.5$ttg$, 9.69, 231000),
  ($ttg$TTG-R-1406-8MM-16$ttg$, 8, $ttg$16$ttg$, 9.84, 234000),
  ($ttg$TTG-R-1406-9MM-4$ttg$, 9, $ttg$4$ttg$, 7, 172000),
  ($ttg$TTG-R-1406-9MM-4.5$ttg$, 9, $ttg$4.5$ttg$, 7.17, 175500),
  ($ttg$TTG-R-1406-9MM-5$ttg$, 9, $ttg$5$ttg$, 7.34, 179500),
  ($ttg$TTG-R-1406-9MM-5.5$ttg$, 9, $ttg$5.5$ttg$, 7.51, 183000),
  ($ttg$TTG-R-1406-9MM-6$ttg$, 9, $ttg$6$ttg$, 7.68, 187000),
  ($ttg$TTG-R-1406-9MM-6.5$ttg$, 9, $ttg$6.5$ttg$, 7.85, 190500),
  ($ttg$TTG-R-1406-9MM-7$ttg$, 9, $ttg$7$ttg$, 8.02, 194500),
  ($ttg$TTG-R-1406-9MM-7.5$ttg$, 9, $ttg$7.5$ttg$, 8.19, 198000),
  ($ttg$TTG-R-1406-9MM-8$ttg$, 9, $ttg$8$ttg$, 8.36, 202000),
  ($ttg$TTG-R-1406-9MM-8.5$ttg$, 9, $ttg$8.5$ttg$, 8.525, 205500),
  ($ttg$TTG-R-1406-9MM-9$ttg$, 9, $ttg$9$ttg$, 8.69, 209000),
  ($ttg$TTG-R-1406-9MM-9.5$ttg$, 9, $ttg$9.5$ttg$, 8.86, 213000),
  ($ttg$TTG-R-1406-9MM-10$ttg$, 9, $ttg$10$ttg$, 9.03, 216500),
  ($ttg$TTG-R-1406-9MM-10.5$ttg$, 9, $ttg$10.5$ttg$, 9.2, 220000),
  ($ttg$TTG-R-1406-9MM-11$ttg$, 9, $ttg$11$ttg$, 9.37, 224000),
  ($ttg$TTG-R-1406-9MM-11.5$ttg$, 9, $ttg$11.5$ttg$, 9.54, 227500),
  ($ttg$TTG-R-1406-9MM-12$ttg$, 9, $ttg$12$ttg$, 9.71, 231500),
  ($ttg$TTG-R-1406-9MM-12.5$ttg$, 9, $ttg$12.5$ttg$, 9.88, 235000),
  ($ttg$TTG-R-1406-9MM-13$ttg$, 9, $ttg$13$ttg$, 10.05, 239000),
  ($ttg$TTG-R-1406-9MM-13.5$ttg$, 9, $ttg$13.5$ttg$, 10.22, 242500),
  ($ttg$TTG-R-1406-9MM-14$ttg$, 9, $ttg$14$ttg$, 10.39, 246000),
  ($ttg$TTG-R-1406-9MM-14.5$ttg$, 9, $ttg$14.5$ttg$, 10.56, 250000),
  ($ttg$TTG-R-1406-9MM-15$ttg$, 9, $ttg$15$ttg$, 10.73, 253500),
  ($ttg$TTG-R-1406-9MM-15.5$ttg$, 9, $ttg$15.5$ttg$, 10.9, 257500),
  ($ttg$TTG-R-1406-9MM-16$ttg$, 9, $ttg$16$ttg$, 11.07, 261000),
  ($ttg$TTG-R-1406-10MM-4$ttg$, 10, $ttg$4$ttg$, 7.78, 189000),
  ($ttg$TTG-R-1406-10MM-4.5$ttg$, 10, $ttg$4.5$ttg$, 7.965, 193000),
  ($ttg$TTG-R-1406-10MM-5$ttg$, 10, $ttg$5$ttg$, 8.15, 197000),
  ($ttg$TTG-R-1406-10MM-5.5$ttg$, 10, $ttg$5.5$ttg$, 8.34, 201500),
  ($ttg$TTG-R-1406-10MM-6$ttg$, 10, $ttg$6$ttg$, 8.53, 205500),
  ($ttg$TTG-R-1406-10MM-6.5$ttg$, 10, $ttg$6.5$ttg$, 8.72, 209500),
  ($ttg$TTG-R-1406-10MM-7$ttg$, 10, $ttg$7$ttg$, 8.91, 214000),
  ($ttg$TTG-R-1406-10MM-7.5$ttg$, 10, $ttg$7.5$ttg$, 9.095, 218000),
  ($ttg$TTG-R-1406-10MM-8$ttg$, 10, $ttg$8$ttg$, 9.28, 222000),
  ($ttg$TTG-R-1406-10MM-8.5$ttg$, 10, $ttg$8.5$ttg$, 9.47, 226000),
  ($ttg$TTG-R-1406-10MM-9$ttg$, 10, $ttg$9$ttg$, 9.66, 230000),
  ($ttg$TTG-R-1406-10MM-9.5$ttg$, 10, $ttg$9.5$ttg$, 9.85, 234500),
  ($ttg$TTG-R-1406-10MM-10$ttg$, 10, $ttg$10$ttg$, 10.04, 238500),
  ($ttg$TTG-R-1406-10MM-10.5$ttg$, 10, $ttg$10.5$ttg$, 10.225, 242500),
  ($ttg$TTG-R-1406-10MM-11$ttg$, 10, $ttg$11$ttg$, 10.41, 246500),
  ($ttg$TTG-R-1406-10MM-11.5$ttg$, 10, $ttg$11.5$ttg$, 10.6, 251000),
  ($ttg$TTG-R-1406-10MM-12$ttg$, 10, $ttg$12$ttg$, 10.79, 255000),
  ($ttg$TTG-R-1406-10MM-12.5$ttg$, 10, $ttg$12.5$ttg$, 10.98, 259000),
  ($ttg$TTG-R-1406-10MM-13$ttg$, 10, $ttg$13$ttg$, 11.17, 263500),
  ($ttg$TTG-R-1406-10MM-13.5$ttg$, 10, $ttg$13.5$ttg$, 11.36, 267500),
  ($ttg$TTG-R-1406-10MM-14$ttg$, 10, $ttg$14$ttg$, 11.55, 271500),
  ($ttg$TTG-R-1406-10MM-14.5$ttg$, 10, $ttg$14.5$ttg$, 11.735, 275500),
  ($ttg$TTG-R-1406-10MM-15$ttg$, 10, $ttg$15$ttg$, 11.92, 279500),
  ($ttg$TTG-R-1406-10MM-15.5$ttg$, 10, $ttg$15.5$ttg$, 12.11, 284000),
  ($ttg$TTG-R-1406-10MM-16$ttg$, 10, $ttg$16$ttg$, 12.3, 288000),
  ($ttg$TTG-R-1406-11MM-4$ttg$, 11, $ttg$4$ttg$, 8.55, 206000),
  ($ttg$TTG-R-1406-11MM-4.5$ttg$, 11, $ttg$4.5$ttg$, 8.76, 210500),
  ($ttg$TTG-R-1406-11MM-5$ttg$, 11, $ttg$5$ttg$, 8.97, 215000),
  ($ttg$TTG-R-1406-11MM-5.5$ttg$, 11, $ttg$5.5$ttg$, 9.175, 219500),
  ($ttg$TTG-R-1406-11MM-6$ttg$, 11, $ttg$6$ttg$, 9.38, 224000),
  ($ttg$TTG-R-1406-11MM-6.5$ttg$, 11, $ttg$6.5$ttg$, 9.59, 228500),
  ($ttg$TTG-R-1406-11MM-7$ttg$, 11, $ttg$7$ttg$, 9.8, 233500),
  ($ttg$TTG-R-1406-11MM-7.5$ttg$, 11, $ttg$7.5$ttg$, 10.005, 237500),
  ($ttg$TTG-R-1406-11MM-8$ttg$, 11, $ttg$8$ttg$, 10.21, 242000),
  ($ttg$TTG-R-1406-11MM-8.5$ttg$, 11, $ttg$8.5$ttg$, 10.42, 247000),
  ($ttg$TTG-R-1406-11MM-9$ttg$, 11, $ttg$9$ttg$, 10.63, 251500),
  ($ttg$TTG-R-1406-11MM-9.5$ttg$, 11, $ttg$9.5$ttg$, 10.835, 256000),
  ($ttg$TTG-R-1406-11MM-10$ttg$, 11, $ttg$10$ttg$, 11.04, 260500),
  ($ttg$TTG-R-1406-11MM-10.5$ttg$, 11, $ttg$10.5$ttg$, 11.25, 265000),
  ($ttg$TTG-R-1406-11MM-11$ttg$, 11, $ttg$11$ttg$, 11.46, 269500),
  ($ttg$TTG-R-1406-11MM-11.5$ttg$, 11, $ttg$11.5$ttg$, 11.665, 274000),
  ($ttg$TTG-R-1406-11MM-12$ttg$, 11, $ttg$12$ttg$, 11.87, 278500),
  ($ttg$TTG-R-1406-11MM-12.5$ttg$, 11, $ttg$12.5$ttg$, 12.08, 283000),
  ($ttg$TTG-R-1406-11MM-13$ttg$, 11, $ttg$13$ttg$, 12.29, 287500),
  ($ttg$TTG-R-1406-11MM-13.5$ttg$, 11, $ttg$13.5$ttg$, 12.495, 292000),
  ($ttg$TTG-R-1406-11MM-14$ttg$, 11, $ttg$14$ttg$, 12.7, 297000),
  ($ttg$TTG-R-1406-11MM-14.5$ttg$, 11, $ttg$14.5$ttg$, 12.905, 301000),
  ($ttg$TTG-R-1406-11MM-15$ttg$, 11, $ttg$15$ttg$, 13.11, 305500),
  ($ttg$TTG-R-1406-11MM-15.5$ttg$, 11, $ttg$15.5$ttg$, 13.32, 310000),
  ($ttg$TTG-R-1406-11MM-16$ttg$, 11, $ttg$16$ttg$, 13.53, 315000),
  ($ttg$TTG-R-1406-12MM-4$ttg$, 12, $ttg$4$ttg$, 9.33, 223000),
  ($ttg$TTG-R-1406-12MM-4.5$ttg$, 12, $ttg$4.5$ttg$, 9.555, 228000),
  ($ttg$TTG-R-1406-12MM-5$ttg$, 12, $ttg$5$ttg$, 9.78, 233000),
  ($ttg$TTG-R-1406-12MM-5.5$ttg$, 12, $ttg$5.5$ttg$, 10.01, 238000),
  ($ttg$TTG-R-1406-12MM-6$ttg$, 12, $ttg$6$ttg$, 10.24, 243000),
  ($ttg$TTG-R-1406-12MM-6.5$ttg$, 12, $ttg$6.5$ttg$, 10.465, 248000),
  ($ttg$TTG-R-1406-12MM-7$ttg$, 12, $ttg$7$ttg$, 10.69, 253000),
  ($ttg$TTG-R-1406-12MM-7.5$ttg$, 12, $ttg$7.5$ttg$, 10.915, 257500),
  ($ttg$TTG-R-1406-12MM-8$ttg$, 12, $ttg$8$ttg$, 11.14, 262500),
  ($ttg$TTG-R-1406-12MM-8.5$ttg$, 12, $ttg$8.5$ttg$, 11.365, 267500),
  ($ttg$TTG-R-1406-12MM-9$ttg$, 12, $ttg$9$ttg$, 11.59, 272500),
  ($ttg$TTG-R-1406-12MM-9.5$ttg$, 12, $ttg$9.5$ttg$, 11.815, 277500),
  ($ttg$TTG-R-1406-12MM-10$ttg$, 12, $ttg$10$ttg$, 12.04, 282000),
  ($ttg$TTG-R-1406-12MM-10.5$ttg$, 12, $ttg$10.5$ttg$, 12.27, 287500),
  ($ttg$TTG-R-1406-12MM-11$ttg$, 12, $ttg$11$ttg$, 12.5, 292500),
  ($ttg$TTG-R-1406-12MM-11.5$ttg$, 12, $ttg$11.5$ttg$, 12.725, 297500),
  ($ttg$TTG-R-1406-12MM-12$ttg$, 12, $ttg$12$ttg$, 12.95, 302000),
  ($ttg$TTG-R-1406-12MM-12.5$ttg$, 12, $ttg$12.5$ttg$, 13.175, 307000),
  ($ttg$TTG-R-1406-12MM-13$ttg$, 12, $ttg$13$ttg$, 13.4, 312000),
  ($ttg$TTG-R-1406-12MM-13.5$ttg$, 12, $ttg$13.5$ttg$, 13.625, 317000),
  ($ttg$TTG-R-1406-12MM-14$ttg$, 12, $ttg$14$ttg$, 13.85, 322000),
  ($ttg$TTG-R-1406-12MM-14.5$ttg$, 12, $ttg$14.5$ttg$, 14.08, 327000),
  ($ttg$TTG-R-1406-12MM-15$ttg$, 12, $ttg$15$ttg$, 14.31, 332000),
  ($ttg$TTG-R-1406-12MM-15.5$ttg$, 12, $ttg$15.5$ttg$, 14.535, 337000),
  ($ttg$TTG-R-1406-12MM-16$ttg$, 12, $ttg$16$ttg$, 14.76, 341500);

insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  t.sku,
  p.id,
  jsonb_build_object(
    'Karat', $ttg$14K$ttg$,
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
join public.products p on p.sku = $ttg$TTG-R-1406$ttg$
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
  where v.weight_source = 'catalog_ttg' and pp.sku = $ttg$TTG-R-1406$ttg$
  group by v.product_id
) m
where m.product_id = p.id;

-- ==== Galeri: 5 gorsel (repo public/ altinda, kok-goreli URL) ====
-- Kaynak baytlar public/eon/ttg-r-1406/*.jpg — meta veri sokulmus
-- (bkz. second-brain "disa cikan gorselden koken meta verisi sok").
-- Etsy sirasi: 01 hero (mavi kutu), 02 elde (olcek), 03 krem kutu, 04 makro, 05 kahve kutu.

delete from public.listing_images li
using public.products p
where li.product_id = p.id
  and p.sku = $ttg$TTG-R-1406$ttg$
  and li.url like $ttg$/eon/ttg-r-1406/%$ttg$;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, v.url, 'url', v.alt, v.position
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
cross join (values
  ($ttg$/eon/ttg-r-1406/01.jpg$ttg$, $ttg$14k solid gold two tone wedding band, yellow gold rails around a diamond-cut white gold center, in a blue ring box$ttg$, 0),
  ($ttg$/eon/ttg-r-1406/02.jpg$ttg$, $ttg$Two tone 14k gold diamond cut wedding band worn on a hand$ttg$, 1),
  ($ttg$/eon/ttg-r-1406/03.jpg$ttg$, $ttg$14k two tone gold wedding band standing in a cream suede ring box$ttg$, 2),
  ($ttg$/eon/ttg-r-1406/04.jpg$ttg$, $ttg$Macro detail of the diamond-cut lattice on the white gold center$ttg$, 3),
  ($ttg$/eon/ttg-r-1406/05.jpg$ttg$, $ttg$14k two tone gold wedding band in a brown leather gift box$ttg$, 4)
) as v(url, alt, position)
where p.sku = $ttg$TTG-R-1406$ttg$;
