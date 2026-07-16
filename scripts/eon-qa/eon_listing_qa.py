"""EON listing QA motoru — deterministik denetimler (döngünün 'kural' bacağı).
Saf fonksiyon: girdi listing dict'leri, çıktı ihlal listesi. Ajan onarımından
sonra TEKRAR koşulur; boş liste = temiz. Etsy-algoritma zedeleyen desenler:
kök-tekrarı (slot israfı), başlık spam'i, tutarsız iddia, kanibalizasyon."""
import re
from collections import Counter

STOP={"for","the","and","with","a","of","to","in","or","her","him","his","hers"}
def roots(text):
    ws=re.findall(r"[a-z0-9]+", text.lower())
    return [w for w in ws if w not in STOP and len(w)>2]

TR_CHARS = set("çğıöşüÇĞİÖŞÜ")
TR_WORDS = {"ve","ile","icin","fiyat","varyasyon","gravur","beden","genislik",
            "ucretsiz","ayar","altin","yuzuk","kisisellestirme","secenek","tasiyici",
            "yok","farki","degistirmez","bos","birakilirsa"}
ROBOT_PHRASES = ["high quality","perfect gift for","don't miss","limited time",
                 "must have","best seller","top quality","100% satisfaction",
                 "look no further","we are proud","amazing","stunning piece"]

def check_english_human(L):
    """Uçtan uca İngilizce + insancıl EON sesi: Türkçe karakter/kelime = hata,
    kesik metin = hata, robotik pazarlama kalıbı / ünlem coşkusu = hata|uyarı."""
    errs=[]; warn=[]
    full = " ".join([L.get("title",""), " ".join(L.get("tags",[])),
                     L.get("description",""), L.get("setup_en","")])
    tr = sorted(set(c for c in full if c in TR_CHARS))
    if tr: errs.append(f"İngilizce-dışı (Türkçe) karakter: {tr}")
    ws = set(re.findall(r"[a-zçğıöşü]+", full.lower()))
    hits = sorted(ws & TR_WORDS)
    if hits: errs.append(f"Türkçe kelime kaldı: {hits}")
    d = L.get("description","").rstrip()
    if d and d[-1] not in ".!?]\"”'": errs.append(f"açıklama kesik bitiyor: '…{d[-40:]}'")
    if d.count("[") != d.count("]"): errs.append("köşeli parantez dengesiz — kesik not bloğu")
    s = L.get("setup_en","").rstrip()
    if s:
        if s[-1] not in ".!?": errs.append(f"setup_en kesik bitiyor: '…{s[-40:]}'")
        if sorted(set(c for c in s if c in TR_CHARS)): errs.append("setup_en içinde Türkçe karakter")
    low = full.lower()
    for p in ROBOT_PHRASES:
        if p in low: errs.append(f"robotik pazarlama kalıbı: '{p}'")
    ex = d.count("!")
    if ex: warn.append(f"ünlem {ex} adet — EON sesi sakin, gerekli mi?")
    return errs, warn

def check_listing(L, gamut=("10k","14k","18k")):
    """L: {key,title,tags[13],description,prices{...},widths[],karats[],setup_en}"""
    errs=[]; warn=[]
    eh_e, eh_w = check_english_human(L)
    errs += eh_e; warn += eh_w
    t=L.get("tags",[]); title=L.get("title",""); desc=L.get("description","")
    # ── TAG kuralları ──
    if len(t)!=13: errs.append(f"tag sayısı {len(t)} != 13")
    for x in t:
        if len(x)>20: errs.append(f"tag >20 karakter: '{x}' ({len(x)})")
        if not x.strip(): errs.append("boş tag")
        if re.search(r"[^A-Za-z0-9 '\-&]", x): warn.append(f"tag özel karakter: '{x}'")
    low=[x.lower().strip() for x in t]
    for x,c in Counter(low).items():
        if c>1: errs.append(f"birebir tekrar tag: '{x}' ×{c}")
    single=[x for x in low if " " not in x]
    if len(single)>4: errs.append(f"tek-kelime tag fazla: {len(single)}/13 ({', '.join(single[:5])}…)")
    rc=Counter()
    for x in low: rc.update(set(roots(x)))
    for w,c in rc.most_common():
        if c>=5: errs.append(f"kök-tekrarı (slot israfı): '{w}' {c} tag'de")
        elif c==4: warn.append(f"kök yoğun: '{w}' 4 tag'de")
    # ── BAŞLIK kuralları ──
    if len(title)>140: errs.append(f"başlık {len(title)} > 140")
    tw=Counter(roots(title))
    for w,c in tw.items():
        if c>2: errs.append(f"başlıkta kelime spam: '{w}' ×{c}")
    if title and not re.search(r"wedding band|ring", title.lower()):
        warn.append("başlıkta ürün tipi (wedding band/ring) yok")
    for bad in ["best","cheapest","free shipping","guarantee","cure"]:
        if bad in title.lower(): errs.append(f"başlıkta riskli iddia: '{bad}'")
    # ── KARAT/GAM tutarlılığı ──
    setup=L.get("setup_en","")
    kt=set(re.findall(r"\b(10k|14k|18k|9k|22k|24k)\b", (title+" "+desc+" "+setup).lower()))
    off=kt-set(k.lower() for k in L.get("karats",[]))
    if off: errs.append(f"metinde ürün dışı karat: {sorted(off)} (ürün: {L.get('karats')})")
    if "yaso" in (title+desc+setup).lower(): errs.append("Yaso markası metinde kaldı")
    if "plated" in desc.lower() and "not plated" not in desc.lower() and "never plated" not in desc.lower():
        warn.append("'plated' geçiyor — 'never plated' kalıbı dışında kullanım kontrol edilmeli")
    # ── GENİŞLİK/BEDEN iddia tutarlılığı ──
    mms=set(re.findall(r"\b([2-9])\s?mm\b", (title+" "+desc).lower()))
    declared=set(str(m) for m in L.get("widths",[]))
    if declared and mms and not mms.issubset(declared):
        errs.append(f"metinde varyantta olmayan mm: {sorted(mms-declared)} (varyant: {sorted(declared)})")
    return errs, warn

def check_cross(listings):
    """Kanibalizasyon + tekillik: başlıklar farklı, tag çakışması sınırlı."""
    errs=[]; warn=[]
    seen={}
    for L in listings:
        tt=L["title"].lower().strip()
        if tt in seen: errs.append(f"{L['key']} ve {seen[tt]} başlığı AYNI")
        seen[tt]=L["key"]
    for i,A in enumerate(listings):
        for B in listings[i+1:]:
            a=set(x.lower() for x in A["tags"]); b=set(x.lower() for x in B["tags"])
            ov=len(a&b)
            if ov>=9: errs.append(f"{A['key']}↔{B['key']} tag çakışması {ov}/13 (kanibalizasyon)")
            elif ov>=7: warn.append(f"{A['key']}↔{B['key']} tag çakışması {ov}/13")
    return errs, warn

if __name__=="__main__":
    # ── öz-test: bilinen-kirli senaryolar yakalanıyor mu ──
    bad={"key":"T","title":"Gold Gold Gold Wedding Band Best 18k Ring","karats":["14k"],
         "tags":["gold ring","gold ring","Gold Band Ring Extra Long Tag","ring","band","gold","cheap",
                 "gold rings","gold ring men","gold ring women","gold wedding ring","rose gold ring","white gold ring"],
         "description":"Yaso Jewelry 5mm plated ring", "widths":[3,4]}
    e,w=check_listing(bad)
    expect=["!= 13","tekrar","spam","riskli","18k","Yaso","mm","kök-tekrarı",">20","tek-kelime"]
    hits=[x for x in expect if any(x in s for s in e)]
    print(f"öz-test: {len(hits)}/{len(expect)} kirli desen yakalandı")
    for s in e: print("  E:",s)
    for s in w: print("  W:",s)
    ce,cw=check_cross([bad,{**bad,"key":"U"}])
    print("cross:",ce)
