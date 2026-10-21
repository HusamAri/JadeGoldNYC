#!/usr/bin/env python3
"""Merge raw TSV parts, attach shop sections, classify tag quality, write master JSON + diagnostics."""
import csv, json, re, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

SECTIONS = {
    "0": "No Section", "55216256": "Domed Wedding Bands", "59433965": "Flat Wedding Bands",
    "59433967": "Beveled Wedding Bands", "59433969": "Milgrain Wedding Bands", "59709136": "Two Tone Wedding Bands",
    "59712574": "Textured Gold Bands", "59815975": "Satin Wedding Bands", "60018423": "Modern Gold Rings",
    "60867211": "Christmas Spark", "60947242": "Knife Edge Wedding Bands", "60964161": "Cross Wedding Bands",
}
SECTION_MEMBERS = {
    "0": "4567011572",
    "55216256": "4598462260,4539666999,4598439369,4598439561,4540106368,4544441878,4543441480,4539776904,4539764153",
    "59433965": "4598438585,4598692781,4598690935,4598463798,4598693143,4595912155,4598462572,4595932754,4598460976,4598463920,4598462434,4598438205,4598714962,4595932998,4598440171,4593576445,4587802253,4583532935,4583525281,4587807724,4587808180,4583536194,4563123383,4563122111,4563142004,4563144108,4563124415,4563144694,4563143550,4563122669,4563145204,4543938814,4543927823,4543427531,4539780408,4539777986,4539777194",
    "59433967": "4598438731,4598461508,4598461408,4548748804,4565351341,4565352791,4562944772,4562238597,4565325477,4562945436,4544213291,4542485546,4542484518,4539761531,4539503643,4539727911",
    "59433969": "4598462934,4598440817,4598440595,4583583869,4570232571,4582480715,4569554390,4570232103,4569554882,4569548560,4588432033,4570233049,4588431383,4583575515,4588436924,4583583705,4560211476,4548734437,4546520793,4582488598,4582479841,4560186803,4560188131,4560210242,4560210870,4560212214,4560186191,4560185581,4560211748,4540045731,4542485142,4539517211,4543953211,4539493533,4539506699",
    "59709136": "4565471789,4565798612,4565494144,4565472159,4565776235,4565775921,4550506827,4550516268,4550506421",
    "59712574": "4598691577,4543442596,4598716086,4598714582,4570154215,4583543753,4570169406,4583553978,4570153869,4583553848,4565377715,4565364310,4565401930,4565341959,4565377365,4565442042,4565419625,4568945326,4565442656,4565364530,4568945678,4568946002,4556695533,4556695233,4556695311,4556710904,4556711954,4556696295,4556711842,4556711370,4556695631,4548164284,4548151075",
    "59815975": "4554024684,4554025524,4554017323,4554024474,4554025048,4554025310,4554027532,4554014095,4554017181",
    "60018423": "4561855998,4593290504,4583279522,4583278836,4583279166,4561601341,4569505351,4561779380,4569505983,4569517712,4561537155,4561605534,4561558836,4561601599,4561536929",
    "60867211": "4593809784,4593787441,4593798957,4593789141,4593797291,4593671353,4593705461,4593792565,4593705293,4593723030,4593794275,4593814362,4593706383,4593814704,4593789699,4593654581",
    "60947242": "4544156933,4539776628",
    "60964161": "4569902988,4569890361,4569902788",
}
ID2SECTION = {}
for sid, ids in SECTION_MEMBERS.items():
    for i in ids.split(","):
        ID2SECTION[i] = SECTIONS[sid]

# Words that signal auto-generated "word salad" tags (adjective piles, no buyer search intent)
SALAD_WORDS = {"heirloom","durable","everyday","contemporary","sophisticated","artisan","handcrafted","hallmarked",
               "certified","affordable","hypoallergenic","quality","professional","elegant","versatile","investment",
               "commitment","milestone","relationship","statement","minimalist","classic","traditional","polished",
               "textured","matching","personalized","engraved","engagement","anniversary","promise","jewelry","fine",
               "modern","decorative","lightweight","sustainable","ethical","bespoke","designer","inspired","romantic",
               "forever","unisex","men","women","man","woman","hi","her","to","and","order","made","solid","ring","fit",
               "comfort","custom","thin","wide","edge","finish","design","gift","occasion","special","premium","genuine",
               "authentic","lifetime","resistant","accessory","bridal","bride","groom","couple","husband","wife","set",
               "appropriate","compatible","coordinating","understated","distinctive","signature","refined","neutral",
               "semi","half","dual","mixed","plain","simple","sleek","bold","edgy","zen","abstract","wearable","festive",
               "artistic","symbolic","spiritual","meditation","present","layering","contrast","interchangeable",
               "gradient","dimension","metalwork","architectural","alternating","alternative","companion","transition",
               "keepsake","cocktail","bridesmaid","unconventional","fashion","midi","eternity","renewal","marriage",
               "stacking","stackable","delicate","dainty","pure","karat","real","high","thick","rounded","hidden",
               "daily","wear","profile","brushed","satin","matte","sparkle","sparkly","grooved","forged","hand",
               "measure","measurement","measuring","finder","sizing","circumference","fingertip","precision",
               "accurate","personal","multipurpose","checker","diameter","portable","standard","fitting","easy",
               "gemstone","compact","band","wedding","gold","10","14","18","10k","14k","18k","4mm","5mm","6mm","8mm",
               "size","width","pattern","patterned","texture","geometric","construction","appearance","elegance",
               "formal","office","detail","detailed","luxury","unique","pride","conflict","christian","religiou",
               "catholic","orthodox","protestant","communion","confirmation","christma","holiday","winter","meaningful",
               "sculptural","cozy","nature","botanical","ornament","tree","cutout","plated","tone","two","ribbed",
               "stepped","fluted","chevron","braided","block","inlay","bevelled","bevel","flat","dome","domed",
               "knife","rope","meander","maeander","beaded","milgrain","hammered","diamond","cut","faceted",
               "sandblasted","crosshatch","checkered","herringbone","basketweave","twin","rail","star","celestial",
               "laurel","cross","leaf","greek","key","rhodium","black","white","yellow","rose","burnished","stamped",
               "recessed","channel","contoured","interior","flair","straight","crossover","shoulder","religious",
               "stone","free","top","engraving","inside","halo","vintage","bohemian","boho","art","deco","nouveau",
               "victorian","edwardian","mid","century","avant","garde","celtic","knot","heart","love","interlace",
               "knotwork","scroll","scrollwork","floral","honeycomb","carved","diagonal","split","groove","center",
               "stripe","three","watch","link","crossgrain","irregular","polish","rounded","dot","four","lights",
               "advent","garland","scalloped","contour","origami","folded","five","point","paper","snow","crystal",
               "hexagon","snowflake","holly","shield","signet","pinecone","woodland","wreath","openwork","bethlehem",
               "comet","poinsettia","bloom","flower","ribbon","bow","wrap","candlelight","petal","peace","dove","bird",
               "knit","knitted","fireside","frost","seal","crest","keep","glyph","north","gnomon","counterform",
               "fourth","lucky","luck","symbol","seeds","calendar","date","birthday","fidget","anxiety","worry",
               "sensory","kinetic","moving","bead","negative","space","quiet","closed","low","curved","subtle","modern"}

def is_salad(tag: str) -> bool:
    """Heuristic: a tag is word salad if it reads as a pile of adjectives with no product noun order,
    or contains truncated/odd tokens. Real search phrases look like '<attr> <product noun>'."""
    t = tag.lower().strip()
    toks = t.split()
    # truncated or junk tokens
    if re.search(r"\b(christma|religiou|hi|to|and|a|u)\b$", t) or " to " in f" {t} " and "to order" not in t and "to 8mm" not in t and "to 14" not in t and "to 12" not in t and "4mm to" not in t:
        return True
    if re.search(r"\b(hi|her|to|and|a)\b", t) and not re.search(r"(his and hers|4mm to 8mm|size 3 to 14|made to order|to 12mm|to 8mm)", t):
        return True
    # tags ending without a product noun (ring/band/jewelry/gold/gift/...) are suspicious
    nouns = ("ring","rings","band","bands","jewelry","gold","gift","wedding","engraving","stacker","signet","sizer","tool",
             "edge","finish","star","halo","knot","bloom","seal","crest","pattern","design","detail","rails","edges",
             "size","width","interior","shoulder","order","fit","he","women","men","him","her","mom","white","yellow","rose",
             "10k","14k","18k","4mm","5mm","6mm","7mm","8mm","3mm","2mm","12mm","dove","bow","tree","leaf","key","cross","link")
    last = toks[-1] if toks else ""
    if last not in nouns:
        return True
    # adjective pile: 3 tokens, none of them a product noun in position 2 or 3, e.g. "heirloom comfort fit"
    if len(toks) >= 3 and toks[1] not in nouns and toks[2] not in nouns and last in ("fit","order","edge","finish","size","width","design","detail","pattern","he","her","him","hi"):
        return True
    return False

def main():
    rows = []
    for part in ("raw-listings-part1.tsv", "raw-listings-part2.tsv"):
        with open(DATA / part, newline="", encoding="utf-8") as f:
            rdr = csv.reader(f, delimiter="\t")
            hdr = next(rdr)
            if hdr[0] != "id":  # part2 has no header
                rows.append(hdr)
            rows.extend(rdr)
    listings = []
    seen = set()
    for r in rows:
        if len(r) < 20 or r[0] in seen:
            continue
        seen.add(r[0])
        tags = [t for t in r[2].split("|") if t]
        salad = [t for t in tags if is_salad(t)]
        attr_key = dict()
        for kv in r[11].split(";"):
            if "=" in kv:
                k, v = kv.split("=", 1)
                attr_key.setdefault(k, []).append(v)
        L = {
            "id": r[0], "title": r[1], "title_len": len(r[1]), "tags": tags, "tag_count": len(tags),
            "salad_tags": salad, "salad_ratio": round(len(salad) / max(1, len(tags)), 2),
            "category": r[3], "section": ID2SECTION.get(r[0], "?"), "price": float(r[4]), "qty": int(r[5]),
            "video": r[6] == "1", "personalizable": r[7] == "1", "images": int(r[8]),
            "returns": r[9], "attr_count": int(r[10]), "attr_key": attr_key,
            "stats_30d": {"visits": int(r[12]), "orders": int(r[13]), "revenue": float(r[14]), "favorites": int(r[15])},
            "stats_3m": {"visits": int(r[16]), "orders": int(r[17]), "revenue": float(r[18]), "favorites": int(r[19])},
        }
        # metal from title
        tl = r[1].lower()
        L["metal"] = "two tone" if ("two tone" in tl or "two-tone" in tl or "mixed" in tl) else "white" if "white" in tl else "rose" if "rose" in tl else "yellow" if "yellow" in tl else "gold-unspecified"
        L["spanish_title"] = bool(re.search(r"\b(anillo|oro|amarillo|navidad|apilable)\b", tl))
        L["tag_quality"] = "SALAD" if L["salad_ratio"] >= 0.5 else "MIXED" if L["salad_ratio"] >= 0.2 else "OK"
        listings.append(L)

    listings.sort(key=lambda x: -x["stats_3m"]["visits"])
    out = {"shop": "EONFineJewelry", "shop_id": 61324215, "extracted": "2026-10-21", "active_listings": len(listings),
           "sections": SECTIONS, "listings": listings}
    (DATA / "listings-master.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    # diagnostics
    n = len(listings)
    v3 = sum(l["stats_3m"]["visits"] for l in listings)
    zero3 = [l for l in listings if l["stats_3m"]["visits"] == 0]
    under5 = [l for l in listings if l["stats_3m"]["visits"] < 5]
    salad = [l for l in listings if l["tag_quality"] == "SALAD"]
    mixed = [l for l in listings if l["tag_quality"] == "MIXED"]
    noattr = [l for l in listings if l["attr_count"] == 0]
    novideo = [l for l in listings if not l["video"]]
    noret = [l for l in listings if l["returns"] == "noret"]
    top10 = listings[:10]
    top10v = sum(l["stats_3m"]["visits"] for l in top10)
    tagfreq = collections.Counter(t for l in listings for t in l["tags"])
    titlefreq = collections.Counter()
    for l in listings:
        for w in re.findall(r"[a-z0-9]+", l["title"].lower()):
            titlefreq[w] += 1
    diag = {
        "active_listings": n, "visits_3m_total": v3, "orders_3m_total": sum(l["stats_3m"]["orders"] for l in listings),
        "revenue_3m_total": round(sum(l["stats_3m"]["revenue"] for l in listings), 2),
        "top10_visit_share": round(top10v / v3, 3), "top10_ids": [l["id"] for l in top10],
        "zero_visit_3m": len(zero3), "under5_visit_3m": len(under5),
        "salad_tag_listings": len(salad), "mixed_tag_listings": len(mixed),
        "no_attributes": len(noattr), "no_video": len(novideo), "no_returns_policy": len(noret),
        "spanish_titles": [l["id"] for l in listings if l["spanish_title"]],
        "section_counts": collections.Counter(l["section"] for l in listings),
        "category_counts": collections.Counter(l["category"] for l in listings),
        "metal_counts": collections.Counter(l["metal"] for l in listings),
        "top_tags": tagfreq.most_common(40),
        "salad_examples": [(l["id"], l["tags"][:4]) for l in salad[:8]],
        "visits_by_tag_quality": {q: sum(l["stats_3m"]["visits"] for l in listings if l["tag_quality"] == q) for q in ("OK","MIXED","SALAD")},
        "count_by_tag_quality": {q: sum(1 for l in listings if l["tag_quality"] == q) for q in ("OK","MIXED","SALAD")},
    }
    (DATA / "diagnostics.json").write_text(json.dumps(diag, indent=1, ensure_ascii=False, default=dict), encoding="utf-8")
    print(json.dumps(diag, indent=1, ensure_ascii=False, default=dict))

if __name__ == "__main__":
    main()
