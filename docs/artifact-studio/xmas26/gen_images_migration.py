"""Christmas 2026 gallery -> supabase/migrations/0161_artifact_xmas26_gallery.sql (+ seal).

Run after every listing has public/artifact/xmas26/<ID>/01..10.jpg:
  python3 docs/artifact-studio/xmas26/gen_images_migration.py
Panel only, unpublished drafts only (etsy_listing_id is null); no Etsy write.
- listing_images positions 0..9 = sales frames 01..10 (frame 01 is the colour-world hero);
  the warm-paper hero <ID>.jpg is the generation reference only and is not listed;
- products.image_url = frame 01, num_images = 10, missingHero false, image blocker rewritten.
Alt text makes no finger claim (the model picks the finger; the listing does not promise one).
"""
import hashlib, json, pathlib

HERE = pathlib.Path(__file__).parent
REPO = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
BASE = "https://amuletta.artifactstudio.info/artifact/xmas26"
items = json.load(open(HERE / "catalog.json"))["items"]
shots = json.load(open(HERE / "shots.json"))

PROP = {"Holly": "fir and pine cones", "Candy Cane": "a peppermint candy cane", "Gingerbread": "a gingerbread cookie",
        "Bauble": "a glass bauble", "Snowflake": "snow and fir", "Tree": "fir and cinnamon",
        "Mistletoe": "a mistletoe sprig", "Bell": "a velvet bow", "Poinsettia": "fir and cranberries",
        "Stocking": "a knit mitten and cinnamon"}


def alts(it):
    n, t, g = it["name"], it["productType"], shots[it["id"]]["palette"]["backdrop"]
    surface = "polished sculpted gold" if it["goldOnly"] else " and ".join(it["enamel"]) + " enamel"
    worn = {"ring": "worn on the hand", "bracelet": "worn on the wrist", "necklace": "worn at the collarbone"}[t]
    a03 = {"ring": f"{n} on a hand resting on a wrapped Christmas gift",
           "bracelet": f"{n} on the wrist while tying a gift ribbon",
           "necklace": f"{n} worn with a velvet neckline"}[t]
    a04 = {"ring": f"{n} on a hand rising from a studio plinth", "bracelet": f"{n} on a wrist rising from a studio plinth",
           "necklace": f"{n} seen in profile at the neck"}[t]
    a10 = {"ring": f"{n} worn with a velvet blazer", "bracelet": f"{n} worn with a velvet blazer",
           "necklace": f"{n} worn with an open wool coat"}[t]
    return [
        f"{n} in solid gold on {g} paper",
        f"{n} {worn} with a cable-knit sweater",
        a03, a04,
        f"Scale view of the {n}, {it['dims']}",
        f"Close-up of the {surface} of the {n}",
        f"{n} in a Christmas still life with {PROP[it['family']]}",
        f"{n} on a white card beside an open gift box",
        f"{n} shown in yellow, white and rose gold (colour visualization)",
        a10,
    ]


rows, seal_lines = [], []
for it in items:
    d = REPO / "public/artifact/xmas26" / it["id"]
    files = sorted(p.name for p in d.glob("[0-9][0-9].jpg"))
    assert files == [f"{k:02d}.jpg" for k in range(1, 11)], (it["id"], files)
    for pos, alt in enumerate(alts(it)):
        for bad in ("—", "–", "â", "ring finger", "middle finger"):
            assert bad not in alt, (it["id"], alt)
        assert len(alt) <= 250
        url = f"{BASE}/{it['id']}/{pos + 1:02d}.jpg"
        rows.append((it["sku"], pos, url, alt))
        seal_lines.append(f"{it['sku']}|{pos}|{url}|{alt}")
assert len(rows) == 300
seal_lines.sort(key=lambda s: s.encode())
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
q = lambda s: "$gl$" + s + "$gl$"
values = ",\n".join(f"({q(s)}, {p}, {q(u)}, {q(a)})" for s, p, u, a in rows)
BLOCKER = ("Images are design visualizations (Higgsfield): 10 sales frames per listing in its colour world, "
           "frame 09 is a metal colour visualization; photograph the physical piece before or after the first sale.")

sql = f"""-- 0161_artifact_xmas26_gallery.sql
-- by Artifact Studio Christmas 2026: 10 sales images per listing (positions 0..9 = frames 01..10),
-- image_url = frame 01, num_images = 10, missingHero false, image blocker rewritten. Only unpublished drafts.
-- Panel only; no Etsy write. Images: public/artifact/xmas26/<ID>/01..10.jpg (docs: images.json, qa/).
-- Generator: docs/artifact-studio/xmas26/gen_images_migration.py. DO NOT EDIT BY HAND.
-- Seal (run after apply):
--   select count(*), md5(string_agg(p.sku||'|'||li.position||'|'||li.url||'|'||li.alt, E'\\n'
--     order by p.sku||'|'||li.position||'|'||li.url||'|'||li.alt collate "C"))
--   from listing_images li join products p on p.id = li.product_id
--   where p.org_id = '{ORG}' and p.sku like 'BAS-XM-%';
--   expected: 300 / {SEAL}
begin;

create temporary table _xg(sku text, pos int, url text, alt text) on commit drop;
insert into _xg values
{values};

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from _xg g
join public.products p on p.org_id = '{ORG}' and p.sku = g.sku and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set image_url = g.url, num_images = 10,
    listing_metadata = jsonb_set(jsonb_set(p.listing_metadata, '{{missingHero}}', 'false'::jsonb),
      '{{approval,blockers,2}}', to_jsonb({q(BLOCKER)}::text))
from _xg g
where g.sku = p.sku and g.pos = 0 and p.org_id = '{ORG}' and p.etsy_listing_id is null;

commit;
"""
out = REPO / "supabase/migrations/0161_artifact_xmas26_gallery.sql"
out.write_text(sql)
json.dump({"gallerySeal": SEAL, "rows": len(rows)}, open(HERE / "gallery-seal.json", "w"), indent=1)
print(out.name, len(sql), "bytes", len(rows), "rows", SEAL)
