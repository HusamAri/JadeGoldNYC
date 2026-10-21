"""Writes data/apply-matrix.json: the optimization matrix in the row shape that the
panel route app/api/ops/seo-apply reads (lib/etsy/seo-apply.ts SeoMatrixRow).

Only the fields the route needs are kept: id, current/new title, current/new tags and
section_fix as "From -> To" (the package stores a boolean plus two section names).
Order is the matrix order (priority). Run after generate_matrix.py.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
rows = json.loads((ROOT / "data/optimization-matrix.json").read_text())
out = [
    {
        "id": str(r["listing_id"]),
        "priority": r["priority"],
        "current_title": r["current_title"],
        "current_tags": r["current_tags"],
        "new_title": r["new_title"],
        "new_tags": r["new_tags"],
        "section_fix": f'{r["current_section"]} -> {r["target_section"]}' if r["section_fix"] else None,
    }
    for r in rows
]
assert len(out) == len({r["id"] for r in out}) == 210
(ROOT / "data/apply-matrix.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
print(len(out), "rows,", sum(1 for r in out if r["section_fix"]), "section moves")
