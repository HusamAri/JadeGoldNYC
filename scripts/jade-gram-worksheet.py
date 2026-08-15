#!/usr/bin/env python3
"""
Jade Gold — gram & fiyat çalışma dosyası (XLSX) üreteci.

NEDEN VAR: 121 varyantın gramı yok ve gram olmadan maliyet, dolayısıyla marj
hesaplanamıyor. ShipStation kaynağı kurudu (gram oraya *internal notes* alanına
elle yazılıyor ve notu dolu olan tüm SKU'lar zaten çekilmiş), açıklama metni
yalnız tek-varyantlı listinglerde güvenilir. Kalan tek yol terazi + elle giriş;
bu dosya ekibin o girişi yapacağı yer.

FORMÜLLER HÜCREDE CANLI: ekip gram yazdığı anda maliyet/hedef fiyat/marj kendi
hesaplanır. Tüm sabitler `Ayarlar` sekmesinde tek yerde — altın fiyatı değişince
bir hücre güncellenir, 1.944 satır yeniden hesaplanır.

Formüller `lib/jade/pricing.ts` ile AYNI olmalı; ikisi ayrı yerde yaşıyor, biri
değişirse diğeri de değişmeli (SQL↔TS drift dersi).

Kullanım:  python3 scripts/jade-gram-worksheet.py catalog.json cikti.xlsx
catalog.json biçimi: [{"ch","lid","title","sku","g","pc","ws"}, ...]
"""
import json
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

# Ayarlar sekmesindeki hücre adresleri — formüller buraya bağlanır.
C_GRAM = "Ayarlar!$B$2"      # $/gram (her şey dahil tedarikçi)
C_SHIP = "Ayarlar!$B$3"      # kargo
C_PACK = "Ayarlar!$B$4"      # ambalaj
C_DISC = "Ayarlar!$B$5"      # kalıcı indirim
C_RATE = "Ayarlar!$B$6"      # Etsy oransal kesinti
C_FIX = "Ayarlar!$B$7"       # Etsy sabit kesinti
C_MARGIN = "Ayarlar!$B$8"    # hedef marj

SARI = PatternFill("solid", fgColor="FFF3C4")   # doldurulacak alan
GRI = PatternFill("solid", fgColor="EFEFEF")
BASLIK = Font(bold=True)
KIRMIZI = Font(color="B00020", bold=True)

# Fiyatı bunun üstünde olan satır placeholder sayılır (canlıda $34.999,99 gibi
# dolgu değerler var; gram girilse bile marjları anlamsız çıkar).
SUPHELI_FIYAT = 30000


def ayarlar_sekmesi(wb):
    ws = wb.create_sheet("Ayarlar", 0)
    ws["A1"], ws["B1"] = "AYAR", "DEĞER"
    ws["A1"].font = ws["B1"].font = BASLIK
    satirlar = [
        ("Altın maliyeti ($/gram)", 106, "Her şey dahil tedarikçi faturası: ham altın + işçilik + taş"),
        ("Kargo ($)", 5, "Ücretsiz kargo — bedeli satıcıda"),
        ("Ambalaj ($)", 1.5, ""),
        ("Etsy indirimi", 0.15, "Kalıcı mağaza indirimi — tahsilat = liste × 0,85"),
        ("Etsy oransal kesinti", 0.095, "%6,5 işlem + %3 ödeme"),
        ("Etsy sabit kesinti ($)", 0.25, ""),
        ("Hedef net marj", 0.20, "Fiyat önerisi bu marja göre hesaplanır"),
    ]
    for i, (ad, deger, aciklama) in enumerate(satirlar, start=2):
        ws.cell(i, 1, ad)
        ws.cell(i, 2, deger)
        ws.cell(i, 3, aciklama)
    for r in (5, 6, 8):
        ws.cell(r, 2).number_format = "0.0%"
    ws.column_dimensions["A"].width = 26
    ws.column_dimensions["B"].width = 12
    ws.column_dimensions["C"].width = 62
    ws["A10"] = "Bu sekmedeki değerleri değiştirince tüm sayfalar yeniden hesaplanır."
    ws["A10"].font = Font(italic=True)
    return ws


def _formuller(r, gram_h, fiyat_h):
    """Bir satırın hesap formülleri. gram_h/fiyat_h = sütun harfleri."""
    g, f = f"{gram_h}{r}", f"{fiyat_h}{r}"
    maliyet = f"{g}*{C_GRAM}+{C_SHIP}+{C_PACK}"
    tahsilat = f"{f}*(1-{C_DISC})"
    net = f"{tahsilat}-({tahsilat}*{C_RATE}+{C_FIX})-({maliyet})"
    return {
        "maliyet": f'=IF({g}="","",{maliyet})',
        "breakeven": f'=IF({g}="","",ROUNDUP((({maliyet})+{C_FIX})/((1-{C_DISC})*(1-{C_RATE})),0))',
        "hedef": f'=IF({g}="","",ROUNDUP((({maliyet})+{C_FIX})/((1-{C_DISC})*(1-{C_RATE}-{C_MARGIN})),0))',
        "marj": f'=IF(OR({g}="",{f}=""),"",({net})/({tahsilat}))',
    }


def _durum(r, gram_h, fiyat_h, marj_h, breakeven_h):
    g, f = f"{gram_h}{r}", f"{fiyat_h}{r}"
    return (
        f'=IF({g}="","GRAM EKSİK",'
        f'IF({f}>{SUPHELI_FIYAT},"FİYAT ŞÜPHELİ",'
        f'IF({marj_h}{r}<0,"ZARARDA",'
        f'IF({f}<{breakeven_h}{r},"RİSKLİ","ok"))))'
    )


def veri_sekmesi(wb, ad, rows, kaynak_sutunu):
    ws = wb.create_sheet(ad)
    basliklar = ["Bölüm", "Listing", "Etsy ID", "SKU"]
    if kaynak_sutunu:
        basliklar.append("Gram Kaynağı")
    basliklar += ["Fiyat $", "GRAM", "Maliyet $", "Breakeven $",
                  "Hedef Fiyat $", "Marj", "Durum", "Etsy Linki"]
    ws.append(basliklar)
    for c in range(1, len(basliklar) + 1):
        ws.cell(1, c).font = BASLIK
        ws.cell(1, c).fill = GRI

    # Sütun harfleri başlık sırasına göre çözülür (iki sekmede farklı).
    idx = {h: get_column_letter(i + 1) for i, h in enumerate(basliklar)}
    F, G = idx["Fiyat $"], idx["GRAM"]
    K, M, H, B = idx["Marj"], idx["Maliyet $"], idx["Hedef Fiyat $"], idx["Breakeven $"]

    for i, r in enumerate(rows, start=2):
        satir = [r["ch"], r["title"], r["lid"], r["sku"]]
        if kaynak_sutunu:
            satir.append(r["ws"] or "—")
        satir += [
            (r["pc"] / 100) if r["pc"] is not None else None,
            r["g"],  # None ise boş kalır → ekip doldurur
        ]
        ws.append(satir)
        fm = _formuller(i, G, F)
        ws[f"{M}{i}"] = fm["maliyet"]
        ws[f"{B}{i}"] = fm["breakeven"]
        ws[f"{H}{i}"] = fm["hedef"]
        ws[f"{K}{i}"] = fm["marj"]
        ws[f"{idx['Durum']}{i}"] = _durum(i, G, F, K, B)
        ws[f"{idx['Etsy Linki']}{i}"] = f'https://www.etsy.com/listing/{r["lid"]}'
        if r["g"] is None:
            ws[f"{G}{i}"].fill = SARI
        for col in (F, M, B, H):
            ws[f"{col}{i}"].number_format = '#,##0.00'
        ws[f"{K}{i}"].number_format = "0.0%"

    genislik = {"Bölüm": 12, "Listing": 46, "Etsy ID": 12, "SKU": 16,
                "Gram Kaynağı": 14, "Fiyat $": 11, "GRAM": 9, "Maliyet $": 11,
                "Breakeven $": 12, "Hedef Fiyat $": 13, "Marj": 9,
                "Durum": 15, "Etsy Linki": 42}
    for h, harf in idx.items():
        ws.column_dimensions[harf].width = genislik.get(h, 12)
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(basliklar))}{len(rows) + 1}"
    return ws


def ozet_sekmesi(wb, rows):
    ws = wb.create_sheet("Listing Özeti")
    ws.append(["Bölüm", "Listing", "Etsy ID", "Varyant", "Gramsız",
               "Min Fiyat $", "Max Fiyat $", "Durum", "Etsy Linki"])
    for c in range(1, 10):
        ws.cell(1, c).font = BASLIK
        ws.cell(1, c).fill = GRI

    gruplar = {}
    for r in rows:
        gruplar.setdefault(r["lid"], []).append(r)

    sirali = sorted(gruplar.items(),
                    key=lambda kv: (-sum(1 for x in kv[1] if x["g"] is None), kv[1][0]["ch"]))
    for lid, grup in sirali:
        fiyatlar = [x["pc"] / 100 for x in grup if x["pc"] is not None]
        eksik = sum(1 for x in grup if x["g"] is None)
        ws.append([
            grup[0]["ch"], grup[0]["title"], lid, len(grup), eksik,
            min(fiyatlar) if fiyatlar else None,
            max(fiyatlar) if fiyatlar else None,
            "TÜMÜ EKSİK" if eksik == len(grup) else ("kısmen eksik" if eksik else "tam"),
            f"https://www.etsy.com/listing/{lid}",
        ])
    for i in range(2, ws.max_row + 1):
        if ws.cell(i, 5).value:
            ws.cell(i, 5).font = KIRMIZI
        for c in (6, 7):
            ws.cell(i, c).number_format = '#,##0.00'
    for harf, w in zip("ABCDEFGHI", (12, 46, 12, 9, 9, 12, 12, 14, 42)):
        ws.column_dimensions[harf].width = w
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:I{ws.max_row}"
    return ws


def main():
    kaynak, cikti = sys.argv[1], sys.argv[2]
    rows = json.load(open(kaynak, encoding="utf-8"))
    eksik = [r for r in rows if r["g"] is None]

    wb = Workbook()
    wb.remove(wb.active)
    ayarlar_sekmesi(wb)
    veri_sekmesi(wb, "Eksik Gramlar", eksik, kaynak_sutunu=False)
    veri_sekmesi(wb, "Tüm Varyantlar", rows, kaynak_sutunu=True)
    ozet_sekmesi(wb, rows)
    wb.save(cikti)

    print(f"{cikti} yazıldı")
    print(f"  Eksik Gramlar : {len(eksik)} satır")
    print(f"  Tüm Varyantlar: {len(rows)} satır")
    print(f"  Listing Özeti : {len(set(r['lid'] for r in rows))} listing")


if __name__ == "__main__":
    main()
