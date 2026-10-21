#!/usr/bin/env python3
"""Generate the per-listing optimization matrix (new title + 13 tags + attributes + priority)
from data/listings-master.json, using the keyword evidence in data/*.tsv.

Rules encoded here come from the research (see reports/eon-etsy-seo-findings.md):
- 55% of Etsy-search visits contain "men/mens"; 4% "women" -> wedding bands lead with Mens.
- 10k > 14k > 18k in buyer queries; white gold > yellow > rose.
- eRank Etsy volume: head terms carry the volume (mens wedding band 4.0k, gold ring 7.5k, 14k gold ring 2.1k,
  10k gold ring 963, fidget ring 4.9k KD3, anxiety ring 1.4k KD26, engraved ring 1.9k, anniversary gift for him 3.5k,
  gold signet ring 1.5k, chunky gold ring 1.1k, dainty gold ring 1.3k, stacking ring 1.2k). Attribute long-tails are <20.
- Every listing: 4 head tags + 4 style/feature tags + 2 width/size tags + 2 occasion/recipient tags + 1 niche tag.
- Tag <= 20 chars, 13 unique, multi-word, no adjective piles. Title <= 140, primary keyword in first 40 chars.
"""
import json, re, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
master = json.loads((DATA / "listings-master.json").read_text(encoding="utf-8"))
L = master["listings"]
# Variants the listing actually sells (panel mirror of Etsy, 2026-10-21). Titles and width tags
# are built from this, never from the old title: the first matrix read karat and width from the
# title and defaulted to 14K, so 7 listings that sell 10K/14K/18K lost "10K" (the most searched
# karat) and 5 titles claimed widths the listing does not offer (Greek Key "3-12mm", sold 5-12mm).
PANEL = json.loads((DATA / "panel-variants.json").read_text(encoding="utf-8"))["listings"]

def karats(l):
    pk = PANEL.get(l["id"], {}).get("karats")
    if pk:
        return pk
    t = l["title"].lower()
    if re.search(r"10k\s*[-–]\s*18k|10k 14k 18k|10k, 14k or 18k|10k–18k|10k-18k|10k 14k or 18k|10k–18k|10k, 14k, or 18k", t):
        return ["10k", "14k", "18k"]
    ks = [k for k in ("10k", "14k", "18k") if re.search(k, t)]
    if ks:
        return ks
    ak = l["attr_key"].get("gold", [])
    ks = [k for k in ("10k", "14k", "18k") if any(k in a for a in ak)]
    return ks or ["14k"]

def metal(l):
    return l["metal"]

# Designs the title alone cannot name correctly. Source: panel SKU family (EON-TIDE = Tideline,
# satin face with a polished double rib on one edge; sandblasted face with polished facets on the
# step edge for the three "Sandblasted/Faceted Step Edge" listings). Without this they fell into the
# generic stepped template ("Satin Face Polished Rails"), which describes neither.
STYLE_OVERRIDES = {
    "4595912155": "tideline", "4595932754": "tideline", "4595932998": "tideline",
    "4583525281": "sandstep", "4583532935": "sandstep", "4583536194": "sandstep",
}

STYLE_PATTERNS = [
    ("fidget", r"fidget|kinetic|moving bead"),
    ("christmas", r"christmas|poinsettia|bethlehem|pinecone|candlelight|wreath|holly|knitted|peace dove|ribbon bow|folded star|snow crystal|advent|garland|comet|navidad|ribbon band"),
    ("sizer", r"ring sizer"),
    ("calendar", r"calendar"),
    ("stack", r"counterform|north glyph|fourth leaf|gnomon|twin seeds|star band|two tone ring, solid gold 3.2|14k two tone ring"),
    ("leafring", r"gold leaf ring"),
    ("greek", r"greek key"),
    ("celtic", r"celtic"),
    ("cross", r"cross|laurel"),
    ("watchlink", r"watch link"),
    ("honeycomb", r"honeycomb"),
    ("victorian", r"victorian"),
    ("stonefinish", r"stone finish"),
    ("splitfinish", r"split finish"),
    ("diagonal", r"diagonal"),
    ("ridge", r"\bridge\b"),
    ("stepped", r"stepped|step edge|step ring"),
    ("sandblast", r"sandblast"),
    ("hammered", r"hammered"),
    ("milgrain", r"milgrain|beaded"),
    ("twotone", r"two tone|two-tone|mixed metal|black rhodium"),
    ("herringbone", r"herringbone|chevron"),
    ("leafband", r"leaf wedding band"),
    ("rhodium", r"black rhodium"),
    ("checkered", r"checkered|basketweave|crosshatch|star cut|diamond cut|diamond-cut|faceted|facet"),
    ("knife", r"knife edge"),
    ("engravedtop", r"recessed|top engraving|channel|engraved satin|satin channel"),
    ("satin", r"satin|brushed|matte|crossgrain"),
    ("dome", r"dome"),
    ("beveled", r"bevel"),
    ("flat", r"flat"),
    ("plain", r"wedding band"),
]

def style(l):
    if l["id"] in STYLE_OVERRIDES:
        return STYLE_OVERRIDES[l["id"]]
    t = l["title"].lower()
    for name, pat in STYLE_PATTERNS:
        if re.search(pat, t):
            return name
    return "plain"

def widths(l):
    pw = PANEL.get(l["id"], {}).get("widths_mm")
    if pw:
        fmt = lambda x: f"{x:g}"
        return (fmt(min(pw)), fmt(max(pw)))
    t = l["title"]
    m = re.findall(r"(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:[-–]|to|or)\s*(\d+(?:\.\d+)?)\s*mm", t)
    if m:
        a, b = m[0]
        return (a, b)
    m = re.findall(r"(\d+(?:\.\d+)?)\s*mm", t)
    if m:
        return (m[0], m[0])
    return None

# ---- tag banks -------------------------------------------------------------
HEAD_WEDDING = {
    "white": ["mens wedding band", "mens white gold band", "KARAT white gold band"],
    "yellow": ["mens wedding band", "mens gold band ring", "yellow gold band"],
    "rose": ["mens wedding band", "rose gold band ring", "mens rose gold band"],
    "two tone": ["mens wedding band", "two tone gold band", "mens two tone band"],
    "gold-unspecified": ["mens wedding band", "mens gold band ring", "solid gold band ring"],
}
KARAT_TAG = {"10k": "10k gold band ring", "14k": "14k gold band ring", "18k": "18k gold band"}
KARAT_RING = {"10k": "10k gold ring", "14k": "14k gold ring", "18k": "18k gold ring"}
STYLE_TAGS = {
    "milgrain": ["milgrain gold band", "milgrain band", "milgrain wedding set", "beaded edge ring"],
    "hammered": ["hammered gold band", "hammered mens ring", "hammered band ring", "hammered finish ring"],
    "satin": ["brushed wedding band", "brushed gold ring", "matte brushed ring", "satin wedding band"],
    "beveled": ["beveled wedding band", "beveled edge ring", "brushed gold ring", "comfort band ring"],
    "dome": ["dome wedding band", "low dome comfort fit", "comfort band ring", "plain gold band ring"],
    "flat": ["flat wedding band", "plain gold band ring", "comfort band ring", "simple gold band"],
    "knife": ["knife edge band", "knife edge ring", "comfort band ring", "plain gold band ring"],
    "plain": ["plain gold band ring", "comfort band ring", "simple gold band", "gold comfort band"],
    "twotone": ["two tone gold ring", "two tone bands", "mixed metal band", "comfort band ring"],
    "greek": ["greek key ring", "greek key band", "greek style ring", "gold greek key ring"],
    "celtic": ["celtic knot band", "gold celtic band", "celtic wedding ring", "irish wedding band"],
    "cross": ["cross wedding band", "christian ring", "laurel cross ring", "religious wedding"],
    "watchlink": ["watch link ring", "gold link band", "modern gold band", "brushed gold ring"],
    "honeycomb": ["honeycomb gold ring", "carved gold band", "geometric gold ring", "faceted gold band"],
    "victorian": ["floral wedding band", "victorian style ring", "scrollwork ring", "vintage style ring"],
    "stonefinish": ["textured gold band", "stone finish ring", "three stripe ring", "brushed gold ring"],
    "splitfinish": ["split finish ring", "brushed gold ring", "center groove ring", "two finish ring"],
    "diagonal": ["diagonal cut ring", "carved wedding rings", "faceted gold band", "brushed gold ring"],
    "stepped": ["step edge ring", "stepped edge ring", "modern gold band", "comfort band ring"],
    "ridge": ["step edge ring", "stepped edge ring", "textured gold band", "modern gold band"],
    "tideline": ["stepped edge ring", "satin wedding band", "double rib band", "brushed gold ring"],
    "sandstep": ["sandblasted ring", "step edge ring", "matte wedding band", "textured gold band"],
    "sandblast": ["sandblasted ring", "matte wedding band", "textured gold band", "faceted gold band"],
    "herringbone": ["herringbone ring", "chevron gold ring", "diamond cut band", "textured gold band"],
    "checkered": ["diamond cut band", "faceted gold band", "textured gold band", "carved wedding rings"],
    "leafband": ["leaf wedding band", "nature wedding band", "leaf gold band", "faceted gold band"],
    "engravedtop": ["engraved gold band", "engraved band ring", "satin wedding band", "custom gold band"],
    "rhodium": ["black rhodium band", "black gold ring men", "two tone gold ring", "engraved gold band"],
}
OCCASION_TAGS = ["anniversary gift him", "promise ring for him", "engraved ring", "couples rings gold", "his and hers bands", "groom wedding band"]

def width_tags(w, metal_name, offered=None):
    out = []
    if offered:
        pref = [6, 4, 3, 2, 5, 7, 8, 10, 9, 12, 11]
        tagsets = {6: "6mm wedding band", 4: "4mm gold band", 3: "3mm gold band", 2: "2mm gold band", 5: "5mm wedding band", 7: "7mm wedding band", 8: "8mm wedding band",
                   9: "9mm wedding band", 10: "10mm wedding band", 11: "11mm wedding band", 12: "12mm wedding band"}
        picks = [c for c in pref if float(c) in offered][:2]
        if picks:
            return [tagsets[p] for p in picks]
    if not w:
        return ["6mm wedding band", "4mm gold band"]
    a, b = w
    try:
        fa, fb = float(a), float(b)
    except ValueError:
        return ["6mm wedding band", "4mm gold band"]
    cands = []
    for mm in (2, 3, 4, 5, 6, 7, 8):
        if fa <= mm <= fb:
            cands.append(mm)
    if not cands:
        cands = [int(round(fa))]
    # pick up to 2: prefer 6mm (mens) then 4mm/3mm/2mm (womens/thin)
    pref = [6, 4, 3, 2, 5, 7, 8]
    picks = [c for c in pref if c in cands][:2]
    tagsets = {6: "6mm wedding band", 4: "4mm gold band", 3: "3mm gold band", 2: "2mm gold band", 5: "5mm wedding band", 7: "7mm wedding band", 8: "8mm wedding band"}
    return [tagsets[p] for p in picks] or ["6mm wedding band"]

BANNED = {"tungsten","titanium","silver","silicone","plated","moissanite","cartier","tiffany","mejuri","benchmark","estate","hypoallergenic"}
# "diamond" is banned as a stone claim (EON sells no stones); "diamond cut" is a finishing term the
# owner keeps (decision 2026-10-21).
DIAMOND_STONE = re.compile(r"diamond(?! cut)")
def design_tags(l, exclude, n=2):
    """Up to n of the listing's existing OK tags (<=20 chars, not salad, not generic) to keep design-specific phrases."""
    generic = {"comfort fit band","comfort fit ring","solid gold band","made to order ring","gold wedding band","mens wedding band","womens wedding band",
               "10k wedding band","14k wedding band","18k wedding band","10k gold band","14k gold band","18k gold band","18k gold ring","6mm wedding band",
               "7mm wedding band","unisex wedding band","unisex wedding ring","yellow gold ring","white gold ring","rose gold ring","gift for him",
               "anniversary gift","engraved ring","his and hers rings","couples rings","thin gold band","wide gold band","size 3 to 14 ring","stacking ring",
               "christmas ring","minimalist ring","dainty ring","holiday jewelry","winter jewelry","meaningful gift","elegant ring","sculptural ring","fine jewelry design"}
    # SALAD/MIXED listings carry no old tags forward: the first matrix kept 146 of them
    # ("order bevel ring fit", "solid women gold men") because the salad list was incomplete.
    if l["tag_quality"] != "OK":
        return []
    out = []
    for t in l["tags"]:
        t = t.lower().strip()
        if len(t) > 20 or " " not in t or t in exclude or t in generic or t in l["salad_tags"]: continue
        if any(b in t for b in BANNED) or DIAMOND_STONE.search(t): continue
        out.append(t)
        if len(out) >= n: break
    return out

def build_wedding(l):
    m = metal(l); ks = karats(l); st = style(l); w = widths(l)
    tags = []
    tags += [x.replace("KARAT", ks[0]) for x in HEAD_WEDDING.get(m, HEAD_WEDDING["gold-unspecified"])[:3]]
    tags.append(KARAT_TAG[ks[0]])
    if len(ks) > 1:
        tags.append(KARAT_RING[ks[1]] if ks[1] != "14k" else "14k wedding band")
    extra = design_tags(l, set(tags) | set(STYLE_TAGS.get(st, STYLE_TAGS["plain"])[:2]), 2)
    tags += STYLE_TAGS.get(st, STYLE_TAGS["plain"])[:4 - len(extra)] + extra
    tags += width_tags(w, m, PANEL.get(l["id"], {}).get("widths_mm"))
    tags += OCCASION_TAGS[:2]
    if l["personalizable"] and "engraved ring" not in tags:
        tags.append("engraved ring")
    tags.append("solid gold band ring" if "solid gold band ring" not in tags else "comfort fit band")
    tags.append("wedding band for him")
    # dedupe keep order, enforce <=20, cut to 13 then top-up
    seen, final = set(), []
    for t in tags:
        t = t.strip()
        if len(t) <= 20 and t not in seen:
            seen.add(t); final.append(t)
    fill = ["mens gold band", "gold wedding band", "made to order ring", "comfort fit band", "unisex wedding band", "thin gold band", "wide gold band"]
    for f in fill:
        if len(final) >= 13: break
        if f not in seen:
            seen.add(f); final.append(f)
    return final[:13]

def build_title_wedding(l):
    m = metal(l); ks = karats(l); st = style(l); w = widths(l)
    metal_word = {"white": "White Gold", "yellow": "Yellow Gold", "rose": "Rose Gold", "two tone": "Two Tone Gold", "gold-unspecified": "Solid Gold"}[m]
    karat_word = ks[0].upper() if len(ks) == 1 else "10K 14K 18K"
    style_word = {
        "milgrain": "Milgrain", "hammered": "Hammered", "satin": "Satin Brushed", "beveled": "Beveled Edge", "dome": "Dome",
        "flat": "Flat", "knife": "Knife Edge", "plain": "Comfort Fit", "twotone": "", "greek": "Greek Key", "celtic": "Celtic Knot",
        "cross": "Cross", "watchlink": "Watch Link", "ridge": "Ridge Step Edge", "tideline": "Stepped Edge Satin", "sandstep": "Sandblasted Step Edge", "honeycomb": "Honeycomb Carved", "victorian": "Victorian Floral", "stonefinish": "Stone Finish Textured",
        "splitfinish": "Split Finish", "diagonal": "Diagonal Cut", "stepped": "Step Edge", "sandblast": "Sandblasted", "herringbone": "Herringbone",
        "checkered": "Diamond Cut", "leafband": "Leaf", "engravedtop": "Engraved Satin", "rhodium": "Black Rhodium",
    }[st]
    width_word = f", {w[0]}-{w[1]}mm Width" if w and w[0] != w[1] else (f", {w[0]}mm Width" if w else "")
    engr = ", Free Engraving" if l["personalizable"] else ""
    desc2 = {
        "milgrain": "Beaded Edge Comfort Fit Ring", "hammered": "Textured Comfort Fit Ring", "satin": "Satin Center Polished Edges Comfort Fit Ring",
        "beveled": "Polished Bevel Comfort Fit Ring", "dome": "Rounded Classic Comfort Fit Ring", "flat": "Modern Flat Profile Comfort Fit Ring",
        "knife": "Modern Comfort Fit Ring", "plain": "Plain Classic Ring", "twotone": "Mixed Metal Comfort Fit Ring", "greek": "Meander Pattern Comfort Fit Ring",
        "celtic": "Irish Knotwork Comfort Fit Ring", "cross": "Laurel Engraved Christian Ring", "watchlink": "Bracelet Link Pattern Ring",
        "honeycomb": "Geometric Faceted Ring", "victorian": "Vintage Scroll Pattern Ring", "stonefinish": "Three Stripe Textured Ring",
        "splitfinish": "Half Polished Half Brushed Ring", "diagonal": "Satin Faceted Comfort Fit Ring", "stepped": "Polished Step Edge Comfort Fit Ring",
        "ridge": "Textured Face Stepped Polished Edges Ring", "tideline": "Satin Face Polished Double Rib Ring", "sandstep": "Matte Sandblasted Face Polished Facet Edges Ring",
        "sandblast": "Matte Texture Polished Groove Ring", "herringbone": "Chevron Diamond Cut Ring", "checkered": "Faceted Satin Comfort Fit Ring",
        "leafband": "Nature Marquise Facet Ring", "engravedtop": "Recessed Satin Channel Ring", "rhodium": "Two Tone Beveled Comfort Fit Ring",
    }[st]
    solid = "" if metal_word == "Solid Gold" else "Solid Gold "
    core = f"Mens {karat_word} {metal_word} {style_word} Wedding Band".replace("  ", " ")
    parts = [core, f"{solid}{desc2} for Him and Her"]
    if width_word: parts.append(width_word.lstrip(", "))
    if engr: parts.append(engr.lstrip(", "))
    parts.append("Made to Order")
    while len(", ".join(parts)) > 140 and len(parts) > 2:
        parts.pop()
    return ", ".join(parts)

# Special groups ---------------------------------------------------------------
def build_special(l):
    st = style(l); t = l["title"].lower()
    if st == "fidget":
        return ("Fidget Ring 14K Solid Gold, Anxiety Ring with Moving Bead, Kinetic Spinner Band, Comfort Fit Worry Ring for Men and Women",
                ["fidget ring", "gold fidget ring", "anxiety ring", "fidget ring gold", "gold anxiety ring", "14k gold fidget ring", "fidget wedding band", "spinner ring", "worry rings", "adhd fidget ring", "men fidget ring", "fidget ring women", "anxiety ring gold"])
    if st == "sizer":
        return ("Ring Sizer Tool, Reusable Plastic US Finger Size Gauge, At Home Ring Measurer for Wedding Band and Engagement Ring Sizing",
                ["ring sizer", "ring sizer tool", "ring size gauge", "finger measure tool", "ring measurer", "ring sizing tool", "us ring sizer", "ring size finder", "ring size tool", "ring size measure", "reusable ring sizer", "plastic ring sizer", "ring size chart tool"])
    if st == "calendar":
        return ("Personalized Calendar Ring, Custom Date Gold Ring 10K 14K 18K, Anniversary Date Ring, Engraved Statement Ring for Him and Her",
                ["calendar ring", "custom date ring", "personalized ring", "anniversary ring", "date ring gold", "engraved ring", "gold signet ring", "statement ring gold", "14k gold ring", "anniversary gift him", "gift for her gold", "custom gold ring", "memorial date ring"])
    if st == "leafring":
        return ("Gold Leaf Ring, Solid 10K 14K 18K Open Double Leaf Band, Botanical Nature Ring, Minimalist Gold Statement Ring for Her",
                ["gold leaf ring", "leaf ring gold", "botanical gold ring", "nature ring gold", "open leaf ring", "14k gold ring", "dainty gold ring", "statement ring gold", "minimalist gold ring", "gift for her gold", "solid gold ring", "double leaf ring", "leaf band ring"])
    if st == "stack":
        name = "Two Tone" if "two tone" in t else "Minimalist"
        return (None, ["gold stacking ring", "stacking ring", "dainty gold ring", "14k gold ring", "minimalist gold ring", "gold band ring", "solid gold ring", "everyday gold ring", "stackable gold ring", "gift for her gold", "thin gold band", "modern gold ring", "14k stacking rings"])
    if st == "christmas":
        motif = re.sub(r"(stacking ring|ring|,|minimalist|christmas|design|low profile|two tone|light petal|openwork leaf halo|signet|stacker|band|in yellow gold|sculptural closed band for stacking|woodland|origami|hexagonal|four small lights|scalloped|ribbon band|stackable|de oro amarillo|anillo floral escult.rico apilable|sculptural jewelry anillo .rbol navidad en oro amarillo|banda satinada con pino calado|celestial).*?$", "", l["title"], flags=re.I).strip(" ,") or "Christmas"
        overrides = {"4593798957": "Christmas Garland", "4593794275": "Christmas Wreath", "4593814704": "Christmas Tree", "4593809784": "Two Tone Ribbon"}
        motif = overrides.get(l["id"], motif)
        base = ["christmas ring", "gold stacking ring", "christmas gift ring", "stacking ring", "dainty gold ring", "gold ring for her", "christmas gift her", "holiday ring gold", "stackable gold ring", "minimalist gold ring", "winter jewelry gold"]
        extra = design_tags(l, set(base), 2)
        base += extra + ["gift for her gold", "solid gold ring"]
        return (f"{motif} Stacking Ring Solid Gold, Christmas Ring Gift for Her, Dainty Gold Stackable Holiday Ring, Minimalist Winter Jewelry", base[:13])
    return None

def priority(l):
    s = 0
    s += 40 if l["tag_quality"] == "SALAD" else 15 if l["tag_quality"] == "MIXED" else 0
    s += min(30, l["stats_3m"]["visits"] / 10)  # traffic at stake
    s += 10 if l["attr_count"] == 0 else 0
    s += 5 if not l["video"] else 0
    s += 10 if l["spanish_title"] else 0
    s += 5 if l["stats_3m"]["visits"] == 0 else 0
    return round(s, 1)

out = []
for l in L:
    sp = build_special(l)
    st = style(l)
    if sp:
        title, tags = sp
        if title is None:
            title = l["title"]
        group = st
    else:
        title, tags = build_title_wedding(l), build_wedding(l)
        group = f"wedding-{st}"
    # validation
    assert len(tags) == 13, (l["id"], len(tags), tags)
    assert all(len(t) <= 20 for t in tags), (l["id"], [t for t in tags if len(t) > 20])
    assert len(set(tags)) == 13, (l["id"], tags)
    assert len(title) <= 140, (l["id"], len(title))
    attrs_needed = []
    ak = l["attr_key"]
    if "gold" not in ak: attrs_needed.append("Gold purity")
    if "band" not in ak: attrs_needed.append("Band color + Band width")
    if "recipient" not in ak: attrs_needed.append("Recipient (Men, Women, Unisex adults)")
    if "occasion" not in ak: attrs_needed.append("Occasion (Wedding or Anniversary)")
    if "can" not in ak and l["personalizable"]: attrs_needed.append("Can be personalized: Yes")
    if l["attr_count"] == 0: attrs_needed = ["ALL attributes empty: Materials, Gold solidity, Gold purity, Band color, Band width, Shank type, Style, Occasion, Recipient"]
    out.append({
        "id": l["id"], "priority": priority(l), "group": group, "metal": metal(l), "karats": karats(l),
        "visits_3m": l["stats_3m"]["visits"], "orders_3m": l["stats_3m"]["orders"], "tag_quality": l["tag_quality"],
        "current_title": l["title"], "new_title": title, "current_tags": l["tags"], "new_tags": tags,
        "attributes_to_fill": attrs_needed, "needs_video": not l["video"],
        "section_fix": None,
        "notes": ("Spanish title on US shop: rewrite in English" if l["spanish_title"] else ""),
    })

# section fixes: style-based canonical section
SECTION_FOR = {"milgrain": "Milgrain Wedding Bands", "hammered": "Textured Gold Bands", "satin": "Satin Wedding Bands", "beveled": "Beveled Wedding Bands",
               "dome": "Domed Wedding Bands", "flat": "Flat Wedding Bands", "knife": "Knife Edge Wedding Bands", "twotone": "Two Tone Wedding Bands",
               "cross": "Cross Wedding Bands", "christmas": "Christmas Spark", "fidget": "Modern Gold Rings", "stack": "Modern Gold Rings", "leafring": "Modern Gold Rings",
               "calendar": "Modern Gold Rings", "greek": "Textured Gold Bands", "celtic": "Textured Gold Bands", "watchlink": "Textured Gold Bands",
               "honeycomb": "Textured Gold Bands", "victorian": "Textured Gold Bands", "stonefinish": "Textured Gold Bands", "splitfinish": "Satin Wedding Bands",
               "diagonal": "Textured Gold Bands", "stepped": "Flat Wedding Bands", "ridge": "Textured Gold Bands", "tideline": "Satin Wedding Bands", "sandstep": "Textured Gold Bands", "sandblast": "Textured Gold Bands", "herringbone": "Textured Gold Bands",
               "checkered": "Textured Gold Bands", "leafband": "Textured Gold Bands", "engravedtop": "Satin Wedding Bands", "rhodium": "Two Tone Wedding Bands", "plain": "Flat Wedding Bands", "sizer": "No Section"}
byid = {l["id"]: l for l in L}
for o in out:
    want = SECTION_FOR.get(o["group"].replace("wedding-", ""))
    cur = byid[o["id"]]["section"]
    if want and want != cur:
        o["section_fix"] = f"{cur} -> {want}"

out.sort(key=lambda x: -x["priority"])

# Every phrase the rules can emit, so validate can tell a bank tag from an old tag carried over.
bank = set(OCCASION_TAGS) | set(KARAT_TAG.values()) | set(KARAT_RING.values()) | {"14k wedding band", "solid gold band ring", "comfort fit band", "wedding band for him",
        "mens gold band", "gold wedding band", "made to order ring", "unisex wedding band", "thin gold band", "wide gold band",
        "6mm wedding band", "4mm gold band", "3mm gold band", "2mm gold band", "5mm wedding band", "7mm wedding band", "8mm wedding band",
        "9mm wedding band", "10mm wedding band", "11mm wedding band", "12mm wedding band"}
for v in HEAD_WEDDING.values(): bank |= {x.replace("KARAT", k) for x in v for k in ("10k", "14k", "18k")}
for v in STYLE_TAGS.values(): bank |= set(v)
for l in L:
    sp = build_special(l)
    if sp: bank |= set(sp[1])
(DATA / "tag-banks.json").write_text(json.dumps(sorted(bank), indent=0), encoding="utf-8")
(DATA / "optimization-matrix.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

# CSV for humans
import csv
with open(DATA / "optimization-matrix.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["priority", "id", "group", "visits_3m", "tag_quality", "current_title", "new_title", "new_tags", "attributes_to_fill", "section_fix", "needs_video", "notes"])
    for o in out:
        w.writerow([o["priority"], o["id"], o["group"], o["visits_3m"], o["tag_quality"], o["current_title"], o["new_title"], " | ".join(o["new_tags"]), "; ".join(o["attributes_to_fill"]), o["section_fix"] or "", "yes" if o["needs_video"] else "", o["notes"]])

print("listings", len(out))
print("groups", collections.Counter(o["group"] for o in out).most_common())
print("section fixes", sum(1 for o in out if o["section_fix"]))
for o in out[:12]:
    print(o["priority"], o["id"], o["group"], o["visits_3m"], "\n   ", o["new_title"], "\n   ", o["new_tags"])
