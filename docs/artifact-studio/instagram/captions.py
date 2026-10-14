# -*- coding: utf-8 -*-
"""posts.py -> captions.md (kopyala-yapıştır metni). Kullanım: python3 captions.py"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS, VIDEOS

FMT = {"reel": "Reel", "carousel": "Carousel", "post": "Tek görsel"}
out = ["# Artifact Studio Instagram, ilk 5 gönderi: caption'lar", "",
       "posts.py'den üretilir; elle düzenleme yapma, posts.py'yi değiştirip `python3 captions.py` koş.", ""]
for i, p in enumerate(POSTS, 1):
    text = "\n".join(p["caption"]) + "\n\n" + " ".join(p["tags"])
    # Marka kuralı: uzun/orta tire yok, en çok 3 etiket, ilk satır kanca (<= 90 karakter).
    assert not re.search("[–—]", text), p["id"]
    assert len(p["tags"]) <= 3, p["id"]
    assert len(p["caption"][0]) <= 90, (p["id"], len(p["caption"][0]))
    assert "?" in text, p["id"]  # her gönderi bir soruyla yorum ister
    n = len(p.get("slides", [])) or 1
    media = f"{n} kare (out/{p['id']}/01..{n:02d}.jpg)" if p["format"] != "reel" else \
        f"video {p['video']} + kurgu, kapak out/{p['id']}/cover.jpg"
    out += [f"## {i}. {p['id']} · {FMT[p['format']]} · {p['title']}", "",
            f"- Neden: {p['why']}", f"- Medya: {media}"]
    if p.get("blocker"):
        out.append(f"- **Engel:** {p['blocker']}")
    out += ["", "```", text, "```", ""]
out += ["## Video prompt'ları (onay bekliyor, count 1)", ""]
for k, v in VIDEOS.items():
    out += [f"### {k} · kaynak `{v['src']}` · {v['aspect']} · {v['seconds']} sn", "", v["prompt"], ""]
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "captions.md")
open(dst, "w").write("\n".join(out))
print("captions.md", len(POSTS), "posts")
