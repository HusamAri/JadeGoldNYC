# 05 Etsy Ads, Offsite Ads, dış trafik
Kaynak: `source/05-*.txt` (M5), okuma 2026-10-22.

## Formüller
- C (reklam öncesi katkı) = P − P·F − 0,45 − COGS; F = 0,095 (6,5 işlem + 3 ödeme); 0,45 = 0,25 + 0,20 yenileme. m = C/P.
- **Başa baş ROAS = 1/m**; hedef ROAS = 1/(m·(1−k)), k = reklam sonrası tutulmak istenen katkı payı.
- Max CPA = C; hedef CPA = C·(1−k); max CPC = hedef CPA × CVR.
- Düzeltilmiş ROAS = raporlanan × i, i ≈ 0,6-0,8 (varsayım): Etsy tıklamadan sonraki 30 gün içindeki mağaza siparişini reklama yazar [M5 S14].
- Offsite ücreti = min(r × sipariş, $100); tavan $666,67 (15%) / $833,33 (12%) üstünde bağlar. Kargo ücret tabanına dahil sayılır [M5 S26 3. taraf].
- Örnek: $400 yüzük C $163,40, başa baş ROAS 2,45; $1.200 yüzükte 3,19.

## Kurallar
- Değişikliğe 30 gün ver, listing başına tek değişken [M5 S24 2026-06-01]. $400 üstü listing'i $30/10 tıkla yargılama; harcama Max CPA'ya varınca yargıla [M5 §7.4].
- Durdur: harcama ≥ Max CPA ve 0 reklam + 0 organik sipariş; ya da 30 VE 60 günlük ROAS başa başın altında; ya da 30 gün CTR mağaza ortalamasının çok altında; ya da arama terimleri alakasız ("plated", "vermeil", "sterling"). Diğer listing'lere sipariş getiren hero'yu ve sezondan 3-6 hafta önceki listing'i durdurma [M5 §7.5].
- Shop Stats'tan ROAS hesaplama (uygulama tıklamaları başka satırda) [M5 S25]. Ölçek: düzeltilmiş ROAS 30 gün hedefin üstündeyse +%20-30 [M5 S29 3. taraf].
- Bütçe: min $1/gün, başlangıç tavanı $25/gün, haftalık yeniden hesaplanır; yeni mağaza 15 gün bekler; listing stratejileri ≥$25/gün ister, altında hepsi Efficient spending [M5 S16, S5]. Ekimden itibaren bütçeyi doldur ki Q4 tavanı büyüsün; Ocak'ta açık tut (nişan sezonu). Etsy faturası ödenmezse tavan düşer.
- Reklam grupları en çok 20, listing tek grupta; fiyat bandı test hücresi: $150-300 / $300-700 / $700+ [M5 S12 2026-09].
- Offsite: 365 günde <$10K → %15, kapatılabilir (uygulama ≤3 iş günü); ≥$10K → %12, ömür boyu zorunlu; tavan $100/sipariş; 30 gün atıf [M5 S28 2026-10-22]. $10K'yı geçmeden karar ver: her listing min(%15, $100) sonrası pozitif kalmıyorsa fiyatla ya da kapat.
- Google Partner Checkout varyasyonlu/kişiselleştirmeli listing'i almaz [M5 S28].
- Share & Save linki yalnız kendi kanallarda (%4, ilk 2 hafta %6,5; 30 gün); Etsy marka anahtar kelimesine teklif verme; aynı pencerede Offsite tıklaması krediyi iptal eder [M5 S33 2026-08-03]. Influencer anlaşmasında FTC beyanı yazılı ("Gifted" tek başına yetmez) [M5 S44 2025-07-15].

## Haftalık kontrol
7/30 gün görüntülenme, tık, CTR, sipariş, gelir, harcama; düzeltilmiş ROAS vs hedef; harcamaya göre sırala (Max CPA aştı + 0 sipariş → durdur); en çok harcayan 5'in arama terimleri; Offsite: tavana takılan sipariş sayısı, $10K'ya mesafe; ücretli trafik ≥%80 ise fazla bağımlılık; her değişiklik günlüğe; son 30 günde değişene dokunma.

## Panelde açık çelişkiler (2026-10-22)
- `lib/ads/meta.ts:59,61` sabit ROAS eşikleri 1,5 / 3; `lib/performance.ts:11` `roasTarget: 3`. Kural: listing başına başa baş = 1/m (altın parçada ~2,45-4).
- `lib/db/queries/alerts.ts:562` `ads_wasted`: herhangi harcama + 0 gelir → "durdur". Kural: harcama ≥ Max CPA olmadan yargılama.
- `lib/ads/meta.ts:157` "7-14 gün veri"; Etsy 30 gün diyor.
- `lib/pricing-engine/eon-cost.ts:235,242` Offsite tabanı ÷0,745, $100 tavanı yok ($667 üstünde tabanı şişirir); `:467,502` doğru (min).
- `supabase/migrations/0097_operating_profit.sql:29` Offsite ücreti sabit gider sayılıyor; değişken gider olmalı.
