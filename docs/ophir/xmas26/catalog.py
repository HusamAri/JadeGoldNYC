"""Ophir Gold USA — Christmas 2026 ring line: 20 listings, copy, variants, grams, prices.

Run: python3 docs/ophir/xmas26/catalog.py  -> catalog.json
Direction: 01-design-direction.md. Owner 2026-10-16: 20 Christmas ring designs for Ophir, built
as listings. The maker has NOT quoted any of these, so every estimated input is named in
pricingBasis.estimated and repeated as a panel blocker: the quote then replaces ONE number
(second-brain 2026-09-14 — the independent model is the tool that READS the quote).

Pricing: the SAME engine as the Ophir Stellar line, imported rather than re-derived
(../../artifact-studio/maker_cost.py: 14K 100 USD/g with labour, 10K/18K by purity and density,
price = ceil(2 x maker cost / 10) x 10).

Motifs are checked against by Artifact Studio's xmas26 rings, which already hold the ten obvious
Christmas motifs, and against Ophir's own Stellar line, which already sells a four-point star.
Both checks are asserted at the bottom of this file, not just promised in the direction doc.
"""
import json, math, pathlib, re, sys, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / "docs/artifact-studio"))
import maker_cost as mk  # noqa: E402

ORG = "b7658ac4-7fb4-4fcb-836f-401efc3d9e5b"      # Ophir Gold USA
NS = uuid.UUID("7c1f9a52-6d84-4b31-9e05-3a6c8d2f41b7")
RHO14 = 13.499

# ---------------------------------------------------------------- estimated inputs (UNCALIBRATED)
ACCENT_USD = 5.00       # one small round brilliant white diamond, stone + bead setting
CENTRE_USD = 15.00      # one 4 mm coloured centre stone, rub-over bezel set
SAFETY = 1.15           # geometry runs LIGHT: the maker counted 3 g where geometry said 0.8 g
ETSY_FEE = 0.15         # pessimistic, as on the Ophir price floor

KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]
RING_SIZES = [4 + 0.5 * i for i in range(17)]     # US 4 .. 12 in half steps -> 153 variants


def mm3_to_g14(mm3):
    return mm3 / 1000.0 * RHO14


def num(x):
    return str(int(x)) if x == int(x) else str(x)


# ------------------------------------------------- gram archetypes
# mk.list_g14 is the MAKER'S OWN band table, so it carries no safety factor. Only the motif
# volume on top of it is geometry, so only that is multiplied by SAFETY.
def band(w, t=1.5, motif_mm3=0.0):
    return lambda size: mk.list_g14(w, size, t) + mm3_to_g14(motif_mm3) * SAFETY


def signet(top_w, top_h, shank_w=2.2, shank_t=1.5):
    """Owner's averaging rule (gram_model 2026-09-16): no single width, so (top + shank) / 2."""
    return lambda size: mk.list_g14((top_w + shank_w) / 2, size, (top_h + shank_t) / 2)


def dome(dia, height, shank_w=2.0, shank_t=1.5):
    return lambda size: mk.list_g14((dia + shank_w) / 2, size, (height + shank_t) / 2)


def fixed(n):
    return lambda size: n


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

# motifs already sold by by Artifact Studio's Christmas line, and by Ophir's own Stellar line
TAKEN = ["holly", "candy cane", "gingerbread", "bauble", "snowflake", "christmas tree",
         "mistletoe", "stocking", "poinsettia", "four point star"]

# title tail: "<gift phrase> for Her"; stacking is claimed only by the stacking group

# ---------------------------------------------------------------- the twenty rings
BUILD = {'R01': 'The band widens into a flat ribbon at the top, crosses itself once and pulls through, so two loops stand slightly proud and two tails run back down the shank.',
    'R02': 'The band doubles, folds and passes under itself at the top, so the knot sits as one rounded mass with a deep shadow where it tucks.',
    'R03': 'The band is flat and even the whole way round, then lifts into a single standing curl at the top of the finger and settles again.',
    'R04': 'The face is a clean polished oval with a single fir sprig cut down into it, and the shoulders swell smoothly into the face.',
    'R05': 'The face is a soft cornered square carrying an interlaced knot that runs over and under itself, cut deep enough to hold a shadow.',
    'R06': 'The top is a small solid mound of gold with no flat plate anywhere: it rises high on one side and slopes smoothly down into the band on the other, scaled small for the little finger.',
    'R07': 'The dome is full and round and its whole surface is broken into a close fine frost texture.',
    'R08': 'The dome is tall, smooth and mirror polished, with nothing on its surface at all.',
    'R09': 'The dome rises out of the band itself, the band widening into it, and is built from overlapping pinecone scales, each one cut and lifted so its edge stands away from the body.',
    'R10': 'Five small solid gold spheres sit close together over the top of the finger and the rest of the thin band stays plain.',
    'R11': 'Seven small stones are bezel set at even intervals across the top half of a thin band, each in its own small collar of gold, with plain gold between them and the back half of the band plain.',
    'R12': 'Two fine wires are twisted together evenly the whole way round, with a groove of shadow running between them.',
    'R13': 'One round stone sits low in a smooth rub over bezel with no claws, on an otherwise plain band.',
    'R14': 'One round stone sits low in a smooth rub over bezel with no claws, on an otherwise plain band.',
    'R15': 'The band splits before the top and the two ends pass each other, each carrying one bezel set stone, so the two stones sit shoulder to shoulder rather than in a row.',
    'R16': 'The petals are cut separately and folded in towards the middle, tight at the heart and opening at the edge, with one small stone set in a tiny bezel at the centre.',
    'R17': 'Five tapering points of different lengths rise from the top of the band in the plane of the ring, standing close together and each ending in a fine tip, with the rest of the band plain.',
    'R18': 'A fir sprig lies along the curve of the band, needles raised away from the gold on both sides of a central stem.',
    'R19': 'Each end of the band grows into a forked antler and the two pass each other without touching, leaving a visible gap.',
    'R20': 'Overlapping leaves run the whole way round with no plain section at the back, each one lapping the last in the same direction and all of them staying inside the 2.4 mm width of the band.'}


def R(key, name, short, proto, g14, stones, dims, lead, story, spec, tags):
    """build = what a camera can see, used by BOTH the description and the image prompt.
    story = the sales voice, used by the description only: metaphor in a prompt makes the model
    draw the metaphor (2026-10-16: "like a glass globe" would have produced a snow globe)."""
    return dict(key=key, name=name, short=short, protocol=proto, g14=g14, stones=stones,
                dims=dims, lead=lead, build=BUILD[key], story=story, spec=spec, tags=tags)


P = [
    # ---- bow and ribbon (2026 motif trend)
    R("R01", "Ribbon Bow Ring", "Tied Bow", "sculptural_ring", band(2.0, 1.4, 70), fixed(0),
      "9 mm bow, 2 mm band",
      "A flat gold ribbon tied in a small bow across the top of the finger.",
      "The band widens into a ribbon as it reaches the top, crosses itself once and pulls through, so "
      "the two loops stand slightly proud and the two tails run back down the shank. The gold is "
      "polished all over, which is what makes it read as ribbon rather than as metal.",
      ["Size: the bow is about 9 mm across and the band is 2 mm wide."],
      ["christmas ring", "bow ring", "gold bow ring", "holiday ring", "gift for her",
       "solid gold ring", "14k gold ring", "ribbon ring", "statement ring", "festive jewelry",
       "winter jewelry", "coquette jewelry", "xmas gift for her"]),
    R("R02", "Velvet Knot Ring", "Soft Knot", "sculptural_ring", band(2.4, 1.5, 120), fixed(0),
      "11 mm knot, 2.4 mm band",
      "A wide soft knot, the ribbon doubled over and pulled through itself.",
      "Where a bow has loops this has volume: the band doubles, folds and passes under, so the knot "
      "sits as one rounded mass with a deep shadow where it tucks. It is the heaviest of the three "
      "ribbon designs and the one that reads from across a room.",
      ["Size: the knot stands about 11 mm across the top, the band is 2.4 mm wide."],
      ["christmas ring", "knot ring", "gold knot ring", "chunky gold ring", "statement ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "bold ring",
       "winter jewelry", "festive jewelry", "sculptural ring"]),
    R("R03", "Ribbon Wave Ring", "Standing Wave", "sculptural_ring", band(2.6, 1.3, 40), fixed(0),
      "2.6 mm band, 6 mm rise",
      "A flat band folded into one standing wave, like ribbon caught mid curl.",
      "The band stays flat and even the whole way round, then lifts into a single curl at the top "
      "of the finger and settles again. Nothing is added to it: the whole design is one piece of gold "
      "persuaded into a curve.",
      ["Size: the band is 2.6 mm wide and the wave rises about 6 mm."],
      ["christmas ring", "wave ring", "ribbon ring", "modern ring", "holiday ring",
       "gift for her", "solid gold ring", "14k gold ring", "minimalist ring", "curved ring",
       "winter jewelry", "festive jewelry", "sculptural ring"]),

    # ---- signets (strong 2026 trend)
    R("R04", "Fir Crest Signet Ring", "Fir Crest", "sculptural_ring", signet(10.5, 1.9), fixed(0),
      "10.5 mm oval face",
      "An oval signet with a single fir sprig cut into the face.",
      "The face is a clean polished oval and the sprig is cut into it rather than raised on it, so "
      "the ring keeps a flat silhouette and the needles catch light only when the hand turns. The "
      "shoulders swell into the face so there is no join to feel.",
      ["Size: the face is about 10.5 mm across and the shank narrows to 2.2 mm."],
      ["christmas ring", "gold signet ring", "signet ring", "holiday ring", "gift for her",
       "solid gold ring", "14k gold ring", "fir ring", "nature ring", "winter jewelry",
       "festive jewelry", "classic signet", "evergreen ring"]),
    R("R05", "Nordic Knot Signet Ring", "Nordic Knot", "sculptural_ring", signet(10.0, 2.0, 2.4), fixed(0),
      "10 mm square face",
      "A squared signet carrying an interlaced Scandinavian knot.",
      "The face is a soft cornered square and the knot runs over and under itself across it, cut "
      "deep enough to hold a shadow. It is the quietest Christmas reference in the line and the one "
      "that stays on the hand in January.",
      ["Size: the face is about 10 mm across and the shank narrows to 2.4 mm."],
      ["christmas ring", "gold signet ring", "signet ring", "nordic jewelry", "knot ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "knot signet ring",
       "winter jewelry", "festive jewelry", "unisex ring"]),
    R("R06", "Snowdrift Pinky Signet", "Snowdrift", "sculptural_ring", signet(8.0, 2.0, 1.8), fixed(0),
      "8 mm face, pinky",
      "A small pinky signet whose top is a drifted, wind shaped mound instead of a flat face.",
      "Where a signet would carry a flat plate this one carries a low drift of gold, the way snow "
      "banks against a wall. Scaled for the little finger, which is where a signet is worn now.",
      ["Size: the top is about 8 mm across, cut for the little finger."],
      ["christmas ring", "pinky ring", "gold signet ring", "signet ring", "small signet",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "stackable ring",
       "winter jewelry", "festive jewelry", "snow ring"]),

    # ---- domes (chunky gold trend)
    R("R07", "Frost Dome Ring", "Frosted Dome", "sculptural_ring", dome(9.0, 3.4), fixed(0),
      "9 mm dome, 3.4 mm high",
      "A high gold dome worked all over with a fine frosted texture.",
      "The dome is full and round and the whole surface is broken into a close frost, so it holds "
      "a soft light instead of a hard highlight. Against a polished stacking band the contrast is "
      "the point.",
      ["Size: the dome is about 9 mm across and stands 3.4 mm above the finger."],
      ["christmas ring", "dome ring", "chunky gold ring", "statement ring", "holiday ring",
       "gift for her", "solid gold ring", "14k gold ring", "textured ring", "bold ring",
       "winter jewelry", "festive jewelry", "frosted ring"]),
    R("R08", "Snow Globe Dome Ring", "Smooth Dome", "sculptural_ring", dome(9.5, 3.8), fixed(0),
      "9.5 mm dome, 3.8 mm high",
      "A tall smooth polished dome with nothing on it at all.",
      "The largest and plainest piece in the line: one clean curve of gold, mirror polished, "
      "catching the room the way a glass globe does. Everything it has is in the shape.",
      ["Size: the dome is about 9.5 mm across and stands 3.8 mm above the finger."],
      ["christmas ring", "dome ring", "chunky gold ring", "polished gold ring", "statement ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "bold ring",
       "winter jewelry", "festive jewelry", "minimalist ring"]),
    R("R09", "Pinecone Dome Ring", "Pinecone", "sculptural_ring", dome(9.0, 3.6), fixed(0),
      "9 mm dome, 3.6 mm high",
      "A dome built from overlapping pinecone scales.",
      "Each scale is cut and lifted separately so they tile around the dome and the edges stand "
      "away from the body. It is the most worked surface in the line and the one that reads as "
      "winter without naming Christmas.",
      ["Size: the dome is about 9 mm across and stands 3.6 mm above the finger."],
      ["christmas ring", "pinecone ring", "dome ring", "nature ring", "textured ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "chunky gold ring",
       "winter jewelry", "festive jewelry", "woodland ring"]),

    # ---- stacking (strong 2026 trend, and the sizing-risk answer)
    R("R10", "Winterberry Stack Ring", "Berry Band", "stacking_ring", band(1.5, 1.4, 72), fixed(0),
      "1.5 mm band, 3 mm berries",
      "A thin band carrying a short run of round gold berries.",
      "Five small spheres sit close together over the top of the finger and the rest of the band "
      "stays plain, so it stacks against a plain band. The berries are solid gold, not set "
      "stones, which is what keeps it wearable every day.",
      ["Size: the band is 1.5 mm wide and each berry is about 3 mm."],
      ["christmas ring", "stacking ring", "berry ring", "dainty ring", "thin gold ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "stackable ring",
       "winter jewelry", "festive jewelry", "delicate ring"]),
    R("R11", "Fairy Light Stack Ring", "String Lights", "stacking_ring", band(1.6, 1.4, 12),
      lambda size: 7,
      "1.6 mm band, 7 stones",
      "A thin band with small stones spaced along it like a string of lights.",
      "Seven white diamonds are bezel set at even intervals, each one sitting in its own small "
      "collar of gold so the line reads as lights on a wire rather than as pave. The gaps are as "
      "much of the design as the stones.",
      ["Size: the band is 1.6 mm wide and carries seven stones.",
       "Stones: seven small round brilliant white diamonds, bezel set."],
      ["christmas ring", "stacking ring", "diamond ring", "dainty ring", "bezel ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "stackable ring",
       "winter jewelry", "festive jewelry", "delicate ring"]),
    R("R12", "Garland Twist Ring", "Twisted Rope", "stacking_ring", band(1.8, 1.8), fixed(0),
      "1.8 mm twisted band",
      "Two fine wires twisted together the whole way round, like a garland.",
      "The twist is even from end to end with no join to find, and the grooves between the wires "
      "hold a darker line of shadow that makes the gold look deeper than it is. It is the oldest "
      "idea in the line and the easiest to wear.",
      ["Size: the twisted band is 1.8 mm wide."],
      ["christmas ring", "twist ring", "rope ring", "stacking ring", "gold band ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "stackable ring",
       "winter jewelry", "festive jewelry", "braided ring"]),

    # ---- coloured stones (the season's red / green / gold colour story)
    R("R13", "Cranberry Bezel Ring", "Red Bezel", "sculptural_ring", band(2.0, 1.5, 20),
      lambda size: (0, 1),
      "4 mm stone, 2 mm band",
      "One deep red garnet held in a rub over bezel on a plain gold band.",
      "The bezel is a smooth collar of gold with no claws, so nothing catches and the stone sits "
      "low and dark against the metal. Red on gold is the oldest Christmas pairing there is, and "
      "this is the quiet version of it.",
      ["Size: the stone is about 4 mm and the band is 2 mm wide.",
       "Stone: one round deep red garnet, rub over bezel set."],
      ["christmas ring", "garnet ring", "red stone ring", "bezel ring", "holiday ring",
       "gift for her", "solid gold ring", "14k gold ring", "deep red ring", "red garnet ring",
       "winter jewelry", "festive jewelry", "delicate ring"]),
    R("R14", "Evergreen Bezel Ring", "Green Bezel", "sculptural_ring", band(2.0, 1.5, 20),
      lambda size: (0, 1),
      "4 mm stone, 2 mm band",
      "One deep green tourmaline held in a rub over bezel on a plain gold band.",
      "The twin of the cranberry ring and made to be worn with it. The green reads almost black "
      "until light passes through it, which is exactly how a tree looks across a room.",
      ["Size: the stone is about 4 mm and the band is 2 mm wide.",
       "Stone: one round deep green tourmaline, rub over bezel set."],
      ["christmas ring", "green stone ring", "tourmaline ring", "bezel ring", "holiday ring",
       "gift for her", "solid gold ring", "14k gold ring", "forest green ring", "dark green ring",
       "winter jewelry", "festive jewelry", "delicate ring"]),
    R("R15", "Toi et Moi Winter Ring", "Two Stone", "sculptural_ring", band(1.9, 1.5, 30),
      lambda size: (0, 2),
      "two 4 mm stones",
      "A red stone and a green stone side by side on a bypass shank.",
      "The band splits before the top and the two ends pass each other, each carrying one bezel "
      "set stone, so the garnet and the tourmaline sit shoulder to shoulder rather than in a row. "
      "Two stones, two people, which is the whole idea of the setting.",
      ["Size: each stone is about 4 mm on a 1.9 mm bypass band.",
       "Stones: one deep red garnet and one deep green tourmaline, both bezel set."],
      ["christmas ring", "toi et moi ring", "two stone ring", "bypass ring", "garnet ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "bezel ring",
       "winter jewelry", "festive jewelry", "green stone ring"]),
    R("R16", "Winter Rose Ring", "Rose Head", "sculptural_ring", band(2.0, 1.5, 130),
      lambda size: (1, 0),
      "10 mm rose head",
      "A single sculpted rose head with one small white diamond at its centre.",
      "The petals are cut separately and folded in towards the middle, tight at the heart and "
      "opening at the edge, with one stone where the bud has not yet opened. A winter rose rather "
      "than a summer one: heavy, closed and gold.",
      ["Size: the rose head is about 10 mm across on a 2 mm band.",
       "Stone: one small round brilliant white diamond at the centre."],
      ["christmas ring", "rose ring", "flower ring", "floral ring", "statement ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "diamond ring",
       "winter jewelry", "festive jewelry", "sculptural ring"]),

    # ---- winter nature
    R("R17", "Icicle Point Ring", "Icicles", "sculptural_ring", band(2.2, 1.4, 55), fixed(0),
      "2.2 mm band, 8 mm points",
      "Tapering icicle points rising from the top of the band.",
      "Icicles turned the right way up for a hand: the points stand off the top of the finger, so "
      "the ring has a plain line below and a broken, frozen one above. They are solid gold, rounded "
      "at the base so nothing catches, and fine only at the very tip.",
      ["Size: the band is 2.2 mm wide and the tallest point rises about 8 mm."],
      ["christmas ring", "icicle ring", "winter jewelry", "statement ring", "holiday ring",
       "gift for her", "solid gold ring", "14k gold ring", "drop ring", "unusual ring",
       "festive jewelry", "snow ring", "sculptural ring"]),
    R("R18", "Fir Sprig Ring", "Fir Sprig", "sculptural_ring", band(2.0, 1.4, 45), fixed(0),
      "2 mm band, 14 mm sprig",
      "A fir sprig laid along the band with every needle raised.",
      "The sprig follows the curve of the finger rather than sitting across it, so the ring stays "
      "low and the needles stand away from the gold on both sides of a central stem. It reads as "
      "a branch, not as a tree.",
      ["Size: the sprig runs about 14 mm along a 2 mm band."],
      ["christmas ring", "fir ring", "evergreen ring", "nature ring", "leaf ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "botanical ring",
       "winter jewelry", "festive jewelry", "woodland ring"]),
    R("R19", "Reindeer Antler Ring", "Antlers", "sculptural_ring", band(2.0, 1.4, 60), fixed(0),
      "2 mm band, 12 mm antlers",
      "Two antler forks crossing in a bypass over the finger.",
      "Each end of the band grows into a forked antler and the two pass without touching, leaving "
      "a gap you can see through. The forks are rounded rather than sharp so they sit against the "
      "next finger comfortably.",
      ["Size: the antlers span about 12 mm across a 2 mm bypass band."],
      ["christmas ring", "antler ring", "reindeer ring", "bypass ring", "nature ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "woodland ring",
       "winter jewelry", "festive jewelry", "unusual ring"]),
    R("R20", "Wreath Ring", "Full Wreath", "sculptural_ring", band(2.4, 1.4, 95), fixed(0),
      "full circle of leaves",
      "A full circle of overlapping gold leaves, a wreath sized for the finger.",
      "The leaves run the whole way round with no plain section at the back, each one overlapping "
      "the last in the same direction so the ring turns like a wreath hung on a door. It is the "
      "only piece in the line with no beginning and no end.",
      ["Size: the leaf band is about 2.4 mm wide the whole way round."],
      ["christmas ring", "wreath ring", "leaf ring", "nature ring", "eternity ring",
       "holiday ring", "gift for her", "solid gold ring", "14k gold ring", "botanical ring",
       "winter jewelry", "festive jewelry", "garland ring"]),
]


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


def norm_stones(raw):
    """stones() may return an int (accents) or (accents, centres)."""
    return (raw, 0) if isinstance(raw, int) else raw


PROTO_SRC = (ROOT / "lib/etsy/listing-protocol.ts").read_text(encoding="utf-8")
items, report = [], []

for p in P:
    # "Stacking" is claimed only where the name already says Stack (R10, R11); R12 claims it in tags
    title = f"{p['name']}, Solid Gold {p['short']} Christmas Ring, Holiday Gift for Her"
    if len(title.split()) >= 15:          # Toi et Moi: three-word name, drop the audience tail
        title = f"{p['name']}, Solid Gold {p['short']} Christmas Ring, Holiday Gift"
    variants = []
    for k in KARATS:
        for code, label in COLORS:
            for size in RING_SIZES:
                g14 = p["g14"](size)
                acc, ctr = norm_stones(p["stones"](size))
                cost = mk.gold_cost(g14, k) + acc * ACCENT_USD + ctr * CENTRE_USD
                variants.append({
                    "sku": f"OPH-XMS-{p['key']}-{k}{code}-US{num(size).replace('.', '_')}",
                    "name": f"{p['name']}: {k}, {label}, US {num(size)}",
                    "properties": {"Karat": k, "Metal Color": label, "Ring Size": f"US {num(size)}"},
                    "price_cents": mk.price_cents(cost),
                    "grams": round(g14 * mk.DENSITY[k], 2),
                    "stones": acc + ctr,
                    "makerCostUsd": round(cost, 2),
                })

    n_exp = len(KARATS) * len(COLORS) * len(RING_SIZES)
    assert len(variants) == n_exp and len({v["sku"] for v in variants}) == n_exp, p["key"]
    assert all(len(v["sku"]) <= 32 for v in variants), (p["key"], max(len(v["sku"]) for v in variants))
    assert n_exp <= 400, (p["key"], n_exp)                      # Etsy ceiling for 3 axes
    assert all(v["price_cents"] % 1000 == 0 for v in variants)
    # No variant may lose money at FULL price after a pessimistic Etsy fee.
    for v in variants:
        assert v["price_cents"] / 100 * (1 - ETSY_FEE) > v["makerCostUsd"], (p["key"], v["sku"])
    assert len(title) <= 140, (p["key"], len(title))
    assert derive_group(title) == "ring", (p["key"], derive_group(title))
    assert len(title.split()) < 15, (p["key"], len(title.split()))   # lib/seo titlewords check
    assert len(p["tags"]) == 13 and len(set(p["tags"])) == 13, (p["key"], len(set(p["tags"])))
    for tag in p["tags"]:
        assert len(tag) <= 20 and re.fullmatch(r"[a-z0-9 ]+", tag), (p["key"], tag)
    desc = "\n\n".join([p["lead"], f'{p["build"]} {p["story"]}', "\n".join([METAL] + p["spec"]), SHIP, CARE, IMAGES])
    blob = " ".join([title, desc, " ".join(p["tags"])]).lower()
    for b in BAN:
        assert b not in blob, (p["key"], b)
    # motifs owned by by Artifact Studio's xmas26 rings, and Ophir's own Stellar star, stay theirs
    for t in TAKEN:
        assert t not in blob, (p["key"], "TAKEN MOTIF", t)
    assert f'"{p["protocol"]}"' in PROTO_SRC, (p["key"], p["protocol"])

    ref = next(v for v in variants if v["properties"]["Karat"] == "14K"
               and v["properties"]["Metal Color"] == "Yellow Gold"
               and v["properties"]["Ring Size"] == "US 7")
    acc7, ctr7 = norm_stones(p["stones"](7))
    items.append({
        "id": p["key"], "productId": str(uuid.uuid5(NS, f"OPH-XMS-{p['key']}")),
        "sku": f"OPH-XMS-{p['key']}", "productType": "ring", "listingProtocol": p["protocol"],
        "offersPersonalization": False,     # suppresses the protocol's engraving question
        "name": p["name"], "short": p["short"], "title": title, "tags": p["tags"], "description": desc,
        "lead": p["lead"], "buildNote": p["build"],
        "dims": p["dims"], "variationAxes": ["Karat", "Metal Color", "Ring Size"],
        "variants": variants, "grams14Ref": round(p["g14"](7), 2),
        "accentStonesRef": acc7, "centreStonesRef": ctr7,
        "refPriceCents": ref["price_cents"], "makerCost14KRefUsd": ref["makerCostUsd"],
    })
    report.append((p["key"], p["name"], items[-1]["grams14Ref"], acc7, ctr7,
                   ref["makerCostUsd"], ref["price_cents"] // 100))

# line-level invariants
for i in items:
    assert i["buildNote"] in i["description"] and i["lead"] in i["description"], i["id"]
assert len(items) == 20, len(items)
assert len({i["sku"] for i in items}) == 20
assert len({i["title"] for i in items}) == 20
assert len({i["name"] for i in items}) == 20

json.dump({"org": ORG, "source": "ophir-xmas26-v1", "pricingBasis": {
    "spotUsdOzt": mk.SPOT_USD_OZT, "rule": "price = ceil(2 x maker cost / 10) x 10",
    "makerCost": "14K 100 USD/g with labour (maker band list); 10K/18K by purity and density",
    "estimated": [
        f"accent stone {ACCENT_USD:.2f} USD each, set (UNCALIBRATED_ASSUMPTION: the maker band list has no stone line)",
        f"coloured centre stone {CENTRE_USD:.2f} USD each, bezel set (UNCALIBRATED_ASSUMPTION: never quoted)",
        f"motif grams from geometry x {SAFETY} safety factor (UNCALIBRATED_ASSUMPTION: no sample weighed); "
        "the maker's own band table carries no safety factor because it is measured, not derived",
        "dome and signet grams use the owner's (top + shank) / 2 averaging rule, not a measured section"]},
    "items": items}, open(HERE / "catalog.json", "w"), indent=1, ensure_ascii=False)

print(f"{sum(len(i['variants']) for i in items)} variants across {len(items)} listings\n")
print(f"{'id':4} {'name':26} {'g14':>6} {'acc':>4} {'ctr':>4} {'cost$':>8} {'list$':>7}")
for r in report:
    print(f"{r[0]:4} {r[1]:26} {r[2]:6.2f} {r[3]:4} {r[4]:4} {r[5]:8.2f} {r[6]:7}")
lo, hi = min(r[6] for r in report), max(r[6] for r in report)
print(f"\n14K US 7 yellow reference: ${lo} .. ${hi}")
