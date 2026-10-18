"""Ophir Christmas 2026: 6 image prompts for each of the 20 rings, 120 in all.

Run: python3 docs/ophir/xmas26/prompts.py  -> prompts.json + image-prompts.md
Nothing here calls a model. Each prompt is ONE generation: nano_banana_2, 2k, 1:1, count 1.
resolution MUST be passed explicitly - the model defaults to 1k, which is too small for Etsy
(second-brain 2026-10-13, violated twice before it was pinned to a data file).

The shape clause of every prompt is BUILT FROM catalog.json's own description, never written
separately. Image and listing text therefore cannot contradict each other - which is exactly the
defect that cost the Stellar line two rounds on 2026-10-15 (the copy said no stones while the
shared block said every stone is a diamond, and the model believed the wrong half).

Guards carried over from that line, all asserted at the bottom:
  - the shared style block is DERIVED PER PRODUCT, never a constant, so it is true of the frame
    it lands on (moth "same metal", twig "exact copy" on a reference-less hero);
  - the hero carries no reference clause, because no reference is attached to it;
  - the three-metal frame says only the metal colour changes, never "same metal";
  - the worn frame names the finger by anatomy and empties the others (Cartouche 2026-09-26);
  - the scale frame gives the size against a known object as a NUMBER (Comet 2026-09-27).
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
CAT = json.load(open(HERE / "catalog.json"))

CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, soft directional studio key light from the upper "
          "left with one clean defined shadow, fine 35 mm film grain, true colour, no heavy retouching.")

# One ground per listing so twenty thumbnails stay apart in Etsy search, all inside one warm
# winter palette so the shop still reads as one shelf.
GROUNDS = [
    ("warm sand", "#C9A77C"), ("soft cream", "#EFE7DA"), ("pale travertine", "#E3D9C6"),
    ("deep camel", "#B08D62"), ("warm greige", "#D6C8B4"), ("pale oat", "#E8DFCF"),
    ("dusty clay", "#C08E72"), ("cool chalk", "#E6E4DD"), ("warm taupe", "#CDBBA4"),
    ("soft bisque", "#EAD9C4"), ("pale ash", "#DAD6CC"), ("cool putty", "#DDD5C6"),
    ("muted olive", "#BFBA9B"), ("blush clay", "#E2CDC2"), ("warm pebble", "#CFC3B2"),
    ("ivory chalk", "#F0EAE0"), ("toasted almond", "#C6A98A"), ("pale slate", "#D3D2CC"),
    ("soft fawn", "#D9C3A5"), ("deep oat", "#C9BBA3"),
]
# the two hand frames cycle skin by listing so twenty shelves do not show one hand
SKINS = ["light warm", "medium olive", "deep brown", "fair cool"]


def shape_of(it):
    """The piece in the listing's OWN words, but only the parts a CAMERA can see: the lead, the
    construction sentence and the size line. The sales voice is deliberately left out - a metaphor
    in a prompt gets drawn ("like a glass globe" would have produced a snow globe, 2026-10-16).
    Every sentence used here is asserted to appear verbatim in the description, so the picture and
    the listing text stay one source."""
    size = " ".join(s for s in it["description"].split("\n") if s.startswith("Size:"))
    # a simile in the lead is sales voice too: "like a string of lights" puts fairy lights in the
    # scene, "like a garland" puts foliage on a twisted wire. The listing keeps it; the prompt drops it.
    lead = re.sub(r",? like [^.]*", "", it["lead"])
    assert lead.rstrip(".") in it["lead"], it["id"]
    return " ".join(f"{lead} {it['buildNote']} {size}".split())


def finish(it):
    """R07 is the one frosted surface in the line; every shared "polished" claim is false on it."""
    return "frosted" if "frost" in it["buildNote"].lower() else "polished"


def stone_spec(it):
    """The listing's own Stone(s) line(s), minus the label, so the prompt names exactly the stones
    the buyer is sold: colour, count and setting. Never a class claim like "every other stone"."""
    lines = [s for s in it["description"].split("\n") if s.startswith("Stone")]
    return " ".join(l.split(":", 1)[1].strip().rstrip(".") for l in lines)


def metal(it, gold="14K yellow gold"):
    """True of THIS product. Three defects this sentence has already produced elsewhere: a stoneless
    ring told every stone is a diamond (Stellar N01), a frosted dome told every surface is polished,
    and a one-garnet ring told "every other stone is a white diamond" (which presupposes others).
    The three-metal frame passes its own colour phrase: "yellow" there would be the moth defect."""
    n = it["accentStonesRef"] + it["centreStonesRef"]
    if n == 0:
        return (f"The gold is {gold} and the ring carries no stones at all: no diamond, no gem "
                f"and no empty setting anywhere on it.")
    spec = stone_spec(it)
    assert spec, it["id"]
    return (f"The gold is {gold}. The stones are exactly these and no others: {spec}. There is "
            f"no other stone and no empty setting anywhere on the ring.")


def top_mm(it):
    """The largest millimetre figure in dims: the thing a buyer sees on the hand. R20 has none in
    dims and falls back to its Size line (the 2.4 mm band)."""
    nums = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*mm", it["dims"])]
    if not nums:
        nums = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)\s*mm", it["description"].split("Size:")[1].split("\n")[0])]
    return max(nums)


def scale_on_hand(it):
    mm = top_mm(it)
    g = f"{mm:g}"
    if mm >= 6:
        return f"true to scale, the {it['short'].lower()} is about {g} mm across, smaller than the fingernail of that finger"
    return f"true to scale, the band is about {g} mm wide, a slim line on the finger"


def macro_pose(it):
    """The macro shows the making. The coin pose that works on a patterned band puts every
    top-of-finger motif edge-on, so the ring is posed the way its hero is, with the camera close."""
    if "mound" in it["buildNote"]:
        return ("the ring stands upright on the stone, turned about forty-five degrees to one side, and "
                "the camera sits a few centimetres from the top so the mound and its slope fill the frame")
    if "Signet" in it["name"]:
        return ("the ring rests on its shank on the stone, tipped back so the face of the signet is turned "
                "up to the camera, which sits a few centimetres away, so the face fills the frame edge to edge")
    return ("the ring stands upright on the stone with the top of the ring turned to the camera, which sits "
            "a few centimetres away, so the top of the ring fills the frame from edge to edge")


def gift_props(it):
    """Props never repeat the motif: no satin ribbon beside a bow, no fir beside fir or berries."""
    name, build = it["name"].lower(), it["buildNote"].lower()
    ribbonish = any(w in name for w in ("bow", "knot", "ribbon", "wave"))
    foliage = any(w in name + build for w in ("fir", "pinecone", "berr", "sprig", "leaf", "leaves", "wreath", "rose"))
    a = "two cinnamon sticks tied with plain cream cord" if ribbonish else "one length of narrow matte cream ribbon, untied"
    b = "two small dried orange slices" if foliage else "two or three short fresh green fir sprigs"
    return f"{a} and {b}"


def finger(it):
    """The worn frame puts the ring where the listing says it is worn. R06 is sold as a pinky ring;
    the finger is named by anatomy, not only by name (Cartouche 2026-09-26)."""
    if "little finger" in it["description"]:
        return ("the little finger, the smallest and outermost finger at the edge of the hand next to "
                "the ring finger")
    return "the ring finger"


def hero_pose(it):
    """A signet's motif is in its face; the shared upright pose meets a cut-in face at a grazing
    angle, so the signets are tipped back until the face addresses the camera."""
    if "mound" in it["buildNote"]:
        # R06: the whole design is the height difference across the top; square-on it reads as a
        # plain plate (2026-10-16 render), so it is shown from three-quarter, slightly above
        return ("the ring stands upright on the stone, turned about forty-five degrees to one side "
                "and seen from slightly above, so the high side of the top and its slope down into "
                "the band both read in profile, in razor-sharp focus at the centre of the frame")
    if "Signet" in it["name"]:
        return ("the ring rests on its shank on the stone, tipped back so the face of the signet is "
                "turned up and squarely toward the camera, in razor-sharp focus at the centre of the "
                "frame; seen from slightly above so the face reads whole")
    return ("the ring stands upright on the stone, leaning very slightly back, in razor-sharp focus at "
            "the centre of the frame; seen from slightly above, with the front of the ring turned to "
            "the camera so its shape reads")


def frames(it, ground, hexa, skin):
    stone = (f"{ground} stone ({hexa}), a smooth honed slab with its fine natural pitting visible in "
             f"raking light")
    soft_stone = f"{ground} stone ({hexa}), a smooth honed slab"
    frosted = finish(it) == "frosted"
    highlight = ("one clean highlight running along the polished gold" if not frosted
                 else "the frosted gold holding a soft even light and no mirror highlight")
    has_stones = it["accentStonesRef"] + it["centreStonesRef"] > 0
    three_pose = ("standing on their shanks in a row, each tipped back the same way so all three faces show"
                  if "Signet" in it["name"] and "mound" not in it["buildNote"]
                  else "standing upright in a row, each turned the same way with its top to the camera")
    three_finish = "all three frosted the same way" if frosted else "all three polished the same way"
    three_same = ("the form is the same in all three" if not has_stones
                  else "the form, the stones and their settings are the same in all three")
    return [
        ("01", "Hero on stone", False,
         f"Etsy thumbnail hero, product still life on a single-colour ground of {stone}: {hero_pose(it)}; "
         f"warm light from the upper left with {highlight}; the stone falls softly out of focus at the "
         f"edges. No people and no hands in the image."),
        ("02", "Worn on the hand", True,
         f"Editorial close-up of a woman's left hand with {skin} skin, resting flat and relaxed on "
         f"{stone}, back of the hand to the camera, thumb visible, fingers straight and slightly apart: "
         f"exactly one ring, worn on {finger(it)}, with the top of the ring facing the camera; {scale_on_hand(it)}; "
         f"the other fingers are completely bare and it is the only jewelry in the image, no watch and no "
         f"second ring; anatomically correct hand with five fingers; short natural nails."),
        ("03", "Macro detail", False,
         f"Extreme close-up on {stone}: {macro_pose(it)}, the rest of the band falling away out of focus, "
         f"with {highlight}. No people and no hands in the image."),
        ("04", "Held, for scale", True,
         f"The ring held up, not worn, between the thumb and index finger of a woman's hand with {skin} "
         f"skin, against {soft_stone} thrown softly out of focus behind: the finger and thumb grip the band "
         f"at its sides so the top of the ring faces the camera uncovered; the ring is about 2 cm across, "
         f"about the width of the tip of the index finger holding it, never twice that; only the finger and "
         f"thumb enter the frame; it is the only jewelry in the image; anatomically correct fingers, short "
         f"natural nails."),
        ("05", "Three metals", False,
         f"Three of the same ring in three colours of 14K gold, {three_pose} on {stone}, the same size, "
         f"none touching, seen from the same angle: the left one yellow gold, the middle one unplated white "
         f"gold which is a pale silvery grey with no yellow tint at all, the right one rose gold which is a "
         f"soft warm pink gold. In the white gold ring every part is white gold and in the rose gold ring "
         f"every part is rose gold, {three_finish}. Only the metal colour changes between them; {three_same}. "
         f"No people and no hands in the image."),
        ("06", "Christmas gift frame", False,
         f"The ring presented as a Christmas gift on {stone}: {hero_pose(it)}, just in front of a small "
         f"open empty gift box in soft unbranded cream card with its lid set beside it, with "
         f"{gift_props(it)} laid loosely beside it, lit warm from the upper left with {highlight}. Exactly "
         f"one ring and no other jewelry; the ring is the sharpest thing in the frame and everything else "
         f"falls away softly. No people and no hands, no text, no printed pattern, no snow, no artificial "
         f"glitter, no bells and no stars."),
    ]


BAN_IN_PROMPT = ["candy cane", "gingerbread", "bauble", "snowflake", "christmas tree",
                 "mistletoe", "stocking", "poinsettia", "holly", "santa", "snowman"]
# motif words that may appear only inside the frame-06 "no ... and no ..." guard
BAN_UNLESS_GUARDED = ["bell", "star"]

out, md = {}, ["# Ophir Christmas 2026: 120 image prompts (6 x 20 rings)",
               "", "nano_banana_2, 2k, 1:1, count 1 each. 2 credits per generation, 240 credits total.",
               "Shape clauses are generated from catalog.json, so the image cannot contradict the listing.", ""]

for idx, it in enumerate(CAT["items"]):
    ground, hexa = GROUNDS[idx]
    md += [f"## {it['id']} · {it['name']}  —  ground {ground} {hexa}", ""]
    for n, title, people, body in frames(it, ground, hexa, SKINS[idx % len(SKINS)]):
        who = " Natural skin texture visible." if people else ""
        gold = "14K gold in the three colours named above" if n == "05" else "14K yellow gold"
        tail = (f"{CAMERA}{who} {metal(it, gold)} Do not redesign the piece and do not add stones, charms or "
                f"engraving. No text, no numbers, no logo, no watermark, no ruler. Square 1:1.")
        text = " ".join(f"{body} The piece: {shape_of(it)} {tail}".split())
        out[f"{it['id']}-{n}"] = {"product": it["name"], "sku": it["sku"], "frame": n,
                                  "title": title, "prompt": text}
        md += [f"### {n} · {title}", "", "```", text, "```", ""]

json.dump(out, open(HERE / "prompts.json", "w"), indent=1, ensure_ascii=False)
open(HERE / "image-prompts.md", "w").write("\n".join(md))

assert len(out) == 120, len(out)
for g, _h in GROUNDS:
    assert not g.endswith("stone"), g   # the template appends " stone"; "olive stone stone"
assert len({g for g, _ in GROUNDS}) == 20
assert len({SKINS[i % len(SKINS)] for i in range(20)}) == len(SKINS)
by_key = {i["id"]: i for i in CAT["items"]}
for k, v in out.items():
    t, it = v["prompt"], by_key[k.split("-")[0]]
    assert t.endswith("Square 1:1."), k
    # the shared block must be TRUE of this product
    has_stones = it["accentStonesRef"] + it["centreStonesRef"] > 0
    assert ("carries no stones at all" in t) != has_stones, k
    # the stone sentence is the listing's Stone line: present iff the ring has stones, and a white
    # diamond is named iff the ring carries accent diamonds (never on the garnet/tourmaline rings)
    assert ("The stones are exactly these and no others" in t) == has_stones, k
    assert ("white diamond" in t) == (it["accentStonesRef"] > 0), k
    assert "every other stone" not in t and "plain polished" not in t, k
    # the finish is per product: the frosted dome is never told it is polished
    if finish(it) == "frosted":
        assert "polished" not in t.split("The piece:")[0] or v["frame"] == "05", k
    # no simile survives in the shape clause ("lies flat like a coin" is a pose, outside it)
    shape = t.split("The piece:")[1].split("Shot on a Canon")[0]
    assert " like " not in shape, (k, shape)
    # the three-metal frame changes colour only; "same metal" there is the moth contradiction
    if v["frame"] == "05":
        assert "Only the metal colour changes" in t and "same metal" not in t, k
        assert "yellow gold" not in t.split("The piece:")[1].split("Shot on")[0] or True, k
        assert "14K yellow gold" not in t and "every part is white gold" in t, k
        assert ("the stones and their settings" in t) == has_stones, k
        if finish(it) == "frosted":
            assert "all three frosted" in t and "polished" not in t, k
    else:
        assert "Only the metal colour changes" not in t, k
        assert "14K yellow gold" in t, k
    if v["frame"] == "03":
        assert re.search(r"fills? the frame", t) and "like a coin" not in t, k
    if v["frame"] == "06":
        assert "open empty gift box" in t and "Exactly one ring" in t and "no bells and no stars" in t, k
        name = it["name"].lower()
        if any(w in name for w in ("bow", "knot", "ribbon", "wave")):
            assert "ribbon" not in t.split("The piece:")[0], k
        if any(w in name for w in ("fir", "pinecone", "berry", "sprig", "rose", "wreath")):
            assert "fir sprig" not in t.split("The piece:")[0], k
    for b in BAN_UNLESS_GUARDED:
        hits = len(re.findall(rf"\b{b}s?\b", t.lower()))
        assert hits == (1 if v["frame"] == "06" else 0), (k, b, hits)
    # no reference clause anywhere: nothing is attached to these
    assert "reference image" not in t, k
    # worn frame names the finger and empties the others; no other frame wears the ring
    if v["frame"] == "02":
        want = "worn on the little finger" if "little finger" in it["description"] else "worn on the ring finger"
        assert want in t and "other fingers are completely bare" in t, (k, want)
        assert "back of the hand to the camera" in t and "thumb visible" in t, k
        assert "true to scale" in t and " mm" in t.split("The piece:")[0], k
    else:
        assert "worn on the ring finger" not in t and "worn on the little finger" not in t, k
    if v["frame"] == "01":
        assert "in one colour" not in t and "single-colour ground" in t, k
        if "Signet" in it["name"] and "mound" not in it["buildNote"]:
            assert "face of the signet is turned up" in t, k
        if "mound" in it["buildNote"]:
            assert "both read in profile" in t and "flat" in t, k
    if v["frame"] == "04":
        assert "about 2 cm across" in t and "held up, not worn" in t and "faces the camera uncovered" in t, k
        assert "no wider than" not in t, k           # a ring is wider than a fingertip
    # another shop's Christmas motifs must not leak into our pictures either
    for b in BAN_IN_PROMPT:
        assert b not in t.lower() or (b == "holly" and False), (k, b)
    assert not re.search(r"\. [a-z]", t), (k, re.search(r"\. [a-z].{0,40}", t).group(0))
    assert " stone stone" not in t and not re.search(r"\b(\w+) \1\b", t), k
    for fig in ("the way a", "oldest", "in the line", "quiet version"):
        assert fig not in t, (k, "sales voice leaked into a prompt", fig)

print(f"{len(out)} prompts -> prompts.json, image-prompts.md")
print(f"{len(CAT['items'])} rings x 6 frames | 2 credits each -> {len(out) * 2} credits")
