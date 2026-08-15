#!/usr/bin/env python3
"""
Jade Gold — gram & fiyat çalışma dosyası, **Apple Numbers** sürümü.

NEDEN AYRI ÜRETEÇ: `.numbers` formatına formül YAZILAMAZ. `numbers-parser` çok
sekme, stil ve rengi tam destekler ama `write("=A2*106")` düz metin olarak iner
(`is_formula: False`); kütüphanenin kendi README'si "Formulas cannot be written
to a document" der. Formülü gerçekten yazan araçlar (Digits, apple-numbers-mcp)
AppleScript ile Numbers.app'i sürer, yani macOS ister.

BU YÜZDEN buradaki strateji: hesaplanan sütunlar Python'da ÜRETİLİR ve değer
olarak yazılır (gramı olan 1.823 varyant için hesap dolu gelir), ayrıca
"Formüller" sekmesinde her formülün Numbers sözdizimi KOPYALA-YAPIŞTIR hazır
verilir — ekip gram girdikten sonra tek yapıştırmayla sütunu canlıya çevirir.

Formüller `lib/jade/pricing.ts` ile aynı; ikisi ayrı yerde yaşıyor, biri
değişirse diğeri de değişmeli.

Kullanım: python3 scripts/jade-gram-numbers.py catalog.json cikti.numbers
"""
import json
import math
import sys

from numbers_parser import RGB, Alignment, Document

# ── Serin pastel palet ────────────────────────────────────────────────────
# Marka altını/kremi BİLEREK kullanılmadı: kullanıcı "kahve değil, bebek mavisi /
# yaz sarısı gibi cool pastel" istedi. Altın XLSX sürümünde yaşamaya devam ediyor.
MAVI_KOYU = RGB(0x5B, 0x9C, 0xC4)     # başlık bandı
MAVI = RGB(0xA8, 0xD5, 0xE5)          # bebek mavisi
MAVI_SOLUK = RGB(0xF0, 0xF8, 0xFB)    # zebra
SARI = RGB(0xFF, 0xE3, 0x8C)          # yaz sarısı — doldurulacak hücre
SARI_SOLUK = RGB(0xFF, 0xF6, 0xD9)
NANE = RGB(0xB8, 0xE0, 0xD2)          # sağlıklı
NANE_KOYU = RGB(0x3E, 0x8E, 0x74)
MERCAN = RGB(0xFF, 0xC2, 0xB8)        # zarar / şüphe
MERCAN_KOYU = RGB(0xC1, 0x5B, 0x54)
LAVANTA = RGB(0xCF, 0xC6, 0xEC)       # bilgi / vurgu
LAVANTA_KOYU = RGB(0x6B, 0x5C, 0xA5)
BEYAZ = RGB(0xFF, 0xFF, 0xFF)
METIN = RGB(0x2E, 0x47, 0x56)         # serin koyu arduvaz
METIN_SOFT = RGB(0x5C, 0x7A, 0x8A)

SUPHELI_FIYAT_USD = 30_000

# ── Fiyat motoru (lib/jade/pricing.ts ile birebir) ────────────────────────
GRAM_USD, KARGO_USD, AMBALAJ_USD = 106.0, 5.0, 1.5
INDIRIM, ETSY_ORAN, ETSY_SABIT, HEDEF_MARJ = 0.15, 0.095, 0.25, 0.20


def maliyet(g):
    return g * GRAM_USD + KARGO_USD + AMBALAJ_USD


def breakeven(g):
    return math.ceil((maliyet(g) + ETSY_SABIT) / ((1 - INDIRIM) * (1 - ETSY_ORAN)))


def hedef(g):
    return math.ceil(
        (maliyet(g) + ETSY_SABIT) / ((1 - INDIRIM) * (1 - ETSY_ORAN - HEDEF_MARJ))
    )


def marj(fiyat, g):
    tahsilat = fiyat * (1 - INDIRIM)
    if tahsilat <= 0:
        return None
    return (tahsilat - (tahsilat * ETSY_ORAN + ETSY_SABIT) - maliyet(g)) / tahsilat


def durum(g, fiyat):
    if g is None:
        return "GRAM EKSİK"
    if fiyat is None:
        return "FİYAT YOK"
    if fiyat > SUPHELI_FIYAT_USD:
        return "FİYAT ŞÜPHELİ"
    m = marj(fiyat, g)
    if m is not None and m < 0:
        return "ZARARDA"
    if fiyat < breakeven(g):
        return "RİSKLİ"
    return "ok"


def stiller(doc):
    """Tüm stiller tek yerde — Numbers'ta stil adı ile atanır."""
    s = {}
    s["kapak"] = doc.add_style(
        name="kapak", bold=True, font_size=22.0, font_color=BEYAZ,
        bg_color=MAVI_KOYU, alignment=Alignment("left", "middle"))
    s["altbaslik"] = doc.add_style(
        name="altbaslik", font_size=13.0, font_color=METIN_SOFT, italic=True)
    s["bolum"] = doc.add_style(
        name="bolum", bold=True, font_size=13.0, font_color=LAVANTA_KOYU)
    s["baslik"] = doc.add_style(
        name="baslik", bold=True, font_size=11.0, font_color=BEYAZ,
        bg_color=MAVI_KOYU, alignment=Alignment("center", "middle"))
    s["govde"] = doc.add_style(name="govde", font_size=11.0, font_color=METIN)
    s["govde_z"] = doc.add_style(
        name="govde_z", font_size=11.0, font_color=METIN, bg_color=MAVI_SOLUK)
    s["soft"] = doc.add_style(name="soft", font_size=10.0, font_color=METIN_SOFT)
    s["giris"] = doc.add_style(
        name="giris", bold=True, font_size=11.0, font_color=METIN, bg_color=SARI,
        alignment=Alignment("center", "middle"))
    s["ayar"] = doc.add_style(
        name="ayar", bold=True, font_size=12.0, font_color=METIN, bg_color=SARI,
        alignment=Alignment("center", "middle"))
    s["ok"] = doc.add_style(
        name="ok", bold=True, font_size=11.0, font_color=NANE_KOYU, bg_color=NANE,
        alignment=Alignment("center", "middle"))
    s["kotu"] = doc.add_style(
        name="kotu", bold=True, font_size=11.0, font_color=MERCAN_KOYU,
        bg_color=MERCAN, alignment=Alignment("center", "middle"))
    s["bekle"] = doc.add_style(
        name="bekle", font_size=11.0, font_color=LAVANTA_KOYU, bg_color=LAVANTA,
        alignment=Alignment("center", "middle"))
    s["formul"] = doc.add_style(
        name="formul", font_size=10.0, font_color=LAVANTA_KOYU, bg_color=MAVI_SOLUK,
        font_name="Menlo")
    s["vurgu"] = doc.add_style(
        name="vurgu", bold=True, font_size=11.0, font_color=METIN, bg_color=MAVI)
    return s


DURUM_STILI = {
    "ok": "ok", "ZARARDA": "kotu", "FİYAT ŞÜPHELİ": "kotu",
    "RİSKLİ": "bekle", "GRAM EKSİK": "giris", "FİYAT YOK": "bekle",
}


def yaz_satir(t, r, degerler, stil=None):
    for c, v in enumerate(degerler):
        if v is None:
            continue
        t.write(r, c, v, style=stil) if stil else t.write(r, c, v)


def kapak_sekmesi(doc, s, n_eksik, n_toplam, n_listing):
    sh = doc.sheets[0]
    sh.name = "Başlangıç"
    t = sh.tables[0]
    t.name = "Başlangıç"
    t.add_row(30)
    t.add_column(2)

    t.write(0, 0, "JADE GOLD NYC · Gram & Fiyat", style="kapak")
    t.merge_cells("A1:D1")
    t.row_height(0, 52)

    satirlar = [
        ("", ""),
        ("Bu dosya ne işe yarar", "bolum"),
        (f"{n_toplam:,} varyantın gram ve fiyat sağlığı tek yerde. "
         f"{n_eksik} varyantın gramı eksik — gram olmadan maliyet, dolayısıyla "
         "marj hesaplanamıyor.", "govde"),
        ("", ""),
        ("Nasıl kullanılır", "bolum"),
        ("1 · «Eksik Gramlar» sekmesine gidin. Sarı GRAM sütunu sizin alanınız.", "govde"),
        ("2 · Her satırın gramını terazi ile ölçüp yazın. SKU sütunu takip içindir.", "govde"),
        ("3 · Dosyayı geri gönderin; fiyatlar yeniden hesaplanıp Etsy'ye işlenir.", "govde"),
        ("", ""),
        ("Hesaplanan sütunlar hakkında", "bolum"),
        ("Maliyet / Breakeven / Hedef Fiyat / Marj sütunları, gramı OLAN satırlarda "
         "dolu gelir. Yeni gram girdiğinizde bu sütunlar kendiliğinden GÜNCELLENMEZ "
         "— çünkü .numbers dosyasına formül dışarıdan yazılamıyor.", "govde"),
        ("Canlı hesap isterseniz «Formüller» sekmesindeki hazır formülü ilgili "
         "sütuna bir kez yapıştırın; Numbers aşağı doğru doldurur ve sütun canlıya döner.", "govde"),
        ("", ""),
        ("Durum renkleri", "bolum"),
    ]
    r = 1
    for metin, stil in satirlar:
        if metin:
            t.write(r, 0, metin, style=stil or "govde")
            t.merge_cells(f"A{r+1}:D{r+1}")
        r += 1

    lejant = [
        ("ok", "Sağlıklı — fiyat breakeven üstünde, marj pozitif"),
        ("RİSKLİ", "Fiyat breakeven'in altında"),
        ("ZARARDA", "Marj negatif — her satışta para kaybı"),
        ("FİYAT ŞÜPHELİ", "Fiyat $30.000 üstü — placeholder değer, gerçek fiyat değil"),
        ("GRAM EKSİK", "Gram girilmemiş, hesap yapılamıyor"),
    ]
    for etiket, aciklama in lejant:
        t.write(r, 0, etiket, style=DURUM_STILI[etiket])
        t.write(r, 1, aciklama, style="soft")
        t.merge_cells(f"B{r+1}:D{r+1}")
        r += 1

    r += 1
    t.write(r, 0, f"Anlık görüntü: {n_toplam:,} varyant · {n_listing} listing · "
                  f"{n_eksik} gram eksik", style="altbaslik")
    t.merge_cells(f"A{r+1}:D{r+1}")

    t.col_width(0, 190)
    t.col_width(1, 300)
    t.col_width(2, 160)
    t.col_width(3, 160)
    return t


def ayarlar_sekmesi(doc, s):
    doc.add_sheet("Ayarlar")
    sh = doc.sheets["Ayarlar"]
    t = sh.tables[0]
    t.name = "Ayarlar"
    t.add_row(6)

    t.write(0, 0, "AYAR", style="baslik")
    t.write(0, 1, "DEĞER", style="baslik")
    t.write(0, 2, "AÇIKLAMA", style="baslik")
    veriler = [
        ("Altın maliyeti ($/gram)", GRAM_USD,
         "Her şey dahil tedarikçi faturası: ham altın + işçilik + taş"),
        ("Kargo ($)", KARGO_USD, "Ücretsiz kargo — bedeli satıcıda"),
        ("Ambalaj ($)", AMBALAJ_USD, "Kutu ve paketleme"),
        ("Etsy indirimi", INDIRIM, "Kalıcı mağaza indirimi — tahsilat = liste × 0,85"),
        ("Etsy oransal kesinti", ETSY_ORAN, "%6,5 işlem + %3 ödeme işleme"),
        ("Etsy sabit kesinti ($)", ETSY_SABIT, "Ödeme işleme sabiti"),
        ("Hedef net marj", HEDEF_MARJ, "Fiyat önerisi bu marja göre hesaplanır"),
    ]
    for i, (ad, deger, aciklama) in enumerate(veriler, start=1):
        t.write(i, 0, ad, style="govde" if i % 2 else "govde_z")
        t.write(i, 1, float(deger), style="ayar")
        t.write(i, 2, aciklama, style="soft")
        # 4-6. satırlar oran (indirim / Etsy oranı / hedef marj), gerisi para
        if i in (4, 5, 7):
            t.set_cell_formatting(i, 1, "percentage", decimal_places=1)
        else:
            t.set_cell_formatting(i, 1, "currency", currency_code="USD",
                                  decimal_places=2)

    r = len(veriler) + 2
    t.write(r, 0, "Bu değerler değişirse «Formüller» sekmesindeki hesap da değişir. "
                  "Altın fiyatı en oynak kalem — güncel tutun.", style="altbaslik")
    t.merge_cells(f"A{r+1}:C{r+1}")
    t.col_width(0, 210)
    t.col_width(1, 110)
    t.col_width(2, 420)
    return t


def formuller_sekmesi(doc, s):
    """Kullanıcı 'formül bilgilendirmeleri' istedi — hem düz anlatım hem
    Numbers'a kopyala-yapıştır hazır sözdizimi."""
    doc.add_sheet("Formüller")
    t = doc.sheets["Formüller"].tables[0]
    t.name = "Formüller"
    t.add_row(24)
    t.add_column(1)

    t.write(0, 0, "Fiyat nasıl hesaplanıyor", style="kapak")
    t.merge_cells("A1:D1")
    t.row_height(0, 44)

    aciklama = [
        ("Maliyet", "gram × 106 + 5 (kargo) + 1,50 (ambalaj)",
         "Ürünün bize toplam maliyeti. Gram maliyeti her şey dahil tedarikçi "
         "faturasıdır — ayrı işçilik kalemi yoktur."),
        ("Tahsilat", "liste fiyatı × 0,85",
         "Mağazada kalıcı %15 indirim açık; kasaya giren tutar budur."),
        ("Etsy kesintisi", "tahsilat × 0,095 + 0,25",
         "%6,5 işlem + %3 ödeme işleme, artı sabit 0,25 $."),
        ("Marj", "(tahsilat − kesinti − maliyet) ÷ tahsilat",
         "Net kâr oranı. Negatifse o satış zarardır."),
        ("Breakeven", "YUKARIYUVARLA((maliyet + 0,25) ÷ (0,85 × 0,905))",
         "Marjın sıfırlandığı liste fiyatı. Altı zarar."),
        ("Hedef fiyat", "YUKARIYUVARLA((maliyet + 0,25) ÷ (0,85 × (0,905 − 0,20)))",
         "%20 net marja ulaşan liste fiyatı. Tam dolara yuvarlanır."),
    ]
    t.write(2, 0, "KALEM", style="baslik")
    t.write(2, 1, "FORMÜL", style="baslik")
    t.write(2, 2, "NE DEMEK", style="baslik")
    for i, (ad, f, ne) in enumerate(aciklama, start=3):
        t.write(i, 0, ad, style="vurgu")
        t.write(i, 1, f, style="formul")
        t.write(i, 2, ne, style="soft")

    r = len(aciklama) + 4
    t.write(r, 0, "Sütunu canlıya çevirmek isterseniz", style="bolum")
    t.merge_cells(f"A{r+1}:D{r+1}")
    r += 1
    t.write(r, 0,
            "«Eksik Gramlar» sekmesinde ilgili sütunun ilk veri hücresine (2. satır) "
            "aşağıdaki formülü yapıştırın, sonra hücrenin sağ alt köşesinden aşağı "
            "sürükleyin. G = GRAM sütunu, F = Fiyat sütunu.", style="soft")
    t.merge_cells(f"A{r+1}:D{r+1}")
    r += 2

    hazir = [
        ("Maliyet", "=IF(G2=\"\",\"\",G2*106+5+1.5)"),
        ("Breakeven", "=IF(G2=\"\",\"\",ROUNDUP((G2*106+5+1.5+0.25)/(0.85*0.905),0))"),
        ("Hedef Fiyat", "=IF(G2=\"\",\"\",ROUNDUP((G2*106+5+1.5+0.25)/(0.85*0.705),0))"),
        ("Marj", "=IF(OR(G2=\"\",F2=\"\"),\"\","
                 "(F2*0.85-(F2*0.85*0.095+0.25)-(G2*106+5+1.5))/(F2*0.85))"),
        ("Durum", "=IF(G2=\"\",\"GRAM EKSİK\",IF(F2>30000,\"FİYAT ŞÜPHELİ\","
                  "IF(J2<0,\"ZARARDA\",IF(F2<H2,\"RİSKLİ\",\"ok\"))))"),
    ]
    t.write(r, 0, "SÜTUN", style="baslik")
    t.write(r, 1, "YAPIŞTIRILACAK FORMÜL", style="baslik")
    t.merge_cells(f"B{r+1}:D{r+1}")
    for i, (ad, f) in enumerate(hazir, start=r + 1):
        t.write(i, 0, ad, style="vurgu")
        t.write(i, 1, f, style="formul")
        t.merge_cells(f"B{i+1}:D{i+1}")

    son = r + len(hazir) + 2
    t.write(son, 0,
            "Not: Bu formüller yalnız IF / OR / ROUNDUP kullanır — üçü de Numbers'ın "
            "kendi fonksiyonlarıdır, Excel'e özgü hiçbir şey yoktur.", style="altbaslik")
    t.merge_cells(f"A{son+1}:D{son+1}")

    t.col_width(0, 130)
    t.col_width(1, 330)
    t.col_width(2, 380)
    t.col_width(3, 120)
    return t


def veri_sekmesi(doc, s, ad, rows, kaynak_sutunu):
    doc.add_sheet(ad)
    t = doc.sheets[ad].tables[0]
    t.name = ad

    basliklar = ["Bölüm", "Listing", "Etsy ID", "SKU"]
    if kaynak_sutunu:
        basliklar.append("Gram Kaynağı")
    basliklar += ["Fiyat", "GRAM", "Maliyet", "Breakeven",
                  "Hedef Fiyat", "Marj", "Durum"]

    gerek_satir, gerek_sutun = len(rows) + 1, len(basliklar)
    if gerek_satir > t.num_rows:
        t.add_row(gerek_satir - t.num_rows)
    if gerek_sutun > t.num_cols:
        t.add_column(gerek_sutun - t.num_cols)

    for c, h in enumerate(basliklar):
        t.write(0, c, h, style="baslik")

    for i, r in enumerate(rows, start=1):
        z = "govde_z" if i % 2 == 0 else "govde"
        g = r["g"]
        fiyat = (r["pc"] / 100) if r["pc"] is not None else None
        d = durum(g, fiyat)

        t.write(i, 0, r["ch"] or "—", style=z)
        t.write(i, 1, r["title"] or "—", style=z)
        t.write(i, 2, str(r["lid"]), style=z)
        t.write(i, 3, r["sku"] or "—", style=z)
        c = 4
        if kaynak_sutunu:
            t.write(i, c, r["ws"] or "—", style=z)
            c += 1
        if fiyat is not None:
            t.write(i, c, float(fiyat), style=z)
        c += 1
        # GRAM: boşsa yaz sarısı (giriş alanı), doluysa normal
        if g is None:
            t.write(i, c, "", style="giris")
        else:
            t.write(i, c, float(g), style=z)
        c += 1
        if g is not None:
            t.write(i, c, round(maliyet(g), 2), style=z)
            t.write(i, c + 1, float(breakeven(g)), style=z)
            t.write(i, c + 2, float(hedef(g)), style=z)
            m = marj(fiyat, g) if fiyat is not None else None
            if m is not None:
                # kesir olarak yazılır, yüzde biçimi gösterir. 6 haneye yuvarlanır:
                # ham kesir 15 anlamlı basamağı aşınca kütüphane uyarı basıyor.
                t.write(i, c + 3, round(m, 6), style=z)
        t.write(i, c + 4, d, style=DURUM_STILI[d])

    # SAYI BİÇİMİ ŞART: numbers-parser float round-trip'te hassasiyet kaybediyor
    # (41.61 → 41.61000000000001). Açık biçim verilince Numbers doğru gösterir.
    # Biçim YALNIZ sayısal hücreye uygulanır — boş GRAM hücresi TextCell'dir ve
    # sayı biçimi TypeError verir.
    idx = {h: i for i, h in enumerate(basliklar)}
    for i, r in enumerate(rows, start=1):
        g = r["g"]
        var_fiyat = r["pc"] is not None
        if g is not None:
            t.set_cell_formatting(i, idx["GRAM"], "number", decimal_places=2)
            for h, dp in (("Maliyet", 2), ("Breakeven", 0), ("Hedef Fiyat", 0)):
                t.set_cell_formatting(i, idx[h], "currency",
                                      currency_code="USD", decimal_places=dp)
            if var_fiyat:
                t.set_cell_formatting(i, idx["Marj"], "percentage", decimal_places=1)
        if var_fiyat:
            t.set_cell_formatting(i, idx["Fiyat"], "currency",
                                  currency_code="USD", decimal_places=2)

    genislik = {"Bölüm": 110, "Listing": 330, "Etsy ID": 105, "SKU": 130,
                "Gram Kaynağı": 120, "Fiyat": 95, "GRAM": 80, "Maliyet": 95,
                "Breakeven": 105, "Hedef Fiyat": 110, "Marj": 85,
                "Durum": 130}
    for c, h in enumerate(basliklar):
        t.col_width(c, genislik.get(h, 110))
    return t


def ozet_sekmesi(doc, s, rows):
    doc.add_sheet("Listing Özeti")
    t = doc.sheets["Listing Özeti"].tables[0]
    t.name = "Listing Özeti"

    gruplar = {}
    for r in rows:
        gruplar.setdefault(r["lid"], []).append(r)
    sirali = sorted(gruplar.items(),
                    key=lambda kv: (-sum(1 for x in kv[1] if x["g"] is None),
                                    kv[1][0]["ch"] or ""))

    basliklar = ["Bölüm", "Listing", "Etsy ID", "Varyant", "Gramsız",
                 "Min Fiyat", "Max Fiyat", "Durum"]
    if len(sirali) + 1 > t.num_rows:
        t.add_row(len(sirali) + 1 - t.num_rows)
    if len(basliklar) > t.num_cols:
        t.add_column(len(basliklar) - t.num_cols)

    for c, h in enumerate(basliklar):
        t.write(0, c, h, style="baslik")

    for i, (lid, grup) in enumerate(sirali, start=1):
        z = "govde_z" if i % 2 == 0 else "govde"
        fiyatlar = [x["pc"] / 100 for x in grup if x["pc"] is not None]
        eksik = sum(1 for x in grup if x["g"] is None)
        d = "TÜMÜ EKSİK" if eksik == len(grup) else ("kısmen eksik" if eksik else "tam")
        t.write(i, 0, grup[0]["ch"] or "—", style=z)
        t.write(i, 1, grup[0]["title"] or "—", style=z)
        t.write(i, 2, str(lid), style=z)
        t.write(i, 3, float(len(grup)), style=z)
        t.write(i, 4, float(eksik), style="giris" if eksik else z)
        if fiyatlar:
            t.write(i, 5, round(min(fiyatlar), 2), style=z)
            t.write(i, 6, round(max(fiyatlar), 2), style=z)
        t.write(i, 7, d,
                style="kotu" if d == "TÜMÜ EKSİK" else ("bekle" if eksik else "ok"))
        for c in (3, 4):
            t.set_cell_formatting(i, c, "number", decimal_places=0)
        if fiyatlar:
            for c in (5, 6):
                t.set_cell_formatting(i, c, "currency", currency_code="USD",
                                      decimal_places=2)

    for c, w in enumerate((110, 330, 105, 90, 90, 105, 105, 130)):
        t.col_width(c, w)
    return t


def main():
    kaynak, cikti = sys.argv[1], sys.argv[2]
    rows = json.load(open(kaynak, encoding="utf-8"))
    eksik = [r for r in rows if r["g"] is None]
    n_listing = len(set(r["lid"] for r in rows))

    doc = Document()
    s = stiller(doc)
    kapak_sekmesi(doc, s, len(eksik), len(rows), n_listing)
    ayarlar_sekmesi(doc, s)
    formuller_sekmesi(doc, s)
    veri_sekmesi(doc, s, "Eksik Gramlar", eksik, kaynak_sutunu=False)
    veri_sekmesi(doc, s, "Tüm Varyantlar", rows, kaynak_sutunu=True)
    ozet_sekmesi(doc, s, rows)
    doc.save(cikti)

    print(f"{cikti} yazıldı")
    print(f"  Başlangıç      : kapak + nasıl kullanılır + lejant")
    print(f"  Ayarlar        : 7 sabit")
    print(f"  Formüller      : 6 açıklama + 5 kopyala-yapıştır formül")
    print(f"  Eksik Gramlar  : {len(eksik)} satır")
    print(f"  Tüm Varyantlar : {len(rows)} satır")
    print(f"  Listing Özeti  : {n_listing} listing")


if __name__ == "__main__":
    main()
