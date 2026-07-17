#!/usr/bin/env python3
"""EON Katalog v3 üretici — yarım bedenler + tek 1.5mm kalınlık.

v2'den farklar (kullanıcı direktifi):
  * Bedenler: US 4, 4.5, 5, ... 16 = 25 beden (yarım ölçüler eklendi).
    Yarım-beden gramı komşu tam bedenlerin DOĞRUSAL orta-noktasıdır; gram
    tabloları satır-doğrusal olduğu için bu interpolasyon birebir geçerli.
  * Kalınlık: yalnız 1.5mm (2.0mm kaldırıldı). SKU'dan T15/T20 token'ı düştü.
  * Varyant: 25 beden x 11 genişlik = 275/listing; 39 x 275 = 10.725.

Fiyat: v2 ile aynı formül —
    fiyat = ceil(gram * hedef_ppg_cent / 500) * 500 + 1000   ($5 yukarı + $10 kargo)

hedef ppg (cent/g): 10K 10730 · 14K standart 15820 · 18K 19320.
YILDIZ ürün GLD-R-1401 (14K Yellow Dome) 14K yıldız hedefi 13560 (en rekabetçi).

Girdi:  eon-weight-tables.json (repoda; gram tabloları + 22 düzeltme kaydı).
Çıktı:  eon-v3-catalog.json (39 listing x 275 varyant, sku/props/gram/fiyat).

Kullanım:
    python3 gen_catalog_v3.py            # üret + doğrula + özet
    python3 gen_catalog_v3.py --emit-sql # ayrıca variant transform SQL yaz

Not: Metin (39 açıklama) burada üretilmez — sessiz-lüks açıklamalar ayrı
workflow çıktısıdır ve canlı kayıt supabase/migrations/0101_eon_catalog_v3.sql
dosyasındadır. Bu script yapı/fiyat katmanının kaynağıdır.
"""
import json
import math
import sys

SHIP_CENTS = 1000  # $10 sabit kargo payı (ücretsiz kargo → satıcı üstlenir)

# Hedef $/g (cent). Standart vs yıldız; yıldız yalnız GLD-R-1401.
PPG_STD = {"10K": 10730, "14K": 15820, "18K": 19320}
PPG_STAR = {"14K": 13560}
STAR_FAMILY = "GLD-R-1401"

# 25 beden: 4, 4.5, ... 16
SIZES = [4 + 0.5 * i for i in range(25)]

# Tip kodu (SKU 4-hane KARAT+TİP): 01 Dome · 02 Flat · 03 Beveled · 04 Milgrain · 05 Knife
TYPE_CODE = {"01": "Dome", "02": "Flat", "03": "Beveled", "04": "Milgrain", "05": "Knife Edge"}
COLOR_META = {"GLD": "Yellow Gold", "WHG": "White Gold", "RSG": "Rose Gold"}
KARAT_PREFIX = {"10": "10K", "14": "14K", "18": "18K"}

# 39 aile = 13 tip×renk × 3 karat. Knife yalnız yellow (mevcut kapsam).
# tip×renk düzeni: her tip için renk sırası GLD, WHG, RSG (Knife yalnız GLD).
TYPE_COLORS = {
    "01": ["GLD", "WHG", "RSG"],
    "02": ["GLD", "WHG", "RSG"],
    "03": ["GLD", "WHG", "RSG"],
    "04": ["GLD", "WHG", "RSG"],
    "05": ["GLD"],
}


def fmt_size(s: float) -> str:
    """9 -> '9', 4.5 -> '4.5'."""
    return str(int(s)) if s == int(s) else str(s)


def build_families() -> list[dict]:
    """39 aileyi (renk, karat, tip) döndür — SKU = <RENK>-R-<KARAT+TİP>."""
    fams = []
    for tcode, colors in TYPE_COLORS.items():
        for color in colors:
            for kp, karat in KARAT_PREFIX.items():
                family = f"{color}-R-{kp}{tcode}"
                fams.append({"family": family, "color": color, "karat": karat,
                             "type": TYPE_CODE[tcode], "type_code": tcode})
    return fams


def gram_1_5(wt: dict, karat: str, width: int, size: float) -> float:
    """1.5mm satırından gram; yarım beden = komşu tam bedenlerin orta-noktası."""
    whole = wt["sizes"]                              # [4..16]
    row = wt["weights_grams"][karat][str(width)]["1.5"]
    if size == int(size):
        return row[whole.index(int(size))]
    lo = int(math.floor(size)); hi = lo + 1
    return round((row[whole.index(lo)] + row[whole.index(hi)]) / 2, 3)


def price_cents(grams: float, ppg: int) -> int:
    return math.ceil(grams * ppg / 500) * 500 + SHIP_CENTS


def generate() -> dict:
    wt = json.load(open("eon-weight-tables.json"))
    widths = wt["widths_mm"]                         # [2..12] = 11
    listings, total = [], 0
    for m in build_families():
        fam, karat, color = m["family"], m["karat"], m["color"]
        ppg = PPG_STAR.get(karat, PPG_STD[karat]) if fam == STAR_FAMILY else PPG_STD[karat]
        variants = []
        for w in widths:
            for s in SIZES:
                g = gram_1_5(wt, karat, w, s)
                variants.append({
                    "sku": f"{fam}-{w}MM-{fmt_size(s)}",
                    "properties": {
                        "Karat": karat, "Metal": COLOR_META[color],
                        "Width": f"{w}mm", "Ring Size": fmt_size(s),
                    },
                    "weight_grams": g,
                    "price_cents": price_cents(g, ppg),
                    "quantity": 20,
                })
        # --- iç doğrulamalar (fail = üretim durur) ---
        assert len(variants) == 25 * 11 == 275, f"{fam}: {len(variants)} varyant"
        assert len({v["sku"] for v in variants}) == 275, f"{fam}: SKU tekilliği kırık"
        for v in variants:
            assert v["weight_grams"] > 0 and v["price_cents"] > SHIP_CENTS
        total += len(variants)
        listings.append({
            "family": fam, "karat": karat, "color": color, "type": m["type"],
            "ppg_cents": ppg, "variants_count": len(variants),
            "price_min": min(v["price_cents"] for v in variants),
            "price_max": max(v["price_cents"] for v in variants),
            "variants": variants,
        })
    assert len(listings) == 39, f"{len(listings)} listing (39 beklenir)"
    assert total == 10725, f"{total} varyant (10.725 beklenir)"
    return {"listings": listings, "total_variants": total}


def emit_sql(catalog: dict) -> None:
    """Varyant transform SQL'i yaz (v2 sil + v3 ekle). Kayıt/parça amaçlı."""
    lines = ["-- gen_catalog_v3.py --emit-sql çıktısı (variant transform)",
             "delete from product_variants v using products p",
             "where v.product_id=p.id and p.org_id=(select id from organizations where name='EON')",
             "  and v.weight_source in ('catalog_v2');"]
    for L in catalog["listings"]:
        for v in L["variants"]:
            props = json.dumps(v["properties"]).replace("'", "''")
            lines.append(
                "insert into product_variants (org_id, sku, product_id, properties, "
                "price_cents, quantity, weight_grams, weight_source, active, currency) "
                "select (select id from organizations where name='EON'), "
                f"'{v['sku']}', p.id, '{props}'::jsonb, {v['price_cents']}, 20, "
                f"{v['weight_grams']}, 'catalog_v3', true, 'USD' from products p "
                f"where p.sku='{L['family']}' and p.org_id=(select id from organizations where name='EON');")
    open("eon-v3-variants.sql", "w").write("\n".join(lines) + "\n")
    print("yazıldı: eon-v3-variants.sql")


if __name__ == "__main__":
    cat = generate()
    json.dump({"listings": cat["listings"]}, open("eon-v3-catalog.json", "w"),
              ensure_ascii=False)
    print(f"listing: {len(cat['listings'])} | toplam varyant: {cat['total_variants']} "
          f"| listing başına: {cat['total_variants'] // len(cat['listings'])}")
    star = next(L for L in cat["listings"] if L["family"] == STAR_FAMILY)
    smp = {v["sku"]: v for v in star["variants"]}
    for sku in ("GLD-R-1401-6MM-7", "GLD-R-1401-6MM-4.5", "GLD-R-1401-2MM-16"):
        v = smp[sku]
        print(f"  {sku}  {v['weight_grams']}g  ${v['price_cents'] / 100:.2f}")
    if "--emit-sql" in sys.argv:
        emit_sql(cat)
