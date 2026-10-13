"""Twig and Baroque Pearl Station Bracelet: catalog (copy, 27 variants, prices, grams).

Run: python3 docs/artifact-studio/twig/catalog.py  -> catalog.json
Direction: 01-design-direction.md (owner 2026-10-13: white pearl only, no diamond, no engraving, no tag or extender).
Pricing: 2 x maker cost (../maker_cost.py): station at the 1 g unit floor (maker count, Christmas B09), bracelet
chain 100 USD at 7 in scaled by length, assembly 50, pearl 15 USD (UNCALIBRATED_ASSUMPTION).
"""
import json, pathlib, re, sys, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent))
import maker_cost as mk  # noqa: E402

ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("9d3c6a1e-41c2-4f5e-8b7a-2f0e6c9b1d47")
SKU = "BAS-TWIG-B01"
STATION_G14 = 1.0      # unit floor; the brief's parts add to 0.63 g (twig 0.26, cup 0.10, loops 0.05, tag 0.22 dropped)
PEARL_USD = 15         # UNCALIBRATED_ASSUMPTION: one 6 mm white baroque freshwater pearl, cemented
LENGTHS = [6.5, 7, 7.5]
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]

NAME = "Twig and Baroque Pearl Bracelet"
TITLE = ("Twig and Baroque Pearl Bracelet, Solid Gold Branch Station with a Freshwater Pearl, "
         "Dainty Cable Chain, Woodland Christmas Gift")
TAGS = ["pearl bracelet", "baroque pearl", "solid gold bracelet", "twig bracelet", "woodland jewelry",
        "gold twig jewelry", "christmas gift", "gift for her", "branch bracelet", "14k gold bracelet",
        "dainty bracelet", "pearl gold jewelry", "bridesmaid gift"]

LEAD = "One white baroque pearl held on a small solid gold twig, set at the centre of a fine gold cable chain."
STORY = ("The twig is cast with a soft bark texture and two short spurs, like a branch in a winter garden, and the "
         "pearl sits in a small gold cup on top of it. Each baroque pearl has its own shape and lustre, so no two "
         "bracelets are quite alike. It is light enough to wear every day and to stack with other chains.")
METAL = ("Metal: solid 10K, 14K or 18K gold in yellow, white or rose. "
         "White gold, not rhodium plated: a soft warm grey, warmer at 10K.")
PEARL = "Pearl: one white baroque freshwater pearl, about 6 mm, set in a gold cup; each pearl is unique in shape."
SIZE = "Size: twig 20 mm long, cup 4.6 mm across."
CHAIN = "Chain: 1.1 mm solid gold cable chain in the same gold, spring ring clasp; choose 6.5, 7 or 7.5 inches."
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE = ("Care: solid gold does not tarnish. Pearls are soft, so put the bracelet on after perfume and lotion, "
        "keep it away from water and wipe it with a soft cloth.")
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece and its "
          "pearl may vary slightly.")
DESCRIPTION = "\n\n".join([LEAD, STORY, "\n".join([METAL, PEARL, SIZE, CHAIN]), SHIP, CARE, IMAGES])

BAN = ["protect", "ward", "luck", "healing", "baby", "kids", "diamond", "engrav", "personaliz", "initial",
       "extender", "silver-grey", "grey pearl", "—", "–", "â"]


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


def num(x):
    return str(int(x)) if x == int(x) else str(x)


variants = []
for k in KARATS:
    for cc, cn in COLORS:
        for L in LENGTHS:
            g14 = STATION_G14 + mk.CHAIN_BRACELET_7IN / mk.MAKER_14K_USD_G * L / 7
            cost = mk.gold_cost(g14, k) + mk.ASSEMBLY + PEARL_USD
            variants.append({
                "sku": f"{SKU}-{k}{cc}-{num(L).replace('.', '_')}IN",
                "properties": {"Karat": k, "Metal Color": cn, "Bracelet Length": f"{num(L)} inches"},
                "price_cents": mk.price_cents(cost),
                "grams": round(g14 * mk.DENSITY[k], 2),
                "makerCostUsd": round(cost, 2),
            })

assert len(variants) == 27 and len({v["sku"] for v in variants}) == 27
assert all(len(v["sku"]) <= 32 for v in variants)
assert all(v["price_cents"] % 1000 == 0 for v in variants)
for v in variants:
    assert v["price_cents"] / 100 * 0.70 * (1 - 0.095) > v["makerCostUsd"], v["sku"]
ref = next(v for v in variants if v["sku"] == f"{SKU}-14KY-7IN")
assert ref["price_cents"] == 53000, ref
assert len(TITLE) <= 140 and derive_group(TITLE) == "bracelet", (len(TITLE), derive_group(TITLE))
assert not re.search(r"\b(10|14|18)\s*k\b|(yellow|white|rose)\s*gold", TITLE.lower())
assert len(TAGS) == 13 and len(set(TAGS)) == 13
for t in TAGS:
    assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), t
for where, text in [("title", TITLE), ("desc", DESCRIPTION), ("tags", " ".join(TAGS))]:
    for b in BAN:
        assert b not in text.lower(), (where, b)
assert '"chain_bracelet"' in (ROOT / "lib/etsy/listing-protocol.ts").read_text(encoding="utf-8")

item = {
    "id": "B01", "productId": str(uuid.uuid5(NS, SKU)), "sku": SKU, "productType": "bracelet",
    "listingProtocol": "chain_bracelet", "name": NAME, "title": TITLE, "tags": TAGS,
    "description": DESCRIPTION, "dims": "twig 20 mm, 6 mm baroque pearl",
    "variationAxes": ["Karat", "Metal Color", "Bracelet Length"], "variants": variants,
    "grams14Ref": round(STATION_G14 + 1.0, 2), "refPriceCents": ref["price_cents"],
    "makerCost14KRefUsd": ref["makerCostUsd"],
}
json.dump({"org": ORG, "source": "artifact-twig-v1", "pricingBasis": {
    "spotUsdOzt": mk.SPOT_USD_OZT, "rule": "price = ceil(2 x maker cost / 10) x 10",
    "makerCost": "14K 100 USD/g with labour; bracelet chain 100 USD at 7 in scaled by length; assembly 50 USD; 10K/18K by density and purity",
    "estimated": ["station at the 1 g unit floor (UNCALIBRATED_ASSUMPTION)", "pearl 15 USD (UNCALIBRATED_ASSUMPTION)"]},
    "items": [item]}, open(HERE / "catalog.json", "w"), indent=1, ensure_ascii=False)
print("27 variants;", {k: [v["price_cents"] // 100 for v in variants if v["properties"]["Karat"] == k and v["properties"]["Metal Color"] == "Yellow Gold"] for k in KARATS}, len(TITLE))
