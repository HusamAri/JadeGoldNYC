"""EON-SDE6 (6,0 × 1,8 mm düz bant, ortası fırçalı saten, İKİ kenarda 45° cilalı pah ve her pahta tam tur tek sıra
~1,3 mm round lab-grown taş; sahip kartı 2026-11-21 "Both edges") Etsy galerisi: 9 Higgsfield prompt'u + yerelde dizilen ölçü kartı
(10. kare, kredisiz) + sahibin düzenlenmemiş gerçek fotoğrafı (11. kare, Etsy'nin "en az bir gerçek fotoğraf" kuralı).

Run: python3 -I docs/eon/lab-grown/09-satin-diamond-edge/images/prompts.py   -> prompts.json + PROMPTS-REVIEW.md

Dil HS5/HEP/PC9/TMC9/PEAR2'den: tek pencere gün ışığı, nötr renk; metal sahnedeki tek doygun öğe, zemin onun tamamlayıcısı
düşük doygunlukta (sarı → mavi-gri karo / arduvaz / kömür grisi; beyaz → sıcak kumtaşı; rose → adaçayı; üçü birden →
nötr kireçtaşı; 09 siyah bazalt). Erkek bandı: el kareleri erkek eli.

Tasarım referansı: sahibin GERÇEK fotoğraflarından yüzüğe sıkı kırpımlar (2026-11-19, atölye; repoya alınmadı):
refWhole (foto 1: yatık halka, pahın tam tur taş dairesi + fırçalı yüz), refTop (foto 3: pahtaki sıra yakın, iç dudak),
refSide (foto 2: göz hizası, fırçalı duvar, üst kenarda sıra). Foto 4 (kırmızı tutucu, tüm halka) referans DEĞİL: galeriye
düzenlenmeden giren gerçek fotoğraftır. Beyaz, rose ve üç-renk karelerine siyah-beyaz kırpım (renk yalnız metinden).

Dersler (second-brain): sıranın yeri poza göre adlandırılır (yatık: üstte; dik: kameraya bakan kenarda); taş boyu ve sayısı
sayıyla (1,3 mm, bandın beşte biri, ~kırk taş); "eternity" (taşı yüzeye yayar), "pave", "sparkle", "macro" jargonu yok;
yansıma cümlesi (cilalı iç yüzeyde kişi/kamera yok); bant oranı sayıyla (6 mm = dış çapın ~dörtte biri).
"""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

DESIGN = (
    "about 6 mm wide and about 1.8 mm thick: a flat band with a flat outer face and squared shoulders. Both edges of "
    "the band are the same: on each edge the corner between the outer face and the side of the band is cut off at 45 "
    "degrees into a narrow, flat, polished slope, and set into each slope sits one single row of small round brilliant "
    "cut stones, side by side and close together, with one tiny round polished gold bead between each pair of stones "
    "holding them. Each row runs all the way around the ring without a gap and without an end, so each edge is one "
    "continuous circle of small stones: two parallel circles of stones, one along each edge. Each stone is tiny, about "
    "1.3 mm across, about a fifth of the band's width, so about forty of them fit around each circle. On the inner side "
    "of each row a thin polished gold lip borders the hole of the ring. Between the two rows, the middle of the outer "
    "face, about two thirds of the band's width, has a fine brushed satin finish: soft, matte and even, made of very "
    "fine parallel brush lines that run around the ring along the band, never across it. The inside of the band is "
    "smooth, high-polished gold."
)
METAL = {
    "Y": "The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are "
         "brighter warm yellow.",
    "W": "The gold is white gold: bright, cool silver-white; the brushed face is a soft pale grey-white satin and the "
         "polished parts are bright silver-white. There is no yellow tint anywhere on the ring.",
    "R": "The gold is rose gold: a soft pink-copper colour; the brushed face is a muted dusty-rose satin and the "
         "polished parts are a brighter warm pink.",
    "3": "The three rings are identical in design and differ only in the colour of their gold: the left ring is warm "
         "yellow gold, the middle ring is cool silver-white white gold and the right ring is soft pink-copper rose gold.",
}
DIAMONDS = "The stones are colourless lab-grown diamonds, bright and clear, each showing crisp white and dark facets."
ONLY = (
    "These are the only stones on the ring: exactly two rows of small stones, one along each edge, no stones on the "
    "brushed middle of the face, no third row, no larger centre stone, no stones inside the band, no engraving, no "
    "hallmark, no text."
)
PROPORTION = "The band's 6 mm width is about a quarter of the ring's outer diameter of about 22 mm."


def ring(metal):
    lead = "Each ring: a solid gold band, " if metal == "3" else "The ring: a solid gold band, "
    return lead + DESIGN + " " + METAL[metal] + " " + DIAMONDS + " " + ONLY


LIGHT = (
    "Light: natural daylight only, from one large window to one side, soft and slightly directional, in true neutral "
    "colour, with no coloured tint, no coloured light patches and no studio-flash look. Real soft shadows fall away from "
    "the window. The metal keeps its true natural colour and real reflections, with highlights but none blown out, no "
    "mirror-chrome look and no glow; on the polished inside only the soft window reflects, no person, no camera "
    "and no hands. The stones show real facets, never a blur or a glow. Real metal and real stones, never smooth plastic "
    "or a computer render."
)
PHOTO = (
    "Photorealistic product photograph, natural colour, sharp focus on the jewellery, gentle shallow depth of field. "
    "No text, no logo, no watermark, no packaging."
)
# Referanslar: sahibin gerçek fotoğraflarından sıkı kırpımlar; tasarım alınır, sahne alınmaz.
_TAKE = ("Take only the ring's design: the brushed satin middle of the outer face, the polished 45 degree slopes along "
         "both edges with their rows of small round stones and tiny gold beads, the thin polished lips inside the rows "
         "and the polished inside. The photographs show the upper row most clearly; the other edge carries an identical "
         "row. Do not take the photographs' setting: no towel, no white fur, no dark cloth, not their lighting and not "
         "their camera angle.")
_BW = (" The reference images are black and white on purpose: take only the ring's shape and design from them; the "
       "colour of the gold comes only from this text.")
REF_WHOLE_TOP = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the whole ring "
                 "tilted, with the continuous circle of small stones around the beveled edge of the opening and the "
                 "brushed outer face; the second shows the row of stones on the polished slope up close, with the thin "
                 "polished lip inside it. " + _TAKE)
REF_TOP_SIDE = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the row of stones "
                "on the polished slope up close, with the thin polished lip inside it; the second shows the brushed "
                "outer face at eye level with the row of stones along its top edge. " + _TAKE)
REF_SIDE_TOP = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the brushed outer "
                "face at eye level with the row of stones along its top edge and, along its bottom edge, the second row "
                "seen edge-on as a thin line; the second shows the row of stones on the polished slope up close. " + _TAKE)
REF_WHOLE_BW = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the whole ring "
                "tilted, with the continuous circle of small stones around the beveled edge of the opening; the second "
                "shows the row of stones on the polished slope up close. " + _TAKE + _BW)
REF_TOP_BW = ("Reference images: real photographs of this ring, cropped to the ring: the first shows the row of stones "
              "on the polished slope up close, with the thin polished lip inside it; the second shows the whole ring "
              "tilted, with the continuous circle of small stones around the opening. " + _TAKE + _BW)

# Sıraların yeri: yatık pozlarda bir taşlı kenar YUKARI (açıklığın üst ağzını çevreler), öbürü zeminde (ön duvarın altında
# ince ışık çizgisi). Sahip kartı 2026-11-21 "Both edges".
UP = ("The ring lies flat: one of its two stone edges faces up, so a continuous circle of small stones runs all the way "
      "around the top rim of the opening, and the other stone edge rests on the surface underneath, its row showing as a "
      "fine line of light along the bottom of the band's front wall.")

FRAMES = [
    ("01-hero", "the design at a glance (Etsy first photo: one product, no text)", "Y", REF_WHOLE_TOP,
     "The ring lies flat on a smooth, matte, pale blue-grey ceramic tile and is seen from the front and above, at about "
     "40 degrees, so the whole ring is in view and nothing is cut off. " + UP + " Seen this way the circle of stones is "
     "an ellipse around the opening; the brushed satin outer face forms the front wall of the band, facing the camera, "
     "with one row of stones along its top edge and the second along its bottom edge; through the opening the polished "
     "inside of the back of the band is visible. " + PROPORTION + " Daylight comes from a window on the left: the stones show crisp facets, the beads "
     "catch tiny points of light and the brushed face stays soft and matte. The ring sits in the centre of the frame and "
     "fills about half of the frame's width, with generous space all around so that a square crop keeps the whole ring. "
     "Behind it a pale blue-grey plaster wall is softly out of focus. Colour: the tile and the wall are muted cool "
     "blue-grey, so the warm yellow gold is the only warm, saturated colour in the image. The ring is the only object in "
     "the image."),
    ("02-row", "the stones on the beveled edge, up close", "Y", REF_TOP_SIDE,
     "Close-up of the stone edge. The camera is a few centimetres from the ring and looks down at about 45 degrees at a "
     "short arc of the beveled edge, so only part of the ring is in the frame and the rest is outside it: the row of "
     "small round stones runs across the frame from left to right in a gentle curve, each stone sitting on the polished "
     "slope with a tiny gold bead between each pair; above the row the thin polished lip borders the hole, and below it "
     "the brushed satin outer face falls away out of focus. About ten stones in the middle of the row are in sharp focus. "
     "Low daylight from one side: each stone shows crisp facets, the beads catch tiny highlights, the brushed lines of "
     "the face are visible. Behind the ring, blue-grey slate is out of focus. Colour: the slate is a muted cool blue-grey, "
     "so the warm yellow gold is the only warm colour in the image. The ring is the only object in the image."),
    ("03-profile", "the brushed face at eye level: 6 mm width, stones on one edge only", "Y", REF_SIDE_TOP,
     "The ring lies flat on matte charcoal slate and the camera is low, level with the ring and close to it, looking "
     "straight at the front of the band: the band fills the middle of the frame like a low curved wall about 6 mm tall. "
     "Along the top edge of this wall runs one row of small round stones on its polished slope, with the thin polished "
     "lip above it; along the bottom edge, where the band rests on the slate, runs the second, identical row on the "
     "lower slope; between the two rows the brushed satin face is about 4 mm tall. Toward the left and the right the "
     "band curves away and softens. Above the front of the band, the polished inside of the back of the ring is just "
     "visible. Daylight from the left draws one long soft sheen along the brushed face. Colour: the charcoal slate is a "
     "cool dark grey, so the gold reads warm and bright against it. The ring is the only object in the image."),
    ("04-hand", "how the band looks on a man's hand", "Y", REF_WHOLE_TOP,
     "A man's hand rests palm-down on soft charcoal-grey wool, seen from slightly above and from the side of the "
     "fingertips, fingers relaxed and slightly apart. The ring is worn on the ring finger, the fourth finger, between the "
     "middle finger and the little finger, near the base of the finger, with its brushed satin face across the top of "
     "the finger, framed by its two stone edges: one row of small stones along the edge toward the fingertips, facing "
     "the camera, and the other along the edge toward the knuckle, so two fine lines of light cross the finger. It is the only ring; the "
     "other fingers and the wrist are bare, no watch and no bracelet. The band sits firmly on the finger: its 6 mm width "
     "is about a third of the finger's width. Natural skin texture, short clean nails. Colour: the wool is a muted cool "
     "charcoal grey and the skin natural, so the gold is the warmest accent in the image."),
    ("05-three", "the band in yellow, white and rose gold", "3", REF_WHOLE_BW,
     "Three of these rings lie flat side by side in a row on a slab of pale, matte, neutral limestone, a little apart, "
     "each with one of its stone edges facing up, seen from the front and above at about 40 degrees: from left to right "
     "yellow gold, white gold and rose gold. Each ring shows the continuous circle of small stones around the top rim of "
     "its opening, the brushed satin face as its front wall with the second row along its bottom edge, and the polished "
     "inside of its back. All three are "
     "the same size and completely in view, evenly lit by daylight from the left. Colour: the limestone is a neutral pale "
     "grey-beige, so each gold keeps its own true colour. These three rings are the only objects in the image."),
    ("06-white", "white gold, the stone edge facing the camera", "W", REF_WHOLE_BW,
     "The white gold ring stands upright on its edge on a slab of warm, matte sandstone, turned three-quarters so that "
     "one stone edge faces the camera: the camera looks from the front-left and slightly above, so on the left the "
     "opening appears as a tall ellipse framed all the way around by the continuous circle of small stones on the near "
     "beveled edge, with the thin polished lip just inside it and the polished inside beyond; on the right the brushed "
     "satin outer face curves away as a wall, with the second row of stones along its far edge. " + PROPORTION + " Daylight from the left. Colour: the sandstone is "
     "a warm, muted honey-beige, the complement of the cool white gold, so the silver-white metal and the clear stones "
     "stand out against it. The ring is the only object in the image."),
    ("07-rose", "rose gold, the full circle of stones from above", "R", REF_TOP_BW,
     "The rose gold ring lies flat on soft, muted sage-green linen and is seen from high above, at about 70 degrees, so "
     "the opening looks almost round. " + UP + " From this height the stones make one complete circle around the "
     "opening, with the thin polished lip on their inner side and, outside them, a narrow band of the brushed satin face "
     "curving down to the linen; through the opening the linen shows. " + PROPORTION + " Daylight from the left, the "
     "linen weave softly visible. Colour: the sage green is the muted complement of the warm pink gold, so the rose gold "
     "is the only warm colour in the image. The ring is the only object in the image."),
    ("08-scale", "real size in a man's palm", "Y", REF_WHOLE_TOP,
     "Real-size view. A man's open hand, palm up, is seen from slightly above, the fingers relaxed and slightly curled; "
     "the ring lies flat in the middle of the palm with one stone edge facing up, so a continuous circle of small "
     "stones runs around the top rim of the opening and the brushed satin face, with the second row along its bottom "
     "edge, forms the front wall of the band. The ring "
     "sits on the palm at its real size: its whole width, about 22 mm, is about a quarter of the width of the palm, a "
     "little more than the width of one finger at its base. " + PROPORTION + " Natural skin texture, short clean nails. "
     "Behind the hand, soft blue-grey linen is out of focus."),
    ("09-circle", "the stone edge straight on: a complete circle of stones", "Y", REF_TOP_SIDE,
     "The ring stands upright on its edge on a slab of matte black basalt, and the camera looks almost straight at one "
     "of its two stone edges, along the ring's axis and slightly from above: the opening appears as a nearly round hole, and around "
     "it the polished slope with its row of small stones forms one complete, continuous circle of light, with the thin "
     "polished lip on its inner side and the polished inside of the band receding into the hole; only a thin "
     "sliver of the brushed satin face shows around the outside. A single soft window light comes from the right; the "
     "black stone stays matte and dark and the ring stands out quietly against it. The ring sits in the centre of the "
     "frame and fills about half of the frame's height. Colour: the basalt is a neutral matte black, so the yellow gold "
     "keeps its own true colour. The ring is the only object in the image."),
]

WANT_REF = {"01-hero": REF_WHOLE_TOP, "02-row": REF_TOP_SIDE, "03-profile": REF_SIDE_TOP, "04-hand": REF_WHOLE_TOP,
            "05-three": REF_WHOLE_BW, "06-white": REF_WHOLE_BW, "07-rose": REF_TOP_BW, "08-scale": REF_WHOLE_TOP,
            "09-circle": REF_TOP_SIDE}
REF_FILES = {REF_WHOLE_TOP: ["refWhole", "refTop"], REF_TOP_SIDE: ["refTop", "refSide"],
             REF_SIDE_TOP: ["refSide", "refTop"], REF_WHOLE_BW: ["refWhole_bw", "refTop_bw"],
             REF_TOP_BW: ["refTop_bw", "refWhole_bw"]}

prompts = []
for fid, feature, metal, ref, frame in FRAMES:
    R = ring(metal)
    p = " ".join([frame, R, LIGHT, PHOTO, ref])
    low = p.lower()
    for blk in (R, LIGHT, PHOTO, ref):
        assert p.count(blk) == 1, (fid, blk[:30])
    assert ref is WANT_REF[fid], (fid, "referans cümlesi")
    # bilinen tuzaklar: yüzeye taş yayan / kardeş listing / jargon / renkli ışık / sahne sızıntısı sözcükleri
    for bad in ("eternity", "pave", "pavé", "sparkle", "macro", "channel", "milgrain", "two tone", "two-tone", "dome",
                "princess", "baguette", "halo", "bezel", "solitaire", "engagement", "wedding", "anniversary", "classic",
                "same metal", "exact copy", "comfort", "hammer", " star", "groove", "woman", "moissanite",
                "holder", "half of the circle", "a third of the ring's circle", "teal", "amber", "travertine",
                "in one colour", "vertical"):
        assert bad not in low, (fid, bad)
    # sözcük sınırıyla: kırmızı tutucu sızıntısı (foto 4 referans değil), kardeş listing'in armudu ve rayı
    for bad in (r"\bred\b", r"\bpears?\b", r"\brails?\b"):
        assert not re.search(bad, low), (fid, bad)
    # tasarım pinleri (RING bloğu her karede bir kez)
    for pin in ("both edges of the band are the same", "cut off at 45 degrees", "one single row of small round brilliant",
                "tiny round polished gold bead between each pair", "each row runs all the way around the ring without a gap",
                "two parallel circles of stones, one along each edge", "about 1.3 mm across",
                "about a fifth of the band's width", "about forty of them fit around each circle", "thin polished gold lip",
                "fine brushed satin finish", "never across it", "about 6 mm wide and about 1.8 mm thick",
                "these are the only stones", "exactly two rows of small stones, one along each edge",
                "no stones on the brushed middle", "high-polished gold", "no person, no camera and no hands",
                "the other edge carries an identical row"):
        assert pin in low, (fid, pin)
    # her kare taşlı kenarın bu pozda nerede olduğunu söyler
    where = {"01-hero": "one of its two stone edges faces up", "07-rose": "one of its two stone edges faces up",
             "03-profile": "along the top edge of this wall runs one row", "02-row": "the row of small round stones runs across the frame",
             "04-hand": "framed by its two stone edges", "05-three": "each with one of its stone edges facing up",
             "06-white": "one stone edge faces the camera", "08-scale": "with one stone edge facing up",
             "09-circle": "looks almost straight at one of its two stone edges"}[fid]
    assert where in low, (fid, "taşlı kenarın yeri")
    # tek kenar okumasının sızıntısı (sahip kartı 2026-11-21: iki kenar)
    for bad in ("plain edge", "one edge only", "along one edge of the band only", "no second row", "has no stones at all",
                "the narrow polished bevel"):
        assert bad not in low, (fid, bad)
    if fid in ("01-hero", "07-rose"):
        assert "the other stone edge rests on the surface underneath" in low, fid
    if fid == "03-profile":
        assert "runs the second, identical row on the lower slope" in low and "about 4 mm tall" in low, fid
    # oran sayıyla
    assert ("a quarter of the ring's outer diameter" in low) == (fid in ("01-hero", "06-white", "07-rose", "08-scale")), (fid, "oran")
    if fid == "04-hand":
        assert "about a third of the finger's width" in low
        assert "fourth finger, between the middle finger and the little finger" in p, fid
    if fid == "08-scale":
        assert "about a quarter of the width of the palm" in low and "lies flat in the middle of the palm" in low, fid
    assert "natural daylight only" in low and "no coloured light patches" in low, fid
    pal = {"01-hero": "blue-grey ceramic tile", "02-row": "blue-grey slate", "03-profile": "charcoal slate",
           "04-hand": "charcoal-grey wool", "05-three": "neutral limestone", "06-white": "sandstone",
           "07-rose": "sage-green linen", "08-scale": "blue-grey linen", "09-circle": "black basalt"}[fid]
    assert pal in low, (fid, "renk kuramı zemini yok")
    # renk: metin kareyle aynı, siyah-beyaz referans yalnız renk karelerinde
    assert (metal in ("W", "R", "3")) == ("black and white on purpose" in low), (fid, "renk karesi siyah-beyaz referans")
    if metal == "W":
        assert "white gold ring" in low and "no yellow tint" in low, fid
    if metal == "R":
        assert "rose gold ring" in low, fid
    hands = bool(re.search(r"\bhands?\b", frame.lower()))
    assert hands == (fid in ("04-hand", "08-scale")), (fid, "el yalnız el karelerinde")
    if hands:
        assert "a man's" in low, (fid, "erkek bandı: erkek eli")
    assert "real photographs of this ring" in low and "no towel, no white fur" in low, (fid, "referans + sahne alınmaz")
    prompts.append({"id": fid, "feature": feature, "metal": metal, "refs": REF_FILES[ref], "prompt": p,
                    "words": len(p.split()), "md5": hashlib.md5(p.encode()).hexdigest()})

assert len(prompts) == 9 and len({x["prompt"] for x in prompts}) == 9
(HERE / "prompts.json").write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + "\n")

# İnceleme sayfası (sahibin onayı için): ortak bloklar bir kez, kare metni ve referanslar kare başına.
md = ["# EON-SDE6 galeri prompt'ları: inceleme sayfası (2026-11-21)", "",
      "Kaynak `prompts.py` → `prompts.json` (bu sayfa ondan üretildi; elle düzenlemeyin). Model `nano_banana_2`, 2k, 4:3, "
      "`count` 1, kare başı 2 kredi. Plan: önce yalnız **01 hero** (2 kredi), sahibin fotoğraflarıyla yan yana kontrol; tutarsa "
      "kalan 8 kare (16 kredi). Yeniden çekim payıyla tahmin **~26 kredi**, tavan 40. 10. kare ölçü kartı yerelde dizilir "
      "(kredisiz). 11. kare sahibin düzenlenmemiş gerçek fotoğrafı (foto 4, kırmızı tutucu, halkanın tamamı).", "",
      "Referanslar (sahibin gerçek fotoğraflarından sıkı kırpımlar, repoya alınmadı): `refWhole` foto 1 (yatık halka, tam tur "
      "taş dairesi), `refTop` foto 3 (pahtaki sıra yakın, iç dudak), `refSide` foto 2 (göz hizası, fırçalı duvar); beyaz, rose "
      "ve üç-renk karelerinde siyah-beyaz kopyaları.", "",
      "Her prompt = **kareye özgü metin** + RING + LIGHT + PHOTO + referans cümlesi.", "",
      "## RING (sarı karelerde; beyaz/rose/üçlü karelerde yalnız renk cümlesi değişir)", "", ring("Y"), "",
      "## LIGHT", "", LIGHT, "", "## PHOTO", "", PHOTO, ""]
for x, (fid, feature, metal, ref, frame) in zip(prompts, FRAMES):
    md += [f"## {fid}: {feature}", "", f"md5 `{x['md5']}`, {x['words']} kelime, metal {metal}, referans {', '.join(x['refs'])}.",
           "", f"**Kare:** {frame}", "", f"**Renk:** {METAL[metal]}", ""]
(HERE / "PROMPTS-REVIEW.md").write_text("\n".join(md) + "\n")
for x in prompts:
    print(f"{x['id']:10s} {x['words']} words md5 {x['md5'][:8]} refs {x['refs']}")
