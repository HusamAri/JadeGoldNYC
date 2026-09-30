"""images.json + public/artifact/fw2627-enamel/<ID>/02..10.jpg -> supabase/migrations/0158_artifact_fw2627_enamel_gallery.sql

Adds the 9 sales images (positions 1..9 after the hero at 0) to each of the 40 panel
drafts, sets num_images = 10 and replaces the single-image sentence in the
description (slot 09 is a metal colour visualization, so the listing must say so).
Only unpublished drafts (etsy_listing_id is null) are touched. Idempotent.
Run: python3 docs/artifact-studio/fw2627-enamel/gen_images_migration.py
"""
import hashlib, json, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
BASE = "https://amuletta.artifactstudio.info/artifact/fw2627-enamel"
OLD = "The product image is a design visualization of the finished piece; the handmade piece may vary slightly."
NEW = ("The product images are design visualizations of the finished piece, and the three-metal image is a colour "
       "visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")

cat = json.load(open(HERE / "catalog.json"))
items = cat["items"] if isinstance(cat, dict) else cat
WORN = {"ring": "worn on the ring finger", "necklace": "worn at the collarbone",
        "earring": "worn on the ear", "bracelet": "worn on the wrist"}


def alts(it):
    n, c = it["name"], it["productType"]
    en = " and ".join(it["enamel"])
    return {
        "02": f"{n} {WORN[c]}",
        "03": f"{n} styled with autumn knitwear at home",
        "04": f"Close-up of the flat {en} enamel and polished gold rim of the {n}",
        "05": f"Scale view of the {n} in the hand, {it['dims']}",
        "06": f"Side and fitting view of the {n}",
        "07": f"{n} in a handmade ceramic dish",
        "08": f"{n} in an open gift box",
        "09": f"{n} shown in yellow, white and rose gold (colour visualization)",
        "10": f"{n} with the matching {it['family']} pieces",
    }


rows, seal = [], []
for it in items:
    for s, alt in alts(it).items():
        f = ROOT / f"public/artifact/fw2627-enamel/{it['id']}/{s}.jpg"
        assert f.exists(), f
        assert "$gl$" not in alt
        url = f"{BASE}/{it['id']}/{s}.jpg"
        rows.append(f"($gl${it['sku']}$gl$, $gl${url}$gl$, $gl${alt}$gl$, {int(s) - 1})")
        seal.append(f"{it['sku']}|{int(s) - 1}|{url}|{hashlib.sha256(f.read_bytes()).hexdigest()}")
assert len(rows) == 360
seal.sort()
SEAL = hashlib.md5("\n".join(l.rsplit("|", 1)[0] for l in seal).encode()).hexdigest()

sql = f"""-- 0158_artifact_fw2627_enamel_gallery.sql
-- by Artifact Studio FW 26/27 enamel: 9 sales images per listing (positions 1..9, hero stays at 0),
-- num_images = 10, and the image sentence in the description now covers the gallery and names the
-- three-metal frame as a colour visualization. Only unpublished drafts. Panel only; no Etsy write.
-- Generator: docs/artifact-studio/fw2627-enamel/gen_images_migration.py. DO NOT EDIT BY HAND.
-- Seal: select count(*), md5(string_agg(p.sku||'|'||li.position||'|'||li.url, E'\\n' order by p.sku||'|'||li.position||'|'||li.url collate "C"))
--   from listing_images li join products p on p.id = li.product_id
--   where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and li.position between 1 and 9;
--   expected: 360 / {SEAL}
begin;

create temporary table _gl(sku text, url text, alt text, position int) on commit drop;
insert into _gl values
{",\n".join(rows)};

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.position
from _gl g
join public.products p on p.org_id = '{ORG}' and p.sku = g.sku and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

update public.products p
set num_images = 10,
    description = replace(p.description, $gl${OLD}$gl$, $gl${NEW}$gl$)
where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and (p.num_images is distinct from 10 or position($gl${OLD}$gl$ in p.description) > 0);

update public.products p
set listing_metadata = jsonb_set(p.listing_metadata, '{{approval,blockers,2}}',
  to_jsonb($gl$Images are design visualizations (Higgsfield): hero plus 9 sales frames per listing, frame 09 is a metal colour visualization; photograph the physical piece before or after the first sale.$gl$::text))
where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and p.listing_metadata #>> '{{approval,blockers,2}}' like 'Hero image is a design visualization%';

commit;
"""
out = ROOT / "supabase/migrations/0158_artifact_fw2627_enamel_gallery.sql"
out.write_text(sql)
print(out.relative_to(ROOT), out.stat().st_size, "bytes", len(rows), SEAL)
