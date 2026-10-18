"""Jade Gold NYC, Christmas 2026: the hero review -> images/heroes/status.json.

Run: python3 -I docs/jade/xmas26/review.py

One entry per hero that is not simply "ok": status (check = usable, read the note; redo = wrong,
generate again), the fault in the owner's words, and a corrected prompt. The corrected prompt is
DERIVED from the stored hero prompt (images/jobs.json) by replacing the one sentence that misled the
model; every replacement asserts the original sentence is present once, so a retyped or drifted
prompt cannot slip in. Heroes not listed here are "ok" (optionally with a short note).

History (2026-10-18): first pass 36 ok, 2 check, 2 redo; B4 reshot once and accepted. Second pass:
the owner regenerated E9, N9 and P2 from the corrected prompts, each closing its first fault and
opening a smaller one. The owner kept those three images, so the DESIGN TEXT was aligned to them
through work/fixes.json (N9 four cells, E9 perched horizontal bird, P2 two patterned ribbons) and
they are "ok" here; only N7 stays "check".
"""
import json
import pathlib
from collections import Counter

HERE = pathlib.Path(__file__).parent
jobs = {x["id"]: x for x in json.load(open(HERE / "images" / "jobs.json"))["jobs"]}
ids = list(jobs)


def fixed(pid, *pairs):
    p = jobs[pid]["prompt"]
    for old, new in pairs:
        assert p.count(old) == 1, (pid, old[:60])
        p = p.replace(old, new)
    return p


review = {
    "N7": {
        "status": "check",
        "reason": "Uçuş tüyleri 5 yerine 6 okunuyor ve uçlar kapalı alt kenarla birleşmek yerine ayrı duruyor. "
                  "Kare kullanılabilir; açıklama 'beş tüy' diyor, istersen yeniden üret.",
        "note": "Tüy sayısı açıklamadan farklı.",
        "prompt": fixed(
            "N7",
            ("below it five long flight feathers, 1.3 mm wide, are separated by narrow pierced slits and end in "
             "five rounded tips joined along a closed lower edge.",
             "below it exactly five long flight feathers, 1.3 mm wide, are separated by four narrow pierced slits "
             "that stop short of the bottom, so the five rounded tips are joined to each other along one "
             "continuous closed lower edge; five feathers, not six."),
        ),
    },
}
notes = {
    "B4": "Yeniden çekim (ışınlar aynı düzlemde, pusula gülü gibi) kabul edildi.",
    "N9": "v2 sahip üretimi; tasarım görsele eşitlendi: 4 hücre / 3 çıta, koyu yeşil mine (2026-10-18).",
    "E9": "v2 sahip üretimi; tasarım görsele eşitlendi: yatay kardinal 11.5 × 5.8 mm, dal/tünek yok, civi boyunda (2026-10-18).",
    "P2": "v2 sahip üretimi; tasarım görsele eşitlendi: dış iki şerit elmas tıraş desenli, orta şerit satin (2026-10-18).",
    "N8": "Halka taşları tepede değil dış yanlarda; küçük sapma.",
    "P6": "Açık ortadan iğne gövdesi görünüyor (gerçekçi), sarı tonda okunuyor; spec beyaz altın.",
    "P7": "Işınlar yaprak damarı gibi faset işlemeli; diamond-cut okuması olarak kabul edildi.",
    "E6": "Mine çok açık ton; kabul edildi.",
    "N2": "Zincir figaro, spec ile uyumlu.",
}
out = {pid: review.get(pid, {"status": "ok", "reason": "", "note": notes.get(pid, "")}) for pid in ids}
json.dump(out, open(HERE / "images" / "heroes" / "status.json", "w"), ensure_ascii=False, indent=1)
print(Counter(v["status"] for v in out.values()), len(out))
