"""Artifact Studio FW 26/27 Enamel: 40 listing proposals (10 families x 4 categories).

Single source of truth for copy, sizes, estimated grams, prices and image prompts.
Run: python3 docs/artifact-studio/fw2627-enamel/catalog.py
Writes catalog.json next to this file and fails loudly on any rule break.
"""
import json, math, os, re, uuid, pathlib

HERE = pathlib.Path(__file__).parent
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("5b1f0c2e-6a55-4f39-9c55-2f0e2a6b7f01")
SOURCE = "artifact-fw2627-enamel-v1"

# ---------------------------------------------------------------- pricing basis
SPOT_USD_OZT = 4178.20          # gold-api.com, 2026-09-30 11:21 UTC
PURE_G = SPOT_USD_OZT / 31.1034768
PURITY = {"10K": 0.417, "14K": 0.585, "18K": 0.750}
DENSITY = {"10K": 0.892, "14K": 1.0, "18K": 1.137}   # vs 14K, docs/second-brain.md
LOSS = 1.07
# Owner cost quotes for the 2027 enamel set (gold + labor, 14K, 2026-09-27) and the
# average 14K grams of those 20 pieces. Labor per category = quote minus 14K gold.
QUOTE = {"ring": 365, "necklace": 380, "bracelet": 375, "earring": 350}
QUOTE_AVG_G = {"ring": 2.04, "necklace": 2.96, "bracelet": 1.48, "earring": 0.88}
LABOR = {c: round(QUOTE[c] - QUOTE_AVG_G[c] * PURE_G * PURITY["14K"] * LOSS, 2) for c in QUOTE}
MARKUP = 2.0                    # approved rule of the 2027 enamel set: price = 2 x cost

RING_SIZES = [x / 2 for x in range(6, 33)]          # US 3 .. 16, whole and half = 27
NECK_LEN = [16, 18, 20]
BRAC_LEN = [6.5, 7, 7.5]
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]

def ring_d(s):  # inner diameter mm
    return 11.63 + 0.8128 * s

def grams14(m, size):
    c = m["cat"]
    if c == "ring":
        return m["top_g"] + m["shank_g"] * ring_d(size) / ring_d(7)
    if c == "necklace":
        return m["piece_g"] + 0.2 + 0.1 * size
    if c == "bracelet":
        if m.get("cuff"):
            return m["piece_g"] * size / 7
        return m["piece_g"] + 0.2 + 0.114 * size
    return m["piece_g"]

def price_cents(m, k, size):
    g = grams14(m, size) * DENSITY[k]
    cost = g * PURE_G * PURITY[k] * LOSS + LABOR[m["cat"]]
    return int(math.ceil(MARKUP * cost / 10) * 10 * 100)

# ---------------------------------------------------------------- enamel palette
EN = {
    "teal": ("Transformative Teal", "deep teal blue-green (#0F5C63)"),
    "black": ("ink black", "glossy ink black"),
    "cream": ("Wax Paper cream", "warm cream white (#EDE3C8)"),
    "oxblood": ("oxblood red", "deep oxblood red (#5E1A1D)"),
    "purple": ("Fresh Purple", "rich violet purple (#6B3FA0)"),
    "cocoa": ("Cocoa Powder brown", "cocoa brown (#6B4A3A)"),
    "chartreuse": ("Green Glow chartreuse", "bright chartreuse yellow green (#C5D84A)"),
    "berry": ("berry pink", "deep berry pink (#A3265B)"),
    "navy": ("ocean navy", "deep ocean navy blue (#1D2F5C)"),
    "moss": ("moss green", "muted moss olive green (#5C6B3A)"),
    "amber": ("amber", "warm honey amber (#D98A1E)"),
}

SHARED_TAGS = ["enamel jewelry", "fall jewelry", "gift for her"]

M = []
def add(**kw):
    M.append(kw)

# ============================================================ 1 KEYHOLE (teal)
add(id="R01", fam="Keyhole", cat="ring", name="Keyhole Signet Ring", enamel=["teal"],
    dims="top 8 x 10 mm, keyhole outline 3.5 x 6 mm", top_g=0.9, shank_g=1.3,
    title="Keyhole Signet Ring, Teal Enamel Signet in Solid Gold, Minimalist Everyday Enamel Ring",
    tags=["keyhole ring", "teal enamel ring", "enamel signet ring", "solid gold signet", "teal jewelry",
          "minimalist signet", "gold signet ring", "keyhole jewelry", "colorful ring", "14k enamel ring"],
    lead="A small rounded signet in solid gold, its top filled with teal enamel and drawn through with a polished gold keyhole.",
    story="The keyhole is the quiet door of a winter room: a circle over a tapered slot, traced in polished gold across a flush field of Transformative Teal. It sits flat and low, easy to wear every day and easy to stack.",
    shape="a slim polished gold ring with a small rounded-rectangle signet top, 8 by 10 mm; the whole flat top is filled with flat deep teal enamel inside a polished gold rim, and a thin polished gold keyhole outline (a small circle above a tapered slot) is drawn through the centre of the teal; round smooth shank")
add(id="N01", fam="Keyhole", cat="necklace", name="Keyhole Pendant Necklace", enamel=["teal"],
    dims="pendant 9 x 14 mm", piece_g=0.9,
    title="Keyhole Pendant Necklace, Teal Enamel Keyhole Charm on Solid Gold Chain, Minimalist Layering Necklace",
    tags=["keyhole necklace", "teal necklace", "enamel pendant", "keyhole pendant", "teal jewelry",
          "layering necklace", "gold charm necklace", "minimalist pendant", "dainty necklace", "14k enamel pendant"],
    lead="A keyhole-shaped pendant in solid gold, filled edge to edge with teal enamel.",
    story="Here the keyhole becomes the whole piece: a solid silhouette of teal glass fused to gold, held by a neat polished rim. It hangs close to the collarbone and layers with plain chains.",
    shape="a keyhole-shaped pendant 9 by 14 mm (a round top joined to a tapered lower slot) completely filled with flat deep teal enamel inside a thin polished gold rim, hanging from a small polished gold bail on a fine 1.2 mm gold cable chain; the chain passes through the bail and curves softly out of the top of the frame")
add(id="E01", fam="Keyhole", cat="earring", name="Keyhole Stud Earrings", enamel=["teal"],
    dims="each stud 4 x 6 mm", piece_g=0.7,
    title="Keyhole Stud Earrings, Tiny Teal Enamel Studs in Solid Gold, Minimalist Second Hole Earrings",
    tags=["keyhole earrings", "teal stud earrings", "enamel studs", "tiny gold studs", "teal jewelry",
          "second hole studs", "minimalist studs", "keyhole studs", "dainty earrings", "14k enamel studs"],
    lead="Tiny keyhole studs in solid gold with flush teal enamel.", backs="screw backs",
    story="The smallest way into the Keyhole family: two little silhouettes of teal glass that read as colour from across a room and as a shape up close. Good for a first or second hole.",
    shape="a pair of tiny keyhole-shaped stud earrings, each 4 by 6 mm, filled with flat deep teal enamel inside a thin polished gold rim, with gold posts; one earring lies flat, the other stands slightly angled to show the post")
add(id="B01", fam="Keyhole", cat="bracelet", name="Keyhole Station Bracelet", enamel=["teal"],
    dims="three keyhole stations, each 5 x 7 mm", piece_g=0.6,
    title="Keyhole Station Bracelet, Three Teal Enamel Keyholes on Solid Gold Chain, Dainty Enamel Bracelet",
    tags=["keyhole bracelet", "teal bracelet", "enamel bracelet", "station bracelet", "teal jewelry",
          "dainty bracelet", "gold chain bracelet", "stacking bracelet", "minimalist bracelet", "14k enamel bracelet"],
    lead="Three small teal enamel keyholes set along a fine solid gold chain.",
    story="Spaced evenly around the wrist, the three keyholes catch light one at a time as you move. The chain is fine and the stations are flat, so it slides under a cuff and stacks with a watch.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with three small keyhole-shaped stations 5 by 7 mm spaced evenly along the chain, each filled with flat deep teal enamel inside a thin polished gold rim; spring ring clasp")

# ============================================================ 2 DOMINO (black + cream)
add(id="R02", fam="Domino", cat="ring", name="Domino Bar Ring", enamel=["black", "cream"],
    dims="tile 5 x 10 mm", top_g=0.9, shank_g=1.3,
    title="Domino Bar Ring, Black and Cream Enamel Tile in Solid Gold, Graphic Minimalist Statement Ring",
    tags=["domino ring", "black enamel ring", "enamel bar ring", "graphic ring", "black and cream",
          "gold bar ring", "game night gift", "domino jewelry", "modern gold ring", "14k enamel ring"],
    lead="An east-west domino tile in solid gold: one half ink black, one half cream, with polished gold pips.",
    story="Black enamel is the season's graphic accent, and the domino gives it a reason to be there. A gold line splits the tile, the pips are raised polished gold, and the whole thing sits flat across the finger.",
    shape="a polished gold ring with a flat horizontal rectangular tile top 5 by 10 mm; a thin gold line divides the tile into two squares, the left square filled with flat glossy ink black enamel, the right square with flat warm cream enamel, each square carrying small round polished gold dots like domino pips; round smooth shank")
add(id="N02", fam="Domino", cat="necklace", name="Domino Drop Necklace", enamel=["black", "cream"],
    dims="tile 7 x 14 mm", piece_g=1.0,
    title="Domino Pendant Necklace, Black and Cream Enamel Tile on Solid Gold Chain, Graphic Layering Necklace",
    tags=["domino necklace", "black enamel pendant", "graphic necklace", "black and cream", "domino pendant",
          "layering necklace", "gold tile pendant", "modern pendant", "game night gift", "14k enamel pendant"],
    lead="A vertical domino tile pendant in solid gold, black above and cream below.",
    story="Hung upright, the domino reads like a small graphic poster at the neckline: three gold pips on black over five on cream, divided by a polished gold line.",
    shape="a vertical rectangular domino tile pendant 7 by 14 mm with rounded corners, divided across the middle by a thin gold line; the upper half is flat glossy ink black enamel with three round polished gold pips, the lower half flat warm cream enamel with five round polished gold pips; hanging from a small gold bail on a fine 1.2 mm gold cable chain that passes through the bail and curves out of the top of the frame")
add(id="E02", fam="Domino", cat="earring", name="Mismatched Domino Studs", enamel=["black", "cream"],
    dims="each stud 4 x 7 mm", piece_g=0.8,
    title="Mismatched Domino Stud Earrings, Black and Cream Enamel Studs in Solid Gold, Graphic Mix and Match Studs",
    tags=["mismatched studs", "domino earrings", "black enamel studs", "mix match earrings", "black and cream",
          "graphic studs", "tiny gold studs", "asymmetric studs", "modern earrings", "14k enamel studs"],
    lead="A mismatched pair: one black domino stud with a single gold pip, one cream stud with two.",
    story="The pair is meant to differ. Black on one ear, cream on the other, the gold pips counting one and two: a small joke that looks considered.",
    shape="a mismatched pair of small rectangular domino stud earrings, each 4 by 7 mm with rounded corners; one stud is flat glossy ink black enamel with one round polished gold pip, the other is flat warm cream enamel with two round polished gold pips; both framed by thin polished gold rims, gold posts")
add(id="B02", fam="Domino", cat="bracelet", name="Domino Link Bracelet", enamel=["black", "cream"],
    dims="five tiles, each 4 x 6 mm", piece_g=1.3,
    title="Domino Link Bracelet, Black and Cream Enamel Tiles on Solid Gold Chain, Graphic Stacking Bracelet",
    tags=["domino bracelet", "black enamel charm", "tile bracelet", "link bracelet", "black and cream",
          "graphic bracelet", "gold chain bracelet", "stacking bracelet", "modern bracelet", "14k enamel bracelet"],
    lead="Five small domino tiles linked along a solid gold chain, alternating black and cream.",
    story="Short lengths of chain join five flat tiles so the bracelet moves like a strand, not a bar. Black, cream, black, cream, black, each with its own count of gold pips.",
    shape="a bracelet of five small rectangular enamel tiles, each 4 by 6 mm with rounded corners, joined by short segments of fine 1.1 mm gold cable chain and laid in a loose curve; tiles alternate flat glossy ink black enamel and flat warm cream enamel, each with one to three tiny round polished gold pips and a thin polished gold rim; spring ring clasp")

# ============================================================ 3 CHERRY (oxblood)
add(id="R03", fam="Cherry", cat="ring", name="Cherry Pair Ring", enamel=["oxblood"],
    dims="two 4 mm cherries on a gold stem", top_g=0.6, shank_g=1.1,
    title="Cherry Ring, Oxblood Enamel Cherries in Solid Gold, Dainty Fruit Stacking Ring",
    tags=["cherry ring", "oxblood enamel", "fruit ring", "dainty gold ring", "red enamel ring",
          "cherry jewelry", "stacking ring", "holiday jewelry", "cute gold ring", "14k enamel ring"],
    lead="Two small oxblood enamel cherries on a polished gold stem, set on a slim solid gold band.",
    story="Oxblood is the winter red, darker and warmer than a summer cherry. The two discs sit side by side on a curved gold stem, low enough to stack.",
    shape="a slim polished gold stacking ring whose top is a pair of two small round flat discs, each 4 mm, side by side and joined by a short curved polished gold stem with a tiny gold leaf; each disc is filled with flat deep oxblood red enamel inside a thin polished gold rim; thin round shank")
add(id="N03", fam="Cherry", cat="necklace", name="Cherry Charm Necklace", enamel=["oxblood"],
    dims="two 6 mm cherries", piece_g=0.9,
    title="Cherry Charm Necklace, Oxblood Enamel Cherry Pendant on Solid Gold Chain, Dainty Holiday Necklace",
    tags=["cherry necklace", "oxblood enamel", "cherry pendant", "fruit necklace", "red enamel pendant",
          "cherry jewelry", "dainty necklace", "holiday jewelry", "gold charm necklace", "14k enamel pendant"],
    lead="A pair of oxblood enamel cherries hanging from a gold stem on a fine solid gold chain.",
    story="The stem forms the bail, so the two cherries swing a little as you move. Deep red glass, polished gold rims, nothing else.",
    shape="a pendant of two round flat discs 6 mm each, filled with flat deep oxblood red enamel inside thin polished gold rims, hanging at slightly different heights from a forked polished gold stem that curls at the top into a loop; a fine 1.2 mm gold cable chain passes through the stem loop and curves out of the top of the frame")
add(id="E03", fam="Cherry", cat="earring", name="Cherry Huggie Earrings", enamel=["oxblood"], protocol="hoop_earrings",
    earline="Earrings: hinged solid gold huggie hoops with a click closure, sold as a pair.",
    dims="11 mm huggies with 5 mm cherry charms", piece_g=1.6,
    title="Cherry Huggie Earrings, Oxblood Enamel Cherry Charms on Solid Gold Huggie Hoops, Dainty Charm Hoops",
    tags=["cherry earrings", "huggie hoops", "charm huggies", "oxblood enamel", "red enamel charm",
          "cherry jewelry", "gold huggies", "holiday jewelry", "dainty hoops", "14k enamel huggies"],
    lead="Small solid gold huggie hoops, each with a single oxblood enamel cherry charm.",
    story="A clean 11 mm hoop that hugs the lobe and a single cherry that moves beneath it. Hinged, so they open and close without tools.",
    shape="a pair of small polished gold huggie hoop earrings 11 mm across, each with a single tiny cherry charm hanging from the bottom: a 5 mm round flat disc of deep oxblood red enamel in a thin polished gold rim with a short curved gold stem")
add(id="B03", fam="Cherry", cat="bracelet", name="Cherry Scatter Bracelet", enamel=["oxblood"],
    dims="five 3.5 mm enamel dots", piece_g=0.5,
    title="Cherry Dot Bracelet, Oxblood Enamel Dots on Solid Gold Chain, Dainty Red Station Bracelet",
    tags=["cherry bracelet", "oxblood enamel", "dot bracelet", "station bracelet", "red enamel",
          "dainty bracelet", "gold chain bracelet", "holiday jewelry", "stacking bracelet", "14k enamel bracelet"],
    lead="Five tiny oxblood enamel dots scattered along a fine solid gold chain.",
    story="Only the colour of the cherry, spaced along the chain like drops of red. The quietest piece of the family.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with five tiny round flat stations 3.5 mm each spaced along it, each filled with flat deep oxblood red enamel inside a thin polished gold rim; spring ring clasp")

# ============================================================ 4 BUTTON (purple)
add(id="R04", fam="Button", cat="ring", name="Button Ring", enamel=["purple"],
    dims="button 9 mm with four open holes", top_g=0.9, shank_g=1.3,
    title="Button Ring, Purple Enamel Button in Solid Gold, Tailoring Inspired Minimalist Ring",
    tags=["button ring", "purple enamel ring", "violet ring", "tailoring jewelry", "purple jewelry",
          "gold button ring", "sewing gift", "minimalist ring", "colorful ring", "14k enamel ring"],
    lead="A round purple enamel button in solid gold, with four real open holes rimmed in polished gold.",
    story="Taken from winter knitwear and tailoring: a small coat button, but in Fresh Purple glass and gold. The four holes go right through, so light shows through the top.",
    shape="a polished gold ring with a round flat button top 9 mm across, filled with flat rich violet purple enamel, with a raised polished gold outer rim and four small open through-holes in the centre, each hole rimmed in polished gold, exactly like a sewing button; round smooth shank")
add(id="N04", fam="Button", cat="necklace", name="Button Pendant Necklace", enamel=["purple"],
    dims="button 12 mm", piece_g=1.3,
    title="Button Pendant Necklace, Purple Enamel Button on Solid Gold Chain, Tailoring Charm Necklace",
    tags=["button necklace", "purple necklace", "enamel pendant", "button pendant", "purple jewelry",
          "tailoring jewelry", "gold charm necklace", "sewing gift", "layering necklace", "14k enamel pendant"],
    lead="A 12 mm purple enamel button hung off-centre from one of its own holes on a solid gold chain.",
    story="The button hangs from a gold ring through one hole, so it tilts slightly: a detail borrowed from a coat hung on a hook.",
    shape="a round flat button pendant 12 mm across with four small open through-holes rimmed in polished gold, filled with flat rich violet purple enamel inside a raised polished gold rim; a small gold jump ring passes through one of the holes so the button hangs slightly tilted from a fine 1.2 mm gold cable chain that curves out of the top of the frame")
add(id="E04", fam="Button", cat="earring", name="Button Stud Earrings", enamel=["purple"],
    dims="each stud 6 mm", piece_g=0.8,
    title="Button Stud Earrings, Purple Enamel Button Studs in Solid Gold, Minimalist Violet Studs",
    tags=["button earrings", "purple studs", "violet studs", "enamel studs", "purple jewelry",
          "tailoring jewelry", "tiny gold studs", "sewing gift", "minimalist studs", "14k enamel studs"],
    lead="Small round button studs in solid gold with purple enamel and four gold-rimmed holes.",
    story="The button at its smallest, 6 mm, flat to the lobe. A clear shot of colour with a tailored edge.",
    shape="a pair of tiny round button stud earrings 6 mm across, filled with flat rich violet purple enamel inside a raised polished gold rim, each with four tiny holes rimmed in polished gold, gold posts; one lies flat, one angled")
add(id="B04", fam="Button", cat="bracelet", name="Button Toggle Bracelet", enamel=["purple"],
    earline="Chain: 1.1 mm solid gold cable chain that closes at the front with the enamel button through a gold loop; choose 6.5, 7 or 7.5 inches.",
    dims="button clasp 10 mm", piece_g=1.0,
    title="Button Toggle Bracelet, Purple Enamel Button Clasp on Solid Gold Chain, Tailoring Inspired Bracelet",
    tags=["button bracelet", "toggle bracelet", "purple bracelet", "enamel clasp", "purple jewelry",
          "tailoring jewelry", "gold chain bracelet", "sewing gift", "front clasp bracelet", "14k enamel bracelet"],
    lead="A solid gold chain bracelet that closes at the front with a purple enamel button.",
    story="The button is the clasp: it passes through a polished gold loop, the way a coat fastens. Easy to do up with one hand.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose curve, fastened at the front by a round flat button 10 mm across filled with flat rich violet purple enamel inside a raised polished gold rim with four small gold-rimmed holes, the button passing through a slim polished gold oval loop at the other end of the chain")

# ============================================================ 5 ACORN (cocoa)
add(id="R05", fam="Acorn", cat="ring", name="Acorn Ring", enamel=["cocoa"],
    dims="acorn 6 x 8 mm", top_g=0.7, shank_g=1.2,
    title="Acorn Ring, Cocoa Brown Enamel Acorn in Solid Gold, Autumn Nature Ring",
    tags=["acorn ring", "brown enamel ring", "autumn ring", "nature ring", "cocoa brown",
          "acorn jewelry", "woodland ring", "fall ring", "gold acorn", "14k enamel ring"],
    lead="A small upright acorn on a solid gold band: cocoa enamel body, textured gold cap.",
    story="Cocoa Powder is the season's brown, and the acorn is its oldest shape. The body is flat glass; the cap is gold with a fine crosshatch, so the two surfaces play against each other.",
    shape="a polished gold ring with a small upright acorn on top, 6 by 8 mm: the rounded acorn body is a flat cell of cocoa brown enamel inside a thin polished gold rim, the cap above it is solid gold with a fine engraved crosshatch texture and a tiny stem; round smooth shank")
add(id="N05", fam="Acorn", cat="necklace", name="Acorn Drop Necklace", enamel=["cocoa"],
    dims="acorn 8 x 12 mm", piece_g=1.2,
    title="Acorn Necklace, Cocoa Enamel Acorn Pendant on Solid Gold Chain, Autumn Nature Charm Necklace",
    tags=["acorn necklace", "acorn pendant", "autumn necklace", "nature necklace", "cocoa brown",
          "woodland jewelry", "gold charm necklace", "fall necklace", "brown enamel", "14k enamel pendant"],
    lead="An acorn pendant in solid gold with a cocoa enamel body and a textured gold cap.",
    story="The stem loops into its own bail, so the acorn hangs straight and turns a little. A small collectible for the season.",
    shape="an acorn pendant 8 by 12 mm: the rounded body is filled with flat cocoa brown enamel inside a thin polished gold rim, the cap is solid gold with a fine crosshatch texture and its stem curls into a loop; a fine 1.2 mm gold cable chain passes through the loop and curves out of the top of the frame")
add(id="E05", fam="Acorn", cat="earring", name="Acorn Drop Earrings", enamel=["cocoa"], protocol="dangle_earrings",
    dims="acorns 5 x 7 mm, total drop 17 mm", piece_g=1.0,
    title="Acorn Drop Earrings, Cocoa Enamel Acorns in Solid Gold, Autumn Woodland Dangle Earrings",
    tags=["acorn earrings", "drop earrings", "autumn earrings", "woodland earrings", "cocoa brown",
          "acorn jewelry", "gold dangle", "fall earrings", "brown enamel", "14k enamel earrings"],
    lead="Little cocoa enamel acorns hanging below small solid gold studs.",
    story="A short drop, about 17 mm in all, so they move without swinging. Textured gold caps, flat brown glass bodies.",
    shape="a pair of short drop earrings: each has a tiny round polished gold stud and, hanging 10 mm below on a fine gold link, a small acorn 5 by 7 mm with a flat cocoa brown enamel body in a thin gold rim and a crosshatched solid gold cap")
add(id="B05", fam="Acorn", cat="bracelet", name="Acorn Charm Bracelet", enamel=["cocoa"],
    dims="two acorns 5 x 7 mm", piece_g=0.8,
    title="Acorn Charm Bracelet, Two Cocoa Enamel Acorns on Solid Gold Chain, Autumn Nature Bracelet",
    tags=["acorn bracelet", "charm bracelet", "autumn bracelet", "nature bracelet", "cocoa brown",
          "woodland jewelry", "gold chain bracelet", "fall bracelet", "brown enamel", "14k enamel bracelet"],
    lead="Two small acorn charms hanging together from a fine solid gold chain.",
    story="A pair of acorns at the centre of the wrist, one slightly lower than the other, like two picked on the same walk.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval, with two small acorn charms 5 by 7 mm hanging together at the centre at slightly different heights; each acorn has a flat cocoa brown enamel body in a thin polished gold rim and a crosshatched solid gold cap; spring ring clasp")

# ============================================================ 6 CHECKER (chartreuse + cream)
add(id="R06", fam="Checker", cat="ring", name="Checkerboard Signet Ring", enamel=["chartreuse", "cream"],
    dims="top 8 x 8 mm, 3 x 3 grid", top_g=1.0, shank_g=1.3,
    title="Checkerboard Signet Ring, Chartreuse and Cream Enamel in Solid Gold, Graphic Square Signet",
    tags=["checkerboard ring", "checker ring", "square signet", "chartreuse ring", "green enamel ring",
          "graphic ring", "gold signet ring", "colorful signet", "y2k jewelry", "14k enamel ring"],
    lead="A square signet in solid gold with a 3 x 3 checkerboard of chartreuse and cream enamel.",
    story="Green Glow is the season's brightest colour; set against cream inside a fine gold grid it becomes graphic rather than loud. Nine small cells, all flat.",
    shape="a polished gold ring with a flat square signet top 8 by 8 mm divided by a fine polished gold grid into a 3 by 3 checkerboard; the cells alternate flat bright chartreuse yellow green enamel and flat warm cream enamel; round smooth shank")
add(id="N06", fam="Checker", cat="necklace", name="Checker Diamond Necklace", enamel=["chartreuse", "cream"],
    dims="square 10 mm, hung on its point", piece_g=1.0,
    title="Checkerboard Pendant Necklace, Chartreuse and Cream Enamel on Solid Gold Chain, Graphic Layering Necklace",
    tags=["checker necklace", "checkerboard pendant", "chartreuse pendant", "green enamel", "graphic necklace",
          "layering necklace", "gold square pendant", "colorful necklace", "y2k jewelry", "14k enamel pendant"],
    lead="A 10 mm square pendant hung on its point, quartered corner to corner in gold into chartreuse and cream enamel triangles.",
    story="Turned 45 degrees and crossed from point to point by a fine gold line, the square becomes a diamond of four alternating triangles, a pinwheel of colour at the neckline.",
    shape="a square pendant 10 mm turned 45 degrees so it hangs on one point, divided corner to corner by a fine polished gold cross into four triangles alternating flat bright chartreuse yellow green enamel and flat warm cream enamel, framed by a polished gold rim; a small gold bail at the top point on a fine 1.2 mm gold cable chain that passes through the bail and curves out of the top of the frame")
add(id="E06", fam="Checker", cat="earring", name="Checker Mini Studs", enamel=["chartreuse", "cream"],
    dims="each stud 5 x 5 mm", piece_g=0.7,
    title="Checker Stud Earrings, Tiny Chartreuse and Cream Enamel Squares in Solid Gold, Graphic Mini Studs",
    tags=["checker earrings", "square studs", "chartreuse studs", "green enamel studs", "graphic studs",
          "tiny gold studs", "second hole studs", "colorful studs", "y2k jewelry", "14k enamel studs"],
    lead="Tiny square studs in solid gold, each a 2 x 2 checker of chartreuse and cream enamel.",
    story="The checker at 5 mm: four cells of colour set flat against the lobe, a small graphic accent.",
    shape="a pair of tiny square stud earrings 5 by 5 mm, each divided by a fine polished gold cross into a 2 by 2 checker of flat bright chartreuse yellow green enamel and flat warm cream enamel, framed by a polished gold rim, gold posts")
add(id="B06", fam="Checker", cat="bracelet", name="Checker Bar Bracelet", enamel=["chartreuse", "cream"],
    dims="bar 4 x 16 mm, four cells", piece_g=0.8,
    title="Checker Bar Bracelet, Chartreuse and Cream Enamel Bar on Solid Gold Chain, Graphic Stacking Bracelet",
    tags=["checker bracelet", "bar bracelet", "chartreuse bracelet", "green enamel", "graphic bracelet",
          "gold chain bracelet", "stacking bracelet", "colorful bracelet", "y2k jewelry", "14k enamel bracelet"],
    lead="A slim horizontal bar of four alternating chartreuse and cream enamel cells on a solid gold chain.",
    story="One line of the checkerboard, 16 mm long, sitting flat across the top of the wrist.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval with a slim horizontal bar 4 by 16 mm at the centre, divided by fine polished gold lines into four square cells alternating flat bright chartreuse yellow green enamel and flat warm cream enamel, framed by a polished gold rim; spring ring clasp")

# ============================================================ 7 CRUSH (berry)
add(id="R07", fam="Crush", cat="ring", name="Crush Heart Stacking Ring", enamel=["berry"],
    dims="heart 6 mm", top_g=0.4, shank_g=1.0,
    title="Heart Stacking Ring, Berry Pink Enamel Heart in Solid Gold, Dainty Everyday Heart Ring",
    tags=["heart ring", "pink heart ring", "berry enamel", "stacking ring", "dainty heart ring",
          "enamel heart", "valentines gift", "gift for girlfriend", "thin gold ring", "14k enamel ring"],
    lead="A thin solid gold stacking ring with a small, slightly lopsided berry enamel heart.",
    story="The heart is drawn a little off balance on purpose, like one sketched by hand. Berry pink is the deep winter pink, not a pastel.",
    shape="a thin polished gold stacking ring with a small slightly asymmetric hand-drawn heart 6 mm on top, filled with flat deep berry pink enamel inside a thin polished gold rim; very slim round shank")
add(id="N07", fam="Crush", cat="necklace", name="Crush Heart Necklace", enamel=["berry"],
    dims="heart 10 mm", piece_g=1.0,
    title="Heart Necklace, Berry Pink Enamel Heart Pendant on Solid Gold Chain, Dainty Valentine Gift",
    tags=["heart necklace", "pink heart pendant", "berry enamel", "enamel heart", "valentines gift",
          "gift for girlfriend", "dainty necklace", "gold heart pendant", "layering necklace", "14k enamel pendant"],
    lead="A 10 mm lopsided heart pendant in solid gold, filled with berry pink enamel.",
    story="A heart with a little lean to it, deep berry glass in a polished rim. A winter gift that runs straight into Valentine's Day.",
    shape="a slightly asymmetric hand-drawn heart pendant 10 mm, filled with flat deep berry pink enamel inside a thin polished gold rim, hanging from a small gold bail on a fine 1.2 mm gold cable chain that passes through the bail and curves out of the top of the frame")
add(id="E07", fam="Crush", cat="earring", name="Crush Heart Drop Earrings", enamel=["berry"], protocol="dangle_earrings",
    dims="hearts 7 mm on a 15 mm chain drop", piece_g=0.9,
    title="Heart Drop Earrings, Berry Pink Enamel Hearts on Fine Solid Gold Chain, Dainty Dangle Earrings",
    tags=["heart earrings", "drop earrings", "pink heart earrings", "berry enamel", "chain drop earrings",
          "dangle earrings", "valentines gift", "gift for girlfriend", "dainty earrings", "14k enamel earrings"],
    lead="Small berry enamel hearts on short fine chains below solid gold studs.",
    story="Each heart hangs on 15 mm of fine chain, so it moves and catches light with every turn of the head.",
    shape="a pair of dangle earrings: a tiny round polished gold stud with a 15 mm length of fine gold chain below, ending in a small slightly asymmetric heart 7 mm filled with flat deep berry pink enamel inside a thin polished gold rim")
add(id="B07", fam="Crush", cat="bracelet", name="Crush Heart Cuff", enamel=["berry"], protocol="cuff_bracelet",
    dims="open cuff 1.6 mm wide, heart 6 mm", piece_g=3.7, cuff=True,
    title="Heart Cuff Bracelet, Berry Pink Enamel Heart on Slim Solid Gold Open Cuff, Dainty Stacking Cuff",
    tags=["heart cuff", "open cuff bracelet", "gold cuff", "berry enamel", "pink heart bracelet",
          "stacking cuff", "valentines gift", "gift for girlfriend", "slim gold bangle", "14k enamel cuff"],
    lead="A slim open cuff in solid gold with a small berry enamel heart at the front.",
    story="A 1.6 mm band of solid gold that slips on from the side, with one small lopsided heart where the wrist turns.",
    shape="a slim open cuff bracelet made of a 1.6 mm wide polished solid gold band, shown standing on its edge in a three-quarter view, with one small slightly asymmetric heart 6 mm at the front centre filled with flat deep berry pink enamel inside a thin polished gold rim; smooth rounded open ends")

# ============================================================ 8 BOW (navy)
add(id="R08", fam="Bow", cat="ring", name="Bow Ring", enamel=["navy"],
    dims="bow 10 x 6 mm", top_g=0.8, shank_g=1.3,
    title="Bow Ring, Navy Enamel Ribbon Bow in Solid Gold, Minimalist Statement Ring",
    tags=["bow ring", "ribbon ring", "navy enamel ring", "blue enamel ring", "bow jewelry",
          "navy jewelry", "coquette ring", "gift for her ring", "gold bow ring", "14k enamel ring"],
    lead="A flat ribbon bow in solid gold, its loops filled with ocean navy enamel.",
    story="The bow stays flat and graphic: two navy loops, a polished gold knot, short tails. It sits across the finger like a tied ribbon.",
    shape="a polished gold ring with a ribbon bow on top, 10 by 6 mm, made as one flat solid plate like a cut-out silhouette, not a three-dimensional tied ribbon and with no open loops: two loop shapes and two short tails, each a flat cell of deep ocean navy blue enamel inside thin polished gold rims, the centre knot a small flat polished gold oval; round smooth shank")
add(id="N08", fam="Bow", cat="necklace", name="Bow Pendant Necklace", enamel=["navy"],
    dims="bow 12 x 9 mm", piece_g=1.2,
    title="Bow Necklace, Navy Enamel Ribbon Bow Pendant on Solid Gold Chain, Minimalist Gift Necklace",
    tags=["bow necklace", "ribbon necklace", "navy necklace", "bow pendant", "blue enamel pendant",
          "coquette jewelry", "gift necklace", "gold bow pendant", "layering necklace", "14k enamel pendant"],
    lead="A flat ribbon bow pendant in solid gold with ocean navy enamel loops and tails, the loop centres pierced open.",
    story="The chain runs through a small bail rising behind the gold knot, so the bow sits straight at the collarbone like a gift that has just been tied.",
    shape="a ribbon bow pendant 12 by 9 mm made as one flat solid plate like a cut-out silhouette, not a three-dimensional tied ribbon and with no open loops: two loop shapes and two longer tails, each a flat cell of deep ocean navy blue enamel inside thin polished gold rims, the centre knot a small flat polished gold oval with a small bail behind it; a fine 1.2 mm gold cable chain passes through the bail and curves out of the top of the frame")
add(id="E08", fam="Bow", cat="earring", name="Bow Stud Earrings", enamel=["navy"],
    dims="each bow 7 x 5 mm", piece_g=0.9,
    title="Bow Stud Earrings, Navy Enamel Ribbon Bows in Solid Gold, Dainty Minimalist Studs",
    tags=["bow earrings", "bow studs", "ribbon earrings", "navy studs", "blue enamel studs",
          "coquette earrings", "tiny gold studs", "bow jewelry", "dainty studs", "14k enamel studs"],
    lead="Small ribbon bow studs in solid gold with navy enamel.",
    story="The bow at 7 mm, flat to the ear, polished gold knot in the middle. Navy keeps it grown-up.",
    shape="a pair of small flat ribbon bow stud earrings 7 by 5 mm, loops and tails filled with flat deep ocean navy blue enamel inside thin polished gold rims, solid polished gold centre knot, gold posts")
add(id="B08", fam="Bow", cat="bracelet", name="Bow Bracelet", enamel=["navy"],
    dims="bow 6 x 4 mm", piece_g=0.5,
    title="Bow Bracelet, Navy Enamel Ribbon Bow on Fine Solid Gold Chain, Dainty Gift Bracelet",
    tags=["bow bracelet", "ribbon bracelet", "navy bracelet", "blue enamel", "coquette jewelry",
          "dainty bracelet", "gold chain bracelet", "bow jewelry", "stacking bracelet", "14k enamel bracelet"],
    lead="A tiny navy enamel bow set at the centre of a fine solid gold chain.",
    story="One small bow on a fine chain, the kind of piece that becomes the one you never take off.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval with a tiny flat ribbon bow 6 by 4 mm set at the centre, its loops filled with flat deep ocean navy blue enamel inside thin polished gold rims and a solid polished gold knot; spring ring clasp")

# ============================================================ 9 GINKGO (moss)
add(id="R09", fam="Ginkgo", cat="ring", name="Ginkgo Open Ring", enamel=["moss"],
    dims="leaf 8 mm, open ring", top_g=0.7, shank_g=1.2,
    title="Ginkgo Leaf Ring, Moss Green Enamel Open Ring in Solid Gold, Autumn Nature Bypass Ring",
    tags=["ginkgo ring", "leaf ring", "open ring", "moss green ring", "green enamel ring",
          "nature ring", "autumn ring", "bypass ring", "botanical ring", "14k enamel ring"],
    lead="An open solid gold ring that ends in a moss green enamel ginkgo leaf on one side and a gold bud on the other.",
    story="The ginkgo fan is split at its centre by a polished gold vein. The two ends pass each other on the finger, so the ring reads light and a little asymmetric.",
    shape="an open bypass ring in polished gold: one end finishes in a small fan-shaped ginkgo leaf 8 mm wide, the leaf split down the middle by a polished gold vein and filled with flat muted moss olive green enamel inside thin polished gold rims; the other end finishes in a small round polished gold bud; the two ends pass side by side")
add(id="N09", fam="Ginkgo", cat="necklace", name="Ginkgo Lariat Necklace", enamel=["moss"],
    dims="leaf 10 mm on a 30 mm drop", piece_g=1.3,
    title="Ginkgo Lariat Necklace, Moss Green Enamel Leaf Y Necklace in Solid Gold, Autumn Botanical Necklace",
    tags=["ginkgo necklace", "lariat necklace", "y necklace", "leaf necklace", "moss green",
          "green enamel", "botanical necklace", "autumn necklace", "drop necklace", "14k enamel lariat"],
    lead="A Y-shaped lariat in solid gold with a moss green enamel ginkgo leaf at the end of a 30 mm drop.",
    story="The drop falls from the centre of the chain and the leaf turns at its end, so the necklace frames the neckline in a long line.",
    shape="a Y-shaped lariat necklace in fine 1.2 mm gold cable chain: from the centre point a single 30 mm length of chain drops down and ends in a fan-shaped ginkgo leaf 10 mm wide, split by a polished gold vein and filled with flat muted moss olive green enamel inside thin polished gold rims; the chain curves out of the top of the frame")
add(id="E09", fam="Ginkgo", cat="earring", name="Ginkgo Leaf Drop Earrings", enamel=["moss"], protocol="dangle_earrings",
    dims="leaves 9 mm", piece_g=1.1,
    title="Ginkgo Leaf Earrings, Moss Green Enamel Leaf Drops in Solid Gold, Autumn Botanical Earrings",
    tags=["ginkgo earrings", "leaf earrings", "drop earrings", "moss green", "green enamel",
          "botanical earrings", "autumn earrings", "nature earrings", "dangle earrings", "14k enamel earrings"],
    lead="Moss green enamel ginkgo leaves hanging from small solid gold studs.",
    story="Each leaf hangs from its stem, which is part of the gold drop, so the fan turns gently against the neck.",
    shape="a pair of drop earrings: a tiny round polished gold stud, below it a short polished gold stem ending in a fan-shaped ginkgo leaf 9 mm wide, split by a polished gold vein and filled with flat muted moss olive green enamel inside thin polished gold rims")
add(id="B09", fam="Ginkgo", cat="bracelet", name="Ginkgo Three Leaf Bracelet", enamel=["moss"],
    dims="three leaves 6 mm", piece_g=0.9,
    title="Ginkgo Leaf Bracelet, Three Moss Green Enamel Leaves on Solid Gold Chain, Autumn Station Bracelet",
    tags=["ginkgo bracelet", "leaf bracelet", "station bracelet", "moss green", "green enamel",
          "botanical bracelet", "autumn bracelet", "nature bracelet", "gold chain bracelet", "14k enamel bracelet"],
    lead="Three small moss green enamel ginkgo leaves set along a fine solid gold chain.",
    story="Three leaves, each turned a little differently, like ones caught on the same branch.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval with three small fan-shaped ginkgo leaf stations 6 mm wide spaced along it, each turned at a slightly different angle, split by a polished gold vein and filled with flat muted moss olive green enamel inside thin polished gold rims; spring ring clasp")

# ============================================================ 10 WICK (cream + amber)
add(id="R10", fam="Wick", cat="ring", name="Candle Stacking Ring", enamel=["cream", "amber"],
    dims="candle 3 x 7 mm with 2 x 3 mm flame", top_g=0.4, shank_g=1.0,
    title="Candle Ring, Cream and Amber Enamel Candle on Thin Solid Gold Band, Dainty Holiday Stacking Ring",
    tags=["candle ring", "flame ring", "holiday ring", "stacking ring", "cream enamel",
          "amber enamel", "winter jewelry", "dainty gold ring", "thin gold ring", "14k enamel ring"],
    lead="A thin solid gold band with a tiny upright candle: cream enamel column, amber enamel flame.",
    story="Wax Paper cream, the season's quiet neutral, meets one warm drop of amber. The candle stands across the band, small enough to stack with anything.",
    shape="a thin polished gold stacking ring with a tiny upright candle on top: a slim rectangular column 3 by 7 mm filled with flat warm cream white enamel, and above it a small teardrop flame 2 by 3 mm filled with flat warm honey amber enamel, both inside thin polished gold rims; very slim round shank")
add(id="N10", fam="Wick", cat="necklace", name="Candle Pendant Necklace", enamel=["cream", "amber"],
    dims="candle 3 x 14 mm with 3 x 5 mm flame", piece_g=0.8,
    title="Candle Necklace, Cream and Amber Enamel Candle Pendant on Solid Gold Chain, Holiday Gift Necklace",
    tags=["candle necklace", "flame necklace", "holiday necklace", "cream enamel", "amber enamel",
          "winter jewelry", "gift necklace", "bar pendant", "layering necklace", "14k enamel pendant"],
    lead="A slim candle pendant in solid gold: a tall cream enamel column and an amber enamel flame.",
    story="Long and narrow, it reads like a small bar pendant until you see the flame at the top.",
    shape="a slim vertical candle pendant: a narrow rectangular column 3 by 14 mm filled with flat warm cream white enamel and above it a teardrop flame 3 by 5 mm filled with flat warm honey amber enamel, both inside thin polished gold rims, a tiny gold bail above the flame on a fine 1.2 mm gold cable chain that passes through the bail and curves out of the top of the frame")
add(id="E10", fam="Wick", cat="earring", name="Flame Stud Earrings", enamel=["amber"],
    dims="each flame 4 x 6 mm", piece_g=0.6,
    title="Flame Stud Earrings, Amber Enamel Flame Studs in Solid Gold, Dainty Holiday Studs",
    tags=["flame earrings", "flame studs", "amber enamel", "holiday earrings", "candle earrings",
          "winter jewelry", "tiny gold studs", "second hole studs", "dainty studs", "14k enamel studs"],
    lead="Tiny amber enamel flames as solid gold studs.",
    story="Only the flame from the candle, 6 mm tall, warm against the lobe through the dark months.",
    shape="a pair of tiny teardrop flame stud earrings 4 by 6 mm, pointed tip up, filled with flat warm honey amber enamel inside a thin polished gold rim, gold posts")
add(id="B10", fam="Wick", cat="bracelet", name="Twin Candle Bracelet", enamel=["cream", "amber"],
    dims="two candles 2.5 x 10 mm on an 8 mm base bar", piece_g=0.8,
    title="Candle Bracelet, Two Cream and Amber Enamel Candles on Solid Gold Chain, Dainty Holiday Bracelet",
    tags=["candle bracelet", "flame bracelet", "holiday bracelet", "cream enamel", "amber enamel",
          "winter jewelry", "gold chain bracelet", "dainty bracelet", "stacking bracelet", "14k enamel bracelet"],
    lead="Two small cream and amber enamel candles standing side by side on a slim gold base set into a fine solid gold chain.",
    story="A pair of candles at the centre of the wrist, one a little taller than the other.",
    shape="a fine 1.1 mm gold cable chain bracelet laid in a loose oval; at the centre a slim flat polished gold base bar 8 mm long is part of the chain, the chain soldered to each end of the bar; on top of the bar two slim candles stand upright side by side and are joined to it, 2.5 by 9 mm and 2.5 by 10 mm, each a cream white enamel column topped by a tiny warm honey amber enamel flame, all inside thin polished gold rims; spring ring clasp")

# ---------------------------------------------------------------- assembly
CAT_TAGS = {}
DETAIL = {
    "ring": "Ring size: US 3 to 16, whole and half sizes.",
    "necklace": "Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.",
    "bracelet": "Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.",
    "earring": "Earrings: solid gold posts with butterfly backs, sold as a pair.",
}
# Must be ids from lib/etsy/listing-protocol.ts; an unknown id silently falls back to product_type
# ("ring" -> wedding_band, which demands Width + Ring Size and would fail the Etsy push).
PROTOCOL = {"ring": "sculptural_ring", "necklace": "pendant_necklace", "bracelet": "chain_bracelet", "earring": "stud_earrings"}
KNOWN_PROTOCOLS = {"sculptural_ring", "pendant_necklace", "chain_bracelet", "cuff_bracelet", "stud_earrings", "dangle_earrings", "hoop_earrings"}
AXES = {"ring": ["Karat", "Metal Color", "Ring Size"], "necklace": ["Karat", "Metal Color", "Chain Length"],
        "bracelet": ["Karat", "Metal Color", "Bracelet Length"], "earring": ["Karat", "Metal Color"]}

PROMPT = ("Studio product photograph of one fine jewelry piece: {shape}. Solid polished 14K yellow gold with "
          "flat, glossy kiln-fired vitreous enamel set flush inside recessed cells, every cell framed by a thin "
          "polished gold rim; the enamel is perfectly flat and smooth, not domed, not cabochon, no gradient, no "
          "painted detail, no stones. Enamel colour: {colours}. Resting on warm off-white textured paper, soft "
          "diffused daylight from the upper left, a gentle natural shadow, shallow depth of field, true-to-life "
          "small scale, three-quarter front view from slightly above, centred, calm minimal composition. No props, "
          "no hands, no text, no logo, no packaging. Photorealistic high-end commercial jewelry photography, "
          "square format.")

def sizes(cat):
    return {"ring": RING_SIZES, "necklace": NECK_LEN, "bracelet": BRAC_LEN, "earring": [None]}[cat]

def ref_size(cat):
    return {"ring": 7, "necklace": 18, "bracelet": 7, "earring": None}[cat]

def size_label(cat, s):
    if cat == "ring":
        return "US " + (str(int(s)) if s == int(s) else str(s))
    if cat == "necklace":
        return f"{s} inches"
    if cat == "bracelet":
        return (str(int(s)) if s == int(s) else str(s)) + " inches"
    return None

def size_code(cat, s):
    if cat == "ring":
        return "US" + (str(int(s)) if s == int(s) else str(s).replace(".", "_"))
    if cat in ("necklace", "bracelet"):
        return (str(int(s)) if s == int(s) else str(s).replace(".", "_")) + "IN"
    return None

IMG = {}
if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "images.json")):
    IMG = {r["id"]: r for r in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "images.json")))["images"]}

BAN = ["—", "–", "â"]
out = []
seen_titles, seen_sku = set(), set()
assert len(M) == 40
for m in M:
    cat = m["cat"]
    assert len([x for x in M if x["cat"] == cat]) == 10
    tags = m["tags"] + SHARED_TAGS
    assert len(tags) == 13 and len(set(tags)) == 13, (m["id"], len(tags))
    for t in tags:
        assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), (m["id"], t)
    assert len(m["title"]) <= 140 and m["title"] not in seen_titles, m["id"]
    seen_titles.add(m["title"])
    colours = [EN[c][0] for c in m["enamel"]]
    desc = "\n\n".join([
        m["lead"],
        m["story"],
        "\n".join([
            "Metal: solid 10K, 14K or 18K gold in yellow, white or rose.",
            f"Enamel: kiln-fired vitreous enamel in {' and '.join(colours)}, set flush in recessed cells with polished gold rims.",
            f"Size: {m['dims']}.",
            m.get("earline", DETAIL[cat].replace("butterfly backs", m.get("backs", "butterfly backs"))) if not m.get("cuff") else "Cuff: open, 1.6 mm wide; choose 6.5, 7 or 7.5 inches inner circumference.",
        ]),
        "Each piece is made to order and ships free within the United States from New Jersey. Add a gift message at checkout and it ships with the piece.",
        "Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off for the gym and the dishes and wipe it with a soft cloth.",
        "The product images are design visualizations of the finished piece, and the three-metal image is a colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.",
    ])
    for b in BAN:
        assert b not in desc + m["title"] + " ".join(tags), (m["id"], b)
    base_sku = f"BAS-FW-{m['id']}"
    variants = []
    for k in KARATS:
        for cc, cn in COLORS:
            for s in sizes(cat):
                sc = size_code(cat, s)
                sku = f"{base_sku}-{k}{cc}" + (f"-{sc}" if sc else "")
                assert len(sku) <= 32 and sku not in seen_sku, sku
                seen_sku.add(sku)
                props = {"Karat": k, "Metal Color": cn}
                if sc:
                    props[AXES[cat][2]] = size_label(cat, s)
                g = grams14(m, s if s is not None else 0) * DENSITY[k]
                variants.append({"sku": sku, "properties": props, "grams": round(g, 2),
                                 "price_cents": price_cents(m, k, s if s is not None else 0)})
    n = len(variants)
    assert n == {"ring": 243, "necklace": 27, "bracelet": 27, "earring": 9}[cat] and n <= 400
    rs = ref_size(cat)
    ref = next(v for v in variants if v["properties"]["Karat"] == "14K" and v["properties"]["Metal Color"] == "Yellow Gold"
               and (rs is None or v["properties"].get(AXES[cat][2]) == size_label(cat, rs)))
    assert m.get("protocol", PROTOCOL[cat]) in KNOWN_PROTOCOLS, m["id"]
    out.append({
        "id": m["id"], "family": m["fam"], "productType": cat, "name": m["name"],
        "productId": str(uuid.uuid5(NS, SOURCE + ":" + m["id"])), "sku": base_sku,
        "title": m["title"], "tags": tags, "materials": ["Solid gold", "Vitreous enamel"],
        "description": desc, "enamel": colours, "dims": m["dims"],
        "listingProtocol": m.get("protocol", PROTOCOL[cat]), "offersPersonalization": False, "variationAxes": AXES[cat],
        "grams14Ref": round(grams14(m, rs if rs is not None else 0), 2),
        "refPriceCents": ref["price_cents"], "variants": variants,
        "imagePrompt": PROMPT.format(shape=m["shape"], colours=", ".join(EN[c][1] for c in m["enamel"])),
        "imageFile": f"{m['id']}.jpg",
        "imageUrl": IMG.get(m["id"], {}).get("url"), "imageSha256": IMG.get(m["id"], {}).get("sha256"),
        "params": {k: m[k] for k in ("top_g", "shank_g", "piece_g", "cuff") if k in m},
    })

basis = {"spotUsdOzt": SPOT_USD_OZT, "spotSource": "gold-api.com 2026-09-30T11:21Z", "loss": LOSS,
         "purity": PURITY, "densityVs14K": DENSITY, "laborUsd": LABOR, "markup": MARKUP,
         "rule": "price = ceil(2 x (grams_k x spot/31.1034768 x purity x 1.07 + labor_category) / 10) x 10",
         "laborSource": "owner 14K cost quotes for the 2027 enamel set minus their 14K gold at this spot"}
json.dump({"source": SOURCE, "org": ORG, "pricingBasis": basis, "items": out},
          open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
tot = sum(len(i["variants"]) for i in out)
print("items", len(out), "variants", tot, "labor", LABOR)
for i in out:
    ps = [v["price_cents"] for v in i["variants"]]
    print(i["id"], i["name"], "ref", i["grams14Ref"], "g", i["refPriceCents"] // 100, "USD", "range", min(ps) // 100, max(ps) // 100)
