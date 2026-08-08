# Tamsan maliyet kalibrasyonu (2026-08-08)

Dört gerçek üretici faturası (Creations By Tamsan, Inc — TDN Store hesabı
NJ00582) panelin otomatik maliyet tahminiyle karşılaştırıldı, model gerçeğe
kalibre edildi ve geçmiş satışların maliyeti fatura değerleriyle düzeltildi.

## Fatura verisi (hepsi Gold $4372.40/ozt damgalı)

| Fatura | Tarih | Kalem | Metal | Gram | Tutar | Eşleşen satış |
| --- | --- | --- | --- | --- | --- | --- |
| 17794 | 07-22 | Dome&Flat 4mm sz5 (PO: Yasin) | 10K Y | 3.10 | $232.00 | 07-21 `GLD-R-1002-4MM-6`¹ |
| 17834 | 07-25 | Dome&Flat 2mm sz6 | 10K Y | 1.34 | $148.00 | 07-23 `GLD-R-1001-2MM-6` |
| 17834 | 07-25 | Dome&Flat 4mm sz9 | 10K W | 3.12 | $299.00 | 07-24 (SKU'suz, listing 4543000739 "matte brushed") |
| 17863 | 07-28 | Dome&Flat 5mm sz13 | 10K W | 4.64 | $329.00 | 07-27 `WHG-R-1001-5MM-13` |
| 17863 | 07-28 | Dome&Flat 2mm sz15 | 10K Y | 1.83 | $145.00 | 07-26 `GLD-R-1001-2MM-15` |
| 17863 | 07-28 | Dome&Flat 2mm sz7 | 10K W | 1.72 | $139.00 | 08-03 `WHG-R-1002-2MM-7` |
| 17863 | 07-28 | Diamond Cut 2.5mm sz8 | 10K R | 1.69 | $156.00 | 08-05 `RSG-R-1004-2MM-6` |
| 17953 | 08-08 | Diamond Cut 3mm sz7 +kazıma | 14K W | 2.50 | $270.00 | 08-06 `WHG-R-1404-3MM-7` |
| 17953 | 08-08 | Diamond Cut 5mm sz7 +kazıma | 10K Y | 3.80 | $322.00 | 08-07 `WHG-R-1402-5MM-7` |

¹ Fatura sz5 diyor, SKU sz6 — "Yasin" özel siparişi; gramaj (3.10 ≈ 3.0) ve
tarih eşleşmesiyle bağlandı.

Toplam: **$2.040,00** (9 satır, 9'u da paneldeki satışlarla eşleşti).

## Bulgu: eski model %13,5 eksikti

Eski otomatik model `gram × sabit alım $/g` idi (10K $65/g; işçilik payı
grama oranlı ~$10,3/g). Gerçek Tamsan yapısı **metal (spot × ayar) + parça
başına işçilik**. Sonuç: 9 satır toplamında panel %13,5 düşük; en kötü
sapma küçük yüzüklerde (2mm 1.34g: panel $97,50, fatura $148 → −%34;
süslü 2mm rose: −%38).

## Kalibrasyon (lib/gold-cost.ts)

- Malzeme: `gram × (spot/31.1035) × saflık` — değişmedi, satış anındaki
  spota endeksli.
- İşçilik: **parça başına**, medyan-uyum: düz profiller (dome/flat/beveled/
  knife) **$54**; süslü profiller (milgrain, hammered, diamond cut,
  basketweave, ribbed, two-tone; kazıma dahil) **$74**.
- Uyum: 9 satır toplamında −%2,2; satır bazında ±%15 (fatura fiyatlaması
  birebir formül değil — bkz. 17834'ün $110/g'lik 2mm satırı).

## Geçmiş düzeltmesi

9 satış kaleminin maliyet kayıtları gerçek fatura değerlerine çekildi
(`costs.source = 'invoice'`, vendor `Creations By Tamsan`, notta fatura no).
07-24 satışının hiç maliyet kaydı yoktu — eklendi. Malzeme/işçilik bölüşümü:
malzeme = fatura gramı × $4372.40 eritme değeri, işçilik = kalan.
Maliyet üreticisi `invoice` kaydı olan kalemi atlar (çift yazım yok).

## Kapsam: yalnız EON

Tamsan **EON'un** üreticisidir; kalibrasyon Jade Gold NYC'ye ya da başka
org'a UYGULANMAZ. Seçim org-bazlı: `organizations.gold_settings.labor_model
= 'per_piece'` yalnız EON'da set edildi (canlı, 2026-08-08). Bayrağı olmayan
org'lar eski gram-başına alım modelinde kalır. Geçmiş düzeltmesindeki 9 kalem
de tamamı EON satışıydı — Jade verisine dokunulmadı.

## Bakım

- Yeni fatura geldiğinde: kalemleri satışla eşleştirip `source='invoice'`
  maliyet olarak gir (otomatik tahminin üstüne yazılır); birikince işçilik
  sabitlerini yeniden medyanla ($54/$74 güncellenebilir).
- Spot değiştiğinde malzeme payı kendiliğinden doğru — işçilik sabitleri
  spottan bağımsız.
