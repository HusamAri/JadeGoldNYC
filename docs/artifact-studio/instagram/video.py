# -*- coding: utf-8 -*-
"""
Reel = tek ürünü tanıtan reklam videosu, YALNIZ video (sahip talimatı 2026-10-14;
durağan kare kurgusu kaldırıldı). video/<AD>.mp4 (Higgsfield çıktısı) ->
out/<id>/reel.mp4: 1080x1920, 30 fps, H.264, sessiz, faststart.
Kullanım (repo kökünden): python3 docs/artifact-studio/instagram/video.py
Müzik yok: Instagram'da paylaşırken uygulama içi trend ses eklenir.
"""
import os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS

HERE = "docs/artifact-studio/instagram"

for p in POSTS:
    if p["format"] != "reel":
        continue
    src = os.path.join(HERE, "video", f"{p['video']}.mp4")
    assert os.path.exists(src), f"{src} yok (Higgsfield çıktısı indirilmedi)"
    out = os.path.join(HERE, "out", p["id"], "reel.mp4")
    r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf",
                        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p",
                        "-an", "-c:v", "libx264", "-crf", "18", "-movflags", "+faststart", out])
    assert r.returncode == 0, src
    print(p["id"], out)
