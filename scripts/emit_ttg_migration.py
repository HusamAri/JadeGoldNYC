#!/usr/bin/env python3
"""TTG (Two-Tone Diamond-Cut) migration'larini uretir — 10K / 14K / 18K.

Elle yazim yerine uretim: 125 satirlik varyant govdesinde transkripsiyon
riski sifirlanir (bkz. second-brain "buyuk MCP SQL'i parca + yeniden-kurgu").

    python3 scripts/emit_ttg_migration.py --karat 10K \
        > supabase/migrations/0110_eon_two_tone_diamond_cut.sql
    python3 scripts/emit_ttg_migration.py --karat 18K \
        > supabase/migrations/0111_eon_two_tone_diamond_cut_18k.sql

14K metinleri hazir; gorseller gelince IMAGES doldurulup 0112 basilir.
"""

import argparse
import sys

sys.path.insert(0, "scripts")
from gen_catalog_ttg import (  # noqa: E402
    GRAMS_BY_KARAT, KARAT_SPECS, METAL_PROPERTY, QUANTITY_PER_VARIANT,
    SIZES, WIDTHS, build, verify,
)

Q = "$ttg$"

# ── Ayar bazli metinler ────────────────────────────────────────────────
# Baslik yapisi uc ayarda paralel (ev konvansiyonu: her ayar kendi arama
# sorgusudur — "18k gold wedding band" ayri bir niyettir).

TEXTS: dict[str, dict] = {
    "10K": {
        "title": (
            "10K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, "
            "White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him"
        ),
        "research_keyword": "10k two tone diamond cut wedding band",
        "research_group": 40,
        "tags": [
            "mens wedding band", "two tone gold ring", "diamond cut band",
            "10k solid gold ring", "comfort fit band", "wide wedding band",
            "engraved gold band", "anniversary ring", "gift for husband",
            "unisex wedding band", "white gold inlay", "mens promise ring",
            "gold band for men",
        ],
        "materials": ["Solid 10k gold", "Yellow gold", "White gold"],
        "slug": "ttg-r-1006",
        "migration_file": "0110_eon_two_tone_diamond_cut.sql",
        "sibling_note": (
            "-- (Two-Tone Gold), profil 06. 14K/18K kardesleri TTG-R-1406 / TTG-R-1806\n"
            "-- olarak ayni desende acilir (gorseller gelince)."
        ),
        "eon_no": 40,
        "image_order_note": "01 hero, 02 elde (olcek), 03 tezgah, 04 makro, 05 kutu",
        "images": [
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
        ],
    },
    "14K": {
        "title": (
            "14K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, "
            "White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him"
        ),
        "research_keyword": "14k two tone diamond cut wedding band",
        "research_group": 42,
        "tags": [
            "mens wedding band", "two tone gold ring", "diamond cut band",
            "14k solid gold ring", "comfort fit band", "wide wedding band",
            "engraved gold band", "anniversary ring", "gift for husband",
            "unisex wedding band", "white gold inlay", "14k wedding band",
            "gold band for men",
        ],
        "materials": ["Solid 14k gold", "Yellow gold", "White gold"],
        "slug": "ttg-r-1406",
        "migration_file": "0112_eon_two_tone_diamond_cut_14k.sql",
        "sibling_note": (
            "-- (Two-Tone Gold), profil 06. 10K/18K kardesleri TTG-R-1006 (0110) /\n"
            "-- TTG-R-1806 (0111) ile ayni varyant ekseninde."
        ),
        "eon_no": 42,
        "image_order_note": "01 hero, 02 elde (olcek), 03 uc-ceyrek, 04 makro, 05 kutu",
        "images": [],  # gorseller bekleniyor
    },
    "18K": {
        "title": (
            "18K Solid Gold Two Tone Wedding Band, Mens Diamond Cut Ring, "
            "White and Yellow Gold Comfort Fit, 6mm to 10mm, Anniversary Gift for Him"
        ),
        "research_keyword": "18k two tone diamond cut wedding band",
        "research_group": 41,
        "tags": [
            "mens wedding band", "two tone gold ring", "diamond cut band",
            "18k solid gold ring", "comfort fit band", "wide wedding band",
            "engraved gold band", "anniversary ring", "gift for husband",
            "unisex wedding band", "white gold inlay", "18k wedding band",
            "gold band for men",
        ],
        "materials": ["Solid 18k gold", "Yellow gold", "White gold"],
        "slug": "ttg-r-1806",
        "migration_file": "0111_eon_two_tone_diamond_cut_18k.sql",
        "sibling_note": (
            "-- (Two-Tone Gold), profil 06. 10K kardesi TTG-R-1006 (0110); 14K\n"
            "-- TTG-R-1406 gorseller gelince 0112 ile acilir. Varyant ekseni UCUNDE DE AYNI."
        ),
        "eon_no": 41,
        "image_order_note": "01 hero, 02 elde (olcek), 03 uc-ceyrek, 04 makro, 05 kutu",
        "images": [
            ("/eon/ttg-r-1806/01.jpg",
             "18k solid gold two tone wedding band, yellow gold rails around a diamond-cut white gold center"),
            ("/eon/ttg-r-1806/02.jpg",
             "Two tone 18k gold diamond cut wedding band worn on a hand"),
            ("/eon/ttg-r-1806/03.jpg",
             "18k two tone gold wedding band standing on dark wood, three quarter view"),
            ("/eon/ttg-r-1806/04.jpg",
             "Macro detail of the diamond-cut lattice on the white gold center"),
            ("/eon/ttg-r-1806/05.jpg",
             "18k two tone gold wedding band presented in a suede gift box"),
        ],
    },
}

# Aciklama: ilk cumlede birincil anahtar kelime (Google indeksleme), sonra ev
# sablonu (THE DETAILS / SIZE & WIDTH / MAKE IT YOURS / WHY EON). Fiyat, gram,
# servis suresi ve olcu-degistirme sozu VERILMEZ (second-brain kurali).
COLOR_PARAGRAPH = {
    "10K": (
        "The two colors do the work here. The yellow rails carry one continuous "
        "polished line down each edge. The white center is brushed flat, then cut "
        "through, so every facet catches a hard point of light while the ground "
        "behind it stays soft. Three finishes on one band, and the gold runs solid "
        "under all of them."
    ),
    "14K": (
        "The two colors do the work here. The yellow rails carry one continuous "
        "polished line down each edge, and 14k holds that line hard through daily "
        "wear. The white center is brushed flat, then cut through, so every facet "
        "catches a point of light while the ground behind it stays soft."
    ),
    "18K": (
        "The two colors do the work here, and 18k pushes the contrast further. The "
        "yellow runs deep and warm against the pale white center, the color you "
        "picture when someone says gold. The center is brushed flat, then cut "
        "through, so every facet throws a hard point of light while the ground "
        "behind it stays quiet. Three finishes on one band, and the gold runs solid "
        "under all of them."
    ),
}


def description(karat: str) -> str:
    k = karat.lower()
    t = TEXTS[karat]
    return f"""A solid {k} gold two tone wedding band: yellow gold rails framing a white gold center cut with a diamond lattice. Made to order in your size and width, never plated, never filled, with free engraving inside the band.

THE DETAILS
Metal: Solid {k} gold in two colors, yellow and white. Never plated, never filled.
Profile: Stepped yellow gold rails along both edges, raised white gold center.
Pattern: Diamond-cut lattice worked over a florentine brushed ground.
Fit: Comfort fit interior, rounded to clear the knuckle and sit without a hard edge.
Widths: {WIDTHS[0]}mm through {WIDTHS[-1]}mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped {k} inside the band.

{COLOR_PARAGRAPH[karat]}

SIZE & WIDTH
Two dropdowns build the ring. Pick a size, US 4 through 16 in whole and half sizes, in Ring Size. Pick your width, {WIDTHS[0]}mm through {WIDTHS[-1]}mm, in Width. A 6 to 7mm reads trim for a patterned band; 8mm is the width most men wear; 9 to 10mm sits wide and carries the lattice at full scale.

If you are between sizes or unsure, message us before you order.

MAKE IT YOURS
1. Choose your ring size in the Ring Size dropdown.
2. Choose your width in the Width dropdown.
3. Add your engraving in the Personalization box, or leave it blank.

The engraving is free and sits inside the band, read only by the one who wears it. Up to 30 characters, copied exactly as you type them; script is the default, so note block letters if you want them. Something like "A & J June 15", a date, initials, or coordinates. Left blank, it ships clean.

WHY EON
I cut and finish each band to order, in the size and width you choose. The diamond cuts are made after the two colors are joined, so the lattice runs true across the seam. Solid gold, all the way through.

---
[EON {t['eon_no']} - {KARAT_SPECS[karat]['family']} - Varyasyon: Ring Size 4-16 whole+half ({len(SIZES)}) x Width {len(WIDTHS)} ({WIDTHS[0]}-{WIDTHS[-1]}mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514); adet {QUANTITY_PER_VARIANT}/varyant; kisisellestirme max 30 karakter]"""


def lit(s: str) -> str:
    assert Q not in s, "dollar-quote tag metnin icinde geciyor"
    return f"{Q}{s}{Q}"


def arr(items: list[str]) -> str:
    return "ARRAY[" + ",".join(lit(i) for i in items) + "]::text[]"


def emit(karat: str) -> str:
    spec = KARAT_SPECS[karat]
    t = TEXTS[karat]
    family = spec["family"]
    ppg = spec["ppg_cents"]
    desc = description(karat)
    images = t["images"]

    rows = build(karat)
    verify(rows, karat)
    prices = [r["price_cents"] for r in rows]
    anchor = min(prices)

    for tag in t["tags"]:
        assert len(tag) <= 20, f"tag 20 karakteri asiyor: {tag}"
    assert len(t["tags"]) == 13, "Etsy 13 etiket slotu"
    assert len(TEXTS[karat]["title"]) <= 140, "baslik 140 karakteri asiyor"
    assert images, f"{karat}: gorsel yok — listing eksik kalir"

    out: list[str] = []
    w = out.append

    w(f"""-- {t['migration_file']}
-- EON profil 06 — Two-Tone Diamond-Cut wedding band, {karat} solid gold ({family}).
--
-- YENI STIL. Mevcut 39 listing bes profilde toplaniyordu (01 Dome, 02 Flat,
-- 03 Beveled, 04 Milgrain, 05 Knife Edge); bu altincisi: basamakli sari altin
-- raylar + yuksek beyaz altin merkez, merkez florentine zemin uzerine elmas
-- kesim kafes deseniyle islenmis. Panelde LISTING ONERISI olarak durur
-- (status='draft', etsy_listing_id null) — Etsy'ye gonderim ayri adim.
--
-- SKU semasi (0087): <RENK>-<TIP>-<KARAT><PROFIL>. Yeni renk kodu TTG
{t['sibling_note']}
--
-- Varyant ekseni: {len(WIDTHS)} genislik ({WIDTHS[0]}-{WIDTHS[-1]}mm) x {len(SIZES)} beden (US 4-16 tam+yarim) = {len(rows)}.
--   Neden 2-12mm DEGIL: elmas kesim kafes + cift ray dar bantta fiziksel
--   olarak okunmaz; pazar arastirmasi en cok satan erkek bandinin 6-8mm
--   oldugunu gosteriyor (2026 Etsy erkek aliansi taramasi).
--
-- Gram tablosu: 0101'in {karat} satirlarindan BIREBIR (1.5mm kalinlik).
--   VARSAYIM: basamakli iki-tonlu profil, ayni genislik/kalinlikta dome ile
--   kutlece karsilastirilabilir (kenar basamaklari metal alir, duz merkez
--   ekler). Ilk uretimde tartip dogrulanmali.
--
-- Fiyat: ev formulu — ceil(gram * {ppg} / 500) * 500 + 1000
--   ($5 yukari yuvarla + $10 kargo payi fiyata gomulu; bkz. second-brain
--   "ucretsiz kargo = bedel fiyata gomulur"). Aralik ${anchor/100:.2f} - ${max(prices)/100:.2f}.
--   NOT: {karat} ev ppg'si ({ppg} c/g) duz profillerle AYNI birakildi —
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
  {lit(family)},
  {lit(t['title'])},
  {lit(desc)},
  {arr(t['tags'])},
  {arr(t['materials'])},
  'draft',
  'USD',
  {anchor},
  {QUANTITY_PER_VARIANT},
  true,
  {lit(images[0][0])},
  {len(images)},
  {lit(t['research_keyword'])},
  {t['research_group']}
from public.organizations o
where o.name = 'EON'
  and not exists (
    select 1 from public.products p
    where p.org_id = o.id and p.sku = {lit(family)}
  );

-- Yeniden calistirmada metin/etiket alanlarini kanonik surumle esitle
-- (Etsy'ye gonderilmis kayitta etsy_listing_id dolu olur; yine de panel
-- kunyesi tek kaynakta kalsin diye guncellenir).
update public.products p set
  title = {lit(t['title'])},
  description = {lit(desc)},
  tags = {arr(t['tags'])},
  materials = {arr(t['materials'])},
  research_keyword = {lit(t['research_keyword'])},
  research_group = {t['research_group']},
  image_url = {lit(images[0][0])},
  num_images = {len(images)},
  updated_at = now()
from public.organizations o
where p.org_id = o.id and o.name = 'EON' and p.sku = {lit(family)};

-- ==== Varyantlar: {len(GRAMS_BY_KARAT[karat])} genislik x {len(SIZES)} beden = {len(rows)} ====

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
    'Karat', {lit(karat)},
    'Metal', {lit(METAL_PROPERTY)},
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
join public.products p on p.sku = {lit(family)}
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
  where v.weight_source = 'catalog_ttg' and pp.sku = {lit(family)}
  group by v.product_id
) m
where m.product_id = p.id;

-- ==== Galeri: {len(images)} gorsel (repo public/ altinda, kok-goreli URL) ====
-- Kaynak baytlar public{images[0][0].rsplit('/', 1)[0]}/*.jpg — meta veri sokulmus
-- (bkz. second-brain "disa cikan gorselden koken meta verisi sok").
-- Etsy sirasi: {t['image_order_note']}.

delete from public.listing_images li
using public.products p
where li.product_id = p.id
  and p.sku = {lit(family)}
  and li.url like {lit(images[0][0].rsplit('/', 1)[0] + '/%')};

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, v.url, 'url', v.alt, v.position
from public.products p
join public.organizations o on o.id = p.org_id and o.name = 'EON'
cross join (values""")

    img_values = ",\n".join(
        f"  ({lit(url)}, {lit(alt)}, {i})"
        for i, (url, alt) in enumerate(images)
    )
    w(img_values)
    w(f""") as v(url, alt, position)
where p.sku = {lit(family)};""")

    return "\n".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--karat", default="10K", choices=sorted(KARAT_SPECS))
    args = ap.parse_args()
    print(emit(args.karat))


if __name__ == "__main__":
    main()
