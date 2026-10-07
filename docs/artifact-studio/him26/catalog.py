"""Artifact Studio For Him 2026: 30 minimalist men's listings (10 rings, 10 bracelets, 10 earrings).

Single source of truth for copy, sizes, estimated grams, prices and the reference-hero prompts.
Run: python3 docs/artifact-studio/him26/catalog.py
Writes catalog.json next to this file and fails loudly on any rule break.
Pricing rule is the Christmas 2026 / FW 26/27 one (docs/artifact-studio/xmas26/catalog.py).
Solid gold only: no enamel, no stones. Earrings sell as a single piece or a pair (third axis "Pieces").
"""
import json, math, re, sys, uuid, pathlib

HERE = pathlib.Path(__file__).parent
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"  # by Artifact Studio Jewelry
NS = uuid.UUID("3f9b2c7d-81e4-4a6f-b0d2-5c7e19a4f8b6")
SOURCE = "artifact-him26-v1"
PREFIX = "BAS-HM-"

# ---------------------------------------------------------------- pricing basis (FW 26/27 rule)
SPOT_USD_OZT = 4178.20          # same basis as the Christmas set, so the two collections price alike
PURE_G = SPOT_USD_OZT / 31.1034768
PURITY = {"10K": 0.417, "14K": 0.585, "18K": 0.750}
DENSITY = {"10K": 0.892, "14K": 1.0, "18K": 1.137}
LOSS = 1.07
QUOTE = {"ring": 365, "bracelet": 375, "earring": 350}          # owner 14K quotes (earring = a pair)
QUOTE_AVG_G = {"ring": 2.04, "bracelet": 1.48, "earring": 0.88}
LABOR = {c: round(QUOTE[c] - QUOTE_AVG_G[c] * PURE_G * PURITY["14K"] * LOSS, 2) for c in QUOTE}
SINGLE_LABOR_SHARE = 0.6        # UNCALIBRATED_ASSUMPTION: one earring costs 60% of the pair's labor
MARKUP = 2.0

RING_SIZES = [x / 2 for x in range(6, 33)]          # US 3 .. 16, whole and half = 27
BRAC_LEN = [7.5, 8, 8.5]                            # men's wrist lengths
PIECES = ["Single", "Pair"]
KARATS = ["10K", "14K", "18K"]
COLORS = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]


def ring_d(s):
    return 11.63 + 0.8128 * s


def band_g(width, thick=1.5):
    """14K grams of a flat band at US 7, from the owner's maker table (1.5 mm wall)."""
    return round(width * (0.836 + 0.0515 * 7) * thick / 1.5, 2)


def grams14(m, size):
    c = m["cat"]
    if c == "ring":
        return m["top_g"] + m["shank_g"] * ring_d(size) / ring_d(7)
    if c == "bracelet":
        return m["piece_g"] + m["per_in"] * size
    return m["piece_g"] * (2 if size == "Pair" else 1)


def labor(m, size):
    c = m["cat"]
    if c == "earring" and size == "Single":
        return LABOR[c] * SINGLE_LABOR_SHARE
    return LABOR[c]


def price_cents_v1(m, k, size):
    """Superseded 2026-10-07 before publication: own estimate with quote-derived labor."""
    g = grams14(m, size) * DENSITY[k]
    cost = g * PURE_G * PURITY[k] * LOSS + labor(m, size)
    return int(math.ceil(MARKUP * cost / 10) * 10 * 100)


# ---------------------------------------------------------------- v2: 2 x maker cost (owner 2026-10-07)
sys.path.insert(0, str(HERE.parent))
import maker_cost as mk  # noqa: E402

# Ring grams from the maker's band list: (equivalent width mm, wall mm). Plain bands use their own width;
# signets follow the owner's rule "top + shank, halve it" (2026-09-16); the bar signet's face is 48 mm2
# against the square signet's 81 mm2, so its equivalent width sits between shank and square: 5 mm.
RING_LIST = {"R01": (4, 1.4), "R02": (3, 1.5), "R03": (6, 1.5), "R04": (5, 1.5), "R05": (2.5, 1.8),
             "R06": (4, 1.4), "R07": (5, 1.3), "R08": (2, 2.0), "R09": (3.5, 1.5), "R10": (2, 2.0)}
STATION_ASSEMBLY = {"B03", "B09"}      # bar / tubes joined to the chain: the quoted 50 USD assembly
# Earrings: the 2027 enamel quote was 350 USD a pair at 0.88 g; less 2 x 50 enamel = 250; less its gold
# (88 at 100/g) = 162 USD non-gold work per pair. Single = 60% of that (UNCALIBRATED).
EAR_PAIR_WORK = 350 - 2 * mk.ENAMEL_PIECE - 0.88 * mk.MAKER_14K_USD_G


def maker_g14(m, size):
    c = m["cat"]
    if c == "ring":
        w, t = RING_LIST[m["id"]]
        return mk.list_g14(w, size, t)
    if c == "bracelet":
        return m["piece_g"] + m["per_in"] * size
    return m["piece_g"] * (2 if size == "Pair" else 1)


def maker_cost(m, k, size):
    c = m["cat"]
    cost = mk.gold_cost(maker_g14(m, size), k)
    if c == "bracelet":
        return cost + (mk.ASSEMBLY if m["id"] in STATION_ASSEMBLY else 0)
    if c == "earring":
        return cost + EAR_PAIR_WORK * (1 if size == "Pair" else SINGLE_LABOR_SHARE)
    return cost


def price_cents(m, k, size):
    return mk.price_cents(maker_cost(m, k, size))


SHARED_TAGS = ["mens jewelry", "gift for him", "minimalist jewelry"]

M = []


def add(**kw):
    M.append(kw)


# ============================================================ RINGS
add(id="R01", cat="ring", name="Brushed Flat Band", dims="band 4 mm wide, 1.4 mm thick", top_g=0.0, shank_g=band_g(4, 1.4),
    title="Mens Flat Band Ring, 4mm Brushed Solid Gold Wedding Band, Minimalist Gold Ring for Him",
    tags=["mens gold band", "brushed gold ring", "flat band ring", "mens wedding band", "4mm gold band",
          "satin finish ring", "everyday ring", "plain gold band", "mens ring", "14k mens ring"],
    lead="A 4 mm flat band in solid gold with a brushed satin finish and softly eased edges.",
    story="Nothing on it but the grain of the brush. The satin surface hides the small scratches that daily wear puts on polished gold, so it looks the same in a year as it does today.",
    shape="a plain flat band ring 4 mm wide and 1.4 mm thick with a fine brushed satin finish whose brush lines run around the circumference of the band, parallel to its edges, and softly eased edges, comfort fit inside, shown standing upright in a three-quarter view")
add(id="R02", cat="ring", name="Polished Dome Band", dims="band 3 mm wide, domed", top_g=0.0, shank_g=3.6,
    title="Mens Dome Band Ring, 3mm Polished Solid Gold Wedding Band, Classic Minimalist Ring for Him",
    tags=["mens dome ring", "dome band", "polished gold band", "mens wedding band", "3mm gold band",
          "classic gold ring", "everyday ring", "plain gold band", "mens ring", "14k mens ring"],
    lead="A 3 mm half-round band in high polish solid gold, the oldest wedding band shape there is.",
    story="Rounded on the outside, flat and smooth on the inside, so it slides over the knuckle and sits without pressing. Narrow enough to stack with a watch or a second band.",
    shape="a plain half-round dome band ring 3 mm wide with a smoothly rounded outer surface in mirror high polish and a flat comfort fit inside, shown standing upright in a three-quarter view")
add(id="R03", cat="ring", name="Square Signet Ring", dims="square face 9 x 9 mm", top_g=2.0, shank_g=2.2,
    title="Mens Square Signet Ring, Solid Gold Flat Top Signet, Minimalist Pinky Ring for Him",
    tags=["mens signet ring", "square signet", "gold signet ring", "flat top ring", "pinky ring",
          "minimalist signet", "statement ring", "classic signet", "mens ring", "14k signet ring"],
    lead="A square signet in solid gold: a flat 9 mm face, polished, on a tapering shank.",
    story="The face is left blank and smooth on purpose. Worn on the little finger it is the old gentleman's ring; on the index finger it reads modern.",
    shape="a square signet ring with a flat 9 by 9 mm face with slightly rounded corners in mirror high polish, solid and closed underneath, the shank tapering smoothly from the face to a 3 mm band at the back, shown in a three-quarter view from slightly above")
add(id="R04", cat="ring", name="Bar Signet Ring", dims="bar face 12 x 4 mm", top_g=1.4, shank_g=2.2,
    title="Mens Bar Signet Ring, Solid Gold Long Rectangle Signet, Modern Minimalist Ring for Him",
    tags=["bar signet ring", "mens signet ring", "rectangle signet", "gold signet ring", "modern signet",
          "minimalist signet", "statement ring", "flat top ring", "mens ring", "14k signet ring"],
    lead="A signet stretched into a line: a flat 12 by 4 mm bar face across the finger, in solid gold.",
    story="It keeps the weight and presence of a signet but drops the badge. The long face sits across the finger like a horizon.",
    shape="a signet ring with a long flat rectangular face 12 by 4 mm laid across the finger, sharp clean edges, brushed satin top surface with polished bevelled sides, solid and closed underneath, on a 3 mm band, shown in a three-quarter view from slightly above")
add(id="R05", cat="ring", name="Knife Edge Band", dims="band 2.5 mm wide, knife edge", top_g=0.0, shank_g=2.6,
    title="Mens Knife Edge Ring, 2.5mm Polished Solid Gold Band, Thin Minimalist Stacking Ring for Him",
    tags=["knife edge ring", "mens thin ring", "polished gold band", "stacking ring", "2.5mm gold band",
          "minimalist band", "everyday ring", "mens wedding band", "mens ring", "14k mens ring"],
    lead="A slim 2.5 mm band whose outer surface rises to a single sharp ridge, in high polish solid gold.",
    story="Two flat planes meet at a line down the middle, so the light breaks along the ridge as the hand moves. Thin enough to wear next to anything.",
    shape="a slim round gold ring 2.5 mm wide lying flat on its side like a coin, its hole facing up; seen from slightly above, the outer surface of the band is shaped like a roof, two narrow sloping sides that meet in one sharp ridge line running all the way around the outside of the ring, like the edge of a knife, while the inside of the ring is flat and smooth; mirror high polish")
add(id="R06", cat="ring", name="Hammered Band", dims="band 4 mm wide", top_g=0.0, shank_g=band_g(4, 1.4),
    title="Mens Hammered Band Ring, 4mm Textured Solid Gold Wedding Band, Rustic Minimalist Ring for Him",
    tags=["hammered ring", "mens hammered band", "textured gold band", "mens wedding band", "4mm gold band",
          "rustic gold ring", "handmade texture", "faceted gold band", "mens ring", "14k mens ring"],
    lead="A 4 mm flat band in solid gold, hand-hammered all the way round into small polished facets.",
    story="Every strike leaves a flat facet that catches the light at its own angle. No two bands come out the same.",
    shape="a flat band ring 4 mm wide whose whole outer surface is covered in small irregular hand-hammered facets, each facet polished bright, with smooth narrow edges and a comfort fit inside, shown standing upright in a three-quarter view")
add(id="R07", cat="ring", name="Centre Line Band", dims="band 5 mm wide, 0.5 mm centre groove", top_g=0.0, shank_g=band_g(5, 1.3),
    title="Mens Grooved Band Ring, 5mm Solid Gold Wedding Band with Centre Line, Modern Ring for Him",
    tags=["grooved ring", "mens grooved band", "center line ring", "mens wedding band", "5mm gold band",
          "modern gold band", "brushed gold ring", "wide gold band", "mens ring", "14k mens ring"],
    lead="A 5 mm flat band in brushed solid gold, cut once around the middle with a fine polished groove.",
    story="One line is all it carries. The groove is polished bright against the satin on either side, so it reads as a thin line of light.",
    shape="a flat band ring 5 mm wide and 1.3 mm thick with a fine brushed satin finish whose brush lines run around the circumference, parallel to the edges, divided all the way around by a single narrow 0.5 mm groove cut down the centre and polished bright, square edges softly eased, comfort fit inside, shown standing upright in a three-quarter view")
add(id="R08", cat="ring", name="Square Wire Ring", dims="square profile 2 x 2 mm", top_g=0.0, shank_g=3.2,
    title="Mens Square Wire Ring, 2mm Square Profile Solid Gold Band, Minimalist Stacking Ring for Him",
    tags=["square wire ring", "square band ring", "mens thin ring", "stacking ring", "2mm gold ring",
          "geometric ring", "minimalist band", "everyday ring", "mens ring", "14k mens ring"],
    lead="A band with a square cross section, 2 by 2 mm, in solid gold with crisp polished corners.",
    story="Seen from the side it is a square, seen from the front a narrow bar. Heavier in the hand than a round band of the same width.",
    shape="a perfectly round ring made from solid square gold wire: the ring itself is a circle, only the wire's cross section is a 2 by 2 mm square, so the outer surface is flat and the edges are crisp right angles; flat polished faces, shown standing upright in a three-quarter view so the square profile shows at the edge")
add(id="R09", cat="ring", name="Octagon Facet Band", dims="band 3.5 mm wide, eight flat facets", top_g=0.0, shank_g=band_g(3.5),
    title="Mens Faceted Band Ring, 3.5mm Octagon Solid Gold Ring, Geometric Minimalist Band for Him",
    tags=["faceted ring", "octagon ring", "geometric ring", "mens wedding band", "3.5mm gold band",
          "faceted gold band", "modern gold band", "polished gold band", "mens ring", "14k mens ring"],
    lead="A 3.5 mm band whose outside is cut into eight flat polished facets, so it is an octagon round the finger.",
    story="Eight planes instead of a curve. Each facet throws its own flash of light; inside, it is round and smooth.",
    shape="a band ring 3.5 mm wide whose outer surface is cut into eight equal flat facets forming a regular octagon around the finger, each facet mirror polished with crisp edges between them, round comfort fit inside, shown standing upright in a three-quarter view")
add(id="R10", cat="ring", name="Open Bar Ring", dims="square wire 2 mm, open ends 4 mm apart", top_g=0.0, shank_g=2.6,
    title="Mens Open Ring, Solid Gold Square Wire Open Bar Ring, Modern Minimalist Ring for Him",
    tags=["open ring", "mens open ring", "open bar ring", "square wire ring", "modern gold ring",
          "geometric ring", "minimalist ring", "statement ring", "mens ring", "14k mens ring"],
    lead="A square gold wire ring left open on top: two flat cut ends that stop 4 mm short of each other.",
    story="The gap is the design. The two ends face each other across the top of the finger, square and flush, like a line with a pause in it.",
    shape="an open ring formed from solid 2 by 2 mm square gold wire whose two flat cut ends stop facing each other with a clean 4 mm gap on top of the ring, crisp corners and mirror polished faces, shown from slightly above so the gap is visible")

# ============================================================ BRACELETS
add(id="B01", cat="bracelet", name="Box Chain Bracelet", dims="2 mm box chain", piece_g=0.3, per_in=0.42,
    title="Mens Box Chain Bracelet, 2mm Solid Gold Box Link Chain, Minimalist Gold Bracelet for Him",
    tags=["box chain bracelet", "mens chain bracelet", "gold box chain", "2mm gold chain", "mens gold bracelet",
          "square link chain", "everyday bracelet", "layering bracelet", "mens bracelet", "14k mens bracelet"],
    lead="A 2 mm box chain in solid gold: small square links that lie flat and keep their shape.",
    story="The box chain is the most architectural of chains, square from every side. It sits close to the wrist and wears well next to a watch.",
    shape="a solid gold 2 mm box chain bracelet made of small square box links with crisp edges and a high polish, laid in a loose open curve, with a gold lobster clasp", clasp="lobster")
add(id="B02", cat="bracelet", name="Flat Curb Bracelet", dims="3 mm flat curb chain", piece_g=0.35, per_in=0.62,
    title="Mens Curb Chain Bracelet, 3mm Flat Solid Gold Curb Link, Classic Gold Bracelet for Him",
    tags=["curb chain bracelet", "mens curb bracelet", "flat curb chain", "3mm gold chain", "mens gold bracelet",
          "classic chain", "everyday bracelet", "gold link bracelet", "mens bracelet", "14k mens bracelet"],
    lead="A 3 mm flat curb chain in solid gold, the classic men's link, bright cut so it lies flat on the wrist.",
    story="Interlocking links twisted and pressed flat, so the chain drapes evenly and the cut faces catch the light all along it.",
    shape="a solid gold 3 mm flat curb chain bracelet of interlocking twisted links pressed flat with bright cut faces, laid in a loose open curve, with a gold lobster clasp", clasp="lobster")
add(id="B03", cat="bracelet", name="ID Bar Bracelet", dims="bar 30 x 6 mm on 1.5 mm cable chain", piece_g=3.0, per_in=0.18,
    title="Mens ID Bar Bracelet, Brushed Solid Gold Bar on Fine Cable Chain, Minimalist Gold Bracelet for Him",
    tags=["id bracelet", "mens bar bracelet", "gold bar bracelet", "id bar bracelet", "mens gold bracelet",
          "brushed gold bar", "everyday bracelet", "fine chain bracelet", "mens bracelet", "14k mens bracelet"],
    lead="A flat 30 by 6 mm bar in brushed solid gold, on a fine 1.5 mm cable chain.",
    story="The ID bracelet with the name left off. The bar is brushed so it reads as a plain field of gold against the skin, set between two lengths of chain.",
    shape="a bracelet with a flat rectangular bar 30 by 6 mm and 1.2 mm thick in fine brushed satin gold with the brush lines running along the length of the bar, and polished edges, joined at both ends to a fine 1.5 mm polished gold cable chain, laid in a loose open curve with the bar centred, gold lobster clasp", clasp="lobster")
add(id="B04", cat="bracelet", name="Slim Open Cuff", dims="cuff 2.5 mm wide, 1.3 mm thick", piece_g=0.0, per_in=0.85,
    title="Mens Open Cuff Bracelet, 2.5mm Solid Gold Slim Cuff, Minimalist Gold Bangle for Him",
    tags=["mens cuff bracelet", "gold cuff", "open cuff", "slim gold cuff", "mens gold bracelet",
          "minimalist cuff", "everyday cuff", "gold bangle", "mens bracelet", "14k gold cuff"],
    lead="A slim open cuff in solid gold, 2.5 mm wide, polished, with flat squared ends.",
    story="It slides on from the side of the wrist and stays put without a clasp. Choose the length that matches your wrist and the opening is sized for it.",
    shape="a slim open cuff bracelet made of a flat solid gold band 2.5 mm wide and 1.3 mm thick, bent into an oval with an opening of about 25 mm at one side, flat squared ends, mirror high polish, shown lying at a slight angle so the opening is visible", clasp="cuff")
add(id="B05", cat="bracelet", name="Rope Chain Bracelet", dims="2 mm rope chain", piece_g=0.3, per_in=0.40,
    title="Mens Rope Chain Bracelet, 2mm Solid Gold Rope Chain, Classic Twisted Gold Bracelet for Him",
    tags=["rope chain bracelet", "mens rope bracelet", "twisted gold chain", "2mm rope chain", "mens gold bracelet",
          "classic chain", "everyday bracelet", "gold rope chain", "mens bracelet", "14k mens bracelet"],
    lead="A 2 mm rope chain in solid gold: small links twisted into a continuous spiral.",
    story="From a step away it reads as a single twisted cord of gold. Up close you see every link set at the same angle.",
    shape="a solid gold 2 mm rope chain bracelet of small links twisted into a tight continuous spiral with a high polish, laid in a loose open curve, gold lobster clasp", clasp="lobster")
add(id="B06", cat="bracelet", name="Figaro Chain Bracelet", dims="2.5 mm figaro chain", piece_g=0.3, per_in=0.45,
    title="Mens Figaro Chain Bracelet, 2.5mm Solid Gold Figaro Link, Classic Gold Bracelet for Him",
    tags=["figaro bracelet", "mens figaro chain", "figaro link", "2.5mm gold chain", "mens gold bracelet",
          "classic chain", "everyday bracelet", "gold link bracelet", "mens bracelet", "14k mens bracelet"],
    lead="A 2.5 mm Figaro chain in solid gold: three short links, then one long one, all the way round.",
    story="The rhythm of the Figaro is what makes it: short, short, short, long. Flat links, so it lies smooth on the wrist.",
    shape="a solid gold 2.5 mm Figaro chain bracelet with a repeating pattern of three short flat oval links and one long flat oval link, high polish, laid in a loose open curve, gold lobster clasp", clasp="lobster")
add(id="B07", cat="bracelet", name="Wheat Chain Bracelet", dims="2 mm wheat chain", piece_g=0.3, per_in=0.45,
    title="Mens Wheat Chain Bracelet, 2mm Solid Gold Spiga Chain, Minimalist Gold Bracelet for Him",
    tags=["wheat chain bracelet", "spiga bracelet", "mens wheat chain", "2mm gold chain", "mens gold bracelet",
          "braided gold chain", "everyday bracelet", "layering bracelet", "mens bracelet", "14k mens bracelet"],
    lead="A 2 mm wheat chain in solid gold, the links woven in a tight braid like an ear of wheat.",
    story="Also called spiga. Stiffer and fuller than a cable chain of the same width, it holds a clean line on the wrist.",
    shape="a solid gold 2 mm wheat chain (spiga chain) bracelet of small oval links woven in a tight four-sided braid like an ear of wheat, high polish, laid in a loose open curve, gold lobster clasp", clasp="lobster")
add(id="B08", cat="bracelet", name="Mariner Chain Bracelet", dims="3 mm mariner chain", piece_g=0.35, per_in=0.50,
    title="Mens Mariner Chain Bracelet, 3mm Solid Gold Anchor Link, Nautical Gold Bracelet for Him",
    tags=["mariner bracelet", "anchor chain", "mens mariner chain", "3mm gold chain", "mens gold bracelet",
          "nautical bracelet", "everyday bracelet", "gold link bracelet", "mens bracelet", "14k mens bracelet"],
    lead="A 3 mm mariner chain in solid gold: oval links, each crossed by a small bar, like a ship's anchor chain.",
    story="The crossbar was there to stop heavy chain from kinking at sea. On the wrist it just gives each link a little more weight and order.",
    shape="a solid gold 3 mm mariner chain (anchor chain) bracelet of flat oval links each crossed by a small straight bar across the middle, high polish, laid in a loose open curve, gold lobster clasp", clasp="lobster")
add(id="B09", cat="bracelet", name="Tube Station Bracelet", dims="three square tubes 2 x 10 mm on 1.5 mm box chain", piece_g=1.2, per_in=0.25,
    title="Mens Tube Bracelet, Three Square Solid Gold Tubes on Box Chain, Minimalist Station Bracelet for Him",
    tags=["tube bracelet", "station bracelet", "mens bar bracelet", "square tube beads", "mens gold bracelet",
          "geometric bracelet", "everyday bracelet", "box chain bracelet", "mens bracelet", "14k mens bracelet"],
    lead="Three square gold tubes, each 10 mm long, threaded along a fine 1.5 mm solid gold box chain.",
    story="Three short bars of gold spaced a finger's width apart, brushed so they look matte next to the polished chain.",
    shape="a fine 1.5 mm polished gold box chain bracelet with three square tube stations, each 2 by 2 by 10 mm in brushed satin gold with the brush lines running along the tube, spaced a little apart at the centre of the chain, laid in a loose open curve, gold lobster clasp", clasp="lobster")
add(id="B10", cat="bracelet", name="Long Link Bracelet", dims="3 mm elongated cable links", piece_g=0.3, per_in=0.38,
    title="Mens Long Link Bracelet, 3mm Solid Gold Elongated Cable Chain, Modern Gold Bracelet for Him",
    tags=["long link bracelet", "mens link bracelet", "elongated chain", "3mm gold chain", "mens gold bracelet",
          "modern chain", "everyday bracelet", "cable chain", "mens bracelet", "14k mens bracelet"],
    lead="A 3 mm chain of long rounded links in solid gold, open and light on the wrist.",
    story="Each link is stretched to about twice its width, so the chain shows more air than metal. Modern, but not loud.",
    shape="a solid gold chain bracelet of elongated rounded oval cable links 3 mm wide and about 6 mm long, made from round wire with a high polish, laid in a loose open curve, gold lobster clasp", clasp="lobster")

# ============================================================ EARRINGS (sold single or pair)
add(id="E01", cat="earring", name="Square Stud", proto="stud_earrings", dims="square face 4 x 4 mm", piece_g=0.35,
    title="Mens Square Stud Earring, 4mm Brushed Solid Gold Stud, Single or Pair Minimalist Earring for Him",
    tags=["mens stud earring", "square stud", "mens gold stud", "brushed gold stud", "single stud earring",
          "minimalist stud", "small gold stud", "mens earrings", "square earring", "14k mens stud"],
    lead="A flat 4 mm square stud in brushed solid gold, sold as a single earring or a pair.",
    story="A small square of satin gold that sits flush to the ear. Wear one alone or both; it reads the same either way.",
    shape="a pair of small flat square stud earrings, each face 4 by 4 mm with crisp edges in fine brushed satin gold, on gold posts with butterfly backs; one stud lies flat, the other stands slightly angled to show the post")
add(id="E02", cat="earring", name="Disc Stud", proto="stud_earrings", dims="disc 5 mm", piece_g=0.38,
    title="Mens Disc Stud Earring, 5mm Polished Solid Gold Round Stud, Single or Pair Earring for Him",
    tags=["mens stud earring", "disc stud", "round gold stud", "flat disc earring", "single stud earring",
          "minimalist stud", "small gold stud", "mens earrings", "polished gold stud", "14k mens stud"],
    lead="A flat 5 mm disc of polished solid gold on a post, sold as a single earring or a pair.",
    story="The plainest shape there is, made carefully: a flat round face with a softly rounded edge and a mirror finish.",
    shape="a pair of small flat round disc stud earrings, each 5 mm across with a softly rounded edge and a mirror polished flat face, on gold posts with butterfly backs; one stud lies flat, the other stands slightly angled to show the post")
add(id="E03", cat="earring", name="Bar Stud", proto="stud_earrings", dims="bar 2 x 8 mm", piece_g=0.38,
    title="Mens Bar Stud Earring, 8mm Solid Gold Line Stud, Single or Pair Minimalist Earring for Him",
    tags=["mens bar earring", "bar stud", "line stud earring", "gold bar stud", "single stud earring",
          "minimalist stud", "vertical bar stud", "mens earrings", "geometric stud", "14k mens stud"],
    lead="A short vertical bar of solid gold, 2 by 8 mm, on a post, sold as a single earring or a pair.",
    story="It follows the line of the earlobe instead of sitting on it like a dot. Polished on the edges, brushed on the face.",
    shape="a pair of small vertical bar stud earrings, each a flat bar 2 by 8 mm with square ends, brushed satin face with the brush lines running along the bar and polished edges, on gold posts with butterfly backs; one stud lies flat, the other stands slightly angled to show the post")
add(id="E04", cat="earring", name="Hex Stud", proto="stud_earrings", dims="hexagon 5 mm", piece_g=0.4,
    title="Mens Hexagon Stud Earring, 5mm Brushed Solid Gold Hex Stud, Single or Pair Earring for Him",
    tags=["mens stud earring", "hexagon stud", "hex earring", "geometric stud", "single stud earring",
          "brushed gold stud", "small gold stud", "mens earrings", "minimalist stud", "14k mens stud"],
    lead="A flat 5 mm hexagon in brushed solid gold, sold as a single earring or a pair.",
    story="Six straight sides instead of a circle: still small and quiet, but with an edge to it.",
    shape="a pair of small flat hexagon stud earrings, each 5 mm across with crisp straight sides, brushed satin face and polished bevelled edges, on gold posts with butterfly backs; one stud lies flat, the other stands slightly angled to show the post")
add(id="E05", cat="earring", name="Pyramid Stud", proto="stud_earrings", dims="pyramid 4 x 4 mm", piece_g=0.42,
    title="Mens Pyramid Stud Earring, 4mm Solid Gold Stud, Single or Pair Geometric Earring for Him",
    tags=["mens stud earring", "pyramid stud", "geometric stud", "gold pyramid earring", "single stud earring",
          "minimalist stud", "small gold stud", "mens earrings", "polished gold stud", "14k mens stud"],
    lead="A small four-sided pyramid in polished solid gold, 4 mm at the base, sold as a single earring or a pair.",
    story="Four facets meeting at a point, so it catches the light from every side and looks like more than its size.",
    shape="a pair of small solid square pyramid stud earrings, each 4 by 4 mm at the base with four flat mirror polished facets meeting at a low point, on gold posts with butterfly backs; one stud lies flat, the other stands slightly angled to show the post")
add(id="E06", cat="earring", name="Plain Huggie Hoop", proto="hoop_earrings", dims="hoop 10 mm, 2 mm thick", piece_g=0.7,
    title="Mens Huggie Hoop Earring, 10mm Polished Solid Gold Small Hoop, Single or Pair Earring for Him",
    tags=["mens hoop earring", "huggie hoop", "small gold hoop", "mens huggie", "single hoop earring",
          "minimalist hoop", "10mm gold hoop", "mens earrings", "polished gold hoop", "14k mens hoop"],
    lead="A 10 mm huggie hoop in polished solid gold, 2 mm thick, sold as a single earring or a pair.",
    story="Small enough to hug the lobe with no gap. The hinged closure clicks shut and sits flush, so there is no back to lose.",
    shape="a pair of small round huggie hoop earrings 10 mm across made of a 2 mm thick solid gold round tube with a mirror high polish, each with a hinged click closure; one hoop lies flat, the other stands upright")
add(id="E07", cat="earring", name="Ribbed Huggie Hoop", proto="hoop_earrings", dims="hoop 12 mm, 2.5 mm wide", piece_g=0.85,
    title="Mens Ribbed Hoop Earring, 12mm Solid Gold Grooved Huggie, Single or Pair Earring for Him",
    tags=["mens hoop earring", "ribbed hoop", "grooved huggie", "textured gold hoop", "single hoop earring",
          "mens huggie", "12mm gold hoop", "mens earrings", "minimalist hoop", "14k mens hoop"],
    lead="A 12 mm huggie hoop in solid gold, cut with fine parallel ridges all the way round.",
    story="The ribs give it grip on the light: it flickers as you turn your head. Hinged click closure, sold single or as a pair.",
    shape="a pair of small round huggie hoop earrings 12 mm across and 2.5 mm wide, the outer surface cut with fine parallel ribs running across the hoop all the way around, high polish, hinged click closure; one hoop lies flat, the other stands upright")
add(id="E08", cat="earring", name="Square Profile Hoop", proto="hoop_earrings", dims="hoop 14 mm, square 1.8 mm profile", piece_g=0.9,
    title="Mens Square Hoop Earring, 14mm Solid Gold Square Profile Hoop, Single or Pair Earring for Him",
    tags=["mens hoop earring", "square tube hoop", "geometric hoop", "gold hoop earring", "single hoop earring",
          "minimalist hoop", "14mm gold hoop", "mens earrings", "modern hoop", "14k mens hoop"],
    lead="A 14 mm round hoop made from square gold wire, so its edges are sharp where a hoop is usually soft.",
    story="Round from the front, square from the side. A little larger than a huggie, with a clean flat face that shows against the ear.",
    shape="a pair of round hoop earrings 14 mm across made from solid square gold wire with a 1.8 by 1.8 mm square cross section, crisp polished corners, hinged click closure; one hoop lies flat, the other stands upright so the square profile shows")
add(id="E09", cat="earring", name="Bar Drop Earring", proto="dangle_earrings", dims="bar 1.5 x 12 mm below a 3 mm stud", piece_g=0.5,
    title="Mens Bar Drop Earring, Solid Gold 12mm Bar Dangle on Small Stud, Single or Pair Earring for Him",
    tags=["mens drop earring", "bar dangle earring", "gold bar drop", "mens dangle earring", "single earring",
          "minimalist drop", "line earring", "mens earrings", "modern earring", "14k mens earring"],
    lead="A slim 12 mm bar of solid gold hanging from a small round stud, sold as a single earring or a pair.",
    story="It moves when you do, but only a little: a short line of gold that swings below the lobe.",
    shape="a pair of short drop earrings: each has a tiny 3 mm round polished gold stud and, hanging from it by a small gold jump ring, a slim round gold bar 1.5 mm thick and 12 mm long with a polished finish")
add(id="E10", cat="earring", name="Mini Signet Stud", proto="stud_earrings", dims="round face 6 mm", piece_g=0.5,
    title="Mens Signet Stud Earring, 6mm Solid Gold Round Signet Face Stud, Single or Pair Earring for Him",
    tags=["mens stud earring", "signet earring", "signet stud", "round gold stud", "single stud earring",
          "minimalist stud", "small gold stud", "mens earrings", "classic stud", "14k mens stud"],
    lead="A signet ring's face made into a stud: a flat 6 mm round top on a bevelled gold collar.",
    story="Flat polished top, angled sides, solid underneath. It has the weight of a small coin and the look of a signet.",
    shape="a pair of small round signet face stud earrings, each a flat mirror polished 6 mm round top sitting on a bevelled solid gold collar that narrows toward the ear, on gold posts with butterfly backs; one stud lies flat, the other stands slightly angled to show the post")

# ---------------------------------------------------------------- assembly
LEN_LINE = "choose 7.5, 8 or 8.5 inches (measure your wrist and add about half an inch)."
CLASP = {"lobster": "Chain: solid gold with a lobster clasp; " + LEN_LINE,
         "cuff": "Fit: open cuff without a clasp, sized to the wrist length you choose; " + LEN_LINE}
DETAIL = {
    "ring": "Ring size: US 3 to 16, whole and half sizes.",
    "stud_earrings": "Earrings: solid gold posts with butterfly backs. Choose a single earring or a pair.",
    "hoop_earrings": "Earrings: hinged click closure, no separate back. Choose a single earring or a pair.",
    "dangle_earrings": "Earrings: solid gold posts with butterfly backs. Choose a single earring or a pair.",
}
# Must be ids from lib/etsy/listing-protocol.ts; an unknown id silently falls back to product_type
KNOWN_PROTOCOLS = {"sculptural_ring", "chain_bracelet", "cuff_bracelet", "stud_earrings", "dangle_earrings", "hoop_earrings"}
AXES = {"ring": ["Karat", "Metal Color", "Ring Size"], "bracelet": ["Karat", "Metal Color", "Bracelet Length"],
        "earring": ["Karat", "Metal Color", "Pieces"]}

METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose."
GOLD_LINE = "Finish: solid gold, no plating, no stones."
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE = "Care: solid gold does not tarnish. Wipe it with a soft cloth; a brushed finish can be refreshed by a jeweller."
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")

PROMPT = ("Studio product photograph of fine jewelry: {shape}. Solid 14K yellow gold only, no stones, "
          "no enamel, no colour; real gold reflections, finishes exactly as described. Resting on a smooth matte warm "
          "grey stone surface, soft directional daylight from the upper left, a crisp natural shadow, the stone surface stays "
          "in focus with a fine natural grain texture, no blur gradients, no compression artifacts, true-to-life small scale, three-quarter front view from slightly above, centred, calm minimal "
          "composition with generous negative space. No props, no hands, no text, no logo, no packaging. "
          "Photorealistic high-end commercial jewelry photography for men, square format.")


def sizes(cat):
    return {"ring": RING_SIZES, "bracelet": BRAC_LEN, "earring": PIECES}[cat]


def ref_size(cat):
    return {"ring": 10, "bracelet": 8, "earring": "Pair"}[cat]


def num(s):
    return str(int(s)) if s == int(s) else str(s)


def size_label(cat, s):
    if cat == "earring":
        return s
    return "US " + num(s) if cat == "ring" else f"{num(s)} inches"


def size_code(cat, s):
    if cat == "earring":
        return {"Single": "1PC", "Pair": "PAIR"}[s]
    return ("US" + num(s) if cat == "ring" else num(s) + "IN").replace(".", "_")


def protocol(m):
    if m["cat"] == "ring":
        return "sculptural_ring"
    if m["cat"] == "bracelet":
        return "cuff_bracelet" if m["clasp"] == "cuff" else "chain_bracelet"
    return m["proto"]


IMG = {}
if (HERE / "images.json").exists():
    IMG = {r["id"]: r for r in json.load(open(HERE / "images.json"))["images"]}

BAN = ["—", "–", "â", "enamel", "diamond ", "plated"]
out = []
seen_titles, seen_sku, seen_shape = set(), set(), set()
assert len(M) == 30
for m in M:
    cat = m["cat"]
    assert len([x for x in M if x["cat"] == cat]) == 10
    proto = protocol(m)
    assert proto in KNOWN_PROTOCOLS, (m["id"], proto)
    tags = m["tags"] + SHARED_TAGS
    assert len(tags) == 13 and len(set(tags)) == 13, (m["id"], len(set(tags)))
    for t in tags:
        assert len(t) <= 20 and re.fullmatch(r"[a-z0-9 .]+", t), (m["id"], t)
    assert len(m["title"]) <= 140 and m["title"] not in seen_titles, (m["id"], len(m["title"]))
    assert "Mens" in m["title"] and "for Him" in m["title"], m["id"]
    seen_titles.add(m["title"])
    assert m["shape"] not in seen_shape
    seen_shape.add(m["shape"])
    if cat == "earring":
        assert "Single or Pair" in m["title"] and "a pair of" in m["shape"], m["id"]
        detail = DETAIL[proto]
    elif cat == "bracelet":
        detail = CLASP[m["clasp"]]
        assert ("lobster clasp" in m["shape"]) == (m["clasp"] == "lobster"), m["id"]
    else:
        detail = DETAIL["ring"]
    spec = [METAL, GOLD_LINE, f"Size: {m['dims']}.", detail]
    desc = "\n\n".join([m["lead"], m["story"], "\n".join(spec), SHIP, CARE, IMAGES])
    for b in BAN:
        assert b not in (desc + m["title"] + " ".join(tags) + m["shape"]).lower().replace("no plating", ""), (m["id"], b)
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
                                 "grams": round(maker_g14(m, s) * DENSITY[k], 2),
                                 "price_cents": price_cents(m, k, s)})
    assert len(variants) == {"ring": 243, "bracelet": 27, "earring": 18}[cat]
    if cat == "earring":   # a pair must cost more than a single and less than two singles
        for k in KARATS:
            for _, cn in COLORS:
                p = {v["properties"]["Pieces"]: v["price_cents"] for v in variants
                     if v["properties"]["Karat"] == k and v["properties"]["Metal Color"] == cn}
                assert p["Single"] < p["Pair"] < 2 * p["Single"], (m["id"], k, p)
    rs = ref_size(cat)
    ref = next(v for v in variants if v["properties"]["Karat"] == "14K" and v["properties"]["Metal Color"] == "Yellow Gold"
               and v["properties"][AXES[cat][2]] == size_label(cat, rs))
    out.append({
        "id": m["id"], "productType": cat, "name": m["name"],
        "productId": str(uuid.uuid5(NS, SOURCE + ":" + m["id"])), "sku": base_sku,
        "title": m["title"], "tags": tags, "materials": ["Solid gold"],
        "description": desc, "dims": m["dims"], "shape": m["shape"],
        "listingProtocol": proto, "offersPersonalization": False, "variationAxes": AXES[cat],
        "grams14Ref": round(maker_g14(m, rs), 2), "makerCost14KRefUsd": round(maker_cost(m, "14K", rs), 2), "refSize": size_label(cat, rs), "refPriceCents": ref["price_cents"],
        "variants": variants, "imagePrompt": PROMPT.format(shape=m["shape"]), "imageFile": f"{m['id']}.jpg",
        "imageUrl": IMG.get(m["id"], {}).get("url"), "imageSha256": IMG.get(m["id"], {}).get("sha256"),
        "params": {k: m[k] for k in ("top_g", "shank_g", "piece_g", "per_in") if k in m},
    })

basis = {"rule": "price = ceil(2 x maker_cost / 10) x 10 (owner decision 2026-10-07)",
         "makerCost": "gold grams x density x (spot x purity + labor per gram) + quoted extras; see ../maker_cost.py",
         "maker14KUsdPerGram": mk.MAKER_14K_USD_G, "spotUsdOzt": mk.SPOT_USD_OZT,
         "ringGrams": "maker band list at the equivalent width and wall in RING_LIST",
         "estimated": ["chain grams per inch (solid chain), priced at the list's 100 USD/g",
                       "earring non-gold work 162 USD a pair (from the 2027 enamel quote); single = 0.6 x (UNCALIBRATED)",
                       "signet equivalent widths (owner rule top + shank halved; bar signet 5 mm)"],
         "modelFee": "25 USD once per design, not in unit price"}
json.dump({"source": SOURCE, "org": ORG, "pricingBasis": basis, "items": out},
          open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
print("items", len(out), "variants", sum(len(i["variants"]) for i in out))
for i in out:
    ps = [v["price_cents"] for v in i["variants"]]
    print(i["id"], f"{i['name']:<22}", i["listingProtocol"], "ref", i["refSize"], i["grams14Ref"], "g cost", round(i["makerCost14KRefUsd"]), "price",
          i["refPriceCents"] // 100, "USD  range", min(ps) // 100, max(ps) // 100)
