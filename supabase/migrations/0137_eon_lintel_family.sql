-- 0137_eon_lintel_family.sql
-- EON profil 08 — "The Lintel": genis satine fircalanmis merkez + dar ayna
-- parlatilmis yuvarlak raylar, comfort fit. 3 ayar x 3 renk = 9 listing.
--
-- KAYNAK METIN: docs/eon/lintel/<NN>/ — kullanicinin Dropbox'a koydugu
--   /11-etsy-upload-packages/ paketlerinin birebir kopyasi. Placeholder'lar
--   ([[HALLMARK]], [[ALLOY_COMPOSITION]], ...) CANLI ev metinlerinden
--   (GLD-R-1001 / WHG-R-1401 aciklamalari) cozuldu; uydurma bilgi YOK.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>, profil 08.
--   Paketin kendi semasi (LNT-10K-YG-S75-W6) REDDEDILDI: karat ayrigtirma,
--   genislik regex'i ve fiyat itisi ev semasina anahtarli (bkz. runbook).
--
-- VARYANT EKSENI: 9 genislik (4-12mm) x 25 beden (US 4-16 tam+yarim) = 225.
--   Kullanici kurali 2026-08-11: 2mm ve 3mm YOK, en dar 4mm.
--   9 listing x 225 = 2.025 varyant.
--
-- FIYAT + GRAM: ayar-es DOME ailesinden BIREBIR kopyalanir (runbook karari;
--   Lintel standart iscilik sinifi, profil yalnizca iscilligi degistirir ve
--   standart profiller ayni fiyattadir). Panelde fiyat HESAPLANMAZ (0119
--   externalPricing). Renk-bagimsizligi 225/225 hucrede dogrulandi (ayni
--   ayarda GLD/WHG/RSG fiyat+gram birebir), bu yuzden ayar basina tek
--   kanonik kaynak: 10K<-GLD-R-1001, 14K<-WHG-R-1401, 18K<-GLD-R-1801.
--   (14K'da GLD-R-1401 gramsiz oldugu icin WHG-R-1401 secildi.)
--
-- Panelde LISTING ONERISI olarak durur (status='draft', etsy_listing_id
--   null). Etsy'ye gonderim ayri adim: app/api/ops/lintel-drafts.
--
-- Uretici: scripts/gen_lintel_catalog.py — ELLE DUZENLEMEYIN.

-- Idempotent: aile varsa urun yeniden eklenmez, metin kanonik surumle
-- esitlenir; varyantlar sku uzerinden upsert edilir.

-- ============================ GLD-R-1008 (10K Yellow Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$GLD-R-1008$lnt$,
    $lnt$10K Solid Yellow Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 10K yellow gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 10k yellow gold, stamped 10k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
10K yellow gold generally reads as a pale champagne yellow. Its higher alloy content can give the satin center a crisp, restrained color beside the polished rails. Exact color shifts with the light it is seen in.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 10k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin gold band$lnt$,$lnt$brushed gold ring$lnt$,$lnt$polished edge ring$lnt$,$lnt$solid 10k gold$lnt$,$lnt$yellow gold band$lnt$,$lnt$wide mens ring$lnt$,$lnt$comfort fit ring$lnt$,$lnt$matte center band$lnt$,$lnt$unisex gold ring$lnt$,$lnt$groom wedding band$lnt$,$lnt$minimalist ring$lnt$,$lnt$everyday gold band$lnt$,$lnt$modern heirloom$lnt$]::text[],
    ARRAY[$lnt$Solid 10k gold$lnt$,$lnt$Yellow Gold$lnt$]::text[],
    $lnt$10k yellow gold satin center wedding band$lnt$,
    43::smallint,
    $lnt$/eon/gld-r-1008/01.jpg$lnt$,
    $lnt$GLD-R-1001-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$GLD-R-1008$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$10K$lnt$,
    'Metal', $lnt$Yellow Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$GLD-R-1001-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$GLD-R-1008$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ WHG-R-1008 (10K White Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$WHG-R-1008$lnt$,
    $lnt$10K Solid White Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 10K white gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 10k white gold, stamped 10k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
10K white gold generally reads as a cool pale gray-white. This band is left unplated, so the white you see is the alloy itself rather than a rhodium coating that wears thin over time.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 10k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin white gold$lnt$,$lnt$brushed white gold$lnt$,$lnt$polished edge band$lnt$,$lnt$solid 10k ring$lnt$,$lnt$white gold band$lnt$,$lnt$10k white gold$lnt$,$lnt$wide mens band$lnt$,$lnt$comfort fit band$lnt$,$lnt$cool tone ring$lnt$,$lnt$unisex wedding ring$lnt$,$lnt$modern groom ring$lnt$,$lnt$minimalist band$lnt$,$lnt$heirloom gold ring$lnt$]::text[],
    ARRAY[$lnt$Solid 10k gold$lnt$,$lnt$White Gold$lnt$]::text[],
    $lnt$10k white gold satin center wedding band$lnt$,
    44::smallint,
    $lnt$/eon/whg-r-1008/01.jpg$lnt$,
    $lnt$GLD-R-1001-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$WHG-R-1008$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$10K$lnt$,
    'Metal', $lnt$White Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$GLD-R-1001-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$WHG-R-1008$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ RSG-R-1008 (10K Rose Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$RSG-R-1008$lnt$,
    $lnt$10K Solid Rose Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 10K rose gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 10k rose gold, stamped 10k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
10K rose gold generally shows a more copper-led blush than higher-karat rose gold. The satin field tempers that warmth while the polished rails reveal a brighter edge. Exact color shifts with the light it is seen in.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 10k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin rose gold$lnt$,$lnt$brushed rose ring$lnt$,$lnt$polished edge band$lnt$,$lnt$solid 10k rose$lnt$,$lnt$rose gold band$lnt$,$lnt$wide wedding ring$lnt$,$lnt$comfort fit ring$lnt$,$lnt$mens rose gold$lnt$,$lnt$unisex gold ring$lnt$,$lnt$warm tone jewelry$lnt$,$lnt$modern wedding ring$lnt$,$lnt$minimalist band$lnt$,$lnt$heirloom ring gift$lnt$]::text[],
    ARRAY[$lnt$Solid 10k gold$lnt$,$lnt$Rose Gold$lnt$]::text[],
    $lnt$10k rose gold satin center wedding band$lnt$,
    45::smallint,
    $lnt$/eon/rsg-r-1008/01.jpg$lnt$,
    $lnt$GLD-R-1001-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$RSG-R-1008$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$10K$lnt$,
    'Metal', $lnt$Rose Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$GLD-R-1001-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$RSG-R-1008$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ GLD-R-1408 (14K Yellow Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$GLD-R-1408$lnt$,
    $lnt$14K Solid Yellow Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 14K yellow gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 14k yellow gold, stamped 14k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
14K yellow gold has a balanced, classic yellow tone. It sits between the paler restraint of 10K and the richer depth of 18K, with a warm satin center and clear polished rails. Exact color shifts with the light it is seen in.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 14k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin gold band$lnt$,$lnt$brushed 14k ring$lnt$,$lnt$polished edge ring$lnt$,$lnt$solid 14k gold$lnt$,$lnt$yellow gold ring$lnt$,$lnt$wide mens band$lnt$,$lnt$comfort fit ring$lnt$,$lnt$classic wedding ring$lnt$,$lnt$unisex gold band$lnt$,$lnt$groom band 14k$lnt$,$lnt$modern heirloom$lnt$,$lnt$minimalist gold$lnt$,$lnt$anniversary ring$lnt$]::text[],
    ARRAY[$lnt$Solid 14k gold$lnt$,$lnt$Yellow Gold$lnt$]::text[],
    $lnt$14k yellow gold satin center wedding band$lnt$,
    46::smallint,
    $lnt$/eon/gld-r-1408/01.jpg$lnt$,
    $lnt$WHG-R-1401-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$GLD-R-1408$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$14K$lnt$,
    'Metal', $lnt$Yellow Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$WHG-R-1401-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$GLD-R-1408$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ WHG-R-1408 (14K White Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$WHG-R-1408$lnt$,
    $lnt$14K Solid White Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 14K white gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 14k white gold, stamped 14k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
14K white gold generally reads as a neutral white with a faint natural warmth. This band is left unplated, so the white you see is the alloy itself rather than a rhodium coating that wears thin over time.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 14k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin white gold$lnt$,$lnt$brushed 14k gold$lnt$,$lnt$polished edge ring$lnt$,$lnt$solid 14k white$lnt$,$lnt$14k white gold$lnt$,$lnt$white gold band$lnt$,$lnt$wide mens ring$lnt$,$lnt$comfort fit ring$lnt$,$lnt$cool minimalist ring$lnt$,$lnt$modern wedding ring$lnt$,$lnt$unisex gold ring$lnt$,$lnt$groom wedding band$lnt$,$lnt$heirloom gold band$lnt$]::text[],
    ARRAY[$lnt$Solid 14k gold$lnt$,$lnt$White Gold$lnt$]::text[],
    $lnt$14k white gold satin center wedding band$lnt$,
    47::smallint,
    $lnt$/eon/whg-r-1408/01.jpg$lnt$,
    $lnt$WHG-R-1401-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$WHG-R-1408$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$14K$lnt$,
    'Metal', $lnt$White Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$WHG-R-1401-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$WHG-R-1408$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ RSG-R-1408 (14K Rose Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$RSG-R-1408$lnt$,
    $lnt$14K Solid Rose Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 14K rose gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 14k rose gold, stamped 14k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
14K rose gold generally reads as a soft pink with a visible gold base. It is warmer than yellow gold without the stronger copper emphasis typical of many 10K rose alloys. Exact color shifts with the light it is seen in.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 14k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin rose gold$lnt$,$lnt$brushed rose ring$lnt$,$lnt$polished edge band$lnt$,$lnt$solid 14k rose$lnt$,$lnt$rose gold ring$lnt$,$lnt$wide wedding ring$lnt$,$lnt$comfort fit ring$lnt$,$lnt$mens rose gold$lnt$,$lnt$unisex wedding ring$lnt$,$lnt$modern wedding ring$lnt$,$lnt$pink gold ring$lnt$,$lnt$anniversary band$lnt$,$lnt$heirloom ring$lnt$]::text[],
    ARRAY[$lnt$Solid 14k gold$lnt$,$lnt$Rose Gold$lnt$]::text[],
    $lnt$14k rose gold satin center wedding band$lnt$,
    48::smallint,
    $lnt$/eon/rsg-r-1408/01.jpg$lnt$,
    $lnt$WHG-R-1401-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$RSG-R-1408$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$14K$lnt$,
    'Metal', $lnt$Rose Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$WHG-R-1401-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$RSG-R-1408$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ GLD-R-1808 (18K Yellow Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$GLD-R-1808$lnt$,
    $lnt$18K Solid Yellow Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 18K yellow gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 18k yellow gold, stamped 18k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
18K yellow gold generally carries the richest and deepest yellow of the three karats. The broad satin center softens that saturation while the polished rails hold a warmer flash. Exact color shifts with the light it is seen in.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 18k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin 18k gold$lnt$,$lnt$brushed gold band$lnt$,$lnt$polished edge ring$lnt$,$lnt$solid 18k gold$lnt$,$lnt$rich yellow gold$lnt$,$lnt$wide mens ring$lnt$,$lnt$comfort fit band$lnt$,$lnt$heirloom gold ring$lnt$,$lnt$high karat gold$lnt$,$lnt$unisex wedding ring$lnt$,$lnt$groom gold band$lnt$,$lnt$modern wedding ring$lnt$,$lnt$anniversary ring$lnt$]::text[],
    ARRAY[$lnt$Solid 18k gold$lnt$,$lnt$Yellow Gold$lnt$]::text[],
    $lnt$18k yellow gold satin center wedding band$lnt$,
    49::smallint,
    $lnt$/eon/gld-r-1808/01.jpg$lnt$,
    $lnt$GLD-R-1801-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$GLD-R-1808$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$18K$lnt$,
    'Metal', $lnt$Yellow Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$GLD-R-1801-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$GLD-R-1808$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ WHG-R-1808 (18K White Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$WHG-R-1808$lnt$,
    $lnt$18K Solid White Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 18K white gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 18k white gold, stamped 18k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
18K white gold generally reads as a warmer, creamier white because of its higher gold content. This band is left unplated, so the white you see is the alloy itself rather than a rhodium coating that wears thin over time.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 18k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin 18k white$lnt$,$lnt$brushed white gold$lnt$,$lnt$polished edge band$lnt$,$lnt$solid 18k white$lnt$,$lnt$18k white gold$lnt$,$lnt$warm white gold$lnt$,$lnt$wide mens band$lnt$,$lnt$comfort fit ring$lnt$,$lnt$high karat ring$lnt$,$lnt$unisex wedding ring$lnt$,$lnt$modern groom ring$lnt$,$lnt$minimalist band$lnt$,$lnt$heirloom gold ring$lnt$]::text[],
    ARRAY[$lnt$Solid 18k gold$lnt$,$lnt$White Gold$lnt$]::text[],
    $lnt$18k white gold satin center wedding band$lnt$,
    50::smallint,
    $lnt$/eon/whg-r-1808/01.jpg$lnt$,
    $lnt$GLD-R-1801-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$WHG-R-1808$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$18K$lnt$,
    'Metal', $lnt$White Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$GLD-R-1801-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$WHG-R-1808$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ RSG-R-1808 (18K Rose Gold) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    $lnt$RSG-R-1808$lnt$,
    $lnt$18K Solid Rose Gold Wedding Band: Wide Satin Center with Polished Edges$lnt$,
    $lnt$The Lintel is a wide solid 18K rose gold wedding band with a satin-brushed center and narrow mirror-polished rounded rails. Its quiet architectural profile is designed for an understated, modern presence.

THE LINTEL
- Solid 18k rose gold, stamped 18k inside the band
- 4mm through 12mm wide, 1.5mm thick
- Broad satin-brushed center with fine vertical grain
- Narrow mirror-polished rounded rails
- Recessed transition lines between the center and rails
- Comfort-fit interior
- No stones

METAL CHARACTER
18K rose gold generally reads as a gold-led peach rose rather than a strongly copper pink. Its high gold content gives the satin center a warm depth and the polished rails a soft amber reflection. Exact color shifts with the light it is seen in.

SIZE AND ORDERING
Available in US sizes 4 through 16, in whole and half sizes. Each ring is made to order and ships within 1-2 business days.

PERSONALIZATION
Free inside engraving up to 30 characters, copied exactly as you type: a date, initials, coordinates, or a short phrase. Script is the default, so note block letters if you prefer. Left blank, it ships clean.

MATERIAL DISCLOSURE
Solid 18k gold all the way through, never plated and never filled.

CARE
Satin and polished surfaces develop natural wear over time. Clean gently with warm water, mild soap and a soft cloth. Avoid abrasive cleaners. Message us if you would like the satin center refreshed later.

ABOUT EON
EON makes solid gold meant to outlive the moment it marks. Meaning designed to last. Wear it now. Hand it on later.

Made to order by our goldsmith.$lnt$,
    ARRAY[$lnt$satin 18k rose$lnt$,$lnt$brushed rose gold$lnt$,$lnt$polished edge ring$lnt$,$lnt$solid 18k rose$lnt$,$lnt$peach rose gold$lnt$,$lnt$wide wedding ring$lnt$,$lnt$comfort fit band$lnt$,$lnt$high karat gold$lnt$,$lnt$unisex gold band$lnt$,$lnt$modern wedding ring$lnt$,$lnt$groom rose gold$lnt$,$lnt$minimalist ring$lnt$,$lnt$heirloom gold band$lnt$]::text[],
    ARRAY[$lnt$Solid 18k gold$lnt$,$lnt$Rose Gold$lnt$]::text[],
    $lnt$18k rose gold satin center wedding band$lnt$,
    51::smallint,
    $lnt$/eon/rsg-r-1808/01.jpg$lnt$,
    $lnt$GLD-R-1801-$lnt$
  )
),
org as (select id from public.organizations where name = 'EON'),
ins as (
  insert into public.products (
    org_id, sku, title, description, tags, materials, status, currency,
    price_cents, quantity, has_variations, image_url,
    num_images, research_keyword, research_group
  )
  select
    org.id, src.sku, src.title, src.description, src.tags, src.materials,
    'draft', 'USD',
    (select min(v.price_cents) from public.product_variants v
      where v.org_id = org.id and v.sku like src.twin || '%'
        and (substring(v.sku from '-(\d+)MM-'))::int between 4 and 12),
    20, true, src.img, 10, src.keyword, src.grp
  from src cross join org
  where not exists (
    select 1 from public.products p
    where p.org_id = org.id and p.sku = src.sku
  )
  returning id
),
upd as (
  update public.products p set
    title = src.title,
    description = src.description,
    tags = src.tags,
    materials = src.materials,
    num_images = 10,
    image_url = src.img,
    research_keyword = src.keyword,
    research_group = src.grp,
    updated_at = now()
  from src cross join org
  where p.org_id = org.id and p.sku = src.sku
  returning p.id
)
select
  (select count(*) from ins) as eklendi,
  (select count(*) from upd) as guncellendi;

-- Varyantlar: ikiz dome ailesinden (fiyat + gram birebir), 4-12mm bandi
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  $lnt$RSG-R-1808$lnt$ || substring(t.sku from '(-\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', $lnt$18K$lnt$,
    'Metal', $lnt$Rose Gold$lnt$,
    'Width', substring(t.sku from '-(\d+)MM-') || 'mm',
    'Ring Size', split_part(t.sku, '-', 5)
  ),
  t.price_cents,
  20,
  t.weight_grams,
  'catalog_lintel',
  true,
  'USD'
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
join public.product_variants t
  on t.org_id = p.org_id
 and t.sku like $lnt$GLD-R-1801-$lnt$ || '%'
 and (substring(t.sku from '-(\d+)MM-'))::int between 4 and 12
where p.sku = $lnt$RSG-R-1808$lnt$
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();

-- ============================ DOGRULAMA ============================
-- Beklenen: 9 urun, her birinde 225 varyant, 2.025 toplam, dar genislik 0.
do $$
declare
  n_urun int; n_var int; n_dar int; n_fiyatsiz int; n_gramsiz int;
begin
  select count(*) into n_urun from public.products p
    join public.organizations o on o.id = p.org_id and o.name = 'EON'
   where p.sku ~ '^[A-Z]{3}-R-(10|14|18)08$';

  select count(*), count(*) filter (where v.sku ~ '-(2|3)MM-'),
         count(*) filter (where v.price_cents is null or v.price_cents = 0),
         count(*) filter (where v.weight_grams is null)
    into n_var, n_dar, n_fiyatsiz, n_gramsiz
    from public.product_variants v
    join public.products p on p.id = v.product_id
   where p.sku ~ '^[A-Z]{3}-R-(10|14|18)08$';

  if n_urun <> 9 then
    raise exception 'Lintel: % urun bulundu, 9 bekleniyordu', n_urun;
  end if;
  if n_var <> 2025 then
    raise exception 'Lintel: % varyant bulundu, 2025 bekleniyordu', n_var;
  end if;
  if n_dar <> 0 then
    raise exception 'Lintel: % adet 2/3mm varyant sizmis', n_dar;
  end if;
  if n_fiyatsiz <> 0 then
    raise exception 'Lintel: % varyant fiyatsiz', n_fiyatsiz;
  end if;
  if n_gramsiz <> 0 then
    raise exception 'Lintel: % varyant gramsiz', n_gramsiz;
  end if;
end $$;
