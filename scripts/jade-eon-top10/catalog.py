#!/usr/bin/env python3
"""Jade Gold NYC · EON top 10 · catalog + panel-draft migration generator.

30 panel drafts (10 models x 3 metals). Three Etsy variation axes, like the
live EON Flat Milgrain drafts: Karat, Width, Ring Size. Etsy caps a listing
at 400 products when price/SKU vary on every property, so each grid is kept
at <= 375 (widths trimmed to five where the EON source has more).

Prices are NOT typed here: the migration derives them in SQL from the live
EON source listing of each model (10K basis via EON's measured karat ratios
14K 1.474 / 18K 2.019, rounded up to $5, then a running max across ring sizes
so a larger size never costs less).

Output:
  docs/jade/eon-top10/catalog.json
  supabase/migrations/0151_jade_eon_top10_drafts.sql
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "docs" / "jade" / "eon-top10"
MIG = ROOT / "supabase" / "migrations" / "0151_jade_eon_top10_drafts.sql"
JADE_ORG = "f155b853-dfaf-48fd-94c5-ddfcb856e07c"
EON_ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0"
IMG_BASE = "https://amuletta.artifactstudio.info/jade/eon-top10"
RATIO = {"10K": 1.0, "14K": 1.474, "18K": 2.019}
SIZES_25 = [4 + 0.5 * i for i in range(25)]   # US 4 to 16
SIZES_21 = [3 + 0.5 * i for i in range(21)]   # US 3 to 13
QUANTITY = 20

# key: (slug, name, eon_listing, src_karat, units_sold, widths, sizes, feature, detail, tags)
MODELS = {
    "01": ("satin", "Satin Step", 4554025310, "14K", 7, [4, 5, 6, 7, 8], SIZES_25,
           "a brushed satin center set between two stepped, high polish rails",
           "The satin center takes daily wear softly; the polished rails keep the edge bright.",
           ["satin wedding band", "brushed gold ring", "step edge band"]),
    "02": ("flat", "Flat", 4539777986, "10K", 6, [4, 5, 6, 7, 8], SIZES_25,
           "a flat top with straight sides and softly eased edges, polished to a mirror finish",
           "A clean flat profile that reads modern from every angle.",
           ["flat wedding band", "flat gold ring", "polished gold band"]),
    "03": ("dome", "Dome", 4539666999, "10K", 6, [4, 5, 6, 7, 8], SIZES_25,
           "a smooth domed profile polished to a mirror finish",
           "The classic half round shape, the band most people picture when they hear wedding ring.",
           ["dome wedding band", "classic gold band", "half round ring"]),
    "04": ("milgrain", "Milgrain", 4542485142, "14K", 4, [4, 5, 6, 7, 8], SIZES_25,
           "a brushed satin center framed by a fine row of milgrain beads along each edge",
           "Milgrain is an old jeweler's finish: a line of tiny beads that catches light like thread.",
           ["milgrain band", "vintage gold band", "beaded edge ring"]),
    "05": ("hammered", "Hammered", 4543442596, "14K", 3, [6, 7, 8, 9, 10], SIZES_25,
           "a hammered center of hand-struck facets, a milgrain line on each side and polished stepped rails",
           "Every facet breaks the light differently, so no two bands read exactly the same.",
           ["hammered gold ring", "hammered band", "textured gold band"]),
    "06": ("crosshatch", "Crosshatch", 4565352791, "18K", 1, [4, 5, 6, 7, 8], SIZES_21,
           "a brushed satin center with diamond-cut crosshatch knurling along each beveled edge",
           "The knurled edges give grip and sparkle without a single stone.",
           ["crosshatch ring", "diamond cut band", "knurled gold band"]),
    "07": ("kinetic", "Kinetic Bead", 4561855998, "14K", 1, None, SIZES_21,
           "a slim polished band carrying one small gold bead that glides freely around it",
           "A quiet ring with a small secret: the bead moves when you do.",
           ["kinetic ring", "moving bead ring", "fidget gold ring"]),
    "08": ("greekkey", "Greek Key", 4556710904, "10K", 1, [6, 7, 8, 9, 10], SIZES_25,
           "a continuous Greek key pattern framed by milgrain rows and braided rope rails",
           "The meander is one unbroken line: an old symbol for the things that last.",
           ["greek key ring", "meander band", "rope edge ring"]),
    "09": ("twotone", "Two-Tone", 4550516268, "10K", 1, [6, 7, 8, 9, 10], SIZES_25,
           "polished stepped rails around a diamond-cut center in a contrasting gold",
           "Two golds in one band, so it sits well with anything else you wear.",
           ["two tone gold ring", "two tone band", "diamond cut band"]),
    "10": ("beveled", "Beveled", 4544213291, "14K", 1, [4, 5, 6, 7, 8], SIZES_25,
           "a brushed flat top with a high polish bevel along each edge",
           "The bevel softens the edge and throws a thin line of light around the band.",
           ["beveled wedding band", "bevel edge ring", "brushed gold band"]),
}

METALS = {
    "yellow": ("Y", "Yellow Gold", "yellow gold"),
    "white": ("W", "White Gold", "white gold"),
    "rose": ("R", "Rose Gold", "rose gold"),
}
TWO_TONE_ACCENT = {"yellow": "white gold", "white": "yellow gold", "rose": "white gold"}

SHOT_ALT = {
    "01-hero": "{t} on New York architecture in low window light, three-quarter view",
    "02-macro": "Macro detail of the {t} surface finish",
    "03-profile": "Side profile of the {t} showing band width and comfort fit",
    "04-top": "{t} from directly above",
    "05-on-hand": "{t} worn on the ring finger",
    "06-nyc": "{t} on a New York ledge with the street behind",
    "07-interior": "Polished comfort fit interior of the {t}",
    "08-widths": "{t} in three widths side by side",
    "08-bead": "Close detail of the moving bead on the {t}",
    "09-karats": "{t} in 10K, 14K and 18K side by side",
    "10-pair": "A pair of {t}s worn together",
}


def size_text(s: float) -> str:
    return str(int(s)) if s == int(s) else str(s)


def title_for(mk, metal_key):
    slug, name, *_ = MODELS[mk]
    _, label, low = METALS[metal_key]
    if mk == "09":
        label = f"{label} and {TWO_TONE_ACCENT[metal_key].title()}"
    widths = MODELS[mk][5]
    wtxt = f", {widths[0]}mm to {widths[-1]}mm" if widths else ""
    t = f"{name} Wedding Band, Solid {label} Ring in 10K 14K 18K{wtxt}, Comfort Fit"
    if mk == "07":
        t = f"Kinetic Bead Ring, Solid {label} Moving Band in 10K 14K 18K, Comfort Fit"
    assert len(t) <= 140, t
    return t


def tags_for(mk, metal_key):
    low = METALS[metal_key][2]
    own = MODELS[mk][9]
    base = own + [f"{low} ring", "solid gold band", "10k 14k 18k gold", "comfort fit ring",
                  "wedding band", "mens wedding band", "womens gold band", "anniversary ring",
                  "nyc jewelry", "stacking ring", "gift for him", "gift for her"]
    tags = []
    for t in base:
        if t not in tags and len(t) <= 20:
            tags.append(t)
    tags = tags[:13]
    assert len(tags) == 13, (mk, tags)
    return tags


def description_for(mk, metal_key):
    slug, name, _lid, _k, _u, widths, sizes, feature, detail, _ = MODELS[mk]
    _, label, low = METALS[metal_key]
    metal_line = f"Solid {low}, never plated, never filled."
    if mk == "09":
        metal_line = f"Solid {low} rails with a solid {TWO_TONE_ACCENT[metal_key]} center. Never plated, never filled."
    width_line = (f"Width: {widths[0]}mm to {widths[-1]}mm, whole millimeters.\n" if widths else "")
    return f"""The {name} band in solid {low}: {feature}. {detail}

Made to order in New York style: quiet, solid, built for every day.

THE DETAILS
Metal: {metal_line}
Karat: 10K, 14K or 18K. Choose it in the Karat menu.
{width_line}Ring size: US {size_text(sizes[0])} to {size_text(sizes[-1])}, whole and half sizes.
Fit: Comfort fit interior, rounded inside so it slides on easily.
Stamp: Karat stamped inside the band.

CHOOSING YOUR KARAT
10K is the most durable and the most affordable. 14K is the balance most people choose. 18K carries more gold and a deeper color.

SIZE AND FIT
Wider bands fit slightly snugger. If you are between sizes or choosing a wide band, go up a half size, or message us and we will help.

MADE TO ORDER
Each ring is made for your karat, width and size. Processing and shipping times are shown at checkout.

CARE
Warm water, mild soap and a soft cloth. Take it off for chlorine and heavy work.

JADE GOLD NYC
Solid gold jewelry for everyday life. Quiet luxury, never loud."""


def build():
    listings = []
    for mk, m in MODELS.items():
        slug, name, lid, src_k, units, widths, sizes = m[:7]
        for metal_key, (code, label, low) in METALS.items():
            key = f"{mk}-{slug}-{metal_key}"
            family = f"JGN-E{mk}{code}"
            n = 3 * (len(widths) if widths else 1) * len(sizes)
            assert n <= 400, (key, n)
            shots = ["01-hero", "02-macro", "03-profile", "04-top", "05-on-hand", "06-nyc",
                     "07-interior", "08-bead" if mk == "07" else "08-widths", "09-karats", "10-pair"]
            t_short = f"{low} {name.lower()} ring"
            images = [{"position": i, "file": f"{s}.jpg", "url": f"{IMG_BASE}/{key}/{s}.jpg",
                       "alt": SHOT_ALT[s].format(t=t_short)[:250]} for i, s in enumerate(shots)]
            listings.append({
                "key": key, "family_sku": family, "model": mk, "model_name": name,
                "metal": label, "metal_code": code,
                "eon_source_listing_id": lid, "eon_source_karat": src_k, "eon_units_sold": units,
                "title": title_for(mk, metal_key), "description": description_for(mk, metal_key),
                "tags": tags_for(mk, metal_key),
                "materials": ["Solid 10K " + low, "Solid 14K " + low, "Solid 18K " + low],
                "widths_mm": widths, "ring_sizes_us": [size_text(s) for s in sizes],
                "variant_count": n, "images": images,
            })
    for l in listings:
        for f in ("title", "description"):
            assert "–" not in l[f] and "—" not in l[f], (l["key"], f)
    return listings


def sql_lit(s: str) -> str:
    assert "$jg$" not in s
    return f"$jg${s}$jg$"


def emit_sql(listings, only=None):
    out = [f"""-- 0151 Jade Gold NYC: EON top 10 rings as 30 panel drafts (listing suggestions).
-- Generated by scripts/jade-eon-top10/catalog.py. Idempotent: skips existing family SKUs.
-- Panel only: listing_metadata.approval.etsyDraftCreationAuthorized = false blocks
-- the generic Etsy send path (lib/etsy/create-listing.ts). Prices are derived from
-- the live EON source grids below, not typed.
begin;
create temporary table _jg_src(model text, eon_listing bigint, src_karat text) on commit drop;
insert into _jg_src values
""" + ",\n".join(f"  ('{mk}', {m[2]}, '{m[3]}')" for mk, m in MODELS.items() if only in (None, mk)) + ";\n"]
    out.append("""create temporary table _jg_ratio(karat text, r numeric) on commit drop;
insert into _jg_ratio values ('10K',1.0),('14K',1.474),('18K',2.019);

-- EON source cells: (model, width_mm or null, ring size) -> price cents, yellow/plain rows only.
create temporary table _jg_cell on commit drop as
select s.model, s.src_karat,
  nullif(replace(replace(coalesce(
    (select x->'values'->>0 from jsonb_array_elements(case when jsonb_typeof(v.properties)='array' then v.properties else '[]' end) x where x->>'property_name'='Width'),
    v.properties->>'Width'),' ',''),'mm',''),'')::numeric as width_mm,
  replace(coalesce(
    (select x->'values'->>0 from jsonb_array_elements(case when jsonb_typeof(v.properties)='array' then v.properties else '[]' end) x where x->>'property_name'='Ring Size'),
    v.properties->>'Ring Size'),'US ','')::numeric as ring_size,
  max(v.price_cents) as price_cents
from _jg_src s
join public.products p on p.org_id = '""" + EON_ORG + """' and p.etsy_listing_id = s.eon_listing
join public.product_variants v on v.product_id = p.id
where coalesce(v.properties->>'Band color', v.properties->>'Gold Color', '') in ('', 'Gold', 'Yellow Gold')
group by 1,2,3,4;
""")
    out.append("create temporary table _jg_listing(key text, family text, model text, metal_code text, title text, description text, tags text[], materials text[], widths numeric[], sizes numeric[], images jsonb, meta jsonb) on commit drop;\ninsert into _jg_listing values\n")
    rows = []
    for l in listings:
        meta = {
            "protocolVersion": "etsy-listing-v1", "listingProtocol": "wedding_band", "productType": "ring",
            "variationAxes": ["Karat", "Width", "Ring Size"] if l["widths_mm"] else ["Karat", "Ring Size"],
            "sourcePackage": "docs/jade/eon-top10",
            "eonSource": {"listingId": l["eon_source_listing_id"], "karat": l["eon_source_karat"], "unitsSoldAllMetals": l["eon_units_sold"]},
            "pricing": {"methodology": "EON live source price per width and size, converted to a 10K basis and re-priced per karat with EON's measured ratios (14K 1.474, 18K 2.019), rounded up to USD 5, running max across ring sizes. Free-shipping allowance is inside the EON source price.", "costConfidence": "derived_from_eon"},
            "approval": {"status": "review", "etsyDraftCreationAuthorized": False, "livePublicationAuthorized": False,
                         "blockers": ["Owner review of AI product photos against the real ring", "Etsy canary push with max_variations_supported=3", "Jade Gold section and shipping profile"]},
        }
        rows.append("  (" + ", ".join([
            sql_lit(l["key"]), sql_lit(l["family_sku"]), sql_lit(l["model"]), sql_lit(l["metal_code"]),
            sql_lit(l["title"]), sql_lit(l["description"]),
            "ARRAY[" + ",".join(sql_lit(t) for t in l["tags"]) + "]::text[]",
            "ARRAY[" + ",".join(sql_lit(t) for t in l["materials"]) + "]::text[]",
            ("ARRAY[" + ",".join(str(w) for w in l["widths_mm"]) + "]::numeric[]") if l["widths_mm"] else "null",
            "ARRAY[" + ",".join(l["ring_sizes_us"]) + "]::numeric[]",
            sql_lit(json.dumps([[i["file"], i["alt"]] for i in l["images"]])) + "::jsonb",
            sql_lit(json.dumps(meta)) + "::jsonb",
        ]) + ")")
    out.append(",\n".join(rows) + ";\n")
    out.append("""
-- Variant grid with derived prices.
create temporary table _jg_var on commit drop as
with grid as (
  select l.key, l.family, l.model, k.karat, k.r, w.width_mm, sz.ring_size
  from _jg_listing l
  cross join _jg_ratio k
  cross join lateral unnest(coalesce(l.widths, array[null::numeric])) as w(width_mm)
  cross join lateral unnest(l.sizes) as sz(ring_size)
), priced as (
  select g.*, ceil(c.price_cents / sr.r * g.r / 500.0) * 500 as raw_cents
  from grid g
  join _jg_src s on s.model = g.model
  join _jg_ratio sr on sr.karat = s.src_karat
  join _jg_cell c on c.model = g.model and c.ring_size = g.ring_size
    and c.width_mm is not distinct from g.width_mm
)
select key, family, karat, width_mm, ring_size,
  max(raw_cents) over (partition by key, karat, width_mm order by ring_size rows unbounded preceding)::int as price_cents,
  family || '-' || left(karat, 2) || '-' || coalesce(lpad(width_mm::int::text, 2, '0'), '00') || '-' || lpad((ring_size * 10)::int::text, 3, '0') as sku,
  case when width_mm is null
    then jsonb_build_object('Karat', karat, 'Ring Size', 'US ' || case when ring_size = trunc(ring_size) then trunc(ring_size)::int::text else ring_size::text end)
    else jsonb_build_object('Karat', karat, 'Width', width_mm::int || ' mm', 'Ring Size', 'US ' || case when ring_size = trunc(ring_size) then trunc(ring_size)::int::text else ring_size::text end)
  end as properties
from priced;

do $$
declare expected int; got int;
begin
  select sum(coalesce(array_length(widths,1),1) * array_length(sizes,1) * 3) into expected from _jg_listing;
  select count(*) into got from _jg_var;
  if got <> expected then raise exception 'jade eon top10: % priced variants, expected % (missing EON source cells)', got, expected; end if;
end $$;

insert into public.products (org_id, sku, title, status, price_cents, currency, description, tags, materials,
  num_images, quantity, has_variations, image_url, product_type, research_keyword, listing_metadata)
select '""" + JADE_ORG + """', l.family, l.title, 'draft',
  (select min(v.price_cents) from _jg_var v where v.key = l.key), 'USD', l.description, l.tags, l.materials,
  10, """ + str(QUANTITY) + """, true, '""" + IMG_BASE + """/' || l.key || '/' || (l.images->0->>0), 'ring', l.tags[1], l.meta
from _jg_listing l
where not exists (select 1 from public.products p where p.org_id = '""" + JADE_ORG + """' and p.sku = l.family);

insert into public.product_variants (org_id, product_id, sku, name, properties, price_cents, quantity, active, currency)
select '""" + JADE_ORG + """', p.id, v.sku, v.sku, v.properties, v.price_cents, """ + str(QUANTITY) + """, true, 'USD'
from _jg_var v
join public.products p on p.org_id = '""" + JADE_ORG + """' and p.sku = v.family and p.etsy_listing_id is null
where not exists (select 1 from public.product_variants x where x.org_id = '""" + JADE_ORG + """' and x.sku = v.sku);

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select '""" + JADE_ORG + """', p.id, '""" + IMG_BASE + """/' || l.key || '/' || (img.v->>0), 'url', img.v->>1, (img.n - 1)::int
from _jg_listing l
join public.products p on p.org_id = '""" + JADE_ORG + """' and p.sku = l.family and p.etsy_listing_id is null
cross join lateral jsonb_array_elements(l.images) with ordinality img(v, n)
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = '""" + IMG_BASE + """/' || l.key || '/' || (img.v->>0));
commit;
""")
    return "".join(out)


if __name__ == "__main__":
    listings = build()
    (BASE / "catalog.json").write_text(json.dumps(listings, indent=1, ensure_ascii=False) + "\n")
    MIG.write_text(emit_sql(listings))
    chunks = BASE / "sql-chunks"
    chunks.mkdir(exist_ok=True)
    for mk in MODELS:
        sub = [l for l in listings if l["model"] == mk]
        (chunks / f"{mk}.sql").write_text(emit_sql(sub, only=mk))
    print(len(listings), "listings,", sum(l["variant_count"] for l in listings), "variants,",
          "max per listing", max(l["variant_count"] for l in listings))
    for l in listings[:3] + listings[18:21]:
        print(l["family_sku"], len(l["title"]), l["title"])


# ── Compact emitter: rebuilds description/alt/meta in SQL from short fields.
# Byte-identical to description_for(); verified by md5 against catalog.json.
DESC_HEAD = "The %s band in solid %s: %s. %s\n\nMade to order in New York style: quiet, solid, built for every day.\n\nTHE DETAILS\nMetal: %s\nKarat: 10K, 14K or 18K. Choose it in the Karat menu.\n%sRing size: US %s to %s, whole and half sizes.\n"


def description_tail():
    full = description_for("01", "yellow")
    return full[full.index("Fit: Comfort fit interior"):]


def emit_compact(listings):
    tail = description_tail()
    rows = []
    for l in listings:
        mk = l["model"]
        slug, name, lid, src_k, units, widths, sizes, feature, detail, _ = MODELS[mk]
        metal_key = l["key"].rsplit("-", 1)[1]
        low = METALS[metal_key][2]
        metal_line = f"Solid {low}, never plated, never filled."
        if mk == "09":
            metal_line = f"Solid {low} rails with a solid {TWO_TONE_ACCENT[metal_key]} center. Never plated, never filled."
        width_line = f"Width: {widths[0]}mm to {widths[-1]}mm, whole millimeters.\n" if widths else ""
        desc = (DESC_HEAD % (name, low, feature, detail, metal_line, width_line,
                             size_text(sizes[0]), size_text(sizes[-1]))) + tail
        assert desc == l["description"], l["key"]
        rows.append("(" + ", ".join([
            sql_lit(l["key"]), sql_lit(mk), sql_lit(l["title"]),
            sql_lit(name), sql_lit(low), sql_lit(feature), sql_lit(detail), sql_lit(metal_line),
            sql_lit(width_line), sql_lit(size_text(sizes[0])), sql_lit(size_text(sizes[-1])),
            "ARRAY[" + ",".join(sql_lit(t) for t in l["tags"]) + "]",
            ("ARRAY[" + ",".join(str(w) for w in widths) + "]::numeric[]") if widths else "null",
            "ARRAY[" + ",".join(l["ring_sizes_us"]) + "]::numeric[]",
            str(lid), sql_lit(src_k), str(units),
            sql_lit(f"{low} {name.lower()} ring"),
        ]) + ")")
    return rows, tail
