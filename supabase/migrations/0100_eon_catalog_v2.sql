-- 0100 — EON katalog v2: 39 karat-ayrık listing × 286 varyant (tam seed)
-- Üretici: scratchpad/gen_catalog_v2.py (gram tabloları + workflow metin/fiyat çıktısı)
-- Eski 17 taslak arşivlenir; yeni set: tip×renk×karat ayrık, tam beden/genişlik matrisi.

begin;
-- Eski EON taslaklarını arşive (katalog v2 bunların yerini alır).
-- GÜVENLİK: yalnız sku'suz (eski) taslaklar — katalog v2 listing'leri aile
-- kodlu sku taşır, bu koşul onları KORUR (idempotent; yeni seti arşivlemez).
update products set archived_at = now(), updated_at = now()
 where org_id = (select id from organizations where name = 'EON')
   and etsy_listing_id is null and archived_at is null and status = 'draft'
   and sku is null;

create table if not exists public.eon_seed_texts (
  no int primary key, family text unique not null, title text not null,
  description text not null, tags text[] not null, materials text[] not null,
  image_url text, research_keyword text, ppg_cents int not null, karat text not null,
  research_group smallint not null
);
create table if not exists public.eon_seed_grams (
  karat text not null, width int not null, thick text not null,
  grams numeric[] not null, primary key (karat, width, thick)
);

insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (1, $eon$GLD-R-1001$eon$, $eon$10K Solid Yellow Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 10k yellow gold wedding band, domed and comfort fit, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: Domed half-round, the classic wedding-band curve.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: 2mm through 12mm.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 10k inside the band.

The yellow runs warm but quiet, never showy. The domed curve rounds the light instead of flashing it.

SIZE & WIDTH
Two dropdowns build the ring. Pick a whole size, US 4 through 16, in Ring Size. Pick your width and thickness in Width: the 2mm through 12mm widths each come in a 1.5mm and a 2.0mm thickness. A 2 to 4mm reads slim and stacks well; 5 to 7mm is the everyday width; 8 to 12mm sits wide across the finger. The 1.5mm sits lighter and lower to the skin; the 2.0mm carries more presence on the curve.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width and thickness in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J · June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. Solid gold, all the way through.

---
[EON 01 · GLD-R-1001 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold ring$eon$,$eon$10k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$stacking gold ring$eon$,$eon$unisex gold band$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$Yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/04.jpg$eon$, $eon$10k yellow gold dome wedding band$eon$, 10730, $eon$10K$eon$, 1) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (2, $eon$GLD-R-1401$eon$, $eon$14K Solid Yellow Gold Wedding Band, Dome Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 14k yellow gold wedding band, domed and smooth, made to order in your size. Never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold. Never plated, never filled.
Profile: Domed half-round, comfort fit interior.
Widths: 2 to 12 mm, each in two thicknesses (1.5 mm and 2.0 mm).
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Ring Size covers whole US sizes 4 to 16, picked in the Ring Size dropdown. Width covers 2 to 12 mm, and each width comes in two thicknesses, 1.5 mm and 2.0 mm, picked together in the Width dropdown. Widths from 2 to 4 mm sit close and stack well; 5 to 7 mm is the classic width; 8 to 12 mm sits wide on the hand. The two thicknesses set how far the band stands off the finger: 1.5 mm keeps a low profile, 2.0 mm stands a little higher. If you're between sizes, send us a message before you order.

MAKE IT YOURS
Three choices, top to bottom:
1. Pick your ring size, whole US sizes 4 to 16.
2. Pick your width, 2 to 12 mm, in 1.5 or 2.0 mm thickness.
3. Add your engraving in the Personalization box, up to 30 characters, set inside the band and copied exactly as you type it. Script is the default; say the word if you'd rather have block letters. Something like "A & M", a date, or coordinates. Leave it blank and it ships clean. Engraving is free.

WHY EON
EON makes solid gold wedding bands, made to order. I make each in your size and stamp it 14k inside. Worn as a wedding, anniversary, or promise band.

---
[EON 02 · GLD-R-1401 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 14k gold ring$eon$,$eon$14k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid 14k gold$eon$,$eon$Yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/01.jpg$eon$, $eon$14k yellow gold dome wedding band$eon$, 13560, $eon$14K$eon$, 2) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (3, $eon$GLD-R-1801$eon$, $eon$18K Solid Yellow Gold Wedding Band, Domed Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 18k yellow gold wedding band, domed and comfort fit inside. Made to order, never plated, never filled, with free engraving hidden in the band.

The color runs deep and warm, the yellow you picture when someone says the word. The dome sits high and catches light along one soft line as the hand moves.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: Dome.
Fit: Comfort fit interior.
Widths: 2 to 12 mm, in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US 4 to 16.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Width sets the look: 2 to 4 mm reads slim and stacks easily, 5 to 7 mm is the classic band, 8 to 12 mm sits wide and bold. Each width comes in two thicknesses, 1.5 mm and 2.0 mm, picked together with the width. Sizes are whole US only; if you land between two, message us before ordering.

MAKE IT YOURS
1. Pick your size in the Ring Size dropdown.
2. Pick your width and thickness in the Width dropdown.
3. Type your engraving in the Personalization box. It is free, up to 30 characters, set inside the band and copied exactly as you write it. Script is the default; note block letters if you prefer them. One quiet example: A & J · June 15. Left blank, it ships clean.

WHY EON
I make each band to order in 18k gold, solid all the way through.

---
[EON 03 · GLD-R-1801 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 18k gold ring$eon$,$eon$18k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$stacking gold ring$eon$,$eon$plain gold band$eon$,$eon$unisex wedding band$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$18k yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/01.jpg$eon$, $eon$18k yellow gold dome wedding band$eon$, 19320, $eon$18K$eon$, 3) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (4, $eon$WHG-R-1001$eon$, $eon$10K Solid White Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 10k white gold wedding band, domed with a comfort fit inside. Never plated, never filled. Made to order in your size, with free engraving inside. The color is a cool, pale white, quiet against the skin, and the rounded outside turns a single soft line of light as the hand moves.

THE DETAILS
Metal: Solid 10k white gold, never plated, never filled.
Profile: Domed, curved across the top.
Fit: Comfort fit interior, rounded so it slides over the knuckle and settles in.
Widths: 2 to 12 mm, each in a 1.5 mm or 2.0 mm thickness.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 10k inside the band.
The rounded interior is the part you stop feeling by the end of the day.

SIZE & WIDTH
Ring Size covers whole US sizes 4 through 16. Width runs 2 through 12 mm, each in a 1.5 mm or 2.0 mm thickness, picked together in the Width dropdown.
If you land between two sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size, whole US 4 through 16.
2. Choose your width, 2 through 12 mm, and the thickness, 1.5 or 2.0 mm.
3. Add an engraving inside the band. Type it in the Personalization box, up to 30 characters, copied exactly as you write it. Something like A & J, June 15, or a name or a date. Script is the default; ask for block letters if you prefer. Left blank, the band ships clean.
Engraving is free.

WHY EON
I cut and finish each band to order in your size. A plain white band meant to be worn daily, slept in, and handed down.

---
[EON 04 · WHG-R-1001 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold ring$eon$,$eon$10k white gold band$eon$,$eon$white gold dome ring$eon$,$eon$comfort fit band$eon$,$eon$gold ring for him$eon$,$eon$gold ring for her$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$minimalist gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold band$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/05.jpg$eon$, $eon$10k white gold dome wedding band$eon$, 10730, $eon$10K$eon$, 4) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (5, $eon$WHG-R-1401$eon$, $eon$14K Solid White Gold Wedding Band, Dome Comfort Fit, 2mm to 12mm$eon$, $eon$Solid 14k white gold wedding band, domed and made to order in your size and width. Never plated, never filled, with free engraving hidden inside.

The dome keeps the outside smooth and rounded.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: Dome.
Fit: Comfort fit interior, rounded on the inside so it clears the knuckle and settles in for daily wear.
Widths: 2mm to 12mm, each in 1.5mm or 2.0mm thickness.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, each in two thicknesses, 1.5mm and 2.0mm, picked together in the Width dropdown. If you're between sizes, message us.

MAKE IT YOURS
1. Choose your ring size, whole US 4 through 16.
2. Choose your width and thickness in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you type it. Script is the default; note block letters if you'd rather. Something like A & J · June 15, or a few initials. Left blank, it ships clean.

WHY EON
I make each one to order, solid 14k gold all the way through. No plating to wear thin, no filler underneath.

---
[EON 05 · WHG-R-1401 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$14k white gold ring$eon$,$eon$solid 14k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$his and hers band$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid 14k white gold$eon$,$eon$14k gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/02.jpg$eon$, $eon$14k white gold dome wedding band$eon$, 15820, $eon$14K$eon$, 5) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (6, $eon$WHG-R-1801$eon$, $eon$18K Solid White Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 18k white gold wedding band, domed profile, never plated or filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k white gold, never plated, never filled.
Profile: Domed.
Fit: Comfort fit interior.
Widths: 2 to 12 mm, each in 1.5 mm and 2.0 mm thickness.
Sizes: Whole US 4 through 16.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns build your band. Pick a whole size, US 4 through 16, in Ring Size. Pick a width, 2 to 12 mm, in the Width dropdown, where each width comes in two thicknesses, 1.5 mm and 2.0 mm.
Width sets how it wears: 2 to 4 mm runs slim and stacks easily, 5 to 7 mm sits as a classic middle, 8 to 12 mm covers more of the finger. The 2.0 mm stands a little higher off the finger; the 1.5 mm sits lower and closer. If you fall between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Add your engraving in the Personalization box.
Engraving is free and sits inside the band, seen only by the one who wears it: a date, initials, or a few words, up to 30 characters, copied exactly as you type it. Script is the default; note block letters if you prefer them. Something like A & J · June 15. Leave it blank and the band ships clean.

WHY EON
I make each band to order at the bench, one size and one width at a time, in gold that stays solid the whole way through. It is a ring made to be worn every day, slept in, and one day handed down.

---
[EON 06 · WHG-R-1801 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 18k gold ring$eon$,$eon$18k white gold ring$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$gift for husband$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid 18k white gold$eon$,$eon$Solid gold$eon$,$eon$18k gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/02.jpg$eon$, $eon$18k white gold dome wedding band$eon$, 19320, $eon$18K$eon$, 6) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (7, $eon$RSG-R-1001$eon$, $eon$10K Solid Rose Gold Wedding Band, Dome Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 10k rose gold wedding band, domed and comfort fit inside, never plated, never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k rose gold. Never plated, never filled.
Profile: Dome.
Fit: Comfort fit interior, rounded to clear the knuckle and settle in.
Widths: 2 to 12 mm, each offered in a 1.5 mm and a 2.0 mm thickness.
Sizes: Whole US 4 through 16.
Hallmark: Stamped 10k inside the band.

Rose gold wears warm against the skin, a low pink that catches quietly, and the domed top holds a single soft line of light as the hand turns.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers whole US sizes 4 through 16. Width covers 2 to 12 mm, and each width comes in two thicknesses, 1.5 mm and 2.0 mm, chosen together in the Width dropdown.

The 1.5 mm thickness stays light on the finger, while 2.0 mm gives the dome more depth. Wider, thicker bands wear a touch snugger, so if you land between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.

Engraving is free and sits hidden inside the band, reproduced exactly as you type it, up to 30 characters. Something like A & J, June 15, or a set of initials, or a date. Script is the default; say the word if you'd prefer block letters. Leave it blank and the band ships clean. For anything more involved, send a message before you order.

WHY EON
I make each band to order and stamp it 10k inside, one at a time. This is a ring made to be worn now, slept in, and handed down.

---
[EON 07 · RSG-R-1001 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$10k rose gold ring$eon$,$eon$solid 10k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold ring$eon$,$eon$personalized ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/06.jpg$eon$, $eon$10k rose gold dome wedding band$eon$, 10730, $eon$10K$eon$, 7) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (8, $eon$RSG-R-1401$eon$, $eon$14K Solid Rose Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 14k rose gold wedding band, domed and never plated, never filled. Made to order in your size and width, with free engraving inside the band.

The domed profile rounds up off the finger and holds the light in one clean line. Rose gold runs warm, and this one keeps it quiet. No stones, nothing to date it.

THE DETAILS
Metal: Solid 14k rose gold, never plated, never filled.
Profile: Domed half-round, no stones.
Fit: Comfort fit interior, rounded so it clears the knuckle.
Widths: 2mm to 12mm, each in 1.5mm or 2.0mm thickness.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Two dropdowns build your band. Ring Size covers whole US sizes 4 through 16. Width runs 2mm to 12mm, each in 1.5mm or 2.0mm thickness, both picked together in the Width dropdown.

Width changes how it wears. A 2 to 4mm band sits light and stacks with others; 5 to 7mm is the classic wedding width, present without taking over; 8 to 12mm runs wide and covers more of the finger. The 1.5mm thickness stays low and close; 2.0mm holds a little more heft. If you sit between sizes, message us before ordering.

MAKE IT YOURS
Order in three steps:
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width and thickness in the Width dropdown.
3. Type your engraving in the Personalization box, or leave it blank.

The engraving is free and hidden inside the band, read only by the one wearing it: a date, initials, coordinates, a few words. It's copied exactly as you type it, up to 30 characters, so check the spelling. Script is the default; note block letters if you'd rather. Something like A & J · June 15, or leave it blank and it ships clean. For another date format or a coordinate, message us before ordering.

WHY EON
I make these to order, one band at a time, and stamp the karat inside before it ships. Solid gold, never plated, never filled.

---
[EON 08 · RSG-R-1401 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 14k gold ring$eon$,$eon$rose gold band$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$mens wedding band$eon$,$eon$womens promise ring$eon$,$eon$anniversary ring$eon$,$eon$engraved gold ring$eon$,$eon$personalized band$eon$,$eon$stacking ring$eon$,$eon$minimalist ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$14k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/03.jpg$eon$, $eon$14k rose gold dome wedding band$eon$, 15820, $eon$14K$eon$, 8) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (9, $eon$RSG-R-1801$eon$, $eon$18K Solid Rose Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm$eon$, $eon$A solid 18k rose gold wedding band, domed on top, comfort fit inside — not plated, not filled. Made to order in your size, with free engraving inside the band. Rose gold this deep reads warm against the skin, and the domed top holds a soft line of light that rolls as the hand turns.

THE DETAILS
Metal: Solid 18k rose gold, never plated, never filled.
Profile: Domed half-round, one continuous curve across the top.
Fit: Comfort fit interior, rounded so it clears the knuckle and settles in for daily wear.
Widths: 2 to 12 mm, each offered in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 18k inside the band.
The rounded interior is the part your finger forgets first.

SIZE & WIDTH
Pick your size in the Ring Size dropdown: whole US sizes 4 through 16. Pick your width and thickness together in the Width dropdown, 2 to 12 mm in either 1.5 mm or 2.0 mm.
The 1.5 mm thickness lies lower and lighter; 2.0 mm stands a touch higher, with more gold to the hand. If you're between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you type it: a date, initials, a few words, like A & J · June 15. Script is the default; note block letters if you'd rather. Left blank, it ships clean. For anything more particular, send a message first.

WHY EON
EON is solid gold made to outlast the day it marks. I make each band to the size you order, one at a time, never pulled from a drawer. Gold the whole way through, worn every day, slept in, and handed down when it's time.

---
[EON 09 · RSG-R-1801 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k rose gold band$eon$,$eon$solid 18k ring$eon$,$eon$rose gold ring$eon$,$eon$dome wedding ring$eon$,$eon$comfort fit band$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$unisex wedding band$eon$,$eon$anniversary ring$eon$,$eon$engraved gold band$eon$,$eon$stacking gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold band$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$18k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/03.jpg$eon$, $eon$18k rose gold dome wedding band$eon$, 19320, $eon$18K$eon$, 9) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (10, $eon$GLD-R-1002$eon$, $eon$10K Solid Yellow Gold Wedding Band, Flat Profile, 2mm to 12mm$eon$, $eon$Solid 10k yellow gold wedding band with a flat profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: Flat.
Widths: 2mm to 12mm, each in a 1.5mm or 2.0mm thickness.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 through 16. Width runs 2mm through 12mm, and each width comes in two thicknesses, a thinner 1.5mm and a thicker 2.0mm. Pick the width and thickness together in the Width dropdown.

2 to 4mm reads slim and stacks well. 5 to 7mm is the classic band. 8 to 12mm wears wide and bold. If you land between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size. 2. Choose your width and thickness. 3. Add an engraving, or leave it blank.

The engraving is free and hidden inside the band: a date, initials, coordinates, a few words. Type it in the Personalization box, up to 30 characters, copied exactly as written. Script is the default; note block letters if you'd rather. Something like A & J · June 15, or leave the box empty and the band ships clean.

WHY EON
This is the plain, hard-wearing yellow gold you put on and stop thinking about: worn daily, slept in, handed down.

---
[EON 10 · GLD-R-1002 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold ring$eon$,$eon$10k gold band$eon$,$eon$flat wedding band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved band$eon$,$eon$minimalist band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$stackable band$eon$,$eon$unisex wedding ring$eon$]::text[], ARRAY[$eon$Solid 10k yellow gold$eon$,$eon$Solid gold$eon$,$eon$10k gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/07.jpg$eon$, $eon$10k yellow gold flat wedding band$eon$, 10730, $eon$10K$eon$, 10) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (11, $eon$GLD-R-1402$eon$, $eon$14K Solid Yellow Gold Flat Wedding Band, Engraved Ring, 2mm to 12mm$eon$, $eon$Solid 14k yellow gold in a flat wedding band, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: Flat.
Fit: Flat inner wall, made true to your size.
Widths: 2mm to 12mm, each in a 1.5mm or 2.0mm thickness.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k inside the band.

The color warms against skin, and the flat face reads as a bright line rather than a rounded gleam.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, each offered in a 1.5mm or 2.0mm thickness. Choose your width and thickness together there.

Width changes the ring more than you would expect. 2mm to 4mm is slim and easy to stack. 5mm to 7mm is the classic band most people picture. 8mm to 12mm is a wide band that covers more of the finger. Thickness is the other half: 1.5mm sits low and close to the finger, 2.0mm stands a little higher off it. A wider band wears snugger, so if you land between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.

Engraving is free and sits inside the band, where only the wearer will find it. Up to 30 characters, copied exactly as you type them, something like "A & J · June 15." Script is the default; ask for block letters if you would rather. For a coordinate or a different date format, message us first. Leave it blank and the band ships unengraved.

WHY EON
I make each band to order in solid gold, cut and stamped one at a time. It is meant to be worn every day, slept in, and handed down when the time comes. It marks the moment now and outlasts it.

---
[EON 11 · GLD-R-1402 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 14k gold ring$eon$,$eon$14k gold band$eon$,$eon$flat wedding band$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$unisex wedding ring$eon$,$eon$anniversary ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$thin gold band$eon$,$eon$wide gold band$eon$,$eon$minimalist gold ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$14k gold$eon$,$eon$14k yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/07.jpg$eon$, $eon$14k yellow gold flat wedding band$eon$, 15820, $eon$14K$eon$, 11) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (12, $eon$GLD-R-1802$eon$, $eon$18K Solid Yellow Gold Wedding Band, Flat Profile, 2mm to 12mm$eon$, $eon$A solid 18k yellow gold wedding band with a flat profile and clean edges. Never plated, never filled, made to order with free engraving inside the band.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: A flat face with crisp, clean edges.
Widths: 2mm to 12mm, each in a 1.5mm or 2.0mm thickness.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 18k inside the band.
The flat face catches light in a clean, straight line, and the 18k underneath runs deep and warm against the skin. Solid gold, all the way through.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 to 16. Width covers 2mm to 12mm, and you pick the 1.5mm or 2.0mm thickness in the same Width dropdown. If you sit between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size, whole US 4 to 16.
2. Choose your width and thickness in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you type it: a date, initials, coordinates, or a few words, like "A & J, June 15". Script is the default, so note if you prefer block letters. Left blank, it ships clean. For anything more involved, message us before ordering.

WHY EON
I make each band to order at the bench, one size and one width at a time, in gold that is solid the whole way down. EON makes solid gold meant to outlive the moment it marks, worn daily, slept in, and handed down.

---
[EON 12 · GLD-R-1802 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 18k gold ring$eon$,$eon$18k gold band$eon$,$eon$flat wedding band$eon$,$eon$mens wedding band$eon$,$eon$womens gold band$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$minimalist gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$18k gold$eon$,$eon$Yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/07.jpg$eon$, $eon$18k yellow gold flat wedding band$eon$, 19320, $eon$18K$eon$, 12) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (13, $eon$WHG-R-1002$eon$, $eon$10K Solid White Gold Wedding Band, Flat Profile, 2mm to 12mm$eon$, $eon$A solid 10k white gold wedding band with a flat profile. Not plated, not filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k white gold, never plated, never filled.
Profile: Flat.
Width: 2 to 12 mm, each in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
A 2 to 4 mm band reads slim and stacks easily. The 5 to 7 mm range is the everyday middle, and 8 to 12 mm sits wide across the finger. Thickness sets how far the band stands off the skin: 1.5 mm keeps it low and light, 2.0 mm stands a little taller. Wider bands wear a little snugger. From about 6 mm up, if you land between two sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width and thickness in the Width dropdown.
3. Type your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it. Script is the default; note block letters if you prefer them. It is copied exactly as you type it, so check the spelling: a date, initials, a few words, something like A & J · June 15. Left blank, it ships clean.
The engraving is free.

WHY EON
I cut every band to order in solid 10k, never plated, never filled, stamped 10k inside.

---
[EON 13 · WHG-R-1002 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$10k white gold ring$eon$,$eon$flat wedding band$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$engraved gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold band$eon$,$eon$stacking gold ring$eon$,$eon$minimalist ring$eon$,$eon$plain gold band$eon$,$eon$10k gold band$eon$]::text[], ARRAY[$eon$Solid 10k white gold$eon$,$eon$10k gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/08.jpg$eon$, $eon$10k white gold flat wedding band$eon$, 10730, $eon$10K$eon$, 13) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (14, $eon$WHG-R-1402$eon$, $eon$14K White Gold Flat Wedding Band, Solid Modern Ring, 2mm to 12mm$eon$, $eon$A solid 14k white gold wedding band, flat profile with crisp, clean edges. Never plated, never filled, made to order with free engraving inside the band.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: A flat face with clean, crisp edges.
Width: 2mm to 12mm, offered in 1.5mm and 2.0mm thicknesses.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k on the inside.
The flat face sits level against the finger, and those clean edges hold a line of light where a rounded band would soften it.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 to 16 and sets the fit. Width covers 2mm to 12mm and sets the face, with the two thicknesses, 1.5mm and 2.0mm, picked together in that same dropdown.

2 to 4mm sits slim and stacks well, 5 to 7mm is a classic width, and 8 to 12mm covers more of the finger. The 2.0mm thickness stands a little higher off the finger, where 1.5mm sits closer to it. If you land between sizes, send us a message before you order.

MAKE IT YOURS
1. Choose your ring size, whole US 4 to 16.
2. Choose your width, 2mm to 12mm, and your thickness, 1.5mm or 2.0mm.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you write it. Script is the default; note block letters if you prefer. One example: A & J · June 15. Leave it blank and the band ships clean.

WHY EON
I make each band to order in solid 14k white gold. Solid gold, all the way through. Worn every day, slept in, handed down when the time comes.

---
[EON 14 · WHG-R-1402 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 14k gold ring$eon$,$eon$14k gold band$eon$,$eon$flat wedding band$eon$,$eon$minimalist ring$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$anniversary ring$eon$,$eon$gift for husband$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$stackable gold ring$eon$,$eon$wide gold ring$eon$,$eon$promise ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$14k white gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/08.jpg$eon$, $eon$14k white gold flat wedding band$eon$, 15820, $eon$14K$eon$, 14) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (15, $eon$WHG-R-1802$eon$, $eon$18K Solid White Gold Wedding Band, Flat Profile, 2mm to 12mm$eon$, $eon$A flat wedding band in solid 18k white gold, never plated, never filled. Made to order in your size and width, with free engraving hidden inside the band.

THE DETAILS
Metal: solid 18k white gold.
Profile: flat, with crisp, clean edges.
Widths: 2mm through 12mm, each in a 1.5mm and a 2.0mm thickness.
Sizes: whole US sizes 4 through 16.
Hallmark: stamped 18k inside the band.
The flat face sits flush to the finger and the edges stay crisp, so the band catches the light in one clean line.

SIZE & WIDTH
Two dropdowns build your band. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, and each width comes in two thicknesses, 1.5mm and 2.0mm, picked in that same Width dropdown.
Narrow widths, 2 to 4mm, sit slim and stack easily. The 5 to 7mm range is the classic wedding width. From 8mm up the band covers more of the finger and reads wide. The 1.5mm thickness stays light and low; the 2.0mm sits with a little more weight. If you fall between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Add your engraving in the Personalization box.
The engraving sits inside the band, where only the wearer sees it, and it is free. Up to 30 characters, copied exactly as you type them. A date, initials, a few words, like A & J · June 15. Script is the default; note block letters if you prefer them. Left blank, the band ships clean. For anything more particular, send a message before you order.

WHY EON
I make each band to order, solid all the way through. It is meant to be worn every day, slept in, and handed down when the time comes. Gold this solid keeps its word.

---
[EON 15 · WHG-R-1802 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k white gold ring$eon$,$eon$white gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$flat wedding band$eon$,$eon$minimalist gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$custom engraved ring$eon$,$eon$engraved gold band$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid 18k white gold$eon$,$eon$18k white gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/08.jpg$eon$, $eon$18k white gold flat wedding band$eon$, 19320, $eon$18K$eon$, 15) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (16, $eon$RSG-R-1002$eon$, $eon$10K Solid Rose Gold Wedding Band, Flat Profile, 2mm to 12mm$eon$, $eon$Solid 10k rose gold wedding band, flat profile — not plated, not filled. Made to order in your size and width, with free engraving hidden inside.

THE DETAILS
Metal: solid 10k rose gold, never plated, never filled.
Profile: flat.
Interior: flat.
Hallmark: stamped 10k inside the band.
Widths: 2mm to 12mm, each in two thicknesses.
Sizes: whole US 4 through 16.
Rose gold keeps a warm, pink cast against the skin.

SIZE & WIDTH
Two dropdowns build the ring. Pick a whole US size, 4 through 16, in Ring Size. Pick your width, 2mm to 12mm, in the Width menu. Each width comes in two thicknesses, 1.5mm and 2.0mm, chosen in that same menu.
Wider bands take up more of the finger: 2 to 4mm sits slim and stacks well; 5 to 7mm is a classic single-band width; 8 to 12mm is broad. The 1.5mm thickness runs a lower profile; 2.0mm stands a little taller. If you fall between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.
It goes inside the band, up to 30 characters, copied exactly as you type it: a date, initials, a few words. Something like A & J · June 15. Script is the default; ask for block letters if you'd rather. Left blank, the band ships clean. Engraving is free.

WHY EON
I cut, size, and stamp each band to order — nothing waits in a tray. A ring for every day, worn now and handed down when the time comes. Solid gold, all the way through.

---
[EON 16 · RSG-R-1002 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$10k rose gold ring$eon$,$eon$solid gold band$eon$,$eon$flat wedding band$eon$,$eon$minimalist gold ring$eon$,$eon$mens wedding band$eon$,$eon$womens gold band$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$engraved gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold band$eon$,$eon$stacking gold ring$eon$,$eon$his and hers band$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/09.jpg$eon$, $eon$10k rose gold flat wedding band$eon$, 10730, $eon$10K$eon$, 16) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (17, $eon$RSG-R-1402$eon$, $eon$14K Solid Rose Gold Flat Wedding Band, 2mm to 12mm$eon$, $eon$A flat wedding band in solid 14k rose gold, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: solid 14k rose gold, never plated, never filled.
Profile: flat, with crisp, clean edges.
Widths: 2 to 12 mm, each in 1.5 mm and 2.0 mm thickness.
Sizes: whole US 4 through 16.
Hallmark: stamped 14k inside the band.
The flat face sits level across the finger, its edges crisp rather than rounded, and the rose tone reads warm against the skin.

SIZE & WIDTH
Two dropdowns build your band. Ring Size covers whole US sizes 4 through 16. The Width dropdown covers 2 mm through 12 mm, each in two thicknesses — 1.5 mm sits light and low, 2.0 mm carries a little more heft. If you land between sizes, send a message before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.

The engraving is free and goes inside the band, copied exactly as you type it, up to 30 characters — a date, initials, or a few words. Script is the default; note block letters if you prefer them. Something like A & J · June 15. Leave it blank and the band ships unengraved.

WHY EON
I make each band to order, one at a time, solid gold the whole way through. It is made to be worn every day, slept in, and passed down.

---
[EON 17 · RSG-R-1402 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$flat wedding band$eon$,$eon$flat gold ring$eon$,$eon$rose gold band$eon$,$eon$14k rose gold ring$eon$,$eon$solid 14k gold ring$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$stacking gold ring$eon$,$eon$wide gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$14k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/09.jpg$eon$, $eon$14k rose gold flat wedding band$eon$, 15820, $eon$14K$eon$, 17) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (18, $eon$RSG-R-1802$eon$, $eon$18K Solid Rose Gold Wedding Band, Flat Profile, Crisp Edges, 2mm to 12mm$eon$, $eon$A solid 18k rose gold wedding band with a flat profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k rose gold, never plated, never filled.
Profile: A flat face with crisp, squared edges.
Widths: 2 to 12 mm, each in a 1.5 mm and a 2.0 mm thickness.
Sizes: Whole US sizes 4 through 16, made to order.
Hallmark: Stamped 18k inside the band.

The flat face catches a clean line of light along each crisp edge. At 18k the rose sits deep and warm against the skin.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, and every width is offered in two thicknesses: 1.5 mm sits light and low, while 2.0 mm gives the band more presence on the finger. If you're between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.

Engraving is free and goes inside the band, hidden once it's on. Up to 30 characters, copied exactly as you type them: a date, initials, a few words (A & J · June 15). Script is the default; note block letters if you'd rather have them. Left blank, the band ships clean. For anything unusual, like a coordinate or another date format, send a message before ordering.

---
[EON 18 · RSG-R-1802 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k rose gold ring$eon$,$eon$flat rose gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$minimalist gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$thin gold band$eon$,$eon$stacking gold ring$eon$,$eon$wide gold ring$eon$,$eon$promise ring$eon$,$eon$plain gold band$eon$]::text[], ARRAY[$eon$Solid 18k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/09.jpg$eon$, $eon$18k rose gold flat wedding band$eon$, 19320, $eon$18K$eon$, 18) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (19, $eon$GLD-R-1003$eon$, $eon$10K Yellow Gold Beveled Wedding Band, Flat Top Solid Ring, 2mm to 12mm$eon$, $eon$Solid 10k yellow gold wedding band with a beveled profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: A flat top framed by beveled edges cut at an angle. The flat face stays calm; the bevels throw a bright line of light down each side.
Widths: 2mm to 12mm, each in two thicknesses, 1.5mm and 2.0mm.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, each offered in two thicknesses, 1.5mm and 2.0mm, chosen together in the Width dropdown.

If you fall between two whole sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.

Engraving is free and sits inside the band, out of sight — a date, initials, a few words. Up to 30 characters, copied exactly as you type them. Script is the default; note block letters if you prefer them. Something like A & J · June 15. Left blank, it ships clean.

WHY EON
I make each band to order, one at a time, in solid gold.

---
[EON 19 · GLD-R-1003 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold ring$eon$,$eon$10k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring gift$eon$,$eon$beveled edge ring$eon$,$eon$flat top band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$Yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/10.jpg$eon$, $eon$10k yellow gold beveled wedding band$eon$, 10730, $eon$10K$eon$, 19) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (20, $eon$GLD-R-1403$eon$, $eon$14K Yellow Gold Beveled Wedding Band, Flat Top Ring, 2mm to 12mm$eon$, $eon$A solid 14k yellow gold wedding band with a beveled profile, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: A flat center framed by angled, beveled edges.
Hallmark: Stamped 14k on the inside.
Widths: 2mm through 12mm, each in a 1.5mm and a 2.0mm thickness.
Sizes: Whole US sizes 4 through 16.
The flat top holds a straight line across the finger, and the bevels break the light into two bright edges where a rounded band would only glow.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 through 16. Width runs 2mm through 12mm, and each width comes in two thicknesses, 1.5mm and 2.0mm; you choose the width and the thickness together in the Width dropdown.
Narrow widths from 2mm to 4mm sit slim and stack easily against other rings. The 5mm to 7mm range is the classic middle most people picture for a wedding band. From 8mm up, the band covers more of the finger and reads as a statement. Between the thicknesses, 1.5mm stays close to the finger and wears light, while 2.0mm puts more metal on and stands a little higher. Wider bands wear snug, so if you fall between sizes, message us before ordering. The size and width photos show how each one reads on the hand.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.
The engraving is free and sits inside the band, seen only by the one who wears it: a date, initials, or a few words, up to 30 characters, copied exactly as you type it. Script is the default; note block letters if you prefer. Something like A & J June 15 reads well. Left blank, it ships clean. For a coordinate or a different date format, send a message first so we set it right.

WHY EON
I make each band to order and stamp it 14k before it leaves the bench, the classic wedding gold, warm against the skin and heavy enough to feel like it means something. It is built to be worn every day, slept in, and handed down when the time comes. Solid gold, all the way through.

---
[EON 20 · GLD-R-1403 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 14k gold ring$eon$,$eon$14k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$unisex wedding band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$flat wedding band$eon$,$eon$beveled edge ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$]::text[], ARRAY[$eon$Solid 14k yellow gold$eon$,$eon$14k gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/10.jpg$eon$, $eon$14k yellow gold beveled wedding band$eon$, 15820, $eon$14K$eon$, 20) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (21, $eon$GLD-R-1803$eon$, $eon$18K Yellow Gold Beveled Wedding Band, 2mm to 12mm$eon$, $eon$Solid 18k yellow gold wedding band, beveled edges — not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: Beveled edges.
Widths: 2 to 12 mm, each offered in 1.5 mm and 2.0 mm thickness.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Pick your size in the Ring Size dropdown, whole US 4 through 16. Pick your width in the Width dropdown, 2 through 12 mm, each in a 1.5 mm or a 2.0 mm thickness.
If you land between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you write it: a date, initials, or a few words, like "A & J · June 15". Script is the default; ask for block letters if you prefer them. Left blank, it ships clean. Engraving is free. For anything more particular, message us before ordering.

WHY EON
I make each band to order in solid 18k, beveled at the edges and stamped 18k inside. Worn daily, slept in, handed down.

---
[EON 21 · GLD-R-1803 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 18k gold ring$eon$,$eon$18k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$beveled edge ring$eon$,$eon$minimalist gold band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold ring$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$stacking gold band$eon$,$eon$unisex wedding band$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$18k gold$eon$,$eon$Yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/10.jpg$eon$, $eon$18k yellow gold beveled wedding band$eon$, 19320, $eon$18K$eon$, 21) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (22, $eon$WHG-R-1003$eon$, $eon$10K Solid White Gold Wedding Band, Beveled Edge, 2mm to 12mm$eon$, $eon$A solid 10k white gold wedding band, beveled at the edges, never plated and never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k white gold, never plated, never filled.
Profile: Beveled edge.
Widths: 2 to 12 mm, each in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build your ring. Pick a whole US size, 4 to 16, in Ring Size. Pick your width, 2 to 12 mm, in Width, where each width comes in two thicknesses, 1.5 mm and 2.0 mm. If you land between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it.

Engraving is free and copied exactly as you type it, so check the spelling. Script is the default; ask for block letters if you prefer them. One example: A & J · June 15. Leave the box blank and the band ships clean. For anything unusual, like a date in another format or initials only, send a message before you order.

WHY EON
Every EON band is made to order and stamped 10k inside.

---
[EON 22 · WHG-R-1003 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$10k white gold ring$eon$,$eon$beveled wedding band$eon$,$eon$beveled edge ring$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$anniversary ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$thin gold band$eon$,$eon$wide mens band$eon$,$eon$stacking gold ring$eon$,$eon$his and hers band$eon$,$eon$minimalist gold ring$eon$]::text[], ARRAY[$eon$Solid 10k gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/11.jpg$eon$, $eon$10k white gold beveled wedding band$eon$, 10730, $eon$10K$eon$, 22) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (23, $eon$WHG-R-1403$eon$, $eon$14K White Gold Beveled Wedding Band, Solid Flat Top Ring, 2mm to 12mm$eon$, $eon$A beveled wedding band, solid 14k white gold, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: A flat center framed by angled, beveled edges.
Widths: 2mm to 12mm, each offered in two thicknesses, 1.5mm and 2.0mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k inside the band.

The flat top holds the light steady; the beveled edges break it into a bright line down each side. No stones.

SIZE & WIDTH
The ring is built from two dropdowns. Pick a whole US size, 4 to 16, under Ring Size. Pick your width, 2mm to 12mm, under Width, where you also choose the thickness, 1.5mm or 2.0mm. The 1.5mm sits lower and flatter to the finger; the 2.0mm stands a little higher.

If you're between sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Add an engraving, or leave it blank. Type your text in the Personalization box, up to 30 characters, and it goes inside the band, copied exactly as you write it. Script is standard; ask for block letters if you prefer. One example: A & J · June 15. Left blank, it ships clean.

For a date in another format, initials only, or coordinates, send a message before ordering.

WHY EON
Each ring is made to order in the size and width you choose, then ships with free tracked shipping. Solid 14k white gold, all the way through.

---
[EON 23 · WHG-R-1403 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$14k white gold ring$eon$,$eon$solid gold band$eon$,$eon$white gold mens band$eon$,$eon$womens wedding ring$eon$,$eon$beveled edge ring$eon$,$eon$flat top band$eon$,$eon$anniversary ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$,$eon$promise ring$eon$]::text[], ARRAY[$eon$Solid 14k gold$eon$,$eon$14k white gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/11.jpg$eon$, $eon$14k white gold beveled wedding band$eon$, 15820, $eon$14K$eon$, 23) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (24, $eon$WHG-R-1803$eon$, $eon$18K White Gold Beveled Wedding Band, Solid Unisex Ring, 2mm to 12mm$eon$, $eon$A solid 18k white gold wedding band, beveled edges around a flat center. Not plated, not filled, made to order in your size, with free engraving inside.

THE DETAILS
Metal: Solid 18k white gold, never plated, never filled.
Profile: Beveled, a flat center with an angled edge cut on each side.
Widths: 2 to 12 mm, each in two thicknesses, 1.5 and 2.0 mm.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 18k on the inside.
The bevels take the light in two fine lines and leave the flat top quiet between them.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2 to 12 mm, and each width comes in a 1.5 or 2.0 mm thickness. You pick the width and the thickness together. The size chart photo shows the measurements; the on-finger comparison shows how each width reads.
A narrow band sits light and stacks easily: 2 to 4 mm is slim, 5 to 7 mm is the classic middle, 8 to 12 mm is a wide band you notice on the hand. If you fall between two sizes, message us and we will settle it.

MAKE IT YOURS
1. Choose your ring size, whole US 4 through 16.
2. Choose your width, 2 to 12 mm, in a 1.5 or 2.0 mm thickness.
3. Add your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it. The engraving is free, script by default, block letters if you note it, and copied exactly as you type: A & J · June 15, a date, initials, coordinates. Left blank, it ships clean.
Anything more involved, a date in another format or initials only, send us a message before ordering and we will get it right.

WHY EON
I make each band to order in the size and width you choose, then stamp it 18k before it ships.

---
[EON 24 · WHG-R-1803 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k white gold ring$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$beveled edge ring$eon$,$eon$flat wedding band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved ring$eon$,$eon$stacking gold ring$eon$,$eon$solid white gold$eon$]::text[], ARRAY[$eon$18k white gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/11.jpg$eon$, $eon$18k white gold beveled wedding band$eon$, 19320, $eon$18K$eon$, 24) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (25, $eon$RSG-R-1003$eon$, $eon$10K Solid Rose Gold Beveled Wedding Band, 2mm to 12mm$eon$, $eon$A solid 10k rose gold wedding band with beveled edges, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k rose gold, never plated, never filled.
Profile: A flat center framed by angled beveled edges.
Sizes: Whole US sizes 4 to 16.
Widths: 2mm to 12mm, each in a 1.5mm and a 2.0mm thickness.
Hallmark: Stamped 10k inside the band.
The flat face sits level on the finger while the two beveled edges catch the light on either side. Rose gold, warm against the skin, quiet on the hand.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 to 16. Width covers 2mm to 12mm, and you pick the width and its thickness, 1.5mm or 2.0mm, together in the same dropdown.

If you land between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size, whole US sizes 4 to 16.
2. Choose your width, 2mm to 12mm, in a 1.5mm or 2.0mm thickness.
3. Add your engraving in the Personalization box, up to 30 characters, inside the band, copied exactly as you type it. Script is the default; note if you would rather have block letters. One example: A & J, June 15. Leave it blank and the band ships clean.

---
[EON 25 · RSG-R-1003 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$10k rose gold ring$eon$,$eon$solid rose gold band$eon$,$eon$beveled gold band$eon$,$eon$beveled edge ring$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$engraved gold band$eon$,$eon$stacking gold ring$eon$,$eon$wide gold band$eon$,$eon$minimalist gold ring$eon$,$eon$unisex gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/12.jpg$eon$, $eon$10k rose gold beveled wedding band$eon$, 10730, $eon$10K$eon$, 25) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (26, $eon$RSG-R-1403$eon$, $eon$14K Solid Rose Gold Wedding Band, Beveled Edge, 2mm to 12mm$eon$, $eon$A solid 14k rose gold wedding band, a flat face between two beveled edges. Solid gold, never plated or filled, made to order with free engraving inside.

THE DETAILS
Metal: Solid 14k rose gold, never plated, never filled.
Profile: A flat face framed by two angled beveled edges.
Widths: 2mm to 12mm, each in a 1.5mm or 2.0mm thickness.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k inside the band.
The flat face stays quiet while the beveled edges catch the light, and the rose color warms where it meets skin.

SIZE & WIDTH
Two dropdowns build the ring. Pick a whole size from 4 to 16 in Ring Size. Pick your width, 2mm to 12mm, along with its thickness, 1.5mm or 2.0mm, in the Width dropdown.
Width changes the whole look. 2 to 4mm sits slim and stacks easily. 5 to 7mm is the classic wedding width. 8 to 12mm reads as a statement. The 1.5mm build sits closer to the finger; the 2.0mm feels more substantial and stands a little prouder. Wider bands wear snugger than narrow ones, so if you land between sizes, message us before ordering.

MAKE IT YOURS
Ordering runs top to bottom.
1. Choose your ring size.
2. Choose your width and its thickness in the Width dropdown.
3. Add an engraving, or leave it blank.
Engraving is free and sits hidden inside the band, read only by the one wearing it: a date, initials, a few words. Type it in the Personalization box, up to 30 characters, copied exactly as you write it. Script is the default; ask for block letters if you'd rather. A & J · June 15. Left blank, it ships clean.

WHY EON
I cut and finish these one at a time, solid gold with nothing underneath the color. Your band is sized and shaped for your finger, stamped 14k, and made to be worn every day, slept in, knocked around, handed down when the time comes. Solid gold, all the way through.

---
[EON 26 · RSG-R-1403 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$14k rose gold ring$eon$,$eon$rose gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$beveled wedding band$eon$,$eon$flat gold band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$thin gold band$eon$,$eon$stacking gold ring$eon$,$eon$wide gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$14k rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/12.jpg$eon$, $eon$14k rose gold beveled wedding band$eon$, 15820, $eon$14K$eon$, 26) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (27, $eon$RSG-R-1803$eon$, $eon$18K Rose Gold Beveled Wedding Band, Flat Center Angled Edges, 2mm to 12mm$eon$, $eon$Solid 18k rose gold wedding band, never plated, never filled. Made to order in your size and width, with free engraving inside the band. A flat center framed by angled beveled edges.

THE DETAILS
Metal: solid 18k rose gold, never plated, never filled.
Profile: a flat top between two beveled, angled edges.
Widths: 2mm to 12mm, each in 1.5mm and 2.0mm thickness.
Sizes: whole US sizes 4 to 16.
Hallmark: stamped 18k inside the band.
The flat center reads clean head-on. The beveled edges catch light as the hand turns, where the rose gold runs deepest.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 to 16. Width covers 2mm to 12mm, and each width comes in two thicknesses, 1.5mm and 2.0mm; pick the width and the thickness together in the Width dropdown.
If you land between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band, copied exactly as you write it: a date, initials, coordinates, a few words. Script is the default, so note block letters if you want them, and an example might read A & J · June 15. Left blank, it ships clean.

---
[EON 27 · RSG-R-1803 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k rose gold ring$eon$,$eon$rose gold band$eon$,$eon$mens wedding band$eon$,$eon$womens gold band$eon$,$eon$anniversary ring$eon$,$eon$promise ring gift$eon$,$eon$beveled edge ring$eon$,$eon$flat gold band$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved band$eon$,$eon$stacking gold ring$eon$,$eon$wide gold ring$eon$,$eon$his and hers band$eon$]::text[], ARRAY[$eon$Solid 18k rose gold$eon$,$eon$18k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/12.jpg$eon$, $eon$18k rose gold beveled wedding band$eon$, 19320, $eon$18K$eon$, 27) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (28, $eon$GLD-R-1004$eon$, $eon$10K Yellow Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm$eon$, $eon$A solid 10k yellow gold wedding band, milgrain beaded along both edges, never plated and never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, stamped 10k inside the band.
Profile: Milgrain, a fine row of beading worked along both edges.
Widths: 2 to 12 mm, each in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US sizes 4 through 16.
Shipping: Free tracked, ships in 5 to 7 business days.

SIZE & WIDTH
The Ring Size dropdown runs whole US sizes 4 through 16. If you're between two sizes, message us. The Width dropdown runs 2 to 12 mm, each width in two thicknesses, 1.5 mm and 2.0 mm, picked together.

MAKE IT YOURS
1. Choose your ring size, whole US 4 through 16, in the Ring Size dropdown.
2. Choose your width and thickness, 2 to 12 mm at 1.5 or 2.0 mm, in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you type them: a date, initials, a few words, like A & J June 15. Script is the default; note if you would rather have block letters. Left blank, it ships clean.

WHY EON
Solid 10k gold, stamped 10k inside the band. Made to order for a wedding, an anniversary, or a promise.

---
[EON 28 · GLD-R-1004 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold$eon$,$eon$10k gold band$eon$,$eon$milgrain ring$eon$,$eon$beaded edge band$eon$,$eon$wide gold ring$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$unisex gold ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$engraved gold band$eon$,$eon$stacking gold ring$eon$,$eon$custom engraved ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/13.jpg$eon$, $eon$10k yellow gold milgrain wedding band$eon$, 10730, $eon$10K$eon$, 28) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (29, $eon$GLD-R-1404$eon$, $eon$14K Yellow Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm$eon$, $eon$Solid 14k yellow gold wedding band with milgrain beaded edges, not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: Milgrain, a row of fine beading worked along each edge.
Widths: 2 to 12 mm.
Thickness: 1.5 mm or 2.0 mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k inside the band.
The beading catches light in small points as the hand moves, and the yellow gold warms against the skin.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers whole US sizes 4 to 16. Width covers 2 to 12 mm, each offered in two thicknesses, 1.5 mm and 2.0 mm; you pick the width and the thickness together in the Width dropdown.

If you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Add your engraving, or leave it blank.

Type your engraving in the Personalization box, up to 30 characters, set inside the band where only the wearer sees it. It's free. Script is the default; ask for block letters if you'd rather. We copy it exactly as typed, so check the spelling before you send it. Something like A & J · June 15. Left blank, the band ships clean. For anything more particular, a coordinate or a format you don't see here, message us before ordering.

WHY EON
I make each band to order and stamp it 14k inside before it goes out. It's meant to be worn every day, slept in, and handed down when the time comes. EON makes solid gold that outlasts the moment it marks.

---
[EON 29 · GLD-R-1404 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 14k gold$eon$,$eon$14k gold band$eon$,$eon$milgrain ring$eon$,$eon$beaded edge band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$custom engraved ring$eon$,$eon$personalized band$eon$,$eon$stacking gold ring$eon$,$eon$wide gold ring$eon$,$eon$thin gold band$eon$]::text[], ARRAY[$eon$Solid 14k yellow gold$eon$,$eon$14k gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/13.jpg$eon$, $eon$14k yellow gold milgrain wedding band$eon$, 15820, $eon$14K$eon$, 29) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (30, $eon$GLD-R-1804$eon$, $eon$18K Yellow Gold Milgrain Wedding Band, Beaded Edge Ring, 2mm to 12mm$eon$, $eon$A solid 18k yellow gold wedding band with milgrain edges, never plated, never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Solid 18k yellow gold reads deep and warm, a soft glow with weight that settles in the hand. Fine milgrain beading runs each edge, a row of tiny points that catch the light when the hand moves.
Metal: Solid 18k yellow gold, never plated, never filled.
Edges: Milgrain beading along both borders.
Widths: 2 to 12 mm, each offered in a 1.5 mm or 2.0 mm thickness.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Pick your whole size, 4 to 16, in Ring Size. Pick your width and thickness together in the Width dropdown, from 2 to 12 mm, each in a 1.5 mm or 2.0 mm build.
Width is how much ring shows on the hand: 2 to 4 mm sits slim and stacks well, 5 to 7 mm is the classic wedding width, and 8 to 12 mm wears wide and full. Thickness you feel more than see: 1.5 mm sits light and low, 2.0 mm carries more presence against the finger. If you land between whole sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.
The engraving is free, hidden inside the band where only the wearer finds it. A date, initials, coordinates, or a few words, up to 30 characters. We set it in script; say the word if you want block letters. It reads exactly as you type it, so check the spelling. Something like A & J, June 15. Leave it blank and the band ships clean.

WHY EON
I make each band to order at the bench, one size and one width at a time, solid gold the whole way through. It's built to be worn every day, slept in, and handed down when the time comes.

---
[EON 30 · GLD-R-1804 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k gold band$eon$,$eon$milgrain ring$eon$,$eon$beaded edge band$eon$,$eon$solid 18k ring$eon$,$eon$mens wedding band$eon$,$eon$womens wedding band$eon$,$eon$engraved gold band$eon$,$eon$personalized ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$stacking gold ring$eon$,$eon$thin gold band$eon$,$eon$his and hers band$eon$]::text[], ARRAY[$eon$Solid 18k gold$eon$,$eon$18k yellow gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/13.jpg$eon$, $eon$18k yellow gold milgrain wedding band$eon$, 19320, $eon$18K$eon$, 30) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (31, $eon$WHG-R-1004$eon$, $eon$10K White Gold Milgrain Wedding Band, Beaded Edge Vintage Ring, 2mm to 12mm$eon$, $eon$A 10k white gold wedding band with milgrain beaded edges. Solid gold, never plated, never filled, made to order with free engraving inside the band.

THE DETAILS
Metal: solid 10k white gold, never plated, never filled.
Profile: milgrain beaded edges, a fine row of tiny beads set along each side.
Color: a soft, natural white that holds without plating.
Widths: 2mm to 12mm, each in a 1.5mm or 2.0mm thickness.
Sizes: whole US sizes 4 to 16.
Engraving: free, inside the band, up to 30 characters.
Hallmark: stamped 10k inside the band.
The beading catches light in a fine, even line down each edge.

SIZE & WIDTH
Two dropdowns set the ring. Pick your whole US size, 4 to 16, in the Ring Size menu. Pick your width, 2mm to 12mm, and its thickness, 1.5mm or 2.0mm, in the Width menu. If you are unsure of your size, a jeweler's measurement settles it; if you land between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Add your engraving in the Personalization box.
Type up to 30 characters, engraved inside the band and copied exactly as written: a date, initials, a few words. Script is standard; ask for block letters if you prefer them. Something like A & J · June 15 reads well. For a coordinate or another date format, message us before ordering. Left blank, the band ships clean.

WHY EON
I make solid gold, cut to your size and stamped 10k. A quiet, practical white for a ring you keep on, worn every day, slept in, and passed down. No trend to date it, no plating to wear thin.

---
[EON 31 · WHG-R-1004 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$10k gold ring$eon$,$eon$white gold band$eon$,$eon$solid gold ring$eon$,$eon$milgrain band$eon$,$eon$beaded edge ring$eon$,$eon$vintage gold ring$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$thin gold band$eon$,$eon$engraved gold band$eon$,$eon$stacking ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/14.jpg$eon$, $eon$10k white gold milgrain wedding band$eon$, 10730, $eon$10K$eon$, 31) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (32, $eon$WHG-R-1404$eon$, $eon$14K White Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm$eon$, $eon$A 14k white gold Milgrain wedding band, solid gold — not plated, not filled. Made to order in your size and width, with free engraving hidden inside. The beading runs both edges in a fine row: small bright points strung along a cool white band.

THE DETAILS
Metal: Solid 14k white gold, never plated, never filled.
Profile: Milgrain edges, a row of fine beads worked down both sides.
Color: A cool, silver-white that sits bright against skin.
Widths: 2mm through 12mm, offered in two thicknesses.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 14k on the inside.
The beaded edge gives the band a texture your thumb finds without looking, and the light breaks along it in small points instead of one flat shine.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, each offered in a 1.5mm and a 2.0mm thickness, chosen together in the Width menu. If you land between sizes, message us.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box — up to 30 characters, set inside the band where only you see it, copied exactly as you write it. Something like A & J · June 15, or a few initials. Script is standard; ask for block letters if you'd rather. Leave it blank and the band ships clean.

---
[EON 32 · WHG-R-1404 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$milgrain band$eon$,$eon$beaded edge ring$eon$,$eon$solid 14k gold ring$eon$,$eon$14k gold band$eon$,$eon$14k white gold ring$eon$,$eon$womens wedding band$eon$,$eon$mens gold band$eon$,$eon$anniversary ring$eon$,$eon$engraved gold ring$eon$,$eon$stacking gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$promise ring gold$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$14k gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/14.jpg$eon$, $eon$14k white gold milgrain wedding band$eon$, 15820, $eon$14K$eon$, 32) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (33, $eon$WHG-R-1804$eon$, $eon$18K White Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm$eon$, $eon$A solid 18k white gold wedding band, milgrain beaded at the edges. Never plated, never filled, made to order in your size, with free engraving inside the band. The milgrain runs as a fine row of beads down both edges.

THE DETAILS
Metal: Solid 18k white gold, never plated, never filled.
Edges: Fine milgrain beading worked down both sides.
Widths: 2mm to 12mm, each offered in 1.5mm and 2.0mm thicknesses.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm to 12mm, and each width comes in two thicknesses, 1.5mm and 2.0mm, picked together in the Width dropdown.
If you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size, whole US 4 through 16, in the Ring Size dropdown.
2. Choose your width and thickness, 2mm to 12mm in 1.5mm or 2.0mm, in the Width dropdown.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band and copied exactly as you write it, like A & J · June 15. Script is the default; note block letters if you prefer them. Left blank, it ships clean.
Engraving is free.

WHY EON
I cut and finish each band to order at the bench, then stamp it 18k inside. Solid gold, all the way through.

---
[EON 33 · WHG-R-1804 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 18k gold ring$eon$,$eon$18k white gold band$eon$,$eon$milgrain gold band$eon$,$eon$beaded edge ring$eon$,$eon$wide gold band$eon$,$eon$womens gold band$eon$,$eon$mens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring gift$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved band$eon$,$eon$stacking gold ring$eon$,$eon$thin gold band$eon$]::text[], ARRAY[$eon$18k white gold$eon$,$eon$Solid gold$eon$,$eon$White gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/14.jpg$eon$, $eon$18k white gold milgrain wedding band$eon$, 19320, $eon$18K$eon$, 33) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (34, $eon$RSG-R-1004$eon$, $eon$10K Rose Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm$eon$, $eon$A solid 10k rose gold wedding band with milgrain beaded edges — not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k gold, never plated, never filled.
Profile: Milgrain, fine beads of gold worked along both edges.
Widths: 2mm to 12mm, each in 1.5mm and 2.0mm thickness.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 10k inside the band.
The beading catches light in a fine line along each edge.

SIZE & WIDTH
Two dropdowns build the ring. Ring Size covers whole US sizes 4 through 16. Width runs 2mm to 12mm, each offered in 1.5mm and 2.0mm thickness, chosen together in the Width menu. If you fall between sizes, message us before ordering.

MAKE IT YOURS
Three steps, in the order the page asks.
1. Choose your ring size.
2. Choose your width and thickness.
3. Add an engraving, or leave it off. Type up to 30 characters in the Personalization box; they go inside the band, reproduced exactly as written: a date, initials, a short line. Script is standard; note in the box if you want block letters. Left blank, it ships clean, and the engraving is free.

WHY EON
I make these to order in the size and width you choose. A milgrain band like this is meant to be worn every day, slept in, and handed down the way old rings are. Solid gold, all the way through, and stamped 10k so it always reads true.

---
[EON 34 · RSG-R-1004 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold ring$eon$,$eon$10k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$milgrain ring$eon$,$eon$beaded edge band$eon$,$eon$vintage style ring$eon$,$eon$stacking ring$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$thin gold band$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved ring$eon$]::text[], ARRAY[$eon$Solid 10k rose gold$eon$,$eon$10k gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/15.jpg$eon$, $eon$10k rose gold milgrain wedding band$eon$, 10730, $eon$10K$eon$, 34) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (35, $eon$RSG-R-1404$eon$, $eon$14K Rose Gold Milgrain Wedding Band, Vintage Beaded Edge Ring, 2mm to 12mm$eon$, $eon$A 14k rose gold milgrain wedding band, solid gold, never plated, never filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: solid 14k rose gold, never plated, never filled.
Profile: a band edged in beaded milgrain on both sides.
Widths: 2mm to 12mm, each in a 1.5mm and a 2.0mm thickness.
Sizes: whole US sizes 4 through 16.
Hallmark: stamped 14k inside the band.
Rose gold reads warm and pink against the skin, and the milgrain catches light in a fine row of points along each edge.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers whole US sizes 4 through 16. Width covers 2mm through 12mm, and each width comes in two thicknesses, 1.5mm and 2.0mm, chosen together in the same Width dropdown. The widths look different on the hand: 2 to 4mm sits slim and stacks easily, 5 to 7mm is the classic everyday band, and 8 to 12mm makes a wider, bolder band. The 1.5mm is the lighter build, the 2.0mm the heavier. If you fall between two whole sizes, message us before ordering.

MAKE IT YOURS
1. Choose your ring size, whole US 4 through 16.
2. Choose your width and thickness, 2mm to 12mm in a 1.5mm or 2.0mm build.
3. Add an engraving in the Personalization box: up to 30 characters set inside the band, copied exactly as you type it. Something like "A & J, June 15", or a few initials. Script is the default; ask for block letters if you'd rather. Left blank, it ships clean.

WHY EON
Solid 14k rose gold, all the way through. Stamped 14k inside the band and made to order in your size, for a wedding, an anniversary, or a promise.

---
[EON 35 · RSG-R-1404 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$14k rose gold ring$eon$,$eon$solid 14k gold band$eon$,$eon$milgrain gold ring$eon$,$eon$beaded edge ring$eon$,$eon$vintage wedding band$eon$,$eon$unisex wedding band$eon$,$eon$womens gold band$eon$,$eon$mens gold ring$eon$,$eon$anniversary ring$eon$,$eon$stacking gold ring$eon$,$eon$engraved gold band$eon$,$eon$custom engraved ring$eon$,$eon$thin gold band$eon$]::text[], ARRAY[$eon$Solid 14k gold$eon$,$eon$14k rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/15.jpg$eon$, $eon$14k rose gold milgrain wedding band$eon$, 15820, $eon$14K$eon$, 35) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (36, $eon$RSG-R-1804$eon$, $eon$18K Rose Gold Milgrain Wedding Band, Vintage Beaded Edge Ring, 2mm to 12mm$eon$, $eon$Solid 18k rose gold milgrain wedding band, warm all the way through, not plated, not filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k rose gold, never plated, never filled.
Edges: Milgrain, a fine row of raised beads worked along each rim.
Color: A deep, even rose with a soft glow.
Widths: 2 to 12mm, each in two thicknesses, 1.5 and 2.0mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 18k inside the band.
The beads catch light in a fine dotted line down each edge, and the rose runs warm the whole way round.

SIZE & WIDTH
Two dropdowns build your ring. Ring Size covers whole US sizes 4 through 16. Width covers 2 through 12mm, and every width comes in two thicknesses, 1.5 and 2.0mm, chosen together.
Narrow widths, 2 to 4mm, sit light and stack well. The 5 to 7mm range is a classic band width. From 8 to 12mm the band covers more of the finger. The 1.5mm thickness sits lower; the 2.0mm sits a little higher. Wider bands wear a touch snugger, so if you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box. Up to 30 characters, set inside the band where only the wearer sees it. A date, initials, a few words: "A & J · June 15" reads just fine. It is copied exactly as you type it, script by default, block letters if you note that. The engraving is free. Leave it blank and the band ships clean. For anything more particular, a coordinate or a second line, send a message before ordering.

WHY EON
I make each band to order at the bench, one ring at a time, in solid gold stamped 18k. This is gold meant to be worn every day, slept in, and handed down when the time comes. No trends to chase. Just the ring that lasts.

---
[EON 36 · RSG-R-1804 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$milgrain band$eon$,$eon$beaded edge ring$eon$,$eon$18k rose gold ring$eon$,$eon$solid 18k gold band$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$gold promise ring$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved band$eon$,$eon$thin stacking ring$eon$,$eon$vintage gold ring$eon$,$eon$wide gold band$eon$]::text[], ARRAY[$eon$Solid 18k gold$eon$,$eon$Rose gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/15.jpg$eon$, $eon$18k rose gold milgrain wedding band$eon$, 19320, $eon$18K$eon$, 36) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (37, $eon$GLD-R-1005$eon$, $eon$10K Solid Yellow Gold Wedding Band, Knife Edge Profile, 2mm to 12mm$eon$, $eon$Solid 10k yellow gold wedding band with a knife edge profile — not plated, not filled. Made to order in your size and width, with free engraving inside the band.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Profile: A knife edge. Two flat faces angle up to a soft ridge down the center, a fine line the light runs along.
Color: A quiet, even yellow, an honest gold made to be worn rather than saved for good.
Widths: 2 to 12 mm, each offered in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US sizes 4 through 16.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2 mm through 12 mm, each in two thicknesses, 1.5 mm and 2.0 mm, chosen together.
A slim 2 to 4 mm stacks well; 5 to 7 mm is the classic width. Go wider, 8 to 12 mm, for a bolder band. The 1.5 mm thickness sits lower against the finger and the 2.0 mm stands a little taller. If you sit between sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size (whole US 4 through 16) in the Ring Size dropdown.
2. Choose your width and thickness in the Width dropdown.
3. Type your engraving in the Personalization box: up to 30 characters, set inside the band, copied exactly as you type it. Script is the default; add a note if you would rather have block letters. Something like A & J · June 15, or your own words. Left blank, it ships clean.

WHY EON
I make each band to order, one at a time, in the size and width you choose. It is meant to be worn every day, slept in, handed down. Solid gold the whole way through, not a layer over something else.

---
[EON 37 · GLD-R-1005 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$solid 10k gold ring$eon$,$eon$10k gold band$eon$,$eon$knife edge ring$eon$,$eon$architectural ring$eon$,$eon$mens wedding band$eon$,$eon$womens wedding ring$eon$,$eon$anniversary ring$eon$,$eon$his and hers ring$eon$,$eon$engraved gold ring$eon$,$eon$custom engraved band$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$minimalist gold ring$eon$]::text[], ARRAY[$eon$Solid gold$eon$,$eon$10k gold$eon$,$eon$Yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/16.jpg$eon$, $eon$10k yellow gold knife edge wedding band$eon$, 10730, $eon$10K$eon$, 37) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (38, $eon$GLD-R-1405$eon$, $eon$14K Yellow Gold Knife Edge Wedding Band, 2mm to 12mm$eon$, $eon$A solid 14k yellow gold wedding band with a knife edge that climbs to a soft ridge down the center. Never plated, never filled. Made to order, free engraving inside.

The center ridge catches a single line of light that travels as the hand moves, bright against the warm yellow. This is gold you can pick out across a room.

THE DETAILS
Metal: Solid 14k yellow gold, never plated, never filled.
Profile: Knife edge sides rising to a soft ridge at the center.
Widths: 2 to 12 mm, each in two thicknesses, 1.5 mm and 2.0 mm.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 14k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2 through 12 mm, and each width comes in two thicknesses, 1.5 mm and 2.0 mm, picked together in the Width dropdown.
A 2 to 4 mm band reads slim and stacks well. 5 to 7 mm is the classic wedding width. 8 to 12 mm covers more of the finger and carries more weight. The 1.5 mm build stays light on the hand; 2.0 mm gives the ridge more height and presence. If you land between two sizes, message us before you order.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Type your engraving in the Personalization box.
Up to 30 characters, set inside the band where only the wearer sees it: a date, initials, or a short line, like A & J. Script is the default; ask for block letters instead. It's engraved exactly as typed, so check the spelling. Left blank, the band ships clean.

WHY EON
EON makes solid gold meant to outlast the moment it marks. I make each band to order, for the hand it's going on. The kind of ring you wear now and hand down later, worn daily and slept in.

---
[EON 38 · GLD-R-1405 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$14k gold band$eon$,$eon$solid gold ring$eon$,$eon$knife edge ring$eon$,$eon$knife edge band$eon$,$eon$mens wedding band$eon$,$eon$womens gold ring$eon$,$eon$unisex wedding ring$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$engraved gold ring$eon$,$eon$thin gold band$eon$,$eon$wide gold band$eon$,$eon$modern gold ring$eon$]::text[], ARRAY[$eon$Solid 14k gold$eon$,$eon$14k yellow gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/16.jpg$eon$, $eon$14k yellow gold knife edge wedding band$eon$, 15820, $eon$14K$eon$, 38) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values (39, $eon$GLD-R-1805$eon$, $eon$18K Yellow Gold Knife Edge Wedding Band, Center Ridge Profile, 2mm to 12mm$eon$, $eon$A solid 18k yellow gold wedding band with a knife edge profile. Never plated, never filled. Made to order in your size, with free engraving inside the band.

THE DETAILS
Metal: Solid 18k yellow gold, never plated, never filled.
Profile: A knife edge, the two faces angling up to a soft ridge down the center.
Color: A deep, warm yellow. There is a lot of gold in 18k, and it shows in the hand.
Feel: The ridge picks up a thin line of light as your hand moves; the faces stay quiet.
Widths: 2 to 12 mm, each in a 1.5 mm and a 2.0 mm thickness.
Sizes: Whole US sizes 4 to 16.
Hallmark: Stamped 18k inside the band.

SIZE & WIDTH
Two dropdowns set the ring. Ring Size covers whole US sizes 4 through 16. Width covers 2 through 12 mm, and each width comes in two thicknesses, 1.5 mm and 2.0 mm, chosen together in the same dropdown. Sitting between two sizes? Message us before ordering.

A band at 2 to 4 mm reads slim and stacks easily. 5 to 7 mm sits as a classic single band, and 8 to 12 mm wears as a statement. The two thicknesses change how much ring you feel: 1.5 mm is lighter on the hand, and 2.0 mm gives the knife edge more depth and a firmer presence.

MAKE IT YOURS
1. Choose your ring size.
2. Choose your width and thickness.
3. Add an engraving, free. Type it in the Personalization box and it goes inside the band, copied exactly as you write it, up to 30 characters. Script is the default; say so if you want block letters. A date, initials, or a line like A & J, June 15. Left blank, the band ships clean.

WHY EON
I make each EON band to order at the bench, one ring at a time, in solid gold that is stamped and meant to be kept. It is the kind of ring you wear every day, sleep in, and hand down when the time comes. No trends to chase. Just the ring, made to last.

---
[EON 39 · GLD-R-1805 · Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger (2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]$eon$, ARRAY[$eon$18k gold ring$eon$,$eon$solid 18k band$eon$,$eon$mens wedding band$eon$,$eon$unisex gold ring$eon$,$eon$knife edge ring$eon$,$eon$modern gold band$eon$,$eon$anniversary ring$eon$,$eon$promise ring$eon$,$eon$thin gold band$eon$,$eon$wide gold ring$eon$,$eon$stacking gold ring$eon$,$eon$custom engraved ring$eon$,$eon$engraved gold band$eon$]::text[], ARRAY[$eon$18k yellow gold$eon$,$eon$Solid gold$eon$]::text[], $eon$https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/16.jpg$eon$, $eon$18k yellow gold knife edge wedding band$eon$, 19320, $eon$18K$eon$, 39) on conflict (no) do update set family=excluded.family, title=excluded.title, description=excluded.description, tags=excluded.tags, materials=excluded.materials, image_url=excluded.image_url, research_keyword=excluded.research_keyword, ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;
insert into eon_seed_grams (karat, width, thick, grams) values
('10K',2,'1.5','{1.37,1.43,1.5,1.57,1.63,1.7,1.77,1.83,1.9,1.97,2.03,2.1,2.16}'::numeric[]),
('10K',2,'2','{1.88,1.97,2.06,2.15,2.23,2.32,2.41,2.5,2.59,2.68,2.76,2.85,2.94}'::numeric[]),
('10K',3,'1.5','{2.05,2.15,2.25,2.35,2.45,2.55,2.65,2.75,2.85,2.95,3.05,3.15,3.25}'::numeric[]),
('10K',3,'2','{2.82,2.95,3.09,3.22,3.35,3.48,3.62,3.75,3.88,4.01,4.15,4.28,4.41}'::numeric[]),
('10K',4,'1.5','{2.74,2.87,3.0,3.14,3.27,3.4,3.53,3.67,3.8,3.93,4.06,4.2,4.33}'::numeric[]),
('10K',4,'2','{3.76,3.94,4.11,4.29,4.47,4.64,4.82,5.0,5.18,5.35,5.53,5.71,5.88}'::numeric[]),
('10K',5,'1.5','{3.42,3.59,3.75,3.92,4.08,4.25,4.42,4.58,4.75,4.91,5.08,5.29,5.42}'::numeric[]),
('10K',5,'2','{4.7,4.92,5.14,5.36,5.58,5.81,6.03,6.25,6.47,6.69,6.91,7.13,7.35}'::numeric[]),
('10K',6,'1.5','{4.11,4.3,4.5,4.7,4.9,5.1,5.3,5.5,5.7,5.9,6.1,6.29,6.49}'::numeric[]),
('10K',6,'2','{5.64,5.91,6.17,6.44,6.7,6.97,7.23,7.5,7.76,8.03,8.29,8.56,8.82}'::numeric[]),
('10K',7,'1.5','{4.79,5.02,5.25,5.49,5.72,5.95,6.18,6.42,6.65,6.88,7.11,7.34,7.58}'::numeric[]),
('10K',7,'2','{6.58,6.89,7.2,7.51,7.82,8.13,8.44,8.75,9.06,9.37,9.68,9.99,10.3}'::numeric[]),
('10K',8,'1.5','{5.47,5.74,6.0,6.27,6.54,6.8,7.07,7.33,7.6,7.86,8.13,8.39,8.66}'::numeric[]),
('10K',8,'2','{7.52,7.87,8.23,8.53,8.92,9.27,9.62,9.97,10.32,10.7,11.06,11.41,11.77}'::numeric[]),
('10K',9,'1.5','{6.16,6.46,6.76,7.05,7.35,7.65,7.95,8.25,8.55,8.85,9.14,9.44,9.74}'::numeric[]),
('10K',9,'2','{8.46,8.86,9.26,9.65,10.05,10.45,10.85,11.25,11.64,12.04,12.44,12.84,13.24}'::numeric[]),
('10K',10,'1.5','{6.84,7.17,7.51,7.84,8.17,8.5,8.83,9.16,9.5,9.83,10.16,10.49,10.82}'::numeric[]),
('10K',10,'2','{9.4,9.84,10.28,10.73,11.17,11.61,12.05,12.5,12.94,13.38,13.82,14.27,14.71}'::numeric[]),
('10K',11,'1.5','{7.53,7.89,8.26,8.62,8.99,9.35,9.72,10.08,10.45,10.81,11.18,11.53,11.91}'::numeric[]),
('10K',11,'2','{10.34,10.83,11.31,11.8,12.29,12.77,13.26,13.75,14.23,14.72,15.21,15.69,16.18}'::numeric[]),
('10K',12,'1.5','{8.21,8.61,9.01,9.41,9.8,10.2,10.6,11.0,11.4,11.79,12.19,12.59,12.99}'::numeric[]),
('10K',12,'2','{11.28,11.81,12.34,12.87,13.4,13.93,14.46,15.0,15.53,16.06,16.59,17.12,17.65}'::numeric[])
on conflict (karat, width, thick) do update set grams = excluded.grams;
insert into eon_seed_grams (karat, width, thick, grams) values
('14K',2,'1.5','{1.56,1.63,1.71,1.78,1.86,1.93,2.01,2.08,2.16,2.23,2.31,2.38,2.4}'::numeric[]),
('14K',2,'2','{2.14,2.24,2.34,2.44,2.54,2.64,2.74,2.84,2.94,3.04,3.14,3.24,3.34}'::numeric[]),
('14K',3,'1.5','{2.33,2.45,2.56,2.67,2.79,2.9,3.01,3.12,3.24,3.35,3.46,3.58,3.69}'::numeric[]),
('14K',3,'2','{3.2,3.36,3.51,3.66,3.81,3.96,4.11,4.26,4.41,4.56,4.71,4.86,5.01}'::numeric[]),
('14K',4,'1.5','{3.11,3.26,3.41,3.56,3.71,3.86,4.01,4.17,4.32,4.47,4.62,4.77,4.92}'::numeric[]),
('14K',4,'2','{4.27,4.47,4.67,4.88,5.08,5.28,5.48,5.68,5.88,6.08,6.28,6.48,6.69}'::numeric[]),
('14K',5,'1.5','{3.89,4.06,4.26,4.45,4.64,4.83,5.02,5.21,5.4,5.58,5.77,5.96,6.15}'::numeric[]),
('14K',5,'2','{5.34,5.59,5.84,6.09,6.35,6.6,6.85,7.1,7.35,7.6,7.85,8.11,8.36}'::numeric[]),
('14K',6,'1.5','{4.67,4.89,5.12,5.34,5.57,5.8,6.02,6.25,6.47,6.7,6.93,7.15,7.38}'::numeric[]),
('14K',6,'2','{6.41,6.71,7.01,7.31,7.62,7.92,8.22,8.52,8.82,9.12,9.42,9.73,10.03}'::numeric[]),
('14K',7,'1.5','{5.44,5.71,5.97,6.23,6.5,6.76,7.03,7.29,7.55,7.82,8.08,8.35,8.61}'::numeric[]),
('14K',7,'2','{7.48,7.83,8.18,8.53,8.88,9.24,9.59,9.94,10.29,10.64,11.0,11.35,11.7}'::numeric[]),
('14K',8,'1.5','{6.22,6.52,6.82,7.13,7.43,7.73,8.03,8.33,8.63,8.93,9.24,9.54,9.84}'::numeric[]),
('14K',8,'2','{8.55,8.95,9.35,9.75,10.15,10.56,10.96,11.36,11.76,12.16,12.57,12.97,13.37}'::numeric[]),
('14K',9,'1.5','{7.0,7.34,7.68,8.02,8.36,8.69,9.03,9.37,9.71,10.05,10.39,10.73,11.07}'::numeric[]),
('14K',9,'2','{9.61,10.07,10.52,10.97,11.42,11.88,12.33,12.78,13.23,13.68,14.14,14.59,15.04}'::numeric[]),
('14K',10,'1.5','{7.78,8.15,8.53,8.91,9.28,9.66,10.04,10.41,10.79,11.17,11.55,11.92,12.3}'::numeric[]),
('14K',10,'2','{10.68,11.18,11.69,12.19,12.69,13.19,13.7,14.2,14.7,15.21,15.71,16.21,16.71}'::numeric[]),
('14K',11,'1.5','{8.55,8.97,9.38,9.8,10.21,10.63,11.04,11.46,11.87,12.29,12.7,13.11,13.53}'::numeric[]),
('14K',11,'2','{11.75,12.3,12.86,13.41,13.96,14.51,15.07,15.62,16.17,16.73,17.28,17.83,18.38}'::numeric[]),
('14K',12,'1.5','{9.33,9.78,10.24,10.69,11.14,11.59,12.04,12.5,12.95,13.4,13.85,14.31,14.76}'::numeric[]),
('14K',12,'2','{12.82,13.42,14.02,14.63,15.23,15.83,16.44,17.02,17.64,18.25,18.85,19.45,20.06}'::numeric[])
on conflict (karat, width, thick) do update set grams = excluded.grams;
insert into eon_seed_grams (karat, width, thick, grams) values
('18K',2,'1.5','{2.04,2.15,2.26,2.36,2.47,2.57,2.68,2.78,2.89,3.0,3.13,3.26,3.36}'::numeric[]),
('18K',2,'2','{2.52,2.69,2.87,3.04,3.22,3.38,3.58,3.73,3.91,4.08,4.21,4.36,4.56}'::numeric[]),
('18K',3,'1.5','{2.64,2.76,2.88,3.0,3.12,3.24,3.36,3.48,3.6,3.72,3.85,4.01,4.08}'::numeric[]),
('18K',3,'2','{3.96,4.16,4.36,4.56,4.76,4.96,5.16,5.36,5.56,5.76,5.9,6.04,6.36}'::numeric[]),
('18K',4,'1.5','{3.6,3.74,3.89,4.04,4.19,4.33,4.48,4.63,4.78,4.92,5.04,5.17,5.4}'::numeric[]),
('18K',4,'2','{5.16,5.39,5.62,5.84,6.07,6.29,6.52,6.74,6.97,7.2,7.44,7.68,7.92}'::numeric[]),
('18K',5,'1.5','{4.56,4.75,4.93,5.12,5.3,5.5,5.68,5.87,6.05,6.24,6.37,6.5,7.01}'::numeric[]),
('18K',5,'2','{6.72,6.98,7.25,7.52,7.79,8.05,8.32,8.59,8.86,9.12,9.36,9.6,9.96}'::numeric[]),
('18K',6,'1.5','{5.4,5.63,5.86,6.08,6.31,6.53,6.76,6.98,7.21,7.44,7.57,7.93,8.16}'::numeric[]),
('18K',6,'2','{8.04,8.35,8.65,8.96,9.26,9.58,9.88,10.19,10.49,10.8,11.04,11.28,11.76}'::numeric[]),
('18K',7,'1.5','{5.88,6.14,6.41,6.68,6.95,7.21,7.48,7.75,8.02,8.28,8.4,8.64,9.12}'::numeric[]),
('18K',7,'2','{9.2,9.65,10.09,10.53,10.97,11.47,11.86,12.38,12.73,13.18,13.63,13.9,14.48}'::numeric[]),
('18K',8,'1.5','{6.48,6.77,7.07,7.36,7.66,7.94,8.24,8.53,8.83,9.12,9.36,9.6,9.96}'::numeric[]),
('18K',8,'2','{10.2,10.92,11.34,11.7,12.12,12.6,13.06,13.56,13.98,14.4,14.82,15.12,15.72}'::numeric[]),
('18K',9,'1.5','{7.98,8.36,8.75,9.14,9.52,9.91,10.3,10.69,11.07,11.46,11.85,12.23,12.62}'::numeric[]),
('18K',9,'2','{10.96,11.47,11.99,12.51,13.02,13.51,14.05,14.57,15.08,15.6,16.12,16.63,17.15}'::numeric[]),
('18K',10,'1.5','{8.86,9.29,9.72,10.15,10.58,11.01,11.44,11.58,12.3,12.73,13.16,13.59,14.02}'::numeric[]),
('18K',10,'2','{12.18,12.75,13.32,13.9,14.47,15.04,15.61,16.19,16.76,17.33,17.91,18.48,19.05}'::numeric[]),
('18K',11,'1.5','{9.75,10.22,10.7,11.17,11.64,12.11,12.59,13.06,13.53,14.01,14.48,14.95,15.42}'::numeric[]),
('18K',11,'2','{13.39,14.02,14.66,15.29,15.92,16.55,17.18,17.81,18.44,19.07,19.7,20.33,20.96}'::numeric[]),
('18K',12,'1.5','{10.64,11.15,11.67,12.18,12.7,13.22,13.73,14.24,14.76,15.28,15.79,16.31,16.83}'::numeric[]),
('18K',12,'2','{14.61,15.3,15.99,16.68,17.36,18.05,18.74,19.43,20.11,20.8,21.49,22.18,22.86}'::numeric[])
on conflict (karat, width, thick) do update set grams = excluded.grams;
-- 39 ürün + 11.154 varyant tek atımda (staging'den türetilir)
with eon as (select id from organizations where name = 'EON'),
ins as (
  insert into products (org_id, sku, title, description, tags, materials, status,
                        currency, quantity, has_variations, image_url, research_keyword,
                        research_group)
  select eon.id, t.family, t.title, t.description, t.tags, t.materials, 'draft',
         'USD', 20, true, t.image_url, t.research_keyword, t.research_group
  from eon_seed_texts t, eon
  -- İdempotent + zaten-canlı yıldızı ATLA: org'da aynı sku varsa ekleme.
  where not exists (
    select 1 from products p2 where p2.org_id = eon.id and p2.sku = t.family
  )
  returning id, sku
),
sizes as (
  select s.size, s.i from unnest(ARRAY[4,5,6,7,8,9,10,11,12,13,14,15,16]) with ordinality as s(size, i)
),
vrows as (
  select p.id as product_id, t.family, t.karat, t.ppg_cents,
         g.width, g.thick, s.size, g.grams[s.i] as grams
  from ins p
  join eon_seed_texts t on t.family = p.sku
  join eon_seed_grams g on g.karat = t.karat
  cross join sizes s
)
insert into product_variants (org_id, sku, product_id, properties, price_cents,
                              quantity, weight_grams, weight_source, active, currency)
select (select id from eon),
       v.family || '-' || v.width || 'MM-' || (case v.thick when '1.5' then 'T15' else 'T20' end) || '-' || v.size,
       v.product_id,
       jsonb_build_object(
         'Karat', v.karat,
         'Metal', (case split_part(v.family, '-', 1)
                     when 'GLD' then 'Yellow Gold'
                     when 'WHG' then 'White Gold'
                     when 'RSG' then 'Rose Gold' end),
         'Width', v.width || 'mm · ' || (case v.thick when '1.5' then '1.5' else '2.0' end) || 'mm thick',
         'Ring Size', v.size::text
       ),
       (ceil((v.grams * v.ppg_cents) / 500.0) * 500 + 1000)::int,
       20, v.grams, 'catalog_v2', true, 'USD'
from vrows v;

-- Ürün çapa fiyatı = en düşük varyant fiyatı
update products p set price_cents = m.minp, updated_at = now()
from (select product_id, min(price_cents) as minp from product_variants group by product_id) m
where m.product_id = p.id
  and p.org_id = (select id from organizations where name = 'EON')
  and p.sku in (select family from eon_seed_texts);

drop table if exists eon_seed_texts; drop table if exists eon_seed_grams;

commit;
