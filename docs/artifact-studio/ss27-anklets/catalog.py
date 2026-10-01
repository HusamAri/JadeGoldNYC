"""Artifact Studio SS27 Anklets: 40 listing proposals (10 families x 4 charms).

Single source of truth for copy, lengths, estimated grams, prices and image prompts.
Run: python3 docs/artifact-studio/ss27-anklets/catalog.py
Writes catalog.json next to this file and fails loudly on any rule break.
Direction: 01-design-direction.md (owner approved 2026-10-01).
"""
import json, math, os, re, uuid, pathlib

HERE = pathlib.Path(__file__).parent
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("9d3c6a71-2f4e-4b8a-a1d2-5e7c0b9f3a44")
SOURCE = "artifact-ss27-anklets-v1"

# ---------------------------------------------------------------- pricing basis
# Owner approved 2026-10-01: same engine as FW 26/27, PROVISIONAL until the
# manufacturer quotes anklets. Labor is the enamel bracelet quote; it is about
# 65% of cost, so an anklet quote moves every price.
SPOT_USD_OZT = 4178.20          # gold-api.com, 2026-09-30 11:21 UTC (same basis as FW 26/27)
PURE_G = SPOT_USD_OZT / 31.1034768
PURITY = {"10K": 0.417, "14K": 0.585, "18K": 0.750}
DENSITY = {"10K": 0.892, "14K": 1.0, "18K": 1.137}   # vs 14K, docs/second-brain.md
LOSS = 1.07
QUOTE_BRACELET, QUOTE_BRACELET_G = 375, 1.48         # 2027 enamel set, 14K, 2026-09-27
LABOR = round(QUOTE_BRACELET - QUOTE_BRACELET_G * PURE_G * PURITY["14K"] * LOSS, 2)
MARKUP = 2.0
CHAIN_G_PER_IN = round(0.114 * (1.0 / 1.1) ** 2, 4)  # FW 1.1 mm cable scaled by cross-section; UNCALIBRATED
FINDINGS_G = 0.2                                     # clasp, jump rings, ring end
LENGTHS = [9, 10, 11]                                # inches, owner approved; no extender
REF_LEN = 10
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]


def grams14(m, length):
    return m["g"] + FINDINGS_G + CHAIN_G_PER_IN * length


def price_cents(m, k, length):
    g = grams14(m, length) * DENSITY[k]
    cost = g * PURE_G * PURITY[k] * LOSS + LABOR
    return int(math.ceil(MARKUP * cost / 10) * 10 * 100)


# ---------------------------------------------------------------- enamel palette (WGSN x Coloro S/S 27)
EN = {
    "blue": ("Luminous Blue", "luminous cobalt blue (#1F4FD1)"),
    "orange": ("Energy Orange", "vivid energy orange (#F26A21)"),
    "pink": ("Pop Pink", "bright pop pink (#F06AA8)"),
    "green": ("Meadowland Green", "fresh meadow mid green (#6FA35A)"),
    "clay": ("Clay", "warm pink-toned clay (#C98F7A)"),
    "white": ("white", "soft white (#F4F1EA)"),
    "cream": ("cream", "warm cream (#EDE3C8)"),
    "lemon": ("lemon yellow", "lemon yellow (#F2D23C)"),
    "black": ("black", "glossy black"),
    "red": ("red", "bright ladybird red (#D1242A)"),
}

SHARED_TAGS = ["gold anklet", "anklet for women", "gift for her"]
POOL_ENAMEL = ["charm anklet", "enamel anklet", "dainty anklet", "14k gold anklet", "ankle bracelet",
               "summer anklet", "beach anklet", "minimalist anklet", "foot jewelry"]
POOL_GOLD = ["charm anklet", "solid gold anklet", "dainty anklet", "14k gold anklet", "ankle bracelet",
             "summer anklet", "beach anklet", "minimalist anklet", "foot jewelry"]

M = []


def add(code, fam, name, en, size, g, title, kw, lead, story, shape):
    M.append(dict(id=code, fam=fam, name=name, en=en, size=size, g=g, title=title, kw=kw,
                  lead=lead, story=story, shape=shape))


# ============================================================ 1 TIDE (Luminous Blue)
add("A01", "Tide", "Wave Anklet", ["blue"], 8, 0.5,
    "Wave Anklet, Blue Enamel Wave Charm on a Solid Gold Chain, Dainty Beach Anklet",
    ["wave anklet", "ocean anklet", "blue enamel charm", "wave charm", "sea jewelry"],
    "A small breaking wave in Luminous Blue enamel on a fine solid gold anklet chain.",
    "The first thing you see from the sand: one wave folding over. Drawn flat and simple, its curl is traced in a single polished gold line.",
    "a flat wave-curl charm 8 mm, a single breaking wave whose crest curls over, filled with flat {blue} enamel inside a thin polished gold rim, one fine polished gold line following the curl")
add("A02", "Tide", "Scallop Shell Anklet", ["blue"], 7, 0.45,
    "Scallop Shell Anklet, Blue Enamel Seashell Charm on a Solid Gold Chain, Ocean Anklet",
    ["shell anklet", "seashell anklet", "scallop charm", "blue shell charm", "ocean jewelry"],
    "A blue enamel scallop shell, its ribs drawn in gold, on a fine solid gold anklet chain.",
    "The fan shell you pick up first. Its ribs are drawn in fine gold lines across the blue, so up close it reads as a shell and from across the beach as a spark of colour.",
    "a flat scallop shell charm 7 mm, fan shaped with a small straight hinge at the top, four fine polished gold ribs radiating across flat {blue} enamel, inside a thin polished gold rim")
add("A03", "Tide", "Water Drop Anklet", ["blue"], 6, 0.35,
    "Water Drop Anklet, Tiny Blue Enamel Teardrop Charm, Minimalist Solid Gold Anklet",
    ["drop anklet", "teardrop charm", "tiny blue charm", "water drop charm", "minimal charm"],
    "One tiny blue enamel drop on a fine solid gold anklet chain.",
    "One drop, as if you just walked out of the sea. The smallest charm of the family, for an anklet you forget you are wearing.",
    "a small teardrop charm 6 mm, point up, filled with flat {blue} enamel inside a thin polished gold rim")
add("A04", "Tide", "Little Fish Anklet", ["blue"], 9, 0.6,
    "Little Fish Anklet, Blue Enamel Fish Charm on a Solid Gold Chain, Summer Beach Anklet",
    ["fish anklet", "fish charm", "little fish", "sea creature charm", "ocean anklet"],
    "A small round blue enamel fish with a gold eye, on a fine solid gold anklet chain.",
    "A small fish swimming around the ankle, one gold eye looking forward. Simple enough to read at a glance, odd enough to start a conversation.",
    "a small flat fish charm 9 mm long seen from the side, a plump rounded body with a short forked tail, filled with flat {blue} enamel inside a thin polished gold rim, one tiny round polished gold eye")

# ============================================================ 2 CITRUS (Energy Orange)
add("A05", "Citrus", "Orange Slice Anklet", ["orange"], 7, 0.45,
    "Orange Slice Anklet, Orange Enamel Citrus Charm on a Solid Gold Chain, Fruit Anklet",
    ["orange anklet", "citrus anklet", "fruit anklet", "orange slice charm", "summer fruit charm"],
    "A round orange slice in Energy Orange enamel, its segments drawn in gold, on a fine solid gold anklet chain.",
    "Late breakfast on a terrace: a slice of orange with its segments drawn in gold. Bright enough to wear with white linen all summer.",
    "a round citrus slice charm 7 mm, flat {orange} enamel divided into six segments by fine polished gold lines radiating from the centre, inside a polished gold rim")
add("A06", "Citrus", "Kumquat Anklet", ["orange"], 7, 0.45,
    "Kumquat Anklet, Tiny Orange Enamel Fruit Charm with Gold Leaf, Solid Gold Anklet",
    ["kumquat charm", "tiny fruit charm", "orange enamel charm", "citrus charm", "fruit anklet"],
    "A tiny oval kumquat in orange enamel with one gold leaf, on a fine solid gold anklet chain.",
    "A tiny fruit with one gold leaf, the kind you find in a bowl on a hotel terrace. Small, round and very orange.",
    "a small oval kumquat charm 7 mm filled with flat {orange} enamel inside a thin polished gold rim, with one small solid polished gold leaf beside a short gold stem at the top")
add("A07", "Citrus", "Sun Anklet", ["orange"], 7, 0.5,
    "Sun Anklet, Orange Enamel Sun Charm with Gold Rays, Dainty Solid Gold Anklet",
    ["sun anklet", "sun charm", "sunshine jewelry", "orange sun charm", "celestial anklet"],
    "An orange enamel sun with short gold rays on a fine solid gold anklet chain.",
    "The sun as a child would draw it: an orange disc with short gold rays. Worn low on the ankle, it catches every bit of light.",
    "a round sun charm 7 mm overall: a flat disc filled with {orange} enamel inside a polished gold rim, surrounded by twelve short solid polished gold rays")
add("A08", "Citrus", "Marigold Anklet", ["orange"], 8, 0.55,
    "Marigold Anklet, Orange Enamel Flower Charm on a Solid Gold Chain, Floral Anklet",
    ["flower anklet", "marigold charm", "orange flower charm", "floral anklet", "garden jewelry"],
    "A flat marigold in orange enamel with a gold centre, on a fine solid gold anklet chain.",
    "Marigolds grow in every summer pot around the Mediterranean. Ours is flat, eight petals around a gold centre.",
    "a flat flower charm 8 mm seen from above, a marigold with eight rounded petals in one ring, each petal a cell of flat {orange} enamel inside a thin polished gold rim, a small round polished gold centre")

# ============================================================ 3 SWEET (Pop Pink)
add("A09", "Sweet", "Ice Pop Anklet", ["pink"], 9, 0.55,
    "Ice Pop Anklet, Pink Enamel Popsicle Charm, Cute Solid Gold Summer Anklet",
    ["popsicle charm", "ice pop anklet", "pink anklet", "cute anklet", "summer treat charm"],
    "A pink enamel ice pop on a gold stick, hanging from a fine solid gold anklet chain.",
    "A popsicle from the beach kiosk, frozen in pink glass on a gold stick. It will not melt in the sun.",
    "an ice pop charm 9 mm: a rounded rectangle filled with flat {pink} enamel inside a thin polished gold rim, on a short flat solid polished gold stick")
add("A10", "Sweet", "Lollipop Anklet", ["pink", "cream"], 7, 0.45,
    "Lollipop Anklet, Pink and Cream Swirl Enamel Charm, Solid Gold Candy Anklet",
    ["lollipop charm", "candy anklet", "swirl charm", "pink candy charm", "sweet jewelry"],
    "A pink and cream enamel lollipop swirl on a fine solid gold anklet chain.",
    "A spiral of pink and cream, the oldest candy shape there is. The gold line between the colours makes it graphic instead of sweet.",
    "a round lollipop charm 7 mm overall: a flat disc with a single-turn spiral of alternating flat {pink} enamel and flat {cream} enamel separated by a fine polished gold spiral line, inside a polished gold rim, on a short gold stick")
add("A11", "Sweet", "Kiss Anklet", ["pink"], 7, 0.45,
    "Kiss Anklet, Pink Enamel Lips Charm on a Solid Gold Chain, Flirty Summer Anklet",
    ["lips charm", "kiss anklet", "lip print charm", "flirty anklet", "pink lips"],
    "A pink enamel lip print on a fine solid gold anklet chain.",
    "Every postcard ends with a kiss. This one is pink glass on gold, and it stays where you put it.",
    "a flat lip print charm 7 mm, two softly curved lips filled with flat {pink} enamel, divided across the middle by a fine polished gold line, inside a thin polished gold rim")
add("A12", "Sweet", "Peony Bud Anklet", ["pink"], 7, 0.45,
    "Peony Anklet, Pink Enamel Flower Bud Charm, Romantic Solid Gold Anklet",
    ["peony charm", "flower bud charm", "pink flower charm", "floral anklet", "romantic anklet"],
    "A closed peony bud in pink enamel on a short gold stem, on a fine solid gold anklet chain.",
    "A peony just before it opens, the best moment of the flower. Round, closed and pink, on a short gold stem.",
    "a closed peony bud charm 7 mm, a rounded bud filled with flat {pink} enamel with two fine polished gold petal lines, inside a thin polished gold rim, on a short polished gold stem with one small gold leaf")

# ============================================================ 4 MEADOW (Meadowland Green)
add("A13", "Meadow", "Four Leaf Clover Anklet", ["green"], 7, 0.45,
    "Four Leaf Clover Anklet, Green Enamel Lucky Charm on a Solid Gold Chain",
    ["clover anklet", "lucky charm", "four leaf clover", "green anklet", "luck jewelry"],
    "A four leaf clover in Meadowland Green enamel on a fine solid gold anklet chain.",
    "Luck you only find lying in the grass. Four leaves in meadow green, each in its own gold rim.",
    "a four leaf clover charm 7 mm, four rounded heart shaped leaves filled with flat {green} enamel inside thin polished gold rims, meeting at a small gold centre with a short gold stem")
add("A14", "Meadow", "Olive Sprig Anklet", ["green"], 10, 0.6,
    "Olive Branch Anklet, Green Enamel Olive Leaf Charm, Mediterranean Solid Gold Anklet",
    ["olive anklet", "olive branch", "leaf charm", "mediterranean", "botanical anklet"],
    "Two green enamel olive leaves and one gold olive on a fine solid gold anklet chain.",
    "Two leaves and one gold olive, the tree of every Mediterranean summer. Long and slim, it lies flat along the ankle.",
    "an olive sprig charm 10 mm: a short polished gold stem with two slim pointed leaves filled with flat {green} enamel inside thin polished gold rims and one small round solid polished gold olive")
add("A15", "Meadow", "Pea Pod Anklet", ["green"], 9, 0.55,
    "Pea Pod Anklet, Green Enamel Peas in a Pod Charm, Solid Gold Friendship Anklet",
    ["pea pod charm", "peas in a pod", "friendship anklet", "green pea charm", "garden charm"],
    "An open green enamel pea pod with three gold peas, on a fine solid gold anklet chain.",
    "A picnic in long grass and an open pod: three gold peas lined up in green glass. A small joke about the best kind of company.",
    "an open pea pod charm 9 mm, a slim curved pod filled with flat {green} enamel inside a thin polished gold rim, with three small round solid polished gold peas in a row along its open centre")
add("A16", "Meadow", "Tiny Frog Anklet", ["green"], 7, 0.5,
    "Frog Anklet, Green Enamel Frog Charm on a Solid Gold Chain, Cute Nature Anklet",
    ["frog anklet", "frog charm", "green frog charm", "nature anklet", "cute anklet"],
    "A small green enamel frog with gold eyes on a fine solid gold anklet chain.",
    "A frog from the edge of the pond, seen from above with two gold eyes. A little strange and very lucky, as frogs always are.",
    "a small frog charm 7 mm seen from above, a simple rounded body with four short legs, filled with flat {green} enamel inside a thin polished gold rim, two tiny round polished gold eyes")

# ============================================================ 5 TERRA (Clay)
add("A17", "Terra", "Amphora Anklet", ["clay"], 9, 0.55,
    "Amphora Anklet, Clay Enamel Greek Vase Charm, Mediterranean Solid Gold Anklet",
    ["amphora charm", "greek vase charm", "mediterranean", "clay enamel", "vase anklet"],
    "A slim amphora in Clay enamel with one gold band, on a fine solid gold anklet chain.",
    "The jar of every Mediterranean village, in the colour of the clay it was made from. One gold band at the shoulder, the way potters mark them.",
    "an amphora charm 9 mm, a slim jar with two small handles, filled with flat {clay} enamel inside a thin polished gold rim, one fine polished gold band across its shoulder")
add("A18", "Terra", "Sand Dollar Anklet", ["clay"], 7, 0.45,
    "Sand Dollar Anklet, Clay Enamel Seashell Charm, Beach Solid Gold Anklet",
    ["sand dollar", "sand dollar charm", "shell anklet", "beach anklet", "clay enamel"],
    "A round sand dollar in Clay enamel with its five petal mark in gold, on a fine solid gold anklet chain.",
    "The flat shell left on the sand at low tide, its five petal mark drawn in gold. Warm clay instead of white, so it looks sun-warmed.",
    "a round sand dollar charm 7 mm, flat {clay} enamel inside a polished gold rim with a five petal flower pattern drawn in fine polished gold lines at its centre")
add("A19", "Terra", "Cowrie Anklet", ["clay"], 7, 0.45,
    "Cowrie Shell Anklet, Clay Enamel Cowrie Charm on a Solid Gold Chain, Boho Anklet",
    ["cowrie anklet", "cowrie shell", "shell charm", "boho anklet", "beach jewelry"],
    "An oval cowrie shell in Clay enamel with its toothed slit in gold, on a fine solid gold anklet chain.",
    "Cowries were once used as money along the coasts of three continents. Ours is a small oval of clay coloured glass with its toothed slit drawn in gold.",
    "a cowrie shell charm 7 mm, an oval shell seen from its toothed side, flat {clay} enamel inside a thin polished gold rim, with a central slit drawn as a polished gold line edged by short gold ridges")
add("A20", "Terra", "Clay Pot Anklet", ["clay"], 7, 0.45,
    "Plant Pot Anklet, Clay Enamel Terracotta Pot Charm with Gold Sprout, Solid Gold",
    ["plant charm", "terracotta pot", "plant lover gift", "sprout charm", "new beginnings"],
    "A small terracotta pot in Clay enamel with one gold sprout, on a fine solid gold anklet chain.",
    "A small pot on a village windowsill with one gold sprout coming up. For someone who is just starting something.",
    "a small flower pot charm 7 mm, a tapered pot filled with flat {clay} enamel inside a polished gold rim with a gold lip, and one tiny solid polished gold sprout with two leaves growing from it")

# ============================================================ 6 TALISMAN (Luminous Blue + white)
add("A21", "Talisman", "Evil Eye Anklet", ["blue", "white"], 8, 0.5,
    "Evil Eye Anklet, Blue and White Enamel Nazar Charm on a Solid Gold Chain",
    ["evil eye anklet", "nazar charm", "protection charm", "evil eye charm", "turkish eye"],
    "A round blue and white enamel evil eye on a fine solid gold anklet chain.",
    "The nazar, worn for protection across Türkiye and the Mediterranean. Ours keeps it to a blue ring, a white centre and a gold pupil.",
    "a round evil eye charm 8 mm: an outer ring of flat {blue} enamel around a round centre of flat {white} enamel, separated by a thin polished gold ring, with a small round solid polished gold pupil in the middle of the white, inside a polished gold rim")
add("A22", "Talisman", "Hamsa Anklet", ["blue", "white"], 9, 0.55,
    "Hamsa Anklet, Blue Enamel Hamsa Hand Charm with Eye, Protection Gold Anklet",
    ["hamsa anklet", "hamsa hand", "protection anklet", "hand of fatima", "lucky hand charm"],
    "A blue enamel hamsa hand with a white eye at its centre, on a fine solid gold anklet chain.",
    "The open hand with one eye, an old sign of protection shared by many cultures around the sea. Blue, white and gold, nothing more.",
    "a hamsa hand charm 9 mm, an open symmetrical hand with the thumb and little finger turned slightly out, filled with flat {blue} enamel inside a thin polished gold rim, a small round {white} enamel eye with a polished gold rim at the centre of the palm")
add("A23", "Talisman", "Horseshoe Anklet", [], 7, 0.6,
    "Horseshoe Anklet, Solid Gold Lucky Horseshoe Charm, Dainty Good Luck Anklet",
    ["horseshoe anklet", "horseshoe charm", "lucky charm", "good luck anklet", "solid gold charm"],
    "A small solid gold horseshoe, open end up, on a fine solid gold anklet chain.",
    "Hung open end up, to keep the luck from running out. Solid gold, polished, with six tiny nail holes.",
    "a small horseshoe charm 7 mm in solid polished gold, open end facing up, with six tiny round nail holes, closed solid back")
add("A24", "Talisman", "Shooting Star Anklet", ["blue"], 10, 0.6,
    "Shooting Star Anklet, Gold Star Charm with Blue Enamel Tail, Wish Anklet",
    ["shooting star", "star anklet", "wish charm", "celestial charm", "star charm"],
    "A solid gold star with a blue enamel tail, on a fine solid gold anklet chain.",
    "A star with one blue trail behind it, for the wish you make on a summer night outside. The star is solid gold; only the tail is glass.",
    "a shooting star charm 10 mm: a small solid polished gold five pointed star with a curved tail sweeping behind it, the tail filled with flat {blue} enamel inside a thin polished gold rim")

# ============================================================ 7 GOLD SHORE (solid gold)
add("A25", "Gold Shore", "Starfish Anklet", [], 8, 0.75,
    "Starfish Anklet, Solid Gold Textured Starfish Charm, Dainty Beach Anklet",
    ["starfish anklet", "starfish charm", "sea star charm", "ocean jewelry", "beach jewelry"],
    "A small solid gold starfish with a fine dotted surface, on a fine solid gold anklet chain.",
    "The starfish the tide leaves behind, cast in solid gold with a fine dotted surface that catches the light.",
    "a small starfish charm 8 mm in solid polished gold, five gently tapered arms, the top covered in a fine dotted texture, closed solid back")
add("A26", "Gold Shore", "Sun Coin Anklet", [], 7, 0.7,
    "Sun Coin Anklet, Solid Gold Coin Charm with Sun Relief, Minimalist Anklet",
    ["coin anklet", "coin charm", "gold coin charm", "sun coin", "sun relief charm"],
    "A small solid gold coin with a sun in low relief, on a fine solid gold anklet chain.",
    "A small coin with a sun in low relief, like one found in the sand of an old harbour. Solid gold, no colour, all light.",
    "a small round coin charm 7 mm in solid polished gold with a raised sun face of short rays in low relief and a fine beaded border")
add("A27", "Gold Shore", "Spiral Shell Anklet", [], 8, 0.8,
    "Spiral Shell Anklet, Solid Gold Seashell Charm on a Fine Gold Chain",
    ["spiral shell", "gold shell charm", "seashell anklet", "shell anklet", "ocean anklet"],
    "A small spiral seashell in solid gold on a fine solid gold anklet chain.",
    "A small spiral shell picked up at the waterline, cast in solid gold so it keeps its curl forever.",
    "a small spiral sea shell charm 8 mm in solid polished gold, a turban shell with smooth whorls winding to a point, closed solid back")
add("A28", "Gold Shore", "Coral Branch Anklet", [], 10, 0.7,
    "Coral Branch Anklet, Matte Solid Gold Coral Charm, Ocean Inspired Anklet",
    ["coral anklet", "coral charm", "ocean anklet", "matte gold charm", "sea jewelry"],
    "A short coral twig in matte solid gold on a fine solid gold anklet chain.",
    "A short twig of coral washed up on the beach, in matte solid gold so it looks warm rather than shiny.",
    "a short coral branch charm 10 mm in solid gold with a soft matte finish, three small rounded twigs, closed solid back")

# ============================================================ 8 ORCHARD (Pop Pink + Meadowland Green)
add("A29", "Orchard", "Strawberry Anklet", ["pink", "green"], 7, 0.45,
    "Strawberry Anklet, Pink Enamel Strawberry Charm with Gold Seeds, Solid Gold Anklet",
    ["strawberry anklet", "strawberry charm", "fruit charm", "berry jewelry", "cute fruit anklet"],
    "A pink enamel strawberry with gold seeds and a green cap, on a fine solid gold anklet chain.",
    "The first fruit at the market stall, pink with tiny gold seeds and a green cap.",
    "a strawberry charm 7 mm, the berry filled with flat {pink} enamel dotted with tiny polished gold seeds, a small leafy cap filled with flat {green} enamel, thin polished gold rims")
add("A30", "Orchard", "Watermelon Anklet", ["pink", "green"], 9, 0.55,
    "Watermelon Anklet, Pink and Green Enamel Watermelon Slice Charm, Solid Gold",
    ["watermelon anklet", "watermelon charm", "fruit anklet", "summer fruit", "picnic jewelry"],
    "A pink and green enamel watermelon wedge with gold seeds, on a fine solid gold anklet chain.",
    "A wedge of watermelon at the end of a long beach day: pink flesh, green rind and seeds in gold.",
    "a watermelon wedge charm 9 mm, a triangle with a curved base: flat {pink} enamel flesh with tiny polished gold seeds and a band of flat {green} enamel rind along the curve, thin polished gold rims")
add("A31", "Orchard", "Pear Anklet", ["green"], 8, 0.5,
    "Pear Anklet, Green Enamel Pear Charm on a Solid Gold Chain, Fruit Anklet",
    ["pear charm", "pear anklet", "fruit charm", "green fruit charm", "orchard jewelry"],
    "A soft green enamel pear with a gold stem, on a fine solid gold anklet chain.",
    "A soft pear from the market, green glass with a short gold stem. Quiet among the brighter fruit.",
    "a pear charm 8 mm, filled with flat {green} enamel inside a thin polished gold rim, with a short solid polished gold stem and one small gold leaf")
add("A32", "Orchard", "Fig Anklet", ["clay", "pink"], 7, 0.45,
    "Fig Anklet, Clay and Pink Enamel Fig Charm with Gold Seeds, Solid Gold Anklet",
    ["fig charm", "fig anklet", "fruit charm", "mediterranean fig", "foodie jewelry"],
    "Half a fig in clay and pink enamel with gold seeds, on a fine solid gold anklet chain.",
    "A fig cut in half at the market stall: clay skin, pink inside, a few gold seeds.",
    "half a fig charm 7 mm, cut in section: a teardrop with a band of flat {clay} enamel skin around the edge and flat {pink} enamel flesh inside, a few tiny polished gold seeds in the centre, thin polished gold rims")

# ============================================================ 9 RIVIERA (Luminous Blue + white, lemon)
add("A33", "Riviera", "Parasol Anklet", ["blue", "white"], 9, 0.55,
    "Beach Umbrella Anklet, Blue and White Striped Enamel Parasol Charm, Solid Gold",
    ["parasol charm", "beach umbrella", "striped charm", "vacation anklet", "beach club"],
    "A blue and white striped enamel beach parasol on a fine solid gold anklet chain.",
    "Blue and white stripes over a beach club lounger. The pole is gold; the shade is glass.",
    "a beach parasol charm 9 mm, an open umbrella canopy seen from the side divided into four wedges alternating flat {blue} enamel and flat {white} enamel by fine polished gold lines, on a slim polished gold pole")
add("A34", "Riviera", "Lifebuoy Anklet", ["blue", "white"], 8, 0.5,
    "Lifebuoy Anklet, Blue and White Enamel Life Ring Charm, Nautical Gold Anklet",
    ["lifebuoy charm", "life ring charm", "nautical anklet", "sailor jewelry", "striped charm"],
    "A blue and white enamel life ring on a fine solid gold anklet chain.",
    "The striped ring on every beach club wall. Wear it as a small reminder to stay afloat.",
    "a round lifebuoy ring charm 8 mm with an open centre, divided into four sections alternating flat {blue} enamel and flat {white} enamel by fine polished gold lines, inside a polished gold rim")
add("A35", "Riviera", "Sardine Anklet", ["blue"], 10, 0.6,
    "Sardine Tin Anklet, Blue Enamel Sardine in a Gold Tin Charm, Fun Summer Anklet",
    ["sardine charm", "tinned fish", "sardine anklet", "foodie anklet", "quirky jewelry"],
    "A blue enamel sardine in an open solid gold tin, on a fine solid gold anklet chain.",
    "The tinned fish everyone is wearing this summer, in a polished gold tin with its lid rolled back. A small joke for the friend who always orders the sardines.",
    "an open sardine tin charm 10 by 6 mm: a rounded rectangle tin in polished gold with its lid rolled back at one end, inside it one slim sardine filled with flat {blue} enamel inside a thin polished gold rim")
add("A36", "Riviera", "Amalfi Lemon Anklet", ["lemon"], 8, 0.5,
    "Lemon Anklet, Yellow Enamel Amalfi Lemon Charm with Gold Leaf, Solid Gold Anklet",
    ["lemon anklet", "lemon charm", "amalfi jewelry", "citrus charm", "yellow charm"],
    "A yellow enamel lemon with one gold leaf, on a fine solid gold anklet chain.",
    "A lemon from the Amalfi coast with one gold leaf. Yellow is not a Riviera rule, it is a Riviera habit.",
    "a lemon charm 8 mm, an oval lemon with softly pointed ends filled with flat {lemon} enamel inside a thin polished gold rim, with one small solid polished gold leaf at the top")

# ============================================================ 10 GARDEN (solid gold + one accent)
add("A37", "Garden", "Honeybee Anklet", ["black"], 7, 0.5,
    "Bee Anklet, Solid Gold Honeybee Charm with Black Enamel Stripes, Garden Anklet",
    ["bee anklet", "bee charm", "honeybee charm", "garden jewelry", "nature anklet"],
    "A small solid gold honeybee with black enamel stripes, on a fine solid gold anklet chain.",
    "A small bee over the garden, its stripes in black glass and its wings in polished gold.",
    "a small honeybee charm 7 mm seen from above: a rounded solid polished gold body with two thin stripes of flat {black} enamel across it and two small polished gold wings, closed solid back")
add("A38", "Garden", "Ladybird Anklet", ["red"], 6, 0.4,
    "Ladybug Anklet, Red Enamel Ladybird Charm on a Solid Gold Chain, Lucky Anklet",
    ["ladybug anklet", "ladybug charm", "ladybird charm", "lucky charm", "cute anklet"],
    "A tiny red enamel ladybird with gold spots, on a fine solid gold anklet chain.",
    "A ladybird landing on your ankle, red with gold spots. Folk tales say it brings luck when it lands on you.",
    "a tiny ladybird charm 6 mm seen from above: a round back of flat {red} enamel divided down the middle by a fine polished gold line, with four tiny round polished gold dots and a small polished gold head")
add("A39", "Garden", "Snail Anklet", [], 7, 0.75,
    "Snail Anklet, Solid Gold Snail Charm, Slow Living Minimalist Anklet",
    ["snail anklet", "snail charm", "slow living", "garden charm", "solid gold charm"],
    "A small solid gold snail on a fine solid gold anklet chain.",
    "A snail crossing the garden path at its own pace. Solid gold, polished, a small reminder to slow down.",
    "a small snail charm 7 mm in solid polished gold, a spiral shell on a short smooth body with two tiny antennae, closed solid back")
add("A40", "Garden", "Scarab Anklet", [], 8, 0.8,
    "Scarab Anklet, Solid Gold Scarab Beetle Charm, Egyptian Good Luck Anklet",
    ["scarab anklet", "scarab charm", "beetle charm", "egyptian jewelry", "good luck anklet"],
    "A small solid gold scarab beetle on a fine solid gold anklet chain.",
    "The old luck beetle of the Nile, sculpted small in solid gold. A talisman that does not need any colour.",
    "a small scarab beetle charm 8 mm in solid gold seen from above, an oval body with a fine line down the back and short legs, closed solid back")

# ---------------------------------------------------------------- assembly
PROTOCOL = "anklet"   # must exist in lib/etsy/listing-protocol.ts (tests/listing-protocol.test.ts)
AXES = ["Karat", "Metal Color", "Anklet Length"]
CHAIN_LINE = ("Chain: 1.0 mm solid gold cable chain with spring ring clasp; the charm hangs from a gold jump "
              "ring at the centre; choose 9, 10 or 11 inches.")
FIT_LINE = ("Fit: measure around the ankle just above the bone and add half an inch to one inch for an easy drape. "
            "Most ankles take 9 or 10 inches.")
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. Add a gift message "
        "at checkout and it ships with the piece.")
CARE_EN = ("Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off "
           "for the gym, rinse it in fresh water after the sea or the pool and dry it with a soft cloth.")
CARE_GOLD = ("Care: solid gold does not tarnish. Rinse it in fresh water after the sea or the pool and dry it with a "
             "soft cloth to keep the polish.")
IMAGE_LINE = "The product image is a design visualization of the finished piece; the handmade piece may vary slightly."

PROMPT_EN = ("Studio product photograph of one fine jewelry anklet: a fine 1.0 mm solid gold cable chain laid in a "
             "loose curve, with one small charm hanging from a gold jump ring at the centre of the chain: {shape}. "
             "Solid polished 14K yellow gold with flat, glossy kiln-fired vitreous enamel set flush inside recessed "
             "cells, every cell framed by a thin polished gold rim; the enamel is perfectly flat and smooth, not domed, "
             "no gradient, no painted detail, no stones. Enamel colour: {colours}. The charm is small and delicate, "
             "true to scale against the fine chain; spring ring clasp visible at one end. Resting on warm off-white "
             "linen, soft diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, "
             "the charm in sharp focus, three-quarter view from slightly above, calm minimal composition. No props, "
             "no hands, no feet, no text, no logo, no packaging. Photorealistic high-end commercial jewelry "
             "photography, square format.")
PROMPT_GOLD = PROMPT_EN.replace(
    "Solid polished 14K yellow gold with flat, glossy kiln-fired vitreous enamel set flush inside recessed "
    "cells, every cell framed by a thin polished gold rim; the enamel is perfectly flat and smooth, not domed, "
    "no gradient, no painted detail, no stones. Enamel colour: {colours}. ",
    "Solid 14K yellow gold only, no enamel, no colour, no stones; real gold reflections. ")
assert PROMPT_GOLD != PROMPT_EN


def length_label(L):
    return f"{L} inches"


IMG = {}
img_json = HERE / "images.json"
if img_json.exists():
    IMG = {r["id"]: r for r in json.load(open(img_json))["images"]}

BAN = ["—", "–", "â"]
out, seen_titles, seen_sku = [], set(), set()
assert len(M) == 40 and len({m["id"] for m in M}) == 40
fams = {}
for m in M:
    fams.setdefault(m["fam"], []).append(m["id"])
assert len(fams) == 10 and all(len(v) == 4 for v in fams.values()), fams
assert sum(1 for m in M if not m["en"]) == 7  # 7 all-gold + honeybee (gold with one black accent)

for m in M:
    gold_only = not m["en"]
    pool = POOL_GOLD if gold_only else POOL_ENAMEL
    own = list(m["kw"])
    for t in pool:
        if len(own) == 10:
            break
        if t not in own and t not in SHARED_TAGS:
            own.append(t)
    tags = own + SHARED_TAGS
    assert len(tags) == 13 and len(set(tags)) == 13, (m["id"], tags)
    for t in tags:
        assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), (m["id"], t)
    assert len(m["title"]) <= 140 and m["title"] not in seen_titles, m["id"]
    seen_titles.add(m["title"])
    for c in m["en"]:
        assert "{" + c + "}" in m["shape"], (m["id"], c)
    colours = [EN[c][0] for c in m["en"]]
    material_line = ("Charm: solid gold, sculpted, with a closed back; no enamel." if gold_only else
                     f"Enamel: kiln-fired vitreous enamel in {' and '.join(colours)}, set flush in recessed cells with polished gold rims.")
    desc = "\n\n".join([
        m["lead"],
        m["story"],
        "\n".join([
            "Metal: solid 10K, 14K or 18K gold in yellow, white or rose.",
            material_line,
            f"Size: charm {m['size']} mm.",
            CHAIN_LINE,
            FIT_LINE,
        ]),
        SHIP,
        CARE_GOLD if gold_only else CARE_EN,
        IMAGE_LINE,
    ])
    for b in BAN:
        assert b not in desc + m["title"] + " ".join(tags), (m["id"], b)
    base_sku = f"BAS-SS-{m['id']}"
    variants = []
    for k in KARATS:
        for cc, cn in COLORS:
            for L in LENGTHS:
                sku = f"{base_sku}-{k}{cc}-{L}IN"
                assert len(sku) <= 32 and sku not in seen_sku, sku
                seen_sku.add(sku)
                variants.append({"sku": sku,
                                 "properties": {"Karat": k, "Metal Color": cn, "Anklet Length": length_label(L)},
                                 "grams": round(grams14(m, L) * DENSITY[k], 2),
                                 "price_cents": price_cents(m, k, L)})
    assert len(variants) == 27
    ref = next(v for v in variants if v["properties"]["Karat"] == "14K"
               and v["properties"]["Metal Color"] == "Yellow Gold"
               and v["properties"]["Anklet Length"] == length_label(REF_LEN))
    shape = m["shape"].format(**{c: EN[c][1] for c in EN})
    prompt = (PROMPT_GOLD if gold_only else PROMPT_EN).format(
        shape=shape, colours=", ".join(EN[c][1] for c in m["en"]))
    for b in BAN:
        assert b not in prompt, (m["id"], b)
    out.append({
        "id": m["id"], "family": m["fam"], "productType": "anklet", "name": m["name"],
        "productId": str(uuid.uuid5(NS, SOURCE + ":" + m["id"])), "sku": base_sku,
        "title": m["title"], "tags": tags,
        "materials": ["Solid gold"] if gold_only else ["Solid gold", "Vitreous enamel"],
        "description": desc, "enamel": colours, "goldOnly": gold_only, "dims": f"charm {m['size']} mm",
        "listingProtocol": PROTOCOL, "offersPersonalization": False, "variationAxes": AXES,
        "grams14Ref": round(grams14(m, REF_LEN), 2), "refPriceCents": ref["price_cents"],
        "variants": variants, "imagePrompt": prompt, "imageFile": f"{m['id']}.jpg",
        "imageUrl": IMG.get(m["id"], {}).get("url"), "imageSha256": IMG.get(m["id"], {}).get("sha256"),
        "params": {"charm_g14": m["g"]},
    })

basis = {"spotUsdOzt": SPOT_USD_OZT, "spotSource": "gold-api.com 2026-09-30T11:21Z", "loss": LOSS,
         "purity": PURITY, "densityVs14K": DENSITY, "laborUsd": LABOR, "markup": MARKUP,
         "chainGPerInch14K": CHAIN_G_PER_IN, "findingsG": FINDINGS_G, "lengthsIn": LENGTHS,
         "rule": "price = ceil(2 x ((charm_g + 0.2 + chain_g_per_in x length) x density_k x spot/31.1034768 x purity x 1.07 + labor) / 10) x 10",
         "laborSource": "owner 14K enamel bracelet quote (2027 set, 2026-09-27) minus its 14K gold at this spot",
         "status": "PROVISIONAL: no anklet quote yet; chain g/in and charm grams are UNCALIBRATED estimates"}
json.dump({"source": SOURCE, "org": ORG, "pricingBasis": basis, "items": out},
          open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
tot = sum(len(i["variants"]) for i in out)
print("items", len(out), "variants", tot, "labor", LABOR, "chain g/in", CHAIN_G_PER_IN)
for i in out:
    ps = [v["price_cents"] for v in i["variants"]]
    print(i["id"], i["name"], "ref", i["grams14Ref"], "g", i["refPriceCents"] // 100, "USD", "range",
          min(ps) // 100, max(ps) // 100, len(i["title"]))
