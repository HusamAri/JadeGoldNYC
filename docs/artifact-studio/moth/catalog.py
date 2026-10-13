"""Openwork Moth Pendant Necklace: catalog (copy, 27 variants, prices, grams).

Run: python3 docs/artifact-studio/moth/catalog.py  -> catalog.json
Direction: 01-design-direction.md (owner decisions 2026-10-13: full grid, no stone, no engraving).
Geometry follows the accepted hero v3 (images/qa.md), not the brief: open head loop, centre vein,
smooth one-piece antennae. Pricing: 2 x maker cost (../maker_cost.py), the shop rule since 2026-10-07.
"""
import json, math, pathlib, re, sys, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent))
import maker_cost as mk  # noqa: E402

ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("5b0f4a52-0f53-4b8e-9a8e-6d1c7a1e2b13")
SKU = "BAS-MOTH-N01"
PENDANT_G14 = 1.3   # UNCALIBRATED_ASSUMPTION: geometry estimate (93 mm3 x 13.5 g/cm3 = 1.26 g), see 01-design-direction.md
LENGTHS = [16, 18, 20]
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]

NAME = "Openwork Moth Necklace"
TITLE = ("Openwork Moth Necklace, Solid Gold Moth Pendant on a Dainty Cable Chain, "
         "Minimalist Gold Moth Charm, Gift for Her")
TAGS = ["moth necklace", "moth pendant", "gold moth necklace", "moth jewelry", "insect necklace",
        "openwork pendant", "solid gold pendant", "14k gold necklace", "dainty necklace",
        "minimalist necklace", "layering necklace", "nature jewelry", "gift for her"]

LEAD = "An openwork moth in solid gold, 14 mm across, hanging from a fine gold cable chain."
STORY = ("The wings are drawn as bold polished outlines around a few large open cells, so the skin shows "
         "through them, and two smooth antennae sweep out from the head. It is cast flat, about 1 mm thick, "
         "light enough to wear every day and to layer with other chains.")
METAL = ("Metal: solid 10K, 14K or 18K gold in yellow, white or rose. "
         "White gold, not rhodium plated: a soft warm grey, warmer at 10K.")
FINISH = "Finish: polished solid gold; no stones, no enamel."
SIZE = "Size: moth 14 x 11 mm, about 1 mm thick, on a 3 mm bail."
CHAIN = "Chain: 1.1 mm solid gold cable chain in the same gold, spring ring clasp; choose 16, 18 or 20 inches."
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE = "Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish."
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")
DESCRIPTION = "\n\n".join([LEAD, STORY, "\n".join([METAL, FINISH, SIZE, CHAIN]), SHIP, CARE, IMAGES])

BAN = ["protect", "ward", "luck", "healing", "baby", "kids", "butterfly", "feather", "diamond", "stone set",
       "engrav", "personaliz", "—", "–", "â"]


def derive_group(title):
    """Mirror of lib/listing-facets.ts deriveGroup (the panel files the listing by its title)."""
    t = title.lower()
    if re.search(r"earring|\bhoops?\b|\bstuds?\b", t):
        return "earrings"
    if re.search(r"bracelet|anklet", t):
        return "bracelet"
    if re.search(r"\brings?\b|\bband\b", t):
        return "ring"
    if re.search(r"necklace|\bchain\b", t):
        return "necklace"
    return "other"


def chain_g14(length):
    return mk.CHAIN_NECKLACE_18IN / mk.MAKER_14K_USD_G * length / 18


variants = []
for k in KARATS:
    for cc, cn in COLORS:
        for L in LENGTHS:
            g14 = PENDANT_G14 + chain_g14(L)
            cost = mk.gold_cost(g14, k)
            variants.append({
                "sku": f"{SKU}-{k}{cc}-{L}IN",
                "properties": {"Karat": k, "Metal Color": cn, "Chain Length": f"{L} inches"},
                "price_cents": mk.price_cents(cost),
                "grams": round(g14 * mk.DENSITY[k], 2),
                "makerCostUsd": round(cost, 2),
            })

# ---------------------------------------------------------------- checks
assert len(variants) == 27 and len({v["sku"] for v in variants}) == 27
assert all(len(v["sku"]) <= 32 for v in variants)
assert all(v["price_cents"] % 1000 == 0 for v in variants)
for v in variants:   # deepest offer 30%, Etsy fees about 9.5%: the net must still clear maker cost
    net = v["price_cents"] / 100 * 0.70 * (1 - 0.095)
    assert net > v["makerCostUsd"], (v["sku"], net, v["makerCostUsd"])
ref = next(v for v in variants if v["sku"] == f"{SKU}-14KY-18IN")
assert ref["price_cents"] == 52000, ref
assert len(TITLE) <= 140 and derive_group(TITLE) == "necklace"
assert not re.search(r"\b(10|14|18)\s*k\b|(yellow|white|rose)\s*gold", TITLE.lower()), "karat and colour are variations"
assert len(TAGS) == 13 and len(set(TAGS)) == 13
for t in TAGS:
    assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), t
for where, text in [("title", TITLE), ("desc", DESCRIPTION), ("tags", " ".join(TAGS))]:
    low = text.lower()
    for b in BAN:
        assert b not in low, (where, b)
proto_src = (ROOT / "lib/etsy/listing-protocol.ts").read_text(encoding="utf-8")
assert '"pendant_necklace"' in proto_src

item = {
    "id": "N01", "productId": str(uuid.uuid5(NS, SKU)), "sku": SKU, "productType": "necklace",
    "listingProtocol": "pendant_necklace", "name": NAME, "title": TITLE, "tags": TAGS,
    "description": DESCRIPTION, "dims": "moth 14 x 11 mm, 1 mm thick",
    "variationAxes": ["Karat", "Metal Color", "Chain Length"], "variants": variants,
    "grams14Ref": round(PENDANT_G14 + chain_g14(18), 2), "refPriceCents": ref["price_cents"],
    "makerCost14KRefUsd": ref["makerCostUsd"],
}
json.dump({"org": ORG, "source": "artifact-moth-v1", "pricingBasis": {
    "spotUsdOzt": mk.SPOT_USD_OZT, "rule": "price = ceil(2 x maker cost / 10) x 10",
    "makerCost": "14K 100 USD/g with labour; chain 130 USD at 18 in scaled by length; 10K/18K by density and purity",
    "estimated": [f"pendant {PENDANT_G14} g 14K from geometry (UNCALIBRATED_ASSUMPTION)",
                  "chain at the maker's 18 in convention"]},
    "items": [item]}, open(HERE / "catalog.json", "w"), indent=1, ensure_ascii=False)
print("27 variants;", {k: [v["price_cents"] // 100 for v in variants if v["properties"]["Karat"] == k and v["properties"]["Metal Color"] == "Yellow Gold"] for k in KARATS})
