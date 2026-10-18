"""Jade Gold NYC, Christmas 2026: the hero review -> images/heroes/status.json.

Run: python3 -I docs/jade/xmas26/review.py

One entry per hero that is not simply "ok": status (check = usable, read the note; redo = wrong,
generate again), the fault in the owner's words, and a corrected prompt. The corrected prompt is
DERIVED from the stored hero prompt (images/jobs.json) by replacing the one sentence that misled the
model; every replacement asserts the original sentence is present once, so a retyped or drifted
prompt cannot slip in. Heroes not listed here are "ok" (optionally with a short note).

History: first pass 2026-10-18 (36 ok, 2 check, 2 redo; B4 reshot once and accepted). Second pass
the same day: the owner regenerated E9, P2 and N9 with the corrected prompts; each one closed its
first fault and opened a smaller one, so all three are now "check" with the new fault named.
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
    "N9": {
        "status": "check",
        "reason": "v2 (sahip üretimi): mine rengi artık doğru (koyu yeşil). Ama taban çubuğunda 5 yerine 4 hücre "
                  "ve 3 çıta var; tasarım 5 hücre / 4 çıta. Kare kullanılabilir: ya tasarım 4 hücreye çekilir "
                  "(metin + gram kurulumu güncellenir) ya da aşağıdaki promptla 5 hücreli yeniden üretilir.",
        "note": "Hücre sayısı 4, tasarım 5.",
        "prompt": fixed(
            "N9",
            ("(a dark muted grey-green) separated by four 0.7 mm gold ribs",
             "(a dark bottle green with a grey cast, clearly darker than the grey stone slab, never pale, never "
             "mint, never sage) separated by four 0.7 mm gold ribs, so the bar reads as exactly five cells and "
             "four ribs; count the cells: five, not four, not six"),
            ("The only colour on the piece is opaque deep jade-green enamel filling",
             "The only colour on the piece is opaque deep jade-green enamel, dark bottle green, filling"),
        ),
    },
    "E9": {
        "status": "check",
        "reason": "v2 (sahip üretimi): ayaklar gitti, mine ve kuyruk oluğu doğru. Ama kuş yatay ve geniş çıktı "
                  "(en ≈ boyun iki katı); tasarım dik bir kardinal, 5.8 mm en × 11.5 mm boy, kuyruk gövdenin "
                  "altında. Kare kullanılabilir: ya tasarım tüneyen yatay kardinale çevrilir (atölye kartı yeniden "
                  "kurulur) ya da aşağıdaki promptla dik pozda yeniden üretilir.",
        "note": "Kuş yatay, tasarım dik.",
        "prompt": fixed(
            "E9",
            ("shaped as an upright cardinal bird in side profile,",
             "shaped as a cardinal bird in side profile standing tall, its tail hanging straight down beneath the "
             "body so that the whole outline is twice as tall as it is wide,"),
            ("Straight post behind the head.",
             "Straight post behind the head. The bird has no legs and no feet: below the enamel body the outline "
             "runs straight down into the tail, the tail tip is the lowest point of the earring and nothing else "
             "touches the slab; the earring is tall and narrow, never a wide perched bird."),
        ),
    },
    "P2": {
        "status": "check",
        "reason": "v2 (sahip üretimi): 2 çapraz çubuk ve toplam 3 taş artık doğru. Ama dış iki şerit kare desenli "
                  "(kordon/knurl) dokulu, ortadaki düz satin; spec üç şeridin üstünü de elmas tıraş diyor. Kare "
                  "kullanılabilir; önerim metni görsele eşitlemek (dış iki şerit desenli elmas tıraş, orta şerit "
                  "satin), gram değişmez. Aksi için aşağıdaki prompt.",
        "note": "Şerit dokusu spec'ten farklı.",
        "prompt": fixed(
            "P2",
            ("Two small gold cross-bars bridge the ribbons; each bar carries a raised 2.8 mm square pad set with "
             "one 1.8 mm lab grown white sapphire, flush-set.",
             "Exactly two small gold cross-bars bridge the ribbons, one near the head and one halfway along the "
             "tail; each of the two bars carries one raised 2.8 mm square pad set with one 1.8 mm lab grown white "
             "sapphire, flush-set; there is no third bar and no third pad."),
            ("Ribbon tops are bright diamond-cut, side faces honed matte.",
             "All three ribbon tops are bright diamond-cut in the same way (fine bright linear facets, not a "
             "knurled or checkered pattern, no plain ribbon), side faces honed matte."),
        ),
    },
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
    "N8": "Halka taşları tepede değil dış yanlarda; küçük sapma.",
    "P6": "Açık ortadan iğne gövdesi görünüyor (gerçekçi), sarı tonda okunuyor; spec beyaz altın.",
    "P7": "Işınlar yaprak damarı gibi faset işlemeli; diamond-cut okuması olarak kabul edildi.",
    "E6": "Mine çok açık ton; kabul edildi.",
    "N2": "Zincir figaro, spec ile uyumlu.",
}
out = {pid: review.get(pid, {"status": "ok", "reason": "", "note": notes.get(pid, "")}) for pid in ids}
json.dump(out, open(HERE / "images" / "heroes" / "status.json", "w"), ensure_ascii=False, indent=1)
print(Counter(v["status"] for v in out.values()), len(out))
