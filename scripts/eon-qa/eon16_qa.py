# -*- coding: utf-8 -*-
"""16-listing QA: per-listing (eon_listing_qa.check_listing) + AİLE-FARKINDA cross.

Renk/karat kardeşleri (aynı ürünün rengi/karatı) BİLEREK aynı tag setini paylaşır
(doküman: 12 sabit + 1 renk etiketi) — bunlar kanibalizasyon değil, çünkü başlık +
renk etiketi ayrıştırır. Cross-check yalnız FARKLI ürün ailesi arasında ≥9 çakışmayı
hata sayar. Kardeşler için: başlıkta renk kelimesi + renk etiketi mevcut olmalı."""
import json, sys
from eon_listing_qa import check_listing

def group_key(L):  # ŞEKİL kardeşliği: Dome (14K+10K), Flat, Beveled, Milgrain, Knife.
    return L["style"]  # renk VE karat kardeşleri aynı gruba düşer (başlık+etiket ayrıştırır)

def run(listings):
    errs=[]; warn=[]
    for L in listings:
        e,w = check_listing(L)
        for x in e: errs.append(f"{L['key']} {L['family']} {L['color']}: {x}")
        for x in w: warn.append(f"{L['key']}: {x}")
        # kardeş ayrıştırma zorunlulukları
        if L["color"].lower() not in L["title"].lower():
            errs.append(f"{L['key']}: başlıkta renk kelimesi ('{L['color']}') yok — kardeş ayrışmaz")
        if L.get("color_tag") not in L["tags"]:
            errs.append(f"{L['key']}: renk etiketi ('{L.get('color_tag')}') tag setinde yok")
    # aileler-arası kanibalizasyon (farklı ürün ailesi ≥9 = hata)
    for i,A in enumerate(listings):
        for B in listings[i+1:]:
            if group_key(A)==group_key(B): continue  # kardeş: beklenen çakışma
            ov=len(set(t.lower() for t in A["tags"]) & set(t.lower() for t in B["tags"]))
            if ov>=9: errs.append(f"{A['key']}↔{B['key']} FARKLI aile tag çakışması {ov}/13")
            elif ov>=7: warn.append(f"{A['key']}↔{B['key']} farklı aile çakışma {ov}/13")
    # başlık tekilliği
    seen={}
    for L in listings:
        t=L["title"].lower().strip()
        if t in seen: errs.append(f"{L['key']} ve {seen[t]} başlığı AYNI")
        seen[t]=L["key"]
    return errs, warn

if __name__=="__main__":
    Ls=json.load(open("eon16_all.json"))
    e,w=run(Ls)
    print(f"listing sayısı: {len(Ls)}")
    print(f"HATA: {len(e)}")
    for x in e: print("  E:",x)
    print(f"UYARI: {len(w)}")
    for x in w[:40]: print("  W:",x)
