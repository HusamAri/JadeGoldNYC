"""9 sales images per anklet (slots 02-10; slot 01 is the approved hero).

Run after catalog.py: python3 docs/artifact-studio/ss27-anklets/shots.py
Writes shots.json: {id: [{slot, title, prompt}]}. Each prompt is one
generation: nano_banana_2, 2k, 1:1, count 1, with that anklet's hero
(public/artifact/ss27-anklets/<id>.jpg) as the only reference image.

Research (2026-10-01): Etsy rewards using all 10 slots with a varied story
(hero, on-model scale, lifestyle, macro, scale, gift, options); the thumbnail
is slot 01 and stays the linen hero. Anklets have moved from beach-only to
year-round (worn with flats and sandals), and the lead style is one fine
chain with one charm. So the set shows the anklet worn three ways (studio,
pool edge, ballet flats), in motion, in the hand for scale, in macro, as a
colour-blocked postcard still life of its family, as a gift and in the
three metal colours.

Rules carried from docs/second-brain.md:
- take only the piece from the reference, never its framing (Willow/Comet);
- scale is a number plus a known object, never "true scale" alone (Comet);
- exactly one anklet on one ankle, the other foot bare: a scene line can
  otherwise add a second product (FW E07 lesson);
- feet are described anatomically (five toes), like the finger rule;
- no text, no numbers, no ruler in the frame: a printed measurement is a
  claim, never left to the model;
- slot 09 is a recolor visualization; the description already says images
  are design visualizations.
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]

# Per family: skin tone (rotated so the shop shows more than one), the
# postcard set colour and props for slot 07, and the gift ribbon colour.
FAM = {
    "Tide": ("medium olive", "a smooth plaster block washed in pale cobalt blue",
             "a sea-smoothed blue glass pebble and rippling water caustics of light falling across the plaster", "cobalt blue"),
    "Citrus": ("deep brown", "a smooth plaster block washed in soft apricot orange",
               "half a fresh orange on a small cream glazed ceramic plate", "burnt orange"),
    "Sweet": ("light warm", "a smooth plaster block washed in pale bubblegum pink",
              "a small glass coupe holding one scoop of pink sorbet", "pale pink"),
    "Meadow": ("medium olive", "a smooth plaster block washed in pale sage green",
               "a few blades of fresh green grass and a small sprig of wild clover leaves", "sage green"),
    "Terra": ("deep brown", "a smooth plaster block washed in warm terracotta clay",
              "an unglazed terracotta saucer and a small piece of sun-bleached driftwood", "terracotta"),
    "Talisman": ("light warm", "a whitewashed plaster block with a band of soft blue shadow",
                 "a plain cobalt blue glazed ceramic cup and a small brass dish", "cobalt blue"),
    "Gold Shore": ("medium olive", "fine pale sand on a warm sandstone slab",
                   "two small natural white seashells and the soft shadow of a palm leaf", "natural undyed cotton"),
    "Orchard": ("deep brown", "a smooth plaster block washed in soft blush pink",
                "a few fresh cherries and a small fresh fig on a pale linen napkin", "blush pink"),
    "Riviera": ("light warm", "the corner of a blue and white striped cotton beach towel on pale stone",
                "a pair of tortoiseshell sunglasses folded beside it", "cobalt blue"),
    "Garden": ("medium olive", "a smooth pale limestone slab beside the rim of a terracotta pot",
               "a sprig of fresh rosemary and a few small green leaves", "olive green"),
}
assert {i["family"] for i in items} == set(FAM), "every family needs a style row"

CAMERA = ("Shot on a Canon 50 mm lens at f/2, ISO 400, natural light only, fine 35 mm film grain, "
          "true colour, no heavy retouching.")


def charm(it):
    return it["imagePrompt"].split("centre of the chain: ", 1)[1].split(". Solid", 1)[0]


def size_mm(it):
    return int(it["dims"].split()[1])


def scale(it):
    mm = size_mm(it)
    obj = "about as wide as a pencil is thick" if mm <= 8 else "about the width of the nail on a little finger"
    return f"the charm is only {mm} mm across, {obj}, and the chain is a 1 mm thread of gold"


def piece(it):
    c = charm(it)
    if it["goldOnly"]:
        finish = "The charm is solid gold only, with no enamel, no colour and no stones."
    else:
        finish = ("Enamel is perfectly flat, glossy and flush inside thin polished gold rims, never domed, "
                  "no gradient, no painted detail, no stones.")
    return c, finish


def style(it, people):
    _, finish = piece(it)
    skin = " Natural skin texture visible." if people else ""
    look = ("same sculpted shape and surface texture" if it["goldOnly"]
            else "same colours and cell layout, same thin polished gold rims")
    return (f"{CAMERA}{skin} The anklet must be an exact copy of the anklet in the reference image: same charm outline, "
            f"{look}, same fine 1.0 mm cable chain, same gold "
            f"jump ring; do not redesign it, do not add charms or stones; take only the anklet from the reference, "
            f"never its background, camera angle or framing. {finish} No text, no numbers, no logo, no watermark, "
            f"no ruler, no packaging print. Square 1:1.")


def worn(it):
    skin = FAM[it["family"]][0]
    return (f"It is exactly one anklet, worn on the left ankle of a woman with {skin} skin; the charm rests on the outer "
            f"side of the ankle just below the ankle bone; the right foot and ankle are bare; no second chain, no "
            f"toe rings, no other jewelry; anatomically correct feet with five toes each, neatly trimmed natural "
            f"toenails")


NO_PEOPLE = {"04-macro", "07-postcard", "08-gift", "09-metals"}


def slots(it):
    c, _ = piece(it)
    skin, set_, props, ribbon = FAM[it["family"]]
    name = it["name"].lower()
    surface = "the polished and sculpted gold surface" if it["goldOnly"] else "the flat glossy enamel and its thin polished gold rim"
    out = [
        ("02-on-ankle", "On the ankle, studio",
         f"This anklet with {c}. {worn(it)}. The bare foot rests on a warm off-white linen throw, seen from the "
         f"side at ankle height, cropped from mid-calf to toes, the charm in sharp focus and the background soft; "
         f"{scale(it)}, small against the ankle bone."),
        ("03-in-hand", "Scale in the hand",
         f"Scale shot: this anklet with {c}, the chain draped over the open palm of a woman's hand with {skin} "
         f"skin, the charm lying in the centre of the palm and the clasp hanging off the side; {scale(it)}; the "
         f"thumb and fingers relaxed and fully visible, short natural nails; plain warm linen background."),
        ("04-macro", "Macro detail",
         f"Macro detail: this anklet with {c}, lying on warm off-white linen; the camera is a few centimetres "
         f"above at a slight angle so the charm and {surface} fill most of the frame, the jump ring and a few "
         f"chain links leading out of focus; one soft window reflection on the surface."),
        ("05-poolside", "Pool edge, hard sun",
         f"Summer editorial: this anklet with {c}. {worn(it)}. Both bare feet stand on the sun-warmed pale "
         f"limestone edge of a swimming pool, a sliver of clear turquoise water at the top of the frame; hard "
         f"midday sun casts crisp graphic shadows; seen from above, cropped from the shins to the toes; "
         f"{scale(it)}."),
        ("06-ballet-flats", "Year round, with flats",
         f"Everyday styling: this anklet with {c}. {worn(it)}. She sits on a bistro chair with the left foot "
         f"slightly forward so the left ankle faces the camera, wearing cropped wide-leg ecru linen trousers that stop above the ankle and soft cream leather "
         f"ballet flats with no logo; terracotta tile floor and dappled shade; seen from the side at ankle "
         f"height; {scale(it)}."),
        ("07-postcard", "Postcard still life",
         f"Colour-blocked postcard still life: this anklet with {c}, laid in a soft open curve on {set_}, the "
         f"charm in sharp focus; beside it {props}; late afternoon sun from one side with long clean shadows, "
         f"seen from above at a slight angle; the anklet is the only piece of jewelry in the frame and the props "
         f"are smaller in importance than the charm."),
        ("08-gift", "Gift moment",
         f"Gift moment: this anklet with {c}, coiled inside an open small square jewelry box lined with natural "
         f"undyed linen on a pale oak table, a thin {ribbon} silk ribbon loose beside the box, soft morning "
         f"light; the box has no logo and no text."),
        ("09-metals", "Three gold colours",
         f"Metal colour visualization: three identical copies of this exact anklet with {c}, laid side by side "
         f"in three parallel soft curves on warm off-white linen, same size and same angle: left in yellow gold, "
         f"centre in white gold (cool silvery white), right in rose gold (soft pink gold); "
         + ("the charm shape is identical in all three" if it["goldOnly"] else "the enamel colours are identical in all three")
         + "; even soft daylight from above."),
        ("10-in-step", "In motion",
         f"Movement: this anklet with {c}. {worn(it)}. She steps up pale stone steps in flat tan leather thong "
         f"sandals, seen from behind and slightly to the side at ankle height, warm late-afternoon light, the "
         f"chain swinging slightly with the step while the charm stays sharp; {scale(it)}."),
    ]
    rows = []
    for slot, title, text in out:
        text += " No people and no hands in the frame." if slot in NO_PEOPLE else ""
        prompt = f"{text} {style(it, slot not in NO_PEOPLE)}"
        for bad in ("—", "–", "â", "loose curve on linen", "laid in a loose curve,"):
            assert bad not in prompt, (it["id"], slot, bad)
        assert "#" not in prompt or not it["goldOnly"], (it["id"], slot)
        rows.append({"slot": slot, "title": title, "prompt": prompt})
    assert len(rows) == 9
    return rows


shots = {it["id"]: slots(it) for it in items}
assert len(shots) == 40 and sum(len(v) for v in shots.values()) == 360
json.dump(shots, open(HERE / "shots.json", "w"), indent=1, ensure_ascii=False)
lens = [len(r["prompt"]) for v in shots.values() for r in v]
print(len(shots), sum(len(v) for v in shots.values()), "prompts", min(lens), max(lens), "chars")
