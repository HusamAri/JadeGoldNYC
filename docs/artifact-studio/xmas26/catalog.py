"""Artifact Studio Christmas 2026: 30 listing proposals (10 families x ring, bracelet, necklace).

Single source of truth for copy, sizes, estimated grams, prices and the reference-hero prompts.
Run: python3 docs/artifact-studio/xmas26/catalog.py
Writes catalog.json next to this file and fails loudly on any rule break.
Pricing and grid rules are the FW 26/27 enamel set's (docs/artifact-studio/fw2627-enamel/catalog.py).
"""
import json, math, os, re, sys, uuid, pathlib

HERE = pathlib.Path(__file__).parent
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("8c3d6a1e-2f47-4b0e-9d51-6e2a1c7b5f09")
SOURCE = "artifact-xmas26-v1"
PREFIX = "BAS-XM-"

# ---------------------------------------------------------------- pricing basis (FW 26/27 rule)
SPOT_USD_OZT = 4178.20          # FW basis, gold-api.com 2026-09-30; live 2026-10-06 was 4169.50 (-0.2%)
PURE_G = SPOT_USD_OZT / 31.1034768
PURITY = {"10K": 0.417, "14K": 0.585, "18K": 0.750}
DENSITY = {"10K": 0.892, "14K": 1.0, "18K": 1.137}
LOSS = 1.07
QUOTE = {"ring": 365, "necklace": 380, "bracelet": 375}
QUOTE_AVG_G = {"ring": 2.04, "necklace": 2.96, "bracelet": 1.48}
LABOR = {c: round(QUOTE[c] - QUOTE_AVG_G[c] * PURE_G * PURITY["14K"] * LOSS, 2) for c in QUOTE}
MARKUP = 2.0

RING_SIZES = [x / 2 for x in range(6, 33)]          # US 3 .. 16, whole and half = 27
NECK_LEN = [16, 18, 20]
BRAC_LEN = [6.5, 7, 7.5]
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]


def ring_d(s):
    return 11.63 + 0.8128 * s


def grams14(m, size):
    c = m["cat"]
    if c == "ring":
        return m["top_g"] + m["shank_g"] * ring_d(size) / ring_d(7)
    if c == "necklace":
        return m["piece_g"] + 0.2 + 0.1 * size
    return m["piece_g"] + 0.2 + 0.114 * size


def price_cents_v1(m, k, size):
    """Superseded 2026-10-07: own estimate (quote-derived labor). Kept to report the change."""
    g = grams14(m, size) * DENSITY[k]
    cost = g * PURE_G * PURITY[k] * LOSS + LABOR[m["cat"]]
    return int(math.ceil(MARKUP * cost / 10) * 10 * 100)


# ---------------------------------------------------------------- v2: 2 x maker cost (owner 2026-10-07)
sys.path.insert(0, str(HERE.parent))
import maker_cost as mk  # noqa: E402

BRACELET_STATION_SCALE = 3.0 / 0.8     # maker counts 3 g for B09's stations where v1 estimated 0.8 g
FULL_ENAMEL_BAND = {"R02"}             # quoted as a 4 mm band + 100 USD enamel


def maker_g14(m, size):
    """14K grams the maker charges for, chain excluded."""
    c = m["cat"]
    if c == "ring":
        return mk.list_g14(4 if m["id"] in FULL_ENAMEL_BAND else 3, size)
    if c == "necklace":
        return m["piece_g"]
    return m["piece_g"] * BRACELET_STATION_SCALE


def chain_g14(m, size):
    c = m["cat"]
    if c == "necklace":
        return mk.CHAIN_NECKLACE_18IN / mk.MAKER_14K_USD_G * size / 18
    if c == "bracelet":
        return mk.CHAIN_BRACELET_7IN / mk.MAKER_14K_USD_G * size / 7
    return 0.0


def maker_cost(m, k, size):
    c = m["cat"]
    cost = mk.gold_cost(maker_g14(m, size) + chain_g14(m, size), k)
    if c == "ring":
        return cost + (mk.ENAMEL_RING_BAND if m["id"] in FULL_ENAMEL_BAND else 0)
    cost += mk.ENAMEL_PIECE if m["enamel"] else 0
    return cost + (mk.ASSEMBLY if c == "bracelet" else 0)


# Necklaces (chain 130 USD and 9 pendant weights estimated) and nine bracelets (station grams estimated)
# were first held at v1 / raise-only; owner decided 2026-10-07 ("tahmini fiyatla"): price on estimates too.
def price_cents(m, k, size):
    return mk.price_cents(maker_cost(m, k, size))


def variant_grams(m, k, size):
    return round((maker_g14(m, size) + chain_g14(m, size)) * DENSITY[k], 2)


# ---------------------------------------------------------------- Christmas enamel palette
EN = {
    "cranberry": ("cranberry red", "deep cranberry red (#9E1B32)"),
    "pine": ("pine green", "deep pine green (#1F4D3A)"),
    "snow": ("snow white", "soft snow white (#F0EEE9)"),
    "ginger": ("gingerbread brown", "warm gingerbread brown (#8A5A3B)"),
    "emerald": ("emerald green", "glossy emerald green (#0F6B4F)"),
    "sage": ("mistletoe sage", "soft mistletoe sage green (#8FA37E)"),
    "scarlet": ("poinsettia red", "bright poinsettia red (#C21F2E)"),
}

SHARED_TAGS = ["christmas jewelry", "christmas gift", "gift for her"]

M = []


def add(**kw):
    kw.setdefault("enamel", [])
    M.append(kw)


# ============================================================ 1 HOLLY (pine + cranberry)
add(id="R01", fam="Holly", cat="ring", name="Holly Berry Ring", enamel=["pine", "cranberry"],
    dims="holly top 9 x 7 mm", top_g=0.8, shank_g=1.2,
    title="Holly Berry Ring, Green and Red Enamel Holly in Solid Gold, Dainty Christmas Ring",
    tags=["holly ring", "holly berry ring", "red berry ring", "green enamel ring", "winter ring",
          "holiday ring", "festive jewelry", "dainty gold ring", "enamel ring", "14k enamel ring"],
    lead="Two pine green enamel holly leaves and three cranberry berries on a solid gold band.",
    story="The oldest green of the season, cut small enough to wear every day: two pointed leaves with polished gold veins and a cluster of three red berries where they meet.",
    shape="a slim polished gold ring with a holly cluster on top, 9 by 7 mm: two pointed holly leaves with gently scalloped edges, each split by a polished gold centre vein and filled with flat deep pine green enamel inside thin polished gold rims, and between them three small round berries 2 mm each filled with flat deep cranberry red enamel; round smooth shank")
add(id="B01", fam="Holly", cat="bracelet", name="Holly Station Bracelet", enamel=["pine", "cranberry"],
    dims="three holly stations, each 6 x 5 mm", piece_g=0.8,
    title="Holly Bracelet, Three Green and Red Enamel Holly Sprigs on Solid Gold Chain, Christmas Station Bracelet",
    tags=["holly bracelet", "holly berry", "station bracelet", "red and green", "winter bracelet",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "gold chain bracelet", "14k enamel bracelet"],
    lead="Three small holly sprigs in green and red enamel, set along a fine solid gold chain.",
    story="Each station is two leaves and a single berry, spaced around the wrist so one always shows. Fine enough to wear under a sweater cuff all December.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three small holly stations 6 by 5 mm spaced evenly along the chain, each made of two pointed leaves of flat deep pine green enamel split by a polished gold vein and one round 2 mm berry of flat deep cranberry red enamel, all inside thin polished gold rims; spring ring clasp")
add(id="N01", fam="Holly", cat="necklace", name="Holly Sprig Necklace", enamel=["pine", "cranberry"],
    dims="sprig 13 x 10 mm", piece_g=1.1,
    title="Holly Necklace, Green and Red Enamel Holly Sprig Pendant on Solid Gold Chain, Christmas Gift Necklace",
    tags=["holly necklace", "holly pendant", "holly berry", "red and green", "winter necklace",
          "holiday necklace", "festive jewelry", "dainty necklace", "layering necklace", "14k enamel pendant"],
    lead="A holly sprig pendant in solid gold: two green enamel leaves and three cranberry berries.",
    story="The berries sit at the top where the bail is, so the leaves fan out below and the sprig hangs the way it would on a wreath.",
    shape="a holly sprig pendant 13 by 10 mm: two pointed holly leaves with gently scalloped edges fanning downward, each split by a polished gold centre vein and filled with flat deep pine green enamel inside thin polished gold rims, and at the top three round 2.5 mm berries of flat deep cranberry red enamel; a small gold bail above the berries on a fine 1.2 mm gold cable chain that passes through the bail and curves softly out of the top of the frame")

# ============================================================ 2 CANDY CANE (cranberry + snow)
add(id="R02", fam="Candy Cane", cat="ring", name="Candy Cane Stripe Ring", enamel=["cranberry", "snow"],
    dims="band 3 mm wide, stripes about 2 mm", top_g=0.0, shank_g=2.4,
    title="Candy Cane Ring, Red and White Enamel Stripe Band in Solid Gold, Christmas Stacking Ring",
    tags=["candy cane ring", "striped ring", "red and white ring", "enamel band", "stacking ring",
          "holiday ring", "festive jewelry", "peppermint ring", "gold band ring", "14k enamel ring"],
    lead="A 3 mm solid gold band striped all the way round in cranberry red and snow white enamel.",
    story="The candy cane with the hook taken away: only the stripe, wound around the finger. It stacks with plain gold bands and reads as Christmas from across the room.",
    shape="a 3 mm wide polished gold band ring whose whole outer surface is set all the way around with diagonal stripes about 2 mm wide, alternating flat deep cranberry red enamel and flat soft snow white enamel, each stripe separated by a thin polished gold wall, with narrow polished gold edges on both sides; shown standing upright in a three-quarter view")
add(id="B02", fam="Candy Cane", cat="bracelet", name="Candy Cane Charm Bracelet", enamel=["cranberry", "snow"],
    dims="candy cane 4 x 10 mm", piece_g=0.6,
    title="Candy Cane Bracelet, Red and White Enamel Candy Cane Charm on Solid Gold Chain, Christmas Charm Bracelet",
    tags=["candy cane bracelet", "candy cane charm", "red and white", "charm bracelet", "peppermint",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "gold chain bracelet", "14k enamel bracelet"],
    lead="A small candy cane charm in red and white enamel, hanging at the centre of a fine solid gold chain.",
    story="One sweet thing on the wrist for December. The stripes are real enamel cells, each in its own gold frame.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with one small candy cane charm 4 by 10 mm hanging from a gold jump ring at the centre: a hooked cane 2 mm thick striped diagonally in cells of flat deep cranberry red enamel and flat soft snow white enamel, separated by thin polished gold walls; spring ring clasp")
add(id="N02", fam="Candy Cane", cat="necklace", name="Candy Cane Hook Necklace", enamel=["cranberry", "snow"],
    dims="candy cane 7 x 16 mm", piece_g=1.0,
    title="Candy Cane Necklace, Red and White Enamel Candy Cane Pendant on Solid Gold Chain, Christmas Necklace",
    tags=["candy cane necklace", "candy cane pendant", "red and white", "peppermint", "christmas pendant",
          "holiday necklace", "festive jewelry", "dainty necklace", "layering necklace", "14k enamel pendant"],
    lead="A candy cane pendant in solid gold whose crook closes into the loop the chain runs through.",
    story="The hook does the work of a bail, so the cane hangs from the chain the way it hangs from a tree branch. Red and white enamel stripes, each framed in gold.",
    shape="a candy cane pendant 7 by 16 mm: a cane 2.5 mm thick striped diagonally in cells of flat deep cranberry red enamel and flat soft snow white enamel separated by thin polished gold walls, its crook at the top curling round into a closed polished gold loop; a fine 1.2 mm gold cable chain passes through the loop and curves softly out of the top of the frame")

# ============================================================ 3 GINGERBREAD (ginger, gold icing)
add(id="R03", fam="Gingerbread", cat="ring", name="Gingerbread Man Ring", enamel=["ginger"],
    dims="gingerbread man 7 x 8 mm", top_g=0.7, shank_g=1.2,
    title="Gingerbread Man Ring, Brown Enamel Gingerbread Cookie in Solid Gold, Cute Christmas Ring",
    tags=["gingerbread ring", "gingerbread man", "cookie ring", "brown enamel ring", "baking gift",
          "holiday ring", "festive jewelry", "cute gold ring", "christmas cookie", "14k enamel ring"],
    lead="A small gingerbread man in warm brown enamel, iced in polished gold, on a solid gold band.",
    story="The first cookie out of the tray. The icing is gold instead of sugar: a zigzag at each wrist and ankle and two gold buttons down the front.",
    shape="a polished gold ring with a small flat gingerbread man on top, 7 by 8 mm, filled with flat warm gingerbread brown enamel inside a thin polished gold rim, with fine raised polished gold zigzag lines across each wrist and ankle like icing and two tiny round polished gold buttons down the chest; round smooth shank")
add(id="B03", fam="Gingerbread", cat="bracelet", name="Gingerbread Heart Bracelet", enamel=["ginger"],
    dims="three hearts, each 5 mm", piece_g=0.6,
    title="Gingerbread Heart Bracelet, Three Brown Enamel Cookie Hearts on Solid Gold Chain, Christmas Bracelet",
    tags=["gingerbread bracelet", "cookie bracelet", "heart bracelet", "brown enamel", "baking gift",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "station bracelet", "14k enamel bracelet"],
    lead="Three small gingerbread heart cookies in brown enamel with scalloped gold icing, on a fine solid gold chain.",
    story="Heart-shaped cookies, the kind tied onto a tree with ribbon. Each one has a scalloped gold edge, the way icing is piped round a biscuit.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three small heart stations 5 mm spaced along the chain, each filled with flat warm gingerbread brown enamel inside a scalloped polished gold rim like piped icing; spring ring clasp")
add(id="N03", fam="Gingerbread", cat="necklace", name="Gingerbread Man Necklace", enamel=["ginger"],
    dims="gingerbread man 11 x 13 mm", piece_g=1.2,
    title="Gingerbread Man Necklace, Brown Enamel Cookie Pendant on Solid Gold Chain, Cute Christmas Necklace",
    tags=["gingerbread necklace", "gingerbread man", "cookie necklace", "brown enamel", "baking gift",
          "holiday necklace", "festive jewelry", "cute necklace", "christmas cookie", "14k enamel pendant"],
    lead="A gingerbread man pendant in warm brown enamel with polished gold icing, on a fine solid gold chain.",
    story="Big enough to see his gold buttons and the zigzag icing at his wrists, small enough to wear past Christmas.",
    shape="a flat gingerbread man pendant 11 by 13 mm filled with flat warm gingerbread brown enamel inside a thin polished gold rim, with fine raised polished gold zigzag lines across each wrist and ankle like icing, two tiny round gold eyes and three round gold buttons down the chest; a small gold bail above the head on a fine 1.2 mm gold cable chain that passes through the bail and curves softly out of the top of the frame")

# ============================================================ 4 BAUBLE (emerald + cranberry)
add(id="R04", fam="Bauble", cat="ring", name="Bauble Ring", enamel=["emerald"],
    dims="bauble 7 mm with gold cap", top_g=0.8, shank_g=1.2,
    title="Bauble Ring, Emerald Green Enamel Christmas Ornament in Solid Gold, Festive Statement Ring",
    tags=["bauble ring", "ornament ring", "green enamel ring", "emerald enamel", "tree ornament",
          "holiday ring", "festive jewelry", "statement ring", "gold ornament", "14k enamel ring"],
    lead="A round Christmas bauble in emerald green enamel, with a polished gold cap, set on a solid gold band.",
    story="The bauble lies flat across the finger, cap and little loop and all, like one taken off the tree and kept.",
    shape="a polished gold ring with a round flat Christmas bauble on top, 7 mm across, filled with flat glossy emerald green enamel inside a thin polished gold rim, crossed by one fine polished gold band, with a small ridged polished gold cap and a tiny gold loop at one side; round smooth shank")
add(id="B04", fam="Bauble", cat="bracelet", name="Bauble Trio Bracelet", enamel=["emerald", "cranberry"],
    dims="three baubles, each 5 mm", piece_g=0.8,
    title="Bauble Bracelet, Three Emerald and Red Enamel Ornament Charms on Solid Gold Chain, Christmas Charm Bracelet",
    tags=["bauble bracelet", "ornament bracelet", "charm bracelet", "red and green", "tree ornament",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "gold chain bracelet", "14k enamel bracelet"],
    lead="Three tiny bauble charms, emerald, cranberry and emerald, hanging from a fine solid gold chain.",
    story="They hang close together at the centre and touch as you move, like three ornaments on the same branch.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three tiny round bauble charms 5 mm hanging close together at the centre from small gold jump rings: the outer two filled with flat glossy emerald green enamel, the middle one with flat deep cranberry red enamel, each inside a thin polished gold rim with a small ridged polished gold cap; spring ring clasp")
add(id="N04", fam="Bauble", cat="necklace", name="Bauble Ornament Necklace", enamel=["emerald"],
    dims="bauble 10 mm with gold cap", piece_g=1.2,
    title="Bauble Necklace, Emerald Green Enamel Ornament Pendant on Solid Gold Chain, Christmas Gift Necklace",
    tags=["bauble necklace", "ornament necklace", "green pendant", "emerald enamel", "tree ornament",
          "holiday necklace", "festive jewelry", "dainty necklace", "layering necklace", "14k enamel pendant"],
    lead="A 10 mm Christmas bauble pendant in emerald green enamel, with a ridged gold cap and loop.",
    story="Hung by its own cap the way an ornament hangs from a branch. One fine gold band crosses the glass, the only decoration it needs.",
    shape="a round flat Christmas bauble pendant 10 mm across, filled with flat glossy emerald green enamel inside a thin polished gold rim and crossed by one fine polished gold band, with a small ridged polished gold cap and loop at the top; a fine 1.2 mm gold cable chain passes through the loop and curves softly out of the top of the frame")

# ============================================================ 5 SNOWFLAKE (solid gold)
add(id="R05", fam="Snowflake", cat="ring", name="Snowflake Ring",
    dims="snowflake 9 mm", top_g=0.6, shank_g=1.2,
    title="Snowflake Ring, Solid Gold Six Point Snowflake, Dainty Winter Statement Ring",
    tags=["snowflake ring", "winter ring", "solid gold ring", "snow jewelry", "frozen ring",
          "holiday ring", "festive jewelry", "dainty gold ring", "minimalist ring", "14k snowflake ring"],
    lead="A six-armed snowflake in solid polished gold, set flat on a slim gold band.",
    story="No colour at all, only gold and light: six arms, each with two small branches, cut cleanly so the flake reads at a glance.",
    shape="a slim polished gold ring with a flat six-armed snowflake on top, 9 mm across, each arm with two small side branches, sculpted in solid polished gold with a closed solid back; round smooth shank")
add(id="B05", fam="Snowflake", cat="bracelet", name="Snowflake Station Bracelet",
    dims="three snowflakes, each 6 mm", piece_g=0.8,
    title="Snowflake Bracelet, Three Solid Gold Snowflakes on Fine Gold Chain, Dainty Winter Station Bracelet",
    tags=["snowflake bracelet", "winter bracelet", "station bracelet", "snow jewelry", "frozen jewelry",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "gold chain bracelet", "14k gold bracelet"],
    lead="Three small solid gold snowflakes set along a fine solid gold chain.",
    story="No two flakes alike: each is cut with a slightly different branch, the way real ones are.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three small flat six-armed snowflake stations 6 mm across spaced evenly along it, each sculpted in solid polished gold with slightly different branches; spring ring clasp")
add(id="N05", fam="Snowflake", cat="necklace", name="Snowflake Pendant Necklace",
    dims="snowflake 14 mm", piece_g=1.3,
    title="Snowflake Necklace, Solid Gold Snowflake Pendant on Fine Gold Chain, Winter Christmas Gift Necklace",
    tags=["snowflake necklace", "snowflake pendant", "winter necklace", "snow jewelry", "frozen jewelry",
          "holiday necklace", "festive jewelry", "dainty necklace", "layering necklace", "14k gold pendant"],
    lead="A 14 mm six-armed snowflake in solid polished gold on a fine gold chain.",
    story="The flake hangs from one arm, so it turns a little and throws light from every edge.",
    shape="a flat six-armed snowflake pendant 14 mm across, each arm with two small side branches and a tiny round tip, sculpted in solid polished gold with a closed solid back, hanging from a small gold bail at the tip of one arm on a fine 1.2 mm gold cable chain that passes through the bail and curves softly out of the top of the frame")

# ============================================================ 6 TREE (pine, gold star)
add(id="R06", fam="Tree", cat="ring", name="Christmas Tree Ring", enamel=["pine"],
    dims="tree 6 x 9 mm", top_g=0.7, shank_g=1.2,
    title="Christmas Tree Ring, Pine Green Enamel Tree with Gold Star in Solid Gold, Dainty Holiday Ring",
    tags=["christmas tree ring", "tree ring", "green enamel ring", "pine tree ring", "star topper",
          "holiday ring", "festive jewelry", "dainty gold ring", "winter ring", "14k enamel ring"],
    lead="A small pine green enamel Christmas tree with a polished gold star, standing on a solid gold band.",
    story="A triangle of deep green crossed by one gold garland, with a five-point star on top. The tree stands upright along the finger.",
    shape="a polished gold ring with a small flat Christmas tree on top, 6 by 9 mm: a triangle split by one diagonal polished gold garland line into two cells of flat deep pine green enamel inside thin polished gold rims, a tiny polished gold five-point star at the top and a short gold trunk; round smooth shank")
add(id="B06", fam="Tree", cat="bracelet", name="Tree Line Bracelet", enamel=["pine"],
    dims="three trees, 4 x 6, 5 x 7 and 4 x 6 mm", piece_g=0.8,
    title="Christmas Tree Bracelet, Three Pine Green Enamel Trees on Solid Gold Chain, Holiday Station Bracelet",
    tags=["christmas tree", "tree bracelet", "pine tree", "green enamel", "forest bracelet",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "station bracelet", "14k enamel bracelet"],
    lead="Three small pine green enamel trees, the middle one taller, set along a fine solid gold chain.",
    story="A little forest for the wrist: three trees in a row, each with its own gold star.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three small flat Christmas tree stations side by side at the centre, 4 by 6, 5 by 7 and 4 by 6 mm, each a triangle of flat deep pine green enamel inside a thin polished gold rim with a tiny polished gold star on top; spring ring clasp")
add(id="N06", fam="Tree", cat="necklace", name="Christmas Tree Necklace", enamel=["pine"],
    dims="tree 10 x 15 mm", piece_g=1.3,
    title="Christmas Tree Necklace, Pine Green Enamel Tree Pendant with Gold Star on Solid Gold Chain",
    tags=["christmas tree", "tree necklace", "tree pendant", "green enamel", "pine tree",
          "holiday necklace", "festive jewelry", "dainty necklace", "star pendant", "14k enamel pendant"],
    lead="A Christmas tree pendant in pine green enamel, wound with two gold garlands and topped with a gold star.",
    story="The star is the bail: the chain runs behind it, so the tree hangs straight with its garlands catching the light.",
    shape="a flat Christmas tree pendant 10 by 15 mm: a tall triangle crossed by two diagonal polished gold garland lines that divide it into three cells of flat deep pine green enamel inside thin polished gold rims, with a short gold trunk and a polished gold five-point star at the top with a small bail behind it; a fine 1.2 mm gold cable chain passes through the bail and curves softly out of the top of the frame")

# ============================================================ 7 MISTLETOE (sage + snow)
add(id="R07", fam="Mistletoe", cat="ring", name="Mistletoe Bypass Ring", enamel=["sage", "snow"],
    dims="leaves 6 mm, berries 2 mm, open ring", top_g=0.6, shank_g=1.2,
    title="Mistletoe Ring, Sage Green and White Enamel Open Bypass Ring in Solid Gold, Christmas Kiss Ring",
    tags=["mistletoe ring", "bypass ring", "open ring", "sage green ring", "white berry ring",
          "holiday ring", "festive jewelry", "kiss me ring", "botanical ring", "14k enamel ring"],
    lead="An open solid gold ring: two sage green enamel mistletoe leaves on one end, three white enamel berries on the other.",
    story="The two ends pass each other on the finger, leaves on one side and berries on the other, so the ring is never quite closed. A small invitation for the party season.",
    shape="an open bypass ring in polished gold: one end finishes in two small oval mistletoe leaves 6 mm long filled with flat soft mistletoe sage green enamel inside thin polished gold rims, the other end in a cluster of three round 2 mm berries filled with flat soft snow white enamel inside thin gold rims; the two ends pass side by side")
add(id="B07", fam="Mistletoe", cat="bracelet", name="Mistletoe Sprig Bracelet", enamel=["sage", "snow"],
    dims="sprig 10 x 6 mm", piece_g=0.7,
    title="Mistletoe Bracelet, Sage Green and White Enamel Sprig on Solid Gold Chain, Christmas Botanical Bracelet",
    tags=["mistletoe bracelet", "mistletoe sprig", "sage green", "white berries", "botanical bracelet",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "gold chain bracelet", "14k enamel bracelet"],
    lead="A mistletoe sprig in sage green and white enamel, set at the centre of a fine solid gold chain.",
    story="Three leaves and four white berries lying flat on the top of the wrist, the quietest piece in the family.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with one flat mistletoe sprig station 10 by 6 mm at the centre: three oval leaves of flat soft mistletoe sage green enamel and four round 2 mm berries of flat soft snow white enamel, all inside thin polished gold rims on a short gold stem; spring ring clasp")
add(id="N07", fam="Mistletoe", cat="necklace", name="Mistletoe Drop Necklace", enamel=["sage", "snow"],
    dims="sprig 9 x 14 mm", piece_g=1.0,
    title="Mistletoe Necklace, Sage Green and White Enamel Mistletoe Pendant on Solid Gold Chain, Christmas Gift",
    tags=["mistletoe necklace", "mistletoe pendant", "sage green", "white berries", "kiss me necklace",
          "holiday necklace", "festive jewelry", "dainty necklace", "botanical necklace", "14k enamel pendant"],
    lead="A mistletoe sprig pendant hung upside down, the way it hangs in a doorway: sage leaves above, white berries below.",
    story="The stem loops into the bail at the top, the two leaves spread out under it and three white berries hang at the bottom.",
    shape="a mistletoe sprig pendant 9 by 14 mm hanging stem up: a short polished gold stem looping into a bail at the top, two oval leaves spreading downward filled with flat soft mistletoe sage green enamel, and below them a cluster of three round 2.5 mm berries filled with flat soft snow white enamel, all inside thin polished gold rims; a fine 1.2 mm gold cable chain passes through the bail and curves softly out of the top of the frame")

# ============================================================ 8 BELL (solid gold)
add(id="R08", fam="Bell", cat="ring", name="Bell Ring",
    dims="bell 6 x 7 mm", top_g=0.7, shank_g=1.2,
    title="Bell Ring, Solid Gold Christmas Bell with Tiny Bow, Dainty Holiday Ring",
    tags=["bell ring", "christmas bell", "jingle bell ring", "solid gold ring", "holiday ring",
          "festive jewelry", "dainty gold ring", "winter ring", "cute gold ring", "14k gold bell ring"],
    lead="A small sculpted Christmas bell in solid polished gold, with a tiny gold bow at the top.",
    story="A flat sculpted bell with its clapper showing below the rim. It does not ring, but it catches the light every time you move your hand.",
    shape="a slim polished gold ring with a small flat sculpted Christmas bell on top, 6 by 7 mm, flared at the rim with a small round clapper bead showing below it and a tiny flat gold bow at the top, all in solid polished gold with a closed solid back; round smooth shank")
add(id="B08", fam="Bell", cat="bracelet", name="Twin Bell Bracelet",
    dims="two bells, each 5 x 6 mm", piece_g=0.8,
    title="Bell Bracelet, Two Solid Gold Christmas Bell Charms on Fine Gold Chain, Holiday Charm Bracelet",
    tags=["bell bracelet", "christmas bell", "jingle bell", "charm bracelet", "holiday bracelet",
          "festive jewelry", "dainty bracelet", "gold chain bracelet", "winter bracelet", "14k gold bracelet"],
    lead="Two small solid gold bell charms hanging together from a fine gold chain.",
    story="A pair of bells at the centre of the wrist, one a little lower than the other, tied with tiny gold bows.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with two small flat sculpted bell charms 5 by 6 mm hanging together at the centre at slightly different heights, each flared at the rim with a small round clapper bead and a tiny gold bow at the top, in solid polished gold with closed solid backs; spring ring clasp")
add(id="N08", fam="Bell", cat="necklace", name="Bell Pendant Necklace",
    dims="bell 10 x 12 mm", piece_g=1.3,
    title="Bell Necklace, Solid Gold Christmas Bell Pendant with Bow on Fine Gold Chain, Holiday Gift Necklace",
    tags=["bell necklace", "bell pendant", "christmas bell", "jingle bell", "holiday necklace",
          "festive jewelry", "dainty necklace", "layering necklace", "winter necklace", "14k gold pendant"],
    lead="A Christmas bell pendant in solid polished gold, hung from a small gold bow.",
    story="The bow at the top is the bail, so the bell hangs straight. Polished all over, with the round clapper showing under the rim.",
    shape="a flat sculpted Christmas bell pendant 10 by 12 mm, flared at the rim with a round clapper bead showing below it and a small gold bow at the top whose loop forms the bail, all in solid polished gold with a closed solid back; a fine 1.2 mm gold cable chain passes through the bow loop and curves softly out of the top of the frame")

# ============================================================ 9 POINSETTIA (scarlet, gold beads)
add(id="R09", fam="Poinsettia", cat="ring", name="Poinsettia Ring", enamel=["scarlet"],
    dims="flower 9 mm", top_g=0.8, shank_g=1.2,
    title="Poinsettia Ring, Red Enamel Christmas Flower in Solid Gold, Holiday Flower Statement Ring",
    tags=["poinsettia ring", "christmas flower", "red flower ring", "red enamel ring", "flower ring",
          "holiday ring", "festive jewelry", "statement ring", "floral gold ring", "14k enamel ring"],
    lead="A poinsettia in bright red enamel with a beaded gold centre, on a solid gold band.",
    story="The Christmas flower drawn simply: pointed petals, each with a gold vein, around a cluster of tiny gold beads.",
    shape="a polished gold ring with a flat poinsettia flower on top, 9 mm across: pointed petals, each split by a fine polished gold vein and filled with flat bright poinsettia red enamel inside thin polished gold rims, around a centre cluster of tiny round polished gold beads; round smooth shank")
add(id="B09", fam="Poinsettia", cat="bracelet", name="Poinsettia Station Bracelet", enamel=["scarlet"],
    dims="three flowers, each 6 mm", piece_g=0.8,
    title="Poinsettia Bracelet, Three Red Enamel Christmas Flowers on Solid Gold Chain, Holiday Station Bracelet",
    tags=["poinsettia bracelet", "christmas flower", "red flower", "red enamel", "flower bracelet",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "station bracelet", "14k enamel bracelet"],
    lead="Three small red enamel poinsettias with gold bead centres, set along a fine solid gold chain.",
    story="Bright red against gold, spaced around the wrist like flowers on a garland.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three small flat poinsettia stations 6 mm across spaced along it, each of pointed petals of flat bright poinsettia red enamel inside thin polished gold rims around a tiny cluster of round gold beads; spring ring clasp")
add(id="N09", fam="Poinsettia", cat="necklace", name="Poinsettia Necklace", enamel=["scarlet"],
    dims="flower 13 mm", piece_g=1.2,
    title="Poinsettia Necklace, Red Enamel Christmas Flower Pendant on Solid Gold Chain, Holiday Gift Necklace",
    tags=["poinsettia necklace", "christmas flower", "red pendant", "red enamel", "flower necklace",
          "holiday necklace", "festive jewelry", "dainty necklace", "floral pendant", "14k enamel pendant"],
    lead="A 13 mm poinsettia pendant in bright red enamel with a beaded gold centre.",
    story="The flower faces forward on a hidden bail, so it sits flat at the neckline like a brooch on a coat.",
    shape="a flat poinsettia flower pendant 13 mm across: pointed petals, each split by a fine polished gold vein and filled with flat bright poinsettia red enamel inside thin polished gold rims, around a centre cluster of round polished gold beads, with a small bail hidden behind the top petal; a fine 1.2 mm gold cable chain passes through the bail and curves softly out of the top of the frame")

# ============================================================ 10 STOCKING (cranberry + snow)
add(id="R10", fam="Stocking", cat="ring", name="Stocking Ring", enamel=["cranberry", "snow"],
    dims="stocking 6 x 8 mm", top_g=0.7, shank_g=1.2,
    title="Stocking Ring, Red and White Enamel Christmas Stocking in Solid Gold, Cute Holiday Ring",
    tags=["stocking ring", "christmas stocking", "red and white", "red enamel ring", "cute ring",
          "holiday ring", "festive jewelry", "dainty gold ring", "stocking stuffer", "14k enamel ring"],
    lead="A small Christmas stocking in cranberry red enamel with a snow white cuff, on a solid gold band.",
    story="The stocking that waits by the fireplace, made small: red foot, white cuff, a tiny gold loop to hang it by.",
    shape="a polished gold ring with a small flat Christmas stocking on top, 6 by 8 mm: the foot and leg filled with flat deep cranberry red enamel and a 2 mm cuff across the top filled with flat soft snow white enamel, separated by a polished gold line and framed by thin polished gold rims, with a tiny gold hanging loop at the cuff corner; round smooth shank")
add(id="B10", fam="Stocking", cat="bracelet", name="Stocking Charm Bracelet", enamel=["cranberry", "snow"],
    dims="stocking 5 x 7 mm", piece_g=0.6,
    title="Stocking Bracelet, Red and White Enamel Christmas Stocking Charm on Solid Gold Chain, Stocking Stuffer",
    tags=["stocking bracelet", "christmas stocking", "stocking charm", "red and white", "stocking stuffer",
          "holiday bracelet", "festive jewelry", "dainty bracelet", "charm bracelet", "14k enamel bracelet"],
    lead="A tiny red and white enamel stocking charm hanging from a fine solid gold chain.",
    story="A stocking small enough to fit in a stocking, which is rather the point.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with one small flat Christmas stocking charm 5 by 7 mm hanging at the centre from a gold jump ring: foot and leg of flat deep cranberry red enamel, cuff of flat soft snow white enamel, separated by a polished gold line inside thin polished gold rims; spring ring clasp")
add(id="N10", fam="Stocking", cat="necklace", name="Stocking Necklace", enamel=["cranberry", "snow"],
    dims="stocking 9 x 13 mm", piece_g=1.1,
    title="Stocking Necklace, Red and White Enamel Christmas Stocking Pendant on Solid Gold Chain, Holiday Gift",
    tags=["stocking necklace", "christmas stocking", "stocking pendant", "red and white", "stocking stuffer",
          "holiday necklace", "festive jewelry", "dainty necklace", "cute necklace", "14k enamel pendant"],
    lead="A Christmas stocking pendant in cranberry red enamel with a snow white cuff, hung from its own gold loop.",
    story="It hangs from the loop at the cuff corner, so it tilts slightly, the way a stocking hangs from a hook on the mantel.",
    shape="a flat Christmas stocking pendant 9 by 13 mm: foot and leg filled with flat deep cranberry red enamel, a 3 mm cuff across the top filled with flat soft snow white enamel, separated by a polished gold line and framed by thin polished gold rims, hanging slightly tilted from a small gold loop at the cuff corner; a fine 1.2 mm gold cable chain passes through the loop and curves softly out of the top of the frame")

# ---------------------------------------------------------------- assembly
DETAIL = {
    "ring": "Ring size: US 3 to 16, whole and half sizes.",
    "necklace": "Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.",
    "bracelet": "Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.",
}
PROTOCOL = {"ring": "sculptural_ring", "necklace": "pendant_necklace", "bracelet": "chain_bracelet"}
AXES = {"ring": ["Karat", "Metal Color", "Ring Size"], "necklace": ["Karat", "Metal Color", "Chain Length"],
        "bracelet": ["Karat", "Metal Color", "Bracelet Length"]}

METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose."
GOLD_LINE = "Finish: solid sculpted gold with a closed back; no enamel, no stones."
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE_EN = ("Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, "
           "so take it off for the gym and the dishes and wipe it with a soft cloth.")
CARE_GOLD = "Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish."
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")

PROMPT_EN = ("Studio product photograph of one fine jewelry piece: {shape}. Solid polished 14K yellow gold with "
             "flat, glossy kiln-fired vitreous enamel set flush inside recessed cells, every cell framed by a thin "
             "polished gold rim; the enamel is perfectly flat and smooth, not domed, not cabochon, no gradient, no "
             "painted detail, no stones. Enamel colour: {colours}. Resting on warm off-white textured paper, soft "
             "diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life "
             "small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, "
             "no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, "
             "square format.")
PROMPT_GOLD = ("Studio product photograph of one fine jewelry piece: {shape}. Solid polished 14K yellow gold only, "
               "no enamel, no colour, no stones; real gold reflections. Resting on warm off-white textured paper, soft "
               "diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life "
               "small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, "
               "no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, "
               "square format.")


def sizes(cat):
    return {"ring": RING_SIZES, "necklace": NECK_LEN, "bracelet": BRAC_LEN}[cat]


def ref_size(cat):
    return {"ring": 7, "necklace": 18, "bracelet": 7}[cat]


def num(s):
    return str(int(s)) if s == int(s) else str(s)


def size_label(cat, s):
    return "US " + num(s) if cat == "ring" else f"{num(s)} inches"


def size_code(cat, s):
    return ("US" + num(s) if cat == "ring" else num(s) + "IN").replace(".", "_")


IMG = {}
if (HERE / "images.json").exists():
    IMG = {r["id"]: r for r in json.load(open(HERE / "images.json"))["images"]}

BAN = ["—", "–", "â"]
out = []
seen_titles, seen_sku, seen_shape = set(), set(), set()
assert len(M) == 30
for m in M:
    cat = m["cat"]
    assert len([x for x in M if x["cat"] == cat]) == 10
    gold = not m["enamel"]
    assert len(m["enamel"]) <= 2, m["id"]
    tags = m["tags"] + SHARED_TAGS
    assert len(tags) == 13 and len(set(tags)) == 13, (m["id"], len(set(tags)))
    for t in tags:
        assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), (m["id"], t)
    assert len(m["title"]) <= 140 and m["title"] not in seen_titles, m["id"]
    seen_titles.add(m["title"])
    assert m["shape"] not in seen_shape
    seen_shape.add(m["shape"])
    colours = [EN[c][0] for c in m["enamel"]]
    spec = [METAL,
            GOLD_LINE if gold else f"Enamel: kiln-fired vitreous enamel in {' and '.join(colours)}, set flush in recessed cells with polished gold rims.",
            f"Size: {m['dims']}.", DETAIL[cat]]
    desc = "\n\n".join([m["lead"], m["story"], "\n".join(spec), SHIP, CARE_GOLD if gold else CARE_EN, IMAGES])
    for b in BAN:
        assert b not in desc + m["title"] + " ".join(tags) + m["shape"], (m["id"], b)
    if gold:
        assert "enamel" not in m["shape"] and "enamel" not in m["lead"] + m["story"], m["id"]
    else:
        for c in m["enamel"]:
            assert EN[c][1].split(" (")[0] in m["shape"], (m["id"], c)
    base_sku = PREFIX + m["id"]
    variants = []
    for k in KARATS:
        for cc, cn in COLORS:
            for s in sizes(cat):
                sku = f"{base_sku}-{k}{cc}-{size_code(cat, s)}"
                assert len(sku) <= 32 and sku not in seen_sku, sku
                seen_sku.add(sku)
                variants.append({"sku": sku,
                                 "properties": {"Karat": k, "Metal Color": cn, AXES[cat][2]: size_label(cat, s)},
                                 "grams": variant_grams(m, k, s),
                                 "price_cents": price_cents(m, k, s),
                                 "price_cents_v1": price_cents_v1(m, k, s)})
    assert len(variants) == {"ring": 243, "necklace": 27, "bracelet": 27}[cat]
    rs = ref_size(cat)
    ref = next(v for v in variants if v["properties"]["Karat"] == "14K" and v["properties"]["Metal Color"] == "Yellow Gold"
               and v["properties"][AXES[cat][2]] == size_label(cat, rs))
    prompt = (PROMPT_GOLD if gold else PROMPT_EN).format(shape=m["shape"], colours=", ".join(EN[c][1] for c in m["enamel"]))
    out.append({
        "id": m["id"], "family": m["fam"], "productType": cat, "name": m["name"],
        "productId": str(uuid.uuid5(NS, SOURCE + ":" + m["id"])), "sku": base_sku,
        "title": m["title"], "tags": tags, "materials": ["Solid gold"] if gold else ["Solid gold", "Vitreous enamel"],
        "description": desc, "enamel": colours, "goldOnly": gold, "dims": m["dims"], "shape": m["shape"],
        "listingProtocol": PROTOCOL[cat], "offersPersonalization": False, "variationAxes": AXES[cat],
        "grams14Ref": round(maker_g14(m, rs) + chain_g14(m, rs), 2),
        "makerCost14KRefUsd": round(maker_cost(m, "14K", rs), 2), "refPriceCents": ref["price_cents"], "variants": variants,
        "imagePrompt": prompt, "imageFile": f"{m['id']}.jpg",
        "imageUrl": IMG.get(m["id"], {}).get("url"), "imageSha256": IMG.get(m["id"], {}).get("sha256"),
        "params": {k: m[k] for k in ("top_g", "shank_g", "piece_g") if k in m},
    })

basis = {"rule": "price = ceil(2 x maker_cost / 10) x 10 (owner decision 2026-10-07)",
         "makerCost": "gold grams x density x (spot x purity + labor per gram) + quoted extras; see ../maker_cost.py",
         "maker14KUsdPerGram": mk.MAKER_14K_USD_G, "laborUsdPerGram": round(mk.LABOR_USD_G, 2),
         "spotUsdOzt": mk.SPOT_USD_OZT, "densityVs14K": mk.DENSITY, "purity": mk.PURITY,
         "quoted": {"motifRing": "3 mm band from the maker list", "R02": "4 mm band + 100 enamel",
                    "N02": "1 g + 50 enamel", "B09": "3 g + 50 enamel + 100 chain + 50 assembly",
                    "modelFee": "25 USD once per design, not in unit price"},
         "estimated": {"necklaceChain": "130 USD at 18 in (I13 quote, middle-length convention), scaled by length",
                       "braceletStations": "own v1 grams x 3.75 (the B09 quote ratio) for the other nine bracelets",
                       "pendantGrams": "own v1 grams; the quoted N02 matched the estimate (1.0 g)"},
         "estimateApproval": "owner 2026-10-07: price necklaces and bracelets on the estimates too",
         "supersedes": "v1: own estimate with quote-derived labor per category (price_cents_v1 kept per variant)"}
json.dump({"source": SOURCE, "org": ORG, "pricingBasis": basis, "items": out},
          open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
print("items", len(out), "variants", sum(len(i["variants"]) for i in out))
for i in out:
    ps = [v["price_cents"] for v in i["variants"]]
    v1 = [v["price_cents_v1"] for v in i["variants"]]
    print(i["id"], f"{i['name']:<28}", "ref", i["grams14Ref"], "g cost", round(i["makerCost14KRefUsd"]), "price", i["refPriceCents"] // 100,
          " range", min(ps) // 100, max(ps) // 100, " v1 range", min(v1) // 100, max(v1) // 100, " up", sum(a > b for a, b in zip(ps, v1)), "down", sum(a < b for a, b in zip(ps, v1)))
