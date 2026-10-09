"""Artifact Studio Evil Eye: 30 listing proposals (10 families x ring, necklace, bracelet).

Step 2 of the set: catalog and pricing only. No images, nothing in the panel or on Etsy.
Single source of truth for copy, sizes, estimated grams and prices.
Run: python3 docs/artifact-studio/evil-eye/catalog.py
Writes catalog.json and seal.json next to this file and fails loudly on any rule break.
Direction: 01-design-direction.md. The owner answered its three decisions on 2026-10-09: two-tone
pair labels yes, bracelet basis (a) with the (b) fallback, the ten families as written. The
generator reads that file and fails if a product name, a gram value or an indicative price drifts.
Pricing: 2 x maker cost (../maker_cost.py), the rule of the Christmas 2026 and For Him 2026 sets.
"""
import hashlib, json, re, sys, uuid, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("7edcee5a-1da0-4cc0-b87d-399b71058314")
SOURCE = "artifact-evil-eye-v1"
PREFIX = "BAS-EE-"
PKG = "2026-10-09-artifact-evil-eye"
PKG_PATH = "docs/artifact-studio/evil-eye"

sys.path.insert(0, str(HERE.parent))
import maker_cost as mk  # noqa: E402

RING_SIZES = [x / 2 for x in range(6, 33)]          # US 3 .. 16, whole and half = 27
NECK_LEN = [16, 18, 20]
BRAC_LEN = [6.5, 7, 7.5]
KARATS = ["10K", "14K", "18K"]
SINGLE = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]
# Two-tone Metal Color values, body gold first (owner 2026-10-09, recorded in CLAUDE.md). "/" and
# never "&" (Etsy returns "&" HTML-encoded). A plain label never goes on a two-metal piece.
PAIR = [("YW", "Yellow/White Gold"), ("WY", "White/Yellow Gold"), ("RW", "Rose/White Gold")]

# ---------------------------------------------------------------- pricing (spec "Pricing", owner 2026-10-07/09)
RING_BAND_MM = 3                       # maker's rule for motif rings: price as a 3 mm band from the list
UNIT_FLOOR_G = 1.0                     # UNCALIBRATED_ASSUMPTION: at least 1 g per motif unit (maker's B09 count)
TWO_TONE_OP_USD = 50                   # UNCALIBRATED_ASSUMPTION: maker cost per two-tone operation, not quoted
BRACELET_BASIS_B_SCALE = 3.0 / 0.8     # fallback (b): the approved Christmas rule, geometry x 3.75 (B09 ratio)
IN_CHAIN_NECKLACES = {"N04", "N08", "N10"}   # their parts sit in the chain: + 50 USD assembly
DEEPEST_OFFER, ETSY_FEES = 0.30, 0.095   # spec margin check: the shop's deepest offer, about 9.5% Etsy fees


def piece_g14(m, size, basis="a"):
    """14K grams the maker charges for the piece itself, chain excluded."""
    c = m["cat"]
    if c == "ring":
        return mk.list_g14(RING_BAND_MM, size)
    if m.get("cuff"):
        return m["geo_g"] * size / 7           # the cuff is its own bracelet: grams follow the inner circumference
    if c == "bracelet" and basis == "b":
        return m["geo_g"] * BRACELET_BASIS_B_SCALE
    return max(m["geo_g"], UNIT_FLOOR_G * m["units"])


def chain_g14(m, size):
    """Quoted chain as 14K grams at the list's 100 USD/g, scaled by length (Christmas convention)."""
    c = m["cat"]
    if c == "necklace":
        return mk.CHAIN_NECKLACE_18IN / mk.MAKER_14K_USD_G * size / 18
    if c == "bracelet" and not m.get("cuff"):
        return mk.CHAIN_BRACELET_7IN / mk.MAKER_14K_USD_G * size / 7
    return 0.0


def fixed_usd(m, with_two_tone=True):
    """Karat-independent maker items: enamel, assembly and two-tone operations."""
    c = m["cat"]
    usd = 0
    if c != "ring":                     # rings: the band rule covers enamel and setting
        usd += mk.ENAMEL_PIECE if m["enamel"] else 0
        if c == "bracelet" or m["id"] in IN_CHAIN_NECKLACES:
            usd += mk.ASSEMBLY
    if with_two_tone:
        usd += TWO_TONE_OP_USD * m["ops"]
    return usd


def maker_cost(m, k, size, basis="a", with_two_tone=True):
    """gold_cost scales gold and chain by karat (x0.691 10K, x1.389 18K); fixed items do not move."""
    return mk.gold_cost(piece_g14(m, size, basis) + chain_g14(m, size), k) + fixed_usd(m, with_two_tone)


def price_cents(m, k, size, basis="a", with_two_tone=True):
    return mk.price_cents(maker_cost(m, k, size, basis, with_two_tone))


def variant_grams(m, k, size, basis="a"):
    """14K-equivalent grams the price is built on (piece after the unit floor + chain), density-scaled."""
    return round((piece_g14(m, size, basis) + chain_g14(m, size)) * mk.DENSITY[k], 2)


# ---------------------------------------------------------------- enamel palette (fixed per model, never a variation)
EN = {   # key: (copy word, always followed by " enamel"; prompt hex)
    "cobalt": ("cobalt blue", "#17368C"),
    "white": ("white", "#F3F1EA"),
    "sky": ("sky blue", "#8CC3E8"),
    "turquoise": ("turquoise", "#23A5B2"),
    "red": ("red", "#D7352B"),
    "pink": ("pink", "#EC9AB4"),
}

FAMILY = {1: "Halka", 2: "Damla", 3: "Mati", 4: "Bead String", 5: "Çini", 6: "Mother and Child",
          7: "Medal", 8: "Twin Wire", 9: "Sweetheart", 10: "Paperclip"}
TWO_TONE_FAMILIES = {1, 6, 7, 8}
WAVE = {2: "christmas-2026", 3: "christmas-2026", 4: "christmas-2026", 5: "christmas-2026",
        9: "january-2027", 10: "january-2027", 1: "after-two-tone-quote", 7: "after-two-tone-quote",
        8: "after-two-tone-quote", 6: "april-may-2027"}
HANGING_PENDANTS = {"N01", "N02", "N05", "N06", "N07", "N09"}

SHARED_TAGS = ["evil eye jewelry", "evil eye gift", "turkish evil eye"]

M = []


def add(**kw):
    kw.setdefault("enamel", [])
    kw.setdefault("ops", 0)
    kw.setdefault("units", None)
    M.append(kw)


# ============================================================ 1 HALKA (two-tone, cobalt + sky)
add(id="R01", fam=1, cat="ring", name="Two Tone Evil Eye Ring", enamel=["cobalt"], ops=1, geo_g=2.9,
    dims="eye 8.4 mm, set 1.8 mm high; band 2.0 mm wide, 1.4 mm thick",
    split="the collar, setting and band are in the main metal; the enamelled eye plate, which shows as the thin ring between the two blues, is in the second gold",
    title="Two Tone Evil Eye Ring, Cobalt Blue Enamel Nazar Set in Two Colours of Solid Gold, Mixed Metal Ring",
    tags=["two tone ring", "mixed metal ring", "evil eye ring", "nazar ring", "gold evil eye ring",
          "blue evil eye", "cobalt blue enamel", "14k evil eye ring", "enamel evil eye", "solid gold ring"],
    lead="A round evil eye in cobalt blue enamel, set in a solid gold collar on a slim band, with a ring of the second gold inside the blue.",
    story="In the classic nazar a white ring sits inside the dark blue; here that ring is gold: white gold in Yellow/White and Rose/White, yellow gold in White/Yellow. The eye plate is enamelled and fired on its own, then set like a stone, so no heat reaches the enamel after the kiln.")
add(id="N01", fam=1, cat="necklace", name="Two Tone Evil Eye Necklace", enamel=["cobalt", "sky"], ops=1, geo_g=1.8, units=1,
    dims="eye 11.5 mm, 1.5 mm thick",
    split="the collar, setting, bail and chain are in the main metal; the enamelled eye plate, which shows as the ring between the blues and as the pupil, is in the second gold",
    title="Two Tone Evil Eye Necklace, Cobalt Blue and Sky Blue Enamel Evil Eye Pendant, Solid Gold Nazar Necklace",
    tags=["two tone necklace", "mixed metal necklace", "evil eye necklace", "evil eye pendant", "nazar necklace",
          "gold evil eye", "blue evil eye", "sky blue enamel", "14k evil eye", "layering necklace"],
    lead="An 11.5 mm evil eye pendant in cobalt blue and sky blue enamel, with the ring and the pupil of the nazar made in a second colour of gold.",
    story="Read from the edge in: a collar of the main gold, a band of cobalt blue, a ring of the second gold, sky blue, then a gold pupil. The bail is hidden behind the top edge, so nothing shows above the eye, and the plate is fired on its own and set like a stone.")
add(id="B01", fam=1, cat="bracelet", name="Two Tone Evil Eye Bracelet", enamel=["cobalt"], ops=1, geo_g=1.0, units=1,
    dims="eye 8.4 mm",
    split="the collar, setting, loops and chain are in the main metal; the enamelled eye plate, which shows as the thin ring between the two blues, is in the second gold",
    title="Two Tone Evil Eye Bracelet, Cobalt Blue Enamel Nazar Set Inline on Solid Gold Chain, Mixed Metal Bracelet",
    tags=["two tone bracelet", "mixed metal bracelet", "evil eye bracelet", "nazar bracelet", "gold evil eye",
          "blue evil eye", "cobalt blue enamel", "14k gold bracelet", "dainty bracelet", "stacking bracelet"],
    lead="A round cobalt blue enamel evil eye set inline in a fine solid gold chain, with a ring of the second gold inside the blue.",
    story="The chain runs out of loops cast on each side of the setting, so the eye lies flat on top of the wrist. It is the same eye as the ring, enamelled and fired on its own, then set like a stone.")

# ============================================================ 2 DAMLA (cobalt + white)
add(id="R02", fam=2, cat="ring", name="Teardrop Evil Eye Ring", enamel=["cobalt"], geo_g=2.0,
    dims="drop 6.0 x 7.2 mm, 1.1 mm thick; band 1.6 mm round",
    title="Teardrop Evil Eye Ring, Cobalt Blue Enamel Nazar Drop on a Slim Solid Gold Band, Dainty Everyday Ring",
    tags=["teardrop ring", "teardrop evil eye", "evil eye ring", "nazar ring", "gold evil eye ring",
          "blue evil eye", "dainty gold ring", "everyday ring", "14k evil eye ring", "cobalt blue enamel"],
    lead="A small teardrop evil eye in cobalt blue enamel with a gold pupil, set low on a slim solid gold band.",
    story="The teardrop is the nazar that hangs over doors, point up. On the ring it lies along the finger with the point to the nail, and the last 1.5 mm of the point is solid polished gold, so the enamel stops before the tip. Band and drop are cast in one piece.")
add(id="N02", fam=2, cat="necklace", name="Teardrop Evil Eye Necklace", enamel=["cobalt", "white"], geo_g=0.8, units=1,
    dims="drop 8.8 x 10.6 mm, 1.2 mm thick",
    title="Teardrop Evil Eye Necklace, Cobalt Blue and White Enamel Evil Eye Pendant on Solid Gold Chain, Nazar Necklace",
    tags=["teardrop necklace", "teardrop evil eye", "evil eye necklace", "evil eye pendant", "nazar necklace",
          "gold evil eye", "blue evil eye", "new home gift", "dainty necklace", "14k evil eye"],
    lead="A teardrop evil eye pendant in cobalt blue and white enamel, hanging point up from a loop cast into its tip.",
    story="Dark outside and light inside, the way the nazar is drawn: cobalt blue, a thin gold wall, white, and a gold pupil. The last 1.5 mm of the point is solid gold, and the jump ring is closed by laser weld.")
add(id="B02", fam=2, cat="bracelet", name="Teardrop Evil Eye Charm Bracelet", enamel=["cobalt", "white"], geo_g=0.8, units=1,
    dims="drop 8.8 x 10.6 mm, 1.2 mm thick",
    title="Teardrop Evil Eye Charm Bracelet, Cobalt Blue and White Enamel Nazar Charm on Solid Gold Chain",
    tags=["teardrop bracelet", "teardrop evil eye", "evil eye bracelet", "nazar bracelet", "charm bracelet",
          "gold evil eye", "blue evil eye", "dainty bracelet", "new home gift", "14k gold bracelet"],
    lead="A teardrop evil eye charm in cobalt blue and white enamel, hanging free at the centre of a fine solid gold chain.",
    story="The only charm in the collection that swings: it hangs from a jump ring and turns to show a solid, polished gold back. Cobalt blue outside, white inside, a gold pupil at the centre.")

# ============================================================ 3 MATI (white + cobalt)
add(id="R03", fam=3, cat="ring", name="White and Blue Almond Evil Eye Bypass Ring", enamel=["white", "cobalt"], geo_g=2.3,
    dims="almond 11.0 x 6.6 mm, 1.2 mm thick; band 1.5 mm round",
    title="White and Blue Almond Evil Eye Bypass Ring, White and Cobalt Blue Enamel Nazar in Solid Gold, Bridesmaid Gift Ring",
    tags=["almond evil eye", "bypass ring", "greek evil eye", "evil eye ring", "nazar ring",
          "gold evil eye ring", "white evil eye", "bridesmaid gift", "greek jewelry", "14k evil eye ring"],
    lead="A bypass ring in solid gold: one end finishes in an almond evil eye in white and cobalt blue enamel, the other in a plain polished taper.",
    story="The almond is the modern form of the nazar, with white enamel on each side, a ring of cobalt blue around a gold pupil and solid gold tips. The band is rigid and sized like any ring, and the plain end stops 4 mm short of the eye.")
add(id="N03", fam=3, cat="necklace", name="Almond Evil Eye Lariat Necklace", enamel=["white", "cobalt"], geo_g=1.0, units=1,
    dims="almond 11.0 x 6.6 mm, 1.2 mm thick; 40 mm drop below a 3.0 mm gold bead",
    detail="Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches, measured to the Y.",
    title="Almond Evil Eye Lariat Necklace, White and Cobalt Blue Enamel Nazar on a Solid Gold Y Necklace, Bridesmaid Gift",
    tags=["lariat necklace", "y necklace", "almond evil eye", "greek evil eye", "evil eye necklace",
          "nazar necklace", "gold evil eye", "bridesmaid gift", "greek jewelry", "14k evil eye"],
    lead="A Y lariat in solid gold: a 3 mm gold bead at the Y, then a 40 mm drop ending in an almond evil eye in white and cobalt blue enamel.",
    story="The almond hangs level, its long side parallel to the collarbone, from a small loop hidden behind the middle of its top edge. White enamel on each side, cobalt blue around a gold pupil, and solid gold at both tips.")
add(id="B03", fam=3, cat="bracelet", name="Almond Evil Eye Bracelet", enamel=["white", "cobalt"], geo_g=0.8, units=1,
    dims="almond 11.0 x 6.6 mm, 1.2 mm thick",
    title="Almond Evil Eye Bracelet, White and Cobalt Blue Enamel Nazar on Solid Gold Chain, Bridesmaid Gift Bracelet",
    tags=["almond evil eye", "greek evil eye", "evil eye bracelet", "nazar bracelet", "gold evil eye",
          "white evil eye", "bridesmaid gift", "greek jewelry", "dainty bracelet", "14k gold bracelet"],
    lead="An almond evil eye in white and cobalt blue enamel, lying level on top of the wrist on a fine solid gold chain.",
    story="The chain passes behind the almond through two hidden loops near its top edge, about 2.5 mm in from each tip, so the eye sits level and both gold tips hang free below the chain.")

# ============================================================ 4 BEAD STRING (cobalt)
add(id="R04", fam=4, cat="ring", name="Beaded Evil Eye Stacking Ring", enamel=["cobalt"], geo_g=1.5,
    dims="eye 6.0 mm on a 0.6 mm gallery; beads 1.8 mm",
    title="Beaded Evil Eye Stacking Ring, Cobalt Blue Enamel Nazar on a Solid Gold Bead Band, Dainty Gold Ring",
    tags=["beaded ring", "bead stacking ring", "stacking ring", "evil eye ring", "nazar ring",
          "gold evil eye ring", "blue evil eye", "dainty gold ring", "gold bead ring", "14k evil eye ring"],
    lead="A rigid band of small solid gold beads with a 6 mm cobalt blue enamel evil eye set flat on top.",
    story="The blue eye and gold beads of a Turkish bead string, made in solid gold and cast in one piece, so there is no cord to stretch or break. The beads are all the same size and run evenly all the way round.")
add(id="N04", fam=4, cat="necklace", name="Evil Eye Bead Station Necklace", enamel=["cobalt"], geo_g=1.4, units=3,
    dims="three stations, each 10 mm long with a 6.0 mm eye between two 2.0 mm beads; 22 mm apart",
    title="Evil Eye Bead Station Necklace, Three Cobalt Blue Enamel Nazars with Solid Gold Beads, Dainty Layering Necklace",
    tags=["evil eye necklace", "nazar necklace", "station necklace", "bead necklace", "gold evil eye",
          "blue evil eye", "dainty necklace", "layering necklace", "travel gift", "14k evil eye"],
    lead="Three stations set into a fine solid gold chain, each a 6 mm cobalt blue enamel evil eye between two solid gold beads.",
    story="Each station is one cast bar 10 mm long, joined into the chain at both ends by laser weld, so the three stay 22 mm apart at the front of the neck. The blue eye and gold beads of a Turkish bead string, without glass or cord.")
add(id="B04", fam=4, cat="bracelet", name="Evil Eye Bead Station Bracelet", enamel=["cobalt"], geo_g=1.4, units=3,
    dims="three stations, each 10 mm long with a 6.0 mm eye between two 2.0 mm beads; 18 mm apart",
    title="Evil Eye Bead Station Bracelet, Three Cobalt Blue Enamel Nazars with Solid Gold Beads, Dainty Stacking Bracelet",
    tags=["evil eye bracelet", "nazar bracelet", "station bracelet", "bead bracelet", "gold evil eye",
          "blue evil eye", "summer bracelet", "travel gift", "dainty bracelet", "14k gold bracelet"],
    lead="Three small bead and evil eye stations on a fine solid gold bracelet chain: cobalt blue enamel eyes between solid gold beads.",
    story="Each station is one cast bar 10 mm long, laser welded into the chain at both ends and spaced 18 mm apart, so the eyes sit evenly on top of the wrist. Bright enough for summer, fine enough to wear every day.")

# ============================================================ 5 ÇINI (cobalt + turquoise)
add(id="R05", fam=5, cat="ring", name="Hexagon Tile Evil Eye Ring", enamel=["cobalt", "turquoise"], geo_g=2.6,
    dims="hexagon 9.2 mm flat to flat, 1.3 mm thick; band 2.0 mm wide, 1.4 mm thick",
    title="Hexagon Tile Evil Eye Ring, Cobalt Blue and Turquoise Enamel Nazar on a Solid Gold Band, Geometric Ring",
    tags=["hexagon ring", "tile ring", "evil eye ring", "nazar ring", "gold evil eye ring",
          "turquoise enamel", "turkish jewelry", "ottoman jewelry", "travel gift", "14k evil eye ring"],
    lead="A flat hexagon of cobalt blue enamel with a turquoise enamel evil eye at its centre, lying flat on a solid gold band.",
    story="The colours are inspired by Ottoman tilework from Iznik, after the first two glazes of the old tiles, and turquoise enamel is also a traditional colour for the nazar. The cobalt blue fills the hexagon to its gold rim, so the eye stays dark outside and light inside.")
add(id="N05", fam=5, cat="necklace", name="Hexagon Tile Evil Eye Necklace", enamel=["cobalt", "turquoise"], geo_g=1.1, units=1,
    dims="hexagon 10.0 mm flat to flat, 1.2 mm thick",
    title="Hexagon Tile Evil Eye Necklace, Cobalt Blue and Turquoise Enamel Evil Eye Pendant, Solid Gold Nazar Necklace",
    tags=["hexagon necklace", "tile necklace", "evil eye necklace", "evil eye pendant", "nazar necklace",
          "turquoise enamel", "turkish jewelry", "ottoman jewelry", "travel gift", "14k evil eye"],
    lead="A hexagon evil eye pendant in cobalt blue and turquoise enamel, hanging from one corner on a fine solid gold chain.",
    story="Inspired by Ottoman tilework from Iznik, in the colours of its first two glazes. It hangs from a loop cast into its top corner, with the cobalt blue enamel running out to a polished gold rim around a turquoise enamel eye.")
add(id="B05", fam=5, cat="bracelet", name="Hexagon Tile Evil Eye Bracelet", enamel=["cobalt", "turquoise"], geo_g=1.4, units=3,
    dims="eye hexagon 9.2 mm, two side hexagons 5.0 mm, 5 mm apart",
    title="Hexagon Tile Evil Eye Bracelet, Cobalt Blue and Turquoise Enamel Nazar Stations on Solid Gold Chain",
    tags=["hexagon bracelet", "tile bracelet", "evil eye bracelet", "nazar bracelet", "station bracelet",
          "turquoise enamel", "turkish jewelry", "ottoman jewelry", "travel gift", "14k gold bracelet"],
    lead="A cobalt blue and turquoise enamel hexagon evil eye between two small turquoise enamel hexagons, set into a fine solid gold chain.",
    story="Inspired by Ottoman tilework from Iznik. The two small hexagons are plain turquoise enamel with no centre dot, so the one eye in the middle stays the focus, and all three are joined into the chain 5 mm apart.")

# ============================================================ 6 MOTHER AND CHILD (two-tone, cobalt + sky)
add(id="R06", fam=6, cat="ring", name="Mother and Child Evil Eye Ring, Two Tone", enamel=["cobalt", "sky"], ops=1, geo_g=3.1,
    dims="eyes 9.0 mm and 6.0 mm, about 13.5 x 13.5 mm together; band 1.8 mm round",
    split="the large eye, the setting of the small eye and the band are in the main metal; the small eye's plate, which shows as its pupil and a thin rim, is in the second gold",
    title="Mother and Child Evil Eye Ring, Two Tone, Cobalt Blue and Sky Blue Enamel Nazars in Solid Gold, New Mom Gift",
    tags=["two tone ring", "mixed metal ring", "evil eye ring", "nazar ring", "new mom gift",
          "push present", "mothers day gift", "gift for mom", "toi et moi ring", "14k evil eye ring"],
    lead="Two evil eyes side by side on a solid gold band: a 9 mm eye in cobalt blue and sky blue enamel and a 6 mm cobalt blue enamel eye in the second gold.",
    story="A gift for a new mother: the large eye and the small one, each enamelled and fired on its own, then joined rim to rim. The small eye sits low at one side of the large one, its pupil and a thin rim in the second gold: two eyes, two golds.")
add(id="N06", fam=6, cat="necklace", name="Mother and Child Evil Eye Necklace, Two Tone", enamel=["cobalt", "sky"], ops=1, geo_g=1.5, units=1,
    dims="9.0 mm eye above a 6.0 mm eye, 15.8 mm tall",
    split="the large eye, the setting of the small eye, the bail and the chain are in the main metal; the small eye's plate, which shows as its pupil and a thin rim, is in the second gold",
    title="Mother and Child Evil Eye Necklace, Two Tone, Double Evil Eye Pendant, Solid Gold Nazar, New Mom Gift",
    tags=["two tone necklace", "mixed metal necklace", "evil eye necklace", "evil eye pendant", "nazar necklace",
          "new mom gift", "push present", "mothers day gift", "gift for mom", "14k evil eye"],
    lead="A double evil eye pendant: a 9 mm eye in cobalt blue and sky blue enamel with a 6 mm cobalt blue enamel eye directly below it, in two colours of solid gold.",
    story="Made as a gift for a mother, one eye for her and one for her child. The bail sits behind the top of the large eye, in line with the small one, so the pair hangs straight.")
add(id="B06", fam=6, cat="bracelet", name="Mother and Child Evil Eye Bracelet, Two Tone", enamel=["cobalt", "sky"], ops=1, geo_g=1.2, units=2,
    dims="eyes 9.0 mm and 6.0 mm",
    split="the large eye, the setting of the small eye, the jump ring and the chain are in the main metal; the small eye's plate, which shows as its pupil and a thin rim, is in the second gold",
    title="Mother and Child Evil Eye Bracelet, Two Tone, Cobalt Blue and Sky Blue Enamel Nazars on Solid Gold Chain, Mothers Day Gift",
    tags=["two tone bracelet", "mixed metal bracelet", "evil eye bracelet", "nazar bracelet", "new mom gift",
          "push present", "mothers day gift", "gift for mom", "station bracelet", "14k gold bracelet"],
    lead="Two evil eyes at the centre of a fine solid gold chain: a 9 mm eye in cobalt blue and sky blue enamel and a 6 mm cobalt blue enamel eye in the second gold.",
    story="Made as a gift for a mother. The two eyes are separate stations with their own cast loops, joined at the centre by one small jump ring closed by laser weld, so they sit side by side on the wrist.")

# ============================================================ 7 MEDAL (two-tone, cobalt)
add(id="R07", fam=7, cat="ring", name="Two Tone Evil Eye Coin Ring", enamel=["cobalt"], ops=1, geo_g=3.2,
    dims="disc 9.0 mm, 1.3 mm thick; almond 7.0 x 3.6 mm; band 2.0 mm wide, 1.4 mm thick",
    split="the disc and band are in the main metal; the polished almond with its cobalt blue enamel iris is in the second gold",
    title="Two Tone Evil Eye Coin Ring, Cobalt Blue Enamel Almond Nazar on a Solid Gold Disc, Mixed Metal Ring",
    tags=["two tone ring", "mixed metal ring", "evil eye ring", "nazar ring", "coin ring",
          "evil eye coin", "graduation gift", "unisex ring", "new job gift", "14k evil eye ring"],
    lead="A 9 mm solid gold disc on a slim band, its satin face carrying a polished almond evil eye in the second gold with a cobalt blue enamel iris.",
    story="A gold coin is the old gift for a milestone, made here in two golds. The almond is cast with its own pins, enamelled and fired alone, then pinned through the disc with no solder near the enamel. The face is plain: no lettering, only the almond.")
add(id="N07", fam=7, cat="necklace", name="Two Tone Evil Eye Coin Necklace", enamel=["cobalt"], ops=1, geo_g=1.6, units=1,
    dims="coin 11.0 mm, 1.0 mm thick, reeded edge; almond 8.0 x 4.0 mm",
    split="the coin, loop and chain are in the main metal; the polished almond with its cobalt blue enamel iris is in the second gold",
    title="Two Tone Evil Eye Coin Necklace, Mixed Metal Evil Eye Pendant with Cobalt Blue Enamel, Solid Gold Nazar Coin",
    tags=["two tone necklace", "mixed metal necklace", "evil eye necklace", "evil eye pendant", "coin necklace",
          "evil eye coin", "nazar necklace", "graduation gift", "unisex necklace", "14k evil eye"],
    lead="An 11 mm solid gold coin with a satin face, a reeded edge and a polished almond evil eye in the second gold, riveted to the front.",
    story="Single sided and plain: no lettering, no rays, only the almond with its cobalt blue enamel iris. The almond is fired on its own and its cast pins are riveted flush at the back, so no heat reaches the enamel.")
add(id="B07", fam=7, cat="bracelet", name="Two Tone Evil Eye Coin Bracelet", enamel=["cobalt"], ops=1, geo_g=0.9, units=1,
    dims="coin 8.5 mm, 0.9 mm thick, reeded edge; almond 6.4 x 3.2 mm",
    split="the coin, loops and chain are in the main metal; the polished almond with its cobalt blue enamel iris is in the second gold",
    title="Two Tone Evil Eye Coin Bracelet, Cobalt Blue Enamel Almond Nazar on a Solid Gold Coin, Mixed Metal Bracelet",
    tags=["two tone bracelet", "mixed metal bracelet", "evil eye bracelet", "nazar bracelet", "coin bracelet",
          "evil eye coin", "graduation gift", "unisex bracelet", "new job gift", "14k gold bracelet"],
    lead="An 8.5 mm solid gold coin set at the centre of a fine chain, with a polished almond evil eye in the second gold riveted to its satin face.",
    story="The coin is a station with loops cast at each side, so it lies flat on the wrist. The almond and its cobalt blue enamel iris sit inside a polished border, with no lettering and nothing else on the face.")

# ============================================================ 8 TWIN WIRE (two-tone, no enamel)
add(id="R08", fam=8, cat="ring", name="Two Tone Mixed Metal Evil Eye Ring", ops=2, geo_g=2.6,
    dims="band 2.6 mm wide, two 1.3 mm wires; eye 6.0 mm, 1.2 mm thick",
    split="the wire nearer the fingertip, the eye's rim and its pupil are in the main metal; the other wire and the inlaid ring are in the second gold",
    title="Two Tone Mixed Metal Evil Eye Ring, Two Solid Gold Wires with an Inlaid Gold Nazar, Stacking Ring",
    tags=["two tone ring", "mixed metal ring", "two tone gold ring", "evil eye ring", "nazar ring",
          "gold evil eye ring", "stacking ring", "double band ring", "minimalist ring", "14k evil eye ring"],
    lead="Two round wires of solid gold in two colours, soldered side by side into one band, with a metal evil eye set flat over both.",
    story="No enamel: the eye is drawn in metal alone, a ring of the second gold inlaid flush into a disc of the main gold around a slightly domed gold pupil. It wears like a stack of two thin rings that stay together.")
add(id="N08", fam=8, cat="necklace", name="Two Tone Evil Eye Station Necklace", ops=1, geo_g=0.4, units=1,
    dims="eye 6.0 mm, 1.0 mm thick",
    split="the eye's disc, rim and pupil, its loops and the chain are in the main metal; the inlaid ring is in the second gold",
    title="Two Tone Evil Eye Station Necklace, Inlaid Two Colour Gold Nazar on Fine Solid Gold Chain, Mixed Metal Necklace",
    tags=["two tone necklace", "mixed metal necklace", "evil eye necklace", "nazar necklace", "station necklace",
          "gold evil eye", "minimalist necklace", "dainty necklace", "layering necklace", "14k evil eye"],
    lead="A 6 mm evil eye drawn in two golds, set inline at the centre of a fine solid gold chain.",
    story="No enamel and no stones: a ring of the second gold is inlaid flush into a disc of the main gold, around a slightly domed gold pupil. Loops cast at each side carry the chain, so the eye sits flat at the base of the neck.")
add(id="B08", fam=8, cat="bracelet", name="Two Tone Evil Eye Cuff Bracelet", ops=2, geo_g=3.6, cuff=True,
    dims="cuff 2.0 mm wide, two 1.0 mm wires; eye 6.0 mm, 1.2 mm thick",
    split="one wire, the eye's rim and its pupil are in the main metal; the other wire and the inlaid ring are in the second gold",
    detail="Cuff: open, 2.0 mm wide; choose 6.5, 7 or 7.5 inches inner circumference.",
    title="Two Tone Evil Eye Cuff Bracelet, Two Solid Gold Wires with an Inlaid Gold Nazar, Mixed Metal Open Cuff",
    tags=["two tone bracelet", "mixed metal bracelet", "cuff bracelet", "open cuff", "evil eye bracelet",
          "nazar bracelet", "gold evil eye", "stacking cuff", "minimalist cuff", "14k gold cuff"],
    lead="An open cuff of two solid gold wires in two colours, side by side, with a metal evil eye set over both at the front.",
    story="The same eye as the twin wire ring: a ring of the second gold inlaid flush into a disc of the main gold, around a slightly domed gold pupil. The cuff slips on from the side of the wrist.")

# ============================================================ 9 SWEETHEART (red)
add(id="R09", fam=9, cat="ring", name="Red Evil Eye Heart Ring", enamel=["red"], geo_g=2.0,
    dims="heart 9.6 x 9.2 mm, 1.1 mm thick; eye 5.4 mm; band 1.5 mm round",
    title="Red Evil Eye Heart Ring, Polished Solid Gold Heart with a Red Enamel Nazar, Valentines Gift Ring",
    tags=["red evil eye", "heart ring", "evil eye ring", "nazar ring", "gold heart ring",
          "red enamel ring", "valentines gift", "anniversary gift", "gift for her", "14k evil eye ring"],
    lead="A polished solid gold heart with a small red enamel evil eye set flush at its centre, on a slim gold band.",
    story="The heart is plain gold with full round lobes, and the eye is one ring of red enamel around a gold pupil. It stands upright on the finger, point to the wrist, cast in one piece with the band.")
add(id="N09", fam=9, cat="necklace", name="Red Evil Eye Heart Necklace", enamel=["red"], geo_g=1.2, units=1,
    dims="heart 11.0 x 10.5 mm, 1.2 mm thick; eye 6.0 mm",
    title="Red Evil Eye Heart Necklace, Solid Gold Heart Evil Eye Pendant with Red Enamel Nazar, Valentines Gift",
    tags=["red evil eye", "heart necklace", "evil eye necklace", "evil eye pendant", "nazar necklace",
          "gold heart pendant", "valentines gift", "anniversary gift", "gift for her", "14k evil eye"],
    lead="An 11 mm polished solid gold heart pendant with a red enamel evil eye set flush at its centre.",
    story="Plain gold with full round lobes and a ring of red enamel around a gold pupil. The bail is hidden behind the cleft, so the heart hangs upright with nothing above it.")
add(id="B09", fam=9, cat="bracelet", name="Red Evil Eye Heart Bracelet", enamel=["red"], geo_g=0.8, units=1,
    dims="heart 9.6 x 9.2 mm, 1.1 mm thick; eye 5.4 mm",
    title="Red Evil Eye Heart Bracelet, Polished Gold Heart with a Red Enamel Nazar on Solid Gold Chain, Valentines Gift",
    tags=["red evil eye", "heart bracelet", "evil eye bracelet", "nazar bracelet", "gold heart bracelet",
          "red enamel", "valentines gift", "anniversary gift", "gift for her", "14k gold bracelet"],
    lead="A polished solid gold heart with a red enamel evil eye, set at the centre of a fine gold chain.",
    story="The heart is a station, the chain held by loops cast at its two lobes, so it lies flat on the wrist. Red enamel around a gold pupil, the same red in yellow, white and rose gold.")

# ============================================================ 10 PAPERCLIP (pink + white)
add(id="R10", fam=10, cat="ring", name="Pink Evil Eye Paperclip Ring", enamel=["pink"], geo_g=1.2,
    dims="eye 6.0 mm on a band of soldered paperclip links",
    title="Pink Evil Eye Paperclip Ring, Pink Enamel Nazar on a Solid Gold Paperclip Band, Stacking Ring",
    tags=["pink evil eye", "paperclip ring", "evil eye ring", "nazar ring", "pink enamel ring",
          "stacking ring", "best friend gift", "birthday gift", "gold evil eye ring", "14k evil eye ring"],
    lead="A rigid band of small solid gold paperclip links with a 6 mm pink enamel evil eye set on top.",
    story="The links are soldered closed into a band that is sized like any ring. The eye is enamelled and fired on its own, then laser welded on top, with a closed solid gold back.")
add(id="N10", fam=10, cat="necklace", name="Pink Evil Eye Paperclip Necklace", enamel=["pink", "white"], geo_g=1.2, units=1,
    dims="eye 9.0 mm; paperclip links 7.0 x 2.4 mm",
    title="Pink Evil Eye Paperclip Necklace, Pink and White Enamel Nazar on Solid Gold Chain, Best Friend Gift",
    tags=["pink evil eye", "paperclip necklace", "evil eye necklace", "nazar necklace", "pink enamel",
          "gold evil eye", "best friend gift", "birthday gift", "layering necklace", "14k evil eye"],
    lead="A 9 mm evil eye in pink and white enamel, set into a fine solid gold chain with two gold paperclip links on each side.",
    story="The eye is part of the chain rather than a charm hanging from it. Pink outside, white inside, a gold pupil at the centre; the paperclip links are closed around the fired eye by laser weld, then the fine cable chain runs on to the clasp.")
add(id="B10", fam=10, cat="bracelet", name="Pink Evil Eye Paperclip Bracelet", enamel=["pink", "white"], geo_g=1.2, units=1,
    dims="eye 9.0 mm; paperclip links 7.0 x 2.4 mm",
    title="Pink Evil Eye Paperclip Bracelet, Pink and White Enamel Nazar on Solid Gold Chain, Best Friend Gift",
    tags=["pink evil eye", "paperclip bracelet", "evil eye bracelet", "nazar bracelet", "pink enamel",
          "gold evil eye", "best friend gift", "birthday gift", "dainty bracelet", "14k gold bracelet"],
    lead="A 9 mm pink and white enamel evil eye at the centre of a fine solid gold chain, with two gold paperclip links on each side.",
    story="A small bright eye for a best friend or a birthday. The links are closed around the fired eye by laser weld, and the rest of the bracelet is fine cable chain.")

# ---------------------------------------------------------------- shared copy
METAL_SINGLE = ("Metal: solid 10K, 14K or 18K gold in yellow, white or rose. "
                "White gold, not rhodium plated: a soft warm grey, warmer at 10K.")
METAL_PAIR = ("Metal: solid 10K, 14K or 18K gold in two colours, Yellow/White, White/Yellow or Rose/White Gold; "
              "the first metal is the main metal. White gold, not rhodium plated: a soft warm grey, warmer at 10K.")
FINISH_METAL = "Finish: polished solid gold in two colours; no enamel, no stones."
SYMBOL = "Symbol: the evil eye, or nazar, a traditional Turkish and Greek symbol."
DETAIL = {
    "ring": "Ring size: US 3 to 16, whole and half sizes.",
    "necklace": "Chain: 1.2 mm solid gold cable chain with spring ring clasp; choose 16, 18 or 20 inches.",
    "bracelet": "Chain: 1.1 mm solid gold cable chain with spring ring clasp; choose 6.5, 7 or 7.5 inches.",
}
DETAIL_PAIR = {   # on two-tone pieces the chain is always in the body gold
    "necklace": "Chain: 1.2 mm solid gold cable chain in the main metal, spring ring clasp; choose 16, 18 or 20 inches.",
    "bracelet": "Chain: 1.1 mm solid gold cable chain in the main metal, spring ring clasp; choose 6.5, 7 or 7.5 inches.",
}
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE_EN = ("Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, "
           "so take it off for the gym and the dishes and wipe it with a soft cloth.")
CARE_GOLD = "Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish."
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")
IMAGES_PAIR = ("The product images are design visualizations of the finished piece, and the three-colour image is a "
               "visualization of the same design in Yellow/White, White/Yellow and Rose/White gold; the handmade piece may vary slightly.")

PROTOCOL = {"ring": "sculptural_ring", "necklace": "pendant_necklace", "bracelet": "chain_bracelet"}
AXES = {"ring": ["Karat", "Metal Color", "Ring Size"], "necklace": ["Karat", "Metal Color", "Chain Length"],
        "bracelet": ["Karat", "Metal Color", "Bracelet Length"]}

# ---------------------------------------------------------------- flags written at generation (spec "Pricing")
PRICING_STATUS = "ESTIMATE_MAKER_V2"
WEIGHT_SOURCE = "geometry_estimate"
UNCAL = {
    "unit_floor": "UNCALIBRATED_ASSUMPTION: at least 1 g per motif unit (pendant or chain station), the maker's own count on Christmas B09; this price rests on the floor",
    "two_tone": "UNCALIBRATED_ASSUMPTION: two-tone at 50 USD maker cost per operation (+100 retail each), not quoted by this maker",
    "bead_bars": "UNCALIBRATED_ASSUMPTION: the cast bead, eye and bead bars and their six laser-welded chain joins carry no charge beyond the unit floor and the 50 USD assembly",
    "paperclip_links": "UNCALIBRATED_ASSUMPTION: the solid paperclip links and their laser welds carry no charge beyond the gram estimate (on R10, the 3 mm band rule)",
}
BLOCKER = {
    "price": "ESTIMATED PRICE: 2 x maker cost on the Christmas 2026 terms (14K 100 USD/g with labour, enamel 50, chain 130 or 100, assembly 50); the maker has not quoted these 30 designs.",
    "grams": "Grams are geometry estimates: no sample has been cast or weighed.",
    "two_tone": "TWO-TONE UNQUOTED: the maker has not priced two-tone work; 50 USD per operation is an UNCALIBRATED_ASSUMPTION and no two-tone piece goes live before the quote.",
    "firing": "Alloy/enamel firing qualification: enamel on 10K, on white gold and on rose gold, each part one alloy fired alone, is not yet confirmed by the maker (maker question 2).",
    "white": "White gold plating unconfirmed: the copy says white gold, not rhodium plated; the maker has not yet confirmed unplated palladium white for every white part (maker question 2).",
    "images": "No images yet: the reference hero and 10 sales frames are generated in Higgsfield after the owner approves the prompts.",
}
AUTHORITY = ("Owner instruction 2026-10-09: an evil eye (nazar) model as 10 rings, 10 necklaces and 10 bracelets, enamel and "
             "two-tone gold allowed; step 1 decisions answered 2026-10-09 (two-tone pair labels, bracelet basis (a) with the "
             "(b) fallback, the ten families as written).")

# ---------------------------------------------------------------- copy rules (spec "Copy rules")
BAN_ALL = ["protect", "ward", "luck", "power of", "healing", "baby", "newborn", "baby shower", "christening", "kids",
           "hamsa", "cross", "horus", "something blue", "made in turkey", "adjustable", "eye link", "amulet", "talisman",
           "sydney evan", "mateo", "alison lou", "jennifer meyer", "suzanne kalan", "buccellati",
           "\u2014", "\u2013", "\u00e2"]   # em dash, en dash, mojibake
COUNT_WORDS = (r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|"
               r"sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|hundred|dozens?|several|many)\b")

# ---------------------------------------------------------------- the approved spec, read back
SPEC = (HERE / "01-design-direction.md").read_text(encoding="utf-8")


def spec_rows(header):
    lines = SPEC.splitlines()
    assert lines.count(header) == 1, header
    rows = []
    for ln in lines[lines.index(header) + 2:]:
        if not ln.startswith("|"):
            break
        rows.append([c.strip() for c in ln.strip().strip("|").split("|")])
    return rows


def nums(cell):
    return [float(x.replace(",", "")) for x in re.findall(r"\d[\d,]*(?:\.\d+)?", cell)]


SPEC_NAMES = {int(r[0]): {"ring": r[3], "necklace": r[4], "bracelet": r[5]}
              for r in spec_rows("| # | Family | Colours / gold | Ring | Necklace | Bracelet |")}
SPEC_IND = {}
for r in spec_rows("| # | Family | Ring g · USD | Necklace g · USD | Bracelet g · USD, basis (a) / (b) |"):
    f = int(r[0])
    rg, ru = nums(r[2])
    ng, nu = nums(r[3])
    b = nums(r[4])
    SPEC_IND[f] = {"ring": (rg, ru), "necklace": (ng, nu), "bracelet": (b[0], b[1], b[2] if len(b) > 2 else b[1])}
assert sorted(SPEC_NAMES) == list(range(1, 11)) and sorted(SPEC_IND) == list(range(1, 11))
assert "Ring Size US 3 to 16, whole and half (27) | 243 | 10 | 2,430" in SPEC and "| **2,970** |" in SPEC
assert "`BAS-EE-{R|N|B}{01..10}-{karat}{Y|W|R|YW|WY|RW}-{size}`" in SPEC

# protocol ids from the registry (lib/etsy/listing-protocol.ts); an unknown id silently falls back to product_type
_proto_src = (ROOT / "lib/etsy/listing-protocol.ts").read_text(encoding="utf-8")
REGISTRY = set(re.findall(r'"([a-z_]+)"', _proto_src.split("export type ListingProtocolId =")[1].split(";")[0]))
assert {"sculptural_ring", "pendant_necklace", "chain_bracelet", "cuff_bracelet"} <= REGISTRY, REGISTRY


def derive_group(title):
    """Mirror of lib/listing-facets.ts deriveGroup: the panel files the listing by its title."""
    t = title.lower()
    if re.search(r"earring|\bhoops?\b|\bstuds?\b", t):
        return "earrings"
    if re.search(r"bracelet|anklet", t):
        return "bracelet"
    if re.search(r"\brings?\b|\bband\b", t):
        return "ring"
    if re.search(r"necklace|\bchain\b", t):
        return "necklace"
    if re.search(r"pendant|\bcharm\b|medallion|crucifix|\bcross\b", t):
        return "pendant"
    return "other"


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


def enamel_line(keys):
    return ("Enamel: kiln-fired vitreous " + " and ".join(EN[k][0] + " enamel" for k in keys)
            + ", set flush in recessed cells with polished gold rims.")


def check_text(where, text, allow_iznik=False):
    low = text.lower()
    for b in BAN_ALL:
        assert b not in low, (where, b)
    if not allow_iznik:
        assert "iznik" not in low, where
    assert all(low[i.end():].startswith(" blue") for i in re.finditer("cobalt", low)), (where, "cobalt alone")
    assert all(low[i.end():].startswith(" enamel") for i in re.finditer("turquoise", low)), (where, "turquoise alone")


IMG = {}
if (HERE / "images.json").exists():
    IMG = {r["id"]: r for r in json.load(open(HERE / "images.json"))["images"]}

# ---------------------------------------------------------------- build
out, MARGINS = [], []
seen_titles, seen_sku, seen_desc = set(), set(), set()
assert len(M) == 30 and len({m["id"] for m in M}) == 30
for m in M:
    mid, cat, fam = m["id"], m["cat"], m["fam"]
    assert mid == {"ring": "R", "necklace": "N", "bracelet": "B"}[cat] + f"{fam:02d}", mid
    assert len([x for x in M if x["cat"] == cat]) == 10 and len([x for x in M if x["fam"] == fam]) == 3
    tt = fam in TWO_TONE_FAMILIES
    assert (m["ops"] > 0) == tt and m["ops"] == (2 if mid in ("R08", "B08") else 1 if tt else 0), mid
    assert bool(m["enamel"]) == (fam != 8), mid              # Twin Wire is the only family without enamel
    assert len(m["enamel"]) <= 2 and all(k in EN for k in m["enamel"]), mid
    assert bool(m.get("cuff")) == (mid == "B08"), mid
    assert (m["units"] is None) == (cat == "ring" or mid == "B08"), mid
    assert ("split" in m) == tt, mid

    # name and title: the spec's product name leads, "evil eye" in the name, "nazar" in the descriptor
    name, title = m["name"], m["title"]
    assert name == SPEC_NAMES[fam][cat], (mid, name, SPEC_NAMES[fam][cat])
    assert "evil eye" in name.lower() and "nazar" not in name.lower(), mid
    assert title.startswith(name + ", ") and "nazar" in title[len(name):].lower(), mid
    assert len(title) <= 140 and title not in seen_titles, (mid, len(title))
    seen_titles.add(title)
    assert ("two tone" in title.lower()) == tt, mid
    assert ("Evil Eye Pendant" in title[len(name):]) == (mid in HANGING_PENDANTS), mid
    assert "link" not in (name + title).lower(), mid           # no "Link" in any name (designer signature)
    assert not re.search(r"\b(10|14|18)\s*k\b", title.lower()), mid      # karat is a variation, not a title fact
    assert not re.search(r"(yellow|white|rose)\s*gold", title.lower()), mid   # colour is a variation too
    assert derive_group(title) == cat, (mid, derive_group(title))
    assert not re.search(r"\b(turkish|greek)\b", title.lower()), mid   # the style is Turkish/Greek; one country stays in tags
    check_text(mid + " title", title)

    # tags: 13, Etsy-safe, two-tone pair, nazar
    tags = m["tags"] + SHARED_TAGS
    assert len(tags) == 13 and len(set(tags)) == 13, (mid, len(set(tags)))
    for t in tags:
        assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 ]+", t), (mid, t)
        check_text(mid + " tag", t)
    assert any("nazar" in t for t in tags), mid
    assert any("two tone" in t for t in tags) == tt and any("mixed metal" in t for t in tags) == tt, mid

    # description
    detail = m.get("detail") or (DETAIL_PAIR.get(cat) if tt else None) or DETAIL[cat]
    spec_lines = [METAL_PAIR if tt else METAL_SINGLE]
    if tt:
        spec_lines.append("Two tone: " + m["split"] + ".")
    spec_lines += [enamel_line(m["enamel"]) if m["enamel"] else FINISH_METAL, SYMBOL, f"Size: {m['dims']}.", detail]
    desc = "\n\n".join([m["lead"], m["story"], "\n".join(spec_lines), SHIP, CARE_EN if m["enamel"] else CARE_GOLD,
                        IMAGES_PAIR if tt else IMAGES])
    assert desc not in seen_desc and m["lead"] not in {d.split("\n\n")[0] for d in seen_desc}, mid
    seen_desc.add(desc)
    check_text(mid + " description", desc, allow_iznik=(fam == 5))
    low = desc.lower()
    if fam == 5:
        assert "inspired by ottoman tilework from iznik" in low, mid
    assert "a traditional turkish and greek symbol" in low and "white gold, not rhodium plated" in low, mid
    for k in m["enamel"]:
        assert EN[k][0] + " enamel" in low, (mid, k)
    for k in set(EN) - set(m["enamel"]):      # no enamel colour the piece does not carry
        assert EN[k][0] + " enamel" not in low, (mid, k)
    pair_words = ("yellow/white", "white/yellow", "rose/white", "first metal is the main metal", "two tone:", "second gold")
    assert all(w in low for w in pair_words[:5]) if tt else not any(w in low for w in pair_words), mid
    if cat == "ring":
        assert not any(w in low for w in ("chain", "clasp", "pendant", "inches")), mid
    elif mid == "B08":
        assert "chain" not in low and "clasp" not in low and "inner circumference" in low, mid
    else:
        assert "chain" in low and "spring ring clasp" in low, mid
    if fam == 6:
        assert "gift for a" in low and "mother" in low, mid    # presented as a gift for the parent
    if mid in ("R04", "R10"):                                   # the copy never states a bead or link count
        assert not re.search(COUNT_WORDS + r"\s+(\w+\s+){0,3}(beads|links)\b", low), mid

    # variants: full 3-axis grid
    colors = PAIR if tt else SINGLE
    assert all(len(cn) <= 20 and "&" not in cn for _, cn in colors)
    base_sku = PREFIX + mid
    variants = []
    for k in KARATS:
        for cc, cn in colors:
            for s in sizes(cat):
                sku = f"{base_sku}-{k}{cc}-{size_code(cat, s)}"
                assert len(sku) <= 32 and sku not in seen_sku, sku
                assert re.fullmatch(r"BAS-EE-[RNB](0[1-9]|10)-(10|14|18)K(Y|W|R|YW|WY|RW)-(US\d+(_5)?|\d+(_5)?IN)", sku), sku
                seen_sku.add(sku)
                v = {"sku": sku, "properties": {"Karat": k, "Metal Color": cn, AXES[cat][2]: size_label(cat, s)},
                     "grams": variant_grams(m, k, s), "price_cents": price_cents(m, k, s)}
                if cat == "bracelet":
                    v["price_cents_basis_b"] = price_cents(m, k, s, basis="b")
                    v["grams_basis_b"] = variant_grams(m, k, s, basis="b")
                variants.append(v)
    assert len(variants) == {"ring": 243, "necklace": 27, "bracelet": 27}[cat] and len(variants) <= 400, mid

    # prices: positive, USD 10 steps, colour-free, rising with karat and size, two-tone exactly +100 per operation
    for k in KARATS:
        row = []
        for s in sizes(cat):
            vs = [v for v in variants if v["properties"]["Karat"] == k and v["properties"][AXES[cat][2]] == size_label(cat, s)]
            assert len(vs) == 3 and len({v["price_cents"] for v in vs}) == 1 and len({v["grams"] for v in vs}) == 1, (mid, k, s)
            p = vs[0]["price_cents"]
            assert p > 0 and p % 1000 == 0, (mid, k, s, p)
            assert p - price_cents(m, k, s, with_two_tone=False) == 10000 * m["ops"], (mid, k, s)
            row.append(p)
        assert row == sorted(row) and row[-1] > row[0], (mid, k, row)
    for s in sizes(cat):
        ps = [price_cents(m, k, s) for k in KARATS]
        assert ps[0] < ps[1] < ps[2], (mid, s, ps)
        for k, p in zip(KARATS, ps):   # spec margin check: a 30% offer still leaves about 13% after fees
            margin = (p / 100 * (1 - DEEPEST_OFFER) * (1 - ETSY_FEES) - maker_cost(m, k, s)) / (p / 100)
            assert margin >= 0.13, (mid, k, s, margin)
            MARGINS.append((margin, f"{mid} {k} {size_label(cat, s)}"))
        if cat == "bracelet":
            pb = [price_cents(m, k, s, basis="b") for k in KARATS]
            assert pb[0] < pb[1] < pb[2] and all(b >= a for a, b in zip(ps, pb)), (mid, s, pb)

    # the spec's indicative 14K prices and gram values (ring US 7, necklace 18 in, bracelet 7 in)
    rs = ref_size(cat)
    ind = SPEC_IND[fam][cat]
    assert m["geo_g"] == ind[0], (mid, m["geo_g"], ind[0])
    ref = price_cents(m, "14K", rs)
    assert ref == int(ind[1]) * 100, (mid, ref, ind[1])
    ref_b = price_cents(m, "14K", rs, basis="b") if cat == "bracelet" else None
    if cat == "bracelet":
        assert ref_b == int(ind[2]) * 100, (mid, ref_b, ind[2])

    # flags and blockers (spec "Flags written at generation")
    uncal = []
    if cat != "ring" and not m.get("cuff") and UNIT_FLOOR_G * m["units"] >= m["geo_g"]:
        uncal.append(UNCAL["unit_floor"])
    if tt:
        uncal.append(UNCAL["two_tone"])
    if mid in ("N04", "B04"):
        uncal.append(UNCAL["bead_bars"])
    if fam == 10:
        uncal.append(UNCAL["paperclip_links"])
    blockers = [BLOCKER["price"], BLOCKER["grams"]]
    if tt:
        blockers.append(BLOCKER["two_tone"])
    if m["enamel"]:
        blockers.append(BLOCKER["firing"])       # Twin Wire is never fired: outside the qualification
    blockers += [BLOCKER["white"], BLOCKER["images"]]

    proto = "cuff_bracelet" if m.get("cuff") else PROTOCOL[cat]
    assert proto in REGISTRY, (mid, proto)
    build = {"pieceGrams14": round(piece_g14(m, rs), 4), "chainGrams14": round(chain_g14(m, rs), 4),
             "goldAndChainUsd": round(mk.gold_cost(piece_g14(m, rs) + chain_g14(m, rs), "14K"), 2),
             "enamelUsd": mk.ENAMEL_PIECE if (cat != "ring" and m["enamel"]) else 0,
             "assemblyUsd": mk.ASSEMBLY if (cat == "bracelet" or mid in IN_CHAIN_NECKLACES) else 0,
             "twoToneUsd": TWO_TONE_OP_USD * m["ops"]}
    out.append({
        "id": mid, "modelId": mid, "family": FAMILY[fam], "familyNo": fam, "productType": cat, "name": name,
        "productId": str(uuid.uuid5(NS, SOURCE + ":" + mid)), "sku": base_sku,
        "title": title, "tags": tags, "materials": ["Solid gold", "Vitreous enamel"] if m["enamel"] else ["Solid gold"],
        "description": desc, "enamel": [EN[k][0] for k in m["enamel"]], "enamelHex": [EN[k][1] for k in m["enamel"]],
        "goldOnly": not m["enamel"], "twoTone": tt, "metalColors": [cn for _, cn in colors], "dims": m["dims"],
        "listingProtocol": proto, "offersPersonalization": False, "variationAxes": AXES[cat],
        "launchWave": WAVE[fam], "sourcePackage": PKG, "sourcePackagePath": PKG_PATH,
        "geometryGrams14Ref": m["geo_g"], "motifUnits": m["units"], "twoToneOps": m["ops"],
        "grams14Ref": round(piece_g14(m, rs) + chain_g14(m, rs), 2),
        "makerCost14KRefUsd": round(maker_cost(m, "14K", rs), 2), "refSize": size_label(cat, rs), "refPriceCents": ref,
        **({"refPriceCentsBasisB": ref_b} if cat == "bracelet" else {}),
        "pricing": {"status": PRICING_STATUS, "build14KRef": build, "uncalibratedAssumptions": uncal},
        "weightSource": WEIGHT_SOURCE,
        "approval": {"blockers": blockers, "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
                     "authority": AUTHORITY},
        "missingHero": True, "variants": variants,
        "imageFile": f"{mid}.jpg", "imageUrl": IMG.get(mid, {}).get("url"), "imageSha256": IMG.get(mid, {}).get("sha256"),
        "params": {k: m[k] for k in ("geo_g", "units", "ops", "cuff") if m.get(k) is not None},
    })

# set-level checks
rings_single = [v["price_cents"] for i in out if i["productType"] == "ring" and not i["twoTone"] for v in i["variants"]]
assert min(rings_single) == 42000 and max(rings_single) == 139000, (min(rings_single), max(rings_single))   # spec: 420 to 1,390
assert sum(i["twoTone"] for i in out) == 12 and sum(bool(i["enamel"]) for i in out) == 27
assert price_cents(next(m for m in M if m["id"] == "N07"), "14K", 18, with_two_tone=False) == 68000   # float-noise fix in effect
NV = sum(len(i["variants"]) for i in out)
assert NV == 2970

# ---------------------------------------------------------------- seal (the formula gen_migration.py checks after apply)
seal_lines, desc_md5 = [], {}
for it in out:
    third = it["variationAxes"][2]
    for v in it["variants"]:
        pr = v["properties"]
        seal_lines.append("|".join([v["sku"], pr["Karat"], pr["Metal Color"], pr[third], str(v["price_cents"]), f"{v['grams']:.2f}"]))
    desc_md5[it["id"]] = hashlib.md5(it["description"].encode()).hexdigest()
seal_lines.sort(key=lambda s: s.split("|")[0].encode())   # order by sku collate "C"
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
PRICE_SEAL = hashlib.md5("\n".join(f"{line.split('|')[0]}:{line.split('|')[4]}" for line in seal_lines).encode()).hexdigest()
DESC_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + desc_md5[it["id"]] for it in out), key=lambda s: s.encode())).encode()).hexdigest()
TAG_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + ",".join(it["tags"]) for it in out), key=lambda s: s.encode())).encode()).hexdigest()

basis = {
    "rule": "price = ceil(round(2 x maker_cost, 6) / 10) x 10 (owner decision 2026-10-07; float-noise fix 2026-10-09)",
    "status": PRICING_STATUS,
    "makerCost": "gold grams x density x (spot x purity + labor per gram) + quoted extras; see ../maker_cost.py",
    "maker14KUsdPerGram": mk.MAKER_14K_USD_G, "laborUsdPerGram": round(mk.LABOR_USD_G, 2),
    "spotUsdOzt": mk.SPOT_USD_OZT, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z",
    "densityVs14K": mk.DENSITY, "purity": mk.PURITY,
    "karatRatioVs14K": {k: round(mk.karat_ratio(k), 3) for k in KARATS},
    "karats": "10K and 18K through gold_cost on gold and chain; enamel, assembly and two-tone items stay fixed",
    "rings": "3 mm band from the maker's list, the maker's rule for motif rings (14K US 7 = 3.59 g = 720); two-tone + 50 per operation",
    "necklaces": "max(geometry grams, 1 g per motif unit) x 100 + 50 enamel + 130 chain at 18 in (scaled by length) + 50 assembly where parts sit in the chain (N04, N08, N10); Twin Wire has no enamel charge",
    "bracelets": "basis (a), owner 2026-10-09: max(geometry grams, 1 g per unit) + 50 enamel + 100 chain at 7 in (scaled by length) + 50 assembly. price_cents_basis_b is the (b) fallback (geometry x 3.75, the Christmas B09 ratio): the Christmas-wave bracelets go up on (b) if the maker has not answered question 3 by the listing date, and come down to the quote",
    "cuff": "B08: geometry grams x inner circumference / 7 in + 50 assembly, no chain, no enamel; the same under (a) and (b)",
    "twoTone": "50 USD per two-tone operation (R08 and B08 = 2), fixed across karats",
    "uncalibratedAssumptions": list(UNCAL.values()),
    "grams": "variant grams = the 14K-equivalent grams each price is built on (piece after the unit floor, chain at 100 USD/g; rings: the 3 mm band list), density-scaled for 10K/18K; geometryGrams14Ref is the piece's own estimate from the spec",
    "modelFee": "25 USD x 30 = 750 USD one-off, not in unit prices; up to 300 more if each two-tone accent part counts as its own model",
    "neverRun": "the EON pricing engine on this org: it maps two tone titles to its own 250 USD profile",
    "marginCheck": {"deepestOffer": DEEPEST_OFFER, "etsyFees": ETSY_FEES, "minShareOfPriceLeft": round(min(MARGINS)[0], 4),
                    "at": min(MARGINS)[1], "note": "after the offer and fees, against the estimated maker cost; Offsite Ads not included"},
}
with open(HERE / "catalog.json", "w") as fh:
    json.dump({"source": SOURCE, "org": ORG, "sourcePackage": PKG, "sourcePackagePath": PKG_PATH, "pricingBasis": basis,
               "items": out}, fh, ensure_ascii=False, indent=1)
with open(HERE / "seal.json", "w") as fh:
    json.dump({"variantSeal": SEAL, "variants": NV, "priceSeal": PRICE_SEAL, "descSeal": DESC_SEAL, "tagSeal": TAG_SEAL,
               "descMd5": desc_md5}, fh, indent=1)

print("items", len(out), "variants", NV, "seal", SEAL, "price", PRICE_SEAL, "desc", DESC_SEAL, "tag", TAG_SEAL)
print("margin after a 30% offer and 9.5% fees: min", round(min(MARGINS)[0], 4), "at", min(MARGINS)[1],
      "max", round(max(MARGINS)[0], 4), "at", max(MARGINS)[1])
for i in out:
    ps = [v["price_cents"] // 100 for v in i["variants"]]
    extra = f" (b) {i['refPriceCentsBasisB'] // 100}" if "refPriceCentsBasisB" in i else ""
    print(i["id"], f"{i['name']:<44}", i["listingProtocol"], "geo", i["geometryGrams14Ref"], "priced", i["grams14Ref"],
          "cost", round(i["makerCost14KRefUsd"]), "ref", i["refPriceCents"] // 100, extra, " range", min(ps), max(ps), " title", len(i["title"]))
