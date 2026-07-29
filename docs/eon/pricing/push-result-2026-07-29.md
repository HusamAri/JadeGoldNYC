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

- `0121_pricing_engine_seed_20260728.sql` canlıya uygulanacak (ayna 150 v2 satırında;
  migration v2 kalıntısını temizleyip 858 v3 satırını kurar).
- Görev #30: listing metinleri 1.5mm → 2.0mm.
- Görev #31: sıfır-varyant mutabakatı.
- `organizations.feature_flags.opsEonPricePush` anahtarı temizlenebilir (rota silindi;
  anahtar artık atıl).
