"""Text fix after image QA -> supabase/migrations/0162_artifact_xmas26_textfix.sql.

usage: python3 gen_textfix_migration.py <old catalog.json>
The images are the design visualization, so where a frame set and the text disagreed the text was
brought to the images: B07 shows three leaves and four berries; the poinsettia heroes show six (R09,
B09) and five (N09) petals, so the poinsettia text no longer states a petal count.
Compare-and-set: a row is updated only while its description still equals the old text, so a second
run, or a fresh database provisioned from the regenerated 0160, is a no-op.
"""
import hashlib, json, pathlib, sys
HERE = pathlib.Path(__file__).parent; REPO = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
old = {i["id"]: i for i in json.load(open(sys.argv[1]))["items"]}
new = {i["id"]: i for i in json.load(open(HERE / "catalog.json"))["items"]}
changed = [k for k in new if new[k]["description"] != old[k]["description"]]
assert sorted(changed) == ["B07", "R09"], changed  # B09/N09 descriptions never stated a petal count
for k in new:
    assert new[k]["title"] == old[k]["title"] and new[k]["tags"] == old[k]["tags"], k
q = lambda s: "$tf$" + s + "$tf$"
stmts = "\n".join(
    f"update public.products set description = {q(new[k]['description'])}\n"
    f"where org_id = '{ORG}' and sku = '{new[k]['sku']}' and etsy_listing_id is null and description = {q(old[k]['description'])};"
    for k in sorted(changed))
lines = sorted((new[k]["sku"] + "|" + hashlib.md5(new[k]["description"].encode()).hexdigest() for k in new), key=lambda s: s.encode())
SEAL = hashlib.md5("\n".join(lines).encode()).hexdigest()
sql = f"""-- 0162_artifact_xmas26_textfix.sql
-- Christmas 2026: listing text brought to the approved images ({", ".join(sorted(changed))}).
-- Generator: docs/artifact-studio/xmas26/gen_textfix_migration.py. DO NOT EDIT BY HAND. Panel only.
-- Seal (run after apply):
--   select md5(string_agg(sku||'|'||md5(description), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-XM-%';
--   expected: {SEAL}
begin;
{stmts}
commit;
"""
(REPO / "supabase/migrations/0162_artifact_xmas26_textfix.sql").write_text(sql)
print(sorted(changed), SEAL, len(sql))
