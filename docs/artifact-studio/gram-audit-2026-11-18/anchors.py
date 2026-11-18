"""Step 1 of the gram audit (owner 2026-11-18): every gram the maker stated, next to the estimate it replaced.

Anchors:
  - docs/jade/xmas26: 30 pieces quoted by the maker from photos (body grams without chain), each with my own
    geometry ledger in spec.json (finished body grams).
  - docs/artifact-studio/xmas26: B09 stations 3 g where the estimate was 0.8 g; N02 pendant 1 g = estimate.
Output: the maker / estimate ratio per product type, and what it does to each Leander family's 14K grams.
"""
import json, re, statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
J = ROOT / "docs/jade/xmas26"
A = ROOT / "docs/artifact-studio"
HERE = Path(__file__).resolve().parent

spec = json.load(open(J / "spec.json"))["products"]
quotes = json.load(open(J / "work/maker_quotes.json"))["quotes"]

BODY = [r"C-halkalar\s*([\d.]+)\s*g", r"[Bb]itmi[sş] u[cç] altini\s*([\d.]+)\s*g", r"govde\s*([\d.]+)\s*g",
        r"([\d.]+)\s*g\s*x\s*1\.15"]
anchors = []
for p in spec:
    q = quotes.get(p["id"])
    if not q:
        continue
    text = " | ".join(p["workshop"]["bom"])
    m = next((x for x in (re.search(rx, text) for rx in BODY) if x), None)
    assert m, p["id"]
    mine = float(m.group(1))
    anchors.append({"set": "jade-xmas26", "id": p["id"], "type": p["category"], "noun": p["noun"], "max_mm": p["max_mm"],
                    "enamel": bool(p.get("enamel")), "estimate_g14": mine, "maker_g14": q["gram14_body"],
                    "ratio": round(q["gram14_body"] / mine, 2), "quote": q["text"]})
anchors += [
    {"set": "leander-xmas26", "id": "B09", "type": "bracelet", "noun": "station bracelet", "max_mm": 6, "enamel": True,
     "estimate_g14": 0.8, "maker_g14": 3.0, "ratio": 3.75, "quote": "3 g + 50 enamel + 100 chain + 50 assembly"},
    {"set": "leander-xmas26", "id": "N02", "type": "necklace", "noun": "pendant", "max_mm": 16, "enamel": True,
     "estimate_g14": 1.0, "maker_g14": 1.0, "ratio": 1.0, "quote": "1 g + 50 enamel"},
]


def pct(v, q):
    v = sorted(v)
    return v[min(len(v) - 1, int(round(q * (len(v) - 1))))]


factors = {}
for t in ("earrings", "necklace", "bracelet"):
    r = [a["ratio"] for a in anchors if a["type"] == t]
    g = [a["maker_g14"] for a in anchors if a["type"] == t]
    factors[t] = {"n": len(r), "ratio_min": min(r), "ratio_median": round(statistics.median(r), 2), "ratio_p80": pct(r, 0.8),
                  "ratio_max": max(r), "maker_g_min": min(g), "maker_g_median": statistics.median(g), "maker_g_max": max(g)}

# What the body of each Leander piece is today, by catalog, and what the maker ratio makes of it.
TYPE = {"earring": "earrings", "earrings": "earrings", "necklace": "necklace", "bracelet": "bracelet", "anklet": "bracelet"}
ALREADY = {"xmas26": "maker terms applied 2026-10-07 (rings from the band list, stations x3.75)",
           "him26": "bands from the maker list; chains and studs estimated",
           "evil-eye": "motif rings as a 3 mm list band; pendants and stations raised over geometry"}
families = []
for cat in ("ss27-anklets", "fw2627-enamel", "xmas26", "him26", "evil-eye"):
    items = json.load(open(A / cat / "catalog.json"))["items"]
    for kind in sorted({i["productType"] for i in items}):
        rows = [i for i in items if i["productType"] == kind]
        t = TYPE.get(kind)
        body = []
        for i in rows:
            p = i.get("params") or {}
            b = p.get("charm_g14", p.get("piece_g", p.get("geo_g")))
            if kind == "ring":
                b = None
            elif cat == "him26" and kind == "earring":
                b = 2 * b                      # him26 piece_g is one earring; the anchors are pairs
            body.append(b)
        body = [b for b in body if b is not None]
        f = factors.get(t)
        fam = {"catalog": cat, "type": kind, "pieces": len(rows),
               "g14_total_now": [min(float(i["grams14Ref"]) for i in rows), max(float(i["grams14Ref"]) for i in rows)],
               "body_now": [min(body), max(body)] if body else None, "note": ALREADY.get(cat, "own geometry, never checked against the maker")}
        if f and body and not (cat == "him26" and kind == "bracelet"):
            fam["body_likely"] = [round(min(body) * f["ratio_median"], 2), round(max(body) * f["ratio_median"], 2)]
            fam["body_high"] = [round(min(body) * f["ratio_p80"], 2), round(max(body) * f["ratio_p80"], 2)]
            fam["added_g14_likely"] = [round(min(body) * (f["ratio_median"] - 1), 2), round(max(body) * (f["ratio_median"] - 1), 2)]
        families.append(fam)

out = {"spot_note": "grams only; no prices here", "anchors": anchors, "factors": factors, "families": families}
(HERE / "anchors.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print("anchors", len(anchors))
for t, f in factors.items():
    print(t, f)
for f in families:
    print(f["catalog"].ljust(14), f["type"].ljust(9), f["pieces"], "| total now", f["g14_total_now"], "| body now", f["body_now"],
          "| likely", f.get("body_likely"), "| high", f.get("body_high"))
