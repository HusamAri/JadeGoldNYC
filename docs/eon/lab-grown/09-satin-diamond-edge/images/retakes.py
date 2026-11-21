"""EON-SDE6 yeniden çekimleri: v1 prompt'tan assert'li cümle değişimiyle türetilir (second-brain 2026-10-18:
düzeltilmiş prompt yeniden YAZILMAZ, saklanan prompt'tan tek cümle değiştirilir).

Run: python3 -I docs/eon/lab-grown/09-satin-diamond-edge/images/retakes.py   -> retakes.json

v1 set kontrolü 2026-11-21 (kontak baskısı + tam çözünürlük kırpımları):
- 05-three v1: üst sıra bandın İÇ duvarına çizildi (açıklıktan arkada noktalar), öndeki üst pah düz cilalı. Tek kusur: üst
  sıranın yeri. Düzeltme: kabul edilen hero'nun siyah-beyaz kırpımı referans (aynı yatık poz, sıralar dış pahlarda; PEAR2
  05 v3 dersi) + sıranın dışta olduğunu ve iç duvarın taşsız olduğunu söyleyen fiziksel cümle.
- 08-scale v1: halka avucun ~0,34'ü (beklenen ~0,25), parmak genişliğinin ~1,4 katı (beklenen ~1,1): ~%30 büyük; ayrıca
  fırçalı yüzün tonu rose karesininkine eşit (hue 25; sarı kareler 33-36). İki bağımsız, ayrı ayrı ölçülebilir kusur:
  ölçek cümlesi sayıyla ve yanlış sınıf adıyla, renk cümlesi "rose değil" ile; referans kabul edilen sarı hero'nun renkli
  kırpımı (referans rengi de taşır).
"""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
P = {f["id"]: f for f in json.loads((HERE / "prompts.json").read_text())}
MEDIA = {"heroCrop": "75f395ac-4fc8-454a-a6bd-8f303d545ddf", "heroCrop_bw": "466c7c0e-6098-4200-a643-090ed26095e6",
         "refTop": "11bb702e-7e8c-4640-9fa1-f4d5407bfbe7", "refTop_bw": "bf0322f4-f4b1-4cc5-9994-562735207449"}


def swap(text, old, new):
    assert text.count(old) == 1, old[:60]
    return text.replace(old, new)


def ref_tail(prompt):
    i = prompt.index("Reference images:")
    return prompt[i:]


RETAKES = []

# ---- 05-three v2
p5 = P["05-three"]["prompt"]
p5 = swap(p5, "Each ring shows the continuous circle of small stones around the top rim of its opening, the brushed satin "
              "face as its front wall with the second row along its bottom edge, and the polished inside of its back.",
          "On each ring the upper row is on the outside of the band, never inside it: it runs around the top rim on the "
          "narrow polished slope between the top of the brushed front wall and the rim of the opening, so at the front of "
          "each ring its stones face the camera just above the brushed face. The brushed satin face is the front wall, "
          "with the second row along its bottom edge. The inside wall of each band is plain, smooth, high-polished gold "
          "with no stones on it.")
p5 = swap(p5, ref_tail(p5),
          "Reference images, both black and white on purpose: the first is a photograph of this exact ring lying flat, "
          "cropped to the ring, showing the row of small stones along the top edge of the brushed front wall, on the "
          "outside of the band, the second row along its bottom edge, and the plain polished inside; the second is a real "
          "photograph of the row of stones on its polished slope up close. Take only the ring's shape and design from "
          "them: the brushed satin middle of the outer face, the two rows of small round stones with tiny gold beads on "
          "the polished slopes along both edges, the thin polished lips and the plain polished inside. Do not take their "
          "background or their lighting; the colour of each gold comes only from this text.")
RETAKES.append({"id": "05-three", "take": "v2", "refs": ["heroCrop_bw", "refTop_bw"], "prompt": p5,
                "defectV1": "upper row drawn on the inside wall of each band (stones seen through the opening at the back); "
                            "the upper outer bevel at the front is plain polished",
                "fix": "accepted hero (01 v1) cropped to the ring, black and white, as the first reference; the sentence "
                       "puts the upper row on the outside slope and keeps the inside wall plain"})

# ---- 08-scale v2
p8 = P["08-scale"]["prompt"]
p8 = swap(p8, "The ring sits on the palm at its real size: its whole width, about 22 mm, is about a quarter of the width of "
              "the palm, a little more than the width of one finger at its base.",
          "The ring is small in the palm, as a real ring is: its whole width, about 22 mm, is the same as the width of one "
          "finger where it joins the palm, so four such rings side by side would span the palm; it covers only a small "
          "part of the palm, never a third of it.")
yellow = ("The gold is warm, soft yellow gold; the brushed face is a pale, even satin yellow and the polished parts are "
          "brighter warm yellow.")
p8 = swap(p8, yellow, yellow + " The ring is yellow gold, not rose gold: no pink or copper tint, even next to the warm skin "
                               "of the hand.")
p8 = swap(p8, ref_tail(p8),
          "Reference images, cropped to the ring: the first is a photograph of this exact ring in its yellow gold, lying "
          "flat, with one row of small stones along the top edge of the brushed front wall and one along its bottom edge; "
          "the second is a real photograph of the row of stones on the polished slope up close. Take only the ring's design "
          "and its yellow gold colour: the brushed satin middle of the outer face, the polished 45 degree slopes along both "
          "edges with their rows of small round stones and tiny gold beads, the thin polished lips inside the rows and the "
          "polished inside. Do not take the photographs' setting: not their background, their lighting or their camera "
          "angle.")
RETAKES.append({"id": "08-scale", "take": "v2", "refs": ["heroCrop", "refTop"], "prompt": p8,
                "defectV1": "scale: the ring is about 0.34 of the palm's width and about 1.4 finger widths (real 22 mm ring: "
                            "about 0.25 and 1.1), so about 30% too large; colour: the brushed face measures hue 25, the same "
                            "as the rose ring in 05 (yellow frames 33-36)",
                "fix": "scale sentence pinned to one finger's width with the wrong class named (never a third of the palm); "
                       "colour sentence 'yellow gold, not rose gold'; accepted yellow hero crop as the first reference"})

for r in RETAKES:
    p = r["prompt"]
    low = p.lower()
    for bad in ("eternity", "pave", "pavé", "sparkle", "macro", "channel", "milgrain", "two-tone", "princess", "baguette",
                "halo", "bezel", "same metal", "exact copy", "vertical", "in one colour"):
        assert bad not in low, (r["id"], bad)
    for bad in (r"\bred\b", r"\bpears?\b", r"\brails?\b"):
        assert not re.search(bad, low), (r["id"], bad)
    for pin in ("both edges of the band are the same", "exactly two rows of small stones, one along each edge",
                "each row runs all the way around the ring without a gap", "about 1.3 mm across",
                "no stones inside the band", "no person, no camera and no hands"):
        assert pin in low, (r["id"], pin)
    assert p.count("Reference images") == 1, r["id"]
    r["baseMd5"] = P[r["id"]]["md5"]
    r["md5"] = hashlib.md5(p.encode()).hexdigest()
    r["media"] = [MEDIA[k] for k in r["refs"]]
    r["words"] = len(p.split())

assert "never inside it" in RETAKES[0]["prompt"] and "with no stones on it" in RETAKES[0]["prompt"]
assert "black and white on purpose" in RETAKES[0]["prompt"] and "colour of each gold comes only from this text" in RETAKES[0]["prompt"]
assert "left ring is warm yellow gold" in RETAKES[0]["prompt"]
assert "never a third of it" in RETAKES[1]["prompt"] and "not rose gold" in RETAKES[1]["prompt"]
assert "A man's open hand" in RETAKES[1]["prompt"] and "black and white" not in RETAKES[1]["prompt"]

(HERE / "retakes.json").write_text(json.dumps(RETAKES, indent=2, ensure_ascii=False) + "\n")
for r in RETAKES:
    print(f"{r['id']} {r['take']} md5 {r['md5'][:8]} (v1 {r['baseMd5'][:8]}) {r['words']} words refs {r['refs']}")
