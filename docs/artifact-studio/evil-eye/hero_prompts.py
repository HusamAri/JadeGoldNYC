"""Evil eye: the 30 reference hero prompts, one per listing (text only, no reference image).

Run: python3 docs/artifact-studio/evil-eye/hero_prompts.py
Writes heroes.json next to this file and fails loudly on any rule break.

Source of truth for the pieces: 01-design-direction.md ("The ten families", "Image notes", "Variant
grid", "Copy rules"). This file does not read catalog.json (another workflow builds it); it is the image
side of the same spec. Model ids follow the family numbers: R01..R10 rings, N01..N10 necklaces,
B01..B10 bracelets.

Each hero is one generation: nano_banana_2, 2k, 1:1, count 1, from text only, on warm off-white paper
(the xmas26 reference hero system). The hero is only a reference: the 10 sales frames (shots.py) reuse
`shape` and take a tight crop of the approved hero as their only reference image. Two-tone heroes are
drawn in the Metal Color value "Yellow/White Gold": body yellow, accent white. `altHeroPrompts` holds the
same piece in the other two values, for the spec's optional per-value heroes (needs the owner's yes).

Prompt rules (spec "Image notes" and docs/second-brain.md):
- size in mm, the spec's known-object anchor and "never larger" (the old "width of a fingertip"
  anchor asked for 18 to 20 mm and is gone);
- every part's metal by name, one part one metal; never "two tone" or "mixed metal";
- white gold is metal: "polished unplated white gold, a soft warm grey metal with mirror reflections";
  white enamel is "porcelain white enamel, flat, opaque and glossy";
- enamel flat, flush and glossy, never domed; every back "closed, solid, flat";
- physical words, not jargon: rim, ring, collar, centre dot. Never "pupil", "iris" or "sclera", and
  never the words "evil eye" or "nazar": the zone list is the design, and those words pull the model
  toward the costume glass bead (black dot, white enamel ring), the exact trap Halka's QA checks for;
- banned words from the spec: Iznik, tile, satellite, paperclip chain, coin, signet, bezel, cup, set like
  a stone, toi et moi, nazar bead, bead string; never bead, glass, hamsa or red string at all (naming
  them, even negated, invites them); lashes, eyelid lines and realistic irises only in negated form;
- counts of three or fewer per group; uniform repeats (balls, links, ridges) are never counted;
- `shape` carries no composition words; the hero's pose lives in imagePrompt only.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).parent
OUT = HERE / "heroes.json"

PARAMS = {"model": "nano_banana_2", "resolution": "2k", "aspect_ratio": "1:1", "count": 1,
          "reference": "none: heroes are generated from text only"}

# ---------------------------------------------------------------- enamel palette (spec, fixed per model)
# key: (copy name, hex, phrase used in prompts)
EN = {
    "cobalt": ("cobalt blue", "#17368C", "cobalt blue enamel (#17368C)"),
    "sky": ("sky blue", "#8CC3E8", "pale sky blue enamel (#8CC3E8)"),
    "white": ("white", "#F3F1EA", "porcelain white enamel, flat, opaque and glossy (#F3F1EA)"),
    "turquoise": ("turquoise", "#23A5B2", "turquoise enamel (#23A5B2)"),
    "red": ("poppy red", "#D7352B", "poppy red enamel (#D7352B)"),
    "pink": ("petal pink", "#EC9AB4", "petal pink enamel (#EC9AB4)"),
}
WHITE_ENAMEL = "porcelain white enamel, flat, opaque and glossy"

# ---------------------------------------------------------------- metals (spec "Variant grid")
WHITE_GOLD = "polished unplated white gold, a soft warm grey metal with mirror reflections"
METAL = {  # key: (full phrase for the naming mention, short name)
    "yellow": ("polished yellow gold", "yellow gold"),
    "white": (WHITE_GOLD, "white gold"),
    "rose": ("polished rose gold, a soft pink gold", "rose gold"),
}
PAIRS = {  # Metal Color value, body first: (body, accent)
    "Yellow/White Gold": ("yellow", "white"),
    "White/Yellow Gold": ("white", "yellow"),
    "Rose/White Gold": ("rose", "white"),
}
HERO_VALUE = "Yellow/White Gold"

# ---------------------------------------------------------------- scale anchors (spec "Image notes" table)
ANCHORS = [
    (0.0, 6.0, "slightly thinner than a pencil"),
    # Not in the spec table, which has no row between 6 and 8.4 mm; only R02's 7.2 mm drop sits here.
    (6.01, 8.39, "about as wide as a pencil is thick"),
    (8.4, 9.6, "a little narrower than the index fingernail"),
    (10.0, 11.5, "about as wide as the index fingernail"),
    (13.5, 13.5, "about as wide as a thumbnail, never wider than the finger"),
    (15.8, 15.8, "about the length of a thumbnail"),
]


def anchor(mm):
    hits = [a for lo, hi, a in ANCHORS if lo <= mm <= hi]
    assert len(hits) == 1, ("no spec anchor for", mm)
    return hits[0]


def size(text, mm):
    """'8.4 mm across' -> '8.4 mm across, a little narrower than the index fingernail, never larger'."""
    assert re.match(r"^[\d.]+ mm", text), text
    return f"{text}, {anchor(mm)}, never larger"


ENAMEL_END = "The enamel is flush with the metal, flat and glossy, never domed"
NO_EYE = "no eyelashes, no eyelid line, no realistic iris"

# ---------------------------------------------------------------- shared piece text
# Two-tone templates use <B>/<A> (full metal phrase) and <b>/<a> (short name) for body and accent, and
# <PARTS> for the sentence that names every part's metal.
SMALL_ZONES = ("The face of the disc shows four flat zones from the edge inward: the <b> collar, 0.8 mm wide; a "
               "ring of cobalt blue enamel (#17368C), 1.5 mm wide, that meets the collar directly with no other "
               "metal line between them; a flat ring of <a>, 0.9 mm wide; and a round centre dot of cobalt blue "
               "enamel, 2 mm across")
DROP_BIG = ("The teardrop is a circle 8.8 mm across with two straight sides that meet in a right-angled point, its "
            "height about one fifth more than its width. From the outline inward: a thin polished gold rim, 0.4 mm; "
            "a band of cobalt blue enamel (#17368C), 1.5 mm wide; a thin gold wall, 0.4 mm; a band of "
            + EN["white"][2] + ", 1.5 mm wide; and a round polished gold centre dot, 1.2 mm across, at the centre "
            "of the round end. Both enamel bands are smaller teardrops of even width that follow the outline; the "
            "last 1.5 mm of the point is solid polished gold with no enamel. " + ENAMEL_END
            + "; closed, solid, flat gold back")
ALMOND_SIZE = size("11 mm long and 6.6 mm wide", 11.0)
ALMOND = ("The almond is two shallow arcs that meet in two pointed tips, framed by a thin polished gold rim 0.4 mm "
          "wide. At its centre is a round island 5 mm across: a thin gold ring 0.4 mm wide, a ring of cobalt blue "
          "enamel (#17368C) 1.5 mm wide and a round polished gold centre dot 1.2 mm across, with 0.8 mm of plain "
          "gold above and below the island. On each side of the island is a cell of " + EN["white"][2] + ", 1.6 "
          "mm long, tall next to the island and narrowing toward the tip; the last 1 mm of each tip is solid "
          "polished gold. The almond is a closed solid plate, never an open outline; " + NO_EYE + ". "
          + ENAMEL_END + "; closed, solid, flat gold back")
DISC6 = ("a polished gold rim 0.5 mm wide, a ring of cobalt blue enamel (#17368C) 1.7 mm wide and a round polished "
         "gold centre dot 1.6 mm across")
STATION = ("Each station is one rigid piece, " + size("10 mm long", 10) + ": a flat round disc 6 mm across, "
           "slightly thinner than a pencil, with one solid polished gold ball 2 mm across fused to its left edge and "
           "one fused to its right edge, and a tiny gold loop at each end where the chain is joined. The disc: "
           + DISC6 + ". " + ENAMEL_END + "; closed, solid, flat gold backs")


def hexagon(field_mm):
    return ("The hexagon is regular, with six equal straight sides and crisp corners, framed by a thin polished gold "
            "rim 0.4 mm wide. Its field is cobalt blue enamel (#17368C), " + field_mm + " mm wide at the middle of "
            "each side, around a round island 5.2 mm across at the centre: a thin gold ring 0.4 mm wide, a ring of "
            "turquoise enamel (#23A5B2) 1.5 mm wide and a round polished gold centre dot 1.4 mm across. "
            + ENAMEL_END + "; closed, solid, flat gold back")


LARGE = ("The large disc, from the edge inward: a polished <b> rim 0.4 mm wide; a ring of cobalt blue enamel "
         "(#17368C) 1.5 mm wide; a thin <b> ring 0.4 mm wide; a ring of pale sky blue enamel (#8CC3E8) 1.5 mm wide; "
         "and a round <b> centre dot 1.4 mm across.")


def small_disc(joined):
    joint = " that is joined to the large disc with at least 0.8 mm of gold at the joint" if joined else ""
    return ("The small disc, from the edge inward: a <a> rim 0.5 mm wide; a ring of cobalt blue enamel 1.5 mm wide; "
            "and a round <a> centre dot 2 mm across; it sits flush, not domed, in a thin raised <b> collar 0.4 mm "
            "wide" + joint + ".")


def almond_medal(length, width, axis, cell):
    return ("The almond is " + length + " mm long and " + width + " mm wide, 0.9 mm thick and polished, fixed flat "
            + axis + "; at its centre is one round cell of cobalt blue enamel (#17368C), " + cell + " mm across, "
            "inside a thin <a> rim 0.4 mm wide. The satin face itself has no enamel; the almond is a closed solid "
            "plate; " + NO_EYE + ". " + ENAMEL_END)


EYE8 = ("a <b> outer rim 0.5 mm wide, a flat polished <a> ring 1.5 mm wide inlaid flush, and a <b> centre dot 2 mm "
        "across, slightly raised")


def heart(d, rim, red, margin):
    return ("Set flush into the heart, slightly above its middle, is a small round motif " + d + " mm across: a thin "
            "polished gold rim " + rim + " mm wide, a ring of poppy red enamel (#D7352B) " + red + " mm wide and a "
            "round polished gold centre dot 1.6 mm across, with at least " + margin + " mm of polished gold all "
            "around it to the edge of the heart. The rest of the heart is plain polished gold; no eyelashes, no "
            "eyelid line. " + ENAMEL_END + "; closed, solid, flat gold back")


CONNECTOR = ("The connector, from the edge inward: a thin polished gold rim 0.4 mm wide; a ring of petal pink enamel "
             "(#EC9AB4) 1.5 mm wide; a thin gold ring 0.4 mm wide; a ring of " + EN["white"][2] + ", 1.5 mm wide; "
             "and a round polished gold centre dot 1.4 mm across. " + ENAMEL_END + "; closed, solid, flat gold back")

# ---------------------------------------------------------------- the 30 pieces
FAMILIES = {1: "Halka", 2: "Damla", 3: "Mati", 4: "Bead String", 5: "Çini", 6: "Mother and Child", 7: "Medal",
            8: "Twin Wire", 9: "Sweetheart", 10: "Paperclip"}
TWO_TONE = {1, 6, 7, 8}
P = []


def add(id, name, enamel, dims, motif, scale, shape, kind=None, wear=None, station=None, parts=None, qa=()):
    P.append(dict(id=id, name=name, enamel=enamel, dims=dims, motif=motif, scale=scale, shape=shape,
                  kind=kind or {"R": "ring", "N": "pendant", "B": "bracelet"}[id[0]], wear=wear, station=station,
                  parts=parts, qa=list(qa)))


QA_HALKA = ["Each white zone is white gold metal, never white enamel.",
            "No white line between the cobalt ring and the yellow gold collar.",
            "Which part is which metal, and does it match Yellow/White Gold?"]
# 1 HALKA: two-tone, the eye plate in the second gold (cobalt + sky)
add("R01", "Two Tone Evil Eye Ring", ["cobalt"], "disc 8.4 mm, 1.8 mm high on a 2 x 1.4 mm band", "the round disc",
    "the disc is only " + size("8.4 mm across", 8.4),
    "a ring with a flat round disc on top, " + size("8.4 mm across", 8.4) + ", framed by a thin raised <b> collar "
    "that holds it flush, not domed; the collar is 1.8 mm high and sits on a band 2 mm wide and 1.4 mm thick with a flat "
    "inner side. <PARTS> "
    + SMALL_ZONES + ". " + ENAMEL_END + "; closed, solid, flat <b> back",
    parts={"body": "the band, the thin raised collar around the disc and the closed back behind it",
           "accent": "the disc inside the collar",
           "body09": "the band, the collar and the back", "accent09": "the flat ring between the two cobalt blue cells"},
    qa=["Four zones: yellow collar, cobalt ring, white gold ring, cobalt centre dot."] + QA_HALKA)
add("N01", "Two Tone Evil Eye Necklace", ["cobalt", "sky"], "disc 11.5 x 1.5 mm, hidden tube bail", "the round disc",
    "the disc is only " + size("11.5 mm across", 11.5),
    "a pendant: a flat round disc, " + size("11.5 mm across", 11.5) + ", 1.5 mm thick, framed by a thin raised <b> "
    "collar that holds it flush, not domed. <PARTS> The face of the disc shows five flat zones from the edge inward: "
    "the <b> collar, 0.8 mm wide; a ring of cobalt blue enamel (#17368C), 1.6 mm wide, that meets the collar "
    "directly with no other metal line between them; a flat ring of <a>, 0.9 mm wide; a ring of pale sky blue "
    "enamel (#8CC3E8), 1.6 mm wide; and a round <a> centre dot, 1.7 mm across. The fine 1.2 mm cable chain passes "
    "through the hidden tube, so it disappears behind the top edge of the disc and no loop shows above it. "
    + ENAMEL_END + "; closed, solid, flat <b> back",
    wear="the disc at the centre just below the collarbones, facing the camera",
    parts={"body": "the thin raised collar around the disc, the closed back behind it, a small tube hidden behind the "
                   "top edge of the disc and the fine 1.2 mm cable chain",
           "accent": "the disc inside the collar",
           "body09": "the collar, the back and the chain",
           "accent09": "the flat ring between the cobalt blue and sky blue rings and the round centre dot"},
    qa=["Five zones: yellow collar, cobalt ring, white gold ring, sky blue ring, white gold centre dot."] + QA_HALKA)
add("B01", "Two Tone Evil Eye Bracelet", ["cobalt"], "disc 8.4 mm, inline", "the round disc",
    "the disc is only " + size("8.4 mm across", 8.4),
    "a fine 1.1 mm <b> cable chain bracelet with one flat round disc, " + size("8.4 mm across", 8.4) + ", in the "
    "line of the chain at its centre, framed by a thin raised <b> collar that holds it flush, not domed; two small "
    "<b> loops on the sides of the collar, at 3 and 9 o'clock, join the chain, so the chain runs into the disc from "
    "both sides. <PARTS> " + SMALL_ZONES + ". " + ENAMEL_END + "; closed, solid, flat <b> back; spring ring clasp",
    parts={"body": "the chain, the two loops, the thin raised collar around the disc and the closed back behind it",
           "accent": "the disc inside the collar",
           "body09": "the chain, the collar and the back", "accent09": "the flat ring between the two cobalt blue cells"},
    qa=["Four zones: yellow collar, cobalt ring, white gold ring, cobalt centre dot."] + QA_HALKA)

QA_DAMLA = ["The inner bands are offset teardrops of even width.",
            "The hero shows the solid gold point (the last 1.5 mm); in sales frames enamel running into the point is "
            "accepted (spec appendix).",
            "Height to width within 10% of 10.6 / 8.8."]
# 2 DAMLA: cobalt + white, single gold
add("R02", "Teardrop Evil Eye Ring", ["cobalt"], "teardrop 6.0 x 7.2 x 1.1 mm on a 1.6 mm band", "the teardrop",
    "the teardrop is only " + size("7.2 mm long and 6 mm wide", 7.2),
    "a slim ring in polished 14K yellow gold with a small flat teardrop on top, " + size("7.2 mm long and 6 mm wide", 7.2)
    + ", 1.1 mm thick, sitting low on a round band 1.6 mm thick, cast in one piece, the point of the teardrop toward "
    "the fingertip when worn. The teardrop is a circle 6 mm across with two straight sides that meet in a "
    "right-angled point. Inside a thin polished gold rim 0.4 mm wide, one band of cobalt blue enamel (#17368C), 1.5 "
    "mm wide, follows the outline at an even width around a round polished gold centre dot 2.2 mm across at the "
    "centre of the round end; the last 1.5 mm of the point is solid polished gold with no enamel. " + ENAMEL_END
    + "; closed, solid, flat gold back",
    qa=["One cobalt band of even width, gold centre dot 2.2 mm.",
        "The hero shows the solid gold point; in sales frames enamel running into the point is accepted.",
        "Length to width within 10% of 7.2 / 6.0."])
add("N02", "Teardrop Evil Eye Necklace", ["cobalt", "white"], "teardrop 8.8 x 10.6 x 1.2 mm, point up",
    "the teardrop", "the teardrop is only " + size("10.6 mm tall and 8.8 mm wide", 10.6),
    "a flat teardrop pendant in polished 14K yellow gold, " + size("10.6 mm tall and 8.8 mm wide", 10.6) + ", 1.2 mm "
    "thick, hanging point up: a small gold loop at the point carries a gold jump ring and the fine 1.2 mm cable "
    "chain. " + DROP_BIG,
    wear="the teardrop, point up, at the centre just below the collarbones, facing the camera", qa=QA_DAMLA)
add("B02", "Teardrop Evil Eye Charm Bracelet", ["cobalt", "white"], "teardrop 8.8 x 10.6 mm, hanging",
    "the teardrop charm", "the teardrop is only " + size("10.6 mm tall and 8.8 mm wide", 10.6),
    "a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with one flat teardrop charm, "
    + size("10.6 mm tall and 8.8 mm wide", 10.6) + ", 1.2 mm thick, that hangs free, point up, from a small gold "
    "jump ring at the centre of the chain, the jump ring through a small loop at the point. " + DROP_BIG
    + "; spring ring clasp", qa=QA_DAMLA + ["The set's only dangle: it hangs from one jump ring."])

QA_MATI = ["No eyelashes, no eyelid line, no realistic iris; a closed plate, never an open outline.",
           "White cells either side of a ringed cobalt island; solid gold tips."]
# 3 MATI: white + cobalt, single gold
add("R03", "White and Blue Almond Evil Eye Bypass Ring", ["white", "cobalt"], "almond 11.0 x 6.6 mm, bypass band 1.5 mm",
    "the almond", "the almond is only " + ALMOND_SIZE,
    "an open bypass ring in polished 14K yellow gold: a rigid round band 1.5 mm thick whose two ends pass each other "
    "side by side at the top of the ring. One end finishes in a flat almond-shaped plate, " + ALMOND_SIZE + ", 1.2 mm "
    "thick, its long axis following the band; the other end is a plain polished tapered end that stops 4 mm short of "
    "the almond. " + ALMOND,
    qa=QA_MATI + ["The almond's long axis follows the band; the plain tapered end stops short of it."])
add("N03", "Almond Evil Eye Lariat Necklace", ["white", "cobalt"], "almond 11.0 x 6.6 mm on a 40 mm drop",
    "the almond", "the almond is only " + ALMOND_SIZE,
    "a Y-shaped lariat necklace in polished 14K yellow gold: the fine 1.2 mm cable chain meets at the front in a 3 mm "
    "solid polished gold ball, and from the ball a single 40 mm length of the same chain drops straight down to a "
    "flat almond-shaped plate, " + ALMOND_SIZE + ", 1.2 mm thick, which hangs level, its long axis horizontal, from "
    "a small loop hidden behind the middle of its top edge. " + ALMOND, kind="lariat",
    wear=("the small gold ball where the chain meets the drop at the centre just below the collarbones, the drop "
          "running straight down from it to the almond, which lies level, its long axis parallel to the collarbones"),
    qa=QA_MATI + ["Hangs level, long axis parallel to the collarbone, from a small loop behind the middle of its top edge."])
add("B03", "Almond Evil Eye Bracelet", ["white", "cobalt"], "almond 11.0 x 6.6 mm, chain behind the top edge",
    "the almond", "the almond is only " + ALMOND_SIZE,
    "a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with one flat almond-shaped plate, " + ALMOND_SIZE
    + ", 1.2 mm thick, at its centre, its long axis along the chain: the chain runs straight across just inside the "
    "top edge of the almond, passing behind it through two small loops hidden behind the upper edge about 2.5 mm in "
    "from each tip, so both pointed tips sit below the chain and touch nothing. " + ALMOND + "; spring ring clasp",
    qa=QA_MATI + ["The chain runs straight across just inside the top edge, behind it; both tips below the chain, "
                  "touching nothing."])

# 4 BEAD STRING: cobalt, single gold (the spec's words: "a flat enamel disc", "solid polished gold balls")
add("R04", "Beaded Evil Eye Stacking Ring", ["cobalt"], "disc 6.0 mm on a band of 1.8 mm gold balls", "the round disc",
    "the disc is only " + size("6 mm across", 6),
    "a rigid closed ring band made of small solid polished 14K yellow gold balls, each 1.8 mm across, all the same "
    "size, in one single row, each fused to the next, with no thread, no elastic and no gaps, cast in one piece. On "
    "top of the band, on a low gold gallery 0.6 mm high, sits a flat round disc, " + size("6 mm across", 6) + ": "
    + DISC6 + ". " + ENAMEL_END + "; closed, solid, flat gold back",
    qa=["A rigid closed band of equal gold balls in one row, no thread, no elastic, no gaps; the copy never counts them.",
        "One flat cobalt disc on top, not domed."])
add("N04", "Evil Eye Bead Station Necklace", ["cobalt"], "three 10 mm stations, 22 mm apart", "the three stations",
    "each station is only " + size("10 mm long", 10),
    "a fine 1.2 mm cable chain necklace in polished 14K yellow gold with three identical stations fixed at the "
    "front, 22 mm apart, the chain between them bare. " + STATION, kind="inline",
    wear="the three stations resting at the centre front just below the collarbones, evenly spaced, facing the camera",
    station="one rigid station: the flat cobalt blue disc with a 2 mm solid gold ball fused to each side and a tiny "
            "loop at each end",
    qa=["Exactly three identical stations, each one rigid 10 mm piece: ball, disc, ball.", "The chain between them is bare."])
add("B04", "Evil Eye Bead Station Bracelet", ["cobalt"], "three 10 mm stations, 18 mm apart", "the three stations",
    "each station is only " + size("10 mm long", 10),
    "a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with three identical stations fixed at its "
    "centre, 18 mm apart, the chain between them bare. " + STATION + "; spring ring clasp",
    station="one rigid station: the flat cobalt blue disc with a 2 mm solid gold ball fused to each side and a tiny "
            "loop at each end",
    qa=["Exactly three identical stations, each one rigid 10 mm piece: ball, disc, ball.", "The chain between them is bare."])

QA_CINI = ["Six sides, sharp corners, one ringed island.", "Cobalt outside, turquoise inside: dark outside, light inside."]
# 5 CINI: cobalt + turquoise, single gold ("a flat hexagon", never "tile")
add("R05", "Hexagon Tile Evil Eye Ring", ["cobalt", "turquoise"], "hexagon 9.2 mm across the flats, 1.3 mm thick",
    "the hexagon", "the hexagon is only " + size("9.2 mm across the flats", 9.2),
    "a ring with a flat hexagon on top, " + size("9.2 mm across the flats", 9.2) + ", 1.3 mm thick, sitting flat on a "
    "band of polished 14K yellow gold 2 mm wide and 1.4 mm thick with a flat inner side. " + hexagon("1.6"),
    qa=QA_CINI)
add("N05", "Hexagon Tile Evil Eye Necklace", ["cobalt", "turquoise"], "hexagon 10.0 mm across the flats, from a corner",
    "the hexagon", "the hexagon is only " + size("10 mm across the flats", 10),
    "a flat hexagon pendant in polished 14K yellow gold, " + size("10 mm across the flats", 10) + ", 1.2 mm thick, "
    "hanging from its top corner by a small gold loop on the fine 1.2 mm cable chain. " + hexagon("2"),
    wear="the hexagon, one corner up, at the centre just below the collarbones, facing the camera",
    qa=QA_CINI + ["Hangs from a corner."])
add("B05", "Hexagon Tile Evil Eye Bracelet", ["cobalt", "turquoise"], "hexagons 5.0 + 9.2 + 5.0 mm, 5 mm apart",
    "the three hexagons", "the middle hexagon is only " + size("9.2 mm across the flats", 9.2),
    "a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with three flat hexagons in a row at its centre, "
    "5 mm apart, joined into the line of the chain by small gold loops at their side corners. The middle hexagon is "
    + size("9.2 mm across the flats", 9.2) + ", 1.3 mm thick. " + hexagon("1.6") + ". On each side of the middle "
    "hexagon is a small "
    "flat hexagon, " + size("5 mm across the flats", 5) + ", filled with plain turquoise enamel inside a thin polished "
    "gold rim, with no centre dot and no ring, and a closed, solid, flat gold back. Every hexagon is regular, with "
    "six equal straight sides and crisp corners; spring ring clasp",
    station="one station: the middle hexagon with its cobalt blue field, turquoise ring and gold centre dot, and its "
            "two small side loops",
    qa=QA_CINI + ["The two small hexagons are plain turquoise with no centre dot and no ring."])

QA_MC = ["Metals part by part: the small disc's rim and centre dot white gold, its collar yellow gold.",
         "The large disc is one and a half times the small one."]
# 6 MOTHER AND CHILD: two-tone, the small eye in the second gold (cobalt + sky)
add("R06", "Mother and Child Evil Eye Ring, Two Tone", ["cobalt", "sky"], "discs 9.0 + 6.0 mm, 13.5 mm overall",
    "the two discs", "the pair of discs is only " + size("13.5 mm across", 13.5),
    "a ring with two flat round discs joined rim to rim on top of a slim round band 1.8 mm thick, together "
    + size("13.5 mm across", 13.5) + ": a large disc 9 mm across and, at its lower right at the 4 to 5 o'clock "
    "position, a small disc 6 mm across; the large disc is one and a half times the small one. <PARTS> " + LARGE + " "
    + small_disc(True) + " " + ENAMEL_END + "; closed, solid, flat <b> backs",
    parts={"body": "the band, the large disc with its rims and centre dot, and the thin raised collar around the small "
                   "disc", "accent": "the small disc inside that collar",
           "body09": "the band, the large disc with its rims and centre dot, and the thin collar around the small disc",
           "accent09": "the small disc's rim and centre dot"},
    qa=QA_MC + ["The small disc at the large disc's 4 to 5 o'clock (the mirror is accepted)."])
add("N06", "Mother and Child Evil Eye Necklace, Two Tone", ["cobalt", "sky"], "discs 9.0 + 6.0 mm, 9.0 x 15.8 mm overall",
    "the two discs", "the pair of discs is only " + size("15.8 mm tall", 15.8),
    "a pendant of two flat round discs joined rim to rim, one directly below the other, together 9 mm wide and "
    + size("15.8 mm tall", 15.8) + ": the large disc 9 mm across at the top and the small disc 6 mm across straight "
    "below it at 6 o'clock; the large disc is one and a half times the small one. The fine 1.2 mm cable chain passes "
    "through a small tube hidden behind the top of the large disc, so no loop shows above it and the small disc "
    "hangs straight below the large one. <PARTS> " + LARGE + " " + small_disc(True) + " " + ENAMEL_END
    + "; closed, solid, flat <b> backs",
    wear="the two discs at the centre just below the collarbones, the small disc straight below the large one, facing "
         "the camera",
    parts={"body": "the large disc with its rims and centre dot, the thin raised collar around the small disc, the "
                   "hidden tube and the chain", "accent": "the small disc inside the collar",
           "body09": "the chain, the large disc with its rims and centre dot, and the thin collar around the small disc",
           "accent09": "the small disc's rim and centre dot"},
    qa=QA_MC + ["The small disc straight below the large one."])
add("B06", "Mother and Child Evil Eye Bracelet, Two Tone", ["cobalt", "sky"], "discs 9.0 + 6.0 mm, joined by a jump ring",
    "the two discs", "the large disc is only " + size("9 mm across", 9),
    "a fine 1.1 mm <b> cable chain bracelet with two flat round discs side by side at its centre, in the line of the "
    "chain and joined to each other by one small <b> jump ring: a large disc " + size("9 mm across", 9) + ", and a "
    "small disc " + size("6 mm across", 6) + "; each disc has a small <b> loop on its outer side where the chain "
    "continues. <PARTS> " + LARGE + " " + small_disc(False) + " " + ENAMEL_END + "; closed, solid, flat <b> backs; "
    "spring ring clasp",
    station="one station: the large disc and the small disc joined by their jump ring",
    parts={"body": "the chain, the jump ring, the loops, the large disc with its rims and centre dot, and the thin "
                   "raised collar around the small disc", "accent": "the small disc inside the collar",
           "body09": "the large disc with its rims and centre dot, the jump ring and the thin collar around the small "
                     "disc", "accent09": "the small disc's rim and centre dot"},
    qa=QA_MC + ["Two stations joined by one jump ring at the centre of the chain."])

QA_MEDAL = ["Plain satin face: no engraving, no lettering, no numbers, no enamel; only the raised almond, in white gold.",
            "No eyelashes, no eyelid line, no realistic iris.",
            "Fallback for frame 09: a local recolour of one hero with two masks (the Frostline method)."]
# 7 MEDAL: two-tone, the almond in the second gold ("a round disc ... plain satin face", never "coin")
add("R07", "Two Tone Evil Eye Coin Ring", ["cobalt"], "disc 9.0 x 1.3 mm, almond 7.0 x 3.6 mm",
    "the round top with its almond", "the round top is only " + size("9 mm across", 9),
    "a ring with a flat round top: a round disc " + size("9 mm across", 9) + ", 1.3 mm thick, with a plain "
    "satin-finished face, a polished border 0.6 mm wide and a polished bevelled edge, on a band 2 mm wide and 1.4 mm "
    "thick with a flat inner side; no engraving, no lettering, no numbers; nothing on the face but the raised almond. "
    "<PARTS> "
    + almond_medal("7", "3.6", "on the centre of the satin face with its long axis across the finger", "1.6")
    + "; closed, solid, flat <b> back",
    parts={"body": "the disc and the band", "accent": "a small raised almond on the satin face",
           "body09": "the round disc and the band", "accent09": "the raised almond and its rim"},
    qa=QA_MEDAL + ["Bevelled edge, no ridges on the ring; the almond across the finger."])
add("N07", "Two Tone Evil Eye Coin Necklace", ["cobalt"], "disc 11.0 x 1.0 mm, almond 8.0 x 4.0 mm",
    "the round disc", "the disc is only " + size("11 mm across", 11),
    "a round disc pendant, " + size("11 mm across", 11) + ", 1 mm thick, with a plain satin-finished face, a polished "
    "border 0.6 mm wide and a finely ridged edge; no engraving, no lettering, no numbers; nothing on the face but the "
    "raised almond; it hangs from a small loop "
    "at the top through a jump ring on the fine 1.2 mm cable chain. <PARTS> "
    + almond_medal("8", "4", "at the centre of the satin face with its long axis horizontal", "2")
    + "; closed, solid, flat <b> back",
    wear="the round disc at the centre just below the collarbones, facing the camera",
    parts={"body": "the disc, the loop, the jump ring and the chain", "accent": "a small raised almond on the satin face",
           "body09": "the round disc and the chain", "accent09": "the raised almond and its rim"},
    qa=QA_MEDAL)
add("B07", "Two Tone Evil Eye Coin Bracelet", ["cobalt"], "disc 8.5 x 0.9 mm, almond 6.4 x 3.2 mm, inline",
    "the round disc", "the disc is only " + size("8.5 mm across", 8.5),
    "a fine 1.1 mm <b> cable chain bracelet with one round disc, " + size("8.5 mm across", 8.5) + ", 0.9 mm thick, "
    "in the line of the chain at its centre, joined by two small loops at 3 and 9 o'clock; the disc has a plain "
    "satin-finished face, a polished border 0.6 mm wide and a finely ridged edge; no engraving, no lettering, no "
    "numbers; nothing on the face but the raised almond. <PARTS> "
    + almond_medal("6.4", "3.2", "at the centre of the satin face inside the border, its long axis along the chain", "1.5")
    + "; closed, solid, flat <b> back; spring ring clasp",
    parts={"body": "the chain, the loops and the disc", "accent": "a small raised almond on the satin face",
           "body09": "the round disc and the chain", "accent09": "the raised almond and its rim"},
    qa=QA_MEDAL)

QA_TWIN = ["Disc: yellow centre dot slightly raised, white gold ring, yellow outer rim; no enamel."]
# 8 TWIN WIRE: two-tone, no enamel
add("R08", "Two Tone Mixed Metal Evil Eye Ring", [], "disc 6.0 x 1.2 mm on two fused 1.3 mm rings", "the round disc",
    "the disc is only " + size("6 mm across", 6),
    "a ring of two thin round rings, each 1.3 mm thick, fused side by side like a stack of two rings, together 2.6 mm "
    "wide: one ring entirely <B>, on the side toward the fingertip when worn, and one ring entirely <A>, on the side "
    "toward the hand. On top, across both rings on a low <b> gallery 0.6 mm high, sits a flat round disc, "
    + size("6 mm across", 6) + ", 1.2 mm thick, all metal with no enamel: " + EYE8 + ". Each part is entirely one "
    "metal; " + NO_EYE + "; closed, solid, flat <b> back",
    parts={"body": "the ring toward the fingertip, the gallery, the outer rim and the centre dot",
           "accent": "the ring toward the hand and the inlaid ring",
           "body09": "the ring toward the fingertip, the outer rim and the raised centre dot",
           "accent09": "the ring toward the hand and the inlaid flat ring of the disc"},
    qa=QA_TWIN + ["Two thin rings, one entirely yellow gold, one entirely white gold, fused side by side.",
                  "If two takes fail, R08 becomes a single yellow gold band with the disc on top: a product change, "
                  "back to the owner before listing."])
add("N08", "Two Tone Evil Eye Station Necklace", [], "disc 6.0 x 1.0 mm, inline", "the round disc",
    "the disc is only " + size("6 mm across", 6),
    "a fine 1.2 mm <b> cable chain necklace with one flat round disc, " + size("6 mm across", 6) + ", 1 mm thick, in "
    "the line of the chain at the centre front: two small <b> loops on the sides of the disc, at 3 and 9 o'clock, "
    "join the chain on both sides. <PARTS> The disc is all metal with no enamel: " + EYE8 + "; " + NO_EYE
    + "; closed, solid, flat <b> back", kind="inline",
    wear="the disc in the line of the chain at the centre front just below the collarbones, facing the camera",
    parts={"body": "the chain, the two loops, the outer rim and the centre dot of the disc", "accent": "the inlaid ring",
           "body09": "the chain, the outer rim and the raised centre dot", "accent09": "the inlaid flat ring"},
    qa=QA_TWIN + ["The set's only inline necklace: the chain runs into the disc from both sides."])
add("B08", "Two Tone Evil Eye Cuff Bracelet", [], "disc 6.0 mm on a 2 x 1 mm cuff of two wires", "the round disc",
    "the disc is only " + size("6 mm across", 6),
    "an open cuff bracelet of two round wires, each 1 mm thick, fused side by side, together 2 mm wide: one wire "
    "entirely <B>, and one wire entirely <A>; both wires end in plain polished ends at the opening. At the front, across both wires "
    "on a low <b> gallery, sits a flat round disc, " + size("6 mm across", 6) + ", 1.2 mm thick, all metal with no "
    "enamel: " + EYE8 + ". Each part is entirely one metal; " + NO_EYE + "; closed, solid, flat <b> back",
    kind="cuff",
    parts={"body": "one wire, the gallery, the outer rim and the centre dot", "accent": "the other wire and the inlaid ring",
           "body09": "one wire, the outer rim and the raised centre dot", "accent09": "the other wire and the inlaid flat ring"},
    qa=QA_TWIN + ["Two wires, one entirely yellow gold, one entirely white gold; an open cuff with no clasp."])

QA_SWEET = ["A solid polished gold heart with full round lobes; a small round red ring and a gold centre dot set flush.",
            "No eyelashes, no eyelid line.", "The same poppy red on all three metals."]
# 9 SWEETHEART: poppy red, single gold
add("R09", "Red Evil Eye Heart Ring", ["red"], "heart 9.6 x 9.2 x 1.1 mm, red ring 5.4 mm", "the heart",
    "the heart is only " + size("9.6 mm wide and 9.2 mm tall", 9.6),
    "a slim ring in polished 14K yellow gold with a solid polished gold heart on top, "
    + size("9.6 mm wide and 9.2 mm tall", 9.6) + ", 1.1 mm thick, with full round lobes and straight sides that meet "
    "in a pointed tip, sitting low on a round band 1.5 mm thick, cast in one piece, the heart upright with its point "
    "toward the wrist when worn. " + heart("5.4", "0.4", "1.5", "0.45"),
    qa=QA_SWEET)
add("N09", "Red Evil Eye Heart Necklace", ["red"], "heart 11.0 x 10.5 x 1.2 mm, red ring 6.0 mm", "the heart",
    "the heart is only " + size("11 mm wide and 10.5 mm tall", 11),
    "a solid polished 14K yellow gold heart pendant, " + size("11 mm wide and 10.5 mm tall", 11) + ", 1.2 mm thick, "
    "with full round lobes and straight sides that meet in a pointed tip; the fine 1.2 mm cable chain passes through "
    "a small tube hidden behind the cleft between the lobes, so no loop shows above the heart. "
    + heart("6", "0.5", "1.7", "0.6"),
    wear="the heart, upright, at the centre just below the collarbones, facing the camera", qa=QA_SWEET)
add("B09", "Red Evil Eye Heart Bracelet", ["red"], "heart 9.6 x 9.2 mm, inline", "the heart",
    "the heart is only " + size("9.6 mm wide and 9.2 mm tall", 9.6),
    "a fine 1.1 mm cable chain bracelet in polished 14K yellow gold with one solid polished gold heart, "
    + size("9.6 mm wide and 9.2 mm tall", 9.6) + ", 1.1 mm thick, in the line of the chain at its centre, joined by "
    "two small loops at the tops of its two lobes so the heart sits upright between them, with full round lobes and "
    "straight sides that meet in a pointed tip. " + heart("5.4", "0.4", "1.5", "0.45") + "; spring ring clasp",
    qa=QA_SWEET)

QA_CLIP = ["Count the links: two elongated oval links on each side, then the fine cable chain."]
# 10 PAPERCLIP: petal pink + white, single gold ("two elongated oval links on each side, then a fine round cable chain")
add("R10", "Pink Evil Eye Paperclip Ring", ["pink"], "disc 6.0 mm on a band of 7 x 2.4 mm links", "the round disc",
    "the disc is only " + size("6 mm across", 6),
    "a rigid ring band made of elongated oval links of polished 14K yellow gold, each 7 mm long and 2.4 mm wide in "
    "0.8 mm wire, joined end to end in one single row and soldered stiff so the band keeps a round shape, all the "
    "links the same size. Fixed flat on top of the band is a flat round disc, " + size("6 mm across", 6) + ": a thin "
    "polished gold rim 0.5 mm wide, a ring of petal pink enamel (#EC9AB4) 1.7 mm wide and a round polished gold "
    "centre dot 1.6 mm across. " + ENAMEL_END + "; closed, solid, flat gold back",
    qa=["A rigid band of equal links; the copy never counts them.", "One flat pink disc on top, not domed."])
add("N10", "Pink Evil Eye Paperclip Necklace", ["pink", "white"], "connector 9.0 mm, two 7 x 2.4 mm links each side",
    "the round connector and its links", "the connector is only " + size("9 mm across", 9),
    "a necklace in polished 14K yellow gold with one flat round connector, " + size("9 mm across", 9) + ", at the "
    "centre front, held in the line of the chain by small loops at 3 and 9 o'clock: two elongated oval links on each "
    "side, then a fine round cable chain 1.2 mm thick; each link is 7 mm long and 2.4 mm wide in 0.8 mm wire. "
    + CONNECTOR, kind="inline",
    wear="the connector and its links at the centre front just below the collarbones, facing the camera",
    station="one station: the round connector with its two elongated oval links on each side",
    qa=QA_CLIP)
add("B10", "Pink Evil Eye Paperclip Bracelet", ["pink", "white"], "connector 9.0 mm, two 7 x 2.4 mm links each side",
    "the round connector and its links", "the connector is only " + size("9 mm across", 9),
    "a bracelet in polished 14K yellow gold with one flat round connector, " + size("9 mm across", 9) + ", at its "
    "centre, held in the line of the chain by small loops at 3 and 9 o'clock: two elongated oval links on each side, "
    "then a fine round cable chain 1.1 mm thick; each link is 7 mm long and 2.4 mm wide in 0.8 mm wire. " + CONNECTOR
    + "; spring ring clasp",
    station="one station: the round connector with its two elongated oval links on each side",
    qa=QA_CLIP)

# ---------------------------------------------------------------- hero prompt assembly
POSE = {
    "ring": "The ring stands upright with its top turned toward the camera",
    "pendant": ("The pendant lies flat and face up, and the fine chain leaves it as one single strand whose two "
                "halves rise straight up and apart like the arms of a letter V and leave the image at the top edge; "
                "the chain is never doubled, never coiled and never forms a second loop"),
    "inline": ("The necklace lies with {m} face up at the bottom of one smooth U-shaped curve of chain whose two halves "
               "rise straight up and apart and leave the image at the top edge; the chain is never doubled, never "
               "coiled and never forms a second loop"),
    "lariat": ("The lariat lies face up: the drop runs straight down from the gold ball to the almond, and the two "
               "halves of the chain rise from the ball straight up and apart and leave the image at the top edge; the "
               "chain is never doubled, never coiled and never forms a second loop"),
    "bracelet": ("The bracelet lies in one soft open curve, one continuous chain from end to end, with {m} face up at "
                 "the centre of the curve and the spring ring clasp at one end"),
    "cuff": "The cuff stands on its open back with the disc at the front facing the camera",
}
SCENE = ("on warm off-white textured paper. Soft diffused daylight from the upper left, a gentle natural shadow, "
         "shallow depth of field, true-to-life small scale, three-quarter front view from slightly above, centred, "
         "calm minimal composition. No props, no hands, no text, no logo, no packaging. Photorealistic high-end "
         "commercial jewelry photography, square format.")


def parts_sentence(parts, body, accent):
    verb = "are" if " and " in parts["accent"] else "is"
    return (f"Each part is entirely one metal: {parts['body']} are {METAL[body][0]}; "
            f"{parts['accent']} {verb} {METAL[accent][0]}.")


def render(p, value=HERO_VALUE):
    s = p["shape"]
    if p["twoTone"]:
        body, accent = PAIRS[value]
        if p["parts"] and "<PARTS>" in s:
            s = s.replace("<PARTS>", parts_sentence(p["parts"], body, accent))
        s = (s.replace("<B>", METAL[body][0]).replace("<A>", METAL[accent][0])
              .replace("<b>", METAL[body][1]).replace("<a>", METAL[accent][1]))
    assert "<" not in s and ">" not in s, (p["id"], s)
    return s


def finish(p, value=HERO_VALUE):
    if p["twoTone"]:
        metal = ("Every metal part is solid 14K gold in exactly the metal named for it above, and each part is one "
                 "metal from edge to edge, with no plating and no colour wash between parts.")
    else:
        metal = "All metal is solid polished 14K yellow gold."
    if p["enamel"]:
        cols = ", ".join(f"{('porcelain white' if c == 'white' else ('pale sky blue' if c == 'sky' else EN[c][0]))} "
                         f"({EN[c][1]})" for c in p["enamel"])
        en = ("Kiln-fired vitreous enamel is set flush inside recessed cells, every cell framed by a thin polished "
              "metal rim; the enamel is perfectly flat and smooth, not cabochon, no gradient, no shading, no streaks, "
              f"no painted detail, no stones. Enamel colours: {cols}.")
    else:
        en = "No enamel, no colour and no stones; real metal reflections."
    eye = "" if "no eyelashes" in p["shape"] else " No eyelashes, no eyelid line, no realistic iris."
    return f"{metal} {en}{eye}"


def hero_prompt(p, value=HERO_VALUE):
    pose = POSE[p["kind"]].replace("{m}", p["motif"])
    return (f"Studio product photograph of one fine jewelry piece: {render(p, value)}. {finish(p, value)} "
            f"{pose}, {SCENE}")


# ---------------------------------------------------------------- rules, asserted
BANNED = [r"\biznik\b", r"\btiles?\b", r"satellite", r"paperclip", r"\bcoins?\b", r"signet", r"bezel", r"\bcups?\b",
          r"set like a stone", r"toi et moi", r"nazar", r"bead", r"two[ -]?tone", r"mixed[ -]metal", r"hamsa",
          r"glass", r"red string", r"evil eye", r"pupil", r"sclera", r"bicolou?r", r"swap", r"fingertip-sized",
          r"width of a fingertip", r"size of a fingertip", "\u2014", "\u2013", "\u00e2"]
NEGATED_ONLY = ["no eyelashes", "no eyelid line", "no realistic iris"]
COMPOSITION = [r"\bframe\b", r"loose oval", r"\bshown\b", r"three-quarter", r"camera", r"\bview\b", r"centred",
               r"centered", r"from above", r"background", r"paper", r"\blaid\b", r"\blies\b", r"resting",
               r"standing upright", r"\bstands\b", r"out of the top", r"\bimage\b", r"photograph", r"\bseen\b"]
COUNT_WORDS = r"\b(four|five|six|seven|eight|nine|ten|eleven|twelve|dozen)\b"
# Not counts of repeated units: the shape of a hexagon, and Halka's concentric zones, which the spec's Image
# notes name zone by zone ("five visible zones on N01 and four on R01/B01").
COUNT_OK = ["six equal straight sides", "four flat zones", "five flat zones"]


def check_prompt_text(pid, text):
    low = text.lower()
    for b in BANNED:
        assert not re.search(b, low), (pid, "banned", b)
    rest = low
    for n in NEGATED_ONLY:
        rest = rest.replace(n, "")
    assert not re.search(r"lash|eyelid|lid line|\biris", rest), (pid, "eye feature outside a negation")
    rest = low
    for ok in COUNT_OK:
        rest = rest.replace(ok, "")
    assert not re.search(COUNT_WORDS, rest), (pid, "count over three", re.search(COUNT_WORDS, rest))
    assert low.count("white enamel") == low.count(WHITE_ENAMEL), (pid, "white enamel without the porcelain phrase")


ids = [p["id"] for p in P]
assert len(ids) == 30 and len(set(ids)) == 30, "30 unique ids"
assert set(ids) == {f"{t}{n:02d}" for t in "RNB" for n in range(1, 11)}, "R01..R10, N01..N10, B01..B10"
items, seen_shape, seen_prompt = [], set(), set()
for p in P:
    n = int(p["id"][1:])
    p["familyNo"], p["family"], p["twoTone"] = n, FAMILIES[n], n in TWO_TONE
    p["productType"] = {"R": "ring", "N": "necklace", "B": "bracelet"}[p["id"][0]]
    assert bool(p["parts"]) == p["twoTone"], (p["id"], "parts iff two-tone")
    assert (p["wear"] is not None) == (p["productType"] == "necklace"), (p["id"], "wear iff necklace")
    assert bool(p["enamel"]) == (n != 8), (p["id"], "only Twin Wire has no enamel")
    assert len(p["enamel"]) <= 2 and p["qa"], p["id"]
    shape = render(p)
    prompt = hero_prompt(p)
    for txt in (shape, prompt):
        check_prompt_text(p["id"], txt)
    for c in COMPOSITION:
        assert not re.search(c, shape.lower()), (p["id"], "composition word in shape", c)
    assert "never larger" in shape and any(a in shape for _, _, a in ANCHORS), (p["id"], "size anchor")
    assert "never larger" in p["scale"] and any(a in p["scale"] for _, _, a in ANCHORS), (p["id"], "scale anchor")
    assert re.search(r"closed, solid, flat (yellow |white |rose )?gold backs?", shape), (p["id"], "closed back")
    if p["enamel"]:
        assert "never domed" in shape and "flush" in shape, (p["id"], "flat flush enamel")
        for c in p["enamel"]:
            assert EN[c][1] in shape, (p["id"], "enamel hex", c)
        assert ("white" in p["enamel"]) == (WHITE_ENAMEL in shape), (p["id"], "porcelain white phrase")
    else:
        assert not re.search(r"(?<!no )enamel", prompt.replace("No enamel", "no enamel")), (p["id"], "enamel on Twin Wire")
    if p["twoTone"]:
        assert WHITE_GOLD in shape and "Each part is entirely one metal" in shape, (p["id"], "named metals")
        assert "yellow gold" in shape, p["id"]
        for v in PAIRS:
            alt = hero_prompt(p, v)
            check_prompt_text(p["id"] + v, alt)
            assert WHITE_GOLD in alt, (p["id"], v)
    else:
        assert "14K yellow gold" in shape and "white gold" not in shape and "rose gold" not in shape, p["id"]
    if n in (3, 7, 9):  # almond and heart: the shapes that read as an eye
        assert "no eyelashes, no eyelid line" in shape, (p["id"], "eye negation in the piece text")
    for must in ("one fine jewelry piece", "warm off-white", "three-quarter front view from slightly above",
                 "No props, no hands, no text"):
        assert must in prompt, (p["id"], must)
    assert prompt.lower().count("no eyelashes, no eyelid line") == 1, (p["id"], "eye negation exactly once")
    assert shape not in seen_shape and prompt not in seen_prompt, (p["id"], "duplicate")
    seen_shape.add(shape)
    seen_prompt.add(prompt)
    if p["twoTone"]:
        body, accent = PAIRS[HERO_VALUE]
        metals = {"value": HERO_VALUE, "body": f"14K {body} gold", "accent": f"14K {accent} gold, polished and unplated",
                  "bodyParts": p["parts"]["body09"], "accentParts": p["parts"]["accent09"]}
    else:
        metals = "14K yellow gold"
    items.append({
        "id": p["id"], "familyNo": n, "family": p["family"], "name": p["name"], "productType": p["productType"],
        "kind": p["kind"], "twoTone": p["twoTone"], "metals": metals,
        "enamel": [{"key": c, "name": EN[c][0], "hex": EN[c][1]} for c in p["enamel"]],
        "dims": p["dims"], "motif": p["motif"], "scale": p["scale"], "wear": p["wear"], "station": p["station"],
        "shape": shape, "imagePrompt": prompt,
        "altHeroPrompts": {v: hero_prompt(p, v) for v in PAIRS if v != HERO_VALUE} if p["twoTone"] else None,
        "qa": p["qa"], "imageFile": f"{p['id']}.jpg",
    })

fam_ok = {}
for it in items:
    fam_ok.setdefault(it["familyNo"], set()).add(it["productType"])
assert all(v == {"ring", "necklace", "bracelet"} for v in fam_ok.values()) and len(fam_ok) == 10
assert sum(i["twoTone"] for i in items) == 12, "12 of 30 pieces are two-tone"

json.dump({"source": "evil-eye-heroes-v1", "spec": "01-design-direction.md", "params": PARAMS,
           "heroValueTwoTone": HERO_VALUE, "pairs": {k: list(v) for k, v in PAIRS.items()}, "items": items},
          open(OUT, "w"), ensure_ascii=False, indent=1)
lens = [len(i["imagePrompt"]) for i in items]
print(OUT.name, len(items), "heroes,", sum(i["twoTone"] for i in items), "two-tone,",
      sum(len(i["altHeroPrompts"] or {}) for i in items), "optional value heroes; prompt chars", min(lens), max(lens))
