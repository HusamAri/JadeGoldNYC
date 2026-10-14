# -*- coding: utf-8 -*-
"""
Teslim paketi: out/ + caption'lar -> artifact-studio-instagram.zip (paylaşım sırasıyla).
Kullanım (repo kökünden): python3 docs/artifact-studio/instagram/package.py <hedef.zip>

01-P1-reel/   reel.mp4 + cover.jpg + caption.txt
02-P2-carousel/ 01..06.jpg + caption.txt  (kaydırma sırası = dosya sırası)
...
Reel'i olmayan reel klasörü paketi DÜŞÜRÜR (eksik teslim sessiz geçmesin).
"""
import os, sys, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS

HERE = "docs/artifact-studio/instagram"
dst = sys.argv[1]
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
    for i, p in enumerate(POSTS, 1):
        folder = f"{i:02d}-{p['id']}-{p['format']}"
        src = os.path.join(HERE, "out", p["id"])
        files = sorted(f for f in os.listdir(src) if f.endswith((".jpg", ".mp4")))
        if p["format"] == "reel":
            assert "reel.mp4" in files, f"{p['id']} reel.mp4 yok"
        else:
            assert len(files) == len(p["slides"]), (p["id"], files)
        for f in files:
            z.write(os.path.join(src, f), f"{folder}/{f}")
        caption = "\n".join(p["caption"]) + "\n\n" + " ".join(p["tags"]) + "\n"
        z.writestr(f"{folder}/caption.txt", caption)
    z.write(os.path.join(HERE, "README.md"), "README.md")
print(dst, os.path.getsize(dst) // 1024, "KB")
