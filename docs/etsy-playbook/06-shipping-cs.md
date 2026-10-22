# 06 Kargo, üretim süresi, paket/sigorta, iade, müşteri hizmeti, case, Star Seller
Kaynak: `source/06-*.txt` (M6), okuma 2026-10-22. Kapsam: ABD atölyesi, ABD içi gönderim.

## Süre ve sözleşme
- Tahmini teslim = 5-7 üretim + 3-5 transit = 8-12 iş günü; dürüst ayarla, 30 günlük case penceresi ondan sayılır; teslimden 7 gün sonra "geç" [M6 S1, S2 2026-04-07].
- Ship-by mağazanın ABD saat diliminde gün sonu (İstanbul değil) [M6 S15 3. taraf]. Sevk tarihi Messages'ta anlaşmayla değişmez, yalnız Etsy aracıyla [M6 S3 2026-07-09]. 5 günlük ileri tabloda >40 yüzük varsa üretim süresini uzat (mağaza kuralı).
- Her sipariş Etsy etiketiyle (shipped işareti + Purchase Protection takip şartı) [M6 S4 2026-10-13]. Kullanılmayan etiket iadesi USPS 10 / FedEx 10 / UPS 14 gün.

## Paket ve sigorta (altın)
- Shipsurance tam değer, ≤$5.000/paket, $0,80/$100; üstü USPS Registered Mail (≤$50K, gişe) ya da özel sigortacı [M6 S5, S17, S18].
- Düz dış kutu, marka/"jewelry" yazısı yok (markalı kutu Shipsurance'ı geçersiz kılar); $500 üstü dolgulu zarf yok; H-bant + mühür bandı [M6 S16, S22].
- İmza: $250 üstü Signature ($4,15), $1.000+ Adult Signature ($9,70); Etsy şart koşmaz ama sigortacı şart koşup atlanırsa hasar reddedilir (mağaza kuralı) [M6 §2.7].
- UPS yazılı sözleşmesiz altın yok; FedEx mücevher beyan değeri ≤$1.000, sigorta yok [M6 S19-S22].
- Kargo maliyeti = taşıyıcı ücreti(bölge, ağırlık) + imza + 0,80 × ceil(değer/100). Örnek: z4 $400 ≈ $18,15; z8 $1.200 ≈ $29,82.

## İade (made-to-order)
- Düz bant 14 gün iade; gravürlü/özel iade yok, bir ücretsiz beden değişimi. Shop Policy'nin HER alanı dolu olmalı, yoksa Purchase Protection kaybolur [M6 S3].

## Müşteri hizmeti ve case
- Help with Order 48 saat içinde yanıt (yoksa case açılabilir); Etsy bilgi talebi 2 takvim günü [M6 S3, S37].
- Yalnız Etsy siparişindeki adrese gönder; başka adres → iptal, iade, yeniden sipariş [M6 S3].
- Sigorta talebini iptal/iadeden ÖNCE aç; kayıp: 20 gün bekle, sevkten 120 gün içinde; gizli hasar 15 gün [M6 S5, S16].
- Purchase Protection en çok $250 (2026-05-07'den beri $250 üstü siparişte de); hasar case'i yılda ilk biri; "tarif edildiği gibi değil" kapsam dışı [M6 S1 2026-05-07].
- Chargeback case'i kapatır; Etsy kanıt talebine aynı gün; kanıt paketi 13 ay saklanır [M6 S36].
- Star Seller (3 ay): ilk mesajların %95'i 24 saatte (otomatik yanıt sayılır), %95 zamanında takipli sevk, puan ≥4,8, ≥5 sipariş [M6 S35 3. taraf]; case: <300 siparişte ≤3 iadeli case [M6 S40].

## Mesaj şablonları (M6 §7, metinler `source/06`)
Sipariş onayı · prova onayı · gecikme (ship-by'dan önce) · gönderildi · takip durdu (48 saat) · teslim sonrası · siparişim nerede · teslim edildi ama gelmedi · beden değişimi · düz bant iadesi · iptal · adres değişikliği (dolandırıcılık güvenli). Yorum yanıtında alıcı adı yok.

## Panelde açık çelişkiler/boşluklar (2026-10-22)
- Geç sevk, ship-by'ı geçmiş sipariş, yanıtsız mesaj uyarısı yok (`lib/db/queries/alerts.ts`); `lib/etsy/types.ts` receipt'te `expected_ship_date` yok.
- Fiyat motorlarında kargo sabit: EON $22 + $8 paket (`lib/pricing-engine/eon-cost.ts:119`, `scripts/eon/gen_*`), Jade $5 (`lib/jade/pricing.ts:26`); sigorta + imza değere göre büyüyor.
- EON üreteçleri "Allow 4 to 5 business days" yazıyor (ör. `scripts/eon/gen_willow_package.mjs:244`); temel 5-7. Canlı readiness state doğrulanmalı.
- `lib/star-seller.ts` ≥5 sipariş şartını kontrol etmiyor. Mesaj şablonu modülü ve case/chargeback akışı yok.
