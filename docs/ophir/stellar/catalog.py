"""The Stellar Line (Ophir Gold USA): catalog for the 5 listings — copy, variants, grams, prices.

Run: python3 docs/ophir/stellar/catalog.py  -> catalog.json
Direction: 01-design-direction.md. Owner 2026-10-15: "tahmini olarak kur" — build it on ESTIMATES
rather than wait for the maker's quote. Every estimated input is named in pricingBasis.estimated
and repeated in the panel blockers, so the quote replaces ONE number when it arrives
(second-brain 2026-09-14: the independent model is the tool that READS the quote).

Pricing: 2 x maker cost (../../artifact-studio/maker_cost.py — same maker, same terms as the
Artifact Studio catalogs: 14K 100 USD/g with labour, 10K/18K by purity and density).
The maker table has NO diamond line, so the stone cost here is the single biggest guess.
"""
import json, math, pathlib, re, sys, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "docs/artifact-studio"))
import maker_cost as mk  # noqa: E402

ORG = "b7658ac4-7fb4-4fcb-836f-401efc3d9e5b"      # Ophir Gold USA
NS = uuid.UUID("7c1f9a52-6d84-4b31-9e05-3a6c8d2f41b7")
RHO14 = 13.499                                     # g/cm3, derived from the maker's own gram table

# ---------------------------------------------------------------- estimated inputs (UNCALIBRATED)
STONE_USD = 5.00        # one round brilliant melee, stone + bead setting. THE key guess.
SAFETY = 1.15           # grams safety factor: the maker counted 3 g where geometry said 0.8 g
                        # (second-brain 2026-10-07), so geometric estimates run LOW. Erring heavy
                        # protects the margin; erring light sells at a loss.
ETSY_FEE = 0.15         # pessimistic, as on the Ophir price floor (EON measures 11.2%)

KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]
RING_SIZES = [4 + 0.5 * i for i in range(17)]      # US 4 .. 12 in half steps
CHAIN_IN = [16, 18, 20]


def mm3_to_g14(mm3):
    return mm3 / 1000.0 * RHO14


def rod(length_mm, dia_mm):
    return math.pi * (dia_mm / 2) ** 2 * length_mm


def cone(length_mm, base_dia_mm):
    return math.pi * (base_dia_mm / 2) ** 2 * length_mm / 3


def inner_circumference(us_size):
    """ANSI: inner circumference in mm for a US ring size."""
    return 36.5 + 2.55 * us_size


def num(x):
    return str(int(x)) if x == int(x) else str(x)


# ---------------------------------------------------------------- per-product gram and stone models
def earring_g14(_size=None):
    """Pair. Tapered 55 mm curve + slim 45 mm pave curve + knot + post and back, per ear."""
    per_ear = cone(55, 2.6) + rod(45, 1.2) + 15 + 12
    return mm3_to_g14(per_ear) * 2 * SAFETY


def necklace_g14(_size=None):
    """Centre bar and loop + two stars + teardrop. The CHAIN is a separate maker line, not grams."""
    return mm3_to_g14(rod(110, 1.6) + 12 + 20 + 35) * SAFETY


def band_ring_g14(size):
    """Maker's own flat-band table at 1.8 mm wide, plus the raised four-point star head."""
    return mk.list_g14(1.8, size) + mm3_to_g14(25)


def knot_ring_g14(size):
    """Two 1.6 mm bands, each a full circle; the open crossing neither adds nor removes much."""
    return mk.list_g14(1.6, size) * 2 * 1.10


def signet_g14(size):
    """Owner's averaging rule (gram_model, 2026-09-16): no single width, so (top + shank) / 2,
    and the face stands proud, so (band thickness + face height) / 2."""
    eff_w = (16.0 + 2.5) / 2
    eff_t = (1.5 + 2.5) / 2
    return mk.list_g14(eff_w, size, eff_t)


def earring_stones(_size=None):
    return 2 * (round(45 / 1.2) + 8)                      # pave curve + knot, both ears


def band_ring_stones(size):
    return 1 + round(inner_circumference(size) * 0.45 / 1.3)   # star centre + part-way down one shank


def knot_ring_stones(size):
    return round(inner_circumference(size) * 2 / 1.4)          # both bands, full length


# ---------------------------------------------------------------- the five products
P = [
    dict(
        key="E01", kind="earrings", protocol="dangle_earrings", product_type="earrings",
        name="Stellar Curve Earrings",
        title=("Stellar Curve Earrings, Solid Gold Long Drop with a Pave Diamond Knot, "
               "Modern Sculptural Ear Jacket, Gift for Her"),
        dims="55 mm drop, 9 mm across the knot",
        axes=["Karat", "Metal Color"], sizes=[None],
        g14=earring_g14, stones=earring_stones, extra=lambda k, s: 0.0,
        lead="One long gold curve and a slimmer pave curve crossing it, tied in a small diamond knot.",
        story=("The thick curve is drawn out to a fine point and sweeps down along the jaw, so the pair "
               "reads as one clean line from the front and a sculpture from the side. The second curve is "
               "set with a single row of small white diamonds and crosses the first where the two tie."),
        spec=["Size: each earring is about 55 mm long and 9 mm across the knot.",
              "Fitting: post and butterfly back, both in the same solid gold."],
        tags=["gold drop earrings", "diamond earrings", "pave earrings", "solid gold earrings",
              "modern earrings", "statement earrings", "sculptural jewelry", "long drop earrings",
              "14k gold earrings", "gift for her", "minimalist earrings", "curved earrings",
              "star jewelry"],
    ),
    dict(
        key="N01", kind="necklace", protocol="pendant_necklace", product_type="necklace",
        name="Stellar Drop Necklace",
        title=("Stellar Drop Necklace, Solid Gold Lariat with a Four Point Star and Teardrop, "
               "Layering Chain, Gift for Her"),
        dims="60 mm centre bar, 45 mm drop",
        axes=["Karat", "Metal Color", "Chain Length"], sizes=CHAIN_IN,
        g14=necklace_g14, stones=lambda s=None: 0,
        extra=lambda k, s: mk.CHAIN_NECKLACE_18IN * (s / 18) * mk.karat_ratio(k),
        lead="A gold line that crosses the collarbone, turns back on itself and drops a star below.",
        story=("The chain gives way to one smooth gold bar that sweeps across and loops, with a four point "
               "star sitting where the loop closes. From the bottom of the loop a short length of the same "
               "chain carries a second, larger star and ends in a small polished teardrop."),
        spec=["Size: the centre bar spans about 60 mm and the drop falls about 45 mm below it.",
              "Chain: 1.0 mm solid gold cable chain in the same gold, spring ring clasp."],
        tags=["gold lariat necklace", "star necklace", "solid gold necklace", "layering necklace",
              "celestial jewelry", "drop necklace", "y necklace", "14k gold necklace",
              "dainty necklace", "gift for her", "modern necklace", "teardrop necklace",
              "star pendant"],
    ),
    dict(
        key="R01", kind="ring", protocol="stacking_ring", product_type="ring",
        name="Stellar Band Ring",
        title=("Stellar Band Ring, Solid Gold Wave with a Diamond Star and Pave Shank, "
               "Stacking Ring, Gift for Her"),
        dims="1.8 mm band, 6 mm star",
        axes=["Karat", "Metal Color", "Ring Size"], sizes=RING_SIZES,
        g14=band_ring_g14, stones=band_ring_stones, extra=lambda k, s: 0.0,
        lead="A slim gold band that rises in one wave, with a diamond set star at the crest.",
        story=("The band does not sit flat: it lifts over the top of the finger and a four point star is set "
               "at the high point, holding one small white diamond. A single row of diamonds runs down one "
               "side of the shank from the star, so the sparkle follows the curve instead of ringing the "
               "whole band. It stacks flush against a plain band."),
        spec=["Size: the band is 1.8 mm wide and the star about 6 mm across.",
              "Stones: one round brilliant white diamond in the star, with a bead set row down one shank."],
        tags=["gold stacking ring", "diamond star ring", "pave ring", "solid gold ring",
              "celestial ring", "dainty ring", "14k gold ring", "star ring", "stackable ring",
              "gift for her", "minimalist ring", "wave ring", "thin gold ring"],
    ),
    dict(
        key="R02", kind="ring", protocol="sculptural_ring", product_type="ring",
        name="Stellar Knot Ring",
        title=("Stellar Knot Ring, Solid Gold Crossover with Two Pave Diamond Bands, "
               "Open Knot Statement Ring, Gift for Her"),
        dims="11 mm knot, two 1.6 mm bands",
        axes=["Karat", "Metal Color", "Ring Size"], sizes=RING_SIZES,
        g14=knot_ring_g14, stones=knot_ring_stones, extra=lambda k, s: 0.0,
        lead="Two slim diamond bands crossing over the finger in one open knot.",
        story=("Each band sweeps round and passes over and under the other, so the knot stays open and you "
               "can see through it. Both are bead set along their whole length with small white diamonds, "
               "and the two join into a single shank under the finger, which keeps it comfortable to wear "
               "every day."),
        spec=["Size: the knot stands about 11 mm across the top, each band 1.6 mm wide.",
              "Stones: round brilliant white diamonds bead set along both bands."],
        tags=["diamond knot ring", "crossover ring", "pave diamond ring", "solid gold ring",
              "statement ring", "two band ring", "14k gold ring", "infinity ring",
              "gift for her", "modern ring", "x ring", "gold diamond ring", "celestial ring"],
    ),
    dict(
        key="R03", kind="ring", protocol="sculptural_ring", product_type="ring",
        name="Stellar Signet Ring",
        title=("Stellar Signet Ring, Bold Solid Gold Sculptural Face with a Diamond Star, "
               "Wide Statement Signet, Gift for Her"),
        dims="16 mm face, 2.5 mm shank",
        axes=["Karat", "Metal Color", "Ring Size"], sizes=RING_SIZES,
        g14=signet_g14, stones=lambda s=None: 1, extra=lambda k, s: 0.0,
        lead="A bold signet whose face is a sweep of polished gold with one diamond star cut into it.",
        story=("The face is not a flat plate. It curves and folds, rising out of a shank that narrows and "
               "widens again, so the whole ring reads as one poured form. A four point star is set into the "
               "sweep and holds a single white diamond. It is solid gold throughout, with no hollow back."),
        spec=["Size: the face is about 16 mm across and the shank narrows to 2.5 mm.",
              "Stones: one round brilliant white diamond set in the star."],
        tags=["gold signet ring", "bold statement ring", "sculptural ring", "solid gold ring",
              "wide signet ring", "diamond signet", "14k gold ring", "chunky gold ring",
              "star ring", "gift for her", "molten gold ring", "modern signet", "celestial ring"],
    ),
]

SHIP = ("Each piece is made to order and ships free within the United States. "
        "Add a gift message at checkout and it ships with the piece.")
CARE = ("Care: solid gold does not tarnish. Take it off before the gym, the pool and the shower, and wipe "
        "it with a soft cloth.")
METAL = ("Metal: solid 10K, 14K or 18K gold in yellow, white or rose. "
         "White gold is unplated, a soft silvery grey.")
IMAGES = ("The product images are design visualizations of the finished piece, and the three metal image is "
          "a colour visualization of the same design in yellow, white and rose gold; the handmade piece may "
          "vary slightly.")
BAN = ["lab grown", "moissanite", "cubic", "cz", "gold plated", "plated brass", "plated silver",
       "vermeil", "heal", "chakra", "protect", "luck", "engrav", "personaliz", "initial",
       "monogram", "—", "–", "â"]


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


EXPECT_GROUP = {"earrings": "earrings", "necklace": "necklace", "ring": "ring"}
items, report = [], []
for p in P:
    variants = []
    for k in KARATS:
        for cc, cn in COLORS:
            for s in p["sizes"]:
                g14 = p["g14"](s)
                n_stone = p["stones"](s)
                cost = mk.gold_cost(g14, k) + n_stone * STONE_USD + p["extra"](k, s)
                props = {"Karat": k, "Metal Color": cn}
                if p["kind"] == "ring":
                    props["Ring Size"] = f"US {num(s)}"
                    tail = f"-US{num(s).replace('.', '_')}"
                elif p["kind"] == "necklace":
                    props["Chain Length"] = f"{s} inches"
                    tail = f"-{s}IN"
                else:
                    tail = ""
                variants.append({
                    "sku": f"OPH-STL-{p['key']}-{k}{cc}{tail}",
                    "properties": props,
                    "price_cents": mk.price_cents(cost),
                    "grams": round(g14 * mk.DENSITY[k], 2),
                    "stones": n_stone,
                    "makerCostUsd": round(cost, 2),
                })

    n_exp = len(KARATS) * len(COLORS) * len(p["sizes"])
    assert len(variants) == n_exp and len({v["sku"] for v in variants}) == n_exp, p["key"]
    assert all(len(v["sku"]) <= 32 for v in variants), p["key"]
    assert n_exp <= 400, (p["key"], n_exp)                      # Etsy ceiling for 3 axes
    assert all(v["price_cents"] % 1000 == 0 for v in variants)
    # No variant may lose money at FULL price after a pessimistic Etsy fee.
    for v in variants:
        assert v["price_cents"] / 100 * (1 - ETSY_FEE) > v["makerCostUsd"], (p["key"], v["sku"])
    t = p["title"]
    assert len(t) <= 140, (p["key"], len(t))
    assert derive_group(t) == EXPECT_GROUP[p["kind"]], (p["key"], derive_group(t))
    assert len(p["tags"]) == 13 and len(set(p["tags"])) == 13, p["key"]
    for tag in p["tags"]:
        assert len(tag) <= 20 and re.fullmatch(r"[a-z0-9 ]+", tag), (p["key"], tag)
    desc = "\n\n".join([p["lead"], p["story"], "\n".join([METAL] + p["spec"]), SHIP, CARE, IMAGES])
    for where, text in [("title", t), ("desc", desc), ("tags", " ".join(p["tags"]))]:
        for b in BAN:
            assert b not in text.lower(), (p["key"], where, b)
    assert f'"{p["protocol"]}"' in (ROOT / "lib/etsy/listing-protocol.ts").read_text(encoding="utf-8")

    ref = next(v for v in variants if v["properties"]["Karat"] == "14K"
               and v["properties"]["Metal Color"] == "Yellow Gold"
               and (p["kind"] != "ring" or v["properties"]["Ring Size"] == "US 7")
               and (p["kind"] != "necklace" or v["properties"]["Chain Length"] == "18 inches"))
    items.append({
        "id": p["key"], "productId": str(uuid.uuid5(NS, f"OPH-STL-{p['key']}")),
        "sku": f"OPH-STL-{p['key']}", "productType": p["product_type"],
        "listingProtocol": p["protocol"], "name": p["name"], "title": t, "tags": p["tags"],
        "description": desc, "dims": p["dims"], "variationAxes": p["axes"], "variants": variants,
        "grams14Ref": round(p["g14"](None if p["kind"] != "ring" else 7), 2),
        "stonesRef": ref["stones"], "refPriceCents": ref["price_cents"],
        "makerCost14KRefUsd": ref["makerCostUsd"],
    })
    report.append((p["key"], p["name"], len(variants), items[-1]["grams14Ref"], ref["stones"],
                   ref["makerCostUsd"], ref["price_cents"] // 100))

json.dump({"org": ORG, "source": "ophir-stellar-v1", "pricingBasis": {
    "spotUsdOzt": mk.SPOT_USD_OZT, "rule": "price = ceil(2 x maker cost / 10) x 10",
    "makerCost": ("14K 100 USD/g with labour (maker band list); 10K/18K by purity and density; "
                  "necklace chain 130 USD at 18 in scaled by length and karat"),
    "estimated": [f"stone {STONE_USD:.2f} USD each, set (UNCALIBRATED_ASSUMPTION: the maker table has no diamond line)",
                  f"grams from geometry x {SAFETY} safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed)",
                  "signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section"]},
    "items": items}, open(HERE / "catalog.json", "w"), indent=1, ensure_ascii=False)

print(f"{sum(len(i['variants']) for i in items)} variants across {len(items)} listings\n")
print(f"{'id':4} {'name':24} {'var':>4} {'g14':>6} {'stn':>4} {'cost$':>8} {'list$':>7}")
for r in report:
    print(f"{r[0]:4} {r[1]:24} {r[2]:4} {r[3]:6.2f} {r[4]:4} {r[5]:8.2f} {r[6]:7}")
print("\nstone price sensitivity on the 14K US 7 reference (list price):")
for alt in (3.0, 5.0, 8.0):
    row = []
    for p, it in zip(P, items):
        base = it["makerCost14KRefUsd"] - it["stonesRef"] * STONE_USD
        row.append(f"{p['key']} ${mk.price_cents(base + it['stonesRef'] * alt) // 100}")
    print(f"  ${alt:.2f}/stone -> " + "  ".join(row))
