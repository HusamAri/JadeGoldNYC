# EON Katalog v3 — Yarım Bedenler + Tek 1.5mm Kalınlık

Bu doküman v2'nin (bkz. `katalog-v2.md`) üstüne uygulanan **v3 transform**'unun
kaydıdır. v2'nin yapısı, SKU aile düzeni, gram tabloları, fiyat kalibrasyonu ve
SEO/metin şablonu **değişmedi**; yalnız aşağıdaki dört şey değişti. Değişmeyen her
şey için v2 dokümanı geçerlidir.

## 1. Neden (kullanıcı direktifi)

> "we need to add halves in sizes. 4,5 6,5 alike…." · "and need to remove 1.5 width"
> → netleştirme: **"2 kalınları temizle. 1.5mm olanı kalsın."**

İki istek:

1. **Yarım bedenler eklensin** — 4, 4.5, 5, 5.5 … 16.
2. **Çift kalınlık kalksın** — 2.0mm kaldırılsın, **1.5mm kalsın** (kullanıcı
   "1.5 width" derken kastı 1.5mm KALINLIK; 2.0mm temizlenecek).

## 2. Ne değişti

| | v2 | **v3** |
|---|---|---|
| Beden ekseni (`Ring Size`) | US 4–16 tek sayı (13) | **US 4–16 tam + yarım (25)** |
| Kalınlık | 1.5mm + 2.0mm (çift) | **yalnız 1.5mm** |
| Genişlik ekseni (`Width`) | 22 değer (11 genişlik × 2 kalınlık katlanmış) | **11 değer (2–12mm, tek kalınlık)** |
| Varyant / listing | 286 | **275** (25 × 11) |
| Toplam varyant | 11.154 | **10.725** |
| SKU | `<fam>-<W>MM-T<15\|20>-<SIZE>` | **`<fam>-<W>MM-<SIZE>`** (kalınlık token'ı düştü) |

**Örnek SKU:** `GLD-R-1401-6MM-4.5` = 14K Yellow Dome, 6mm, beden 4.5. Tam beden
tam sayı (`-7`), yarım beden ondalık (`-4.5`). `parseSkuParts` regex'i
(`/-(\d+(?:\.\d+)?)$/`) ondalık beden son ekini zaten çözer.

### Yarım-beden gramı

Yarım-beden gramı, komşu tam bedenlerin **doğrusal orta-noktasıdır**
(`(gram[n] + gram[n+1]) / 2`, 3 ondalık). Gram tabloları satır-doğrusal
(bir genişlik/kalınlıkta ardışık bedenler arası artış sabit) olduğu için bu
interpolasyon fiziksel olarak birebir doğrudur — sentetik/tahmin değil.

Örnek: 14K · 6mm · beden 4 = 4.67g, beden 5 = 4.89g → beden 4.5 = **4.78g**.

## 3. Fiyat — formül değişmedi

```
fiyat = ceil(gram × hedef_ppg_cent / 500) × 500 + 1000
```

$5 adımına yukarı yuvarla + **$10 sabit kargo payı** (ücretsiz kargo → satıcı
üstlenir). Hedef $/g (cent): 10K **10730** · 14K standart **15820** · 18K
**19320**; yıldız `GLD-R-1401` (14K Yellow Dome) **13560** (en rekabetçi uç).
Yarım bedenler formülü yeni beden gramına uygular; ayrı fiyat kuralı yok.

**Canlı sonuç (spot $4005 anında):** fiyat aralığı **$160 – $3.265**; yıldız
listing **$225 – $2.015**. Her varyant melt breakeven'ının üstünde ve metal
maliyetinin üstünde (aşağı bkz.).

### Kâr doğrulaması

Metal maliyeti üstü brüt marj (satış − ham altın maliyeti [10K $65/g · 14K
$101/g · 18K $129/g] − $10 kargo payı) tüm 10.725 varyantta pozitif:

| | değer |
|---|---|
| Zararına satan varyant | **0** |
| Min kâr / yüzük | **$57.44** (%24.9 marj) |
| Ortalama kâr / yüzük | **~$388** (%35.7 marj) |
| Max kâr / yüzük | **$1.084** |

En ince marjlar yıldız ailededir (bilerek en rekabetçi). Marj metal + kargo
üstüdür; Etsy ücretleri (~%9-10) ve işçilik burada düşülmemiştir — ama %24.9
tabanı bu ücretlerin üstünde yer bırakır ve breakeven tabanı zaten ham metale
%10 tampon ekler.

## 4. Açıklamalar — iki-kalınlık dili temizlendi

39 açıklamanın tamamı yeniden yazıldı: "two thicknesses (1.5mm and 2.0mm)",
"whole US sizes" gibi ifadeler kaldırıldı; yerine **"whole and half sizes"** ve
tek **1.5mm** kalınlık dili kondu. Sessiz-lüks ton ve minimalist/kalıcı kural
(fiyat/gram/servis-süresi/resize sözü YOK — v2 §5) korundu.

> Regex ile temizlik denendi ama **131 farklı kalınlık cümlesi** genişlik
> rehberliğiyle iç içe örülüydü; regex düzyazıyı bozardı. Bunun yerine her
> açıklama LLM ile yeniden yazıldı, sonra kod-tabanlı doğrulama koşuldu
> (aşağı bkz.). Ders: gömülü prose temizliği regex değil, yeniden-yazım işidir.

Her açıklama dahili künye ile biter (panel `splitInternalTrailer` / push
`stripInternalTrailer` söker); v3 künyesi:

```
[EON NN · FAM · Varyasyon: Ring Size 4-16 whole+half (25) x Width 11
 (2-12mm, 1.5mm thick); fiyat+SKU iki eksende (property 513,514);
 adet 20/varyant; kisisellestirme max 30 karakter]
```

## 5. Runbook — üretim + uygulama

**Yapı/fiyat üretici:** `docs/eon/gen_catalog_v3.py` (kendi kendine yeter,
yalnız `eon-weight-tables.json` okur):

```
python3 gen_catalog_v3.py             # 39×275 üret + doğrula + özet
python3 gen_catalog_v3.py --emit-sql  # ayrıca variant transform SQL yaz
```

İç doğrulamalar (fail = üretim durur): 39 listing · 10.725 varyant · 275/listing
· SKU tekilliği · gram>0 · fiyat>kargo. Çıktı `eon-v3-catalog.json` (yapı/fiyat
katmanı; 39 açıklama metni ayrı workflow çıktısıdır, migration'da yaşar).

**Canlı kayıt / preview provizyonu:** `supabase/migrations/0101_eon_catalog_v3.sql`
— 0100'ün (v2 seed) üstüne çalışır:

- **Bölüm A:** gram (33 dizi × 25 beden) + ppg (39 aile) staging → v2 varyant
  sil (`weight_source='catalog_v2'`) → v3 varyant ekle (25×11, `catalog_v3`) →
  ürün çapa fiyatı = min varyant.
- **Bölüm B:** 39 `update products set description=…` (temiz metin + v3 künye).

Canlıya Supabase MCP ile parçalı uygulandı (tek çağrı 64KB temp-table sınırından
kaçınmak için Bölüm A + iki metin batch'i ayrı gönderildi). Migration dosyası
sırayı tek yerde birleştirir.

## 6. Doğrulama (uçtan uca, canlı çalıştırıldı)

**Açıklama katmanı (39/39 temiz):** whole+half var = 39 · 2.0mm/two-thick leak = 0
· whole-US-only leak = 0 · 1.5mm-thick var = 39 · servis-süresi/fiyat/resize leak
= 0 · v3 künye = 39.

**Varyant katmanı:** 10.725 varyant · hepsi `catalog_v3` · v2 kalıntı = 0 · eski
kalınlık SKU (T15/T20) = 0 · 25 beden · 11 genişlik · bozuk gram/fiyat/adet = 0.

**Fiyat:** breakeven altı = 0 · metal maliyeti altı = 0.

**Üretici ↔ DB uyumu:** `gen_catalog_v3.py` çıktısı canlı DB ile birebir
(GLD-R-1401-6MM-7 = 5.34g/$735; global aralık $160–$3.265 = DB min/max).

## 7. Değişmeyen / taşınan riskler (v2'den)

- 18K alım maliyeti türetilmiş (~$129/g); gerçek tedarik gelince güncellenir.
- Gram tabloları dome-kaynaklı, tüm profillere uygulanır (kullanıcı kararı).
- Knife yalnız yellow.
- Fiyat kalıcı değil; spot oynar, reprice motoru + method_note bakım şart.
- Etsy'ye gönderim akışı aynı: push script `properties.Width` + `Ring Size`
  okur, yeni değerlerle (yarım beden dahil) çalışır; `price_on_property [513,514]`
  aynı. İlk canlı gönderim tek listing'de teyit edilir.
