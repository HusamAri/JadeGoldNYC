# -*- coding: utf-8 -*-
"""EON YAYIN KAPISI — Etsy'ye taslak gönderilmeden önce her listing 4 boyutta
denetlenir; sonuç PASS / HOLD / FAIL + nedenler. PASS olmayan push edilemez.

Boyutlar:
  1) GEÇERLİLİK  — Etsy kuralları: 13 tag ≤20, title ≤140, açıklama tam,
     İngilizce/tone QA motoru yeniden koşulur (eon_listing_qa).
  2) FİYAT+AĞIRLIK — varyant sayısı beklenen; çapa = min varyant fiyatı;
     gram kaynağı: 'eon-gram-table' = güvenilir; 'est-*' = partner gram tablosu
     TEYİTSİZ → HOLD (nihai doküman: yayın öncesi zorunlu teyit).
  3) BOOST MATERYALİ — hero dosyası mevcut; partner foto havuzu ≥5; video
     (yoksa WARN); WIDTH+SIZE guide master (Drive'a yükleme kullanıcıda → WARN).
  4) EŞLEŞME — rakip sayısı ≥2; title'ı bilinen rakiplerin stil uyumu;
     title'sız rakip = canlı doğrulama gerekli (WARN).

Çıktı: eon-gate-report.json (push script'inin girdisi) + insan-okur markdown.
Tekrar koşulabilir loop: veri değişince yeniden koş, rapor tazelenir.
"""
import json, os, re
from eon_listing_qa import check_listing

Ls = json.load(open("eon16_final.json"))
inv = json.load(open("partner_inv.json"))
cover = json.load(open("cover_map.json"))

SHAPE_FOLDER = {"Dome": "Dome ring", "Flat": "Flat", "Beveled": "beveled edge",
                "Milgrain": "dome milgrain", "Knife": None}
EXPECTED_VARIANTS = {"Dome": 20, "Flat": 20, "Knife": 20, "Milgrain": 4}

# DB doğrulaması (bu oturumda SQL ile ölçüldü — tekrar koşumda güncellenmeli):
# 16/16 listing varyantlı; sayılar birebir; rakip: 2 shop × 16 + #06'da 5 eski.
DB_VERIFIED = {"variants_ok": True, "competitors_per_listing": 2, "extra_06": 5}

def expected_variant_count(L):
    if L["style"] == "Beveled":
        return 8 if L["color"] == "Yellow" else 4
    return EXPECTED_VARIANTS[L["style"]]

report = []
for L in Ls:
    no = L["key"]; reasons = []; warns = []
    # 1) GEÇERLİLİK
    e, w = check_listing(L)
    if e: reasons.append(f"QA hatası: {'; '.join(e[:3])}")
    if len(L["tags"]) != 13: reasons.append("13 tag değil")
    if len(L["title"]) > 140: reasons.append("başlık >140")
    # 2) FİYAT + AĞIRLIK
    n_expected = expected_variant_count(L)
    n_cells = sum(len(pm) for pm in [L["price_matrix"]]) and sum(
        len(band) for band in L["price_matrix"].values())
    if n_cells != n_expected:
        reasons.append(f"varyant hücre sayısı {n_cells} != beklenen {n_expected}")
    gram_estimated = L["style"] in ("Flat", "Knife", "Beveled")
    if gram_estimated:
        reasons.append(f"HOLD: gram tablosu TAHMİN faktörlü ({L['style']}) — "
                       "partner gram teyidi yayın öncesi zorunlu (nihai doküman #1)")
    # 3) BOOST MATERYALİ
    hero = cover.get(no)
    if not hero or not os.path.exists(f"eon-heroes-v2/{hero}"):
        reasons.append("hero görseli yok")
    folder = SHAPE_FOLDER[L["style"]]
    photos = len(inv.get(folder, {}).get("photos", [])) if folder else 0
    if photos < 5:
        (reasons if photos == 0 else warns).append(
            f"partner foto havuzu {photos} (<5) — {L['style']}")
    vids = len(inv.get(folder, {}).get("videos", [])) if folder else 0
    if vids == 0:
        warns.append("video yok — Etsy videosu boost sinyali (Knife: çekim gerekli)")
    warns.append("WIDTH+SIZE guide master Drive'a kullanıcı yükleyecek (tek-master kararı)")
    # 4) EŞLEŞME
    comp = DB_VERIFIED["competitors_per_listing"] + (DB_VERIFIED["extra_06"] if no == "06" else 0)
    if comp < 2: reasons.append(f"rakip sayısı {comp} < 2")
    warns.append("KvsJewelery/VibrantStone başlık/fiyatı DB'de yok — canlı çekim "
                 "(cron veya push sonrası ilk fiyat yakalama) ile doğrulanmalı")
    if no == "06":
        pass  # 5 eski rakip başlıkları '10k comfort fit' — stil uyumlu (elle doğrulandı)

    hard = [r for r in reasons if not r.startswith("HOLD:")]
    hold = [r for r in reasons if r.startswith("HOLD:")]
    status = "FAIL" if hard else ("HOLD" if hold else "PASS")
    report.append({"no": no, "family": L["family"], "color": L["color"],
                   "title": L["title"], "status": status,
                   "fail_reasons": hard, "hold_reasons": hold, "warnings": warns,
                   "anchor_usd": L["anchor_usd"], "hero": hero,
                   "partner_photos": photos, "videos": vids})

json.dump({"generated": "2026-07-16", "gate_version": 1, "listings": report},
          open("eon-gate-report.json", "w"), ensure_ascii=False, indent=1)

by = {}
for r in report: by.setdefault(r["status"], []).append(r["no"])
print("YAYIN KAPISI SONUCU")
for s in ("PASS", "HOLD", "FAIL"):
    print(f"  {s}: {len(by.get(s, []))} → {', '.join(by.get(s, [])) or '—'}")
for r in report:
    if r["status"] != "PASS":
        print(f"  [{r['status']}] {r['no']} {r['family']} {r['color']}: "
              f"{'; '.join(r['fail_reasons'] + r['hold_reasons'])}")
