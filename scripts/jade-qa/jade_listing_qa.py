"""Jade Gold NYC listing QA motoru — deterministik denetimler.

`scripts/eon-qa/eon_listing_qa.py`'nin Jade kataloğuna uyarlanmışı. Saf
fonksiyon: girdi listing dict'leri, çıktı (hata, uyarı) listeleri. İçerik
düzeltildikten sonra TEKRAR koşulur; boş hata listesi = kapıdan geçer.

EON'dan farklar (neden):
  · Karat gamı 10K/14K (Jade 18K satmıyor) — metinde 18k geçmesi hata.
  · MATERYAL DÜRÜSTLÜĞÜ sert kural: marka "solid gold only" (plated/vermeil/
    gold-filled ASLA). Bu bir marka kuralı değil, iade/şikâyet kaynağı.
  · Ürün tipi sözlüğü zincir/kolye/bileklik/küpe/yüzük/kolye ucu.
  · ÖLÇEK dili kontrolü: mağazanın en sık şikâyeti "fotoğraftakinden küçük
    geldi" + "uzunluğa bail dahil". Açıklama ölçü/uzunluk netliği taşımalı.
  · Kanibalizasyon eşiği canlı katalog için: aynı tag setini paylaşan 10 çift
    tespit edilmişti (2026-08-01 SEO denetimi) — bu motor onu yakalar.

Kullanım:
    python3 jade_listing_qa.py            # öz-test
    python3 jade_listing_qa.py rows.json  # [{key,title,tags[],description,...}]
"""
import json
import re
import sys
from collections import Counter

STOP = {"for", "the", "and", "with", "a", "of", "to", "in", "or", "her", "him",
        "his", "hers", "your", "you"}


def roots(text):
    ws = re.findall(r"[a-z0-9]+", text.lower())
    return [w for w in ws if w not in STOP and len(w) > 2]


TR_CHARS = set("çğıöşüÇĞİÖŞÜ")
TR_WORDS = {"ve", "ile", "icin", "fiyat", "varyasyon", "gravur", "beden",
            "genislik", "ucretsiz", "ayar", "altin", "yuzuk", "kolye",
            "bileklik", "kupe", "zincir", "secenek", "yok", "bos"}

ROBOT_PHRASES = ["high quality", "perfect gift for", "don't miss",
                 "limited time", "must have", "best seller", "top quality",
                 "100% satisfaction", "look no further", "we are proud",
                 "amazing", "stunning piece", "elevate your", "timeless elegance"]

# Marka sözleşmesi: gerçek som altın. Bu kelimeler ürünü yanlış tanıtır.
FAKE_METAL = ["gold plated", "gold-plated", "vermeil", "gold filled",
              "gold-filled", "plated brass", "gold tone", "gold-tone",
              "stainless steel", "alloy"]

PRODUCT_WORDS = ["chain", "chains", "necklace", "necklaces", "bracelet",
                 "bracelets", "earring", "earrings", "hoop", "hoops", "stud",
                 "studs", "ring", "rings", "pendant", "pendants", "charm",
                 "anklet", "band"]

# Kök-tekrarı sayımından MUAF: malzeme/karat kelimeleri. Marka som altın
# sattığı için "gold" her tag'de geçebilir (canlı katalogda ort. 6,5/13) —
# bunu slot israfı saymak her temiz listing'i hatalı gösterirdi.
EXEMPT_ROOTS = {"gold", "10k", "14k", "solid", "real"}

RISKY_CLAIMS = ["best", "cheapest", "free shipping", "guarantee", "cure",
                "authentic guarantee", "lowest price"]


def check_english_human(L):
    """Uçtan uca İngilizce + insancıl marka sesi."""
    errs, warn = [], []
    full = " ".join([L.get("title", ""), " ".join(L.get("tags", [])),
                     L.get("description", "")])
    tr = sorted(set(c for c in full if c in TR_CHARS))
    if tr:
        errs.append(f"İngilizce-dışı (Türkçe) karakter: {tr}")
    ws = set(re.findall(r"[a-zçğıöşü]+", full.lower()))
    hits = sorted(ws & TR_WORDS)
    if hits:
        errs.append(f"Türkçe kelime kaldı: {hits}")
    d = L.get("description", "").rstrip()
    if d and d[-1] not in ".!?]\"”'":
        errs.append(f"açıklama kesik bitiyor: '…{d[-40:]}'")
    if d.count("[") != d.count("]"):
        errs.append("köşeli parantez dengesiz — kesik not bloğu")
    low = full.lower()
    for p in ROBOT_PHRASES:
        if p in low:
            errs.append(f"robotik pazarlama kalıbı: '{p}'")
    ex = d.count("!")
    if ex > 1:
        warn.append(f"ünlem {ex} adet — marka sesi sakin")
    return errs, warn


def check_material_honesty(L):
    """Marka sözleşmesi: som altın. Kaplama/dolgu dili ürünü yanlış tanıtır."""
    errs, warn = [], []
    text = (L.get("title", "") + " " + L.get("description", "") + " " +
            " ".join(L.get("tags", []) or []) + " " +
            " ".join(L.get("materials", []) or [])).lower()
    for bad in FAKE_METAL:
        if bad in text:
            errs.append(f"kaplama/dolgu dili (marka som altın satar): '{bad}'")
    # Karat beyanı: som altın iddiası karatsız kalmamalı.
    if "solid gold" in text and not re.search(r"\b(10k|14k)\b", text):
        warn.append("'solid gold' geçiyor ama karat (10K/14K) belirtilmemiş")
    return errs, warn


def check_scale_clarity(L):
    """En sık şikâyet: 'fotoğraftakinden küçük geldi' / uzunluğa bail dahil.

    Açıklama somut ölçü taşımalı: mm genişlik veya inç/cm uzunluk. Kolye ucu
    (pendant) satan listing'de bail'in uzunluğa dahil olup olmadığı YAZILMALI —
    bu tek cümle iade ve tek-yıldız üretiyor.
    """
    errs, warn = [], []
    d = L.get("description", "")
    dl = d.lower()
    title = L.get("title", "").lower()
    if not d:
        return errs, warn
    has_mm = bool(re.search(r"\b\d+(\.\d+)?\s?mm\b", dl))
    has_len = bool(re.search(r'\b\d+(\.\d+)?\s?(inch|inches|"|cm)\b', dl))
    if not has_mm and not has_len:
        errs.append("açıklamada somut ölçü yok (mm genişlik / inç-cm uzunluk) "
                    "— 'küçük geldi' şikâyetinin kaynağı")
    if "pendant" in title or "charm" in title:
        if "bail" not in dl:
            warn.append("kolye ucu ama 'bail' (askı) ölçüsü açıklanmamış — "
                        "uzunluk beklentisi kayıyor")
    return errs, warn


def check_listing(L, gamut=("10k", "14k")):
    """L: {key,title,tags[13],description,materials[],widths[]}"""
    errs, warn = [], []
    for fn in (check_english_human, check_material_honesty, check_scale_clarity):
        e, w = fn(L)
        errs += e
        warn += w

    t = L.get("tags", []) or []
    title = L.get("title", "")
    desc = L.get("description", "")

    # ── TAG kuralları ────────────────────────────────────────────────────
    if len(t) != 13:
        errs.append(f"tag sayısı {len(t)} != 13")
    for x in t:
        if len(x) > 20:
            errs.append(f"tag >20 karakter: '{x}' ({len(x)})")
        if not x.strip():
            errs.append("boş tag")
        if re.search(r"[^A-Za-z0-9 '\-&]", x):
            warn.append(f"tag özel karakter: '{x}'")
    low = [x.lower().strip() for x in t]
    for x, c in Counter(low).items():
        if c > 1:
            errs.append(f"birebir tekrar tag: '{x}' ×{c}")
    single = [x for x in low if " " not in x]
    if len(single) > 4:
        errs.append(f"tek-kelime tag fazla: {len(single)}/13 "
                    f"({', '.join(single[:5])}…)")
    # Kök-tekrarı eşiği CANLI KATALOGLA kalibre edildi (2026-08-13, 116 aktif
    # listing): "gold" 107 listingde ortalama 6,5 tag'de geçiyor (max 12) —
    # marka som altın sattığı için kaçınılmaz, muaf. Ürün tipi kelimeleri de
    # doğal olarak yoğun (bracelet ort. 9,4 / earrings 10,5) ama 13/13'te aynı
    # kelime gerçek slot israfıdır → yüksek eşik. Geri kalan kökler EON eşiğinde.
    rc = Counter()
    for x in low:
        rc.update(set(roots(x)))
    for w, c in rc.most_common():
        if w in EXEMPT_ROOTS:
            continue
        if w in PRODUCT_WORDS:
            if c >= 12:
                errs.append(f"ürün kelimesi {c}/13 tag'de: '{w}' — tag seti tek "
                            "kelimenin etrafında dönüyor, arama yüzeyi dar")
            elif c >= 10:
                warn.append(f"ürün kelimesi yoğun: '{w}' {c} tag'de")
            continue
        if c >= 5:
            errs.append(f"kök-tekrarı (slot israfı): '{w}' {c} tag'de")
        elif c == 4:
            warn.append(f"kök yoğun: '{w}' 4 tag'de")

    # ── BAŞLIK kuralları ─────────────────────────────────────────────────
    if len(title) > 140:
        errs.append(f"başlık {len(title)} > 140")
    if title and len(title) < 60:
        warn.append(f"başlık {len(title)} karakter — 140'lık bütçenin çoğu boş "
                    "(katalog ortalaması 58, aranan kelimeler dışarıda kalıyor)")
    tw = Counter(roots(title))
    for w, c in tw.items():
        if c > 2:
            errs.append(f"başlıkta kelime spam: '{w}' ×{c}")
    if title and not any(p in title.lower() for p in PRODUCT_WORDS):
        warn.append("başlıkta ürün tipi yok (chain/necklace/bracelet/…)")
    for bad in RISKY_CLAIMS:
        if bad in title.lower():
            errs.append(f"başlıkta riskli iddia: '{bad}'")
    caps = [w for w in title.split() if len(w) > 2 and w.isupper()]
    if len(caps) > 3:
        errs.append(f"başlıkta {len(caps)} BÜYÜK-HARF kelime (Etsy sınırı 3)")

    # ── KARAT/GAM tutarlılığı ────────────────────────────────────────────
    kt = set(re.findall(r"\b(9k|10k|14k|18k|22k|24k)\b",
                        (title + " " + desc).lower()))
    declared = set(k.lower() for k in (L.get("karats") or gamut))
    off = kt - declared
    if off:
        errs.append(f"metinde ürün dışı karat: {sorted(off)} (ürün: {sorted(declared)})")

    # ── GENİŞLİK iddia tutarlılığı ───────────────────────────────────────
    mms = set(re.findall(r"\b(\d+(?:\.\d+)?)\s?mm\b", (title + " " + desc).lower()))
    dw = set(str(m) for m in (L.get("widths") or []))
    if dw and mms and not mms.issubset(dw):
        errs.append(f"metinde varyantta olmayan mm: {sorted(mms - dw)} "
                    f"(varyant: {sorted(dw)})")
    return errs, warn


def check_cross(listings):
    """Kanibalizasyon: aynı mağazanın listingleri birbirini yemesin."""
    errs, warn = [], []
    seen = {}
    for L in listings:
        tt = L.get("title", "").lower().strip()
        if tt and tt in seen:
            errs.append(f"{L.get('key')} ve {seen[tt]} başlığı AYNI")
        seen[tt] = L.get("key")
    for i, A in enumerate(listings):
        for B in listings[i + 1:]:
            a = set(x.lower() for x in (A.get("tags") or []))
            b = set(x.lower() for x in (B.get("tags") or []))
            ov = len(a & b)
            if ov >= 11:
                errs.append(f"{A.get('key')}↔{B.get('key')} tag çakışması "
                            f"{ov}/13 — birebire yakın, kanibalizasyon")
            elif ov >= 9:
                warn.append(f"{A.get('key')}↔{B.get('key')} tag çakışması {ov}/13")
    return errs, warn


def _selftest():
    bad = {
        "key": "T",
        "title": "Gold Gold Gold PLATED CHAIN NECKLACE BEST Cheapest 18k",
        "karats": ["14k"],
        "tags": ["gold chain", "gold chain", "Gold Chain Necklace Extra Long",
                 "chain", "gold", "necklace", "cheap", "gold chains",
                 "gold chain men", "gold chain women", "gold rope chain",
                 "rose gold chain", "white gold chain"],
        "description": "Vermeil 9mm chain",
        "materials": ["gold filled"],
        "widths": [3, 4],
    }
    e, w = check_listing(bad)
    # Beklenen desenler: her biri gerçekten bu kirli listing'de var.
    expect = ["tekrar", "spam", "riskli", "18k", "mm",
              ">20", "kaplama", "BÜYÜK-HARF", "kesik"]
    hits = [x for x in expect if any(x in s for s in e)]
    print(f"öz-test: {len(hits)}/{len(expect)} kirli desen yakalandı")
    for s in e:
        print("  E:", s)
    for s in w:
        print("  W:", s)
    ce, _ = check_cross([bad, {**bad, "key": "U"}])
    print("cross:", ce)
    # Temiz listing hiç hata vermemeli (yanlış-pozitif kapısı).
    clean = {
        "key": "OK",
        "title": "14K Solid Gold Rope Chain Necklace, Diamond Cut Twisted Link",
        "karats": ["14k"],
        "tags": ["solid gold chain", "14k rope chain", "gold rope necklace",
                 "real gold necklace", "mens gold chain", "womens gold chain",
                 "diamond cut chain", "twisted link chain", "gift for him",
                 "layering necklace", "everyday necklace", "italian gold",
                 "fine jewelry gift"],
        "description": ("Solid 14K gold rope chain, 3mm wide and 20 inches long. "
                        "Diamond-cut links catch light from every angle."),
        "materials": ["14k solid gold"],
        "widths": [3],
    }
    ce2, cw2 = check_listing(clean)
    print(f"temiz listing hata sayısı: {len(ce2)} (0 olmalı)")
    for s in ce2:
        print("  BEKLENMEYEN E:", s)

    # Ürün-kelimesi eşiği: 13/13 tag'de aynı kelime = arama yüzeyi tek kelimeye
    # sıkışmış. Canlı katalogda ort. 9,4 olduğu için eşik 12; bu vaka onu aşar.
    narrow = {**clean, "key": "N",
              "tags": [f"gold bracelet {i}" for i in range(13)]}
    ne, _ = check_listing(narrow)
    narrow_ok = any("ürün kelimesi" in s for s in ne)
    print(f"dar-tag vakası yakalandı: {narrow_ok}")

    return len(ce2) == 0 and len(hits) == len(expect) and narrow_ok


if __name__ == "__main__":
    if len(sys.argv) > 1:
        rows = json.load(open(sys.argv[1]))
        total_e = 0
        for L in rows:
            e, w = check_listing(L)
            total_e += len(e)
            if e or w:
                print(f"\n── {L.get('key') or L.get('title', '')[:50]}")
                for s in e:
                    print("  E:", s)
                for s in w:
                    print("  W:", s)
        ce, cw = check_cross(rows)
        total_e += len(ce)
        for s in ce:
            print("  E:", s)
        for s in cw:
            print("  W:", s)
        print(f"\nTOPLAM HATA: {total_e} — kapı {'GEÇTİ' if total_e == 0 else 'KAPALI'}")
        sys.exit(0 if total_e == 0 else 1)
    sys.exit(0 if _selftest() else 1)
