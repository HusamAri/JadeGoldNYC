"""catalog.json + public/artifact/fw2627-enamel/<ID>/02..10.jpg -> supabase/migrations/0158_artifact_fw2627_enamel_gallery.sql

Adds the 9 sales images (positions 1..9 after the hero at 0) to each of the 40 panel
drafts, sets num_images = 10, replaces the single-image sentence in the description
(slot 09 is a metal colour visualization, so the listing says so) and updates the
matching approval blocker. Only unpublished drafts (etsy_listing_id is null).
Idempotent. URL and alt text are derived in SQL from listing_metadata (name, family,
enamel, dims, productType) so the migration stays small; the seal below is computed
here from catalog.json with the same rules and must match the database after apply.
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
BLOCKER = ("Images are design visualizations (Higgsfield): hero plus 9 sales frames per listing, frame 09 is a metal "
           "colour visualization; photograph the physical piece before or after the first sale.")

cat = json.load(open(HERE / "catalog.json"))
items = cat["items"] if isinstance(cat, dict) else cat
WORN = {"ring": "worn on the ring finger", "necklace": "worn at the collarbone",
        "earring": "worn on the ear", "bracelet": "worn on the wrist"}
ALT = {  # slot -> template; {n} name, {en} enamel joined, {d} dims, {f} family, {w} worn phrase
    "02": "{n} {w}",
    "03": "{n} styled with autumn knitwear at home",
    "04": "Close-up of the flat {en} enamel and polished gold rim of the {n}",
    "05": "Scale view of the {n} in the hand, {d}",
    "06": "Side and fitting view of the {n}",
    "07": "{n} in a handmade ceramic dish",
    "08": "{n} in an open gift box",
    "09": "{n} shown in yellow, white and rose gold (colour visualization)",
    "10": "{n} with the matching {f} pieces",
}

seal = []
for it in items:
    for s, t in ALT.items():
        f = ROOT / f"public/artifact/fw2627-enamel/{it['id']}/{s}.jpg"
        assert f.exists(), f
        alt = t.format(n=it["name"], en=" and ".join(it["enamel"]), d=it["dims"], f=it["family"], w=WORN[it["productType"]])
        seal.append(f"{it['sku']}|{int(s) - 1}|{BASE}/{it['id']}/{s}.jpg|{alt}")
assert len(seal) == 360
seal.sort(key=lambda x: x.encode())
SEAL = hashlib.md5("\n".join(seal).encode()).hexdigest()
DESC = hashlib.md5("\n".join(sorted(
    (f"{it['sku']}|{hashlib.md5(it['description'].encode()).hexdigest()}" for it in items), key=lambda x: x.encode())).encode()).hexdigest()
assert all(NEW in it["description"] for it in items)

case = "\n".join(
    f"      when {int(s)} then " + " || ".join(
        {"{n}": "m->>'name'", "{en}": "en", "{d}": "m->>'dims'", "{f}": "m->>'family'", "{w}": "w"}.get(tok, f"$gl${tok}$gl$")
        for tok in __import__("re").split(r"(\{n\}|\{en\}|\{d\}|\{f\}|\{w\})", t) if tok)
    for s, t in ALT.items())

sql = f"""-- 0158_artifact_fw2627_enamel_gallery.sql
-- by Artifact Studio FW 26/27 enamel: 9 sales images per listing (positions 1..9, hero stays at 0),
-- num_images = 10, the image sentence in the description now covers the gallery and names the
-- three-metal frame as a colour visualization, approval blocker updated. Only unpublished drafts.
-- Panel only; no Etsy write. Images: public/artifact/fw2627-enamel/<ID>/02..10.jpg (docs: images.json).
-- Generator: docs/artifact-studio/fw2627-enamel/gen_images_migration.py. DO NOT EDIT BY HAND.
-- Seals (run after apply):
--   select count(*), md5(string_agg(p.sku||'|'||li.position||'|'||li.url||'|'||li.alt, E'\\n'
--     order by p.sku||'|'||li.position||'|'||li.url||'|'||li.alt collate "C"))
--   from listing_images li join products p on p.id = li.product_id
--   where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and li.position between 1 and 9;
--   expected: 360 / {SEAL}
--   select md5(string_agg(sku||'|'||md5(description), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-FW-%';
--   expected: {DESC}
begin;

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id,
  '{BASE}/' || (p.listing_metadata->>'modelId') || '/' || lpad(g.s::text, 2, '0') || '.jpg',
  'url',
  case g.s
{case}
  end,
  g.s - 1
from public.products p
cross join generate_series(2, 10) g(s)
cross join lateral (select p.listing_metadata m) mm(m)
cross join lateral (select array_to_string(array(select jsonb_array_elements_text(m->'enamel')), ' and ') en) e
cross join lateral (select case m->>'productType' when 'ring' then 'worn on the ring finger'
  when 'necklace' then 'worn at the collarbone' when 'earring' then 'worn on the ear'
  when 'bracelet' then 'worn on the wrist' end w) ww
where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and not exists (select 1 from public.listing_images li where li.product_id = p.id
    and li.url = '{BASE}/' || (p.listing_metadata->>'modelId') || '/' || lpad(g.s::text, 2, '0') || '.jpg');

update public.products p
set num_images = 10,
    description = replace(p.description, $gl${OLD}$gl$, $gl${NEW}$gl$)
where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and (p.num_images is distinct from 10 or position($gl${OLD}$gl$ in p.description) > 0);

update public.products p
set listing_metadata = jsonb_set(p.listing_metadata, '{{approval,blockers,2}}', to_jsonb($gl${BLOCKER}$gl$::text))
where p.org_id = '{ORG}' and p.sku like 'BAS-FW-%' and p.etsy_listing_id is null
  and p.listing_metadata #>> '{{approval,blockers,2}}' like 'Hero image is a design visualization%';

commit;
"""
out = ROOT / "supabase/migrations/0158_artifact_fw2627_enamel_gallery.sql"
out.write_text(sql)
print(out.relative_to(ROOT), out.stat().st_size, "bytes", len(seal), SEAL, DESC)
