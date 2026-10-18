"""Jade Gold NYC, Christmas 2026: merge the copy pass and its independent read into spec.json.

Run: python3 -I docs/jade/xmas26/assemble.py
In:  work/copy_<CAT>.json   {category, copy: {products: [...]}, read: {per_product: [...]}}
Out: spec.json             the single source catalog.py and prompts.py read

The reader's findings are applied field by field, each one logged to work/applied.json so the
change is visible; a finding on a field this script does not know is NOT applied and is printed,
because silently dropping it would read as "covered" when it was not.
"""
import json
import pathlib
import re

HERE = pathlib.Path(__file__).parent
WORK = HERE / "work"
ORDER = ["BILEKLIK", "KOLYE", "KUPE", "BROS"]

TEXT = {"title", "description", "camera", "macro", "back", "side", "alt_base", "alt_macro", "alt_back",
        "enamel_phrase", "stone_phrase", "bench_props", "noun", "season_proof", "cold_enamel_paragraph",
        "enamel_colours_tr", "stones_tr", "name", "motif", "wearer"}
LISTS = {"tags", "materials"}
NUMS = {"gold_grams": float, "total_grams": float, "max_mm": float, "stones": int}


def clean_list(v):
    if isinstance(v, list):
        return [x.strip() for x in v if x.strip()]
    v = v.strip().strip("[]")
    parts = re.split(r"\s*[,\n]\s*", v)
    return [p.strip().strip("'\"") for p in parts if p.strip().strip("'\"")]


products, applied, skipped = [], [], []
for cat in ORDER:
    f = WORK / f"copy_{cat}.json"
    if not f.exists():
        raise SystemExit(f"missing {f.name}")
    d = json.load(open(f))
    by_id = {p["id"]: dict(p) for p in d["copy"]["products"]}
    for pp in (d.get("read") or {}).get("per_product", []):
        p = by_id.get(pp["id"])
        assert p, (cat, pp["id"])
        for fd in pp["findings"]:
            field = fd["field"].strip().split(".")[0].split("[")[0]
            new = fd["replacement"]
            if not new or not str(new).strip():
                skipped.append({"id": pp["id"], "field": field, "why": "empty replacement", "problem": fd["problem"]})
                continue
            if field in TEXT:
                p[field] = new.strip()
            elif field in LISTS:
                p[field] = clean_list(new)
            elif field in NUMS:
                try:
                    p[field] = NUMS[field](re.findall(r"[\d.]+", str(new))[0])
                except (IndexError, ValueError):
                    skipped.append({"id": pp["id"], "field": field, "why": "not a number", "problem": fd["problem"]})
                    continue
            else:
                skipped.append({"id": pp["id"], "field": field, "why": "unknown field", "problem": fd["problem"]})
                continue
            applied.append({"id": pp["id"], "field": field, "problem": fd["problem"]})
    for pid in sorted(by_id, key=lambda x: int(re.sub(r"\D", "", x))):
        p = by_id[pid]
        p["stones"] = int(p["stones"])
        p["enamel"] = bool(p["enamel"])
        products.append(p)

json.dump({"collection": "Jade Gold NYC Christmas 2026", "products": products},
          open(HERE / "spec.json", "w"), ensure_ascii=False, indent=1)
json.dump({"applied": applied, "skipped": skipped}, open(WORK / "applied.json", "w"), ensure_ascii=False, indent=1)
print(f"{len(products)} products, {len(applied)} reader findings applied, {len(skipped)} not applied")
for s in skipped:
    print("NOT APPLIED", s)
