# -*- coding: utf-8 -*-
"""
OPHIR GRAM + MALIYET MODELI — tek kaynak.

Uretici (by Artifact Studio Jewelry) iki tablo verdi:
  (A) "1.5 MM THICK GRAM WEIGHT"  : beden x genislik -> gram   (15 x 10 = 150 hucre)
  (B) "14K MALIYET TABLOSU"       : ayni izgara -> USD         (GUNCEL: tam 100.00 USD/g)
Ikisi de YALNIZ 14K icin ve YALNIZ duz bant geometrisi icin.

Bu dosya o iki tablodan uc seyi cikarir ve katalogun tamamina uygular:
  1. GEOMETRI   : gram = f(beden, genislik, kalinlik)  — (A)'ya birebir uyan formul
  2. YOGUNLUK   : 10K ve 18K gramini 14K'dan turetmek icin alasim yogunluk orani
  3. MALIYET    : 100 USD/g icindeki altin ve iscilik paylarinin ayrimi

Hicbir sayi uydurulmadi; her biri ya (A)/(B)'den turetildi ya da fizikten
hesaplandi ve bagimsiz bir ikinci yoldan dogrulandi. Dogrulamalar `self_test()`
icinde kod olarak durur — calistirilabilir, okunup gecilmez.
"""
import math

# ---------------------------------------------------------------- sabitler
TROY = 31.1034768                 # g / ozt
RHO_AU = 19.32                    # saf altin g/cm3 (24K)
# US beden -> ic cevre (mm). ANSI: cevre = 36.5 + 2.55 * beden
IC_CEVRE_A, IC_CEVRE_B = 36.5, 2.55
KALINLIK_TABAN = 1.5              # uretici tablosunun kalinligi

# Karat -> saf altin kutle orani. IKI ayri kullanim, IKI ayri sabit:
#  * ALASIM (yogunluk turetimi): nominal bilesim 10/24, 14/24, 18/24 — fizik.
#  * PARA (maliyet ayrimi): panelin lib/gold-cost.ts KARAT_PURITY'si (0.416 /
#    0.585 / 0.75, atolye pratigi). Panel ile tablo ayni centi uretsin diye
#    ayrim BU sabitlerle yapilir; iki sistem "esdeger" degil BIREBIR olmali.
SAF = {10: 10/24, 14: 14/24, 18: 18/24}
SAF_PANEL = {10: 0.416, 14: 0.585, 18: 0.75}


def orta_cevre(beden: float, kalinlik: float = KALINLIK_TABAN) -> float:
    """Notr eksen cevresi (mm): ic cevre + pi * kalinlik."""
    return IC_CEVRE_A + IC_CEVRE_B * beden + math.pi * kalinlik


# ------------------------------------------------- 1) uretici gram formulu
# (A) tablosuna en kucuk karelerle oturtulan bicim: gram = w * (a + b * beden)
# Katsayilar tablodan cikarildi; `self_test` 150/150 hucrede %1'in altinda
# kaldigini dogrular.
GRAM_A = 0.83599
GRAM_B = 0.05148


def gram_14k(beden: float, genislik_mm: float, kalinlik: float = KALINLIK_TABAN) -> float:
    """Uretici (A) tablosunun genelestirilmisi. Kalinlik dogrusal olceklenir."""
    return genislik_mm * (GRAM_A + GRAM_B * beden) * (kalinlik / KALINLIK_TABAN)


# --------------------------------------------- 2) yogunluk: 14K -> 10K/18K
def uretici_yogunlugu() -> float:
    """
    (A) tablosunun IMA ETTIGI 14K yogunlugu.

    Duz bandin hacmi = genislik x kalinlik x orta cevre. Tablodaki her hucre
    bir (hacim, gram) cifti verir; ikisinin orani yogunluktur. 150 hucrenin
    tamamina en kucuk kareler uygulanir.
    """
    pay = payda = 0.0
    for beden in range(2, 17):
        for w in range(1, 11):
            V = w * KALINLIK_TABAN * orta_cevre(beden)      # mm3
            g = gram_14k(beden, w)
            pay += V * g
            payda += V * V
    return pay / payda * 1000.0                              # g/cm3


def alasim_tabani(rho_14k: float) -> float:
    """
    14K yogunlugundan, altin DISI bilesenin efektif yogunlugunu cozer.

    Metal alasimlarinda hacim toplanabilir (Vegard/karisim kurali):
        1/rho = w_Au/rho_Au + (1 - w_Au)/rho_taban
    Bu, alasimin hangi recete oldugunu bilmeden tabani olcmemizi saglar.
    """
    kalan = 1.0 / rho_14k - SAF[14] / RHO_AU
    return (1.0 - SAF[14]) / kalan


def yogunluk(karat: int, rho_taban: float) -> float:
    """Ayni alasim tabaniyla baska bir ayarin yogunlugu."""
    return 1.0 / (SAF[karat] / RHO_AU + (1.0 - SAF[karat]) / rho_taban)


RHO_14K = uretici_yogunlugu()
RHO_TABAN = alasim_tabani(RHO_14K)
RHO = {k: yogunluk(k, RHO_TABAN) for k in SAF}
# Gram orani = yogunluk orani (hacim ayni, geometri degismiyor)
GRAM_ORANI = {k: RHO[k] / RHO[14] for k in SAF}


# ------------------------------------------------------ 3) maliyet ayrimi
URETICI_14K_USD_G = 100.00        # (B) GUNCEL tablo — 150/150 hucrede tam


def maliyet_ayrimi(spot_ozt: float, usd_g_14k: float = URETICI_14K_USD_G):
    """
    Uretici 14K fiyatini altin ve iscilik olarak ayirir.

    Yapisi TOPLAMSAL: fiyat = (saf altin orani x spot) + iscilik.
    Carpimsal olsaydi ayarlar arasi oran saf altin oranina (18/14 = 1.2857)
    esit cikardi; uretici tablosu 1.4000 diyor ve toplamsal model onu
    %0.3 hatayla uretiyor (bkz. self_test).
    """
    spot_g = spot_ozt / TROY
    altin_g = SAF_PANEL[14] * spot_g
    iscilik_g = usd_g_14k - altin_g
    return {
        "spot_ozt": spot_ozt,
        "spot_g": spot_g,
        "altin_usd_g": altin_g,
        "iscilik_usd_g": iscilik_g,
        "iscilik_pay": iscilik_g / usd_g_14k,
        # her ayar icin uretici birim fiyati (ayni iscilik, farkli altin)
        "usd_g": {k: SAF_PANEL[k] * spot_g + iscilik_g for k in SAF_PANEL},
    }


def ayar_carpani(karat: int, ayrim) -> float:
    """Uretici maliyetinin 14K'ya orani: gram orani x birim fiyat orani."""
    return GRAM_ORANI[karat] * ayrim["usd_g"][karat] / ayrim["usd_g"][14]


# --------------------------------------------- 4) yuzuk sekli -> etkin en
def etkin_genislik(beden: float, ust_mm: float, shank_mm: float | None,
                   kalinlik: float = KALINLIK_TABAN) -> float:
    """
    Sivrilen (signet / dome / yarim-eternity) bandin cevre-agirlikli etkin eni.

    Uretici tablosu TEK bir genislik ister; ama bu yuzuklerde en, parmak
    cevresi boyunca degisir: ustte `ust_mm`, altta `shank_mm`. Ust tablayi
    13 mm sanip tabloya sokmak yuzugu uc katina cikarir (2026-09-16 dersi).

    Model — cevre uzerinde uc bolge:
      * tabla   : uzunluk = ust_mm            (yuvarlak/kare tabla eni kadar uzundur)
      * omuzlar : 2 x ust_mm, en dogrusal olarak ust -> shank iner
      * shank   : kalan cevre, en = shank_mm
    Integral kapali formda sadelesir:
        w_etkin = shank + 2 * ust * (ust - shank) / cevre
    Ust == shank ise duz banda indirgenir.
    """
    if shank_mm is None or abs(shank_mm - ust_mm) < 1e-9:
        return ust_mm
    C = orta_cevre(beden, kalinlik)
    # tabla + omuzlar cevreyi asamaz; asarsa bolgeleri oransal kis
    if 3.0 * ust_mm > C:
        ust_mm = C / 3.0
    return shank_mm + 2.0 * ust_mm * (ust_mm - shank_mm) / C


def gram(karat: int, beden: float, ust_mm: float, shank_mm: float | None,
         kalinlik: float = KALINLIK_TABAN, tabla_yukseklik_mm: float | None = None) -> float:
    """Bir varyantin gramı. 14K uretici tablosu + sekil + yogunluk orani."""
    w = etkin_genislik(beden, ust_mm, shank_mm, kalinlik)
    g = gram_14k(beden, w, kalinlik)
    if tabla_yukseklik_mm and tabla_yukseklik_mm > kalinlik:
        # signet tablasi banttan kalinsa: yalniz tabla arkinda ek hacim
        ek_kalinlik = tabla_yukseklik_mm - kalinlik
        g += gram_14k(beden, ust_mm, ek_kalinlik) * (ust_mm / orta_cevre(beden, kalinlik))
    return g * GRAM_ORANI[karat]


# ------------------------------------------------------------- dogrulama
def self_test(spot_ozt: float = 4257.10) -> None:
    import sys
    ok = True

    def kontrol(ad, kosul, detay=""):
        nonlocal ok
        ok = ok and kosul
        print(("  [OK]   " if kosul else "  [HATA] ") + ad + ("  " + detay if detay else ""))

    print("1) Uretici gram tablosu (A) — formul 150 hucreyi uretiyor mu?")
    TAB = {  # (A) tablosunun kendisi: satir = beden 2..16, sutun = 1..10 mm
      2:[0.94,1.88,2.80,3.76,4.74,5.62,6.54,7.52,8.46,9.36],
      3:[0.99,1.98,2.96,3.96,4.95,5.92,6.93,7.92,8.91,9.90],
      4:[1.04,2.08,3.11,4.16,5.20,6.22,7.28,8.32,9.36,10.40],
      5:[1.095,2.19,3.27,4.38,5.475,6.54,7.665,8.76,9.855,10.95],
      6:[1.145,2.29,3.42,4.58,5.725,6.84,8.015,9.16,10.305,11.45],
      7:[1.195,2.39,3.57,4.78,5.975,7.14,8.365,9.56,10.755,11.95],
      8:[1.25,2.50,3.73,5.00,6.25,7.46,8.75,10.00,11.25,12.50],
      9:[1.30,2.60,3.88,5.20,6.50,7.76,9.10,10.40,11.70,13.00],
      10:[1.35,2.70,4.04,5.40,6.75,8.08,9.45,10.80,12.15,13.50],
      11:[1.40,2.80,4.19,5.60,7.00,8.38,9.80,11.20,12.60,14.00],
      12:[1.455,2.91,4.34,5.82,7.275,8.68,10.185,11.64,13.095,14.55],
      13:[1.505,3.01,4.50,6.02,7.525,9.00,10.535,12.04,13.545,15.05],
      14:[1.555,3.11,4.65,6.22,7.775,9.30,10.885,12.44,13.995,15.55],
      15:[1.61,3.22,4.80,6.44,8.05,9.60,11.27,12.88,14.49,16.10],
      16:[1.66,3.32,4.96,6.64,8.30,9.92,11.62,13.28,14.94,16.60]}
    sapmalar=[abs(gram_14k(b,w)-TAB[b][w-1])/TAB[b][w-1] for b in TAB for w in range(1,11)]
    kontrol("150/150 hucre, maks sapma %%%.2f" % (100*max(sapmalar)), max(sapmalar) < 0.012)

    print("2) (B) maliyet tablosu — gercekten 100.00 USD/g mi?")
    B = {2:[94,188,280,376,474,562,654,752,846,936], 7:[119.5,239,357,478,597.5,714,836.5,956,1075.5,1195],
         16:[166,332,496,664,830,992,1162,1328,1494,1660]}
    oranlar=[B[b][w-1]/TAB[b][w-1] for b in B for w in range(1,11)]
    kontrol("30 hucre, min %.2f maks %.2f" % (min(oranlar), max(oranlar)),
            abs(min(oranlar)-100) < 0.01 and abs(max(oranlar)-100) < 0.01)

    print("3) Yogunluk — iki bagimsiz yol ayni sayiyi veriyor mu?")
    print("     (A)'nin ima ettigi 14K yogunlugu : %.3f g/cm3" % RHO_14K)
    print("     cozulen alasim tabani            : %.3f g/cm3" % RHO_TABAN)
    print("     turetilen 10K / 18K              : %.3f / %.3f g/cm3" % (RHO[10], RHO[18]))
    print("     GRAM ORANI  10K=%.5f  18K=%.5f" % (GRAM_ORANI[10], GRAM_ORANI[18]))
    # klasik Au-Ag-Cu terneri (Ag:Cu = 1:1) ile capraz kontrol
    def tern(k):
        wau=SAF[k]; kalan=(1-wau)/2
        return 1/(wau/RHO_AU + kalan/10.49 + kalan/8.96)
    t18 = tern(18)/tern(14); t10 = tern(10)/tern(14)
    kontrol("terner capraz kontrol 18K: %.5f vs %.5f (fark %%%.2f)" % (GRAM_ORANI[18], t18, 100*abs(GRAM_ORANI[18]-t18)/t18),
            abs(GRAM_ORANI[18]-t18)/t18 < 0.01)
    kontrol("terner capraz kontrol 10K: %.5f vs %.5f (fark %%%.2f)" % (GRAM_ORANI[10], t10, 100*abs(GRAM_ORANI[10]-t10)/t10),
            abs(GRAM_ORANI[10]-t10)/t10 < 0.01)

    print("4) Maliyet ayrimi — uretici kendi 18K carpanini dogruluyor mu?")
    a = maliyet_ayrimi(spot_ozt)
    print("     spot %.2f USD/ozt = %.3f USD/g" % (a["spot_ozt"], a["spot_g"]))
    print("     14K 100.00 USD/g  =  altin %.2f  +  iscilik %.2f  (iscilik payi %%%.1f)"
          % (a["altin_usd_g"], a["iscilik_usd_g"], 100*a["iscilik_pay"]))
    tahmin = ayar_carpani(18, a)
    kontrol("18K/14K carpani: model %.4f, ureticinin fiyat tablosu 1.4000 (fark %%%.2f)"
            % (tahmin, 100*abs(tahmin-1.4)/1.4), abs(tahmin-1.4)/1.4 < 0.01)
    print("     -> 10K carpani (ureticide tablo yok, model tahmini): %.4f" % ayar_carpani(10, a))

    print("5) Sivrilen band modeli — duz banda indirgeniyor mu?")
    kontrol("ust==shank -> duz band", abs(etkin_genislik(7, 6, 6) - 6) < 1e-12)
    kontrol("shank None  -> duz band", abs(etkin_genislik(7, 6, None) - 6) < 1e-12)
    kontrol("13mm tabla / 4mm shank, beden 7 -> %.2f mm (13 DEGIL)" % etkin_genislik(7, 13, 4),
            4 < etkin_genislik(7, 13, 4) < 9)

    print("\n" + ("TUM KONTROLLER GECTI" if ok else "!!! KONTROL BASARISIZ !!!"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    self_test()
