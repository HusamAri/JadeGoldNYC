# EON v4 fiyat düzeltme itişi — SONUÇ (2026-07-30)

**Başarıyla tamamlandı.** Rota (`/api/ops/eon-price-push`) kalıcı 410'a geçti ve
bu PR ile kod tabanından söküldü (v3 turundaki emeklilik deseni: PR #293).

## Koşum

| | |
|---|---|
| Zaman | 2026-07-30 07:05:07 UTC |
| Grid | `2026-07-29-eon-etsy-giris-grid-spot4090-v4.xlsx` (sha256 `f198fc27…`) |
| Kalınlık | **1.5mm** (tedarikçi teyitli; v3/2.0mm geçersiz) |
| Çarpan | 2–7mm × 1,55 · 8–12mm × 2,00 (bilinçli mens-wide primi) |
| Kapsam | **28/31 listing güncellendi** (3 sıfır-varyant listing atlandı — görev #31) |
| Varyant | **7.700 hedeflendi, 7.700 değişti** (0 unchanged, 3.696 yarım-beden enterpolasyonlu) |
| GAP | 0 (haritalanamayan SKU yok) |
| Hata | 0 |
| Panel eşitleme | 7.700 varyant `price_cents` güncellendi; örneklem birebir (60000 / 61000 / 194500) |
| Audit | `audit_log` action=`etsy.reprice`, source=`route:ops/eon-price-push`, diff'te sha + thickness |

## Eşzamanlılık kilidi KANITLANDI

v3 turunda 3 eşzamanlı POST yarışmıştı (read-modify-write confirm tüketimi).
Bu turda onay tüketimi **atomik compare-and-swap** (koşullu UPDATE, yalnız
`feature_flags`'teki confirm hâlâ eşitse geçer) + submit'te buton disable idi.
Sonuç: audit'te **tek** `etsy.reprice` satırı — çift koşum yok.

## Fiyat etkisi (ölçülmüş, v3 canlı fiyatları baz)

- Genişlik 2–7mm: min −%35,8 · ort −%24,6 · max −%15,1
- Genişlik 8–12mm: min −%17,8 · ort −%4,2 · max −%0,8
- Artan hücre: **0/858**

## Kalanlar

- Görev #31: 3 sıfır-varyant listing (4543000739, 4540106368, 4543427531) mutabakatı.
- Fiyat aynası (`pricing_engine_import`): v3 içe aktarımı güncel görünüyor —
  v4 ile tazelenecek (importer artık v4 uyumlu: split çarpan etiketi + v4 altın satırları).
- `opsEonPricePushV4` bayrak anahtarı rota sökümüyle birlikte temizlendi.
