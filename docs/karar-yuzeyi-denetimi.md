# Karar yüzeyi denetim döngüsü (rubrik + tur sonuçları)

_2026-07-20 · Amaç: her ekran, desteklediği kararı KARAR ANINDA, O EKRANDA
verdirebilsin. Döngü tekrarlanabilir: rubriği uygula → bulguları düzelt →
yeniden denetle. Denetim, tohumlanmış yerel Supabase + gerçek tarayıcı
(computer-use) ile koşulur; iki org birden gezilir (Jade = dolu veri,
EON = boş/kenar durumlar)._

## Rubrik (ekran başına geç/kal)

1. **Karar tanımı** — ekran hangi kararı desteklediğini söylüyor mu?
2. **Girdi yeterliliği** — kararın her girdisi ekranda mı (gezinmeden)?
3. **Dürüstlük** — her toplamın veri penceresi + kaynağı etikette mi?
   (API takvim penceresi ile "son 30" etiket eşleşmesi AYRI yazılır.)
4. **Bedel dili** — aksiyon alınmazsa ne kaybedileceği yazıyor mu?
5. **Aksiyon kapanışı** — panel içi aksiyon + uygulama yerine link var mı?
6. **Boş/kenar durumlar** — 0 kayıt, tek fotoğraf günü, bağlantısız
   entegrasyon, yabancı kur dürüst mü görünüyor?
7. **Okunabilirlik** — taşma/kesilme/kontrast sorunu var mı?

## Tur 1 bulguları → yapılan düzeltmeler

| Ekran | Bulgu | Düzeltme |
| --- | --- | --- |
| /reklamlar sinyal kartları | Kapat/azalt/artır kararı yalnız reklam metriğiyle veriliyordu; organik trend, dönüşüm, fiyat, stok ekranda yoktu | Kartlara "Organik … görüntülenme · favori · dönüşüm (fotoğraf farkı · aralık) · fiyat · stok" satırı; aksiyon fotoğrafına organik alanlar eklendi |
| Listing detay | Görüntülenme trendi hiçbir ekranda listing bazında görünmüyordu | "07 · Görüntülenme trendi" paneli: günlük seri + 7g + favori + AYNI aralıkta sipariş/dönüşüm |
| /analizler "En Çok Hareket Edenler" | Hareket eden listinge tek tıkla inilemiyordu | Satır başlıkları listing detayına link |
| /maliyetler (EON gibi boş org) | Sıfır dolu EBITDA tablosu "gerçek sıfır" gibi okunuyordu | Hiç kayıt yokken açık boş-veri kartı + doldurma yolu |
| /analizler grafik | Trafik kaynağı sınırı söylenmiyordu | Grafik altına API sınırı + vekiller notu |

## Tur 2 (yeniden denetim) — geçti

- Sinyal kartlarında organik satır üç kartta da okunur ve doğru aralıklı.
- Top-mover linki listing detayına iniyor; panel 07 istatistik + grafik dolu.
- EON /maliyetler dürüst boş-veri kartını gösteriyor.
- /yildiz-satici ve /sepet-kurtarma karar tanımı + dürüst pencere etiketleri taşıyor.

## Kabul edilen takaslar (bilerek yapılmadı)

- **Panel Uyarı Board'u** uyarıda etkilenen listing adlarını saymaz; kart
  zaten filtreli listeye link verir (kompakt yüzey, tek tık uzakta).
- **Aksiyon planı "veri bekleyen" senaryoları** tetiklenmeye ne kadar kaldığını
  göstermez (senaryo motoru içi eşik yüzeyi ayrı iş).
- **Trafik kaynağı kırılımı** API'de yok — ekranlarda sınır ilan edilir,
  vekiller (arama CSV'si, offsite atıf, Sosyal) gösterilir; scraping yapılmaz.

## Döngüyü yeniden koşmak

1. `bash scripts/dev-supabase-setup.sh` + `npm run dev`; Jade'e sentetik
   `etsy_listing_stats` / `product_metrics` / ledger tohumu bas.
2. Rubriği her karar ekranına uygula (iki org). Bulgular = todo + dosya.
3. Düzelt, yalnız kalan ekranları yeniden denetle; kalıcı ders varsa
   `docs/second-brain.md`'ye tek satır ekle.
