# EON Cyber 2026 rekabet fiyat planı (2026-11-15)

Kapsam: yalnız EON (sahip talimatı: "the prices must be competitive do it only in eon",
"competitive with other shops listings yet stay profitable"). Cyber Specials 23 Kas - 1 Ara,
mağaza geneli %25.

## Sahip kararları (2026-11-15)

1. **Kesinti:** piyasa medyanının üstündeki offering'ler piyasaya doğru indirilir, ama her
   kesinti **en fazla %15** ve **asla kâr tabanının altına değil**.
2. **Yükseltme:** yalnız **her satışta zarar eden** offering'ler (bugünkü altınla, Offsite
   olmadan bile negatif katkı) kâr tabanına çıkarılır. Tabanın altında kalan ama organik
   satışta kâr eden offering'lere Cyber öncesi dokunulmaz (üstü çizili fiyat kuralı,
   `docs/etsy-playbook/02-pricing.md`).

## Maliyet ve taban

- Landed (variant başına): metal = (gram + döküm firesi) × spot/31,1035 × saflık × kaynak payı
  (v4: fire 1,07; aileler: metadata `castingWasteGrams` vars. 1 g, `sourcingAllowance` vars.
  1,08) + işçilik + $30 paket/kargo. İşçilik = max(eski taban $38 / el işi $74, metadata
  `laborUsd`, $100, gram × $21 standart / $23 dekorlu / $27 el işi ve sınıfsız)
  (`lib/pricing-engine/eon-labor-reserve.ts`); iki ton ≥ $250; lab-grown gram × $100 + taş + $30.
  Gram yoksa genişlik × (0,627 + 0,0377 × beden) × yoğunluk (10K 0,892 / 18K 1,137) × 1,15.
- Saflık 10K 0,417 / 14K 0,583 / 18K 0,75. WS/MG SKU'larında beden `S08..S32` = US 4..16 (S/2).
- Ücret: %9,8 (6,5 işlem + 3 ödeme + vergi üstü ödeme) + $0,45.
- **Taban (liste):** alıcı fiyatı B = 0,75 × liste;
  B ≥ max((L+0,45)/0,802 [%10 katkı], en kötü Offsite başa baş). En kötü Offsite %15, tavan
  $100: B ≤ $666,67 ise (L+0,45)/0,752, değilse (L+100,45)/0,902. Liste tabanı = ceil(B/0,75)
  tam dolar. **Taban stres spotla kurulur: $4.160** (canlı $3.887,60 + %7).
- Offsite oranı: EON 365 günlük satışı $10k'yı 2026-09-02'de geçti, ama 2026-09-08 siparişi
  ($730, indirim yok) $100 Offsite ücreti aldı: %12 olsaydı $87,60 olurdu. Bu yüzden en kötü
  durum %15'te bırakıldı; %12 kanıtlanınca taban $833 altındaki fiyatlarda ~%4 iner.
- "Her satışta zarar" testi canlı spotla ($3.887,60), Offsite'sız organik katkı < 0.

## Piyasa

- 40 Etsy araması (karat × genişlik × stil), 339 rakip listing sayfası (Etsy 403 verdiği için
  çeviri vekili: `www-etsy-com.translate.goog/listing/<id>/x?_x_tr_sl=tr&_x_tr_tl=en`),
  JSON-LD + varyasyon seçicileri. Katkısal eksen modeli: p(k, w, US9) = taban + Δkarat +
  Δgenişlik + Δbeden9. Som altın olmayan ve 0,8 × eritme altındakiler elendi.
- Medyan alıcı fiyatı (US9) stil × karat × genişlik kovasında; milgrain/hammered verisi
  olmayan kovada düz × 1,10, satin'de düz medyan. Desen, Greek verisiz kova, lab ve 9-12 mm
  için piyasa yok: bunlar yalnız "her satışta zarar" kuralına tabidir.
- Grup kuralı (listing × karat × genişlik): f = medyan / (0,75 × US9 canlı fiyat); kesinti
  hedefi = max(ceil5(canlı × f), taban), sonra kesinti ≤ %15 (ceil5(0,85 × canlı)), %2'den
  küçük değişiklik yazılmaz. Rekabet için fiyat asla yükseltilmez.

## Kapsam dışı (araç güvenle yazamaz)

- **QS26 dört yüzük** (4561536929, 4561537155, 4561558836, 4561605534): Etsy SKU'ları
  (`EON-QS26-I06-ROSEGOLD-US3`) paneldekinden (`EON-QS26-I06-RG-S030`) farklı, price-sync
  eşleştiremez. Mevcut fiyatta kalır.
- **SKU çakışması:** Greek 4556710904 / 4556711842 / 4556711954'ün 100'er offering'i panelde
  satin 4554014095 / 4554017181 / 4554017323'e ait SKU'ları taşıyor (aynı SKU iki Etsy
  listing'inde). Greek'e mirror koşmak satırları satin'den koparırdı; Greek plana göre zaten
  değişmiyor, mirror'a alınmadı. Gece senkronu sahipliği çevirebilir: push'tan hemen önce
  sahiplik yeniden doğrulanır.
- Paneldeki hayalet satırlar: LAURX üç listing'de Etsy yalnız 07-08 mm taşıyor; CRGRN üç
  listing'de Etsy'de yalnız US 13 (18 offering) var (kontrol edilmeli); `active=false` satırlar.

## Uygulama zinciri

1. `ops/price-sync ?mirror=1` (PR #509) ile 117 listing'de panel aynası Etsy'den tazelenir,
   sabah okumasının listing mühürleriyle (`md5(sku|cent)`, C sırası) doğrulanır.
2. Plan üç parçada SQL'de hesaplanır; ön mühür (sku|canlı) ve son mühür (sku|yeni) alınır,
   UPDATE yalnız ön mühür tutarsa yazar (CAS), sonra panel mührü = son mühür.
3. price-sync kuru koşu: listing başına `offeringFarki` = plandaki değişen sayı; kanarya;
   partiler; taze token'la bağımsız geri okuma (hepsi `unchanged`).

## Sonuç

(uygulamadan sonra doldurulur: sayılar, mühürler, audit satırları)

## Sahip için Cyber runbook (Shop Manager, API yok)

- **22 Kasım:** kalıcı %25 indirimi bitir (Marketing > Sales and discounts).
- **23 Kasım - 1 Aralık:** Etsy etkinlik kartından Cyber Specials %25 sale'i kur. Teklifler
  yığılmaz; kalıcı indirim açıkken Cyber kartı yeni sale ister.
- **2 Aralık:** kalıcı %25 indirimi yeniden kur.
- Cyber öncesi liste fiyatı yükseltme yok (bu plan yalnız her satışta zarar eden 375
  offering'i tabana çekti). %25'ten derin kupon/teklif kesintiye uğrayan offering'lerde
  tabanın altına iner.
