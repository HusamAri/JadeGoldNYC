# -*- coding: utf-8 -*-
"""
Artifact Studio Instagram, ilk 5 gönderi (2026-10-14). Tek kaynak: render.py
görselleri, captions.md metni buradan üretir.

Araştırma özeti (README.md, kaynaklar orada):
- Yeni/küçük hesapta erişimi Reels getirir; carousel kaydetme (save) getirir.
- Mücevherde en iyi carousel, izleyicinin bir SATIN ALMA kararını çözen
  carousel'dir ("hangi ayar?", "hangisi senin?").
- Soru içeren caption daha çok yorum alır; hashtag erişimi artırmıyor,
  o yüzden gönderi başına en çok 3 etiket.
- İlk 9 kare profilin vitrini: 4:5 (1080x1350), tutarlı aile dili.

Görsel kodu: "moth/N01/06" = public/artifact/moth/N01/06.jpg;
"xmas26/N09" = public/artifact/xmas26/N09.jpg (hero).
"""

SHOP = "Link in bio"

POSTS = [
    {
        "id": "P1",
        "format": "reel",
        "title": "Openwork Moth, reveal",
        "why": "Erişim. Yeni hesapta keşfi Reels getirir; ilk saniyede ürün tam kadrajda.",
        "cover": {"src": "moth/N01/07", "fy": 0.5, "band": [92, 36, 18],
                  "kicker": "SOLID GOLD", "headline": "A moth, drawn\nin gold."},
        "video": "AD1",
        "listing": "4594329265",
        "caption": [
            "It took one line of gold to draw this moth.",
            "",
            "The Openwork Moth is made in solid gold, wings left open so your skin shows through. "
            "No stones, no plating, nothing to wear off.",
            "",
            "Made to order in 10K, 14K or 18K, in yellow, white or rose gold, on a 16, 18 or 20 in. chain.",
            "",
            "Moth or butterfly: which one do you see first?",
            "",
            "Link in bio.",
        ],
        "tags": ["#solidgoldjewelry", "#mothnecklace", "#finejewelry"],
    },
    {
        "id": "P2",
        "format": "carousel",
        "title": "10K, 14K or 18K?",
        "why": "Kaydetme. Satın alma kararını çözen eğitim carousel'i; hediye sezonunda tekrar açılır.",
        "slides": [
            {"t": "photo", "src": "moth/N01/09", "fy": 0.55,
             "kicker": "SWIPE BEFORE YOU CHOOSE", "headline": "10K, 14K\nor 18K?"},
            {"t": "text", "kicker": "THE NUMBER", "headline": "Karat tells you\nhow much is gold.",
             "rows": [("10K", "41.7% pure gold"), ("14K", "58.5% pure gold"), ("18K", "75.0% pure gold")],
             "foot": "The rest is alloy: the metals that give gold its strength and its colour."},
            {"t": "photo", "src": "twig/B01/09", "fy": 0.5,
             "kicker": "SAME DESIGN", "headline": "Three colours.", "dark": False},
            {"t": "text", "kicker": "HOW THEY WEAR", "headline": "Pick by your day,\nnot by the number.",
             "rows": [("10K", "Hardest wearing. Softer, paler colour."),
                      ("14K", "The everyday balance. Our most chosen."),
                      ("18K", "Richest colour. Softer metal, heirloom feel.")],
             "foot": "All three are solid gold. None of them is plated."},
            {"t": "photo", "src": "moth/N01/12", "fy": 0.55,
             "kicker": "WORN EVERY DAY", "headline": "Yellow gold."},
            {"t": "cta", "kicker": "SAVE THIS", "headline": "The Moth and the Twig\ncome in all nine.",
             "foot": "3 karats x 3 colours. Made to order."},
        ],
        "caption": [
            "10K, 14K or 18K? Save this before you buy gold for anyone, yourself included.",
            "",
            "Karat is the share of pure gold: 10K is 41.7%, 14K is 58.5%, 18K is 75%. "
            "The rest is alloy, and the alloy is what makes gold yellow, white or rose.",
            "",
            "More gold is not automatically better. 10K is the toughest for rings you never take off. "
            "14K is the everyday balance. 18K has the deepest colour and the softest touch.",
            "",
            "The Moth and the Twig are made to order in all nine.",
            "",
            "Which one are you: 10, 14 or 18?",
        ],
        "tags": ["#solidgold", "#14kgold", "#jewelryguide"],
    },
    {
        "id": "P3",
        "format": "post",
        "title": "Twig and Baroque Pearl",
        "why": "Tek, sessiz ürün karesi. Grid'e nefes ve sezon (kış) rengi verir.",
        "slides": [{"t": "photo", "src": "twig/B01/06", "fy": 0.5}],
        "listing": "4594365591",
        "caption": [
            "A twig caught in frost, and one pearl that refused to be round.",
            "",
            "Every baroque pearl is a different shape, so no two of these bracelets match. "
            "The branch is solid gold, polished smooth; the pearl is freshwater.",
            "",
            "10K, 14K or 18K. Yellow, white or rose. 6.5, 7 or 7.5 in.",
            "",
            "Would you wear it alone or stacked?",
            "",
            "Link in bio.",
        ],
        "tags": ["#baroquepearl", "#pearlbracelet", "#solidgoldjewelry"],
    },
    {
        "id": "P4",
        "format": "carousel",
        "title": "Pick a charm",
        "why": "Yorum. Numaralı seçim oyunu; yorum sinyali + koleksiyonu tek gönderide tanıtır.",
        "slides": [
            {"t": "cover_grid", "srcs": ["fw2627-enamel/R01", "fw2627-enamel/R02", "fw2627-enamel/R03",
                                          "fw2627-enamel/R04"],
             "kicker": "FALL / WINTER 26", "headline": "Pick one.\nComment the number."},
            {"t": "photo", "src": "fw2627-enamel/R01", "num": "01", "name": "Keyhole, teal enamel"},
            {"t": "photo", "src": "fw2627-enamel/R02", "num": "02", "name": "Domino, black and cream"},
            {"t": "photo", "src": "fw2627-enamel/R03", "num": "03", "name": "Cherries, oxblood"},
            {"t": "photo", "src": "fw2627-enamel/R04", "num": "04", "name": "Button, purple"},
            {"t": "photo", "src": "fw2627-enamel/R05", "num": "05", "name": "Acorn, cocoa"},
            {"t": "photo", "src": "fw2627-enamel/R06", "num": "06", "name": "Checkerboard, chartreuse"},
            {"t": "photo", "src": "fw2627-enamel/R07", "num": "07", "name": "Heart, berry pink"},
            {"t": "photo", "src": "fw2627-enamel/R08", "num": "08", "name": "Bow, navy"},
            {"t": "cta", "kicker": "YOUR TURN", "headline": "Which number\nis yours?",
             "foot": "Vitreous enamel set flush in solid gold."},
        ],
        "caption": [
            "Eight rings, one rule: pick one and comment the number.",
            "",
            "Our Fall/Winter 26 charms: vitreous enamel, which is glass fused to gold, set flush in solid gold. "
            "A teal keyhole, a domino, oxblood cherries, a purple button, a cocoa acorn, "
            "a chartreuse checkerboard, a berry heart and a navy bow.",
            "",
            "Every charm also comes as earrings, a pendant and a bracelet.",
            "",
            "Go: 01 to 08?",
        ],
        "tags": ["#enameljewelry", "#charmring", "#solidgold"],
    },
    {
        "id": "P5",
        "format": "reel",
        "title": "Poinsettia Necklace",
        "why": "Erişim + sezon. Ekim ortası hediye aramasının başladığı an; tek ürünlü reklam videosu.",
        "cover": {"src": "xmas26/N09", "fy": 0.5,
                  "kicker": "HOLIDAY 26", "headline": "Gifts that\nstay gold.", "band": [244, 239, 231]},
        "video": "AD2",
        "caption": [
            "One red flower, worn from December to forever.",
            "",
            "The Poinsettia Necklace: a 13 mm flower in poinsettia red vitreous enamel, glass fused "
            "to solid gold, with a beaded gold centre. It faces forward on a hidden bail, so it sits "
            "flat at the neckline.",
            "",
            "10K, 14K or 18K, in yellow, white or rose gold, on a 16, 18 or 20 in. chain. "
            "Made to order, so order early for December.",
            "",
            "Who on your list is getting this one?",
            "",
            "Link in bio.",
        ],
        "tags": ["#christmasjewelry", "#enameljewelry", "#giftsforher"],
    },
]

# Kredi harcayan adım. CLAUDE.md: count 1, ÜRETMEDEN ÖNCE sahibin onayı.
# Model: seedance_2_5, mode omni_reference, start_image = kaynağın 9:16 orta
# kırpımı (1152x2048, render.py değil video.py üretir), 1080p, 5 sn, ses yok.
# Ürün kadrajda kalır: iki kaynakta da pendant 9:16 kırpımın içinde (kontrol edildi).
VIDEO_MODEL = {"model": "seedance_2_5", "mode": "omni_reference", "resolution": "1080p",
               "duration": 5, "aspect_ratio": "9:16", "generate_audio": False, "count": 1}
VIDEOS = {
    "V1": {
        "src": "moth/N01/01",
        "aspect": "9:16",
        "seconds": 5,
        "prompt": (
            "Image to video. Keep the gold moth pendant exactly as in the image: open wire wings, "
            "smooth one-piece antennae, bail through the head loop. Do not redraw or add details. "
            "Very slow camera push-in toward the pendant over 5 seconds. The blurred orange petal in the "
            "foreground drifts slowly out of frame and the petals underneath barely sway as if in a light breeze. A single soft highlight travels across "
            "the gold wings from left to right. The pendant itself stays still. Warm natural light, "
            "shallow depth of field, no text, no hands, no extra jewelry."
        ),
    },
    "V2": {
        "src": "xmas26/N09",
        "aspect": "9:16",
        "seconds": 5,
        "prompt": (
            "Image to video. Keep the gold poinsettia pendant with red enamel petals exactly as in the "
            "image, same petal count, same chain. Do not redraw or add details. The pendant swings "
            "very gently on its chain, a small pendulum motion that settles. Light glints off the gold "
            "edges once. Camera static, slight slow push-in. Cream textured paper background stays "
            "unchanged. No text, no hands, no extra objects."
        ),
    },
}

# Reel = tek ürünü tanıtan reklam videosu, yalnız video (sahip talimatı 2026-10-14).
# Durağan kare kurgusu YOK. seedance_2_5 omni_reference, 12 sn, 1080p, 9:16,
# sessiz, count 1; referanslar ürünün kendi listing kareleri. Kredi: 192 / video.
ADS = {
    "AD1": {
        "refs": ["moth/N01/06", "moth/N01/12", "moth/N01/09"],
        "seconds": 12,
        "prompt": (
            "12-second vertical product ad for one piece of jewelry: the Openwork Moth pendant necklace in "
            "solid gold shown in the reference images. Keep the pendant exactly as in the references in every "
            "shot: open wire wings with outlined wing cells, a teardrop head loop, smooth one-piece curved "
            "antennae, a bail through the head loop, a fine cable chain. Never add stones, enamel, texture or "
            "extra parts. Four shots with hard cuts, burnt orange gerbera petal world, warm natural light, "
            "35mm film grain. Shot 1 (0 to 3 s): extreme macro, the pendant lies on orange gerbera petals and "
            "a soft highlight sweeps across the gold wings. Shot 2 (3 to 6 s): slow orbit around the pendant "
            "hanging in the air on its chain, it turns slightly and catches the light. Shot 3 (6 to 9 s): the "
            "necklace worn on a woman's collarbone, rust linen shirt open at the neck, framed from the chin "
            "down, she breathes and the pendant moves gently. Shot 4 (9 to 12 s): three of the same pendant in "
            "yellow, white and rose gold side by side on the petals, slow push-in. No text, no logos, no hands "
            "touching the pendant, no extra jewelry."
        ),
    },
    "AD2": {
        "refs": ["xmas26/N09/06", "xmas26/N09/02", "xmas26/N09/09"],
        "seconds": 12,
        "prompt": (
            "12-second vertical product ad for one piece of jewelry: the Poinsettia pendant necklace shown in "
            "the reference images, a 13 mm flower with five pointed petals in glossy red enamel, thin gold "
            "rims and a centre vein on each petal, a beaded gold centre, on a fine gold cable chain. Keep the "
            "pendant exactly as in the references in every shot: same petal count, same shape, same red. "
            "Never add stones, leaves, snow on the pendant or extra parts. Four shots with hard cuts, deep teal "
            "velvet and paper world with a few pine sprigs, warm soft light, 35mm film grain. Shot 1 (0 to 3 s): "
            "extreme macro, the pendant rests on teal velvet and light glints along the gold rims. Shot 2 "
            "(3 to 6 s): the pendant hangs on its chain and turns slowly, warm bokeh lights behind. Shot 3 "
            "(6 to 9 s): the necklace worn on a woman's collarbone above a teal cable-knit sweater, framed from "
            "the chin down, the flower sits flat at the neckline. Shot 4 (9 to 12 s): three of the same pendant "
            "in yellow, white and rose gold side by side on teal paper, slow push-in. No text, no logos, no "
            "extra jewelry."
        ),
    },
}

