"""FW26 Trend Edit: listing source -> listings/<id>-<slug>.json + .md

Copy is taken from BRIEF.md section 3. Prices are recomputed with the brief's section 4
model and must equal the ladder printed in the brief, or nothing is written.
Run from this folder: python3 build_listings.py [L01 ...]   (no argument = every listing defined here)

Deviations from the brief are recorded per listing under "deviations" with the evidence.
"""
import json, sys, pathlib

HERE = pathlib.Path(__file__).parent
FLOOR, PER_GRAM, K10, K18, LIST, SALE = 320, 100, 1/1.349, 1.31, 1.265, 0.70


def ladder(grams14, pieces=1, adders=0):
    base14 = FLOOR * pieces + PER_GRAM * grams14 + adders
    out = {}
    for k, f in (("10K", K10), ("14K", 1.0), ("18K", K18)):
        lst = round(base14 * f * LIST, 2)
        out[k] = {"list": lst, "sale": round(lst * SALE, 2)}
    return out


ABOUT = {"who_made": "A member of my shop", "what": "A finished product", "when_made": "Made to order"}

LISTINGS = {
 "L01": {
  "id": "L01", "slug": "seal-pin", "name": "Seal Pin",
  "title": "Men's Lapel Pin in Solid Gold, Fluted Cylinder Seal Stick Pin with Engraved Initials, Heirloom Suit and Tuxedo Pin, Gift for Him",
  "category": "Accessories > Pins & Clips > Hat Pins & Stick Pins",
  "taxonomy_id": 11316,
  "section": "Brooches & Pins (new section; also tag the listing in For Him via title and tags)",
  "tags": ["mens lapel pin", "gold lapel pin", "solid gold brooch", "mens brooch", "stick pin for men",
           "tuxedo lapel pin", "groomsmen gift gold", "heirloom jewelry", "engraved lapel pin", "cylinder seal",
           "wedding lapel pin", "gift for him gold", "opera inspired"],
  "materials": ["Solid gold", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "none", "Holiday": "Christmas", "Occasion": "Wedding",
                 "Recipient": "Men", "Style": "Classic"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False}],
  "personalization": {"enabled": True, "required": False, "max_chars": 5,
                      "instructions": "Up to 3 initials for the end cap, typed exactly as you want them cut (example: H.A. or HEA). Leave blank for no engraving."},
  "processing_days": "5 to 7 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 2.4, "pieces": 1, "adders": 65, "adders_detail": "engraving 25 + solid gold pin and clutch 40", "base14": 625},
  "brief_prices": {"10K": (586.08, 410.26), "14K": (790.62, 553.43), "18K": (1035.72, 725.00)},
  "description": """A lapel pin for men who dress for the occasion. The Seal Pin takes its form from the Mesopotamian cylinder seal, the small carved cylinder people once wore on a cord as both ornament and signature. Here it is a fluted solid gold cylinder, 14 mm long, on a stick pin with a solid gold clutch, and the flat end cap is engraved with your initials so the signature idea still holds.

- The cylinder measures 14 x 3.5 mm with twelve flutes, cast from our own hand-carved master and finished by hand; the pin is 45 mm long and sits flat behind a lapel, a scarf or a knit.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Everything is solid and stamped, nothing plated or filled.
- Personalization: up to three initials engraved on the end cap in a plain serif. Type them exactly as you want them cut, or leave the field blank for a plain cap.
- Wear it on a tuxedo lapel for a holiday party or an evening at the opera, or on a coat lapel on an ordinary Tuesday. It reads as heirloom jewelry, not as a novelty pin.
- Made to order at our bench in New Jersey in 5 to 7 business days, then shipped free within the US with a solid gold clutch back and a gift box.
- Gold does not tarnish. If the flutes collect dust, a soft brush and warm soapy water bring the shine back.
- A gift message can be added at checkout. Please check the spelling at checkout; engraved pieces are made specifically for you.""",
  "trend": {"anchor": "Operatic Drama (men's brooches +70%, vintage jewelry +75%)", "secondary": "Family Reimagined (personalized gift)"},
  "trend_terms": ["heirloom jewelry", "opera inspired", "lapel pin", "personalized"],
  "manufacturing_note": "Cylinder 14.0 x 3.5 mm, solid, cast in 14K from a hand-carved wax master with 12 longitudinal flutes 0.3 mm deep; flutes hand-finished with a fine needle file, satin inside the flutes and polished on the ridges. End cap flat, 3.5 mm, polished, engraved after casting (laser or graver, 1.2 mm serif capitals). Stick pin 0.9 mm hard 14K wire, 45 mm, soldered into a 1.0 mm blind hole at the cylinder's top end, tip rounded. Clutch: solid 14K pin protector (findings supplier), no plated parts. Hallmark on the end cap edge. Est. 14K weight 2.4 g (cylinder 1.75, pin 0.37, clutch 0.3). One master serves 10K, 14K and 18K.",
  "photo_plan": [
   "Hero on black velvet, warm window light from the left, pin at 45 degrees, flutes catching light",
   "On a tuxedo or dark wool lapel, worn, chest crop, shallow depth",
   "Macro of the flutes and the engraved end cap",
   "In an open palm for scale",
   "Back view with the clutch set behind a lapel",
   "Three karats side by side on dark jacquard (yellow, white, rose)",
   "Gift box, open, pin seated, warm light",
   "Engraving close-up with a sample monogram",
   "Styled flat lay: pin, cufflinks, a folded pocket square, a program from a concert",
   "Process: hands finishing a flute with a needle file (Mark of the Maker)"],
  "video": "Video 8 to 12 s: pin pushed through a lapel, clutch set, hand smooths the fabric",
  "visualization_prompt": "Product photograph, solid yellow gold fluted cylinder lapel pin 14 mm on a slim stick pin, resting on black silk velvet, warm late-afternoon window light, shallow depth of field, 35mm film grain, no retouching, muted palette",
  "deviations": [
   {"field": "category",
    "brief": "Jewelry > Brooches, Pins & Clips > Lapel Pins",
    "used": "Accessories > Pins & Clips > Hat Pins & Stick Pins (taxonomy 11316)",
    "evidence": "Live Etsy seller taxonomy read 2026-10-17 through ops/drafts-push?taxonomy=: no node contains 'lapel'; Pins & Clips sits under Accessories with children Hat Pins & Stick Pins (11316), Pins & Pinback Buttons (41), Shawl Pins (6066), Brooches (1201). A stick pin with a clutch is a stick pin."}],
 },
 "L02": {
  "id": "L02", "slug": "ishtar-rosette", "name": "Ishtar Rosette",
  "title": "Rosette Brooch in Solid Gold with Garnet, Convertible Brooch and Pendant, Vintage Style Heirloom Jewelry, Opera Inspired Gift for Her",
  "category": "Accessories > Pins & Clips > Brooches",
  "taxonomy_id": 1201,
  "section": "Brooches & Pins (new section)",
  "tags": ["gold brooch", "solid gold brooch", "garnet brooch", "vintage style brooch", "brooch pendant",
           "convertible brooch", "heirloom jewelry", "opera inspired", "rosette brooch", "star of ishtar",
           "mesopotamian jewelry", "capelet brooch", "gift for her gold"],
  "materials": ["Solid gold", "Garnet", "14K gold", "10K gold", "18K gold"],
  "attributes": {"Primary color": "Gold", "Secondary color": "Red", "Holiday": "Christmas", "Occasion": "Anniversary",
                 "Recipient": "Women", "Style": "Historical"},
  "variations": [{"property": "Karat", "values": ["10K", "14K", "18K"], "price_varies": True},
                 {"property": "Metal Color", "values": ["Yellow Gold", "White Gold", "Rose Gold"], "price_varies": False},
                 {"property": "Chain", "values": ["None", "16 in", "18 in", "20 in"], "price_varies": True,
                  "note": "chain is a 1.2 mm solid gold cable with spring ring"}],
  "personalization": {"enabled": False},
  "processing_days": "3 to 5 business days", "quantity": 20, "renewal": "automatic", "about": ABOUT,
  "pricing_basis": {"grams14": 3.2, "pieces": 1, "adders": 130, "adders_detail": "garnet and bezel 30 + brooch fittings 60 + openwork finishing 40; chain add-on priced separately", "base14": 770},
  "brief_prices": {"10K": (722.05, 505.43), "14K": (974.05, 681.83), "18K": (1276.01, 893.21)},
  "chain": {"none_label": "None", "lengths": ["16 in", "18 in", "20 in"], "addon_base14": 150,
            "brief_addon16_list": {"10K": 140.66, "14K": 189.75, "18K": 248.57},
            "steps_base": {"10K": [20, 20], "14K": [20, 30], "18K": [40, 40]},
            "steps_source": "Reference listing 4590337023 (Bauble) panel bases, read 2026-10-17: 10K 430/450/470, 14K 580/600/630, 18K 760/800/840 at 16/18/20 in"},
  "description": """An eight-petal rosette, the star of Ishtar that appears on Mesopotamian seals and gates, carved as an openwork brooch in solid gold and set with a deep red garnet at its center. A hidden tube behind the top petal takes a chain, so the same piece pins to a velvet lapel or a capelet one night and hangs as a pendant the next.

- The rosette measures 22 mm across and 1.2 mm thick, cast from our own hand-carved master and finished by hand so the edges stay crisp and the back is as clean as the front.
- The garnet is a 5 mm cabochon in a closed bezel; under warm light its color sits between wine and ember.
- Brooch fittings are solid gold: a pin stem, a joint and a safety catch that rolls over so the pin cannot open on its own.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose. Add a 1.2 mm cable chain in 16, 18 or 20 inches if you want to wear it as a pendant from day one.
- It is made for the season of dressing up: a vintage style brooch for an evening coat, an opera night or a holiday table, and it stays in rotation long after.
- Made to order at our bench in New Jersey in 3 to 5 business days, free US shipping, gift box included.
- Garnet is hard enough for daily wear. Keep the piece away from knocks and clean it with a soft cloth. A gift message can be added at checkout.""",
  "trend": {"anchor": "Operatic Drama (vintage jewelry +75%, ornate brooches)", "secondary": "Merrymaxxing (gemstone)"},
  "trend_terms": ["vintage style", "heirloom jewelry", "opera inspired"],
  "manufacturing_note": "Rosette 22 mm diameter, 1.2 mm sheet thickness equivalent, eight pointed petals with pierced (open) spaces between the inner ring and the petal tips, cast from a hand-carved wax master; openwork cleaned with a saw and needle files, edges crisp, back flat and polished. Center: 5 mm round garnet cabochon in a closed-back bezel cup (0.4 mm wall) soldered to the rosette, bezel burnished over the stone. Brooch fittings in solid 14K: pin stem 0.8 mm hard wire, joint (hinge) and revolving safety catch, soldered on the back at 2 and 10 o'clock so the piece hangs level. Hidden bail: 2.0 mm OD gold tube, 6 mm long, soldered horizontally behind the top petal, sized to pass a 1.2 mm cable chain. Est. 14K weight 3.2 g (rosette 2.6, fittings and bezel 0.6). Chain add-on: 1.2 mm cable 16 in, est. 1.4 g, spring ring clasp.",
  "photo_plan": [
   "Hero on deep green velvet, warm side light, brooch pinned at a coat lapel, garnet catching light",
   "Worn as a pendant on an 18 in chain against a dark knit",
   "Macro of the garnet and bezel",
   "Back view: pin, safety catch, hidden tube bail",
   "On a capelet at the shoulder, atmospheric low light (Operatic Drama)",
   "Three metal colors on dark jacquard fabric",
   "In an open palm for scale",
   "Gift box, open",
   "Styled: brooch on a velvet evening bag beside opera glasses",
   "Process: hands cleaning the openwork with a saw frame (Mark of the Maker)"],
  "video": "Video 8 to 12 s: unpin from the lapel, thread the chain, lift as a pendant",
  "visualization_prompt": "Product photograph, solid gold openwork eight-petal rosette brooch 22 mm with a deep red garnet cabochon center, pinned to dark green velvet, candlelit warm light, shallow depth of field, 35mm film grain, no retouching",
  "deviations": [
   {"field": "category",
    "brief": "Jewelry > Brooches, Pins & Clips > Brooches",
    "used": "Accessories > Pins & Clips > Brooches (taxonomy 1201)",
    "evidence": "Live Etsy seller taxonomy read 2026-10-15: the Jewelry root has no Brooches node; Brooches is 1201 under Accessories > Pins & Clips (the Weddings twin 1682 is excluded). Same node as the live W05 Pine Needle Brooch draft, which passed read-back."},
   {"field": "chain steps for 18 and 20 in",
    "brief": "the shop's standard step, each extra 2 inches adds about 14 to the 10K base",
    "used": "the reference listing's own base steps: 10K +20 / +20, 14K +20 / +30, 18K +40 / +40",
    "evidence": "Panel prices of listing 4590337023 (Bauble) read 2026-10-17: 10K 430 / 450 / 470, 14K 580 / 600 / 630, 18K 760 / 800 / 840 at 16 / 18 / 20 in. No step there is 14."}],
 },
}


def sheet(l):
    pr, pb = l["prices"], l["pricing_basis"]
    p = l["personalization"]
    out = [f"# {l['id']} {l['name']}: Etsy listing sheet", "",
           "Copy-paste sheet in the order of Etsy's listing form. Source: `listings/" + f"{l['id']}-{l['slug']}.json`.", "",
           "## Photos (slots 1 to 10)", ""]
    out += [f"{i}. {s}" for i, s in enumerate(l["photo_plan"], 1)]
    out += ["", "Listing images are real photographs of real samples. Shoot spec: BRIEF.md section 5.", "",
            "## Video", "", l["video"], "",
            "## Title", "", "```text", l["title"], "```", f"({len(l['title'])} characters)", "",
            "## About this listing", "", f"- Who made it: {l['about']['who_made']}",
            f"- What is it: {l['about']['what']}", f"- When was it made: {l['about']['when_made']}", "",
            "## Category", "", f"{l['category']} (taxonomy id {l['taxonomy_id']})", "",
            "## Renewal", "", "Automatic", "",
            "## Type", "", "Physical item", "",
            "## Description", "", "```text", l["description"], "```", "",
            "## Section", "", l["section"], "",
            "## Tags", "", "```text", ", ".join(l["tags"]), "```", "",
            "## Materials", "", ", ".join(l["materials"]), "",
            "## Attributes", ""]
    out += [f"- {k}: {v}" for k, v in l["attributes"].items()]
    out += ["", "## Price and Quantity", "",
            f"Quantity {l['quantity']}. Processing time {l['processing_days']}.", "",
            "| Karat | Original list price | Shown during the 30% shop sale |", "|---|---|---|"]
    out += [f"| {k} | ${pr[k]['list']:,.2f} | ${pr[k]['sale']:,.2f} |" for k in ("10K", "14K", "18K")]
    out += ["", f"Basis: est. {pb['grams14']} g in 14K, {pb['pieces']} make-floor, adders {pb['adders']} ({pb['adders_detail']}), 14K base {pb['base14']}. "
            "List = base x 1.265; 10K = 14K / 1.349; 18K = 14K x 1.31. Efe's cast weight overrides the estimate.", ""]
    if l.get("variant_prices"):
        cols = list(next(iter(l["variant_prices"].values())))
        out += ["Price per variation (Metal Color does not change the price), original list / shown during the sale:", "",
                "| Karat | " + " | ".join(cols) + " |", "|---" * (len(cols) + 1) + "|"]
        out += [f"| {k} | " + " | ".join(f"${row[c]['list']:,.2f} / ${row[c]['sale']:,.2f}" for c in cols) + " |"
                for k, row in l["variant_prices"].items()]
        out += ["", f"Chain steps: {l['chain']['steps_source']}.", ""]
    out += [
            "## Variations", ""]
    out += [f"- {v['property']}: {' / '.join(v['values'])}" + (" (price varies)" if v["price_varies"] else "") for v in l["variations"]]
    out += ["", "## Personalization", ""]
    if p["enabled"]:
        out += [f"On, {'required' if p['required'] else 'optional'}, max {p['max_chars']} characters.", "", "```text", p["instructions"], "```"]
    else:
        out += ["Off"]
    out += ["", "## Shipping profile", "", "Free US shipping, ships from West New York NJ", "",
            "## Return policy", "", "Shop default", ""]
    if l.get("deviations"):
        out += ["## Deviations from the brief", ""]
        out += [f"- {d['field']}: brief says \"{d['brief']}\", used {d['used']}. {d['evidence']}" for d in l["deviations"]]
        out += [""]
    return "\n".join(out)


def build(key):
    src = dict(LISTINGS[key])
    pb = src["pricing_basis"]
    pr = ladder(pb["grams14"], pb["pieces"], pb["adders"])
    assert FLOOR * pb["pieces"] + PER_GRAM * pb["grams14"] + pb["adders"] == pb["base14"], (key, "base14")
    for k, (lst, sale) in src.pop("brief_prices").items():
        assert (pr[k]["list"], pr[k]["sale"]) == (lst, sale), (key, k, pr[k], lst, sale)
    src["prices"] = pr
    ch = src.get("chain")
    if ch:
        grid = {}
        for k, f in (("10K", K10), ("14K", 1.0), ("18K", K18)):
            assert round(ch["addon_base14"] * f * LIST, 2) == ch["brief_addon16_list"][k], (key, k, "chain add-on")
            row = {ch["none_label"]: pr[k]}
            for i, length in enumerate(ch["lengths"]):
                base = pb["base14"] * f + ch["addon_base14"] * f + sum(ch["steps_base"][k][:i])
                lst = round(base * LIST, 2)
                row[length] = {"list": lst, "sale": round(lst * SALE, 2)}
            vals = [v["list"] for v in row.values()]
            assert vals == sorted(vals) and len(set(vals)) == len(vals), (key, k, "chain ladder not rising")
            grid[k] = row
        src["variant_prices"] = grid
    stem = f"{src['id']}-{src['slug']}"
    (HERE / "listings" / f"{stem}.json").write_text(json.dumps(src, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (HERE / "listings" / f"{stem}.md").write_text(sheet(src), encoding="utf-8")
    print("wrote", stem, {k: v["list"] for k, v in pr.items()})


for key in (sys.argv[1:] or list(LISTINGS)):
    build(key)
