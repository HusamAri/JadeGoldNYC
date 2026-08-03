#!/usr/bin/env python3
"""0110 migration'ini uretir (elle yazim yerine — transkripsiyon driftini onler).

    python3 scripts/emit_ttg_migration.py > supabase/migrations/0110_eon_two_tone_diamond_cut.sql

Govde gen_catalog_ttg.py'den gelir; metinler burada tek kaynakta durur.
"""

import sys

sys.path.insert(0, "scripts")
from gen_catalog_ttg import (  # noqa: E402
    FAMILY, KARAT, GRAMS, SIZES, PPG_CENTS, QUANTITY_PER_VARIANT,
    build, verify, size_token,
)

Q = "$ttg$"

TITLE = (
    "10K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, "
    "White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him"
)

RESEARCH_KEYWORD = "10k two tone diamond cut wedding band"
RESEARCH_GROUP = 40

TAGS = [
    "mens wedding band", "two tone gold ring", "diamond cut band",
    "10k solid gold ring", "comfort fit band", "wide wedding band",
    "engraved gold band", "anniversary ring", "gift for husband",
    "unisex wedding band", "white gold inlay", "mens promise ring",
    "gold band for men",
]

MATERIALS = ["Solid 10k gold", "Yellow gold", "White gold"]

DESCRIPTION = """A solid 10k gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

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
[EON 40 - TTG-R-1006 - Varyasyon: Ring Size 4-16 whole+half (25) x Width 5 (6-10mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet 20/varyant; kisisellestirme max 30 karakter]"""

IMAGES = [
    ("/eon/ttg-r-1006/01.jpg",
     "10k solid gold two tone wedding band, yellow gold rails around a diamond-cut white gold center"),
    ("/eon/ttg-r-1006/02.jpg",
     "Two tone 10k gold diamond cut wedding band worn on a hand"),
    ("/eon/ttg-r-1006/03.jpg",
     "10k two tone gold wedding band on a jeweller's bench with hand tools"),
    ("/eon/ttg-r-1006/04.jpg",
     "Macro detail of the diamond-cut lattice on the white gold center"),
    ("/eon/ttg-r-1006/05.jpg",
     "10k two tone gold wedding band presented in a gift box"),
]


def lit(s: str) -> str:
    assert Q not in s, "dollar-quote tag metnin icinde geciyor"
    return f"{Q}{s}{Q}"


def arr(items: list[str]) -> str:
    return "ARRAY[" + ",".join(lit(i) for i in items) + "]::text[]"


def main() -> None:
    rows = build()
    verify(rows)
    prices = [r["price_cents"] for r in rows]
    anchor = min(prices)

    for t in TAGS:
        assert len(t) <= 20, f"tag 20 karakteri asiyor: {t}"
    assert len(TAGS) == 13, "Etsy 13 etiket slotu"
    assert len(TITLE) <= 140, f"baslik {len(TITLE)} karakter (max 140)"

    out: list[str] = []
    w = out.append

    w(f"""-- 0110_eon_two_tone_diamond_cut.sql
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, {KARAT} solid gold ({FAMILY}).
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
-- Varyant ekseni: 5 genislik (6-10mm) x 25 beden (US 4-16 tam+yarim) = {len(rows)}.
--   Neden 2-12mm DEGIL: elmas kesim kafes + cift ray dar bantta fiziksel
--   olarak okunmaz; pazar arastirmasi en cok satan erkek bandinin 6-8mm
--   oldugunu gosteriyor (2026 Etsy erkek aliansi taramasi).
--
-- Gram tablosu: 0101'in {KARAT} satirlarindan BIREBIR (1.5mm kalinlik).
--   VARSAYIM: basamakli iki-tonlu profil, ayni genislik/kalinlikta dome ile
--   kutlece karsilastirilabilir (kenar basamaklari metal alir, duz merkez
--   ekler). Ilk uretimde tartip dogrulanmali.
--
-- Fiyat: ev formulu — ceil(gram * {PPG_CENTS} / 500) * 500 + 1000
--   ($5 yukari yuvarla + $10 kargo payi fiyata gomulu; bkz. second-brain
--   "ucretsiz kargo = bedel fiyata gomulur"). Aralik ${anchor/100:.2f} - ${max(prices)/100:.2f}.
--   NOT: {KARAT} ev ppg'si ({PPG_CENTS} c/g) duz profillerle AYNI birakildi —
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
  {lit(FAMILY)},
  {lit(TITLE)},
  {lit(DESCRIPTION)},
  {arr(TAGS)},
  {arr(MATERIALS)},
  'draft',
  'USD',
  {anchor},
  {QUANTITY_PER_VARIANT},
  true,
  {lit(IMAGES[0][0])},
  {len(IMAGES)},
  {lit(RESEARCH_KEYWORD)},
  {RESEARCH_GROUP}
from public.organizations o
where o.name = 'EON'
  and not exists (
    select 1 from public.products p
    where p.org_id = o.id and p.sku = {lit(FAMILY)}
  );

-- Yeniden calistirmada metin/etiket alanlarini kanonik surumle esitle
-- (Etsy'ye gonderilmis kayitta etsy_listing_id dolu olur; yine de panel
-- kunyesi tek kaynakta kalsin diye guncellenir).
update public.products p set
  title = {lit(TITLE)},
  description = {lit(DESCRIPTION)},
  tags = {arr(TAGS)},
  materials = {arr(MATERIALS)},
  research_keyword = {lit(RESEARCH_KEYWORD)},
  research_group = {RESEARCH_GROUP},
  image_url = {lit(IMAGES[0][0])},
  num_images = {len(IMAGES)},
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = {lit(FAMILY)};

-- ==== Varyantlar: {len(GRAMS)} genislik x {len(SIZES)} beden = {len(rows)} ====

create temp table _ttg (sku text, width int, ring_size text, grams numeric, price_cents int);
insert into _ttg (sku, width, ring_size, grams, price_cents) values""")

    values = ",\n".join(
        f"  ({lit(r['sku'])}, {r['width']}, {lit(r['size'])}, {r['grams']}, {r['price_cents']})"
        for r in rows
    )
    w(values + ";")

    w(f"""
insert into public.product_variants (
  org_id, sku, product_id, properties, price_cents, quantity,
  weight_grams, weight_source, active, currency
)
select
  p.org_id,
  t.sku,
  p.id,
  jsonb_build_object(
    'Karat', {lit(KARAT)},
    'Metal', {lit('Two Tone Yellow and White Gold')},
    'Width', t.width || 'mm',
    'Ring Size', t.ring_size
  ),
  t.price_cents,
  {QUANTITY_PER_VARIANT},
  t.grams,
  'catalog_ttg',
  true,
  'USD'
from _ttg t
join public.products p on p.sku = {lit(FAMILY)}
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

-- Capa fiyati = en ucuz varyant (0101 deseni).
update public.products p
set price_cents = m.minp, updated_at = now()
from (
  select product_id, min(price_cents) as minp
  from public.product_variants
  where weight_source = 'catalog_ttg'
  group by product_id
) m
where m.product_id = p.id;

-- ==== Galeri: {len(IMAGES)} gorsel (repo public/ altinda, kok-goreli URL) ====
-- Kaynak baytlar public/eon/ttg-r-1006/*.jpg — meta veri sokulmus
-- (bkz. second-brain "disa cikan gorselden koken meta verisi sok").
-- Etsy sirasi: 01 hero, 02 elde (olcek), 03 tezgah, 04 makro, 05 kutu.

delete from public.listing_images li
using public.products p
where li.product_id = p.id
  and p.sku = {lit(FAMILY)}
  and li.url like '/eon/ttg-r-1006/%';

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, v.url, 'url', v.alt, v.position
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
cross join (values""")

    img_values = ",\n".join(
        f"  ({lit(url)}, {lit(alt)}, {i})"
        for i, (url, alt) in enumerate(IMAGES)
    )
    w(img_values)
    w(f""") as v(url, alt, position)
where p.sku = {lit(FAMILY)};""")

    print("\n".join(out))


if __name__ == "__main__":
    main()
