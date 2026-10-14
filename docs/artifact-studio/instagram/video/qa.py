# -*- coding: utf-8 -*-
"""
Reklam videosu QA: video/<AD>.mp4 -> scratchpad'e 4 sahnenin birer karesi (0.5, 3.5,
6.5, 9.5 s) + 16'lık şerit. Kullanım: python3 qa.py <AD> <çıktı_dizin>
Kontrol listesi (gözle): her sahnede ürün referansla aynı mı (moth: tek parça anten,
damla halka, bail; poinsettia: 5 yaprak, boncuklu göbek), metin/logo yok mu, 4. sahnede
üç renk ayrışıyor mu, takılı sahnede ikinci takı yok mu.
"""
import os, subprocess, sys

ad, out = sys.argv[1], sys.argv[2]
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"{ad}.mp4")
os.makedirs(out, exist_ok=True)
for i, t in enumerate([0.5, 3.5, 6.5, 9.5], 1):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", src, "-frames:v", "1",
                    os.path.join(out, f"{ad}-shot{i}.jpg")], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "fps=1.33,scale=180:-2,tile=8x2",
                "-frames:v", "1", os.path.join(out, f"{ad}-strip.jpg")], check=True)
print(ad, "ok")
