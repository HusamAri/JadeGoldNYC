# -*- coding: utf-8 -*-
"""
Reel kurgusu: posts.py'deki "cut" listesi -> out/<id>/reel.mp4 (1080x1920, 30 fps, sessiz).
Kullanım (repo kökünden): python3 docs/artifact-studio/instagram/video.py
Girdi: video/V1.mp4, video/V2.mp4 (Higgsfield çıktısı, jobs.json) + listing görselleri.

Kurgu: üretilen klip önce (ilk saniyede ürün tam kadrajda = kanca), sonra
listing kareleri sert kesmeyle. Kare görselleri kare (2048x2048); 9:16'ya
kırpılırsa üçlü kolye gibi geniş kareler kesilir, o yüzden kare ortada tam
genişlikte durur, üst ve alt aynı görselin bulanık büyütmesiyle dolar.
Müzik yok: Instagram'da paylaşırken uygulama içi trend ses eklenir.
"""
import os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS

HERE = "docs/artifact-studio/instagram"
STILL = 0.9  # saniye / kare
W, H, FPS = 1080, 1920, 30


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:])


def clip_still(src, dst, sec):
    img = f"public/artifact/{src}.jpg"
    n = int(sec * FPS)
    vf = (f"[0:v]split[a][b];"
          f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=40,eq=brightness=-0.06[bg];"
          f"[b]scale={W}:-2,zoompan=z='1+0.04*on/{n}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={n}:s={W}x{W}:fps={FPS}[fg];"
          f"[bg][fg]overlay=0:(H-h)/2,format=yuv420p")
    run(["ffmpeg", "-y", "-loop", "1", "-i", img, "-filter_complex", vf, "-t", str(sec),
         "-r", str(FPS), "-an", "-c:v", "libx264", "-crf", "18", dst])


def clip_video(src, dst):
    run(["ffmpeg", "-y", "-i", src, "-vf",
         f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p",
         "-an", "-c:v", "libx264", "-crf", "18", dst])


for p in POSTS:
    if p["format"] != "reel":
        continue
    tmp = os.path.join(HERE, "out", p["id"], "_parts"); os.makedirs(tmp, exist_ok=True)
    parts = []
    for i, c in enumerate(p["cut"]):
        dst = os.path.join(tmp, f"{i:02d}.mp4")
        if c.startswith("V"):
            src = os.path.join(HERE, "video", f"{c}.mp4")
            assert os.path.exists(src), f"{src} yok (Higgsfield çıktısı indirilmedi)"
            clip_video(src, dst)
        else:
            clip_still(c, dst, STILL)
        parts.append(dst)
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{os.path.abspath(x)}'\n" for x in parts))
    out = os.path.join(HERE, "out", p["id"], "reel.mp4")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out])
    for x in parts + [lst]:
        os.remove(x)
    os.rmdir(tmp)
    print(p["id"], out)
