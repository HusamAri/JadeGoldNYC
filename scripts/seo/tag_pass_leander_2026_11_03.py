#!/usr/bin/env python3
"""Leander (by Artifact Studio Jewelry) tag geçişi (2026-11-03): ölü hediye/occasion/his-her/unisex
slotları, Jade Gold NYC'nin ÇALIŞAN etiket dilbilgisine (ayar + renk + model + ürün) çevrilir.

Neden: sahibin "JadeGoldNYC Working Tags Playbook" dokümanı (2026-11-02, 12 ay, 20.893 aramalı
ziyaret): hediye/occasion tag'leri 0 arama ziyareti (Gift for Him 13/13, Gift for Her 10/10 ölü),
unisex ve "good luck charm" ölü; çalışan 15 tag'in hepsi ayar/renk/model/ürün öbeği (14K Gold
Bracelet 916 ziyaret, Evil Eye Pendant 157, Gold Hoop Earrings 272, Mens Gold Bracelet 261).
Rapor Leander için açıkça "evil eye ve zincir bileklik merdivenlerini kopyala, gümüşte ayarın
yerine sterling silver" diyor. Playbook 03 kuralı (2026-11-02): tag'de hediye/occasion/his/unisex
sözcüğüne slot yok; istisna ürünün kendisi sezon parçasıysa.

BİLEREK dokunulmayan: "dainty / minimalist / everyday" gibi his (vibe) tag'leri. Jade'in alıcısı
erkek zincir alıcısı; Leander'ın mine ve halhal alıcısı kadın ve raporun Ophir notu "minimalist,
stackable, dainty'yi silmeden önce test et" diyor. Leander'ın kendi 30 günlük terimi 13 satır,
karar verdirmez. Bu slotlar 21 Kasım ölçümünden sonra ayrıca ele alınır.

Kaynak ("önce" hâli): docs/artifact-studio/seo/2026-11-03-tag-pass/panel-before.json (panel
aynası + varyantların satılan ayar/renk kümesi, 2026-11-03 19:34 UTC senkronu). Çıktı: aynı
klasörde apply-matrix.json (ops/seo-apply `?org=by Artifact Studio Jewelry&pass=tags-2026-11-03`)
+ report.md.

Kural: YALNIZ ölü slot değişir; başlık ve diğer tag'ler birebir kalır. Yeni tag merdiveni
listing'in ürünü, modeli, satılan ayarı ve rengi ile kurulur (aşağıda `ladder`); ilk N uygun
aday alınır (N = ölü slot sayısı; kelime kümesi zaten tag'lerde varsa atlanır). Adaylar ham arama
hacmine göre DEĞİL dilbilgisine göre sıralanır: eRank "gift for her"e 13.273 arama verir, Jade'de
aynı tag 0 ziyaret aldı; geniş terimin hacmi bir ürün sayfasına ulaşmaz. Hacim (Alura/eRank,
keyword-bank.json) yalnız raporda kanıt sütunu olarak gösterilir.

Kapsam dışı (report.md'de sayılır): taslak listing; Noel/kış koleksiyonu (sezon parçasında
"christmas gift" alıcının kendi ifadesi; EON 11-02 geçişiyle aynı karar); 2026-10-22 başlık
yazımından sonra elle düzenlenmiş listing'ler (sahibin tezgâhı; canlıda `live-changed` de atlar);
ölü slotu olmayanlar.

Kapı (biri düşerse çıktı YAZILMAZ): 13 tag, ≤20 kr, [a-z0-9 ], tekrar yok, kelime-kümesi tekrarı
yok (ring/rings aynı), korunan tag'ler sırasıyla birebir, başlık birebir, eklenen tag'de
hediye/occasion/his sözcüğü yok, renk tag'i yalnız o renk satılıyorsa, ayar tag'i yalnız o ayar
satılıyorsa, "silver" yalnız gümüş listing'de, "mens" yalnız başlıkta erkek varsa, "evil eye"
yalnız evil eye üründe.
Kullanım: python3 scripts/seo/tag_pass_leander_2026_11_03.py [--check]
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "docs/artifact-studio/seo/2026-11-03-tag-pass"
BEFORE = DIR / "panel-before.json"
PREV22 = ROOT / "docs/artifact-studio/seo/2026-10-22-title-pass/apply-matrix.json"
BANK = ROOT / "docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/keyword-bank.json"
SILVER = ROOT / "docs/artifact-studio/silver-chains/listings.json"

# Ölü sınıf: hediye / occasion / alıcı zamiri / unisex / "good luck" (Jade: Good Luck Charm ölü).
DEAD_WORDS = re.compile(
    r"\b(gift|gifts|present|anniversary|birthday|valentine|valentines|graduation|wedding gift|"
    r"him|her|hers|his|unisex|promise|couples|couple|boyfriend|girlfriend|groomsman|groomsmen|"
    r"bridesmaid|groom|bride|mom|dad|stocking stuffer|good luck|lucky)\b")
# Eklenen tag'de ayrıca his sözcüğü de olamaz (EON kapısıyla aynı liste).
VIBE_WORDS = re.compile(
    r"\b(minimalist|dainty|everyday|luxury|elegant|classic|modern|simple|timeless|boho|trendy|chic|"
    r"statement|delicate|unique|handmade|artisan|real|genuine|authentic|christmas|holiday)\b")
SEASONAL = re.compile(
    r"christmas|xmas|holiday|snowflake|pinecone|holly|wreath|mistletoe|poinsettia|candy cane|reindeer|"
    r"ornament|bauble|santa|gingerbread|stocking|nutcracker|sleigh|advent|bethlehem|garland|"
    r"\bwinter\b|frost|icicle|evergreen|fir tree|spruce|\bbow\b|ribbon", re.I)
TAG_RE = re.compile(r"^[a-z0-9 ]+$")
KARAT_ORDER = ["14", "10", "18"]  # Jade: 14k ve 10k neredeyse eşit, 14K Gold Bracelet en büyük tag; 18k nadir


def wset(tag):
    """Kelime kümesi; çoğul kopyası aynı sayılır (rings = ring, mens = men)."""
    return frozenset(w[:-1] if len(w) > 3 and w.endswith("s") else w for w in tag.lower().split())


def noun_of(L):
    t = L["title"].lower()
    pt = L.get("product_type") or ""
    # Panelin ürün tipi önce (09-23 dersi: eksen ürün tipiyle tutarlı olmalı); başlık yalnız tip boşsa.
    for n in ("anklet", "bracelet", "necklace", "earring", "ring", "brooch", "pendant"):
        if pt.startswith(n):
            return "earrings" if n == "earring" else n
    if "evil eye" in t and ("pendant" in t or "charm" in t) and "necklace" not in t:
        return "pendant"
    for n in ("anklet", "bracelet", "necklace", "earrings", "earring", "pendant", "ring", "brooch"):
        if re.search(rf"\b{n}s?\b", t):
            return "earrings" if n.startswith("earring") else n
    return None


def style_of(L):
    t = L["title"].lower()
    if "evil eye" in t:
        return "evil eye"
    for s in ("box chain", "rope chain", "cuban", "figaro", "franco", "mariner", "curb", "wheat",
              "herringbone", "paperclip", "snake chain", "cable chain"):
        if s in t:
            return s.replace(" chain", "")
    if "signet" in t:
        return "signet"
    if "cuff" in t or "bangle" in t:
        return "cuff"
    if "huggie" in t:
        return "huggie"
    if re.search(r"\bstud", t):
        return "stud"
    if "hoop" in t:
        return "hoop"
    if "enamel" in t:
        return "enamel"
    return None


def ladder(L):
    """Jade'in 13 slot şablonu (rapor §Playbook): ayar+ürün, solid+ürün, model+ürün, renk+ürün,
    mens+ürün, diğer isim. Yalnız bu listing için DOĞRU olan adaylar; 20 kr üstü yazılmaz."""
    t = L["title"].lower()
    noun = noun_of(L)
    style = style_of(L)
    silver = "sterling silver" in t or "925" in t
    mens = bool(re.search(r"\bmen'?s\b|\bfor men\b|\bmale\b", t))
    ks = L["karats"] or [k for k in KARAT_ORDER if re.search(rf"\b{k}k\b", t)]
    ks = [k for k in KARAT_ORDER if k in ks]
    colors = L["colors"]
    c = []
    n = noun or ""
    if silver:
        c += [f"silver {style} chain" if style and style not in ("evil eye", "signet", "cuff") else None,
              f"925 silver {n}", f"mens silver {n}" if mens else None, f"silver chain {n}",
              f"mens silver chain" if mens else None, f"sterling {n}", f"silver {n} men" if mens else None,
              f"925 sterling {n}"]
        return [x for x in c if x and len(x) <= 20]
    if style == "evil eye":
        # Jade: Evil Eye Pendant 157 ziyaret / 72 sipariş, 14K Gold Evil Eye 27, Evil Eye Necklace 21;
        # rapor Leander başlangıcı: evil eye bracelet/necklace/charm, gold evil eye, 14k gold evil eye, blue evil eye.
        c += [f"evil eye {n}" if n else None, "gold evil eye", "14k gold evil eye" if "14" in ks else None,
              "evil eye charm" if n in ("pendant", "necklace", "bracelet") else None,
              "blue evil eye" if "blue" in t else None, "red evil eye" if "red" in t else None,
              "evil eye jewelry", f"solid gold {n}" if n else None, f"14k gold {n}" if "14" in ks and n else None,
              f"10k gold {n}" if "10" in ks and n else None, f"gold {n} women" if n and not mens else None]
    else:
        c += [f"{k}k gold {n}" for k in ks if n]                       # ayar + ürün (Jade #1 kalıp)
        c += [f"solid gold {n}" if n else None]                        # malzeme + ürün (solid, real değil)
        c += [f"{ks[0]}k solid gold" if ks else None]
        if style in ("box", "rope", "cuban", "figaro", "franco", "mariner", "curb", "wheat", "herringbone", "paperclip", "cable"):
            c += [f"{style} chain {n}" if n else None, f"gold {style} chain", f"gold {style} {n}" if n else None,
                  f"gold chain {n}" if n in ("bracelet", "anklet", "necklace") else None]
        elif style == "signet":
            c += ["gold signet ring", "mens signet ring" if mens else None, "14k signet ring" if "14" in ks else None]
        elif style == "cuff":
            c += ["gold cuff bracelet", "mens gold cuff" if mens else None, "open cuff bracelet"]
        elif style == "huggie":
            c += ["gold huggie earrings", "huggie hoop earrings", "14k huggie earrings" if "14" in ks else None]
        elif style == "stud":
            c += ["gold stud earrings", "14k gold studs" if "14" in ks else None, "solid gold studs"]
        elif style == "hoop":
            c += ["gold hoop earrings", "14k gold hoops" if "14" in ks else None]
        elif style == "enamel":
            c += [f"gold enamel {n}" if n else None, f"enamel {n} gold" if n else None,
                  f"14k enamel {n}" if "14" in ks and n else None]
        if n == "anklet":
            c += ["gold chain anklet", "14k gold anklet" if "14" in ks else None]
        if n == "pendant":
            c += ["gold pendant necklace", "solid gold pendant"]
        if n == "necklace" and "pendant" in t:
            c += ["gold pendant necklace"]
    # renk + ürün: yalnız satılan renk (Jade: white ve rose yellow'dan 2-3 kat fazla yazılıyor)
    for col in ("white", "rose"):
        if col in colors and n:
            c += [f"{col} gold {n}", f"14k {col} gold" if "14" in ks else None]
    # hedef kitle: yalnız başlık erkek diyorsa (Jade: Mens Gold Bracelet 261, Gold Chain for Men 198)
    if mens and n:
        c += [f"mens gold {n}", f"gold {n} for men"]
    # diğer isim (Jade şablonu slot 11-12: aynı parça için alıcının diğer adı) + kadın kitle (slot 10)
    if n == "ring":
        c += ["solid gold band" if re.search(r"\bband\b", t) else None,
              "gold stacking ring" if "stack" in t else None, "14k stacking ring" if "stack" in t and "14" in ks else None,
              "gold band ring" if re.search(r"\bband\b", t) else None]
    if n == "bracelet":
        c += ["gold chain bracelet" if "chain" in t else None, "14k bracelet" if "14" in ks else None]
    if n == "necklace":
        c += ["gold chain necklace" if "chain" in t else None, "14k gold chain" if "14" in ks and "chain" in t else None,
              "solid gold chain" if "chain" in t else None]
    if n == "anklet":
        c += ["gold ankle bracelet", "solid gold anklet"]
    if n == "earrings":
        c += ["14k gold earrings" if "14" in ks else None, "solid gold earrings"]
    if n and not mens:
        c += [f"womens gold {n}", f"gold {n} women"]
    if "diamond" in t and n:
        c += [f"diamond {n}", "lab grown diamond" if "lab" in t else None, f"gold diamond {n}"]
    # yellow isteğe bağlı (Jade kural 4) ama yine ayar/renk kalıbı; en sona
    if "yellow" in colors and n:
        c += [f"yellow gold {n}", "14k yellow gold" if "14" in ks else None]
    for k in ks[1:]:
        c += [f"{k}k solid gold"]
    if n:
        c += [f"{k}k {n}" for k in ks]  # Jade: "14k bracelet" 17 ziyaret, ayar + ürün kısa hâli
    return [x for x in c if x and len(x) <= 20]


SHORT: list[str] = []


def build():
    data = json.load(open(BEFORE))
    t22 = {r["id"]: r for r in json.load(open(PREV22))}
    silver_titles = {v["title"] for v in json.load(open(SILVER)).values()}
    rows, skipped = [], []
    for L in data["listings"]:
        lid, title, tags = L["id"], L["title"], L["tags"]
        if L["status"] != "active":
            skipped.append((lid, "taslak", title))
            continue
        if not tags:
            skipped.append((lid, "0 tag", title))
            continue
        if SEASONAL.search(title) or any(re.search(r"christmas|holiday|xmas", x) for x in tags):
            skipped.append((lid, "Noel/kış koleksiyonu (sezon parçası, farklı alıcı)", title))
            continue
        dead = [x for x in tags if DEAD_WORDS.search(x.lower())]
        # Rapor kural 7: kelime sırası / çoğul kopyası da ölü slottur (Jade'de 13 slot böyleydi);
        # ilk görülen kalır, sonraki kopya değişir.
        seen = set()
        for x in tags:
            if x in dead:
                continue
            if wset(x) in seen:
                dead.append(x)
            seen.add(wset(x))
        if not dead:
            skipped.append((lid, "ölü slot yok", title))
            continue
        if lid in t22 and title != t22[lid]["new_title"]:
            skipped.append((lid, "2026-10-22 sonrası elle düzenlenmiş", title))
            continue
        # Gümüş zincirler (2026-10-27, docs/artifact-studio/silver-chains): panel başlığı repodaki
        # üreteç başlığı değilse sahip Etsy'de elle düzenlemiş (6/6 öyle; tag'leri de dış bir araçtan
        # gelen kelime salatası, slot takası değil yeniden kurulum ister) -> sahibe ayrı soru.
        if re.search(r"sterling silver|\b925\b", title, re.I) and title not in silver_titles:
            skipped.append((lid, "gümüş: 2026-10-27 sonrası elle düzenlenmiş (başlık + 13 tag), ayrı karar", title))
            continue
        have = {wset(x) for x in tags if x.lower() not in {d.lower() for d in dead}}
        picks = []
        for cand in ladder(L):
            if len(picks) == len(dead):
                break
            if wset(cand) in have:
                continue
            have.add(wset(cand))
            picks.append(cand)
        if len(picks) < len(dead):
            SHORT.append(f"{lid}: {len(dead)} ölü slot, {len(picks)} aday — {title}\n   dead={dead}\n   tags={tags}\n   ladder={ladder(L)}")
            continue
        it = iter(picks)
        dead_l = {d.lower() for d in dead}
        new_tags = [next(it) if x.lower() in dead_l else x for x in tags]
        rows.append({
            "id": lid,
            "current_title": title,
            "current_tags": tags,
            "new_title": title,
            "new_tags": new_tags,
            "section_fix": None,
            "replaced": dead,
            "added": picks,
            "noun": noun_of(L),
            "style": style_of(L),
            "karats": [k for k in KARAT_ORDER if k in (L["karats"] or [])],
            "colors": L["colors"],
        })
    return rows, skipped


def check(rows, skipped):
    errs = []
    before = {L["id"]: L for L in json.load(open(BEFORE))["listings"]}
    skipped_ids = {s[0] for s in skipped}
    for r in rows:
        i, t, n, L = r["id"], r["new_title"], r["new_tags"], before[r["id"]]
        tl = t.lower()
        if i in skipped_ids:
            errs.append(f"{i} hem satır hem atlanan")
        if t != r["current_title"] or t != L["title"]:
            errs.append(f"{i} başlık değişmiş")
        if r["current_tags"] != L["tags"]:
            errs.append(f"{i} önce hâli panelden farklı")
        if len(n) != 13:
            errs.append(f"{i} {len(n)} tag")
        if len(set(n)) != len(n):
            errs.append(f"{i} tekrar eden tag")
        if len({wset(x) for x in n}) != len(n):
            errs.append(f"{i} kelime kümesi tekrarı")
        for x in n:
            if len(x) > 20 or not TAG_RE.match(x):
                errs.append(f"{i} tag biçimi: {x}")
        dead_l = {d.lower() for d in r["replaced"]}
        kept_new = [x for x in n if x not in r["added"]]
        kept_old = [x for x in r["current_tags"] if x.lower() not in dead_l]
        if len(dead_l) != len(r["replaced"]):
            errs.append(f"{i} aynı ölü tag iki kez")
        if kept_new != kept_old:
            errs.append(f"{i} korunan tag'ler değişmiş")
        for x in r["replaced"]:
            is_copy = sum(1 for y in r["current_tags"] if wset(y) == wset(x)) > 1
            if not DEAD_WORDS.search(x.lower()) and not is_copy:
                errs.append(f"{i} ölü olmayan tag değiştirilmiş: {x}")
        silver = "sterling silver" in tl or "925" in tl
        mens = bool(re.search(r"\bmen'?s\b|\bfor men\b|\bmale\b", tl))
        ks = L["karats"] or [k for k in KARAT_ORDER if re.search(rf"\b{k}k\b", tl)]
        for a in r["added"]:
            if DEAD_WORDS.search(a) or VIBE_WORDS.search(a):
                errs.append(f"{i} eklenen tag'de ölü/his sözcüğü: {a}")
            for col in ("white", "rose"):
                if col in a and col not in L["colors"]:
                    errs.append(f"{i} satılmayan renk: {a} ({L['colors']})")
            m = re.match(r"(10|14|18)k", a)
            if m and m.group(1) not in ks:
                errs.append(f"{i} satılmayan ayar: {a} (panel {ks})")
            if ("silver" in a or "sterling" in a) != silver:
                errs.append(f"{i} metal uyumsuz: {a}")
            if "gold" in a and silver:
                errs.append(f"{i} gümüş listing'de gold tag: {a}")
            if "mens" in a.split() or a.endswith(" men"):
                if not mens:
                    errs.append(f"{i} başlık erkek demiyor: {a}")
            if "evil eye" in a and "evil eye" not in tl:
                errs.append(f"{i} evil eye değil: {a}")
            if a.lower() in dead_l:
                errs.append(f"{i} ölü tag eklenmiş: {a}")
        for x in n:
            if DEAD_WORDS.search(x.lower()):
                errs.append(f"{i} ölü tag kaldı: {x}")
    return errs


# Jade Gold NYC 12 ay (rapor "Working tags" tablosu): atanan arama ziyareti.
JADE_VISITS = {"14k gold bracelet": 916, "rose gold chain": 454, "14k rose gold": 164, "box chain bracelet": 208,
               "evil eye pendant": 157, "10k gold chain": 278, "gold hoop earrings": 272, "14k gold chain": 203,
               "gold rope chain": 175, "solid gold chain": 145, "gold box chain": 189, "10k gold rope chain": 150,
               "mens gold bracelet": 261, "gold chain for men": 198, "gold ring": 649}


def evidence(rows):
    bank = json.load(open(BANK))
    used = Counter(a for r in rows for a in r["added"])
    removed = Counter(x.lower() for r in rows for x in r["replaced"])

    def vol(k):
        b = bank.get(k, {})
        return (b.get("erank_avg_searches"), b.get("alura_volume"))

    out = ["| Tag | Slot | Jade 12 ay ziyaret | eRank avg searches | Alura volume |", "|---|---|---|---|---|"]
    for tag, c in removed.most_common():
        e, a = vol(tag)
        out.append(f"| ~~{tag}~~ | {c} | 0 (hediye/occasion sınıfı) | {e or '-'} | {a or '-'} |")
    for tag, c in used.most_common():
        e, a = vol(tag)
        out.append(f"| {tag} | {c} | {JADE_VISITS.get(tag, '-')} | {e or '-'} | {a or '-'} |")
    return "\n".join(out)


def main():
    rows, skipped = build()
    if SHORT:
        print("\n".join(SHORT))
        raise SystemExit(f"{len(SHORT)} listing'de aday yetmedi, çıktı yazılmadı")
    errs = check(rows, skipped)
    if errs:
        print("\n".join(errs))
        raise SystemExit(f"{len(errs)} kapı hatası, çıktı yazılmadı")
    slots = sum(len(r["replaced"]) for r in rows)
    prof = Counter((r["noun"], r["style"]) for r in rows)
    why = Counter(s[1] for s in skipped)
    rep = [
        "# Leander tag geçişi 2026-11-03 — rapor (üreteç çıktısı)",
        "",
        f"- Satır: {len(rows)} listing, {slots} slot değişir; başlık ve diğer {13 * len(rows) - slots} tag aynen.",
        f"- Atlanan: {len(skipped)} listing: " + ", ".join(f"{k} {v}" for k, v in why.most_common()) + ".",
        "",
        "## Kanıt (kaldırılan ~~üstü çizili~~, eklenen düz)",
        "",
        evidence(rows),
        "",
        "## Ürün / model → satır sayısı",
        "",
        *[f"- {n or '?'} / {s or 'düz'}: {c}" for (n, s), c in sorted(prof.items(), key=lambda kv: -kv[1])],
        "",
        "## Atlanan listing'ler",
        "",
        *[f"- {i} — {w}: {t}" for i, w, t in skipped],
        "",
    ]
    if "--check" in sys.argv:
        print("\n".join(rep[:4]))
        print("kapı temiz, --check: yazılmadı")
        return
    (DIR / "apply-matrix.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
    (DIR / "report.md").write_text("\n".join(rep))
    print("\n".join(rep[:4]))
    print(f"apply-matrix.json ({len(rows)} satır) ve report.md yazıldı")


if __name__ == "__main__":
    main()
