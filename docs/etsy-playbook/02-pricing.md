# 02 Fiyatlama, birim ekonomi, indirim, altın, nakit
Kaynak: `source/02-*.txt` (M2), okuma 2026-10-22.

## Formüller
- F (sabit landed) = metal (fire dahil) + işçilik + bitiş + taş + paket + sertifika + etiket + imza + sigorta yuvarlaması + $0,45 + yeniden yapım payı.
- v (fiyata oranlı) = 0,065 + 0,03 + 0,03·vergi_oranı + 0,008 sigorta + reklam payı + indirim payı + iade payı; örnek taban **%10,54** (vergi %8 varsayımıyla).
- **P = F / (1 − v − m)**; başa baş P_BE = F / (1 − v); net = P(1−v) − F.
- Metal = gram × saflık × (spot / 31,1035) × (1 + fire); saflık 14K 0,585 (damga 583,3), 18K 0,750; fire %5 (varsayım).
- Altın duyarlılığı: ΔP = Δmetal × (işçilik metale bağlıysa 1,2, sabitse 1,0) / (1 − v − m).
- Offsite: min(r·P, $100) (r 0,15 / 0,12); tavan $667 (15%) / $834 (12%) üstünde bağlar.
- Azami indirim = (P(1 − v_indirimsiz) − F − asgari_kâr) / P; etkinlikte net = indirimli fiyat × (1 − v_indirimsiz) − F.
- Örnek: 3 g 14K bant F $359,58, P $557,83, P_BE $452,53; 4 g 18K bant F $563,96, P $874,90.

## Kurallar
- Ücret tabanı §01: %9,5 + $0,45 + vergi üstü %3; ROF ve kur dönüşümü formüle konmaz.
- Fiyat en kötü Offsite'ta (min(%15, $100)) pozitif katkıda kalmalı.
- **Sürekli sahte indirim yok:** üstü çizili fiyat gerçek, makul süre ve miktarda satılmış fiyat; çoğu zaman indirimdeyse indirimli fiyat gerçek fiyattır [Seller Handbook 2026-01-12]. İndirim payı v'nin içinde planlanır.
- **Cyber Specials 2026: 23 Kas-1 Ara, katılım için son gün 27 Eki 2026, en az %25 indirim**; yalnız liste fiyatı ≥ 1,33 × yalın taban olan SKU'larla [S34 2026].
  - Sahip kararı 2026-10-22: EON ve by Artifact Studio Cyber'e katılır, %25. Katılım yalnız Shop Manager > Marketing > Sales and discounts > Etsy etkinlik kartı (API yok). Teklifler yığılmaz: açık kalıcı indirim (EON %25, Artifact %30) varsa Cyber kartı yeni bir sale ister; kalıcıyı 22 Kas'ta bitir, Cyber sale'i kur, 2 Ara'da kalıcıyı yeniden kur. %30 kalıcı indirimi olan mağaza Cyber'de %25'e inerse alıcı için fiyat YÜKSELİR; orada Cyber oranı ≥ kalıcı oran olmalı. Fiyat yükseltilmez (üstü çizili fiyat kuralı).
- İndirim sabit kısımdan yapılır, altından değil; yüksek fiyatlıda sabit dolar teklif tercih; indirimler üst üste binmez (ücretsiz kargo promosyonu hariç).
- Altın repricing: 5 günlük ortalama spot ±%7 bandı; yukarı hızlı (48 saat), aşağı yavaş (~10 işlem günü bant altında); indirimden hemen önce fiyat düşürülmez [S21 3. taraf 2026].
- İşçilik parça başı USD pazarlık edilir, altının yüzdesi değil; %20 işçilik yer tutucusuyla canlı fiyat yok.
- Metal payı fiyatın >%45'i ise repricing'e yakın. Altın tamponu ~2 haftalık metal maliyeti; atölye siparişten 24-48 saatte metal alır/kilitler.
- Yıllık indirim bütçesi GMS'nin %5-8'i (yer tutucu): Cyber/Q4 ~%50, hedefli teklifler ~%30, teşekkür/tekrar.

## Aylık 60-90 dk kontrol
Altın vs fiyat varsayımı (±%7) · CSV + Alura · mevduat mutabakatı · ilk 10 listing marj şelalesi, <%10 net sipariş işareti · indirim ROI · ROAS vs başa baş · nakit/rezerv · politika takibi · karar günlüğü.

## Panelde açık çelişkiler (2026-10-22)
- **Kalıcı mağaza indirimi:** `lib/pricing-engine/eon-cost.ts:126` `EON_SALE_RATE = 0.75`, `lib/jade/pricing.ts:62` `JADE_DISCOUNT_RATE = 0.30`. Sürekli indirim kuralıyla çelişiyor; ve Cyber Specials'a girmek için mevcut indirimin bitirilip yeniden kurulması gerekiyor. Sahip kararı.
- `lib/jade/pricing.ts:68` `JADE_ETSY_FIXED_CENTS = 25` (doğrusu 45; aynısı `docs/jade/xmas26/catalog.py:35`, `scripts/jade-gram-numbers.py:49`). `scripts/jade-gram-numbers.py` 0,15/0,20 ile bayat (pricing.ts 0,30/0,25).
- `eon-cost.ts:235` `FLOOR_NET_RATE_OFFSITE = 0.745` ve `scripts/eon_pricing_engine.py` Offsite'ı $100 tavansız %15 alıyor; `eon-cost.ts:467,502` tavanlı (doğru); ikisi aynı dosyada tutarsız. `eon-cost.ts:228` yorumu 0,45'i "processing" diyor (0,25 + 0,20 yenileme).
- Artifact Studio katalog kontrolleri (`docs/artifact-studio/{winter27,moth,twig,evil-eye}/catalog.py`) `0,70 × 0,905` kullanıyor, $0,45 ve Offsite yok; Offsite kapalı değilse eksik. Ophir katalogları (`docs/ophir/*/catalog.py`) düz %15, sabit ücret yok.
- `lib/jade/pricing.ts:26` kargo $5, imza/sigorta yok ($250 üstü kuralına aykırı). EON $22 yeterli ama sigorta payı v'de yok.
- Saflık: `lib/pricing/gold-index.ts:51` 0,583, `lib/gold-cost.ts:11` 0,585 (%0,3 fark). Repricing `gold-index.ts:58` %1 ölü bant / %10 adım, modülün ±%7 asimetrik bandından farklı (politika seçimi).
