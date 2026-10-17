"""FW26 Trend Edit: forty gallery prompts (frames 02 to 05 of each listing).

Owner 2026-10-17: "create 5 image per listing with higgsfield" (+ "yes to all", "proceed all models").
Each frame passes the tight crop of the approved hero as image_references (jobs.json _crop_media) so shape,
finish and enamel colours carry over; the crop holds no scene to copy (second-brain 2026-09-27). Frames that
change the metal colour never say "same metal" (2026-10-13 moth lesson): the shape is copied, the colour is
named. Worn frames give the size against a known body part in numbers (2026-09-27 Comet scale lesson).
L06 frame 02 also passes the four rendered cuneiform glyphs so no sign is invented.
Run: python3 images/gallery.py -> images/gallery.json + images/gallery.md
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
CAM = ("Shot on a Canon 50 mm lens at f/2.8, ISO 400, natural light only, fine 35 mm film grain, true colour, no heavy "
       "retouching. No text, no letters, no numbers, no logo, no watermark, no ruler. Square 1:1.")
STILL = CAM + " No hands, no people, no other jewelry."
COPY = "The piece is an exact copy of the jewelry in the reference image: same shape, same proportions, same details. "
SHAPE = ("Copy only the shape, proportions and details of the jewelry in the reference image; ignore its colour, "
         "background and camera angle. ")
YG = "polished yellow gold, warm and rich"
WG = "polished white gold, a pale silvery grey with no yellow tint"
RG = "polished rose gold, a soft pink copper tone"
TRIO = f"left in {YG}, centre in {WG}, right in {RG}"
SKIN = "natural skin with visible texture, relaxed and real, no manicure gloss"

F = {
 "L01": [
  (COPY + "The stick pin is worn pushed through the lapel of a charcoal grey wool flannel jacket, only the fluted gold "
   "head and the end cap visible on the lapel, the pin itself hidden behind the cloth; the head is 14 mm long, about the "
   "width of a jacket buttonhole. Close crop of the lapel and a white shirt collar, no face. Soft window light. " + CAM),
  (COPY + "Extreme close macro of the fluted cylinder head: the twelve lengthwise flutes fill the frame side to side, "
   "satin inside each flute, bright polished ridges, seen from the side so the cylinder runs across the frame; the end "
   "cap at one edge is a plain flat smooth polished disc with no pattern, no flutes and no engraving. Shallow depth of "
   "field on black velvet. " + STILL),
  (SHAPE + f"Three identical stick pins lying parallel on cream silk jacquard, {TRIO}. Same size, same fluted head, same "
   "clutch back. Soft daylight from above. " + STILL),
  (COPY + "One stick pin resting across an open palm, the fluted head near the fingers; the head is 14 mm long, about "
   f"the length of a fingertip pad, the pin 45 mm long. {SKIN}. Warm window light, dark background. " + CAM),
 ],
 "L02": [
  (COPY + "The rosette worn as a pendant on a fine gold cable chain at the collarbone over a bare neckline, cream knit "
   "neckline at the frame edge, crop from the chin down, no face. The rosette is 22 mm across, about the size of a "
   f"coin. {SKIN}. Warm side light. " + CAM),
  (COPY + "Extreme close macro of the centre: the 5 mm smooth domed garnet cabochon in its plain gold bezel fills the "
   "middle, the inner ring and the bases of the pointed petals around it, open pierced spaces between the petals. Deep "
   "wine red garnet glowing. " + STILL),
  (COPY + "The back of the brooch: the rosette lies face down on dark green velvet showing its plain polished gold back, "
   "a straight brooch pin with a safety catch across it and a slim hidden tube bail running across the top, flush with the back. " + STILL),
  (SHAPE + f"Three identical rosette brooches side by side on dark green velvet, {TRIO}, each with the same deep red "
   "garnet cabochon at the centre. Warm side light. " + STILL),
 ],
 "L03": [
  (COPY + "The fibula fastens the front of a chunky oatmeal cable knit cardigan, worn, crop of the chest only, no face; "
   "the fibula is 38 mm long, about the length of a thumb. Soft window light. " + CAM),
  (COPY + "Close macro of the fibula: the hammered flat bow with its small soft hammer facets in the foreground, the "
   "tight two-turn wire spring sharp at one end. Dark linen background falling out of focus. " + STILL),
  (COPY + "Two identical fibulae on dark linen: the left one closed, the pin tip resting in the rolled hook; the right "
   "one open, the pin swung free of the hook, showing how it opens. " + STILL),
  (SHAPE + f"Three identical fibulae lying side by side on camel cashmere, {TRIO}. Same hammered bow, same spring. Soft "
   "daylight. " + STILL),
 ],
 "L04": [
  (COPY + "The band worn on the ring finger of a relaxed hand, stacked with one plain thin gold band below it on the "
   "same finger; the ring finger is the fourth finger, between the middle finger and the little finger, every other "
   "finger bare. The band is 3.5 mm wide, about a third of the finger's width. Hand resting on cream linen, "
   f"{SKIN}. Soft daylight. " + CAM),
  (COPY + "Two identical bands standing on edge side by side on cream linen. Left band: the cells are lapis blue, "
   "cranberry red and shell white. Right band: the cells cycle through cobalt blue, cranberry red, emerald green, saffron yellow and pink. "
   "Same gold, same cell size, flush glossy enamel. " + STILL),
  (COPY + "Extreme close macro of three neighbouring cells on the outside of the band: lapis blue, cranberry red, shell "
   "white, flush glossy vitreous enamel: smooth uniform opaque glass in flat solid colour with no flecks, no veins and "
   "no stone texture; the thin gold walls between them crisp, clean and bright with no scratches. " + STILL),
  (COPY + "Flat lay on raw linen seen from a 45 degree angle: the band lies on its side tilted toward the camera so "
   "the row of coloured enamel cells on its outside face is clearly visible; around it a small heap of lapis "
   "lazuli pieces, a few loose red carnelian beads and a small sea shell. Soft daylight. " + STILL),
 ],
 "L05": [
  (COPY + "The pomegranate pendant worn on a fine gold cable chain at the base of the throat over a black turtleneck, "
   "crop from the chin down, no face; the fruit is 12 mm wide, about the size of a fingernail. Warm window light. " + CAM),
  (COPY + "Extreme close macro of the front of the pomegranate: the glossy cranberry enamel skin, the thin gold rim and "
   "the narrow split opening onto three tiny round deep red garnets. " + STILL),
  (SHAPE + f"Three identical pomegranate pendants on fine chains lying side by side on dark linen, {TRIO}, each with the "
   "same cranberry red enamel skin and garnet seeds. Warm light. " + STILL),
  (COPY + "The pendant and its chain lying on a dark wooden holiday table among a few pomegranate halves, a brass "
   "candlestick out of focus, warm candlelight. " + STILL),
 ],
 "L06": [
  ("Four identical small rectangular bar pendants in polished yellow gold with a brushed satin finish, 16 mm tall and "
   "5 mm wide, each hanging upright from a small top loop, standing in a row on raw grey clay. Each bar carries one "
   "cuneiform sign struck into the gold as deep wedge-shaped impressions: from left to right the signs in the four "
   "reference drawings, one sign per bar (the first sign has one tall vertical wedge crossing a long "
   "horizontal line, an open angled wedge on the left half of the line and a small angled wedge at its right end), copied exactly as impressions in the gold, not drawn in black. Raking warm "
   "light so every wedge casts a shadow. " + STILL),
  (COPY + "The bar pendant worn on a fine gold cable chain over a cream ribbed turtleneck, crop from the chin down, no "
   "face; the bar is 16 mm tall, about the length of a fingertip. Soft window light. " + CAM),
  (COPY + "Two of the bar pendants on two fine gold chains of different lengths, layered at the collarbone on bare "
   f"skin, crop from the chin down, no face. {SKIN}. Warm light. " + CAM),
  ("Three identical small rectangular bar pendants with the same struck cuneiform sign as the reference, standing in "
   "a row on raw grey clay: left in 10K yellow gold, a slightly paler and cooler yellow; centre in 14K yellow gold, a "
   "warm rich yellow; right in 18K yellow gold, the deepest and richest yellow. Same size, same brushed satin finish. "
   + STILL),
 ],
 "L07": [
  (COPY + "One hoop earring worn in the earlobe, close crop of the ear and jaw line with hair tucked back, no full "
   "face; the hoop is 15 mm across, about the size of the earlobe itself, the white gold tip catching light at the "
   f"front. {SKIN}. Soft window light. " + CAM),
  (COPY + "Close macro of the two hoops lying on charcoal linen: the molten rippled gold surface sharp, the short bright "
   "white gold caps at the ends. " + STILL),
  (SHAPE + "Two pairs of identical hoop earrings on charcoal linen. Left pair: the rippled hoop in polished yellow gold "
   "with short polished white gold tips. Right pair: the rippled hoop in polished rose gold, a soft pink copper tone, "
   "with short polished white gold tips. Same size, same molten surface. " + STILL),
  (COPY + "One hoop earring seen from behind on charcoal linen, showing the straight post and the small butterfly back "
   "pushed onto it. " + STILL),
 ],
 "L08": [
  ("Three women's hands resting together on a wooden café table around coffee cups, each wrist and neck out of frame; "
   "on the table between them lie the three separate pieces of the gold infinity loop from the reference, on their "
   "three fine gold chains, pushed together so the loop is whole. Each hand is bare, no rings. Warm window light. "
   + CAM),
  (COPY + "The three pieces of the infinity loop pulled apart and laid in a row on cream linen seen from above, a "
   "finger's width of linen between them, so each piece reads on its own: the left lobe, the centre piece holding "
   "the crossing, the right lobe, the soft wavy cut ends facing each other; each piece has its own small top loop "
   "and its own fine gold chain. " + STILL),
  (COPY + "Extreme close macro of one wavy seam: the hairline gap between two of the pendant pieces, round 1.3 mm gold "
   "wire on either side, cream linen below. " + STILL),
  (SHAPE + f"Three complete infinity loops in a row on cream linen, each made of its three pieces with fine chains: "
   f"{TRIO}. Same size, same seams. Soft daylight. " + STILL),
 ],
 "L09": [
  (COPY + "The paw disc pendant worn on a fine gold chain at the collarbone of a person in a grey sweatshirt hugging a "
   "golden retriever, crop of the chest and the dog's head, no human face; the disc is 10 mm across, about the size "
   "of a fingernail. Warm window light. " + CAM),
  (SHAPE + "Four identical round paw disc pendants in polished yellow gold in a row on worn brown leather. The paw "
   "recesses of the first are plain matte gold; of the second, filled with glossy cobalt blue enamel; of the third, "
   "glossy cranberry red enamel; of the fourth, glossy black enamel. Same disc, same paw. " + STILL),
  (SHAPE + "Two identical round disc pendants in polished yellow gold side by side on a wooden table: the left one "
   "with a dog paw print intaglio, the right one with a smaller cat paw print intaglio, four small oval toe pads close "
   "together above a rounded pad. " + STILL),
  (COPY + "The disc pendant resting on an open palm, the chain trailing off between the fingers; the disc is 10 mm "
   f"across, about the size of a fingernail. {SKIN}. Soft side light. " + CAM),
 ],
 "L10": [
  ("Two wrists side by side resting on cream linen, one wearing a fine gold cable chain bracelet with a small open "
   "almond outline in gold wire, the other a fine gold chain with a tiny round cobalt blue enamel disc, both copied "
   "from the reference; the wrists turned toward each other so the disc sits just beside the almond. The almond is "
   f"9 mm long, about the width of a fingernail. {SKIN}. Soft daylight. " + CAM),
  (COPY + "Extreme close macro of the 4 mm domed gold disc with its glossy cobalt blue enamel centre, solid uniform "
   "cobalt with no pupil, no ring, no pattern, the fine chain links at each side. " + STILL),
  (COPY + "Extreme close macro of the open almond outline in thin round gold wire, empty inside, the cable chain "
   "attached at both points, cream linen below. " + STILL),
  (SHAPE + f"Three pairs of the two bracelets laid in a row on cream linen, each pair forming one eye with the cobalt "
   f"disc inside the almond: {TRIO}. The enamel stays the same cobalt blue in all three. " + STILL),
 ],
}

GLYPH_ORDER = ["TI", "SHA", "E", "AN"]

if __name__ == "__main__":
    jobs = json.load(open(HERE / "jobs.json"))
    out = []
    for lid, frames in F.items():
        assert len(frames) == 4, lid
        for n, p in enumerate(frames, start=2):
            for bad in ["—", "–", "â", "diamond", "plated", "gilded", "same metal", "hand painted"]:
                assert bad not in p.lower(), (lid, n, bad)
            media = [jobs["_crop_media"][lid]]
            if lid == "L06" and n == 2:  # glyphs only, so "the four reference drawings" are exactly the four signs
                media = [jobs["_glyph_media"][g] for g in GLYPH_ORDER]
            out.append({"id": f"{lid}-{n:02d}", "index": int(lid[1:]) * 10 + n, "media": media, "prompt": p})
    assert len(out) == 40
    (HERE / "gallery.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    md = ["# FW26 Trend Edit gallery prompts (frames 02 to 05)", "",
          "nano_banana_2, resolution 2k, 1:1, count 1, about 2 credits each; reference = tight crop of the approved hero.", ""]
    for o in out:
        md += [f"## {o['id']}", "", f"> {o['prompt']}", ""]
    (HERE / "gallery.md").write_text("\n".join(md))
    print(len(out), "gallery prompts")
