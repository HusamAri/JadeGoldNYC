"""Steps 3 and 5 of the gram audit: one gram rule per catalog piece, as (sku prefix, multiplier, added 14K grams).

new variant grams = panel grams x mult + add14 x density(karat). Sources: anchors.json (maker ratios), chains.json.
Comparable Etsy listings that state grams (read 2026-11-18) are lighter than the maker's figures:
anklets with a 10 to 12 mm charm 1.0 g, 1.65 g and 1.8 g; a 7.4 mm enamel stud 0.6 g each; hamsa pendants 0.8 to 1.2 g.
The maker is the one who bills by weight, so his ratios set the grams and the market figures stay as the low bound.
"""
import json
from pathlib import Path
A = Path(__file__).resolve().parents[1]
HERE = Path(__file__).resolve().parent
F = json.load(open(HERE / "anchors.json"))["factors"]
EAR, PEND, STAT = F["earrings"]["ratio_median"], F["necklace"]["ratio_median"], F["bracelet"]["ratio_median"]
HOOP = 1.39            # the one hoop the maker quoted (Jade E5)
BAND3 = 3.59           # maker list: motif ring priced as a 3 mm band
SAFETY = 1.15          # no anchor at all: panel grams plus 15%
rows = []


def add(sku, mult, add14, why):
    rows.append({"sku": sku, "mult": round(mult, 4), "add14": round(add14, 3), "why": why})


for cat in ("ss27-anklets", "fw2627-enamel", "xmas26", "him26", "evil-eye", "winter27"):
    for i in json.load(open(A / cat / "catalog.json"))["items"]:
        p, t, sku, d = i.get("params") or {}, i["productType"], i["sku"], str(i.get("dims", ""))
        if cat == "ss27-anklets":
            add(sku, 1, p["charm_g14"] * (STAT - 1), "charm x maker station ratio")
        elif cat == "fw2627-enamel":
            if t == "earring":
                add(sku, HOOP if "hugg" in d or "hoop" in d else EAR, 0, "earring body x maker ratio")
            elif t == "necklace":
                add(sku, 1, p["piece_g"] * (PEND - 1), "pendant x maker ratio")
            elif t == "bracelet":
                add(sku, SAFETY if p.get("cuff") else 1, 0 if p.get("cuff") else p["piece_g"] * (STAT - 1), "stations x maker ratio; cuff + 15%")
            else:
                add(sku, 1, max(0.0, BAND3 - float(i["grams14Ref"])), "motif ring raised to the maker's 3 mm band")
        elif cat == "xmas26":
            add(sku, 1, p["piece_g"] * (PEND - 1) if t == "necklace" else 0, "maker terms already applied; pendant x ratio")
        elif cat == "him26":
            if t == "earring":
                add(sku, HOOP if "hoop" in d else EAR, 0, "earring body x maker ratio")
            elif "curb" in d:
                add(sku, 0.44 / 0.62, 0, "curb chain from the supplier catalog")
            elif "figaro" in d:
                add(sku, 0.27 / 0.45, 0, "figaro chain from the supplier catalog")
            elif "box chain" in d and d.startswith("2 mm"):
                add(sku, 0.64 / 0.42, 0, "box chain on the heavy retail case")
            else:
                add(sku, 1, 0, "maker band list or chain kept")
        elif cat == "evil-eye":
            add(sku, 1, 0, "already raised over geometry to maker terms")
        else:
            add(sku, SAFETY, 0, "no anchor: + 15%")

# ---- singles outside the catalogs: Blender models (models.json), likely x 1.15, against the panel's reference variant
MD = json.load(open(HERE / "models.json"))
g = lambda k: MD[k]["g14"]
CH, FIND = 0.117, 0.2      # 14K cable 1.0 to 1.2 mm, heavy case, g per inch; clasp and rings


def ring_rule(sku, key, panel_ref, safety=SAFETY, floor=0.0):
    add(sku, max(1.0, max(g(key) * safety, floor) / panel_ref), 0, f"Blender model {g(key)} g at the reference size x {safety}; panel {panel_ref}")


def chain_rule(sku, key, panel_ref, inches):
    target = g(key) * SAFETY + FIND + CH * inches
    add(sku, 1, max(0.0, target - panel_ref), f"Blender motif {g(key)} g x {SAFETY} + findings + chain; panel {panel_ref} at {inches} in")


ring_rule("BAS-S01-CRT", "BAS-S01-CRT@US7", 9.57)
ring_rule("BAS-F26-SIGNET", "BAS-F26-SIGNET@US7", 6.7)
ring_rule("BAS-I03-INF", "BAS-I03-INF@US7", 2.15)
ring_rule("BAS-M03-ROSETTE", "BAS-M03-ROSETTE@US7", 2.25)
ring_rule("BAS-M03S-ROSETTE", "BAS-M03S-ROSETTE@US7", 3.1)
ring_rule("BAS-M05-SUNRISE", "BAS-M05-SUNRISE@US7", 3.15)
ring_rule("BAS-F26-OPENARC", "BAS-F26-OPENARC@US7", 2.25)
ring_rule("BAS-FW26-L07", "BAS-FW26-L07", 2.5)
for k, ref in (("R01", 2.2), ("R02", 2.0), ("R03", 1.9), ("R04", 2.0), ("R05", 2.1)):
    ring_rule(f"BAS-27-MINE-{k}", f"BAS-27-MINE-{k}@US7", ref, safety=1.0, floor=BAND3)
chain_rule("BAS-M11-LION", "BAS-M11-LION", 2.2, 16)
chain_rule("BAS-I13-INF", "BAS-I13-INF", 2.3, 16)
chain_rule("BAS-I13", "BAS-I13", 3.07, 16)
chain_rule("BAS-MOTH-N01", "BAS-MOTH-N01", 2.46, 16)
chain_rule("BAS-E08-EYE", "BAS-E08-EYE", 1.65, 7)
chain_rule("BAS-E10", "BAS-E10", 1.14, 7)
chain_rule("BAS-I06", "BAS-I06", 1.72, 7)
chain_rule("BAS-I10", "BAS-I10", 1.88, 7)
chain_rule("BAS-H08-CERCLE", "BAS-H08-CERCLE", 1.48, 7)
chain_rule("BAS-F26-SUNRAY", "BAS-F26-SUNRAY", 2.8, 7)
chain_rule("BAS-TWIG-B01", "BAS-TWIG-B01", 2.0, 7)
for n in range(1, 6):
    add(f"BAS-27-MINE-E0{n}", EAR, 0, "enamel stud pair x maker earring ratio")
    add(f"BAS-27-MINE-N0{n}", 1, 1.3 * (PEND - 1) + 2 * 0.0942, "pendant about 1.3 g x maker pendant ratio; one SKU covers 16 and 18 in on Etsy, weighed at 18")
    add(f"BAS-27-MINE-B0{n}", 1, 0.5 * (STAT - 1), "bar about 0.5 g x maker station ratio")
add("BAS-B14", 1, 0, "band on the maker's list geometry")
add("BAS-C01-FRZ", 1, 0, "cuff: width x 1.5 mm x flat length, checked against the listing")
# rows the catalog loop built for pieces that now have a model
for sku, key, ref in (("BAS-W02", "BAS-W02@US7", 7.34), ("BAS-HM-R03", "BAS-HM-R03@US9", 8.11), ("BAS-HM-R04", "BAS-HM-R04@US9", 6.75)):
    rows[:] = [r for r in rows if r["sku"] != sku]
    ring_rule(sku, key, ref)
# the one listing with no grams at all: open rectangle necklace, set outright (14K, by chain length)
SET14 = {f"BAS-M11-{L}": round(g("BAS-M11") * SAFETY + FIND + CH * L, 2) for L in (16, 18, 20)}
json.dump({"set14": SET14, "default": {"mult": SAFETY, "add14": 0, "why": "no anchor: + 15%"}, "rows": rows}, open(HERE / "params.json", "w"), indent=1)
print(len(rows))
print(",".join(f"('{r['sku']}-',{r['mult']},{r['add14']})" for r in rows))
