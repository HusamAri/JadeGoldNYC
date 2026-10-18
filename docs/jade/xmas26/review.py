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
through work/fixes.json (N9 four cells, E9 horizontal bird, P2 two patterned ribbons), then N7 the
same way (six free-tipped feathers, gram re-derived). All 40 are "ok"; `fixed` stays for the next
round that needs a corrected prompt.
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


review = {}  # every hero is "ok": the owner kept the last flagged one (N7) and its text was aligned to it
notes = {
    "B4": "Yeniden çekim (ışınlar aynı düzlemde, pusula gülü gibi) kabul edildi.",
    "N7": "Sahip görseli beğendi; tasarım görsele eşitlendi: 6 serbest uçlu tüy, kulp dış kenara doğru, altın 4,14 → 4,05 g (2026-10-18).",
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
