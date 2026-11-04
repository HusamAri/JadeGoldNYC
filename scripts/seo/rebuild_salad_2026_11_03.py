#!/usr/bin/env python3
"""Leander: dış araçtan gelen kelime-salatası tag setlerinin yeniden kurulumu (2026-11-03, sahip onayı).

10 aktif listing'de 13 tag'in tamamı ürün adı taşımayan sıfat yığını ("men man statement",
"versatile designer", "length order link to"); hiçbir alıcı aramasıyla eşleşemez. Slot takası
(tag_pass_leander_2026_11_03.py) bunları düzeltmez; 13'ü kaynaktan yeniden kurulur:
  - 6 altın: 2026-10-21 araştırmalı matrisin (4.153 anahtar kelime) tag seti; içindeki ölü
    hediye/occasion slotları aynı geçişin merdiveniyle (ladder) değiştirilir.
  - 4 gümüş: docs/artifact-studio/silver-chains/listings.json üreteç seti (S01/S03/S04/S06).
Başlık DOKUNULMAZ (sahibin 10-22/10-27 sonrası düzenlemesi); "önce" hâli bugünkü panel aynası.
Çıktı: docs/artifact-studio/seo/2026-11-03-tag-pass/rebuild-matrix.json
(ops/seo-apply `?org=by Artifact Studio Jewelry&pass=rebuild-2026-11-03`).
Kullanım: python3 scripts/seo/rebuild_salad_2026_11_03.py [--check]
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tag_pass_leander_2026_11_03 import DEAD_WORDS, NOUN_RE, TAG_RE, BEFORE, SILVER, ladder, wset  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "docs/artifact-studio/seo/2026-11-03-tag-pass"
M21 = ROOT / "docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/apply-matrix.json"
GOLD = ["4583755575", "4583766198", "4583755785", "4590700782", "4585856835", "4591200606"]
SILVER_MAP = {"4604362474": "S03", "4604362590": "S04", "4604339049": "S01", "4604339881": "S06"}


def build():
    P = {L["id"]: L for L in json.load(open(BEFORE))["listings"]}
    m21 = {r["id"]: r for r in json.load(open(M21))}
    S = json.load(open(SILVER))
    rows = []
    for lid in GOLD + list(SILVER_MAP):
        L = P[lid]
        salad = sum(1 for x in L["tags"] if NOUN_RE.search(x.lower())) <= 4
        assert salad, f"{lid} salata değil, bu rotada olamaz"
        if lid in SILVER_MAP:
            base = list(S[SILVER_MAP[lid]]["tags"])
            source = f"silver-chains/listings.json {SILVER_MAP[lid]}"
            replaced, added = [], []
        else:
            base = list(m21[lid]["new_tags"])
            source = "2026-10-21 apply-matrix new_tags"
            dead = [x for x in base if DEAD_WORDS.search(x.lower())]
            have = {wset(x) for x in base if x not in dead}
            picks = []
            for cand in ladder(L):
                if len(picks) == len(dead):
                    break
                if wset(cand) in have:
                    continue
                have.add(wset(cand))
                picks.append(cand)
            assert len(picks) == len(dead), (lid, dead, picks)
            it = iter(picks)
            base = [next(it) if x in dead else x for x in base]
            replaced, added = dead, picks
        rows.append({
            "id": lid,
            "current_title": L["title"],
            "current_tags": L["tags"],
            "new_title": L["title"],
            "new_tags": base,
            "section_fix": None,
            "source": source,
            "replaced": replaced,
            "added": added,
        })
    return rows


def check(rows):
    errs = []
    P = {L["id"]: L for L in json.load(open(BEFORE))["listings"]}
    for r in rows:
        i, L, n = r["id"], P[r["id"]], r["new_tags"]
        tl = L["title"].lower()
        silver = "sterling silver" in tl or "925" in tl
        if r["new_title"] != L["title"] or r["current_tags"] != L["tags"]:
            errs.append(f"{i} başlık/önce hâli panelden farklı")
        if L["status"] != "active":
            errs.append(f"{i} aktif değil")
        if len(n) != 13 or len(set(n)) != 13 or len({wset(x) for x in n}) != 13:
            errs.append(f"{i} 13 tekil tag değil")
        nouns = sum(1 for x in n if NOUN_RE.search(x.lower()))
        if nouns < 9:
            errs.append(f"{i} yeni sette ürün adı az: {nouns}")
        ks = L["karats"] or [k for k in ("10", "14", "18") if re.search(rf"\b{k}k\b", tl)]
        for x in n:
            if len(x) > 20 or not TAG_RE.match(x):
                errs.append(f"{i} biçim: {x}")
            if DEAD_WORDS.search(x.lower()):
                errs.append(f"{i} ölü sözcük: {x}")
            # Metal çapraz yasak: gümüş listing'de gold, altın listing'de silver/sterling/925 olamaz.
            if silver and "gold" in x:
                errs.append(f"{i} gümüşte gold: {x}")
            if not silver and re.search(r"silver|sterling|\b925\b", x):
                errs.append(f"{i} altında gümüş: {x}")
            m = re.match(r"(10|14|18)k", x)
            if m and m.group(1) not in ks:
                errs.append(f"{i} satılmayan ayar: {x} ({ks})")
            for col in ("white", "rose"):
                if col in x.split() and col not in L["colors"]:
                    errs.append(f"{i} satılmayan renk: {x}")
        # ürün adı: listing'in kendi tipi
        pt = (L["product_type"] or "").lower()
        if pt:
            bad = [x for x in n if re.search(r"(anklet|bracelet|necklace|earring|ring)s?\b", x)
                   and not re.search(pt.rstrip("s"), x) and not (pt == "necklace" and "pendant" in x)
                   and not (pt == "ring" and re.search(r"\bband\b", x))]
            bad = [x for x in bad if not (pt == "ring" and re.search(r"\bring", x))]
            if bad:
                errs.append(f"{i} ürün adı uyumsuz ({pt}): {bad}")
    return errs


def main():
    rows = build()
    errs = check(rows)
    if errs:
        print("\n".join(errs))
        raise SystemExit(f"{len(errs)} kapı hatası, yazılmadı")
    for r in rows:
        print(f"{r['id']} [{r['source']}] {r['current_title'][:60]}\n   -> {r['new_tags']}")
    if "--check" in sys.argv:
        print("kapı temiz, --check: yazılmadı")
        return
    (DIR / "rebuild-matrix.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
    print(f"rebuild-matrix.json ({len(rows)} satır) yazıldı")


if __name__ == "__main__":
    main()
