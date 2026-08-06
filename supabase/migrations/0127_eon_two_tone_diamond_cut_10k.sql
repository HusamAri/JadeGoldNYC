-- 0127_eon_two_tone_diamond_cut_10k.sql
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, 10K solid gold (TTG-R-1006).
--
-- YENI STIL. Mevcut 39 listing bes profilde toplaniyordu (01 Dome, 02 Flat,
-- 03 Beveled, 04 Milgrain, 05 Knife Edge); bu altincisi: basamakli sari altin
-- raylar + yuksek beyaz altin merkez, merkez florentine zemin uzerine elmas
-- kesim kafes deseniyle islenmis. Panelde LISTING ONERISI olarak durur
-- (status='draft', etsy_listing_id null) — Etsy'ye gonderim ayri adim.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>. Yeni renk kodu TTG
-- (Two-Tone Gold), profil 06. 14K/18K kardesleri TTG-R-1406 (0128) /
-- TTG-R-1806 (0129) ile ayni desende acilir.
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
--   Liste araligi $645.00 - $2,220.00 · gorunen
--   $483.75 - $1,665.00.
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
  $ttg$TTG-R-1006$ttg$,
  $ttg$10K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit$ttg$,
  $ttg$A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge. The white center is brushed flat, then cut through, so every facet catches a hard point of light while the ground behind it stays soft. Three finishes on one band, and the gold runs solid under all of them.

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
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 7 (6-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$10k solid gold ring$ttg$,$ttg$10k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$wide wedding band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  ARRAY[$ttg$Solid 10k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  'draft',
  'USD',
  64500,
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
  title = $ttg$10K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit$ttg$,
  description = $ttg$A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 6mm through 12mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

The two colors do the work here. The yellow rails carry one continuous polished line down each edge. The white center is brushed flat, then cut through, so every facet catches a hard point of light while the ground behind it stays soft. Three finishes on one band, and the gold runs solid under all of them.

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
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 7 (6-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$ttg$,
  tags = ARRAY[$ttg$two tone gold ring$ttg$,$ttg$diamond cut band$ttg$,$ttg$white gold inlay$ttg$,$ttg$10k solid gold ring$ttg$,$ttg$10k wedding band$ttg$,$ttg$mens wedding band$ttg$,$ttg$unisex wedding band$ttg$,$ttg$womens gold ring$ttg$,$ttg$wide wedding band$ttg$,$ttg$wide gold ring$ttg$,$ttg$comfort fit band$ttg$,$ttg$engraved gold band$ttg$,$ttg$anniversary ring$ttg$]::text[],
  materials = ARRAY[$ttg$Solid 10k gold$ttg$,$ttg$Yellow gold$ttg$,$ttg$White gold$ttg$]::text[],
  research_keyword = $ttg$10k two tone diamond cut wedding band$ttg$,
  research_group = 40,
  image_url = $ttg$/eon/ttg-r-1006/01.jpg$ttg$,
  num_images = 5,
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = $ttg$TTG-R-1006$ttg$;

-- ==== Varyantlar: 7 genislik x 25 beden = 175 ====
-- price_cents = ETSY LISTE (Etsy'ye girilen). Gorunen fiyat liste x 0.75.

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values
  ($ttg$TTG-R-1006-6MM-4$ttg$, 6, $ttg$4$ttg$, 4.11, 64500),
  ($ttg$TTG-R-1006-6MM-4.5$ttg$, 6, $ttg$4.5$ttg$, 4.205, 65500),
  ($ttg$TTG-R-1006-6MM-5$ttg$, 6, $ttg$5$ttg$, 4.3, 67000),
  ($ttg$TTG-R-1006-6MM-5.5$ttg$, 6, $ttg$5.5$ttg$, 4.4, 68000),
  ($ttg$TTG-R-1006-6MM-6$ttg$, 6, $ttg$6$ttg$, 4.5, 69500),
  ($ttg$TTG-R-1006-6MM-6.5$ttg$, 6, $ttg$6.5$ttg$, 4.6, 70500),
  ($ttg$TTG-R-1006-6MM-7$ttg$, 6, $ttg$7$ttg$, 4.7, 71500),
  ($ttg$TTG-R-1006-6MM-7.5$ttg$, 6, $ttg$7.5$ttg$, 4.8, 73000),
  ($ttg$TTG-R-1006-6MM-8$ttg$, 6, $ttg$8$ttg$, 4.9, 74000),
  ($ttg$TTG-R-1006-6MM-8.5$ttg$, 6, $ttg$8.5$ttg$, 5.0, 75500),
  ($ttg$TTG-R-1006-6MM-9$ttg$, 6, $ttg$9$ttg$, 5.1, 76500),
  ($ttg$TTG-R-1006-6MM-9.5$ttg$, 6, $ttg$9.5$ttg$, 5.2, 77500),
  ($ttg$TTG-R-1006-6MM-10$ttg$, 6, $ttg$10$ttg$, 5.3, 79000),
  ($ttg$TTG-R-1006-6MM-10.5$ttg$, 6, $ttg$10.5$ttg$, 5.4, 80000),
  ($ttg$TTG-R-1006-6MM-11$ttg$, 6, $ttg$11$ttg$, 5.5, 81500),
  ($ttg$TTG-R-1006-6MM-11.5$ttg$, 6, $ttg$11.5$ttg$, 5.6, 82500),
  ($ttg$TTG-R-1006-6MM-12$ttg$, 6, $ttg$12$ttg$, 5.7, 84000),
  ($ttg$TTG-R-1006-6MM-12.5$ttg$, 6, $ttg$12.5$ttg$, 5.8, 85000),
  ($ttg$TTG-R-1006-6MM-13$ttg$, 6, $ttg$13$ttg$, 5.9, 86000),
  ($ttg$TTG-R-1006-6MM-13.5$ttg$, 6, $ttg$13.5$ttg$, 6.0, 87500),
  ($ttg$TTG-R-1006-6MM-14$ttg$, 6, $ttg$14$ttg$, 6.1, 88500),
  ($ttg$TTG-R-1006-6MM-14.5$ttg$, 6, $ttg$14.5$ttg$, 6.195, 90000),
  ($ttg$TTG-R-1006-6MM-15$ttg$, 6, $ttg$15$ttg$, 6.29, 91000),
  ($ttg$TTG-R-1006-6MM-15.5$ttg$, 6, $ttg$15.5$ttg$, 6.39, 92000),
  ($ttg$TTG-R-1006-6MM-16$ttg$, 6, $ttg$16$ttg$, 6.49, 93500),
  ($ttg$TTG-R-1006-7MM-4$ttg$, 7, $ttg$4$ttg$, 4.79, 73000),
  ($ttg$TTG-R-1006-7MM-4.5$ttg$, 7, $ttg$4.5$ttg$, 4.915, 74000),
  ($ttg$TTG-R-1006-7MM-5$ttg$, 7, $ttg$5$ttg$, 5.04, 76000),
  ($ttg$TTG-R-1006-7MM-5.5$ttg$, 7, $ttg$5.5$ttg$, 5.145, 77000),
  ($ttg$TTG-R-1006-7MM-6$ttg$, 7, $ttg$6$ttg$, 5.25, 78500),
  ($ttg$TTG-R-1006-7MM-6.5$ttg$, 7, $ttg$6.5$ttg$, 5.37, 80000),
  ($ttg$TTG-R-1006-7MM-7$ttg$, 7, $ttg$7$ttg$, 5.49, 81500),
  ($ttg$TTG-R-1006-7MM-7.5$ttg$, 7, $ttg$7.5$ttg$, 5.605, 82500),
  ($ttg$TTG-R-1006-7MM-8$ttg$, 7, $ttg$8$ttg$, 5.72, 84000),
  ($ttg$TTG-R-1006-7MM-8.5$ttg$, 7, $ttg$8.5$ttg$, 5.835, 85500),
  ($ttg$TTG-R-1006-7MM-9$ttg$, 7, $ttg$9$ttg$, 5.95, 87000),
  ($ttg$TTG-R-1006-7MM-9.5$ttg$, 7, $ttg$9.5$ttg$, 6.065, 88000),
  ($ttg$TTG-R-1006-7MM-10$ttg$, 7, $ttg$10$ttg$, 6.18, 89500),
  ($ttg$TTG-R-1006-7MM-10.5$ttg$, 7, $ttg$10.5$ttg$, 6.3, 91000),
  ($ttg$TTG-R-1006-7MM-11$ttg$, 7, $ttg$11$ttg$, 6.42, 92500),
  ($ttg$TTG-R-1006-7MM-11.5$ttg$, 7, $ttg$11.5$ttg$, 6.535, 94000),
  ($ttg$TTG-R-1006-7MM-12$ttg$, 7, $ttg$12$ttg$, 6.65, 95500),
  ($ttg$TTG-R-1006-7MM-12.5$ttg$, 7, $ttg$12.5$ttg$, 6.765, 97000),
  ($ttg$TTG-R-1006-7MM-13$ttg$, 7, $ttg$13$ttg$, 6.88, 98000),
  ($ttg$TTG-R-1006-7MM-13.5$ttg$, 7, $ttg$13.5$ttg$, 6.995, 99500),
  ($ttg$TTG-R-1006-7MM-14$ttg$, 7, $ttg$14$ttg$, 7.11, 101000),
  ($ttg$TTG-R-1006-7MM-14.5$ttg$, 7, $ttg$14.5$ttg$, 7.225, 102500),
  ($ttg$TTG-R-1006-7MM-15$ttg$, 7, $ttg$15$ttg$, 7.34, 103500),
  ($ttg$TTG-R-1006-7MM-15.5$ttg$, 7, $ttg$15.5$ttg$, 7.46, 105000),
  ($ttg$TTG-R-1006-7MM-16$ttg$, 7, $ttg$16$ttg$, 7.58, 106500),
  ($ttg$TTG-R-1006-8MM-4$ttg$, 8, $ttg$4$ttg$, 5.47, 104500),
  ($ttg$TTG-R-1006-8MM-4.5$ttg$, 8, $ttg$4.5$ttg$, 5.605, 106500),
  ($ttg$TTG-R-1006-8MM-5$ttg$, 8, $ttg$5$ttg$, 5.74, 109000),
  ($ttg$TTG-R-1006-8MM-5.5$ttg$, 8, $ttg$5.5$ttg$, 5.87, 111000),
  ($ttg$TTG-R-1006-8MM-6$ttg$, 8, $ttg$6$ttg$, 6, 113000),
  ($ttg$TTG-R-1006-8MM-6.5$ttg$, 8, $ttg$6.5$ttg$, 6.135, 115000),
  ($ttg$TTG-R-1006-8MM-7$ttg$, 8, $ttg$7$ttg$, 6.27, 117000),
  ($ttg$TTG-R-1006-8MM-7.5$ttg$, 8, $ttg$7.5$ttg$, 6.405, 119000),
  ($ttg$TTG-R-1006-8MM-8$ttg$, 8, $ttg$8$ttg$, 6.54, 121000),
  ($ttg$TTG-R-1006-8MM-8.5$ttg$, 8, $ttg$8.5$ttg$, 6.67, 123500),
  ($ttg$TTG-R-1006-8MM-9$ttg$, 8, $ttg$9$ttg$, 6.8, 125500),
  ($ttg$TTG-R-1006-8MM-9.5$ttg$, 8, $ttg$9.5$ttg$, 6.935, 127500),
  ($ttg$TTG-R-1006-8MM-10$ttg$, 8, $ttg$10$ttg$, 7.07, 129500),
  ($ttg$TTG-R-1006-8MM-10.5$ttg$, 8, $ttg$10.5$ttg$, 7.2, 131500),
  ($ttg$TTG-R-1006-8MM-11$ttg$, 8, $ttg$11$ttg$, 7.33, 133500),
  ($ttg$TTG-R-1006-8MM-11.5$ttg$, 8, $ttg$11.5$ttg$, 7.465, 135500),
  ($ttg$TTG-R-1006-8MM-12$ttg$, 8, $ttg$12$ttg$, 7.6, 138000),
  ($ttg$TTG-R-1006-8MM-12.5$ttg$, 8, $ttg$12.5$ttg$, 7.73, 140000),
  ($ttg$TTG-R-1006-8MM-13$ttg$, 8, $ttg$13$ttg$, 7.86, 142000),
  ($ttg$TTG-R-1006-8MM-13.5$ttg$, 8, $ttg$13.5$ttg$, 7.995, 144000),
  ($ttg$TTG-R-1006-8MM-14$ttg$, 8, $ttg$14$ttg$, 8.13, 146000),
  ($ttg$TTG-R-1006-8MM-14.5$ttg$, 8, $ttg$14.5$ttg$, 8.26, 148000),
  ($ttg$TTG-R-1006-8MM-15$ttg$, 8, $ttg$15$ttg$, 8.39, 150000),
  ($ttg$TTG-R-1006-8MM-15.5$ttg$, 8, $ttg$15.5$ttg$, 8.525, 152000),
  ($ttg$TTG-R-1006-8MM-16$ttg$, 8, $ttg$16$ttg$, 8.66, 154500),
  ($ttg$TTG-R-1006-9MM-4$ttg$, 9, $ttg$4$ttg$, 6.16, 115500),
  ($ttg$TTG-R-1006-9MM-4.5$ttg$, 9, $ttg$4.5$ttg$, 6.31, 117500),
  ($ttg$TTG-R-1006-9MM-5$ttg$, 9, $ttg$5$ttg$, 6.46, 120000),
  ($ttg$TTG-R-1006-9MM-5.5$ttg$, 9, $ttg$5.5$ttg$, 6.61, 122500),
  ($ttg$TTG-R-1006-9MM-6$ttg$, 9, $ttg$6$ttg$, 6.76, 124500),
  ($ttg$TTG-R-1006-9MM-6.5$ttg$, 9, $ttg$6.5$ttg$, 6.905, 127000),
  ($ttg$TTG-R-1006-9MM-7$ttg$, 9, $ttg$7$ttg$, 7.05, 129000),
  ($ttg$TTG-R-1006-9MM-7.5$ttg$, 9, $ttg$7.5$ttg$, 7.2, 131500),
  ($ttg$TTG-R-1006-9MM-8$ttg$, 9, $ttg$8$ttg$, 7.35, 134000),
  ($ttg$TTG-R-1006-9MM-8.5$ttg$, 9, $ttg$8.5$ttg$, 7.5, 136000),
  ($ttg$TTG-R-1006-9MM-9$ttg$, 9, $ttg$9$ttg$, 7.65, 138500),
  ($ttg$TTG-R-1006-9MM-9.5$ttg$, 9, $ttg$9.5$ttg$, 7.8, 141000),
  ($ttg$TTG-R-1006-9MM-10$ttg$, 9, $ttg$10$ttg$, 7.95, 143500),
  ($ttg$TTG-R-1006-9MM-10.5$ttg$, 9, $ttg$10.5$ttg$, 8.1, 145500),
  ($ttg$TTG-R-1006-9MM-11$ttg$, 9, $ttg$11$ttg$, 8.25, 148000),
  ($ttg$TTG-R-1006-9MM-11.5$ttg$, 9, $ttg$11.5$ttg$, 8.4, 150500),
  ($ttg$TTG-R-1006-9MM-12$ttg$, 9, $ttg$12$ttg$, 8.55, 152500),
  ($ttg$TTG-R-1006-9MM-12.5$ttg$, 9, $ttg$12.5$ttg$, 8.7, 155000),
  ($ttg$TTG-R-1006-9MM-13$ttg$, 9, $ttg$13$ttg$, 8.85, 157500),
  ($ttg$TTG-R-1006-9MM-13.5$ttg$, 9, $ttg$13.5$ttg$, 8.995, 159500),
  ($ttg$TTG-R-1006-9MM-14$ttg$, 9, $ttg$14$ttg$, 9.14, 162000),
  ($ttg$TTG-R-1006-9MM-14.5$ttg$, 9, $ttg$14.5$ttg$, 9.29, 164000),
  ($ttg$TTG-R-1006-9MM-15$ttg$, 9, $ttg$15$ttg$, 9.44, 166500),
  ($ttg$TTG-R-1006-9MM-15.5$ttg$, 9, $ttg$15.5$ttg$, 9.59, 169000),
  ($ttg$TTG-R-1006-9MM-16$ttg$, 9, $ttg$16$ttg$, 9.74, 171500),
  ($ttg$TTG-R-1006-10MM-4$ttg$, 10, $ttg$4$ttg$, 6.84, 126000),
  ($ttg$TTG-R-1006-10MM-4.5$ttg$, 10, $ttg$4.5$ttg$, 7.005, 128500),
  ($ttg$TTG-R-1006-10MM-5$ttg$, 10, $ttg$5$ttg$, 7.17, 131000),
  ($ttg$TTG-R-1006-10MM-5.5$ttg$, 10, $ttg$5.5$ttg$, 7.34, 133500),
  ($ttg$TTG-R-1006-10MM-6$ttg$, 10, $ttg$6$ttg$, 7.51, 136500),
  ($ttg$TTG-R-1006-10MM-6.5$ttg$, 10, $ttg$6.5$ttg$, 7.675, 139000),
  ($ttg$TTG-R-1006-10MM-7$ttg$, 10, $ttg$7$ttg$, 7.84, 141500),
  ($ttg$TTG-R-1006-10MM-7.5$ttg$, 10, $ttg$7.5$ttg$, 8.005, 144000),
  ($ttg$TTG-R-1006-10MM-8$ttg$, 10, $ttg$8$ttg$, 8.17, 147000),
  ($ttg$TTG-R-1006-10MM-8.5$ttg$, 10, $ttg$8.5$ttg$, 8.335, 149500),
  ($ttg$TTG-R-1006-10MM-9$ttg$, 10, $ttg$9$ttg$, 8.5, 152000),
  ($ttg$TTG-R-1006-10MM-9.5$ttg$, 10, $ttg$9.5$ttg$, 8.665, 154500),
  ($ttg$TTG-R-1006-10MM-10$ttg$, 10, $ttg$10$ttg$, 8.83, 157000),
  ($ttg$TTG-R-1006-10MM-10.5$ttg$, 10, $ttg$10.5$ttg$, 8.995, 159500),
  ($ttg$TTG-R-1006-10MM-11$ttg$, 10, $ttg$11$ttg$, 9.16, 162000),
  ($ttg$TTG-R-1006-10MM-11.5$ttg$, 10, $ttg$11.5$ttg$, 9.33, 165000),
  ($ttg$TTG-R-1006-10MM-12$ttg$, 10, $ttg$12$ttg$, 9.5, 167500),
  ($ttg$TTG-R-1006-10MM-12.5$ttg$, 10, $ttg$12.5$ttg$, 9.665, 170000),
  ($ttg$TTG-R-1006-10MM-13$ttg$, 10, $ttg$13$ttg$, 9.83, 172500),
  ($ttg$TTG-R-1006-10MM-13.5$ttg$, 10, $ttg$13.5$ttg$, 9.995, 175500),
  ($ttg$TTG-R-1006-10MM-14$ttg$, 10, $ttg$14$ttg$, 10.16, 178000),
  ($ttg$TTG-R-1006-10MM-14.5$ttg$, 10, $ttg$14.5$ttg$, 10.325, 180500),
  ($ttg$TTG-R-1006-10MM-15$ttg$, 10, $ttg$15$ttg$, 10.49, 183000),
  ($ttg$TTG-R-1006-10MM-15.5$ttg$, 10, $ttg$15.5$ttg$, 10.655, 185500),
  ($ttg$TTG-R-1006-10MM-16$ttg$, 10, $ttg$16$ttg$, 10.82, 188000),
  ($ttg$TTG-R-1006-11MM-4$ttg$, 11, $ttg$4$ttg$, 7.53, 137000),
  ($ttg$TTG-R-1006-11MM-4.5$ttg$, 11, $ttg$4.5$ttg$, 7.71, 139500),
  ($ttg$TTG-R-1006-11MM-5$ttg$, 11, $ttg$5$ttg$, 7.89, 142500),
  ($ttg$TTG-R-1006-11MM-5.5$ttg$, 11, $ttg$5.5$ttg$, 8.075, 145500),
  ($ttg$TTG-R-1006-11MM-6$ttg$, 11, $ttg$6$ttg$, 8.26, 148000),
  ($ttg$TTG-R-1006-11MM-6.5$ttg$, 11, $ttg$6.5$ttg$, 8.44, 151000),
  ($ttg$TTG-R-1006-11MM-7$ttg$, 11, $ttg$7$ttg$, 8.62, 154000),
  ($ttg$TTG-R-1006-11MM-7.5$ttg$, 11, $ttg$7.5$ttg$, 8.805, 156500),
  ($ttg$TTG-R-1006-11MM-8$ttg$, 11, $ttg$8$ttg$, 8.99, 159500),
  ($ttg$TTG-R-1006-11MM-8.5$ttg$, 11, $ttg$8.5$ttg$, 9.17, 162500),
  ($ttg$TTG-R-1006-11MM-9$ttg$, 11, $ttg$9$ttg$, 9.35, 165000),
  ($ttg$TTG-R-1006-11MM-9.5$ttg$, 11, $ttg$9.5$ttg$, 9.535, 168000),
  ($ttg$TTG-R-1006-11MM-10$ttg$, 11, $ttg$10$ttg$, 9.72, 171000),
  ($ttg$TTG-R-1006-11MM-10.5$ttg$, 11, $ttg$10.5$ttg$, 9.9, 174000),
  ($ttg$TTG-R-1006-11MM-11$ttg$, 11, $ttg$11$ttg$, 10.08, 176500),
  ($ttg$TTG-R-1006-11MM-11.5$ttg$, 11, $ttg$11.5$ttg$, 10.265, 179500),
  ($ttg$TTG-R-1006-11MM-12$ttg$, 11, $ttg$12$ttg$, 10.45, 182500),
  ($ttg$TTG-R-1006-11MM-12.5$ttg$, 11, $ttg$12.5$ttg$, 10.63, 185000),
  ($ttg$TTG-R-1006-11MM-13$ttg$, 11, $ttg$13$ttg$, 10.81, 188000),
  ($ttg$TTG-R-1006-11MM-13.5$ttg$, 11, $ttg$13.5$ttg$, 10.995, 191000),
  ($ttg$TTG-R-1006-11MM-14$ttg$, 11, $ttg$14$ttg$, 11.18, 194000),
  ($ttg$TTG-R-1006-11MM-14.5$ttg$, 11, $ttg$14.5$ttg$, 11.355, 196500),
  ($ttg$TTG-R-1006-11MM-15$ttg$, 11, $ttg$15$ttg$, 11.53, 199500),
  ($ttg$TTG-R-1006-11MM-15.5$ttg$, 11, $ttg$15.5$ttg$, 11.72, 202000),
  ($ttg$TTG-R-1006-11MM-16$ttg$, 11, $ttg$16$ttg$, 11.91, 205500),
  ($ttg$TTG-R-1006-12MM-4$ttg$, 12, $ttg$4$ttg$, 8.21, 147500),
  ($ttg$TTG-R-1006-12MM-4.5$ttg$, 12, $ttg$4.5$ttg$, 8.41, 150500),
  ($ttg$TTG-R-1006-12MM-5$ttg$, 12, $ttg$5$ttg$, 8.61, 153500),
  ($ttg$TTG-R-1006-12MM-5.5$ttg$, 12, $ttg$5.5$ttg$, 8.81, 157000),
  ($ttg$TTG-R-1006-12MM-6$ttg$, 12, $ttg$6$ttg$, 9.01, 160000),
  ($ttg$TTG-R-1006-12MM-6.5$ttg$, 12, $ttg$6.5$ttg$, 9.21, 163000),
  ($ttg$TTG-R-1006-12MM-7$ttg$, 12, $ttg$7$ttg$, 9.41, 166000),
  ($ttg$TTG-R-1006-12MM-7.5$ttg$, 12, $ttg$7.5$ttg$, 9.605, 169000),
  ($ttg$TTG-R-1006-12MM-8$ttg$, 12, $ttg$8$ttg$, 9.8, 172000),
  ($ttg$TTG-R-1006-12MM-8.5$ttg$, 12, $ttg$8.5$ttg$, 10.0, 175500),
  ($ttg$TTG-R-1006-12MM-9$ttg$, 12, $ttg$9$ttg$, 10.2, 178500),
  ($ttg$TTG-R-1006-12MM-9.5$ttg$, 12, $ttg$9.5$ttg$, 10.4, 181500),
  ($ttg$TTG-R-1006-12MM-10$ttg$, 12, $ttg$10$ttg$, 10.6, 185000),
  ($ttg$TTG-R-1006-12MM-10.5$ttg$, 12, $ttg$10.5$ttg$, 10.8, 188000),
  ($ttg$TTG-R-1006-12MM-11$ttg$, 12, $ttg$11$ttg$, 11, 191000),
  ($ttg$TTG-R-1006-12MM-11.5$ttg$, 12, $ttg$11.5$ttg$, 11.2, 194000),
  ($ttg$TTG-R-1006-12MM-12$ttg$, 12, $ttg$12$ttg$, 11.4, 197500),
  ($ttg$TTG-R-1006-12MM-12.5$ttg$, 12, $ttg$12.5$ttg$, 11.595, 200500),
  ($ttg$TTG-R-1006-12MM-13$ttg$, 12, $ttg$13$ttg$, 11.79, 203500),
  ($ttg$TTG-R-1006-12MM-13.5$ttg$, 12, $ttg$13.5$ttg$, 11.99, 206500),
  ($ttg$TTG-R-1006-12MM-14$ttg$, 12, $ttg$14$ttg$, 12.19, 209500),
  ($ttg$TTG-R-1006-12MM-14.5$ttg$, 12, $ttg$14.5$ttg$, 12.39, 213000),
  ($ttg$TTG-R-1006-12MM-15$ttg$, 12, $ttg$15$ttg$, 12.59, 216000),
  ($ttg$TTG-R-1006-12MM-15.5$ttg$, 12, $ttg$15.5$ttg$, 12.79, 219000),
  ($ttg$TTG-R-1006-12MM-16$ttg$, 12, $ttg$16$ttg$, 12.99, 222000);

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
