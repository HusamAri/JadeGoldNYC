#!/usr/bin/env python3
"""EON "The Lintel" ailesi — migration ureticisi (profil 08).

Kaynak: docs/eon/lintel/<NN>/{01-title,02-description,03-tags}.txt
  Bunlar kullanicinin Obsidian vault'undan Dropbox'a kopyalanan
  /11-etsy-upload-packages/ paketlerinin BIREBIR kopyasidir. Repoda yasar
  cunku Etsy aynasi panel metnini her an ezebilir (second-brain dersi).

Cikti: supabase/migrations/0137_eon_lintel_family.sql

NEDEN INSERT...SELECT: fiyat ve gram, ayar-es DOME ailesinden birebir
kopyalanir (runbook karari: Lintel standart iscilik sinifi, profil yalnizca
isciligi degistirir). 2.025 satiri elle yazmak yerine SQL'de ikizden secmek
transkripsiyon riskini SIFIRA indirir (second-brain: "turetilebilir alani
gonderme"). Renk-bagimsizligi 225/225 hucrede kanitlandi: ayni ayarda
GLD/WHG/RSG fiyat ve gram BIREBIR ayni -> ayar basina TEK kanonik kaynak
yeterli (14K'da GLD-R-1401 gramsiz oldugu icin WHG-R-1401 secildi).

Varyant ekseni: 9 genislik (4-12mm) x 25 beden (US 4-16 tam+yarim) = 225.
  Kullanici kurali (2026-08-11): 2mm ve 3mm YOK, en dar 4mm.
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "eon" / "lintel"
OUT = ROOT / "supabase" / "migrations" / "0137_eon_lintel_family.sql"

# paket klasoru -> (sku, karat, renk kodu, renk adi, ikiz kaynak aile)
FAMILIES = [
    ("01", "GLD-R-1008", "10K", "Yellow Gold", "GLD-R-1001"),
    ("02", "WHG-R-1008", "10K", "White Gold", "GLD-R-1001"),
    ("03", "RSG-R-1008", "10K", "Rose Gold", "GLD-R-1001"),
    ("04", "GLD-R-1408", "14K", "Yellow Gold", "WHG-R-1401"),
    ("05", "WHG-R-1408", "14K", "White Gold", "WHG-R-1401"),
    ("06", "RSG-R-1408", "14K", "Rose Gold", "WHG-R-1401"),
    ("07", "GLD-R-1808", "18K", "Yellow Gold", "GLD-R-1801"),
    ("08", "WHG-R-1808", "18K", "White Gold", "GLD-R-1801"),
    ("09", "RSG-R-1808", "18K", "Rose Gold", "GLD-R-1801"),
]

RESEARCH_GROUP_BASE = 43  # mevcut en buyuk grup 42

# --- Placeholder cozum haritasi -------------------------------------------
# Her deger CANLI ev metninden gelir (GLD-R-1001 / WHG-R-1401 aciklamalari),
# uydurma YOK. Kaynak cumleler docs/eon/lintel/README.md'de listelidir.

def resolve(text: str, karat: str, color: str) -> str:
    k = karat.lower()  # 10k / 14k / 18k
    c = color.lower()  # yellow gold / white gold / rose gold

    # 1) Kunye satiri: hallmark -> canli metindeki "stamped 10k inside" ifadesi
    text = text.replace(
        f"- Solid {karat} {c} alloy, hallmark [[HALLMARK]]",
        f"- Solid {k} {c}, stamped {k} inside the band",
    )

    # 2) Olcu satiri: Lintel ekseni 4-12mm, ev kalinligi 1.5mm
    text = text.replace(
        "- [[WIDTH_MM]] mm wide and [[THICKNESS_MM]] mm thick",
        "- 4mm through 12mm wide, 1.5mm thick",
    )

    # 3) Beden + uretim suresi (canli metin: "US sizes 4 through 16 in whole
    #    and half sizes", "ships within 1-2 business days")
    text = text.replace(
        "Available in US sizes [[SIZE_RANGE]]. Whole and half sizes: "
        "[[CONFIRM]]. Each ring is made to order in [[PROCESSING_TIME]] "
        "business days.",
        "Available in US sizes 4 through 16, in whole and half sizes. Each "
        "ring is made to order and ships within 1-2 business days.",
    )

    # 4) Kisisellestirme: ev teklifi (ucretsiz, 30 karakter, script varsayilan)
    text = text.replace(
        "[[CONFIRM BEFORE PUBLISH: Insert the approved engraving offer and "
        "character limit, or remove this section.]]",
        "Free inside engraving up to 30 characters, copied exactly as you "
        "type: a date, initials, coordinates, or a short phrase. Script is "
        "the default, so note block letters if you prefer. Left blank, it "
        "ships clean.",
    )

    # 5) Malzeme aciklamasi: ev pozisyonu tum renklerde "never plated, never
    #    filled" (canli WHG/RSG metinleriyle dogrulandi; beyaz altinda da
    #    rodyum kaplama iddiasi YOK).
    text = text.replace(
        "Alloy composition: [[ALLOY_COMPOSITION]]. Nickel disclosure: "
        "[[NICKEL_DISCLOSURE]]. White gold plating status, if relevant: "
        "[[PLATING_STATUS]].",
        f"Solid {k} gold all the way through, never plated and never filled.",
    )

    # 6) Bakim satirindaki acik uc: refinishing ifadesini mesaj cagrisina cevir
    text = text.replace(
        "Professional refinishing information: [[CONFIRM]].",
        "Message us if you would like the satin center refreshed later.",
    )

    # 7) Uretici satiri: canli metin yalnizca "our goldsmith" der, KONUM
    #    iddia etmez — uydurmuyoruz.
    text = text.replace(
        "Made to order by [[MAKER_OR_PRODUCTION_PARTNER]] in "
        "[[MADE_IN_LOCATION]].",
        "Made to order by our goldsmith.",
    )

    # 8) METAL CHARACTER paragrafinin kuyrugu SATICIYA yazilmis QA dili
    #    tasiyor — token degil DUZ METIN oldugu icin placeholder denetimi
    #    yakalamaz, gozle bulundu. Beyaz altinda ayrica "plating status
    #    confirm" ifadesi bizim "never plated" beyanimizla CELISIYOR.
    text = text.replace(
        "The alloy choice and any surface treatment materially affect the "
        "final color, so plating status must be confirmed before this "
        "listing is published.",
        "This band is left unplated, so the white you see is the alloy "
        "itself rather than a rhodium coating that wears thin over time.",
    )
    text = text.replace(
        "Exact color varies with the confirmed alloy and lighting.",
        "Exact color shifts with the light it is seen in.",
    )
    text = text.replace(
        "Exact color varies with the confirmed alloy.",
        "Exact color shifts with the light it is seen in.",
    )

    return text


def sql_lit(s: str) -> str:
    """Dollar-quoted literal. Metinde $lnt$ gecemez (denetlenir)."""
    if "$lnt$" in s:
        raise SystemExit("HATA: metin $lnt$ tasiyor, quoting bozulur")
    return f"$lnt${s}$lnt$"


def main() -> None:
    rows = []
    for folder, sku, karat, color, twin in FAMILIES:
        base = SRC / folder
        title = (base / "01-title.txt").read_text(encoding="utf-8").strip()
        desc = (base / "02-description.txt").read_text(encoding="utf-8").strip()
        tags = [
            t.strip()
            for t in (base / "03-tags.txt").read_text(encoding="utf-8").splitlines()
            if t.strip()
        ]

        desc = resolve(desc, karat, color)

        # --- Denetimler (ic assert'ler; uretim sessizce bozulmasin) --------
        leftover = re.findall(r"\[\[[^\]]*\]\]", desc)
        if leftover:
            raise SystemExit(f"HATA {sku}: cozulmemis placeholder {leftover}")
        # Token OLMAYAN ic-QA dili de sizmasin (duz metin, gozle bulundu)
        for phrase in (
            "must be confirmed",
            "before this listing is published",
            "confirmed alloy",
            "CONFIRM",
            "PROPOSED",
            "PUBLISH_HOLD",
            "PUBLISH HOLD",
        ):
            if phrase.lower() in desc.lower():
                raise SystemExit(f"HATA {sku}: ic-QA dili sizdi: {phrase!r}")
        if len(title) > 140:
            raise SystemExit(f"HATA {sku}: baslik {len(title)} karakter (>140)")
        if len(tags) != 13:
            raise SystemExit(f"HATA {sku}: {len(tags)} tag (13 olmali)")
        for t in tags:
            if len(t) > 20:
                raise SystemExit(f"HATA {sku}: tag '{t}' {len(t)} karakter (>20)")
        for bad in ("$", "^", "`"):
            if bad in title:
                raise SystemExit(f"HATA {sku}: baslikta yasak karakter {bad!r}")
        if sum(1 for w in title.split() if w.isupper() and len(w) > 1) > 3:
            raise SystemExit(f"HATA {sku}: 3'ten fazla TAMAMEN BUYUK kelime")
        # Etsy: % : & + yalniz birer kez
        for ch in "%:&+":
            if title.count(ch) > 1:
                raise SystemExit(f"HATA {sku}: baslikta {ch!r} birden fazla")

        rows.append((sku, karat, color, twin, title, desc, tags))

    parts: list[str] = []
    parts.append(
        """-- 0137_eon_lintel_family.sql
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
"""
    )

    for i, (sku, karat, color, twin, title, desc, tags) in enumerate(rows):
        group = RESEARCH_GROUP_BASE + i
        tag_arr = ",".join(sql_lit(t) for t in tags)
        materials = ",".join(sql_lit(m) for m in (f"Solid {karat.lower()} gold", color))
        kw = f"{karat.lower()} {color.lower()} satin center wedding band"
        img = f"/eon/{sku.lower()}/01.jpg"

        parts.append(
            f"""
-- ============================ {sku} ({karat} {color}) ============================
-- Metin TEK KEZ gecer: ayni CTE hem insert (yeni kayit) hem update (mevcut
-- kayitta ayna ezmesini geri al) tarafindan okunur. `products`ta (org_id,sku)
-- unique indeks YOK, o yuzden upsert degil not-exists + update deseni.

with src(sku, title, description, tags, materials, keyword, grp, img, twin) as (
  values (
    {sql_lit(sku)},
    {sql_lit(title)},
    {sql_lit(desc)},
    ARRAY[{tag_arr}]::text[],
    ARRAY[{materials}]::text[],
    {sql_lit(kw)},
    {group}::smallint,
    {sql_lit(img)},
    {sql_lit(twin + '-')}
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
        and (substring(v.sku from '-(\\d+)MM-'))::int between 4 and 12),
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
  {sql_lit(sku)} || substring(t.sku from '(-\\d+MM-.*)$'),
  p.id,
  jsonb_build_object(
    'Karat', {sql_lit(karat)},
    'Metal', {sql_lit(color)},
    'Width', substring(t.sku from '-(\\d+)MM-') || 'mm',
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
 and t.sku like {sql_lit(twin + '-')} || '%'
 and (substring(t.sku from '-(\\d+)MM-'))::int between 4 and 12
where p.sku = {sql_lit(sku)}
on conflict (org_id, sku) do update set
  product_id = excluded.product_id,
  properties = excluded.properties,
  price_cents = excluded.price_cents,
  quantity = excluded.quantity,
  weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source,
  active = excluded.active,
  updated_at = now();
"""
        )

    parts.append(
        """
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
"""
    )

    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"yazildi: {OUT.relative_to(ROOT)}  ({OUT.stat().st_size:,} bayt)")
    for sku, karat, color, twin, title, desc, tags in rows:
        print(f"  {sku}  <- {twin}  | {len(title):3d} kr baslik | {len(desc):5d} kr metin")


if __name__ == "__main__":
    sys.exit(main())
