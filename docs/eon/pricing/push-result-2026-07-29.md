# EON fiyat itişi — SONUÇ (2026-07-29 04:46 UTC)

**Görev #29 kapandı.** v3 grid (`spot 4090`, sha `7245e98006a2…`) canlı Etsy'ye basıldı.

## Net durum

- **26 listing / 7.150 varyant** Etsy'de v3 ETSY LISTE fiyatlarında (yarım bedenler
  onaylı enterpolasyonla, 3.432 hücre). GAP: 0. Panel varyantları eşitlendi (7.150/0 hata).
- **3 sıfır-varyantlı listing atlandı** (4543000739, 4540106368, 4543427531) — mutabakat
  ayrı iş (görev #31).
- Rota kalıcı kapalı (410, `opsEonPricePush.done=true`); kod bu commit'le kaldırıldı.
- Kayıt: `audit_log` → `etsy.reprice`, source `route:ops/eon-price-push` (3 satır, aşağıda).

## Koşum notu — yarışan üç POST

Onay butonu 4 sn içinde 3 kez tetiklenmiş (çift dokunma/çoklu sekme + her GET'in taze
confirm üretmesi). Tek-kullanımlık confirm tüketimi read-modify-write olduğundan atomik
DEĞİLDİ; üç POST eşzamanlı koştu:

| Bitiş (UTC) | Güncellenen | Zaten hedefte | Hata |
|---|---|---|---|
| 04:46:05 | 3 | 22 | 1 |
| 04:46:08 | **26** | 0 | **0** |
| 04:46:09 | 5 | 21 | 0 |

Üçü de AYNI hedef fiyatları yazdığı için sonuç deterministik ve doğru (son durum üçüncü
koşumda "21 zaten hedefte" ile doğrulandı). Ders: tek-kullanımlık onay, koşullu UPDATE
(compare-and-swap, `where confirm = $1 returning`) ile tüketilmeli; gelecekte benzer
rota kurulursa buton da submit'te disable edilmeli.

## Açık kalanlar

- ~~`0121` canlıya uygulanacak~~ **TAMAM (2026-07-29):** v2 kalıntısı (150 satır) silindi,
  v3 aynası MCP ile kuruldu — `pricing_engine_import` `c157eb8e…` + **858 satır**, 6 blok
  (3 karat × standard/milgrain), hepsi KONTROL OK. `0121` migration'ı artık no-op
  (NOT EXISTS korumalı) ve preview provizyonunun kaydı olarak duruyor.
- Görev #30: listing metinleri 1.5mm → 2.0mm.
- Görev #31: sıfır-varyant mutabakatı.
- ~~`opsEonPricePush` anahtarı temizlenecek~~ **TAMAM (2026-07-29):** silindi;
  `feature_flags` yalnız `externalPricing/keywordResearch/buyerFollowup` taşıyor
  (`externalPricing` AÇIK kalmaya devam ediyor).

## Ayna doğrulaması (2026-07-29)

MCP yazımında transkripsiyon riskini kesmek için: grid tam kartezyen olduğundan
(3 karat × 2 profil × 11 genişlik × 13 beden = 858) **anahtarlar SQL'de üretildi**,
yalnız sayılar taşındı (~22KB, 4 parça); `engine/list/sale` 858 satırda birebir
doğrulanmış formüllerle SQL'de türetildi, `floor/offsite` açık gönderildi (7 ve 78
satırda kenar sapması var, türetilemez). Doğrulama üç katmanlı ve hepsi tuttu:
parça byte uzunlukları · 7 kolon toplamı · **konum-ağırlıklı** toplamlar (satır
kaymasını yakalar) · altın satırlar (10K 5mm US7 = 580/775, 14K 6mm US7 = 1022/1365).
