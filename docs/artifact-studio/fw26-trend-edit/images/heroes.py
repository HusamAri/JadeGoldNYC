"""FW26 Trend Edit: ten hero prompts (frame 01 of each listing).

Owner 2026-10-17: "create 5 image per listing with higgsfield" (+ "yes to all", "proceed all models").
These images are design visualizations, not photographs of samples; the listing descriptions say so.
Each prompt is one generation with the parameters in jobs.json (_params): nano_banana_2, resolution "2k"
passed explicitly (default is 1k, second-brain 2026-10-13), 1:1, count 1. Heroes are text-only except L06,
whose cuneiform sign comes from a rendered Noto Sans Cuneiform glyph (AN, U+1202D) so the model copies a
real sign instead of inventing one. Galleries (frames 02 to 05) follow from tight crops of approved heroes.
Run: python3 images/heroes.py -> images/heroes.json + images/heroes.md
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
CAMERA = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, natural light only, fine 35 mm film grain, true colour, "
          "no heavy retouching. Etsy listing hero, the piece razor-sharp, the background falling softly out of focus. "
          "No text, no letters, no numbers, no logo, no watermark, no ruler, no hands, no people, no other jewelry. "
          "Square 1:1.")
YG = "polished solid 14K yellow gold, a warm rich gold, not pale, not orange"
WG = "polished white gold with no rhodium coating, a pale silvery grey like platinum with no yellow tint"

HEROES = [
 ("L01", "Seal Pin", None,
  f"A single men's stick pin in {YG}. Its head is a solid fluted cylinder 14 mm long and 3.5 mm across with twelve "
  f"straight lengthwise flutes, satin inside each flute and bright polished on the ridges; one end of the cylinder is "
  f"a flat round polished end cap, and from the other end a slim straight gold pin 45 mm long continues along the same "
  f"axis like a long needle, with a small solid gold clutch back sitting on the pin near its rounded tip. No stones, "
  f"no enamel. It lies on black silk velvet on a diagonal, warm late afternoon window light from the left catching the "
  f"flute ridges, deep soft shadow in the velvet. {CAMERA}"),
 ("L02", "Ishtar Rosette", None,
  f"A single round brooch in {YG}, 22 mm across: an eight-petal rosette, eight pointed almond-shaped petals radiating "
  f"from an inner ring, with open pierced spaces between the petals so the fabric behind shows through, crisp clean "
  f"edges; at the exact centre one 5 mm round smooth domed garnet cabochon, deep wine red, in a plain closed gold "
  f"bezel. No other stones. The brooch is pinned to a deep green velvet coat lapel, only the fabric in frame, warm "
  f"side light, the garnet glowing between wine and ember. {CAMERA}"),
 ("L03", "Fibula", None,
  f"A single hand forged fibula, an ancient Roman style cloak pin, in {YG}, 38 mm long, made from one continuous "
  f"round gold wire: at one end the wire coils twice into a small tight spring; from the spring a straight pin runs "
  f"along the bottom to a blunt point; above it the wire rises into a gently arched bow hammered flat to about 2.5 mm "
  f"wide, its surface covered in small soft hammer facets; at the far end the wire turns down into a small rolled "
  f"hook that holds the pin tip. No stones, no enamel, nothing modern. It fastens two overlapping folds of soft camel "
  f"brown cashmere, only the fabric in frame, warm window light. {CAMERA}"),
 ("L04", "Ur Band", None,
  f"A single ring band in {YG}, 3.5 mm wide, with twelve small rectangular cells set side by side around the outside "
  f"of the band, each cell filled flush with glossy opaque vitreous enamel in a repeating sequence of lapis blue, "
  f"cranberry red and shell white; thin gold walls between the cells read as fine gold lines; the inside of the band "
  f"smooth polished gold. No stones. The ring stands on its edge on a matte cream linen surface, raking natural light "
  f"from a low angle making the flush enamel gleam. {CAMERA}"),
 ("L05", "Nar (Pomegranate)", None,
  f"A single pendant in {YG}: a small pomegranate 12 mm wide, a slightly flattened round fruit with a small "
  f"six-pointed gold crown on top and a small gold loop above the crown, hanging on a fine gold cable chain; its skin "
  f"is glossy cranberry red vitreous enamel framed by a thin polished gold rim, and a narrow vertical split in the front "
  f"opens onto three tiny round deep red garnets set in gold like seeds. It rests against a real pomegranate broken "
  f"open, its red seeds glistening, on dark linen, warm window light. {CAMERA}"),
 ("L06", "Wedge", "AN",
  f"A single small rectangular bar pendant in {YG}, 16 mm tall and 5 mm wide, 1 mm thick, with a fine brushed satin "
  f"finish and softly rounded edges, hanging upright from a small loop at its top edge on a fine gold cable chain. Its "
  f"face carries one cuneiform sign struck by hand into the gold as deep wedge-shaped impressions, each wedge a "
  f"triangular head tapering to a thin tail: the arrangement of wedges is exactly the sign in the reference drawing, "
  f"copied as impressions in the gold, not drawn in black. It lies on raw unglazed grey clay, raking warm light so "
  f"every wedge casts a small shadow. {CAMERA}"),
 ("L07", "Thaw Hoops", None,
  f"A pair of small hoop earrings in {YG}, each hoop 15 mm across in 1.6 mm round wire, the whole surface molten and "
  f"softly rippled like gold that has just stopped flowing; one end of each hoop is a short bright polished cap of "
  f"{WG}, about 3 mm long, the other end carries a straight post. The pair lies on dark charcoal linen, a single lit "
  f"candle far behind them out of focus, warm low light catching the ripples and a cool highlight on the white tips. "
  f"{CAMERA}"),
 ("L08", "Split Infinity", None,
  f"Three small separate pendants in {YG}, seen from directly above on cream linen, laid edge to edge so that together "
  f"they form one complete infinity loop 16 mm wide and 8 mm tall made of 1.3 mm round gold wire: a left lobe, a "
  f"centre piece holding the crossing, and a right lobe, the loop cut into these three pieces by two soft wavy seams "
  f"with hairline gaps. Each piece has its own tiny loop at its top and its own fine gold cable chain, the three chains "
  f"leading out of the frame in three directions. Soft window daylight. {CAMERA}"),
 ("L09", "Paw Seal", None,
  f"A single round disc pendant in {YG}, 10 mm across and 1.2 mm thick with softly domed edges and a fixed loop at "
  f"the top, on a fine gold cable chain. Its face carries a dog paw print cut below the surface as an intaglio, one "
  f"larger rounded central pad and four oval toe pads above it, the recessed floors matte and the walls bright, the "
  f"paw catching shadow; plain polished gold around it, no text on the face. It rests on a worn brown leather dog "
  f"collar on a wooden table, soft side light. {CAMERA}"),
 ("L10", "Twin Eye", None,
  f"Two delicate bracelets in {YG} on cream linen, seen from directly above: each is a fine 1.2 mm gold cable chain. "
  f"The first carries a small open almond outline 9 mm by 5 mm made of thin round gold wire, an empty eye shape; the "
  f"second carries a tiny 4 mm domed gold disc with a glossy cobalt blue enamel centre. The two bracelets are laid so "
  f"that the round cobalt iris sits exactly inside the open almond, together forming one eye at the centre of the frame, "
  f"the two chains curving away to either side. Soft daylight. {CAMERA}"),
]

GLYPHS = {"AN": "4b58a45f-c6d5-47ba-af76-464baeb616d8", "TI": "55e3b315-393b-42c4-b566-f430a6997a69",
          "SHA": "a1f493ea-b475-475f-a56d-c87b33581d8f", "E": "0c2a94b5-7ec9-4b17-a03d-a898f63c2cf0"}

if __name__ == "__main__":
    for i, n, g, p in HEROES:
        for bad in ["—", "–", "â", "diamond", "plated", "gilded"]:
            assert bad not in p, (i, bad)
        assert ("reference" in p) == bool(g), i   # a reference sentence only where a reference is passed
    (HERE / "heroes.json").write_text(json.dumps(
        [{"id": i, "name": n, "glyph": g, "glyph_media": GLYPHS.get(g), "prompt": p} for i, n, g, p in HEROES],
        indent=1, ensure_ascii=False) + "\n")
    md = ["# FW26 Trend Edit hero prompts", "", "nano_banana_2, resolution 2k, 1:1, count 1, about 2 credits each.", ""]
    for i, n, g, p in HEROES:
        md += [f"## {i} {n}" + (f" (reference: cuneiform sign {g})" if g else ""), "", f"> {p}", ""]
    (HERE / "heroes.md").write_text("\n".join(md))
    print(len(HEROES), "heroes")
