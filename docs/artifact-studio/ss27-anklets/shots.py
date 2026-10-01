"""10 sales images per anklet, each anklet in its own colour world (v2).

Run after catalog.py: python3 docs/artifact-studio/ss27-anklets/shots.py
Writes shots.json: {id: {"palette": {...}, "shots": [{slot, title, prompt}]}}.
Each prompt is one generation: nano_banana_2, 2k, 1:1, count 1, with that
anklet's approved linen hero (public/artifact/ss27-anklets/<id>.jpg) as the
only reference image. Slot 01 is a new hero in the colour world, so all ten
listing images share one palette; the linen hero stays the reference.

Owner direction (2026-10-01, moodboard of five studio leg shots): seamless
single-colour backdrops, legs and feet posed like sculpture (legs raised and
crossed, a foot rising from a plinth, legs over a rounded chair, a hand at
the ankle), footwear tone-on-tone with the wall or one contrast accent (red
toenails on violet). Every frame of one piece keeps the same colour tones.

Colour rules (research 2026-10-01):
1. Gold looks richest on deep jewel tones (burgundy, emerald, navy, plum,
   charcoal) and on warm mid-tones (apricot, blush, caramel); pale white or
   yellow grounds dull it, so no backdrop is white, cream or yellow.
2. An enamel charm gets a backdrop that is complementary or split
   complementary to its main enamel colour, so the enamel pops (blue charm on
   apricot, orange charm on periwinkle, green charm on blush).
3. A tonal (same hue) backdrop is allowed only with at least a 20 to 30 per
   cent value gap, so the charm keeps its edge (A10 pale blush vs pop pink).
4. The seven solid gold charms get the deepest grounds for maximum contrast.
5. One accent ties the frame to the charm: the mules and the nail polish
   echo an enamel colour, or stay nude when the enamel must stand alone.
6. Every footwear is an open-back mule or slide with no ankle strap, so the
   strap never covers the anklet.

Rules carried from docs/second-brain.md: take only the anklet from the
reference, never its framing or background; scale is a number plus a known
object; exactly one anklet, on the left ankle; five toes; no text, numbers or
rulers; slot 09 is a recolor visualization.
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]

# id: (backdrop name, hex, mule colour, nail polish, skin tone, why)
PAL = {
    "A01": ("soft apricot", "#EDB48E", "cobalt blue satin", "cobalt blue", "medium olive", "Complementary: warm apricot makes the cobalt wave and the gold glow."),
    "A02": ("burnt caramel", "#B9825A", "nude leather", "cobalt blue", "light warm", "Split complementary warm mid-tone; caramel deepens the gold, the blue shell is the only cool note."),
    "A03": ("dusty coral", "#E2927C", "white leather", "cobalt blue", "deep brown", "Coral sits opposite blue; the small drop needs strong hue contrast."),
    "A04": ("deep terracotta", "#A85A3E", "cobalt blue satin", "cobalt blue", "light warm", "Dark warm ground: the blue fish and the gold both read at thumbnail size."),
    "A05": ("periwinkle", "#8E95D8", "tangerine satin", "tangerine", "deep brown", "Complementary: orange slice on cool periwinkle."),
    "A06": ("turquoise aqua", "#5FB3B3", "nude leather", "tangerine", "medium olive", "Blue-green opposite orange; the gold leaf stays warm against the cool ground."),
    "A07": ("violet", "#6B5FA6", "tangerine satin", "red-orange", "light warm", "From the moodboard: violet with red-orange toes; violet is the complement of the orange-gold sun."),
    "A08": ("dusty blue", "#8FA9C4", "tangerine satin", "tangerine", "medium olive", "Soft complementary pair; the marigold reads as the warmest point in frame."),
    "A09": ("mint", "#BFE2CF", "hot pink satin", "hot pink", "medium olive", "Complementary: pop pink on pale green."),
    "A10": ("pale blush", "#F2D2D6", "hot pink satin", "hot pink", "deep brown", "Tonal like the moodboard pink set; the blush is about 30 per cent lighter than the pop pink so the swirl keeps its edge."),
    "A11": ("deep burgundy", "#5E1C28", "nude patent", "pop pink", "light warm", "Jewel tone: gold glows on burgundy and the pink lips read like lipstick."),
    "A12": ("sage", "#A8B796", "pop pink satin", "pop pink", "deep brown", "Complementary: pink bud on muted green, like a stem."),
    "A13": ("blush pink", "#ECC3C6", "emerald green satin", "emerald green", "light warm", "Complementary: green clover on blush; the green mules echo the leaves."),
    "A14": ("warm oatmeal stone", "#D6C6AC", "tan leather", "olive green", "medium olive", "Mediterranean neutral; the green leaves are the only colour."),
    "A15": ("dusty mauve", "#D6A7B5", "meadow green satin", "meadow green", "deep brown", "Red-violet opposite green; the pod reads clearly."),
    "A16": ("coral pink", "#EE9688", "emerald green satin", "emerald green", "medium olive", "Complementary and playful, made for a small green frog."),
    "A17": ("Aegean teal", "#3B7680", "terracotta leather", "terracotta", "light warm", "Teal is the complement of clay; the amphora reads as fired earth against the sea."),
    "A18": ("dusty sky blue", "#A7C1D3", "white leather", "nude", "deep brown", "Cool soft ground for a warm clay shell."),
    "A19": ("denim blue", "#4F6E91", "tan leather", "nude", "medium olive", "Mid blue opposite clay; the cowrie and gold stay warm."),
    "A20": ("eucalyptus grey-green", "#9FB3A8", "terracotta leather", "terracotta", "light warm", "Plant green for a clay pot with a gold sprout."),
    "A21": ("tobacco brown", "#6B4A35", "cobalt blue satin", "cobalt blue", "medium olive", "Dark warm ground: the blue and white eye is the brightest point."),
    "A22": ("dusty rose", "#D7A3A1", "cobalt blue satin", "cobalt blue", "deep brown", "Warm rose opposite blue; soft for an amulet."),
    "A23": ("deep emerald", "#1E5B44", "nude patent", "nude", "medium olive", "Solid gold on a jewel green: maximum gold contrast, classic luck colours."),
    "A24": ("midnight navy", "#1B2440", "nude patent", "cobalt blue", "light warm", "Night sky: the gold star and the blue trail shine on navy."),
    "A25": ("deep sea teal", "#1F5C66", "white leather", "white", "deep brown", "Solid gold on deep water, the starfish where it belongs."),
    "A26": ("terracotta red", "#A0412E", "nude leather", "nude", "light warm", "Warm earthen red makes the gold coin glow like late sun."),
    "A27": ("slate grey", "#7D8A94", "white leather", "white", "medium olive", "Neutral mid grey: no colour competes with the polished gold curl."),
    "A28": ("charcoal", "#2E2E30", "nude leather", "coral red", "light warm", "Near black for matte gold, the strongest contrast; coral toes echo the coral."),
    "A29": ("powder blue", "#BCD3E6", "strawberry red satin", "strawberry red", "deep brown", "Cool ground for a warm pink fruit; red mules echo the berry."),
    "A30": ("lilac", "#C6B4DD", "watermelon pink satin", "watermelon pink", "medium olive", "Cool lilac lets both the pink flesh and the green rind read."),
    "A31": ("peach", "#F1C6AE", "meadow green satin", "meadow green", "light warm", "Complementary warm ground for a green pear."),
    "A32": ("plum aubergine", "#55294A", "nude patent", "pop pink", "medium olive", "Fig colours: gold and pink glow on deep plum."),
    "A33": ("sunbaked orange", "#DE8656", "white leather", "cobalt blue", "deep brown", "Complementary: blue and white stripes on beach-club orange."),
    "A34": ("warm sand", "#D3B48D", "cobalt blue satin", "cobalt blue", "light warm", "Beach sand behind a striped life ring; blue is the only cool note."),
    "A35": ("tomato red", "#BF3F2E", "cobalt blue satin", "cobalt blue", "medium olive", "Tinned-fish red: the gold tin and the blue sardine pop."),
    "A36": ("Amalfi azure", "#2F62C4", "lemon yellow satin", "lemon yellow", "light warm", "Complementary: lemon yellow on Amalfi blue."),
    "A37": ("lavender", "#B4A3D4", "black leather", "black", "deep brown", "Bees and lavender; yellow-gold opposite violet, black echoes the stripes."),
    "A38": ("leaf green", "#5C8C4A", "red satin", "red", "light warm", "From the moodboard green set: red ladybird on leaf green."),
    "A39": ("deep moss", "#4F5B3A", "nude leather", "nude", "medium olive", "Solid gold snail on dark garden green."),
    "A40": ("lapis blue", "#26398A", "nude patent", "nude", "deep brown", "Egyptian lapis and gold, the scarab's own pairing."),
}
assert set(PAL) == {i["id"] for i in items}
assert len({p[1] for p in PAL.values()}) == 40, "every anklet gets its own backdrop"

# Story props for the postcard still life (slot 07), per family.
PROPS = {
    "Tide": "a sea-smoothed blue glass pebble and rippling water caustics of light",
    "Citrus": "half a fresh orange on a small cream glazed ceramic plate",
    "Sweet": "a small glass coupe holding one scoop of pink sorbet",
    "Meadow": "a few blades of fresh green grass and a small sprig of wild clover leaves",
    "Terra": "an unglazed terracotta saucer and a small piece of sun-bleached driftwood",
    "Talisman": "a plain cobalt blue glazed ceramic cup and a small brass dish",
    "Gold Shore": "two small natural white seashells and a scatter of fine pale sand",
    "Orchard": "a few fresh cherries and a small fresh fig",
    "Riviera": "a pair of tortoiseshell sunglasses folded beside it",
    "Garden": "a sprig of fresh rosemary and a few small green leaves",
}
assert {i["family"] for i in items} == set(PROPS)

CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper left with "
          "one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")


def charm(it):
    return it["imagePrompt"].split("centre of the chain: ", 1)[1].split(". Solid", 1)[0]


def scale(it):
    mm = int(it["dims"].split()[1])
    obj = "about as wide as a pencil is thick" if mm <= 8 else "about the width of the nail on a little finger"
    return f"the charm is only {mm} mm across, {obj}, and the chain is a 1 mm thread of gold, small against the ankle bone"


def world(it, slot):
    bg, hx, shoe, polish, skin, _ = PAL[it["id"]]
    base = f"Colour world, identical in every image of this listing: a seamless matte {bg} paper backdrop and floor ({hx})"
    if slot == "03-plinth":
        return f"{base}; the {polish} nail polish is the only accent; no shoes."
    if slot not in NO_PEOPLE:
        return f"{base}; the only accents are the {shoe} mules and the {polish} nail polish; nothing else adds colour."
    if slot == "07-postcard":
        return f"{base}; the props are the only other colour."
    if slot == "08-gift":
        return f"{base}; the {polish} ribbon is the only accent."
    return f"{base}; nothing but the anklet adds colour."


def style(it, slot):
    people = slot not in NO_PEOPLE
    finish = ("The charm is solid gold only, with no enamel, no colour and no stones." if it["goldOnly"] else
              "Enamel is perfectly flat, glossy and flush inside thin polished gold rims, never domed, no gradient, "
              "no painted detail, no stones.")
    look = "same sculpted shape and surface texture" if it["goldOnly"] else "same colours and cell layout, same thin polished gold rims"
    skin = " Natural skin texture visible." if people else ""
    return (f"{world(it, slot)} {CAMERA}{skin} The anklet must be an exact copy of the anklet in the reference image: same "
            f"charm outline, {look}, same fine 1.0 mm cable chain, same gold jump ring; do not redesign it, do not add "
            f"charms or stones; take only the anklet from the reference, never its linen background, camera angle or "
            f"framing. {finish} No text, no numbers, no logo, no watermark, no ruler. Square 1:1.")


def worn(it):
    skin = PAL[it["id"]][4]
    return (f"It is exactly one anklet, worn on the left ankle of a woman with {skin} skin; the charm rests on the outer "
            f"side of the ankle just below the ankle bone; the right ankle is bare; no second chain, no toe rings, no "
            f"other jewelry; anatomically correct feet with five toes each")


NO_PEOPLE = {"01-hero", "06-macro", "07-postcard", "08-gift", "09-metals"}


def slots(it):
    c = charm(it)
    bg, hx, shoe, polish, skin, _ = PAL[it["id"]]
    mule = f"{shoe} open-back mules with a low slim heel and no ankle strap"
    surface = "the polished and sculpted gold surface" if it["goldOnly"] else "the flat glossy enamel and its thin polished gold rim"
    out = [
        ("01-hero", "Hero in the colour world",
         f"Etsy thumbnail hero: this anklet with {c}, laid in a soft open curve directly on the seamless {bg} paper, "
         f"seen from above at a slight angle; the charm sits in sharp focus at the centre of the frame with generous "
         f"empty space all around, the spring ring clasp visible at one end, one clean soft shadow; no props."),
        ("02-legs-up", "Legs raised, crossed",
         f"Editorial leg shot after a fashion campaign: a woman lies back out of frame and raises both legs against the "
         f"{bg} wall, crossed at the shins, the left leg in front and closest to the camera, both feet pointed in "
         f"{mule}. {worn(it)}. Side view, cropped from the knees to the toes so the ankle is large in frame; {scale(it)}."),
        ("03-plinth", "Foot on a plinth",
         f"Surreal studio sculpture: a single bare left foot and ankle rising vertically out of a smooth cylindrical "
         f"plinth painted the same {bg} as the backdrop, toes pointed to the ceiling, toenails painted {polish}. "
         f"{worn(it)}. Clean and graphic, nothing else in the frame; {scale(it)}."),
        ("04-chair", "Over a sculptural chair",
         f"Seated styling: she sits deep in a rounded sculptural lounge chair in a slightly darker shade of {bg}, legs "
         f"extended over the rim and crossed at the ankle with the left ankle on top facing the camera, one {shoe} "
         f"mule hanging loosely from the toes; a crisp white shirt hem at the top edge. {worn(it)}. Side view, cropped "
         f"from the knees to the toes; {scale(it)}."),
        ("05-hand-at-ankle", "Hand at the ankle, scale",
         f"Scale shot: standing on the {bg} studio floor, she bends her left knee and rises onto the toes of her left "
         f"foot in a {shoe} mule, and her left hand rests lightly on the ankle as if adjusting it, the fingertips beside "
         f"the charm but never covering it, so the charm can be compared with a fingernail; short natural nails painted "
         f"{polish}. {worn(it)}. Cropped from the knee to the toes; {scale(it)}."),
        ("06-macro", "Macro detail",
         f"Macro detail: this anklet with {c}, lying on the seamless {bg} paper; the camera is a few centimetres above "
         f"at a slight angle so the charm and {surface} fill most of the frame, the jump ring and a few chain links "
         f"leading out of focus; one crisp highlight on the surface."),
        ("07-postcard", "Postcard still life",
         f"Postcard still life: this anklet with {c}, laid in a soft open curve on the seamless {bg} paper, the charm "
         f"in sharp focus; beside it {PROPS[it['family']]}; long clean shadows, seen from above at a slight angle; the "
         f"anklet is the only piece of jewelry in the frame and the props stay smaller in importance than the charm."),
        ("08-gift", "Gift moment",
         f"Gift moment: this anklet with {c}, coiled inside an open small square jewelry box in a lighter shade of {bg}, "
         f"lined with natural undyed linen, standing on the seamless {bg} paper, a thin silk ribbon in {polish} loose "
         f"beside the box; the box has no logo and no text."),
        ("09-metals", "Three gold colours",
         f"Metal colour visualization: three identical copies of this exact anklet with {c}, laid side by side in three "
         f"parallel soft curves on the seamless {bg} paper, same size and same angle: left in yellow gold, centre in "
         f"white gold (cool silvery white), right in rose gold (soft pink gold); "
         + ("the charm shape is identical in all three." if it["goldOnly"] else "the enamel colours are identical in all three.")),
        ("10-in-step", "In step",
         f"Movement: she walks across the {bg} studio floor in {mule}, seen from the side at ankle height, the back heel "
         f"lifting mid-stride and the chain swinging slightly while the charm stays sharp; soft motion blur only on the "
         f"trailing foot. {worn(it)}. Cropped from mid-calf to the floor; {scale(it)}."),
    ]
    rows = []
    for slot, title, text in out:
        if slot in NO_PEOPLE:
            text += " No people and no hands in the frame."
        prompt = f"{text} {style(it, slot)}"
        for bad in ("—", "–", "â", "linen throw", "loose curve on linen"):
            assert bad not in prompt, (it["id"], slot, bad)
        assert hx in prompt, (it["id"], slot)
        rows.append({"slot": slot, "title": title, "prompt": prompt})
    assert len(rows) == 10
    return rows


out = {}
for it in items:
    bg, hx, shoe, polish, skin, why = PAL[it["id"]]
    out[it["id"]] = {"palette": {"backdrop": bg, "hex": hx, "mules": shoe, "polish": polish, "skin": skin, "why": why},
                     "shots": slots(it)}
assert len(out) == 40 and sum(len(v["shots"]) for v in out.values()) == 400
json.dump(out, open(HERE / "shots.json", "w"), indent=1, ensure_ascii=False)
lens = [len(r["prompt"]) for v in out.values() for r in v["shots"]]
print(len(out), sum(len(v["shots"]) for v in out.values()), "prompts", min(lens), max(lens), "chars")
