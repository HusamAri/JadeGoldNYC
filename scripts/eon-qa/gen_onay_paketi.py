# -*- coding: utf-8 -*-
"""Yayın-yargı loop kararından ONAY PAKETİ üretir (v2 — quick-win dahil).

Çıktılar:
  eon-onay-paketi.sql    — Supabase SQL Editor'da TEK seferde çalıştırılacak blok:
                           (1) 9 READY listingin quick-win tag setleri (tam-array SET),
                           (2) açıklama ekleri (fiyat/gram + damga + iade güveni),
                           (3) 04/06 sarkan-karşılaştırma tıraşı,
                           (4) ONAYLANDI damgası ('[EON NN · ' öneki KORUNUR —
                               push script stripInternalTrailer regex'i kırılmasın),
                           (5) archived_at düzeltmesi, (6) 0097 + 0098 migration,
                           (7) doğrulama SELECT'leri.
  eon-gate-report-v2.json — push script'in nihai girdisi (yalnız READY=PASS).
  eon16_approved.json     — yerel nihai içerik (tag+desc uygulanmış hali).

Emniyet: SQL yazılmadan ÖNCE değişmiş 16'lık set eon16_qa (deterministik motor)
ile koşulur; tek hata varsa paket üretilmez (fail-closed)."""
import json, sys
from eon16_qa import run as qa_run

ORG = "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0"
STAMP = "ONAYLANDI 2026-07-16"

karar = json.load(open("eon-yayin-karar.json"))
gate = json.load(open("eon-gate-report.json"))
listings = json.load(open("eon16_final.json"))
ready = set(karar["ready"])
byno = {L["key"]: L for L in listings}

# ── Quick-win tag setleri (gerçek DB tag'lerinden kurgulandı; niyet: 'anniversary'
# klonu çıkar, mm + karat kimliği + gravür farklılaştırıcısı gir, kardeş ayrış).
# Kurallar (eon_listing_qa): 13 tag, ≤20 karakter, kök ≤4 (band/ring/gold/wedding),
# tek-kelime ≤4, birebir tekrar yok. Aşağıdaki setler motora karşı doğrulanır.
TAGS = {
 "01": ["comfort fit band","domed wedding band","4mm wedding band","yellow gold band",
        "half round ring","classic wedding ring","14k gold ring","engraved gold ring",
        "mens comfort fit","heirloom jewelry","solid 14k gold","mens wedding jewelry",
        "unisex comfort fit"],
 "02": ["14k white gold band","comfort fit band","domed wedding band","5mm gold band",
        "half round ring","classic wedding ring","14k gold ring","engraved gold ring",
        "mens comfort fit","heirloom jewelry","mens wedding jewelry","unisex comfort fit",
        "domed half round"],
 "03": ["rose gold band","comfort fit band","domed wedding band","heirloom band",
        "3mm gold ring","classic wedding ring","14k gold ring","engraved gold ring",
        "mens comfort fit","heirloom jewelry","womens comfort fit","domed half round",
        "personalized jewelry"],
 "04": ["comfort fit band","domed comfort fit","half round band","10k solid gold",
        "domed wedding ring","mens wedding ring","7mm gold ring","promise ring",
        "10k wedding band","10k gold jewelry","free engraving","unisex comfort fit",
        "yellow gold band"],
 "05": ["comfort fit band","domed comfort fit","half round band","10k solid gold",
        "domed wedding ring","mens wedding ring","promise ring","10k white gold ring",
        "10k gold jewelry","free engraving","unisex comfort fit","white gold band",
        "5mm wedding band"],
 "06": ["comfort fit band","domed comfort fit","half round band","10k solid gold",
        "domed wedding ring","mens wedding ring","promise ring","10k rose gold ring",
        "10k gold jewelry","free engraving","unisex comfort fit","rose gold band",
        "6mm wedding band"],
 "13": ["milgrain band","beaded edge ring","vintage stacking","dainty stacking ring",
        "vintage wedding ring","heirloom ring","milgrain jewelry","dainty 14k jewelry",
        "vintage bridal","yellow gold band","2mm wedding band","thin wedding band",
        "free engraving"],
 "14": ["milgrain band","beaded edge ring","vintage stacking","dainty stacking ring",
        "vintage wedding ring","heirloom ring","milgrain jewelry","dainty 14k jewelry",
        "vintage bridal","white gold band","2mm gold band","thin gold band",
        "free engraving"],
 "15": ["milgrain band","beaded edge ring","vintage stacking","dainty stacking ring",
        "vintage wedding ring","heirloom ring","milgrain jewelry","dainty 14k jewelry",
        "vintage bridal","rose gold band","milgrain band 14k","beaded gold band",
        "free engraving"],
}
# 02 renk etiketi güçlendi — QA'in color_tag zorunluluğu için yerel alan da güncellenir.
COLOR_TAG_OVERRIDE = {"02": "14k white gold band"}

# ── Açıklama ekleri (THE DETAILS sonuna, footer'ın ÜSTÜNE; rakamlar eon_variants.sql
# birincil kanıtından: 14k 3mm B1=3.585g, 7mm B1=8.355g, 6mm B1=$1,015;
# 10k 3.155g / 7.355g / $670; Milgrain 2mm tek genişlik, B1=$315).
DOME14_ADD = (
 "- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.6 g and a 7mm around 8.4 g of solid 14k, so a 6mm begins near $1,015.\n"
 "- Stamped 14k inside the band.\n"
 "- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.")
DOME10_ADD = (
 "- Priced by width and size: the price shown is the 3mm band in sizes 4-6.5, and the dropdowns show your exact price before you order. Wider bands simply carry more gold - a 3mm starts around 3.2 g and a 7mm around 7.4 g of solid 10k, so a 6mm begins near $670.\n"
 "- Stamped 10k inside the band.\n"
 "- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.")
MILGRAIN_ADD = (
 "- Priced by ring size: the price shown covers sizes 4-6.5, and the dropdown shows your exact price before you order.\n"
 "- Stamped 14k inside the band.\n"
 "- Beyond complimentary resizing, exchanges are covered by our shop policies - message us first and we will make it right.")
DESC_ADD = {**{n: DOME14_ADD for n in ("01","02","03")},
            **{n: DOME10_ADD for n in ("04","05","06")},
            **{n: MILGRAIN_ADD for n in ("13","14","15")}}

SHAVE_OLD = "The same domed profile in solid 10k"
SHAVE_NEW = "A smooth domed profile in solid 10k"

# ── 1) Yerel simülasyon: değişiklikleri uygula, QA motorunu koştur (fail-closed) ──
def apply_local(L):
    no = L["key"]
    if no not in ready: return L
    L = dict(L)
    L["tags"] = TAGS[no]
    if no in COLOR_TAG_OVERRIDE: L["color_tag"] = COLOR_TAG_OVERRIDE[no]
    marker = f"\n\n---\n[EON {no} "
    assert L["description"].count(marker) == 1, f"{no}: footer marker {L['description'].count(marker)} kez"
    add = DESC_ADD[no]
    L["description"] = L["description"].replace(marker, "\n" + add + marker)
    if no in ("04","06"):
        assert SHAVE_OLD in L["description"], f"{no}: tıraş cümlesi bulunamadı"
        L["description"] = L["description"].replace(SHAVE_OLD, SHAVE_NEW)
    # damga: '[EON NN · ' öneki korunur (stripInternalTrailer + tüm LIKE anahtarları yaşar)
    L["description"] = L["description"].replace(f"[EON {no} · ", f"[EON {no} · {STAMP} · ")
    return L

approved = [apply_local(L) for L in listings]
errs, warns = qa_run(approved)
print(f"QA (değişiklik-sonrası 16 listing): HATA={len(errs)} UYARI={len(warns)}")
for e in errs: print("  E:", e)
if errs:
    sys.exit("QA HATALI — paket üretilmedi (fail-closed).")
# push-script regex emniyeti: footer hâlâ '\n---\n[EON ' ile başlıyor mu?
import re
for L in approved:
    if L["key"] in ready:
        assert re.search(r"\n---\n\[EON \d\d · ONAYLANDI", L["description"]), L["key"]
json.dump(approved, open("eon16_approved.json","w"), ensure_ascii=False, indent=1)

# ── 2) SQL paketi ──
def q(s):  # tek tırnak kaçışı
    return s.replace("'", "''")

def esc_lit(s):  # E'' literal: backslash + tırnak + newline
    return s.replace("\\", "\\\\").replace("'", "''").replace("\n", "\\n")

W = lambda no: (f"where org_id = '{ORG}' and status = 'draft' "
                f"and description like '%[EON {no} %'")
sql = [
"-- ============================================================",
"-- EON ONAY PAKETİ v2 — 2026-07-16 (yayın-yargı loop kararı: 9/9 READY)",
"-- Supabase Dashboard > SQL Editor'a TAMAMINI yapıştır, tek seferde çalıştır.",
"-- İçerik: quick-win tag setleri + açıklama ekleri + ONAYLANDI damgası",
"--         + archived_at düzeltmesi + 0097 (EBITDA) + 0098 (audit) migration.",
"-- Tümü idempotent: ikinci kez çalıştırmak zarar vermez.",
"-- ============================================================", "",
"begin;", "",
"-- ── 1) QUICK-WIN TAG SETLERİ (9 READY; motor-doğrulanmış 13'lük tam setler) ──",
"-- Niyet: 'anniversary' klonu 9/9 çıkar (Occasion attribute'u aramada tag gibi",
"-- eşleşir), mm sorgu kapsaması (3-7mm dağıtıldı), 10K/gravür kimliği, kardeş ayrışması.",
]
for no in sorted(ready):
    tags = ", ".join(f"'{q(t)}'" for t in TAGS[no])
    sql.append(f"update products set tags = array[{tags}]::text[] {W(no)};")
sql += ["",
"-- ── 2) AÇIKLAMA EKLERİ (THE DETAILS sonuna; footer eşleşme anahtarı bozulmaz) ──",
"-- Rakamlar varyant tablosundan: 14k 3mm≈3.6g / 7mm≈8.4g / 6mm $1,015;",
"-- 10k 3.2g / 7.4g / $670 (hepsi US 4-6.5 bandı). Idempotent ('Stamped' bekçisi).",
]
for no in sorted(ready):
    add = esc_lit("\n" + DESC_ADD[no] + f"\n\n---\n[EON {no} ")
    old = esc_lit(f"\n\n---\n[EON {no} ")
    sql.append(f"update products set description = replace(description, E'{old}', E'{add}') "
               f"{W(no)} and description not like '%Stamped 1_k inside%';")
sql += ["",
"-- ── 3) 04/06 sarkan karşılaştırma tıraşı ('The same' → bağımsız cümle) ──",
f"update products set description = replace(description, '{q(SHAVE_OLD)}', '{q(SHAVE_NEW)}') "
f"where org_id = '{ORG}' and status = 'draft' "
f"and (description like '%[EON 04 %' or description like '%[EON 06 %');", "",
"-- ── 4) ONAYLANDI DAMGASI — '[EON NN · ' öneki KORUNUR ki push script'in",
"--       stripInternalTrailer regex'i (\\n---\\n\\[EON ) ve tüm LIKE anahtarları yaşasın ──",
]
for no in sorted(ready):
    sql.append(f"update products set description = replace(description, '[EON {no} · ', '[EON {no} · {STAMP} · ') "
               f"{W(no)} and description not like '%ONAYLANDI%';")
sql += ["",
"-- ── 5) Arşiv düzeltmesi (retro-audit bulgusu: 10 eski taslak archived_at NULL) ──",
f"update products set archived_at = now() "
f"where org_id = '{ORG}' and status = 'archived' and archived_at is null;", "",
"-- ── 6) OPSİYONEL — beyaz altın cümlesi (02/05/14): partner cevabına göre AÇ ──",
"-- Rodyumsuz (doğal sıcak-beyaz) ise alttaki 3 satırın başındaki '-- ' kaldır;",
"-- rodyumluysa YAZMA (açıklamadaki 'never plated' iddiasıyla çelişir — önce metin kararı).",
]
WG_LINE = "- Our white gold is left unplated: a naturally warm white that never needs re-dipping."
for no in ("02","05","14"):
    if no not in ready: continue
    old = esc_lit(f"\n\n---\n[EON {no} ")
    add = esc_lit("\n" + WG_LINE + f"\n\n---\n[EON {no} ")
    sql.append(f"-- update products set description = replace(description, E'{old}', E'{add}') "
               f"{W(no)} and description not like '%unplated%';")
sql += ["", "commit;", "",
"-- ── 7) 0097 — İşletme kârı (EBITDA) migration (henüz uygulanmadıysa) ──",
open("../../supabase/migrations/0097_operating_profit.sql").read().strip(), "",
"-- ── 8) 0098 — competitor_watch audit trigger (idempotent sarmalandı) ──",
"drop trigger if exists audit on public.competitor_watch;",
"create trigger audit",
"  after insert or update or delete on public.competitor_watch",
"  for each row execute function public.audit_trigger();", "",
"-- ── 9) DOĞRULAMA (çalıştır, sonuçları kontrol et) ──",
"-- 9a. 9 listing: 13 tag + ONAYLANDI + eklenen bloklar yerinde mi?",
f"""select substring(description from '\\[EON (\\d\\d) ') as no,
       array_length(tags, 1) as tag_sayisi,
       description like '%ONAYLANDI%' as onaylandi,
       description like '%Stamped 1_k inside%' as damga_cumlesi,
       description like '%exchanges are covered%' as iade_cumlesi
from products
where org_id = '{ORG}' and status = 'draft' and description like '%[EON %'
order by 1;""", "",
"-- 9b. tag tekrar / uzunluk bekçisi (0 satır beklenir):",
f"""select p.id, t, count(*)
from products p, unnest(p.tags) as t
where p.org_id = '{ORG}' and p.status = 'draft' and p.description like '%[EON %'
group by p.id, t having count(*) > 1 or max(length(t)) > 20;""", "",
"-- 9c. 'anniversary' klonu 9 READY'de kalmadı mı? (0 beklenir):",
f"""select count(*) from products
where org_id = '{ORG}' and status = 'draft'
  and ('anniversary gift' = any(tags) or 'anniversary ring' = any(tags))
  and substring(description from '\\[EON (\\d\\d) ') in
      ({", ".join(f"'{n}'" for n in sorted(ready))});""", "",
"-- 9d. Milgrain gram doğrulaması (13-15 PUBLISH kapısı — rapor §4):",
f"""select p.title, pv.sku, pv.price_cents/100.0 as usd, pv.weight_grams
from product_variants pv join products p on p.id = pv.product_id
where p.org_id = '{ORG}'
  and (p.description like '%[EON 13 %' or p.description like '%[EON 14 %' or p.description like '%[EON 15 %')
order by p.title, pv.sku;""",
]
open("eon-onay-paketi.sql","w").write("\n".join(sql) + "\n")

# ── 3) Gate raporu v2: yalnız READY pushable ──
for L in gate["listings"]:
    if L["no"] in ready:
        L["status"] = "PASS"
        L["approved"] = STAMP
    elif L["status"] == "PASS":
        L["status"] = "FIX"
        L["fail_reasons"] = L.get("fail_reasons", []) + ["yayın-yargı loop'u READY vermedi (eon-yayin-karar.md)"]
gate["gate_version"] = 2
gate["judged_at"] = karar["judged_at"]
gate["decision"] = {"ready": sorted(ready), "source": "eon-yayin-karar.md", "workflow": karar["workflow"]}
json.dump(gate, open("eon-gate-report-v2.json","w"), ensure_ascii=False, indent=1)
print(f"paket hazır: {len(ready)} READY → eon-onay-paketi.sql + eon-gate-report-v2.json + eon16_approved.json")
