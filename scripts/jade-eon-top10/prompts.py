#!/usr/bin/env python3
"""Jade Gold NYC · EON top 10 · image prompt generator.

30 listings (10 models x 3 metals) x 10 shots. Output:
docs/jade/eon-top10/prompts.json  ->  {listing_key: [{shot, file, prompt, refs}]}

Canon: docs/jade/eon-top10/README.md section 4. Model gpt_image_2_5,
1:1, 2k, medium. Reference images are Higgsfield media ids of the EON
source photos (geometry authority only).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "jade" / "eon-top10" / "prompts.json"

REF = {
    "01": ["3f78148d-379f-4c13-a639-438d4e95c735"],
    "02": ["7955d1f2-68cb-4cb3-a79d-264b1a1d9e56"],
    "03": ["8e7ad215-3787-4fe2-ab3b-e10116542b8b"],
    "04": ["abe130a1-a7f0-4f6a-b20f-b129f0daa0dd"],
    "05": ["144d7a59-9db4-429f-b344-8d6c3e52f7c6"],
    "06": ["bb2a9048-c15a-47fa-bd63-c40e35c7b2a3", "2701c9f7-a552-4a99-bb11-354c4d45c048"],
    "07": ["280d4960-2708-45d4-93d5-f9631ea61456", "a5f735a7-8f55-44da-8348-645cd62007d7"],
    "08": ["b2c3a005-b320-4a9f-ba77-36f431cc8e7b"],
    "09": ["230adf1c-88fa-4003-89b2-740ec2237561", "cbac01b3-39d4-4c23-a093-ea792b52206d"],
    "10": ["9703e6e4-ff2f-4565-82f6-ff0c6144871f"],
}

# {M} = metal phrase, {A} = accent metal (two-tone only)
MODELS = {
    "01": ("satin", "Satin Step", "about 8mm wide, flat top. Wide BRUSHED SATIN center with fine circumferential brush lines; a narrow HIGH-POLISH rail at each edge, stepped slightly lower, divided by a crisp step line. Mirror polished comfort-fit interior.", "the brushed satin center meeting the stepped polished rail", (4, 6, 8)),
    "02": ("flat", "Flat", "about 6mm wide, FLAT top profile with straight parallel sides and softly eased edges. Entire surface HIGH-POLISH mirror finish. Comfort-fit interior.", "the flat mirror surface and the softly eased edge", (3, 6, 10)),
    "03": ("dome", "Dome", "about 6mm wide, smoothly DOMED (half-round) exterior profile, entire surface HIGH-POLISH mirror finish, comfort-fit interior.", "the continuous curve of the polished dome", (3, 6, 10)),
    "04": ("milgrain", "Milgrain", "about 6mm wide, gently rounded top. BRUSHED SATIN center with ONE fine row of tiny round MILGRAIN beads running along each edge, then a thin polished outer rim. Polished comfort-fit interior.", "the fine milgrain bead row beside the brushed center", (3, 6, 10)),
    "05": ("hammered", "Hammered", "about 8mm wide. HAMMERED center of irregular polished facets, framed on each side by a thin line of tiny milgrain beads, then a narrow high-polish stepped rail at each edge. Polished comfort-fit interior.", "the hammered facets, the milgrain line and the polished rail", (5, 8, 11)),
    "06": ("crosshatch", "Crosshatch", "about 6mm wide, flat top. Wide BRUSHED SATIN center; at each edge a bevelled band of fine DIAMOND-CUT CROSSHATCH knurling (tiny sharp pyramids). Polished comfort-fit interior.", "the diamond-cut crosshatch knurling beside the satin center", (4, 6, 8)),
    "07": ("kinetic", "Kinetic Bead", "a SLIM band about 2mm wide with a polished half-round profile, carrying ONE small polished gold bead that sits in a shallow channel on the band and glides freely around it. Only one bead. Comfort-fit interior.", "the single gliding bead in its channel", None),
    "08": ("greekkey", "Greek Key", "about 8mm wide. Raised continuous GREEK KEY (meander) pattern in the center on a finely textured recessed ground, framed by a row of milgrain beads and a braided ROPE rail on each side, polished edges and polished comfort-fit interior. The key pattern must stay coherent, no broken turns.", "the Greek key turns, milgrain row and rope rail", (5, 8, 12)),
    "09": ("twotone", "Two-Tone", "about 7mm wide, TWO-TONE: narrow high-polish stepped edge rails in {M}, and a center band in {A} with DIAMOND-CUT diagonal facets over a fine frosted texture. Polished comfort-fit interior in {M}.", "the diamond-cut facets of the center against the polished rails", (6, 8, 12)),
    "10": ("beveled", "Beveled", "about 6mm wide, flat top. BRUSHED SATIN flat top with a HIGH-POLISH 45-degree BEVEL along each edge. Polished comfort-fit interior.", "the brushed top meeting the polished bevel", (3, 6, 10)),
}

METALS = {
    "yellow": dict(name="Yellow Gold", tone="14K yellow gold, balanced natural honey yellow", accent="14K white gold, neutral soft white, never chrome",
                   surface="the edge of a weathered black cast-iron facade plate from a SoHo building, painted iron with fine pitting",
                   light="hard low late-afternoon New York sun", soft="diffused late-afternoon New York light", street="a softly blurred SoHo cast-iron facade street at dusk"),
    "white": dict(name="White Gold", tone="14K white gold, neutral soft white, never chrome", accent="14K yellow gold, natural honey yellow",
                  surface="the worn carved edge of a Brooklyn brownstone stoop, warm chocolate sandstone with soft erosion",
                  light="low golden-hour New York sun", soft="diffused golden-hour light", street="a softly blurred Brooklyn brownstone row at golden hour"),
    "rose": dict(name="Rose Gold", tone="14K rose gold, balanced blush copper, never red, never pink plastic", accent="14K white gold, neutral soft white, never chrome",
                 surface="a honed pale Indiana limestone window lintel of a prewar Manhattan building, fine fossil speckle",
                 light="clear cool early-morning New York light", soft="diffused cool morning light", street="a softly blurred prewar Manhattan avenue in morning light"),
}

HEAD = ("Photorealistic Etsy listing photograph for the fine jewelry shop Jade Gold NYC. 1:1. "
        "No text, letters, numbers, logo, watermark, packaging or box anywhere.")
LOCK = ("PRODUCT (reference images are the geometry authority; copy the ring design exactly, ignore their backgrounds and props; "
        "only the metal color may differ): solid {tone} ring, {spec} No stones, no engraving.")
NEVER = "Never linen, marble, velvet, flowers, lava rock, acrylic arches or workshop tools."
CANON = "A thin out-of-focus sliver of verdigris-green patinated copper at one frame edge."


def shots(mk: str, m: dict, detail: str, widths) -> list[tuple[str, str]]:
    kar = ("ALL THREE ARE WHITE GOLD and read clearly white, never yellow; the differences are very subtle: left 10K a cool silver white, center 14K neutral white, right 18K a faint warm champagne white"
           if m["name"] == "White Gold" else "left 10K paler, center 14K, right 18K richer and deeper")
    one = "One ring only."
    grid = "a crisp multi-pane loft window-grid shadow falling across the surface and partly across the ring"
    s = [
        ("01-hero", f"{one} Upright three-quarter view on {m['surface']}. {m['light'][0].upper()+m['light'][1:]} rakes in, {grid}. {CANON} Editorial, generous negative space, 100mm macro, natural contact shadow."),
        ("02-macro", f"{one} EXTREME CLOSE-UP MACRO: only a short arc of the band is visible and it fills the frame edge to edge, showing {detail} in sharp detail, {m['surface']} barely visible behind. {m['soft']}, very shallow depth of field, accurate metal texture."),
        ("03-profile", f"{one} Ring standing on edge seen from the side at eye level, showing the band width, edge profile and the polished comfort-fit inner curve, on {m['surface']}. {m['soft']}, no window shadow."),
        ("04-top", f"{one} FLAT LAY shot from DIRECTLY OVERHEAD (camera pointing straight down): the ring lies flat and reads as a perfect circle with the hole in the middle, centered on {m['surface']}. One diagonal window-mullion shadow crosses the surface beside the ring, not over it."),
        ("05-on-hand", f"{one} Worn on the ring finger of a relaxed adult hand with natural skin texture and unpolished short nails, dark charcoal wool coat cuff, the hand resting on {m['surface']}. {m['light'][0].upper()+m['light'][1:]}. The ring design fully readable."),
        ("06-nyc", f"{one} Ring standing on {m['surface']} in the foreground, sharp; behind it {m['street']}, deep bokeh. {m['light'][0].upper()+m['light'][1:]}, {grid}. {CANON}"),
        ("07-interior", f"{one} Ring lying on its side with its opening facing the camera, the lens looking INTO the ring so the smooth mirror-polished comfort-fit interior fills the center of the frame, completely blank inside, no hallmark text, on {m['surface']}. {m['soft']}."),
    ]
    if widths:
        a, b, c = widths
        s.append(("08-widths", f"THREE rings of this exact same design in three CLEARLY DIFFERENT widths, very narrow about {a}mm, medium about {b}mm and very wide about {c}mm (the widest visibly much wider than the narrowest), standing upright in a neat row from narrow to wide on {m['surface']}. Same metal, same finish. {m['soft'][0].upper()+m['soft'][1:]}. No labels."))
    else:
        s.append(("08-bead", f"{one} Close macro of the single bead resting in its channel, the slim band curving away out of focus, on {m['surface']}. {m['soft']}."))
    s += [
        ("09-karats", f"THREE rings of this exact same design side by side on {m['surface']}, identical except color depth: {kar}. Same metal family. {m['soft'][0].upper()+m['soft'][1:]}. No labels."),
        ("10-pair", f"Two adult hands, one slightly larger, resting together on {m['surface']}, each wearing this same ring design in the same metal, the larger hand a wider band. Natural skin, charcoal wool and cream cotton cuffs. {m['light'][0].upper()+m['light'][1:]}, quiet and intimate."),
    ]
    return s


def build() -> dict:
    out = {}
    for mk, (slug, _name, spec, detail, widths) in MODELS.items():
        for key, m in METALS.items():
            tone = m["tone"]
            s = spec.format(M=tone, A=m["accent"])
            if mk == "09":
                tone = f"two-tone {m['name'].lower()} and {'yellow' if key == 'white' else 'white'} gold"
            lock = LOCK.format(tone=tone, spec=s)
            rows = []
            for file, body in shots(mk, m, detail, widths):
                rows.append({"shot": file, "file": f"{file}.jpg",
                             "prompt": f"{HEAD}\n{lock}\nSCENE: {body} {NEVER}",
                             "refs": REF[mk]})
            out[f"{mk}-{slug}-{key}"] = rows
    return out


if __name__ == "__main__":
    data = build()
    assert len(data) == 30 and all(len(v) == 10 for v in data.values())
    for rows in data.values():
        for r in rows:
            assert "–" not in r["prompt"] and "—" not in r["prompt"]
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    lens = [len(r["prompt"]) for v in data.values() for r in v]
    print(len(data), "listings,", sum(len(v) for v in data.values()), "prompts, max len", max(lens))
