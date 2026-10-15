"""Winter 26/27 set: catalog (copy, variants, prices, grams) for five listings.

Run: python3 docs/artifact-studio/winter27/catalog.py  -> catalog.json
Direction: 01-design-direction.md. Pricing: 2 x maker cost (../maker_cost.py); grams are geometry estimates
(pricing.py, UNCALIBRATED_ASSUMPTION until the maker quotes). Spec follows the ACCEPTED heroes (2026-10-15):
W02 scales run down the shoulders, W03 has four spheres, W04 drops both strands through the slide ring and
its enamel eye is domed. Full Karat x Metal Color grid on every piece (CLAUDE.md); W01 is two-tone, so its
Metal Color values are the body/accent pairs (owner exception 2026-10-09).
"""
import json, math, pathlib, re, sys, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent))
import maker_cost as mk  # noqa: E402

ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("5b1f7c2e-8d94-4a6b-9e37-c1d2a0f84e63")
SOURCE = "artifact-winter27-v1"
D = 0.0135  # g per mm3, 14K
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]
TWO_TONE = [("YW", "Yellow/White Gold"), ("WY", "White/Yellow Gold"), ("RW", "Rose/White Gold")]
RING_SIZES = [x / 2 for x in range(6, 33)]   # US 3 .. 16 whole and half = 27
BRAC_LEN = [6.5, 7, 7.5]
NECK_LEN = [16, 18, 20]
BASE = "https://amuletta.artifactstudio.info/artifact/winter27"

SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE_GOLD = "Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish."
CARE_EN = ("Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, "
           "so take it off for the gym and the dishes and wipe it with a soft cloth.")
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")
METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose. White gold, not rhodium plated: a soft warm grey."
METAL_TT = ("Metal: solid 10K, 14K or 18K gold. Choose the body and the tip: yellow body with a white gold tip, "
            "white body with a yellow tip, or rose body with a white tip. White gold, not rhodium plated: a soft warm grey.")
BAN = ["diamond", "engrav", "personaliz", "initial", "protect", "luck", "healing", "hammered", "bark texture",
       "—", "–", "â"]


def num(x):
    return str(int(x)) if x == int(x) else str(x)


def band_g(width, thick, length):
    return width * thick * length * D


def sphere_g(d):
    return (math.pi / 6) * d ** 3 * D


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


# ------------------------------------------------------------------ cost per piece (14K grams, extras)
CUFF_MM = {6.5: 123, 7: 133, 7.5: 143}          # developed length, wrist size minus a 25 mm gap


def cost_w01(k, L):
    g14 = band_g(4, 1.3, CUFF_MM[L])
    return g14, mk.gold_cost(g14, k) + mk.ASSEMBLY          # white gold tip cast separately and soldered


def cost_w02(k, s):
    g14 = (math.pi / 4 * 13 * 11 * 2.0 * D) + mk.list_g14(3, s, 1.8)   # top + full shank (shoulders carved)
    return g14, mk.gold_cost(g14, k) + mk.ENAMEL_PIECE


def cost_w03(k):
    g14 = 2 * (4 * sphere_g(4.5) + 0.30)
    return g14, mk.gold_cost(g14, k) + mk.ENAMEL_PIECE


def cost_w04(k, L):
    g14 = 0.52 * 12 * 8 * 4 * D + 0.25
    chain = mk.CHAIN_NECKLACE_18IN * (L + 4) / 18           # developed length: Y plus a 4 in drop
    return g14, mk.gold_cost(g14, k) + mk.ENAMEL_PIECE + chain + mk.ASSEMBLY


def cost_w05(k):
    g14 = 10 * (math.pi / 4 * 1.2 ** 2 * 45 * D) + 0.35 + 0.5
    return g14, mk.gold_cost(g14, k) + mk.ASSEMBLY


def variant(sku, props, g14, cost, k):
    assert len(sku) <= 32, sku
    return {"sku": sku, "properties": props, "price_cents": mk.price_cents(cost),
            "grams": round(g14 * mk.DENSITY[k], 2), "makerCostUsd": round(cost, 2)}


ITEMS = []


def add(id, sku, ptype, mtype, protocol, name, title, tags, lead, story, spec, enamel, dims, axes, variants, ref_sku,
        g14ref, offers_personalization=False):
    care = CARE_EN if enamel else CARE_GOLD
    desc = "\n\n".join([lead, story, "\n".join(spec), SHIP, care, IMAGES])
    assert len(title) <= 140, (id, len(title))
    assert not re.search(r"\b(10|14|18)\s*k\b|(yellow|white|rose)\s*gold", title.lower()), id
    assert len(tags) == 13 and len(set(tags)) == 13, id
    for t in tags:
        assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), (id, t)
    for where, text in [("title", title), ("desc", desc), ("tags", " ".join(tags))]:
        for b in BAN:
            assert b not in text.lower(), (id, where, b)
    assert len({v["sku"] for v in variants}) == len(variants), id
    assert all(v["price_cents"] % 1000 == 0 for v in variants), id
    for v in variants:
        assert v["price_cents"] / 100 * 0.70 * (1 - 0.095) > v["makerCostUsd"], (id, v["sku"])   # 30% sale, Etsy fees
        assert list(v["properties"].keys()) == axes, (id, v["sku"])
    ref = next(v for v in variants if v["sku"] == ref_sku)
    ITEMS.append({
        "id": id, "productId": str(uuid.uuid5(NS, sku)), "sku": sku, "productType": ptype, "metaProductType": mtype,
        "listingProtocol": protocol, "offersPersonalization": offers_personalization, "name": name, "title": title,
        "tags": tags, "description": desc, "enamel": enamel, "goldOnly": not enamel, "dims": dims,
        "variationAxes": axes, "variants": variants, "grams14Ref": round(g14ref, 2),
        "refPriceCents": ref["price_cents"], "makerCost14KRefUsd": ref["makerCostUsd"],
        "imageBase": f"{BASE}/{id}", "group": derive_group(title),
    })


# ------------------------------------------------------------------ W01 Thaw Cuff
v = []
for k in KARATS:
    for cc, cn in TWO_TONE:
        for L in BRAC_LEN:
            g14, cost = cost_w01(k, L)
            v.append(variant(f"BAS-W01-{k}{cc}-{num(L).replace('.', '_')}IN",
                             {"Karat": k, "Metal Color": cn, "Bracelet Length": f"{num(L)} inches"}, g14, cost, k))
add("W01", "BAS-W01", "bracelet", "bracelet", "cuff_bracelet", "Thaw Cuff",
    "Thaw Cuff, Solid Gold Molten Open Cuff Bracelet with a Contrasting Gold Tip, Two Tone Sculptural Bangle, Winter Gift",
    ["gold cuff bracelet", "molten gold cuff", "two tone cuff", "open cuff bracelet", "sculptural cuff",
     "solid gold bangle", "mixed metal cuff", "statement cuff", "winter jewelry", "14k gold cuff",
     "gift for her", "organic gold cuff", "modern gold cuff"],
    "An open cuff of solid gold with a molten, softly rippled surface and one white gold tip, as if the gold were thawing out of ice.",
    ("The band is 4 mm wide and cast with a flowing, gently rippled high-polish surface, so light pools in every wave. "
     "The last 12 mm of one end is a second gold colour, joined in a soft melted seam: a yellow body with a white tip, "
     "a white body with a yellow tip, or a rose body with a white tip. The cuff is a smooth open C with rounded ends and "
     "sits close on the wrist; it is the one piece you wear with a bare arm and a wool sleeve pushed back."),
    [METAL_TT, "Finish: molten rippled high polish on the body, polished tip, smooth polished inside.",
     "Size: band 4 mm wide, about 1.3 mm thick, 25 mm opening; choose a 6.5, 7 or 7.5 inch wrist.",
     "Fit: the opening slips over the side of the wrist; a cuff is not meant to be bent to adjust."],
    [], "band 4 x 1.3 mm, 25 mm opening", ["Karat", "Metal Color", "Bracelet Length"], v, "BAS-W01-14KYW-7IN",
    cost_w01("14K", 7)[0])

# ------------------------------------------------------------------ W02 Pinecone Signet
v = []
for k in KARATS:
    for cc, cn in COLORS:
        for s in RING_SIZES:
            g14, cost = cost_w02(k, s)
            v.append(variant(f"BAS-W02-{k}{cc}-US{num(s).replace('.', '_')}",
                             {"Karat": k, "Metal Color": cn, "Ring Size": f"US {num(s)}"}, g14, cost, k))
add("W02", "BAS-W02", "ring", "ring", "signet_ring", "Pinecone Signet Ring",
    "Pinecone Signet Ring, Solid Gold Oval Signet with Carved Scales and Oxblood Enamel, Chunky Statement Ring, Winter Gift",
    ["pinecone ring", "gold signet ring", "oxblood enamel ring", "chunky signet ring", "oval signet ring",
     "carved gold ring", "enamel signet", "statement signet", "woodland ring", "14k signet ring",
     "unisex signet ring", "winter jewelry", "gift for him"],
    "A chunky oval signet carved with overlapping pinecone scales, the recesses between the scales filled with deep oxblood enamel.",
    ("The 13 x 11 mm oval table and both shoulders are cast in deep relief, each scale a small pointed shield rising in a "
     "spiral like a real pinecone, with glossy oxblood vitreous enamel set flush between them so the gold tips stand out "
     "against the dark red. A thin polished rim frames the table, the lower shank is smooth and polished, and the table is "
     "solid and closed underneath. It wears like a classic signet and reads like a piece of the winter forest."),
    [METAL, "Enamel: oxblood red vitreous enamel, glass fused to gold, set flush between the scales.",
     "Size: oval table 13 x 11 mm, about 2 mm deep; shank 3 mm wide; US 3 to 16 in whole and half sizes.",
     "Fit: a signet sits best a little snug; if you are between sizes, choose the larger one."],
    ["oxblood red"], "table 13 x 11 mm, shank 3 mm", ["Karat", "Metal Color", "Ring Size"], v, "BAS-W02-14KY-US7",
    cost_w02("14K", 7)[0])

# ------------------------------------------------------------------ W03 Juniper Drop Earrings
v = []
for k in KARATS:
    for cc, cn in COLORS:
        g14, cost = cost_w03(k)
        v.append(variant(f"BAS-W03-{k}{cc}", {"Karat": k, "Metal Color": cn}, g14, cost, k))
add("W03", "BAS-W03", "earrings", "earring", "dangle_earrings", "Juniper Drop Earrings",
    "Juniper Drop Earrings, Solid Gold Berry Cluster Dangles with One Dusty Blue Enamel Berry, French Hook, Winter Gift",
    ["juniper earrings", "berry earrings", "gold drop earrings", "blue enamel earrings", "cluster earrings",
     "gold ball earrings", "french hook earrings", "winter earrings", "botanical earrings", "14k drop earrings",
     "gift for her", "dusty blue jewelry", "solid gold dangles"],
    "A cluster of four small gold spheres on a French hook, three polished gold and one coated in dusty blue enamel, like berries on a juniper sprig.",
    ("Each earring is four 4.5 mm spheres touching in a tight cluster: three bright mirror-polished gold and exactly one "
     "in a soft powdery steel blue vitreous enamel with a matte bloom, the colour of a ripe juniper berry. The cluster "
     "hangs from a slim French hook with a tiny ball at its tip, so it moves a little as you move. Light enough for every "
     "day, enough colour for a winter table."),
    [METAL, "Enamel: dusty blue vitreous enamel, glass fused to gold, matte finish on one sphere per earring.",
     "Size: each sphere 4.5 mm, cluster about 10 mm across, total drop about 25 mm with the hook; sold as a pair.",
     "Closure: French hook in the same gold."],
    ["dusty blue"], "spheres 4.5 mm, cluster 10 mm", ["Karat", "Metal Color"], v, "BAS-W03-14KY", cost_w03("14K")[0])

# ------------------------------------------------------------------ W04 Ember Lariat
v = []
for k in KARATS:
    for cc, cn in COLORS:
        for L in NECK_LEN:
            g14, cost = cost_w04(k, L)
            v.append(variant(f"BAS-W04-{k}{cc}-{L}IN", {"Karat": k, "Metal Color": cn, "Chain Length": f"{L} inches"},
                             g14, cost, k))
add("W04", "BAS-W04", "necklace", "necklace", "pendant_necklace", "Ember Lariat Necklace",
    "Ember Lariat Necklace, Solid Gold Y Necklace with a Molten Teardrop and an Orange Enamel Eye, Adjustable Y Lariat, Winter Gift",
    ["lariat necklace", "gold y necklace", "teardrop necklace", "orange enamel charm", "molten gold pendant",
     "slide ring necklace", "solid gold lariat", "winter necklace", "ember jewelry", "14k lariat",
     "gift for her", "sculptural necklace", "drop necklace"],
    "A Y lariat of solid gold: both strands of a fine cable chain pass through a small slide ring and drop together to a molten teardrop with a glowing ember orange enamel eye.",
    ("The teardrop is cast solid, 12 x 8 mm, with a softly rippled polished surface like a drop of liquid gold, and in "
     "its wide end sits one small domed eye of ember orange vitreous enamel in a thin polished bezel, like the last coal "
     "in the grate. The two chain strands pass together through a smooth slide ring and fall as a short double strand to "
     "the pendant, so the Y sits at the base of the throat and the teardrop just below the collarbones."),
    [METAL, "Enamel: ember orange vitreous enamel, glass fused to gold, domed, about 3 mm across.",
     "Size: teardrop 12 x 8 mm; choose a 16, 18 or 20 inch chain, measured as the closed length before the drop.",
     "Chain: 1.1 mm solid gold cable chain in the same gold, spring ring clasp, slide ring in the same gold."],
    ["ember orange"], "teardrop 12 x 8 mm, eye 3 mm", ["Karat", "Metal Color", "Chain Length"], v, "BAS-W04-14KY-18IN",
    cost_w04("14K", 18)[0])

# ------------------------------------------------------------------ W05 Pine Needle Brooch
v = []
for k in KARATS:
    for cc, cn in COLORS:
        g14, cost = cost_w05(k)
        v.append(variant(f"BAS-W05-{k}{cc}", {"Karat": k, "Metal Color": cn}, g14, cost, k))
add("W05", "BAS-W05", "brooch", "brooch", "brooch", "Pine Needle Brooch",
    "Pine Needle Brooch, Solid Gold Crossed Needle Bundles with Matte Tips, Sculptural Lapel Pin, Winter Coat Brooch, Gift",
    ["gold brooch", "pine needle brooch", "lapel pin brooch", "sculptural brooch", "solid gold pin",
     "winter brooch", "coat brooch", "botanical brooch", "modern gold brooch", "14k gold brooch",
     "gift for her", "gift for him", "scarf pin"],
    "Two bundles of five slender solid gold pine needles crossed in an X, polished shafts and matte brushed tips, with a pin stem and catch on the back.",
    ("Each needle is a straight 1.2 mm round wire tapering to a soft point, 45 mm long; the ten needles cross at a small "
     "central hub, the shafts mirror polished and the last 8 mm of every tip brushed matte, so the piece catches light "
     "along its length and goes quiet at the points. A plain pin stem and a small revolver safety catch are soldered to "
     "the back in the same gold. Wear it on a coat lapel, a scarf, a knit shoulder or a hat band."),
    [METAL, "Finish: mirror polished shafts, matte brushed tips.",
     "Size: 45 mm across the X; needles 1.2 mm round wire.",
     "Closure: pin stem with a revolver safety catch, in the same gold."],
    [], "45 mm across, 1.2 mm wire", ["Karat", "Metal Color"], v, "BAS-W05-14KY", cost_w05("14K")[0])

# ------------------------------------------------------------------ checks and output
assert [len(i["variants"]) for i in ITEMS] == [27, 243, 9, 27, 9]
assert len({i["productId"] for i in ITEMS}) == 5 and len({i["title"] for i in ITEMS}) == 5
proto_src = (ROOT / "lib/etsy/listing-protocol.ts").read_text(encoding="utf-8")
for i in ITEMS:
    assert f'"{i["listingProtocol"]}"' in proto_src, i["listingProtocol"]
    assert i["group"] == {"W01": "bracelet", "W02": "ring", "W03": "earrings", "W04": "necklace", "W05": "other"}[i["id"]], i["id"]
    for s in range(1, 13):
        assert (ROOT / f"public/artifact/winter27/{i['id']}/{s:02d}.jpg").exists(), (i["id"], s)
json.dump({"org": ORG, "source": SOURCE, "pricingBasis": {
    "spotUsdOzt": mk.SPOT_USD_OZT, "rule": "price = ceil(2 x maker cost / 10) x 10",
    "makerCost": "14K 100 USD/g with labour; enamel 50 USD per piece; necklace chain 130 USD at 18 in scaled by developed length; assembly 50 USD; 10K/18K by density and purity",
    "estimated": ["all grams from geometry (pricing.py), UNCALIBRATED_ASSUMPTION until the maker quotes",
                  "W02 shank counted in full because the accepted hero carries the scales down the shoulders",
                  "W03 four spheres per earring (accepted hero), spec was three"]},
    "items": ITEMS}, open(HERE / "catalog.json", "w"), indent=1, ensure_ascii=False)
for i in ITEMS:
    y14 = [x["price_cents"] // 100 for x in i["variants"] if x["properties"]["Karat"] == "14K"
           and x["properties"]["Metal Color"] in ("Yellow Gold", "Yellow/White Gold")]
    print(i["id"], len(i["variants"]), "14K yellow", (min(y14), max(y14)), "title", len(i["title"]))
