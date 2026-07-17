#!/usr/bin/env python3
"""EON katalog v2 üretici — 39 listing × 286 varyant.

Girdi:
  eon-weight-tables.json  (3 karat gram tablosu, 22 düzeltme uygulanmış)
  eon-wf-output.json      (workflow çıktısı: pricing + 39 listing metni)
Çıktı:
  eon-new-catalog.json    (tam katalog: doğrulama + döküm)
  sql/0100_eon_catalog_v2.sql  (repo migration'ı — tam seed)
  sql/step1_archive.sql, step2_staging.sql, texts_NN.sql, grams_N.sql,
  step5_master.sql, step6_verify.sql, step7_cleanup.sql (MCP parçaları)

Kullanım: python3 gen_catalog_v2.py [--placeholder]
  --placeholder: workflow çıktısı olmadan yapı testi (dummy metin/fiyat).
"""
import json, math, os, sys, re

SP = os.path.dirname(os.path.abspath(__file__))
OUT_SQL = os.path.join(SP, "sql")
os.makedirs(OUT_SQL, exist_ok=True)

PLACEHOLDER = "--placeholder" in sys.argv

# ── Sabitler ──────────────────────────────────────────────────────────
COLORS = {"GLD": "Yellow Gold", "WHG": "White Gold", "RSG": "Rose Gold"}
TYPES = [
    ("01", "Dome", ["GLD", "WHG", "RSG"]),
    ("02", "Flat", ["GLD", "WHG", "RSG"]),
    ("03", "Beveled", ["GLD", "WHG", "RSG"]),
    ("04", "Milgrain", ["GLD", "WHG", "RSG"]),
    ("05", "Knife Edge", ["GLD"]),
]
KARATS = ["10K", "14K", "18K"]
KPREF = {"10K": "10", "14K": "14", "18K": "18"}
QTY = 20
HERO_BASE = "https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/eon-media/hero/"
# tip×renk → hero görsel no; Dome 10K'nın kendi çekimleri var (04-06)
HERO = {
    ("Dome", "GLD"): "01", ("Dome", "WHG"): "02", ("Dome", "RSG"): "03",
    ("Flat", "GLD"): "07", ("Flat", "WHG"): "08", ("Flat", "RSG"): "09",
    ("Beveled", "GLD"): "10", ("Beveled", "WHG"): "11", ("Beveled", "RSG"): "12",
    ("Milgrain", "GLD"): "13", ("Milgrain", "WHG"): "14", ("Milgrain", "RSG"): "15",
    ("Knife Edge", "GLD"): "16",
}
HERO_10K_DOME = {"GLD": "04", "WHG": "05", "RSG": "06"}

# ── Girdiler ──────────────────────────────────────────────────────────
wt = json.load(open(os.path.join(SP, "eon-weight-tables.json")))
SIZES = wt["sizes"]            # [4..16]
WIDTHS = wt["widths_mm"]       # [2..12]
THICKS = wt["thickness_mm"]    # ["1.5","2"]
assert len(SIZES) == 13 and len(WIDTHS) == 11 and len(THICKS) == 2

if PLACEHOLDER:
    pricing = {
        "per_karat": {
            "10K": {"breakeven_ppg_usd": 72.2, "standard_target_ppg_usd": 110.0, "star_target_ppg_usd": 98.0},
            "14K": {"breakeven_ppg_usd": 112.2, "standard_target_ppg_usd": 155.0, "star_target_ppg_usd": 138.0},
            "18K": {"breakeven_ppg_usd": 143.3, "standard_target_ppg_usd": 200.0, "star_target_ppg_usd": 177.0},
        },
        "star_family": "GLD-R-1401",
    }
    texts = None
else:
    wf = json.load(open(os.path.join(SP, "eon-wf-output.json")))
    pricing = wf["pricing"]
    texts = {l["family"]: l for l in wf["listings"]}

# ── Listing planı (39) ────────────────────────────────────────────────
listings = []
no = 0
for tcode, tname, tcolors in TYPES:
    for color in tcolors:
        for karat in KARATS:
            no += 1
            family = f"{color}-R-{KPREF[karat]}{tcode}"
            hero_no = HERO_10K_DOME[color] if (tname == "Dome" and karat == "10K") else HERO[(tname, color)]
            listings.append({
                "no": no, "family": family, "karat": karat,
                "color_code": color, "color": COLORS[color], "type": tname,
                "image_url": HERO_BASE + hero_no + ".jpg",
            })
assert len(listings) == 39, len(listings)

# ── Metinler ──────────────────────────────────────────────────────────
def placeholder_text(l):
    kw = f"{l['karat']} {l['color']} {l['type']} Wedding Band"
    return {
        "title": f"{kw}, Solid Gold Made to Order (PLACEHOLDER)",
        "tags": [f"tag {i:02d}" for i in range(1, 14)],
        "description": ("PLACEHOLDER — workflow çıktısı beklenmektedir. " * 20).strip(),
        "materials": ["Solid gold", f"{l['karat'].lower()} gold"],
    }

TRAILER_NOTE = ("Varyasyon kurulumu: Ring Size 4-16 tek sayi (13) x Width 22 deger "
                "(2-12mm x 1.5/2.0mm kalinlik); fiyat+SKU iki eksende (property 513,514); "
                "adet 20/varyant; kisisellestirme max 30 karakter")

for l in listings:
    t = texts[l["family"]] if texts else placeholder_text(l)
    if texts:
        missing = [k for k in ("title", "tags", "description", "materials") if not t.get(k)]
        assert not missing, f"{l['family']}: eksik alan {missing}"
    l["title"] = t["title"].strip()
    l["tags"] = [x.strip() for x in t["tags"]]
    l["materials"] = [x.strip() for x in t["materials"]]
    body = t["description"].strip()
    l["description"] = f"{body}\n\n---\n[EON {l['no']:02d} · {l['family']} · {TRAILER_NOTE}]"
    l["research_keyword"] = f"{l['karat'].lower()} {l['color'].lower()} {l['type'].lower()} wedding band"

# ── Fiyat + varyantlar ────────────────────────────────────────────────
def ppg_usd(l):
    pk = pricing["per_karat"][l["karat"]]
    is_star = l["family"] == pricing.get("star_family")
    return pk["star_target_ppg_usd"] if is_star else pk["standard_target_ppg_usd"]

# Ücretsiz kargo → posta bedeli fiyata gömülür (kullanıcı kararı). Yüzük hafif,
# kargo pratikte sabit; ABD takipli posta ~$5-6 + gömülü tutara Etsy/ödeme
# ücreti + tampon. $5 katı korunur.
SHIPPING_ALLOWANCE_CENTS = 10_00

def price_cents(grams, ppg):
    raw = grams * ppg * 100.0
    gold = math.ceil(raw / 500.0) * 500  # $5 adımına YUKARI
    return int(gold + SHIPPING_ALLOWANCE_CENTS)

all_skus = set()
total_variants = 0
for l in listings:
    ppg = ppg_usd(l)
    be = pricing["per_karat"][l["karat"]]["breakeven_ppg_usd"]
    l["target_ppg_usd"] = ppg
    variants = []
    for w in WIDTHS:
        for th in THICKS:
            tlabel = "1.5" if th == "1.5" else "2.0"
            tsku = "T15" if th == "1.5" else "T20"
            grams_row = wt["weights_grams"][l["karat"]][str(w)][th]
            assert len(grams_row) == 13
            for i, size in enumerate(SIZES):
                g = grams_row[i]
                sku = f"{l['family']}-{w}MM-{tsku}-{size}"
                pc = price_cents(g, ppg)
                assert pc >= be * g * 100, f"{sku}: fiyat {pc} breakeven altında"
                assert sku not in all_skus, f"SKU çakışması: {sku}"
                all_skus.add(sku)
                variants.append({
                    "sku": sku,
                    "properties": {
                        "Karat": l["karat"], "Metal": l["color"],
                        "Width": f"{w}mm · {tlabel}mm thick",
                        "Ring Size": str(size),
                    },
                    "weight_grams": g,
                    "price_cents": pc,
                    "quantity": QTY,
                })
    assert len(variants) == 286, len(variants)
    total_variants += len(variants)
    l["variants"] = variants
    prices = [v["price_cents"] for v in variants]
    l["price_min_cents"], l["price_max_cents"] = min(prices), max(prices)

assert total_variants == 11154, total_variants
assert len(all_skus) == 11154

# Örneklem gram doğrulaması (kaynak tablo birebir)
checks = [("14K", 2, "1.5", 4, 1.56), ("14K", 12, "2", 16, 20.06),
          ("10K", 12, "2", 16, 17.65), ("18K", 2, "1.5", 4, 2.04),
          ("10K", 6, "2", 7, 6.44), ("18K", 8, "2", 10, 13.06)]
for k, w, th, s, want in checks:
    got = wt["weights_grams"][k][str(w)][th][SIZES.index(s)]
    assert abs(got - want) < 0.005, (k, w, th, s, got, want)

# ── Metin doğrulamaları (yalnız gerçek metinlerde) ────────────────────
if texts:
    for l in listings:
        assert len(l["title"]) <= 140, f"{l['family']}: başlık {len(l['title'])}"
        assert len(l["tags"]) == 13, f"{l['family']}: tag sayısı {len(l['tags'])}"
        for tg in l["tags"]:
            assert len(tg) <= 20, f"{l['family']}: uzun tag '{tg}'"
        body = l["description"]
        assert "$" not in body.split("---")[0], f"{l['family']}: dolar işareti"
        assert not re.search(r"\b\d+(?:\.\d+)?\s*(?:g|gr|grams?)\b", body.split("---")[0], re.I), \
            f"{l['family']}: gram rakamı"

# ── JSON dökümü ───────────────────────────────────────────────────────
catalog = {"listings": listings, "pricing": pricing, "qty": QTY,
           "sizes": SIZES, "widths_mm": WIDTHS, "thickness_mm": THICKS}
with open(os.path.join(SP, "eon-new-catalog.json"), "w") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=1)

# ── SQL üretimi ───────────────────────────────────────────────────────
def sql_str(s):
    return "$eon$" + s.replace("$eon$", "") + "$eon$"

def sql_arr(items):
    return "ARRAY[" + ",".join(sql_str(x) for x in items) + "]::text[]"

ARCHIVE = """-- Eski EON taslaklarını arşive (katalog v2 bunların yerini alır).
-- GÜVENLİK: yalnız sku'suz (eski) taslaklar — katalog v2 listing'leri aile
-- kodlu sku taşır, bu koşul onları KORUR (idempotent; yeni seti arşivlemez).
update products set archived_at = now(), updated_at = now()
 where org_id = (select id from organizations where name = 'EON')
   and etsy_listing_id is null and archived_at is null and status = 'draft'
   and sku is null;
"""

STAGING = """create table if not exists public.eon_seed_texts (
  no int primary key, family text unique not null, title text not null,
  description text not null, tags text[] not null, materials text[] not null,
  image_url text, research_keyword text, ppg_cents int not null, karat text not null,
  research_group smallint not null
);
create table if not exists public.eon_seed_grams (
  karat text not null, width int not null, thick text not null,
  grams numeric[] not null, primary key (karat, width, thick)
);
"""

text_chunks = []
for l in listings:
    stmt = ("insert into eon_seed_texts (no, family, title, description, tags, materials, image_url, research_keyword, ppg_cents, karat, research_group) values ("
            f"{l['no']}, {sql_str(l['family'])}, {sql_str(l['title'])}, {sql_str(l['description'])}, "
            f"{sql_arr(l['tags'])}, {sql_arr(l['materials'])}, {sql_str(l['image_url'])}, "
            f"{sql_str(l['research_keyword'])}, {int(round(l['target_ppg_usd']*100))}, {sql_str(l['karat'])}, {l['no']})"
            " on conflict (no) do update set family=excluded.family, title=excluded.title,"
            " description=excluded.description, tags=excluded.tags, materials=excluded.materials,"
            " image_url=excluded.image_url, research_keyword=excluded.research_keyword,"
            " ppg_cents=excluded.ppg_cents, karat=excluded.karat, research_group=excluded.research_group;")
    text_chunks.append((l["no"], stmt))

gram_rows = []
for k in KARATS:
    for w in WIDTHS:
        for th in THICKS:
            arr = "{" + ",".join(str(x) for x in wt["weights_grams"][k][str(w)][th]) + "}"
            gram_rows.append(f"('{k}',{w},'{th}','{arr}'::numeric[])")
gram_chunks = []
for i in range(0, len(gram_rows), 22):
    gram_chunks.append(
        "insert into eon_seed_grams (karat, width, thick, grams) values\n"
        + ",\n".join(gram_rows[i:i+22])
        + "\non conflict (karat, width, thick) do update set grams = excluded.grams;")

sizes_arr = "ARRAY[" + ",".join(str(s) for s in SIZES) + "]"
MASTER = f"""-- 39 ürün + 11.154 varyant tek atımda (staging'den türetilir)
with eon as (select id from organizations where name = 'EON'),
ins as (
  insert into products (org_id, sku, title, description, tags, materials, status,
                        currency, quantity, has_variations, image_url, research_keyword,
                        research_group)
  select eon.id, t.family, t.title, t.description, t.tags, t.materials, 'draft',
         'USD', {QTY}, true, t.image_url, t.research_keyword, t.research_group
  from eon_seed_texts t, eon
  -- İdempotent + zaten-canlı yıldızı ATLA: org'da aynı sku varsa ekleme.
  where not exists (
    select 1 from products p2 where p2.org_id = eon.id and p2.sku = t.family
  )
  returning id, sku
),
sizes as (
  select s.size, s.i from unnest({sizes_arr}) with ordinality as s(size, i)
),
vrows as (
  select p.id as product_id, t.family, t.karat, t.ppg_cents,
         g.width, g.thick, s.size, g.grams[s.i] as grams
  from ins p
  join eon_seed_texts t on t.family = p.sku
  join eon_seed_grams g on g.karat = t.karat
  cross join sizes s
)
insert into product_variants (org_id, sku, product_id, properties, price_cents,
                              quantity, weight_grams, weight_source, active, currency)
select (select id from eon),
       v.family || '-' || v.width || 'MM-' || (case v.thick when '1.5' then 'T15' else 'T20' end) || '-' || v.size,
       v.product_id,
       jsonb_build_object(
         'Karat', v.karat,
         'Metal', (case split_part(v.family, '-', 1)
                     when 'GLD' then 'Yellow Gold'
                     when 'WHG' then 'White Gold'
                     when 'RSG' then 'Rose Gold' end),
         'Width', v.width || 'mm · ' || (case v.thick when '1.5' then '1.5' else '2.0' end) || 'mm thick',
         'Ring Size', v.size::text
       ),
       (ceil((v.grams * v.ppg_cents) / 500.0) * 500 + {SHIPPING_ALLOWANCE_CENTS})::int,
       {QTY}, v.grams, 'catalog_v2', true, 'USD'
from vrows v;

-- Ürün çapa fiyatı = en düşük varyant fiyatı
update products p set price_cents = m.minp, updated_at = now()
from (select product_id, min(price_cents) as minp from product_variants group by product_id) m
where m.product_id = p.id
  and p.org_id = (select id from organizations where name = 'EON')
  and p.sku in (select family from eon_seed_texts);
"""

VERIFY = """select 'products' as k, count(*) from products
 where org_id=(select id from organizations where name='EON') and status='draft' and archived_at is null
union all
select 'variants', count(*) from product_variants v
 join products p on p.id=v.product_id
 where p.org_id=(select id from organizations where name='EON') and p.archived_at is null
union all
select 'archived', count(*) from products
 where org_id=(select id from organizations where name='EON') and archived_at is not null;
"""

CLEANUP = "drop table if exists eon_seed_texts; drop table if exists eon_seed_grams;\n"

open(os.path.join(OUT_SQL, "step1_archive.sql"), "w").write(ARCHIVE)
open(os.path.join(OUT_SQL, "step2_staging.sql"), "w").write(STAGING)
for n, stmt in text_chunks:
    open(os.path.join(OUT_SQL, f"texts_{n:02d}.sql"), "w").write(stmt + "\n")
for i, ch in enumerate(gram_chunks):
    open(os.path.join(OUT_SQL, f"grams_{i}.sql"), "w").write(ch + "\n")
open(os.path.join(OUT_SQL, "step5_master.sql"), "w").write(MASTER)
open(os.path.join(OUT_SQL, "step6_verify.sql"), "w").write(VERIFY)
open(os.path.join(OUT_SQL, "step7_cleanup.sql"), "w").write(CLEANUP)

# Repo migration'ı: tam eşdeğer (staging + metinler + gramlar + master + cleanup)
mig = ["-- 0100 — EON katalog v2: 39 karat-ayrık listing × 286 varyant (tam seed)",
       "-- Üretici: scratchpad/gen_catalog_v2.py (gram tabloları + workflow metin/fiyat çıktısı)",
       "-- Eski 17 taslak arşivlenir; yeni set: tip×renk×karat ayrık, tam beden/genişlik matrisi.",
       "", "begin;", ARCHIVE, STAGING]
mig += [stmt for _, stmt in text_chunks]
mig += gram_chunks
mig += [MASTER, CLEANUP, "commit;"]
open(os.path.join(OUT_SQL, "0100_eon_catalog_v2.sql"), "w").write("\n".join(mig) + "\n")

sizes_kb = {f: os.path.getsize(os.path.join(OUT_SQL, f)) // 1024 for f in sorted(os.listdir(OUT_SQL))}
print(json.dumps({
    "listings": len(listings), "variants": total_variants,
    "price_example_star": next((l["family"], l["price_min_cents"], l["price_max_cents"]) for l in listings if l["family"] == pricing.get("star_family")),
    "sql_files_kb": sizes_kb,
}, indent=1))
print("OK")
