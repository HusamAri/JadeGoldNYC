#!/usr/bin/env python3
"""docs/muhasebe belgelerini bu klasördeki doğrulanmış JSON'dan üretir.

Girdi (bu klasör, otomatik okunmaz):
  analysis-<boyut>.json  6 boyutta 88 senaryonun ilk analizi
  verdicts-<boyut>.json  her senaryonun çürütme kararı (amended_* alanları
                         analizdeki alanı EZER)
  canon.json             ayıklama: 9 bölüm, 44 kanonik senaryo, ayıklananlar
  ek.json, verdicts-ek.json  tamlık eleştirmeninin 5 ek senaryosu ve kararları
  checks-live.json       accounting_checks canlı çıktısı (5 org)
  olcumler.json          bağımsız ölçümler (D1..D13)

Çıktı: ../senaryo-matrisi.md, ../senaryolar/NN-<bolum>.md, ../kontrol-donguleri.sql

Elle düzenleme yapma: metni bu dosyada ya da JSON'da değiştir, sonra
  python3 -I docs/muhasebe/kaynak/render.py
"""
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DOC_DATE = "2026-11-09"
MEASURE_DATE = "2026-11-08"


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


A = {}
for path in sorted(glob.glob(os.path.join(HERE, "analysis-*.json"))):
    for s in load(os.path.basename(path))["scenarios"]:
        A[s["id"]] = s
V = {}
for path in sorted(glob.glob(os.path.join(HERE, "verdicts-*.json"))):
    for v in load(os.path.basename(path))["verdicts"]:
        V[v["id"]] = v
CANON = load("canon.json")
EK = load("ek.json")["scenarios"]
for s in EK:
    A[s["id"]] = s
CHECKS = load("checks-live.json")["rows"] if os.path.exists(os.path.join(HERE, "checks-live.json")) else []
# Denetim düzeltmeleri: kaynak kayda dokunmadan üstüne uygulanır.
#   text:    {"id", "field", "find", "replace", "why"}  alan metninde birebir değiştirme
#   sql:     {"id", "sql", "measure", "why"}            kontrol sorgusu ve ölçümü
#   measure: {"id", "measure", "why"}                   yeniden ölçüm satırı
FIX = load("duzeltmeler.json") if os.path.exists(os.path.join(HERE, "duzeltmeler.json")) else {}
FIX_TEXT = {}
for f in FIX.get("text", []):
    FIX_TEXT.setdefault((f["id"], f["field"]), []).append(f)
FIX_SQL = {f["id"]: f for f in FIX.get("sql", [])}
FIX_MEASURE = {f["id"]: f for f in FIX.get("measure", [])}
#   post:    {"file", "find", "replace", "why"}          üretilmiş dosyada birebir değiştirme;
#            find dosyada TAM BİR KEZ geçmeli (denetçinin kopyaladığı metin)
FIX_POST = FIX.get("post", [])
APPLIED = set()


def write_out(rel, text):
    for f in FIX_POST:
        if f["file"] != rel:
            continue
        n = text.count(f["find"])
        if n != 1:
            raise SystemExit("post düzeltme %s: find %d kez geçiyor: %r" % (rel, n, f["find"][:90]))
        text = text.replace(f["find"], clean(f["replace"]))
        APPLIED.add(id(f))
    with open(os.path.join(ROOT, rel), "w", encoding="utf-8") as fh:
        fh.write(text)
ORG_IDS = load("olcumler.json")["org_ids"]

# ── yazım temizliği (kurallar: em/en dash yok, şapka yok, "ve" önünde virgül yok)
def clean(s):
    if s is None:
        return ""
    s = str(s)
    s = s.replace("—", ":").replace("–", "-")
    s = s.replace("â", "a").replace("Â", "A").replace("î", "i").replace("û", "u")
    s = re.sub(r",\s+ve\s", " ve ", s)
    return s.strip()


def one_line(s):
    return re.sub(r"\s+", " ", clean(s)).strip()


def cell(s):
    return one_line(s).replace("|", "/")


def org_sql(sql):
    """Sabit org uuid'lerini ada göre alt sorguyla değiştirir (kopyala çalıştır)."""
    for name, uid in ORG_IDS.items():
        sub = "(select id from organizations where name = '%s')" % name.replace("'", "''")
        sql = sql.replace("'%s'::uuid" % uid, sub).replace("'%s'" % uid, sub)
    return sql


# ── canlı kontroller ve senaryo bağı
LIVE = [
    ("K1", "ledger_balance_break", "SIS-02",
     "açılış + toplam tutar = kapanış; açılış ve kapanış ilk ve son saniyedeki zincir ucundan seçilir (aynı saniyedeki satır sırası API'den gelmez)"),
    ("K2", "refund_backlog", "IAD-01", "iadeli ve 2 günden eski siparişte iade tutarı okunmuş (refunds_synced_at dolu)"),
    ("K3", "refund_status_mismatch", "IAD-01",
     "ledger iade sinyali olan sipariş iade ya da iptal statüsünde ve okunan tutar köprülü ledger tutarından en çok $1 farklı; sinyal aynı saniye vergi köprüsü, siparişin vergi iadesi ya da vergisiz siparişte işlem ücreti iadesi"),
    ("K4", "order_fee_gap", "UCR-01, UCR-02, UCR-03, UCR-04",
     "siparişe ait ledger ücretleri toplamı = sales.etsy_fees_cents toplamı (tolerans $5 ya da yüzde 0,2)"),
    ("K5", "cancelled_order_cogs", "MAL-02", "kargo kanıtı olmayan iptal siparişte satış maliyeti 0; tahsil edilmiş siparişte yalnız kanıtın aranabildiği dönemde (ShipStation penceresi ya da kargo bilgisiyle okunmuş receipt)"),
    ("K6", "ledger_type_unknown", "SIS-01", "her ledger türü etsy_ledger_type_classes sözlüğünde"),
    ("K7", "ledger_cost_drift", "SIS-01",
     "son 12 tam ayda aylık ledger gideri (ücret, reklam, kargo, abonelik) = etsy_ledger gider satırları (tolerans $1)"),
    ("K8", "ads_spend_unmeasured", "RKL-01",
     "son Etsy Ads harcama günü (ledger günü eksi 1) ile son CSV günü arası en çok 14 gün; tutar yarım son CSV gününü de sayar"),
    ("K9", "shipstation_sync_failing", "SEV-03", "bağlı ShipStation son 3 günde hatasız senkronlandı"),
    ("K10", "labels_unlinked", "SEV-01", "son 90 günde her Etsy etiketi bir siparişe bağlı"),
    ("K11", "chargeback_unlinked", "IAD-04", "her CHARGEBACK_DEBIT bir siparişe bağlı"),
    ("K12", "ledger_stale", "SIS-02", "ledger'ın son kaydından 3 günden sonra panele yazılmış Etsy satışı yok; her gün kayıt alan mağazada mağaza fotoğrafı ledger'dan en çok 5 gün ileride"),
    ("K13", "postage_double_count", "SEV-02",
     "ShipStation gider satırları toplamı = iptal edilmemiş gönderilerin postaj ve sigorta toplamı (tolerans $1)"),
    ("K14", "cogs_source_conflict", "MAL-01",
     "elle ya da faturayla maliyetlenmiş kalemde aynı türde motor (gold_auto) satırı yok"),
]
LIVE_BY_KEY = {k: (no, cids) for no, k, cids, _ in LIVE}
CID_TO_LIVE = {}
for no, key, cids, _ in LIVE:
    for cid in [c.strip() for c in cids.split(",")]:
        CID_TO_LIVE.setdefault(cid, []).append("%s `%s`" % (no, key))


KEY_RX = re.compile(r"\b(?:alert(?:_key)?|uyarı anahtarı)\s+`?([a-z][a-z0-9_]{3,})")


def control_label(c):
    live = CID_TO_LIVE.get(c["cid"])
    if live:
        return "canlı: " + ", ".join(live)
    if c.get("alert_key"):
        return "öneri: `%s`" % c["alert_key"]
    # Önce düzeltilmiş kontrol metni; anahtar orada yazmıyorsa özgün senaryonunki.
    sid = c["primary_id"]
    for loop in (field(sid, "control_loop"), clean(A[sid].get("control_loop", ""))):
        m = KEY_RX.search(loop)
        if m:
            return "öneri: `%s`" % m.group(1)
    return "öneri: ayrıntıda (anahtarsız)"


def measure_date(sid):
    """Ana senaryolar 2026-11-08'de, ek senaryolar 2026-11-09'da ölçüldü."""
    return DOC_DATE if sid.startswith("EK-") else MEASURE_DATE


# ── ek senaryoları kanonik listeye kat (çürütülen ek ayıklanır)
SECTIONS = sorted(CANON["sections"], key=lambda s: s["order"])
SEC_BY_KEY = {s["key"]: s for s in SECTIONS}
canonical = [dict(c) for c in CANON["canonical"]]
pruned = list(CANON["pruned"])
used = {}
for c in canonical:
    m = re.match(r"^([A-Z]+)-(\d+)$", c["cid"])
    used[m.group(1)] = max(used.get(m.group(1), 0), int(m.group(2)))
for s in EK:
    v = V.get(s["id"])
    if v and v["verdict"] == "refuted":
        pruned.append({"id": s["id"], "reason": "ek senaryo çürütüldü: " + one_line(v["reason"])})
        continue
    sec = SEC_BY_KEY.get(s["section"], SECTIONS[-1])
    n = used.get(sec["prefix"], 0) + 1
    used[sec["prefix"]] = n
    canonical.append({
        "cid": "%s-%02d" % (sec["prefix"], n), "section": sec["key"], "title": s["title"],
        "primary_id": s["id"], "merged_ids": [s["id"]], "lanes": s["lanes"],
        "priority": (v or {}).get("amended_priority") or s["priority"], "effort": s["effort"],
        "why": ("Tamlık eleştirmeninin bulduğu eksik sınıf; senaryo ayrı yazıldı ve ayrıca çürütüldü."
                if v else "Tamlık eleştirmeninin bulduğu eksik sınıf; senaryo ayrı yazıldı, çürütmesi bekliyor."),
    })
CANON_BY_CID = {c["cid"]: c for c in canonical}

# 0179 canlıya çıktıktan sonra değişen durum: çürütme 0178 zamanında yapıldı,
# bu notlar o kararın üstüne bugünkü gerçeği ekler (ölçüm 2026-11-09).
NOTES_0179 = {
    "SIS-02": ("Ledger bakiye zinciri ve tazeliği: K1 0179 ile düzeldi, aylık ekstre ikinci kaynak",
               "K1 açılış ve kapanışı ilk ve son saniyedeki zincir ucundan seçiyor: sağlam veride sahte kırılma 0 (Jade son 91 gün: 0178 kuralı 13 gün), kayıp satır artık maskelenmiyor (taslaktaki aday kümesi kuralı EON'da her gün maskeliyordu). K12 `ledger_stale` eklendi: ledger'ın son kaydından 3 günden sonra panele yazılmış Etsy satışı ya da her gün kayıt alan mağazada 5 günden ileri mağaza fotoğrafı yanar; 5 org'da yeşil. Kalan iş aylık ekstre içe aktarımı ve bakiye yüzeyi."),
    "IAD-01": (None, "K3 vergi iadesi bir saniye sonra yazılan siparişi de sayıyor; vergili siparişte tek başına işlem ücreti iadesi bir ücret kredisidir, iade sayılmaz (Jade 4062133504). Bugün Jade 5 sipariş $1.803,65, EON 4 sipariş $2.448,80. Bu siparişleri yeniden okuyan buton yok: \"İade verisini çek\" yalnız iade statüsündeki siparişleri okur. LED-15 satırındaki K5 varsayımı da kalktı: K5 kargo kanıtını pozitif arıyor (MAL-02)."),
    "MAL-02": (None, "K5 kargo kanıtını pozitif arıyor ve tahsil edilmiş siparişi yalnız kanıtın aranabildiği dönemde sayıyor: Jade 516 sipariş $280.517,60; 319'u hiç tahsil edilmedi ($162.391,17), 197'si tahsil edilip ShipStation penceresinde kargo kaydı yok ($118.126,43). Kargo kaydı tutulmayan dönemde (2024-12-07 öncesi ve 2026-07-09 sonrası) 225 sipariş $98.964,40 bilinmiyor, sayılmaz; kargolu 74 iptal ($35.410,48) de sayılmaz. İşletme Karı kartının 6 aylık penceresine düşen kısım $8.785,66. 0179 Etsy kargo kaydı tablosunun (sale_shipments) kısmi tekil indeksini düzeltti: senkron yazımı 42P10 ile düşüyordu, tablo 0 satırdı."),
    "RKL-01": (None, "K8 ledger günü d+1 = CSV günü d kaymasını ve yarım son CSV gününü birlikte modelliyor: Jade $4.706,21, EON $595,26 ölçülmemiş harcama; Ophir ve Artifact'ta CSV hiç yok."),
    "SEV-02": (None, "K13 `postage_double_count` eklendi (kritik): Jade ShipStation gider satırları $24.882,40, iptal edilmemiş gönderilerin postaj ve sigorta toplamı $12.605,14, fark $12.277,26. ShipStation bağlantısı düzelince ilk başarılı senkron aylık özeti yeniden kurar ve fark kapanır."),
    "MAL-01": (None, "K14 `cogs_source_conflict` eklendi (kritik): EON 10 kalemde (8 faturalı, 2 elle; 16 fatura ve 4 elle tür çifti) motor maliyeti de sayılıyor, $2.297,32; 18 fatura satırının türü boş."),
    "SEV-01": (None, "0179 Etsy kargo kaydı tablosunun (sale_shipments) tekil indeksini düzeltti; senkron receipt'i yeniden okudukça gönderi kayıtları dolar ve etiket bağı için ikinci kaynak olur."),
}
for cid, (title, _) in NOTES_0179.items():
    if title and cid in CANON_BY_CID:
        CANON_BY_CID[cid]["title"] = title


def apply_text(sid, name, text):
    for f in FIX_TEXT.get((sid, name), []):
        if f["find"] not in text:
            raise SystemExit("düzeltme bulunamadı: %s.%s: %r" % (sid, name, f["find"][:80]))
        text = text.replace(f["find"], clean(f["replace"]))
        APPLIED.add(id(f))
    return text


def no_dangling(sid, name, text):
    """Düzeltilmiş metin okurun göremediği özgün metne gönderme yapamaz."""
    if REF_RX.search(text):
        raise SystemExit("%s.%s özgün metne gönderme yapıyor (%r); duzeltmeler.json ile doldur"
                         % (sid, name, REF_RX.search(text).group(0)))
    return text


def field(sid, name):
    """Çürütücünün amended_* alanı analizdeki alanı ezer; sonra denetim düzeltmesi."""
    v = V.get(sid, {})
    out = apply_text(sid, name, clean(v.get("amended_" + name) or A[sid].get(name, "")))
    return no_dangling(sid, name, out) if v.get("amended_" + name) else out


def money(sid):
    v = V.get(sid, {})
    out = apply_text(sid, "money", clean(v.get("amended_money") or A[sid].get("money_at_stake", "")))
    return no_dangling(sid, "money", out) if v.get("amended_money") else out


# "senaryodaki gibi" türü gönderme duzeltmeler.json ile özgün içerikle doldurulur;
# kalırsa üreteç durur.
REF_RX = re.compile(r"senaryodaki (?:gibi|kolonlar)")


def orig_ref(sid, name, orig_name=None):
    """Çürütücü özgün metni "Doğrulandı:" diye yalnız kaynak satırlarına indirdiyse
    doğrulanan özgün metin de gösterilir; yoksa açıklaması kaybolur."""
    am = (V.get(sid, {}).get("amended_" + name) or "").strip()
    if not am.startswith("Doğrulandı:"):
        return None
    orig = clean(A[sid].get(orig_name or name, ""))
    if not orig:
        raise SystemExit("%s.%s 'Doğrulandı:' diyor ama özgün metin yok" % (sid, name))
    return ("  - **Doğrulanan özgün metin** (yukarıdaki satır kaynak satırlarını ve eki verir): "
            + apply_text(sid, "orig_" + name, orig))


def verdict_line(sid):
    v = V.get(sid)
    if not v:
        return "henüz çürütülmedi"
    word = {"confirmed": "doğrulandı", "amended": "düzeltilerek doğrulandı", "refuted": "çürütüldü"}[v["verdict"]]
    return "%s. %s" % (word, apply_text(sid, "reason", clean(v["reason"])))


def render_block(c):
    sid = c["primary_id"]
    a = A[sid]
    lines = ["### %s %s" % (c["cid"], one_line(c["title"])), ""]
    meta = "**Öncelik:** %s · **Efor:** %s · **Şerit:** %s · **Kontrol:** %s" % (
        c["priority"], c["effort"], ", ".join(c["lanes"]), control_label(c))
    lines.append("- " + meta)
    others = [i for i in c["merged_ids"] if i != sid]
    lines.append("- **Kaynak senaryo:** %s%s" % (sid, (" (birleşenler: %s)" % ", ".join(others)) if others else ""))
    lines.append("- **Durum:** " + apply_text(sid, "scenario", clean(a["scenario"])))
    lines.append("- **Etsy kaynağı:** " + apply_text(sid, "etsy_source", clean(a["etsy_source"])))
    for label, name in (("Panel bugün", "panel_today"), ("Boşluk", "gap"), ("Alan", "field"),
                        ("Kontrol döngüsü", "control_loop")):
        lines.append("- **%s:** %s" % (label, field(sid, name)))
        ref = orig_ref(sid, name)
        if ref:
            lines.append(ref)
    res = apply_text(sid, "control_sql_result", clean(V.get(sid, {}).get("control_sql_result", "")))
    if res:
        lines.append("- **Ölçüm %s:** %s" % (measure_date(sid), res))
    m = FIX_MEASURE.get(sid) or FIX_SQL.get(sid)
    if m and m.get("measure"):
        lines.append("- **Yeniden ölçüm %s:** %s" % (DOC_DATE, clean(m["measure"])))
        APPLIED.add(id(m))
    lines.append("- **Para etkisi:** " + money(sid))
    ref = orig_ref(sid, "money", "money_at_stake")
    if ref:
        lines.append(ref)
    lines.append("- **Çürütme:** " + verdict_line(sid))
    lines.append("- **Neden bu öncelik:** " + clean(c["why"]))
    if c["cid"] in NOTES_0179:
        lines.append("- **0179 sonrası (%s):** %s" % (DOC_DATE, NOTES_0179[c["cid"]][1]))
    for o in others:
        ov = V.get(o, {})
        extra = []
        if ov.get("amended_field"):
            extra.append("Alan önerisi: " + clean(ov["amended_field"]))
        if ov.get("amended_control_loop"):
            extra.append("Kontrol önerisi: " + clean(ov["amended_control_loop"]))
        lines.append("- **%s %s:** %s%s" % (o, one_line(A[o]["title"]), verdict_line(o),
                                            (" " + " ".join(extra)) if extra else ""))
    lines.append("")
    return "\n".join(lines)


def section_file(i, sec):
    return "senaryolar/%02d-%s.md" % (i + 1, sec["key"])


# ── bölüm dosyaları
section_items = {s["key"]: [c for c in canonical if c["section"] == s["key"]] for s in SECTIONS}
for i, sec in enumerate(SECTIONS):
    items = section_items[sec["key"]]
    out = ["# %s" % sec["title"], "",
           "_Muhasebe senaryo matrisinin bölümü (%s önekli senaryolar). Dizin, model ve uygulama sırası: [../senaryo-matrisi.md](../senaryo-matrisi.md). Elle düzenleme yapma; üreteç `kaynak/render.py`._" % sec["prefix"],
           "", clean(sec["intro"]), "",
           "| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |",
           "| --- | --- | --- | --- | --- | --- |"]
    for c in items:
        out.append("| %s | %s | %s | %s | %s | %s |" % (
            c["cid"], cell(c["title"]), c["priority"], c["effort"], ", ".join(c["lanes"]), cell(control_label(c))))
    out.append("")
    for c in items:
        out.append(render_block(c))
    write_out(section_file(i, sec), "\n".join(out).rstrip() + "\n")

# ── kontrol sorguları
def sql_of(sid):
    v = V.get(sid, {})
    if sid in FIX_SQL:
        APPLIED.add(id(FIX_SQL[sid]))
        return org_sql(clean(FIX_SQL[sid]["sql"])).rstrip().rstrip(";").rstrip()
    sql = v.get("amended_control_sql") or A[sid].get("control_sql") or ""
    sql = org_sql(clean(sql)).rstrip().rstrip(";").rstrip()
    return sql


sql_out = [
    "-- Muhasebe kontrol döngüleri: elle koşulabilir sorgular (%s)" % DOC_DATE,
    "--",
    "-- Bu dosya docs/muhasebe/senaryo-matrisi.md senaryolarının kontrol sorgularıdır.",
    "-- Hepsi salt okunur tek SELECT'tir; Supabase SQL editöründe ya da MCP ile",
    "-- tek tek koşulur. Org seçimi ada göre alt sorguyla yapılır: başka mağaza",
    "-- için adı değiştir. Her bloğun başlığında senaryo kimliği, canlı kontrol",
    "-- (accounting_checks K numarası) ya da önerilen uyarı anahtarı ve",
    "-- ölçümü yazar (ana senaryolar %s, ek senaryolar %s); beklenen değer" % (MEASURE_DATE, DOC_DATE),
    "-- sorgunun kendi yorum satırındadır.",
    "-- Üreteç: docs/muhasebe/kaynak/render.py (elle düzenleme yapma).",
    "",
    "-- 0) Canlı kontroller tek çağrıda (0178, 0179): yalnız başarısızlar",
    "select o.name, c.check_key, c.severity, c.count_n, c.amount_cents, c.title",
    "from organizations o cross join lateral accounting_checks(o.id) c",
    "where not c.ok",
    "order by o.name, c.severity, c.check_key;",
    "",
]
for i, sec in enumerate(SECTIONS):
    sql_out.append("-- ==== %d. %s (%s) ====" % (i + 1, sec["title"], sec["prefix"]))
    sql_out.append("")
    for c in section_items[sec["key"]]:
        for sid in c["merged_ids"]:
            sql = sql_of(sid)
            if not sql:
                continue
            res = one_line(V.get(sid, {}).get("control_sql_result", "")) or "ölçülmedi"
            m = FIX_SQL.get(sid) or FIX_MEASURE.get(sid)
            if m and m.get("measure"):
                res = "%s; yeniden ölçüm %s: %s" % (res, DOC_DATE, one_line(m["measure"]))
                APPLIED.add(id(m))
            head = "-- %s %s | kaynak %s | kontrol: %s | ölçüm %s: %s" % (
                c["cid"], one_line(c["title"]), sid, control_label(c).replace("`", ""), measure_date(sid), res)
            sql_out.append(head)
            sql_out.append(sql + ";")
            sql_out.append("")
write_out("kontrol-donguleri.sql", "\n".join(sql_out).rstrip() + "\n")

# ── dizin
def fmt_money(cents):
    if cents is None:
        return ""
    neg = cents < 0
    d, c = divmod(abs(int(cents)), 100)
    s = "{:,}".format(d).replace(",", ".") + "," + "%02d" % c
    return ("-$" if neg else "$") + s


COUNT_KEYS = {"refund_backlog": "sipariş", "refund_status_mismatch": "sipariş", "cancelled_order_cogs": "sipariş",
              "ledger_cost_drift": "ay", "labels_unlinked": "etiket", "chargeback_unlinked": "ters ibraz",
              "cogs_source_conflict": "kalem", "ledger_type_unknown": "tür"}
SHORT = {"Jade Gold NYC": "Jade", "EON": "EON", "Ophir Gold USA": "Ophir",
         "by Artifact Studio Jewelry": "Artifact", "Seselka Home": "Seselka"}


def today_cell(key):
    rows = [r for r in CHECKS if r["check_key"] == key]
    if not rows:
        return "ölçülmedi"
    bad = [r for r in rows if not r["ok"]]
    if not bad:
        return "%d org tutuyor" % len(rows)
    parts = []
    for r in sorted(bad, key=lambda r: -(r.get("amount_cents") or 0)):
        p = SHORT.get(r["name"], r["name"])
        bits = []
        if r.get("count_n") and key in COUNT_KEYS:
            bits.append("%s %s" % ("{:,}".format(r["count_n"]).replace(",", "."), COUNT_KEYS[key]))
        if r.get("amount_cents"):
            bits.append(fmt_money(r["amount_cents"]))
        parts.append(p + (" " + ", ".join(bits) if bits else " yanıyor"))
    return "; ".join(parts)


INDEX_HEAD = """# Muhasebe senaryo matrisi: Etsy'den gelmeyen bilgi

_{date} · ölçümler canlı Supabase'de {mdate} ve {date} · canlı kontroller `accounting_checks` (0178, 0179) · üreteç `kaynak/render.py`_

## Neden bu belge

Sahibin isteği: Etsy API'sinin hiç vermediği ya da eksik verdiği her bilgi (maliyet, iade, reklam, kargo, Etsy Payments) için muhasebe doğru tutulabilsin. Her senaryoda bilginin girileceği bir alan ve bozulduğunda haber veren bir kontrol döngüsü olsun. Bu belge 6 boyutta yazılan 88 senaryonun kod ve canlı veriyle çürütülmüş, birleştirilmiş ve önceliklendirilmiş halidir: 44 kanonik senaryo ve tamlık eleştirmeninin bulduğu 5 ek senaryo. Kontrol döngülerinin canlıda olanları Uyarı Merkezi'ne düşer.

## Nasıl okunur

- **Şerit:** A panel alanı (migration ve ekran), B senkron ya da motor kodu, C kontrol döngüsü (eşitlik, uyarı, kadans), D sahip rutini (aylık CSV, elle giriş), E kabul edilen sınır.
- **Öncelik:** P0 yanlış kar, zarar ya da vergi rakamı; P1 sahibin kararını bozar; P2 eksik ama sınırlı; P3 hijyen.
- **Efor:** S yarım günden az, M 1 ile 2 gün, L 2 günden fazla.
- **Kimlik:** bölüm öneki ve sıra (GEL-01). Kaynak senaryo kimlikleri (LED, REF, REK, KRG, PAY, COGS, EK) ayrıntı dosyalarında durur.
- **K1..K14:** `accounting_checks` kontrol numaraları (aşağıdaki tablo).
- **Ayrıntı:** her bölümün dosyası `senaryolar/` altında; elle koşulabilir sorgular `kontrol-donguleri.sql`; ham analiz ve çürütme kayıtları `kaynak/` (otomatik okunmaz).

## Muhasebe modeli tek sayfa

- **Gelir:** ürün, alıcının ödediği kargo ve hediye paketi, eksi indirim. Kaynak `sales.item_total_cents` (Etsy subtotal, indirim sonrası) + `shipping_cents` + `gift_wrap_cents`; indirim ikinci kez düşülmez.
- **Vergi emaneti:** alıcıdan toplanan satış vergisi ve VAT gelir değildir; Etsy marketplace facilitator olarak toplar ve öder. `sales.grand_total_cents` vergiyi içerir ve kar hesabında kullanılmaz. Vergi iadesi de gelirden düşülmez.
- **İade:** kontra gelirdir (Schedule C satır 2). Sipariş görünümünde siparişe, dönem görünümünde iade tarihine yazılır: iadelerin yüzde 36'sı sipariş ayından sonra, yüzde 4,3'ü sonraki yılda gelir.
- **Satılan malın maliyeti (COGS):** altın, işçilik, taş ve paketleme, eksi geri kazanılan (stoğa dönen ya da hurdaya giden parça). Tanıma anı ürünün alıcıya geçmesidir: iptal edilip kargolanmayan siparişin COGS'u yoktur. Kaynak önceliği elle, sonra fatura, sonra motor tahmini.
- **Satış giderleri:** Etsy işlem, işleme, listing ve Offsite Ads ücreti, gidiş ve iade etiketi, Etsy Ads ve Etsy dışı reklam. COGS değildir.
- **Katkı marjı ve İşletme Karı:** katkı = net gelir - COGS - değişken satış gideri; İşletme Karı = katkı - sabit gider (abonelik, yazılım, kira).
- **Nakit katmanı ayrıdır:** PAYMENT_GROSS tahsilat, DISBURSE2 payout, RECOUP karttan tahsil, ADYENBALANCE_REVERSAL geri dönen payout. Bunlar kara girmez; ledger kimliği (açılış + toplam tutar = son bakiye) nakdi doğrular.
- **Dönem:** kapanan ayın rakamı kilitlenir; sonradan gelen iade ve düzeltme yeni aya yazılır (NAK-02).
""".format(date=DOC_DATE, mdate=MEASURE_DATE)

FACTS = [
    ("İade satırının kimliği", "REFUND_GROSS ve REFUND_PROCESSING_FEE reference_id = payment_adjustment; receipt ya da payment id ile 0/1.922 eşleşme", "Bu satırları payment ya da receipt id ile birleştiren her sorgu sıfır döner."),
    ("API'siz iade köprüsü", "1.922 iadenin 1.690'ında aynı saniyede tek sales_tax_refund (reference = receipt); bağlanan tutar $608.713,70 / $701.506,62", "İade siparişe API çağrısı olmadan bağlanır; vergisiz siparişte bu köprü yoktur."),
    ("Kalem ve Offsite bağı", "transaction_refund 1.958/1.958 kaleme; Offsite 'etsy' satırı 369/369, Offsite iadesi 156/156 receipt'e eşleşir", "Offsite ücreti ve iadesi siparişe bağlanabilir."),
    ("İşleme ücreti kuralı", "10.277/10.277 ödemede yüzde 3 + $0,25; köprülü 1.690 iadede tam iadenin tamamı geri gelir (1.487/1.487), kısmi iadede çoğunlukla yalnız yüzde 3 (184/203)", "İade işleme ücreti siparişe bu kuralla yazılır."),
    ("İade zamanı", "1.901 iadeli siparişin 687'si (yüzde 36) sonraki ayda, 82'si (yüzde 4,3) sonraki yılda; medyan 8,9 gün, p90 31,5 gün", "Dönem görünümü iadeyi iade tarihine yazmalı."),
    ("İptal statüsü", "İadeli 1.901 siparişin 1.388'i cancelled", "İptal çoğunlukla tahsil edilip iade edilmiş siparişlerdir."),
    ("Ledger kimliği", "4 Etsy org'unda toplam tutar = son bakiye (açılış 0)", "Ledger'da boşluk yok; günlük ucuz kontrol (K1)."),
    ("Aynı saniyede çok satır", "Jade son 91 gün: 39 gün sonu son saniyesi çok satırlı; 0178 kuralı 13 günde sahte kırılma verirdi, 0179 kuralı 0", "K1 kapanışı aday kümesinden seçer."),
    ("Ücret kapsamı", "Jade canlı 8.314 siparişin 7.461'inde etsy_payment_id boş", "Sipariş ücreti motoru işleme ücretini siparişe bağlayamıyor (K4)."),
    ("having tuzağı", "Net maliyeti 0 ya da altı olan ay aylık özetten düşer: Jade 2 ay $10,08, Artifact 1 ay $5,70", "Kredi ayları sessizce kaybolur (SIS-01)."),
    ("Eşlenmeyen ledger türleri", "Jade 25.657 satır, 16 tür, net +$437.541,33", "Çoğu gider değil nakit ve emanettir; sözlük bunları sınıflar."),
    ("Offsite oranı", "Jade receipt tipli ücretlerde ortalama yüzde 12,04 ve 15 tavan (tüm 757 ücrette 34 tavan); EON 6/6, Artifact 1/1 tavanda", "Oran ve tavan org ayarı olmalı (RKL-04)."),
    ("İptal siparişte COGS", "Jade 815 iptal siparişte $414.892,48 motor maliyeti; kargo kanıtı olmayan ve kanıtın aranabildiği 516 sipariş $280.517,60, bunun 319'u hiç tahsil edilmedi ($162.391,17); kargo kaydı tutulmayan dönemde 225 sipariş $98.964,40 bilinmiyor", "Geçmiş yılların karı bu tutar kadar düşük; İşletme Karı kartının 6 aylık penceresine düşen kısım $8.785,66 (K5, MAL-02)."),
    ("Etsy kargo kaydı boştu", "sale_shipments 5 org'da 0 satır: 0174'ün kısmi tekil indeksi senkron upsert'ünü her seferinde 42P10 ile düşürüyordu", "0179 indeksi düzeltti; receipt yeniden okundukça gönderi kaydı dolar (SEV-01, MAL-02)."),
    ("ShipStation çift sayım", "Jade ShipStation gider satırları $24.882,40, iptal edilmemiş gönderilerin postaj ve sigorta toplamı $12.605,14", "İşletme Karı'nda $12.277,26 fazla kargo gideri (K13, SEV-02)."),
    ("Kaynak çakışması", "EON 10 kalemde motor maliyeti fatura ya da elle maliyetin yanında duruyor: $2.297,32", "İşletme Karı'nda hayalet maliyet (K14, MAL-01)."),
    ("Vergi gelirde", "Jade iptal dışı satış vergisi $141.721,03 (tüm dönem) panel kar kartı gelirinde; operating_profit_monthly'nin 6 aylık penceresinde $6.456,86", "Panel kar kartı ve İşletme Karı vergiyi kar sayıyor (GEL-01)."),
    ("etsy_connection okunamaz", "RLS açık, politika yok", "security invoker bir kontrol bu tabloya dayanırsa oturumda hep yeşil kalır; K12 yalnız satış ve ledger verisine bakar."),
]


def index_md():
    out = [INDEX_HEAD]
    out.append("## Ölçülen temel gerçekler\n")
    out.append("| Ölçüm | Değer | Anlamı |")
    out.append("| --- | --- | --- |")
    for a, b, c in FACTS:
        out.append("| %s | %s | %s |" % (cell(a), cell(b), cell(c)))
    out.append("")
    out.append("## Kontrol döngüleri: canlıda\n")
    out.append("`accounting_checks(org)` her kontrolü tek satır döner; başarısız satır Uyarı Merkezi'nde görünür, yeşile dönen Görevler'e \"Çözüldü\" izi bırakır. Değerler %s canlı çıktısıdır (5 org)." % DOC_DATE)
    out.append("")
    out.append("| No | Anahtar | Eşitlik | Bugün | Senaryo |")
    out.append("| --- | --- | --- | --- | --- |")
    for no, key, cids, eq in LIVE:
        out.append("| %s | `%s` | %s | %s | %s |" % (no, key, cell(eq), cell(today_cell(key)), cids))
    out.append("")
    out.append("## Senaryolar\n")
    for i, sec in enumerate(SECTIONS):
        items = section_items[sec["key"]]
        out.append("### %d. %s\n" % (i + 1, sec["title"]))
        out.append("%s Ayrıntı: [%s](%s)\n" % (clean(sec["intro"]), section_file(i, sec), section_file(i, sec)))
        out.append("| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |")
        out.append("| --- | --- | --- | --- | --- | --- |")
        for c in items:
            out.append("| %s | %s | %s | %s | %s | %s |" % (
                c["cid"], cell(c["title"]), c["priority"], c["effort"], ", ".join(c["lanes"]), cell(control_label(c))))
        out.append("")
    pr = {}
    for c in canonical:
        pr[c["priority"]] = pr.get(c["priority"], 0) + 1
    out.append("Toplam %d senaryo: %s." % (len(canonical), ", ".join("%s %d" % (k, pr[k]) for k in sorted(pr))))
    out.append("")
    out.append(STEPS_MD)
    out.append(LIMITS_MD)
    out.append("## Ayıklananlar\n")
    for p in pruned:
        out.append("- **%s:** %s" % (p["id"], one_line(p["reason"])))
    out.append("")
    out.append(SOURCES_MD)
    return "\n".join(out).rstrip() + "\n"


STEPS_MD = """## Uygulama sırası

Her adım bir günden kısa; önce yanlış kar ya da vergi rakamı üretenler (P0), sonra karar bozanlar. Kontrol döngüsü olan adımda yeşile dönen kontrol işin bittiğinin kanıtıdır.

1. **SEV-02 (B, S):** `rebuild_sale_shipping_label_costs` sonunda aynı işlemde `rebuild_shipstation_costs` ve `rebuild_etsy_ledger_costs` koşsun; Jade için tek seferlik koşu. K13 yeşile döner, İşletme Karı'ndan $12.277,26 fazla gider çıkar.
2. **MAL-01 (B, S):** kaynak önceliği elle, fatura, motor her yüzeyde: `rebuild_gold_costs` faturalı kalemi atlar, elle ya da faturalı kalemin motor satırı geçersiz sayılır (`operating_profit_monthly` ve taraf toplamları dahil), 18 EON fatura satırına tür yazılır. K14 yeşile döner.
3. **MAL-02 (B, M):** altın motoru iptal siparişe maliyet yazmaz; kanıtsız iptal maliyeti önce hiç tahsil edilmemiş 319 siparişte, sonra sahip onayıyla tahsil edilip iade edilmiş siparişlerde geçersiz sayılır. K5 küçülür ve sıfıra iner.
4. **GEL-01 (B, M):** `operating_profit_monthly` ve panel kar kartı geliri vergisiz kurar ve iadeyi iade tarihinde düşer.
5. **IAD-01 (B, M):** iade kuyruğu statüden bağımsız tüm ledger iade sinyallerini okur ve receipt'i tam yeniden okur; COGS'lu iptaller de kuyruğa girer, böylece kargo bilgisi (is_shipped, gönderi kaydı) dolar. K2 ve K3 sıfıra iner, K5'in "bilinmiyor" kovası küçülür.
6. **UCR-01..04 (B, M):** `rebuild_sales_etsy_fees` işleme ücretini köprüyle, iade işleme ücretini ölçülen kuralla, Offsite 'etsy' satırını ve iadesini, `shipping_transaction` ve `buyer_fee` satırlarını siparişe yazar. K4 toleransa iner.
7. **SEV-03 (D, S):** sahip ShipStation'da yeni API anahtarı üretip Ayarlar'dan yeniden bağlar; ardından senkron 401'de nabzı `ok=false` yazsın (B). K9 yeşile döner.
8. **RKL-01 (A ve B, M):** Etsy Ads CSV yükleme yolu geri gelir (f43068c ile silinen eşleyici), ledger ile CSV d+1 kaymasıyla mutabık. K8 yeşile döner.
9. **SIS-01 (B, S):** `rebuild_etsy_ledger_costs` eşlemesini sözlükten okur, `having` tuzağı kalkar. K6 ve K7 yeşil kalır.
10. **SEV-05 ve SEV-01 (B, M):** önce SEV-05'in (c) adımı yayına girer (etiket ve sigorta iadesi aynı reference_id'li bağlı etiketin siparişine negatif satır olarak yazılır), sonra kalem `shipped_at` alanı receipt yeniden okumasıyla dolar ve iade etiketi satış detayından bağlanır. K10 küçülür.
11. **IAD-02 (A, M):** iptal siparişin tahsilat durumu alanı: hiç tahsil edilmedi, tahsil edilip iade edildi, para satıcıda kaldı.
12. **MAL-09 (A, M):** iade ya da kayıp ürünün akıbeti alanı: stoğa döndü, hurda, kayıp tazminatı, alıcıda kaldı.
13. **SEV-04 (A, S):** Etsy ve ShipStation dışı etiket ve gümrük için satış detayında elle giriş.
14. **MAL-05 (A, M):** tarihli altın alım fiyatı tablosu; motor sipariş tarihindeki fiyatı kullanır.
15. **NAK-02 (A ve B, M):** ay kapanışı ve dönem kilidi; kapanan aya düşen sonradan değişiklik yeni aya yazılır.

**Sonraki dalga:** kalan P1, P2 ve P3 senaryolar (GEL-02, UCR-05, RKL-02..06, SEV-06..08, MAL-03, MAL-04, MAL-06..08, MAL-10, MAL-11, GDR-01..03, NAK-01, SIS-02 ve ek senaryolar) yukarıdaki bölüm tablolarında öncelik sırasıyla durur.
"""

LIMITS_MD = """## Kabul edilen sınırlar

- **SEV-04:** Etsy ve ShipStation dışında alınan etiketin (gişe, Pirate Ship) ve satıcının üstlendiği gümrüğün kaydı hiçbir API'de yok; yalnız elle giriş ya da taşıyıcı dökümü CSV'siyle girer.
- **MAL-05:** 2022 ile 2025 arası satışların gerçek altın alım fiyatı kayıtlı değil; geçmiş yeniden kurulamaz, yalnız ileriye dönük tarihli fiyat tutulur ve eski maliyet "tarihsiz" işaretlenir.
- **NAK-01:** banka tarafı Etsy'de yok; payout ile banka mutabakatı yalnız sahibin banka dökümüyle yapılır.
- **Etsy dışı satış, yıl sonu paketi ve denetim izi (ek senaryolar):** vergi beyanının ve banka kaydının kendisi panel dışındadır; panel yalnız eşleme, onay ve dondurulmuş dönem rakamını tutar.
"""

SOURCES_MD = """## Kaynaklar

- Kod: `supabase/migrations/0174_sale_item_pnl.sql`, `0178_accounting_checks.sql`, `0179_accounting_checks_fixes.sql`, `lib/db/queries/alerts.ts`, `lib/etsy/sync.ts`, `lib/etsy/refunds.ts`, `lib/gold-cost-entry.ts`, `lib/shipstation/sync.ts`.
- Belgeler: `docs/satis-maliyet-takip.md` (muhasebe kuralları ve dış kaynaklar: IRS Pub 334 ve 538, Schedule C talimatları, Etsy Help, Etsy OpenAPI), `docs/etsy-playbook/INDEX.md`.
- Ham kayıtlar: `docs/muhasebe/kaynak/` (analiz, çürütme, ayıklama, bağımsız ölçümler; otomatik okunmaz).
"""

write_out("senaryo-matrisi.md", index_md())

# ── biçim kapısı
bad = []
for path in [os.path.join(ROOT, "senaryo-matrisi.md"), os.path.join(ROOT, "kontrol-donguleri.sql")] + \
        sorted(glob.glob(os.path.join(ROOT, "senaryolar", "*.md"))):
    t = open(path, encoding="utf-8").read()
    for ch, name in [("—", "em dash"), ("–", "en dash"), ("â", "a şapka"), ("î", "i şapka"), ("û", "u şapka")]:
        if ch in t:
            bad.append((os.path.basename(path), name, t.count(ch)))
    if re.search(r"[Mm]üşteri", t):
        bad.append((os.path.basename(path), "müşteri", len(re.findall(r"[Mm]üşteri", t))))
    if re.search(r",\s+ve\s", t):
        bad.append((os.path.basename(path), "ve önünde virgül", len(re.findall(r",\s+ve\s", t))))
if bad:
    raise SystemExit("biçim kapısı: %r" % bad)
all_fixes = FIX.get("text", []) + FIX.get("sql", []) + FIX.get("measure", []) + FIX_POST
unused = [f for f in all_fixes if id(f) not in APPLIED]
if unused:
    raise SystemExit("uygulanmayan düzeltme: %r" % [(f.get("id"), f.get("field")) for f in unused])
print("ok: %d senaryo, %d bölüm, %d ayıklanan" % (len(canonical), len(SECTIONS), len(pruned)))
