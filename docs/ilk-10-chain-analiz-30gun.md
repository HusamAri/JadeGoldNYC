# İlk 10 Chain — 30 Günlük Analiz Raporu

**Tarih:** 2026-07-13
**Kapsam:** Görev listesindeki 10 listing için, panelde/Supabase'de bulunan
canlı veri üzerinden yapılabilen analizler. Her listing için "ne yapıldı /
ne yapılamadı" ayrı ayrı işaretlendi.

## Yöntem ve varsayımlar

- **Gram maliyeti** = varyasyon ağırlığı (`product_variants.weight_grams`) ×
  sabit tedarik alım fiyatı (`lib/gold-cost.ts`):
  **10K = $65/g, 14K = $101/g**. Bu değer altın **spot** fiyatından bağımsız
  olduğu için (spot API'leri şu an proxy'de kapalı) maliyet rakamları sağlamdır.
- **Marj %** = (satış fiyatı − gram maliyeti) / satış fiyatı. Yalnız malzeme
  (altın) maliyetini kapsar; kargo, Etsy komisyonu, reklam ve işçilik hariçtir —
  yani gerçek net marj bu rakamların **altındadır**.
- Kaynak tablolar: `products`, `product_variants`, `sale_items` + `sales`,
  `etsy_ledger_entries`. Proje: JadeGoldNYC (Supabase, ACTIVE).
- `weight_source` = ağırlığın nereden geldiği: `description` (başlık/açıklama),
  `shipstation` (kargo tartısı), `inferred` (tahmin). `inferred` olanlar teyit
  edilmeli.

## Genel özet

| # | Listing | Ürün | 30g sipariş | Ömür sipariş | Görüntülenme | Ne yapıldı |
|---|---|---|---|---|---|---|
| 1 | 1849001180 | 10K Figaro | 2 ($505) | 42 | 14.436 | ✅ Gram + marj (30 varyasyon) |
| 2 | 1862661659 | 14K Round Box | 5 ($8.373) | 96 | 19.756 | ℹ️ Referans/örnek — sağlıklı |
| 3 | 1320317404 | 10K Mariner | 0 | 0 | 22.064 | ⚠️ DB'de varyasyon yok |
| 4 | 1863505492 | 14K Figaro | 0 | 33 | 6.877 | ✅ Gram + marj (25 varyasyon) |
| 5 | 1849022518 | 10K Rope | 3 ($6.095) | 5 | 1.238 | 🚩 "Kapanabilir" notu YANLIŞ — satıyor |
| 6 | 1891642136 | 10K Franco | 0 | 117 | 5.185 | ⚠️ Kısmi (5/25 varyasyon; 20 ağırlık boş) |
| 7 | 1485089843 | 14K Beaded Ball | 0 | 23 | 13.871 | ✅ Gram + marj + 🔴 fiyat hatası bulundu |
| 8 | 1868666012 | 14K Figaro | 0 | 1 | 536 | ℹ️ Ölü — kapatma notu doğru |
| 9 | 1199260535 | 14K Rope Bileklik | 0 | 321 | 121.567 | ℹ️ Marj sağlıklı; reklam Etsy'de |
| 10 | 1294201622 | 10K Herringbone | 0 | 0 | 47.215 | ⚠️ DB'de varyasyon yok |

---

## 1 — 1849001180 · 10K Yellow Gold Figaro Link Chain
**Görevler:** fiyat analizi (husam/efe) · tüm varyasyon gram cost (gamze) · keyword reklam (husam)

- **Yapıldı — gram + marj:** 30 aktif varyasyonun tamamı hesaplandı.
  Marj **%34.8 – %53.3**, ortalama **%45.8**. **Zarar eden varyasyon yok.**
- **Not (görevle çelişki):** Listede "1 order" yazıyor ama gerçek: **ömür 42
  sipariş, son 30 günde 2 sipariş ($505), son satış 2026-07-08.** Bu listing
  hâlâ aktif satıyor — "geçmişte satıyordu" değil, **hâlâ satıyor.**
- **Fiyat analizi bulgusu:** En düşük marjlar en ağır (8.6MM) bedenlerde
  (~%35). İnce bedenler %48-53. Fiyat merdiveni tutarlı; acil sorun yok.
  İstenirse 8.6MM bedenlerde küçük bir zam ile marj %40'a çekilebilir.
- **Yapılamadı — keyword reklam:** Etsy Ads keyword/harcama verisi DB'de yok
  (aşağıdaki "Yapılamayanlar" bölümüne bakınız).

| MM · Boy | Ağırlık (g) | Fiyat | Maliyet | Kâr | Marj % |
|---|---|---|---|---|---|
| 2MM · 16" | 1.20 | $150.93 | $78.00 | $72.93 | 48.3 |
| 2MM · 18" | 1.35 | $185.76 | $87.75 | $98.01 | 52.8 |
| 2MM · 20" | 1.50 | $208.98 | $97.50 | $111.48 | 53.3 |
| 2MM · 22" | 1.65 | $220.59 | $107.25 | $113.34 | 51.4 |
| 2MM · 24" | 1.80 | $232.20 | $117.00 | $115.20 | 49.6 |
| 2.6MM · 16" | 1.74 | $208.98 | $113.10 | $95.88 | 45.9 |
| 2.6MM · 18" | 1.80 | $226.39 | $117.00 | $109.39 | 48.3 |
| 2.6MM · 20" | 2.00 | $243.81 | $130.00 | $113.81 | 46.7 |
| 2.6MM · 22" | 2.20 | $261.22 | $143.00 | $118.22 | 45.3 |
| 2.6MM · 24" | 2.44 | $278.64 | $158.60 | $120.04 | 43.1 |
| 3.7MM · 16" | 2.89 | $377.32 | $187.85 | $189.47 | 50.2 |
| 3.7MM · 18" | 3.25 | $412.15 | $211.25 | $200.90 | 48.7 |
| 3.7MM · 20" | 3.61 | $441.18 | $234.65 | $206.53 | 46.8 |
| 3.7MM · 22" | 4.00 | $458.59 | $260.00 | $198.59 | 43.3 |
| 3.7MM · 24" | 4.33 | $510.84 | $281.45 | $229.39 | 44.9 |
| 4.4MM · 16" | 4.16 | $563.08 | $270.40 | $292.68 | 52.0 |
| 4.4MM · 18" | 4.68 | $597.91 | $304.20 | $293.71 | 49.1 |
| 4.4MM · 20" | 5.20 | $679.18 | $338.00 | $341.18 | 50.2 |
| 4.4MM · 22" | 5.72 | $737.23 | $371.80 | $365.43 | 49.6 |
| 4.4MM · 24" | 6.24 | $795.28 | $405.60 | $389.68 | 49.0 |
| 5.6MM · 16" | 6.74 | $870.75 | $438.10 | $432.65 | 49.7 |
| 5.6MM · 18" | 7.58 | $934.60 | $492.70 | $441.90 | 47.3 |
| 5.6MM · 20" | 8.42 | $998.46 | $547.30 | $451.16 | 45.2 |
| 5.6MM · 22" | 9.27 | $1.062.31 | $602.55 | $459.76 | 43.3 |
| 5.6MM · 24" | 10.11 | $1.126.17 | $657.15 | $469.02 | 41.6 |
| 8.6MM · 16" | 15.89 | $1.584.76 | $1.032.85 | $551.91 | 34.8 |
| 8.6MM · 18" | 17.88 | $1.816.96 | $1.162.20 | $654.76 | 36.0 |
| 8.6MM · 20" | 19.87 | $1.991.11 | $1.291.55 | $699.56 | 35.1 |
| 8.6MM · 22" | 21.85 | $2.223.31 | $1.420.25 | $803.06 | 36.1 |
| 8.6MM · 24" | 23.84 | $2.455.51 | $1.549.60 | $905.91 | 36.9 |

---

## 2 — 1862661659 · 14K Rose Gold Round Box Chain
**Görev:** "Diğer ürünlere örnek listing olabilir."

- Bu bir analiz değil, **referans seçimi** kararı — veri işi değil.
- **Destekleyici veri:** En güçlü performans: son 30 günde **5 sipariş
  ($8.373)**, ömür 96 sipariş, 19.756 görüntülenme, 354 favori. Örnek/şablon
  listing seçimi için bu listing gerçekten mantıklı bir aday.

---

## 3 — 1320317404 · 10K Puffed Mariner Anchor Chain
**Görev:** "Stok durumuna göre karar verilecek."

- **Yapılamadı:** Bu listing için `product_variants` tablosunda **hiç kayıt
  yok** → gram/maliyet hesaplanamıyor.
- **Karar zaten insan/tedarik konusu** (stok/temin). Veri tarafı:
  22.064 görüntülenme, 365 favori, **0 sipariş** — yüksek ilgi, sıfır satış.
  Yani "temin edilebilir mi" sorusu netleşirse, talep var; öncelik verilebilir.

---

## 4 — 1863505492 · 14K Yellow Gold Figaro Link Chain
**Görevler:** fiyat analizi (husam/efe) · tüm varyasyon gram cost (gamze) · keyword reklam (husam)

- **Yapıldı — gram + marj:** 25 varyasyonun tamamı hesaplandı.
  Marj **%18.5 – %44.3**. **Zarar yok**, ama bir anomali var.
- **🔴 Fiyat anomalisi:** `2.6MM · 18"` (2.95g) **$365.71** fiyatlanmış →
  marj yalnız **%18.5**. Oysa neredeyse aynı ağırlıktaki `3.6MM · 16"` (2.93g)
  **$522.45**. Bu beden fiyat merdiveninden düşük kalmış; **~$500'e
  düzeltilmeli** (diğer 2.6MM bedenler zaten %42 marjda).
- **Not:** Listede "0 order" — gerçekte ömür 33 sipariş, son satış 2026-06-02.
- **Yapılamadı — keyword reklam:** DB'de yok.

| MM · Boy | Ağırlık (g) | Fiyat | Maliyet | Kâr | Marj % |
|---|---|---|---|---|---|
| 2MM · 16" | 1.33 | $214.78 | $134.33 | $80.45 | 37.5 |
| 2MM · 18" | 1.54 | $278.64 | $155.54 | $123.10 | 44.2 |
| 2MM · 20" | 1.71 | $301.86 | $172.71 | $129.15 | 42.8 |
| 2MM · 22" | 1.88 | $325.08 | $189.88 | $135.20 | 41.6 |
| 2MM · 24" | 2.06 | $348.30 | $208.06 | $140.24 | 40.3 |
| 2.6MM · 16" | 1.88 | $325.08 | $189.88 | $135.20 | 41.6 |
| **2.6MM · 18"** | **2.95** | **$365.71** | **$297.95** | **$67.76** | **18.5 ⚠️** |
| 2.6MM · 20" | 2.33 | $406.35 | $235.33 | $171.02 | 42.1 |
| 2.6MM · 22" | 2.56 | $446.98 | $258.56 | $188.42 | 42.2 |
| 2.6MM · 24" | 2.79 | $487.62 | $281.79 | $205.83 | 42.2 |
| 3.6MM · 16" | 2.93 | $522.45 | $295.93 | $226.52 | 43.4 |
| 3.6MM · 18" | 3.30 | $580.50 | $333.30 | $247.20 | 42.6 |
| 3.6MM · 20" | 3.62 | $638.55 | $365.62 | $272.93 | 42.7 |
| 3.6MM · 22" | 4.03 | $696.60 | $407.03 | $289.57 | 41.6 |
| 3.6MM · 24" | 4.40 | $754.65 | $444.40 | $310.25 | 41.1 |
| 4.4MM · 16" | 4.60 | $812.70 | $464.60 | $348.10 | 42.8 |
| 4.4MM · 18" | 5.18 | $917.19 | $523.18 | $394.01 | 43.0 |
| 4.4MM · 20" | 5.72 | $1.015.87 | $577.72 | $438.15 | 43.1 |
| 4.4MM · 22" | 6.33 | $1.114.56 | $639.33 | $475.23 | 42.6 |
| 4.4MM · 24" | 6.91 | $1.219.05 | $697.91 | $521.14 | 42.7 |
| 5.6MM · 16" | 6.40 | $1.161.00 | $646.40 | $514.60 | 44.3 |
| 5.6MM · 18" | 7.20 | $1.306.12 | $727.20 | $578.92 | 44.3 |
| 5.6MM · 20" | 8.05 | $1.451.25 | $813.05 | $638.20 | 44.0 |
| 5.6MM · 22" | 8.80 | $1.596.37 | $888.80 | $707.57 | 44.3 |
| 5.6MM · 24" | 9.60 | $1.741.50 | $969.60 | $771.90 | 44.3 |

---

## 5 — 1849022518 · 10K Gold Rope Chain
**Görev:** "Çalışılmayacak listing · reklam hiç harcamamış — kapanabilir."

- **🚩 Bu not veriyle çelişiyor — KAPATMAYIN.** Bu listing son 30 günde
  **3 sipariş / $6.095,25** yaptı (son satış 2026-06-23). Reklamsız, sadece
  1.238 görüntülenmeyle bu ciro çok verimli. Kapatmak aktif geliri keser.
- Öneri: kapatmak yerine, düşük görüntülenmeyi büyütmek için hafif reklam/SEO
  denenebilir — dönüşüm zaten yüksek.

---

## 6 — 1891642136 · 10K Real Yellow Gold Franco Chain
**Görevler:** fiyat analizi · tüm varyasyon gram cost (gamze) · favori size tekli listing (gamze) · keyword reklam (husam)

- **Kısmen yapıldı:** 25 varyasyondan yalnız **5'inin ağırlığı DB'de dolu**
  (1.8MM tüm boylar); 20 varyasyonun `weight_grams` alanı **boş** →
  gram maliyeti çıkmıyor.
- Hesaplanabilen 5 varyasyon: marj **%49.1 – %53.5** (sağlıklı). Bunların
  `weight_source = inferred` (tahmin) — teyit edilmeli.
- **Blokaj:** Kalan 20 beden (2.2 / 2.4 / 3.2 / 4MM) için önce ağırlık verisi
  Etsy/ShipStation'dan senkronlanmalı; sonra tam tablo çıkar. Bu, gamze'nin
  "tüm varyasyon gram cost" görevinin ön koşulu.
- **Not:** Listede "0 order" — gerçekte ömür **117 sipariş** (son 2026-02-15).
  Güçlü bir geçmiş satıcı; yeniden canlandırmaya değer.
- **Yapılamadı:** favori-size tekli listing (Etsy'de listing oluşturma) +
  keyword reklam (DB'de yok).

| MM · Boy | Ağırlık (g) | Fiyat | Maliyet | Kâr | Marj % |
|---|---|---|---|---|---|
| 1.8MM · 16" | 2.50 | $319.27 | $162.50 | $156.77 | 49.1 |
| 1.8MM · 18" | 2.81 | $383.13 | $182.65 | $200.48 | 52.3 |
| 1.8MM · 20" | 3.12 | $429.57 | $202.80 | $226.77 | 52.8 |
| 1.8MM · 22" | 3.43 | $476.01 | $222.95 | $253.06 | 53.2 |
| 1.8MM · 24" | 3.74 | $522.45 | $243.10 | $279.35 | 53.5 |
| 2.2 / 2.4 / 3.2 / 4MM (20 beden) | — (boş) | $510–$2.090 | — | — | ⚠️ ağırlık yok |

---

## 7 — 1485089843 · 14K Solid Gold Beaded Ball Chain
**Görevler:** fiyat analizi · tüm varyasyon gram cost (gamze) · rakip favori size (husam) · favori size tekli listing (gamze) · keyword reklam (husam)

- **Yapıldı — gram + marj:** 25 varyasyon hesaplandı ve **kritik fiyat hataları
  bulundu.**
- **🔴 ACİL 1 — 5 varyasyon $1.35'e satılıyor (bariz veri hatası):**
  maliyetleri $213–$468. Bir satış gelirse felaket zarar. Etkilenen bedenler:
  `1MM·22"`, `1MM·24"`, `1.5MM·16"`, `1.5MM·22"`, `1.5MM·24"`.
- **🔴 ACİL 2 — maliyetin altında 2 gerçek beden:**
  `1MM·18"` → $156.72 fiyat / $174.73 maliyet = **−$18 (−%11.5)**;
  `1MM·20"` → $185.75 / $193.92 = **−$8 (−%4.4)**.
- **Fiyat merdiveni bozuk:** `1MM·16"` (1.54g) **$431.97** (%64 marj) iken
  daha ağır `1MM·18"` (1.73g) **$156.72** (zarar). 1MM tüm katmanı yeniden
  fiyatlanmalı; %40 hedef marjla 1MM·16"≈$260, 1MM·18"≈$291, 1MM·20"≈$323,
  1MM·22"≈$355, 1MM·24"≈$389.
- **Yapılamadı:** rakip favori-size araştırması (Etsy'de dış rakip) + tekli
  listing oluşturma + keyword reklam.

| MM · Boy | Ağırlık (g) | Fiyat | Maliyet | Kâr | Marj % |
|---|---|---|---|---|---|
| 1MM · 16" | 1.54 | $431.97 | $155.54 | $276.43 | 64.0 |
| **1MM · 18"** | 1.73 | **$156.72** | $174.73 | **−$18.01** | **−11.5 🔴** |
| **1MM · 20"** | 1.92 | **$185.75** | $193.92 | **−$8.17** | **−4.4 🔴** |
| **1MM · 22"** | 2.11 | **$1.35** | $213.11 | **−$211.76** | **🔴 hata** |
| **1MM · 24"** | 2.31 | **$1.35** | $233.31 | **−$231.96** | **🔴 hata** |
| **1.5MM · 16"** | 3.08 | **$1.35** | $311.08 | **−$309.73** | **🔴 hata** |
| 1.5MM · 18" | 3.47 | $580.50 | $350.47 | $230.03 | 39.6 |
| 1.5MM · 20" | 3.86 | $644.35 | $389.86 | $254.49 | 39.5 |
| **1.5MM · 22"** | 4.24 | **$1.35** | $428.24 | **−$426.89** | **🔴 hata** |
| **1.5MM · 24"** | 4.63 | **$1.35** | $467.63 | **−$466.28** | **🔴 hata** |
| 2MM · 16" | 4.53 | $812.70 | $457.53 | $355.17 | 43.7 |
| 2MM · 18" | 5.10 | $914.28 | $515.10 | $399.18 | 43.7 |
| 2MM · 20" | 6.70 | $1.015.87 | $676.70 | $339.17 | 33.4 |
| 2MM · 22" | 6.23 | $1.117.46 | $629.23 | $488.23 | 43.7 |
| 2MM · 24" | 6.80 | $1.219.05 | $686.80 | $532.25 | 43.7 |
| 3MM · 16" | 9.96 | $1.741.50 | $1.005.96 | $735.54 | 42.2 |
| 3MM · 18" | 11.20 | $1.950.48 | $1.131.20 | $819.28 | 42.0 |
| 3MM · 20" | 12.44 | $2.147.85 | $1.256.44 | $891.41 | 41.5 |
| 3MM · 22" | 13.69 | $2.322.00 | $1.382.69 | $939.31 | 40.5 |
| 3MM · 24" | 14.93 | $2.554.20 | $1.507.93 | $1.046.27 | 41.0 |
| 4MM · 16" | 16.93 | $2.902.50 | $1.709.93 | $1.192.57 | 41.1 |
| 4MM · 18" | 19.05 | $3.250.80 | $1.924.05 | $1.326.75 | 40.8 |
| 4MM · 20" | 21.17 | $3.599.10 | $2.138.17 | $1.460.93 | 40.6 |
| 4MM · 22" | 23.28 | $3.947.40 | $2.351.28 | $1.596.12 | 40.4 |
| 4MM · 24" | 25.40 | $4.295.70 | $2.565.40 | $1.730.30 | 40.3 |

> Not: `2MM·20"` ağırlığı ShipStation'dan 6.70g gelmiş ve merdiveni bozuyor
> (2MM·22" 6.23g'den ağır). Teyit edilmeli.

---

## 8 — 1868666012 · 14K Yellow Gold Figaro Link Chain
**Görev:** "Çalışılmayacak listing · reklam hiç harcamamış — kapanabilir."

- **Kapatma notu veriyle uyumlu:** ömür **1 sipariş** (son 2025-06-25, 1+ yıl
  önce), 536 görüntülenme, 6 favori. Ölü listing; kapatma/pasifleştirme uygun.

---

## 9 — 1199260535 · 14K Rope Chain Bracelet
**Görev:** "Daraltılmış reklam uygulanacak (husam)."

- **Bu bir Etsy Ads ayarı** — panelden/koddan yapılamaz (Etsy Ads dashboard).
- **Destekleyici veri:** **121.567 görüntülenme, 1.929 favori, ömür 321
  sipariş** ama son 30 günde 0 (son satış 2026-01-31). Devasa ilgi birikmiş,
  şu an soğumuş. "Daraltılmış reklam" mantıklı: yüksek favori kitlesini yeniden
  hedefleyip düşük maliyetle canlandırma. 45 varyasyon aktif, fiyatlar
  sağlıklı (maliyet altı yok).

---

## 10 — 1294201622 · 10K Solid Gold Herringbone Necklace
**Görev:** "Gramlarda değişiklik var, update edilecek (gamze)."

- **Yapılamadı:** Bu listing için `product_variants` tablosunda **hiç kayıt
  yok** → güncellenecek gram verisi panelde mevcut değil.
- Ön koşul: varyasyonlar/gramlar Etsy'den senkronlanmalı ya da elle
  girilmeli; sonra güncelleme + gram maliyeti yapılabilir.
- Veri: 47.215 görüntülenme, 893 favori, **0 sipariş** — yüksek ilgi, sıfır
  satış. Doğru gram/fiyat kurulumu bu listing için öncelikli.

---

## Kritik aksiyon listesi (öncelik sırası)

1. **🔴 1485089843 — $1.35 fiyat hatası:** 5 varyasyon ($1MM·22/24, 1.5MM·16/22/24)
   maliyetin çok altında. Etsy'de acil düzeltilmeli (canlı satış riski).
2. **🔴 1485089843 — maliyet-altı 2 beden:** 1MM·18" (−$18), 1MM·20" (−$8) +
   tüm 1MM katmanının fiyat merdiveni yeniden kurulmalı.
3. **🚩 1849022518 — KAPATMAYIN:** son 30 günde $6.095 satmış; "kapanabilir"
   notu hatalı.
4. **🟠 1863505492 — 2.6MM·18" underpriced** ($365 → ~$500 olmalı; marj %18.5).
5. **🟠 1891642136 & 1294201622 & 1320317404 — veri eksik:** varyasyon
   ağırlıkları senkronlanmadan gram/fiyat görevleri tamamlanamaz.

## Yapılamayanlar (Etsy paneli / dış kaynak / insan kararı)

- **Keyword & reklam harcaması incelemesi** (görev 1, 4, 6, 7): Etsy Ads
  keyword ve listing-bazlı harcama verisi DB'de **yok**. Ledger'da reklam
  yalnızca `prolist` (onsite ads) **günlük toplamı** olarak var; keyword veya
  listing kırılımı Etsy Ads dashboard'unda. Dosyadaki "83.49 / 219.63" gibi
  rakamlar oradan alınmış.
- **Daraltılmış reklam uygulama** (9): Etsy Ads yapılandırması.
- **Favori-size için tekli listing oluşturma** (6, 7): Etsy'de yeni listing.
- **Rakip listinglerde favori size** (7): Etsy'de dış rakip araştırması.
- **Stok/temin kararı** (3): tedarikçi/operasyon kararı.
- **Örnek/referans listing seçimi** (2): stratejik karar.
